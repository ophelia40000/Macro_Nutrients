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
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import FullscreenPhotoModal from '../components/modals/FullscreenPhotoModal';

const { width } = Dimensions.get('window');
const GRID_GAP = 12;
const PADDING = 20;
const ITEM_SIZE = (Math.min(width, 480) - PADDING * 2 - GRID_GAP * 2) / 3;

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
    const newPhoto = {
      id: Date.now(),
      imagePath: imageUri,
      date: new Date().toISOString(),
      weight: parseFloat(customWeight || currentWeight) || 70.0,
    };
    setPhotos([newPhoto, ...photos]);
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
    setPhotos(photos.filter((p) => p.id !== photoId));
  };

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  const grouped = {};
  (photos || []).forEach((p) => {
    const d = new Date(p.date || Date.now());
    const key = `${monthNames[d.getMonth()].toUpperCase()} ${d.getDate()}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(p);
  });

  const totalPhotos = photos.length;
  const totalMilestones = Object.keys(grouped).length;

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
              <Text style={styles.weightBadgeText}>{currentWeight} kg current</Text>
            </View>
          </View>

          <View style={styles.kpiDock}>
            <View style={styles.kpiCol}>
              <Text style={styles.kpiValue}>{totalPhotos}</Text>
              <Text style={styles.kpiLabel}>Photos</Text>
            </View>
            <View style={styles.colSeparator} />
            <View style={styles.kpiCol}>
              <Text style={styles.kpiValue}>{totalMilestones}</Text>
              <Text style={styles.kpiLabel}>Milestone Days</Text>
            </View>
            <View style={styles.colSeparator} />
            <View style={styles.kpiCol}>
              <Text style={[styles.kpiValue, { color: tokens.cyanEdge }]}>
                {currentWeight}
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
              {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
            </Text>
          </View>
        </View>

        {photos.length === 0 ? (
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
          Object.keys(grouped).map((dateStr) => {
            const groupPhotos = grouped[dateStr];
            const displayWeight = groupPhotos[0]?.weight ?? currentWeight;

            return (
              <View key={dateStr} style={styles.dateGroup}>
                <View style={styles.dateHeader}>
                  <View style={styles.datePillBadge}>
                    <Text style={styles.datePillText}>{dateStr}</Text>
                  </View>
                  <Text style={styles.dateWeightText}>
                    {Number(displayWeight).toFixed(1)} kg
                  </Text>
                </View>

                <View style={styles.galleryGrid}>
                  {groupPhotos.map((photo) => (
                    <TouchableOpacity
                      key={photo.id}
                      style={styles.galleryItem}
                      activeOpacity={0.88}
                      onPress={() => handleOpenFullscreen(photo)}
                      accessibilityLabel={`View photo taken on ${dateStr}`}
                      accessibilityRole="button"
                    >
                      <Image
                        source={{ uri: photo.imagePath }}
                        style={styles.galleryImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
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
    backgroundColor: tokens.stoneCanvas,
    paddingHorizontal: 10,
    paddingVertical: 3,
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
  dateGroup: {
    gap: 10,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  datePillBadge: {
    backgroundColor: tokens.stoneCanvas,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    borderRadius: tokens.radiusPill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  datePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.inkBlack,
    letterSpacing: 0.5,
  },
  dateWeightText: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.warmGray,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  galleryItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: tokens.radiusCard,
    overflow: 'hidden',
    backgroundColor: tokens.pureWhite,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 10, 9, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogBox: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: tokens.pureWhite,
    borderRadius: tokens.radiusFeatureCard,
    padding: 20,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: tokens.inkBlack,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  dialogSub: {
    fontSize: 13,
    color: tokens.warmGray,
    marginBottom: 16,
  },
  inputGroup: {
    backgroundColor: tokens.stoneCanvas,
    borderRadius: tokens.radiusInput,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    paddingHorizontal: 14,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    color: tokens.inkBlack,
    fontSize: 14,
  },
  unitSuffix: {
    color: tokens.ashGray,
    fontSize: 12,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  btnGhost: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: tokens.radiusPill,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    backgroundColor: 'transparent',
  },
  btnGhostText: {
    color: tokens.warmGray,
    fontSize: 13,
    fontWeight: '600',
  },
  btnPrimary: {
    backgroundColor: tokens.cyanSignal,
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: tokens.radiusPill,
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
