import type {
  CollectionName,
  Company,
  ExportBundle,
  Hypothesis,
  JournalEntry,
  Mission,
  MissionSource,
  Observation,
  Source,
} from "@h3-trust/schema";

const BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => request<{ ok: boolean }>("/health"),
  listMissions: () => request<Mission[]>("/missions"),
  getMission: (id: string) => request<Mission>(`/missions/${id}`),
  createMission: (mission: Mission) =>
    request<Mission>("/missions", { method: "POST", body: JSON.stringify(mission) }),
  updateMission: (mission: Mission) =>
    request<Mission>(`/missions/${mission.id}`, {
      method: "PUT",
      body: JSON.stringify(mission),
    }),
  deleteMission: (id: string) =>
    request<{ ok: boolean }>(`/missions/${id}`, { method: "DELETE" }),
  listJournal: (missionId: string) =>
    request<JournalEntry[]>(`/missions/${missionId}/journal`),
  listObservations: (missionId: string) =>
    request<Observation[]>(`/missions/${missionId}/observations`),
  listHypotheses: (missionId: string) =>
    request<Hypothesis[]>(`/missions/${missionId}/hypotheses`),
  listSources: (missionId: string) =>
    request<Source[]>(`/missions/${missionId}/sources`),
  listCompanies: (missionId: string) =>
    request<Company[]>(`/missions/${missionId}/companies`),
  listLinkableSources: (excludeMissionId: string, q = "") => {
    const params = new URLSearchParams({
      excludeMission: excludeMissionId,
      ...(q ? { q } : {}),
    });
    return request<Source[]>(`/sources/linkable?${params}`);
  },
  linkSource: (missionId: string, sourceId: string) =>
    request<{ source: Source; link: MissionSource }>(
      `/missions/${missionId}/sources/link`,
      {
        method: "POST",
        body: JSON.stringify({ sourceId, producer: "Human" }),
      },
    ),
  createInMission: <T>(
    missionId: string,
    collection: Exclude<CollectionName, "missions" | "patterns">,
    entity: T,
  ) =>
    request<T>(`/missions/${missionId}/${collection}`, {
      method: "POST",
      body: JSON.stringify(entity),
    }),
  updateEntity: <T extends { id: string }>(
    collection: Exclude<CollectionName, "missions" | "patterns">,
    entity: T,
  ) =>
    request<T>(`/${collection}/${entity.id}`, {
      method: "PUT",
      body: JSON.stringify(entity),
    }),
  exportMission: (missionId: string) =>
    request<ExportBundle>(`/missions/${missionId}/export`),
};
