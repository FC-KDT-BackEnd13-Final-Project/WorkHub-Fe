import { CSSProperties, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Paperclip, Link as LinkIcon, MoreHorizontal, GripVertical } from "lucide-react";
import { Label } from "../ui/label";
import { AutoResizeTextarea } from "../ui/auto-resize-textarea";

// 프로젝트 내 노드(작업 카드)와 워크플로우를 관리하는 보드 화면
type Priority = "낮음" | "보통" | "높음" | "긴급";
type NodeStatus = "할 일" | "진행 중" | "검토 중" | "완료";

interface Node {
  id: string;
  projectNodeId: number;
  title: string;
  description: string;
  tags: string[];
  filesCount: number;
  linksCount: number;
  priority: Priority;
  status: NodeStatus;
  updatedAt: string;
  startDate: string;
  endDate: string;
  hasNotification: boolean;
}

const defaultNodes: Node[] = [
  {
    id: "plan-001",
    projectNodeId: 10,
    title: "기획 단계",
    description: "요구사항 정의 및 페르소나 정리, 주요 기능 우선순위 확정",
    tags: ["#기획", "#리서치", "#이해관계자"],
    filesCount: 4,
    linksCount: 3,
    priority: "높음",
    status: "할 일",
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
    priority: "보통",
    status: "진행 중",
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
    priority: "긴급",
    status: "검토 중",
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
    priority: "높음",
    status: "완료",
    updatedAt: "2024-12-03T08:15:00Z",
    startDate: "2024-12-01",
    endDate: "2024-12-29",
    hasNotification: false,
  },
];

const createWorkflowFormState = () => ({
  title: "",
  description: "",
  priority: "보통" as Priority,
  startDate: "",
  endDate: "",
});

const priorityOptions: Priority[] = ["낮음", "보통", "높음", "긴급"];
const statusOptions: NodeStatus[] = ["할 일", "진행 중", "검토 중", "완료"];

export function ProjectNodesBoard() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  console.log("ProjectNodesBoard - 현재 projectId:", projectId);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"전체" | NodeStatus>("전체");
  const [nodes, setNodes] = useState<Node[]>(defaultNodes);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState(createWorkflowFormState);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const nextProjectNodeId = useRef(
    defaultNodes.reduce((max, node) => Math.max(max, node.projectNodeId), 0) + 1,
  );
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
  );

  const filteredNodes = useMemo(() => {
    const term = search.toLowerCase();
    return nodes.filter((node) => {
      const matchesSearch =
        node.title.toLowerCase().includes(term) ||
        node.description.toLowerCase().includes(term) ||
        node.tags.some((tag) => tag.toLowerCase().includes(term));
      const matchesStatus = statusFilter === "전체" || node.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [nodes, search, statusFilter]);

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

  const priorityTone: Record<Priority, { bg: string; color: string; border: string }> = {
    낮음: { bg: "#ECFDF5", color: "#047857", border: "#A7F3D0" },
    보통: { bg: "#FFFBEB", color: "#B45309", border: "#FCD34D" },
    높음: { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" },
    긴급: { bg: "#FEF2F2", color: "#B91C1C", border: "#FECACA" },
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
    if (!isWorkflowModalOpen) {
      setIsWorkflowModalOpen(true);
    }
    if (location.pathname !== workflowModalPath) {
      console.log("workflowModalPath로 이동:", workflowModalPath);
      navigate(workflowModalPath, { replace: true });
    }
  }, [isWorkflowModalOpen, location.pathname, navigate, workflowModalPath]);

  const closeWorkflowModal = useCallback(() => {
    console.log("closeWorkflowModal 호출, 현재 isWorkflowModalOpen:", isWorkflowModalOpen);
    if (isWorkflowModalOpen) {
      setIsWorkflowModalOpen(false);
    }
    setNewWorkflow(createWorkflowFormState());
    if (location.pathname !== workflowBasePath) {
      console.log("workflowBasePath로 이동:", workflowBasePath);
      navigate(workflowBasePath, { replace: true });
    }
  }, [isWorkflowModalOpen, location.pathname, navigate, workflowBasePath]);

  useEffect(() => {
    const shouldOpen = location.pathname === workflowModalPath;
    console.log("useEffect [location.pathname, workflowModalPath] 실행");
    console.log("  location.pathname:", location.pathname);
    console.log("  workflowModalPath:", workflowModalPath);
    console.log("  shouldOpen:", shouldOpen);
    setIsWorkflowModalOpen(shouldOpen);
    if (!shouldOpen) {
      setNewWorkflow(createWorkflowFormState());
    }
  }, [location.pathname, workflowModalPath]);

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

  const handleCreateWorkflow = () => {
    if (!newWorkflow.title.trim()) return;
    if (!newWorkflow.startDate || !newWorkflow.endDate) return;
    if (new Date(newWorkflow.endDate) <= new Date(newWorkflow.startDate)) return;

    const node: Node = {
      id: crypto.randomUUID(),
      projectNodeId: nextProjectNodeId.current++,
      title: newWorkflow.title,
      description: newWorkflow.description,
      tags: [], // Tags are removed, so an empty array is passed
      filesCount: 0,
      linksCount: 0,
      priority: newWorkflow.priority,
      status: "할 일",
      updatedAt: new Date().toISOString(),
      startDate: newWorkflow.startDate,
      endDate: newWorkflow.endDate,
      hasNotification: true,
    };

    setNodes((prev) => [node, ...prev]);
    setNewWorkflow(createWorkflowFormState());
    closeWorkflowModal();
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

  return (
    <div className="space-y-6 pb-12">
      {isWorkflowModalOpen && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm flex items-center justify-end px-0">
          <div className="absolute inset-0" aria-hidden="true" onClick={closeWorkflowModal}></div>
          <div className="relative z-10 h-full max-w-lg w-full overflow-y-auto bg-white shadow-2xl border-l">
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="w-full" style={{ maxWidth: "var(--login-card-max-width, 42rem)" }}>
              <Card className="login-theme border border-border shadow-lg">
                <CardHeader className="space-y-2 pb-6">
                  <h2 className="text-xl text-center">새 워크플로 만들기</h2>
                  <p className="text-sm text-muted-foreground text-center">
                    새로운 워크플로 단계를 작성하고 세부 정보를 입력하세요.
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
                        className="w-full border rounded-md border-border bg-input-background px-3 py-2 focus:bg-white focus:border-primary transition-colors"
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
                        <Label htmlFor="workflowPriority" className="text-gray-700">
                          중요도
                        </Label>
                        <Select
                          value={newWorkflow.priority}
                          onValueChange={(value) =>
                            setNewWorkflow((prev) => ({ ...prev, priority: value as Priority }))
                          }
                        >
                                                  <SelectTrigger
                                                    id="workflowPriority"
                                                    className="h-9 rounded-md border border-border bg-input-background px-3 py-1 focus:bg-white focus:border-primary transition-colors"
                                                  >
                                                    <SelectValue placeholder="중요도" />
                                                  </SelectTrigger>                          <SelectContent>
                            {priorityOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-6 pt-6 flex justify-between gap-2">
                      <Button variant="secondary" className="w-1/2" onClick={closeWorkflowModal}>
                        취소
                      </Button>
                      <Button className="w-1/2" onClick={handleCreateWorkflow}>
                        생성
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
        <h1 className="text-3xl font-semibold tracking-tight">Project Nodes</h1>
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
                  priorityToneStyle={priorityTone[node.priority]}
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
              priorityToneStyle={priorityTone[node.priority]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface NodeCardBaseProps {
  node: Node;
  formatDate: (value: string) => string;
  formatUpdatedAt: (value: string) => string;
  onNavigate: (nodeId: string) => void;
  priorityToneStyle: { bg: string; color: string; border: string };
  rightActions?: ReactNode;
  cardRef?: (element: HTMLDivElement | null) => void;
  style?: CSSProperties;
}

function NodeCardBase({
  node,
  formatDate,
  formatUpdatedAt,
  onNavigate,
  priorityToneStyle,
  rightActions,
  cardRef,
  style,
}: NodeCardBaseProps) {
  return (
    <Card
      ref={cardRef}
      style={style}
      className="relative cursor-pointer rounded-2xl border border-white/70 bg-white/90 shadow-sm backdrop-blur transition-shadow hover:shadow-lg"
      onClick={() => onNavigate(node.id)}
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
          <div className="flex items-center gap-2">
            <Badge variant={node.status === "완료" ? "default" : "secondary"}>{node.status}</Badge>
            {rightActions}
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
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
            <span className="text-muted-foreground">중요도</span>
            <span
              className="rounded-full px-3 py-0.5 text-xs font-semibold"
              style={{
                backgroundColor: priorityToneStyle.bg,
                color: priorityToneStyle.color,
                border: `1px solid ${priorityToneStyle.border}`,
              }}
            >
              {node.priority}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
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
  priorityToneStyle,
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
        priorityToneStyle={priorityToneStyle}
      />
    </div>
  );
}
