import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { Category, CATEGORIES, CATEGORY_ICONS, Expense } from '@/types/expense';
import { LiquidGlassColors, Spacing } from '@/constants/theme';
import { useExpenses } from '@/context/ExpenseContext';

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  expenseToEdit?: Expense | null;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  visible,
  onClose,
  expenseToEdit,
}) => {
  const { addExpense, updateExpense } = useExpenses();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [receiptUri, setReceiptUri] = useState<string | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Estados para mensajes de error de validación
  const [amountError, setAmountError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Cuando se abre en modo edición, se precargan los campos
  useEffect(() => {
    if (expenseToEdit) {
      setAmount(expenseToEdit.amount.toString());
      setCategory(expenseToEdit.category);
      setDescription(expenseToEdit.description || '');
      setDate(new Date(expenseToEdit.date));
      setReceiptUri(expenseToEdit.receiptUri);
    } else {
      resetForm();
    }
  }, [expenseToEdit, visible]);

  const resetForm = () => {
    setAmount('');
    setCategory(null);
    setDescription('');
    setDate(new Date());
    setReceiptUri(undefined);
    setShowDatePicker(false);
    setAmountError(null);
    setCategoryError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  /**
   * Control 3.a: El monto solo acepta números y hasta 2 decimales.
   * Normaliza la coma a punto decimal y valida con RegEx.
   */
  const handleAmountChange = (text: string) => {
    const normalized = text.replace(',', '.');
    if (/^\d*\.?\d{0,2}$/.test(normalized)) {
      setAmount(normalized);
      if (amountError) setAmountError(null);
    }
  };

  /**
   * Control 3.c: La descripción solo admite letras, números y espacios.
   * Filtra caracteres especiales y limita a 400 caracteres.
   */
  const handleDescriptionChange = (text: string) => {
    const sanitized = text.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
    if (sanitized.length <= 400) {
      setDescription(sanitized);
    }
  };

  const handleSelectCategory = (cat: Category) => {
    setCategory(cat);
    if (categoryError) setCategoryError(null);
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  // 📷 Tomar foto con la cámara
  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permiso de Cámara Requerido',
        'Necesitamos acceso a tu cámara para tomar la foto del comprobante.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setReceiptUri(result.assets[0].uri);
    }
  };

  // 🖼️ Elegir foto desde la galería
  const handlePickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permiso de Galería Requerido',
        'Necesitamos acceso a tus fotos para adjuntar el comprobante.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setReceiptUri(result.assets[0].uri);
    }
  };

  const handleAttachReceipt = () => {
    Alert.alert(
      'Adjuntar Factura o Comprobante',
      '¿Cómo deseas agregar el comprobante?',
      [
        {
          text: '📷 Tomar Foto',
          onPress: handleTakePhoto,
        },
        {
          text: '🖼️ Galería de Fotos',
          onPress: handlePickFromGallery,
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (!amount.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      setAmountError('El monto es obligatorio y debe ser mayor a 0 (máx. 2 decimales).');
      Alert.alert(
        'Monto Obligatorio',
        'Por favor ingresa un monto numérico válido mayor a 0 con hasta dos decimales (ej: 15.50).'
      );
      return;
    }

    if (!category) {
      setCategoryError('La categoría es obligatoria.');
      Alert.alert(
        'Categoría Obligatoria',
        'Debes seleccionar una categoría para poder registrar el gasto.'
      );
      return;
    }

    try {
      if (expenseToEdit) {
        await updateExpense({
          ...expenseToEdit,
          amount: parsedAmount,
          category,
          date,
          description: description.trim() || undefined,
          receiptUri,
        });
      } else {
        await addExpense({
          amount: parsedAmount,
          category,
          date,
          description: description.trim() || undefined,
          receiptUri,
        });
      }
    } catch (error) {
      console.error('Error al guardar el gasto', error);
      Alert.alert('Error', 'No se pudo guardar el gasto. Intenta de nuevo.');
      return;
    }

    handleClose();
  };

  const isEditing = Boolean(expenseToEdit);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
        keyboardVerticalOffset={0}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        >
          <Animated.View entering={FadeIn} style={styles.backdropBlur}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          </Animated.View>
        </TouchableOpacity>

        <Animated.View
          entering={SlideInDown.springify()}
          style={styles.modalContent}
        >
          <View style={styles.modalBackground}>
            <BlurView intensity={100} tint="light" style={styles.modalBlur}>
              <View style={styles.handleBar} />

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}
              >
                <Text style={styles.title}>
                  {isEditing ? 'Editar Gasto' : 'Agregar Gasto'}
                </Text>

                {/* Campo Monto (Control 3.a) */}
                <View style={styles.inputSection}>
                  <Text style={styles.label}>Monto (USD) *</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      amountError ? styles.inputContainerError : null,
                    ]}
                  >
                    <Text style={styles.currencySymbol}>$</Text>
                    <TextInput
                      style={styles.input}
                      value={amount}
                      onChangeText={handleAmountChange}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                      placeholderTextColor={LiquidGlassColors.glassTextSecondary}
                    />
                  </View>
                  {amountError ? (
                    <Text style={styles.errorText}>{amountError}</Text>
                  ) : null}
                </View>

                {/* Campo Fecha (Obligatorio) */}
                <View style={styles.inputSection}>
                  <Text style={styles.label}>Fecha del Gasto *</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.datePickerIcon}>📅</Text>
                    <Text style={styles.datePickerText}>
                      {date.toLocaleDateString('es-ES', {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  </TouchableOpacity>

                  {showDatePicker && (
                    <DateTimePicker
                      value={date}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleDateChange}
                      maximumDate={new Date()}
                    />
                  )}
                </View>

                {/* Campo Categoría (Control 3.b) */}
                <View style={styles.inputSection}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Categoría *</Text>
                    {categoryError ? (
                      <Text style={styles.errorTextInline}>
                        * {categoryError}
                      </Text>
                    ) : null}
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoriesScroll}
                    contentContainerStyle={styles.categoriesContent}
                  >
                    {CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => handleSelectCategory(cat)}
                        style={[
                          styles.categoryButton,
                          category === cat && styles.categoryButtonActive,
                          categoryError && !category && styles.categoryButtonHighlight,
                        ]}
                      >
                        {category === cat ? (
                          <LinearGradient
                            colors={[
                              LiquidGlassColors.primary,
                              LiquidGlassColors.secondary,
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.categoryGradient}
                          >
                            <Text style={styles.categoryIcon}>
                              {CATEGORY_ICONS[cat]}
                            </Text>
                            <Text style={styles.categoryTextActive}>{cat}</Text>
                          </LinearGradient>
                        ) : (
                          <>
                            <Text style={styles.categoryIcon}>
                              {CATEGORY_ICONS[cat]}
                            </Text>
                            <Text style={styles.categoryText}>{cat}</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Campo Descripción (Control 3.c) */}
                <View style={styles.inputSection}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Descripción (opcional)</Text>
                    <Text style={styles.charCounter}>{description.length}/400</Text>
                  </View>
                  <TextInput
                    style={[styles.input, styles.descriptionInput]}
                    value={description}
                    onChangeText={handleDescriptionChange}
                    maxLength={400}
                    placeholder="Solo letras y números (ej: Almuerzo universitario)"
                    placeholderTextColor={LiquidGlassColors.glassTextSecondary}
                    multiline
                  />
                  <Text style={styles.helperText}>
                    * Solo letras y números. Máximo 400 caracteres.
                  </Text>
                </View>

                {/* Campo Factura / Comprobante */}
                <View style={styles.inputSection}>
                  <Text style={styles.label}>Factura o Comprobante (opcional)</Text>
                  {receiptUri ? (
                    <View style={styles.imagePreviewContainer}>
                      <Image source={{ uri: receiptUri }} style={styles.imagePreview} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => setReceiptUri(undefined)}
                      >
                        <Text style={styles.removeImageText}>✕ Quitar Comprobante</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.attachButton}
                      onPress={handleAttachReceipt}
                    >
                      <Text style={styles.attachButtonIcon}>🧾</Text>
                      <Text style={styles.attachButtonText}>
                        Adjuntar foto o factura
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Botones de Acción */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleClose}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                  >
                    <LinearGradient
                      colors={[LiquidGlassColors.primary, LiquidGlassColors.secondary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.submitGradient}
                    >
                      <Text style={styles.submitButtonText}>
                        {isEditing ? 'Actualizar' : 'Agregar'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </BlurView>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  backdropBlur: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  modalBackground: {
    // DESIGN_SYSTEM: poca opacidad (~0.45) para lucir el efecto glass del fondo
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
  },
  modalBlur: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
    maxHeight: '100%',
  },
  scrollContent: {
    paddingBottom: Spacing.four,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: LiquidGlassColors.glassTextSecondary,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.three,
    marginTop: Spacing.two,
    opacity: 0.3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: LiquidGlassColors.glassText,
    marginBottom: Spacing.four,
  },
  inputSection: {
    marginBottom: Spacing.three,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: LiquidGlassColors.glassText,
    marginBottom: Spacing.one,
  },
  charCounter: {
    fontSize: 12,
    color: LiquidGlassColors.glassTextSecondary,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 11,
    color: LiquidGlassColors.glassTextSecondary,
    marginTop: Spacing.one,
  },
  errorText: {
    fontSize: 12,
    color: LiquidGlassColors.danger,
    fontWeight: '600',
    marginTop: Spacing.one,
  },
  errorTextInline: {
    fontSize: 12,
    color: LiquidGlassColors.danger,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LiquidGlassColors.glassInput,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: LiquidGlassColors.glassBorder,
    paddingHorizontal: Spacing.three,
  },
  inputContainerError: {
    borderColor: LiquidGlassColors.danger,
    backgroundColor: LiquidGlassColors.dangerBackground,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: LiquidGlassColors.primary,
    marginRight: Spacing.one,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: LiquidGlassColors.glassText,
    paddingVertical: Spacing.three,
  },
  descriptionInput: {
    backgroundColor: LiquidGlassColors.glassInput,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: LiquidGlassColors.glassBorder,
    paddingHorizontal: Spacing.three,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LiquidGlassColors.glassInput,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: LiquidGlassColors.glassBorder,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  datePickerIcon: {
    fontSize: 18,
    marginRight: Spacing.two,
  },
  datePickerText: {
    fontSize: 16,
    color: LiquidGlassColors.glassText,
    fontWeight: '500',
  },
  categoriesScroll: {
    marginHorizontal: -Spacing.two,
  },
  categoriesContent: {
    paddingHorizontal: Spacing.two,
    gap: Spacing.two,
  },
  categoryButton: {
    backgroundColor: LiquidGlassColors.glassInput,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: LiquidGlassColors.glassBorder,
    padding: Spacing.two,
    minWidth: 100,
    alignItems: 'center',
  },
  categoryButtonActive: {
    borderColor: 'transparent',
  },
  categoryButtonHighlight: {
    borderColor: LiquidGlassColors.danger,
    backgroundColor: LiquidGlassColors.dangerBackground,
  },
  categoryGradient: {
    padding: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
    width: '100%',
  },
  categoryIcon: {
    fontSize: 22,
    marginBottom: Spacing.one,
  },
  categoryText: {
    fontSize: 12,
    color: LiquidGlassColors.glassText,
    textAlign: 'center',
  },
  categoryTextActive: {
    fontSize: 12,
    color: LiquidGlassColors.glassTextLight,
    fontWeight: '600',
    textAlign: 'center',
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LiquidGlassColors.glassInput,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: LiquidGlassColors.glassBorder,
    borderStyle: 'dashed',
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  attachButtonIcon: {
    fontSize: 20,
  },
  attachButtonText: {
    fontSize: 15,
    color: LiquidGlassColors.primary,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: LiquidGlassColors.glassInput,
    padding: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: LiquidGlassColors.glassBorder,
  },
  imagePreview: {
    width: '100%',
    height: 160,
    borderRadius: Spacing.two,
    resizeMode: 'cover',
  },
  removeImageButton: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  removeImageText: {
    color: LiquidGlassColors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: LiquidGlassColors.glassInput,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: LiquidGlassColors.glassBorder,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: LiquidGlassColors.glassText,
  },
  submitButton: {
    flex: 1,
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  submitGradient: {
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: LiquidGlassColors.glassTextLight,
  },
});
