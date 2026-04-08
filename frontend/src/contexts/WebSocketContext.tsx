import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import io, { Socket } from 'socket.io-client';
import { API_BASE_URL } from '../api/config';

interface LocationUpdate {
  id: number;
  delivery_session_id: number;
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
}

interface UserOnlineEvent {
  userId: number;
  status: boolean;
  timestamp: string;
}

interface DeliveryUpdate {
  deliveryId: number;
  status: string;
  location?: { lat: number; lng: number };
  timestamp: string;
}

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  locationUpdates: Record<number, LocationUpdate>;
  userOnlineStatus: Record<number, boolean>;
  deliveryUpdates: Record<number, DeliveryUpdate>;
  emitLocationUpdate: (data: any) => void;
  joinOrganization: (orgId: number) => void;
  trackDelivery: (deliveryId: number, orgId: number) => void;
  startDelivery: (userId: number, orgId: number) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [locationUpdates, setLocationUpdates] = useState<Record<number, LocationUpdate>>({});
  const [userOnlineStatus, setUserOnlineStatus] = useState<Record<number, boolean>>({});
  const [deliveryUpdates, setDeliveryUpdates] = useState<Record<number, DeliveryUpdate>>({});

  useEffect(() => {
    // Initialize socket connection
    const apiUrl = API_BASE_URL;
    console.log('[WebSocket] Connecting to:', apiUrl);
    
    const newSocket = io(apiUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('[WebSocket] Connected to:', apiUrl);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected from:', apiUrl);
      setIsConnected(false);
    });

    // Listen for location updates
    newSocket.on('location-update', (data: LocationUpdate) => {
      setLocationUpdates(prev => ({
        ...prev,
        [data.id]: data
      }));
    });

    // Listen for user online status changes
    newSocket.on('user-online', (data: UserOnlineEvent) => {
      setUserOnlineStatus(prev => ({
        ...prev,
        [data.userId]: data.status
      }));
    });

    // Listen for delivery updates
    newSocket.on('delivery-update', (data: DeliveryUpdate) => {
      setDeliveryUpdates(prev => ({
        ...prev,
        [data.deliveryId]: data
      }));
    });

    // Listen for user list updates (when users are added/removed/status changed)
    newSocket.on('users-updated', () => {
      // This will trigger a refetch from the parent component
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const emitLocationUpdate = (data: any) => {
    if (socket && isConnected) {
      socket.emit('location-update', data);
    }
  };

  const joinOrganization = (orgId: number) => {
    if (socket && isConnected) {
      socket.emit('join-organization', orgId);
    }
  };

  const trackDelivery = (deliveryId: number, orgId: number) => {
    if (socket && isConnected) {
      socket.emit('track-delivery', deliveryId, orgId);
    }
  };

  const startDelivery = (userId: number, orgId: number) => {
    if (socket && isConnected) {
      socket.emit('start-delivery', userId, orgId);
    }
  };

  return (
    <WebSocketContext.Provider
      value={{
        socket,
        isConnected,
        locationUpdates,
        userOnlineStatus,
        deliveryUpdates,
        emitLocationUpdate,
        joinOrganization,
        trackDelivery,
        startDelivery
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};
