export type TipCategory = 'recovery' | 'nutrition' | 'technique' | 'motivation' | 'science' | 'training';

export type TipContextTag =
  | 'pre_workout'
  | 'post_workout'
  | 'deload_week'
  | 'high_intensity'
  | 'program_start'
  | 'program_mid'
  | 'program_end'
  | 'morning'
  | 'afternoon'
  | 'evening'
  | 'upper_body'
  | 'lower_body'
  | 'full_body'
  | 'high_volume'
  | 'consistency';

export interface ScienceTip {
  id: string;
  category: TipCategory;
  icon: string;
  title: string;
  content: string;
  source?: string;
  tags: TipContextTag[];
}

export const categoryColors: Record<TipCategory, string> = {
  recovery: '#8B5CF6',
  nutrition: '#10B981',
  technique: '#F59E0B',
  motivation: '#EC4899',
  science: '#3B82F6',
  training: '#F97316',
};

export const categoryIcons: Record<TipCategory, string> = {
  recovery: 'moon',
  nutrition: 'nutrition',
  technique: 'barbell',
  motivation: 'flash',
  science: 'flask',
  training: 'body',
};

export const categoryLabels: Record<TipCategory, string> = {
  recovery: 'Recuperación',
  nutrition: 'Nutrición',
  technique: 'Técnica',
  motivation: 'Motivación',
  science: 'Ciencia',
  training: 'Entrenamiento',
};

export const scienceTips: ScienceTip[] = [
  // ── Recuperación ──────────────────────────────────────────
  {
    id: '1',
    category: 'recovery',
    icon: 'moon',
    title: 'Sueño y Músculo',
    content: 'Dormir 7-9 horas aumenta la síntesis de proteína muscular hasta un 20%. El sueño profundo es cuando tu cuerpo repara el tejido muscular.',
    source: 'Journal of Sleep Research',
    tags: ['post_workout', 'evening'],
  },
  {
    id: '2',
    category: 'recovery',
    icon: 'water',
    title: 'Hidratación Post-Entreno',
    content: 'Rehidratarte después del ejercicio mejora la recuperación muscular. Bebe 500ml de agua por cada 0.5kg perdidos durante el entrenamiento.',
    source: 'ACSM Guidelines',
    tags: ['post_workout'],
  },
  {
    id: '3',
    category: 'recovery',
    icon: 'timer',
    title: 'Descanso Entre Series',
    content: 'Para hipertrofia, 60-90 segundos de descanso entre series optimiza el estrés metabólico. Para fuerza, 3-5 minutos permiten mayor recuperación neural.',
    source: 'Strength & Conditioning Journal',
    tags: ['pre_workout', 'high_volume'],
  },
  {
    id: '4',
    category: 'recovery',
    icon: 'fitness',
    title: 'Descanso Activo',
    content: 'Caminar 20-30 minutos en días de descanso mejora el flujo sanguíneo y acelera la recuperación sin generar fatiga adicional.',
    source: 'Sports Medicine',
    tags: ['post_workout', 'deload_week'],
  },
  {
    id: '5',
    category: 'recovery',
    icon: 'snow',
    title: 'Contraste de Temperatura',
    content: 'Alternar agua fría (1 min) y caliente (3 min) por 3-4 ciclos mejora la circulación y puede reducir el dolor muscular post-entreno.',
    source: 'Frontiers in Physiology',
    tags: ['post_workout', 'high_intensity'],
  },

  // ── Nutrición ─────────────────────────────────────────────
  {
    id: '6',
    category: 'nutrition',
    icon: 'nutrition',
    title: 'Proteína Distribuida',
    content: 'Consumir 20-40g de proteína cada 3-4 horas maximiza la síntesis proteica muscular a lo largo del día.',
    source: 'ISSN Position Stand',
    tags: ['consistency'],
  },
  {
    id: '7',
    category: 'nutrition',
    icon: 'restaurant',
    title: 'Carbohidratos Pre-Entreno',
    content: 'Consumir carbohidratos 2-3 horas antes del entrenamiento mejora el rendimiento en ejercicios de alta intensidad hasta un 15%.',
    source: 'Sports Medicine Journal',
    tags: ['pre_workout', 'morning', 'afternoon'],
  },
  {
    id: '8',
    category: 'nutrition',
    icon: 'cafe',
    title: 'Cafeína y Rendimiento',
    content: 'La cafeína (3-6mg/kg) 30-60 min antes del ejercicio puede mejorar la fuerza y resistencia. Evítala después de las 2pm para no afectar el sueño.',
    source: 'Journal of Applied Physiology',
    tags: ['pre_workout', 'morning'],
  },
  {
    id: '9',
    category: 'nutrition',
    icon: 'flask',
    title: 'Creatina: El Suplemento #1',
    content: 'La creatina monohidratada (3-5g/día) es el suplemento más estudiado y efectivo para ganar fuerza y masa muscular.',
    source: 'ISSN Position Stand',
    tags: ['consistency', 'program_start'],
  },
  {
    id: '10',
    category: 'nutrition',
    icon: 'water',
    title: 'Hidratación y Fuerza',
    content: 'Una deshidratación del 2% puede reducir tu fuerza hasta un 10%. Bebe agua regularmente antes y durante el entrenamiento.',
    source: 'Journal of Athletic Training',
    tags: ['pre_workout', 'morning', 'afternoon'],
  },

  // ── Técnica ───────────────────────────────────────────────
  {
    id: '11',
    category: 'technique',
    icon: 'speedometer',
    title: 'Tempo Controlado',
    content: 'El tempo lento en la fase excéntrica (3-4 segundos) aumenta el tiempo bajo tensión y estimula mayor hipertrofia muscular.',
    source: 'European Journal of Sport Science',
    tags: ['pre_workout', 'upper_body', 'lower_body'],
  },
  {
    id: '12',
    category: 'technique',
    icon: 'fitness',
    title: 'Rango Completo',
    content: 'Entrenar con rango completo de movimiento genera hasta 25% más hipertrofia que rangos parciales, especialmente en la posición estirada.',
    source: 'Journal of Strength & Conditioning',
    tags: ['pre_workout'],
  },
  {
    id: '13',
    category: 'technique',
    icon: 'pulse',
    title: 'Conexión Mente-Músculo',
    content: 'Concentrarte en sentir el músculo trabajando puede aumentar la activación muscular hasta un 20%, mejorando la calidad del entrenamiento.',
    source: 'European Journal of Applied Physiology',
    tags: ['pre_workout', 'upper_body'],
  },
  {
    id: '14',
    category: 'technique',
    icon: 'barbell',
    title: 'Calentamiento Específico',
    content: 'Realizar 2-3 series de calentamiento progresivo antes de tus series de trabajo mejora el rendimiento y reduce el riesgo de lesión.',
    tags: ['pre_workout', 'high_intensity'],
  },
  {
    id: '15',
    category: 'technique',
    icon: 'walk',
    title: 'Postura en Sentadilla',
    content: 'Coloca los pies al ancho de hombros con puntas ligeramente hacia afuera. Mantén el pecho alto y baja controlado para proteger rodillas y espalda baja.',
    tags: ['pre_workout', 'lower_body'],
  },

  // ── Motivación ────────────────────────────────────────────
  {
    id: '16',
    category: 'motivation',
    icon: 'trophy',
    title: 'Consistencia > Perfección',
    content: 'El 80% de los resultados vienen de ser consistente con lo básico. No necesitas el entrenamiento perfecto, necesitas entrenar regularmente.',
    tags: ['consistency', 'program_start'],
  },
  {
    id: '17',
    category: 'motivation',
    icon: 'trending-up',
    title: 'Progresión Gradual',
    content: 'Aumentar la carga solo 2.5% por semana puede resultar en duplicar tu fuerza en un año. La paciencia es tu mejor aliado.',
    tags: ['consistency', 'program_mid'],
  },
  {
    id: '18',
    category: 'motivation',
    icon: 'calendar',
    title: 'El Poder del Hábito',
    content: 'Después de 66 días en promedio, el ejercicio se convierte en hábito automático. Cada sesión te acerca a ese punto.',
    source: 'European Journal of Social Psychology',
    tags: ['consistency', 'program_start'],
  },
  {
    id: '19',
    category: 'motivation',
    icon: 'rocket',
    title: 'Mentalidad de Largo Plazo',
    content: 'Los cambios visibles en composición corporal toman 8-12 semanas. El progreso es silencioso antes de ser evidente.',
    tags: ['program_start', 'program_mid'],
  },
  {
    id: '20',
    category: 'motivation',
    icon: 'ribbon',
    title: 'Recta Final',
    content: 'Estás en la etapa final de tu programa. Mantener la disciplina en estas últimas semanas marca la diferencia entre buenos y excelentes resultados.',
    tags: ['program_end'],
  },

  // ── Ciencia ───────────────────────────────────────────────
  {
    id: '21',
    category: 'science',
    icon: 'flask',
    title: 'Sobrecarga Progresiva',
    content: 'El principio más importante del entrenamiento: para seguir progresando, debes aumentar gradualmente el estímulo (peso, reps, o series).',
    source: 'Principles of Athletic Training',
    tags: ['consistency', 'program_mid'],
  },
  {
    id: '22',
    category: 'science',
    icon: 'analytics',
    title: 'Volumen Semanal',
    content: '10-20 series semanales por grupo muscular es el rango óptimo para hipertrofia en la mayoría de personas. Más no siempre es mejor.',
    source: 'Sports Medicine Meta-Analysis',
    tags: ['high_volume', 'consistency'],
  },
  {
    id: '23',
    category: 'science',
    icon: 'repeat',
    title: 'Deload Inteligente',
    content: 'Una semana de descarga (reduciendo volumen 40-50%) previene el sobreentrenamiento y permite supercompensación.',
    source: 'Periodization Theory',
    tags: ['deload_week'],
  },
  {
    id: '24',
    category: 'science',
    icon: 'stats-chart',
    title: 'SFR: Estímulo vs Fatiga',
    content: 'Elige ejercicios con alto estímulo y baja fatiga (alto SFR). Una sentadilla búlgara puede ser mejor que una sentadilla pesada si te fatiga menos.',
    source: 'Stronger by Science',
    tags: ['pre_workout', 'high_volume'],
  },

  // ── Entrenamiento ─────────────────────────────────────────
  {
    id: '25',
    category: 'training',
    icon: 'body',
    title: 'Día de Piernas',
    content: 'Prioriza ejercicios compuestos como sentadillas y peso muerto al inicio de tu sesión cuando tienes más energía. Aísla cuádriceps y glúteos después.',
    tags: ['pre_workout', 'lower_body'],
  },
  {
    id: '26',
    category: 'training',
    icon: 'body',
    title: 'Tren Superior Efectivo',
    content: 'Equilibra empujes (press banca, press hombro) con jalones (remo, dominadas) en proporción 1:1 para prevenir desbalances y lesiones de hombro.',
    tags: ['pre_workout', 'upper_body'],
  },
  {
    id: '27',
    category: 'training',
    icon: 'flame',
    title: 'Semana Intensa',
    content: 'Esta semana la intensidad es alta. Asegúrate de calentar bien, dormir suficiente y mantener la nutrición on point para rendir al máximo.',
    tags: ['high_intensity'],
  },
  {
    id: '28',
    category: 'training',
    icon: 'leaf',
    title: 'Semana de Descarga',
    content: 'Es semana de deload. Reduce el peso 40-50% pero mantén la técnica impecable. Tu cuerpo se está recuperando y adaptando.',
    tags: ['deload_week'],
  },
  {
    id: '29',
    category: 'training',
    icon: 'barbell',
    title: 'Sesión de Alto Volumen',
    content: 'Tu sesión tiene muchas series. Mantén el descanso entre series constante y no sacrifiques técnica por completar más rápido.',
    tags: ['pre_workout', 'high_volume'],
  },
  {
    id: '30',
    category: 'training',
    icon: 'flag',
    title: 'Primeros Pasos',
    content: 'Estás iniciando tu programa. Enfócate en aprender la técnica correcta antes de aumentar peso. La base que construyas ahora determinará tu progreso.',
    tags: ['program_start', 'pre_workout'],
  },
];

export const getScienceTipById = (tipId: string): ScienceTip | null =>
  scienceTips.find((tip) => tip.id === tipId) ?? null;
