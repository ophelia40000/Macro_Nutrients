import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { signInWithGoogle } from '../../services/firebase';

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

export default function LoginModal({ visible, onClose, onLogin }) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGooglePress = async () => {
    if (isLoading) return;
    setErrorMsg('');
    setIsLoading(true);
    try {
      const user = await signInWithGoogle();
      if (user) {
        if (onLogin) onLogin(user);
        onClose();
      }
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        setErrorMsg('Login dibatalkan sebelum selesai.');
      } else if (code === 'auth/unauthorized-domain') {
        setErrorMsg('Domain belum terdaftar di Firebase Authentication Authorized Domains.');
      } else {
        setErrorMsg(err?.message || 'Gagal login dengan Google.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.dialogBox}>
              <View style={styles.logoBox}>
                <Feather name="activity" size={28} color={tokens.cyanEdge} />
              </View>

              <Text style={styles.title}>Macro Journey</Text>
              <Text style={styles.sub}>
                Sign in with Google to load and sync your saved macros, workouts, and progress photos
              </Text>

              {!!errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

              <TouchableOpacity
                style={[styles.googleBtn, isLoading && styles.btnDisabled]}
                activeOpacity={0.85}
                disabled={isLoading}
                onPress={handleGooglePress}
                accessibilityLabel="Continue with Google"
                accessibilityRole="button"
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={tokens.cyanEdge} />
                ) : (
                  <Ionicons name="logo-google" size={18} color="#4285F4" />
                )}
                <Text style={styles.googleBtnText}>
                  {isLoading ? 'Signing in...' : 'Continue with Google'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.guestBtn}
                activeOpacity={0.8}
                disabled={isLoading}
                onPress={onClose}
                accessibilityLabel="Continue as Guest"
                accessibilityRole="button"
              >
                <Text style={styles.guestBtnText}>Continue as Guest</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 10, 9, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogBox: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: tokens.pureWhite,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.08,
        shadowRadius: 28,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  logoBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: tokens.stoneCanvas,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: tokens.inkBlack,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 6,
    textAlign: 'center',
  },
  sub: {
    color: tokens.warmGray,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    maxWidth: 260,
  },
  googleBtn: {
    width: '100%',
    height: 46,
    backgroundColor: tokens.pureWhite,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    borderRadius: tokens.radiusPill,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  errorText: {
    width: '100%',
    fontSize: 12,
    lineHeight: 17,
    color: '#c8371d',
    backgroundColor: 'rgba(200, 55, 29, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlign: 'center',
    marginBottom: 12,
  },
  googleBtnText: {
    color: tokens.inkBlack,
    fontSize: 14,
    fontWeight: '600',
  },
  guestBtn: {
    width: '100%',
    height: 44,
    backgroundColor: tokens.stoneCanvas,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    borderRadius: tokens.radiusPill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestBtnText: {
    color: tokens.warmGray,
    fontSize: 14,
    fontWeight: '600',
  },
});
