CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');

CREATE TABLE "Category" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "name" VARCHAR(60) NOT NULL,
  "icon" VARCHAR(80),
  "color" VARCHAR(7),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Category_color_check" CHECK ("color" IS NULL OR "color" ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE TABLE "Goal" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "title" VARCHAR(120) NOT NULL,
  "description" TEXT,
  "targetDate" DATE,
  "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GoalHabit" (
  "goalId" UUID NOT NULL,
  "habitId" UUID NOT NULL,
  "weight" DECIMAL(8,3) NOT NULL DEFAULT 1,
  CONSTRAINT "GoalHabit_pkey" PRIMARY KEY ("goalId", "habitId"),
  CONSTRAINT "GoalHabit_weight_check" CHECK ("weight" > 0)
);

ALTER TABLE "Habit" ADD COLUMN "categoryId" UUID;

CREATE UNIQUE INDEX "Category_userId_name_key" ON "Category"("userId", "name");
CREATE INDEX "Category_userId_createdAt_idx" ON "Category"("userId", "createdAt");
CREATE INDEX "Habit_categoryId_idx" ON "Habit"("categoryId");
CREATE INDEX "Goal_userId_status_idx" ON "Goal"("userId", "status");
CREATE INDEX "GoalHabit_habitId_idx" ON "GoalHabit"("habitId");

ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Habit" ADD CONSTRAINT "Habit_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GoalHabit" ADD CONSTRAINT "GoalHabit_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GoalHabit" ADD CONSTRAINT "GoalHabit_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
