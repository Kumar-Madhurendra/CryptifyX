import React, { useState } from 'react';
import { LogOut, Users, Upload, History, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import FileUpload from './FileUpload';
import UserList from './UserList';
import TransferHistory from './TransferHistory';
import ConnectionStatus from './ConnectionStatus';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('upload');
  const { user, logout } = useAuth();
  const { connected } = useSocket();

  const tabs = [
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'history', label: 'History', icon: History },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'upload':
        return <FileUpload />;
      case 'users':
        return <UserList />;
      case 'history':
        return <TransferHistory />;
      default:
        return <FileUpload />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">SecureTransfer</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <ConnectionStatus />
              <span className="text-blue-200">Welcome, {user?.username}</span>
              <button
                onClick={logout}
                className="p-2 text-blue-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                          : 'text-blue-200 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;