import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import useModalEscape from '../../hooks/useModalEscape';
import FormErrorBanner from '../FormErrorBanner';
import { parseNumericInput } from '../../utils/validation';

const tokens = {
  stoneCanvas: '#fafaf9',
  pureWhite: '#ffffff',
  stoneBorder: '#e8e6e5',
  stoneMuted: '#d6d3d1',
  ashGray: '#a8a29e',
  warmGray: '#78716c',
  inkBlack: '#0c0a09',
  cyanSignal: '#0369a1',
  cyanEdge: '#0369a1',

  radiusCard: 10,
  radiusFeatureCard: 16,
  radiusPill: 9999,
  radiusInput: 6,
};

export default function EditPresetModal({
  visible,
  onClose,
  preset,
  onSavePreset,
}) {
  const [name, setName] = useState('');
  const [cal, setCal] = useState('');
  const [prot, setProt] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useModalEscape(visible, onClose);

  useEffect(() => {
    if (preset) {
      setName(preset.name || '');
      setCal(preset.calories ? preset.calories.toString() : '');
      setProt(preset.protein ? preset.protein.toString() : '');
      setCarbs(preset.carbs ? preset.carbs.toString() : '');
      setFat(preset.fat ? preset.fat.toString() : '');
    } else {
      setName('');
      setCal('');
      setProt('');
      setCarbs('');
      setFat('');
    }
    setErrorMsg('');
  }, [preset, visible]);

  const pRes = parseNumericInput(prot, { allowEmpty: true, emptyValue: 0, min: 0 });
  const cRes = parseNumericInput(carbs, { allowEmpty: true, emptyValue: 0, min: 0 });
  const fRes = parseNumericInput(fat, { allowEmpty: true, emptyValue: 0, min: 0 });
  const calRes = parseNumericInput(cal, { allowEmpty: true, emptyValue: null, min: 0 });

  const pNum = pRes.valid ? pRes.value : 0;
  const cNum = cRes.valid ? cRes.value : 0;
  const fNum = fRes.valid ? fRes.value : 0;
  const calculatedSum = Math.round(pNum * 4 + cNum * 4 + fNum * 9);

  const handleSave = () => {
    if (!name.trim()) {
      setErrorMsg('Enter a preset name.');
      return;
    }
    if (!calRes.valid || !pRes.valid || !cRes.valid || !fRes.valid) {
      setErrorMsg('Calories and macros must be 0 or positive numbers.');
      return;
    }
    setErrorMsg('');
    onSavePreset({
      name: name.trim(),
      calories: calRes.value !== null ? calRes.value : calculatedSum,
      protein: pRes.value,
      carbs: cRes.value,
      fat: fRes.value,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.bottomSheet}>
              <View style={styles.dragHandle} />

              <View style={styles.headerRow}>
                <Text style={styles.title}>
                  {preset ? 'Edit Nutrition Preset' : 'New Nutrition Preset'}
                </Text>
                <Text style={styles.sub}>Configure food macros per 100g serving</Text>
              </View>

              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardContainer}
              >
                <ScrollView
                  style={{ maxHeight: 360 }}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.inputLabel}>Preset Label</Text>
                  <View style={styles.inputGroup}>
                    <Feather name="tag" size={16} color={tokens.ashGray} />
                    <TextInput
                      style={styles.input}
                      value={name}
                      onChangeText={setName}
                      placeholder="e.g. Grilled Chicken Breast"
                      placeholderTextColor={tokens.ashGray}
                      accessibilityLabel="Preset Name Input"
                    />
                  </View>

                  <Text style={styles.inputLabel}>Energy Density (per 100g)</Text>
                  <View style={styles.inputGroup}>
                    <Ionicons name="flame-outline" size={16} color={tokens.cyanEdge} />
                    <TextInput
                      style={styles.input}
                      value={cal}
                      onChangeText={setCal}
                      placeholder="Calories"
                      placeholderTextColor={tokens.ashGray}
                      keyboardType="decimal-pad"
                      accessibilityLabel="Calories Input"
                    />
                    <Text style={styles.unitSuffix}>kcal</Text>
                  </View>

                  <Text style={styles.inputLabel}>Macronutrients</Text>
                  <View style={styles.macroRow}>
                    <View style={[styles.inputGroup, { flex: 1, minWidth: 0 }]}>
                      <MaterialCommunityIcons
                        name="food-drumstick"
                        size={16}
                        color={tokens.cyanEdge}
                      />
                      <TextInput
                        style={styles.input}
                        value={prot}
                        onChangeText={(v) => { setProt(v); setErrorMsg(''); }}
                        placeholder="Protein"
                        placeholderTextColor={tokens.ashGray}
                        keyboardType="decimal-pad"
                        accessibilityLabel="Protein Input"
                      />
                      <Text style={styles.unitSuffix}>g</Text>
                    </View>

                    <View style={[styles.inputGroup, { flex: 1, minWidth: 0 }]}>
                      <MaterialCommunityIcons
                        name="bread-slice"
                        size={16}
                        color={tokens.warmGray}
                      />
                      <TextInput
                        style={styles.input}
                        value={carbs}
                        onChangeText={(v) => { setCarbs(v); setErrorMsg(''); }}
                        placeholder="Carbs"
                        placeholderTextColor={tokens.ashGray}
                        keyboardType="decimal-pad"
                        accessibilityLabel="Carbs Input"
                      />
                      <Text style={styles.unitSuffix}>g</Text>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Ionicons name="water-outline" size={16} color={tokens.warmGray} />
                    <TextInput
                      style={styles.input}
                      value={fat}
                      onChangeText={(v) => { setFat(v); setErrorMsg(''); }}
                      placeholder="Fats"
                      placeholderTextColor={tokens.ashGray}
                      keyboardType="decimal-pad"
                      accessibilityLabel="Fat Input"
                    />
                    <Text style={styles.unitSuffix}>g</Text>
                  </View>

                  <FormErrorBanner message={errorMsg} />

                  {calculatedSum > 0 && (
                    <View style={styles.calculationPreview}>
                      <Text style={styles.calculationLabel}>Calculated Macro Energy</Text>
                      <Text style={styles.calculationValue}>{calculatedSum} kcal</Text>
                    </View>
                  )}
                </ScrollView>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.btnSecondary}
                    activeOpacity={0.8}
                    onPress={onClose}
                    accessibilityLabel="Cancel preset editing"
                    accessibilityRole="button"
                  >
                    <Text style={styles.btnSecondaryText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.btnPrimary,
                      !name.trim() && styles.btnPrimaryDisabled,
                    ]}
                    activeOpacity={0.88}
                    onPress={handleSave}
                    disabled={!name.trim()}
                    accessibilityLabel="Save Preset"
                    accessibilityRole="button"
                  >
                    <Feather name="check" size={16} color="#ffffff" />
                    <Text style={styles.btnPrimaryText}>Save Preset</Text>
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 10, 9, 0.45)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: tokens.pureWhite,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 22,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    borderTopWidth: 1,
    borderTopColor: tokens.stoneBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 18,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: tokens.stoneMuted,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    marginBottom: 14,
  },
  title: {
    color: tokens.inkBlack,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  sub: {
    color: tokens.warmGray,
    fontSize: 13,
    marginTop: 2,
  },
  keyboardContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: tokens.warmGray,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  inputGroup: {
    backgroundColor: tokens.pureWhite,
    borderRadius: tokens.radiusInput,
    paddingHorizontal: 12,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    minWidth: 0,
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: tokens.inkBlack,
    fontSize: 16,
    fontWeight: '400',
  },
  unitSuffix: {
    fontSize: 13,
    fontWeight: '600',
    color: tokens.warmGray,
    flexShrink: 0,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 10,
  },
  calculationPreview: {
    backgroundColor: tokens.stoneCanvas,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    borderRadius: tokens.radiusInput,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  calculationLabel: {
    fontSize: 12,
    color: tokens.warmGray,
    fontWeight: '500',
  },
  calculationValue: {
    fontSize: 13,
    color: tokens.inkBlack,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  btnSecondary: {
    flex: 1,
    height: 44,
    backgroundColor: tokens.stoneCanvas,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    borderRadius: tokens.radiusPill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: tokens.warmGray,
    fontSize: 14,
    fontWeight: '600',
  },
  btnPrimary: {
    flex: 2,
    height: 44,
    backgroundColor: tokens.cyanSignal,
    borderRadius: tokens.radiusPill,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnPrimaryDisabled: {
    opacity: 0.45,
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
