import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { cn } from "./ui/utils";
import type { ProjectStatus } from "../types/project";

interface ProjectsListViewProps {
  onOpenCreateDialog: () => void;
}

interface Project {
  id: number;
  name: string;
  client: string;
  status: ProjectStatus;
  progress: number;
  dueDate: string;
}

const PROJECT_STATUS_STYLES: Record<ProjectStatus, { badgeClass: string }> = {
  진행중: {
    badgeClass: "bg-blue-50 text-blue-600",
  },
  대기: {
    badgeClass: "bg-amber-50 text-amber-600",
  },
  완료: {
    badgeClass: "bg-emerald-50 text-emerald-600",
  },
};

const MOCK_PROJECTS: Project[] = [
  {
    id: 1,
    name: "쇼핑몰 리뉴얼 프로젝트",
    client: "(주)테리컴퍼니",
    status: "진행중",
    progress: 65,
    dueDate: "2025-12-31",
  },
  {
    id: 2,
    name: "기업 홈페이지 구축",
    client: "(주)글로벌코리아",
    status: "진행중",
    progress: 40,
    dueDate: "2025-11-15",
  },
  {
    id: 3,
    name: "모바일 앱 개발",
    client: "스타트업A",
    status: "대기",
    progress: 10,
    dueDate: "2026-01-20",
  },
  {
    id: 4,
    name: "웹 서비스 유지보수",
    client: "(주)디지털플러스",
    status: "완료",
    progress: 100,
    dueDate: "2025-10-30",
  },
];

export function ProjectsListView({ onOpenCreateDialog }: ProjectsListViewProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"전체" | ProjectStatus>("전체");
  const [sort, setSort] = useState<"recent" | "old">("recent");

  const filteredProjects = MOCK_PROJECTS.filter((project) => {
    const keyword = search.toLowerCase();
    if (!keyword) return true;
    return (
      project.name.toLowerCase().includes(keyword) || project.client.toLowerCase().includes(keyword)
    );
  })
    .filter((project) => (statusFilter === "전체" ? true : project.status === statusFilter))
    .sort((a, b) => (sort === "recent" ? a.dueDate.localeCompare(b.dueDate) : b.dueDate.localeCompare(a.dueDate)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">프로젝트</h1>
          <p className="mt-1 text-sm text-muted-foreground">진행 중인 모든 프로젝트를 한눈에 확인하세요.</p>
        </div>
        <Button className="h-10 rounded-lg px-4" onClick={onOpenCreateDialog}>
          + 새 프로젝트
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px]">
          <Input
            placeholder="프로젝트 검색..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-10 rounded-lg bg-input-background border-slate-200"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "전체" | ProjectStatus)}>
            <SelectTrigger className="h-10 w-[120px] rounded-lg border-slate-200 bg-white">
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="전체">전체</SelectItem>
              <SelectItem value="진행중">진행중</SelectItem>
              <SelectItem value="대기">대기</SelectItem>
              <SelectItem value="완료">완료</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(value) => setSort(value as "recent" | "old")}>
            <SelectTrigger className="h-10 w-[140px] rounded-lg border-slate-200 bg-white">
              <SelectValue placeholder="최근 순" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">마감일 빠른 순</SelectItem>
              <SelectItem value="old">마감일 느린 순</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="rounded-2xl border-slate-200 shadow-sm transition-shadow hover:shadow-md">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{project.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{project.client}</p>
                </div>
                <Badge className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium", PROJECT_STATUS_STYLES[project.status].badgeClass)}>
                  {project.status}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>진행률</span>
                  <span className="font-medium text-slate-900">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-1.5 bg-slate-100" />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span role="img" aria-label="calendar">
                    📅
                  </span>
                  <span>{project.dueDate}</span>
                </div>
                <button className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
                  자세히 보기 <span>→</span>
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/40">
          <p className="text-sm text-muted-foreground">조건에 맞는 프로젝트가 없습니다. 검색어나 필터를 다시 확인해 주세요.</p>
        </div>
      )}

    </div>
  );
}
