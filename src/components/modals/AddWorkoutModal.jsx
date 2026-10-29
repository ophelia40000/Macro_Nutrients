import React, { useState } from 'react';
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
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

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

export default function AddWorkoutModal({
  visible,
  onClose,
  onSave,
  existingRegions = [],
}) {
  const [region, setRegion] = useState('');
  const [name, setName] = useState('');

  const handleContinue = () => {
    if (!name.trim()) return;
    onSave({
      region: region.trim() || 'Uncategorized',
      name: name.trim(),
    });
    setRegion('');
    setName('');
  };

  const handleSelectRegion = (selectedRegion) => {
    if (region.toLowerCase() === selectedRegion.toLowerCase()) {
      setRegion('');
    } else {
      setRegion(selectedRegion);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.bottomSheet}>
              <View style={styles.dragHandle} />

              <View style={styles.headerRow}>
                <Text style={styles.title}>New Exercise</Text>
                <Text style={styles.sub}>
                  Add a movement category to your progressive overload ledger
                </Text>
              </View>

              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardContainer}
              >
                <Text style={styles.inputLabel}>Muscle Region</Text>
                <View style={styles.inputGroup}>
                  <Feather name="folder" size={16} color={tokens.ashGray} />
                  <TextInput
                    style={styles.input}
                    value={region}
                    onChangeText={setRegion}
                    placeholder="Region (e.g. Chest, Back, Legs)"
                    placeholderTextColor={tokens.ashGray}
                    accessibilityLabel="Muscle Region Input"
                  />
                  {region.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setRegion('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel="Clear region input"
                      accessibilityRole="button"
                    >
                      <Feather name="x" size={14} color={tokens.ashGray} />
                    </TouchableOpacity>
                  )}
                </View>

                {existingRegions.length > 0 && (
                  <View style={styles.chipsSection}>
                    <Text style={styles.chipsLabel}>Existing Splits</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.chipsRow}
                    >
                      {existingRegions.map((r, i) => {
                        const isSelected = region.toLowerCase() === r.toLowerCase();
                        return (
                          <TouchableOpacity
                            key={i}
                            style={[
                              styles.chip,
                              isSelected && styles.chipActive,
                            ]}
                            activeOpacity={0.8}
                            onPress={() => handleSelectRegion(r)}
                            accessibilityLabel={`Select region ${r}`}
                            accessibilityRole="button"
                          >
                            <Text
                              style={[
                                styles.chipText,
                                isSelected && styles.chipTextActive,
                              ]}
                            >
                              {r}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                <Text style={styles.inputLabel}>Exercise Name</Text>
                <View style={styles.inputGroup}>
                  <MaterialCommunityIcons
                    name="dumbbell"
                    size={16}
                    color={name.trim().length > 0 ? tokens.cyanEdge : tokens.ashGray}
                  />
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Movement (e.g. Incline Dumbbell Press)"
                    placeholderTextColor={tokens.ashGray}
                    accessibilityLabel="Exercise Name Input"
                  />
                  {name.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setName('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel="Clear exercise name input"
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
                    accessibilityLabel="Cancel adding exercise"
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
                    onPress={handleContinue}
                    disabled={!name.trim()}
                    accessibilityLabel="Add Exercise"
                    accessibilityRole="button"
                  >
                    <Feather name="plus" size={16} color="#ffffff" />
                    <Text style={styles.btnPrimaryText}>Add Exercise</Text>
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
    marginBottom: 14,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
  },
  input: {
    flex: 1,
    color: tokens.inkBlack,
    fontSize: 14,
    fontWeight: '400',
  },
  chipsSection: {
    marginBottom: 14,
    marginTop: -4,
  },
  chipsLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: tokens.ashGray,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  chipsRow: {
    gap: 6,
    paddingVertical: 2,
  },
  chip: {
    backgroundColor: tokens.stoneCanvas,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: tokens.radiusPill,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
  },
  chipActive: {
    backgroundColor: tokens.cyanSignal,
    borderColor: tokens.cyanEdge,
  },
  chipText: {
    color: tokens.warmGray,
    fontSize: 12,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
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
    opacity: 0.5,
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
