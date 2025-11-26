import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { MessageSquare, Upload, CheckCircle, LogIn } from "lucide-react";

const users = [
  {
    id: "usr-101",
    name: "Jane Smith",
    email: "jane@studio.kr",
    role: "Manager",
    status: "Active",
    lastActive: "2 hours ago",
    projects: ["Nova Rebrand", "Client CRM", "Mobile Launch"],
  },
  {
    id: "usr-102",
    name: "Chris Davis",
    email: "chris@workhub.com",
    role: "Developer",
    status: "Active",
    lastActive: "18 minutes ago",
    projects: ["WorkHub App", "Dashboard V2"],
  },
];

const activityHistory = [
  { id: 1, type: "comment", message: "Left feedback on Dashboard wireframe", timestamp: "Today · 08:40" },
  { id: 2, type: "upload", message: "Uploaded sprint_report_week47.pdf", timestamp: "Today · 07:55" },
  { id: 3, type: "completed", message: "Completed task ‘QA checklist’", timestamp: "Yesterday · 19:22" },
  { id: 4, type: "login", message: "Logged in via SSO", timestamp: "Yesterday · 08:05" },
];

const activityIconMap: Record<string, JSX.Element> = {
  comment: <MessageSquare className="h-4 w-4 text-slate-500" />,
  upload: <Upload className="h-4 w-4 text-slate-500" />,
  completed: <CheckCircle className="h-4 w-4 text-slate-500" />,
  login: <LogIn className="h-4 w-4 text-slate-500" />,
};

export function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const user = useMemo(() => users.find((item) => item.id === userId), [userId]);

  if (!user) {
    return (
      <Card className="rounded-2xl border border-white/70 bg-white shadow-sm">
        <CardContent className="py-12 text-center text-muted-foreground">
          User not found.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <Card className="rounded-2xl border border-white/70 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="size-14">
            <AvatarFallback className="bg-slate-100 text-lg font-semibold text-foreground">
              {user.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl">{user.name}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              <Badge variant="secondary">{user.role}</Badge>
              <Badge variant={user.status === "Active" ? "default" : "secondary"}>{user.status}</Badge>
              <span className="text-muted-foreground">Last active · {user.lastActive}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border border-white/70 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Assigned Projects</CardTitle>
            <CardDescription>Projects and initiatives currently assigned.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {user.projects.map((project) => (
              <div key={project} className="rounded-xl border border-dashed border-slate-200 px-4 py-3">
                <p className="font-medium">{project}</p>
                <p className="text-sm text-muted-foreground">Last updated 3 days ago</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-white/70 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Activity History</CardTitle>
            <CardDescription>Recent events from the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activityHistory.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="rounded-full bg-slate-100 p-2">
                  {activityIconMap[activity.type]}
                </div>
                <div>
                  <p className="font-medium text-sm">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border border-white/70 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Modify access or manage this member.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" className="sm:flex-1">
            Change Role
          </Button>
          <Button variant="secondary" className="sm:flex-1" onClick={() => navigate("/admin/password")}>
            Initialize Password
          </Button>
          <Button variant="destructive" className="sm:flex-1">
            Remove User
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
