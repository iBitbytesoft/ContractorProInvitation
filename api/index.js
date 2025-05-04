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
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Special middleware to handle Vercel serverless path rewriting
app.use((req, res, next) => {
  // Log the original request path
  console.log(`Original request path: ${req.url}`);
  
  // If the request is coming from Vercel's API path rewriting
  if (req.url.startsWith('/api/') && req.url !== '/api/') {
    // Remove the /api prefix from the path
    req.url = req.url.replace(/^\/api/, '');
    console.log(`Rewritten request path: ${req.url}`);
  }
  
  next();
});

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', environment: process.env.NODE_ENV });
});

// Root endpoint to debug routing
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: "API is running",
    endpoints: ["/health", "/team", "/stats", "/assets", "/vendors", "/send-email"] 
  });
});

// =================================================================
// API ROUTES
// =================================================================

// Explicitly handle /api/team as well (for direct access)
app.get('/api/team', async (req, res) => {
  console.log("Direct /api/team endpoint called");
  
  try {
    // Same logic as the /team endpoint below
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Unauthorized - No valid token" });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;
    
    const teamMembers = [
      {
        id: uid,
        email: decodedToken.email || "user@example.com",
        displayName: decodedToken.email ? decodedToken.email.split('@')[0] : 'Owner',
        role: "admin",
        isOwner: true
      }
    ];
    
    // Return a simple response for now
    res.json(teamMembers);
  } catch (error) {
    console.error("Error in /api/team endpoint:", error);
    res.status(500).json({ message: "Failed to fetch team members" });
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

// Send email endpoint
app.post('/send-email', async (req, res) => {
  try {
    console.log("Received email request:", req.body);
    
    // Here you would typically integrate with an email service
    // For now, we'll just return success to make the frontend happy
    res.status(200).json({ 
      success: true, 
      message: "Email request received (mock implementation)" 
    });
  } catch (error) {
    console.error("Error handling email request:", error);
    res.status(500).json({ message: "Failed to process email request" });
  }
});

// Add more API endpoints here as needed...

// Serverless function handler
export default function handler(req, res) {
  // Log the request for debugging
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // Ensure the URL object can be created from the request
  let url;
  try {
    url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    console.log(`Processing request for path: ${url.pathname}`);
  } catch (error) {
    console.error(`Error parsing URL from ${req.url}:`, error);
  }
  
  // Pass the request to the Express app
  return app(req, res);
}