import React, { useState, useRef } from 'react';
import { Upload, File, X, Send, AlertCircle } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';

function FileUpload() {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { socket, users, transfers } = useSocket();

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSendFile = async () => {
    if (!selectedFile || !selectedRecipient || !socket) return;

    setUploading(true);

    try {
      // Initialize transfer
      socket.emit('initiateTransfer', {
        recipientId: selectedRecipient,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type
      });

      // Wait for transfer acceptance
      socket.once('transferAccepted', (data) => {
        sendFileChunks(data.transferId);
      });

      socket.once('transferRejected', () => {
        setUploading(false);
        alert('Transfer was rejected by the recipient');
      });

    } catch (error) {
      console.error('Error sending file:', error);
      setUploading(false);
    }
  };

  const sendFileChunks = async (transferId) => {
    const chunkSize = 64 * 1024; // 64KB chunks
    const totalChunks = Math.ceil(selectedFile.size / chunkSize);
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, selectedFile.size);
      const chunk = selectedFile.slice(start, end);
      
      // Convert chunk to array buffer
      const arrayBuffer = await chunk.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      socket.emit('fileChunk', {
        transferId,
        chunk: Array.from(uint8Array),
        chunkIndex: i,
        totalChunks
      });
    }

    // Listen for completion
    socket.once('transferCompleted', () => {
      setUploading(false);
      setSelectedFile(null);
      setSelectedRecipient('');
      alert('File sent successfully!');
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-6">Send File</h2>
        
        {/* File Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
            dragOver
              ? 'border-blue-400 bg-blue-500/10'
              : 'border-white/30 hover:border-white/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {selectedFile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <File className="w-8 h-8 text-blue-400" />
                <div className="text-left">
                  <p className="text-white font-medium">{selectedFile.name}</p>
                  <p className="text-blue-200 text-sm">{formatFileSize(selectedFile.size)}</p>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-1 text-red-400 hover:text-red-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="w-12 h-12 text-blue-400 mx-auto" />
              <div>
                <p className="text-white font-medium">Drag and drop a file here</p>
                <p className="text-blue-200 text-sm">or click to select</p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
              >
                Select File
              </button>
            </div>
          )}
        </div>

        {/* Recipient Selection */}
        {selectedFile && (
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Send to:
              </label>
              <select
                value={selectedRecipient}
                onChange={(e) => setSelectedRecipient(e.target.value)}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a recipient</option>
                {users.map(user => (
                  <option key={user.id} value={user.id} className="bg-slate-800">
                    {user.username} ({user.status})
                  </option>
                ))}
              </select>
            </div>

            {users.length === 0 && (
              <div className="flex items-center space-x-2 text-yellow-400">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">No users online to send files to</span>
              </div>
            )}

            <button
              onClick={handleSendFile}
              disabled={!selectedRecipient || uploading || users.length === 0}
              className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-green-600 hover:to-blue-700 focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {uploading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Send className="w-5 h-5" />
                  <span>Send File</span>
                </div>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default FileUpload;