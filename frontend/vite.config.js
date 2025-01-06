import { defineConfig } from "vite";
import fs from "fs";

export default defineConfig({
  server: {
    historyApiFallback: true,
    port: 3000,
    https: {
      key: fs.readFileSync("./ssl/key.pem"),
      cert: fs.readFileSync("./ssl/cert.pem"),
    },
  },
});
