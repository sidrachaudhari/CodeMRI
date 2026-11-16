import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { getDbHealth, saveScan, getScans } from './server/neonDb.js';

function neonApiPlugin() {
  const setupApiMiddleware = (server) => {
    server.middlewares.use(async (req, res, next) => {
      const url = new URL(req.url, 'http://localhost');

      if (url.pathname === '/api/neon/health' && req.method === 'GET') {
        try {
          const health = await getDbHealth();
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          return res.end(JSON.stringify(health));
        } catch (error) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 500;
          return res.end(JSON.stringify({ status: 'error', message: error.message }));
        }
      }

      if (url.pathname === '/api/scans' && req.method === 'GET') {
        try {
          const scans = await getScans(20);
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          return res.end(JSON.stringify(scans));
        } catch (error) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 500;
          return res.end(JSON.stringify({ error: error.message }));
        }
      }

      if (url.pathname === '/api/scans' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', async () => {
          try {
            const data = JSON.parse(body || '{}');
            const result = await saveScan(data);
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 201;
            return res.end(JSON.stringify(result));
          } catch (error) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            return res.end(JSON.stringify({ error: error.message }));
          }
        });
        return;
      }

      next();
    });
  };

  return {
    name: 'neon-api-middleware',
    configureServer(server) {
      setupApiMiddleware(server);
    },
    configurePreviewServer(server) {
      setupApiMiddleware(server);
    }
  };
}

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  // Expose env to process.env so server modules have access
  Object.assign(process.env, env);

  return {
    plugins: [react(), neonApiPlugin()],
    server: {
      port: 5173
    },
    preview: {
      port: 4173
    }
  };
});
