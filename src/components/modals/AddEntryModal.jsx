import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
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
  soot: '#1c1917',
  skyWash: '#e0f2fe',
  cyanSignal: '#0369a1',
  cyanEdge: '#0369a1',

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

export default function AddEntryModal({
  visible,
  onClose,
  presets = [],
  onAddEntry,
}) {
  const [tab, setTab] = useState('preset');
  const [search, setSearch] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [weight, setWeight] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const [name, setName] = useState('');
  const [cal, setCal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useModalEscape(visible, onClose);

  useEffect(() => {
    if (visible) {
      setErrorMsg('');
      if (presets.length === 0) {
        setSelectedPreset(null);
        setSearch('');
      } else if (!selectedPreset || !presets.some((p) => p.name === selectedPreset.name)) {
        setSelectedPreset(presets[0]);
        setSearch(presets[0].name);
      }
    } else {
      setShowDropdown(false);
    }
  }, [visible, presets]);

  const weightPreviewRes = parseNumericInput(weight, { allowEmpty: true, emptyValue: 0, min: 0 });
  const factor = (weightPreviewRes.valid ? weightPreviewRes.value : 0) / 100;
  const previewCal = selectedPreset ? (selectedPreset.calories * factor).toFixed(1) : '0.0';
  const previewProt = selectedPreset ? (selectedPreset.protein * factor).toFixed(1) : '0.0';
  const previewCarbs = selectedPreset ? (selectedPreset.carbs * factor).toFixed(1) : '0.0';
  const previewFat = selectedPreset ? (selectedPreset.fat * factor).toFixed(1) : '0.0';

  const handleAdd = () => {
    const today = getLocalDateStr();
    if (tab === 'manual') {
      if (!name.trim()) {
        setErrorMsg('Enter a food name.');
        return;
      }
      const calRes = parseNumericInput(cal, { allowEmpty: true, emptyValue: 0, min: 0 });
      const protRes = parseNumericInput(protein, { allowEmpty: true, emptyValue: 0, min: 0 });
      const carbRes = parseNumericInput(carbs, { allowEmpty: true, emptyValue: 0, min: 0 });
      const fatRes = parseNumericInput(fat, { allowEmpty: true, emptyValue: 0, min: 0 });
      if (!calRes.valid || !protRes.valid || !carbRes.valid || !fatRes.valid) {
        setErrorMsg('Calories and macronutrients must be 0 or positive numbers.');
        return;
      }

      onAddEntry({
        id: Date.now().toString(),
        name: name.trim(),
        calories: calRes.value,
        protein: protRes.value,
        carbs: carbRes.value,
        fat: fatRes.value,
        date: today,
      });
    } else {
      if (!selectedPreset) {
        setErrorMsg(
          presets.length === 0
            ? 'No presets saved yet. Switch to Manual or add a preset first.'
            : 'Select a food preset.'
        );
        return;
      }
      const wRes = parseNumericInput(weight, { allowEmpty: true, emptyValue: 100, min: 0.1, allowZero: false });
      if (!wRes.valid) {
        setErrorMsg('Enter a valid portion weight greater than 0g.');
        return;
      }
      const w = wRes.value;
      const f = w / 100;
      onAddEntry({
        id: Date.now().toString(),
        name: `${selectedPreset.name} (${w}g)`,
        calories: selectedPreset.calories * f,
        protein: selectedPreset.protein * f,
        carbs: selectedPreset.carbs * f,
        fat: selectedPreset.fat * f,
        date: today,
      });
    }

    setName('');
    setCal('');
    setProtein('');
    setCarbs('');
    setFat('');
    setWeight('');
    setErrorMsg('');
    onClose();
  };

  const filteredPresets = presets.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
            <View style={styles.dialogBox}>
              <View style={styles.dialogHeader}>
                <Text style={styles.dialogTitle}>Add Food Entry</Text>
                <Text style={styles.dialogSubtitle}>Preset selection or custom macronutrient log</Text>
              </View>

              <View style={styles.tabsContainer}>
                <TouchableOpacity
                  style={[styles.tabBtn, tab === 'preset' && styles.tabBtnActive]}
                  activeOpacity={0.8}
                  onPress={() => { setTab('preset'); setErrorMsg(''); }}
                  accessibilityLabel="Preset Mode"
                  accessibilityRole="button"
                >
                  <Feather
                    name="list"
                    size={14}
                    color={tab === 'preset' ? tokens.inkBlack : tokens.warmGray}
                  />
                  <Text
                    style={[
                      styles.tabBtnText,
                      tab === 'preset' && styles.tabBtnTextActive,
                    ]}
                  >
                    Preset
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabBtn, tab === 'manual' && styles.tabBtnActive]}
                  activeOpacity={0.8}
                  onPress={() => { setTab('manual'); setErrorMsg(''); }}
                  accessibilityLabel="Manual Mode"
                  accessibilityRole="button"
                >
                  <Feather
                    name="edit-3"
                    size={14}
                    color={tab === 'manual' ? tokens.inkBlack : tokens.warmGray}
                  />
                  <Text
                    style={[
                      styles.tabBtnText,
                      tab === 'manual' && styles.tabBtnTextActive,
                    ]}
                  >
                    Manual
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ maxHeight: 360 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {tab === 'preset' ? (
                  <View>
                    <View style={styles.searchWrapper}>
                      <View style={styles.inputGroup}>
                        <Feather name="search" size={16} color={tokens.ashGray} />
                        <TextInput
                          style={styles.input}
                          value={search}
                          onChangeText={(text) => {
                            setSearch(text);
                            setShowDropdown(true);
                          }}
                          onFocus={() => setShowDropdown(true)}
                          placeholder="Search food presets"
                          placeholderTextColor={tokens.ashGray}
                        />
                      </View>

                      {showDropdown && filteredPresets.length > 0 && (
                        <View style={styles.autocompleteDropdown}>
                          <ScrollView
                            style={{ maxHeight: 150 }}
                            nestedScrollEnabled
                            keyboardShouldPersistTaps="handled"
                          >
                            {filteredPresets.map((item, idx) => (
                              <TouchableOpacity
                                key={idx}
                                style={styles.autocompleteItem}
                                onPress={() => {
                                  setSelectedPreset(item);
                                  setSearch(item.name);
                                  setShowDropdown(false);
                                }}
                              >
                                <Text style={styles.autocompleteText}>{item.name}</Text>
                                <Text style={styles.autocompleteMeta}>{item.calories} kcal</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    </View>

                    <View style={styles.inputGroup}>
                      <MaterialCommunityIcons
                        name="scale-bathroom"
                        size={16}
                        color={tokens.warmGray}
                      />
                      <TextInput
                        style={styles.input}
                        value={weight}
                        onChangeText={(v) => { setWeight(v); setErrorMsg(''); }}
                        placeholder="Portion weight"
                        placeholderTextColor={tokens.ashGray}
                        keyboardType="decimal-pad"
                        accessibilityLabel="Portion weight in grams"
                      />
                      <Text style={styles.unitSuffix}>g</Text>
                    </View>

                    {presets.length === 0 && (
                      <Text style={styles.emptyPresetHint}>
                        No presets saved yet. Switch to Manual or create one from Presets.
                      </Text>
                    )}

                    <View style={styles.previewBox}>
                      <View style={styles.previewTitle}>
                        <Feather name="pie-chart" size={14} color={tokens.cyanEdge} />
                        <Text style={styles.previewTitleText}>Portion Telemetry</Text>
                      </View>
                      <View style={styles.previewRow}>
                        <Text style={styles.previewLabel}>Energy</Text>
                        <Text style={styles.previewValLarge}>{previewCal} kcal</Text>
                      </View>
                      <View style={styles.previewRow}>
                        <Text style={styles.previewLabel}>Macro Split</Text>
                        <Text style={styles.previewVal}>
                          P: {previewProt}g · C: {previewCarbs}g · F: {previewFat}g
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View>
                    <View style={styles.inputGroup}>
                      <Feather name="type" size={16} color={tokens.warmGray} />
                      <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={(v) => { setName(v); setErrorMsg(''); }}
                        placeholder="Food name"
                        placeholderTextColor={tokens.ashGray}
                        accessibilityLabel="Food name"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Ionicons name="flame-outline" size={16} color={tokens.warmGray} />
                      <TextInput
                        style={styles.input}
                        value={cal}
                        onChangeText={(v) => { setCal(v); setErrorMsg(''); }}
                        placeholder="Energy value"
                        placeholderTextColor={tokens.ashGray}
                        keyboardType="decimal-pad"
                        accessibilityLabel="Energy value in kcal"
                      />
                      <Text style={styles.unitSuffix}>kcal</Text>
                    </View>

                    <View style={styles.inputRow}>
                      <View style={[styles.inputGroup, { flex: 1, minWidth: 0 }]}>
                        <MaterialCommunityIcons
                          name="food-drumstick"
                          size={16}
                          color={tokens.cyanEdge}
                        />
                        <TextInput
                          style={styles.input}
                          value={protein}
                          onChangeText={(v) => { setProtein(v); setErrorMsg(''); }}
                          placeholder="Protein"
                          placeholderTextColor={tokens.ashGray}
                          keyboardType="decimal-pad"
                          accessibilityLabel="Protein in grams"
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
                          accessibilityLabel="Carbs in grams"
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
                        placeholder="Healthy Fats"
                        placeholderTextColor={tokens.ashGray}
                        keyboardType="decimal-pad"
                        accessibilityLabel="Healthy fats in grams"
                      />
                      <Text style={styles.unitSuffix}>g</Text>
                    </View>
                  </View>
                )}

                <FormErrorBanner message={errorMsg} />
              </ScrollView>

              <View style={styles.dialogActions}>
                <TouchableOpacity
                  style={styles.btnCancel}
                  onPress={onClose}
                  accessibilityLabel="Cancel"
                  accessibilityRole="button"
                >
                  <Text style={styles.btnCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnAdd}
                  onPress={handleAdd}
                  accessibilityLabel="Add Entry to Diary"
                  accessibilityRole="button"
                >
                  <Feather name="plus" size={16} color="#ffffff" />
                  <Text style={styles.btnAddText}>Add Entry</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialogBox: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: tokens.pureWhite,
    borderRadius: tokens.radiusFeatureCard,
    padding: 20,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  dialogHeader: {
    marginBottom: 14,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: tokens.inkBlack,
    letterSpacing: -0.3,
  },
  dialogSubtitle: {
    fontSize: 12,
    color: tokens.warmGray,
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: tokens.stoneCanvas,
    padding: 3,
    borderRadius: tokens.radiusPill,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: tokens.radiusPill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: tokens.pureWhite,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  tabBtnText: {
    color: tokens.warmGray,
    fontSize: 13,
    fontWeight: '500',
  },
  tabBtnTextActive: {
    color: tokens.inkBlack,
    fontWeight: '500',
  },
  searchWrapper: {
    position: 'relative',
    zIndex: 10,
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
    fontSize: 14,
    fontWeight: '400',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  unitSuffix: {
    color: tokens.warmGray,
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 0,
  },
  emptyPresetHint: {
    fontSize: 12,
    lineHeight: 17,
    color: tokens.warmGray,
    marginBottom: 10,
  },
  autocompleteDropdown: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: tokens.pureWhite,
    borderRadius: tokens.radiusCard,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    zIndex: 99,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  autocompleteItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: tokens.stoneCanvas,
  },
  autocompleteText: {
    color: tokens.inkBlack,
    fontSize: 14,
    fontWeight: '400',
  },
  autocompleteMeta: {
    color: tokens.warmGray,
    fontSize: 12,
    fontWeight: '400',
  },
  previewBox: {
    backgroundColor: tokens.stoneCanvas,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    borderRadius: tokens.radiusCard,
    padding: 14,
    gap: 8,
    marginBottom: 12,
  },
  previewTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  previewTitleText: {
    color: tokens.cyanEdge,
    fontWeight: '500',
    fontSize: 12,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewLabel: {
    color: tokens.warmGray,
    fontSize: 12,
    fontWeight: '400',
  },
  previewValLarge: {
    color: tokens.inkBlack,
    fontSize: 15,
    fontWeight: '500',
  },
  previewVal: {
    color: tokens.inkBlack,
    fontSize: 12,
    fontWeight: '400',
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: tokens.stoneCanvas,
  },
  btnCancel: {
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: tokens.radiusPill,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    backgroundColor: 'transparent',
  },
  btnCancelText: {
    color: tokens.inkBlack,
    fontSize: 13,
    fontWeight: '500',
  },
  btnAdd: {
    backgroundColor: tokens.cyanSignal,
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: tokens.radiusPill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: tokens.cyanEdge,
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
  btnAddText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
  },
});
