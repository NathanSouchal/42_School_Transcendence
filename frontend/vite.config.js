import { defineConfig } from "vite";
import fs from "fs";

export default defineConfig({
  server: {
    historyApiFallback: true,
    port: 3000,
    host: true,  // ✅ Permet d'écouter sur 0.0.0.0
    strictPort: true,  // Assure que Vite ne change pas de port
    https: false,  // ✅ Désactive HTTPS (Nginx gérera SSL)
  },
  build: {
    target: "esnext"  // Permet d'utiliser top-level await
  }
});
