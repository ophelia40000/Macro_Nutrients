import React, { useState } from 'react';
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
} from 'react-native';
import { Feather } from '@expo/vector-icons';

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
  negativeRed: '#e54d2e',
  negativeWash: 'rgba(229, 77, 46, 0.08)',

  radiusCard: 10,
  radiusFeatureCard: 16,
  radiusPill: 9999,
  radiusInput: 6,
};

export default function PresetsModal({
  visible,
  onClose,
  presets = [],
  onOpenEditPreset,
  onDeletePreset,
}) {
  const [search, setSearch] = useState('');

  const filtered = presets.filter((p) =>
    (p.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.bottomSheet}>
              <View style={styles.dragHandle} />

              <View style={styles.headerRow}>
                <View style={styles.headerTitleGroup}>
                  <Text style={styles.title}>Nutrition Presets</Text>
                  <Text style={styles.sub}>Quick-add food templates</Text>
                </View>

                <TouchableOpacity
                  style={styles.btnAddPreset}
                  activeOpacity={0.88}
                  onPress={() => onOpenEditPreset(null)}
                  accessibilityLabel="Create new nutrition preset"
                  accessibilityRole="button"
                >
                  <Feather name="plus" size={14} color="#ffffff" />
                  <Text style={styles.btnAddPresetText}>New</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Feather name="search" size={16} color={tokens.ashGray} />
                <TextInput
                  style={styles.input}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search presets by name..."
                  placeholderTextColor={tokens.ashGray}
                  accessibilityLabel="Search presets"
                />
                {search.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearch('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Clear search input"
                    accessibilityRole="button"
                  >
                    <Feather name="x" size={14} color={tokens.ashGray} />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView
                style={styles.presetList}
                showsVerticalScrollIndicator={false}
              >
                {filtered.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No presets match your search.</Text>
                  </View>
                ) : (
                  filtered.map((p, idx) => {
                    const originalIdx = presets.indexOf(p);
                    const cal = Number(p.calories || 0).toFixed(0);
                    const prot = Number(p.protein || 0).toFixed(0);
                    const carbs = Number(p.carbs || 0).toFixed(0);
                    const fat = Number(p.fat || 0).toFixed(0);

                    return (
                      <View key={idx} style={styles.presetCard}>
                        <View style={styles.presetInfo}>
                          <Text style={styles.presetName}>{p.name}</Text>
                          <Text style={styles.presetMacros}>
                            <Text style={styles.presetCal}>{cal} kcal</Text>
                            {' · '}P: {prot}g · C: {carbs}g · F: {fat}g
                          </Text>
                        </View>

                        <View style={styles.presetActions}>
                          <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => onOpenEditPreset(p)}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            accessibilityLabel={`Edit ${p.name}`}
                            accessibilityRole="button"
                          >
                            <Feather name="edit-2" size={15} color={tokens.cyanEdge} />
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => onDeletePreset(originalIdx)}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            accessibilityLabel={`Delete ${p.name}`}
                            accessibilityRole="button"
                          >
                            <Feather name="trash-2" size={15} color={tokens.ashGray} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.btnClose}
                  activeOpacity={0.8}
                  onPress={onClose}
                  accessibilityLabel="Close presets modal"
                  accessibilityRole="button"
                >
                  <Text style={styles.btnCloseText}>Close</Text>
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
    maxHeight: '85%',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitleGroup: {
    gap: 2,
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
  },
  btnAddPreset: {
    backgroundColor: tokens.cyanSignal,
    borderRadius: tokens.radiusPill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  btnAddPresetText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
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
  presetList: {
    maxHeight: 340,
    marginBottom: 14,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: tokens.warmGray,
  },
  presetCard: {
    backgroundColor: tokens.pureWhite,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    borderRadius: tokens.radiusCard,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  presetInfo: {
    flex: 1,
    gap: 3,
    marginRight: 10,
  },
  presetName: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.inkBlack,
  },
  presetMacros: {
    fontSize: 12,
    color: tokens.warmGray,
  },
  presetCal: {
    color: tokens.inkBlack,
    fontWeight: '600',
  },
  presetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: tokens.stoneCanvas,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionRow: {
    marginTop: 4,
  },
  btnClose: {
    width: '100%',
    height: 44,
    backgroundColor: tokens.stoneCanvas,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    borderRadius: tokens.radiusPill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCloseText: {
    color: tokens.warmGray,
    fontSize: 14,
    fontWeight: '600',
  },
});
