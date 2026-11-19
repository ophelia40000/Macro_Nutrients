import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AddWorkoutModal from '../components/modals/AddWorkoutModal';
import ExerciseSetsModal from '../components/modals/ExerciseSetsModal';
import ConfirmModal from '../components/modals/ConfirmModal';

const tokens = {
  stoneCanvas: '#fafaf9',
  pureWhite: '#ffffff',
  stoneSurface: '#f5f5f4',
  stoneBorder: '#e8e6e5',
  stoneMuted: '#d6d3d1',
  warmGray: '#78716c',
  slateStone: '#57534e',
  inkBlack: '#0c0a09',
  skySurface: '#f0f9ff',
  skyPillBg: '#e0f2fe',
  skyPillBorder: 'rgba(59, 166, 241, 0.28)',
  skyIcon: '#0284c7',
  skyInk: '#0369a1',
  positiveGreen: '#047857',
  positiveWash: 'rgba(4, 120, 87, 0.10)',
  negativeRed: '#c8371d',
  negativeWash: 'rgba(200, 55, 29, 0.10)',

  radiusHero: 18,
  radiusCard: 12,
  radiusInput: 10,
  radiusTag: 6,
  radiusPill: 9999,
};

function getLocalDateStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function capitalizeFirstLetter(str) {
  const trimmed = String(str || '').trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export default function ExerciseScreen({
  workouts = [],
  setWorkouts,
  onNavigate,
}) {
  const [isAddWorkoutOpen, setIsAddWorkoutOpen] = useState(false);
  const [activeExercise, setActiveExercise] = useState(null);
  const [isSetsModalOpen, setIsSetsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [collapsedRegions, setCollapsedRegions] = useState({});
  const searchInputRef = useRef(null);

  const todayStr = getLocalDateStr();

  const toggleRegion = (regionName) => {
    setCollapsedRegions((prev) => ({
      ...prev,
      [regionName]: !prev[regionName],
    }));
  };

  const handleAddWorkout = (workoutData) => {
    const formattedName = capitalizeFirstLetter(workoutData.name);
    const formattedRegion =
      capitalizeFirstLetter(workoutData.region) || 'Uncategorized';
    const newWorkout = {
      id: 'ex_' + Date.now(),
      name: formattedName,
      region: formattedRegion,
      history: [],
    };
    setWorkouts([newWorkout, ...workouts]);
    setIsAddWorkoutOpen(false);
    setCollapsedRegions((prev) => ({
      ...prev,
      [newWorkout.region]: false,
    }));

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
    const today = getLocalDateStr();
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
    setDeleteTarget(ex);
  };

  const allGrouped = {};
  workouts.forEach((ex) => {
    const reg = capitalizeFirstLetter(ex.region) || 'Uncategorized';
    if (!allGrouped[reg]) allGrouped[reg] = [];
    allGrouped[reg].push(ex);
  });

  const q = searchQuery.trim().toLowerCase();
  const grouped = {};
  workouts.forEach((ex) => {
    const reg = capitalizeFirstLetter(ex.region) || 'Uncategorized';
    if (
      q &&
      !ex.name.toLowerCase().includes(q) &&
      !reg.toLowerCase().includes(q)
    ) {
      return;
    }
    if (!grouped[reg]) grouped[reg] = [];
    grouped[reg].push(ex);
  });

  const totalExercises = workouts.length;
  const totalRegions = Object.keys(allGrouped).length;
  let totalSetsLogged = 0;
  workouts.forEach((w) => {
    if (w.history?.length) {
      const last = w.history[w.history.length - 1];
      totalSetsLogged += (last.sets || []).length;
    }
  });

  const visibleRegionKeys = Object.keys(grouped);

  return (
    <View style={styles.viewContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={tokens.stoneCanvas} />

      <View style={styles.appHeader}>
        <View style={styles.brandCluster}>
          <View style={styles.brandIconTile}>
            <MaterialCommunityIcons
              name="dumbbell"
              size={16}
              color={tokens.skyInk}
            />
          </View>
          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerTitle}>Exercise Tracker</Text>
            <Text style={styles.headerSubtitle}>
              Progressive overload ledger
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentScrollable}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroSnapshotCard}>
          <View style={styles.heroPrimaryZone}>
            <Text style={styles.heroEyebrow}>Logged Movements</Text>
            <View style={styles.heroBigRow}>
              <Text style={styles.heroBigNumber}>{totalExercises}</Text>
              <Text style={styles.heroBigUnit}>
                {totalExercises === 1 ? 'lift' : 'lifts'}
              </Text>
            </View>
          </View>

          <View style={styles.heroRailZone}>
            <View style={styles.heroRailItem}>
              <Text style={styles.heroRailLabel}>Active Sets</Text>
              <Text style={styles.heroRailValue}>{totalSetsLogged}</Text>
            </View>
            <View style={styles.heroRailDivider} />
            <View style={styles.heroRailItem}>
              <Text style={styles.heroRailLabel}>Muscle Splits</Text>
              <Text style={[styles.heroRailValue, { color: tokens.skyInk }]}>
                {totalRegions}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.routineControlBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Exercise Routine</Text>
            <Text style={styles.sectionCountMeta}>
              {totalExercises} {totalExercises === 1 ? 'movement' : 'movements'}
            </Text>
          </View>

          {workouts.length > 0 && (() => {
            const matchedCount = visibleRegionKeys.reduce(
              (sum, reg) => sum + grouped[reg].length,
              0
            );
            const hasQuery = q.length > 0;

            return (
              <Pressable
                onPress={() => searchInputRef.current?.focus()}
                style={[
                  styles.searchDeck,
                  isSearchFocused && styles.searchDeckFocused,
                ]}
                accessibilityRole="search"
              >
                <TextInput
                  ref={searchInputRef}
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  onKeyPress={(e) => {
                    if (e.nativeEvent.key === 'Escape' && searchQuery.length > 0) {
                      setSearchQuery('');
                    }
                  }}
                  placeholder="Find exercise or muscle..."
                  placeholderTextColor={tokens.warmGray}
                  accessibilityLabel="Filter exercises by movement or muscle"
                />

                <View style={styles.searchRightCluster}>
                  {hasQuery && (
                    <>
                      <View style={styles.matchStatusTag}>
                        <Text style={styles.matchStatusTagText}>
                          {matchedCount} {matchedCount === 1 ? 'hit' : 'hits'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.clearSearchBtn}
                        onPress={() => {
                          setSearchQuery('');
                          searchInputRef.current?.focus();
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                        accessibilityRole="button"
                        accessibilityLabel="Clear search query"
                      >
                        <Feather name="x" size={14} color={tokens.skyInk} />
                      </TouchableOpacity>
                    </>
                  )}

                  <View
                    style={[
                      styles.searchLensTile,
                      (isSearchFocused || hasQuery) &&
                        styles.searchLensTileActive,
                    ]}
                  >
                    <Feather name="search" size={15} color={tokens.skyInk} />
                  </View>
                </View>
              </Pressable>
            );
          })()}
        </View>

        {workouts.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconBox}>
              <MaterialCommunityIcons
                name="dumbbell"
                size={22}
                color={tokens.skyInk}
              />
            </View>
            <Text style={styles.emptyTitle}>No movements tracked yet</Text>
            <Text style={styles.emptySub}>
              Add your first strength lift or cardio movement to start tracking
              sets, load, and session progression.
            </Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={() => setIsAddWorkoutOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Add First Exercise"
            >
              <Feather name="plus" size={15} color="#ffffff" />
              <Text style={styles.emptyAddBtnText}>Add First Exercise</Text>
            </TouchableOpacity>
          </View>
        ) : visibleRegionKeys.length === 0 ? (
          <View style={styles.emptyCard}>
            <Feather name="search" size={20} color={tokens.warmGray} />
            <Text style={styles.emptyTitle}>No matching movements</Text>
            <Text style={styles.emptySub}>
              No exercise or split matches "{searchQuery.trim()}".
            </Text>
            <TouchableOpacity
              style={styles.resetSearchBtn}
              onPress={() => setSearchQuery('')}
              accessibilityRole="button"
              accessibilityLabel="Reset search filter"
            >
              <Text style={styles.resetSearchBtnText}>Clear Filter</Text>
            </TouchableOpacity>
          </View>
        ) : (
          visibleRegionKeys.map((regionName) => {
            const list = [...grouped[regionName]];
            list.sort((a, b) => {
              const dateA = a.history?.length
                ? a.history[a.history.length - 1].date
                : '';
              const dateB = b.history?.length
                ? b.history[b.history.length - 1].date
                : '';
              return dateB.localeCompare(dateA);
            });

            const isCollapsed =
              q.length === 0 && Boolean(collapsedRegions[regionName]);

            return (
              <View key={regionName} style={styles.regionSection}>
                <TouchableOpacity
                  style={styles.regionHeader}
                  activeOpacity={0.75}
                  onPress={() => toggleRegion(regionName)}
                  hitSlop={{ top: 6, bottom: 6, left: 0, right: 0 }}
                  accessibilityRole="button"
                  accessibilityLabel={`${regionName}, ${list.length} exercises. Tap to ${
                    isCollapsed ? 'expand' : 'collapse'
                  }`}
                >
                  <Text style={styles.regionLabel}>{regionName}</Text>
                  <View style={styles.regionHairline} />
                  <View style={styles.regionToggleCluster}>
                    <Text style={styles.regionCountText}>
                      {list.length}
                    </Text>
                    <View style={styles.regionChevronCircle}>
                      <Feather
                        name={isCollapsed ? 'chevron-right' : 'chevron-down'}
                        size={13}
                        color={tokens.slateStone}
                      />
                    </View>
                  </View>
                </TouchableOpacity>

                {!isCollapsed && (
                  <View style={styles.workoutListContainer}>
                    {list.map((ex) => {
                      const lastEntry = ex.history?.length
                        ? ex.history[ex.history.length - 1]
                        : null;
                      let timeStr = 'Not logged yet';
                      let isToday = false;
                      let sets = [];
                      let maxWeight = 0;
                      let totalReps = 0;
                      let diff = null;

                      if (lastEntry) {
                        isToday = lastEntry.date === todayStr;
                        if (isToday) {
                          timeStr = 'Today';
                        } else {
                          const d1 = new Date(lastEntry.date);
                          const d2 = new Date();
                          const daysDiff = Math.max(
                            1,
                            Math.floor((d2 - d1) / (1000 * 60 * 60 * 24))
                          );
                          timeStr = `${daysDiff}d ago`;
                        }

                        sets = lastEntry.sets || [];
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

                      const displayExerciseName = capitalizeFirstLetter(ex.name);

                      return (
                        <View key={ex.id} style={styles.workoutCard}>
                          <View style={styles.workoutTopBand}>
                            <TouchableOpacity
                              style={styles.workoutMainPress}
                              activeOpacity={0.86}
                              onPress={() => handleOpenSets(ex)}
                              onLongPress={() => handleDeleteExercise(ex)}
                              delayLongPress={500}
                              accessibilityLabel={`Open ${displayExerciseName} sets`}
                              accessibilityRole="button"
                            >
                              <View style={styles.workoutLeft}>
                                <Text style={styles.workoutName} numberOfLines={1}>
                                  {displayExerciseName}
                                </Text>
                                <View style={styles.workoutMetaLine}>
                                  <Text
                                    style={[
                                      styles.workoutTimeText,
                                      isToday && styles.workoutTimeToday,
                                    ]}
                                  >
                                    {timeStr}
                                  </Text>
                                  {lastEntry && (
                                    <Text style={styles.workoutSummaryDot}>
                                      {' '}
                                      · {sets.length}{' '}
                                      {sets.length === 1 ? 'set' : 'sets'} ·{' '}
                                      {totalReps} reps
                                    </Text>
                                  )}
                                </View>
                              </View>

                              {lastEntry ? (
                                <View style={styles.loadBadgeGroup}>
                                  {diff !== null && diff !== 0 && (
                                    <View
                                      style={[
                                        styles.diffTag,
                                        diff > 0
                                          ? styles.diffPositive
                                          : styles.diffNegative,
                                      ]}
                                    >
                                      <Text
                                        style={[
                                          styles.diffText,
                                          diff > 0
                                            ? styles.diffPositiveText
                                            : styles.diffNegativeText,
                                        ]}
                                      >
                                        {diff > 0 ? `+${diff}` : `${diff}`}kg
                                      </Text>
                                    </View>
                                  )}
                                  <View style={styles.loadTile}>
                                    <Text style={styles.loadTileValue}>
                                      {maxWeight}
                                    </Text>
                                    <Text style={styles.loadTileUnit}>kg</Text>
                                  </View>
                                </View>
                              ) : (
                                <View style={styles.emptyLogTag}>
                                  <Text style={styles.emptyLogTagText}>
                                    Log sets
                                  </Text>
                                </View>
                              )}
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.workoutDeleteBtn}
                              activeOpacity={0.8}
                              onPress={() => handleDeleteExercise(ex)}
                              accessibilityLabel={`Delete ${displayExerciseName}`}
                              accessibilityRole="button"
                            >
                              <Feather name="trash-2" size={15} color={tokens.warmGray} />
                            </TouchableOpacity>
                          </View>

                          {sets.length > 0 && (
                            <TouchableOpacity
                              style={styles.setsStrip}
                              activeOpacity={0.86}
                              onPress={() => handleOpenSets(ex)}
                              accessibilityLabel={`Edit ${displayExerciseName} sets`}
                              accessibilityRole="button"
                            >
                              {sets.map((s, idx) => (
                                <View key={idx} style={styles.setChip}>
                                  <Text style={styles.setChipText}>
                                    <Text style={styles.setChipWeight}>
                                      {Number(s.weight) || 0}kg
                                    </Text>
                                    {' × '}
                                    {Number(s.reps) || 0}
                                  </Text>
                                </View>
                              ))}
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fabPill}
        activeOpacity={0.88}
        onPress={() => setIsAddWorkoutOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Add Workout"
      >
        <Feather name="plus" size={17} color="#ffffff" />
        <Text style={styles.fabPillText}>Add Workout</Text>
      </TouchableOpacity>

      <AddWorkoutModal
        visible={isAddWorkoutOpen}
        onClose={() => setIsAddWorkoutOpen(false)}
        onSave={handleAddWorkout}
        existingRegions={Object.keys(allGrouped)}
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

      <ConfirmModal
        visible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remove Exercise"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.name}" and all historical log records?`
            : ''
        }
        confirmText="Delete"
        destructive
        onConfirm={() => {
          if (!deleteTarget) return;
          setWorkouts(workouts.filter((w) => w.id !== deleteTarget.id));
          setDeleteTarget(null);
        }}
      />
    </View>
  );
}

const interactiveWebCursor =
  Platform.OS === 'web' ? { cursor: 'pointer' } : undefined;

const styles = StyleSheet.create({
  viewContainer: {
    flex: 1,
    backgroundColor: tokens.stoneCanvas,
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 12 : 12,
    paddingBottom: 12,
    backgroundColor: tokens.stoneCanvas,
    borderBottomWidth: 1,
    borderBottomColor: tokens.stoneBorder,
    ...(Platform.OS === 'web' ? { touchAction: 'none', overscrollBehavior: 'none' } : {}),
  },
  brandCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIconTile: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: tokens.skySurface,
    borderWidth: 1,
    borderColor: tokens.skyPillBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBlock: {
    gap: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: tokens.inkBlack,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: tokens.slateStone,
  },
  contentScrollable: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 82,
    gap: 16,
  },
  heroSnapshotCard: {
    backgroundColor: tokens.pureWhite,
    borderRadius: tokens.radiusHero,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    flexDirection: 'row',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0c0a09',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 3px 12px rgba(12, 10, 9, 0.04)',
      },
    }),
  },
  heroPrimaryZone: {
    flex: 1.15,
    paddingVertical: 16,
    paddingHorizontal: 18,
    justifyContent: 'space-between',
    gap: 6,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '500',
    color: tokens.slateStone,
    letterSpacing: -0.1,
  },
  heroBigRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  heroBigNumber: {
    fontSize: 38,
    fontWeight: '500',
    color: tokens.inkBlack,
    letterSpacing: -1.4,
    fontVariant: ['tabular-nums'],
  },
  heroBigUnit: {
    fontSize: 13.5,
    fontWeight: '500',
    color: tokens.warmGray,
  },
  heroRailZone: {
    flex: 1,
    backgroundColor: tokens.skySurface,
    borderLeftWidth: 1,
    borderLeftColor: tokens.skyPillBorder,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  heroRailItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  heroRailLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: tokens.slateStone,
  },
  heroRailValue: {
    fontSize: 18,
    fontWeight: '600',
    color: tokens.inkBlack,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.4,
  },
  heroRailDivider: {
    height: 1,
    backgroundColor: tokens.skyPillBorder,
    marginVertical: 8,
  },
  routineControlBlock: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: tokens.inkBlack,
    letterSpacing: -0.3,
  },
  sectionCountMeta: {
    fontSize: 12.5,
    fontWeight: '500',
    color: tokens.slateStone,
  },
  searchDeck: {
    minHeight: 48,
    backgroundColor: tokens.pureWhite,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...Platform.select({
      web: {
        cursor: 'text',
      },
    }),
  },
  searchDeckFocused: {
    borderColor: tokens.skyIcon,
    ...Platform.select({
      web: {
        boxShadow: '0 0 0 3px #e0f2fe',
      },
    }),
  },
  searchLensTile: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: tokens.skySurface,
    borderWidth: 1,
    borderColor: tokens.skyPillBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchLensTileActive: {
    backgroundColor: tokens.skyPillBg,
    borderColor: 'rgba(2, 132, 199, 0.35)',
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '500',
    color: tokens.inkBlack,
    paddingVertical: 0,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
  },
  searchRightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  matchStatusTag: {
    backgroundColor: tokens.skyPillBg,
    borderWidth: 1,
    borderColor: tokens.skyPillBorder,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  matchStatusTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: tokens.skyInk,
    fontVariant: ['tabular-nums'],
  },
  clearSearchBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: tokens.skySurface,
    borderWidth: 1,
    borderColor: tokens.skyPillBorder,
    alignItems: 'center',
    justifyContent: 'center',
    ...interactiveWebCursor,
  },
  emptyCard: {
    backgroundColor: tokens.pureWhite,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    borderRadius: tokens.radiusHero,
    paddingVertical: 32,
    paddingHorizontal: 22,
    alignItems: 'center',
    gap: 10,
  },
  emptyIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: tokens.skySurface,
    borderWidth: 1,
    borderColor: tokens.skyPillBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  emptyTitle: {
    fontSize: 15.5,
    fontWeight: '600',
    color: tokens.inkBlack,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: tokens.slateStone,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 280,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: tokens.skyInk,
    borderRadius: tokens.radiusPill,
    minHeight: 44,
    paddingHorizontal: 20,
    marginTop: 6,
    ...interactiveWebCursor,
  },
  emptyAddBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#ffffff',
  },
  resetSearchBtn: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: tokens.radiusPill,
    backgroundColor: tokens.skyPillBg,
    borderWidth: 1,
    borderColor: tokens.skyPillBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    ...interactiveWebCursor,
  },
  resetSearchBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: tokens.skyInk,
  },
  regionSection: {
    gap: 9,
  },
  regionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 32,
    paddingHorizontal: 2,
    ...interactiveWebCursor,
  },
  regionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: tokens.inkBlack,
    letterSpacing: -0.1,
  },
  regionHairline: {
    flex: 1,
    height: 1,
    backgroundColor: tokens.stoneBorder,
  },
  regionToggleCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  regionCountText: {
    fontSize: 12,
    fontWeight: '500',
    color: tokens.slateStone,
    fontVariant: ['tabular-nums'],
  },
  regionChevronCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: tokens.pureWhite,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutListContainer: {
    gap: 9,
  },
  workoutCard: {
    backgroundColor: tokens.pureWhite,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    borderRadius: tokens.radiusCard,
    padding: 14,
    gap: 11,
  },
  workoutTopBand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  workoutMainPress: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    ...interactiveWebCursor,
  },
  workoutDeleteBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: tokens.stoneCanvas,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    ...interactiveWebCursor,
  },
  workoutLeft: {
    flex: 1,
    gap: 3,
  },
  workoutName: {
    fontSize: 15,
    fontWeight: '600',
    color: tokens.inkBlack,
    letterSpacing: -0.2,
  },
  workoutMetaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  workoutTimeText: {
    fontSize: 12,
    fontWeight: '500',
    color: tokens.slateStone,
  },
  workoutTimeToday: {
    color: tokens.skyInk,
    fontWeight: '600',
  },
  workoutSummaryDot: {
    fontSize: 12,
    color: tokens.warmGray,
  },
  loadBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  diffTag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: tokens.radiusTag,
  },
  diffPositive: {
    backgroundColor: tokens.positiveWash,
  },
  diffNegative: {
    backgroundColor: tokens.negativeWash,
  },
  diffText: {
    fontSize: 11,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  diffPositiveText: {
    color: tokens.positiveGreen,
  },
  diffNegativeText: {
    color: tokens.negativeRed,
  },
  loadTile: {
    backgroundColor: tokens.stoneSurface,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  loadTileValue: {
    fontSize: 17,
    fontWeight: '600',
    color: tokens.inkBlack,
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
  loadTileUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: tokens.slateStone,
  },
  emptyLogTag: {
    backgroundColor: tokens.skyPillBg,
    borderWidth: 1,
    borderColor: tokens.skyPillBorder,
    borderRadius: tokens.radiusTag,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  emptyLogTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.skyInk,
  },
  setsStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: tokens.stoneSurface,
  },
  setChip: {
    backgroundColor: tokens.stoneCanvas,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    borderRadius: tokens.radiusTag,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
  },
  setChipText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: tokens.slateStone,
    fontVariant: ['tabular-nums'],
  },
  setChipWeight: {
    fontWeight: '600',
    color: tokens.inkBlack,
  },
  fabPill: {
    position: 'absolute',
    bottom: 14,
    right: 16,
    backgroundColor: tokens.skyInk,
    borderRadius: tokens.radiusPill,
    minHeight: 44,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(7, 89, 133, 0.2)',
    ...interactiveWebCursor,
    ...Platform.select({
      ios: {
        shadowColor: tokens.skyInk,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 14,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 6px 18px rgba(3, 105, 161, 0.3)',
      },
    }),
  },
  fabPillText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});
