import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 3000,
    host: "0.0.0.0",
    strictPort: true,
    hmr: {
      protocol: 'wss',
      host: 'localhost',
      port: 8443,
    },
  },
  build: {
    target: "esnext",
  },
});
