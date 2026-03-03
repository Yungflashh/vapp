import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { getUnreadMessageCount } from '@/services/message.service';

// Extract base URL (remove /api/v1 suffix) for socket connection
const SOCKET_URL = 'http://192.168.152.66:5000';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: string[];
  unreadMessageCount: number;
  refreshUnreadMessageCount: () => Promise<void>;
  isUserOnline: (userId: string) => boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [socketState, setSocketState] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  // Use array instead of Set so React detects state changes reliably
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
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

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated]); // Only depend on isAuthenticated

  // Reconnect when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (socketRef.current && !socketRef.current.connected) {
          socketRef.current.connect();
        }
        refreshUnreadMessageCount();
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
        refreshUnreadMessageCount,
        isUserOnline,
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
