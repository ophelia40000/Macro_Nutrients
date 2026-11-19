import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import useModalEscape from '../../hooks/useModalEscape';

const tokens = {
  pureWhite: '#ffffff',
  stoneCanvas: '#fafaf9',
  stoneBorder: '#e8e6e5',
  stoneMuted: '#d6d3d1',
  warmGray: '#78716c',
  inkBlack: '#0c0a09',
  cyanSignal: '#0369a1',
  cyanEdge: '#0369a1',
  negativeRed: '#c8371b',
  negativeWash: 'rgba(200, 55, 27, 0.08)',
  negativeBorder: 'rgba(200, 55, 27, 0.24)',
  skyWash: 'rgba(3, 105, 161, 0.1)',
};

/**
 * Web/PWA-safe bottom-sheet confirmation & action sheet modal replacing Alert.alert.
 */
export default function ConfirmModal({
  visible,
  onClose,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
  onConfirm,
  actions,
  hideCancel = false,
}) {
  useModalEscape(visible, onClose);
  const hasActionList = Array.isArray(actions) && actions.length > 0;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.dragHandle} />

              <View style={styles.headerBlock}>
                {!!title && <Text style={styles.title}>{title}</Text>}
                {!!message && <Text style={styles.message}>{message}</Text>}
              </View>

              {hasActionList ? (
                <View style={styles.actionList}>
                  {actions.map((item, idx) => {
                    const isDestructive = item.tone === 'destructive';
                    const isPrimary = item.tone === 'primary';
                    return (
                      <TouchableOpacity
                        key={`${item.label}-${idx}`}
                        style={[
                          styles.optionBtn,
                          isPrimary && styles.optionBtnPrimary,
                          isDestructive && styles.optionBtnDestructive,
                        ]}
                        activeOpacity={0.85}
                        onPress={() => {
                          onClose();
                          if (item.onPress) item.onPress();
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={item.label}
                      >
                        {!!item.icon && (
                          <Feather
                            name={item.icon}
                            size={16}
                            color={
                              isPrimary
                                ? '#ffffff'
                                : isDestructive
                                  ? tokens.negativeRed
                                  : tokens.inkBlack
                            }
                          />
                        )}
                        <Text
                          style={[
                            styles.optionBtnText,
                            isPrimary && styles.optionBtnPrimaryText,
                            isDestructive && styles.optionBtnDestructiveText,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  {!hideCancel && (
                    <TouchableOpacity
                      style={styles.btnCancelFull}
                      activeOpacity={0.8}
                      onPress={onClose}
                      accessibilityRole="button"
                      accessibilityLabel={cancelText}
                    >
                      <Text style={styles.btnSecondaryText}>{cancelText}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.buttonRow}>
                  {!hideCancel && (
                    <TouchableOpacity
                      style={styles.btnSecondary}
                      activeOpacity={0.8}
                      onPress={onClose}
                      accessibilityRole="button"
                      accessibilityLabel={cancelText}
                    >
                      <Text style={styles.btnSecondaryText}>{cancelText}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.btnConfirm,
                      destructive && styles.btnDestructive,
                    ]}
                    activeOpacity={0.88}
                    onPress={() => {
                      onClose();
                      if (onConfirm) onConfirm();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={confirmText}
                  >
                    <Text style={styles.btnConfirmText}>{confirmText}</Text>
                  </TouchableOpacity>
                </View>
              )}
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
    backgroundColor: 'rgba(12, 10, 9, 0.48)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: tokens.pureWhite,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 22,
    gap: 16,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: tokens.stoneMuted,
    alignSelf: 'center',
  },
  headerBlock: {
    gap: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: tokens.inkBlack,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    color: tokens.warmGray,
  },
  actionList: {
    gap: 8,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 12,
    backgroundColor: tokens.stoneCanvas,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
  },
  optionBtnPrimary: {
    backgroundColor: tokens.inkBlack,
    borderColor: tokens.inkBlack,
  },
  optionBtnDestructive: {
    backgroundColor: tokens.negativeWash,
    borderColor: tokens.negativeBorder,
  },
  optionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.inkBlack,
  },
  optionBtnPrimaryText: {
    color: '#ffffff',
  },
  optionBtnDestructiveText: {
    color: tokens.negativeRed,
  },
  btnCancelFull: {
    height: 44,
    borderRadius: 9999,
    backgroundColor: tokens.stoneCanvas,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  btnSecondary: {
    flex: 1,
    height: 46,
    borderRadius: 9999,
    backgroundColor: tokens.stoneCanvas,
    borderWidth: 1,
    borderColor: tokens.stoneBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.warmGray,
  },
  btnConfirm: {
    flex: 1.4,
    height: 46,
    borderRadius: 9999,
    backgroundColor: tokens.inkBlack,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDestructive: {
    backgroundColor: tokens.negativeRed,
  },
  btnConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});

