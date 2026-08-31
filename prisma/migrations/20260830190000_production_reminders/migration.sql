DROP INDEX IF EXISTS "HabitEntry_habitId_date_idx";

CREATE TABLE "HabitReminder" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "habitId" UUID NOT NULL,
  "time" VARCHAR(5) NOT NULL,
  "timezone" VARCHAR(100) NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HabitReminder_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HabitReminder_time_check" CHECK ("time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  CONSTRAINT "HabitReminder_timezone_check" CHECK (length("timezone") BETWEEN 1 AND 100)
);

CREATE UNIQUE INDEX "HabitReminder_habitId_time_timezone_key" ON "HabitReminder"("habitId", "time", "timezone");
CREATE INDEX "HabitReminder_habitId_enabled_idx" ON "HabitReminder"("habitId", "enabled");

ALTER TABLE "HabitReminder" ADD CONSTRAINT "HabitReminder_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
