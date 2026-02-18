import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Path, Rect, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors, brandColors, spacing, fontSize } from '../../constants/colors';
import type { WeeklyProgress, DayProgress } from '../../types';

// Dimensiones de pantalla para configuración responsiva
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Detectar tipo de dispositivo
const isTablet = SCREEN_WIDTH >= 768;           // iPad y tablets
const isSmallPhone = SCREEN_WIDTH < 430;        // iPhone regular y mini

// Dimensiones del selector de día - configuración por dispositivo
// Tablet: dimensiones grandes | Phone grande: normales | Phone pequeño: compactas
const DAY_COLUMN_WIDTH = isTablet ? 60 : isSmallPhone ? 48 : 55;
const DAY_GAP = isSmallPhone ? 8 : 2;  // Gap entre días
const SHAPE_SIZE = isTablet ? 160 : isSmallPhone ? 130 : 150;
const CIRCLE_RADIUS = isTablet ? 20 : isSmallPhone ? 16 : 18;

// Dimensiones originales del SVG (viewBox actualizado)
const SVG_ORIGINAL_WIDTH = 100;
const SVG_ORIGINAL_HEIGHT = 100;

// Posiciones de marcadores del SVG (coordenadas originales del archivo date-form1.svg)
const SVG_RECT_X = 28.97;
const SVG_RECT_Y = 15.48;
const SVG_RECT_WIDTH = 29.93;
const SVG_RECT_HEIGHT = 24.41;
const SVG_CIRCLE_CX = 64.81;
const SVG_CIRCLE_CY = 71.54;
const SVG_CIRCLE_R = 15;

// Factor de escala (1:1 ya que SHAPE_SIZE = SVG viewBox)
const SCALE = SHAPE_SIZE / SVG_ORIGINAL_WIDTH;

// Posiciones escaladas para el contenido
const TEXT_CONTAINER_LEFT = SVG_RECT_X * SCALE;
const TEXT_CONTAINER_TOP = SVG_RECT_Y * SCALE;
const TEXT_CONTAINER_WIDTH = SVG_RECT_WIDTH * SCALE;
const TEXT_CONTAINER_HEIGHT = SVG_RECT_HEIGHT * SCALE;
const CIRCLE_CENTER_X = SVG_CIRCLE_CX * SCALE;
const CIRCLE_CENTER_Y = SVG_CIRCLE_CY * SCALE;

interface WeekCalendarProps {
  weeklyProgress: WeeklyProgress | null;
  selectedDate?: string;
  onDayPress?: (day: DayProgress) => void;
}

// Componente para la forma del selector de día actual
// Usando el path del archivo date-form1.svg (viewBox 100x100)
const DayShapeBackground: React.FC<{ width: number; height: number; showGuides?: boolean }> = ({ width, height, showGuides = false }) => {
  // Path actualizado del archivo date-form1.svg con viewBox 100x100
  const shapePath = "M79.35,64.86L55.23,14.24l-.82-1.73H19.1l30.13,63.22,1.46,2.58c2.51,5.42,8.01,9.18,14.38,9.18,8.75,0,15.84-7.07,15.84-15.8,0-1.88-.33-3.69-.94-5.37l-.61-1.45Z";

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${SVG_ORIGINAL_WIDTH} ${SVG_ORIGINAL_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      style={StyleSheet.absoluteFillObject}
    >
      <Defs>
        <LinearGradient id="shapeGradient" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={brandColors.navy} />
          <Stop offset="1" stopColor={brandColors.sky} />
        </LinearGradient>
      </Defs>
      <Path d={shapePath} fill="url(#shapeGradient)" />
      {/* Guías visuales para posicionamiento */}
      {showGuides && (
        <>
          <Rect
            x={SVG_RECT_X}
            y={SVG_RECT_Y}
            width={SVG_RECT_WIDTH}
            height={SVG_RECT_HEIGHT}
            fill="none"
            stroke="yellow"
            strokeWidth={1}
          />
          <Circle
            cx={SVG_CIRCLE_CX}
            cy={SVG_CIRCLE_CY}
            r={SVG_CIRCLE_R}
            fill="none"
            stroke="yellow"
            strokeWidth={1}
          />
        </>
      )}
    </Svg>
  );
};

export const WeekCalendar: React.FC<WeekCalendarProps> = ({
  weeklyProgress,
  selectedDate,
  onDayPress,
}) => {
  const today = new Date().toISOString().split('T')[0];

  // Generate mock days if no progress data
  const days: DayProgress[] = weeklyProgress?.days || generateMockWeek();

  return (
    <View style={styles.container}>
      <View style={styles.daysRow}>
        {days.map((day) => {
          const isToday = day.date === today;
          const isSelected = day.date === selectedDate;
          const hasCompletion = day.completion_percentage > 0;
          const isComplete = day.completion_percentage >= 100;
          const showSpecialShape = isToday || isSelected;

          // Determinar si es un día perdido (pasado, tiene entrenamiento, no completado)
          const isPastDay = day.date < today;
          const isMissed = isPastDay && day.has_workout && !day.is_rest_day && day.completion_percentage < 100;

          // Función para obtener el contenido del estado
          const getStatusContent = () => {
            if (day.is_rest_day) {
              return '🌙'; // Día de descanso
            }
            if (!day.has_workout) {
              return '-';
            }
            if (isMissed && day.completion_percentage === 0) {
              return '⚠️'; // Perdido sin iniciar
            }
            return `${Math.round(day.completion_percentage)}%`;
          };

          // Obtener estilo según estado
          const getStatusStyle = () => {
            if (day.is_rest_day) return styles.percentageRest;
            if (isMissed) return styles.percentageMissed;
            if (isComplete) return styles.percentageComplete;
            if (hasCompletion) return styles.percentagePartial;
            return styles.percentage;
          };

          return (
            <TouchableOpacity
              key={day.date}
              style={styles.dayColumn}
              onPress={() => onDayPress?.(day)}
              disabled={!day.has_workout && !day.is_rest_day}
            >
              {showSpecialShape ? (
                // Contenido con forma especial - posicionamiento absoluto
                <View style={styles.shapeContainer}>
                  <DayShapeBackground width={SHAPE_SIZE} height={SHAPE_SIZE} />

                  {/* Contenedor del texto (% y nombre día) - posición del rectángulo SVG */}
                  <View style={styles.textContainerHighlighted}>
                    <Text style={styles.percentageHighlighted}>
                      {getStatusContent()}
                    </Text>
                    <Text style={styles.dayNameHighlighted}>
                      {day.day_name}
                    </Text>
                  </View>

                  {/* Círculo con número de día - posición del círculo SVG */}
                  <View style={styles.circleContainerHighlighted}>
                    <View style={styles.dateCircleHighlighted}>
                      <Text style={styles.dateNumberHighlighted}>
                        {new Date(day.date).getDate()}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                // Contenido normal sin forma especial
                <View style={[styles.dayContent, day.is_rest_day && styles.dayContentRest]}>
                  <Text style={getStatusStyle()}>
                    {getStatusContent()}
                  </Text>
                  <Text style={[styles.dayName, day.is_rest_day && styles.dayNameRest]}>
                    {day.day_name}
                  </Text>
                  <View style={styles.dateCircleContainer}>
                    <View style={[
                      styles.dateCircle,
                      day.is_rest_day && styles.dateCircleRest,
                      isMissed && styles.dateCircleMissed,
                      isComplete && styles.dateCircleComplete
                    ]}>
                      <Text style={[
                        styles.dateNumber,
                        day.is_rest_day && styles.dateNumberRest,
                        isMissed && styles.dateNumberMissed,
                        isComplete && styles.dateNumberComplete
                      ]}>
                        {new Date(day.date).getDate()}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// Generate mock week data
function generateMockWeek(): DayProgress[] {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1);

  const dayNames = ['Lun', 'Mar', 'Mier', 'Jue', 'Vie', 'Sab', 'Dom'];

  return dayNames.map((name, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);

    // Mock data: algunos días con progreso
    const mockProgress = index === 0 ? 0 : index === 1 ? 90 : index === 2 ? 100 : 0;

    return {
      date: date.toISOString().split('T')[0],
      day_number: index + 1,
      day_name: name,
      total_sets: 0,
      completed_sets: 0,
      completion_percentage: mockProgress,
      has_workout: index < 5, // Lun-Vie tienen entrenamientos
      is_rest_day: index >= 5,
    };
  });
}

// Padding mínimo solo para que el shape no se corte en los extremos
const SHAPE_OVERFLOW = (SHAPE_SIZE - DAY_COLUMN_WIDTH) / 2;
const HORIZONTAL_PADDING = SHAPE_OVERFLOW;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: spacing.md,
    overflow: 'visible',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
    gap: DAY_GAP,
  },
  dayColumn: {
    alignItems: 'center',
    width: DAY_COLUMN_WIDTH,
    height: SHAPE_SIZE,
    position: 'relative',
    overflow: 'visible',
  },
  shapeContainer: {
    position: 'absolute',
    top: 0,
    left: (DAY_COLUMN_WIDTH - SHAPE_SIZE) / 2,
    width: SHAPE_SIZE,
    height: SHAPE_SIZE,
    overflow: 'visible',
  },
  dayContent: {
    flex: 1,
    alignItems: 'center',
    paddingTop: TEXT_CONTAINER_TOP,
    zIndex: 1,
  },
  // Contenedor de texto (% y día) - centrado en el rectángulo del SVG
  textContainerHighlighted: {
    position: 'absolute',
    left: TEXT_CONTAINER_LEFT,
    top: TEXT_CONTAINER_TOP,
    width: TEXT_CONTAINER_WIDTH,
    height: TEXT_CONTAINER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  // Contenedor del círculo - posición según SVG original
  circleContainerHighlighted: {
    position: 'absolute',
    left: CIRCLE_CENTER_X - CIRCLE_RADIUS,
    top: CIRCLE_CENTER_Y - CIRCLE_RADIUS,
    width: CIRCLE_RADIUS * 2,
    height: CIRCLE_RADIUS * 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  percentage: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  percentageHighlighted: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: '600',
  },
  percentageComplete: {
    color: colors.primary[500],
    fontWeight: '600',
  },
  percentagePartial: {
    color: colors.gray[600],
  },
  dayName: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  dayNameHighlighted: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: '600',
  },
  dateCircleContainer: {
    position: 'absolute',
    top: CIRCLE_CENTER_Y - CIRCLE_RADIUS,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dateCircle: {
    width: CIRCLE_RADIUS * 2,
    height: CIRCLE_RADIUS * 2,
    borderRadius: CIRCLE_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  dateCircleHighlighted: {
    width: CIRCLE_RADIUS * 2,
    height: CIRCLE_RADIUS * 2,
    borderRadius: CIRCLE_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  dateNumber: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.gray[700],
  },
  dateNumberHighlighted: {
    fontSize: fontSize.base,
    color: colors.primary[600],
    fontWeight: '700',
  },
  // Estilos para día de descanso
  dayContentRest: {
    opacity: 0.9,
  },
  percentageRest: {
    fontSize: fontSize.sm,
    color: '#10B981', // emerald-500
    marginBottom: spacing.xs,
  },
  dayNameRest: {
    color: '#10B981', // emerald-500
  },
  dateCircleRest: {
    backgroundColor: '#D1FAE5', // emerald-100
  },
  dateNumberRest: {
    color: '#059669', // emerald-600
  },
  // Estilos para día perdido
  percentageMissed: {
    fontSize: fontSize.xs,
    color: '#F59E0B', // amber-500
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  dateCircleMissed: {
    backgroundColor: '#FEF3C7', // amber-100
    borderWidth: 1,
    borderColor: '#F59E0B', // amber-500
  },
  dateNumberMissed: {
    color: '#D97706', // amber-600
  },
  // Estilos para día completado
  dateCircleComplete: {
    backgroundColor: '#DCFCE7', // green-100
  },
  dateNumberComplete: {
    color: '#16A34A', // green-600
  },
});
