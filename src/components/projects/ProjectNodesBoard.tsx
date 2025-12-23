import { CSSProperties, KeyboardEvent, MouseEvent, PointerEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  mapApiNodeToUiNode,
  mapConfirmStatusToApprovalStatus,
  mapUiStatusToApiStatus,
  type Node,
  type NodeStatus,
  type ApprovalStatus,
} from "@/utils/nodeMapper";
import type { NodeCategory } from "@/types/projectNode";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "../ui/utils";
import { ModalShell } from "../common/ModalShell";
import { PROFILE_STORAGE_KEY, type UserRole, normalizeUserRole } from "@/constants/profile";
import { useLocalStorageValue } from "@/hooks/useLocalStorageValue";
import { getErrorMessage, localizeErrorMessage } from "@/utils/errorMessages";

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
  nodeCategory: "" as NodeCategory | "",
  developer: "",
  developerUserId: undefined as number | undefined,
  startDate: "",
  endDate: "",
  approvalStatus: "PENDING" as ApprovalStatus,
});

type StoredSettings = {
  profile?: {
    role?: string;
  };
};

type StoredUser = {
  role?: string;
};

const statusOptions: NodeStatus[] = ["NOT_STARTED", "IN_PROGRESS", "PENDING_REVIEW", "ON_HOLD", "DONE"];
const approvalStatusOptions: ApprovalStatus[] = ["PENDING", "APPROVED", "REJECTED"];
const approvalFilterOptions = ["전체", ...approvalStatusOptions] as const;
const statusesWithoutApproval: NodeStatus[] = ["NOT_STARTED", "IN_PROGRESS"];

const nodeCategoryLabels: Record<NodeCategory, string> = {
  PLANNING: "기획",
  DESIGN: "디자인 / 설계",
  DEVELOPMENT: "개발",
  QA: "QA",
  RELEASE: "배포",
  MAINTENANCE: "운영 / 유지보수",
  ETC: "기타",
};

const nodeCategoryOptions = (Object.entries(nodeCategoryLabels) as [NodeCategory, string][]).map(
  ([value, label]) => ({ value, label }),
);
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
  DONE: {
    background: "#ECFDF5", // green-50
    text: "#047857", // green-700
    border: "#A7F3D0", // green-200
  },
};

const nodeStatusLabels: Record<NodeStatus, string> = {
  NOT_STARTED: "시작 전",
  IN_PROGRESS: "진행 중",
  PENDING_REVIEW: "검토 대기",
  ON_HOLD: "보류",
  DONE: "완료",
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

const approvalStatusLabels: Record<ApprovalStatus, string> = {
  PENDING: "승인 대기",
  APPROVED: "승인 완료",
  REJECTED: "반려",
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
  const [projectName, setProjectName] = useState<string | null>(projectNameFromState ?? null);
  const projectNameFetchedRef = useRef(false);
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
  const [statusModalApproval, setStatusModalApproval] = useState<ApprovalStatus | "">("");
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const isApprovalRequired = useMemo(() => {
    if (!statusModalStatus) return false;
    return !statusesWithoutApproval.includes(statusModalStatus as NodeStatus);
  }, [statusModalStatus]);
  const canApplyStatusChange = useMemo(() => {
    if (!statusModalStatus || isStatusUpdating) {
      return false;
    }
    if (isApprovalRequired) {
      return Boolean(statusModalApproval);
    }
    return true;
  }, [isApprovalRequired, isStatusUpdating, statusModalApproval, statusModalStatus]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storedSettings] = useLocalStorageValue<StoredSettings | null>(PROFILE_STORAGE_KEY, {
    defaultValue: null,
    parser: (value) => JSON.parse(value),
    listen: true,
  });
  const [storedUser] = useLocalStorageValue<StoredUser | null>("user", {
    defaultValue: null,
    parser: (value) => JSON.parse(value),
    listen: true,
  });
  const userRole = useMemo<UserRole>(() => {
    const profileRole = normalizeUserRole(storedSettings?.profile?.role);
    if (profileRole) {
      return profileRole;
    }
    const storedUserRole = normalizeUserRole(storedUser?.role);
    return storedUserRole ?? "DEVELOPER";
  }, [storedSettings, storedUser]);
  const isClient = userRole === "CLIENT";
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

      // API 응답을 UI 타입으로 변환 (신규: data 배열, 구형: projectNodes 필드)
      const nodeArray = Array.isArray(response) ? response : response?.projectNodes ?? [];
      const uiNodes = nodeArray.map((apiNode) => {
        const mapped = mapApiNodeToUiNode(apiNode);
        // 확인 상태를 그대로 approvalStatus/label에 반영 (매퍼 안전망)
        const approvalStatus =
          mapConfirmStatusToApprovalStatus(apiNode.confirmStatus) ??
          mapped.approvalStatus ??
          undefined;
        return {
          ...mapped,
          approvalStatus,
        };
      });

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

      setError(localizeErrorMessage(errorMessage) ?? errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // 초기 로드
  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  useEffect(() => {
    const loadProjectName = async () => {
      if (!projectId) return;
      if (projectNameFromState) {
        setProjectName(projectNameFromState);
        return;
      }
      if (projectNameFetchedRef.current) return;

      const storageKey = `workhub:projectName:${projectId}`;
      const cached = sessionStorage.getItem(storageKey);
      if (cached) {
        setProjectName(cached);
        projectNameFetchedRef.current = true;
        return;
      }

      projectNameFetchedRef.current = true;
      try {
        const data = await projectApi.getProject(projectId);
        const name = (data as any)?.projectTitle || (data as any)?.projectName || (data as any)?.name || (data as any)?.title;
        if (name) {
          setProjectName(name);
          sessionStorage.setItem(storageKey, name);
        } else if (projectNameFromState) {
          setProjectName(projectNameFromState);
        }
      } catch (error) {
        console.error("프로젝트명을 불러오지 못했습니다.", error);
        if (projectNameFromState) {
          setProjectName(projectNameFromState);
        }
        projectNameFetchedRef.current = false;
      }
    };
    loadProjectName();
  }, [projectId, projectNameFromState]);

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
      const developerUserId =
        newWorkflow.developerUserId ?? editingNode.developerUserId ?? undefined;
      if (!developerUserId) {
        setError("담당 개발자 정보를 가져올 수 없습니다. 다시 선택해주세요.");
        return;
      }

      try {
        setIsLoading(true);
        const updatedNode = await projectApi.updateNode(
          projectId,
          editingNode.projectNodeId,
          {
            title: newWorkflow.title,
            description: newWorkflow.description,
            developerUserId,
            startDate: newWorkflow.startDate,
            endDate: newWorkflow.endDate,
          },
        );

        const mappedNode = mapApiNodeToUiNode(updatedNode);

        setNodes((prev) =>
          prev.map((node) => {
            if (node.id !== editingNode.id) return node;
            return {
              ...node,
              title: mappedNode.title,
              description: mappedNode.description,
              developer: mappedNode.developer,
              developerUserId: mappedNode.developerUserId,
              startDate: mappedNode.startDate,
              endDate: mappedNode.endDate,
              status: mappedNode.status,
              updatedAt: mappedNode.updatedAt,
              approvalStatus: mappedNode.approvalStatus,
              approvalStatusLabel: mappedNode.approvalStatusLabel,
            };
          }),
        );

        setNewWorkflow(createWorkflowFormState());
        closeWorkflowModal();
      } catch (err) {
        setError(getErrorMessage(err, "노드 수정에 실패했습니다."));
      } finally {
        setIsLoading(false);
      }
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
      setError(getErrorMessage(err, "노드 생성에 실패했습니다."));
    } finally {
      setIsLoading(false);
    }
  };

  const syncNodeOrder = useCallback(
    async (orderedNodes: Node[]) => {
      if (!projectId) return;
      const orders = orderedNodes.map((node, index) => ({
        projectNodeId: node.projectNodeId,
        nodeOrder: index + 1,
      }));

      try {
        await projectApi.updateNodeOrder(projectId, orders);
      } catch (error) {
        console.error("노드 순서 갱신 실패:", error);
        setError(getErrorMessage(error, "노드 순서 변경에 실패했습니다."));
      }
    },
    [projectId, setError],
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
        nodeCategory: node.nodeCategory || "",
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
    async (node: Node) => {
      if (!projectId) return;
      const message = `"${node.title}" 단계를 삭제할까요? 이 작업은 되돌릴 수 없습니다.`;
      if (!window.confirm(message)) {
        return;
      }

      try {
        setIsLoading(true);
        await projectApi.deleteNode(projectId, node.projectNodeId);

        setNodes((prev) => prev.filter((item) => item.id !== node.id));

        if (editingNode && editingNode.id === node.id) {
          closeWorkflowModal();
        }
      } catch (err) {
        setError(getErrorMessage(err, "노드 삭제에 실패했습니다."));
      } finally {
        setIsLoading(false);
      }
    },
    [closeWorkflowModal, editingNode, projectId],
  );

  const openStatusModal = useCallback((node: Node) => {
    setStatusModalNode(node);
    setStatusModalStatus(node.status ?? "");
    setStatusModalApproval(node.approvalStatus ?? "");
  }, []);

  const closeStatusModal = useCallback(() => {
    setStatusModalNode(null);
    setStatusModalStatus("");
    setStatusModalApproval("");
    setIsStatusUpdating(false);
  }, []);

  useEffect(() => {
    if (!isApprovalRequired) {
      setStatusModalApproval("");
    }
  }, [isApprovalRequired]);

  const handleApplyStatusChange = useCallback(async () => {
    if (!projectId || !statusModalNode || !statusModalStatus || isStatusUpdating) {
      return;
    }
    if (isApprovalRequired && !statusModalApproval) {
      return;
    }

    setIsStatusUpdating(true);
    try {
      const apiStatus = mapUiStatusToApiStatus(statusModalStatus as NodeStatus);
      await projectApi.changeNodeStatus(projectId, statusModalNode.projectNodeId, apiStatus);
      setNodes((prev) =>
        prev.map((node) =>
          node.id === statusModalNode.id
            ? {
                ...node,
                status: statusModalStatus as NodeStatus,
                approvalStatus: isApprovalRequired
                  ? (statusModalApproval as ApprovalStatus)
                  : undefined,
                approvalStatusLabel:
                  isApprovalRequired && statusModalApproval
                    ? approvalStatusLabels[statusModalApproval as ApprovalStatus]
                    : undefined,
              }
            : node,
        ),
      );
      closeStatusModal();
    } catch (err) {
      setError(getErrorMessage(err, "노드 상태 변경에 실패했습니다."));
    } finally {
      setIsStatusUpdating(false);
    }
  }, [
    closeStatusModal,
    isApprovalRequired,
    isStatusUpdating,
    projectId,
    setError,
    statusModalApproval,
    statusModalNode,
    statusModalStatus,
  ]);

  useEffect(() => {
    if (!statusModalNode) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeStatusModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeStatusModal, statusModalNode]);

  return (
    <div className="space-y-6 pb-12">
      {isWorkflowModalOpen && (
        <ModalShell open onClose={closeWorkflowModal} maxWidth="var(--login-card-max-width, 42rem)">
          <div
            className="w-full max-h-[90vh]"
            style={{ maxWidth: "var(--login-card-max-width, 42rem)" }}
          >
            <div className="max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <Card variant="modal" className="login-theme border border-border shadow-lg">
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
                        <Label htmlFor="workflowCategory" className="text-gray-700">
                          카테고리
                        </Label>
                        <Select
                          value={newWorkflow.nodeCategory || ""}
                          onValueChange={(value) =>
                            setNewWorkflow((prev) => ({
                              ...prev,
                              nodeCategory: value as NodeCategory,
                            }))
                          }
                        >
                          <SelectTrigger
                            id="workflowCategory"
                            className="h-9 rounded-md border border-border bg-input-background px-3 py-1 focus:bg-white focus:border-primary transition-colors"
                          >
                            <SelectValue placeholder="카테고리를 선택하세요" />
                          </SelectTrigger>
                          <SelectContent>
                            {nodeCategoryOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                              <div
                                className="overflow-y-auto"
                                style={{ maxHeight: "9rem" }}
                              >
                                {visibleWorkflowDeveloperOptions.length > 0 ? (
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
                                        className={cn(
                                          "flex w-full items-center justify-between px-3 py-1.5 text-left text-sm transition-colors",
                                          isSelected ? "bg-primary/5 text-primary" : "hover:bg-accent/60",
                                        )}
                                      >
                                        <div className="flex items-center gap-3">
                                          <img
                                            src={developer.avatarUrl || "/default-profile.png"}
                                            alt={`${developer.name} 프로필`}
                                            className="h-6 w-6 rounded-full object-cover"
                                          />
                                          <div className="flex flex-col leading-tight">
                                            <span className="text-sm font-medium">
                                              {developer.name}
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
                                    개발자 목록이 없습니다.
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
        </ModalShell>
      )}

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight">
          {projectName ?? projectNameFromState ?? "노드 전체 상태"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          각 워크플로 단계의 진행 상황을 확인하고 필요한 세부 정보를 확인하세요.
        </p>
      </div>

      {statusModalNode && (
        <ModalShell open onClose={closeStatusModal} maxWidth="28rem">
          <Card variant="modal" className="login-theme border border-border shadow-lg">
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
                  value={statusModalStatus}
                  onValueChange={(value) => setStatusModalStatus(value as NodeStatus)}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                        {nodeStatusLabels[option]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>
              <div className="space-y-2">
                <Label>승인 상태</Label>
                <Select
                  value={statusModalApproval}
                  onValueChange={(value) => setStatusModalApproval(value as ApprovalStatus)}
                  disabled={!isApprovalRequired}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="승인 상태 선택" />
                  </SelectTrigger>
                    <SelectContent>
                      {approvalStatusOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                        {approvalStatusLabels[option]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                {!isApprovalRequired && (
                  <p className="text-xs text-muted-foreground">
                    시작 전 또는 진행 중 상태에서는 승인 단계를 선택할 수 없습니다.
                  </p>
                )}
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
                  disabled={!canApplyStatusChange || isStatusUpdating}
                  onClick={handleApplyStatusChange}
                >
                  {isStatusUpdating ? "변경 중..." : "적용"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </ModalShell>
      )}

      <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:hidden">
          <Input
            placeholder="작업을 검색하세요"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full"
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "전체" | NodeStatus)}>
              <SelectTrigger className="min-w-[140px]">
                <SelectValue placeholder="전체 상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="전체">전체 상태</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {nodeStatusLabels[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={approvalFilter} onValueChange={(value) => setApprovalFilter(value as ApprovalFilter)}>
              <SelectTrigger className="min-w-[140px]">
                <SelectValue placeholder="전체 승인" />
              </SelectTrigger>
              <SelectContent>
                {approvalFilterOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === "전체" ? "전체 승인" : approvalStatusLabels[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={developerFilter} onValueChange={(value) => setDeveloperFilter(value)}>
              <SelectTrigger className="min-w-[160px]">
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
          </div>
          <div className="flex items-center gap-2">
            {!isClient && (
              <Button className="h-9 px-4 text-sm flex-1" onClick={openWorkflowModal}>
                + 새 워크플로
              </Button>
            )}
            <Button
              variant="outline"
              className="h-9 px-4 text-sm flex-1"
              onClick={() => navigate(`/projects/${projectId ?? "project"}/nodes/support`)}
            >
              CS 문의
            </Button>
            {!isClient && (
              <Button
                variant={isReorderMode ? "default" : "outline"}
                className="h-9 px-4 text-sm flex-1"
                onClick={() => setIsReorderMode((prev) => !prev)}
              >
                {isReorderMode ? "편집 완료" : "편집"}
              </Button>
            )}
          </div>
        </div>

        <div className="hidden w-full gap-4 md:flex md:flex-row md:items-center md:flex-wrap">
          <Input
            placeholder="작업을 검색하세요"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-9 w-full md:flex-1 md:min-w-[360px]"
          />
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "전체" | NodeStatus)}>
            <SelectTrigger className="h-9 w-full md:w-48">
              <SelectValue placeholder="전체 상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="전체">전체 상태</SelectItem>
              {statusOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {nodeStatusLabels[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={approvalFilter} onValueChange={(value) => setApprovalFilter(value as ApprovalFilter)}>
            <SelectTrigger className="h-9 w-full md:w-48">
              <SelectValue placeholder="전체 승인" />
            </SelectTrigger>
            <SelectContent>
              {approvalFilterOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === "전체" ? "전체 승인" : approvalStatusLabels[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={developerFilter} onValueChange={(value) => setDeveloperFilter(value)}>
            <SelectTrigger className="h-9 w-full md:w-56">
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
          <div className="flex items-center gap-2 md:ml-auto">
            {!isClient && (
              <Button className="h-9 px-4 text-sm" onClick={openWorkflowModal}>
                + 새 워크플로
              </Button>
            )}
            <Button
              variant="outline"
              className="h-9 px-4 text-sm"
              onClick={() => navigate(`/projects/${projectId ?? "project"}/nodes/support`)}
            >
              CS 문의
            </Button>
            {!isClient && (
              <Button
                variant={isReorderMode ? "default" : "outline"}
                className="h-9 px-4 text-sm"
                onClick={() => setIsReorderMode((prev) => !prev)}
              >
                {isReorderMode ? "편집 완료" : "편집"}
              </Button>
            )}
          </div>
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
                  onNavigate={(selectedNode) =>
                    navigate(`/projects/${projectId ?? "project"}/nodes/${selectedNode.id}`, {
                      state: { nodeTitle: selectedNode.title },
                    })
                  }
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
              onNavigate={(selectedNode) =>
                navigate(`/projects/${projectId ?? "project"}/nodes/${selectedNode.id}`, {
                  state: { nodeTitle: selectedNode.title },
                })
              }
            />
          ))}
        </div>
      )}
        </>
      )}

    </div>
  );
}

interface NodeCardBaseProps {
  node: Node;
  formatDate: (value: string) => string;
  formatUpdatedAt: (value: string) => string;
  onNavigate: (node: Node) => void;
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
  const nodeCategoryLabel = node.nodeCategory ? nodeCategoryLabels[node.nodeCategory] ?? node.nodeCategory : "미지정";
  const handleCardClick = (event: MouseEvent<HTMLDivElement>) => {
    if (rightActions) {
      const target = event.target as HTMLElement;
      if (target.closest('[data-node-card-action="true"]')) {
        return;
      }
    }
    onNavigate(node);
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
                {nodeStatusLabels[node.status]}
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
                  {approvalStatusLabels[node.approvalStatus]}
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
          <div className="flex justify-between">
            <span className="text-muted-foreground">카테고리</span>
            <span className="font-medium">{nodeCategoryLabel}</span>
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
        onNavigate={(_node) => {}}
        rightActions={rightActions}
      />
    </div>
  );
}
