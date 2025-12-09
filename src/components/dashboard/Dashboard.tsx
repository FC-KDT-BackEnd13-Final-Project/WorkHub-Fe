import { useEffect, useRef, useState } from "react";
import { LayoutDashboard, Users, CheckCircle, TrendingUp, PlusCircle, PenSquare, Trash2, MoveRight, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { companyUsers } from "../admin/userData";

const statusSlices = [
  { label: "Planning", value: 12, color: "#0ea5e9" },
  { label: "Design", value: 16, color: "#6366f1" },
  { label: "Development", value: 28, color: "#10b981" },
  { label: "QA", value: 10, color: "#f97316" },
  { label: "Release", value: 6, color: "#ec4899" },
  { label: "Maintenance", value: 8, color: "#22d3ee" },
];

const donutTotal = statusSlices.reduce((sum, slice) => sum + slice.value, 0);
const donutSegments = (() => {
  let cumulative = 0;
  return statusSlices.map((slice) => {
    const percentage = (slice.value / donutTotal) * 100;
    const dasharray = `${percentage} ${100 - percentage}`;
    const dashoffset = 25 - cumulative;
    cumulative += percentage;
    return { slice, dasharray, dashoffset };
  });
})();

const totalUsers = companyUsers.length;
const totalCompanies = Array.from(new Set(companyUsers.map((user) => user.company).filter(Boolean))).length;
const totalProjects = (() => {
  const ids = new Set<string>();
  companyUsers.forEach((user) => {
    user.projects?.forEach((project) => {
      if (project?.id) {
        ids.add(project.id);
      }
    });
  });
  return ids.size;
})();

const summaryMetrics = [
  { title: "총 유저", value: totalUsers.toLocaleString("ko-KR"), change: "등록된 전체 사용자", icon: Users },
  { title: "총 회사", value: totalCompanies.toLocaleString("ko-KR"), change: "등록된 고객사 수", icon: LayoutDashboard },
  { title: "총 프로젝트", value: totalProjects.toLocaleString("ko-KR"), change: "진행/완료 포함", icon: CheckCircle },
];

const trendMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const trendSeries = {
  users: [8, 12, 15, 18, 20, 22, 24, 26, 27, 28, 29, 30],
  projects: [6, 9, 8, 12, 14, 16, 18, 19, 21, 23, 25, 26],
};

const trendColors = {
  users: { stroke: "#a855f7", gradient: "#22d3ee" },
  projects: { stroke: "#0ea5e9", gradient: "#f97316" },
} as const;

const historyEvents = [
  { id: 1, type: "create", message: "웹사이트 리디자인 페이즈2 킥오프 회의", timestamp: "오늘 · 09:10" },
  { id: 2, type: "update", message: "프로젝트 예산안_최종.xlsx 업로드", timestamp: "오늘 · 08:45" },
  { id: 3, type: "delete", message: "모바일 QA 체크리스트 검수 완료", timestamp: "어제 · 19:20" },
  { id: 4, type: "move", message: "새 팀원 2명이 포털에 로그인했습니다", timestamp: "어제 · 08:05" },
  { id: 5, type: "hide", message: "데이터 시각화 대시보드 초안 공유", timestamp: "11월 20일 · 15:40" },
  { id: 6, type: "create", message: "Sprint51_Report.pdf 업로드", timestamp: "11월 19일 · 18:10" },
  { id: 7, type: "update", message: "CX 팀 대시보드 리팩토링 완료", timestamp: "11월 18일 · 17:20" },
  { id: 8, type: "move", message: "파트너 온보딩 플로우 개선안 리뷰", timestamp: "11월 17일 · 11:05" },
  { id: 9, type: "hide", message: "비즈니스 제안서 v3.pdf 업로드", timestamp: "11월 15일 · 16:55" },
  { id: 10, type: "create", message: "외부 컨설턴트 3명이 초기 접근", timestamp: "11월 14일 · 09:40" },
  { id: 11, type: "update", message: "CRM 마이그레이션 점검 완료", timestamp: "11월 13일 · 20:10" },
  { id: 12, type: "delete", message: "신규 API 문서화 작업 공유", timestamp: "11월 12일 · 14:25" },
  { id: 13, type: "move", message: "서비스 UX_최종시안.fig 업로드", timestamp: "11월 11일 · 18:40" },
  { id: 14, type: "hide", message: "계약 담당자 3명이 재로그인했습니다", timestamp: "11월 10일 · 09:15" },
  { id: 15, type: "create", message: "데이터 이관 자동화 시나리오 완료", timestamp: "11월 09일 · 21:05" },
  { id: 16, type: "update", message: "보안 점검 결과 공유 및 피드백 수렴", timestamp: "11월 08일 · 13:20" },
  { id: 17, type: "move", message: "북미 세일즈 손익 보고서 업로드", timestamp: "11월 07일 · 19:30" },
  { id: 18, type: "hide", message: "CX팀 신규 플로우 QA 로그 공유", timestamp: "11월 06일 · 14:45" },
  { id: 19, type: "delete", message: "협력사 4명이 워크스페이스에 접속", timestamp: "11월 05일 · 10:20" },
  { id: 20, type: "create", message: "인프라 점검 체크리스트 완료", timestamp: "11월 04일 · 23:10" },
  { id: 21, type: "update", message: "OKR_Q4_트래킹.xlsx 업로드", timestamp: "11월 03일 · 18:05" },
];

const historyPalette: Record<
  string,
  {
    icon: JSX.Element;
    iconBg: string;
    iconColor: string;
    cardBg: string;
    border: string;
    textColor: string;
    subTextColor: string;
  }
> = {
  create: {
    icon: <PlusCircle className="h-4 w-4" />,
    iconBg: "#DCFCE7",
    iconColor: "#047857",
    cardBg: "linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 100%)",
    border: "#A7F3D0",
    textColor: "#064E3B",
    subTextColor: "#10B981",
  },
  update: {
    icon: <PenSquare className="h-4 w-4" />,
    iconBg: "#DBEAFE",
    iconColor: "#1D4ED8",
    cardBg: "linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%)",
    border: "#BFDBFE",
    textColor: "#1E3A8A",
    subTextColor: "#3B82F6",
  },
  delete: {
    icon: <Trash2 className="h-4 w-4" />,
    iconBg: "#FEE2E2",
    iconColor: "#B91C1C",
    cardBg: "linear-gradient(135deg, #FEF2F2 0%, #FFFFFF 100%)",
    border: "#FECACA",
    textColor: "#7F1D1D",
    subTextColor: "#F97316",
  },
  move: {
    icon: <MoveRight className="h-4 w-4" />,
    iconBg: "#FEF3C7",
    iconColor: "#B45309",
    cardBg: "linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 100%)",
    border: "#FCD34D",
    textColor: "#92400E",
    subTextColor: "#D97706",
  },
  hide: {
    icon: <EyeOff className="h-4 w-4" />,
    iconBg: "#F8FAFC",
    iconColor: "#475569",
    cardBg: "linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 100%)",
    border: "#E2E8F0",
    textColor: "#0F172A",
    subTextColor: "#475569",
  },
};

export function Dashboard() {
  const INITIAL_HISTORY_COUNT = 8;
  const HISTORY_BATCH_SIZE = 3;
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(INITIAL_HISTORY_COUNT);
  const [trendTab, setTrendTab] = useState<"users" | "projects">("users");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    const sentinel = sentinelRef.current;

    if (!scrollContainer || !sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleHistoryCount((prev) => {
              if (prev >= historyEvents.length) {
                return prev;
              }
              return Math.min(historyEvents.length, prev + HISTORY_BATCH_SIZE);
            });
          }
        });
      },
      {
        root: scrollContainer,
        threshold: 1,
      }
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, []);

  const visibleHistoryEvents = historyEvents.slice(0, visibleHistoryCount);
  const enableHistoryScroll = visibleHistoryEvents.length > 5;
  const activeTrend = trendSeries[trendTab];
  const chartLeft = 25;
  const chartRight = 380;
  const chartTop = 20;
  const chartBottom = 160;
  const chartHeight = chartBottom - chartTop;
  const axisMax = 30;
  const axisLabels = [30, 20, 10, 0];
  const linePoints = activeTrend.map((value, idx) => {
    const x = chartLeft + (idx / Math.max(trendMonths.length - 1, 1)) * (chartRight - chartLeft);
    const y = chartBottom - (Math.min(value, axisMax) / axisMax) * chartHeight;
    return { x, y };
  });
  const pathPoints = linePoints.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPath =
    pathPoints && linePoints.length >= 2
      ? `${pathPoints} ${linePoints[linePoints.length - 1].x},${chartBottom} ${linePoints[0].x},${chartBottom}`
      : "";
  const trendPalette = trendColors[trendTab];

  return (
    <div className="space-y-8 pb-12">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          실시간 지표를 확인하세요. 전체 사용자, 회사, 프로젝트의 통계를 한눈에 볼 수 있습니다.
        </p>
      </div>
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {summaryMetrics.map((stat) => (
            <Card key={stat.title} className="text-card-foreground flex flex-col gap-6 rounded-xl border border-white/70 bg-white/90 shadow-sm backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">{stat.title}</CardTitle>
                    <div className="mt-1 text-2xl font-semibold">{stat.value}</div>
                  </div>
                  <div className="rounded-full bg-primary/10 text-primary w-16 h-16 flex items-center justify-center">
                    <stat.icon className="h-8 w-8" aria-hidden />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>

        <div className="grid gap-4 lg:grid-cols-2 py-6">
          <Card className="rounded-xl border border-white/70 bg-white/90 shadow-sm backdrop-blur">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 border-b border-white/60 pb-4">
              <div>
                <CardTitle className="text-xl font-semibold text-foreground">사용자 & 프로젝트 트렌드</CardTitle>
                <p className="text-xs text-muted-foreground">최근 12개월간 주요 지표 변화를 확인하세요.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(["users", "projects"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setTrendTab(tab)}
                    className={`rounded-full px-3 py-1 text-xs ${
                      trendTab === tab ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    }`}
                  >
                    {tab === "users" ? "Users" : "Projects"}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-52 w-full">
                <svg viewBox="0 0 400 200" className="h-full w-full overflow-visible">
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={trendPalette.gradient} stopOpacity="0.3" />
                      <stop offset="100%" stopColor={trendPalette.stroke} stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="lineStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={trendPalette.gradient} />
                      <stop offset="100%" stopColor={trendPalette.stroke} />
                    </linearGradient>
                  </defs>
                  {trendMonths.map((_, idx) => (
                    <line
                      key={`v-${idx}`}
                      x1={chartLeft + (idx / Math.max(trendMonths.length - 1, 1)) * (chartRight - chartLeft)}
                      y1={chartTop}
                      x2={chartLeft + (idx / Math.max(trendMonths.length - 1, 1)) * (chartRight - chartLeft)}
                      y2={chartBottom}
                      className="stroke-slate-200"
                      strokeWidth="1"
                      strokeDasharray="2 4"
                    />
                  ))}
                  {axisLabels.map((label, idx) => {
                    const y = chartTop + (idx / (axisLabels.length - 1)) * chartHeight;
                    return (
                      <g key={`h-${idx}`}>
                        <line x1={chartLeft} x2={chartRight} y1={y} y2={y} className="stroke-slate-100" strokeWidth="1" strokeDasharray="4 4" />
                        <text x={chartLeft - 6} y={y + 4} className="text-xs text-muted-foreground" textAnchor="end">
                          {label.toLocaleString()}
                        </text>
                      </g>
                    );
                  })}
                  {areaPath && (
                    <polyline
                      fill="url(#lineGradient)"
                      stroke="none"
                      points={areaPath}
                    />
                  )}
                  {pathPoints && (
                    <polyline
                      fill="none"
                      stroke="url(#lineStroke)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={pathPoints}
                    />
                  )}
                  {linePoints.map((point, idx) => (
                    <circle
                      key={`point-${idx}`}
                      cx={point.x}
                      cy={point.y}
                      r="3"
                      fill="#fff"
                      stroke={trendPalette.stroke}
                      strokeWidth="1.5"
                    />
                  ))}
                  {trendMonths.map((month, idx) => (
                    <text
                      key={month}
                      x={chartLeft + (idx / Math.max(trendMonths.length - 1, 1)) * (chartRight - chartLeft)}
                      y="190"
                      className="text-xs fill-slate-500"
                      textAnchor="middle"
                    >
                      {month}
                    </text>
                  ))}
                </svg>
              </div>
            </CardContent>
          </Card>
        <Card className="rounded-xl border border-white/70 bg-white/90 shadow-sm backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/60">
            <div>
              <CardTitle className="text-xl font-semibold text-foreground">Project Status Distribution</CardTitle>
              <p className="text-xs text-muted-foreground">현재 진행 중인 프로젝트 단계별 비율입니다.</p>
            </div>
          </CardHeader>
          <CardContent className="pt-6 flex flex-col gap-6">
            <div className="relative mx-auto h-32 w-32">
              <svg viewBox="0 0 36 36" className="h-full w-full">
                <circle cx="18" cy="18" r="14.5" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                {donutSegments.map(({ slice, dasharray, dashoffset }) => (
                  <circle
                    key={slice.label}
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke={slice.color}
                    strokeWidth="4"
                    strokeDasharray={dasharray}
                    strokeDashoffset={dashoffset}
                    transform="rotate(-90 18 18)"
                  />
                ))}
              </svg>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="rounded-full bg-white px-4 py-3 text-center shadow-sm">
                  <p className="text-xs text-muted-foreground">총 프로젝트</p>
                  <p className="text-xl font-semibold text-foreground">{donutTotal}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {statusSlices.map((slice) => {
                const percent = Math.round((slice.value / donutTotal) * 100);
                return (
                  <div key={slice.label} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/90 shadow-sm text-sm">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: slice.color }} />
                    <span className="w-28">{slice.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full" style={{ backgroundColor: slice.color, width: `${percent}%` }} />
                    </div>
                    <span className="w-12 text-right text-xs text-muted-foreground">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        </div>

        <Card className="rounded-xl border border-white/70 bg-white/90 shadow-sm backdrop-blur">
          <CardHeader className="flex items-center justify-between pb-4 border-b border-white/60">
            <div>
              <CardTitle className="text-xl font-semibold text-foreground">최근 히스토리</CardTitle>
              <p className="text-xs text-muted-foreground">워크스페이스 전반의 활동 로그입니다.</p>
            </div>
            <button className="text-xs font-medium text-primary hover:underline">전체 보기</button>
          </CardHeader>
          <CardContent className="pt-4 flex-1 min-h-0 overflow-hidden">
            <div
              ref={scrollContainerRef}
              className={`space-y-3 h-full pr-1 ${enableHistoryScroll ? "overflow-y-auto" : ""}`}
            >
              {visibleHistoryEvents.map((event) => {
                const palette = historyPalette[event.type] ?? historyPalette.create;
                return (
                  <div key={event.id} className="flex flex-col gap-2 rounded-xl bg-white p-2 shadow-sm">
                    <div className="flex flex-row items-start gap-2">
                      <div
                        className="rounded-full p-2 flex items-center justify-center"
                        style={{ backgroundColor: palette.iconBg, color: palette.iconColor }}
                      >
                        {palette.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-black">{event.message}</p>
                        <p className="text-xs text-black/70">{event.timestamp}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={sentinelRef} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
