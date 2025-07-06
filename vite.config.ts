import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
import fs from 'fs';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  server: {
    host: "localhost",
    https: {
      key: fs.readFileSync("certificates/key.pem"),
      cert: fs.readFileSync("certificates/cert.pem"),
      rejectUnauthorized: false // For development only
    },
    proxy: {
      '/api': {
        target: 'https://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: 'https://localhost:3001',
        ws: true,
        changeOrigin: true,
        secure: false
      }
    }
  },
});
