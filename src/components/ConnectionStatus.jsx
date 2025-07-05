import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';

function ConnectionStatus() {
  const { connected } = useSocket();

  return (
    <div className="flex items-center space-x-2">
      {connected ? (
        <>
          <Wifi className="w-5 h-5 text-green-400" />
          <span className="text-green-400 text-sm">Connected</span>
        </>
      ) : (
        <>
          <WifiOff className="w-5 h-5 text-red-400" />
          <span className="text-red-400 text-sm">Disconnected</span>
        </>
      )}
    </div>
  );
}

export default ConnectionStatus;