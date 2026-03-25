import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  host : true,
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/socket.io": {
        target: "http://10.213.175.23:3001",
        ws: true,
      },
      "/api": {
        target: "http://10.213.175.23:3001",
        changeOrigin: true,
      },
    },
  },
});
