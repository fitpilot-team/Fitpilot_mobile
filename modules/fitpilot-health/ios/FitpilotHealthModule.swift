import ExpoModulesCore
import HealthKit
import UIKit

private struct QuantityMetric {
  let permission: String
  let type: HKQuantityType
  let unit: HKUnit
  let summaryKey: String?
  let recordType: String
  let option: HKStatisticsOptions
}

public class FitpilotHealthModule: Module {
  private let healthStore = HKHealthStore()

  public func definition() -> ModuleDefinition {
    Name("FitpilotHealth")

    AsyncFunction("isAvailable") { () -> [String: Any] in
      [
        "available": HKHealthStore.isHealthDataAvailable(),
        "platform": "healthkit",
        "status": HKHealthStore.isHealthDataAvailable() ? "available" : "unavailable",
      ]
    }

    AsyncFunction("requestPermissions") { () async throws -> [String: Any] in
      guard HKHealthStore.isHealthDataAvailable() else {
        return self.permissionStatus(granted: [], requiresManualGrant: false)
      }

      try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
        self.healthStore.requestAuthorization(toShare: [], read: self.readTypes()) { success, error in
          if let error {
            continuation.resume(throwing: error)
            return
          }
          if success {
            continuation.resume()
          } else {
            continuation.resume(throwing: NSError(
              domain: "FitpilotHealth",
              code: 1,
              userInfo: [NSLocalizedDescriptionKey: "HealthKit authorization was not completed."]
            ))
          }
        }
      }

      // iOS intentionally does not reveal read permission decisions per type.
      return self.permissionStatus(granted: self.permissionNames(), requiresManualGrant: false)
    }

    AsyncFunction("getGrantedPermissions") { () -> [String: Any] in
      // HealthKit read permissions are privacy-preserving; a denied read returns no samples.
      self.permissionStatus(granted: self.permissionNames(), requiresManualGrant: false)
    }

    AsyncFunction("syncRange") { (range: [String: String]) async throws -> [String: Any] in
      guard HKHealthStore.isHealthDataAvailable() else {
        throw NSError(
          domain: "FitpilotHealth",
          code: 2,
          userInfo: [NSLocalizedDescriptionKey: "HealthKit is not available on this device."]
        )
      }
      guard
        let startInput = range["startAt"],
        let endInput = range["endAt"],
        let startAt = ISO8601DateFormatter.fitpilot.date(from: startInput),
        let endAt = ISO8601DateFormatter.fitpilot.date(from: endInput)
      else {
        throw NSError(
          domain: "FitpilotHealth",
          code: 3,
          userInfo: [NSLocalizedDescriptionKey: "syncRange requires valid startAt and endAt ISO strings."]
        )
      }

      let quantitySummaries = try await self.queryDailyQuantitySummaries(startAt: startAt, endAt: endAt)
      let sleepRecords = try await self.querySleepRecords(startAt: startAt, endAt: endAt)
      let workoutRecords = try await self.queryWorkoutRecords(startAt: startAt, endAt: endAt)
      let bodyRecords = try await self.queryBodyRecords(startAt: startAt, endAt: endAt)
      let summaries = self.mergeSummaries(quantitySummaries, records: sleepRecords + workoutRecords)

      return [
        "platform": "healthkit",
        "from_at": ISO8601DateFormatter.fitpilot.string(from: startAt),
        "to_at": ISO8601DateFormatter.fitpilot.string(from: endAt),
        "permissions": self.permissionNames(),
        "records": sleepRecords + workoutRecords + bodyRecords,
        "daily_summaries": summaries,
        "metadata": [
          "sync_granularity": "daily",
          "read_mode": "foreground",
        ],
      ]
    }

    AsyncFunction("openSettings") { () -> Void in
      if let url = URL(string: UIApplication.openSettingsURLString) {
        DispatchQueue.main.async {
          UIApplication.shared.open(url)
        }
      }
    }
  }

  private func permissionStatus(granted: [String], requiresManualGrant: Bool) -> [String: Any] {
    let allPermissions = permissionNames()
    let missing = allPermissions.filter { !granted.contains($0) }
    return [
      "platform": "healthkit",
      "granted": granted,
      "missing": missing,
      "requiresManualGrant": requiresManualGrant,
    ]
  }

  private func permissionNames() -> [String] {
    quantityMetrics().map(\.permission) + ["workouts", "sleep"]
  }

  private func readTypes() -> Set<HKObjectType> {
    var types = Set<HKObjectType>(quantityMetrics().map(\.type))
    if let sleep = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) {
      types.insert(sleep)
    }
    types.insert(HKObjectType.workoutType())
    return types
  }

  private func quantityMetrics() -> [QuantityMetric] {
    var metrics: [QuantityMetric] = []
    func append(
      _ identifier: HKQuantityTypeIdentifier,
      permission: String,
      unit: HKUnit,
      summaryKey: String?,
      recordType: String,
      option: HKStatisticsOptions = .cumulativeSum
    ) {
      if let type = HKObjectType.quantityType(forIdentifier: identifier) {
        metrics.append(QuantityMetric(
          permission: permission,
          type: type,
          unit: unit,
          summaryKey: summaryKey,
          recordType: recordType,
          option: option
        ))
      }
    }

    append(.activeEnergyBurned, permission: "active_energy", unit: .kilocalorie(), summaryKey: "active_energy_kcal", recordType: "active_energy")
    append(.basalEnergyBurned, permission: "basal_energy", unit: .kilocalorie(), summaryKey: "basal_energy_kcal", recordType: "basal_energy")
    append(.stepCount, permission: "steps", unit: .count(), summaryKey: "steps", recordType: "steps")
    append(.distanceWalkingRunning, permission: "distance", unit: .meter(), summaryKey: "distance_m", recordType: "distance")
    append(.appleExerciseTime, permission: "exercise_minutes", unit: .minute(), summaryKey: "exercise_minutes", recordType: "exercise_minutes")
    append(.heartRate, permission: "heart_rate", unit: HKUnit.count().unitDivided(by: .minute()), summaryKey: "avg_hr_bpm", recordType: "heart_rate", option: .discreteAverage)
    append(.restingHeartRate, permission: "resting_heart_rate", unit: HKUnit.count().unitDivided(by: .minute()), summaryKey: "resting_hr_bpm", recordType: "resting_heart_rate", option: .discreteAverage)
    append(.heartRateVariabilitySDNN, permission: "heart_rate_variability", unit: .secondUnit(with: .milli), summaryKey: "hrv_ms", recordType: "heart_rate_variability", option: .discreteAverage)
    append(.bloodGlucose, permission: "glucose", unit: HKUnit.gramUnit(with: .milli).unitDivided(by: .literUnit(with: .deci)), summaryKey: "glucose_avg_mg_dl", recordType: "glucose", option: .discreteAverage)
    append(.bloodPressureSystolic, permission: "blood_pressure_systolic", unit: .millimeterOfMercury(), summaryKey: "systolic_avg_mmhg", recordType: "blood_pressure", option: .discreteAverage)
    append(.bloodPressureDiastolic, permission: "blood_pressure_diastolic", unit: .millimeterOfMercury(), summaryKey: "diastolic_avg_mmhg", recordType: "blood_pressure", option: .discreteAverage)
    append(.bodyMass, permission: "weight", unit: .gramUnit(with: .kilo), summaryKey: nil, recordType: "weight", option: .discreteAverage)
    append(.bodyFatPercentage, permission: "body_fat", unit: .percent(), summaryKey: nil, recordType: "body_fat", option: .discreteAverage)
    append(.leanBodyMass, permission: "lean_body_mass", unit: .gramUnit(with: .kilo), summaryKey: nil, recordType: "lean_body_mass", option: .discreteAverage)
    return metrics
  }

  private func queryDailyQuantitySummaries(startAt: Date, endAt: Date) async throws -> [[String: Any]] {
    var summaries: [String: [String: Any]] = [:]
    for metric in quantityMetrics().filter({ $0.summaryKey != nil }) {
      let rows = try await queryDailyStatistics(metric: metric, startAt: startAt, endAt: endAt)
      for row in rows {
        guard let date = row["date"] as? String else { continue }
        var summary = summaries[date] ?? ["date": date, "sources": ["Apple Health"]]
        if let key = metric.summaryKey {
          summary[key] = row["value"]
        }
        summaries[date] = summary
      }
    }
    return summaries.values.sorted {
      (($0["date"] as? String) ?? "") < (($1["date"] as? String) ?? "")
    }
  }

  private func queryDailyStatistics(
    metric: QuantityMetric,
    startAt: Date,
    endAt: Date
  ) async throws -> [[String: Any]] {
    try await withCheckedThrowingContinuation { continuation in
      let calendar = Calendar(identifier: .gregorian)
      let anchor = calendar.startOfDay(for: startAt)
      let predicate = HKQuery.predicateForSamples(withStart: startAt, end: endAt, options: [.strictStartDate])
      let query = HKStatisticsCollectionQuery(
        quantityType: metric.type,
        quantitySamplePredicate: predicate,
        options: metric.option,
        anchorDate: anchor,
        intervalComponents: DateComponents(day: 1)
      )
      query.initialResultsHandler = { _, collection, error in
        if let error {
          continuation.resume(throwing: error)
          return
        }
        var rows: [[String: Any]] = []
        collection?.enumerateStatistics(from: startAt, to: endAt) { statistics, _ in
          let quantity = metric.option == .cumulativeSum
            ? statistics.sumQuantity()
            : statistics.averageQuantity()
          guard let quantity else { return }
          rows.append([
            "date": ISO8601DateFormatter.dateOnly.string(from: statistics.startDate),
            "value": quantity.doubleValue(for: metric.unit),
          ])
        }
        continuation.resume(returning: rows)
      }
      self.healthStore.execute(query)
    }
  }

  private func querySleepRecords(startAt: Date, endAt: Date) async throws -> [[String: Any]] {
    guard let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else {
      return []
    }
    let samples = try await querySamples(sampleType: sleepType, startAt: startAt, endAt: endAt) as? [HKCategorySample] ?? []
    return samples
      .filter { sample in
        if #available(iOS 16.0, *) {
          return [
            HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue,
            HKCategoryValueSleepAnalysis.asleepCore.rawValue,
            HKCategoryValueSleepAnalysis.asleepDeep.rawValue,
            HKCategoryValueSleepAnalysis.asleepREM.rawValue,
          ].contains(sample.value)
        }
        return sample.value == HKCategoryValueSleepAnalysis.asleep.rawValue
      }
      .map { sample in
        [
          "type": "sleep_session",
          "start_at": ISO8601DateFormatter.fitpilot.string(from: sample.startDate),
          "end_at": ISO8601DateFormatter.fitpilot.string(from: sample.endDate),
          "source_name": sample.sourceRevision.source.name,
          "metadata": ["healthkit_category_value": sample.value],
        ]
      }
  }

  private func queryWorkoutRecords(startAt: Date, endAt: Date) async throws -> [[String: Any]] {
    let samples = try await querySamples(sampleType: HKObjectType.workoutType(), startAt: startAt, endAt: endAt) as? [HKWorkout] ?? []
    return samples.map { workout in
      [
        "type": "workout",
        "start_at": ISO8601DateFormatter.fitpilot.string(from: workout.startDate),
        "end_at": ISO8601DateFormatter.fitpilot.string(from: workout.endDate),
        "value": workout.duration / 60.0,
        "unit": "minutes",
        "source_name": workout.sourceRevision.source.name,
        "external_id": workout.uuid.uuidString,
        "metadata": [
          "activity_type": workout.workoutActivityType.rawValue,
          "active_energy_kcal": workout.totalEnergyBurned?.doubleValue(for: .kilocalorie()) as Any,
          "distance_m": workout.totalDistance?.doubleValue(for: .meter()) as Any,
        ],
      ]
    }
  }

  private func queryBodyRecords(startAt: Date, endAt: Date) async throws -> [[String: Any]] {
    var records: [[String: Any]] = []
    for metric in quantityMetrics().filter({ $0.summaryKey == nil }) {
      let samples = try await querySamples(sampleType: metric.type, startAt: startAt, endAt: endAt) as? [HKQuantitySample] ?? []
      records.append(contentsOf: samples.map { sample in
        [
          "type": metric.recordType,
          "start_at": ISO8601DateFormatter.fitpilot.string(from: sample.startDate),
          "end_at": ISO8601DateFormatter.fitpilot.string(from: sample.endDate),
          "value": sample.quantity.doubleValue(for: metric.unit),
          "unit": metric.permission == "body_fat" ? "pct" : "kg",
          "source_name": sample.sourceRevision.source.name,
          "external_id": sample.uuid.uuidString,
        ]
      })
    }
    return records
  }

  private func querySamples(sampleType: HKSampleType, startAt: Date, endAt: Date) async throws -> [HKSample] {
    try await withCheckedThrowingContinuation { continuation in
      let predicate = HKQuery.predicateForSamples(withStart: startAt, end: endAt, options: [.strictStartDate])
      let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
      let query = HKSampleQuery(sampleType: sampleType, predicate: predicate, limit: 500, sortDescriptors: [sort]) { _, samples, error in
        if let error {
          continuation.resume(throwing: error)
          return
        }
        continuation.resume(returning: samples ?? [])
      }
      self.healthStore.execute(query)
    }
  }

  private func mergeSummaries(_ summaries: [[String: Any]], records: [[String: Any]]) -> [[String: Any]] {
    var byDate = Dictionary(uniqueKeysWithValues: summaries.compactMap { summary -> (String, [String: Any])? in
      guard let date = summary["date"] as? String else { return nil }
      return (date, summary)
    })
    for record in records {
      guard
        let start = record["start_at"] as? String,
        let startDate = ISO8601DateFormatter.fitpilot.date(from: start)
      else { continue }
      let date = ISO8601DateFormatter.dateOnly.string(from: startDate)
      var summary = byDate[date] ?? ["date": date, "sources": ["Apple Health"]]
      if record["type"] as? String == "sleep_session",
         let end = record["end_at"] as? String,
         let endDate = ISO8601DateFormatter.fitpilot.date(from: end) {
        let minutes = Int(max(0, endDate.timeIntervalSince(startDate) / 60.0))
        summary["sleep_minutes"] = (summary["sleep_minutes"] as? Int ?? 0) + minutes
      }
      if record["type"] as? String == "workout" {
        summary["exercise_minutes"] = (summary["exercise_minutes"] as? Int ?? 0) + Int(record["value"] as? Double ?? 0)
      }
      byDate[date] = summary
    }
    return byDate.values.sorted {
      (($0["date"] as? String) ?? "") < (($1["date"] as? String) ?? "")
    }
  }
}

private extension ISO8601DateFormatter {
  static let fitpilot: ISO8601DateFormatter = {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return formatter
  }()

  static let dateOnly: ISO8601DateFormatter = {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withFullDate]
    return formatter
  }()
}
