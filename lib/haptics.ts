import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticRequest = () => Promise<void>;

const requestSuccessHaptic: HapticRequest = () =>
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

export async function triggerCompletionHaptic(
  platform = Platform.OS,
  request: HapticRequest = requestSuccessHaptic,
): Promise<boolean> {
  if (platform === 'web') return false;

  try {
    await request();
    return true;
  } catch {
    return false;
  }
}
