import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
  Animated,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AdjustGoalsModal from '../components/modals/AdjustGoalsModal';
import BurnModal from '../components/modals/BurnModal';

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
  surplusWash: 'rgba(229, 77, 46, 0.12)',

  radiusCard: 10,
  radiusFeatureCard: 16,
  radiusPill: 9999,
  radiusInput: 6,
};

export default function DashboardScreen({
  goals,
  setGoals,
  consumed,
  burnedCalories,
  setBurnedCalories,
  onNavigate,
  userInitial = 'R',
}) {
  const [isAdjustGoalsOpen, setIsAdjustGoalsOpen] = useState(false);
  const [isBurnOpen, setIsBurnOpen] = useState(false);
  const [isRadialActive, setIsRadialActive] = useState(false);

  const radialAnim = useRef(new Animated.Value(0)).current;

  const remainingCal = goals.calories - consumed.calories + burnedCalories;
  const remainingCarb = goals.carbs - consumed.carbs;
  const remainingProt = goals.protein - consumed.protein;
  const remainingFat = goals.fat - consumed.fat;

  const isSurplus = remainingCal < 0;

  const calProg = Math.min(Math.max(consumed.calories / (goals.calories || 1), 0), 1);
  const carbProg = Math.min(Math.max(consumed.carbs / (goals.carbs || 1), 0), 1);
  const protProg = Math.min(Math.max(consumed.protein / (goals.protein || 1), 0), 1);
  const fatProg = Math.min(Math.max(consumed.fat / (goals.fat || 1), 0), 1);
  const burnProg = Math.min(Math.max(burnedCalories / 500, 0), 1);

  const proteinKcal = Math.round(consumed.protein * 4);
  const carbsKcal = Math.round(consumed.carbs * 4);
  const fatKcal = Math.round(consumed.fat * 9);

  const totalMacroKcal = proteinKcal + carbsKcal + fatKcal;
  const proteinShare = totalMacroKcal > 0 ? (proteinKcal / totalMacroKcal) * 100 : 33.3;
  const carbsShare = totalMacroKcal > 0 ? (carbsKcal / totalMacroKcal) * 100 : 33.3;
  const fatShare = totalMacroKcal > 0 ? Math.max(0, 100 - proteinShare - carbsShare) : 33.4;

  const openRadialMenu = () => {
    setIsRadialActive(true);
    Animated.spring(radialAnim, {
      toValue: 1,
      tension: 65,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  const closeRadialMenu = () => {
    Animated.timing(radialAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => setIsRadialActive(false));
  };

  const handleFabPress = () => {
    if (isRadialActive) {
      closeRadialMenu();
    } else {
      setIsAdjustGoalsOpen(true);
    }
  };

  const handleFabLongPress = () => {
    if (isRadialActive) {
      closeRadialMenu();
    } else {
      openRadialMenu();
    }
  };

  const handleProfileLongPress = () => {
    Alert.alert(
      'Account / Options',
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'View Profile', onPress: () => onNavigate('view-profile') },
      ]
    );
  };

  const cameraTranslateX = radialAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -68],
  });
  const cameraTranslateY = radialAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -58],
  });
  const cameraScale = radialAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const cameraOpacity = radialAnim.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 0.6, 1],
  });

  const exerciseTranslateX = radialAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0],
  });
  const exerciseTranslateY = radialAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -78],
  });
  const exerciseScale = radialAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const exerciseOpacity = radialAnim.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 0.6, 1],
  });

  return (
    <View style={styles.viewContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={tokens.stoneCanvas} />

      <View style={styles.appHeader}>
        <View style={styles.brandCluster}>
          <View style={styles.brandLogoBadge}>
            <Feather name="activity" size={16} color={tokens.cyanSignal} />
          </View>
          <View style={styles.brandInfoRow}>
            <Text style={styles.appTitle}>Macro Journey</Text>
            <View style={styles.datePill}>
              <Text style={styles.datePillText}>Today · 29 Oct</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.profileBtn}
          activeOpacity={0.8}
          onPress={() => onNavigate('view-profile')}
          onLongPress={handleProfileLongPress}
          delayLongPress={500}
          accessibilityLabel="Open User Profile"
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.profileLetter}>{userInitial}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentScrollable}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => onNavigate('view-diary')}
          accessibilityLabel="View food diary entries"
          accessibilityRole="button"
          accessibilityHint="Navigates to food diary"
        >
          <View
            style={[
              styles.cardBase,
              styles.heroCalCard,
              isSurplus && styles.heroCalCardSurplus,
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.headerLeftMeta}>
                <Text style={styles.sectionHeaderTitle}>Energy Budget</Text>
                <View style={styles.highlightBadge}>
                  <Text style={styles.highlightBadgeText}>
                    {isSurplus ? 'surplus detected' : 'simple & actionable'}
                  </Text>
                </View>
              </View>
              <View style={[styles.statusPill, isSurplus ? styles.pillSurplus : styles.pillDeficit]}>
                <Text style={[styles.statusPillText, isSurplus ? styles.pillTextSurplus : styles.pillTextDeficit]}>
                  {isSurplus ? `+${Math.abs(Math.round(remainingCal))} kcal` : `${Math.round(remainingCal)} kcal deficit`}
                </Text>
              </View>
            </View>

            <View style={styles.calorieValueRow}>
              <Text style={styles.calorieBigValue}>
                {Math.abs(Math.round(remainingCal))}
              </Text>
              <Text style={styles.calorieUnitLabel}>kcal</Text>
            </View>

            <View style={styles.hairlineProgressTrack}>
              <View
                style={[
                  styles.hairlineProgressFill,
                  {
                    width: isSurplus ? '100%' : `${calProg * 100}%`,
                    backgroundColor: isSurplus ? tokens.surplusAlert : tokens.cyanSignal,
                  },
                ]}
              />
            </View>

            <View style={styles.formulaDock}>
              <View style={styles.formulaSegment}>
                <Text style={styles.formulaLabel}>target</Text>
                <Text style={styles.formulaVal}>{goals.calories}</Text>
              </View>
              <View style={styles.dockDivider} />
              <View style={styles.formulaSegment}>
                <Text style={styles.formulaLabel}>consumed</Text>
                <Text style={styles.formulaVal}>{Math.round(consumed.calories)}</Text>
              </View>
              <View style={styles.dockDivider} />
              <View style={styles.formulaSegment}>
                <Text style={styles.formulaLabel}>workout</Text>
                <Text style={[styles.formulaVal, { color: tokens.cyanEdge }]}>
                  +{Math.round(burnedCalories)}
                </Text>
              </View>
              <View style={styles.dockDivider} />
              <View style={styles.formulaSegment}>
                <Text style={styles.formulaLabel}>budget</Text>
                <Text style={styles.formulaVal}>
                  {goals.calories + Math.round(burnedCalories)}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => onNavigate('view-diary')}
          accessibilityLabel="View macronutrient distribution in food diary"
          accessibilityRole="button"
        >
          <View style={[styles.cardBase, styles.macroCard]}>
            <View style={styles.cardHeader}>
              <View style={styles.headerLeftMeta}>
                <Text style={styles.sectionHeaderTitle}>Macronutrients</Text>
                <Text style={styles.sectionSubtitle}>
                  {totalMacroKcal > 0 ? `${totalMacroKcal} kcal logged` : 'daily breakdown'}
                </Text>
              </View>
              <Text style={styles.diaryLinkText}>tap to log</Text>
            </View>

            {totalMacroKcal > 0 && (
              <View style={styles.shareTrackWrapper}>
                <View style={styles.segmentedRatioTrack}>
                  <View style={[styles.segmentFill, { width: `${proteinShare}%`, backgroundColor: tokens.cyanSignal }]} />
                  <View style={[styles.segmentFill, { width: `${carbsShare}%`, backgroundColor: tokens.warmGray }]} />
                  <View style={[styles.segmentFill, { width: `${fatShare}%`, backgroundColor: tokens.stoneMuted }]} />
                </View>
                <View style={styles.shareLegendRow}>
                  <View style={styles.legendItemWithDot}>
                    <View style={[styles.legendColorDot, { backgroundColor: tokens.cyanSignal }]} />
                    <Text style={[styles.shareLegendItem, { color: tokens.inkBlack }]}>
                      Protein {Math.round(proteinShare)}%
                    </Text>
                  </View>
                  <View style={styles.legendItemWithDot}>
                    <View style={[styles.legendColorDot, { backgroundColor: tokens.warmGray }]} />
                    <Text style={styles.shareLegendItem}>
                      Carbs {Math.round(carbsShare)}%
                    </Text>
                  </View>
                  <View style={styles.legendItemWithDot}>
                    <View style={[styles.legendColorDot, { backgroundColor: tokens.stoneMuted }]} />
                    <Text style={styles.shareLegendItem}>
                      Fats {Math.round(fatShare)}%
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.macroRowItem}>
              <View style={styles.macroRowTop}>
                <View style={styles.macroIdentity}>
                  <MaterialCommunityIcons
                    name="food-drumstick"
                    size={16}
                    color={tokens.cyanEdge}
                    style={styles.macroRowIcon}
                  />
                  <Text style={styles.macroRowName}>Protein</Text>
                </View>
                <Text style={[styles.macroRemainingHighlight, { color: tokens.cyanEdge }]}>
                  {Math.abs(Math.round(remainingProt))}g {remainingProt < 0 ? 'surplus' : 'left'}
                </Text>
              </View>
              <View style={styles.hairlineProgressTrack}>
                <View
                  style={[
                    styles.hairlineProgressFill,
                    {
                      width: `${protProg * 100}%`,
                      backgroundColor: tokens.cyanSignal,
                    },
                  ]}
                />
              </View>
              <View style={styles.macroRowBottom}>
                <Text style={styles.macroRatioMeta}>
                  {Math.round(consumed.protein)}g of {goals.protein}g
                </Text>
                <Text style={styles.macroCalMeta}>{proteinKcal} kcal</Text>
              </View>
            </View>

            <View style={styles.macroSeparator} />

            <View style={styles.macroRowItem}>
              <View style={styles.macroRowTop}>
                <View style={styles.macroIdentity}>
                  <MaterialCommunityIcons
                    name="bread-slice"
                    size={16}
                    color={tokens.warmGray}
                    style={styles.macroRowIcon}
                  />
                  <Text style={styles.macroRowName}>Carbohydrates</Text>
                </View>
                <Text style={[styles.macroRemainingNeutral, { color: tokens.warmGray }]}>
                  {Math.abs(Math.round(remainingCarb))}g {remainingCarb < 0 ? 'surplus' : 'left'}
                </Text>
              </View>
              <View style={styles.hairlineProgressTrack}>
                <View
                  style={[
                    styles.hairlineProgressFill,
                    {
                      width: `${carbProg * 100}%`,
                      backgroundColor: tokens.warmGray,
                    },
                  ]}
                />
              </View>
              <View style={styles.macroRowBottom}>
                <Text style={styles.macroRatioMeta}>
                  {Math.round(consumed.carbs)}g of {goals.carbs}g
                </Text>
                <Text style={styles.macroCalMeta}>{carbsKcal} kcal</Text>
              </View>
            </View>

            <View style={styles.macroSeparator} />

            <View style={styles.macroRowItem}>
              <View style={styles.macroRowTop}>
                <View style={styles.macroIdentity}>
                  <Ionicons
                    name="water"
                    size={16}
                    color={tokens.ashGray}
                    style={styles.macroRowIcon}
                  />
                  <Text style={styles.macroRowName}>Healthy Fats</Text>
                </View>
                <Text style={[styles.macroRemainingNeutral, { color: tokens.warmGray }]}>
                  {Math.abs(Math.round(remainingFat))}g {remainingFat < 0 ? 'surplus' : 'left'}
                </Text>
              </View>
              <View style={styles.hairlineProgressTrack}>
                <View
                  style={[
                    styles.hairlineProgressFill,
                    {
                      width: `${fatProg * 100}%`,
                      backgroundColor: tokens.stoneMuted,
                    },
                  ]}
                />
              </View>
              <View style={styles.macroRowBottom}>
                <Text style={styles.macroRatioMeta}>
                  {Math.round(consumed.fat)}g of {goals.fat}g
                </Text>
                <Text style={styles.macroCalMeta}>{fatKcal} kcal</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => setIsBurnOpen(true)}
          accessibilityLabel="Adjust exercise calories burned"
          accessibilityRole="button"
        >
          <View style={[styles.cardBase, styles.exerciseCard]}>
            <View style={styles.cardHeader}>
              <View style={styles.headerLeftMeta}>
                <Text style={styles.sectionHeaderTitle}>Active Expenditure</Text>
                <Text style={styles.sectionSubtitle}>Cardio & strength training</Text>
              </View>
              <View style={styles.secondaryGhostBtn}>
                <Text style={styles.secondaryGhostBtnText}>Log Workout</Text>
              </View>
            </View>

            <View style={styles.macroValueRow}>
              <Text style={styles.burnCalLarge}>
                +{Math.round(burnedCalories)}
              </Text>
              <Text style={styles.macroUnitText}>kcal credited to budget</Text>
            </View>

            <View style={styles.hairlineProgressTrack}>
              <View
                style={[
                  styles.hairlineProgressFill,
                  {
                    width: `${burnProg * 100}%`,
                    backgroundColor: tokens.cyanSignal,
                  },
                ]}
              />
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {isRadialActive && (
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={closeRadialMenu}
          accessibilityLabel="Close quick action menu"
        />
      )}

      <View style={styles.fabContainer} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.miniFabWrapper,
            {
              transform: [
                { translateX: cameraTranslateX },
                { translateY: cameraTranslateY },
                { scale: cameraScale },
              ],
              opacity: cameraOpacity,
            },
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            style={styles.miniFab}
            activeOpacity={0.8}
            disabled={!isRadialActive}
            onPress={() => {
              closeRadialMenu();
              onNavigate('view-camera');
            }}
            accessibilityLabel="Open Camera Progress"
            accessibilityRole="button"
          >
            <Feather name="camera" size={20} color={tokens.inkBlack} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[
            styles.miniFabWrapper,
            {
              transform: [
                { translateX: exerciseTranslateX },
                { translateY: exerciseTranslateY },
                { scale: exerciseScale },
              ],
              opacity: exerciseOpacity,
            },
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            style={styles.miniFab}
            activeOpacity={0.8}
            disabled={!isRadialActive}
            onPress={() => {
              closeRadialMenu();
              onNavigate('view-exercise');
            }}
            accessibilityLabel="Open Workout Log"
            accessibilityRole="button"
          >
            <Feather name="activity" size={20} color={tokens.cyanSignal} />
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          style={styles.pillFab}
          activeOpacity={0.88}
          onPress={handleFabPress}
          onLongPress={handleFabLongPress}
          delayLongPress={280}
          accessibilityLabel="Adjust Nutrition and Calorie Goals"
          accessibilityRole="button"
        >
          <Feather name={isRadialActive ? 'x' : 'sliders'} size={17} color="#ffffff" />
          <Text style={styles.pillFabText}>{isRadialActive ? 'Close' : 'Adjust Goals'}</Text>
        </TouchableOpacity>
      </View>

      <AdjustGoalsModal
        visible={isAdjustGoalsOpen}
        onClose={() => setIsAdjustGoalsOpen(false)}
        goals={goals}
        onSave={setGoals}
      />

      <BurnModal
        visible={isBurnOpen}
        onClose={() => setIsBurnOpen(false)}
        burnedCalories={burnedCalories}
        onSave={setBurnedCalories}
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
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 14,
    backgroundColor: tokens.stoneCanvas,
    borderBottomWidth: 1,
    borderBottomColor: tokens.stoneBorder,
    zIndex: 10,
  },
  brandCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandLogoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: tokens.pureWhite,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  brandInfoRow: {
    flexDirection: 'column',
    gap: 3,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: tokens.inkBlack,
    letterSpacing: -0.4,
  },
  datePill: {
    alignSelf: 'flex-start',
    backgroundColor: tokens.stoneCanvas,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
  },
  datePillText: {
    fontSize: 10,
    color: tokens.warmGray,
    fontWeight: '500',
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: tokens.pureWhite,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  profileLetter: {
    color: tokens.cyanEdge,
    fontSize: 14,
    fontWeight: '500',
  },
  contentScrollable: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110,
    gap: 14,
  },
  cardBase: {
    backgroundColor: tokens.pureWhite,
    borderRadius: tokens.radiusFeatureCard,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  heroCalCard: {
    padding: 20,
  },
  heroCalCardSurplus: {
    borderColor: tokens.surplusAlert,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  headerLeftMeta: {
    flexDirection: 'column',
    gap: 4,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: tokens.inkBlack,
    letterSpacing: -0.3,
  },
  highlightBadge: {
    backgroundColor: tokens.skyWash,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  highlightBadgeText: {
    fontSize: 11,
    color: tokens.cyanEdge,
    fontWeight: '500',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: tokens.warmGray,
    fontWeight: '400',
  },
  diaryLinkText: {
    fontSize: 12,
    color: tokens.cyanEdge,
    fontWeight: '500',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: tokens.radiusPill,
    borderWidth: 1,
  },
  pillDeficit: {
    backgroundColor: tokens.skyWash,
    borderColor: tokens.cyanEdge,
  },
  pillSurplus: {
    backgroundColor: tokens.surplusWash,
    borderColor: tokens.surplusAlert,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  pillTextDeficit: {
    color: tokens.cyanEdge,
  },
  pillTextSurplus: {
    color: tokens.surplusAlert,
  },
  calorieValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 12,
  },
  calorieBigValue: {
    fontSize: 44,
    fontWeight: '400',
    color: tokens.inkBlack,
    letterSpacing: -1,
  },
  calorieUnitLabel: {
    fontSize: 15,
    color: tokens.warmGray,
    fontWeight: '400',
  },
  hairlineProgressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: tokens.stoneCanvas,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
  },
  hairlineProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  formulaDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: tokens.stoneCanvas,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: tokens.radiusInput,
    marginTop: 2,
  },
  dockDivider: {
    width: 1,
    height: 18,
    backgroundColor: tokens.stoneBorder,
  },
  formulaSegment: {
    alignItems: 'center',
    flex: 1,
  },
  formulaLabel: {
    fontSize: 10,
    color: tokens.warmGray,
    fontWeight: '400',
    textTransform: 'lowercase',
    marginBottom: 2,
  },
  formulaVal: {
    fontSize: 13,
    color: tokens.inkBlack,
    fontWeight: '500',
  },
  macroCard: {
    padding: 20,
    borderRadius: tokens.radiusCard,
  },
  shareTrackWrapper: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: tokens.stoneBorder,
  },
  segmentedRatioTrack: {
    width: '100%',
    height: 4,
    flexDirection: 'row',
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: tokens.stoneCanvas,
    gap: 1,
  },
  segmentFill: {
    height: '100%',
  },
  shareLegendRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 8,
  },
  legendItemWithDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  shareLegendItem: {
    fontSize: 11,
    color: tokens.warmGray,
    fontWeight: '400',
  },
  macroRowItem: {
    paddingVertical: 4,
  },
  macroRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  macroIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  macroRowIcon: {
    marginRight: 2,
  },
  macroRowName: {
    fontSize: 14,
    fontWeight: '400',
    color: tokens.inkBlack,
    letterSpacing: -0.2,
  },
  macroRemainingHighlight: {
    fontSize: 13,
    fontWeight: '500',
  },
  macroRemainingNeutral: {
    fontSize: 13,
    fontWeight: '400',
  },
  macroRowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  macroRatioMeta: {
    fontSize: 12,
    color: tokens.warmGray,
    fontWeight: '400',
  },
  macroCalMeta: {
    fontSize: 12,
    color: tokens.warmGray,
    fontWeight: '400',
  },
  macroSeparator: {
    height: 1,
    backgroundColor: tokens.stoneBorder,
    marginVertical: 10,
  },
  exerciseCard: {
    padding: 20,
    borderRadius: tokens.radiusCard,
  },
  secondaryGhostBtn: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: tokens.radiusPill,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
  },
  secondaryGhostBtnText: {
    fontSize: 12,
    color: tokens.inkBlack,
    fontWeight: '400',
  },
  macroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 10,
  },
  burnCalLarge: {
    fontSize: 30,
    fontWeight: '400',
    color: tokens.cyanEdge,
    letterSpacing: -0.5,
  },
  macroUnitText: {
    fontSize: 13,
    color: tokens.warmGray,
    fontWeight: '400',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 30,
    overflow: 'visible',
  },
  miniFabWrapper: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    zIndex: 35,
  },
  miniFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: tokens.pureWhite,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  pillFab: {
    minHeight: 46,
    backgroundColor: tokens.cyanSignal,
    borderRadius: tokens.radiusPill,
    borderWidth: 1,
    borderColor: tokens.cyanEdge,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 30,
    ...Platform.select({
      ios: {
        shadowColor: '#110c2e',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  pillFabText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
});
