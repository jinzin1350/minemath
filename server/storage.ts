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
import { eq, desc, and, gte, sum } from "drizzle-orm";

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
  
  // Game session operations
  createGameSession(session: InsertGameSession): Promise<GameSession>;
  getUserGameSessions(userId: string, limit?: number): Promise<GameSession[]>;
  
  // Achievement operations
  getUserAchievements(userId: string): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  markAchievementAsSeen(achievementId: string, userId: string): Promise<void>;
  getUserTotalPoints(userId: string): Promise<number>;
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
          pointsEarned: progressData.pointsEarned,
          questionsAnswered: progressData.questionsAnswered,
          correctAnswers: progressData.correctAnswers,
          level: progressData.level,
          updatedAt: new Date(),
        },
      })
      .returning();
    return progress;
  }

  async getRecentProgress(userId: string, days: number): Promise<DailyProgress[]> {
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

  async getUserTotalPoints(userId: string): Promise<number> {
    const result = await db
      .select({ total: sum(dailyProgress.pointsEarned) })
      .from(dailyProgress)
      .where(eq(dailyProgress.userId, userId));
    
    return result[0]?.total ? Number(result[0].total) : 0;
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

  async getUserInventory(userId: string): Promise<UserInventory[]> {
    return await db
      .select()
      .from(userInventory)
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
