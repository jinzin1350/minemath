import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Game progress routes
  app.get('/api/progress/recent', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const days = parseInt(req.query.days as string) || 7;
      const progress = await storage.getRecentProgress(userId, days);
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
      const { totalPoints } = req.body;
      const newAchievements = await storage.checkAndAwardPointAchievements(userId, totalPoints);
      res.json(newAchievements);
    } catch (error) {
      console.error("Error checking achievements:", error);
      res.status(500).json({ message: "Failed to check achievements" });
    }
  });

  app.patch('/api/achievements/:id/mark-seen', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.markAchievementAsSeen(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking achievement as seen:", error);
      res.status(500).json({ message: "Failed to mark achievement as seen" });
    }
  });

  app.post('/api/progress/daily', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { pointsEarned, questionsAnswered, correctAnswers, level } = req.body;
      const today = new Date().toISOString().split('T')[0];
      
      const progress = await storage.upsertDailyProgress({
        userId,
        date: today,
        pointsEarned,
        questionsAnswered,
        correctAnswers,
        level
      });
      
      res.json(progress);
    } catch (error) {
      console.error("Error updating progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  app.post('/api/game-session', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessionData = { ...req.body, userId };
      
      const session = await storage.createGameSession(sessionData);
      res.json(session);
    } catch (error) {
      console.error("Error creating game session:", error);
      res.status(500).json({ message: "Failed to create game session" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}