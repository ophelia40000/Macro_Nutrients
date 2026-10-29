import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AddEntryModal from '../components/modals/AddEntryModal';
import PresetsModal from '../components/modals/PresetsModal';
import EditPresetModal from '../components/modals/EditPresetModal';

const tokens = {
  stoneCanvas: '#fafaf9',
  pureWhite: '#ffffff',
  stoneBorder: '#e8e6e5',
  stoneMuted: '#d6d3d1',
  ashGray: '#a8a29e',
  warmGray: '#78716c',
  inkBlack: '#0c0a09',
  soot: '#1c1917',
  skyWash: '#c1e1f7',
  cyanSignal: '#3ba6f1',
  cyanEdge: '#3398e1',
  surplusAlert: '#e54d2e',
  surplusWash: 'rgba(229, 77, 46, 0.1)',

  radiusCard: 10,
  radiusFeatureCard: 16,
  radiusPill: 9999,
  radiusInput: 6,
};

export default function DiaryScreen({
  goals = {},
  burnedCalories = 0,
  entries = [],
  setEntries,
  presets = [],
  setPresets,
  onNavigate,
}) {
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isEditPresetOpen, setIsEditPresetOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);

  const totalCal = entries.reduce((sum, item) => sum + (Number(item.calories) || 0), 0);
  const totalProt = entries.reduce((sum, item) => sum + (Number(item.protein) || 0), 0);
  const totalCarb = entries.reduce((sum, item) => sum + (Number(item.carbs) || 0), 0);
  const totalFat = entries.reduce((sum, item) => sum + (Number(item.fat) || 0), 0);

  const targetCalGoal = Number(goals.calories) || 2000;
  const targetProtGoal = Number(goals.protein) || 150;
  const targetCarbGoal = Number(goals.carbs) || 250;
  const targetFatGoal = Number(goals.fat) || 70;

  const calGoalTotal = targetCalGoal + (Number(burnedCalories) || 0);
  const remainingCal = calGoalTotal - totalCal;
  const isSurplus = remainingCal < 0;

  const calProg = Math.min(Math.max(totalCal / (calGoalTotal || 1), 0), 1);
  const protProg = Math.min(Math.max(totalProt / (targetProtGoal || 1), 0), 1);
  const carbProg = Math.min(Math.max(totalCarb / (targetCarbGoal || 1), 0), 1);
  const fatProg = Math.min(Math.max(totalFat / (targetFatGoal || 1), 0), 1);

  const proteinKcal = Math.round(totalProt * 4);
  const carbsKcal = Math.round(totalCarb * 4);
  const fatKcal = Math.round(totalFat * 9);

  const handleAddEntry = (entry) => {
    setEntries([entry, ...entries]);
  };

  const handleDeleteEntry = (index) => {
    const item = entries[index];
    if (!item) return;

    Alert.alert(
      'Remove Entry',
      `Delete "${item.name}" from today's ledger?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const next = [...entries];
            next.splice(index, 1);
            setEntries(next);
          },
        },
      ]
    );
  };

  const handleOpenEditPreset = (preset = null) => {
    setEditingPreset(preset);
    setIsEditPresetOpen(true);
  };

  const handleSavePreset = (presetData) => {
    if (editingPreset) {
      setPresets(
        presets.map((p) => (p === editingPreset || p.name === editingPreset.name ? presetData : p))
      );
    } else {
      setPresets([...presets, presetData]);
    }
    setIsEditPresetOpen(false);
    setEditingPreset(null);
  };

  const handleDeletePreset = (index) => {
    const preset = presets[index];
    if (!preset) return;

    Alert.alert(
      'Delete Preset',
      `Delete "${preset.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const next = [...presets];
            next.splice(index, 1);
            setPresets(next);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.viewContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={tokens.stoneCanvas} />

      <View style={styles.appHeader}>
        <View style={styles.headerLeftGroup}>
          <TouchableOpacity
            style={styles.headerCircleBtn}
            onPress={() => onNavigate('view-dashboard')}
            accessibilityLabel="Back to Dashboard"
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="arrow-left" size={18} color={tokens.inkBlack} />
          </TouchableOpacity>

          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerTitle}>Nutrition Diary</Text>
            <Text style={styles.headerSubtitle}>Daily intake ledger</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.headerCircleBtn}
          onPress={() => setIsPresetsOpen(true)}
          accessibilityLabel="Manage Meal Presets"
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="bookmark" size={18} color={tokens.inkBlack} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentScrollable}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroBudgetCard}>
          <View style={styles.budgetTopRow}>
            <Text style={styles.budgetKicker}>CALORIC BUDGET</Text>
            <View
              style={[
                styles.budgetStatusPill,
                isSurplus && styles.budgetSurplusPill,
              ]}
            >
              <Text
                style={[
                  styles.budgetStatusText,
                  isSurplus && styles.budgetSurplusText,
                ]}
              >
                {isSurplus
                  ? `Surplus: +${Math.round(Math.abs(remainingCal))} kcal`
                  : `Remaining: ${Math.round(remainingCal)} kcal`}
              </Text>
            </View>
          </View>

          <View style={styles.budgetKpiRow}>
            <Text style={styles.budgetKpiMain}>{Math.round(totalCal)}</Text>
            <Text style={styles.budgetKpiSub}>/ {Math.round(calGoalTotal)} kcal</Text>
          </View>

          <View style={styles.trackBackground}>
            <View
              style={[
                styles.trackFill,
                { width: `${calProg * 100}%` },
                isSurplus && { backgroundColor: tokens.surplusAlert },
              ]}
            />
          </View>

          <View style={styles.cardSeparator} />

          <View style={styles.macroDock}>
            <View style={styles.macroCol}>
              <View style={styles.macroColHeader}>
                <View style={[styles.macroDot, { backgroundColor: tokens.cyanSignal }]} />
                <Text style={styles.macroColLabel}>Protein</Text>
              </View>
              <Text style={styles.macroColValue}>
                {Math.round(totalProt)}
                <Text style={styles.macroColTarget}> / {targetProtGoal}g</Text>
              </Text>
              <View style={styles.miniTrackBg}>
                <View
                  style={[
                    styles.miniTrackFill,
                    {
                      width: `${protProg * 100}%`,
                      backgroundColor: tokens.cyanSignal,
                    },
                  ]}
                />
              </View>
              <Text style={styles.macroColKcal}>{proteinKcal} kcal</Text>
            </View>

            <View style={styles.colSeparator} />

            <View style={styles.macroCol}>
              <View style={styles.macroColHeader}>
                <View style={[styles.macroDot, { backgroundColor: tokens.warmGray }]} />
                <Text style={styles.macroColLabel}>Carbs</Text>
              </View>
              <Text style={styles.macroColValue}>
                {Math.round(totalCarb)}
                <Text style={styles.macroColTarget}> / {targetCarbGoal}g</Text>
              </Text>
              <View style={styles.miniTrackBg}>
                <View
                  style={[
                    styles.miniTrackFill,
                    {
                      width: `${carbProg * 100}%`,
                      backgroundColor: tokens.warmGray,
                    },
                  ]}
                />
              </View>
              <Text style={styles.macroColKcal}>{carbsKcal} kcal</Text>
            </View>

            <View style={styles.colSeparator} />

            <View style={styles.macroCol}>
              <View style={styles.macroColHeader}>
                <View style={[styles.macroDot, { backgroundColor: tokens.ashGray }]} />
                <Text style={styles.macroColLabel}>Fats</Text>
              </View>
              <Text style={styles.macroColValue}>
                {Math.round(totalFat)}
                <Text style={styles.macroColTarget}> / {targetFatGoal}g</Text>
              </Text>
              <View style={styles.miniTrackBg}>
                <View
                  style={[
                    styles.miniTrackFill,
                    {
                      width: `${fatProg * 100}%`,
                      backgroundColor: tokens.ashGray,
                    },
                  ]}
                />
              </View>
              <Text style={styles.macroColKcal}>{fatKcal} kcal</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recorded Meals</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {entries.length} {entries.length === 1 ? 'item' : 'items'}
            </Text>
          </View>
        </View>

        {entries.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconBox}>
              <MaterialCommunityIcons
                name="silverware-fork-knife"
                size={22}
                color={tokens.ashGray}
              />
            </View>
            <Text style={styles.emptyTitle}>No meals logged yet today</Text>
            <Text style={styles.emptySub}>
              Record breakfast, lunch, dinner or quick snacks to calibrate your nutrition balance.
            </Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={() => setIsAddEntryOpen(true)}
              accessibilityRole="button"
            >
              <Feather name="plus" size={14} color={tokens.inkBlack} />
              <Text style={styles.emptyAddBtnText}>Add First Meal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.foodListContainer}>
            {entries.map((entry, idx) => (
              <View key={entry.id || idx} style={styles.foodEntryCard}>
                <View style={styles.entryMainInfo}>
                  <Text style={styles.entryFoodName}>{entry.name}</Text>
                  <View style={styles.entryTelemetryRow}>
                    <Text style={styles.entryTelemetryItem}>
                      P <Text style={styles.entryTelemetryNum}>{Math.round(entry.protein || 0)}g</Text>
                    </Text>
                    <Text style={styles.entryTelemetryDot}>·</Text>
                    <Text style={styles.entryTelemetryItem}>
                      C <Text style={styles.entryTelemetryNum}>{Math.round(entry.carbs || 0)}g</Text>
                    </Text>
                    <Text style={styles.entryTelemetryDot}>·</Text>
                    <Text style={styles.entryTelemetryItem}>
                      F <Text style={styles.entryTelemetryNum}>{Math.round(entry.fat || 0)}g</Text>
                    </Text>
                  </View>
                </View>

                <View style={styles.entryRightGroup}>
                  <View style={styles.entryCalBadge}>
                    <Text style={styles.entryCalValue}>
                      {Math.round(entry.calories || 0)}
                    </Text>
                    <Text style={styles.entryCalUnit}>kcal</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.entryDeleteBtn}
                    onPress={() => handleDeleteEntry(idx)}
                    accessibilityLabel={`Delete ${entry.name}`}
                    accessibilityRole="button"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="trash-2" size={14} color={tokens.ashGray} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fabPill}
        activeOpacity={0.88}
        onPress={() => setIsAddEntryOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Log Food Entry"
      >
        <Feather name="plus" size={18} color="#ffffff" />
        <Text style={styles.fabPillText}>Log Food</Text>
      </TouchableOpacity>

      <AddEntryModal
        visible={isAddEntryOpen}
        onClose={() => setIsAddEntryOpen(false)}
        presets={presets}
        onAddEntry={handleAddEntry}
      />

      <PresetsModal
        visible={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        presets={presets}
        onOpenEditPreset={handleOpenEditPreset}
        onDeletePreset={handleDeletePreset}
      />

      <EditPresetModal
        visible={isEditPresetOpen}
        onClose={() => {
          setIsEditPresetOpen(false);
          setEditingPreset(null);
        }}
        preset={editingPreset}
        onSavePreset={handleSavePreset}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  viewContainer: {
    flex: 1,
    backgroundColor: tokens.stoneCanvas,
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 14 : 16,
    paddingBottom: 14,
    backgroundColor: tokens.stoneCanvas,
    borderBottomWidth: 1,
    borderBottomColor: tokens.stoneBorder,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: tokens.pureWhite,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleBlock: {
    gap: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: tokens.inkBlack,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: tokens.warmGray,
  },
  contentScrollable: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
    gap: 20,
  },
  heroBudgetCard: {
    backgroundColor: tokens.pureWhite,
    borderRadius: tokens.radiusFeatureCard,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    padding: 18,
    gap: 12,
  },
  budgetTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetKicker: {
    fontSize: 11,
    fontWeight: '600',
    color: tokens.ashGray,
    letterSpacing: 0.5,
  },
  budgetStatusPill: {
    backgroundColor: tokens.stoneCanvas,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: tokens.radiusPill,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
  },
  budgetSurplusPill: {
    backgroundColor: tokens.surplusWash,
    borderColor: 'rgba(229, 77, 46, 0.25)',
  },
  budgetStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: tokens.warmGray,
  },
  budgetSurplusText: {
    color: tokens.surplusAlert,
  },
  budgetKpiRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  budgetKpiMain: {
    fontSize: 32,
    fontWeight: '700',
    color: tokens.inkBlack,
    letterSpacing: -0.8,
  },
  budgetKpiSub: {
    fontSize: 14,
    color: tokens.warmGray,
    fontWeight: '500',
  },
  trackBackground: {
    width: '100%',
    height: 6,
    backgroundColor: tokens.stoneCanvas,
    borderRadius: tokens.radiusPill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
  },
  trackFill: {
    height: '100%',
    backgroundColor: tokens.inkBlack,
    borderRadius: tokens.radiusPill,
  },
  cardSeparator: {
    height: 1,
    backgroundColor: tokens.stoneBorder,
    marginVertical: 4,
  },
  macroDock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 4,
  },
  macroCol: {
    flex: 1,
    gap: 4,
  },
  macroColHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  macroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  macroColLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: tokens.ashGray,
  },
  macroColValue: {
    fontSize: 14,
    fontWeight: '700',
    color: tokens.inkBlack,
  },
  macroColTarget: {
    fontSize: 11,
    fontWeight: '500',
    color: tokens.warmGray,
  },
  miniTrackBg: {
    width: '100%',
    height: 3,
    backgroundColor: tokens.stoneCanvas,
    borderRadius: tokens.radiusPill,
    overflow: 'hidden',
    marginTop: 2,
  },
  miniTrackFill: {
    height: '100%',
    borderRadius: tokens.radiusPill,
  },
  macroColKcal: {
    fontSize: 11,
    color: tokens.ashGray,
    marginTop: 1,
  },
  colSeparator: {
    width: 1,
    height: '80%',
    backgroundColor: tokens.stoneBorder,
    marginHorizontal: 10,
    alignSelf: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: tokens.inkBlack,
    letterSpacing: -0.2,
  },
  countBadge: {
    backgroundColor: tokens.pureWhite,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: tokens.radiusPill,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: tokens.warmGray,
  },
  emptyCard: {
    backgroundColor: tokens.pureWhite,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    borderRadius: tokens.radiusFeatureCard,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 10,
  },
  emptyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: tokens.stoneCanvas,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: tokens.inkBlack,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: tokens.warmGray,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: tokens.stoneCanvas,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    borderRadius: tokens.radiusPill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 8,
  },
  emptyAddBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.inkBlack,
  },
  foodListContainer: {
    gap: 10,
  },
  foodEntryCard: {
    backgroundColor: tokens.pureWhite,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    borderRadius: tokens.radiusCard,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryMainInfo: {
    flex: 1,
    gap: 4,
    marginRight: 12,
  },
  entryFoodName: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.inkBlack,
  },
  entryTelemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  entryTelemetryItem: {
    fontSize: 12,
    color: tokens.warmGray,
  },
  entryTelemetryNum: {
    fontWeight: '600',
    color: tokens.inkBlack,
  },
  entryTelemetryDot: {
    fontSize: 12,
    color: tokens.stoneMuted,
  },
  entryRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  entryCalBadge: {
    alignItems: 'flex-end',
  },
  entryCalValue: {
    fontSize: 15,
    fontWeight: '700',
    color: tokens.inkBlack,
  },
  entryCalUnit: {
    fontSize: 10,
    color: tokens.ashGray,
    marginTop: -2,
  },
  entryDeleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: tokens.stoneCanvas,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabPill: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 32 : 24,
    right: 20,
    backgroundColor: tokens.cyanSignal,
    borderRadius: tokens.radiusPill,
    height: 48,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#0c0a09',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  fabPillText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
