import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

/**
 * Custom hook to establish a resilient, auto-reconnecting Socket.io connection.
 */
export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Dynamically resolve websocket server URL to the current host and port
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    
    console.log(`🔌 Initializing SecChannel Connection to ${socketUrl}...`);
    
    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      autoConnect: true
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    const onConnect = () => {
      console.log('🔌 SecChannel Connected successfully.');
      setIsConnected(true);
    };

    const onDisconnect = () => {
      console.log('🔌 SecChannel Disconnected.');
      setIsConnected(false);
    };

    const onConnectError = (err) => {
      console.error('🔌 SecChannel Connection Error:', err);
    };

    socketInstance.on('connect', onConnect);
    socketInstance.on('disconnect', onDisconnect);
    socketInstance.on('connect_error', onConnectError);

    // If socket is already connected immediately
    if (socketInstance.connected) {
      setIsConnected(true);
    }

    return () => {
      console.log('🔌 Cleaning up SecChannel socket connection...');
      socketInstance.off('connect', onConnect);
      socketInstance.off('disconnect', onDisconnect);
      socketInstance.off('connect_error', onConnectError);
      socketInstance.disconnect();
    };
  }, []);

  return { socket, isConnected };
}
