import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  // Redirects Vite to serve asset files out of Client/Public instead of the root folder folder
  publicDir: "Client/Public", 
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./Client/test/setup.ts"],
    include: ["Client/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: { 
      "Client": path.resolve(__dirname, "./Client"),
      "Server": path.resolve(__dirname, "./Server"),
    },
  },
});