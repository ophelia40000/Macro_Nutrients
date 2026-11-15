import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadString,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyD2GwJXg0r2M1C_GJHl4P3NMxyqRbfVTPw',
  authDomain: 'macronutrients-8ee33.firebaseapp.com',
  projectId: 'macronutrients-8ee33',
  storageBucket: 'macronutrients-8ee33.firebasestorage.app',
  messagingSenderId: '450498654474',
  appId: '1:450498654474:web:ff81754fac649127e74af3',
  measurementId: 'G-QX18LBRVEK',
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export function subscribeAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function completeRedirectSignIn() {
  if (Platform.OS !== 'web') return null;
  try {
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch {
    return null;
  }
}

export async function signInWithGoogle() {
  if (Platform.OS !== 'web') {
    throw new Error('Google Sign-In is currently configured for Web/PWA.');
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    if (
      err?.code === 'auth/popup-blocked' ||
      err?.code === 'auth/operation-not-supported-in-this-environment'
    ) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw err;
  }
}

export async function signOutUser() {
  await signOut(auth);
}

export async function loadUserCloudData(uid) {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  const photosSnap = await getDocs(collection(db, 'users', uid, 'progressPhotos'));
  const photos = [];
  photosSnap.forEach((photoDoc) => {
    const d = photoDoc.data() || {};
    photos.push({
      id: d.id ?? photoDoc.id,
      date: d.date || '',
      weight: Number(d.weight) || 70,
      imagePath: d.imagePath || d.imageUrl || '',
    });
  });

  photos.sort((a, b) => {
    const timeA = a.date ? new Date(a.date).getTime() : NaN;
    const timeB = b.date ? new Date(b.date).getTime() : NaN;
    const valA = !isNaN(timeA) ? timeA : Number(a.id) || 0;
    const valB = !isNaN(timeB) ? timeB : Number(b.id) || 0;
    return valB - valA;
  });

  if (!userSnap.exists()) {
    return { exists: false, data: null, photos };
  }

  const raw = userSnap.data() || {};
  return {
    exists: true,
    data: {
      displayName: raw.displayName || '',
      email: raw.email || '',
      goals: raw.goals || null,
      entries: Array.isArray(raw.entries) ? raw.entries : [],
      presets: Array.isArray(raw.presets) ? raw.presets : null,
      burnedCalories: Number(raw.burnedCalories) || 0,
      workouts: Array.isArray(raw.workouts) ? raw.workouts : [],
      lastResetDate: raw.last_reset_date || raw.lastResetDate || null,
    },
    photos,
  };
}

export async function saveUserCloudData(uid, userInfo, statePayload) {
  const userRef = doc(db, 'users', uid);
  const payload = {
    displayName: userInfo?.displayName || '',
    email: userInfo?.email || '',
    goals: statePayload.goals,
    entries: statePayload.entries,
    presets: statePayload.presets,
    burnedCalories: Number(statePayload.burnedCalories) || 0,
    workouts: statePayload.workouts,
    last_reset_date: statePayload.lastResetDate,
  };
  await setDoc(userRef, payload, { merge: true });
}

export async function saveProgressPhotoCloud(uid, photo) {
  let finalImagePath = photo.imagePath || '';

  if (typeof finalImagePath === 'string' && finalImagePath.startsWith('data:')) {
    try {
      const storageRef = ref(storage, `users/${uid}/progressPhotos/${photo.id}.jpg`);
      await uploadString(storageRef, finalImagePath, 'data_url');
      finalImagePath = await getDownloadURL(storageRef);
    } catch {
      // Fall back to compressed data URL if Storage upload is unavailable or blocked by rules.
    }
  }

  const photoRef = doc(db, 'users', uid, 'progressPhotos', String(photo.id));
  await setDoc(photoRef, {
    id: photo.id,
    date: photo.date,
    weight: Number(photo.weight) || 70,
    imagePath: finalImagePath,
  });

  return finalImagePath;
}

export async function deleteProgressPhotoCloud(uid, photoId) {
  const photoRef = doc(db, 'users', uid, 'progressPhotos', String(photoId));
  await deleteDoc(photoRef);

  try {
    const storageRef = ref(storage, `users/${uid}/progressPhotos/${photoId}.jpg`);
    await deleteObject(storageRef);
  } catch {
    // Ignore if photo was stored as external URL or under a legacy path.
  }
}

