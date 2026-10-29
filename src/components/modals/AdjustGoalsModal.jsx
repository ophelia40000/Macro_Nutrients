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

const tokens = {
  stoneCanvas: '#fafaf9',
  pureWhite: '#ffffff',
  stoneBorder: '#e8e6e5',
  stoneMuted: '#d6d3d1',
  ashGray: '#a8a29e',
  warmGray: '#78716c',
  inkBlack: '#0c0a09',
  cyanSignal: '#3ba6f1',
  cyanEdge: '#3398e1',

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

  useEffect(() => {
    if (goals) {
      setCal(goals.calories ? goals.calories.toString() : '2000');
      setCarbs(goals.carbs ? goals.carbs.toString() : '250');
      setProt(goals.protein ? goals.protein.toString() : '150');
      setFat(goals.fat ? goals.fat.toString() : '70');
    }
  }, [goals, visible]);

  const pNum = parseFloat(prot) || 0;
  const cNum = parseFloat(carbs) || 0;
  const fNum = parseFloat(fat) || 0;
  const calculatedSum = Math.round(pNum * 4 + cNum * 4 + fNum * 9);
  const targetCalNum = parseFloat(cal) || 0;
  const variance = calculatedSum - targetCalNum;

  const handleSave = () => {
    onSave({
      ...goals,
      calories: parseFloat(cal) || goals.calories,
      carbs: parseFloat(carbs) || goals.carbs,
      protein: parseFloat(prot) || goals.protein,
      fat: parseFloat(fat) || goals.fat,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
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
                style={{ maxHeight: 340 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.inputGroup}>
                  <Ionicons name="flame-outline" size={16} color={tokens.ashGray} />
                  <TextInput
                    style={styles.input}
                    value={cal}
                    onChangeText={setCal}
                    placeholder="Total Calories"
                    placeholderTextColor={tokens.ashGray}
                    keyboardType="numeric"
                  />
                  <Text style={styles.unitSuffix}>kcal</Text>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <MaterialCommunityIcons
                      name="food-drumstick"
                      size={16}
                      color={tokens.cyanEdge}
                    />
                    <TextInput
                      style={styles.input}
                      value={prot}
                      onChangeText={setProt}
                      placeholder="Protein"
                      placeholderTextColor={tokens.ashGray}
                      keyboardType="numeric"
                    />
                    <Text style={styles.unitSuffix}>g</Text>
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <MaterialCommunityIcons
                      name="bread-slice"
                      size={16}
                      color={tokens.warmGray}
                    />
                    <TextInput
                      style={styles.input}
                      value={carbs}
                      onChangeText={setCarbs}
                      placeholder="Carbs"
                      placeholderTextColor={tokens.ashGray}
                      keyboardType="numeric"
                    />
                    <Text style={styles.unitSuffix}>g</Text>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Ionicons name="water-outline" size={16} color={tokens.ashGray} />
                  <TextInput
                    style={styles.input}
                    value={fat}
                    onChangeText={setFat}
                    placeholder="Healthy Fats"
                    placeholderTextColor={tokens.ashGray}
                    keyboardType="numeric"
                  />
                  <Text style={styles.unitSuffix}>g</Text>
                </View>

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
  },
  input: {
    flex: 1,
    color: tokens.inkBlack,
    fontSize: 14,
    fontWeight: '400',
  },
  unitSuffix: {
    color: tokens.warmGray,
    fontSize: 12,
    fontWeight: '400',
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
    color: tokens.ashGray,
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
    fontWeight: '400',
  },
  btnPrimary: {
    backgroundColor: tokens.cyanSignal,
    borderRadius: tokens.radiusPill,
    borderWidth: 1,
    borderColor: tokens.cyanEdge,
    height: 40,
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
