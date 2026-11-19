import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

/**
 * Accessible inline form validation banner pairing an alert icon with descriptive error text.
 */
export default function FormErrorBanner({ message, style }) {
  if (!message) return null;

  return (
    <View
      style={[styles.banner, style]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Feather name="alert-circle" size={15} color="#c8371d" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(200, 55, 29, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(200, 55, 29, 0.28)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
  },
  text: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '500',
    color: '#9a2411',
  },
});
