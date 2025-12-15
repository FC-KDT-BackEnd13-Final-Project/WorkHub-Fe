import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, CheckCircle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { companyUsers } from "../admin/userData";
import logoImage from "../../../image/logo.png";
import { historyEvents, historyPalette } from "../../data/historyData";

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

export function Dashboard() {
  const navigate = useNavigate();
  const INITIAL_HISTORY_COUNT = 8;
  const HISTORY_BATCH_SIZE = 3;
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(INITIAL_HISTORY_COUNT);
  const [trendTab, setTrendTab] = useState<"users" | "projects">("users");
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; value: number; month: string } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const todayHistoryEvents = historyEvents.filter((event) => event.timestamp.includes("오늘"));
  const getInitials = (value?: string) => {
    if (!value) return "NA";
    const cleaned = value.trim();
    if (!cleaned) return "NA";
    const parts = cleaned.split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const second = parts[1]?.[0] ?? cleaned[1] ?? "";
    return (first + (second ?? "")).slice(0, 2).toUpperCase();
  };
  const getAvatarUrl = (seed?: string) => (seed ? `https://i.pravatar.cc/80?u=${encodeURIComponent(seed)}` : undefined);
  const isSystemActor = (name?: string) => {
    if (!name) return true;
    const normalized = name.toLowerCase();
    return ["시스템", "bot", "센터"].some((keyword) => normalized.includes(keyword.toLowerCase()));
  };

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
              if (prev >= todayHistoryEvents.length) {
                return prev;
              }
              return Math.min(todayHistoryEvents.length, prev + HISTORY_BATCH_SIZE);
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

  const visibleHistoryEvents = todayHistoryEvents.slice(0, visibleHistoryCount);
  const enableHistoryScroll = visibleHistoryEvents.length > 5;
  const activeTrend = trendSeries[trendTab];
  const chartLeft = 35;
  const chartRight = 380;
  const chartTop = 20;
  const chartBottom = 160;
  const chartHeight = chartBottom - chartTop;
  const axisMax = 30;
  const axisLabels = [30, 20, 10, 0];
  const yAxisLabel = trendTab === "users" ? "사용자 수" : "프로젝트 수";
  const xAxisLabel = "월별 추세";
  const linePoints = activeTrend.map((value, idx) => {
    const x = chartLeft + (idx / Math.max(trendMonths.length - 1, 1)) * (chartRight - chartLeft);
    const y = chartBottom - (Math.min(value, axisMax) / axisMax) * chartHeight;
    return { x, y, value, month: trendMonths[idx] };
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
              <div className="h-52 w-full flex items-center justify-center relative">
                <svg viewBox="0 0 400 200" className="h-full w-full max-w-[420px] overflow-visible">
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
                        <text
                          x={chartLeft - 14}
                          y={y + 4}
                          className="text-xs text-muted-foreground dark:text-white"
                          textAnchor="end"
                          fill="currentColor"
                        >
                          {label.toLocaleString()}
                        </text>
                      </g>
                    );
                  })}
                  {/* 축 라인 */}
                  <line x1={chartLeft} y1={chartTop} x2={chartLeft} y2={chartBottom} className="stroke-slate-300" strokeWidth="1" />
                  <line x1={chartLeft} y1={chartBottom} x2={chartRight} y2={chartBottom} className="stroke-slate-300" strokeWidth="1" />

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
                      onMouseEnter={() => setHoveredPoint(point)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  ))}
                  {trendMonths.map((month, idx) => (
                    <text
                      key={month}
                      x={chartLeft + (idx / Math.max(trendMonths.length - 1, 1)) * (chartRight - chartLeft)}
                      y="190"
                      className="text-xs text-slate-500 dark:text-white"
                      textAnchor="middle"
                      fill="currentColor"
                    >
                      {month}
                    </text>
                  ))}
                </svg>
                {hoveredPoint ? (
                  <div
                    className="absolute pointer-events-none rounded-md bg-white px-4 py-2 text-xs shadow-lg border border-slate-200 text-slate-700 whitespace-nowrap z-10"
                    style={{
                      left: `${Math.min(Math.max((hoveredPoint.x / 400) * 100, 10), 90)}%`,
                      top: `${Math.max((hoveredPoint.y / 200) * 100 - 5, 10)}%`,
                      transform: "translate(-50%, -120%)",
                    }}
                  >
                    <div className="font-semibold">{hoveredPoint.month}</div>
                    <div className="mt-1">
                      {hoveredPoint.value}
                      <span className="text-[10px] align-middle">{trendTab === "users" ? "명" : "건"}</span>
                    </div>
                  </div>
                ) : null}
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
          <CardContent className="pt-6 flex flex-col gap-4">
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
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <div>
              <CardTitle className="text-xl font-semibold text-foreground">최근 히스토리</CardTitle>
              <p className="text-xs text-muted-foreground">워크스페이스 전반의 활동 로그입니다.</p>
            </div>
            <button className="text-xs font-medium text-primary hover:underline" onClick={() => navigate("/history")}>
              전체 보기
            </button>
          </CardHeader>
          <CardContent className="pt-2 pb-4">
            <div
              ref={scrollContainerRef}
              className={`relative w-full pr-1 ${enableHistoryScroll ? "max-h-96 overflow-y-auto" : ""}`}
            >
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="hover:bg-muted/50 border-b transition-colors">
                    <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap w-2/5">
                      활동 내용
                    </th>
                    <th className="text-foreground h-10 px-2 align-middle font-medium whitespace-nowrap w-1/5 text-center">
                      대상
                    </th>
                    <th className="text-foreground h-10 px-2 align-middle font-medium whitespace-nowrap w-1/6 text-center">
                      실행자
                    </th>
                    <th className="text-foreground h-10 px-2 align-middle font-medium whitespace-nowrap w-1/6 text-center">
                      작업 유형
                    </th>
                    <th className="text-foreground h-10 px-2 align-middle font-medium whitespace-nowrap w-1/6 text-center">
                      발생 시각
                    </th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {visibleHistoryEvents.map((event) => {
                    const palette = historyPalette[event.type] ?? historyPalette.create;
                    return (
                      <tr key={event.id} className="hover:bg-muted/50 border-b transition-colors">
                        <td className="p-2 align-middle whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/70 shadow-sm">
                              {isSystemActor(event.updatedBy) ? (
                                <img src={logoImage} alt="WorkHub 로고" className="h-full w-full object-cover" />
                              ) : event.updatedBy ? (
                                <img
                                  src={getAvatarUrl(event.updatedBy)}
                                  alt={event.updatedBy}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm font-semibold text-foreground">
                                  {getInitials(event.updatedBy)}
                                </div>
                              )}
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-foreground">{event.message}</p>
                              <p className="text-xs text-muted-foreground">{event.timestamp}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-2 align-middle whitespace-nowrap text-center text-sm text-muted-foreground">
                          {event.target ?? "—"}
                        </td>
                        <td className="p-2 align-middle whitespace-nowrap text-center">
                          <span className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground border-transparent">
                            {event.updatedBy ?? "시스템"}
                          </span>
                        </td>
                        <td className="p-2 align-middle whitespace-nowrap text-center">
                          <span
                            className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0"
                            style={{ backgroundColor: palette.iconBg, color: palette.iconColor, borderColor: palette.iconBg }}
                          >
                            {event.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-2 align-middle whitespace-nowrap text-center text-sm text-muted-foreground">
                          {format(new Date(event.updatedAt), "yyyy.MM.dd HH:mm")}
                        </td>
                      </tr>
                    );
                  })}
                  <tr ref={sentinelRef}>
                    <td colSpan={5} />
                  </tr>
                  {visibleHistoryEvents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">
                        오늘 업데이트된 히스토리가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
