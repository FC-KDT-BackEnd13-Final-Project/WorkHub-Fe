import { useMemo, useState } from "react";
import {
  AlarmClock,
  BarChart3,
  BellRing,
  Calendar,
  CheckCircle,
  ChevronRight,
  Flame,
  LineChart,
  ListChecks,
  MessageCircle,
  Pencil,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Progress } from "./ui/progress";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { cn } from "./ui/utils";

const navItems = [
  { id: "overview", label: "프로젝트 개요" },
  { id: "schedule", label: "캘린더" },
  { id: "tasks", label: "업무" },
  { id: "files", label: "자원" },
  { id: "team", label: "팀" },
] as const;

const summaryCards = [
  {
    label: "이번 주 마감",
    value: 6,
    subtext: "+2 신규 요청",
    icon: AlarmClock,
    accent: "from-sky-500/15 via-sky-500/25 to-sky-500/5",
  },
  {
    label: "진행 중 프로젝트",
    value: 4,
    subtext: "연체 1건",
    icon: LineChart,
    accent: "from-indigo-500/15 via-indigo-500/25 to-indigo-500/5",
  },
  {
    label: "승인 대기",
    value: 3,
    subtext: "UI 개선안, 계정 요청",
    icon: ShieldCheck,
    accent: "from-emerald-500/15 via-emerald-500/25 to-emerald-500/5",
  },
] as const;

const projectPipelines = [
  {
    name: "모바일 뱅킹 UX 리뉴얼",
    company: "코어뱅크",
    progress: 82,
    owner: "김지은",
    status: "디자인 QA",
    priority: "긴급",
  },
  {
    name: "웨어러블 헬스 앱",
    company: "핏앤굿",
    progress: 56,
    owner: "박건희",
    status: "개발 진행",
    priority: "보통",
  },
  {
    name: "클라우드 관제 대시보드",
    company: "알파시큐어",
    progress: 34,
    owner: "최연서",
    status: "요구사항 확정",
    priority: "주의",
  },
] as const;

const taskColumns = {
  today: [
    { title: "디자인 QA", project: "모바일 뱅킹", assignee: "김지은" },
    { title: "데이터 연동 체크", project: "헬스 앱", assignee: "박건희" },
  ],
  review: [
    { title: "화면 흐름 승인", project: "헬스 앱", assignee: "김지은" },
    { title: "보안 문서 검토", project: "클라우드 관제", assignee: "최연서" },
  ],
  blocked: [{ title: "하자 처리 내역 회신", project: "스마트홈", assignee: "이윤영" }],
} as const;

const timelineItems = [
  {
    title: "UI 승인 요청",
    body: "고객 검토 완료, 최종 승인이 필요합니다.",
    time: "10:30",
    badge: "긴급",
  },
  {
    title: "하자 처리 내역 업데이트",
    body: "스마트홈 12차 배포 이후 수리 완료 보고",
    time: "09:10",
    badge: "업데이트",
  },
  {
    title: "신규 프로젝트 킥오프",
    body: "웨어러블 헬스 앱 2차 범위 확정 회의",
    time: "어제",
  },
] as const;

const teamMembers = [
  { name: "김지은", role: "PM", initial: "J", workload: 78 },
  { name: "박건희", role: "UX Lead", initial: "G", workload: 64 },
  { name: "최연서", role: "Frontend", initial: "Y", workload: 51 },
  { name: "이윤영", role: "CS", initial: "Y", workload: 46 },
] as const;

const files = [
  { title: "02_UI-flow_v5.fig", project: "모바일 뱅킹", size: "4.2MB" },
  { title: "handover-checklist.xlsx", project: "클라우드 관제", size: "1.1MB" },
  { title: "client-brief.pdf", project: "웨어러블 헬스", size: "850KB" },
] as const;

export function Dashboard() {
  const [activeNav, setActiveNav] = useState<(typeof navItems)[number]["id"]>("overview");
  const [search, setSearch] = useState("");

  const filteredProjects = useMemo(() => {
    if (!search.trim()) return projectPipelines;
    return projectPipelines.filter((project) =>
      project.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search]);

  return (
    <div className="h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex h-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-3xl bg-white/80 p-6 shadow-sm ring-1 ring-slate-100 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="border-slate-200 text-xs uppercase tracking-wide">
              Workhub 2.0
            </Badge>
            <div className="ms-auto flex items-center gap-3">
              <Button variant="ghost" className="gap-2 px-3">
                <Calendar className="h-4 w-4" />
                오늘 일정
              </Button>
              <Button variant="outline" size="icon" className="rounded-full border-slate-200">
                <BellRing className="h-4 w-4" />
              </Button>
              <Avatar className="h-9 w-9 border border-slate-200">
                <AvatarFallback>JH</AvatarFallback>
              </Avatar>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-6">
            <div>
              <p className="text-sm text-muted-foreground">2024년 11월 28일 목요일</p>
              <h1 className="text-3xl font-semibold">워크플로 허브</h1>
            </div>
            <div className="flex flex-1 flex-wrap gap-3 md:justify-end">
              <Input
                placeholder="프로젝트 검색"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full min-w-[240px] border-slate-200 md:w-64"
              />
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                새 프로젝트
              </Button>
            </div>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={activeNav === item.id ? "secondary" : "ghost"}
                className={cn(
                  "rounded-full px-4 text-sm",
                  activeNav === item.id ? "bg-slate-900 text-white" : "text-slate-500",
                )}
                onClick={() => setActiveNav(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </nav>
        </header>

        <div className="grid flex-1 grid-rows-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <ScrollArea className="h-full rounded-3xl bg-white/80 p-6 shadow-sm ring-1 ring-slate-100 backdrop-blur">
            <div className="flex flex-col gap-6">
              <HeroBanner />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {summaryCards.map((card) => (
                  <Card key={card.label} className="border-none bg-gradient-to-br shadow-sm" style={{}}>
                    <div className={cn("rounded-2xl bg-gradient-to-br p-1", card.accent)}>
                      <Card className="border-none bg-white/90">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium text-slate-500">{card.label}</CardTitle>
                          <card.icon className="h-4 w-4 text-slate-400" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-semibold">{card.value}</div>
                          <p className="mt-2 text-sm text-slate-500">{card.subtext}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </Card>
                ))}
              </div>

              <Card className="border-none bg-slate-900 text-white">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-medium">프로젝트 파이프라인</CardTitle>
                    <CardDescription className="text-white/60">
                      고객사와 진행 단계를 한 눈에 확인하세요.
                    </CardDescription>
                  </div>
                  <Button variant="secondary" className="gap-2 rounded-full bg-white/10 text-white hover:bg-white/20">
                    전체 보기
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {filteredProjects.map((project) => (
                    <div
                      key={project.name}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-white/30"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <div>
                          <p className="text-sm text-white/70">{project.company}</p>
                          <p className="text-base font-medium">{project.name}</p>
                        </div>
                        <Badge variant="secondary" className="ms-auto rounded-full bg-white/10 text-white">
                          {project.status}
                        </Badge>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-4">
                        <div className="min-w-[120px] flex-1">
                          <Progress value={project.progress} className="h-1.5 bg-white/20" />
                        </div>
                        <p className="text-sm text-white/70">{project.progress}%</p>
                        <div className="flex items-center gap-2 text-sm text-white/70">
                          <Users className="h-4 w-4" />
                          {project.owner}
                        </div>
                        <Badge
                          className={cn(
                            "rounded-full px-3 text-xs",
                            project.priority === "긴급"
                              ? "bg-rose-500/20 text-rose-100"
                              : project.priority === "주의"
                                ? "bg-amber-400/30 text-amber-100"
                                : "bg-emerald-400/30 text-emerald-100",
                          )}
                        >
                          {project.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Tabs defaultValue="today" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">업무 현황</h2>
                    <p className="text-sm text-muted-foreground">팀 요청과 승인 대기 건을 추적하세요.</p>
                  </div>
                  <TabsList className="bg-slate-100">
                    <TabsTrigger value="today">오늘</TabsTrigger>
                    <TabsTrigger value="review">검토 요청</TabsTrigger>
                    <TabsTrigger value="blocked">보류</TabsTrigger>
                  </TabsList>
                </div>

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
                          <Badge variant="outline" className="rounded-full">{task.assignee}</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                ))}
              </Tabs>

              <Card className="border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>팀 집중도</CardTitle>
                    <CardDescription>누가 어느 업무에 집중하고 있는지 살펴보세요.</CardDescription>
                  </div>
                  <Button variant="ghost" className="gap-2 px-3">
                    <Pencil className="h-4 w-4" />
                    역할 조정
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {teamMembers.map((member) => (
                    <div key={member.name} className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 border border-slate-200">
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
            </div>
          </ScrollArea>

          <div className="flex h-full flex-col gap-6">
            <Card className="flex flex-1 flex-col border-none bg-white/80 shadow-sm ring-1 ring-slate-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  실시간 타임라인
                </CardTitle>
                <CardDescription>고객 커뮤니케이션과 활동 로그</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                {timelineItems.map((item, index) => (
                  <div key={item.title} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-slate-900" />
                      {index !== timelineItems.length - 1 && <div className="h-full w-px bg-slate-200" />}
                    </div>
                    <div className="flex-1 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{item.title}</p>
                        {item.badge && (
                          <Badge className="rounded-full bg-rose-100 text-rose-600" variant="secondary">
                            {item.badge}
                          </Badge>
                        )}
                        <span className="ms-auto text-xs text-muted-foreground">{item.time}</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-none bg-slate-900 text-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-rose-200" />
                  집중 케어
                </CardTitle>
                <CardDescription className="text-white/60">고객 이슈 및 보류 건 요약</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-rose-500/20 p-2">
                      <MessageCircle className="h-4 w-4 text-rose-200" />
                    </div>
                    <div>
                      <p className="font-medium">스마트홈 고객</p>
                      <p className="text-sm text-white/70">하자 처리 답변 지연, 오늘 중 회신 필요</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 p-4 text-sm text-white/80">
                  고객 지원 SLA 4시간 남았습니다. 필요 시 CS팀에 바로 연결하세요.
                </div>
                <Button className="w-full gap-2 bg-white text-slate-900 hover:bg-slate-100">
                  <CheckCircle className="h-4 w-4" />
                  해결 완료로 표시
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none bg-white/80 shadow-sm ring-1 ring-slate-100">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>공유된 파일</CardTitle>
                  <CardDescription>마지막으로 업데이트된 자료</CardDescription>
                </div>
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {files.map((file) => (
                  <div
                    key={file.title}
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3"
                  >
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
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroBanner() {
  return (
    <Card className="border-none bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
      <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center">
        <div className="space-y-3">
          <Badge className="rounded-full bg-white/10 text-xs font-medium uppercase tracking-wide text-white/80">
            End-to-End Workflow
          </Badge>
          <h2 className="text-2xl font-semibold leading-tight md:text-3xl">
            계약부터 하자보수까지,
            <br />
            하나의 화면에서 흐름을 유지하세요.
          </h2>
          <p className="text-sm text-white/80">
            프로젝트 히스토리, 승인 내역, 커뮤니케이션을 단일 콘솔에서 확인하고 공유하세요.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge className="rounded-full bg-white/15 px-3 text-white">권한 기반 뷰</Badge>
            <Badge className="rounded-full bg-white/15 px-3 text-white">자동 리마인더</Badge>
            <Badge className="rounded-full bg-white/15 px-3 text-white">실시간 로그</Badge>
          </div>
        </div>
        <div className="ms-auto flex min-w-[220px] flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div>
            <p className="text-sm text-white/70">이번 주 속도</p>
            <p className="text-3xl font-semibold">87%</p>
          </div>
          <div>
            <p className="text-sm text-white/70">하자 처리 완료율</p>
            <Progress value={72} className="h-2 bg-white/20" />
            <p className="mt-1 text-sm text-white/70">지난주 대비 +6%</p>
          </div>
          <Button variant="secondary" className="gap-2 rounded-full bg-white text-slate-900 hover:bg-slate-100">
            <ListChecks className="h-4 w-4" />
            전체 업무 보기
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
