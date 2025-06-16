
import React, { createContext, useContext, useEffect, useState } from 'react';

interface SocketContextType {
  socket: any;
  isConnected: boolean;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => {
  return useContext(SocketContext);
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Mock socket implementation for now
    const mockSocket = {
      on: (event: string, callback: Function) => {
        // Mock implementation
      },
      off: (event: string) => {
        // Mock implementation
      },
      emit: (event: string, data?: any) => {
        // Mock implementation
      }
    };

    setSocket(mockSocket);
    setIsConnected(true);

    return () => {
      setSocket(null);
      setIsConnected(false);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
