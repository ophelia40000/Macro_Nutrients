import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
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
  negativeRed: '#c8371d',
  negativeWash: 'rgba(200, 55, 29, 0.08)',

  radiusCard: 10,
  radiusFeatureCard: 16,
  radiusPill: 9999,
  radiusInput: 6,
};

function getLocalDateStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function ExerciseSetsModal({
  visible,
  onClose,
  exercise,
  onSaveSets,
}) {
  const [globalWeight, setGlobalWeight] = useState('');
  const [sets, setSets] = useState([{ weight: '', reps: '' }]);
  const [errorMsg, setErrorMsg] = useState('');

  useModalEscape(visible, onClose);

  useEffect(() => {
    if (visible && exercise) {
      setErrorMsg('');
      const today = getLocalDateStr();
      const todayEntry = exercise.history?.find((h) => h.date === today);
      const lastEntry = exercise.history?.length
        ? exercise.history[exercise.history.length - 1]
        : null;

      if (todayEntry && todayEntry.sets && todayEntry.sets.length > 0) {
        setSets(todayEntry.sets.map((s) => ({ weight: s.weight, reps: s.reps })));
        setGlobalWeight(todayEntry.sets[0]?.weight !== undefined ? todayEntry.sets[0].weight.toString() : '');
      } else if (lastEntry && lastEntry.sets && lastEntry.sets.length > 0) {
        setSets(lastEntry.sets.map((s) => ({ weight: s.weight, reps: s.reps })));
        setGlobalWeight(lastEntry.sets[0]?.weight !== undefined ? lastEntry.sets[0].weight.toString() : '');
      } else {
        setSets([{ weight: '', reps: '' }]);
        setGlobalWeight('');
      }
    }
  }, [visible, exercise]);

  const handleGlobalWeightChange = (val) => {
    setGlobalWeight(val);
    setErrorMsg('');
    setSets(sets.map((s) => ({ ...s, weight: val })));
  };

  const handleRepsChange = (index, val) => {
    setErrorMsg('');
    const next = [...sets];
    next[index] = { ...next[index], reps: val };
    setSets(next);
  };

  const handleAddSet = () => {
    setErrorMsg('');
    const lastSet = sets[sets.length - 1] || { weight: globalWeight, reps: '' };
    setSets([...sets, { weight: lastSet.weight || globalWeight, reps: lastSet.reps }]);
  };

  const handleDeleteSet = (index) => {
    setErrorMsg('');
    if (sets.length === 1) {
      setSets([{ weight: globalWeight, reps: '' }]);
      return;
    }
    const next = [...sets];
    next.splice(index, 1);
    setSets(next);
  };

  const handleSave = () => {
    const gWeightRes = parseNumericInput(globalWeight, {
      allowEmpty: true,
      emptyValue: 0,
      min: 0,
    });
    if (!gWeightRes.valid) {
      setErrorMsg('Weight load must be 0 or a positive number.');
      return;
    }

    const parsedSets = [];
    for (let i = 0; i < sets.length; i += 1) {
      const repRes = parseNumericInput(sets[i].reps, {
        allowEmpty: true,
        emptyValue: 0,
        min: 0,
        integer: true,
      });
      if (!repRes.valid) {
        setErrorMsg(`Set #${i + 1} reps must be a whole number of 0 or more.`);
        return;
      }
      if (repRes.value > 0) {
        parsedSets.push({
          weight: gWeightRes.value,
          reps: repRes.value,
        });
      }
    }

    if (parsedSets.length === 0) {
      setErrorMsg('Enter at least 1 repetition for a set before saving.');
      return;
    }

    setErrorMsg('');
    onSaveSets(exercise.id, parsedSets);
    onClose();
  };

  if (!visible || !exercise) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.bottomSheet}>
              <View style={styles.dragHandle} />

              <View style={styles.headerRow}>
                <Text style={styles.title}>{exercise?.name || 'Exercise Sets'}</Text>
                <Text style={styles.sub}>
                  Record load weight and progressive set repetitions
                </Text>
              </View>

              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardContainer}
              >
                <Text style={styles.sectionLabel}>Universal Set Load</Text>
                <View style={styles.inputGroup}>
                  <MaterialCommunityIcons
                    name="scale-bathroom"
                    size={16}
                    color={tokens.cyanEdge}
                  />
                  <TextInput
                    style={styles.input}
                    value={globalWeight}
                    onChangeText={handleGlobalWeightChange}
                    placeholder="Load for all sets"
                    placeholderTextColor={tokens.ashGray}
                    keyboardType="numeric"
                    accessibilityLabel="Universal weight load input"
                  />
                  <Text style={styles.unitSuffix}>kg</Text>
                </View>

                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderTitle, { width: 55, textAlign: 'left' }]}>
                    SET
                  </Text>
                  <Text style={[styles.tableHeaderTitle, { flex: 1, textAlign: 'center' }]}>
                    REPS
                  </Text>
                  <View style={{ width: 36 }} />
                </View>

                <ScrollView
                  style={styles.setsScrollView}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {sets.map((s, idx) => (
                    <View key={idx} style={styles.setRow}>
                      <View style={styles.setNumberBadge}>
                        <Text style={styles.setNumber}>#{idx + 1}</Text>
                      </View>

                      <View style={styles.repsInputGroup}>
                        <TextInput
                          style={styles.repsInput}
                          value={s.reps ? s.reps.toString() : ''}
                          onChangeText={(val) => handleRepsChange(idx, val)}
                          placeholder="0"
                          placeholderTextColor={tokens.ashGray}
                          keyboardType="numeric"
                          accessibilityLabel={`Set ${idx + 1} reps input`}
                        />
                      </View>

                      <TouchableOpacity
                        style={styles.btnDeleteSet}
                        onPress={() => handleDeleteSet(idx)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel={`Delete set ${idx + 1}`}
                        accessibilityRole="button"
                      >
                        <Feather name="trash-2" size={15} color={tokens.ashGray} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={styles.btnAddSet}
                  activeOpacity={0.8}
                  onPress={handleAddSet}
                  accessibilityLabel="Add another set"
                  accessibilityRole="button"
                >
                  <Feather name="plus" size={14} color={tokens.inkBlack} />
                  <Text style={styles.btnAddSetText}>Add Next Set</Text>
                </TouchableOpacity>

                <FormErrorBanner message={errorMsg} />

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.btnSecondary}
                    activeOpacity={0.8}
                    onPress={onClose}
                    accessibilityLabel="Cancel sets recording"
                    accessibilityRole="button"
                  >
                    <Text style={styles.btnSecondaryText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnPrimary}
                    activeOpacity={0.88}
                    onPress={handleSave}
                    accessibilityLabel="Save exercise sets"
                    accessibilityRole="button"
                  >
                    <Feather name="check" size={16} color="#ffffff" />
                    <Text style={styles.btnPrimaryText}>Save Sets</Text>
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
    lineHeight: 18,
  },
  keyboardContainer: {
    width: '100%',
  },
  sectionLabel: {
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: tokens.inkBlack,
    fontSize: 14,
    fontWeight: '400',
  },
  unitSuffix: {
    fontSize: 13,
    fontWeight: '600',
    color: tokens.warmGray,
    flexShrink: 0,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: tokens.stoneBorder,
  },
  tableHeaderTitle: {
    color: tokens.warmGray,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  setsScrollView: {
    maxHeight: 220,
    marginBottom: 10,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  setNumberBadge: {
    width: 55,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: tokens.radiusInput,
    backgroundColor: tokens.stoneCanvas,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    alignItems: 'center',
  },
  setNumber: {
    fontWeight: '700',
    color: tokens.inkBlack,
    fontSize: 12,
  },
  repsInputGroup: {
    flex: 1,
    backgroundColor: tokens.pureWhite,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    borderRadius: tokens.radiusInput,
    height: 40,
    justifyContent: 'center',
  },
  repsInput: {
    textAlign: 'center',
    color: tokens.inkBlack,
    fontSize: 15,
    fontWeight: '700',
  },
  btnDeleteSet: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: tokens.stoneCanvas,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnAddSet: {
    backgroundColor: tokens.stoneCanvas,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    borderRadius: tokens.radiusPill,
    minHeight: 44,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  btnAddSetText: {
    color: tokens.inkBlack,
    fontSize: 13,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
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
