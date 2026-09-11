import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Smart Campus Digital Twin — frontend build config.
// The app talks DIRECTLY to an ESP32 on the local network (see src/config/esp32.js).
// No backend, no database, no bundler proxy is required for production use.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // expose on LAN so you can view the dashboard from a phone/tablet too
  },
});
