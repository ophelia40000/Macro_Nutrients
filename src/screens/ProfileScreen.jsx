import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ConfirmModal from '../components/modals/ConfirmModal';
import FormErrorBanner from '../components/FormErrorBanner';
import { parseNumericInput } from '../utils/validation';

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

export default function ProfileScreen({
  goals,
  setGoals,
  onNavigate,
  authUser,
  isCloudSyncing = false,
  onOpenLogin,
  onSignOut,
}) {
  const [heightVal, setHeightVal] = useState(goals.height ? goals.height.toString() : '170');
  const [weightVal, setWeightVal] = useState(goals.weight ? goals.weight.toString() : '70');
  const [gender, setGender] = useState(goals.gender || 'male');
  const [neckVal, setNeckVal] = useState(goals.neck ? goals.neck.toString() : '38');
  const [waistVal, setWaistVal] = useState(goals.waist ? goals.waist.toString() : '80');
  const [hipVal, setHipVal] = useState(goals.hip ? goals.hip.toString() : '90');
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setHeightVal(goals.height ? goals.height.toString() : '170');
    setWeightVal(goals.weight ? goals.weight.toString() : '70');
    setGender(goals.gender || 'male');
    setNeckVal(goals.neck ? goals.neck.toString() : '38');
    setWaistVal(goals.waist ? goals.waist.toString() : '80');
    setHipVal(goals.hip ? goals.hip.toString() : '90');
    setErrorMsg('');
  }, [goals]);

  const calculateBodyFat = () => {
    const hRes = parseNumericInput(heightVal, { allowZero: false });
    const nRes = parseNumericInput(neckVal, { allowZero: false });
    const wRes = parseNumericInput(waistVal, { allowZero: false });
    const hpRes = parseNumericInput(hipVal, { allowZero: false });

    if (!hRes.valid || !nRes.valid || !wRes.valid) return '--%';
    const h = hRes.value;
    const n = nRes.value;
    const wst = wRes.value;

    let bf = 0;
    if (gender === 'male') {
      if (wst <= n) return '--%';
      bf = 495 / (1.0324 - 0.19077 * Math.log10(wst - n) + 0.15456 * Math.log10(h)) - 450;
    } else {
      if (!hpRes.valid) return '--%';
      const hp = hpRes.value;
      if (wst + hp <= n) return '--%';
      bf = 495 / (1.29579 - 0.35004 * Math.log10(wst + hp - n) + 0.22100 * Math.log10(h)) - 450;
    }

    if (bf < 2 || bf > 60 || isNaN(bf)) {
      return '--%';
    }
    return `${bf.toFixed(1)}%`;
  };

  const bodyFatStr = calculateBodyFat();

  const handleSave = () => {
    const hRes = parseNumericInput(heightVal, { allowZero: false });
    const wRes = parseNumericInput(weightVal, { allowZero: false });
    const nRes = parseNumericInput(neckVal, { allowZero: false });
    const wstRes = parseNumericInput(waistVal, { allowZero: false });
    const hpRes = gender === 'female' ? parseNumericInput(hipVal, { allowZero: false }) : { valid: true, value: parseFloat(hipVal) || goals.hip };

    if (!hRes.valid || !wRes.valid || !nRes.valid || !wstRes.valid || !hpRes.valid) {
      setErrorMsg('Enter valid positive numbers for height, weight, neck, waist, and hip measurements.');
      return;
    }

    setErrorMsg('');
    setGoals({
      ...goals,
      height: hRes.value,
      weight: wRes.value,
      gender,
      neck: nRes.value,
      waist: wstRes.value,
      hip: hpRes.value,
    });
    onNavigate('view-dashboard');
  };

  return (
    <View style={styles.viewContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={tokens.stoneCanvas} />

      <View style={styles.appHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.8}
          onPress={() => onNavigate('view-dashboard')}
          accessibilityLabel="Back to Home"
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="arrow-left" size={18} color={tokens.inkBlack} />
        </TouchableOpacity>
        <Text style={styles.appTitle}>Biometric Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.contentScrollable}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.identityCard}>
          <View style={styles.avatarCircle}>
            {authUser ? (
              <Text style={styles.avatarLetter}>
                {(authUser.displayName || authUser.email || 'U').charAt(0).toUpperCase()}
              </Text>
            ) : (
              <Feather name="user" size={32} color={tokens.cyanEdge} />
            )}
          </View>
          <Text style={styles.identityTitle}>
            {authUser ? (authUser.displayName || 'Google Account') : 'Body Metrics'}
          </Text>
          <Text style={styles.identitySub}>
            {authUser
              ? (authUser.email || 'Cloud sync enabled')
              : 'Physical statistics & body composition'}
          </Text>

          <View style={styles.cloudActionWrap}>
            {authUser ? (
              <View style={styles.cloudRow}>
                <View style={styles.cloudSyncBadge}>
                  <Feather name="cloud" size={12} color="#0369a1" />
                  <Text style={styles.cloudSyncBadgeText}>
                    {isCloudSyncing ? 'Syncing...' : 'Cloud Synced'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.signOutBtn}
                  activeOpacity={0.8}
                  onPress={() => setIsSignOutConfirmOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Sign out"
                >
                  <Feather name="log-out" size={13} color={tokens.warmGray} />
                  <Text style={styles.signOutBtnText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.googleConnectBtn}
                activeOpacity={0.85}
                onPress={onOpenLogin}
                accessibilityRole="button"
                accessibilityLabel="Sign in with Google to sync data"
              >
                <Ionicons name="logo-google" size={15} color="#4285F4" />
                <Text style={styles.googleConnectBtnText}>Sign in with Google</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>Core Dimensions</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.metricLabel}>Height</Text>
              <View style={styles.inputGroup}>
                <MaterialCommunityIcons
                  name="ruler"
                  size={16}
                  color={tokens.ashGray}
                />
                <TextInput
                  style={styles.input}
                  value={heightVal}
                  onChangeText={(v) => { setHeightVal(v); setErrorMsg(''); }}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={tokens.ashGray}
                  accessibilityLabel="Height in cm"
                />
                <Text style={styles.unitSuffix}>cm</Text>
              </View>
            </View>

            <View style={styles.col}>
              <Text style={styles.metricLabel}>Weight</Text>
              <View style={styles.inputGroup}>
                <MaterialCommunityIcons
                  name="scale-bathroom"
                  size={16}
                  color={tokens.ashGray}
                />
                <TextInput
                  style={styles.input}
                  value={weightVal}
                  onChangeText={(v) => { setWeightVal(v); setErrorMsg(''); }}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={tokens.ashGray}
                  accessibilityLabel="Weight in kg"
                />
                <Text style={styles.unitSuffix}>kg</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.bfHeader}>
            <View style={styles.bfTitleGroup}>
              <Text style={styles.cardHeaderTitle}>Body Fat</Text>
              <View style={styles.highlightBadge}>
                <Text style={styles.highlightBadgeText}>US Navy Formula</Text>
              </View>
            </View>
            <View style={styles.bfValueContainer}>
              <Text style={styles.bfValue}>{bodyFatStr}</Text>
              <Text style={styles.bfValueUnit}>estimated</Text>
            </View>
          </View>

          <View style={styles.fieldSection}>
            <Text style={styles.metricLabel}>Biological Sex</Text>
            <View style={styles.genderRow}>
              <TouchableOpacity
                style={[
                  styles.genderBtn,
                  gender === 'male' && styles.genderBtnActive,
                ]}
                activeOpacity={0.8}
                onPress={() => { setGender('male'); setErrorMsg(''); }}
                accessibilityLabel="Select Male"
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.genderBtnText,
                    gender === 'male' && styles.genderBtnTextActive,
                  ]}
                >
                  Male
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderBtn,
                  gender === 'female' && styles.genderBtnActive,
                ]}
                activeOpacity={0.8}
                onPress={() => { setGender('female'); setErrorMsg(''); }}
                accessibilityLabel="Select Female"
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.genderBtnText,
                    gender === 'female' && styles.genderBtnTextActive,
                  ]}
                >
                  Female
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.metricLabel}>Neck Circumference</Text>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  value={neckVal}
                  onChangeText={(v) => { setNeckVal(v); setErrorMsg(''); }}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={tokens.ashGray}
                  accessibilityLabel="Neck circumference in cm"
                />
                <Text style={styles.unitSuffix}>cm</Text>
              </View>
            </View>

            <View style={styles.col}>
              <Text style={styles.metricLabel}>Waist Circumference</Text>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  value={waistVal}
                  onChangeText={(v) => { setWaistVal(v); setErrorMsg(''); }}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={tokens.ashGray}
                  accessibilityLabel="Waist circumference in cm"
                />
                <Text style={styles.unitSuffix}>cm</Text>
              </View>
            </View>
          </View>

          {gender === 'female' && (
            <View style={[styles.fieldSection, { marginTop: 14 }]}>
              <Text style={styles.metricLabel}>Hip Circumference (Widest Point)</Text>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  value={hipVal}
                  onChangeText={(v) => { setHipVal(v); setErrorMsg(''); }}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={tokens.ashGray}
                  accessibilityLabel="Hip circumference in cm"
                />
                <Text style={styles.unitSuffix}>cm</Text>
              </View>
            </View>
          )}
        </View>

        <FormErrorBanner message={errorMsg} style={{ marginBottom: 0 }} />

        <TouchableOpacity
          style={styles.btnSave}
          activeOpacity={0.88}
          onPress={handleSave}
          accessibilityLabel="Save Profile Changes"
          accessibilityRole="button"
        >
          <Feather name="check" size={18} color="#ffffff" />
          <Text style={styles.btnSaveText}>Save Profile Changes</Text>
        </TouchableOpacity>
      </ScrollView>

      <ConfirmModal
        visible={isSignOutConfirmOpen}
        onClose={() => setIsSignOutConfirmOpen(false)}
        title="Sign Out"
        message="Switch back to local guest mode? Your cloud data remains safely stored in Firebase."
        confirmText="Sign Out"
        destructive
        onConfirm={() => {
          if (onSignOut) onSignOut();
        }}
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 12,
    backgroundColor: tokens.stoneCanvas,
    borderBottomWidth: 1,
    borderBottomColor: tokens.stoneBorder,
    ...(Platform.OS === 'web' ? { touchAction: 'none', overscrollBehavior: 'none' } : {}),
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: tokens.pureWhite,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  appTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: tokens.inkBlack,
    letterSpacing: -0.3,
  },
  contentScrollable: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'web' ? 'max(28px, env(safe-area-inset-bottom))' : 28,
    gap: 14,
  },
  identityCard: {
    alignItems: 'center',
    paddingVertical: 18,
    backgroundColor: tokens.pureWhite,
    borderRadius: tokens.radiusFeatureCard,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
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
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: tokens.stoneCanvas,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  identityTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: tokens.inkBlack,
    letterSpacing: -0.3,
  },
  identitySub: {
    fontSize: 13,
    color: tokens.warmGray,
    marginTop: 2,
  },
  avatarLetter: {
    fontSize: 26,
    fontWeight: '700',
    color: tokens.cyanEdge,
  },
  cloudActionWrap: {
    marginTop: 14,
  },
  cloudRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cloudSyncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#e0f2fe',
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cloudSyncBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369a1',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: tokens.stoneCanvas,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  signOutBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.warmGray,
  },
  googleConnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    backgroundColor: tokens.stoneCanvas,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  googleConnectBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: tokens.inkBlack,
  },
  card: {
    backgroundColor: tokens.pureWhite,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    borderRadius: tokens.radiusFeatureCard,
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
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: tokens.inkBlack,
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
    minWidth: 0,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: tokens.warmGray,
    marginBottom: 6,
  },
  inputGroup: {
    backgroundColor: tokens.stoneCanvas,
    borderRadius: tokens.radiusInput,
    paddingHorizontal: 12,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    minWidth: 0,
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: tokens.inkBlack,
    fontSize: 16,
    fontWeight: '500',
  },
  unitSuffix: {
    color: tokens.warmGray,
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 0,
  },
  bfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: tokens.stoneBorder,
  },
  bfTitleGroup: {
    flexDirection: 'column',
    gap: 4,
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
  bfValueContainer: {
    alignItems: 'flex-end',
  },
  bfValue: {
    fontSize: 32,
    fontWeight: '500',
    color: tokens.cyanEdge,
    letterSpacing: -0.8,
  },
  bfValueUnit: {
    fontSize: 11,
    color: tokens.warmGray,
    fontWeight: '400',
    marginTop: -2,
  },
  fieldSection: {
    marginBottom: 14,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: tokens.radiusPill,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderBtnActive: {
    borderColor: tokens.soot,
    backgroundColor: tokens.soot,
  },
  genderBtnText: {
    color: tokens.inkBlack,
    fontWeight: '500',
    fontSize: 13,
  },
  genderBtnTextActive: {
    color: '#ffffff',
  },
  btnSave: {
    backgroundColor: tokens.cyanSignal,
    borderRadius: tokens.radiusPill,
    borderWidth: 1,
    borderColor: tokens.cyanEdge,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#110c2e',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  btnSaveText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
});
