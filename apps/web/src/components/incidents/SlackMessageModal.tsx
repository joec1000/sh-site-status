import { useState } from "react";

const SLACK_WEBHOOK_URL = import.meta.env.VITE_SLACK_WEBHOOK_URL || "";

interface Props {
  initialMessage: string;
  statusDot?: "red" | "yellow" | "green";
  onClose: () => void;
}

const DOT_EMOJI: Record<string, string> = {
  red: ":red_circle:",
  yellow: ":large_yellow_circle:",
  green: ":large_green_circle:",
};

export function SlackMessageModal({ initialMessage, statusDot, onClose }: Props) {
  const [message, setMessage] = useState(initialMessage);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || !SLACK_WEBHOOK_URL) return;
    setSending(true);
    try {
      const prefix = statusDot ? `${DOT_EMOJI[statusDot]} ` : "";
      await fetch(SLACK_WEBHOOK_URL, {
        method: "POST",
        body: JSON.stringify({ text: prefix + message }),
      });
      setSent(true);
      setTimeout(onClose, 1200);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to post to Slack");
    } finally {
      setSending(false);
    }
  };

  if (!SLACK_WEBHOOK_URL) {
    return (
      <div className="admin-login-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="slack-modal">
          <h3>Slack not configured</h3>
          <p className="slack-modal-hint">Set <code>VITE_SLACK_WEBHOOK_URL</code> in your .env to enable posting to Slack.</p>
          <div className="admin-login-actions">
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-login-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="slack-modal">
        <div className="slack-modal-header">
          <h3>Post to Slack</h3>
          {statusDot && <span className={`slack-dot slack-dot--${statusDot}`} />}
        </div>
        <p className="slack-modal-hint">Preview and edit before sending to the incident channel.</p>
        <textarea
          className="slack-modal-textarea"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={12}
          autoFocus
        />
        <div className="admin-login-actions">
          {sent ? (
            <span style={{ color: "var(--color-green)", fontWeight: 600, fontSize: "0.85rem" }}>Sent to Slack!</span>
          ) : (
            <>
              <button className="btn btn-primary" onClick={handleSend} disabled={sending || !message.trim()}>
                {sending ? "Sending..." : "Send to Slack"}
              </button>
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
