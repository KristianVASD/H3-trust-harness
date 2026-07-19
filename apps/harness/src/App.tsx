import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { MissionLayout } from "./layouts/MissionLayout";
import { WorkerLayout } from "./layouts/WorkerLayout";
import { MissionControl } from "./pages/MissionControl";
import { WorkspacePage } from "./pages/WorkspacePage";
import { CandidateTriagePage } from "./pages/CandidateTriagePage";
import { CaraReviewPage } from "./pages/CaraReviewPage";
import { SignalsPage } from "./pages/SignalsPage";
import { SituationRoomPage } from "./pages/SituationRoomPage";
import { KnowledgeGraphPage } from "./pages/KnowledgeGraphPage";
import { WorkerSourcesPage } from "./pages/worker/WorkerSourcesPage";
import { WorkerCaraPage } from "./pages/worker/WorkerCaraPage";
import { WorkerImportPage } from "./pages/worker/WorkerImportPage";
import { WorkerResultsPage } from "./pages/worker/WorkerResultsPage";

export function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="brand">
            H3 Trust <span>Harness</span>
          </div>
          <p className="tagline">
            Trust Investigation Platform — humans investigate today, OmegaClaw tomorrow.
          </p>
        </div>
        <nav className="row">
          <NavLink className="btn secondary small" to="/">
            Mission Control
          </NavLink>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<MissionControl />} />

        {/* Data Worker — linear Sources → CARA → Import → Results */}
        <Route path="/work/:missionId" element={<WorkerLayout />}>
          <Route index element={<Navigate to="sources" replace />} />
          <Route path="sources" element={<WorkerSourcesPage />} />
          <Route path="cara" element={<WorkerCaraPage />} />
          <Route path="import" element={<WorkerImportPage />} />
          <Route path="results" element={<WorkerResultsPage />} />
        </Route>

        {/* Investigator — full mission desk */}
        <Route path="/missions/:missionId" element={<MissionLayout />}>
          <Route index element={<WorkspacePage />} />
          <Route path="triage" element={<CandidateTriagePage />} />
          <Route path="cara" element={<CaraReviewPage />} />
          <Route path="signals" element={<SignalsPage />} />
          <Route path="situation" element={<SituationRoomPage />} />
          <Route path="graph" element={<KnowledgeGraphPage />} />
        </Route>
      </Routes>
    </div>
  );
}
