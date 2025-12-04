import { LayoutDashboard, Users, CheckCircle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { BrandProjectStats } from "./BrandProjectStats";
import { UserGrowthStats } from "./UserGrowthStats";

// 대시보드 메인 진입점: 상단 KPI 카드와 주요 통계 카드 묶음
const stats = [
  { title: "전체 프로젝트", value: "24", change: "지난달 대비 +2", icon: LayoutDashboard },
  { title: "진행 중인 작업", value: "142", change: "지난주 대비 +18", icon: CheckCircle },
  { title: "팀 구성원", value: "32", change: "이번 달 신규 +4", icon: Users },
  { title: "완료율", value: "87%", change: "지난달 대비 +5%", icon: TrendingUp },
];

export function Dashboard() {
  return (
    <div className="space-y-8 pb-12">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          실시간 지표를 확인하세요. 전체 프로젝트, 완료된 작업, 오늘의 성과를 한눈에 볼 수 있습니다.
        </p>
      </div>
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="rounded-2xl border border-white/70 bg-white/90 shadow-sm backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between pb-6">
                <div>
                  <CardTitle className="text-sm text-muted-foreground">{stat.title}</CardTitle>
                  <div className="mt-1 text-3xl font-semibold">{stat.value}</div>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-6 text-primary">
                  <stat.icon className="h-5 w-5" aria-hidden />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <BrandProjectStats />
        <UserGrowthStats />
      </div>
    </div>
  );
}
