# DailyBoost user guide

## Categories

Open **Settings → Categories** to create a personal category such as Health, Study, Career, Mind, Finance, or Personal. Choose a category while creating or editing a habit. Removing a category keeps every habit and only clears its category assignment.

## Goals

Open **Goals** and choose **New goal**. Add a title, optional description and target date, then select the habits that support the goal. Each selected habit has a positive weight; equal weights give all habits equal influence.

The displayed goal percentage is not manually entered. It is the weighted average of the linked habits' completion rates over each habit's latest 30 scheduled days. Marking a goal completed changes its lifecycle status but does not manufacture 100% progress.

## Progress

The **Progress** page shows:

- current week and previous week completion;
- the difference in percentage points;
- completed, partial, skipped, and missed status totals;
- a 90-day completion heatmap and weekday rates;
- deterministic weekly review statements;
- 7-, 30-, and 90-day analytics and streaks for each habit.

Heatmap color reflects the percentage of expected habits completed that day. A day with one completed habit out of two has the same 50% intensity as a day with five out of ten.

Skip is neutral: it is removed from that day's expected denominator and neither grows nor breaks the habit streak. Missed scheduled days remain expected and break a habit streak.

Numeric habit detail pages also show average value, average target achievement, and best day. These use scheduled dates only and are calculated by the server.

## Reminders

Open a habit and add one or more reminder times. Each time uses your current IANA timezone and can be disabled or deleted independently. DailyBoost never asks for notification permission on first visit: press **Разрешить уведомления** explicitly when you want browser notifications.

This version checks reminders while DailyBoost is installed/open. The operating system may throttle a background tab, so it does not promise server push delivery while every application window is closed.

## Install and updates

In a supported browser, use the DailyBoost install banner or the browser's **Install app / Add to Home Screen** action. Android Chromium can install directly; iOS Safari uses Share → Add to Home Screen. The installed application opens in standalone mode.

When a new service worker is ready, DailyBoost shows **Доступна новая версия**. Press **Обновить** to activate it. When the network is unavailable, navigation opens a privacy-safe offline shell instead of a broken server page.

## Offline entry changes

Today's entry controls remain usable after the connection drops. The header/sidebar reports:

- **Saving** while an online request is pending;
- **Saved offline** when a change is safely queued in this browser;
- **Syncing** during reconnect replay;
- **Synced** after server confirmation;
- **Sync failed** when the command remains queued and needs retry.

Do not clear site data or use another device as proof that a **Saved offline** command reached the server. PostgreSQL becomes authoritative only after **Synced**. Habit editing, goals, categories, reminders, and analytics still require a connection.
