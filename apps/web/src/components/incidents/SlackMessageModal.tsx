import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface Props {
  adminKey: string;
  initialMessage: string;
  statusDot?: "red" | "yellow" | "green";
  onClose: () => void;
}

const DOT_EMOJI: Record<string, string> = {
  red: ":red_circle:",
  yellow: ":large_yellow_circle:",
  green: ":large_green_circle:",
};

export function SlackMessageModal({ adminKey, initialMessage, statusDot, onClose }: Props) {
  const [message, setMessage] = useState(initialMessage);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      const prefix = statusDot ? `${DOT_EMOJI[statusDot]} ` : "";
      const res = await fetch(`${API_BASE}/api/slack/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ text: prefix + message }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to send");
      setSent(true);
      setTimeout(onClose, 1200);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to post to Slack");
    } finally {
      setSending(false);
    }
  };

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
          rows={8}
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
              <button className="btn btn-secondary" onClick={onClose}>Skip</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
