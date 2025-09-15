import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertDailyProgressSchema, insertGameSessionSchema } from "@shared/schema";
import { z } from "zod";

// Validation schemas for API endpoints
const updateDailyProgressSchema = insertDailyProgressSchema.omit({ userId: true, date: true });
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

  const httpServer = createServer(app);
  return httpServer;
}