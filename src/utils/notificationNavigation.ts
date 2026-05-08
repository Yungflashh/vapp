import { navigate } from '@/navigation/navigationRef';
import { RootStackParamList } from '@/navigation';
import { NavigationProp } from '@react-navigation/native';

interface NotificationData {
  type?: string;
  orderId?: string;
  conversationId?: string;
  senderId?: string;
  senderName?: string;
  disputeId?: string;
  productId?: string;
  vendorId?: string;
  challengeId?: string;
  payload?: string;
}

function parsePayload(data: NotificationData): NotificationData {
  if (typeof data.payload === 'string') {
    try {
      return { ...data, ...JSON.parse(data.payload) };
    } catch {
      // not valid JSON
    }
  }
  return data;
}

// Used from NotificationContext (imperative, no navigation prop)
export function navigateFromPush(rawData: any, isVendor: boolean) {
  if (!rawData) return;
  try {
    const data = parsePayload(rawData as NotificationData);
    const { type, orderId, conversationId, senderId, senderName, disputeId, productId, vendorId, challengeId } = data;

    if (type === 'challenge' || challengeId) {
      navigate('Challenges' as any);
    } else if (conversationId || (type === 'chat' && senderId)) {
      navigate('Chat', {
        conversationId: conversationId || undefined,
        receiverId: senderId || '',
        receiverName: senderName || 'User',
        receiverAvatar: undefined,
        isOrderChat: true,
      });
    } else if (disputeId) {
      navigate('DisputeDetails' as any, { disputeId });
    } else if (orderId) {
      if (isVendor) {
        navigate('VendorOrderDetail', { orderId });
      } else {
        navigate('OrderDetails', { orderId });
      }
    } else if (productId) {
      navigate('ProductDetails', { productId });
    } else if (vendorId) {
      navigate('VendorProfile', { vendorId });
    }
  } catch (error) {
    if (__DEV__) console.error('Error handling push notification navigation:', error);
  }
}

// Used from NotificationsScreen (has a navigation prop)
export function navigateFromNotification(
  data: NotificationData,
  type: string,
  title: string | undefined,
  isVendor: boolean,
  navigation: NavigationProp<RootStackParamList>
) {
  if (type === 'challenge') {
    navigation.navigate('Challenges' as any);
    return;
  }

  const parsed = parsePayload(data);
  const { orderId, productId, vendorId, conversationId, senderId, senderName, disputeId } = parsed;

  if (conversationId || (type === 'chat' && senderId)) {
    navigation.navigate('Chat', {
      conversationId: conversationId || undefined,
      receiverId: senderId || '',
      receiverName: senderName || title?.replace('New message from ', '') || 'User',
      receiverAvatar: undefined,
      isOrderChat: true,
    });
  } else if (disputeId) {
    navigation.navigate('DisputeDetails' as any, { disputeId });
  } else if (orderId) {
    if (isVendor) {
      navigation.navigate('VendorOrderDetail', { orderId });
    } else {
      navigation.navigate('OrderDetails', { orderId });
    }
  } else if (productId) {
    navigation.navigate('ProductDetails', { productId });
  } else if (vendorId) {
    navigation.navigate('VendorProfile', { vendorId });
  }
}
