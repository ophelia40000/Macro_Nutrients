import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
  Outfit_900Black,
} from '@expo-google-fonts/outfit';

import DashboardScreen from './src/screens/DashboardScreen';
import DiaryScreen from './src/screens/DiaryScreen';
import ExerciseScreen from './src/screens/ExerciseScreen';
import CameraScreen from './src/screens/CameraScreen';
import ProfileScreen from './src/screens/ProfileScreen';

import PhoneFrame from './src/components/PhoneFrame';
import BottomNavBar from './src/components/BottomNavBar';
import LoginModal from './src/components/modals/LoginModal';
import {
  subscribeAuthState,
  completeRedirectSignIn,
  signOutUser,
  loadUserCloudData,
  saveUserCloudData,
  saveProgressPhotoCloud,
  deleteProgressPhotoCloud,
} from './src/services/firebase';

const GUEST_STORAGE_KEY = '@macro_journey_guest_v3';
const LEGACY_STORAGE_KEYS = ['@macro_journey_state_v1', '@macro_journey_state_v2'];
const getUserStorageKey = (uid) => `@macro_journey_user_v3_${uid}`;

function getLocalDateStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const DEFAULT_GOALS = {
  calories: 2250,
  carbs: 300,
  protein: 104,
  fat: 40,
  weight: 70.0,
  height: 170.0,
  gender: 'male',
  neck: 38.0,
  waist: 80.0,
  hip: 90.0,
};

const DEFAULT_PRESETS = [];

const DEFAULT_ENTRIES = [];

const DEFAULT_WORKOUTS = [];

const DEFAULT_PHOTOS = [];

export default function App() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    Outfit_900Black,
  });

  const [currentView, setCurrentView] = useState(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const v = params.get('view');
      if (v) return v;
    }
    return 'view-dashboard';
  });
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const [entries, setEntries] = useState(DEFAULT_ENTRIES);
  const [presets, setPresets] = useState(DEFAULT_PRESETS);
  const [burnedCalories, setBurnedCalories] = useState(0);
  const [workouts, setWorkouts] = useState(DEFAULT_WORKOUTS);
  const [photos, setPhotos] = useState(DEFAULT_PHOTOS);
  const [lastResetDate, setLastResetDate] = useState(getLocalDateStr());
  const [isLoaded, setIsLoaded] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudSyncedUid, setCloudSyncedUid] = useState(null);
  const [cameraSelectionBar, setCameraSelectionBar] = useState(null);

  const hasDismissedLoginRef = useRef(false);
  const wasAuthenticatedRef = useRef(false);
  const skipNextCloudSaveRef = useRef(false);
  const latestLocalStateRef = useRef(null);
  latestLocalStateRef.current = {
    goals,
    entries,
    presets,
    burnedCalories,
    workouts,
    lastResetDate,
  };

  const resetToEmptyState = () => {
    setGoals(DEFAULT_GOALS);
    setEntries(DEFAULT_ENTRIES);
    setPresets(DEFAULT_PRESETS);
    setBurnedCalories(0);
    setWorkouts(DEFAULT_WORKOUTS);
    setPhotos(DEFAULT_PHOTOS);
    setLastResetDate(getLocalDateStr());
  };

  useEffect(() => {
    async function loadData() {
      try {
        await AsyncStorage.multiRemove(LEGACY_STORAGE_KEYS);
        const json = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
        const today = getLocalDateStr();
        if (json) {
          const parsed = JSON.parse(json);
          if (parsed.goals) setGoals({ ...DEFAULT_GOALS, ...parsed.goals });
          if (parsed.presets) setPresets(parsed.presets);
          if (parsed.workouts) setWorkouts(parsed.workouts);
          if (parsed.photos) {
            setPhotos(parsed.photos);
          } else {
            setPhotos([]);
          }

          if (parsed.lastResetDate !== today) {
            setEntries([]);
            setBurnedCalories(0);
            setLastResetDate(today);
          } else {
            if (parsed.entries) setEntries(parsed.entries);
            if (parsed.burnedCalories !== undefined) setBurnedCalories(parsed.burnedCalories);
            setLastResetDate(parsed.lastResetDate || today);
          }
        } else {
          setLastResetDate(today);
        }
      } catch (err) {
        console.error('Failed to load state', err);
      } finally {
        setIsLoaded(true);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    let active = true;
    completeRedirectSignIn();

    const unsubscribe = subscribeAuthState(async (firebaseUser) => {
      if (!active) return;

      if (!firebaseUser) {
        setAuthUser(null);
        setCloudSyncedUid(null);
        setIsCloudSyncing(false);
        if (wasAuthenticatedRef.current) {
          wasAuthenticatedRef.current = false;
          resetToEmptyState();
          AsyncStorage.removeItem(GUEST_STORAGE_KEY).catch(() => { });
        }
        if (Platform.OS === 'web' && !hasDismissedLoginRef.current) {
          setIsLoginOpen(true);
        }
        return;
      }

      wasAuthenticatedRef.current = true;

      const userSummary = {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || '',
        email: firebaseUser.email || '',
        photoURL: firebaseUser.photoURL || '',
      };
      setAuthUser(userSummary);
      setIsCloudSyncing(true);
      setCloudSyncedUid(null);

      try {
        const cloudRes = await loadUserCloudData(firebaseUser.uid);
        if (!active) return;
        const today = getLocalDateStr();

        if (cloudRes.exists && cloudRes.data) {
          const c = cloudRes.data;
          const isNewDay = c.lastResetDate !== today;
          // Avoid pushing freshly loaded cloud state straight back unless day rolled over.
          skipNextCloudSaveRef.current = !isNewDay;

          if (c.goals) setGoals({ ...DEFAULT_GOALS, ...c.goals });
          if (c.presets) setPresets(c.presets);
          if (c.workouts) setWorkouts(c.workouts);
          setPhotos(cloudRes.photos || []);

          if (isNewDay) {
            setEntries([]);
            setBurnedCalories(0);
            setLastResetDate(today);
          } else {
            setEntries(c.entries || []);
            setBurnedCalories(c.burnedCalories || 0);
            setLastResetDate(c.lastResetDate || today);
          }
        } else {
          const snapshot = latestLocalStateRef.current;
          if (snapshot) {
            await saveUserCloudData(firebaseUser.uid, userSummary, {
              ...snapshot,
              lastResetDate: today,
            });
          }
        }

        if (active) {
          setCloudSyncedUid(firebaseUser.uid);
        }
      } catch (err) {
        console.error('Failed to load cloud data', err);
      } finally {
        if (active) {
          setIsCloudSyncing(false);
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || isCloudSyncing) return;
    if (authUser && cloudSyncedUid !== authUser.uid) return;

    async function saveData() {
      try {
        const targetKey = authUser
          ? getUserStorageKey(authUser.uid)
          : GUEST_STORAGE_KEY;
        const payload = {
          goals,
          entries,
          presets,
          burnedCalories,
          workouts,
          photos,
          lastResetDate,
        };
        await AsyncStorage.setItem(targetKey, JSON.stringify(payload));
      } catch (err) {
        console.error('Failed to save state', err);
      }
    }
    saveData();
  }, [goals, entries, presets, burnedCalories, workouts, photos, lastResetDate, isLoaded, isCloudSyncing, authUser, cloudSyncedUid]);

  useEffect(() => {
    if (!isLoaded || !authUser || cloudSyncedUid !== authUser.uid) return;
    if (skipNextCloudSaveRef.current) {
      skipNextCloudSaveRef.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsCloudSyncing(true);
        await saveUserCloudData(authUser.uid, authUser, {
          goals,
          entries,
          presets,
          burnedCalories,
          workouts,
          lastResetDate,
        });
      } catch (err) {
        console.error('Failed to sync cloud data', err);
      } finally {
        setIsCloudSyncing(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [goals, entries, presets, burnedCalories, workouts, lastResetDate, isLoaded, authUser, cloudSyncedUid]);

  const handleAddPhotoCloud = async (newPhoto) => {
    if (!authUser) return;
    try {
      setIsCloudSyncing(true);
      const finalUrl = await saveProgressPhotoCloud(authUser.uid, newPhoto);
      if (finalUrl && finalUrl !== newPhoto.imagePath) {
        setPhotos((prev) =>
          prev.map((p) => (p.id === newPhoto.id ? { ...p, imagePath: finalUrl } : p))
        );
      }
    } catch (err) {
      console.error('Failed to save progress photo to cloud', err);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleDeletePhotoCloud = async (photoId) => {
    if (!authUser) return;
    try {
      setIsCloudSyncing(true);
      await deleteProgressPhotoCloud(authUser.uid, photoId);
    } catch (err) {
      console.error('Failed to delete progress photo from cloud', err);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      hasDismissedLoginRef.current = false;
      await signOutUser();
      resetToEmptyState();
      await AsyncStorage.removeItem(GUEST_STORAGE_KEY);
    } catch (err) {
      console.error('Sign out failed', err);
    }
  };

  const isAndroidWeb =
    Platform.OS === 'web' &&
    typeof navigator !== 'undefined' &&
    /Android/i.test(navigator.userAgent || '');

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const isProfile = currentView === 'view-profile';
    const isNarrowMobile = typeof window !== 'undefined' && window.innerWidth <= 480;
    const bg =
      !isProfile && isNarrowMobile && !isAndroidWeb
        ? 'linear-gradient(to bottom, #fafaf9 0%, #fafaf9 50%, #ffffff 50%, #ffffff 100%)'
        : '#fafaf9';
    document.documentElement.style.background = bg;
    document.body.style.background = bg;
  }, [currentView, isAndroidWeb]);

  const consumed = {
    calories: entries.reduce((sum, item) => sum + (Number(item.calories) || 0), 0),
    protein: entries.reduce((sum, item) => sum + (Number(item.protein) || 0), 0),
    carbs: entries.reduce((sum, item) => sum + (Number(item.carbs) || 0), 0),
    fat: entries.reduce((sum, item) => sum + (Number(item.fat) || 0), 0),
  };

  if (!fontsLoaded || !isLoaded) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#0369a1" />
      </View>
    );
  }

  const isFrame =
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('frame') === 'true';

  const screenContent = (
    <View
      style={[
        styles.appContainer,
        currentView !== 'view-profile' && !isAndroidWeb && styles.appContainerWhiteBottom,
        isFrame && styles.frameInnerContent,
      ]}
    >
      <View style={styles.screenArea}>
        {currentView === 'view-dashboard' && (
          <DashboardScreen
            goals={goals}
            setGoals={setGoals}
            consumed={consumed}
            burnedCalories={burnedCalories}
            setBurnedCalories={setBurnedCalories}
            onNavigate={setCurrentView}
            userInitial="R"
            authUser={authUser}
            onOpenLogin={() => setIsLoginOpen(true)}
          />
        )}

        {currentView === 'view-diary' && (
          <DiaryScreen
            goals={goals}
            consumed={consumed}
            burnedCalories={burnedCalories}
            entries={entries}
            setEntries={setEntries}
            presets={presets}
            setPresets={setPresets}
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'view-exercise' && (
          <ExerciseScreen
            workouts={workouts}
            setWorkouts={setWorkouts}
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'view-camera' && (
          <CameraScreen
            photos={photos}
            setPhotos={setPhotos}
            currentWeight={goals.weight || 70}
            onNavigate={setCurrentView}
            isCloudAuthenticated={!!authUser}
            onAddPhotoCloud={handleAddPhotoCloud}
            onDeletePhotoCloud={handleDeletePhotoCloud}
            onSelectionBarChange={setCameraSelectionBar}
          />
        )}

        {currentView === 'view-profile' && (
          <ProfileScreen
            goals={goals}
            setGoals={setGoals}
            consumed={consumed}
            burnedCalories={burnedCalories}
            onNavigate={setCurrentView}
            authUser={authUser}
            isCloudSyncing={isCloudSyncing}
            onOpenLogin={() => setIsLoginOpen(true)}
            onSignOut={handleSignOut}
          />
        )}
      </View>

      {currentView !== 'view-profile' && (
        <BottomNavBar
          currentView={currentView}
          onNavigate={setCurrentView}
          isFramed={isFrame}
          isAndroidWeb={isAndroidWeb}
          selectionActions={currentView === 'view-camera' ? cameraSelectionBar : null}
        />
      )}

      <LoginModal
        visible={isLoginOpen}
        onClose={() => {
          hasDismissedLoginRef.current = true;
          setIsLoginOpen(false);
        }}
      />
    </View>
  );

  if (isFrame) {
    return (
      <View style={styles.webFrameRoot}>
        <PhoneFrame time="9:41" darkIcons={true}>
          {screenContent}
        </PhoneFrame>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        Platform.OS === 'web' &&
        currentView !== 'view-profile' &&
        styles.webContainerNoBottomSafeArea,
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fafaf9" />
      {screenContent}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  webFrameRoot: {
    flex: 1,
    minHeight: '100vh',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  frameInnerContent: {
    maxWidth: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: Platform.OS === 'web' ? 'transparent' : '#fafaf9',
    paddingTop:
      Platform.OS === 'web'
        ? 'env(safe-area-inset-top)'
        : Platform.OS === 'android'
          ? StatusBar.currentHeight
          : 0,
  },
  webContainerNoBottomSafeArea: {
    paddingBottom: 0,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  appContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: '#fafaf9',
  },
  appContainerWhiteBottom: {
    backgroundColor: '#ffffff',
  },
  screenArea: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    backgroundColor: '#fafaf9',
  },
});
