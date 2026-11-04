import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PhoneFrame({ children, time = '9:41', darkIcons = true }) {
  const iconColor = darkIcons ? '#000000' : '#ffffff';

  return (
    <View style={styles.rootWrapper}>
      <View
        style={styles.phoneOuter}
        nativeID="phone-chassis"
        testID="phone-chassis"
      >
        <View style={styles.phoneScreen}>
          {/* Status Bar */}
          <View style={styles.statusBar}>
            <Text style={[styles.timeText, { color: iconColor }]}>{time}</Text>

            <View style={styles.dynamicIsland}>
              <View style={styles.cameraLens} />
            </View>

            <View style={styles.statusIconsRow}>
              <View style={styles.signalGroup}>
                <View style={[styles.signalBar, { height: 4, backgroundColor: iconColor }]} />
                <View style={[styles.signalBar, { height: 6.5, backgroundColor: iconColor }]} />
                <View style={[styles.signalBar, { height: 9, backgroundColor: iconColor }]} />
                <View style={[styles.signalBar, { height: 11.5, backgroundColor: iconColor }]} />
              </View>

              <Ionicons name="wifi" size={15} color={iconColor} style={{ marginLeft: 5 }} />

              <View style={[styles.batteryShell, { borderColor: iconColor }]}>
                <View style={[styles.batteryCore, { backgroundColor: iconColor }]} />
              </View>
            </View>
          </View>

          {/* Screen Body */}
          <View style={styles.screenBody}>
            {children}
          </View>

          {/* Home Indicator */}
          <View style={styles.homeIndicatorDock}>
            <View style={styles.homeIndicatorBar} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootWrapper: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  phoneOuter: {
    width: 414,
    height: 896,
    padding: 12,
    backgroundColor: '#101216',
    borderRadius: 54,
    borderWidth: 4,
    borderColor: '#2C2F36',
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: '#fafaf9',
    borderRadius: 44,
    overflow: 'hidden',
    position: 'relative',
  },
  statusBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 26,
    pointerEvents: 'none',
  },
  timeText: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  dynamicIsland: {
    width: 112,
    height: 29,
    backgroundColor: '#000000',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 9,
  },
  cameraLens: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0F172A',
  },
  statusIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signalGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1.5,
  },
  signalBar: {
    width: 3,
    borderRadius: 0.5,
  },
  batteryShell: {
    width: 22,
    height: 11.5,
    borderWidth: 1.2,
    borderRadius: 3.5,
    padding: 1.5,
    marginLeft: 5,
  },
  batteryCore: {
    flex: 1,
    borderRadius: 1.5,
  },
  screenBody: {
    flex: 1,
    paddingTop: 48,
    paddingBottom: 22,
  },
  homeIndicatorDock: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
    zIndex: 100,
  },
  homeIndicatorBar: {
    width: 135,
    height: 4.5,
    backgroundColor: '#1C1C1E',
    borderRadius: 3,
  },
});
