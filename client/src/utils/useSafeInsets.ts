import { useContext } from 'react';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

export const useSafeInsets = () => {
  const insets = useContext(SafeAreaInsetsContext);
  return insets || { top: 0, bottom: 0, left: 0, right: 0 };
};
