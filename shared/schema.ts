import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, date, index, jsonb, boolean } from "drizzle-orm/pg-core";
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

// User storage table - required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Daily progress tracking
export const dailyProgress = pgTable("daily_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  date: date("date").notNull(),
  pointsEarned: integer("points_earned").default(0),
  questionsAnswered: integer("questions_answered").default(0),
  correctAnswers: integer("correct_answers").default(0),
  level: integer("level").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
});

// Schema types
export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertDailyProgressSchema = createInsertSchema(dailyProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGameSessionSchema = createInsertSchema(gameSessions).omit({
  id: true,
  createdAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  unlockedAt: true,
});

export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type DailyProgress = typeof dailyProgress.$inferSelect;
export type InsertDailyProgress = z.infer<typeof insertDailyProgressSchema>;
export type GameSession = typeof gameSessions.$inferSelect;
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
