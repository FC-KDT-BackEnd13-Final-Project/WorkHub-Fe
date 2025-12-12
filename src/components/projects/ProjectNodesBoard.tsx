import { CSSProperties, MouseEvent, PointerEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Paperclip, Link as LinkIcon, MoreHorizontal, Check } from "lucide-react";
import { Label } from "../ui/label";
import { AutoResizeTextarea } from "../ui/auto-resize-textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { projectApi } from "@/lib/api";
import { mapApiNodeToUiNode, type Node, type NodeStatus, type ApprovalStatus } from "../../utils/nodeMapper";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "../ui/utils";

// 프로젝트 내 노드(작업 카드)와 워크플로우를 관리하는 보드 화면

const defaultNodes: Node[] = [
  {
    id: "plan-001",
    projectNodeId: 10,
    title: "기획 단계",
    description: "요구사항 정의 및 페르소나 정리, 주요 기능 우선순위 확정",
    tags: ["#기획", "#리서치", "#이해관계자"],
    filesCount: 4,
    linksCount: 3,
    developer: "김준호",
    status: "IN_PROGRESS",
    approvalStatus: "PENDING",
    updatedAt: "2024-12-01T09:00:00Z",
    startDate: "2024-11-01",
    endDate: "2024-12-05",
    hasNotification: true,
  },
  {
    id: "design-101",
    projectNodeId: 11,
    title: "디자인 시안",
    description: "메인 페이지 와이어프레임과 UI 시스템 리뷰 및 수정",
    tags: ["#디자인", "#UX", "#UI"],
    filesCount: 6,
    linksCount: 2,
    developer: "박지민",
    status: "IN_PROGRESS",
    approvalStatus: "APPROVED",
    updatedAt: "2024-11-28T14:20:00Z",
    startDate: "2024-11-05",
    endDate: "2024-12-12",
    hasNotification: false,
  },
  {
    id: "dev-301",
    projectNodeId: 12,
    title: "프론트엔드 개발",
    description: "대시보드, 프로젝트 리스트, 워크플로우 뷰 구현",
    tags: ["#개발", "#프론트엔드", "#API"],
    filesCount: 3,
    linksCount: 4,
    developer: "이도윤",
    status: "ON_HOLD",
    approvalStatus: "REJECTED",
    updatedAt: "2024-12-02T11:45:00Z",
    startDate: "2024-11-10",
    endDate: "2024-12-22",
    hasNotification: true,
  },
  {
    id: "qa-210",
    projectNodeId: 13,
    title: "QA & 테스트",
    description: "시나리오 테스트 및 회귀 테스트, 릴리즈 전 이슈 목록 정리",
    tags: ["#테스트", "#QA"],
    filesCount: 2,
    linksCount: 1,
    developer: "정서현",
    status: "NOT_STARTED",
    approvalStatus: "PENDING",
    updatedAt: "2024-12-03T08:15:00Z",
    startDate: "2024-12-01",
    endDate: "2024-12-29",
    hasNotification: false,
  },
];

const createWorkflowFormState = () => ({
  title: "",
  description: "",
  developer: "",
  developerUserId: undefined as number | undefined,
  startDate: "",
  endDate: "",
  approvalStatus: "PENDING" as ApprovalStatus,
});

const statusOptions: NodeStatus[] = ["NOT_STARTED", "IN_PROGRESS", "PENDING_REVIEW", "ON_HOLD"];
const approvalStatusOptions: ApprovalStatus[] = ["PENDING", "APPROVED", "REJECTED"];
const approvalFilterOptions = ["전체", ...approvalStatusOptions] as const;
type ApprovalFilter = (typeof approvalFilterOptions)[number];
type StatusBadgeStyles = {
  background: string;
  text: string;
  border: string;
};

const statusBadgeStyles: Record<NodeStatus, StatusBadgeStyles> = {
  NOT_STARTED: {
    background: "#F3F4F6", // gray-100
    text: "#1F2937", // gray-800
    border: "#D1D5DB", // gray-300
  },
  IN_PROGRESS: {
    background: "#EFF6FF", // blue-50
    text: "#1D4ED8", // blue-700
    border: "#BFDBFE", // blue-200
  },
  PENDING_REVIEW: {
    background: "#FFFBEB", // amber-50
    text: "#B45309", // amber-700
    border: "#FDE68A", // amber-200
  },
  ON_HOLD: {
    background: "#FEF2F2", // red-50
    text: "#B91C1C", // red-700
    border: "#FECACA", // red-200
  },
};

const formatWorkflowDeveloperLabel = (developer: { id: string; name: string }) => {
  if (!developer.id || developer.id === developer.name) {
    return developer.name;
  }
  return `${developer.name} (${developer.id})`;
};

const stripDeveloperLabel = (value: string) => value.replace(/\s+\([^)]*\)$/, "");

const approvalBadgeStyles: Record<ApprovalStatus, StatusBadgeStyles> = {
  PENDING: {
    background: "#FEF3C7", // Amber
    text: "#F59E0B",
    border: "#FDE68A",
  },
  APPROVED: {
    background: "#ECFDF5",
    text: "#16A34A",
    border: "#A7F3D0",
  },
  REJECTED: {
    background: "#FEF2F2",
    text: "#DC2626",
    border: "#FECACA",
  },
};

export function ProjectNodesBoard() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as {
    projectName?: string;
    developers?: { id: string; name: string; email?: string; avatarUrl?: string }[];
  } | null;
  const projectNameFromState = locationState?.projectName;
  const developerOptions = locationState?.developers ?? [];
  console.log("ProjectNodesBoard - 현재 projectId:", projectId);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"전체" | NodeStatus>("전체");
  const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>("전체");
  const [developerFilter, setDeveloperFilter] = useState<string>("전체");
  const [nodes, setNodes] = useState<Node[]>([]);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState(createWorkflowFormState);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [isWorkflowDeveloperDropdownOpen, setIsWorkflowDeveloperDropdownOpen] = useState(false);
  const [workflowDeveloperSearchTerm, setWorkflowDeveloperSearchTerm] = useState("");
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [statusModalNode, setStatusModalNode] = useState<Node | null>(null);
  const [statusModalStatus, setStatusModalStatus] = useState<NodeStatus | "">("");
  const [statusModalApproval, setStatusModalApproval] = useState<ApprovalStatus | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextProjectNodeId = useRef(1);
  const developerFilterOptions = useMemo(() => {
    const labels = developerOptions
      .map((developer) => formatWorkflowDeveloperLabel(developer).trim())
      .filter(Boolean);
    const uniqueLabels = Array.from(new Set(labels));
    return ["전체", ...uniqueLabels];
  }, [developerOptions]);
  const workflowDeveloperOptions = useMemo(() => {
    return developerOptions;
  }, [developerOptions]);
  const visibleWorkflowDeveloperOptions = useMemo(() => {
    const term = workflowDeveloperSearchTerm.toLowerCase().replace(/\s+/g, "");
    if (!term) return workflowDeveloperOptions;
    return workflowDeveloperOptions.filter((developer) =>
      `${developer.name} ${developer.email ?? ""} ${developer.id}`.toLowerCase().replace(/\s+/g, "").includes(term),
    );
  }, [workflowDeveloperOptions, workflowDeveloperSearchTerm]);
  const hasWorkflowDeveloperSearch = workflowDeveloperSearchTerm.trim().length > 0;
  const hasWorkflowDeveloperOptions = workflowDeveloperOptions.length > 0;

  const isEditingWorkflow = Boolean(editingNode);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
  );
  const isCreateMode = !editingNode;
  const isCreateBlocked = isCreateMode && (!hasWorkflowDeveloperOptions || !newWorkflow.developerUserId);

  const filteredNodes = useMemo(() => {
    const term = search.toLowerCase();
    return nodes.filter((node) => {
      const matchesSearch =
        node.title.toLowerCase().includes(term) ||
        node.description.toLowerCase().includes(term) ||
        node.tags.some((tag) => tag.toLowerCase().includes(term));
      const matchesStatus = statusFilter === "전체" || node.status === statusFilter;
      const matchesApproval = approvalFilter === "전체" || node.approvalStatus === approvalFilter;
      const matchesDeveloper =
        developerFilter === "전체" ||
        node.developer === developerFilter ||
        node.developer === stripDeveloperLabel(developerFilter);
      return matchesSearch && matchesStatus && matchesApproval && matchesDeveloper;
    });
  }, [nodes, search, statusFilter, approvalFilter, developerFilter]);

  const formatDate = (value: string) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
    });
  };

  const formatUpdatedAt = (value: string) => {
    return new Date(value).toLocaleString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const workflowBasePath = `/projects/${projectId ?? "project"}/nodes`;
  const workflowModalPath = `/projects/${projectId ?? "project"}/nodes/new`;
  console.log("ProjectNodesBoard - 워크플로 기본 경로:", workflowBasePath);
  console.log("ProjectNodesBoard - 워크플로 모달 경로:", workflowModalPath);

  const getNextDayISO = (dateString: string) => {
    const date = new Date(dateString);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split("T")[0]!;
  };

  const getPreviousDayISO = (dateString: string) => {
    const date = new Date(dateString);
    date.setDate(date.getDate() - 1);
    return date.toISOString().split("T")[0]!;
  };

  const openWorkflowModal = useCallback(() => {
    console.log("openWorkflowModal 호출, 현재 isWorkflowModalOpen:", isWorkflowModalOpen);
    setEditingNode(null);
    setNewWorkflow(createWorkflowFormState());
    if (!isWorkflowModalOpen) {
      setIsWorkflowModalOpen(true);
    }
    if (location.pathname !== workflowModalPath) {
      console.log("workflowModalPath로 이동:", workflowModalPath);
      navigate(workflowModalPath, { replace: true, state: location.state });
    }
  }, [isWorkflowModalOpen, location.pathname, location.state, navigate, workflowModalPath]);

  const closeWorkflowModal = useCallback(() => {
    console.log("closeWorkflowModal 호출, 현재 isWorkflowModalOpen:", isWorkflowModalOpen);
    if (isWorkflowModalOpen) {
      setIsWorkflowModalOpen(false);
    }
    setNewWorkflow(createWorkflowFormState());
    setEditingNode(null);
    if (location.pathname !== workflowBasePath) {
      console.log("workflowBasePath로 이동:", workflowBasePath);
      navigate(workflowBasePath, { replace: true, state: location.state });
    }
  }, [isWorkflowModalOpen, location.pathname, location.state, navigate, workflowBasePath]);

  // API 호출 함수
  const fetchNodes = useCallback(async () => {
    if (!projectId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await projectApi.getNodes(projectId);

      // API 응답을 UI 타입으로 변환
      // response가 배열인지, response.projectNodes가 배열인지 확인
      const nodeArray = Array.isArray(response) ? response : (response.projectNodes ?? []);
      const uiNodes = nodeArray.map(mapApiNodeToUiNode);

      setNodes(uiNodes);

      // nextProjectNodeId 업데이트
      if (uiNodes.length > 0) {
        const maxId = Math.max(...uiNodes.map(n => n.projectNodeId));
        nextProjectNodeId.current = maxId + 1;
      }
    } catch (err) {
      console.error("노드 목록 로드 실패:", err);

      // 서버 응답 메시지 추출
      let errorMessage = "노드 목록을 불러오는데 실패했습니다.";

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosError = err as any;
        errorMessage = axiosError.response?.data?.message || errorMessage;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // 초기 로드
  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  useEffect(() => {
    if (editingNode) return;
    const shouldOpen = location.pathname === workflowModalPath;
    console.log("useEffect [location.pathname, workflowModalPath] 실행");
    console.log("  location.pathname:", location.pathname);
    console.log("  workflowModalPath:", workflowModalPath);
    console.log("  shouldOpen:", shouldOpen);
    setIsWorkflowModalOpen(shouldOpen);
    if (!shouldOpen) {
      setNewWorkflow(createWorkflowFormState());
    }
  }, [editingNode, location.pathname, workflowModalPath]);

  useEffect(() => {
    if (!isWorkflowModalOpen) {
      setIsWorkflowDeveloperDropdownOpen(false);
      setWorkflowDeveloperSearchTerm("");
    }
  }, [isWorkflowModalOpen]);

useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeWorkflowModal();
      }
    };

    if (isWorkflowModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeWorkflowModal, isWorkflowModalOpen]);

  const handleSaveWorkflow = async () => {
    if (!projectId) return;
    if (!newWorkflow.title.trim()) return;
    if (!newWorkflow.startDate || !newWorkflow.endDate) return;
    if (new Date(newWorkflow.endDate) <= new Date(newWorkflow.startDate)) return;

    if (editingNode) {
      setNodes((prev) =>
        prev.map((node) => {
          if (node.id !== editingNode.id) return node;
          return {
            ...node,
            title: newWorkflow.title,
            description: newWorkflow.description,
            developer: newWorkflow.developer.trim(),
            developerUserId: newWorkflow.developerUserId,
            startDate: newWorkflow.startDate,
            endDate: newWorkflow.endDate,
            approvalStatus: newWorkflow.approvalStatus,
            updatedAt: new Date().toISOString(),
          };
        }),
      );
      setNewWorkflow(createWorkflowFormState());
      closeWorkflowModal();
      return;
    }

    if (!newWorkflow.developerUserId) return;

    try {
      setIsLoading(true);
      await projectApi.createNode(projectId, {
        title: newWorkflow.title,
        description: newWorkflow.description,
        developerUserId: newWorkflow.developerUserId,
        startDate: newWorkflow.startDate,
        endDate: newWorkflow.endDate,
      });

      await fetchNodes();
      setNewWorkflow(createWorkflowFormState());
      closeWorkflowModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "노드 생성에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const syncNodeOrder = useCallback(
    async (orderedNodes: Node[]) => {
      if (!projectId) return;
      const payload = {
        orders: orderedNodes.map((node, index) => ({
          projectNodeId: node.projectNodeId,
          nodeOrder: index + 1,
        })),
      };

      try {
        const response = await fetch(`/projects/${projectId}/nodes/order`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Failed to update order: ${response.status}`);
        }
      } catch (error) {
        console.error("노드 순서 갱신 실패:", error);
      }
    },
    [projectId],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setNodes((prev) => {
        const oldIndex = prev.findIndex((node) => node.id === active.id);
        const newIndex = prev.findIndex((node) => node.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return prev;

        const reordered = arrayMove(prev, oldIndex, newIndex);
        void syncNodeOrder(reordered);
        return reordered;
      });
    },
    [syncNodeOrder],
  );

  const handleEditNode = useCallback(
    (node: Node) => {
      const matchedDeveloperById = node.developerUserId
        ? developerOptions.find((dev) => Number(dev.id) === node.developerUserId)
        : undefined;
      const matchedDeveloperByName = developerOptions.find(
        (dev) => dev.name === stripDeveloperLabel(node.developer ?? ""),
      );
      const matchedDeveloper = matchedDeveloperById || matchedDeveloperByName;

      setEditingNode(node);
      setNewWorkflow({
        title: node.title,
        description: node.description,
        developer: node.developer,
        developerUserId: matchedDeveloper
          ? Number(matchedDeveloper.id)
          : node.developerUserId ?? undefined,
        startDate: node.startDate,
        endDate: node.endDate,
        approvalStatus: node.approvalStatus || "PENDING",
      });
      setIsWorkflowModalOpen(true);
      if (location.pathname !== workflowBasePath) {
        navigate(workflowBasePath, { replace: true, state: location.state });
      }
    },
    [developerOptions, location.pathname, location.state, navigate, workflowBasePath],
  );

  const handleDeleteNode = useCallback(
    (node: Node) => {
      const message = `"${node.title}" 단계를 삭제할까요? 이 작업은 되돌릴 수 없습니다.`;
      if (window.confirm(message)) {
        setNodes((prev) => prev.filter((item) => item.id !== node.id));
        if (editingNode && editingNode.id === node.id) {
          closeWorkflowModal();
        }
      }
    },
    [closeWorkflowModal, editingNode],
  );

  const openStatusModal = useCallback((node: Node) => {
    setStatusModalNode(node);
    setStatusModalStatus(node.status);
    setStatusModalApproval(node.approvalStatus);
  }, []);

  const closeStatusModal = useCallback(() => {
    setStatusModalNode(null);
    setStatusModalStatus("");
    setStatusModalApproval(undefined);
  }, []);

  const handleApplyStatusChange = useCallback(() => {
    if (!statusModalNode || !statusModalStatus || !statusModalApproval) return;
    setNodes((prev) =>
      prev.map((node) =>
        node.id === statusModalNode.id
          ? { ...node, status: statusModalStatus, approvalStatus: statusModalApproval }
          : node,
      ),
    );
    closeStatusModal();
  }, [closeStatusModal, statusModalApproval, statusModalNode, statusModalStatus]);

  return (
    <div className="space-y-6 pb-12">
      {statusModalNode && (
        <div className="fixed inset-0 z-50">
          <div className="min-h-screen flex items-center justify-center p-4 bg-black/40">
            <div className="w-full" style={{ maxWidth: "28rem" }}>
              <Card className="border border-border shadow-lg">
                <CardHeader className="space-y-2 pb-4">
                  <h2 className="text-lg font-semibold text-center">상태/승인 변경</h2>
                  <p className="text-sm text-muted-foreground text-center">
                    "{statusModalNode.title}" 카드의 상태와 승인 단계를 선택하세요.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>상태</Label>
                    <Select
                      value={statusModalStatus || undefined}
                      onValueChange={(value) => setStatusModalStatus(value as NodeStatus)}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="상태 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>승인 상태</Label>
                    <Select
                      value={statusModalApproval || undefined}
                      onValueChange={(value) =>
                        setStatusModalApproval(value as ApprovalStatus)
                      }
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="승인 상태 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {approvalStatusOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-1/2"
                      onClick={closeStatusModal}
                    >
                      취소
                    </Button>
                    <Button
                      type="button"
                      className="w-1/2"
                      disabled={!statusModalStatus || !statusModalApproval}
                      onClick={handleApplyStatusChange}
                    >
                      적용
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
      {isWorkflowModalOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            aria-hidden="true"
            onClick={closeWorkflowModal}
            onWheel={(event) => event.preventDefault()}
            onTouchMove={(event) => event.preventDefault()}
          ></div>
          <div className="relative z-10 min-h-screen p-4 flex items-center justify-center">
            <div
              className="w-full max-h-[90vh]"
              style={{ maxWidth: "var(--login-card-max-width, 42rem)" }}
            >
              <div className="max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
                <Card className="login-theme border border-border shadow-lg">
                  <CardHeader className="space-y-2 pb-6">
                    <h2 className="text-xl text-center">
                      {isEditingWorkflow ? "워크플로 수정" : "새 워크플로 만들기"}
                    </h2>
                    <p className="text-sm text-muted-foreground text-center">
                      {isEditingWorkflow
                        ? "선택한 워크플로 단계를 업데이트하고 저장하세요."
                        : "새로운 워크플로 단계를 작성하고 세부 정보를 입력하세요."}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="workflowTitle" className="text-gray-700">
                          단계명
                        </Label>
                      <Input
                        id="workflowTitle"
                        value={newWorkflow.title}
                        onChange={(event) =>
                          setNewWorkflow((prev) => ({ ...prev, title: event.target.value }))
                        }
                        className="h-9 rounded-md border border-border bg-input-background px-3 py-1 focus:bg-white focus:border-primary transition-colors"
                      />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="workflowDescription" className="text-gray-700">
                          단계에 대한 설명
                        </Label>
                      <AutoResizeTextarea
                        id="workflowDescription"
                        value={newWorkflow.description}
                        onChange={(event) =>
                          setNewWorkflow((prev) => ({ ...prev, description: event.target.value }))
                        }
                        className="w-full border rounded-md border-border bg-input-background px-3 py-2 text-sm focus:bg-white focus:border-primary transition-colors"
                        placeholder="단계에 대한 설명을 입력하세요."
                        minHeight="36px"
                        maxHeight="200px"
                      />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="workflowStart" className="text-gray-700">
                            시작일
                          </Label>
                        <Input
                          id="workflowStart"
                          type="date"
                          value={newWorkflow.startDate}
                          max={
                            newWorkflow.endDate ? getPreviousDayISO(newWorkflow.endDate) : undefined
                          }
                          onChange={(event) => {
                            const value = event.target.value;
                            setNewWorkflow((prev) => {
                              const updated = { ...prev, startDate: value };
                              if (
                                updated.endDate &&
                                value &&
                                new Date(updated.endDate) <= new Date(value)
                              ) {
                                updated.endDate = getNextDayISO(value);
                              }
                              return updated;
                            });
                          }}
                          className="h-9 rounded-md border border-border bg-input-background px-3 py-1 focus:bg-white focus:border-primary transition-colors"
                        />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="workflowEnd" className="text-gray-700">
                            종료일
                          </Label>
                        <Input
                          id="workflowEnd"
                          type="date"
                          value={newWorkflow.endDate}
                          min={
                            newWorkflow.startDate ? getNextDayISO(newWorkflow.startDate) : undefined
                          }
                          onChange={(event) => {
                            const value = event.target.value;
                            setNewWorkflow((prev) => {
                              if (
                                prev.startDate &&
                                value &&
                                new Date(value) <= new Date(prev.startDate)
                              ) {
                                return prev;
                              }
                              return { ...prev, endDate: value };
                            });
                          }}
                          className="h-9 rounded-md border border-border bg-input-background px-3 py-1 focus:bg-white focus:border-primary transition-colors"
                        />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="workflowDeveloper" className="text-gray-700">
                          개발 담당자
                        </Label>
                        {hasWorkflowDeveloperOptions ? (
                          <Popover
                            open={isWorkflowDeveloperDropdownOpen}
                            onOpenChange={(open) => {
                              setIsWorkflowDeveloperDropdownOpen(open);
                              if (open) {
                                setWorkflowDeveloperSearchTerm("");
                              }
                            }}
                          >
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="flex h-9 w-full items-center justify-between rounded-md border border-border bg-input-background px-3 text-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                              >
                                <span
                                  className={cn(
                                    "flex-1 truncate text-left",
                                    newWorkflow.developer ? "text-foreground" : "text-muted-foreground",
                                  )}
                                >
                                  {newWorkflow.developer || "개발 담당자를 선택하세요"}
                                </span>
                                <svg
                                  className={cn(
                                    "ml-2 h-4 w-4 text-muted-foreground transition-transform",
                                    isWorkflowDeveloperDropdownOpen ? "rotate-180" : "",
                                  )}
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="m6 9 6 6 6-6"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              side="bottom"
                              align="start"
                              avoidCollisions={false}
                              className="w-[var(--radix-popover-trigger-width)] max-w-none p-0"
                              style={{ width: "var(--radix-popover-trigger-width)" }}
                            >
                              <div className="border-b border-border px-3 py-2">
                                <Input
                                  value={workflowDeveloperSearchTerm}
                                  onChange={(event) => setWorkflowDeveloperSearchTerm(event.target.value)}
                                  placeholder="개발자를 검색하세요"
                                  className="h-8 text-sm"
                                  autoFocus
                                />
                              </div>
                              <div className="max-h-[13.5rem] overflow-y-auto">
                                {hasWorkflowDeveloperSearch ? (
                                  visibleWorkflowDeveloperOptions.length > 0 ? (
                                    visibleWorkflowDeveloperOptions.map((developer) => {
                                      const isSelected =
                                        newWorkflow.developerUserId &&
                                        Number(developer.id) === newWorkflow.developerUserId;
                                      return (
                                        <button
                                          type="button"
                                          key={developer.id}
                                          onMouseDown={(event) => {
                                            event.preventDefault();
                                            setNewWorkflow((prev) => ({
                                              ...prev,
                                              developerUserId: Number(developer.id),
                                              developer: developer.name,
                                            }));
                                            setIsWorkflowDeveloperDropdownOpen(false);
                                            setWorkflowDeveloperSearchTerm("");
                                          }}
                                          className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent/60"
                                        >
                                          <div className="flex items-center gap-3">
                                            <img
                                              src={developer.avatarUrl || "/default-profile.png"}
                                              alt={`${developer.name} 프로필`}
                                              className="h-6 w-6 rounded-full object-cover"
                                            />
                                            <div className="flex flex-col leading-tight">
                                              <span className="text-sm font-medium">
                                                {developer.name} ({developer.id})
                                              </span>
                                              <span className="text-xs text-muted-foreground">
                                                {developer.email ?? "이메일 정보 없음"}
                                              </span>
                                            </div>
                                          </div>
                                          {isSelected && <Check className="h-4 w-4 text-primary" aria-hidden="true" />}
                                        </button>
                                      );
                                    })
                                  ) : (
                                    <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                                      검색 결과가 없습니다.
                                    </p>
                                  )
                                ) : (
                                  <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                                    검색어를 입력하면 결과가 표시됩니다.
                                  </p>
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <Input
                            id="workflowDeveloper"
                            value={newWorkflow.developer}
                            onChange={(event) =>
                              setNewWorkflow((prev) => ({
                                ...prev,
                                developer: event.target.value,
                                developerUserId: undefined,
                              }))
                            }
                            placeholder="담당자 이름을 입력하세요"
                            className="h-9 rounded-md border border-border bg-input-background px-3 py-1 focus:bg-white focus:border-primary transition-colors"
                          />
                        )}
                        {isCreateMode && !hasWorkflowDeveloperOptions && (
                          <p className="text-sm text-destructive">
                            개발자 목록을 불러올 수 없어 새 워크플로를 생성할 수 없습니다.
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-6 pt-6 flex justify-between gap-2">
                      <Button variant="secondary" className="w-1/2" onClick={closeWorkflowModal}>
                        취소
                      </Button>
                      <Button
                        className="w-1/2"
                        onClick={handleSaveWorkflow}
                        disabled={isCreateBlocked}
                        title={isCreateBlocked ? "개발자 선택 후 생성할 수 있습니다." : undefined}
                      >
                        {isEditingWorkflow ? "저장" : "생성"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight">
          {projectNameFromState ?? "Project Nodes"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          각 워크플로 단계의 진행 상황을 확인하고 필요한 세부 정보를 확인하세요.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm md:flex-row md:items-center">
        <Input
          placeholder="작업을 검색하세요"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="md:flex-1"
        />
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "전체" | NodeStatus)}>
          <SelectTrigger className="md:w-52">
            <SelectValue placeholder="전체 상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="전체">전체 상태</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={approvalFilter} onValueChange={(value) => setApprovalFilter(value as ApprovalFilter)}>
          <SelectTrigger className="md:w-52">
            <SelectValue placeholder="전체 승인" />
          </SelectTrigger>
          <SelectContent>
            {approvalFilterOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option === "전체" ? "전체 승인" : option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={developerFilter} onValueChange={(value) => setDeveloperFilter(value)}>
          <SelectTrigger className="md:w-52">
            <SelectValue placeholder="전체 개발 담당자" />
          </SelectTrigger>
          <SelectContent>
            {developerFilterOptions.map((option, index) => (
              <SelectItem key={`${option}-${index}`} value={option}>
                {option === "전체" ? "전체 개발 담당자" : option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Button className="h-9 px-4 text-sm" onClick={openWorkflowModal}>
            + 새 워크플로
          </Button>
          <Button
            variant="outline"
            className="h-9 px-4 text-sm"
            onClick={() => navigate(`/projects/${projectId ?? "project"}/nodes/support`)}
          >
            CS 문의
          </Button>
          <Button
            variant={isReorderMode ? "default" : "outline"}
            className="h-9 px-4 text-sm"
            onClick={() => setIsReorderMode((prev) => !prev)}
          >
            {isReorderMode ? "편집 완료" : "편집"}
          </Button>
        </div>
      </div>

      {/* 로딩 상태 */}
      {isLoading && !nodes.length && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">노드 목록을 불러오는 중...</p>
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div className="rounded-2xl bg-white p-6 shadow-sm text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => fetchNodes()} variant="outline">
            다시 시도
          </Button>
        </div>
      )}

      {/* 결과 없음 */}
      {!isLoading && !error && filteredNodes.length === 0 && nodes.length === 0 && (
        <div className="rounded-2xl bg-white p-12 shadow-sm text-center">
          <p className="text-muted-foreground">노드가 없습니다.</p>
        </div>
      )}

      {/* 검색 결과 없음 */}
      {!isLoading && !error && filteredNodes.length === 0 && nodes.length > 0 && (
        <div className="rounded-2xl bg-white p-12 shadow-sm text-center">
          <p className="text-muted-foreground">검색 결과가 없습니다.</p>
        </div>
      )}

      {/* 노드 카드 리스트 */}
      {!isLoading && !error && filteredNodes.length > 0 && (
        <>
          {isReorderMode ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredNodes.map((node) => node.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {filteredNodes.map((node) => (
                <SortableNodeCard
                  key={node.id}
                  node={node}
                  formatDate={formatDate}
                  formatUpdatedAt={formatUpdatedAt}
                  onNavigate={(id) => navigate(`/projects/${projectId ?? "project"}/nodes/${id}`)}
                  rightActions={
                    <NodeActionMenu
                      node={node}
                      onEdit={handleEditNode}
                      onDelete={handleDeleteNode}
                      onChangeStatus={openStatusModal}
                    />
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {filteredNodes.map((node) => (
            <StaticNodeCard
              key={node.id}
              node={node}
              formatDate={formatDate}
              formatUpdatedAt={formatUpdatedAt}
              onNavigate={(id) => navigate(`/projects/${projectId ?? "project"}/nodes/${id}`)}
            />
          ))}
        </div>
      )}
        </>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => navigate(-1)}>
          ← 뒤로가기
        </Button>
      </div>
    </div>
  );
}

interface NodeCardBaseProps {
  node: Node;
  formatDate: (value: string) => string;
  formatUpdatedAt: (value: string) => string;
  onNavigate: (nodeId: string) => void;
  rightActions?: ReactNode;
  cardRef?: (element: HTMLDivElement | null) => void;
  style?: CSSProperties;
}

function NodeCardBase({
  node,
  formatDate,
  formatUpdatedAt,
  onNavigate,
  rightActions,
  cardRef,
  style,
}: NodeCardBaseProps) {
  const handleCardClick = (event: MouseEvent<HTMLDivElement>) => {
    if (rightActions) {
      const target = event.target as HTMLElement;
      if (target.closest('[data-node-card-action="true"]')) {
        return;
      }
    }
    onNavigate(node.id);
  };

  return (
    <Card
      ref={cardRef}
      style={style}
      className="relative cursor-pointer rounded-2xl border border-white/70 bg-white/90 shadow-sm backdrop-blur transition-shadow hover:shadow-lg"
      onClick={handleCardClick}
    >
      {node.hasNotification && (
        <span className="absolute top-3 right-3 h-2 w-2 rounded-full" style={{ backgroundColor: "var(--point-color)" }} />
      )}
      <CardHeader className="@container/card-header space-y-2 px-6 pt-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">최근 업데이트 · {formatUpdatedAt(node.updatedAt)}</p>
            <CardTitle className="text-xl">{node.title}</CardTitle>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-end gap-1 text-right">
              <Badge
                variant="outline"
                style={{
                  backgroundColor: statusBadgeStyles[node.status].background,
                  color: statusBadgeStyles[node.status].text,
                  borderColor: statusBadgeStyles[node.status].border,
                }}
              >
                {node.status}
              </Badge>
              {node.approvalStatus && (
                <Badge
                  variant="outline"
                  style={{
                    backgroundColor: approvalBadgeStyles[node.approvalStatus].background,
                    color: approvalBadgeStyles[node.approvalStatus].text,
                    borderColor: approvalBadgeStyles[node.approvalStatus].border,
                  }}
                >
                  {node.approvalStatus}
                </Badge>
              )}
            </div>
            {rightActions && (
              <div className="flex items-center gap-2" data-node-card-action="true">
                {rightActions}
              </div>
            )}
          </div>
        </div>
        <CardDescription>{node.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-6 pb-6">
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">파일</span>
            <span className="flex items-center gap-2 font-medium">
              <Paperclip className="h-4 w-4 text-muted-foreground" />
              {node.filesCount}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">링크</span>
            <span className="flex items-center gap-2 font-medium">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              {node.linksCount}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">타임라인</span>
            <span className="font-medium">
              {formatDate(node.startDate)} – {formatDate(node.endDate)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">개발 담당자</span>
            <span className="font-medium">{node.developer || "-"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface NodeActionMenuProps {
  node: Node;
  onEdit: (node: Node) => void;
  onDelete: (node: Node) => void;
  onChangeStatus: (node: Node) => void;
}

function NodeActionMenu({ node, onEdit, onDelete, onChangeStatus }: NodeActionMenuProps) {
  const stopPointer = (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  };

  const handleTriggerClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  };

  const handleEdit = (event: Event) => {
    event.stopPropagation();
    onEdit(node);
  };

  const handleDelete = (event: Event) => {
    event.stopPropagation();
    onDelete(node);
  };

  const handleStatusChange = (event: Event) => {
    event.stopPropagation();
    onChangeStatus(node);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="워크플로 액션"
          className="rounded-full p-1 text-muted-foreground transition hover:bg-muted"
          onClick={handleTriggerClick}
          onPointerDown={stopPointer}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        alignOffset={-18}
        sideOffset={6}
        className="min-w-0 w-auto"
        style={{ minWidth: "auto", width: "auto" }}
      >
        <DropdownMenuItem onSelect={handleStatusChange}>
          상태/승인 변경
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleEdit}>
          수정
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={handleDelete}
          variant="destructive"
          className="text-destructive"
        >
          삭제
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface SortableNodeCardProps extends NodeCardBaseProps {}

function StaticNodeCard(props: NodeCardBaseProps) {
  return <NodeCardBase {...props} />;
}

function SortableNodeCard({
  node,
  formatDate,
  formatUpdatedAt,
  onNavigate,
  rightActions,
}: SortableNodeCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: node.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <NodeCardBase
        node={node}
        formatDate={formatDate}
        formatUpdatedAt={formatUpdatedAt}
        onNavigate={() => {}}
        rightActions={rightActions}
      />
    </div>
  );
}
