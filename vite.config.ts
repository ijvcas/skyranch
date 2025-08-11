
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Read package.json to get the version
const packageJson = require('./package.json');

// Generate build-specific information
const buildTime = new Date().toISOString();
const buildId = Math.random().toString(36).substring(2, 8);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    cors: true,
    strictPort: false,
    fs: {
      strict: false
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  define: {
    // Inject package.json version into the app
    'import.meta.env.VITE_PACKAGE_VERSION': JSON.stringify(packageJson.version),
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(buildTime),
    'import.meta.env.VITE_BUILD_ID': JSON.stringify(buildId),
    'import.meta.env.VITE_LAST_CHANGE': JSON.stringify('Sistema de versionado automático implementado'),
    // Try to get git commit hash (this would work in CI/CD environments)
    'import.meta.env.VITE_GIT_COMMIT': JSON.stringify(process.env.GITHUB_SHA || buildId),
  },
}));
