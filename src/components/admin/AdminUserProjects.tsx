import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { companyUsers } from "./userData";
import { useUserProjects } from "../../hooks/useUserProjects";

// AdminUserDetail에서 쓰는 것과 동일한 스타일 맵
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

export function AdminUserProjects() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const user = useMemo(
      () => companyUsers.find((item) => item.id === userId),
      [userId],
  );
  const {
    projects: assignedProjects,
    isLoading: isProjectsLoading,
    error: projectsError,
    refetch: refetchProjects,
  } = useUserProjects(userId);

  if (!user) {
    return (
        <div className="rounded-2xl bg-white p-6 text-center text-muted-foreground shadow-sm">
          사용자를 찾을 수 없습니다.
        </div>
    );
  }

  const statusStyle =
      statusStyles[user.status as keyof typeof statusStyles] ?? statusStyles.INACTIVE;

  return (
      <div className="space-y-6 pb-12 pt-6 min-h-0">
        {/* 헤더 - 유저 정보 */}
        <div className="flex items-center gap-6 rounded-2xl bg-white p-6 shadow-sm">
          <Avatar className="size-14">
            {user.avatarUrl ? (
                <AvatarImage
                    src={user.avatarUrl}
                    alt={user.name}
                    className="object-cover"
                />
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
              {/* 🔥 여기 status 표시를 AdminUserDetail과 동일하게 */}
              <Badge
                  variant="outline"
                  style={{
                    backgroundColor: statusStyle.bg,
                    color: statusStyle.color,
                    border: `1px solid ${statusStyle.border}`,
                  }}
              >
                {statusStyle.label}
              </Badge>
              <span className="text-muted-foreground">
              마지막 활동 · {user.lastActive}
            </span>
            </div>
          </div>
        </div>

        {/* 배정된 프로젝트 전체 목록 */}
        <div className="rounded-2xl bg-white p-6 shadow-sm min-h-0">
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold">배정된 Projects · 전체</h3>
            <p className="text-sm text-muted-foreground">
              현재 {user.name}에게 배정된 전체 프로젝트입니다.
            </p>
          </div>

          <div className="grid gap-4 pt-4 max-h-[640px] overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
            {isProjectsLoading ? (
              <div className="col-span-full rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                프로젝트를 불러오는 중입니다...
              </div>
            ) : null}
            {!isProjectsLoading && projectsError ? (
              <div className="col-span-full rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-center text-sm text-destructive">
                <p>프로젝트 정보를 가져오지 못했습니다.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={refetchProjects}>
                  다시 시도
                </Button>
              </div>
            ) : null}
            {!isProjectsLoading && !projectsError && assignedProjects.length === 0 ? (
              <div className="col-span-full rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                아직 배정된 프로젝트가 없습니다.
              </div>
            ) : null}
            {!isProjectsLoading && !projectsError
              ? assignedProjects.map((project) => {
                  const managerLabel = project.managers?.join(", ") || "미지정";
                  const developerLabel =
                    project.developers?.map((developer) => developer.name).join(", ") || "";
                  const progressValue = typeof project.progress === "number" ? project.progress : 0;
                  return (
                    <div
                      key={project.id}
                      className="rounded-2xl border border-white/70 bg-white/90 shadow-sm backdrop-blur transition-shadow hover:shadow-lg cursor-pointer"
                      onClick={() => navigate(`/projects/${project.id}/nodes`)}
                    >
                      <div className="space-y-2 px-6 pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">{project.brand}</p>
                            <h4 className="text-xl font-semibold">{project.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {developerLabel ? `담당자 · ${developerLabel}` : "담당자 정보 없음"}
                            </p>
                          </div>
                          <Badge>{project.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {project.description || "설명 정보가 없습니다."}
                        </p>
                      </div>
                      <div className="space-y-4 px-6 py-4">
                        <div className="grid gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">고객 담당자</span>
                            <span className="font-medium">{managerLabel}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">팀 규모</span>
                            <span className="font-medium">{project.teamSize ?? "-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">워크플로 단계</span>
                            <span className="font-medium">{project.tasks ?? "-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">시작일</span>
                            <span className="font-medium">{project.startDate ?? "-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">마감일</span>
                            <span className="font-medium">{project.endDate ?? "-"}</span>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-sm font-medium">
                            <span>진행률</span>
                            <span>{progressValue}%</span>
                          </div>
                          <div className="relative mt-2 h-2 w-full overflow-hidden rounded-full bg-primary/20">
                            <div
                              className="h-full w-full bg-primary"
                              style={{ transform: `translateX(-${100 - progressValue}%)` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              : null}
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
