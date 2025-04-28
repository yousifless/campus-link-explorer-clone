import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Check if SSL certificates exist
  const keyPath = resolve(__dirname, 'key.pem');
  const certPath = resolve(__dirname, 'cert.pem');
  const hasCertificates = fs.existsSync(keyPath) && fs.existsSync(certPath);

  return {
    server: {
      host: "::",
      port: 8080,
      ...(hasCertificates ? {
        https: {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        },
      } : {}),
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
    },
  };
});
