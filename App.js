import React, { useState, useEffect } from 'react';
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
import { theme } from './src/styles/theme';

import DashboardScreen from './src/screens/DashboardScreen';
import DiaryScreen from './src/screens/DiaryScreen';
import ExerciseScreen from './src/screens/ExerciseScreen';
import CameraScreen from './src/screens/CameraScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const STORAGE_KEY = '@macro_journey_state_v1';

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

const DEFAULT_PRESETS = [
  { name: 'Nasi Putih (100g)', calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3 },
  { name: 'Roti Tawar (100g)', calories: 265, protein: 9, carbs: 49, fat: 3.2 },
  { name: 'Mie Instan (Porsi)', calories: 380, protein: 8, carbs: 54, fat: 14 },
];

const DEFAULT_ENTRIES = [
  { id: '1', name: 'Nasi Putih (300g)', protein: 5, carbs: 85, fat: 1, calories: 390 },
  { id: '2', name: 'Kakap', protein: 21, carbs: 11, fat: 16, calories: 275 },
  { id: '3', name: 'Naspad', protein: 71, carbs: 73, fat: 50, calories: 1020 },
  { id: '4', name: 'dada ayam mentah (250g)', protein: 56, carbs: 0, fat: 7, calories: 300 },
  { id: '5', name: 'Nasi Putih (200g)', protein: 3, carbs: 56, fat: 1, calories: 260 },
];

const DEFAULT_WORKOUTS = [
  {
    id: 'ex_1',
    name: 'Incline Dumbbell Press',
    region: 'Chest',
    history: [
      {
        date: getLocalDateStr(),
        sets: [
          { weight: 24, reps: 12 },
          { weight: 24, reps: 10 },
          { weight: 24, reps: 8 },
        ],
      },
    ],
  },
  {
    id: 'ex_2',
    name: 'Lat Pulldown',
    region: 'Back',
    history: [
      {
        date: getLocalDateStr(),
        sets: [
          { weight: 55, reps: 12 },
          { weight: 55, reps: 10 },
          { weight: 55, reps: 10 },
        ],
      },
    ],
  },
];

export default function App() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    Outfit_900Black,
  });

  const [currentView, setCurrentView] = useState('view-dashboard');
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const [entries, setEntries] = useState(DEFAULT_ENTRIES);
  const [presets, setPresets] = useState(DEFAULT_PRESETS);
  const [burnedCalories, setBurnedCalories] = useState(0);
  const [workouts, setWorkouts] = useState(DEFAULT_WORKOUTS);
  const [photos, setPhotos] = useState([]);
  const [lastResetDate, setLastResetDate] = useState(getLocalDateStr());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persisted state on startup
  useEffect(() => {
    async function loadData() {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        const today = getLocalDateStr();
        if (json) {
          const parsed = JSON.parse(json);
          if (parsed.goals) setGoals(parsed.goals);
          if (parsed.presets) setPresets(parsed.presets);
          if (parsed.workouts) setWorkouts(parsed.workouts);
          if (parsed.photos) setPhotos(parsed.photos);

          // Daily reset check matching public/js/app.js
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

  // Save state on change
  useEffect(() => {
    if (!isLoaded) return;
    async function saveData() {
      try {
        const payload = {
          goals,
          entries,
          presets,
          burnedCalories,
          workouts,
          photos,
          lastResetDate,
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (err) {
        console.error('Failed to save state', err);
      }
    }
    saveData();
  }, [goals, entries, presets, burnedCalories, workouts, photos, lastResetDate, isLoaded]);

  // Consumed totals
  const consumed = {
    calories: entries.reduce((sum, item) => sum + (Number(item.calories) || 0), 0),
    protein: entries.reduce((sum, item) => sum + (Number(item.protein) || 0), 0),
    carbs: entries.reduce((sum, item) => sum + (Number(item.carbs) || 0), 0),
    fat: entries.reduce((sum, item) => sum + (Number(item.fat) || 0), 0),
  };

  if (!fontsLoaded || !isLoaded) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={theme.accentLime} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fafaf9" />

      <View style={styles.appContainer}>
        {currentView === 'view-dashboard' && (
          <DashboardScreen
            goals={goals}
            setGoals={setGoals}
            consumed={consumed}
            burnedCalories={burnedCalories}
            setBurnedCalories={setBurnedCalories}
            onNavigate={setCurrentView}
            userInitial="R"
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
          />
        )}

        {currentView === 'view-profile' && (
          <ProfileScreen
            goals={goals}
            setGoals={setGoals}
            consumed={consumed}
            burnedCalories={burnedCalories}
            onNavigate={setCurrentView}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafaf9',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
});
