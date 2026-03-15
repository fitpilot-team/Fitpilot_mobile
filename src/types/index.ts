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

// Training hierarchy types
export type MesocycleStatus = 'draft' | 'active' | 'completed' | 'archived';
export type IntensityLevel = 'low' | 'medium' | 'high' | 'deload';
export type EffortType = 'RIR' | 'RPE' | 'percentage';
export type ExercisePhase = 'warmup' | 'main' | 'cooldown';

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
  notes?: string | null;
}

export interface TrainingDay {
  id: string;
  microcycle_id: string;
  day_number: number;
  date: string;
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

export interface DayProgress {
  date: string;
  day_number: number;
  day_name: string;
  training_day_id?: string | null;
  training_day_name?: string | null;
  total_sets: number;
  completed_sets: number;
  completion_percentage: number;
  has_workout: boolean;
  is_rest_day: boolean;
}

export interface WeeklyProgress {
  week_start: string;
  week_end: string;
  days: DayProgress[];
  total_workouts_planned: number;
  total_workouts_completed: number;
  overall_completion_percentage: number;
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
  training_day_name: string;
  training_day_focus?: string | null;
  total_exercises: number;
  completed_exercises: number;
  exercises_progress: ExerciseProgress[];
}

// Next Workout (Sistema Secuencial)
export interface NextWorkoutTrainingDay {
  id: string;
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

export interface ClientDietFoodRow extends ClientDietIngredientRow {}

export interface ClientDietRecipeCard {
  id: string;
  recipeId: number;
  title: string;
  imageUrl: string | null;
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

