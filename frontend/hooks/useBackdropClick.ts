import { useCallback } from 'react';

export const useBackdropClick = (onClose: () => void) => {
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    // Only close if the click was on the backdrop (the overlay element itself)
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  return handleBackdropClick;
};
