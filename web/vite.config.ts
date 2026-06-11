import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "https://docodeago-survey-builder-api.prasaddongapure7660.workers.dev",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
