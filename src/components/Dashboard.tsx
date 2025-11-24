import { useMemo, useState } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BellRing,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  FolderKanban,
  Layers3,
  LineChart,
  Menu,
  MessageSquare,
  Plus,
  Settings as SettingsIcon,
  Target,
  Users,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Progress } from "./ui/progress";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { cn } from "./ui/utils";
import { ProjectsListView } from "./ProjectsListView";
import { ProjectCreateDialog } from "./ProjectCreateDialog";

const navigationItems = [
  { id: "overview", label: "대시보드", icon: Layers3 },
  { id: "projects", label: "프로젝트", icon: FolderKanban },
  { id: "tasks", label: "업무", icon: Briefcase },
  { id: "teams", label: "팀", icon: Users },
  { id: "resources", label: "자원", icon: Activity },
  { id: "insights", label: "리포트", icon: LineChart },
  { id: "notifications", label: "알림", icon: Bell },
  { id: "settings", label: "설정", icon: SettingsIcon },
] as const;

const summaryMetrics = [
  { title: "진행 중 프로젝트", value: 12, delta: "+2 this week", accent: "text-slate-900 dark:text-white" },
  { title: "이번 주 마감", value: 8, delta: "3 긴급", accent: "text-rose-600 dark:text-rose-200" },
  { title: "리소스 가용률", value: "72%", delta: "정상", accent: "text-emerald-600 dark:text-emerald-200" },
  { title: "고객 만족도", value: "4.6/5", delta: "지난달 대비 +0.2", accent: "text-indigo-600 dark:text-indigo-200" },
];

const executionStats = [
  {
    name: "스마트홈 고도화",
    pm: "김지은",
    stage: "QA 진행",
    completion: 76,
    budget: "63% 사용",
    risk: "낮음",
  },
  {
    name: "헬스케어 앱",
    pm: "박건희",
    stage: "개발",
    completion: 54,
    budget: "38% 사용",
    risk: "주의",
  },
  {
    name: "클라우드 관제",
    pm: "최연서",
    stage: "요구사항 확정",
    completion: 31,
    budget: "22% 사용",
    risk: "낮음",
  },
];

const healthSignals = [
  { label: "디자인 QA", owner: "Design", due: "11/30", status: "대기", level: "warning" },
  { label: "데이터 마이그레이션", owner: "Backend", due: "12/02", status: "진행", level: "critical" },
  { label: "고객 승인", owner: "CS", due: "12/05", status: "검토", level: "normal" },
];

const timelineUpdates = [
  {
    title: "모바일 뱅킹 2.1 배포 완료",
    body: "테스트 자동화 128건 성공 · 롤백 없음",
    actor: "DevOps",
    time: "1시간 전",
  },
  {
    title: "헬스케어 앱 디자인 승인",
    body: "고객사 파트너가 신규 온보딩 플로우 승인",
    actor: "Design",
    time: "3시간 전",
  },
  {
    title: "스마트홈 결함 리포트",
    body: "하자 처리 SLA 2건 완료, 1건 보류",
    actor: "CS",
    time: "어제",
  },
];

const backlogItems = [
  { title: "신규 고객 온보딩 모듈", severity: "긴급", owner: "Frontend", eta: "3일" },
  { title: "데이터 아카이브 정책", severity: "보통", owner: "Infra", eta: "7일" },
  { title: "모바일 푸시 개인화", severity: "낮음", owner: "Product", eta: "14일" },
];

const capacityMatrix = [
  { team: "Design", allocated: 82, available: 18 },
  { team: "Frontend", allocated: 74, available: 26 },
  { team: "Backend", allocated: 91, available: 9 },
  { team: "QA", allocated: 63, available: 37 },
];

const riskRegister = [
  {
    title: "클라우드 비용 변동",
    impact: "Medium",
    owner: "Infra",
    action: "커밋 할인 재협상",
  },
  {
    title: "요구사항 변경",
    impact: "High",
    owner: "PMO",
    action: "고객 워크숍 일정 조율",
  },
  {
    title: "외부 벤더 지연",
    impact: "Medium",
    owner: "Ops",
    action: "대체 공급사 검토",
  },
];

export function Dashboard() {
  const [currentView, setCurrentView] = useState<(typeof navigationItems)[number]["id"]>("overview");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleOpenCreateDialog = () => setIsCreateDialogOpen(true);

  const placeholder = () => (
    <Card>
      <CardHeader>
        <CardTitle>{navigationItems.find((item) => item.id === currentView)?.label}</CardTitle>
        <CardDescription>이 섹션은 아직 작성되지 않았습니다. 필요한 요구 사항을 알려주시면 구성해 드릴게요.</CardDescription>
      </CardHeader>
    </Card>
  );

  const renderView = () => {
    switch (currentView) {
      case "overview":
        return <OverviewBoard onOpenCreateDialog={handleOpenCreateDialog} />;
      case "projects":
        return <ProjectsListView onOpenCreateDialog={handleOpenCreateDialog} />;
      default:
        return placeholder();
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <DashboardSidebar currentView={currentView} onViewChange={setCurrentView} />
      <div className="flex w-full flex-col">
        <div className="px-6 pt-6" />
        <ScrollArea className="flex-1">
          <div className="w-full space-y-8 px-6 py-8">{renderView()}</div>
        </ScrollArea>
      </div>
      <ProjectCreateDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </div>
  );
}

function OverviewBoard({ onOpenCreateDialog }: { onOpenCreateDialog: () => void }) {
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-6 rounded-3xl bg-gradient-to-br from-slate-100 via-white to-slate-100 p-8 text-slate-900 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:text-white">
        <div className="space-y-3">
          <Badge className="rounded-full bg-slate-900/10 px-4 py-1 text-xs uppercase tracking-wide text-slate-800 dark:bg-white/15 dark:text-white/80">
            Enterprise Delivery
          </Badge>
          <h2 className="text-3xl font-semibold leading-tight">프로젝트 전 과정을 한 화면에서 관리하세요.</h2>
          <p className="text-sm text-slate-700 dark:text-white/80">
            계약, 실행, QA, 하자보수까지 연결된 워크플로우를 확인하고 리스크를 선제적으로 관리합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          {summaryMetrics.map((metric) => (
            <Card key={metric.title} className="min-w-[220px] border border-slate-200 bg-white text-slate-900 backdrop-blur dark:border-none dark:bg-white/10 dark:text-white">
              <CardHeader className="space-y-1">
                <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground dark:text-white/70">
                  {metric.title}
                </CardDescription>
                <CardTitle className={cn("text-2xl font-semibold", metric.accent)}>{metric.value}</CardTitle>
                <p className="text-sm text-muted-foreground dark:text-white/70">{metric.delta}</p>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-none bg-white shadow-sm ring-1 ring-slate-100">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>실행 중인 프로그램</CardTitle>
              <CardDescription>우선순위가 높은 프로젝트의 건강 상태</CardDescription>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="프로젝트 검색"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-48"
              />
              <Button variant="outline" className="gap-2" onClick={onOpenCreateDialog}>
                <Plus className="h-4 w-4" /> 새 프로젝트
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {executionStats
              .filter((stat) => stat.name.toLowerCase().includes(search.toLowerCase()))
              .map((stat) => (
                <div key={stat.name} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <p className="text-base font-semibold text-slate-900">{stat.name}</p>
                      <p className="text-sm text-muted-foreground">PM {stat.pm} · {stat.stage}</p>
                    </div>
                    <Badge variant="outline" className="ms-auto text-xs">
                      {stat.budget}
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>진척률</span>
                      <span>{stat.completion}%</span>
                    </div>
                    <Progress value={stat.completion} className="mt-1" />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <Badge
                      className={cn(
                        "rounded-full px-3",
                        stat.risk === "주의" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700",
                      )}
                    >
                      리스크 {stat.risk}
                    </Badge>
                    <Button variant="ghost" size="sm" className="gap-1 text-slate-600">
                      상세 보기 <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>

        <Card className="border-none bg-white shadow-sm ring-1 ring-slate-100">
          <CardHeader>
            <CardTitle>헬스 신호</CardTitle>
            <CardDescription>대응이 필요한 지표를 추적하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {healthSignals.map((signal) => (
              <div key={signal.label} className="rounded-2xl border border-slate-100 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full",
                      signal.level === "critical"
                        ? "bg-rose-100 text-rose-600"
                        : signal.level === "warning"
                          ? "bg-amber-100 text-amber-600"
                          : "bg-emerald-100 text-emerald-600",
                    )}
                  >
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{signal.label}</p>
                    <p className="text-sm text-muted-foreground">담당: {signal.owner}</p>
                  </div>
                  <Badge variant="secondary">{signal.due}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle>실시간 타임라인</CardTitle>
            <CardDescription>최근 활동과 고객 피드백</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {timelineUpdates.map((update, index) => (
              <div key={update.title} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-2 w-2 rounded-full bg-slate-900" />
                  {index !== timelineUpdates.length - 1 && <div className="h-full w-px bg-slate-200" />}
                </div>
                <div className="flex-1 rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-900">{update.title}</p>
                    <Badge variant="outline" className="text-xs">
                      {update.actor}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{update.body}</p>
                  <p className="mt-2 text-xs text-slate-500">{update.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle>팀 작업 대기열</CardTitle>
            <CardDescription>중요도가 높은 요청을 우선 처리하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {backlogItems.map((item) => (
              <div key={item.title} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
                <div>
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="text-sm text-muted-foreground">담당: {item.owner}</p>
                </div>
                <div className="text-right">
                  <Badge
                    className={cn(
                      "mb-1 rounded-full",
                      item.severity === "긴급"
                        ? "bg-rose-100 text-rose-600"
                        : item.severity === "보통"
                          ? "bg-amber-100 text-amber-600"
                          : "bg-emerald-100 text-emerald-600",
                    )}
                  >
                    {item.severity}
                  </Badge>
                  <p className="text-xs text-muted-foreground">ETA {item.eta}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle>리스크 레지스터</CardTitle>
            <CardDescription>선제적 대응이 필요한 항목</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {riskRegister.map((risk) => (
              <div key={risk.title} className="rounded-xl border border-slate-100 px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">{risk.title}</p>
                  <Badge variant="outline">{risk.impact}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Owner: {risk.owner}</p>
                <p className="text-sm text-slate-700">Action: {risk.action}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle>리소스 사용량</CardTitle>
            <CardDescription>팀별 투입/가용 비율</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {capacityMatrix.map((team) => (
              <div key={team.team} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{team.team}</span>
                  <span className="text-muted-foreground">가용 {team.available}%</span>
                </div>
                <Progress value={team.allocated} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function TasksSection() {
  return (
    <Card className="border border-slate-200">
      <CardHeader>
        <CardTitle>업무 현황</CardTitle>
        <CardDescription>팀 요청과 승인 대기 건을 추적하세요.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="today" className="space-y-4">
          <TabsList className="bg-slate-100">
            <TabsTrigger value="today">오늘</TabsTrigger>
            <TabsTrigger value="review">검토 요청</TabsTrigger>
            <TabsTrigger value="blocked">보류</TabsTrigger>
          </TabsList>
          {Object.entries(taskColumns).map(([column, tasks]) => (
            <TabsContent key={column} value={column} className="space-y-3">
              {tasks.map((task) => (
                <Card key={`${column}-${task.title}`} className="border-slate-200">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="rounded-full bg-slate-900/5 p-2">
                      <ListChecks className="h-4 w-4 text-slate-700" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">{task.project}</p>
                    </div>
                    <Badge variant="outline" className="rounded-full">
                      {task.assignee}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

function FilesSection() {
  return (
    <Card className="border-none bg-white/80 shadow-sm ring-1 ring-slate-100">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>공유된 파일</CardTitle>
          <CardDescription>마지막으로 업데이트된 자료</CardDescription>
        </div>
        <Button variant="ghost" size="icon">
          <FileText className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {files.map((file) => (
          <div key={file.title} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3">
            <div className="rounded-xl bg-slate-900/5 p-3">
              <BarChart3 className="h-4 w-4 text-slate-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{file.title}</p>
              <p className="text-sm text-muted-foreground">{file.project}</p>
            </div>
            <span className="text-sm text-muted-foreground">{file.size}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function TeamSection() {
  return (
    <Card className="border border-slate-200">
      <CardHeader>
        <CardTitle>팀 집중도</CardTitle>
        <CardDescription>구성원별 업무 상태</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {teamMembers.map((member) => (
          <div key={member.name} className="flex items-center gap-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{member.initial}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-medium">{member.name}</p>
                <span className="text-sm text-muted-foreground">{member.workload}%</span>
              </div>
              <Progress value={member.workload} className="h-2" />
              <p className="text-sm text-muted-foreground">{member.role}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PlaceholderSection({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>추가 요구 사항에 맞춰 템플릿을 확장할 수 있습니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          필요한 API, 데이터 연결, UI 구성을 말씀해 주세요.
        </p>
      </CardContent>
    </Card>
  );
}

function DashboardSidebar({
  currentView,
  onViewChange,
}: {
  currentView: string;
  onViewChange: (view: (typeof navigationItems)[number]["id"]) => void;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const mainItems = navigationItems.slice(0, 6);
  const bottomItems = navigationItems.slice(6);

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-card">
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                  Logo
              </div>
              <div>
                <h2 className="font-semibold">김지은</h2>
                <p className="text-xs text-muted-foreground">Work Hub</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => setIsCollapsed((prev) => !prev)}>
              <Menu className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-2 p-4">
        {mainItems.map((item) => (
          <Button
            key={item.id}
            variant={currentView === item.id ? "secondary" : "ghost"}
            className={cn("w-full justify-start", isCollapsed && "justify-center px-2")}
            onClick={() => {
              onViewChange(item.id);
              setIsMobileOpen(false);
            }}
          >
            <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
            {!isCollapsed && <span>{item.label}</span>}
          </Button>
        ))}
      </nav>
      <div className="border-t p-4 space-y-2">
        {bottomItems.map((item) => (
          <Button
            key={item.id}
            variant={currentView === item.id ? "secondary" : "ghost"}
            className={cn("w-full justify-start", isCollapsed && "justify-center px-2")}
            onClick={() => {
              onViewChange(item.id);
              setIsMobileOpen(false);
            }}
          >
            <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
            {!isCollapsed && <span>{item.label}</span>}
          </Button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-40 md:hidden"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu className="h-4 w-4" />
      </Button>
      {isMobileOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setIsMobileOpen(false)} />}
      <div
        className={cn(
          "hidden h-full flex-col border-r border-slate-200 bg-card transition-all duration-300 md:flex",
          isCollapsed ? "w-16" : "w-[240px]",
        )}
      >
        <SidebarContent />
      </div>
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 bg-card transition-transform duration-300 md:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent />
      </div>
    </>
  );
}
