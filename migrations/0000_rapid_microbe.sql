CREATE TABLE "achievements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" varchar NOT NULL,
	"icon_type" varchar NOT NULL,
	"points_required" integer NOT NULL,
	"unlocked_at" timestamp DEFAULT now(),
	"is_new" boolean DEFAULT true,
	CONSTRAINT "unique_achievement_per_user" UNIQUE("user_id","type","points_required")
);
--> statement-breakpoint
CREATE TABLE "available_rewards" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" varchar NOT NULL,
	"item_type" varchar NOT NULL,
	"icon_name" varchar NOT NULL,
	"rarity" varchar DEFAULT 'common' NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_progress" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"date" date NOT NULL,
	"points_earned" integer DEFAULT 0,
	"questions_answered" integer DEFAULT 0,
	"correct_answers" integer DEFAULT 0,
	"level" integer DEFAULT 1,
	"is_final" boolean DEFAULT false NOT NULL,
	"finalize_at" timestamp NOT NULL,
	"finalized_at" timestamp,
	"user_time_zone" varchar NOT NULL,
	"last_update_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_daily_progress" UNIQUE("user_id","date")
);
--> statement-breakpoint
CREATE TABLE "game_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"points_earned" integer DEFAULT 0,
	"final_level" integer DEFAULT 1,
	"questions_answered" integer DEFAULT 0,
	"correct_answers" integer DEFAULT 0,
	"game_state" varchar DEFAULT 'completed',
	"duration" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reward_opportunities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"points_milestone" integer NOT NULL,
	"is_used" boolean DEFAULT false,
	"selected_reward_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"used_at" timestamp,
	CONSTRAINT "unique_milestone_per_user" UNIQUE("user_id","points_milestone")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_inventory" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"reward_id" varchar NOT NULL,
	"selected_at" timestamp DEFAULT now(),
	"points_when_selected" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"age" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_progress" ADD CONSTRAINT "daily_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_opportunities" ADD CONSTRAINT "reward_opportunities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_opportunities" ADD CONSTRAINT "reward_opportunities_selected_reward_id_available_rewards_id_fk" FOREIGN KEY ("selected_reward_id") REFERENCES "public"."available_rewards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_inventory" ADD CONSTRAINT "user_inventory_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_inventory" ADD CONSTRAINT "user_inventory_reward_id_available_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."available_rewards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");