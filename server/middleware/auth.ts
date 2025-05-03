import { Request, Response, NextFunction } from "express";
import { adminAuth } from "../firebase-admin";

// Extended request interface with user property
export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role?: string;
  };
}

// Helper function to check if a route should bypass authentication
export const shouldBypassAuth = (path: string): boolean => {
  // Add routes that should bypass authentication here
  const publicRoutes = [
    '/api/invitations/verify',  // Invitation verification endpoint
  ];
  
  return publicRoutes.some(route => path.startsWith(route));
};

// Middleware to authenticate users with Firebase
export const authenticateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Check if this route should bypass authentication
  if (shouldBypassAuth(req.path)) {
    console.log(`Bypassing authentication for public route: ${req.path}`);
    return next();
  }
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      console.log("Authentication failed: No authorization header");
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.log("Authentication failed: Authorization header not in Bearer format");
      return res.status(401).json({ message: "Unauthorized - Invalid token format" });
    }

    const token = authHeader.split('Bearer ')[1];
    console.log("Verifying token...");

    const decodedToken = await adminAuth.verifyIdToken(token);
    console.log("Token verified successfully for user:", decodedToken.uid);
    console.log("Decoded token:", decodedToken);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      role: decodedToken.role || 'defaultRole',
    };

    console.log("User authenticated:", req.user);
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    console.error("Error details:", JSON.stringify(error));
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }
};

// Middleware to require admin role
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized - No user found" });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Forbidden - Admin access required" });
  }

  next();
};