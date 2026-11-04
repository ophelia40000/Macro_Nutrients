import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  StatusBar,
  Platform,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import FullscreenPhotoModal from '../components/modals/FullscreenPhotoModal';

import progress1 from '../../assets/progress_1.jpg';
import progress2 from '../../assets/progress_2.jpg';
import progress3 from '../../assets/progress_3.jpg';

const DEFAULT_LOCAL_PHOTOS = [
  {
    id: 'prog_1',
    image: progress1,
    weight: 74.5,
    date: '12 Okt 2024',
  },
  {
    id: 'prog_2',
    image: progress2,
    weight: 72.8,
    date: '02 Nov 2024',
  },
  {
    id: 'prog_3',
    image: progress3,
    weight: 70.2,
    date: '24 Nov 2024',
  },
];

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

  radiusCard: 10,
  radiusFeatureCard: 16,
  radiusPill: 9999,
  radiusInput: 6,
};

export default function CameraScreen({
  photos = [],
  setPhotos,
  currentWeight = 70,
  onNavigate,
}) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [inputWeight, setInputWeight] = useState(currentWeight.toString());
  const [isFabHomeState, setIsFabHomeState] = useState(false);

  const displayPhotos = photos && photos.length > 0 ? photos : DEFAULT_LOCAL_PHOTOS;
  const latestWeight = displayPhotos[displayPhotos.length - 1]?.weight ?? 70.2;
  const totalPhotos = displayPhotos.length;
  const milestoneDays = 45;

  const handleFabPress = () => {
    if (isFabHomeState) {
      setIsFabHomeState(false);
      onNavigate('view-dashboard');
    } else {
      triggerPhotoCapture();
    }
  };

  const handleFabLongPress = () => {
    setIsFabHomeState((prev) => !prev);
  };

  const triggerPhotoCapture = () => {
    Alert.alert(
      'Take Progress Photo',
      'Choose a method to record your physique milestone:',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Denied', 'Camera permission is required.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              addPhotoEntry(result.assets[0].uri);
            }
          },
        },
        {
          text: 'Choose from Library',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Denied', 'Library permission is required.');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              addPhotoEntry(result.assets[0].uri);
            }
          },
        },
        {
          text: 'Enter Image URL',
          onPress: () => {
            setInputWeight(currentWeight.toString());
            setIsUrlModalOpen(true);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const addPhotoEntry = (imageUri, customWeight) => {
    const d = new Date();
    const dateFormatted = `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
    const newPhoto = {
      id: Date.now(),
      imagePath: imageUri,
      date: dateFormatted,
      weight: parseFloat(customWeight || currentWeight) || 70.0,
    };
    if (setPhotos) {
      setPhotos([...displayPhotos, newPhoto]);
    }
  };

  const handleSaveManualUrl = () => {
    if (!manualUrl.trim()) return;
    addPhotoEntry(manualUrl.trim(), inputWeight);
    setManualUrl('');
    setIsUrlModalOpen(false);
  };

  const handleOpenFullscreen = (photo) => {
    setSelectedPhoto(photo);
    setIsFullscreenOpen(true);
  };

  const handleDeletePhoto = (photoId) => {
    if (setPhotos) {
      setPhotos(displayPhotos.filter((p) => p.id !== photoId));
    }
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
            <Text style={styles.headerTitle}>Progress Journey</Text>
            <Text style={styles.headerSubtitle}>Visual physique timeline</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentScrollable}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroTelemetryCard}>
          <View style={styles.telemetryTopRow}>
            <Text style={styles.telemetryKicker}>PHYSIQUE TIMELINE</Text>
            <View style={styles.weightBadge}>
              <Text style={styles.weightBadgeText}>{latestWeight} kg terkini</Text>
            </View>
          </View>

          <View style={styles.kpiDock}>
            <View style={styles.kpiCol}>
              <Text style={styles.kpiValue}>{totalPhotos}</Text>
              <Text style={styles.kpiLabel}>Photos</Text>
            </View>
            <View style={styles.colSeparator} />
            <View style={styles.kpiCol}>
              <Text style={styles.kpiValue}>{milestoneDays}</Text>
              <Text style={styles.kpiLabel}>Milestone Days</Text>
            </View>
            <View style={styles.colSeparator} />
            <View style={styles.kpiCol}>
              <Text style={[styles.kpiValue, { color: tokens.cyanEdge }]}>
                {Math.round(currentWeight || 70)}
                <Text style={styles.kpiUnit}>kg</Text>
              </Text>
              <Text style={styles.kpiLabel}>Active Target</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Physique Gallery</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {displayPhotos.length} {displayPhotos.length === 1 ? 'photo' : 'photos'}
            </Text>
          </View>
        </View>

        {displayPhotos.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconBox}>
              <Feather name="camera" size={22} color={tokens.ashGray} />
            </View>
            <Text style={styles.emptyTitle}>No progress photos yet</Text>
            <Text style={styles.emptySub}>
              Take front, side, or back photos to calibrate your body composition changes over time.
            </Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={triggerPhotoCapture}
              accessibilityRole="button"
            >
              <Feather name="plus" size={14} color={tokens.inkBlack} />
              <Text style={styles.emptyAddBtnText}>Capture First Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.galleryRow}>
            {displayPhotos.map((photo) => {
              const imgSrc =
                photo.image ||
                (photo.imagePath ? { uri: photo.imagePath } : null);
              return (
                <TouchableOpacity
                  key={photo.id}
                  style={styles.photoCard}
                  activeOpacity={0.88}
                  onPress={() => handleOpenFullscreen(photo)}
                  accessibilityLabel={`View photo taken on ${photo.date}`}
                  accessibilityRole="button"
                >
                  <Image source={imgSrc} style={styles.photoImg} />
                  <View style={styles.photoWeightBadge}>
                    <Text style={styles.photoWeightText}>{photo.weight} kg</Text>
                  </View>
                  <Text style={styles.photoDateText}>{photo.date}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
        accessibilityLabel={isFabHomeState ? 'Return to Dashboard' : 'Capture Progress Photo'}
      >
        <Feather
          name={isFabHomeState ? 'home' : 'camera'}
          size={18}
          color="#ffffff"
        />
        <Text style={styles.fabPillText}>
          {isFabHomeState ? 'Home' : 'Capture Photo'}
        </Text>
      </TouchableOpacity>

      <FullscreenPhotoModal
        visible={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
        photo={selectedPhoto}
        onDelete={handleDeletePhoto}
      />

      <Modal visible={isUrlModalOpen} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.dialogBox}>
            <Text style={styles.dialogTitle}>Add Progress Photo</Text>
            <Text style={styles.dialogSub}>
              Enter image URL and body weight at capture.
            </Text>

            <View style={styles.inputGroup}>
              <Feather name="link" size={16} color={tokens.ashGray} />
              <TextInput
                style={styles.input}
                value={manualUrl}
                onChangeText={setManualUrl}
                placeholder="https://images.unsplash.com/photo-progress.jpg"
                placeholderTextColor={tokens.ashGray}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <MaterialCommunityIcons name="scale-bathroom" size={16} color={tokens.ashGray} />
              <TextInput
                style={styles.input}
                value={inputWeight}
                onChangeText={setInputWeight}
                placeholder="Weight"
                placeholderTextColor={tokens.ashGray}
                keyboardType="numeric"
              />
              <Text style={styles.unitSuffix}>kg</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnGhost}
                onPress={() => setIsUrlModalOpen(false)}
                accessibilityRole="button"
              >
                <Text style={styles.btnGhostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={handleSaveManualUrl}
                accessibilityRole="button"
              >
                <Text style={styles.btnPrimaryText}>Add Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  weightBadge: {
    backgroundColor: '#f5f5f4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: tokens.radiusPill,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
  },
  weightBadgeText: {
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
  kpiUnit: {
    fontSize: 13,
    fontWeight: '500',
    color: tokens.warmGray,
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
    fontSize: 16,
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
  galleryRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  photoCard: {
    flex: 1,
    height: 135,
    borderRadius: 12,
    backgroundColor: '#1c1917',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    position: 'relative',
  },
  photoImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoWeightBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: tokens.radiusPill,
  },
  photoWeightText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  photoDateText: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: -0.1,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  fabPill: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    minHeight: 46,
    backgroundColor: tokens.cyanSignal,
    borderRadius: tokens.radiusPill,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 40,
    ...Platform.select({
      ios: {
        shadowColor: '#110c2e',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.16,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 4px 14px rgba(59, 166, 241, 0.35)',
      },
    }),
  },
  fabHomeState: {
    backgroundColor: tokens.soot,
  },
  fabPillText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 10, 9, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: tokens.pureWhite,
    borderRadius: tokens.radiusFeatureCard,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    padding: 20,
    gap: 14,
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: tokens.inkBlack,
  },
  dialogSub: {
    fontSize: 12,
    color: tokens.warmGray,
    marginTop: -8,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.stoneCanvas,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    borderRadius: tokens.radiusInput,
    paddingHorizontal: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    height: 42,
    fontSize: 13,
    color: tokens.inkBlack,
  },
  unitSuffix: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.warmGray,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  btnGhost: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: tokens.radiusInput,
  },
  btnGhostText: {
    fontSize: 13,
    fontWeight: '600',
    color: tokens.warmGray,
  },
  btnPrimary: {
    backgroundColor: tokens.cyanSignal,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: tokens.radiusInput,
  },
  btnPrimaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
});
