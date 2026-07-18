import { NavLink, Route, Routes } from "react-router-dom";
import { CaraReviewPage } from "./pages/CaraReviewPage";
import { KnowledgeGraphPage } from "./pages/KnowledgeGraphPage";
import { MissionControl } from "./pages/MissionControl";
import { SignalsPage } from "./pages/SignalsPage";
import { SituationRoomPage } from "./pages/SituationRoomPage";
import { WorkspacePage } from "./pages/WorkspacePage";

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
        <Route path="/missions/:missionId" element={<WorkspacePage />} />
        <Route path="/missions/:missionId/cara" element={<CaraReviewPage />} />
        <Route path="/missions/:missionId/signals" element={<SignalsPage />} />
        <Route
          path="/missions/:missionId/situation"
          element={<SituationRoomPage />}
        />
        <Route
          path="/missions/:missionId/graph"
          element={<KnowledgeGraphPage />}
        />
      </Routes>
    </div>
  );
}
