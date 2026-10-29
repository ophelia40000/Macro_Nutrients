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
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AddWorkoutModal from '../components/modals/AddWorkoutModal';
import ExerciseSetsModal from '../components/modals/ExerciseSetsModal';

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
  positiveGreen: '#059669',
  positiveWash: 'rgba(5, 150, 105, 0.08)',
  negativeRed: '#e54d2e',
  negativeWash: 'rgba(229, 77, 46, 0.08)',

  radiusCard: 10,
  radiusFeatureCard: 16,
  radiusPill: 9999,
  radiusInput: 6,
};

export default function ExerciseScreen({ workouts = [], setWorkouts, onNavigate }) {
  const [isAddWorkoutOpen, setIsAddWorkoutOpen] = useState(false);
  const [activeExercise, setActiveExercise] = useState(null);
  const [isSetsModalOpen, setIsSetsModalOpen] = useState(false);
  const [isFabHomeState, setIsFabHomeState] = useState(false);

  const handleFabPress = () => {
    if (isFabHomeState) {
      setIsFabHomeState(false);
      onNavigate('view-dashboard');
    } else {
      setIsAddWorkoutOpen(true);
    }
  };

  const handleFabLongPress = () => {
    setIsFabHomeState((prev) => !prev);
  };

  const handleAddWorkout = (workoutData) => {
    const newWorkout = {
      id: 'ex_' + Date.now(),
      name: workoutData.name,
      region: workoutData.region || 'Uncategorized',
      history: [],
    };
    setWorkouts([newWorkout, ...workouts]);
    setIsAddWorkoutOpen(false);

    setTimeout(() => {
      setActiveExercise(newWorkout);
      setIsSetsModalOpen(true);
    }, 300);
  };

  const handleOpenSets = (ex) => {
    setActiveExercise(ex);
    setIsSetsModalOpen(true);
  };

  const handleSaveSets = (exerciseId, todaySets) => {
    const today = new Date().toISOString().split('T')[0];
    setWorkouts(
      workouts.map((w) => {
        if (w.id !== exerciseId) return w;
        const historyCopy = [...(w.history || [])];
        const existingIndex = historyCopy.findIndex((h) => h.date === today);
        if (existingIndex >= 0) {
          historyCopy[existingIndex] = { date: today, sets: todaySets };
        } else {
          historyCopy.push({ date: today, sets: todaySets });
        }
        return { ...w, history: historyCopy };
      })
    );
  };

  const handleDeleteExercise = (ex) => {
    Alert.alert(
      'Remove Exercise',
      `Delete "${ex.name}" and all historical log records?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setWorkouts(workouts.filter((w) => w.id !== ex.id));
          },
        },
      ]
    );
  };

  const grouped = {};
  workouts.forEach((ex) => {
    const reg = ex.region || 'Uncategorized';
    if (!grouped[reg]) grouped[reg] = [];
    grouped[reg].push(ex);
  });

  const totalExercises = workouts.length;
  const totalRegions = Object.keys(grouped).length;
  let totalSetsLogged = 0;
  workouts.forEach((w) => {
    if (w.history?.length) {
      const last = w.history[w.history.length - 1];
      totalSetsLogged += (last.sets || []).length;
    }
  });

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
            <Text style={styles.headerTitle}>Exercise Tracker</Text>
            <Text style={styles.headerSubtitle}>Progressive overload ledger</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentScrollable}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroTelemetryCard}>
          <View style={styles.telemetryTopRow}>
            <Text style={styles.telemetryKicker}>TRAINING TELEMETRY</Text>
            <View style={styles.telemetryRegionChip}>
              <Text style={styles.telemetryRegionChipText}>
                {totalRegions} {totalRegions === 1 ? 'Region' : 'Regions'}
              </Text>
            </View>
          </View>

          <View style={styles.kpiDock}>
            <View style={styles.kpiCol}>
              <Text style={styles.kpiValue}>{totalExercises}</Text>
              <Text style={styles.kpiLabel}>Exercises</Text>
            </View>
            <View style={styles.colSeparator} />
            <View style={styles.kpiCol}>
              <Text style={styles.kpiValue}>{totalSetsLogged}</Text>
              <Text style={styles.kpiLabel}>Active Sets</Text>
            </View>
            <View style={styles.colSeparator} />
            <View style={styles.kpiCol}>
              <Text style={[styles.kpiValue, { color: tokens.cyanEdge }]}>{totalRegions}</Text>
              <Text style={styles.kpiLabel}>Muscle Splits</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Exercise Routine</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {workouts.length} {workouts.length === 1 ? 'item' : 'items'}
            </Text>
          </View>
        </View>

        {workouts.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconBox}>
              <MaterialCommunityIcons
                name="dumbbell"
                size={22}
                color={tokens.ashGray}
              />
            </View>
            <Text style={styles.emptyTitle}>No exercises logged yet</Text>
            <Text style={styles.emptySub}>
              Track strength lifts, dumbbells, or cardio sessions to calibrate progressive volume.
            </Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={() => setIsAddWorkoutOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Add First Exercise"
            >
              <Feather name="plus" size={14} color="#ffffff" />
              <Text style={styles.emptyAddBtnText}>Add First Exercise</Text>
            </TouchableOpacity>
          </View>
        ) : (
          Object.keys(grouped).map((regionName) => {
            const list = [...grouped[regionName]];
            list.sort((a, b) => {
              const dateA = a.history?.length ? a.history[a.history.length - 1].date : '';
              const dateB = b.history?.length ? b.history[b.history.length - 1].date : '';
              return dateB.localeCompare(dateA);
            });

            return (
              <View key={regionName} style={styles.regionSection}>
                <View style={styles.regionHeader}>
                  <View style={styles.regionPillBadge}>
                    <Text style={styles.regionPillText}>{regionName.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.regionCountText}>
                    {list.length} {list.length === 1 ? 'exercise' : 'exercises'}
                  </Text>
                </View>

                <View style={styles.workoutListContainer}>
                  {list.map((ex) => {
                    const lastEntry = ex.history?.length ? ex.history[ex.history.length - 1] : null;
                    let timeStr = 'No records';
                    let totalSets = 0;
                    let maxWeight = 0;
                    let totalReps = 0;
                    let diff = null;

                    if (lastEntry) {
                      const d1 = new Date(lastEntry.date);
                      const d2 = new Date();
                      const daysDiff = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
                      timeStr = daysDiff === 0 ? 'Today' : `${daysDiff}d ago`;

                      const sets = lastEntry.sets || [];
                      totalSets = sets.length;
                      sets.forEach((s) => {
                        const w = Number(s.weight) || 0;
                        const r = Number(s.reps) || 0;
                        if (w > maxWeight) maxWeight = w;
                        totalReps += r;
                      });

                      if (ex.history.length > 1) {
                        const prevEntry = ex.history[ex.history.length - 2];
                        let prevMaxWeight = 0;
                        (prevEntry.sets || []).forEach((s) => {
                          const w = Number(s.weight) || 0;
                          if (w > prevMaxWeight) prevMaxWeight = w;
                        });
                        diff = maxWeight - prevMaxWeight;
                      }
                    }

                    return (
                      <TouchableOpacity
                        key={ex.id}
                        style={styles.workoutCard}
                        activeOpacity={0.88}
                        onPress={() => handleOpenSets(ex)}
                        onLongPress={() => handleDeleteExercise(ex)}
                        delayLongPress={500}
                        accessibilityLabel={`Open ${ex.name} sets`}
                        accessibilityRole="button"
                      >
                        <View style={styles.workoutLeft}>
                          <Text style={styles.workoutName}>{ex.name}</Text>
                          <Text style={styles.workoutSubtitle}>Recorded {timeStr}</Text>
                        </View>

                        <View style={styles.workoutRight}>
                          {lastEntry ? (
                            <>
                              <View style={styles.workoutStatsRow}>
                                <Text style={styles.workoutStats}>
                                  {totalSets} Sets · {maxWeight}kg
                                </Text>
                                {diff !== null && diff !== 0 && (
                                  <View
                                    style={[
                                      styles.diffPill,
                                      diff > 0 ? styles.diffPositive : styles.diffNegative,
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.diffText,
                                        diff > 0 ? styles.diffPositiveText : styles.diffNegativeText,
                                      ]}
                                    >
                                      {diff > 0 ? `+${diff}` : `${diff}`}kg
                                    </Text>
                                  </View>
                                )}
                              </View>
                              <Text style={styles.workoutReps}>{totalReps} Total Reps</Text>
                            </>
                          ) : (
                            <Text style={styles.workoutNoRecords}>No sets logged</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.fabPill,
          isFabHomeState && styles.fabHomeState,
        ]}
        activeOpacity={0.88}
        onPress={handleFabPress}
        onLongPress={handleFabLongPress}
        delayLongPress={280}
        accessibilityRole="button"
        accessibilityLabel={isFabHomeState ? 'Return to Dashboard' : 'Add Workout'}
      >
        <Feather
          name={isFabHomeState ? 'home' : 'plus'}
          size={18}
          color="#ffffff"
        />
        <Text style={styles.fabPillText}>
          {isFabHomeState ? 'Home' : 'Add Workout'}
        </Text>
      </TouchableOpacity>

      <AddWorkoutModal
        visible={isAddWorkoutOpen}
        onClose={() => setIsAddWorkoutOpen(false)}
        onSave={handleAddWorkout}
        existingRegions={Object.keys(grouped)}
      />

      <ExerciseSetsModal
        visible={isSetsModalOpen}
        onClose={() => {
          setIsSetsModalOpen(false);
          setActiveExercise(null);
        }}
        exercise={activeExercise}
        onSaveSets={handleSaveSets}
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
  heroTelemetryCard: {
    backgroundColor: tokens.pureWhite,
    borderRadius: tokens.radiusFeatureCard,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    padding: 18,
    gap: 14,
  },
  telemetryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  telemetryKicker: {
    fontSize: 11,
    fontWeight: '600',
    color: tokens.ashGray,
    letterSpacing: 0.5,
  },
  telemetryRegionChip: {
    backgroundColor: tokens.stoneCanvas,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: tokens.radiusPill,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
  },
  telemetryRegionChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: tokens.warmGray,
  },
  kpiDock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '700',
    color: tokens.inkBlack,
    letterSpacing: -0.5,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: tokens.warmGray,
  },
  colSeparator: {
    width: 1,
    height: 30,
    backgroundColor: tokens.stoneBorder,
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
    backgroundColor: tokens.cyanSignal,
    borderRadius: tokens.radiusPill,
    paddingHorizontal: 16,
    paddingVertical: 9,
    marginTop: 8,
  },
  emptyAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.1,
  },
  regionSection: {
    gap: 10,
  },
  regionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  regionPillBadge: {
    backgroundColor: tokens.stoneCanvas,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    borderRadius: tokens.radiusPill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  regionPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.inkBlack,
    letterSpacing: 0.5,
  },
  regionCountText: {
    fontSize: 12,
    color: tokens.warmGray,
  },
  workoutListContainer: {
    gap: 8,
  },
  workoutCard: {
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
  workoutLeft: {
    flex: 1,
    gap: 4,
    marginRight: 12,
  },
  workoutName: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.inkBlack,
  },
  workoutSubtitle: {
    fontSize: 12,
    color: tokens.warmGray,
  },
  workoutRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  workoutStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  workoutStats: {
    fontSize: 14,
    fontWeight: '700',
    color: tokens.inkBlack,
  },
  diffPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: tokens.radiusPill,
  },
  diffPositive: {
    backgroundColor: tokens.positiveWash,
  },
  diffNegative: {
    backgroundColor: tokens.negativeWash,
  },
  diffText: {
    fontSize: 11,
    fontWeight: '700',
  },
  diffPositiveText: {
    color: tokens.positiveGreen,
  },
  diffNegativeText: {
    color: tokens.negativeRed,
  },
  workoutReps: {
    fontSize: 12,
    color: tokens.warmGray,
  },
  workoutNoRecords: {
    fontSize: 12,
    color: tokens.ashGray,
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
  },
  fabHomeState: {
    backgroundColor: tokens.inkBlack,
  },
  fabPillText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
