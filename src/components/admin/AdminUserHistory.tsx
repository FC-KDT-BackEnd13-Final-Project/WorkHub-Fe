import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { MessageSquare, Upload, CheckCircle, LogIn } from "lucide-react";
import { companyUsers, activityHistory } from "./userData";

const historyIconMap: Record<string, JSX.Element> = {
  comment: <MessageSquare className="h-4 w-4 text-slate-500" />,
  upload: <Upload className="h-4 w-4 text-slate-500" />,
  completed: <CheckCircle className="h-4 w-4 text-slate-500" />,
  login: <LogIn className="h-4 w-4 text-slate-500" />,
};

export function AdminUserHistory() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const user = useMemo(() => companyUsers.find((item) => item.id === userId), [userId]);

  if (!user) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center text-muted-foreground shadow-sm">
        사용자를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 pt-6 min-h-0">
      <div className="flex items-center gap-6 rounded-2xl bg-white p-6 shadow-sm">
        <Avatar className="size-14">
          {user.avatarUrl ? (
            <AvatarImage src={user.avatarUrl} alt={user.name} className="object-cover" />
          ) : null}
          <AvatarFallback className="bg-slate-100 text-lg font-semibold text-foreground">
            {user.name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-semibold">{user.name}</h2>
          <div className="text-sm text-muted-foreground">
            <p>{user.email}</p>
            <p>{user.phone}</p>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <Badge variant="secondary">{user.company}</Badge>
            <Badge variant="secondary">{user.role}</Badge>
            <Badge variant={user.status === "Active" ? "default" : "secondary"}>{user.status === "Active" ? "활성" : "대기"}</Badge>
            <span className="text-muted-foreground">마지막 활동 · {user.lastActive}</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm min-h-0">
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold">Activity History · 전체</h3>
          <p className="text-sm text-muted-foreground">이 구성원의 전체 활동 기록입니다.</p>
        </div>
        <div className="space-y-4 overflow-y-auto pt-4 max-h-[640px] pr-1">
          {activityHistory.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className="rounded-full bg-muted p-2">{historyIconMap[activity.type]}</div>
              <div>
                <p className="font-medium text-sm">{activity.message}</p>
                <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={() => navigate(-1)}>
            뒤로 가기
          </Button>
        </div>
      </div>
    </div>
  );
}
