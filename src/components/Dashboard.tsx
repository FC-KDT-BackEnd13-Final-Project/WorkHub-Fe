import { LayoutDashboard, Users, CheckCircle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { BrandProjectStats } from "./BrandProjectStats";
import { UserGrowthStats } from "./UserGrowthStats";

const stats = [
  { title: "Total Projects", value: "24", change: "+2 from last month", icon: LayoutDashboard },
  { title: "Active Tasks", value: "142", change: "+18 from last week", icon: CheckCircle },
  { title: "Team Members", value: "32", change: "+4 new this month", icon: Users },
  { title: "Completion Rate", value: "87%", change: "+5% from last month", icon: TrendingUp },
];

export function Dashboard() {
  return (
    <div className="space-y-8 pb-12">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Keep an eye on live metrics: total projects, completed tasks, and today’s wins at a glance.
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
