// Serverless entry point for Vercel deployment
import { createServer } from 'http';
import { parse } from 'url';
import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import { appRouter } from '../server/router';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API routes
app.use('/api', appRouter);

// Serve static files in production
const publicPath = path.join(__dirname, '../dist/public');
app.use(express.static(publicPath));

// SPA fallback route - important for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Export the Express app as a serverless function
export default function handler(req, res) {
  // Create a serverless-compatible handler
  const server = createServer((req, res) => {
    // Parse the URL
    const parsedUrl = parse(req.url, true);
    
    // Let the Express app handle the request
    app(req, res);
  });
  
  // Pass the request to the server
  return server.emit('request', req, res);
}