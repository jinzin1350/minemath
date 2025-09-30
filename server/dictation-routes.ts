import { Router } from "express";
import { db } from "./db";
import { dictationWords, dictationUserProgress, dictationGameHistory, insertDictationUserProgressSchema, insertDictationGameHistorySchema } from "@shared/schema";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// GET /api/dictation/words - Get random words for a game session
router.get("/words", async (req, res) => {
  try {
    const level = parseInt(req.query.level as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string;

    // Build query
    let allWords;
    if (category) {
      allWords = await db
        .select()
        .from(dictationWords)
        .where(and(
          eq(dictationWords.level, level),
          eq(dictationWords.category, category)
        ));
    } else {
      allWords = await db
        .select()
        .from(dictationWords)
        .where(eq(dictationWords.level, level));
    }
    
    // Shuffle and limit
    const shuffled = allWords.sort(() => Math.random() - 0.5);
    const selectedWords = shuffled.slice(0, limit);

    res.json(selectedWords);
  } catch (error) {
    console.error("Error fetching words:", error);
    res.status(500).json({ message: "Failed to fetch words" });
  }
});

// GET /api/dictation/categories - Get available categories by level
router.get("/categories", async (req, res) => {
  try {
    const level = parseInt(req.query.level as string) || 1;

    const categories = await db
      .selectDistinct({ category: dictationWords.category })
      .from(dictationWords)
      .where(eq(dictationWords.level, level));

    res.json(categories.map(c => c.category));
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

// GET /api/dictation/progress - Get user's dictation progress
router.get("/progress", async (req: any, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;

    let progress = await db
      .select()
      .from(dictationUserProgress)
      .where(eq(dictationUserProgress.userId, userId))
      .limit(1);

    if (progress.length === 0) {
      // Create initial progress
      const newProgress = await db
        .insert(dictationUserProgress)
        .values({
          userId,
          totalScore: 0,
          accuracy: 0,
          currentStreak: 0,
          maxStreak: 0,
          totalWordsPracticed: 0,
          correctWords: 0,
        })
        .returning();
      
      progress = newProgress;
    }

    res.json(progress[0]);
  } catch (error) {
    console.error("Error fetching progress:", error);
    res.status(500).json({ message: "Failed to fetch progress" });
  }
});

// POST /api/dictation/progress - Update user's dictation progress
router.post("/progress", async (req: any, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const updateSchema = insertDictationUserProgressSchema.partial().omit({ userId: true });
    const validatedData = updateSchema.parse(req.body);

    // Check if progress exists
    const existing = await db
      .select()
      .from(dictationUserProgress)
      .where(eq(dictationUserProgress.userId, userId))
      .limit(1);

    let result;
    if (existing.length === 0) {
      // Create new
      result = await db
        .insert(dictationUserProgress)
        .values({
          userId,
          ...validatedData,
        })
        .returning();
    } else {
      // Update existing
      result = await db
        .update(dictationUserProgress)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(dictationUserProgress.userId, userId))
        .returning();
    }

    res.json(result[0]);
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

// POST /api/dictation/game-history - Save game session history
router.post("/game-history", async (req: any, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const validatedData = insertDictationGameHistorySchema.parse({
      ...req.body,
      userId,
    });

    const result = await db
      .insert(dictationGameHistory)
      .values(validatedData)
      .returning();

    res.json(result[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Invalid request data", 
        errors: error.errors 
      });
    }
    console.error("Error saving game history:", error);
    res.status(500).json({ message: "Failed to save game history" });
  }
});

// GET /api/dictation/game-history - Get user's game history
router.get("/game-history", async (req: any, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const limit = parseInt(req.query.limit as string) || 10;

    const history = await db
      .select()
      .from(dictationGameHistory)
      .where(eq(dictationGameHistory.userId, userId))
      .orderBy(desc(dictationGameHistory.playedAt))
      .limit(limit);

    res.json(history);
  } catch (error) {
    console.error("Error fetching game history:", error);
    res.status(500).json({ message: "Failed to fetch game history" });
  }
});

// GET /api/dictation/stats - Get statistics
router.get("/stats", async (req, res) => {
  try {
    const totalWords = await db.select({ count: count() }).from(dictationWords);
    const wordsByLevel = await db
      .select({
        level: dictationWords.level,
        count: count(),
      })
      .from(dictationWords)
      .groupBy(dictationWords.level);

    res.json({
      totalWords: totalWords[0].count,
      wordsByLevel,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

export default router;
