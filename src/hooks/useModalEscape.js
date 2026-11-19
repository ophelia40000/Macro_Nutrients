import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Closes an active modal when the Escape key is pressed on web.
 */
export default function useModalEscape(visible, onClose) {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !visible || !onClose) {
      return;
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose]);
}
