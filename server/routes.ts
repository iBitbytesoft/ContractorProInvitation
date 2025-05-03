import type { Express } from "express";
import { createServer } from "http";
import { authenticateUser, requireAdmin, type AuthRequest } from "./middleware/auth";
import { adminDb, adminAuth } from "./firebase-admin";
import { storage } from "./storage";

export async function registerRoutes(app: Express) {
  // Protected routes - require authentication
  app.use("/api", authenticateUser);

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

  // Team invitation endpoints
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
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Generate a unique token for the invitation
      const token = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      
      // Create the invitation in Firestore
      const invitationData = {
        email,
        role: role || "user",
        message: message || "",
        token,
        status: "pending",
        invitedBy: req.user.uid,
        inviterEmail: req.user.email,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      };
      
      const invitationRef = await adminDb.collection("invitations").add(invitationData);
      
      // Generate an invitation link
      const invitationLink = `${req.protocol}://${req.get('host')}/accept-invitation/${token}?email=${encodeURIComponent(email)}&role=${encodeURIComponent(role || 'user')}`;
      
      res.status(200).json({
        id: invitationRef.id,
        invitationLink,
        ...invitationData
      });
    } catch (error) {
      console.error("Error creating invitation:", error);
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });
  
  // Verify invitation endpoint (public route)
  app.get("/api/invitations/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      // Handle mock tokens for testing
      if (token.startsWith('mock-token-')) {
        // Extract email from token if present
        let email = "test@example.com";
        let role = "user";
        
        // Try to extract email from the token (format: mock-token-timestamp-email)
        if (token.includes('-')) {
          const tokenParts = token.split('-');
          if (tokenParts.length >= 4) {
            const possibleEmail = decodeURIComponent(tokenParts.slice(3).join('-'));
            if (possibleEmail.includes('@')) {
              email = possibleEmail;
            }
          }
        }
        
        return res.status(200).json({
          valid: true,
          email,
          role,
          mock: true
        });
      }
      
      // Find the invitation in Firestore
      const snapshot = await adminDb.collection("invitations")
        .where("token", "==", token)
        .where("status", "==", "pending")
        .get();
      
      if (snapshot.empty) {
        return res.status(404).json({ valid: false, message: "Invitation not found or already used" });
      }
      
      const invitation = {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      };
      
      // Check if the invitation has expired
      if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
        return res.status(400).json({ valid: false, message: "Invitation has expired" });
      }
      
      res.status(200).json({
        valid: true,
        email: invitation.email,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
        inviterEmail: invitation.inviterEmail,
        message: invitation.message
      });
    } catch (error) {
      console.error("Error verifying invitation:", error);
      res.status(500).json({ valid: false, message: "Failed to verify invitation" });
    }
  });
  
  // Accept invitation endpoint
  app.post("/api/invitations/:token/accept", async (req, res) => {
    try {
      const { token } = req.params;
      const { uid } = req.body;
      
      if (!uid) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Handle mock tokens for testing
      if (token.startsWith('mock-token-')) {
        return res.status(200).json({
          success: true,
          message: "Mock invitation accepted successfully"
        });
      }
      
      // Find the invitation
      const snapshot = await adminDb.collection("invitations")
        .where("token", "==", token)
        .where("status", "==", "pending")
        .get();
      
      if (snapshot.empty) {
        return res.status(404).json({ message: "Invitation not found or already used" });
      }
      
      const invitationId = snapshot.docs[0].id;
      const invitation = snapshot.docs[0].data();
      
      // Update the invitation status
      await adminDb.collection("invitations").doc(invitationId).update({
        status: "accepted",
        acceptedBy: uid,
        acceptedAt: new Date().toISOString()
      });
      
      // Add the user to the team
      // This would typically involve updating a company or team document
      // For now, we'll just mark the invitation as accepted
      
      res.status(200).json({
        success: true,
        message: "Invitation accepted successfully"
      });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      res.status(500).json({ message: "Failed to accept invitation" });
    }
  });
  
  // Team members endpoints
  app.get("/api/team", authenticateUser, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ message: "Unauthorized - No user found" });
      }
      
      // For now, return a simplified team structure to avoid Firebase auth issues
      // Just include the current user as the owner
      const teamMembers = [
        {
          id: req.user.uid,
          email: req.user.email,
          displayName: req.user.email?.split('@')[0] || 'Owner',
          role: "admin",
          isOwner: true
        }
      ];
      
      // Try to get invitations sent by this user to show as pending team members
      try {
        const invitationsSnapshot = await adminDb.collection("invitations")
          .where("invitedBy", "==", req.user.uid)
          .where("status", "==", "pending")
          .get();
        
        // Add pending invitations as team members
        for (const doc of invitationsSnapshot.docs) {
          const invitation = doc.data();
          teamMembers.push({
            id: doc.id,
            email: invitation.email,
            displayName: invitation.email.split('@')[0],
            role: invitation.role,
            status: 'pending',
            addedAt: invitation.createdAt,
            isOwner: false
          });
        }
      } catch (inviteError) {
        console.error("Error fetching invitations:", inviteError);
        // Continue without invitations data
      }
      
      res.json(teamMembers);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  // Documents endpoints
  app.get("/api/documents", async (req: AuthRequest, res) => {
    try {
      const snapshot = await adminDb.collection("documents").get();
      const documents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });
  
  // Business Profile endpoints
  app.get("/api/business-profiles", async (req: AuthRequest, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ message: "Unauthorized - No user found" });
      }
      
      const snapshot = await adminDb.collection("businessProfiles")
        .where("userId", "==", req.user.uid)
        .get();
        
      if (snapshot.empty) {
        return res.json(null);
      }
      
      const profile = {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      };
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching business profile:", error);
      res.status(500).json({ message: "Failed to fetch business profile" });
    }
  });
  
  app.post("/api/business-profiles", async (req: AuthRequest, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ message: "Unauthorized - No user found" });
      }
      
      console.log("Creating business profile for user:", req.user.uid);
      console.log("Request body:", req.body);
      
      const profile = {
        ...req.body,
        userId: req.user.uid,
        createdBy: req.user.uid,
        createdAt: new Date().toISOString(),
      };
      
      console.log("Full profile data to be saved:", profile);
      
      // Check if user already has a profile
      const snapshot = await adminDb.collection("businessProfiles")
        .where("userId", "==", req.user.uid)
        .get();
      
      let result;
      if (snapshot.empty) {
        // Create new profile
        const doc = await adminDb.collection("businessProfiles").add(profile);
        console.log("Business profile created with ID:", doc.id);
        result = { id: doc.id, ...profile };
      } else {
        // Update existing profile
        const docId = snapshot.docs[0].id;
        await adminDb.collection("businessProfiles").doc(docId).update(profile);
        console.log("Business profile updated with ID:", docId);
        result = { id: docId, ...profile };
      }
      
      res.status(201).json(result);
    } catch (error) {
      console.error("Error saving business profile:", error);
      console.error("Error details:", JSON.stringify(error));
      res.status(500).json({ message: "Failed to save business profile" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}