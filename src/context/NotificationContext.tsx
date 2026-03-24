import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { Platform, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import {
  getUnreadCount,
  registerFcmToken,
  unregisterFcmToken,
} from '@/services/notification.service';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async (_notification) => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationContextType {
  unreadCount: number;
  expoPushToken: string | null;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isGuest } = useAuth();
  const { onNotificationReceived } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const notificationListener = useRef<ReturnType<typeof Notifications.addNotificationReceivedListener> | null>(null);
  const responseListener = useRef<ReturnType<typeof Notifications.addNotificationResponseReceivedListener> | null>(null);
  const appState = useRef(AppState.currentState);

  // Register for push notifications
  const registerForPushNotifications = useCallback(async () => {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission not granted');
        return null;
      }

      // Get the Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      const token = tokenData.data;

      // Set up Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#CC3366',
        });
      }

      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }, []);

  // Send token to backend
  const sendTokenToBackend = useCallback(async (token: string) => {
    try {
      const storedToken = await AsyncStorage.getItem('pushToken');
      // Only register if token changed or first time
      if (storedToken !== token) {
        await registerFcmToken(token, Platform.OS);
        await AsyncStorage.setItem('pushToken', token);
        console.log('Push token registered with backend');
      }
    } catch (error) {
      console.error('Failed to register push token with backend:', error);
    }
  }, []);

  // Fetch unread count
  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await getUnreadCount();
      if (response?.success && response?.data) {
        setUnreadCount(response.data.unreadCount || response.data.count || 0);
      }
    } catch (error) {
      // Silently fail - don't block the app for notification count
    }
  }, [isAuthenticated]);

  // Initialize push notifications when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    let isMounted = true;

    const init = async () => {
      // Register for push notifications
      const token = await registerForPushNotifications();
      if (token && isMounted) {
        setExpoPushToken(token);
        await sendTokenToBackend(token);
      }

      // Fetch initial unread count
      if (isMounted) {
        await refreshUnreadCount();
      }
    };

    init();

    // Listen for incoming notifications (foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      // Refresh unread count when a new notification arrives
      if (isMounted) {
        refreshUnreadCount();
      }
    });

    // Listen for notification taps
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      // You can handle navigation based on notification data here
      const data = response.notification.request.content.data;
      console.log('Notification tapped with data:', data);
    });

    // Poll for unread count every 30 seconds as a fallback
    const pollInterval = setInterval(() => {
      if (isMounted) {
        refreshUnreadCount();
      }
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Listen for real-time notification events via socket
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = onNotificationReceived((data: any) => {
      if (data?.unreadCount !== undefined) {
        setUnreadCount(data.unreadCount);
      } else {
        // Fallback: just increment
        setUnreadCount((prev) => prev + 1);
      }
    });

    return unsubscribe;
  }, [isAuthenticated, onNotificationReceived]);

  // Refresh unread count when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        refreshUnreadCount();
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [refreshUnreadCount]);

  // Unregister token on logout (skip for guest mode - never had a token)
  useEffect(() => {
    if (!isAuthenticated && !isGuest && expoPushToken) {
      const cleanup = async () => {
        try {
          await unregisterFcmToken(expoPushToken);
          await AsyncStorage.removeItem('pushToken');
          setExpoPushToken(null);
        } catch (error) {
          // Silently fail
        }
      };
      cleanup();
    }
  }, [isAuthenticated, isGuest, expoPushToken]);

  return (
    <NotificationContext.Provider value={{ unreadCount, expoPushToken, refreshUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
