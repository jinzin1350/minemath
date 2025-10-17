import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

// Environment configuration
const USE_THECHILDRENAI_AUTH = process.env.USE_THECHILDRENAI_AUTH === 'true';
const THECHILDRENAI_API_URL = process.env.THECHILDRENAI_API_URL || 'https://api.thechildrenai.com/api/v1';

interface ChildTokenData {
  child_id: string;
  display_name: string;
  age?: number;
  grade_level?: number;
  parent_email?: string;
  avatar_color?: string;
}

interface VerifyTokenResponse {
  status: 'success' | 'error';
  data?: ChildTokenData;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Verify child token with TheChildrenAI API
 */
export async function verifyChildToken(token: string): Promise<ChildTokenData | null> {
  try {
    console.log('🔐 Verifying child token with TheChildrenAI API...');

    const response = await fetch(`${THECHILDRENAI_API_URL}/auth/verify-child-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const result: VerifyTokenResponse = await response.json();

    if (result.status === 'success' && result.data) {
      console.log(`✅ Token verified for child: ${result.data.display_name}`);
      return result.data;
    } else {
      console.error('❌ Token verification failed:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error verifying token:', error);
    return null;
  }
}

/**
 * Middleware to authenticate requests using TheChildrenAI JWT tokens
 * Falls back to session-based auth if no token is present
 */
export const thechildrenaiAuth: RequestHandler = async (req: any, res, next) => {
  try {
    // Extract token from query params or cookies
    const tokenFromQuery = req.query.token as string;
    const tokenFromCookie = req.cookies?.child_token;

    const token = tokenFromQuery || tokenFromCookie;

    // If no token, check for existing session (fallback to simple auth)
    if (!token) {
      // Check if user has session from simple auth
      const userId = (req.session as any).userId;
      if (userId) {
        // User is authenticated via simple auth, allow request
        return next();
      }
      return res.status(401).json({ message: "No authentication token provided" });
    }

    // Verify token with TheChildrenAI API
    const childData = await verifyChildToken(token);

    if (!childData) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Create or update user in MineMath database
    let user = await storage.getUser(childData.child_id);

    if (!user) {
      // Create new user with child_id as primary key
      console.log(`👶 Creating new user for child: ${childData.display_name}`);
      user = await storage.createUser({
        id: childData.child_id,
        email: childData.parent_email || `child_${childData.child_id}@thechildrenai.com`,
        firstName: childData.display_name,
        age: childData.age || 8, // Default age if not provided
      });
    } else {
      // Update existing user info if changed
      console.log(`👋 Updating user info for child: ${childData.display_name}`);
      const shouldUpdateName = user.firstName !== childData.display_name;
      const shouldUpdateAge = childData.age && user.age !== childData.age;
      const shouldUpdateEmail = childData.parent_email && user.email !== childData.parent_email;

      if (shouldUpdateName) {
        await storage.updateUserName(childData.child_id, childData.display_name, '');
      }
      if (shouldUpdateAge) {
        await storage.updateUserAge(childData.child_id, childData.age);
      }
    }

    // Store child info in session
    (req.session as any).userId = childData.child_id;
    (req.session as any).childData = childData;

    // Set cookie if token was from query (first time)
    if (tokenFromQuery) {
      res.cookie('child_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 4 * 60 * 60 * 1000, // 4 hours (same as token expiry)
      });
    }

    next();
  } catch (error) {
    console.error('❌ Error in TheChildrenAI auth middleware:', error);
    res.status(500).json({ message: "Authentication error" });
  }
};

/**
 * Setup function to be called in server initialization
 */
export function setupTheChildrenAIAuth(app: Express) {
  console.log(`🔧 TheChildrenAI Auth enabled: ${USE_THECHILDRENAI_AUTH}`);
  console.log(`🌐 API URL: ${THECHILDRENAI_API_URL}`);
}

export { USE_THECHILDRENAI_AUTH };
