BEGIN;
ALTER TABLE "HabitSchedule" DROP CONSTRAINT "HabitSchedule_shape_check";
CREATE TYPE "HabitScheduleType_new" AS ENUM ('EVERY_DAY', 'WEEKDAYS', 'TIMES_PER_WEEK', 'INTERVAL');
ALTER TABLE "HabitSchedule" ALTER COLUMN "type" TYPE "HabitScheduleType_new" USING (
  CASE
    WHEN "type"::text = 'DAILY' THEN 'EVERY_DAY'
    WHEN "type"::text = 'WEEKLY' AND cardinality("weekdays") > 0 THEN 'WEEKDAYS'
    WHEN "type"::text = 'WEEKLY' THEN 'TIMES_PER_WEEK'
    ELSE "type"::text
  END
)::"HabitScheduleType_new";
ALTER TYPE "HabitScheduleType" RENAME TO "HabitScheduleType_old";
ALTER TYPE "HabitScheduleType_new" RENAME TO "HabitScheduleType";
DROP TYPE "public"."HabitScheduleType_old";
ALTER TABLE "HabitSchedule" ADD CONSTRAINT "HabitSchedule_shape_check" CHECK (
  ("type" = 'EVERY_DAY' AND cardinality("weekdays") = 0 AND "timesPerWeek" IS NULL AND "intervalDays" IS NULL)
  OR
  ("type" = 'WEEKDAYS' AND cardinality("weekdays") > 0 AND "timesPerWeek" IS NULL AND "intervalDays" IS NULL)
  OR
  ("type" = 'TIMES_PER_WEEK' AND cardinality("weekdays") = 0 AND "timesPerWeek" BETWEEN 1 AND 7 AND "intervalDays" IS NULL)
  OR
  ("type" = 'INTERVAL' AND cardinality("weekdays") = 0 AND "timesPerWeek" IS NULL AND "intervalDays" BETWEEN 1 AND 365)
);
COMMIT;
