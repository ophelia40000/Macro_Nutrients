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

export default function AdjustGoalsModal({ visible, onClose, goals, onSave }) {
  const [cal, setCal] = useState('');
  const [carbs, setCarbs] = useState('');
  const [prot, setProt] = useState('');
  const [fat, setFat] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useModalEscape(visible, onClose);

  useEffect(() => {
    if (goals) {
      setCal(goals.calories ? goals.calories.toString() : '2000');
      setCarbs(goals.carbs ? goals.carbs.toString() : '250');
      setProt(goals.protein ? goals.protein.toString() : '150');
      setFat(goals.fat ? goals.fat.toString() : '70');
      setErrorMsg('');
    }
  }, [goals, visible]);

  const pRes = parseNumericInput(prot, { allowEmpty: true, emptyValue: 0, min: 0 });
  const cRes = parseNumericInput(carbs, { allowEmpty: true, emptyValue: 0, min: 0 });
  const fRes = parseNumericInput(fat, { allowEmpty: true, emptyValue: 0, min: 0 });
  const calRes = parseNumericInput(cal, { allowEmpty: false, min: 1, allowZero: false });

  const pNum = pRes.valid ? pRes.value : 0;
  const cNum = cRes.valid ? cRes.value : 0;
  const fNum = fRes.valid ? fRes.value : 0;
  const calculatedSum = Math.round(pNum * 4 + cNum * 4 + fNum * 9);
  const targetCalNum = calRes.valid ? calRes.value : 0;
  const variance = calculatedSum - targetCalNum;

  const handleSave = () => {
    if (!calRes.valid) {
      setErrorMsg('Enter a valid daily calorie target greater than 0.');
      return;
    }
    if (!pRes.valid || !cRes.valid || !fRes.valid) {
      setErrorMsg('Protein, carbs, and fats must be 0 or positive numbers.');
      return;
    }

    setErrorMsg('');
    onSave({
      ...goals,
      calories: calRes.value,
      carbs: cRes.value,
      protein: pRes.value,
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
                <Text style={styles.title}>Adjust Nutrition Goals</Text>
                <Text style={styles.sub}>
                  Configure daily caloric budget and target macronutrients
                </Text>
              </View>

              <ScrollView
                style={{ maxHeight: 380 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.fieldLabel}>Daily Calories</Text>
                <View style={styles.inputGroup}>
                  <Ionicons name="flame-outline" size={16} color={tokens.warmGray} />
                  <TextInput
                    style={styles.input}
                    value={cal}
                    onChangeText={(v) => { setCal(v); setErrorMsg(''); }}
                    placeholder="Total Calories"
                    placeholderTextColor={tokens.ashGray}
                    keyboardType="decimal-pad"
                    accessibilityLabel="Daily Calories Input"
                  />
                  <Text style={styles.unitSuffix}>kcal</Text>
                </View>

                <View style={styles.inputRow}>
                  <View style={styles.inputCol}>
                    <Text style={styles.fieldLabel}>Protein</Text>
                    <View style={[styles.inputGroup, styles.inputGroupFlex]}>
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
                        accessibilityLabel="Protein Target Input"
                      />
                      <Text style={styles.unitSuffix}>g</Text>
                    </View>
                  </View>

                  <View style={styles.inputCol}>
                    <Text style={styles.fieldLabel}>Carbs</Text>
                    <View style={[styles.inputGroup, styles.inputGroupFlex]}>
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
                        accessibilityLabel="Carbohydrates Target Input"
                      />
                      <Text style={styles.unitSuffix}>g</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.fieldLabel}>Healthy Fats</Text>
                <View style={styles.inputGroup}>
                  <Ionicons name="water-outline" size={16} color={tokens.warmGray} />
                  <TextInput
                    style={styles.input}
                    value={fat}
                    onChangeText={(v) => { setFat(v); setErrorMsg(''); }}
                    placeholder="Healthy Fats"
                    placeholderTextColor={tokens.ashGray}
                    keyboardType="decimal-pad"
                    accessibilityLabel="Healthy Fats Target Input"
                  />
                  <Text style={styles.unitSuffix}>g</Text>
                </View>

                <FormErrorBanner message={errorMsg} />

                <View style={styles.telemetryCard}>
                  <View style={styles.telemetryRow}>
                    <Text style={styles.telemetryLabel}>Macro Energy Total</Text>
                    <Text style={styles.telemetryValue}>{calculatedSum} kcal</Text>
                  </View>
                  <Text style={styles.telemetryHint}>
                    {variance === 0
                      ? 'Exact match with caloric target'
                      : variance > 0
                      ? `+${variance} kcal over target budget`
                      : `${variance} kcal under target budget`}
                  </Text>
                </View>
              </ScrollView>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.btnSecondary}
                  activeOpacity={0.8}
                  onPress={onClose}
                  accessibilityLabel="Cancel"
                  accessibilityRole="button"
                >
                  <Text style={styles.btnSecondaryText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnPrimary}
                  activeOpacity={0.88}
                  onPress={handleSave}
                  accessibilityLabel="Save Goals"
                  accessibilityRole="button"
                >
                  <Feather name="check" size={16} color="#ffffff" />
                  <Text style={styles.btnPrimaryText}>Save Goals</Text>
                </TouchableOpacity>
              </View>
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
        shadowOpacity: 0.08,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
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
    marginBottom: 16,
  },
  title: {
    color: tokens.inkBlack,
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: -0.3,
  },
  sub: {
    color: tokens.warmGray,
    fontSize: 13,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: tokens.warmGray,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 5,
  },
  inputCol: {
    flex: 1,
    minWidth: 0,
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
  inputGroupFlex: {
    flex: 1,
    minWidth: 0,
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: tokens.inkBlack,
    fontSize: 14,
    fontWeight: '400',
  },
  unitSuffix: {
    color: tokens.warmGray,
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 0,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  telemetryCard: {
    backgroundColor: tokens.stoneCanvas,
    borderRadius: tokens.radiusCard,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    padding: 12,
    marginBottom: 12,
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  telemetryLabel: {
    fontSize: 12,
    color: tokens.warmGray,
    fontWeight: '400',
  },
  telemetryValue: {
    fontSize: 13,
    fontWeight: '500',
    color: tokens.inkBlack,
  },
  telemetryHint: {
    fontSize: 11,
    color: tokens.warmGray,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: tokens.stoneCanvas,
  },
  btnSecondary: {
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: tokens.radiusPill,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    backgroundColor: 'transparent',
  },
  btnSecondaryText: {
    color: tokens.inkBlack,
    fontSize: 13,
    fontWeight: '500',
  },
  btnPrimary: {
    backgroundColor: tokens.cyanSignal,
    borderRadius: tokens.radiusPill,
    borderWidth: 1,
    borderColor: tokens.cyanEdge,
    minHeight: 44,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#110c2e',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
  },
});
