import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, date, index, jsonb, boolean, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password"), // Hashed password for email/password auth
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  age: integer("age"), // Age for difficulty adjustment based on Canadian education system
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Daily progress tracking with temporary/final scoring system
export const dailyProgress = pgTable("daily_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  date: date("date").notNull(),
  pointsEarned: integer("points_earned").default(0),
  questionsAnswered: integer("questions_answered").default(0),
  correctAnswers: integer("correct_answers").default(0),
  level: integer("level").default(1),
  // New fields for temporary/final scoring system
  isFinal: boolean("is_final").default(false).notNull(), // false = temporary, true = locked forever
  finalizeAt: timestamp("finalize_at").notNull(), // UTC timestamp when score should be finalized (local midnight)
  finalizedAt: timestamp("finalized_at"), // When it was actually finalized (nullable)
  userTimeZone: varchar("user_time_zone").notNull(), // IANA timezone (e.g., "Asia/Tehran", "America/New_York")
  lastUpdateAt: timestamp("last_update_at").defaultNow(), // For audit and UI display
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("unique_daily_progress").on(table.userId, table.date)
]);

// Game sessions
export const gameSessions = pgTable("game_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  pointsEarned: integer("points_earned").default(0),
  finalLevel: integer("final_level").default(1),
  questionsAnswered: integer("questions_answered").default(0),
  correctAnswers: integer("correct_answers").default(0),
  gameState: varchar("game_state").default("completed"), // completed, gameOver
  duration: integer("duration"), // in seconds
  createdAt: timestamp("created_at").defaultNow(),
});

// Achievement badges - Minecraft-style awards every 500 points
export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: varchar("type").notNull(), // 'points', 'streak', 'level', 'accuracy'
  name: varchar("name").notNull(),
  description: varchar("description").notNull(),
  iconType: varchar("icon_type").notNull(), // 'diamond', 'emerald', 'gold', 'iron', 'redstone'
  pointsRequired: integer("points_required").notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  isNew: boolean("is_new").default(true),
}, (table) => [
  unique("unique_achievement_per_user").on(table.userId, table.type, table.pointsRequired)
]);

// Available rewards - Minecraft items that can be selected every 500 points
export const availableRewards = pgTable("available_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: varchar("description").notNull(),
  itemType: varchar("item_type").notNull(), // 'block', 'tool', 'food', 'potion', 'special'
  iconName: varchar("icon_name").notNull(), // 'diamond_sword', 'golden_apple', 'tnt', etc.
  rarity: varchar("rarity").notNull().default('common'), // 'common', 'rare', 'epic', 'legendary'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User inventory - Selected rewards by users
export const userInventory = pgTable("user_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  rewardId: varchar("reward_id").references(() => availableRewards.id).notNull(),
  selectedAt: timestamp("selected_at").defaultNow(),
  pointsWhenSelected: integer("points_when_selected").notNull(),
});

// Reward opportunities - Track when users can select rewards (every 500 points)
export const rewardOpportunities = pgTable("reward_opportunities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  pointsMilestone: integer("points_milestone").notNull(), // 500, 1000, 1500, etc.
  isUsed: boolean("is_used").default(false),
  selectedRewardId: varchar("selected_reward_id").references(() => availableRewards.id),
  createdAt: timestamp("created_at").defaultNow(),
  usedAt: timestamp("used_at"),
}, (table) => [
  unique("unique_milestone_per_user").on(table.userId, table.pointsMilestone)
]);

// Schema types
export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  age: true,
});

// Insert schemas for daily progress
export const insertDailyProgressSchema = createInsertSchema(dailyProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastUpdateAt: true,
});

// Schema for temporary progress updates (until midnight)
export const insertTemporaryProgressSchema = createInsertSchema(dailyProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastUpdateAt: true,
  isFinal: true, // Server controls this
  finalizeAt: true, // Server computes this
  finalizedAt: true, // Server sets this
  userTimeZone: true, // Server calculates this from optional timeZone
  userId: true, // Server gets this from authentication
  date: true, // Server calculates this
}).extend({
  timeZone: z.string().optional(), // Client can send timezone, server uses for finalizeAt calculation
});

export const updateDailyProgressSchema = insertDailyProgressSchema.partial().extend({
  pointsEarned: z.number().min(0),
});

export const insertGameSessionSchema = createInsertSchema(gameSessions).omit({
  id: true,
  createdAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  unlockedAt: true,
});

export const insertAvailableRewardSchema = createInsertSchema(availableRewards).omit({
  id: true,
  createdAt: true,
});

export const insertUserInventorySchema = createInsertSchema(userInventory).omit({
  id: true,
  selectedAt: true,
});

export const insertRewardOpportunitySchema = createInsertSchema(rewardOpportunities).omit({
  id: true,
  createdAt: true,
  usedAt: true,
});

// ========== DICTATION MODULE SCHEMAS ==========
// Words table for English dictation
export const dictationWords = pgTable("dictation_words", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  word: varchar("word", { length: 50 }).notNull(),
  level: integer("level").notNull(), // 1-5
  category: varchar("category", { length: 50 }).notNull(),
  imageEmoji: varchar("image_emoji", { length: 10 }),
  pronunciation: varchar("pronunciation", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_dictation_words_level").on(table.level),
  index("idx_dictation_words_category").on(table.category),
]);

// User progress tracking for dictation
export const dictationUserProgress = pgTable("dictation_user_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  totalScore: integer("total_score").default(0),
  accuracy: integer("accuracy").default(0), // Changed from decimal to integer (0-100)
  currentStreak: integer("current_streak").default(0),
  maxStreak: integer("max_streak").default(0),
  totalWordsPracticed: integer("total_words_practiced").default(0),
  correctWords: integer("correct_words").default(0),
  lastPlayed: timestamp("last_played"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Game history for dictation
export const dictationGameHistory = pgTable("dictation_game_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  gameMode: varchar("game_mode", { length: 20 }).notNull(), // 'typing' or 'multiple-choice'
  score: integer("score").notNull(),
  accuracy: integer("accuracy"), // Changed from decimal to integer (0-100)
  levelReached: integer("level_reached"),
  wordsCorrect: integer("words_correct"),
  wordsTotal: integer("words_total"),
  playedAt: timestamp("played_at").defaultNow(),
}, (table) => [
  index("idx_dictation_game_history_user_id").on(table.userId),
  index("idx_dictation_game_history_played_at").on(table.playedAt),
]);

// Zod schemas for dictation
export const insertDictationWordSchema = createInsertSchema(dictationWords).omit({
  id: true,
  createdAt: true,
});

export const insertDictationUserProgressSchema = createInsertSchema(dictationUserProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDictationGameHistorySchema = createInsertSchema(dictationGameHistory).omit({
  id: true,
  playedAt: true,
});

// TypeScript types for dictation
export type DictationWord = typeof dictationWords.$inferSelect;
export type InsertDictationWord = z.infer<typeof insertDictationWordSchema>;
export type DictationUserProgress = typeof dictationUserProgress.$inferSelect;
export type InsertDictationUserProgress = z.infer<typeof insertDictationUserProgressSchema>;
export type DictationGameHistory = typeof dictationGameHistory.$inferSelect;
export type InsertDictationGameHistory = z.infer<typeof insertDictationGameHistorySchema>;

export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type DailyProgress = typeof dailyProgress.$inferSelect;
export type InsertDailyProgress = z.infer<typeof insertDailyProgressSchema>;
export type InsertTemporaryProgress = z.infer<typeof insertTemporaryProgressSchema>;
export type GameSession = typeof gameSessions.$inferSelect;
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type AvailableReward = typeof availableRewards.$inferSelect;
export type InsertAvailableReward = z.infer<typeof insertAvailableRewardSchema>;
export type UserInventory = typeof userInventory.$inferSelect;
export type InsertUserInventory = z.infer<typeof insertUserInventorySchema>;
export type RewardOpportunity = typeof rewardOpportunities.$inferSelect;
export type InsertRewardOpportunity = z.infer<typeof insertRewardOpportunitySchema>;

// ========== ROBO TRAINER MODULE SCHEMAS ==========
// Robot progress tracking
export const robotProgress = pgTable("robot_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  robotName: varchar("robot_name").notNull(),
  robotColor: varchar("robot_color").notNull(),
  level: integer("level").default(1),
  xp: integer("xp").default(0),
  memory: jsonb("memory").default([]),
  completedMissionIds: jsonb("completed_mission_ids").default([]),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas for robot progress
export const insertRobotProgressSchema = createInsertSchema(robotProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateRobotProgressSchema = insertRobotProgressSchema.partial();

// TypeScript types for robot progress
export type RobotProgress = typeof robotProgress.$inferSelect;
export type InsertRobotProgress = z.infer<typeof insertRobotProgressSchema>;
export type UpdateRobotProgress = z.infer<typeof updateRobotProgressSchema>;
