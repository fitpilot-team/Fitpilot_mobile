import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius, shadows, brandColors } from '../../src/constants/colors';

// Datos mock para pagos
const mockPaymentData = {
  currentPlan: {
    name: 'Plan Premium',
    price: '$49.99',
    period: 'mes',
    nextBillingDate: '2025-01-15',
    status: 'active' as const,
  },
  paymentHistory: [
    { id: '1', date: '2024-12-15', amount: '$49.99', status: 'paid' as const, method: 'Visa •••• 4242' },
    { id: '2', date: '2024-11-15', amount: '$49.99', status: 'paid' as const, method: 'Visa •••• 4242' },
    { id: '3', date: '2024-10-15', amount: '$49.99', status: 'paid' as const, method: 'Visa •••• 4242' },
    { id: '4', date: '2024-09-15', amount: '$49.99', status: 'paid' as const, method: 'Visa •••• 4242' },
  ],
  paymentMethods: [
    { id: '1', type: 'visa', last4: '4242', expiry: '12/26', isDefault: true },
  ],
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
    case 'paid':
      return colors.success;
    case 'pending':
      return colors.warning;
    case 'failed':
      return colors.error;
    default:
      return colors.gray[500];
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'active':
      return 'Activo';
    case 'paid':
      return 'Pagado';
    case 'pending':
      return 'Pendiente';
    case 'failed':
      return 'Fallido';
    default:
      return status;
  }
};

export default function PaymentsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Pagos</Text>
        <Text style={styles.subtitle}>Gestiona tu suscripción</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Plan Card */}
        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <View>
              <Text style={styles.planLabel}>Plan actual</Text>
              <Text style={styles.planName}>{mockPaymentData.currentPlan.name}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(mockPaymentData.currentPlan.status)}15` }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(mockPaymentData.currentPlan.status) }]} />
              <Text style={[styles.statusText, { color: getStatusColor(mockPaymentData.currentPlan.status) }]}>
                {getStatusText(mockPaymentData.currentPlan.status)}
              </Text>
            </View>
          </View>

          <View style={styles.planPriceContainer}>
            <Text style={styles.planPrice}>{mockPaymentData.currentPlan.price}</Text>
            <Text style={styles.planPeriod}>/{mockPaymentData.currentPlan.period}</Text>
          </View>

          <View style={styles.planInfo}>
            <Ionicons name="calendar-outline" size={16} color={colors.gray[400]} />
            <Text style={styles.planInfoText}>
              Próximo cobro: {new Date(mockPaymentData.currentPlan.nextBillingDate).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
        </View>

        {/* Payment Method */}
        <Text style={styles.sectionTitle}>Método de pago</Text>

        {mockPaymentData.paymentMethods.map((method) => (
          <View key={method.id} style={styles.paymentMethodCard}>
            <View style={styles.cardIconContainer}>
              <Ionicons name="card" size={24} color={brandColors.navy} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardType}>
                {method.type.charAt(0).toUpperCase() + method.type.slice(1)} •••• {method.last4}
              </Text>
              <Text style={styles.cardExpiry}>Expira {method.expiry}</Text>
            </View>
            {method.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>Principal</Text>
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.addPaymentButton} activeOpacity={0.7}>
          <Ionicons name="add-circle-outline" size={20} color={colors.primary[500]} />
          <Text style={styles.addPaymentText}>Agregar método de pago</Text>
        </TouchableOpacity>

        {/* Payment History */}
        <Text style={styles.sectionTitle}>Historial de pagos</Text>

        {mockPaymentData.paymentHistory.map((payment) => (
          <View key={payment.id} style={styles.historyCard}>
            <View style={styles.historyLeft}>
              <View style={styles.historyIconContainer}>
                <Ionicons name="receipt-outline" size={18} color={colors.gray[500]} />
              </View>
              <View>
                <Text style={styles.historyDate}>
                  {new Date(payment.date).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
                <Text style={styles.historyMethod}>{payment.method}</Text>
              </View>
            </View>
            <View style={styles.historyRight}>
              <Text style={styles.historyAmount}>{payment.amount}</Text>
              <View style={[styles.historyStatusBadge, { backgroundColor: `${getStatusColor(payment.status)}15` }]}>
                <Text style={[styles.historyStatusText, { color: getStatusColor(payment.status) }]}>
                  {getStatusText(payment.status)}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {/* Placeholder message */}
        <View style={styles.placeholderContainer}>
          <Ionicons name="construct-outline" size={40} color={colors.gray[300]} />
          <Text style={styles.placeholderText}>
            Integración con pasarelas de pago próximamente
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
  planCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  planName: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  planPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.md,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: brandColors.navy,
  },
  planPeriod: {
    fontSize: fontSize.base,
    color: colors.gray[500],
  },
  planInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    gap: spacing.xs,
  },
  planInfoText: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: spacing.md,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  cardType: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.gray[800],
  },
  cardExpiry: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  defaultBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    color: colors.primary[600],
  },
  addPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderStyle: 'dashed',
    gap: spacing.sm,
  },
  addPaymentText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.primary[500],
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  historyDate: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.gray[800],
  },
  historyMethod: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
  },
  historyStatusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginTop: 4,
  },
  historyStatusText: {
    fontSize: 10,
    fontWeight: '500',
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
    textAlign: 'center',
  },
});
