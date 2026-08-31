# Personal analytics

DailyBoost analytics are deterministic. They use stored habit schedules and entries; no generated, random, or AI-authored values are involved.

## Completion rules

A scheduled habit contributes one expected item unless its entry is `SKIPPED`. Only `COMPLETED` contributes to the numerator. `PARTIAL`, `PENDING`, and `MISSED` remain expected but not completed. A period rate is:

`round(completed scheduled habits / expected scheduled habits × 100)`

When there are no expected items, the rate is `0`. Week boundaries are ISO Monday–Sunday in the user's stable IANA calendar date. The current week stops at today; the previous week is the complete preceding ISO week. Change is expressed in percentage points, not percent growth.

## Heatmap and weekdays

Each heatmap cell uses that day's completion rate, never the raw number of completion events. Intensity bands are `0%`, `1–25%`, `26–50%`, `51–75%`, `76–99%`, and `100%`.

Weekday rates aggregate completed and expected items from the last 90 user-calendar days, then apply the same completion formula.

## Habit analytics

Current and best streaks use the canonical habit-domain rules. Completion rates use the last 7, 30, and 90 calendar days and only scheduled dates inside each range.

For `COUNT`, `DURATION`, and `QUANTITY`, value statistics use expected scheduled dates from the last 90 days. Missing values count as zero and skipped dates are excluded. Average target achievement caps each day's contribution at 100%; best-day achievement remains uncapped so overachievement is visible.

## Goal progress

For every linked habit, DailyBoost selects its latest 30 scheduled dates ending today and calculates its completion rate. Goal progress is the weighted mean:

`round(sum(habit completion rate × weight) / sum(weights))`

All links default to weight `1`, which makes this the ordinary arithmetic mean. Weights must be finite and greater than zero. A goal with no usable linked habits has `0%` progress.

## Weekly review

The weekly review is a presentation of calculated fields:

- overall current-week rate and difference from the previous week;
- up to two highest current-week habit rates;
- the lowest habit only when it is below the overall rate;
- that habit's lowest weekday rate over 90 days;
- the greatest current habit streak.

Stable title/weekday sorting resolves ties, so the same dataset always produces the same review. Empty evidence produces no statement.

## Application boundary and performance

`GET /api/analytics/overview` loads the user's habits and goals in two aggregate repository calls and returns all progress-page data. `GET /api/analytics/habits/:id` returns one owned habit's analytics. Vue components render these DTOs and do not reproduce domain calculations.

Normal habit list/detail responses bound included entries to the last 120 user-calendar days. The dedicated history endpoint supports `from`, `to`, descending date cursor, and a maximum page size of 500. Exact all-time best streak currently requires full owned entry history inside the analytics aggregate; this is one bounded scaling concern to measure before introducing snapshots/materialized aggregates.

There is no per-habit HTTP N+1: overview habits and their schedules/entries are loaded together, goals and links are loaded together, and all derived metrics are calculated in one application-service pass. Query invalidation is limited to habits and analytics after entry changes and to the directly affected organization keys for category/goal mutations.
