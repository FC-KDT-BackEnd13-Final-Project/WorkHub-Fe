import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ProjectMenu2 } from "./ProjectMenu2";
import { ProjectChecklist2 } from "./ProjectChecklist2";
import { ProjectPost2 } from "./ProjectPost2";
import { BackButton } from "../common/BackButton";

// 특정 노드의 체크리스트/게시판을 탭으로 전환하는 컨테이너
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
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold tracking-tight">노드 상세 · {nodeId}</h1>
          <p className="mt-2 text-muted-foreground">
            선택한 노드의 체크리스트와 게시판을 확인하고 관리하세요.
          </p>
        </div>
        <div className="pt-6">
          <ProjectMenu2 activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
        <div className="mb-6">{activeTab === "form" ? <ProjectChecklist2 /> : <ProjectPost2 />}</div>
        <div className="flex justify-end">
          <BackButton />
        </div>
      </div>
    </div>
  );
}
