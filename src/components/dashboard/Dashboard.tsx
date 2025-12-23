import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, CheckCircle, CheckSquare, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { companyUsers } from "../admin/userData";
import logoImage from "../../../image/logo.png";
import placeholderImage from "../../../image/photo.png";
import { historyPalette, type HistoryEvent } from "../../data/historyData";
import {
  PROFILE_STORAGE_KEY,
  type UserRole,
  normalizeUserRole,
} from "@/constants/profile";
import { useLocalStorageValue } from "@/hooks/useLocalStorageValue";
import {
  fetchAdminCompanyCount,
  fetchAdminMonthlyMetrics,
  fetchAdminProjectCount,
  fetchAdminUserCount,
  fetchDashboardSummary,
  type MonthlyMetricsResponse,
} from "@/lib/dashboard";
import { historyApi } from "@/lib/history";
import { mapHistoryItemToEvent } from "@/lib/historyMapper";

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

type StoredSettings = {
  profile?: {
    id?: string;
    email?: string;
    role?: string;
  };
};

type StoredUser = {
  id?: string;
  loginId?: string;
  name?: string;
  email?: string;
  role?: string;
};

type SummaryMetric = {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
};
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
] satisfies SummaryMetric[];

const defaultTrendMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const defaultTrendSeries = {
  users: [8, 12, 15, 18, 20, 22, 24, 26, 27, 28, 29, 30],
  projects: [6, 9, 8, 12, 14, 16, 18, 19, 21, 23, 25, 26],
};

const trendColors = {
  users: { stroke: "#a855f7", gradient: "#22d3ee" },
  projects: { stroke: "#0ea5e9", gradient: "#f97316" },
} as const;

const monthAbbreviations = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const formatMonthlyLabel = (value: string) => {
  if (monthAbbreviations.includes(value)) {
    return value;
  }
  const [, month] = value.split("-");
  if (!month) {
    return value;
  }
  const idx = Number(month) - 1;
  return monthAbbreviations[idx] ?? value;
};

const buildMonthSequence = (start: string, length: number) => {
  const [yearStr, monthStr] = start.split("-");
  let year = Number(yearStr);
  let month = Number(monthStr);
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return [];
  }

  const items: string[] = [];
  for (let i = 0; i < length; i += 1) {
    const currentMonth = `${year}-${String(month).padStart(2, "0")}`;
    items.push(currentMonth);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return items;
};

export function Dashboard() {
  const navigate = useNavigate();
  const INITIAL_HISTORY_COUNT = 8;
  const HISTORY_BATCH_SIZE = 3;
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(INITIAL_HISTORY_COUNT);
  const [trendTab, setTrendTab] = useState<"users" | "projects">("users");
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; value: number; month: string } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [summary, setSummary] = useState<{ pendingApprovals: number; totalProjects: number } | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [adminCounts, setAdminCounts] = useState<{ users: number; companies: number; projects: number } | null>(null);
  const [adminMonthlyMetrics, setAdminMonthlyMetrics] = useState<MonthlyMetricsResponse | null>(null);
  const [adminMetricsError, setAdminMetricsError] = useState<string | null>(null);
  const [historyApiEvents, setHistoryApiEvents] = useState<HistoryEvent[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const isSystemActor = (name?: string) => {
    if (!name) return true;
    const normalized = name.toLowerCase();
    return ["시스템", "bot", "센터"].some((keyword) => normalized.includes(keyword.toLowerCase()));
  };
  const getActorAvatar = (name?: string, profileImg?: string | null) => {
    if (isSystemActor(name)) {
      return { src: logoImage, alt: "WorkHub 로고" };
    }
    if (profileImg) {
      return { src: profileImg, alt: name ?? "사용자" };
    }
    return { src: placeholderImage, alt: name ?? "기본 아바타" };
  };

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
    if (profileRole) return profileRole;

    const storedUserRole = normalizeUserRole(storedUser?.role);
    return storedUserRole ?? "DEVELOPER";
  }, [storedSettings, storedUser]);

  const currentUser = useMemo(() => {
    const normalizedEmail = storedSettings?.profile?.email?.toLowerCase() ?? storedUser?.email?.toLowerCase();
    const normalizedId =
      storedSettings?.profile?.id?.toLowerCase() ??
      storedUser?.name?.toLowerCase() ??
      storedUser?.loginId?.toLowerCase() ??
      storedUser?.id?.toLowerCase();

    return companyUsers.find((user) => {
      if (normalizedEmail && user.email?.toLowerCase() === normalizedEmail) {
        return true;
      }
      if (normalizedId && (user.id?.toLowerCase() === normalizedId || user.name?.toLowerCase() === normalizedId)) {
        return true;
      }
      return false;
    });
  }, [storedSettings, storedUser]);

  const trendData = useMemo(() => {
    if (userRole === "ADMIN" && adminMonthlyMetrics) {
      const metadataMonths = (() => {
        const start = adminMonthlyMetrics.metadata?.startMonth;
        const months = adminMonthlyMetrics.metadata?.months;
        if (start && typeof months === "number" && months > 0) {
          return buildMonthSequence(start, months);
        }
        return null;
      })();

      const monthSet = new Set<string>();
      adminMonthlyMetrics.users.forEach((point) => point.month && monthSet.add(point.month));
      adminMonthlyMetrics.projects.forEach((point) => point.month && monthSet.add(point.month));

      const monthKeys = metadataMonths ?? Array.from(monthSet).sort();

      if (monthKeys.length === 0) {
        return { months: defaultTrendMonths, series: defaultTrendSeries } as const;
      }

      const userMap = new Map(adminMonthlyMetrics.users.map((point) => [point.month, point.value]));
      const projectMap = new Map(adminMonthlyMetrics.projects.map((point) => [point.month, point.value]));
      const formattedMonths = monthKeys.map((month) => formatMonthlyLabel(month));

      return {
        months: formattedMonths,
        series: {
          users: monthKeys.map((month) => userMap.get(month) ?? 0),
          projects: monthKeys.map((month) => projectMap.get(month) ?? 0),
        },
      } as const;
    }

    return { months: defaultTrendMonths, series: defaultTrendSeries } as const;
  }, [adminMonthlyMetrics, userRole]);

  const trendMonths = trendData.months;
  const trendSeries = trendData.series;
  const activeTrend = trendSeries[trendTab];
  const chartLeft = 35;
  const chartRight = 380;
  const chartTop = 20;
  const chartBottom = 160;
  const chartHeight = chartBottom - chartTop;
  const combinedTrendValues = [...trendSeries.users, ...trendSeries.projects];
  const observedMax = combinedTrendValues.length ? Math.max(...combinedTrendValues) : 0;
  const axisTopLabel = Math.max(10, Math.ceil((observedMax || 0) / 5) * 5);
  const axisMax = axisTopLabel || 10;
  const axisLabels = [axisMax, Math.floor((axisMax * 2) / 3), Math.floor(axisMax / 3), 0];
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

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const data = await fetchDashboardSummary();
        setSummary(data);
        setSummaryError(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : "대시보드 요약 정보를 불러오지 못했습니다.";
        setSummaryError(message);
      }
    };
    loadSummary();
  }, []);

  useEffect(() => {
    if (userRole !== "ADMIN") {
      setAdminCounts(null);
      setAdminMonthlyMetrics(null);
      setAdminMetricsError(null);
      return;
    }

    let cancelled = false;

    const loadAdminMetrics = async () => {
      try {
        const [usersCount, companiesCount, projectsCount, monthlyMetrics] = await Promise.all([
          fetchAdminUserCount(),
          fetchAdminCompanyCount(),
          fetchAdminProjectCount(),
          fetchAdminMonthlyMetrics(),
        ]);

        if (cancelled) return;

        setAdminCounts({ users: usersCount, companies: companiesCount, projects: projectsCount });
        setAdminMonthlyMetrics(monthlyMetrics);
        setAdminMetricsError(null);
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "관리자 대시보드 지표를 불러오지 못했습니다.";
        setAdminMetricsError(message);
      }
    };

    loadAdminMetrics();

    return () => {
      cancelled = true;
    };
  }, [userRole]);

  useEffect(() => {
    let cancelled = false;

    const loadHistories = async () => {
      try {
        const params = { page: 0, size: 30, sort: "updatedAt,desc" } as const;
        const page =
          userRole === "ADMIN"
            ? await historyApi.getAllAdminHistories(params)
            : await historyApi.getAllHistories(params);

        if (cancelled) return;

        setHistoryApiEvents(page.content.map(mapHistoryItemToEvent));
        setHistoryError(null);
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "히스토리를 불러오지 못했습니다.";
        setHistoryApiEvents([]);
        setHistoryError(message);
      }
    };

    loadHistories();

    return () => {
      cancelled = true;
    };
  }, [userRole]);

  const relevantHistoryEvents = useMemo(() => {
    const historySourceEvents = historyApiEvents;

    if (userRole !== "CLIENT" && userRole !== "DEVELOPER") {
      return historySourceEvents;
    }

    const candidates = [
      currentUser?.name,
      storedSettings?.profile?.id,
      storedSettings?.profile?.email,
      storedUser?.name,
      storedUser?.loginId,
      storedUser?.email,
    ]
      .map((value) => value?.toLowerCase())
      .filter(Boolean) as string[];

    if (candidates.length === 0) return historySourceEvents;

    const matchesCurrentUser = (value?: string | null) => Boolean(value && candidates.includes(value.toLowerCase()));

    const filtered = historySourceEvents.filter(
      (event) => matchesCurrentUser(event.updatedBy) || matchesCurrentUser(event.createdBy)
    );

    return filtered.length > 0 ? filtered : historySourceEvents;
  }, [currentUser, historyApiEvents, storedSettings, storedUser, userRole]);

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
              if (prev >= relevantHistoryEvents.length) {
                return prev;
              }
              return Math.min(relevantHistoryEvents.length, prev + HISTORY_BATCH_SIZE);
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
  }, [relevantHistoryEvents.length]);

  useEffect(() => {
    setVisibleHistoryCount(
      relevantHistoryEvents.length === 0 ? 0 : Math.min(INITIAL_HISTORY_COUNT, relevantHistoryEvents.length)
    );
  }, [INITIAL_HISTORY_COUNT, relevantHistoryEvents.length]);

  const visibleHistoryEvents = relevantHistoryEvents.slice(0, visibleHistoryCount);
  const enableHistoryScroll = visibleHistoryEvents.length > 5;

  const metricsToRender: SummaryMetric[] = useMemo(() => {
    if (userRole === "ADMIN") {
      if (adminCounts) {
        return [
          {
            title: "총 유저",
            value: adminCounts.users.toLocaleString("ko-KR"),
            change: "등록된 전체 사용자",
            icon: Users,
          },
          {
            title: "총 회사",
            value: adminCounts.companies.toLocaleString("ko-KR"),
            change: "등록된 고객사 수",
            icon: LayoutDashboard,
          },
          {
            title: "총 프로젝트",
            value: adminCounts.projects.toLocaleString("ko-KR"),
            change: "진행/완료 포함",
            icon: CheckCircle,
          },
        ];
      }
      return summaryMetrics;
    }

    if (summary) {
      return [
        {
          title: "승인 대기",
          value: summary.pendingApprovals.toLocaleString("ko-KR"),
          change: "PENDING_REVIEW 상태",
          icon: Clock,
        },
        {
          title: "소속 프로젝트",
          value: summary.totalProjects.toLocaleString("ko-KR"),
          change: "내 프로젝트 수",
          icon: CheckSquare,
        },
      ];
    }

    // API 실패 시 기존 더미 지표로 폴백
    if (userRole === "DEVELOPER" || userRole === "CLIENT") {
      const projects = currentUser?.projects ?? [];
      const approvalKeywords = ["review", "검토", "승인"];
      const progressKeywords = ["progress", "진행", "완료", "complete", "done"];

      const approvalRequestCount = projects.filter((project) => {
        const status = project.status?.toLowerCase() ?? "";
        return approvalKeywords.some((keyword) => status.includes(keyword));
      }).length;

      const projectCount = projects.filter((project) => {
        const status = project.status?.toLowerCase() ?? "";
        return progressKeywords.some((keyword) => status.includes(keyword));
      }).length;

      return [
        {
          title: "승인 요청",
          value: approvalRequestCount.toLocaleString("ko-KR"),
          change: "내가 포함된 승인 요청 건수",
          icon: CheckSquare,
        },
        {
          title: "총 프로젝트",
          value: projectCount.toLocaleString("ko-KR"),
          change: "진행/완료 포함 전체",
          icon: CheckCircle,
        },
      ];
    }

    return summaryMetrics;
  }, [adminCounts, currentUser, summary, userRole]);

  return (
    <div className="space-y-8 pb-12">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          실시간 지표를 확인하세요. 전체 사용자, 회사, 프로젝트의 통계를 한눈에 볼 수 있습니다.
        </p>
      </div>
      <div className="space-y-4">
        <div className={`grid gap-4 ${metricsToRender.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
          {metricsToRender.map((stat) => (
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
        {userRole === "ADMIN" && adminMetricsError ? (
          <p className="text-sm text-destructive">{adminMetricsError}</p>
        ) : null}
        {userRole === "ADMIN" && (
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
        )}

        {historyError ? <p className="text-sm text-destructive">{historyError}</p> : null}
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
              <div className="space-y-4 md:hidden">
                {visibleHistoryEvents.map((event) => {
                  const palette = historyPalette[event.type] ?? historyPalette.create;
                  const actorAvatar = getActorAvatar(event.updatedBy, event.updatedByProfileImg);
                  return (
                    <div key={event.id} className="rounded-xl border border-white/70 bg-white/90 p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/70 shadow-sm">
                          <img src={actorAvatar.src} alt={actorAvatar.alt} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium text-foreground">{event.message}</p>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-400">대상</span>
                          <span className="font-medium text-foreground text-right">{event.target ?? "—"}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-400">실행자</span>
                          <span className="inline-flex items-center justify-center rounded-md border border-transparent bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                            {event.updatedBy ?? "시스템"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-400">작업 유형</span>
                          <span
                            className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-[11px] font-medium"
                            style={{ backgroundColor: palette.iconBg, color: palette.iconColor, borderColor: palette.iconBg }}
                          >
                            {event.type.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-400">발생 시각</span>
                          <span>{event.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden md:block">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="hover:bg-muted/50 border-b transition-colors">
                      <th className="text-foreground h-10 px-2 text-left align-middle font-medium w-auto md:w-2/5 whitespace-normal md:whitespace-nowrap">
                        활동 내용
                      </th>
                      <th className="text-foreground h-10 px-2 align-middle font-medium w-auto md:w-1/5 text-center whitespace-normal md:whitespace-nowrap">
                        대상
                      </th>
                      <th className="text-foreground h-10 px-2 align-middle font-medium w-auto md:w-1/6 text-center whitespace-normal md:whitespace-nowrap">
                        실행자
                      </th>
                      <th className="text-foreground h-10 px-2 align-middle font-medium w-auto md:w-1/6 text-center whitespace-normal md:whitespace-nowrap">
                        작업 유형
                      </th>
                      <th className="text-foreground h-10 px-2 align-middle font-medium w-auto md:w-1/6 text-center whitespace-normal md:whitespace-nowrap">
                        발생 시각
                      </th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {visibleHistoryEvents.map((event) => {
                      const palette = historyPalette[event.type] ?? historyPalette.create;
                      const actorAvatar = getActorAvatar(event.updatedBy, event.updatedByProfileImg);
                      return (
                        <tr key={event.id} className="hover:bg-muted/50 border-b transition-colors">
                          <td className="p-2 align-middle whitespace-normal">
                            <div className="flex items-center gap-3">
                              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/70 shadow-sm">
                                <img src={actorAvatar.src} alt={actorAvatar.alt} className="h-full w-full object-cover" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-foreground">{event.message}</p>
                                <p className="text-xs text-muted-foreground">{event.timestamp}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-2 align-middle text-center text-sm text-muted-foreground whitespace-normal md:whitespace-nowrap">
                            {event.target ?? "—"}
                          </td>
                          <td className="p-2 align-middle text-center whitespace-normal md:whitespace-nowrap">
                            <span className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground border-transparent">
                              {event.updatedBy ?? "시스템"}
                            </span>
                          </td>
                          <td className="p-2 align-middle text-center whitespace-normal md:whitespace-nowrap">
                            <span
                              className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0"
                              style={{ backgroundColor: palette.iconBg, color: palette.iconColor, borderColor: palette.iconBg }}
                            >
                              {event.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-2 align-middle text-center text-sm text-muted-foreground whitespace-normal md:whitespace-nowrap">
                            {format(new Date(event.updatedAt), "yyyy.MM.dd HH:mm")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div ref={sentinelRef} className="h-4" />
              {visibleHistoryEvents.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  오늘 업데이트된 히스토리가 없습니다.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
