import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AdjustGoalsModal from '../components/modals/AdjustGoalsModal';
import BurnModal from '../components/modals/BurnModal';
import ConfirmModal from '../components/modals/ConfirmModal';

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
  cyanSignal: '#0284c7',
  cyanEdge: '#0369a1',
  surplusAlert: '#c8371d',
  surplusWash: 'rgba(200, 55, 29, 0.10)',

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
  authUser = null,
  onOpenLogin,
}) {
  const [isAdjustGoalsOpen, setIsAdjustGoalsOpen] = useState(false);
  const [isBurnOpen, setIsBurnOpen] = useState(false);
  const [isProfileOptionsOpen, setIsProfileOptionsOpen] = useState(false);

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

  const handleProfileLongPress = () => {
    setIsProfileOptionsOpen(true);
  };

  return (
    <View style={styles.viewContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={tokens.stoneCanvas} />

      <View style={styles.appHeader}>
        <View style={styles.brandCluster}>
          <View style={styles.brandLogoBadge}>
            <Feather name="activity" size={16} color={tokens.cyanSignal} />
          </View>
          <View style={styles.brandInfoRow}>
            <Text style={styles.appTitle}>Macro Nutrients</Text>
            <View style={styles.datePill}>
              <Text style={styles.datePillText}>
                {`Today · ${new Date().toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                })}`}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRightCluster}>
          {!authUser && onOpenLogin && (
            <TouchableOpacity
              style={styles.signInPill}
              activeOpacity={0.85}
              onPress={onOpenLogin}
              accessibilityLabel="Sign in with Google"
              accessibilityRole="button"
            >
              <Feather name="log-in" size={12} color="#0369a1" />
              <Text style={styles.signInPillText}>Sign in</Text>
            </TouchableOpacity>
          )}

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
            <Text style={styles.profileLetter}>
              {authUser?.displayName
                ? authUser.displayName.charAt(0).toUpperCase()
                : userInitial}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.contentScrollable}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.cardSlot}
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
                    {isSurplus ? 'surplus detected' : 'within budget'}
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
          style={styles.cardSlot}
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
          style={styles.cardSlot}
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

            <View style={[styles.hairlineProgressTrack, styles.exerciseLastTrack]}>
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

      <View style={styles.footerActionRow}>
        <TouchableOpacity
          style={styles.pillFab}
          activeOpacity={0.88}
          onPress={() => setIsAdjustGoalsOpen(true)}
          accessibilityLabel="Adjust Nutrition and Calorie Goals"
          accessibilityRole="button"
        >
          <Feather name="sliders" size={17} color="#ffffff" />
          <Text style={styles.pillFabText}>Adjust Goals</Text>
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

      <ConfirmModal
        visible={isProfileOptionsOpen}
        onClose={() => setIsProfileOptionsOpen(false)}
        title="Account / Options"
        message={
          authUser
            ? `Signed in as ${authUser.displayName || authUser.email}`
            : 'Sign in with Google to sync your saved cloud data.'
        }
        actions={[
          ...(!authUser && onOpenLogin
            ? [
                {
                  label: 'Sign in with Google',
                  icon: 'log-in',
                  tone: 'primary',
                  onPress: onOpenLogin,
                },
              ]
            : []),
          {
            label: 'View Profile',
            icon: 'user',
            tone: authUser ? 'primary' : 'default',
            onPress: () => onNavigate('view-profile'),
          },
        ]}
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
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? 10 : 8,
    paddingBottom: 10,
    backgroundColor: tokens.stoneCanvas,
    borderBottomWidth: 1,
    borderBottomColor: tokens.stoneBorder,
    zIndex: 10,
    ...(Platform.OS === 'web' ? { touchAction: 'none', overscrollBehavior: 'none' } : {}),
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
  headerRightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signInPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: 'rgba(3, 105, 161, 0.28)',
  },
  signInPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369a1',
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    fontWeight: '600',
  },
  scrollArea: {
    flex: 1,
    minHeight: 0,
  },
  contentScrollable: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
  },
  cardSlot: {
    width: '100%',
  },
  cardBase: {
    justifyContent: 'space-between',
    backgroundColor: tokens.pureWhite,
    borderRadius: tokens.radiusFeatureCard,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    padding: 14,
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
    padding: 14,
  },
  heroCalCardSurplus: {
    borderColor: tokens.surplusAlert,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
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
    marginBottom: 6,
  },
  calorieBigValue: {
    fontSize: 34,
    fontWeight: '400',
    color: tokens.inkBlack,
    letterSpacing: -1,
  },
  calorieUnitLabel: {
    fontSize: 14,
    color: tokens.warmGray,
    fontWeight: '400',
  },
  hairlineProgressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: tokens.stoneCanvas,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
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
    paddingVertical: 8,
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
    padding: 13,
    borderRadius: tokens.radiusCard,
  },
  shareTrackWrapper: {
    marginBottom: 8,
    paddingBottom: 6,
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
    marginTop: 6,
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
    paddingVertical: 2,
  },
  macroRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
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
    fontSize: 13.5,
    fontWeight: '400',
    color: tokens.inkBlack,
    letterSpacing: -0.2,
  },
  macroRemainingHighlight: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  macroRemainingNeutral: {
    fontSize: 12.5,
    fontWeight: '400',
  },
  macroRowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -2,
  },
  macroRatioMeta: {
    fontSize: 11.5,
    color: tokens.warmGray,
    fontWeight: '400',
  },
  macroCalMeta: {
    fontSize: 11.5,
    color: tokens.warmGray,
    fontWeight: '400',
  },
  macroSeparator: {
    height: 1,
    backgroundColor: tokens.stoneBorder,
    marginVertical: 5,
  },
  exerciseCard: {
    padding: 14,
    borderRadius: tokens.radiusCard,
  },
  exerciseLastTrack: {
    marginBottom: 0,
  },
  secondaryGhostBtn: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: tokens.radiusPill,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
  },
  secondaryGhostBtnText: {
    fontSize: 11.5,
    color: tokens.inkBlack,
    fontWeight: '400',
  },
  macroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 8,
  },
  burnCalLarge: {
    fontSize: 28,
    fontWeight: '400',
    color: tokens.cyanEdge,
    letterSpacing: -0.5,
  },
  macroUnitText: {
    fontSize: 12.5,
    color: tokens.warmGray,
    fontWeight: '400',
  },
  footerActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
    backgroundColor: tokens.stoneCanvas,
    borderTopWidth: 1,
    borderTopColor: tokens.stoneBorder,
  },
  pillFab: {
    minHeight: 44,
    backgroundColor: '#0369a1',
    borderRadius: tokens.radiusPill,
    borderWidth: 1,
    borderColor: 'rgba(7, 89, 133, 0.2)',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#0369a1',
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
  pillFabText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
});
