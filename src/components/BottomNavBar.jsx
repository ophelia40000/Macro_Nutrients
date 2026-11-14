import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export const BOTTOM_NAV_ITEMS = [
  { id: 'view-dashboard', label: 'Home', ariaLabel: 'Home Dashboard' },
  { id: 'view-diary', label: 'Diary', ariaLabel: 'Nutrition Diary' },
  { id: 'view-exercise', label: 'Exercise', ariaLabel: 'Exercise Tracker' },
  { id: 'view-camera', label: 'Progress', ariaLabel: 'Progress Journey' },
];

const DOCK_COLORS = {
  surface: '#ffffff',
  border: 'rgba(0, 0, 0, 0.06)',
  canvasDefault: '#fafaf9',
  canvasAlt: '#fcfbfa',
  activePillBg: '#e0f2fe',
  activePillBorder: 'rgba(59, 166, 241, 0.25)',
  activeIcon: '#0284c7',
  activeLabel: '#0369a1',
  inactiveInk: '#78716c',
};

/** Renders domain-matched icons for each top-level tab across iOS, Android, and Web. */
function TabIcon({ id, active }) {
  const color = active ? DOCK_COLORS.activeIcon : DOCK_COLORS.inactiveInk;

  switch (id) {
    case 'view-dashboard':
      return (
        <Ionicons
          name={active ? 'home' : 'home-outline'}
          size={19}
          color={color}
        />
      );
    case 'view-diary':
      return (
        <MaterialCommunityIcons
          name={active ? 'bowl-mix' : 'bowl-mix-outline'}
          size={20}
          color={color}
        />
      );
    case 'view-exercise':
      return (
        <Ionicons
          name={active ? 'flame' : 'flame-outline'}
          size={19}
          color={color}
        />
      );
    case 'view-camera':
      return (
        <View style={styles.viewfinderBox}>
          <View style={[styles.vfCorner, styles.vfTopLeft, { borderColor: color }]} />
          <View style={[styles.vfCorner, styles.vfTopRight, { borderColor: color }]} />
          <View style={[styles.vfCorner, styles.vfBottomLeft, { borderColor: color }]} />
          <View style={[styles.vfCorner, styles.vfBottomRight, { borderColor: color }]} />
          <View
            style={[
              styles.viewfinderRing,
              active ? styles.viewfinderRingActive : styles.viewfinderRingInactive,
              { borderColor: color },
            ]}
          >
            {active && (
              <View style={[styles.viewfinderCore, { backgroundColor: color }]} />
            )}
          </View>
        </View>
      );
    default:
      return null;
  }
}

/** Floating tonal sky-wash bottom navigation dock with sliding active pill. */
export default function BottomNavBar({
  currentView,
  onNavigate,
  isFramed = false,
}) {
  const activeNavIndex = BOTTOM_NAV_ITEMS.findIndex(
    (item) => item.id === currentView
  );

  const [trackWidth, setTrackWidth] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  const slideAnim = useRef(
    new Animated.Value(Math.max(0, activeNavIndex))
  ).current;
  const pillOpacity = useRef(
    new Animated.Value(activeNavIndex >= 0 ? 1 : 0)
  ).current;

  const iconLiftAnims = useRef(
    BOTTOM_NAV_ITEMS.map(
      (item) => new Animated.Value(item.id === currentView ? 1 : 0)
    )
  ).current;

  const pressScaleAnims = useRef(
    BOTTOM_NAV_ITEMS.map(() => new Animated.Value(1))
  ).current;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduceMotion(Boolean(enabled));
      })
      .catch(() => {});

    const sub = AccessibilityInfo.addEventListener?.(
      'reduceMotionChanged',
      (enabled) => {
        setReduceMotion(Boolean(enabled));
      }
    );

    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);

  useEffect(() => {
    const glideDuration = reduceMotion ? 0 : 300;
    const fadeDuration = reduceMotion ? 0 : 200;
    const glideEasing = Easing.bezier(0.22, 1, 0.36, 1);

    const animations = [
      Animated.timing(pillOpacity, {
        toValue: activeNavIndex >= 0 ? 1 : 0,
        duration: fadeDuration,
        useNativeDriver: true,
      }),
    ];

    if (activeNavIndex >= 0) {
      animations.push(
        Animated.timing(slideAnim, {
          toValue: activeNavIndex,
          duration: glideDuration,
          easing: glideEasing,
          useNativeDriver: true,
        })
      );
    }

    BOTTOM_NAV_ITEMS.forEach((item, idx) => {
      animations.push(
        Animated.timing(iconLiftAnims[idx], {
          toValue: item.id === currentView ? 1 : 0,
          duration: glideDuration,
          easing: glideEasing,
          useNativeDriver: true,
        })
      );
    });

    Animated.parallel(animations).start();
  }, [activeNavIndex, currentView, reduceMotion, slideAnim, pillOpacity, iconLiftAnims]);

  const handlePressIn = (idx) => {
    if (reduceMotion) return;
    Animated.timing(pressScaleAnims[idx], {
      toValue: 0.95,
      duration: 90,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (idx) => {
    if (reduceMotion) return;
    Animated.timing(pressScaleAnims[idx], {
      toValue: 1,
      duration: 140,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const innerTrackWidth = Math.max(0, trackWidth - 8);
  const tabWidth = innerTrackWidth / BOTTOM_NAV_ITEMS.length;

  const pillTranslateX = slideAnim.interpolate({
    inputRange: [0, BOTTOM_NAV_ITEMS.length - 1],
    outputRange: [0, tabWidth * (BOTTOM_NAV_ITEMS.length - 1)],
  });

  const dockBackdrop =
    currentView === 'view-dashboard' || currentView === 'view-diary'
      ? DOCK_COLORS.canvasDefault
      : DOCK_COLORS.canvasAlt;

  return (
    <View
      style={[
        styles.outerWrapper,
        isFramed && styles.outerWrapperFramed,
        { backgroundColor: dockBackdrop },
      ]}
    >
      <View
        style={styles.dockCard}
        accessibilityRole="tablist"
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      >
        {tabWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.slidingSlot,
              {
                width: tabWidth,
                opacity: pillOpacity,
                transform: [{ translateX: pillTranslateX }],
              },
            ]}
          >
            <View style={styles.slidingPill} />
          </Animated.View>
        )}

        {BOTTOM_NAV_ITEMS.map((item, idx) => {
          const isActive = currentView === item.id;
          const iconScale = reduceMotion
            ? 1
            : iconLiftAnims[idx].interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.1],
              });
          const iconTranslateY = reduceMotion
            ? 0
            : iconLiftAnims[idx].interpolate({
                inputRange: [0, 1],
                outputRange: [0, -1],
              });

          return (
            <Pressable
              key={item.id}
              onPress={() => onNavigate(item.id)}
              onPressIn={() => handlePressIn(idx)}
              onPressOut={() => handlePressOut(idx)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={item.ariaLabel}
              style={styles.tabPressable}
            >
              <Animated.View
                style={[
                  styles.tabInner,
                  { transform: [{ scale: pressScaleAnims[idx] }] },
                ]}
              >
                <Animated.View
                  style={{
                    transform: [
                      { scale: iconScale },
                      { translateY: iconTranslateY },
                    ],
                  }}
                >
                  <TabIcon id={item.id} active={isActive} />
                </Animated.View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.tabLabel,
                    isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                  ]}
                >
                  {item.label}
                </Text>
              </Animated.View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    width: '100%',
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 8 : 12,
  },
  outerWrapperFramed: {
    paddingTop: 4,
    paddingBottom: 6,
  },
  dockCard: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DOCK_COLORS.surface,
    borderRadius: 18,
    padding: 4,
    borderWidth: 1,
    borderColor: DOCK_COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: '#0c0a09',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 16px rgba(12, 10, 9, 0.06)',
      },
    }),
  },
  slidingSlot: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    paddingHorizontal: 2,
  },
  slidingPill: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: DOCK_COLORS.activePillBg,
    borderWidth: 1,
    borderColor: DOCK_COLORS.activePillBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#3ba6f1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.14,
        shadowRadius: 8,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 2px 8px rgba(59, 166, 241, 0.14)',
      },
    }),
  },
  tabPressable: {
    flex: 1,
    minWidth: 44,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: -0.1,
  },
  tabLabelActive: {
    fontWeight: '600',
    color: DOCK_COLORS.activeLabel,
  },
  tabLabelInactive: {
    fontWeight: '500',
    color: DOCK_COLORS.inactiveInk,
  },
  viewfinderBox: {
    width: 19,
    height: 19,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  vfCorner: {
    position: 'absolute',
    width: 5.5,
    height: 5.5,
  },
  vfTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 1.75,
    borderLeftWidth: 1.75,
    borderTopLeftRadius: 3,
  },
  vfTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 1.75,
    borderRightWidth: 1.75,
    borderTopRightRadius: 3,
  },
  vfBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 1.75,
    borderLeftWidth: 1.75,
    borderBottomLeftRadius: 3,
  },
  vfBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 1.75,
    borderRightWidth: 1.75,
    borderBottomRightRadius: 3,
  },
  viewfinderRing: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.65,
  },
  viewfinderRingInactive: {
    width: 7.5,
    height: 7.5,
    borderRadius: 3.75,
  },
  viewfinderRingActive: {
    width: 8.5,
    height: 8.5,
    borderRadius: 4.25,
  },
  viewfinderCore: {
    width: 3.5,
    height: 3.5,
    borderRadius: 1.75,
  },
});

