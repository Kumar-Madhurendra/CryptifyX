import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const newSocket = io('https://localhost:3001', {
  secure: true,
  rejectUnauthorized: false
});
      
      newSocket.on('connect', () => {
        setConnected(true);
        const token = localStorage.getItem('token');
        newSocket.emit('authenticate', { token });
      });

      newSocket.on('disconnect', () => {
        setConnected(false);
      });

      newSocket.on('authenticated', (data) => {
        if (data.success) {
          console.log('Authenticated successfully');
        }
      });

      newSocket.on('userList', (userList) => {
        setUsers(userList.filter(u => u.id !== user.id));
      });

      newSocket.on('transferRequest', (data) => {
        setTransfers(prev => [...prev, {
          ...data,
          type: 'incoming',
          status: 'pending'
        }]);
      });

      newSocket.on('transferInitiated', (data) => {
        setTransfers(prev => prev.map(t => 
          t.id === data.transferId ? { ...t, status: 'initiated' } : t
        ));
      });

      newSocket.on('transferAccepted', (data) => {
        setTransfers(prev => prev.map(t => 
          t.transferId === data.transferId ? { ...t, status: 'accepted' } : t
        ));
      });

      newSocket.on('transferRejected', (data) => {
        setTransfers(prev => prev.filter(t => t.transferId !== data.transferId));
      });

      newSocket.on('transferProgress', (data) => {
        setTransfers(prev => prev.map(t => 
          t.transferId === data.transferId ? { ...t, progress: data.progress } : t
        ));
      });

      newSocket.on('fileReceived', (data) => {
        // Reconstruct file from chunks
        const { chunks, fileName, fileType } = data;
        const blob = new Blob(chunks, { type: fileType });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        
        // Clean up
        URL.revokeObjectURL(url);
        
        setTransfers(prev => prev.map(t => 
          t.transferId === data.transferId ? { ...t, status: 'completed' } : t
        ));
      });

      newSocket.on('transferCompleted', (data) => {
        setTransfers(prev => prev.map(t => 
          t.transferId === data.transferId ? { ...t, status: 'completed' } : t
        ));
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  const value = {
    socket,
    connected,
    users,
    transfers,
    setTransfers
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}