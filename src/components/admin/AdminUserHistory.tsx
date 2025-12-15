import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { activityHistory } from "./userData";
import { calculateTotalPages, paginate } from "../../utils/pagination";
import { activityTypePalette } from "./activityPalette";
import logoImage from "../../../image/logo.png";
import { PaginationControls } from "../common/PaginationControls";
import { useAdminUser } from "../../hooks/useAdminUsers";

const shouldUseLogo = (name?: string) => {
  if (!name) return true;
  const normalized = name.toLowerCase();
  return ["bot", "시스템", "센터"].some((keyword) => normalized.includes(keyword.toLowerCase()));
};

const getInitials = (value?: string) => {
  if (!value) return "NA";
  const cleaned = value.trim();
  if (!cleaned) return "NA";
  const parts = cleaned.split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? cleaned[1] ?? "";
  return (first + (second ?? "")).slice(0, 2).toUpperCase();
};

export function AdminUserHistory() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const { user, isLoading: isUserLoading, error: userError } = useAdminUser(userId);

  const userActivities = useMemo(
    () => activityHistory.filter((activity) => activity.actor === user?.name),
    [user?.name],
  );
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = calculateTotalPages(userActivities.length, pageSize);
  const paginatedActivities = paginate(userActivities, currentPage, pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [user?.name]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (!user) {
    if (isUserLoading) {
      return (
        <div className="rounded-2xl bg-white p-6 text-center text-muted-foreground shadow-sm">
          사용자 정보를 불러오는 중입니다...
        </div>
      );
    }
    return (
      <div className="rounded-2xl bg-white p-6 text-center text-muted-foreground shadow-sm">
        {userError ?? "사용자를 찾을 수 없습니다."}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 pt-6 min-h-0">
      <div className="flex items-center gap-6 rounded-2xl bg-white p-6 shadow-sm">
        <Avatar className="size-32">
          {user.avatarUrl ? (
            <AvatarImage
              src={user.avatarUrl}
              alt={user.name}
              width={128}
              height={128}
              className="object-cover"
            />
          ) : null}
          <AvatarFallback className="bg-slate-100 text-2xl font-semibold text-foreground">
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
            <p>{user.email || "이메일 정보 없음"}</p>
            <p>{user.phone || "전화번호 정보 없음"}</p>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <Badge variant="secondary">{user.company || "소속 미지정"}</Badge>
            <Badge variant="secondary">{user.role}</Badge>
            <Badge
              variant="outline"
              style={{
                backgroundColor: statusStyles[user.status]?.bg ?? statusStyles.INACTIVE.bg,
                color: statusStyles[user.status]?.color ?? statusStyles.INACTIVE.color,
                border: `1px solid ${
                  statusStyles[user.status]?.border ?? statusStyles.INACTIVE.border
                }`,
              }}
            >
              {statusStyles[user.status]?.label ?? statusStyles.INACTIVE.label}
            </Badge>
            <span className="text-muted-foreground">
              마지막 활동 · {user.lastActive ?? "정보 없음"}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm min-h-0">
        <div className="pb-1">
          <h3 className="text-lg font-semibold">{user.id} 활동 내역 · 전체</h3>
          <p className="text-sm text-muted-foreground">오늘 포함 전체 활동 기록입니다.</p>
        </div>
        <div className="relative w-full overflow-x-auto pt-1">
          <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="hover:bg-muted/50 border-b transition-colors">
                  <th className="text-foreground h-8 px-2 text-left align-middle font-medium whitespace-nowrap w-2/5">
                    활동 내용
                  </th>
                  <th className="text-foreground h-8 px-2 align-middle font-medium whitespace-nowrap w-1/5 text-center">
                    대상
                  </th>
                  <th className="text-foreground h-8 px-2 align-middle font-medium whitespace-nowrap w-1/6 text-center">
                    실행자
                  </th>
                  <th className="text-foreground h-8 px-2 align-middle font-medium whitespace-nowrap w-1/6 text-center">
                    작업 유형
                  </th>
                  <th className="text-foreground h-8 px-2 align-middle font-medium whitespace-nowrap w-1/6 text-center">
                    발생 시각
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
              {paginatedActivities.map((activity) => {
                const palette = activityTypePalette[activity.type] ?? activityTypePalette.default;
                return (
                  <tr key={activity.id} className="hover:bg-muted/50 border-b transition-colors">
                    <td className="p-2 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className="relative h-12 w-12 overflow-hidden rounded-xl border shadow-sm"
                          style={{ borderColor: palette.borderColor }}
                        >
                          {shouldUseLogo(activity.actor) ? (
                            <img src={logoImage} alt="WorkHub 로고" className="h-full w-full object-cover" />
                          ) : activity.actor ? (
                            <img
                              src={`https://i.pravatar.cc/80?u=${encodeURIComponent(activity.actor)}`}
                              alt={activity.actor}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm font-semibold text-foreground">
                              {getInitials(activity.actor)}
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{activity.message}</p>
                          <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                        </div>
                        </div>
                      </td>
                    <td className="p-2 align-middle whitespace-nowrap text-center text-sm text-muted-foreground">
                      {activity.target ?? "—"}
                    </td>
                    <td className="p-2 align-middle whitespace-nowrap text-center">
                      <span className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground border-transparent">
                        {activity.actor ?? "시스템"}
                      </span>
                    </td>
                    <td className="p-2 align-middle whitespace-nowrap text-center">
                      <span
                        className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0"
                        style={{ backgroundColor: palette.badgeBg, color: palette.badgeColor, borderColor: palette.borderColor }}
                      >
                        {activity.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-2 align-middle whitespace-nowrap text-center text-sm text-muted-foreground">
                      {format(new Date(activity.updatedAt ?? activity.timestamp), "yyyy.MM.dd HH:mm")}
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
          {userActivities.length > 0 && (
            <PaginationControls
              className="mt-4"
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
      </div>
    </div>
  );
}

const statusStyles = {
  ACTIVE: {
    label: "활성",
    bg: "#ECFDF5",
    color: "#15803D",
    border: "#A7F3D0",
  },
  INACTIVE: {
    label: "비활성",
    bg: "#F9FAFB",
    color: "#374151",
    border: "#E5E7EB",
  },
  SUSPENDED: {
    label: "정지",
    bg: "#FEF2F2",
    color: "#B91C1C",
    border: "#FECACA",
  },
} as const;
