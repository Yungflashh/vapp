import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { getUnreadMessageCount } from '@/services/message.service';
import { getOrders } from '@/services/order.service';

// const SOCKET_URL = 'http://192.168.54.66:5000';
const SOCKET_URL = 'https://vapp-be.onrender.com';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: string[];
  unreadMessageCount: number;
  activeOrderCount: number;
  refreshUnreadMessageCount: () => Promise<void>;
  refreshActiveOrderCount: () => Promise<void>;
  isUserOnline: (userId: string) => boolean;
  onNotificationReceived: (callback: (data: any) => void) => () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [socketState, setSocketState] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  // Use array instead of Set so React detects state changes reliably
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [activeOrderCount, setActiveOrderCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const appState = useRef(AppState.currentState);

  const refreshUnreadMessageCount = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const response = await getUnreadMessageCount();
      if (response?.success && response?.data) {
        setUnreadMessageCount(response.data.count || 0);
      }
    } catch (error) {
      // Silently fail - don't crash the app for unread count
    }
  }, []);

  const refreshActiveOrderCount = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setActiveOrderCount(0);
        return;
      }

      // Fetch pending and confirmed orders
      const [pendingRes, confirmedRes] = await Promise.all([
        getOrders(1, 1, 'pending').catch(() => null),
        getOrders(1, 1, 'confirmed').catch(() => null),
      ]);

      // Use meta.total which is the count of ALL matching orders, not just the page
      const pendingTotal = pendingRes?.meta?.total ?? 0;
      const confirmedTotal = confirmedRes?.meta?.total ?? 0;
      setActiveOrderCount(pendingTotal + confirmedTotal);
    } catch (error) {
      setActiveOrderCount(0);
    }
  }, []);

  const isUserOnline = useCallback(
    (userId: string) => onlineUsers.includes(userId),
    [onlineUsers]
  );

  // Connect socket when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      // Disconnect if not authenticated
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocketState(null);
      }
      setIsConnected(false);
      setOnlineUsers([]);
      setUnreadMessageCount(0);
      return;
    }

    let isMounted = true;

    const connectSocket = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token || !isMounted) return;

        // Don't reconnect if already connected
        if (socketRef.current?.connected) return;

        // Disconnect existing socket if any
        if (socketRef.current) {
          socketRef.current.disconnect();
        }

        const socket = io(SOCKET_URL, {
          auth: { token },
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 2000,
        });

        // Debug: log ALL incoming events so we can see what the server sends
        socket.onAny((eventName, ...args) => {
          console.log(`[Socket Event] ${eventName}:`, JSON.stringify(args).substring(0, 200));
        });

        socket.on('connect', () => {
          console.log('Socket connected:', socket.id);
          if (isMounted) {
            setIsConnected(true);
            setSocketState(socket);
          }
        });

        socket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          if (isMounted) {
            setIsConnected(false);
          }
        });

        socket.on('connect_error', (error) => {
          console.log('Socket connection error:', error.message);
          if (isMounted) {
            setIsConnected(false);
          }
        });

        // Handle initial online users list (server may send on connect)
        socket.on('online_users', (data: { users: string[] } | string[]) => {
          if (isMounted) {
            const users = Array.isArray(data) ? data : data?.users || [];
            console.log('Online users received:', users);
            setOnlineUsers(users);
          }
        });

        // Track individual user coming online
        socket.on('user_online', (data: { userId: string } | string) => {
          if (isMounted) {
            const userId = typeof data === 'string' ? data : data.userId;
            if (userId) {
              setOnlineUsers((prev) => prev.includes(userId) ? prev : [...prev, userId]);
            }
          }
        });

        // Track individual user going offline
        socket.on('user_offline', (data: { userId: string } | string) => {
          if (isMounted) {
            const userId = typeof data === 'string' ? data : data.userId;
            if (userId) {
              setOnlineUsers((prev) => prev.filter((id) => id !== userId));
            }
          }
        });

        // When a new message notification arrives, bump unread count
        socket.on('new_message_notification', () => {
          if (isMounted) {
            setUnreadMessageCount((prev) => prev + 1);
          }
        });

        // Also listen for receive_message as fallback for message count
        socket.on('receive_message', () => {
          if (isMounted) {
            setUnreadMessageCount((prev) => prev + 1);
          }
        });

        // Listen for real-time notification events from backend
        socket.on('new_notification', (data: any) => {
          console.log('[Socket] New notification received:', data?.notification?.title);
        });

        socketRef.current = socket;
        if (isMounted) {
          setSocketState(socket);
        }
      } catch (error) {
        console.log('Socket init error:', error);
      }
    };

    connectSocket();
    refreshUnreadMessageCount();
    refreshActiveOrderCount();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated]); // Only depend on isAuthenticated

  // Allow other contexts to subscribe to notification events
  const onNotificationReceived = useCallback((callback: (data: any) => void) => {
    const socket = socketRef.current;
    if (socket) {
      socket.on('new_notification', callback);
    }
    return () => {
      if (socket) {
        socket.off('new_notification', callback);
      }
    };
  }, []);

  // Reconnect when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (socketRef.current && !socketRef.current.connected) {
          socketRef.current.connect();
        }
        refreshUnreadMessageCount();
        refreshActiveOrderCount();
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [refreshUnreadMessageCount]);

  return (
    <SocketContext.Provider
      value={{
        socket: socketState,
        isConnected,
        onlineUsers,
        unreadMessageCount,
        activeOrderCount,
        refreshUnreadMessageCount,
        refreshActiveOrderCount,
        isUserOnline,
        onNotificationReceived,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
