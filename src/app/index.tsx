import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';

import { MonthlyHeader } from '@/components/MonthlyHeader';
import { ExpenseItem } from '@/components/ExpenseItem';
import { AddExpenseModal } from '@/components/AddExpenseModal';
import { useExpenses } from '@/context/ExpenseContext';
import { LiquidGlassColors, Spacing } from '@/constants/theme';
import { Expense } from '@/types/expense';

export default function HomeScreen() {
  const { expenses: allExpenses, getCurrentMonthExpenses, isLoading, deleteExpense } = useExpenses();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewReceiptUri, setViewReceiptUri] = useState<string | null>(null);

  // Filtro de alcance: 'all' (todos los gastos históricos) o 'current' (solo este mes)
  const [scope, setScope] = useState<'all' | 'current'>('all');

  // Ordenamiento: 'recent' (más recientes) o 'highest' (más altos)
  const [sortBy, setSortBy] = useState<'recent' | 'highest'>('recent');

  // Si scope es 'all', toma absolutamente todos los gastos guardados en SQLite
  const rawExpenses = scope === 'all' ? allExpenses : getCurrentMonthExpenses();

  // Aplicación del ordenamiento
  const expenses = [...rawExpenses].sort((a, b) => {
    if (sortBy === 'highest') {
      return b.amount - a.amount; // Orden descendente por monto
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime(); // Orden cronológico
  });

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingExpense(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={['#FFF5F9', '#FFE8F0', '#FFF9FC']}
        style={styles.gradient}
      >
        {/* Circulos de color detras (DESIGN_SYSTEM) */}
        <View pointerEvents="none" style={[styles.orb, styles.orbPink]} />
        <View pointerEvents="none" style={[styles.orb, styles.orbOrange]} />
        <View pointerEvents="none" style={[styles.orb, styles.orbPurple]} />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <Text style={styles.appTitle}>Gastos Poliestudiante</Text>

            <MonthlyHeader />

            {/* Controles de Filtros y Ordenamiento Liquid Glass */}
            <View style={styles.filtersWrapper}>
              {/* Fila 1: Filtro por Período */}
              <View style={styles.chipsRow}>
                <TouchableOpacity
                  style={[
                    styles.sortChip,
                    scope === 'all' && styles.sortChipActive,
                  ]}
                  onPress={() => setScope('all')}
                >
                  {scope === 'all' ? (
                    <LinearGradient
                      colors={[LiquidGlassColors.primary, LiquidGlassColors.secondary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.sortChipGradient}
                    >
                      <Text style={styles.sortChipTextActive}>🌐 Todos los gastos</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.sortChipText}>🌐 Todos los gastos</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sortChip,
                    scope === 'current' && styles.sortChipActive,
                  ]}
                  onPress={() => setScope('current')}
                >
                  {scope === 'current' ? (
                    <LinearGradient
                      colors={[LiquidGlassColors.primary, LiquidGlassColors.secondary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.sortChipGradient}
                    >
                      <Text style={styles.sortChipTextActive}>📅 Solo este mes</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.sortChipText}>📅 Solo este mes</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Fila 2: Ordenamiento por Recientes o Más Altos */}
              <View style={styles.chipsRow}>
                <TouchableOpacity
                  style={[
                    styles.sortChip,
                    sortBy === 'recent' && styles.sortChipActive,
                  ]}
                  onPress={() => setSortBy('recent')}
                >
                  {sortBy === 'recent' ? (
                    <LinearGradient
                      colors={[LiquidGlassColors.primary, LiquidGlassColors.secondary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.sortChipGradient}
                    >
                      <Text style={styles.sortChipTextActive}>⏰ Más recientes</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.sortChipText}>⏰ Más recientes</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sortChip,
                    sortBy === 'highest' && styles.sortChipActive,
                  ]}
                  onPress={() => setSortBy('highest')}
                >
                  {sortBy === 'highest' ? (
                    <LinearGradient
                      colors={[LiquidGlassColors.primary, LiquidGlassColors.secondary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.sortChipGradient}
                    >
                      <Text style={styles.sortChipTextActive}>💰 Gastos más altos</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.sortChipText}>💰 Gastos más altos</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {isLoading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color={LiquidGlassColors.primary} />
              </View>
            ) : expenses.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>💸</Text>
                <Text style={styles.emptyTitle}>No hay gastos para mostrar</Text>
                <Text style={styles.emptyText}>
                  {scope === 'current'
                    ? 'No tienes gastos en este mes. Cambia a "Todos los gastos" para ver meses anteriores o presiona +.'
                    : 'Presiona el botón + para agregar tu primer gasto'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={expenses}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                  <ExpenseItem
                    expense={item}
                    index={index}
                    onEdit={handleOpenEdit}
                    onDelete={deleteExpense}
                    onViewReceipt={(uri) => setViewReceiptUri(uri)}
                  />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>

          {/* Boton + de la esquina (FAB) */}
          <TouchableOpacity
            style={styles.fab}
            onPress={handleOpenAdd}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[LiquidGlassColors.primary, LiquidGlassColors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fabGradient}
            >
              <Text style={styles.fabIcon}>+</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Modal para Crear / Editar Gasto */}
          <AddExpenseModal
            visible={modalVisible}
            onClose={handleCloseModal}
            expenseToEdit={editingExpense}
          />

          {/* Modal con efecto Liquid Glass para visualizar Comprobante */}
          <Modal
            visible={Boolean(viewReceiptUri)}
            transparent
            animationType="fade"
            onRequestClose={() => setViewReceiptUri(null)}
          >
            <View style={styles.receiptModalOverlay}>
              <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={styles.receiptModalCard}>
                <BlurView intensity={90} tint="light" style={styles.receiptModalBlur}>
                  <Text style={styles.receiptModalTitle}>Comprobante / Factura</Text>
                  {viewReceiptUri && (
                    <Image
                      source={{ uri: viewReceiptUri }}
                      style={styles.receiptFullImage}
                      resizeMode="contain"
                    />
                  )}
                  <TouchableOpacity
                    style={styles.closeReceiptButton}
                    onPress={() => setViewReceiptUri(null)}
                  >
                    <LinearGradient
                      colors={[LiquidGlassColors.primary, LiquidGlassColors.secondary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.closeReceiptGradient}
                    >
                      <Text style={styles.closeReceiptText}>Cerrar</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </BlurView>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbPink: {
    width: 220,
    height: 220,
    top: 60,
    left: -60,
    backgroundColor: 'rgba(255, 107, 157, 0.55)',
  },
  orbOrange: {
    width: 180,
    height: 180,
    top: 260,
    right: -50,
    backgroundColor: 'rgba(255, 159, 94, 0.5)',
  },
  orbPurple: {
    width: 200,
    height: 200,
    bottom: 120,
    left: 20,
    backgroundColor: 'rgba(168, 120, 220, 0.4)',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: LiquidGlassColors.glassText,
    marginBottom: Spacing.three,
    textAlign: 'center',
  },
  filtersWrapper: {
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'center',
  },
  sortChip: {
    borderRadius: Spacing.two,
    backgroundColor: LiquidGlassColors.glassInput,
    borderWidth: 1,
    borderColor: LiquidGlassColors.glassBorder,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortChipActive: {
    borderColor: 'transparent',
  },
  sortChipGradient: {
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
  },
  sortChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: LiquidGlassColors.glassText,
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
  },
  sortChipTextActive: {
    fontSize: 12,
    fontWeight: '600',
    color: LiquidGlassColors.glassTextLight,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.three,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: LiquidGlassColors.glassText,
    marginBottom: Spacing.two,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: LiquidGlassColors.glassTextSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.four,
    right: Spacing.four,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: LiquidGlassColors.shadowDark,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  fabGradient: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabIcon: {
    fontSize: 32,
    color: LiquidGlassColors.glassTextLight,
    fontWeight: '300',
  },
  receiptModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  receiptModalCard: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: Spacing.four,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: LiquidGlassColors.glassBorder,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  receiptModalBlur: {
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    width: '100%',
  },
  receiptModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: LiquidGlassColors.glassText,
  },
  receiptFullImage: {
    width: '100%',
    height: 350,
    borderRadius: Spacing.two,
  },
  closeReceiptButton: {
    width: '100%',
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  closeReceiptGradient: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  closeReceiptText: {
    color: LiquidGlassColors.glassTextLight,
    fontSize: 15,
    fontWeight: 'bold',
  },
});
