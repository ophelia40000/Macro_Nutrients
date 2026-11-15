import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Modal,
  TextInput,
  StatusBar,
  Platform,
  Share,
  useWindowDimensions,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import FullscreenPhotoModal from '../components/modals/FullscreenPhotoModal';
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
  skyWash: '#c1e1f7',
  cyanSignal: '#3ba6f1',
  cyanEdge: '#0369a1',

  radiusCard: 10,
  radiusFeatureCard: 16,
  radiusPill: 9999,
  radiusInput: 6,
};

function getPhotoSortTime(photo) {
  const parsed = photo?.date ? new Date(photo.date).getTime() : NaN;
  if (!isNaN(parsed)) return parsed;
  return Number(photo?.id) || 0;
}

function formatPhotoDate(dateVal) {
  if (!dateVal) return '--';
  const str = String(dateVal);
  // Format ISO timestamps (e.g. 2026-09-13T02:45:41.027Z) nicely; preserve preformatted strings.
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return `${String(parsed.getDate()).padStart(2, '0')} ${parsed.toLocaleString('default', { month: 'short' })} ${parsed.getFullYear()}`;
    }
  }
  return str;
}

export default function CameraScreen({
  photos = [],
  setPhotos,
  currentWeight = 70,
  onNavigate,
  isCloudAuthenticated = false,
  onAddPhotoCloud,
  onDeletePhotoCloud,
  onSelectionBarChange,
}) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [inputWeight, setInputWeight] = useState(currentWeight.toString());
  const [isCaptureSheetOpen, setIsCaptureSheetOpen] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [noticeState, setNoticeState] = useState(null);
  const [galleryWidth, setGalleryWidth] = useState(0);
  const { width: windowWidth } = useWindowDimensions();

  const availableGalleryWidth =
    galleryWidth > 0
      ? galleryWidth
      : Math.max(240, Math.min(windowWidth, 480) - 40);
  const galleryCols = availableGalleryWidth >= 300 ? 3 : 2;
  const galleryGap = 10;
  const photoCardWidth = Math.floor(
    (availableGalleryWidth - galleryGap * (galleryCols - 1)) / galleryCols
  );
  const photoCardHeight = Math.round(photoCardWidth * 1.32);

  const rawPhotos = Array.isArray(photos) ? photos : [];
  const displayPhotos = [...rawPhotos].sort(
    (a, b) => getPhotoSortTime(b) - getPhotoSortTime(a)
  );
  const isSelectionMode = selectedPhotoIds.length > 0;
  const selectedPhotos = displayPhotos.filter((p) =>
    selectedPhotoIds.includes(p.id)
  );
  const latestWeight = displayPhotos[0]?.weight ?? currentWeight ?? 70;
  const totalPhotos = displayPhotos.length;
  const milestoneDays = (() => {
    if (displayPhotos.length === 0) return 0;
    const timestamps = displayPhotos
      .map((p) => getPhotoSortTime(p))
      .filter((t) => t > 0);
    if (timestamps.length < 2) return 1;
    const spanMs = Math.max(...timestamps) - Math.min(...timestamps);
    return Math.max(1, Math.round(spanMs / (1000 * 60 * 60 * 24)));
  })();

  const prepareImageUriForStorage = (uri) => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !uri) {
      return Promise.resolve(uri);
    }
    return new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const maxDim = 960;
          const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(uri);
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.78));
        } catch {
          resolve(uri);
        }
      };
      img.onerror = () => resolve(uri);
      img.src = uri;
    });
  };

  const handleCameraPick = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setNoticeState({
        title: 'Permission Denied',
        message: 'Camera permission is required.',
      });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const persistedUri = await prepareImageUriForStorage(result.assets[0].uri);
      addPhotoEntry(persistedUri);
    }
  };

  const handleLibraryPick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setNoticeState({
        title: 'Permission Denied',
        message: 'Library permission is required.',
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const persistedUri = await prepareImageUriForStorage(result.assets[0].uri);
      addPhotoEntry(persistedUri);
    }
  };

  const triggerPhotoCapture = () => {
    setIsCaptureSheetOpen(true);
  };

  const addPhotoEntry = (imageUri, customWeight) => {
    const newPhoto = {
      id: Date.now(),
      imagePath: imageUri,
      date: new Date().toISOString(),
      weight: parseFloat(customWeight || currentWeight) || 70.0,
    };
    if (setPhotos) {
      setPhotos([newPhoto, ...rawPhotos]);
    }
    if (onAddPhotoCloud) {
      onAddPhotoCloud(newPhoto);
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

  const clearSelection = () => {
    setSelectedPhotoIds([]);
  };

  const togglePhotoSelection = (photoId) => {
    setSelectedPhotoIds((prev) =>
      prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId]
    );
  };

  const handlePhotoPress = (photo) => {
    if (isSelectionMode) {
      togglePhotoSelection(photo.id);
      return;
    }
    handleOpenFullscreen(photo);
  };

  const handlePhotoLongPress = (photo) => {
    if (!photo?.id) return;
    setSelectedPhotoIds((prev) =>
      prev.includes(photo.id) ? prev : [...prev, photo.id]
    );
  };

  const handleShareSelected = async () => {
    if (selectedPhotos.length === 0) return;
    const isSingle = selectedPhotos.length === 1;
    const first = selectedPhotos[0];
    const firstUri = first?.imagePath || first?.image?.uri || '';
    const shareText = isSingle
      ? `Progress Photo (${formatPhotoDate(first.date)} • ${first.weight} kg)`
      : `${selectedPhotos.length} Progress Photos (${selectedPhotos
          .map((p) => `${formatPhotoDate(p.date)} ${p.weight}kg`)
          .join(', ')})`;

    if (Platform.OS === 'web') {
      try {
        if (typeof navigator !== 'undefined' && navigator.share) {
          const files = (
            await Promise.all(
              selectedPhotos.map(async (item, idx) => {
                const uri = item?.imagePath || item?.image?.uri || '';
                if (!uri) return null;
                try {
                  const response = await fetch(uri);
                  const blob = await response.blob();
                  return new File(
                    [blob],
                    `progress-photo-${item.id || idx + 1}.jpg`,
                    { type: blob.type || 'image/jpeg' }
                  );
                } catch {
                  return null;
                }
              })
            )
          ).filter(Boolean);

          if (
            files.length > 0 &&
            navigator.canShare &&
            navigator.canShare({ files })
          ) {
            await navigator.share({
              title: isSingle ? 'Progress Photo' : 'Progress Photos',
              text: shareText,
              files,
            });
            clearSelection();
            return;
          }

          if (isSingle && /^https?:\/\//i.test(firstUri)) {
            await navigator.share({
              title: 'Progress Photo',
              text: shareText,
              url: firstUri,
            });
            clearSelection();
            return;
          }
        }
      } catch (err) {
        if (err?.name === 'AbortError') return;
      }

      const downloadablePhotos = selectedPhotos.filter((item) =>
        /^(data:|blob:)/i.test(item?.imagePath || item?.image?.uri || '')
      );
      if (typeof document !== 'undefined' && downloadablePhotos.length > 0) {
        downloadablePhotos.forEach((item, idx) => {
          const uri = item.imagePath || item.image?.uri;
          const link = document.createElement('a');
          link.href = uri;
          link.download = `progress-photo-${item.id || idx + 1}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
        clearSelection();
        setNoticeState({
          title:
            downloadablePhotos.length === 1
              ? 'Photo Downloaded'
              : `${downloadablePhotos.length} Photos Downloaded`,
          message:
            'Direct sharing is unavailable in this browser, so the selected photos were downloaded instead.',
        });
        return;
      }

      const externalLinks = selectedPhotos
        .map((item) => item?.imagePath || item?.image?.uri || '')
        .filter((uri) => /^https?:\/\//i.test(uri));
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard?.writeText &&
        externalLinks.length > 0
      ) {
        try {
          await navigator.clipboard.writeText(externalLinks.join('\n'));
          clearSelection();
          setNoticeState({
            title:
              externalLinks.length === 1 ? 'Link Copied' : 'Links Copied',
            message: 'Selected photo links copied to your clipboard.',
          });
          return;
        } catch {
        }
      }

      setNoticeState({
        title: 'Share Unavailable',
        message: 'Sharing these photos is not supported in the current browser.',
      });
      return;
    }

    try {
      const shareLinks = selectedPhotos
        .map((item) => item?.imagePath || item?.image?.uri || '')
        .filter((uri) => uri && !/^data:/i.test(uri));
      const shareMessage =
        shareLinks.length > 0
          ? `${shareText}\n${shareLinks.join('\n')}`
          : shareText;
      const result = await Share.share({
        title: isSingle ? 'Progress Photo' : 'Progress Photos',
        message: shareMessage,
        ...(isSingle && firstUri ? { url: firstUri } : {}),
      });
      if (result?.action !== Share.dismissedAction) {
        clearSelection();
      }
    } catch {
      setNoticeState({
        title: 'Share Failed',
        message: 'Unable to share the selected progress photos right now.',
      });
    }
  };

  const handleDeleteSelected = () => {
    if (selectedPhotoIds.length === 0) return;
    const idsToDelete = new Set(selectedPhotoIds);
    if (setPhotos) {
      setPhotos(displayPhotos.filter((p) => !idsToDelete.has(p.id)));
    }
    if (onDeletePhotoCloud) {
      selectedPhotoIds.forEach((id) => onDeletePhotoCloud(id));
    }
    clearSelection();
  };

  const selectionHandlersRef = useRef({});
  selectionHandlersRef.current = {
    onShare: handleShareSelected,
    onDelete: () => setIsDeleteConfirmOpen(true),
    onCancel: clearSelection,
  };

  useEffect(() => {
    if (!onSelectionBarChange) return;
    if (selectedPhotoIds.length > 0) {
      onSelectionBarChange({
        count: selectedPhotoIds.length,
        onShare: () => selectionHandlersRef.current.onShare?.(),
        onDelete: () => selectionHandlersRef.current.onDelete?.(),
        onCancel: () => selectionHandlersRef.current.onCancel?.(),
      });
    } else {
      onSelectionBarChange(null);
    }
  }, [selectedPhotoIds.length, onSelectionBarChange]);

  useEffect(() => {
    return () => {
      if (onSelectionBarChange) {
        onSelectionBarChange(null);
      }
    };
  }, [onSelectionBarChange]);

  return (
    <View style={styles.viewContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={tokens.stoneCanvas} />

      <View style={styles.appHeader}>
        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerTitle}>
            {isSelectionMode ? `${selectedPhotoIds.length} selected` : 'Progress Journey'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isSelectionMode ? 'Tap photos to select' : 'Visual physique timeline'}
          </Text>
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
              <Text style={styles.weightBadgeText}>{latestWeight} kg latest</Text>
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
              <Feather name="camera" size={22} color={tokens.warmGray} />
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
          <View
            style={[styles.galleryRow, { gap: galleryGap }]}
            onLayout={(e) => {
              const nextWidth = Math.floor(e.nativeEvent.layout.width);
              if (nextWidth > 0 && nextWidth !== galleryWidth) {
                setGalleryWidth(nextWidth);
              }
            }}
          >
            {displayPhotos.map((photo) => {
              const imgSrc =
                photo.image ||
                (photo.imagePath ? { uri: photo.imagePath } : null);
              const isSelected = selectedPhotoIds.includes(photo.id);
              return (
                <TouchableOpacity
                  key={photo.id}
                  style={[
                    styles.photoCard,
                    { width: photoCardWidth, height: photoCardHeight },
                    isSelected && styles.photoCardSelected,
                  ]}
                  activeOpacity={0.88}
                  onPress={() => handlePhotoPress(photo)}
                  onLongPress={() => handlePhotoLongPress(photo)}
                  delayLongPress={400}
                  accessibilityLabel={
                    isSelectionMode
                      ? `${isSelected ? 'Deselect' : 'Select'} photo taken on ${photo.date}`
                      : `View photo taken on ${photo.date}. Hold to select`
                  }
                  accessibilityRole="button"
                >
                  <Image source={imgSrc} style={styles.photoImg} pointerEvents="none" />
                  {isSelected && <View style={styles.photoSelectedTint} pointerEvents="none" />}
                  <View style={styles.photoWeightBadge}>
                    <Text style={styles.photoWeightText}>{photo.weight} kg</Text>
                  </View>
                  {isSelectionMode && (
                    <View
                      style={[
                        styles.selectionCheckCircle,
                        isSelected && styles.selectionCheckCircleActive,
                      ]}
                      pointerEvents="none"
                    >
                      {isSelected && (
                        <Feather name="check" size={12} color="#ffffff" />
                      )}
                    </View>
                  )}
                  <View style={styles.photoDateFooter}>
                    <Text
                      style={styles.photoDateText}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {formatPhotoDate(photo.date)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {!isSelectionMode && (
        <TouchableOpacity
          style={styles.fabPill}
          activeOpacity={0.88}
          onPress={triggerPhotoCapture}
          accessibilityRole="button"
          accessibilityLabel="Capture Progress Photo"
        >
          <Feather name="camera" size={18} color="#ffffff" />
          <Text style={styles.fabPillText}>Capture Photo</Text>
        </TouchableOpacity>
      )}

      <FullscreenPhotoModal
        visible={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
        photos={displayPhotos}
        photo={selectedPhoto}
      />

      <Modal visible={isUrlModalOpen} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.dialogBox}>
            <Text style={styles.dialogTitle}>Add Progress Photo</Text>
            <Text style={styles.dialogSub}>
              Enter image URL and body weight at capture.
            </Text>

            <View style={styles.inputGroup}>
              <Feather name="link" size={16} color={tokens.warmGray} />
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
              <MaterialCommunityIcons name="scale-bathroom" size={16} color={tokens.warmGray} />
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

      <ConfirmModal
        visible={isCaptureSheetOpen}
        onClose={() => setIsCaptureSheetOpen(false)}
        title="Take Progress Photo"
        message="Choose a method to record your physique milestone:"
        actions={[
          {
            label: 'Camera',
            icon: 'camera',
            tone: 'primary',
            onPress: handleCameraPick,
          },
          {
            label: 'Choose from Library',
            icon: 'image',
            onPress: handleLibraryPick,
          },
          {
            label: 'Enter Image URL',
            icon: 'link',
            onPress: () => {
              setInputWeight(currentWeight.toString());
              setIsUrlModalOpen(true);
            },
          },
        ]}
      />

      <ConfirmModal
        visible={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title={
          selectedPhotoIds.length === 1
            ? 'Delete Progress Photo'
            : `Delete ${selectedPhotoIds.length} Photos`
        }
        message={
          selectedPhotoIds.length === 1
            ? 'Remove this physique record permanently from your timeline?'
            : `Remove ${selectedPhotoIds.length} selected physique records permanently from your timeline?`
        }
        confirmText="Delete"
        destructive
        onConfirm={handleDeleteSelected}
      />

      <ConfirmModal
        visible={!!noticeState}
        onClose={() => setNoticeState(null)}
        title={noticeState?.title}
        message={noticeState?.message}
        confirmText="OK"
        hideCancel
        onConfirm={() => setNoticeState(null)}
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
    paddingBottom: 84,
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
    color: tokens.warmGray,
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
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  photoCard: {
    borderRadius: 12,
    backgroundColor: '#1c1917',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    position: 'relative',
    ...(Platform.OS === 'web'
      ? { userSelect: 'none', WebkitTouchCallout: 'none' }
      : {}),
  },
  photoCardSelected: {
    borderWidth: 2.5,
    borderColor: tokens.cyanSignal,
  },
  photoImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoSelectedTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(59, 166, 241, 0.18)',
  },
  selectionCheckCircle: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(12, 10, 9, 0.4)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionCheckCircleActive: {
    backgroundColor: tokens.cyanSignal,
    borderColor: '#ffffff',
  },
  photoWeightBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(12, 10, 9, 0.72)',
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
  photoDateFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(12, 10, 9, 0.62)',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  photoDateText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  fabPill: {
    position: 'absolute',
    bottom: 16,
    right: 20,
    minHeight: 46,
    backgroundColor: tokens.cyanEdge,
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
        boxShadow: '0 4px 14px rgba(3, 105, 161, 0.28)',
      },
    }),
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
    backgroundColor: tokens.cyanEdge,
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
