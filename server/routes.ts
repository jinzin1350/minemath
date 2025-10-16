import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./simpleAuth";
import { insertDailyProgressSchema, insertTemporaryProgressSchema, insertGameSessionSchema } from "@shared/schema";
import { z } from "zod";

// Validation schemas for API endpoints
const updateDailyProgressSchema = insertDailyProgressSchema.omit({ userId: true, date: true });
const updateTemporaryProgressSchema = insertTemporaryProgressSchema;
const createGameSessionSchema = insertGameSessionSchema.omit({ userId: true });

// Helper function to get userId from session
const getUserId = (req: any): string => {
  return (req.session as any).userId;
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Note: /api/auth/user is already defined in simpleAuth.ts, so we skip it here

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
      const { firstName, lastName, name } = req.body;

      // Support both individual firstName/lastName and combined name
      let finalFirstName = firstName?.trim();
      let finalLastName = lastName?.trim() || '';

      // If name is provided instead, split it
      if (name && !finalFirstName) {
        const nameParts = name.trim().split(' ');
        finalFirstName = nameParts[0];
        finalLastName = nameParts.slice(1).join(' ');
      }

      if (!finalFirstName || finalFirstName.length === 0) {
        return res.status(400).json({ message: "First name is required" });
      }

      const user = await storage.updateUserName(userId, finalFirstName, finalLastName);
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
      // Auto-finalize overdue records first
      await storage.finalizeDueAll();
      
      const requestedDate = req.query.date as string;
      const limit = parseInt(req.query.limit as string) || 10;

      let date = requestedDate;
      if (!date) {
        date = await storage.getLatestFinalizedDate();
        
        // If no finalized date exists, try to get recent dates that should be finalized
        if (!date) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          date = yesterday.toISOString().split('T')[0];
        }
      }

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

  // Manual finalization endpoint for testing
  app.post('/api/admin/force-finalize', isAuthenticated, async (req: any, res) => {
    try {
      console.log('🔧 Manual finalization requested');
      
      // First, force finalize all overdue records
      await storage.finalizeDueAll();
      
      // Then, force finalize any past dates that weren't finalized due to timezone issues
      await storage.forceFinalizePastDates();
      
      // Get updated stats
      const latestFinalizedDate = await storage.getLatestFinalizedDate();
      const leaderboard = latestFinalizedDate 
        ? await storage.getLeaderboard(latestFinalizedDate, 10)
        : [];

      console.log(`🔧 Manual finalization completed. Latest date: ${latestFinalizedDate}, Leaderboard entries: ${leaderboard.length}`);

      res.json({
        message: 'Finalization completed',
        latestFinalizedDate,
        leaderboardEntries: leaderboard.length,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Error in manual finalization:", error);
      res.status(500).json({ message: "Failed to force finalization", error: error.message });
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

  // Global leaderboard for parents report
  app.get('/api/leaderboard/global', isAuthenticated, async (req: any, res) => {
    try {
      const { db } = await import('./db');
      const { dailyProgress, users, dictationGameHistory } = await import('@shared/schema');
      const { eq, desc, sum, sql } = await import('drizzle-orm');

      // Get all users with their total math scores
      const mathScores = await db
        .select({
          userId: dailyProgress.userId,
          totalMathScore: sum(dailyProgress.pointsEarned),
        })
        .from(dailyProgress)
        .groupBy(dailyProgress.userId);

      // Get all users with their total dictation scores
      const dictationScores = await db
        .select({
          userId: dictationGameHistory.userId,
          totalDictationScore: sum(dictationGameHistory.score),
        })
        .from(dictationGameHistory)
        .groupBy(dictationGameHistory.userId);

      // Get user information
      const usersList = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        })
        .from(users);

      // Combine all scores
      const globalLeaderboard = usersList.map(user => {
        const mathScore = mathScores.find(m => m.userId === user.id)?.totalMathScore || 0;
        const dictationScore = dictationScores.find(d => d.userId === user.id)?.totalDictationScore || 0;
        
        const firstName = user.firstName?.trim() || 'Player';
        const lastName = user.lastName?.trim() || '';
        const fullName = lastName ? `${firstName} ${lastName}` : firstName;

        return {
          userId: user.id,
          userName: fullName,
          mathScore: Number(mathScore),
          dictationScore: Number(dictationScore),
          totalScore: Number(mathScore) + Number(dictationScore),
        };
      })
      .filter(user => user.totalScore > 0) // Only show users with scores
      .sort((a, b) => b.totalScore - a.totalScore) // Sort by total score descending
      .map((user, index) => ({
        ...user,
        rank: index + 1,
      }));

      res.json({
        leaderboard: globalLeaderboard,
        total: globalLeaderboard.length,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Error fetching global leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch global leaderboard", error: error.message });
    }
  });

  // Debug endpoint for leaderboard
  app.get('/api/debug/leaderboard', isAuthenticated, async (req: any, res) => {
    try {
      const { db } = await import('./db');
      const { dailyProgress } = await import('@shared/schema');
      const { eq, and, desc } = await import('drizzle-orm');

      // Get all progress records (finalized and non-finalized)
      const allProgress = await db
        .select()
        .from(dailyProgress)
        .orderBy(desc(dailyProgress.date))
        .limit(20);

      // Get latest finalized date
      const latestFinalizedDate = await storage.getLatestFinalizedDate();

      // Force finalize overdue records for debugging
      await storage.finalizeDueAll();

      // Get leaderboard after finalization
      const leaderboard = latestFinalizedDate 
        ? await storage.getLeaderboard(latestFinalizedDate, 10)
        : [];

      res.json({
        allProgressCount: allProgress.length,
        finalizedCount: allProgress.filter(p => p.isFinal).length,
        pendingCount: allProgress.filter(p => !p.isFinal).length,
        latestFinalizedDate,
        leaderboardCount: leaderboard.length,
        allProgress: allProgress.slice(0, 5), // Show first 5 for debugging
        leaderboard: leaderboard.slice(0, 5),
        currentTime: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Error in leaderboard debug:", error);
      res.status(500).json({ message: "Failed to debug leaderboard", error: error.message });
    }
  });

  // Dictation routes
  const dictationRoutes = await import("./dictation-routes");
  app.use('/api/dictation', isAuthenticated, dictationRoutes.default);

  const httpServer = createServer(app);
  return httpServer;
}