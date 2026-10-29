import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';

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

export default function BurnModal({
  visible,
  onClose,
  burnedCalories,
  onSave,
}) {
  const [val, setVal] = useState('');

  useEffect(() => {
    if (visible) {
      setVal(burnedCalories > 0 ? burnedCalories.toString() : '');
    }
  }, [visible, burnedCalories]);

  const handleSave = () => {
    onSave(parseFloat(val) || 0);
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
                <Text style={styles.title}>Log Active Burn</Text>
                <Text style={styles.sub}>
                  Enter estimated energy expenditure from training or cardio
                </Text>
              </View>

              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardContainer}
              >
                <Text style={styles.inputLabel}>Calories Burned</Text>
                <View style={styles.inputGroup}>
                  <Ionicons name="flame-outline" size={18} color={tokens.cyanEdge} />
                  <TextInput
                    style={styles.input}
                    value={val}
                    onChangeText={setVal}
                    placeholder="Active energy"
                    placeholderTextColor={tokens.ashGray}
                    keyboardType="numeric"
                    accessibilityLabel="Burned calories input"
                  />
                  <Text style={styles.unitSuffix}>kcal</Text>
                  {val.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setVal('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel="Clear burned calories"
                      accessibilityRole="button"
                    >
                      <Feather name="x" size={14} color={tokens.ashGray} />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.btnSecondary}
                    activeOpacity={0.8}
                    onPress={onClose}
                    accessibilityLabel="Cancel logging active burn"
                    accessibilityRole="button"
                  >
                    <Text style={styles.btnSecondaryText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnPrimary}
                    activeOpacity={0.88}
                    onPress={handleSave}
                    accessibilityLabel="Save burned calories"
                    accessibilityRole="button"
                  >
                    <Feather name="check" size={16} color="#ffffff" />
                    <Text style={styles.btnPrimaryText}>Log Activity</Text>
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
    marginBottom: 16,
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
    lineHeight: 18,
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
    marginBottom: 20,
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
    fontSize: 13,
    fontWeight: '600',
    color: tokens.warmGray,
    marginRight: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  btnPrimaryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
