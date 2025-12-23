import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ProjectMenu2 } from "./ProjectMenu2";
import { ProjectChecklist2 } from "./ProjectChecklist2";
import { ProjectPost2 } from "./ProjectPost2";
import { projectApi } from "@/lib/api";
import { useRef } from "react";
import type { NodeApiItem } from "@/types/projectNodeList";

// 특정 노드의 체크리스트/게시판을 탭으로 전환하는 컨테이너
export function ProjectNodeDetail() {
  const { projectId, nodeId } = useParams<{ projectId: string; nodeId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isReportRoute = location.pathname.endsWith("/posts");
  const locationState = (location.state as { nodeTitle?: string } | null) ?? null;
  const nodeTitleFromState = locationState?.nodeTitle;
  const shouldPrefetchNodeInfo = !nodeTitleFromState;
  const [activeTab, setActiveTab] = useState<"form" | "report">(isReportRoute ? "report" : "form");
  const [nodeTitle, setNodeTitle] = useState(nodeTitleFromState ?? "");
  const [nodeInfo, setNodeInfo] = useState<Partial<NodeApiItem> | null>(null);
  const [nodeInfoLoading, setNodeInfoLoading] = useState(shouldPrefetchNodeInfo);
  const nodeTitleFetchedRef = useRef(false);

  useEffect(() => {
    setActiveTab(isReportRoute ? "report" : "form");
  }, [isReportRoute]);

  useEffect(() => {
    setNodeInfo(null);
    nodeTitleFetchedRef.current = false;
    if (nodeTitleFromState) {
      setNodeTitle(nodeTitleFromState);
      setNodeInfoLoading(false);
    } else {
      setNodeTitle("");
      setNodeInfoLoading(true);
    }
  }, [nodeId, nodeTitleFromState, projectId]);

  useEffect(() => {
    const loadNodeTitle = async () => {
      if (nodeTitleFromState || nodeTitle || !projectId || !nodeId) {
        setNodeInfoLoading(false);
        return;
      }
      if (nodeTitleFetchedRef.current) return;
      const storageKey = `workhub:nodeTitle:${projectId}:${nodeId}`;
      const cached = sessionStorage.getItem(storageKey);
      if (cached) {
        setNodeTitle(cached);
        nodeTitleFetchedRef.current = true;
        setNodeInfoLoading(false);
        return;
      }
      nodeTitleFetchedRef.current = true;
      try {
        setNodeInfoLoading(true);
        const data = await projectApi.getNode(projectId, nodeId);
        setNodeInfo(data);
        const title = (data as any)?.nodeTitle || data?.title || (data as any)?.nodeName;
        if (title) {
          setNodeTitle(title);
          sessionStorage.setItem(storageKey, title);
        }
      } catch (error) {
        console.error("노드 정보를 불러오지 못했습니다.", error);
        // 실패 시 다시 시도할 수 있도록 플래그 리셋
        nodeTitleFetchedRef.current = false;
      } finally {
        setNodeInfoLoading(false);
      }
    };
    loadNodeTitle();
  }, [nodeId, nodeTitleFromState, projectId, nodeTitle]);

  const handleTabChange = (tab: "form" | "report") => {
    if (!projectId || !nodeId) return;
    const statePayload = locationState ?? undefined;
    if (tab === "form") {
      navigate(`/projects/${projectId}/nodes/${nodeId}`, {
        replace: true,
        state: statePayload,
      });
    } else {
      navigate(`/projects/${projectId}/nodes/${nodeId}/posts`, {
        replace: true,
        state: statePayload,
      });
    }
  };

  const displayedNodeLabel = nodeTitle || nodeTitleFromState || nodeId || "";

  return (
    <div className="pt-8 pb-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold tracking-tight">{displayedNodeLabel}</h1>
          <p className="mt-2 text-muted-foreground">
            선택한 노드의 체크리스트와 게시판을 확인하고 관리하세요.
          </p>
        </div>
        <div className="pt-6">
          <ProjectMenu2 activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
        <div className="mb-6">
          {activeTab === "form" ? (
            <ProjectChecklist2 initialNodeInfo={nodeInfo} nodeInfoLoading={nodeInfoLoading} />
          ) : (
            <ProjectPost2 />
          )}
        </div>
      </div>
    </div>
  );
}
