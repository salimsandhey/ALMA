import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return {
    width,
    height,
    insets,
    isNarrow: width < 375,
    isSmall: width < 390,
    scale: Math.min(1, width / 390),
  };
}
