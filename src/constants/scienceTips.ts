export type TipCategory = 'recovery' | 'nutrition' | 'technique' | 'motivation' | 'science';

export interface ScienceTip {
  id: string;
  category: TipCategory;
  icon: string; // Ionicons name
  title: string;
  content: string;
  source?: string;
}

export const categoryColors: Record<TipCategory, string> = {
  recovery: '#8B5CF6',   // Violeta
  nutrition: '#10B981',  // Verde
  technique: '#F59E0B',  // Naranja
  motivation: '#EC4899', // Rosa
  science: '#3B82F6',    // Azul
};

export const categoryIcons: Record<TipCategory, string> = {
  recovery: 'moon',
  nutrition: 'nutrition',
  technique: 'barbell',
  motivation: 'flash',
  science: 'flask',
};

export const scienceTips: ScienceTip[] = [
  // Recuperación
  {
    id: '1',
    category: 'recovery',
    icon: 'moon',
    title: 'Sueño y Músculo',
    content: 'Dormir 7-9 horas aumenta la síntesis de proteína muscular hasta un 20%. El sueño profundo es cuando tu cuerpo repara el tejido muscular.',
    source: 'Journal of Sleep Research',
  },
  {
    id: '2',
    category: 'recovery',
    icon: 'water',
    title: 'Hidratación Post-Entreno',
    content: 'Rehidratarte después del ejercicio mejora la recuperación muscular. Bebe 500ml de agua por cada 0.5kg perdidos durante el entrenamiento.',
    source: 'ACSM Guidelines',
  },
  {
    id: '3',
    category: 'recovery',
    icon: 'timer',
    title: 'Descanso Entre Series',
    content: 'Para hipertrofia, 60-90 segundos de descanso entre series optimiza el estrés metabólico. Para fuerza, 3-5 minutos permiten mayor recuperación neural.',
    source: 'Strength & Conditioning Journal',
  },

  // Nutrición
  {
    id: '4',
    category: 'nutrition',
    icon: 'nutrition',
    title: 'Proteína Distribuida',
    content: 'Consumir 20-40g de proteína cada 3-4 horas maximiza la síntesis proteica muscular a lo largo del día.',
    source: 'ISSN Position Stand',
  },
  {
    id: '5',
    category: 'nutrition',
    icon: 'restaurant',
    title: 'Carbohidratos Pre-Entreno',
    content: 'Consumir carbohidratos 2-3 horas antes del entrenamiento mejora el rendimiento en ejercicios de alta intensidad hasta un 15%.',
    source: 'Sports Medicine Journal',
  },
  {
    id: '6',
    category: 'nutrition',
    icon: 'cafe',
    title: 'Cafeína y Rendimiento',
    content: 'La cafeína (3-6mg/kg) 30-60 min antes del ejercicio puede mejorar la fuerza y resistencia. Evítala después de las 2pm para no afectar el sueño.',
    source: 'Journal of Applied Physiology',
  },

  // Técnica
  {
    id: '7',
    category: 'technique',
    icon: 'speedometer',
    title: 'Tempo Controlado',
    content: 'El tempo lento en la fase excéntrica (3-4 segundos) aumenta el tiempo bajo tensión y estimula mayor hipertrofia muscular.',
    source: 'European Journal of Sport Science',
  },
  {
    id: '8',
    category: 'technique',
    icon: 'fitness',
    title: 'Rango Completo',
    content: 'Entrenar con rango completo de movimiento genera hasta 25% más hipertrofia que rangos parciales, especialmente en la posición estirada.',
    source: 'Journal of Strength & Conditioning',
  },
  {
    id: '9',
    category: 'technique',
    icon: 'pulse',
    title: 'Conexión Mente-Músculo',
    content: 'Concentrarte en sentir el músculo trabajando puede aumentar la activación muscular hasta un 20%, mejorando la calidad del entrenamiento.',
    source: 'European Journal of Applied Physiology',
  },

  // Motivación
  {
    id: '10',
    category: 'motivation',
    icon: 'trophy',
    title: 'Consistencia > Perfección',
    content: 'El 80% de los resultados vienen de ser consistente con lo básico. No necesitas el entrenamiento perfecto, necesitas entrenar regularmente.',
  },
  {
    id: '11',
    category: 'motivation',
    icon: 'trending-up',
    title: 'Progresión Gradual',
    content: 'Aumentar la carga solo 2.5% por semana puede resultar en duplicar tu fuerza en un año. La paciencia es tu mejor aliado.',
  },
  {
    id: '12',
    category: 'motivation',
    icon: 'calendar',
    title: 'El Poder del Hábito',
    content: 'Después de 66 días en promedio, el ejercicio se convierte en hábito automático. Cada sesión te acerca a ese punto.',
    source: 'European Journal of Social Psychology',
  },

  // Ciencia
  {
    id: '13',
    category: 'science',
    icon: 'flask',
    title: 'Sobrecarga Progresiva',
    content: 'El principio más importante del entrenamiento: para seguir progresando, debes aumentar gradualmente el estímulo (peso, reps, o series).',
    source: 'Principles of Athletic Training',
  },
  {
    id: '14',
    category: 'science',
    icon: 'analytics',
    title: 'Volumen Semanal',
    content: '10-20 series semanales por grupo muscular es el rango óptimo para hipertrofia en la mayoría de personas. Más no siempre es mejor.',
    source: 'Sports Medicine Meta-Analysis',
  },
  {
    id: '15',
    category: 'science',
    icon: 'repeat',
    title: 'Deload Inteligente',
    content: 'Una semana de descarga cada 4-6 semanas (reduciendo volumen 40-50%) previene el sobreentrenamiento y permite supercompensación.',
    source: 'Periodization Theory',
  },
];

// Función para obtener tips aleatorios
export const getRandomTips = (count: number = 5): ScienceTip[] => {
  const shuffled = [...scienceTips].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

// Función para obtener tips por categoría
export const getTipsByCategory = (category: TipCategory): ScienceTip[] => {
  return scienceTips.filter(tip => tip.category === category);
};

// Obtener el tip del día basado en la fecha
export const getTipOfTheDay = (): ScienceTip => {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return scienceTips[dayOfYear % scienceTips.length];
};
