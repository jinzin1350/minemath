import { db } from "./db";
import {
  users,
  dailyProgress,
  userInventory,
  achievements,
  userAchievements,
  gameSessions,
  NewUser,
  NewDailyProgress
} from "../shared/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";

export class Storage {
  async getUser(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(userData: NewUser) {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async getUserProgress(userId: string, date: string) {
    const [progress] = await db
      .select()
      .from(dailyProgress)
      .where(
        and(
          eq(dailyProgress.userId, userId),
          eq(dailyProgress.date, date)
        )
      );
    return progress;
  }

  async getRecentProgress(userId: string, limit: number = 7) {
    const progress = await db
      .select()
      .from(dailyProgress)
      .where(eq(dailyProgress.userId, userId))
      .orderBy(desc(dailyProgress.date))
      .limit(limit);
    return progress;
  }

  // Calculate today's date in user's timezone
  private getTodayInTimezone(timeZone: string): string {
    const now = new Date();
    const userDate = new Date(now.toLocaleString('en-US', { timeZone }));
    const year = userDate.getFullYear();
    const month = String(userDate.getMonth() + 1).padStart(2, '0');
    const day = String(userDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Calculate midnight finalization time in user's timezone
  private getMidnightInTimezone(timeZone: string): Date {
    const today = this.getTodayInTimezone(timeZone);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get midnight in user's timezone
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const tomorrowStr = `${year}-${month}-${day}`;

    // Parse as UTC midnight
    const midnightUTC = new Date(`${tomorrowStr}T00:00:00.000Z`);

    // Adjust for timezone offset
    const userMidnight = new Date(midnightUTC.toLocaleString('en-US', { timeZone }));
    const offset = midnightUTC.getTime() - userMidnight.getTime();

    return new Date(midnightUTC.getTime() + offset);
  }

  async upsertTemporaryProgress(
    userId: string,
    data: {
      pointsEarned: number;
      questionsAnswered: number;
      correctAnswers: number;
      level: number;
      timeZone?: string;
    }
  ) {
    const { pointsEarned, questionsAnswered, correctAnswers, level, timeZone = 'UTC' } = data;
    const today = this.getTodayInTimezone(timeZone);
    const finalizeAt = this.getMidnightInTimezone(timeZone);

    console.log(`📊 upsertTemporaryProgress: userId=${userId}, today=${today}, timeZone=${timeZone}, finalizeAt=${finalizeAt.toISOString()}`);

    // Get existing progress for today
    const existing = await this.getUserProgress(userId, today);

    if (existing) {
      // Update existing record - ADD to existing points
      const newPoints = existing.pointsEarned + pointsEarned;
      const newQuestions = existing.questionsAnswered + questionsAnswered;
      const newCorrect = existing.correctAnswers + correctAnswers;

      console.log(`📊 Updating existing progress: ${existing.pointsEarned} + ${pointsEarned} = ${newPoints}`);

      const [updated] = await db
        .update(dailyProgress)
        .set({
          pointsEarned: newPoints,
          questionsAnswered: newQuestions,
          correctAnswers: newCorrect,
          level,
          isFinal: false,
          finalizeAt,
          userTimeZone: timeZone,
          lastUpdateAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(dailyProgress.id, existing.id))
        .returning();

      console.log(`📊 Updated progress: ${JSON.stringify(updated)}`);
      return updated;
    } else {
      // Create new record
      console.log(`📊 Creating new progress for ${today}`);

      const [created] = await db
        .insert(dailyProgress)
        .values({
          userId,
          date: today,
          pointsEarned,
          questionsAnswered,
          correctAnswers,
          level,
          isFinal: false,
          finalizeAt,
          userTimeZone: timeZone,
          lastUpdateAt: new Date()
        })
        .returning();

      console.log(`📊 Created progress: ${JSON.stringify(created)}`);
      return created;
    }
  }

  async finalizeDueAll() {
    const now = new Date();

    // Finalize all records where finalizeAt has passed
    const result = await db
      .update(dailyProgress)
      .set({
        isFinal: true,
        finalizedAt: now,
        updatedAt: now
      })
      .where(
        and(
          eq(dailyProgress.isFinal, false),
          lte(dailyProgress.finalizeAt, now)
        )
      )
      .returning({ date: dailyProgress.date, userId: dailyProgress.userId });

    if (result.length > 0) {
      console.log(`🔒 Finalized ${result.length} records:`, result);
    }
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

  async getLeaderboard(date: string, limit: number = 10): Promise<Array<{
    userId: string;
    userName: string;
    pointsEarned: number;
    rank: number;
  }>> {
    const results = await db
      .select({
        userId: dailyProgress.userId,
        pointsEarned: dailyProgress.pointsEarned,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(dailyProgress)
      .leftJoin(users, eq(dailyProgress.userId, users.id))
      .where(
        and(
          eq(dailyProgress.date, date),
          eq(dailyProgress.isFinal, true)
        )
      )
      .orderBy(desc(dailyProgress.pointsEarned))
      .limit(limit);

    return results.map((result, index) => {
      const firstName = result.firstName?.trim() || 'Player';
      const lastName = result.lastName?.trim() || '';
      const fullName = lastName ? `${firstName} ${lastName}` : firstName;

      return {
        userId: result.userId,
        userName: fullName,
        pointsEarned: result.pointsEarned,
        rank: index + 1
      };
    });
  }

  async getInventory(userId: string) {
    return await db
      .select()
      .from(userInventory)
      .where(eq(userInventory.userId, userId));
  }

  async addToInventory(userId: string, rewardId: string, pointsWhenSelected: number) {
    const [item] = await db
      .insert(userInventory)
      .values({
        userId,
        rewardId,
        pointsWhenSelected
      })
      .returning();
    return item;
  }

  async getAllAchievements() {
    return await db.select().from(achievements);
  }

  async getUserAchievements(userId: string) {
    const userAchievementsList = await db
      .select({
        achievementId: userAchievements.achievementId,
        unlockedAt: userAchievements.unlockedAt,
        name: achievements.name,
        description: achievements.description,
        icon: achievements.icon,
        requiredValue: achievements.requiredValue,
        category: achievements.category
      })
      .from(userAchievements)
      .leftJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId));

    return userAchievementsList;
  }

  async unlockAchievement(userId: string, achievementId: string) {
    const [unlocked] = await db
      .insert(userAchievements)
      .values({
        userId,
        achievementId,
        unlockedAt: new Date()
      })
      .onConflictDoNothing()
      .returning();
    return unlocked;
  }

  async getUserTotalPoints(userId: string): Promise<number> {
    const result = await db
      .select({
        total: sql<number>`COALESCE(SUM(${dailyProgress.pointsEarned}), 0)`
      })
      .from(dailyProgress)
      .where(eq(dailyProgress.userId, userId));

    return Number(result[0]?.total || 0);
  }

  async checkAndAwardPointAchievements(userId: string) {
    // Get user's total points
    const totalPoints = await this.getUserTotalPoints(userId);

    // Achievement milestones every 500 points
    const milestones = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000];
    const newAchievements = [];

    const iconTypes = ['diamond', 'emerald', 'gold', 'iron', 'redstone'];

    for (const milestone of milestones) {
      if (totalPoints >= milestone) {
        // Check if achievement already exists
        const existing = await db
          .select()
          .from(achievements)
          .where(
            and(
              eq(achievements.userId, userId),
              eq(achievements.type, 'points'),
              eq(achievements.pointsRequired, milestone)
            )
          )
          .limit(1);

        if (existing.length === 0) {
          // Create new achievement
          const iconType = iconTypes[Math.floor(milestone / 1000) % iconTypes.length];
          const [achievement] = await db
            .insert(achievements)
            .values({
              userId,
              type: 'points',
              name: `${milestone} Points Master`,
              description: `Earned ${milestone} total points!`,
              iconType,
              pointsRequired: milestone,
              isNew: true
            })
            .returning();

          newAchievements.push(achievement);
        }
      }
    }

    return newAchievements;
  }

  async markAchievementAsSeen(achievementId: string, userId: string) {
    await db
      .update(achievements)
      .set({ isNew: false })
      .where(
        and(
          eq(achievements.id, achievementId),
          eq(achievements.userId, userId)
        )
      );
  }

  async upsertDailyProgress(data: NewDailyProgress) {
    const existing = await this.getUserProgress(data.userId, data.date);

    if (existing) {
      const [updated] = await db
        .update(dailyProgress)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(dailyProgress.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(dailyProgress)
        .values(data)
        .returning();
      return created;
    }
  }

  async createGameSession(data: any) {
    const [session] = await db
      .insert(gameSessions)
      .values(data)
      .returning();
    return session;
  }

  async updateUserAge(userId: string, age: number) {
    const [updated] = await db
      .update(users)
      .set({ age, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async updateUserName(userId: string, firstName: string, lastName: string) {
    const [updated] = await db
      .update(users)
      .set({ firstName, lastName, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async getMonthlyProgress(userId: string, month: string) {
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;

    const progress = await db
      .select()
      .from(dailyProgress)
      .where(
        and(
          eq(dailyProgress.userId, userId),
          gte(dailyProgress.date, startDate),
          lte(dailyProgress.date, endDate)
        )
      )
      .orderBy(desc(dailyProgress.date));

    return progress;
  }

  async forceFinalizePastDates() {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const result = await db
      .update(dailyProgress)
      .set({
        isFinal: true,
        finalizedAt: now,
        updatedAt: now
      })
      .where(
        and(
          eq(dailyProgress.isFinal, false),
          lte(dailyProgress.date, yesterdayStr)
        )
      )
      .returning({ date: dailyProgress.date, userId: dailyProgress.userId });

    if (result.length > 0) {
      console.log(`🔒 Force finalized ${result.length} past date records:`, result);
    }
  }

  async getAvailableRewards() {
    const { availableRewards } = await import('@shared/schema');
    return await db
      .select()
      .from(availableRewards)
      .where(eq(availableRewards.isActive, true));
  }

  async getUserRewardOpportunities(userId: string) {
    const { rewardOpportunities, availableRewards } = await import('@shared/schema');
    return await db
      .select({
        id: rewardOpportunities.id,
        pointsMilestone: rewardOpportunities.pointsMilestone,
        isUsed: rewardOpportunities.isUsed,
        selectedRewardId: rewardOpportunities.selectedRewardId,
        rewardName: availableRewards.name,
        rewardIconName: availableRewards.iconName,
        createdAt: rewardOpportunities.createdAt,
        usedAt: rewardOpportunities.usedAt
      })
      .from(rewardOpportunities)
      .leftJoin(availableRewards, eq(rewardOpportunities.selectedRewardId, availableRewards.id))
      .where(eq(rewardOpportunities.userId, userId))
      .orderBy(desc(rewardOpportunities.pointsMilestone));
  }

  async checkAndCreateRewardOpportunities(userId: string) {
    const { rewardOpportunities } = await import('@shared/schema');
    const totalPoints = await this.getUserTotalPoints(userId);
    const milestones = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000];

    for (const milestone of milestones) {
      if (totalPoints >= milestone) {
        await db
          .insert(rewardOpportunities)
          .values({
            userId,
            pointsMilestone: milestone,
            isUsed: false
          })
          .onConflictDoNothing();
      }
    }
  }

  async addToUserInventory(data: { userId: string; rewardId: string; pointsWhenSelected: number }) {
    const [item] = await db
      .insert(userInventory)
      .values(data)
      .returning();
    return item;
  }

  async useRewardOpportunity(userId: string, pointsMilestone: number, rewardId: string) {
    const { rewardOpportunities } = await import('@shared/schema');
    await db
      .update(rewardOpportunities)
      .set({
        isUsed: true,
        selectedRewardId: rewardId,
        usedAt: new Date()
      })
      .where(
        and(
          eq(rewardOpportunities.userId, userId),
          eq(rewardOpportunities.pointsMilestone, pointsMilestone)
        )
      );
  }

  async getUserInventory(userId: string) {
    const { availableRewards } = await import('@shared/schema');
    return await db
      .select({
        id: userInventory.id,
        userId: userInventory.userId,
        rewardId: userInventory.rewardId,
        selectedAt: userInventory.selectedAt,
        pointsWhenSelected: userInventory.pointsWhenSelected,
        name: availableRewards.name,
        description: availableRewards.description,
        itemType: availableRewards.itemType,
        iconName: availableRewards.iconName,
        rarity: availableRewards.rarity
      })
      .from(userInventory)
      .leftJoin(availableRewards, eq(userInventory.rewardId, availableRewards.id))
      .where(eq(userInventory.userId, userId))
      .orderBy(desc(userInventory.selectedAt));
  }
}

export const storage = new Storage();