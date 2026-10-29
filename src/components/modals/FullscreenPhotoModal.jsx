import React from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

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
  negativeRed: '#e54d2e',
  negativeWash: 'rgba(229, 77, 46, 0.08)',

  radiusCard: 10,
  radiusFeatureCard: 16,
  radiusPill: 9999,
  radiusInput: 6,
};

export default function FullscreenPhotoModal({
  visible,
  onClose,
  photo,
  onDelete,
}) {
  if (!photo) return null;

  const dateFormatted = photo.date
    ? new Date(photo.date).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '--';

  const handleDelete = () => {
    Alert.alert(
      'Delete Progress Photo',
      'Remove this physique record permanently from your timeline?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(photo.id);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.btnClose}
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Close photo viewer"
          accessibilityRole="button"
        >
          <Feather name="x" size={20} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.contentContainer}>
          <Image
            source={{ uri: photo.imagePath }}
            style={styles.fullImage}
            resizeMode="contain"
          />

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
                  <Text style={styles.weightValue}>{photo.weight}</Text>
                  <Text style={styles.weightUnit}>kg recorded</Text>
                </View>
              </View>

              <View style={styles.timelineBadge}>
                <Text style={styles.timelineBadgeText}>MILESTONE</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.btnDelete}
              activeOpacity={0.8}
              onPress={handleDelete}
              accessibilityLabel="Delete progress photo"
              accessibilityRole="button"
            >
              <Feather name="trash-2" size={15} color={tokens.negativeRed} />
              <Text style={styles.btnDeleteText}>Delete Photo Record</Text>
            </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  btnClose: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 36,
    left: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
    gap: 16,
  },
  fullImage: {
    width: '100%',
    height: height * 0.54,
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
  btnDelete: {
    width: '100%',
    backgroundColor: tokens.negativeWash,
    borderWidth: 1,
    borderColor: tokens.negativeRed,
    borderRadius: tokens.radiusPill,
    height: 42,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  btnDeleteText: {
    color: tokens.negativeRed,
    fontSize: 13,
    fontWeight: '600',
  },
});
