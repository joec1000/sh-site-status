import { config } from "../config.js";
import { listIncidents } from "./incidents.js";
import type { Incident } from "@sh/shared";
import { SEVERITY_LABELS } from "@sh/shared";

const CHECK_INTERVAL_MS = 60_000; // check every minute
const REMINDER_BEFORE_MS = 5 * 60_000; // alert 5 min before due
const alreadyNotified = new Set<string>(); // track notified incident+time combos

function isEnabled() {
  return !!(config.slackBotToken && config.slackChannel);
}

export function startSlackNotifier() {
  if (!isEnabled()) {
    console.log("SLACK_BOT_TOKEN or SLACK_CHANNEL not set — Slack reminders disabled");
    return;
  }
  console.log(`Slack update reminders enabled (channel: ${config.slackChannel})`);
  setInterval(checkAndNotify, CHECK_INTERVAL_MS);
}

// --- Incident lifecycle notifications ---

export async function notifyIncidentCreated(incident: Incident) {
  if (!isEnabled()) return;
  const severity = SEVERITY_LABELS[incident.severity] || incident.severity;
  await sendSlackMessage([
    `:red_circle: *New Incident Created*`,
    "",
    `*Title:* ${incident.title}`,
    `*Severity:* ${severity}`,
    `*Owner:* ${incident.owner || "Unassigned"}`,
    `*Impact:* ${incident.impact || "—"}`,
    incident.nextUpdateTime ? `*Next Update:* ${incident.nextUpdateTime}` : "",
  ].filter(Boolean).join("\n"));
}

export async function notifyIncidentResolved(incident: Incident) {
  if (!isEnabled()) return;
  await sendSlackMessage([
    `:large_green_circle: *Incident Resolved*`,
    "",
    `*Title:* ${incident.title}`,
    `*Resolved at:* ${incident.resolvedAt ?? new Date().toISOString()}`,
  ].join("\n"));
}

export async function notifyIncidentDeleted(title: string) {
  if (!isEnabled()) return;
  await sendSlackMessage(`:wastebasket: *Incident Deleted:* ${title}`);
}

// --- Scheduled update reminders ---

async function checkAndNotify() {
  try {
    const incidents = await listIncidents();
    const now = Date.now();

    for (const incident of incidents) {
      if (incident.status === "resolved") continue;
      if (!incident.nextUpdateTime) continue;

      const dueAt = new Date(incident.nextUpdateTime).getTime();
      if (isNaN(dueAt)) continue;

      const key = `${incident.id}:${incident.nextUpdateTime}`;
      if (alreadyNotified.has(key)) continue;

      const timeUntilDue = dueAt - now;

      if (timeUntilDue <= REMINDER_BEFORE_MS) {
        const overdue = timeUntilDue <= 0;
        const severity = SEVERITY_LABELS[incident.severity] || incident.severity;
        const urgency = overdue ? ":rotating_light: *OVERDUE*" : ":warning: *Due soon*";
        const timeText = overdue
          ? `was due ${Math.round(-timeUntilDue / 60_000)} min ago`
          : `due in ${Math.round(timeUntilDue / 60_000)} min`;

        await sendSlackMessage([
          `${urgency} — Status page update needed`,
          "",
          `*Incident:* ${incident.title}`,
          `*Severity:* ${severity}`,
          `*Owner:* ${incident.owner || "Unassigned"}`,
          `*Next update ${timeText}* (${incident.nextUpdateTime})`,
        ].join("\n"));

        alreadyNotified.add(key);
      }
    }
  } catch (err) {
    console.error("Slack notifier error:", err);
  }
}

async function sendSlackMessage(text: string) {
  try {
    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.slackBotToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: config.slackChannel,
        text,
      }),
    });

    const data = await res.json() as { ok: boolean; error?: string };
    if (!data.ok) {
      console.error(`Slack API error: ${data.error}`);
    }
  } catch (err) {
    console.error("Slack send error:", err);
  }
}
