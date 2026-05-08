import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './index';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate(name: keyof RootStackParamList, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as any, params);
  } else if (__DEV__) {
    console.warn(`[navigate] called before navigator was ready — route "${String(name)}" was dropped`);
  }
}
