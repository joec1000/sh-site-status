import { useState, useRef, useEffect } from "react";
import type { ComponentStatus } from "@sh/shared";
import { STATUS_LABELS, QUICK_LINKS, ADMIN_QUICK_LINKS } from "@sh/shared";
import type { QuickLink } from "@sh/shared";

interface Props {
  overall: ComponentStatus;
  lastRefreshed: Date | null;
  onRefresh: () => void;
  adminMode: boolean;
}

function SlackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 123 123" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9zm6.5 0c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z" fill="#E01E5A"/>
      <path d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2zm0 6.5c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z" fill="#36C5F0"/>
      <path d="M97.2 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97.2V45.2zm-6.5 0c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.9 5.8 70.7 0 77.8 0s12.9 5.8 12.9 12.9v32.3z" fill="#2EB67D"/>
      <path d="M77.8 97.2c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97.2h12.9zm0-6.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.8z" fill="#ECB22E"/>
    </svg>
  );
}

function LinkIcon({ type }: { type: QuickLink["icon"] }) {
  return type === "slack"
    ? <SlackIcon />
    : <span className="material-icons" style={{ fontSize: "14px", color: "var(--sh-blue)" }}>language</span>;
}

export function StatusHeader({ overall, lastRefreshed, onRefresh, adminMode }: Props) {
  const [linksOpen, setLinksOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const timeStr = lastRefreshed
    ? lastRefreshed.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" })
    : null;

  const isHealthy = overall === "operational";

  useEffect(() => {
    if (!linksOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setLinksOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [linksOpen]);

  return (
    <header className="sh-header">
      <div className="sh-header-top">
        <img src="/supplyhouse-white-logo.svg" alt="SupplyHouse.com" className="sh-logo" />
        <span className="sh-header-title">System Status</span>

        <div className="sh-header-right">
          <div className="quick-links-dropdown" ref={dropdownRef}>
            <button
              className="quick-links-btn"
              onClick={() => setLinksOpen(!linksOpen)}
              title="Quick Links"
            >
              <span className="material-icons" style={{ fontSize: "0.95rem" }}>link</span>
              <span className="quick-links-btn-label">Quick Links</span>
              <span className="material-icons" style={{ fontSize: "0.85rem" }}>
                {linksOpen ? "expand_less" : "expand_more"}
              </span>
            </button>

            {linksOpen && (
              <div className="quick-links-popover">
                <div className="quick-links-popover-header">Quick Links</div>
                {QUICK_LINKS.map((link) => (
                  <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="quick-links-row">
                    <span className="quick-links-row-icon"><LinkIcon type={link.icon} /></span>
                    <span className="quick-links-row-name">{link.name}</span>
                    <span className="material-icons quick-links-row-ext">open_in_new</span>
                  </a>
                ))}

                {adminMode && (
                  <>
                    <div className="quick-links-separator">Admin Links</div>
                    {ADMIN_QUICK_LINKS.map((link) => (
                      <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="quick-links-row">
                        <span className="quick-links-row-icon"><LinkIcon type={link.icon} /></span>
                        <span className="quick-links-row-name">{link.name}</span>
                        <span className="material-icons quick-links-row-ext">open_in_new</span>
                      </a>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
      <div className={`status-banner ${overall}`}>
        <div className="status-banner-content">
          <span className="status-banner-dot" />
          <span className="status-banner-label">{STATUS_LABELS[overall] ?? "Unknown"}</span>
          <span className="status-banner-msg">
            {isHealthy
              ? "All systems are running normally"
              : "Some systems are experiencing issues"}
          </span>
        </div>
        {timeStr && (
          <div className="sh-header-refresh">
            <span>Updated: {timeStr}</span>
            <button className="status-refresh-btn" onClick={onRefresh} title="Refresh now">
              <span className="material-icons" style={{ fontSize: "0.95rem" }}>refresh</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
