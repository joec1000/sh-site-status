import { config } from "../config.js";
import { listIncidents } from "./incidents.js";
import { SEVERITY_LABELS } from "@sh/shared";

const CHECK_INTERVAL_MS = 60_000; // check every minute
const REMINDER_BEFORE_MS = 5 * 60_000; // alert 5 min before due
const alreadyNotified = new Set<string>();

export function startSlackNotifier() {
  if (!config.slackReminderWebhookUrl) {
    console.log("SLACK_REMINDER_WEBHOOK_URL not set — update reminders disabled");
    return;
  }
  console.log("Slack update reminders enabled");
  setInterval(checkAndNotify, CHECK_INTERVAL_MS);
}

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

        await sendToWebhook(config.slackReminderWebhookUrl, [
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

async function sendToWebhook(webhookUrl: string, text: string) {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      console.error(`Slack webhook failed: ${res.status} ${await res.text()}`);
    }
  } catch (err) {
    console.error("Slack send error:", err);
  }
}
