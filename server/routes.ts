import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertDailyProgressSchema, insertTemporaryProgressSchema, insertGameSessionSchema } from "@shared/schema";
import { z } from "zod";

// Validation schemas for API endpoints
const updateDailyProgressSchema = insertDailyProgressSchema.omit({ userId: true, date: true });
const updateTemporaryProgressSchema = insertTemporaryProgressSchema;
const createGameSessionSchema = insertGameSessionSchema.omit({ userId: true });

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error: any) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch('/api/auth/user/age', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { age } = req.body;

      if (!age || age < 8 || age > 25) {
        return res.status(400).json({ message: "Age must be between 8 and 25" });
      }

      const user = await storage.updateUserAge(userId, age);
      res.json(user);
    } catch (error: any) {
      console.error("Error updating user age:", error);
      res.status(500).json({ message: "Failed to update user age" });
    }
  });

  app.patch('/api/auth/user/name', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName } = req.body;

      if (!firstName || firstName.trim().length === 0) {
        return res.status(400).json({ message: "First name is required" });
      }

      const user = await storage.updateUserName(userId, firstName.trim(), lastName?.trim() || '');
      res.json(user);
    } catch (error: any) {
      console.error("Error updating user name:", error);
      res.status(500).json({ message: "Failed to update user name" });
    }
  });

  // Game progress routes
  app.get('/api/progress/recent', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const days = parseInt(req.query.days as string) || 7;
      const month = req.query.month as string;

      let progress;
      if (month) {
        // Get monthly data for parents report
        progress = await storage.getMonthlyProgress(userId, month);
      } else {
        progress = await storage.getRecentProgress(userId, days);
      }

      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Achievement routes
  app.get('/api/achievements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  app.post('/api/achievements/check', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Security fix: Calculate total points server-side, don't trust client input
      const newAchievements = await storage.checkAndAwardPointAchievements(userId);
      res.json(newAchievements);
    } catch (error) {
      console.error("Error checking achievements:", error);
      res.status(500).json({ message: "Failed to check achievements" });
    }
  });

  app.patch('/api/achievements/:id/mark-seen', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      // Security fix: Verify ownership - users can only mark their own achievements as seen
      await storage.markAchievementAsSeen(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking achievement as seen:", error);
      res.status(500).json({ message: "Failed to mark achievement as seen" });
    }
  });

  app.post('/api/progress/daily', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Validate request body with Zod schema
      const validatedData = updateDailyProgressSchema.parse(req.body);
      const today = new Date().toISOString().split('T')[0];

      const progress = await storage.upsertDailyProgress({
        userId,
        date: today,
        ...validatedData
      });

      res.json(progress);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: error.errors 
        });
      }
      console.error("Error updating progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // NEW: Temporary progress endpoint (until midnight finalization)
  app.post('/api/progress/temporary', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Validate request body with Zod schema (includes optional timezone)
      const validatedData = updateTemporaryProgressSchema.parse(req.body);

      const progress = await storage.upsertTemporaryProgress(userId, validatedData);

      res.json({
        ...progress,
        status: progress.isFinal ? 'final' : 'temporary',
        timeUntilFinalization: progress.isFinal ? null : progress.finalizeAt
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: error.errors 
        });
      }
      console.error("Error updating temporary progress:", error);
      res.status(500).json({ message: "Failed to update temporary progress" });
    }
  });

  // NEW: Leaderboard endpoint (only finalized scores)
  app.get('/api/leaderboard', isAuthenticated, async (req: any, res) => {
    try {
      const date = req.query.date as string || await storage.getLatestFinalizedDate();
      const limit = parseInt(req.query.limit as string) || 10;

      if (!date) {
        return res.json({ 
          leaderboard: [], 
          date: null, 
          message: "No finalized scores available yet" 
        });
      }

      const leaderboard = await storage.getLeaderboard(date, limit);

      res.json({
        leaderboard,
        date,
        total: leaderboard.length
      });
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // NEW: Admin/Debug endpoint for finalization statistics
  app.get('/api/admin/finalization-stats', isAuthenticated, async (req: any, res) => {
    try {
      const { finalizationService } = await import('./finalization');
      const stats = await finalizationService.getFinalizationStats();

      res.json({
        ...stats,
        timestamp: new Date().toISOString(),
        schedulerRunning: true
      });
    } catch (error: any) {
      console.error("Error fetching finalization stats:", error);
      res.status(500).json({ message: "Failed to fetch finalization stats" });
    }
  });

  app.post('/api/game-session', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Validate request body with Zod schema
      const validatedData = createGameSessionSchema.parse(req.body);
      const sessionData = { ...validatedData, userId };

      const session = await storage.createGameSession(sessionData);
      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: error.errors 
        });
      }
      console.error("Error creating game session:", error);
      res.status(500).json({ message: "Failed to create game session" });
    }
  });

  // Reward system routes
  app.get('/api/rewards/available', isAuthenticated, async (req: any, res) => {
    try {
      const rewards = await storage.getAvailableRewards();
      res.json(rewards);
    } catch (error) {
      console.error("Error fetching available rewards:", error);
      res.status(500).json({ message: "Failed to fetch available rewards" });
    }
  });

  app.get('/api/rewards/opportunities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Check and create new opportunities based on points
      await storage.checkAndCreateRewardOpportunities(userId);
      // Return available opportunities
      const opportunities = await storage.getUserRewardOpportunities(userId);
      res.json(opportunities);
    } catch (error) {
      console.error("Error fetching reward opportunities:", error);
      res.status(500).json({ message: "Failed to fetch reward opportunities" });
    }
  });

  app.post('/api/rewards/select', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { pointsMilestone, rewardId } = req.body;

      if (!pointsMilestone || !rewardId) {
        return res.status(400).json({ message: "Points milestone and reward ID are required" });
      }

      // Get total points to verify eligibility
      const totalPoints = await storage.getUserTotalPoints(userId);
      if (totalPoints < pointsMilestone) {
        return res.status(400).json({ message: "Not enough points for this reward" });
      }

      // Add to inventory
      await storage.addToUserInventory({
        userId,
        rewardId,
        pointsWhenSelected: totalPoints,
      });

      // Mark opportunity as used
      await storage.useRewardOpportunity(userId, pointsMilestone, rewardId);

      res.json({ success: true });
    } catch (error) {
      console.error("Error selecting reward:", error);
      res.status(500).json({ message: "Failed to select reward" });
    }
  });

  app.get('/api/inventory', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const inventory = await storage.getUserInventory(userId);
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  // Debug endpoint to check database status
  app.get('/api/debug/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const totalPoints = await storage.getUserTotalPoints(userId);
      const recentProgress = await storage.getRecentProgress(userId, 7);

      res.json({
        userId,
        userExists: !!user,
        totalPoints,
        recentProgressCount: recentProgress.length,
        latestProgress: recentProgress[0] || null
      });
    } catch (error: any) {
      console.error("Error checking debug status:", error);
      res.status(500).json({ message: "Failed to check status", error: error.message });
    }
  });

  // Dictation routes
  const dictationRoutes = await import("./dictation-routes");
  app.use('/api/dictation', isAuthenticated, dictationRoutes.default);

  const httpServer = createServer(app);
  return httpServer;
}