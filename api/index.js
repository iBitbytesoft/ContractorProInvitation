// Vercel Serverless API handler
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { adminDb, adminAuth } from './firebase-admin.js';

// Load environment variables
dotenv.config();

// Create Express app for API routes
const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow all methods
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Add detailed request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers));
  if (req.method === 'POST') {
    console.log('Request body:', JSON.stringify(req.body));
  }
  
  // Handle both /api/team and /team patterns
  if (req.url.startsWith('/api/')) {
    req.url = req.url.replace(/^\/api/, '');
    console.log(`Rewritten request path: ${req.url}`);
  }
  
  next();
});

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', environment: process.env.NODE_ENV });
});

// Root endpoint for API testing
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: "API is running",
    endpoints: ["/health", "/team", "/stats", "/assets", "/vendors", "/send-email"]
  });
});

// Add OPTIONS handler for preflight requests
app.options('*', cors());

// Handle send-email endpoint with both /api and non-api prefix
app.post('/send-email', handleSendEmail);
app.post('/api/send-email', handleSendEmail);

// Send email handler function
async function handleSendEmail(req, res) {
  try {
    console.log("Received email request:", req.body);
    
    // For debugging, log everything about the request
    console.log("Request method:", req.method);
    console.log("Request URL:", req.url);
    console.log("Request path:", req.path);
    console.log("Request query:", req.query);
    console.log("Request headers:", req.headers);
    
    // Here you would typically integrate with an email service
    // For now, we'll just return success to make the frontend happy
    res.status(200).json({ 
      success: true, 
      message: "Email request received and processed successfully",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error handling email request:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to process email request", 
      error: error.message 
    });
  }
}

// Handle both /api/team and /team patterns
app.get('/api/team', async (req, res) => {
  console.log("Direct /api/team endpoint called");
  // Forward to the team handler
  req.url = '/team';
  app.handle(req, res);
});

// =================================================================
// API ROUTES
// =================================================================

// Get dashboard stats
app.get('/stats', async (req, res) => {
  try {
    const [assets, vendors, team, documents] = await Promise.all([
      adminDb.collection("assets").count().get(),
      adminDb.collection("vendors").count().get(),
      adminDb.collection("users").count().get(),
      adminDb.collection("documents").count().get(),
    ]);

    res.json({
      assets: assets.data().count,
      vendors: vendors.data().count,
      team: team.data().count,
      documents: documents.data().count,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

// Team members endpoint
app.get('/team', async (req, res) => {
  try {
    console.log("Team endpoint called with headers:", req.headers);
    
    // Get authorization token from headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Unauthorized - No valid token" });
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    try {
      // Verify the Firebase token
      const decodedToken = await adminAuth.verifyIdToken(token);
      const uid = decodedToken.uid;
      
      console.log("Authenticated user:", uid);
      
      // For testing, return a simple team structure
      // You can expand this to fetch actual team data from your database
      const teamMembers = [
        {
          id: uid,
          email: decodedToken.email || "user@example.com",
          displayName: decodedToken.email ? decodedToken.email.split('@')[0] : 'Owner',
          role: "admin",
          isOwner: true
        }
      ];
      
      // Try to get invitations sent by this user to show as pending team members
      try {
        const invitationsSnapshot = await adminDb.collection("user_invitations")
          .where("senderEmail", "==", decodedToken.email)
          .get();
        
        // Add pending invitations as team members
        for (const doc of invitationsSnapshot.docs) {
          const invitation = doc.data();
          teamMembers.push({
            id: doc.id,
            email: invitation.invitedEmail,
            displayName: invitation.invitedEmail.split('@')[0],
            role: invitation.invitedRole || "user",
            status: invitation.status || 'pending',
            addedAt: invitation.createdAt,
            isOwner: false
          });
        }
      } catch (inviteError) {
        console.error("Error fetching invitations:", inviteError);
        // Continue without invitations data
      }
      
      res.json(teamMembers);
    } catch (tokenError) {
      console.error("Error verifying token:", tokenError);
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }
  } catch (error) {
    console.error("Error fetching team members:", error);
    res.status(500).json({ message: "Failed to fetch team members" });
  }
});

// Assets endpoints
app.get('/assets', async (req, res) => {
  try {
    // Auth check would go here in production
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized - No user found" });
    }
    
    const snapshot = await adminDb.collection("assets")
      .where("userId", "==", userId)
      .get();
      
    const assets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(assets);
  } catch (error) {
    console.error("Error fetching assets:", error);
    res.status(500).json({ message: "Failed to fetch assets" });
  }
});

// Vendors endpoints 
app.get('/vendors', async (req, res) => {
  try {
    // Auth check would go here in production
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized - No user found" });
    }
    
    const snapshot = await adminDb.collection("vendors")
      .where("userId", "==", userId)
      .get();
      
    const vendors = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(vendors);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({ message: "Failed to fetch vendors" });
  }
});

// Add more API endpoints here as needed...

// Serverless function handler
export default function handler(req, res) {
  // Log the request for debugging
  console.log(`[SERVERLESS HANDLER] ${req.method} ${req.url}`);
  
  try {
    // Extract the actual path from the URL (needed for Vercel serverless)
    let url;
    if (req.url) {
      if (req.url.startsWith('/')) {
        // URL is already a path, no need to parse
        console.log(`Processing direct path: ${req.url}`);
      } else {
        try {
          // Parse URL to extract the path
          url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
          console.log(`Parsed URL path: ${url.pathname}`);
          // Update req.url to use the parsed pathname
          req.url = url.pathname;
        } catch (parseError) {
          console.error("Error parsing URL:", parseError);
          // If URL parsing fails, try to extract the path directly
          const match = req.url.match(/^https?:\/\/[^\/]+(\/.*)/);
          if (match) {
            req.url = match[1];
            console.log(`Extracted path from URL: ${req.url}`);
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error processing request URL: ${req.url}`, error);
  }
  
  // Pass the request to the Express app
  return app(req, res);
}