import React from 'react';
import { History, Download, Upload, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';

function TransferHistory() {
  const { transfers, socket } = useSocket();

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'rejected':
        return 'text-red-400';
      default:
        return 'text-blue-400';
    }
  };

  const handleAcceptTransfer = (transferId) => {
    socket.emit('acceptTransfer', { transferId });
  };

  const handleRejectTransfer = (transferId) => {
    socket.emit('rejectTransfer', { transferId });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
      <div className="flex items-center space-x-3 mb-6">
        <History className="w-6 h-6 text-blue-400" />
        <h2 className="text-2xl font-bold text-white">Transfer History</h2>
      </div>

      {transfers.length === 0 ? (
        <div className="text-center py-12">
          <History className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <p className="text-blue-200">No transfer history yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {transfers.map((transfer) => (
            <div
              key={transfer.transferId}
              className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {transfer.type === 'incoming' ? (
                      <Download className="w-5 h-5 text-blue-400" />
                    ) : (
                      <Upload className="w-5 h-5 text-green-400" />
                    )}
                    {getStatusIcon(transfer.status)}
                  </div>
                  
                  <div>
                    <p className="text-white font-medium">{transfer.fileName}</p>
                    <p className="text-blue-200 text-sm">
                      {transfer.type === 'incoming' ? 'From' : 'To'} {transfer.senderUsername}
                      {transfer.fileSize && ` • ${formatFileSize(transfer.fileSize)}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className={`text-sm font-medium ${getStatusColor(transfer.status)}`}>
                    {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)}
                  </span>
                  
                  {transfer.status === 'pending' && transfer.type === 'incoming' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAcceptTransfer(transfer.transferId)}
                        className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectTransfer(transfer.transferId)}
                        className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {transfer.progress !== undefined && transfer.progress < 100 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-blue-200">Progress</span>
                    <span className="text-sm text-blue-200">{transfer.progress}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${transfer.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TransferHistory;