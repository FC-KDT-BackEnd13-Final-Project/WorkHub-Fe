import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Users,
  CheckCircle,
  TrendingUp,
  PlusCircle,
  PenSquare,
  Trash2,
  MoveRight,
  EyeOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { BrandProjectStats } from "./BrandProjectStats";
import { UserGrowthStats } from "./UserGrowthStats";

const summaryMetrics = [
  { title: "전체 프로젝트", value: "24", change: "지난달 대비 +2", icon: LayoutDashboard },
  { title: "진행 중인 작업", value: "142", change: "지난주 대비 +18", icon: CheckCircle },
  { title: "팀 구성원", value: "32", change: "이번 달 신규 +4", icon: Users },
  { title: "완료율", value: "87%", change: "지난달 대비 +5%", icon: TrendingUp },
];

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

  return (
    <div className="space-y-8 pb-12">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          실시간 지표를 확인하세요. 전체 프로젝트, 완료된 작업, 오늘의 성과를 한눈에 볼 수 있습니다.
        </p>
      </div>
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2 items-stretch">
          <div className="h-[360px] rounded-2xl border border-white/70 bg-white/90 shadow-sm backdrop-blur p-6 flex flex-col">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">통합 프로젝트 통계</h2>
              <p className="text-sm text-muted-foreground mb-4">
                워크스페이스 전반의 핵심 지표입니다.
              </p>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {summaryMetrics.map((stat) => (
                <Card key={stat.title} className="text-card-foreground flex flex-col gap-6 rounded-xl border border-white/70 bg-white/90 shadow-sm backdrop-blur">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">{stat.title}</CardTitle>
                      <div className="mt-1 text-2xl font-semibold">{stat.value}</div>
                    </div>
                    <div className="rounded-xl bg-primary/10 p-3 text-primary">
                      <stat.icon className="h-4 w-4" aria-hidden />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground">{stat.change}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <div className="h-[360px] rounded-2xl border border-white/70 bg-white/90 shadow-sm backdrop-blur p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">최근 히스토리</h2>
                <p className="text-sm text-muted-foreground mb-1">워크스페이스 전반의 활동 로그입니다.</p>
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <button className="text-xs font-medium text-primary hover:underline">전체 보기</button>
            </div>
            <div className="mt-6 flex-1 min-h-0 overflow-hidden">
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
            </div>
          </div>
        </div>
        <BrandProjectStats />
        <UserGrowthStats />
      </div>
    </div>
  );
}
