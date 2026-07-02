import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import dotenv from 'dotenv';
import path from 'path';

// Force Node.js to resolve DNS via Google's public servers, bypassing the
// OS/ISP/hotspot resolver. Fixes "querySrv ECONNREFUSED" on networks
// (e.g. mobile hotspots) that block or don't support SRV record lookups,
// which mongodb+srv:// connection strings depend on.
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Intercept Synchronous Processing Failures immediately
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL UNCAUGHT EXCEPTION] System stopping execution loop...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

// Resolve local contextual relative layout positioning paths
dotenv.config({ path: './.env' });

import app from './app.js';
import connectDB from './config/db.js';

// Establish connection matrix bindings with the MongoDB Atlas cluster instance
connectDB();

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`[Runtime Server] Deployment active. Interface tracking operational requests on port ${PORT}`);
});

// Intercept Asynchronous Unhandled Rejections safely
process.on('unhandledRejection', (err) => {
  console.error('[CRITICAL UNHANDLED PROMISE REJECTION] Terminating server cleanly...');
  console.error(err.name, err.message);
  
  // Close out the server port bindings cleanly before forcing the execution wrap loop down
  server.close(() => {
    process.exit(1);
  });
});