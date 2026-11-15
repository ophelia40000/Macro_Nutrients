import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  Animated,
  Easing,
  PanResponder,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const tokens = {
  stoneCanvas: '#fafaf9',
  pureWhite: '#ffffff',
  stoneBorder: '#e8e6e5',
  stoneMuted: '#d6d3d1',
  ashGray: '#a8a29e',
  warmGray: '#78716c',
  inkBlack: '#0c0a09',
  cyanSignal: '#3ba6f1',
  cyanEdge: '#3398e1',

  radiusCard: 10,
  radiusFeatureCard: 16,
  radiusPill: 9999,
  radiusInput: 6,
};

export default function FullscreenPhotoModal({
  visible,
  onClose,
  photos = [],
  photo,
}) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [carouselWidth, setCarouselWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const dragX = useRef(new Animated.Value(0)).current;
  const isAnimatingRef = useRef(false);
  const stateRef = useRef({ safeIndex: 0, total: 1, slideWidth: 360 });

  const photoList =
    Array.isArray(photos) && photos.length > 0 ? photos : photo ? [photo] : [];
  const safeIndex = Math.min(activeIndex, Math.max(0, photoList.length - 1));
  const currentPhoto = photoList[safeIndex] || photo;
  const prevPhoto = safeIndex > 0 ? photoList[safeIndex - 1] : null;
  const nextPhoto = safeIndex < photoList.length - 1 ? photoList[safeIndex + 1] : null;

  const slideWidth =
    carouselWidth > 0
      ? carouselWidth
      : Math.max(260, Math.min(windowWidth - 40, 440));
  const imageHeight = Math.round(
    Math.min(Math.max(windowHeight * 0.52, 240), Math.max(240, windowHeight - 280))
  );

  stateRef.current = {
    safeIndex,
    total: photoList.length,
    slideWidth,
  };

  useEffect(() => {
    if (!visible) return;
    const foundIdx = photoList.findIndex((p) => p?.id === photo?.id);
    isAnimatingRef.current = false;
    dragX.setValue(0);
    setActiveIndex(foundIdx >= 0 ? foundIdx : 0);
  }, [visible, photo?.id]);

  // Reset relative drag offset synchronously after activeIndex updates to prevent flicker.
  useLayoutEffect(() => {
    dragX.setValue(0);
  }, [safeIndex, dragX]);

  const animateStep = useCallback(
    (direction) => {
      const { safeIndex: idx, total, slideWidth: width } = stateRef.current;
      const targetIndex = idx + direction;
      if (isAnimatingRef.current || width <= 0) return;

      if (targetIndex < 0 || targetIndex >= total) {
        isAnimatingRef.current = true;
        Animated.timing(dragX, {
          toValue: 0,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start(() => {
          isAnimatingRef.current = false;
        });
        return;
      }

      isAnimatingRef.current = true;
      Animated.timing(dragX, {
        toValue: direction > 0 ? -width : width,
        duration: 190,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start(() => {
        setActiveIndex(targetIndex);
        isAnimatingRef.current = false;
      });
    },
    [dragX]
  );

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !visible) {
      return;
    }
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        animateStep(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        animateStep(-1);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const slideSlots = [
    prevPhoto ? { item: prevPhoto, offset: -slideWidth, key: `prev-${prevPhoto.id}` } : null,
    { item: currentPhoto, offset: 0, key: `curr-${currentPhoto.id}` },
    nextPhoto ? { item: nextPhoto, offset: slideWidth, key: `next-${nextPhoto.id}` } : null,
  ].filter(Boolean);

  return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, animateStep, onClose]);

  // Single-item PanResponder guarantees one swipe moves at most one photo.
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () =>
          stateRef.current.total > 1 && !isAnimatingRef.current,
        onMoveShouldSetPanResponder: (_, gs) =>
          stateRef.current.total > 1 &&
          !isAnimatingRef.current &&
          Math.abs(gs.dx) > 6 &&
          Math.abs(gs.dx) > Math.abs(gs.dy),
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_, gs) => {
          const { safeIndex: idx, total, slideWidth: width } = stateRef.current;
          const atStart = idx === 0 && gs.dx > 0;
          const atEnd = idx === total - 1 && gs.dx < 0;
          const clampedDx = Math.max(-width, Math.min(width, gs.dx));
          dragX.setValue(atStart || atEnd ? clampedDx * 0.25 : clampedDx);
        },
        onPanResponderRelease: (_, gs) => {
          const { safeIndex: idx, total, slideWidth: width } = stateRef.current;
          const distanceThreshold = Math.min(55, width * 0.18);
          const isSwipeNext = gs.dx <= -distanceThreshold || gs.vx <= -0.35;
          const isSwipePrev = gs.dx >= distanceThreshold || gs.vx >= 0.35;

          if (isSwipeNext && idx < total - 1) {
            animateStep(1);
          } else if (isSwipePrev && idx > 0) {
            animateStep(-1);
          } else {
            isAnimatingRef.current = true;
            Animated.timing(dragX, {
              toValue: 0,
              duration: 160,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: false,
            }).start(() => {
              isAnimatingRef.current = false;
            });
          }
        },
        onPanResponderTerminate: () => {
          Animated.timing(dragX, {
            toValue: 0,
            duration: 160,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }).start(() => {
            isAnimatingRef.current = false;
          });
        },
      }),
    [animateStep, dragX]
  );

  if (!currentPhoto) return null;

  const parsedDate = currentPhoto.date ? new Date(currentPhoto.date) : null;
  const dateFormatted =
    parsedDate && !isNaN(parsedDate.getTime())
      ? parsedDate.toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : currentPhoto.date || '--';

  const getImgSource = (item) =>
    item?.image || (item?.imagePath ? { uri: item.imagePath } : null);

  const slideSlots = [
    prevPhoto ? { item: prevPhoto, offset: -slideWidth, key: `prev-${prevPhoto.id}` } : null,
    { item: currentPhoto, offset: 0, key: `curr-${currentPhoto.id}` },
    nextPhoto ? { item: nextPhoto, offset: slideWidth, key: `next-${nextPhoto.id}` } : null,
  ].filter(Boolean);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.btnClose}
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Close photo viewer"
            accessibilityRole="button"
          >
            <Feather name="x" size={20} color="#ffffff" />
          </TouchableOpacity>

          {photoList.length > 1 && (
            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>
                {safeIndex + 1} / {photoList.length}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.centerStage}>
          <View style={styles.contentContainer}>
            <View
              style={[styles.carouselBox, { height: imageHeight }]}
              onLayout={(e) => {
                const nextW = Math.floor(e.nativeEvent.layout.width);
                if (nextW > 0 && nextW !== carouselWidth) {
                  setCarouselWidth(nextW);
                }
              }}
              {...panResponder.panHandlers}
            >
              {slideSlots.map(({ item, offset, key }) => (
                <Animated.View
                  key={key}
                  style={[
                    styles.slideLayer,
                    {
                      width: slideWidth,
                      height: imageHeight,
                      left: offset,
                      transform: [{ translateX: dragX }],
                    },
                  ]}
                  pointerEvents="none"
                >
                  <Image
                    source={getImgSource(item)}
                    style={[styles.fullImage, { height: imageHeight }]}
                    resizeMode="contain"
                  />
                </Animated.View>
              ))}
            </View>

            <View style={styles.detailsCard}>
              <View style={styles.metaRow}>
                <View style={styles.metaLeft}>
                  <Text style={styles.dateText}>{dateFormatted}</Text>
                  <View style={styles.weightRow}>
                    <MaterialCommunityIcons
                      name="scale-bathroom"
                      size={16}
                      color={tokens.cyanEdge}
                    />
                    <Text style={styles.weightValue}>{currentPhoto.weight}</Text>
                    <Text style={styles.weightUnit}>kg recorded</Text>
                  </View>
                </View>

                <View style={styles.timelineBadge}>
                  <Text style={styles.timelineBadgeText}>MILESTONE</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 10, 9, 0.94)',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 52 : 24,
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
  },
  topBar: {
    width: '100%',
    maxWidth: 440,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  btnClose: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: tokens.radiusPill,
  },
  counterText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  centerStage: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
    gap: 16,
  },
  carouselBox: {
    width: '100%',
    borderRadius: tokens.radiusFeatureCard,
    overflow: 'hidden',
    position: 'relative',
    ...(Platform.OS === 'web'
      ? { userSelect: 'none', touchAction: 'pan-y' }
      : {}),
  },
  slideLayer: {
    position: 'absolute',
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    borderRadius: tokens.radiusFeatureCard,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: tokens.pureWhite,
    borderRadius: tokens.radiusFeatureCard,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    padding: 16,
    gap: 14,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  metaLeft: {
    gap: 4,
    flex: 1,
  },
  dateText: {
    color: tokens.inkBlack,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weightValue: {
    color: tokens.inkBlack,
    fontSize: 15,
    fontWeight: '700',
  },
  weightUnit: {
    color: tokens.warmGray,
    fontSize: 13,
  },
  timelineBadge: {
    backgroundColor: tokens.stoneCanvas,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: tokens.radiusPill,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
  },
  timelineBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.warmGray,
    letterSpacing: 0.5,
  },
});
