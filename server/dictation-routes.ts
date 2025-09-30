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

    // Validate level
    if (level < 1 || level > 5) {
      return res.status(400).json({ message: "Level must be between 1 and 5" });
    }

    // Validate limit
    if (limit < 1 || limit > 50) {
      return res.status(400).json({ message: "Limit must be between 1 and 50" });
    }

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
    
    if (allWords.length === 0) {
      console.warn(`No words found for level ${level}${category ? ` and category ${category}` : ''}`);
      return res.status(404).json({ 
        message: `No words available for level ${level}${category ? ` in category ${category}` : ''}` 
      });
    }
    
    // Shuffle and limit
    const shuffled = allWords.sort(() => Math.random() - 0.5);
    const selectedWords = shuffled.slice(0, Math.min(limit, allWords.length));

    console.log(`Returning ${selectedWords.length} words for level ${level}${category ? ` (category: ${category})` : ''}`);
    res.json(selectedWords);
  } catch (error) {
    console.error("Error fetching words:", error);
    res.status(500).json({ message: "Failed to fetch words", error: error.message });
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
    console.log(`📝 Saving dictation game history for user ${userId}:`, req.body);
    
    const validatedData = insertDictationGameHistorySchema.parse({
      ...req.body,
      userId,
    });

    console.log(`✅ Validated data:`, validatedData);

    const result = await db
      .insert(dictationGameHistory)
      .values(validatedData)
      .returning();

    console.log(`💾 Game history saved successfully:`, result[0]);
    res.json(result[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Validation error:", error.errors);
      return res.status(400).json({ 
        message: "Invalid request data", 
        errors: error.errors 
      });
    }
    console.error("❌ Error saving game history:", error);
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

// GET /api/dictation/progress-report - Get detailed progress report for a specific month
router.get("/progress-report", async (req: any, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const month = req.query.month as string; // Format: YYYY-MM
    
    if (!month) {
      return res.status(400).json({ message: "Month parameter is required (format: YYYY-MM)" });
    }

    // Parse month
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

    // Get daily game history for the month
    const dailyHistory = await db
      .select({
        date: sql<string>`DATE(${dictationGameHistory.playedAt})`,
        totalGames: count(),
        totalScore: sql<number>`SUM(${dictationGameHistory.score})`,
        totalWords: sql<number>`SUM(${dictationGameHistory.wordsTotal})`,
        totalCorrect: sql<number>`SUM(${dictationGameHistory.wordsCorrect})`,
        avgAccuracy: sql<number>`AVG(${dictationGameHistory.accuracy})`,
        bestLevel: sql<number>`MAX(${dictationGameHistory.levelReached})`,
      })
      .from(dictationGameHistory)
      .where(
        and(
          eq(dictationGameHistory.userId, userId),
          sql`${dictationGameHistory.playedAt} >= ${startDate}`,
          sql`${dictationGameHistory.playedAt} <= ${endDate}`
        )
      )
      .groupBy(sql`DATE(${dictationGameHistory.playedAt})`)
      .orderBy(sql`DATE(${dictationGameHistory.playedAt}) DESC`);

    // Get stats by game mode
    const modeStats = await db
      .select({
        gameMode: dictationGameHistory.gameMode,
        totalGames: count(),
        totalScore: sql<number>`SUM(${dictationGameHistory.score})`,
        totalWords: sql<number>`SUM(${dictationGameHistory.wordsTotal})`,
        totalCorrect: sql<number>`SUM(${dictationGameHistory.wordsCorrect})`,
        avgAccuracy: sql<number>`AVG(${dictationGameHistory.accuracy})`,
      })
      .from(dictationGameHistory)
      .where(
        and(
          eq(dictationGameHistory.userId, userId),
          sql`${dictationGameHistory.playedAt} >= ${startDate}`,
          sql`${dictationGameHistory.playedAt} <= ${endDate}`
        )
      )
      .groupBy(dictationGameHistory.gameMode);

    // Get overall monthly summary
    const monthlySummary = await db
      .select({
        totalGames: count(),
        totalScore: sql<number>`SUM(${dictationGameHistory.score})`,
        totalWords: sql<number>`SUM(${dictationGameHistory.wordsTotal})`,
        totalCorrect: sql<number>`SUM(${dictationGameHistory.wordsCorrect})`,
        avgAccuracy: sql<number>`AVG(${dictationGameHistory.accuracy})`,
        bestLevel: sql<number>`MAX(${dictationGameHistory.levelReached})`,
        uniqueDays: sql<number>`COUNT(DISTINCT DATE(${dictationGameHistory.playedAt}))`,
      })
      .from(dictationGameHistory)
      .where(
        and(
          eq(dictationGameHistory.userId, userId),
          sql`${dictationGameHistory.playedAt} >= ${startDate}`,
          sql`${dictationGameHistory.playedAt} <= ${endDate}`
        )
      );

    res.json({
      month,
      dailyHistory: dailyHistory.map(day => ({
        date: day.date,
        totalGames: day.totalGames,
        totalScore: day.totalScore || 0,
        totalWords: day.totalWords || 0,
        totalCorrect: day.totalCorrect || 0,
        accuracy: Math.round(day.avgAccuracy || 0),
        bestLevel: day.bestLevel || 1,
      })),
      modeStats: modeStats.map(mode => ({
        gameMode: mode.gameMode,
        totalGames: mode.totalGames,
        totalScore: mode.totalScore || 0,
        totalWords: mode.totalWords || 0,
        totalCorrect: mode.totalCorrect || 0,
        accuracy: Math.round(mode.avgAccuracy || 0),
      })),
      monthlySummary: monthlySummary[0] ? {
        totalGames: monthlySummary[0].totalGames,
        totalScore: monthlySummary[0].totalScore || 0,
        totalWords: monthlySummary[0].totalWords || 0,
        totalCorrect: monthlySummary[0].totalCorrect || 0,
        accuracy: Math.round(monthlySummary[0].avgAccuracy || 0),
        bestLevel: monthlySummary[0].bestLevel || 1,
        activeDays: monthlySummary[0].uniqueDays || 0,
      } : {
        totalGames: 0,
        totalScore: 0,
        totalWords: 0,
        totalCorrect: 0,
        accuracy: 0,
        bestLevel: 1,
        activeDays: 0,
      }
    });
  } catch (error) {
    console.error("Error fetching dictation progress report:", error);
    res.status(500).json({ message: "Failed to fetch progress report" });
  }
});

// GET /api/dictation/weekly-report - Get 7-day summary
router.get("/weekly-report", async (req: any, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const weeklyData = await db
      .select({
        date: sql<string>`DATE(${dictationGameHistory.playedAt})`,
        totalGames: count(),
        totalScore: sql<number>`SUM(${dictationGameHistory.score})`,
        totalWords: sql<number>`SUM(${dictationGameHistory.wordsTotal})`,
        totalCorrect: sql<number>`SUM(${dictationGameHistory.wordsCorrect})`,
        avgAccuracy: sql<number>`AVG(${dictationGameHistory.accuracy})`,
      })
      .from(dictationGameHistory)
      .where(
        and(
          eq(dictationGameHistory.userId, userId),
          sql`${dictationGameHistory.playedAt} >= ${startDate}`,
          sql`${dictationGameHistory.playedAt} <= ${endDate}`
        )
      )
      .groupBy(sql`DATE(${dictationGameHistory.playedAt})`)
      .orderBy(sql`DATE(${dictationGameHistory.playedAt}) DESC`);

    res.json(weeklyData.map(day => ({
      date: day.date,
      totalGames: day.totalGames,
      totalScore: day.totalScore || 0,
      totalWords: day.totalWords || 0,
      totalCorrect: day.totalCorrect || 0,
      accuracy: Math.round(day.avgAccuracy || 0),
    })));
  } catch (error) {
    console.error("Error fetching weekly report:", error);
    res.status(500).json({ message: "Failed to fetch weekly report" });
  }
});

export default router;
