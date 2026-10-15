import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Image } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Expense, CATEGORY_ICONS } from '@/types/expense';
import { GlassCard } from './GlassCard';
import { LiquidGlassColors, Spacing } from '@/constants/theme';

interface ExpenseItemProps {
  expense: Expense;
  index: number;
  onEdit?: (expense: Expense) => void;
  onDelete?: (id: string) => void;
  onViewReceipt?: (uri: string) => void;
}

// Una fila de la lista de gastos adaptada al Liquid Glass Design System
export const ExpenseItem: React.FC<ExpenseItemProps> = ({
  expense,
  index,
  onEdit,
  onDelete,
  onViewReceipt,
}) => {
  const formattedDate = new Date(expense.date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(expense.amount);

  const handleDeletePress = () => {
    Alert.alert(
      'Eliminar Gasto',
      `¿Estás seguro de que deseas eliminar el gasto de ${expense.category} por ${formattedAmount}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => onDelete?.(expense.id),
        },
      ]
    );
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      style={styles.container}
    >
      <GlassCard>
        <View style={styles.cardContent}>
          <View style={styles.mainRow}>
            {/* Sección Izquierda: Icono y Nombre */}
            <View style={styles.leftSection}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={[LiquidGlassColors.primary, LiquidGlassColors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconGradient}
                >
                  <Text style={styles.icon}>{CATEGORY_ICONS[expense.category]}</Text>
                </LinearGradient>
              </View>
              <View style={styles.infoContainer}>
                <Text style={styles.category}>{expense.category}</Text>
                {expense.description ? (
                  <Text style={styles.description} numberOfLines={1}>
                    {expense.description}
                  </Text>
                ) : null}
                <Text style={styles.date}>{formattedDate}</Text>
              </View>
            </View>

            {/* Sección Derecha: Monto y Acciones */}
            <View style={styles.rightSection}>
              <Text style={styles.amount}>{formattedAmount}</Text>

              <View style={styles.actionButtons}>
                {onEdit && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onEdit(expense)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.actionIcon}>✏️</Text>
                  </TouchableOpacity>
                )}

                {onDelete && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleDeletePress}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.actionIcon}>🗑️</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Miniatura de la Factura o Comprobante si existe */}
          {expense.receiptUri ? (
            <TouchableOpacity
              style={styles.receiptBadge}
              onPress={() => onViewReceipt?.(expense.receiptUri!)}
            >
              <Image
                source={{ uri: expense.receiptUri }}
                style={styles.receiptThumbnail}
              />
              <Text style={styles.receiptText}>🧾 Ver comprobante adjunto</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </GlassCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.two,
  },
  cardContent: {
    flexDirection: 'column',
    gap: Spacing.two,
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: Spacing.two,
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
  },
  infoContainer: {
    flex: 1,
  },
  category: {
    fontSize: 16,
    fontWeight: '600',
    color: LiquidGlassColors.glassText,
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: LiquidGlassColors.glassTextSecondary,
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: LiquidGlassColors.glassTextSecondary,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: Spacing.one,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: LiquidGlassColors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  actionButton: {
    padding: Spacing.one,
    borderRadius: Spacing.two,
    backgroundColor: LiquidGlassColors.glassInput,
    borderWidth: 1,
    borderColor: LiquidGlassColors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 14,
  },
  receiptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: LiquidGlassColors.glassInput,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: LiquidGlassColors.glassBorder,
    alignSelf: 'flex-start',
    marginTop: Spacing.one,
  },
  receiptThumbnail: {
    width: 24,
    height: 24,
    borderRadius: Spacing.one,
  },
  receiptText: {
    fontSize: 12,
    color: LiquidGlassColors.primary,
    fontWeight: '600',
  },
});
