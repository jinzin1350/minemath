import { db } from "./db";
import { 
  users, 
  dailyProgress, 
  userInventory, 
  achievements,
  userAchievements,
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
    pointsEarned: number,
    questionsAnswered: number,
    correctAnswers: number,
    level: number,
    timeZone: string = 'UTC'
  ) {
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
}

export const storage = new Storage();