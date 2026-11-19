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
  androidSurface: '#fafaf9',
  border: '#e8e6e5',
  activePillBg: '#e0f2fe',
  activePillBorder: 'rgba(59, 166, 241, 0.25)',
  activeIcon: '#0284c7',
  activeLabel: '#0369a1',
  inactiveInk: '#78716c',
  dangerInk: '#c8371b',
};

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

export default function BottomNavBar({
  currentView,
  onNavigate,
  isFramed = false,
  isAndroidWeb = false,
  selectionActions = null,
}) {
  const isSelectionBarActive = Boolean(selectionActions && selectionActions.count > 0);
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

  const innerTrackWidth = Math.max(0, trackWidth - 12);
  const tabWidth = innerTrackWidth / BOTTOM_NAV_ITEMS.length;

  const pillTranslateX = slideAnim.interpolate({
    inputRange: [0, BOTTOM_NAV_ITEMS.length - 1],
    outputRange: [0, tabWidth * (BOTTOM_NAV_ITEMS.length - 1)],
  });

  const selectionItems = isSelectionBarActive
    ? [
        {
          key: 'cancel',
          label: 'Cancel',
          iconName: 'close-circle-outline',
          iconSize: 20,
          color: DOCK_COLORS.inactiveInk,
          labelStyle: styles.tabLabelInactive,
          hoverBg: 'rgba(120, 113, 108, 0.1)',
          onPress: selectionActions.onCancel,
          accessibilityLabel: 'Cancel photo selection',
        },
        {
          key: 'send',
          label: 'Send',
          iconName: 'paper-plane',
          iconSize: 18,
          color: DOCK_COLORS.activeIcon,
          labelStyle: styles.tabLabelActive,
          hoverBg: 'rgba(2, 132, 199, 0.1)',
          onPress: selectionActions.onShare,
          accessibilityLabel: `Send ${selectionActions.count} selected ${selectionActions.count === 1 ? 'photo' : 'photos'}`,
        },
        {
          key: 'delete',
          label: 'Delete',
          iconName: 'trash-bin',
          iconSize: 18,
          color: DOCK_COLORS.dangerInk,
          labelStyle: styles.tabLabelDanger,
          hoverBg: 'rgba(200, 55, 27, 0.1)',
          onPress: selectionActions.onDelete,
          accessibilityLabel: `Delete ${selectionActions.count} selected ${selectionActions.count === 1 ? 'photo' : 'photos'}`,
        },
      ]
    : [];

  return (
    <View
      style={[
        styles.outerWrapper,
        isAndroidWeb && !isFramed && { backgroundColor: DOCK_COLORS.androidSurface },
        Platform.OS === 'web' &&
          !isFramed && {
            paddingBottom: 'clamp(8px, calc(env(safe-area-inset-bottom, 0px) * 0.65), 22px)',
          },
        isFramed && styles.outerWrapperFramed,
      ]}
    >
      <View
        style={styles.dockCard}
        accessibilityRole={isSelectionBarActive ? 'toolbar' : 'tablist'}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      >
        {isSelectionBarActive ? (
          selectionItems.map((action) => (
            <Pressable
              key={action.key}
              onPress={action.onPress}
              accessibilityRole="button"
              accessibilityLabel={action.accessibilityLabel}
              style={({ pressed, hovered }) => [
                styles.tabPressable,
                Platform.OS === 'web' && styles.webClickable,
                (pressed || hovered) && { backgroundColor: action.hoverBg },
                pressed && !reduceMotion && styles.actionPressed,
                pressed && reduceMotion && styles.actionPressedReduced,
              ]}
            >
              <View style={styles.tabInner}>
                <Ionicons name={action.iconName} size={action.iconSize} color={action.color} />
                <Text numberOfLines={1} style={[styles.tabLabel, action.labelStyle]}>
                  {action.label}
                </Text>
              </View>
            </Pressable>
          ))
        ) : (
          <>
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
                  style={[styles.tabPressable, Platform.OS === 'web' && styles.webClickable]}
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
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    width: '100%',
    backgroundColor: DOCK_COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: DOCK_COLORS.border,
    paddingTop: 5,
    paddingBottom: Platform.OS === 'ios' ? 8 : 8,
    ...(Platform.OS === 'web' ? { touchAction: 'none', overscrollBehavior: 'none' } : {}),
  },
  outerWrapperFramed: {
    paddingTop: 4,
    paddingBottom: 4,
  },
  dockCard: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 0,
  },
  slidingSlot: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 6,
    paddingHorizontal: 2,
  },
  slidingPill: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: DOCK_COLORS.activePillBg,
    borderWidth: 1,
    borderColor: DOCK_COLORS.activePillBorder,
  },
  tabPressable: {
    flex: 1,
    minWidth: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  webClickable: {
    cursor: 'pointer',
  },
  actionPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
  actionPressedReduced: {
    opacity: 0.85,
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
  tabLabelDanger: {
    fontWeight: '600',
    color: DOCK_COLORS.dangerInk,
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

