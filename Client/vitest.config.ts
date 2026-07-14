import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  // Setting the root allows Vitest and Vite to run seamlessly from the workspace root
  root: __dirname,
  plugins: [react()],
  
  // Points to Public directory relative to the Client root folder
  publicDir: "Public", 
  
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["Source/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: { 
      // Straightforward relative path resolution mapping for the client and server paths
      "Client": path.resolve(__dirname, "."),
      "Server": path.resolve(__dirname, "../Server"),
      "@": path.resolve(__dirname, "./Source"),
    },
  },
});