// User types
export type UserRole = 'admin' | 'trainer' | 'client';

export interface User {
  id: string;
  email: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  phoneNumber: string | null;
  isPhoneVerified: boolean;
  onboardingStatus: string | null;
  profilePictureUrl: string | null;
  professionalRoles: string[];
  currentSubscription: Record<string, unknown> | null;
  hasSubscription: boolean;
  hasActiveSubscription: boolean;
  subscriptionVigency: Record<string, unknown> | null;
}

export interface NutritionAuthUserResponse {
  id: string | number;
  email: string;
  name?: string | null;
  lastname?: string | null;
  role: string;
  phone_number?: string | null;
  is_phone_verified?: boolean;
  onboarding_status?: string | null;
  profile_picture?: string | null;
  professional_role?: string[] | string | null;
  current_subscription?: Record<string, unknown> | null;
  has_subscription?: boolean;
  has_active_subscription?: boolean;
  subscription_vigency?: Record<string, unknown> | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
}

export interface UpdateCurrentUserPayload {
  name?: string;
  lastname?: string;
  phone_number?: string;
  onboarding_status?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ApiMessageResponse {
  message: string;
  sessions_closed?: number;
}

// Training hierarchy types
export type MesocycleStatus = 'draft' | 'active' | 'completed' | 'archived';
export type IntensityLevel = 'low' | 'medium' | 'high' | 'deload';
export type EffortType = 'RIR' | 'RPE' | 'percentage';
export type ExercisePhase = 'warmup' | 'main' | 'cooldown';
export type ExerciseClass =
  | 'strength'
  | 'cardio'
  | 'plyometric'
  | 'flexibility'
  | 'mobility'
  | 'warmup'
  | 'conditioning'
  | 'balance';
export type CardioSubclass = 'liss' | 'hiit' | 'miss';

export interface Exercise {
  id: string;
  name_en: string;
  name_es?: string | null;
  description_en?: string | null;
  description_es?: string | null;
  type: 'multiarticular' | 'monoarticular';
  category: string;
  video_url?: string | null;
  thumbnail_url?: string | null;
  image_url?: string | null;
  equipment_needed?: string | null;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | null;
  exercise_class?: ExerciseClass | null;
  cardio_subclass?: CardioSubclass | null;
  intensity_zone?: number | null;
  target_heart_rate_min?: number | null;
  target_heart_rate_max?: number | null;
  calories_per_minute?: number | null;
}

export interface DayExercise {
  id: string;
  training_day_id: string;
  exercise_id: string;
  exercise?: Exercise;
  order_index: number;
  phase: ExercisePhase;
  sets: number;
  reps_min: number | null;
  reps_max: number | null;
  rest_seconds: number;
  effort_type: EffortType;
  effort_value: number;
  tempo?: string | null;
  set_type?: string | null;
  duration_seconds?: number | null;
  intensity_zone?: number | null;
  distance_meters?: number | null;
  target_calories?: number | null;
  intervals?: number | null;
  work_seconds?: number | null;
  interval_rest_seconds?: number | null;
  notes?: string | null;
}

export interface TrainingDay {
  id: string;
  microcycle_id: string;
  day_number: number;
  date: string;
  session_index: number;
  session_label?: string | null;
  name: string;
  focus?: string | null;
  rest_day: boolean;
  notes?: string | null;
  exercises: DayExercise[];
}

export interface Microcycle {
  id: string;
  mesocycle_id: string;
  week_number: number;
  name: string;
  start_date: string;
  end_date: string;
  intensity_level: IntensityLevel;
  training_days: TrainingDay[];
}

export interface Mesocycle {
  id: string;
  macrocycle_id: string;
  block_number: number;
  name: string;
  focus?: string | null;
  microcycles: Microcycle[];
}

export interface Macrocycle {
  id: string;
  name: string;
  description?: string | null;
  objective: string;
  status: MesocycleStatus;
  client_id?: string | null;
  trainer_id: string;
  start_date: string;
  end_date: string;
  mesocycles: Mesocycle[];
}

// Workout tracking types
export type WorkoutStatus = 'in_progress' | 'completed' | 'abandoned';
export type AbandonReason = 'time' | 'injury' | 'fatigue' | 'motivation' | 'schedule' | 'other';

export interface ExerciseSetLog {
  id: string;
  workout_log_id: string;
  day_exercise_id: string;
  set_number: number;
  reps_completed: number;
  weight_kg?: number | null;
  effort_value?: number | null;
  completed_at: string;
}

export interface WorkoutLog {
  id: string;
  client_id: string;
  training_day_id: string;
  started_at: string;
  completed_at?: string | null;
  performed_on_date: string;
  is_authoritative: boolean;
  status: WorkoutStatus;
  notes?: string | null;
  abandon_reason?: AbandonReason | null;
  abandon_notes?: string | null;
  rescheduled_to_date?: string | null;
  exercise_sets: ExerciseSetLog[];
}

// Missed workout types
export interface MissedWorkout {
  training_day_id: string;
  training_day_name: string;
  scheduled_date: string;
  days_overdue: number;
  status: 'never_started' | 'abandoned';
  abandon_reason?: AbandonReason | null;
  can_reschedule: boolean;
  training_day_focus?: string | null;
  exercises_count?: number;
}

export interface ExerciseProgress {
  day_exercise_id: string;
  exercise_name: string;
  total_sets: number;
  completed_sets: number;
  is_completed: boolean;
  sets_data: ExerciseSetLog[];
}

export interface CurrentWorkoutState {
  workout_log: WorkoutLog;
  training_day: TrainingDay;
  training_day_name: string;
  training_day_focus?: string | null;
  total_exercises: number;
  completed_exercises: number;
  exercises_progress: ExerciseProgress[];
}

// Next Workout (Sistema Secuencial)
export interface NextWorkoutTrainingDay {
  id: string;
  microcycle_id: string;
  date: string;
  session_index: number;
  session_label?: string | null;
  name: string;
  focus?: string | null;
  day_number: number;
  rest_day: boolean;
}

export type NextWorkoutReason =
  | 'no_active_macrocycle'
  | 'no_training_days'
  | 'all_completed';

export interface NextWorkoutResponse {
  training_day: NextWorkoutTrainingDay | null;
  position: number | null;  // Posición actual (ej: 5 de 24)
  total: number | null;     // Total de entrenamientos en el programa
  all_completed: boolean;   // True si completó todo el programa
  reason?: NextWorkoutReason | null;
}

export type PlannedSessionStatus = 'pending' | 'partial' | 'completed' | 'rest';
export type ActualSessionStatus = 'not_started' | 'in_progress' | 'completed' | 'abandoned';
export type MicrocycleMode = 'planned' | 'actual';

export interface MicrocycleSessionProgress {
  training_day_id: string;
  workout_log_id?: string | null;
  session_index: number;
  session_label?: string | null;
  name: string;
  focus?: string | null;
  planned_status: PlannedSessionStatus;
  actual_status: ActualSessionStatus;
  completion_percentage: number;
  performed_on_date?: string | null;
}

export interface MicrocycleDayProgress {
  date: string;
  day_number?: number | null;
  planned_sessions: number;
  completed_planned_sessions: number;
  actual_logs_count: number;
  has_partial_session: boolean;
  is_rest_day: boolean;
  is_planned_date: boolean;
  sessions: MicrocycleSessionProgress[];
}

export interface PlannedMicrocycleMetrics {
  total_planned_sessions: number;
  completed_planned_sessions: number;
  next_session_position?: number | null;
  completion_percentage: number;
}

export interface ActualMicrocycleMetrics {
  executed_sessions: number;
  active_days: number;
  double_session_days: number;
}

export interface MicrocycleProgress {
  microcycle_id?: string | null;
  microcycle_name?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  planned_metrics: PlannedMicrocycleMetrics;
  actual_metrics: ActualMicrocycleMetrics;
  days: MicrocycleDayProgress[];
}

export type WorkoutAnalyticsRange = '4w' | '8w' | '12w' | '24w' | 'all';
export type WorkoutAnalyticsColorToken = 'navy' | 'sky' | 'emerald' | 'amber' | 'rose' | 'violet';
export type WorkoutAnalyticsHistoryStatusFilter = 'all' | WorkoutStatus;

export interface RepRangeBucket {
  id: string;
  label: string;
  min_reps: number;
  max_reps: number | null;
  color_token: WorkoutAnalyticsColorToken;
}

export interface WorkoutAnalyticsPreferences {
  rep_ranges: RepRangeBucket[];
}

export interface WorkoutAnalyticsSummary {
  total_sessions: number;
  sessions_in_range: number;
  active_days: number;
  total_volume_kg: number;
  avg_duration_minutes: number;
}

export interface RepRangeChartPoint {
  week_start: string;
  totals: Record<string, number>;
}

export interface ExerciseTrendSummary {
  exercise_id: string;
  exercise_name: string;
  sessions_count: number;
  last_performed_on?: string | null;
  latest_best_weight_kg?: number | null;
  best_weight_delta_kg?: number | null;
  sparkline_points: number[];
}

export interface RecentWorkoutHistoryItem {
  workout_log_id: string;
  training_day_name: string;
  performed_on_date: string;
  duration_minutes?: number | null;
  exercises_count: number;
  volume_kg: number;
  status: WorkoutStatus;
}

export interface WorkoutAnalyticsDashboard {
  summary: WorkoutAnalyticsSummary;
  rep_range_chart: RepRangeChartPoint[];
  exercise_summaries: ExerciseTrendSummary[];
  recent_history: RecentWorkoutHistoryItem[];
  preferences: WorkoutAnalyticsPreferences;
}

export interface WorkoutAnalyticsHistoryPage {
  total: number;
  items: RecentWorkoutHistoryItem[];
}

export interface ExerciseTrendPoint {
  performed_on_date: string;
  best_weight_kg?: number | null;
  volume_kg: number;
  reps_bucket_id?: string | null;
}

export interface ExerciseTrendDetailSummary {
  personal_best_kg?: number | null;
  total_sessions: number;
  first_logged_at?: string | null;
  last_logged_at?: string | null;
}

export interface ExerciseTrendDetail {
  exercise_id: string;
  exercise_name: string;
  summary: ExerciseTrendDetailSummary;
  series: ExerciseTrendPoint[];
  preferences: WorkoutAnalyticsPreferences;
}

// Muscle Volume types (from GET /api/training-days/{id}/muscle-volume)
export interface MuscleVolumeItem {
  muscle_name: string;
  display_name: string;
  effective_sets: number;
  total_sets: number;
}

export interface MuscleVolumeResponse {
  training_day_id: string;
  training_day_name: string;
  total_effective_sets: number;
  muscles: MuscleVolumeItem[];
}

export interface MetricSummary {
  metric_type: string;
  latest_value: number;
  latest_date: string;
  unit: string;
  change_from_previous: number | null;
}

export interface ClientRecipeSummary {
  id: number;
  title: string;
  imageUrl: string | null;
  ingredientCount?: number;
}

export interface ClientDietPortion {
  householdLabel: string | null;
  equivalents: number | null;
  grams: number | null;
}

export interface ClientDietIngredientRow {
  id: string;
  label: string;
  exchangeGroupName: string | null;
  portion: ClientDietPortion;
}

export type ClientDietFoodRow = ClientDietIngredientRow;

export interface ClientDietRecipeCard {
  id: string;
  recipeId: number;
  title: string;
  imageUrl: string | null;
  ingredientCount: number;
  ingredients: ClientDietIngredientRow[];
}

export interface ClientDietRecipeDetail {
  id: string;
  recipeId: number;
  title: string;
  imageUrl: string | null;
  description: string | null;
  descriptionRich: unknown | null;
  ingredientCount: number;
  ingredients: ClientDietIngredientRow[];
}

export interface ClientDietMeal {
  id: string;
  name: string;
  totalCalories: number | null;
  recipes: ClientDietRecipeCard[];
  standaloneFoods: ClientDietFoodRow[];
  totalEntries: number;
}

export interface ClientDietMenu {
  id: string;
  menuId: number;
  assignedDate: string;
  title: string;
  description: string | null;
  meals: ClientDietMeal[];
  totalMeals: number;
  totalItems: number;
  totalRecipes: number;
}

export type ClientDietDay = ClientDietMenu;

export interface ClientDietWeekDay {
  id: string;
  assignedDate: string;
  isToday: boolean;
  assignedMenuId: number | null;
  assignedMenu: ClientDietMenu | null;
}

// API types
export interface ApiError {
  message: string;
  status?: number;
}

export * from './measurements';
