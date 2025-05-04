import type { Express, Router } from "express";
import { createServer } from "http";
import { authenticateUser, requireAdmin, type AuthRequest } from "./middleware/auth";
import { adminDb, adminAuth } from "./firebase-admin";
import { storage } from "./storage";
import express from "express";

// Create a router to be used by serverless functions
export const appRouter = express.Router();

// Register routes on the router instead of directly on app
export async function registerRoutes(app: Express) {
  // Protected routes - require authentication
  app.use("/api", authenticateUser);
  appRouter.use(authenticateUser);

  // Get dashboard stats
  app.get("/api/stats", async (req: AuthRequest, res) => {
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

  // Mirror the same route on the router
  appRouter.get("/stats", async (req: AuthRequest, res) => {
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

  // User management endpoints
  app.post("/api/users/role", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { uid, role } = req.body;

      // Update custom claims
      await adminAuth.setCustomUserClaims(uid, { role });

      // Update user in Firestore
      await adminDb.collection("users").doc(uid).update({ role });

      res.json({ message: "User role updated successfully" });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Assets endpoints
  app.get("/api/assets", async (req: AuthRequest, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ message: "Unauthorized - No user found" });
      }
      
      const snapshot = await adminDb.collection("assets")
        .where("userId", "==", req.user.uid)
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

  app.post("/api/assets", async (req: AuthRequest, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ message: "Unauthorized - No user found" });
      }
      
      console.log("Creating asset for user:", req.user.uid);
      console.log("Request body:", req.body);
      
      const asset = {
        ...req.body,
        userId: req.user.uid, // Make sure this matches what's checked in Firestore rules
        createdBy: req.user.uid,
        createdAt: new Date().toISOString(),
      };
      
      console.log("Full asset data to be saved:", asset);
      
      const doc = await adminDb.collection("assets").add(asset);
      console.log("Asset created with ID:", doc.id);
      res.status(201).json({ id: doc.id, ...asset });
    } catch (error) {
      console.error("Error creating asset:", error);
      console.error("Error details:", JSON.stringify(error));
      res.status(500).json({ message: "Failed to create asset" });
    }
  });

  // Vendors endpoints
  app.get("/api/vendors", async (req: AuthRequest, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ message: "Unauthorized - No user found" });
      }
      
      const snapshot = await adminDb.collection("vendors")
        .where("userId", "==", req.user.uid)
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

  app.post("/api/vendors", async (req: AuthRequest, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ message: "Unauthorized - No user found" });
      }
      
      const vendor = {
        ...req.body,
        userId: req.user.uid, // Make sure this matches what's checked in Firestore rules
        createdBy: req.user.uid,
        createdAt: new Date().toISOString(),
      };
      
      const doc = await adminDb.collection("vendors").add(vendor);
      res.status(201).json({ id: doc.id, ...vendor });
    } catch (error) {
      console.error("Error creating vendor:", error);
      res.status(500).json({ message: "Failed to create vendor" });
    }
  });
  
  app.delete("/api/vendors/:id", async (req: AuthRequest, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ message: "Unauthorized - No user found" });
      }
      
      const vendorId = req.params.id;
      
      // First verify that the vendor belongs to the user
      const vendorDoc = await adminDb.collection("vendors").doc(vendorId).get();
      
      if (!vendorDoc.exists) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      const vendorData = vendorDoc.data();
      
      if (vendorData?.userId !== req.user.uid) {
        return res.status(403).json({ message: "Unauthorized - You don't have permission to delete this vendor" });
      }
      
      // Delete the vendor
      await adminDb.collection("vendors").doc(vendorId).delete();
      
      res.status(200).json({ message: "Vendor deleted successfully" });
    } catch (error) {
      console.error("Error deleting vendor:", error);
      res.status(500).json({ message: "Failed to delete vendor" });
    }
  });
  
  app.put("/api/vendors/:id", async (req: AuthRequest, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ message: "Unauthorized - No user found" });
      }
      
      const vendorId = req.params.id;
      
      // First verify that the vendor belongs to the user
      const vendorDoc = await adminDb.collection("vendors").doc(vendorId).get();
      
      if (!vendorDoc.exists) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      const vendorData = vendorDoc.data();
      
      if (vendorData?.userId !== req.user.uid) {
        return res.status(403).json({ message: "Unauthorized - You don't have permission to update this vendor" });
      }
      
      // Update the vendor data
      const updateData = {
        ...req.body,
        userId: req.user.uid,
        updatedAt: new Date().toISOString(),
      };
      
      await adminDb.collection("vendors").doc(vendorId).update(updateData);
      
      res.status(200).json({ 
        id: vendorId,
        ...updateData
      });
    } catch (error) {
      console.error("Error updating vendor:", error);
      res.status(500).json({ message: "Failed to update vendor" });
    }
  });

  // Invitations endpoints
  app.post("/api/invitations", authenticateUser, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ message: "Unauthorized - No user found" });
      }
      
      const { email, role, message } = req.body;

      // Get company name from business profile
      const businessProfileSnapshot = await adminDb.collection("businessProfiles")
        .where("userId", "==", req.user.uid)
        .limit(1)
        .get();
      
      const companyName = businessProfileSnapshot.empty 
        ? "Company" 
        : businessProfileSnapshot.docs[0].data().companyName || "Company";

      // Generate a unique token for the invitation
      const token = Buffer.from(`${email}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`).toString('base64');
      
      // Generate a custom invitation link
      const invitationData = {
        email,
        role,
        message,
        token,
        companyName,
        invitedBy: req.user.uid,
        invitedByEmail: req.user.email,
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      };
      
      // Store invitation in Firestore
      const invitationRef = await adminDb.collection("invitations").add(invitationData);
      
      // TODO: Send email invitation (implement email service)
      // For now, just return success with the invitation link
      const invitationLink = `${req.protocol}://${req.get('host')}/accept-invitation/${token}`;
      
      res.status(201).json({ 
        message: "Invitation sent successfully",
        invitationLink,
        invitationId: invitationRef.id
      });
    } catch (error) {
      console.error("Error sending invitation:", error);
      res.status(500).json({ message: "Failed to send invitation" });
    }
  });
  
  // Verify invitation token - public endpoint, no auth required
  app.get("/api/invitations/verify/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({ message: "Invalid token" });
      }
      
      // Special handling for mock tokens (for testing)
      if (token.startsWith('mock-token-')) {
        console.log("Processing mock invitation token for testing");
        // Create a mock invitation for testing
        const mockInvitation = {
          id: "mock-invitation-" + Date.now(),
          email: "test@example.com",
          role: "user",
          companyName: "Test Company",
          message: "This is a test invitation",
          invitedBy: "mock-user-id",
          status: "pending",
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        };
        
        return res.json({
          message: "Invitation verified (mock)",
          invitation: mockInvitation
        });
      }
      
      // Find the invitation by token
      const invitationsSnapshot = await adminDb.collection("invitations")
        .where("token", "==", token)
        .limit(1)
        .get();
      
      if (invitationsSnapshot.empty) {
        return res.status(404).json({ message: "Invitation not found or has expired" });
      }
      
      const invitationDoc = invitationsSnapshot.docs[0];
      const invitation = invitationDoc.data();
      
      // Check if invitation has expired
      if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
        return res.status(400).json({ message: "Invitation has expired" });
      }
      
      // Check if invitation has already been accepted
      if (invitation.status === 'accepted') {
        return res.status(400).json({ message: "Invitation has already been accepted" });
      }
      
      res.json({ 
        message: "Invitation verified",
        invitation: {
          id: invitationDoc.id,
          ...invitation
        }
      });
    } catch (error) {
      console.error("Error verifying invitation:", error);
      res.status(500).json({ message: "Failed to verify invitation" });
    }
  });
  
  // Accept invitation
  app.post("/api/invitations/accept/:token", authenticateUser, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ message: "Unauthorized - No user found" });
      }
      
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({ message: "Invalid token" });
      }
      
      // Special handling for mock tokens (for testing)
      if (token.startsWith('mock-token-')) {
        console.log("Processing mock invitation acceptance for testing");
        // Handle mock invitation acceptance
        return res.json({ message: "Mock invitation accepted successfully" });
      }
      
      // Find the invitation by token
      const invitationsSnapshot = await adminDb.collection("invitations")
        .where("token", "==", token)
        .limit(1)
        .get();
      
      if (invitationsSnapshot.empty) {
        return res.status(404).json({ message: "Invitation not found or has expired" });
      }
      
      const invitationDoc = invitationsSnapshot.docs[0];
      const invitation = invitationDoc.data();
      
      // Check if invitation has expired
      if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
        return res.status(400).json({ message: "Invitation has expired" });
      }
      
      // Check if invitation has already been accepted
      if (invitation.status === 'accepted') {
        return res.status(400).json({ message: "Invitation has already been accepted" });
      }
      
      // Verify that the user's email matches the invitation email
      if (req.user.email !== invitation.email) {
        return res.status(403).json({ 
          message: "You must use the email address that the invitation was sent to" 
        });
      }
      
      // Update invitation status
      await adminDb.collection("invitations").doc(invitationDoc.id).update({
        status: 'accepted',
        acceptedAt: new Date().toISOString(),
        acceptedBy: req.user.uid
      });
      
      // Add user to the team collection
      await adminDb.collection("team").add({
        userId: req.user.uid,
        email: req.user.email,
        role: invitation.role,
        companyId: invitation.invitedBy, // Using invitedBy as the companyId
        addedAt: new Date().toISOString()
      });
      
      // Set custom claims for the user to include their role
      await adminAuth.setCustomUserClaims(req.user.uid, { 
        role: invitation.role,
        companyId: invitation.invitedBy
      });
      
      res.json({ message: "Invitation accepted successfully" });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      res.status(500).json({ message: "Failed to accept invitation" });
    }
  });

  // For each existing app.X('/api/route') pattern, add a matching appRouter.X('/route') without the /api prefix
  // This allows the serverless function to work with the same routes

  // Example pattern to follow for all routes:
  // app.get("/api/something", handler);
  // appRouter.get("/something", handler);  // Same handler without /api prefix

  const httpServer = createServer(app);
  return httpServer;
}