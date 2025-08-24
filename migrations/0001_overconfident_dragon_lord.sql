CREATE TABLE "gemini_usage" (
	"user_id" text PRIMARY KEY NOT NULL,
	"request_count" integer DEFAULT 0,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
