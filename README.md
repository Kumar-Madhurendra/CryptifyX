# SecureTransfer - Secure File Transfer Application

A modern, secure file transfer application built with React, Express, and Socket.IO, featuring real-time file sharing and secure authentication.

[![GitHub license](https://img.shields.io/github/license/Kumar-Madhurendra/Secure-Transfer)](https://github.com/Kumar-Madhurendra/Secure-Transfer/blob/main/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/Kumar-Madhurendra/Secure-Transfer)](https://github.com/Kumar-Madhurendra/Secure-Transfer/issues)
[![GitHub stars](https://img.shields.io/github/stars/Kumar-Madhurendra/Secure-Transfer)](https://github.com/Kumar-Madhurendra/Secure-Transfer/stargazers)

## Features

- 🔐 Secure Authentication
  - JWT-based authentication system
  - User registration and login with validation
  - Prevents duplicate registrations
  - Session management

- 📱 Real-time Communication
  - WebSocket-based real-time updates
  - Online user status tracking
  - Automatic reconnection handling

- 📤 Secure File Transfer
  - End-to-end encrypted file transfers
  - Real-time file transfer status
  - Progress tracking
  - Error handling and recovery

- 🔒 Security Features
  - HTTPS/WSS encryption
  - Self-signed SSL certificates for development
  - Secure WebSocket connections
  - CORS protection

- 🎨 Modern UI/UX
  - Responsive design with Tailwind CSS
  - Clean and intuitive interface
  - Real-time status updates
  - Error handling and feedback

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)
- OpenSSL (for SSL certificate generation)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Kumar-Madhurendra/Secure-Transfer.git
cd Secure-Transfer
```

2. Install dependencies:
```bash
npm install
```

3. Generate SSL certificates (for development):
```bash
openssl req -newkey rsa:2048 -nodes -keyout certificates/key.pem -x509 -days 365 -out certificates/cert.pem -subj "/C=IN/ST=Maharashtra/L=Mumbai/O=SecureTransfer/CN=localhost"
```

4. Start the backend server:
```bash
npm run server
```

5. In a new terminal, start the frontend development server:
```bash
npm run dev
```

6. Open your browser and navigate to [https://localhost:5173](https://localhost:5173)
   - Accept the self-signed certificate warning in your browser
   - The application will be available through HTTPS

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd project\ 2
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Copy the example env file and edit as needed:
```bash
cp .env.example .env
```
- `VITE_API_BASE_URL`: The backend API base URL (default: `https://localhost:3001`)
- `JWT_SECRET`: Secret key for signing JWTs (match this in both frontend and backend)

### 4. Generate SSL Certificates (for local HTTPS)
```bash
openssl req -nodes -new -x509 -keyout key.pem -out cert.pem -days 365 -subj "/CN=localhost"
```

### 5. Start the Backend
```bash
node server.js
```

### 6. Start the Frontend (Vite)
```bash
npm run dev
```

- Visit [https://localhost:5173](https://localhost:5173) in your browser (accept the self-signed cert warning).

## Security Features

- 🔒 Encryption
  - HTTPS/WSS for all communications
  - WebSocket encryption
  - JWT token encryption

- 🛡️ Authentication
  - bcrypt password hashing
  - JWT token validation
  - Session management

- 🔐 Data Protection
  - In-memory storage (no disk persistence)
  - Secure file transfer protocol
  - Automatic disconnection handling

- 🔍 Monitoring
  - Real-time connection status
  - Error logging
  - Connection monitoring

## Environment Variables
- **Never commit your real `.env` file or private keys!**
- Use `.env.example` as a template for new environments.

## Files to Ignore in Git
- `.env` (contains secrets)
- `key.pem`, `cert.pem` (SSL private keys)
- `node_modules/`, `dist/`, and other build artifacts

## Project Structure

```
Secure-Transfer/
├── certificates/           # SSL certificates (local only)
├── src/                   # Frontend source code
│   ├── components/        # React components
│   ├── contexts/         # React context providers
│   └── styles/           # CSS and styling
├── server.js             # Backend server
├── vite.config.ts        # Vite configuration
├── package.json         # Project dependencies
└── README.md            # Project documentation
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Support

For support, please open an issue in the GitHub repository.

## Acknowledgments

- Thanks to the React and Node.js communities for their excellent documentation and support
- Special thanks to the Socket.IO team for their real-time communication capabilities
