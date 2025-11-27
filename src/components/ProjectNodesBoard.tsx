import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Paperclip, Link as LinkIcon, Hash, MoreHorizontal } from "lucide-react";

type Priority = "Low" | "Medium" | "High" | "Critical";
type NodeStatus = "To Do" | "In Progress" | "Review" | "Done";

interface Node {
  id: string;
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
    title: "기획 단계",
    description: "요구사항 정의 및 페르소나 정리, 주요 기능 우선순위 확정",
    tags: ["#Planning", "#Research", "#Stakeholder"],
    filesCount: 4,
    linksCount: 3,
    priority: "High",
    status: "To Do",
    updatedAt: "2024-12-01T09:00:00Z",
    startDate: "2024-11-01",
    endDate: "2024-12-05",
    hasNotification: true,
  },
  {
    id: "design-101",
    title: "디자인 시안",
    description: "메인 페이지 와이어프레임과 UI 시스템 리뷰 및 수정",
    tags: ["#Design", "#UX", "#UI"],
    filesCount: 6,
    linksCount: 2,
    priority: "Medium",
    status: "In Progress",
    updatedAt: "2024-11-28T14:20:00Z",
    startDate: "2024-11-05",
    endDate: "2024-12-12",
    hasNotification: false,
  },
  {
    id: "dev-301",
    title: "프론트엔드 개발",
    description: "대시보드, 프로젝트 리스트, 워크플로우 뷰 구현",
    tags: ["#Development", "#Frontend", "#API"],
    filesCount: 3,
    linksCount: 4,
    priority: "Critical",
    status: "Review",
    updatedAt: "2024-12-02T11:45:00Z",
    startDate: "2024-11-10",
    endDate: "2024-12-22",
    hasNotification: true,
  },
  {
    id: "qa-210",
    title: "QA & 테스트",
    description: "시나리오 테스트 및 회귀 테스트, 릴리즈 전 이슈 목록 정리",
    tags: ["#Testing", "#QA"],
    filesCount: 2,
    linksCount: 1,
    priority: "High",
    status: "Done",
    updatedAt: "2024-12-03T08:15:00Z",
    startDate: "2024-12-01",
    endDate: "2024-12-29",
    hasNotification: false,
  },
];

const priorityOptions: Priority[] = ["Low", "Medium", "High", "Critical"];
const statusOptions: NodeStatus[] = ["To Do", "In Progress", "Review", "Done"];

export function ProjectNodesBoard() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [nodes, setNodes] = useState<Node[]>(defaultNodes);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | NodeStatus>("All");
  const [isCreateNodeOpen, setIsCreateNodeOpen] = useState(false);
  const [newNode, setNewNode] = useState({
    title: "",
    description: "",
    priority: "Medium" as Priority,
    startDate: "",
    endDate: "",
    tags: "",
  });

  const filteredNodes = useMemo(() => {
    const term = search.toLowerCase();
    return nodes.filter((node) => {
      const matchesSearch =
        node.title.toLowerCase().includes(term) ||
        node.description.toLowerCase().includes(term) ||
        node.tags.some((tag) => tag.toLowerCase().includes(term));
      const matchesStatus = statusFilter === "All" || node.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [nodes, search, statusFilter]);

  const handleCreateNode = () => {
    if (!newNode.title.trim()) return;
    const tagsArray = newNode.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));

    const node: Node = {
      id: crypto.randomUUID(),
      title: newNode.title,
      description: newNode.description,
      tags: tagsArray,
      filesCount: 0,
      linksCount: 0,
      priority: newNode.priority,
      status: "To Do",
      updatedAt: new Date().toISOString(),
      startDate: newNode.startDate,
      endDate: newNode.endDate,
      hasNotification: true,
    };

    setNodes((prev) => [node, ...prev]);
    setNewNode({
      title: "",
      description: "",
      priority: "Medium",
      startDate: "",
      endDate: "",
      tags: "",
    });
    setIsCreateNodeOpen(false);
  };

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

  const priorityTone: Record<Priority, string> = {
    Low: "bg-emerald-50 text-emerald-700",
    Medium: "bg-amber-50 text-amber-700",
    High: "bg-orange-50 text-orange-700",
    Critical: "bg-red-50 text-red-700",
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight">Project Nodes</h1>
        <p className="mt-2 text-muted-foreground">
          Review progress across each workflow step and drill into the details.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm md:flex-row md:items-center">
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="md:flex-1"
        />
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "All" | NodeStatus)}>
          <SelectTrigger className="md:w-52">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Status</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Dialog open={isCreateNodeOpen} onOpenChange={setIsCreateNodeOpen}>
            <DialogTrigger asChild>
              <Button className="h-9 px-4 text-sm">+ New Workflow</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Workflow Node</DialogTitle>
                <DialogDescription>새로운 단계를 생성하고 담당자와 일정을 공유하세요.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="node-title">단계명</Label>
                  <Input
                    id="node-title"
                    value={newNode.title}
                    onChange={(event) => setNewNode((prev) => ({ ...prev, title: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="node-description">요약</Label>
                  <Textarea
                    id="node-description"
                    value={newNode.description}
                    onChange={(event) => setNewNode((prev) => ({ ...prev, description: event.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="node-tags">해시태그 (쉼표로 구분)</Label>
                  <div className="relative">
                    <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="node-tags"
                      value={newNode.tags}
                      onChange={(event) => setNewNode((prev) => ({ ...prev, tags: event.target.value }))}
                      className="pl-9"
                      placeholder="#Design, #API"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="node-priority">우선순위</Label>
                    <Select
                      value={newNode.priority}
                      onValueChange={(value) => setNewNode((prev) => ({ ...prev, priority: value as Priority }))}
                    >
                      <SelectTrigger id="node-priority">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="node-start">시작일</Label>
                      <Input
                        id="node-start"
                        type="date"
                        value={newNode.startDate}
                        onChange={(event) => setNewNode((prev) => ({ ...prev, startDate: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="node-end">종료일</Label>
                      <Input
                        id="node-end"
                        type="date"
                        value={newNode.endDate}
                        onChange={(event) => setNewNode((prev) => ({ ...prev, endDate: event.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateNodeOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateNode}>Create</Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            className="h-9 px-4 text-sm"
            onClick={() => navigate(`/projects/${projectId ?? "project"}/nodes/support`)}
          >
            CS 문의
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {filteredNodes.map((node) => (
          <Card
            key={node.id}
            className="relative cursor-pointer rounded-2xl border border-white/70 bg-white/90 shadow-sm backdrop-blur transition-shadow hover:shadow-lg"
            onClick={() => navigate(`/projects/${projectId ?? "project"}/nodes/${node.id}`)}
          >
            {node.hasNotification && (
              <span className="absolute top-3 right-3 h-2 w-2 rounded-full" style={{ backgroundColor: "var(--point-color)" }} />
            )}
            <CardHeader className="@container/card-header space-y-2 px-6 pt-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Last update · {formatUpdatedAt(node.updatedAt)}</p>
                  <CardTitle className="text-xl">{node.title}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={node.status === "Done" ? "default" : "secondary"}>{node.status}</Badge>
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <CardDescription>{node.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6">
              <div className="flex flex-wrap gap-2">
                {node.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Files</span>
                  <span className="flex items-center gap-2 font-medium">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    {node.filesCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Links</span>
                  <span className="flex items-center gap-2 font-medium">
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    {node.linksCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timeline</span>
                  <span className="font-medium">
                    {formatDate(node.startDate)} – {formatDate(node.endDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority</span>
                  <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${priorityTone[node.priority]}`}>
                    {node.priority}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
