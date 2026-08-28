-- CreateEnum
CREATE TYPE "TrackingType" AS ENUM ('BOOLEAN', 'COUNT', 'DURATION', 'QUANTITY');

-- CreateEnum
CREATE TYPE "HabitScheduleType" AS ENUM ('DAILY', 'WEEKLY', 'INTERVAL');

-- CreateEnum
CREATE TYPE "HabitEntryStatus" AS ENUM ('PENDING', 'PARTIAL', 'COMPLETED', 'SKIPPED', 'MISSED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "displayName" VARCHAR(80),
    "timezone" VARCHAR(100) NOT NULL DEFAULT 'UTC',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "User_email_normalized_check" CHECK ("email" = lower("email")),
    CONSTRAINT "User_timezone_not_blank_check" CHECK (length(trim("timezone")) > 0)
);

-- CreateTable
CREATE TABLE "Habit" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" VARCHAR(80) NOT NULL,
    "description" TEXT,
    "trackingType" "TrackingType" NOT NULL DEFAULT 'BOOLEAN',
    "targetValue" DECIMAL(12,3),
    "unit" VARCHAR(20),
    "color" VARCHAR(7),
    "icon" VARCHAR(80),
    "legacySourceId" VARCHAR(128),
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Habit_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Habit_tracking_target_check" CHECK (
        ("trackingType" = 'BOOLEAN' AND "targetValue" IS NULL)
        OR
        ("trackingType" <> 'BOOLEAN' AND "targetValue" > 0 AND length(trim("unit")) > 0)
    ),
    CONSTRAINT "Habit_color_check" CHECK ("color" IS NULL OR "color" ~ '^#[0-9A-Fa-f]{6}$')
);

-- CreateTable
CREATE TABLE "HabitSchedule" (
    "id" UUID NOT NULL,
    "habitId" UUID NOT NULL,
    "type" "HabitScheduleType" NOT NULL,
    "weekdays" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    "timesPerWeek" INTEGER,
    "intervalDays" INTEGER,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "HabitSchedule_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "HabitSchedule_date_range_check" CHECK ("endDate" IS NULL OR "endDate" >= "startDate"),
    CONSTRAINT "HabitSchedule_weekdays_check" CHECK (
        "weekdays" <@ ARRAY[0, 1, 2, 3, 4, 5, 6]
    ),
    CONSTRAINT "HabitSchedule_shape_check" CHECK (
        ("type" = 'DAILY' AND cardinality("weekdays") = 0 AND "timesPerWeek" IS NULL AND "intervalDays" IS NULL)
        OR
        ("type" = 'WEEKLY' AND "intervalDays" IS NULL AND (
            (cardinality("weekdays") > 0 AND "timesPerWeek" IS NULL)
            OR (cardinality("weekdays") = 0 AND "timesPerWeek" BETWEEN 1 AND 7)
        ))
        OR
        ("type" = 'INTERVAL' AND cardinality("weekdays") = 0 AND "timesPerWeek" IS NULL AND "intervalDays" BETWEEN 1 AND 365)
    )
);

-- CreateTable
CREATE TABLE "HabitEntry" (
    "id" UUID NOT NULL,
    "habitId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "value" DECIMAL(12,3),
    "status" "HabitEntryStatus" NOT NULL,
    "note" VARCHAR(500),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "HabitEntry_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "HabitEntry_value_check" CHECK ("value" IS NULL OR "value" >= 0),
    CONSTRAINT "HabitEntry_terminal_value_check" CHECK (
        "status" NOT IN ('SKIPPED', 'MISSED') OR "value" IS NULL
    )
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Habit_userId_archivedAt_idx" ON "Habit"("userId", "archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Habit_userId_legacySourceId_key" ON "Habit"("userId", "legacySourceId");

-- CreateIndex
CREATE UNIQUE INDEX "HabitSchedule_habitId_key" ON "HabitSchedule"("habitId");

-- CreateIndex
CREATE INDEX "HabitEntry_habitId_date_idx" ON "HabitEntry"("habitId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "HabitEntry_habitId_date_key" ON "HabitEntry"("habitId", "date");

-- AddForeignKey
ALTER TABLE "Habit" ADD CONSTRAINT "Habit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitSchedule" ADD CONSTRAINT "HabitSchedule_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitEntry" ADD CONSTRAINT "HabitEntry_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
