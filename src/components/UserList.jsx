import React from 'react';
import { Users, Wifi, WifiOff } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';

function UserList() {
  const { users, connected } = useSocket();
  // Remove duplicate users by id
  const uniqueUsers = Array.from(new Map(users.map(u => [u.id, u])).values());

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Online Users</h2>
        <div className="flex items-center space-x-2">
          {connected ? (
            <Wifi className="w-5 h-5 text-green-400" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-400" />
          )}
          <span className="text-sm text-blue-200">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <p className="text-blue-200">No other users online</p>
        </div>
      ) : (
        <div className="space-y-3">
          {uniqueUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium">{user.username}</p>
                  <p className="text-blue-200 text-sm">{user.status}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-green-400 text-sm">Online</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserList;