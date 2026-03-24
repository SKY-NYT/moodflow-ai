import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    open: true,
    // In local dev, Vite serves the frontend on :5173 while Vercel dev serves
    // serverless functions on :3000. Proxy /api calls to keep frontend code
    // using relative paths like /api/reflect.
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
