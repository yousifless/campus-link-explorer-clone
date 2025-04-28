import { readFileSync } from 'fs';
import { createServer } from 'https';
import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const options = {
  key: readFileSync('key.pem'),
  cert: readFileSync('cert.pem')
};

// Serve static files from the dist directory
app.use(express.static(join(__dirname, 'dist')));

// Handle client-side routing
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

createServer(options, app).listen(8443, () => {
  console.log('Development server running at https://localhost:8443');
}); 