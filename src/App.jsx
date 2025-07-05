import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

function AppContent() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {user ? (
        <SocketProvider>
          <Dashboard />
        </SocketProvider>
      ) : (
        <AuthForm />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;