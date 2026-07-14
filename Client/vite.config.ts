import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Tells Vite that the Client folder is the operational execution context
  root: __dirname,
  
  // Points to Public directory relative to the Client root folder folder
  publicDir: "Public",
  
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    // FIX: Catch outbound API requests and route them to the backend server instead of falling back to index.html
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      // Adjusted path strings to cleanly map references from the Client scope
      "Client": path.resolve(__dirname, "."),
      "Server": path.resolve(__dirname, "../Server"),
      "@": path.resolve(__dirname, "./Source"), // Cleaned folder signature up to match your disk path structure
    },
    dedupe: [
      "react", 
      "react-dom", 
      "react/jsx-runtime", 
      "react/jsx-dev-runtime", 
      "@tanstack/react-query", 
      "@tanstack/query-core"
    ],
  },
}));