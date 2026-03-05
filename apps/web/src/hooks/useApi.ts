import { useState, useEffect, useCallback } from "react";
import type { CurrentStatus, Incident, ApiResponse } from "@sh/shared";

const API_BASE = import.meta.env.VITE_API_URL || "";

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...opts?.headers,
    },
  });
  const json: ApiResponse<T> = await res.json();
  if (!json.ok) throw new Error(json.error || "API error");
  return json.data as T;
}

function adminHeaders(adminKey: string): Record<string, string> {
  return { "x-admin-key": adminKey };
}

const AUTO_REFRESH_MS = 60_000;

export function useStatus() {
  const [status, setStatus] = useState<CurrentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch<CurrentStatus>("/api/status");
      setStatus(data);
      setLastRefreshed(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return { status, loading, error, refresh, lastRefreshed };
}

export function useIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch<Incident[]>("/api/incidents");
      setIncidents(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { incidents, loading, refresh };
}

export const adminApi = {
  createIncident: (adminKey: string, body: Record<string, unknown>) =>
    apiFetch("/api/incidents", {
      method: "POST",
      headers: adminHeaders(adminKey),
      body: JSON.stringify(body),
    }),

  postUpdate: (adminKey: string, incidentId: string, body: Record<string, unknown>) =>
    apiFetch(`/api/incidents/${incidentId}/updates`, {
      method: "POST",
      headers: adminHeaders(adminKey),
      body: JSON.stringify(body),
    }),

  updateComponent: (adminKey: string, componentId: string, status: string) =>
    apiFetch(`/api/components/${componentId}`, {
      method: "PATCH",
      headers: adminHeaders(adminKey),
      body: JSON.stringify({ status }),
    }),

  updateIncident: (adminKey: string, incidentId: string, body: Record<string, unknown>) =>
    apiFetch(`/api/incidents/${incidentId}`, {
      method: "PATCH",
      headers: adminHeaders(adminKey),
      body: JSON.stringify(body),
    }),

  deleteIncident: (adminKey: string, incidentId: string) =>
    apiFetch(`/api/incidents/${incidentId}`, {
      method: "DELETE",
      headers: adminHeaders(adminKey),
    }),

  editUpdate: (adminKey: string, incidentId: string, updateId: string, message: string, createdAt?: string, status?: string) =>
    apiFetch(`/api/incidents/${incidentId}/updates/${updateId}`, {
      method: "PATCH",
      headers: adminHeaders(adminKey),
      body: JSON.stringify({ message, ...(createdAt ? { createdAt } : {}), ...(status ? { status } : {}) }),
    }),
};
