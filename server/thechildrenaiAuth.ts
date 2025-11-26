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
    let tokenFromQuery = req.query.token as string;
    const tokenFromCookie = req.cookies?.child_token;

    // Clean up token - remove any trailing quotes or special characters
    if (tokenFromQuery) {
      tokenFromQuery = tokenFromQuery.trim().replace(/['"]+$/g, '');
      console.log('🔍 Token from query (cleaned):', tokenFromQuery.substring(0, 50) + '...');
    }

    const token = tokenFromQuery || tokenFromCookie;

    // If no token, check for existing session (fallback to simple auth)
    if (!token) {
      // Check if user has session from simple auth
      const userId = (req.session as any).userId;
      if (userId) {
        // User is authenticated via simple auth, allow request
        console.log('✅ Using session-based auth for user:', userId);
        return next();
      }
      console.log('❌ No token and no session found');
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
      // Check if user exists with this email (from simple auth)
      if (childData.parent_email) {
        const existingUser = await storage.getUserByEmail(childData.parent_email);
        if (existingUser) {
          console.log(`👤 User already exists with email: ${childData.parent_email}, using existing account`);
          user = existingUser;

          // Update their name and age if provided
          if (childData.display_name && existingUser.firstName !== childData.display_name) {
            await storage.updateUserName(existingUser.id, childData.display_name, '');
          }
          if (childData.age && existingUser.age !== childData.age) {
            await storage.updateUserAge(existingUser.id, childData.age);
          }
        }
      }

      // If still no user, create new one
      if (!user) {
        console.log(`👶 Creating new user for child: ${childData.display_name}`);
        try {
          user = await storage.createUser({
            id: childData.child_id,
            email: childData.parent_email || `child_${childData.child_id}@thechildrenai.com`,
            firstName: childData.display_name,
            age: childData.age || 8,
          });
        } catch (error: any) {
          // Handle email conflict by using a unique email
          if (error.code === '23505' && error.constraint === 'users_email_unique') {
            console.log(`⚠️ Email conflict, creating user with unique email`);
            user = await storage.createUser({
              id: childData.child_id,
              email: `child_${childData.child_id}@thechildrenai.com`,
              firstName: childData.display_name,
              age: childData.age || 8,
            });
          } else {
            throw error;
          }
        }
      }
    } else {
      // Update existing user info if changed
      console.log(`👋 Updating user info for child: ${childData.display_name}`);
      if (childData.display_name && user.firstName !== childData.display_name) {
        await storage.updateUserName(childData.child_id, childData.display_name, '');
      }
      if (childData.age && user.age !== childData.age) {
        await storage.updateUserAge(childData.child_id, childData.age);
      }
    }

    // Store child info in session (use the actual user ID, not necessarily child_id)
    (req.session as any).userId = user.id;
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
  } catch (error: any) {
    console.error('❌ Error in TheChildrenAI auth middleware:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      constraint: error.constraint
    });
    res.status(500).json({
      message: "Authentication error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
