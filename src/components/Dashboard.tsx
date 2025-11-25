import { useState } from "react";
import { LayoutDashboard, Users, CheckCircle, TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Sidebar } from "./Sidebar";

const stats = [
  {
    title: "Total Projects",
    value: "24",
    change: "+2 from last month",
    icon: LayoutDashboard,
  },
  {
    title: "Active Tasks",
    value: "142",
    change: "+18 from last week",
    icon: CheckCircle,
  },
  {
    title: "Team Members",
    value: "32",
    change: "+4 new this month",
    icon: Users,
  },
  {
    title: "Completion Rate",
    value: "87%",
    change: "+5% from last month",
    icon: TrendingUp,
  },
];

const projects = [
  { name: "Website Redesign", progress: 75, status: "In Progress", dueDate: "Dec 15, 2024", team: 5 },
  { name: "Mobile App Development", progress: 45, status: "In Progress", dueDate: "Dec 30, 2024", team: 8 },
  { name: "Marketing Campaign", progress: 90, status: "Review", dueDate: "Dec 10, 2024", team: 3 },
  { name: "Database Migration", progress: 100, status: "Completed", dueDate: "Dec 1, 2024", team: 4 },
];

export function Dashboard() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-8 pb-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:px-8 md:flex-row">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />
        <div className="flex-1 space-y-6">
          <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Keep an eye on live metrics: total projects, completed tasks, and today’s wins at a glance.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Card
              key={stat.title}
              className="border border-white/70 bg-white/90 shadow-sm backdrop-blur rounded-2xl"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-6">
                <div>
                  <CardTitle className="text-sm text-muted-foreground">{stat.title}</CardTitle>
                  <div className="text-3xl font-semibold mt-1">{stat.value}</div>
                </div>
                <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary">
                  <stat.icon className="h-5 w-5" aria-hidden />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border border-white/70 bg-white/95 shadow-sm backdrop-blur rounded-3xl">
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>Track progress across your most active initiatives.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {projects.map((project) => (
              <div
                key={project.name}
                className="flex flex-col gap-4 rounded-2xl border bg-white/70 p-4 shadow-sm md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex items-center gap-6">
                    <Badge variant={project.status === "Completed" ? "default" : "secondary"}>{project.status}</Badge>
                    <h3 className="text-lg font-semibold">{project.name}</h3>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" aria-hidden /> Due {project.dueDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" aria-hidden /> {project.team} members
                    </span>
                  </div>
                </div>
                <div className="w-full md:w-64">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <ProgressBar value={project.progress} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="mt-2 h-2 w-full rounded-full bg-muted">
      <div
        className="h-full rounded-full"
        style={{ width: `${value}%`, backgroundColor: "var(--point-color)" }}
      />
    </div>
  );
}
