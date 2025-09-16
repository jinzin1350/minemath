import {
  users,
  dailyProgress,
  gameSessions,
  achievements,
  availableRewards,
  userInventory,
  rewardOpportunities,
  type User,
  type UpsertUser,
  type DailyProgress,
  type InsertDailyProgress,
  type InsertTemporaryProgress,
  type GameSession,
  type InsertGameSession,
  type Achievement,
  type InsertAchievement,
  type AvailableReward,
  type InsertAvailableReward,
  type UserInventory,
  type InsertUserInventory,
  type RewardOpportunity,
  type InsertRewardOpportunity,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, sum, sql } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User operations - required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Game progress operations
  getDailyProgress(userId: string, date: string): Promise<DailyProgress | undefined>;
  upsertDailyProgress(progress: InsertDailyProgress): Promise<DailyProgress>;
  getRecentProgress(userId: string, days: number): Promise<DailyProgress[]>;

  // NEW: Temporary/Final scoring system
  upsertTemporaryProgress(userId: string, progressData: InsertTemporaryProgress): Promise<DailyProgress>;
  finalizeDueForUser(userId: string): Promise<void>;
  finalizeDueAll(): Promise<void>;
  getLeaderboard(date: string, limit?: number): Promise<Array<{
    userId: string;
    userName: string;
    dailyScore: number;
    rank: number;
  }>>;
  getLatestFinalizedDate(): Promise<string | null>;

  // Game session operations
  createGameSession(session: InsertGameSession): Promise<GameSession>;
  getUserGameSessions(userId: string, limit?: number): Promise<GameSession[]>;

  // Achievement operations
  getUserAchievements(userId: string): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  markAchievementAsSeen(achievementId: string, userId: string): Promise<void>;
  // Three-score system queries
  getUserTotalScore(userId: string): Promise<number>;
  getUserDailyScore(userId: string): Promise<number>;
  getUserRedeemablePoints(userId: string): Promise<number>;
  checkAndAwardPointAchievements(userId: string): Promise<Achievement[]>;

  // Reward system operations
  getAvailableRewards(): Promise<AvailableReward[]>;
  createAvailableReward(reward: InsertAvailableReward): Promise<AvailableReward>;
  getUserInventory(userId: string): Promise<UserInventory[]>;
  addToUserInventory(inventory: InsertUserInventory): Promise<UserInventory>;
  getUserRewardOpportunities(userId: string): Promise<RewardOpportunity[]>;
  createRewardOpportunity(opportunity: InsertRewardOpportunity): Promise<RewardOpportunity>;
  useRewardOpportunity(userId: string, pointsMilestone: number, selectedRewardId: string): Promise<void>;
  checkAndCreateRewardOpportunities(userId: string): Promise<RewardOpportunity[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations - required for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Game progress operations
  async getDailyProgress(userId: string, date: string): Promise<DailyProgress | undefined> {
    const [progress] = await db
      .select()
      .from(dailyProgress)
      .where(and(eq(dailyProgress.userId, userId), eq(dailyProgress.date, date)));
    return progress;
  }

  async upsertDailyProgress(progressData: InsertDailyProgress): Promise<DailyProgress> {
    const [progress] = await db
      .insert(dailyProgress)
      .values(progressData)
      .onConflictDoUpdate({
        target: [dailyProgress.userId, dailyProgress.date],
        set: {
          dailyScore: progressData.dailyScore,
          questionsAnswered: progressData.questionsAnswered,
          correctAnswers: progressData.correctAnswers,
          level: progressData.level,
          updatedAt: new Date(),
        },
        where: eq(dailyProgress.isFinal, false), // Only update if not finalized
      })
      .returning();
    return progress;
  }

  async getRecentProgress(userId: string, days: number): Promise<DailyProgress[]> {
    // Lazy finalization: Check for due finalizations before fetching
    await this.finalizeDueForUser(userId);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return await db
      .select()
      .from(dailyProgress)
      .where(
        and(
          eq(dailyProgress.userId, userId),
          gte(dailyProgress.date, cutoffDate.toISOString().split('T')[0])
        )
      )
      .orderBy(desc(dailyProgress.date));
  }

  // NEW: Temporary/Final Scoring System Methods
  async upsertTemporaryProgress(userId: string, progressData: InsertTemporaryProgress): Promise<DailyProgress> {
    const timeZone = progressData.timeZone || 'UTC';

    // Calculate today's date in user's timezone (not UTC)
    const today = this.getTodayInTimezone(timeZone);

    // Calculate finalizeAt: start of next day in user's timezone
    const finalizeAt = this.calculateNextMidnight(timeZone);

    // Prepare data for upsert
    const dataToInsert = {
      userId,
      date: today,
      dailyScore: progressData.dailyScore || 0,
      questionsAnswered: progressData.questionsAnswered || 0,
      correctAnswers: progressData.correctAnswers || 0,
      level: progressData.level || 1,
      isFinal: false,
      finalizeAt,
      userTimeZone: timeZone,
      lastUpdateAt: new Date(),
    };

    // Try to insert/update the daily progress
    const [progress] = await db
      .insert(dailyProgress)
      .values(dataToInsert)
      .onConflictDoUpdate({
        target: [dailyProgress.userId, dailyProgress.date],
        set: {
          // Add new points and stats to existing values
          dailyScore: sql`${dailyProgress.dailyScore} + ${dataToInsert.dailyScore}`,
          questionsAnswered: sql`${dailyProgress.questionsAnswered} + ${dataToInsert.questionsAnswered}`,
          correctAnswers: sql`${dailyProgress.correctAnswers} + ${dataToInsert.correctAnswers}`,
          level: sql`GREATEST(${dailyProgress.level}, ${dataToInsert.level})`,
          lastUpdateAt: new Date(),
          // Don't update if already final - use new Date() instead of NOW()
          updatedAt: sql`CASE WHEN ${dailyProgress.isFinal} = true THEN ${dailyProgress.updatedAt} ELSE ${new Date()} END`,
        },
        where: eq(dailyProgress.isFinal, false), // Only update if not final
      })
      .returning();

    // If no progress returned (likely because record is final), fetch the existing record
    if (!progress) {
      const [existingProgress] = await db
        .select()
        .from(dailyProgress)
        .where(
          and(
            eq(dailyProgress.userId, userId),
            eq(dailyProgress.date, today)
          )
        );
      
      if (existingProgress) {
        // Return existing record (likely final)
        return existingProgress;
      } else {
        // This shouldn't happen, but create a basic record as fallback
        return dataToInsert as DailyProgress;
      }
    }

    // Update user's total score and redeemable points (only if not final and points > 0)
    if (progress && !progress.isFinal && dataToInsert.dailyScore > 0) {
      console.log(`Updating user scores: progress.isFinal=${progress.isFinal}, dailyScore=${dataToInsert.dailyScore}, userId=${userId}`);
      
      const updateResult = await db
        .update(users)
        .set({
          totalScore: sql`${users.totalScore} + ${dataToInsert.dailyScore}`,
          redeemablePoints: sql`${users.redeemablePoints} + ${dataToInsert.dailyScore}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();
      
      console.log(`User update result:`, updateResult);
    } else {
      console.log(`Skipping user update: progress=${!!progress}, isFinal=${progress?.isFinal}, dailyScore=${dataToInsert.dailyScore}`);
    }
    
    return progress;
  }

  async finalizeDueForUser(userId: string): Promise<void> {
    const now = new Date();

    await db
      .update(dailyProgress)
      .set({
        isFinal: true,
        finalizedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(dailyProgress.userId, userId),
          eq(dailyProgress.isFinal, false),
          sql`${dailyProgress.finalizeAt} <= ${now}`
        )
      );
  }

  async finalizeDueAll(): Promise<void> {
    const now = new Date();

    await db
      .update(dailyProgress)
      .set({
        isFinal: true,
        finalizedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(dailyProgress.isFinal, false),
          sql`${dailyProgress.finalizeAt} <= ${now}`
        )
      );
  }

  async getLeaderboard(date: string, limit: number = 10): Promise<Array<{
    userId: string;
    userName: string;
    dailyScore: number;
    rank: number;
  }>> {
    const results = await db
      .select({
        userId: dailyProgress.userId,
        userName: sql<string>`COALESCE(${users.firstName}, 'Player')`,
        dailyScore: dailyProgress.dailyScore,
      })
      .from(dailyProgress)
      .leftJoin(users, eq(dailyProgress.userId, users.id))
      .where(
        and(
          eq(dailyProgress.date, date),
          eq(dailyProgress.isFinal, true) // Only finalized scores
        )
      )
      .orderBy(desc(dailyProgress.dailyScore))
      .limit(limit);

    // Add rank numbers and handle nulls
    return results.map((result, index) => ({
      userId: result.userId,
      userName: result.userName || 'Player',
      dailyScore: result.dailyScore || 0,
      rank: index + 1,
    }));
  }

  async getLatestFinalizedDate(): Promise<string | null> {
    const [result] = await db
      .select({ date: dailyProgress.date })
      .from(dailyProgress)
      .where(eq(dailyProgress.isFinal, true))
      .orderBy(desc(dailyProgress.date))
      .limit(1);

    return result?.date || null;
  }

  private getTodayInTimezone(timeZone: string): string {
    try {
      // Validate timezone string
      if (!this.isValidTimeZone(timeZone)) {
        console.warn(`Invalid timezone: ${timeZone}, falling back to UTC`);
        return new Date().toISOString().split('T')[0];
      }

      const now = new Date();
      // Use Intl.DateTimeFormat for reliable timezone conversion
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });

      return formatter.format(now); // Returns YYYY-MM-DD format directly
    } catch (error) {
      console.error('Error calculating today in timezone:', timeZone, error);
      // Fallback to UTC date
      return new Date().toISOString().split('T')[0];
    }
  }

  private calculateNextMidnight(timeZone: string): Date {
    try {
      // Validate timezone string
      if (!this.isValidTimeZone(timeZone)) {
        console.warn(`Invalid timezone: ${timeZone}, falling back to UTC`);
        const tomorrow = new Date();
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        tomorrow.setUTCHours(0, 0, 0, 0);
        return tomorrow;
      }

      const now = new Date();

      // Get tomorrow's date in the target timezone
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const tomorrowDateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(tomorrow);

      // Create midnight timestamp in the target timezone
      // This approach is more reliable than manual offset calculations
      const midnightInTargetTZ = new Date(`${tomorrowDateStr}T00:00:00`);

      // Get the UTC offset for the target timezone at this specific time
      const offsetMs = this.getTimezoneOffsetMs(timeZone, midnightInTargetTZ);

      // Convert to UTC timestamp
      const utcMidnight = new Date(midnightInTargetTZ.getTime() - offsetMs);

      return utcMidnight;
    } catch (error) {
      console.error('Error calculating next midnight for timezone:', timeZone, error);
      // Fallback to UTC midnight
      const tomorrow = new Date();
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);
      return tomorrow;
    }
  }

  /**
   * Validates if a timezone string is supported
   */
  private isValidTimeZone(timeZone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Gets the timezone offset in milliseconds for a given timezone at a specific date
   * This is more reliable than manual calculations
   */
  private getTimezoneOffsetMs(timeZone: string, date: Date): number {
    try {
      // Create formatters for UTC and target timezone
      const utcFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      const targetFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      // Parse the formatted dates to get the actual time difference
      const utcParts = utcFormatter.formatToParts(date);
      const targetParts = targetFormatter.formatToParts(date);

      const utcTime = this.parseFormattedDate(utcParts);
      const targetTime = this.parseFormattedDate(targetParts);

      return utcTime - targetTime;
    } catch (error) {
      console.error('Error calculating timezone offset:', error);
      return 0; // Default to no offset (UTC)
    }
  }

  /**
   * Helper to parse Intl.DateTimeFormat parts into a timestamp
   */
  private parseFormattedDate(parts: Intl.DateTimeFormatPart[]): number {
    const values: { [key: string]: string } = {};
    parts.forEach(part => {
      if (part.type !== 'literal') {
        values[part.type] = part.value;
      }
    });

    const year = parseInt(values.year);
    const month = parseInt(values.month) - 1; // JavaScript months are 0-based
    const day = parseInt(values.day);
    const hour = parseInt(values.hour || '0');
    const minute = parseInt(values.minute || '0');
    const second = parseInt(values.second || '0');

    return new Date(year, month, day, hour, minute, second).getTime();
  }

  // Game session operations
  async createGameSession(sessionData: InsertGameSession): Promise<GameSession> {
    const [session] = await db
      .insert(gameSessions)
      .values(sessionData)
      .returning();
    return session;
  }

  async getUserGameSessions(userId: string, limit = 10): Promise<GameSession[]> {
    return await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.userId, userId))
      .orderBy(desc(gameSessions.createdAt))
      .limit(limit);
  }

  // Achievement operations
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    return await db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, userId))
      .orderBy(desc(achievements.unlockedAt));
  }

  async createAchievement(achievementData: InsertAchievement): Promise<Achievement> {
    const [achievement] = await db
      .insert(achievements)
      .values(achievementData)
      .returning();
    return achievement;
  }

  async markAchievementAsSeen(achievementId: string, userId: string): Promise<void> {
    await db
      .update(achievements)
      .set({ isNew: false })
      .where(and(eq(achievements.id, achievementId), eq(achievements.userId, userId)));
  }

  // Three-score system queries
  async getUserTotalScore(userId: string): Promise<number> {
    const user = await this.getUser(userId);
    return user?.totalScore || 0;
  }

  async getUserDailyScore(userId: string): Promise<number> {
    const timeZone = 'UTC'; // You can pass this as parameter
    const today = this.getTodayInTimezone(timeZone);
    
    const progress = await this.getDailyProgress(userId, today);
    return progress?.dailyScore || 0;
  }

  async getUserRedeemablePoints(userId: string): Promise<number> {
    const user = await this.getUser(userId);
    return user?.redeemablePoints || 0;
  }

  async getUserTotalPoints(userId: string): Promise<number> {
    // Legacy method - return total score for backward compatibility
    return this.getUserTotalScore(userId);
  }

  async checkAndAwardPointAchievements(userId: string): Promise<Achievement[]> {
    // Calculate total points from actual database records
    const totalPoints = await this.getUserTotalPoints(userId);
    const newAchievements: Achievement[] = [];

    // Define Minecraft-style achievements every 500 points
    const pointMilestones = [
      { points: 500, name: "Novice Miner", icon: "iron", desc: "Earned your first 500 points!" },
      { points: 1000, name: "Stone Warrior", icon: "gold", desc: "Reached 1,000 points - you're getting strong!" },
      { points: 1500, name: "Diamond Fighter", icon: "diamond", desc: "Amazing! 1,500 points achieved!" },
      { points: 2000, name: "Emerald Master", icon: "emerald", desc: "Incredible! 2,000 points unlocked!" },
      { points: 2500, name: "Redstone Engineer", icon: "redstone", desc: "Legendary! 2,500 points mastered!" },
      { points: 3000, name: "Math Legend", icon: "diamond", desc: "Ultimate achievement! 3,000 points!" },
    ];

    // Check which milestones user has achieved
    for (const milestone of pointMilestones) {
      if (totalPoints >= milestone.points) {
        // Check if user already has this achievement
        const [existing] = await db
          .select()
          .from(achievements)
          .where(
            and(
              eq(achievements.userId, userId),
              eq(achievements.pointsRequired, milestone.points),
              eq(achievements.type, "points")
            )
          );

        if (!existing) {
          // Award new achievement
          const achievement = await this.createAchievement({
            userId,
            type: "points",
            name: milestone.name,
            description: milestone.desc,
            iconType: milestone.icon,
            pointsRequired: milestone.points,
            isNew: true,
          });
          newAchievements.push(achievement);
        }
      }
    }

    return newAchievements;
  }

  // Reward system operations
  async getAvailableRewards(): Promise<AvailableReward[]> {
    return await db
      .select()
      .from(availableRewards)
      .where(eq(availableRewards.isActive, true));
  }

  async createAvailableReward(rewardData: InsertAvailableReward): Promise<AvailableReward> {
    const [reward] = await db
      .insert(availableRewards)
      .values(rewardData)
      .returning();
    return reward;
  }

  async getUserInventory(userId: string): Promise<any[]> {
    return await db
      .select({
        id: userInventory.id,
        userId: userInventory.userId,
        rewardId: userInventory.rewardId,
        selectedAt: userInventory.selectedAt,
        pointsWhenSelected: userInventory.pointsWhenSelected,
        // Include reward details
        name: availableRewards.name,
        description: availableRewards.description,
        iconName: availableRewards.iconName,
        itemType: availableRewards.itemType,
        rarity: availableRewards.rarity,
      })
      .from(userInventory)
      .innerJoin(availableRewards, eq(userInventory.rewardId, availableRewards.id))
      .where(eq(userInventory.userId, userId))
      .orderBy(desc(userInventory.selectedAt));
  }

  async addToUserInventory(inventoryData: InsertUserInventory): Promise<UserInventory> {
    const [inventory] = await db
      .insert(userInventory)
      .values(inventoryData)
      .returning();
    return inventory;
  }

  async getUserRewardOpportunities(userId: string): Promise<RewardOpportunity[]> {
    return await db
      .select()
      .from(rewardOpportunities)
      .where(and(
        eq(rewardOpportunities.userId, userId),
        eq(rewardOpportunities.isUsed, false)
      ))
      .orderBy(desc(rewardOpportunities.pointsMilestone));
  }

  async createRewardOpportunity(opportunityData: InsertRewardOpportunity): Promise<RewardOpportunity> {
    const [opportunity] = await db
      .insert(rewardOpportunities)
      .values(opportunityData)
      .returning();
    return opportunity;
  }

  async useRewardOpportunity(userId: string, pointsMilestone: number, selectedRewardId: string): Promise<void> {
    await db
      .update(rewardOpportunities)
      .set({
        isUsed: true,
        selectedRewardId,
        usedAt: new Date(),
      })
      .where(and(
        eq(rewardOpportunities.userId, userId),
        eq(rewardOpportunities.pointsMilestone, pointsMilestone)
      ));
  }

  async checkAndCreateRewardOpportunities(userId: string): Promise<RewardOpportunity[]> {
    const totalPoints = await this.getUserTotalPoints(userId);
    const newOpportunities: RewardOpportunity[] = [];

    // Create opportunities every 500 points
    const completedMilestones = Math.floor(totalPoints / 500);

    for (let milestone = 1; milestone <= completedMilestones; milestone++) {
      const pointsMilestone = milestone * 500;

      // Check if opportunity already exists
      const [existing] = await db
        .select()
        .from(rewardOpportunities)
        .where(and(
          eq(rewardOpportunities.userId, userId),
          eq(rewardOpportunities.pointsMilestone, pointsMilestone)
        ));

      if (!existing) {
        // Create new reward opportunity
        const opportunity = await this.createRewardOpportunity({
          userId,
          pointsMilestone,
          isUsed: false,
        });
        newOpportunities.push(opportunity);
      }
    }

    return newOpportunities;
  }
}

export const storage = new DatabaseStorage();