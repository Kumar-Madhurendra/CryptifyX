# Flight Booking / Secure File Transfer App

This project is a modern, secure file transfer and booking web app built with React (Vite), Express, and Socket.io. It supports real-time, encrypted file sharing between authenticated users.

## Features
- User registration and login with JWT authentication
- Real-time online user list
- Secure file transfer using HTTPS and WSS (WebSockets over TLS)
- Responsive, modern UI with Tailwind CSS

## Getting Started

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

## Security
- All traffic is encrypted via HTTPS/WSS.
- JWTs are used for authentication.
- Only authenticated users can transfer files.
- No files are stored on disk by default (in-memory only).

## Environment Variables
- **Never commit your real `.env` file or private keys!**
- Use `.env.example` as a template for new environments.

## Files to Ignore in Git
- `.env` (contains secrets)
- `key.pem`, `cert.pem` (SSL private keys)
- `node_modules/`, `dist/`, and other build artifacts

## Project Structure
- `src/` — React frontend
- `server.js` — Express + Socket.io backend
- `key.pem`, `cert.pem` — SSL certificates (local only, do NOT commit)

## License
MIT
