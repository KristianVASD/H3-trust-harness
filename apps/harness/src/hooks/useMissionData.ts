import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_SEARCH_PLAN_VERSION,
  type Company,
  type Hypothesis,
  type JournalEntry,
  type Mission,
  type Observation,
  type Review,
  type SearchPlan,
  type Signal,
  type Source,
} from "@h3-trust/schema";
import { api } from "../api";
import { listReviews, listSignals } from "../api-extra";

export interface MissionData {
  mission: Mission | null;
  journal: JournalEntry[];
  observations: Observation[];
  hypotheses: Hypothesis[];
  sources: Source[];
  catalogue: Source[];
  companies: Company[];
  signals: Signal[];
  reviews: Review[];
  searchPlan: SearchPlan | null;
  error: string | null;
  reload: () => Promise<void>;
}

export function useMissionData(missionId: string): MissionData {
  const [mission, setMission] = useState<Mission | null>(null);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [catalogue, setCatalogue] = useState<Source[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [searchPlan, setSearchPlan] = useState<SearchPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!missionId) return;
    try {
      setError(null);
      const [m, j, o, h, s, c, sig, allSrc, rev] = await Promise.all([
        api.getMission(missionId),
        api.listJournal(missionId),
        api.listObservations(missionId),
        api.listHypotheses(missionId),
        api.listSources(missionId),
        api.listCompanies(missionId),
        listSignals(missionId),
        api.listAllSources(),
        listReviews(missionId),
      ]);
      setMission(m);
      setJournal(j);
      setObservations(o);
      setHypotheses(h);
      setSources(s);
      setCatalogue(allSrc);
      setCompanies(c);
      setSignals(sig);
      setReviews(rev);

      const planVersion = m.search_plan_version || DEFAULT_SEARCH_PLAN_VERSION;
      try {
        setSearchPlan(await api.getSearchPlan(planVersion));
      } catch {
        setSearchPlan(await api.getSearchPlan(DEFAULT_SEARCH_PLAN_VERSION));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load mission data");
    }
  }, [missionId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    mission,
    journal,
    observations,
    hypotheses,
    sources,
    catalogue,
    companies,
    signals,
    reviews,
    searchPlan,
    error,
    reload,
  };
}
