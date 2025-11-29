import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ProjectMenu2 } from "./ProjectMenu2";
import { ProjectChecklist2 } from "./ProjectChecklist2";
import { ProjectPost2 } from "./ProjectPost2";

export function ProjectNodeDetail() {
  const { projectId, nodeId } = useParams<{ projectId: string; nodeId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isReportRoute = location.pathname.endsWith("/posts");
  const [activeTab, setActiveTab] = useState<"form" | "report">(isReportRoute ? "report" : "form");

  useEffect(() => {
    setActiveTab(isReportRoute ? "report" : "form");
  }, [isReportRoute]);

  const handleTabChange = (tab: "form" | "report") => {
    if (!projectId || !nodeId) return;
    if (tab === "form") {
      navigate(`/projects/${projectId}/nodes/${nodeId}`, { replace: true });
    } else {
      navigate(`/projects/${projectId}/nodes/${nodeId}/posts`, { replace: true });
    }
  };

  return (
    <div className="pt-8 pb-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 pt-6">
          <ProjectMenu2 activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
        <div>{activeTab === "form" ? <ProjectChecklist2 /> : <ProjectPost2 />}</div>
      </div>
    </div>
  );
}
