// User types
export type UserRole = 'admin' | 'trainer' | 'client';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  preferred_language: 'es' | 'en';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
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
  notes?: string | null;
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
  training_day_focus?: string | null;
  scheduled_date: string;
  day_number: number;
  microcycle_week: number;
  exercises_count: number;
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

export interface NextWorkoutResponse {
  training_day: NextWorkoutTrainingDay | null;
  position: number | null;  // Posición actual (ej: 5 de 24)
  total: number | null;     // Total de entrenamientos en el programa
  all_completed: boolean;   // True si completó todo el programa
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

// API types
export interface ApiError {
  message: string;
  status?: number;
}
