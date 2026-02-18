import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/constants/colors';

// Datos mock para medidas antropométricas
const mockMeasurements = {
  lastUpdate: '2024-12-01',
  weight: { value: 78.5, unit: 'kg', change: -0.8 },
  bodyFat: { value: 18.2, unit: '%', change: -0.5 },
  muscle: { value: 42.1, unit: '%', change: +0.3 },
};

const mockCircumferences = [
  { name: 'Pecho', value: 102, unit: 'cm', icon: 'body-outline' },
  { name: 'Cintura', value: 82, unit: 'cm', icon: 'body-outline' },
  { name: 'Cadera', value: 98, unit: 'cm', icon: 'body-outline' },
  { name: 'Brazo (D)', value: 36, unit: 'cm', icon: 'fitness-outline' },
  { name: 'Brazo (I)', value: 35.5, unit: 'cm', icon: 'fitness-outline' },
  { name: 'Muslo (D)', value: 58, unit: 'cm', icon: 'walk-outline' },
  { name: 'Muslo (I)', value: 57.5, unit: 'cm', icon: 'walk-outline' },
  { name: 'Pantorrilla', value: 38, unit: 'cm', icon: 'walk-outline' },
];

export default function MeasurementsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Medidas</Text>
        <Text style={styles.subtitle}>Control antropométrico</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Stats */}
        <View style={styles.mainStatsContainer}>
          <View style={[styles.mainStatCard, styles.weightCard]}>
            <Ionicons name="scale-outline" size={24} color={colors.primary[500]} />
            <Text style={styles.mainStatValue}>{mockMeasurements.weight.value}</Text>
            <Text style={styles.mainStatUnit}>{mockMeasurements.weight.unit}</Text>
            <View style={styles.changeContainer}>
              <Ionicons
                name={mockMeasurements.weight.change < 0 ? 'arrow-down' : 'arrow-up'}
                size={12}
                color={mockMeasurements.weight.change < 0 ? colors.success : colors.warning}
              />
              <Text style={[
                styles.changeText,
                { color: mockMeasurements.weight.change < 0 ? colors.success : colors.warning }
              ]}>
                {Math.abs(mockMeasurements.weight.change)} kg
              </Text>
            </View>
          </View>

          <View style={styles.secondaryStats}>
            <View style={styles.secondaryStatCard}>
              <Text style={styles.secondaryStatLabel}>Grasa corporal</Text>
              <Text style={styles.secondaryStatValue}>
                {mockMeasurements.bodyFat.value}
                <Text style={styles.secondaryStatUnit}>%</Text>
              </Text>
              <View style={styles.changeContainerSmall}>
                <Ionicons
                  name="arrow-down"
                  size={10}
                  color={colors.success}
                />
                <Text style={[styles.changeTextSmall, { color: colors.success }]}>
                  {Math.abs(mockMeasurements.bodyFat.change)}%
                </Text>
              </View>
            </View>

            <View style={styles.secondaryStatCard}>
              <Text style={styles.secondaryStatLabel}>Masa muscular</Text>
              <Text style={styles.secondaryStatValue}>
                {mockMeasurements.muscle.value}
                <Text style={styles.secondaryStatUnit}>%</Text>
              </Text>
              <View style={styles.changeContainerSmall}>
                <Ionicons
                  name="arrow-up"
                  size={10}
                  color={colors.success}
                />
                <Text style={[styles.changeTextSmall, { color: colors.success }]}>
                  {mockMeasurements.muscle.change}%
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Last Update */}
        <Text style={styles.lastUpdate}>
          Última actualización: {new Date(mockMeasurements.lastUpdate).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Text>

        {/* Circumferences */}
        <Text style={styles.sectionTitle}>Circunferencias</Text>

        <View style={styles.circumferencesGrid}>
          {mockCircumferences.map((item, index) => (
            <View key={index} style={styles.circumferenceCard}>
              <Ionicons name={item.icon as any} size={18} color={colors.gray[400]} />
              <Text style={styles.circumferenceName}>{item.name}</Text>
              <Text style={styles.circumferenceValue}>
                {item.value}
                <Text style={styles.circumferenceUnit}> {item.unit}</Text>
              </Text>
            </View>
          ))}
        </View>

        {/* Add Measurement Button Placeholder */}
        <View style={styles.addButtonPlaceholder}>
          <Ionicons name="add-circle-outline" size={24} color={colors.primary[400]} />
          <Text style={styles.addButtonText}>Registrar nuevas medidas</Text>
        </View>

        {/* Placeholder message */}
        <View style={styles.placeholderContainer}>
          <Ionicons name="construct-outline" size={40} color={colors.gray[300]} />
          <Text style={styles.placeholderText}>
            Gráficos de evolución próximamente
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl + 60,
  },
  mainStatsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  mainStatCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  weightCard: {
    flex: 1.2,
  },
  mainStatValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginTop: spacing.sm,
  },
  mainStatUnit: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: 2,
  },
  changeText: {
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  secondaryStats: {
    flex: 1,
    gap: spacing.sm,
  },
  secondaryStatCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  secondaryStatLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  secondaryStatValue: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginTop: 2,
  },
  secondaryStatUnit: {
    fontSize: fontSize.sm,
    fontWeight: 'normal',
    color: colors.gray[500],
  },
  changeContainerSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 2,
  },
  changeTextSmall: {
    fontSize: 10,
    fontWeight: '500',
  },
  lastUpdate: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: spacing.md,
  },
  circumferencesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  circumferenceCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  circumferenceName: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  circumferenceValue: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.gray[800],
    marginTop: 2,
  },
  circumferenceUnit: {
    fontSize: fontSize.xs,
    fontWeight: 'normal',
    color: colors.gray[400],
  },
  addButtonPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary[200],
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.primary[600],
  },
  placeholderContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginTop: spacing.md,
  },
  placeholderText: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    marginTop: spacing.sm,
  },
});
