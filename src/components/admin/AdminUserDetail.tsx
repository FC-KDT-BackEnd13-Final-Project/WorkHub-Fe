import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { MessageSquare, Upload, CheckCircle, LogIn, AlertCircle } from "lucide-react";
import logoImage from "../../../image/logo.png";
import { activityHistory } from "./userData";
import { activityTypePalette } from "./activityPalette";
import { useUserProjects } from "../../hooks/useUserProjects";
import { ModalShell } from "../common/ModalShell";
import { useAdminUser } from "../../hooks/useAdminUsers";

const activityIconMap: Record<string, JSX.Element> = {
  comment: <MessageSquare className="h-4 w-4 text-slate-500" />,
  upload: <Upload className="h-4 w-4 text-slate-500" />,
  completed: <CheckCircle className="h-4 w-4 text-slate-500" />,
  login: <LogIn className="h-4 w-4 text-slate-500" />,
};


function shouldUseLogo(name?: string) {
  if (!name) return true;
  const normalized = name.toLowerCase();
  return ["bot", "시스템", "센터"].some((keyword) => normalized.includes(keyword.toLowerCase()));
}

function getInitials(value?: string) {
  if (!value) return "NA";
  const cleaned = value.trim();
  if (!cleaned) return "NA";
  const parts = cleaned.split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? cleaned[1] ?? "";
  return (first + (second ?? "")).slice(0, 2).toUpperCase();
}

export function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading: isUserLoading, error: userError } = useAdminUser(userId);

  const basePath = `/admin/users/${userId}`;
  const changeRoleModalPath = `${basePath}/change-role`;
  const initPasswordModalPath = `${basePath}/init-password`;
  const removeUserModalPath = `${basePath}/remove-user`;

  const [selectedRole, setSelectedRole] = useState(user?.role || "Client"); // 기본값은 Client

  const [selectedStatus, setSelectedStatus] = useState<keyof typeof statusStyles>(
      (user?.status as keyof typeof statusStyles) || "ACTIVE",
  );

  useEffect(() => {
    if (user?.role) {
      setSelectedRole(user.role);
    }
    if (user?.status && statusStyles[user.status as keyof typeof statusStyles]) {
      setSelectedStatus(user.status as keyof typeof statusStyles);
    }
  }, [user?.role, user?.status]);

  // 비밀번호 초기화 모달 단계를 관리
  const [passwordResetStep, setPasswordResetStep] = useState(1);
  const [authCode, setAuthCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const closeModal = useCallback(() => {
    navigate(basePath, { replace: true });
    setPasswordResetStep(1); // 모달이 닫히면 단계 초기화
    setAuthCode("");
    setNewPassword("");
    setConfirmPassword("");
  }, [navigate, basePath]);

  // 모달별 동작 핸들러
  const handleChangeRole = () => {
    if (!user) return;

    // 목업 데이터 기준으로 현재 user 객체 직접 수정
    (user as any).role = selectedRole;
    (user as any).status = selectedStatus;

    console.log(
        `${user.name}의 권한을 ${selectedRole}, 상태를 ${statusStyles[selectedStatus].label}(으)로 변경`,
    );

    closeModal();
  };

  const handleSendCode = () => {
    console.log(`${user.email}로 인증 코드를 전송`);
    // API 동작을 가정한 딜레이
    setTimeout(() => {
      alert(`${user.email}로 인증 코드를 전송했습니다.`);
      setPasswordResetStep(2);
    }, 500);
  };

  const handleVerifyCode = () => {
    console.log(`인증 코드 확인: ${authCode}`);
    // API 동작을 가정한 딜레이
    if (authCode === "123456") { // 단순 예시 코드
      alert("코드가 확인되었습니다.");
      setPasswordResetStep(3);
    } else {
      alert("인증 코드가 올바르지 않습니다. 다시 시도해주세요.");
    }
  };

  const handleSetNewPassword = () => {
    if (newPassword.length < 6) {
      alert("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
    console.log(`${user.name}의 새 비밀번호 설정`);
    // API 동작을 가정한 딜레이
    setTimeout(() => {
      alert("비밀번호가 성공적으로 변경되었습니다.");
      closeModal();
    }, 500);
  };

  const handleRemoveUser = () => {
    console.log(`사용자 삭제: ${user.name}`);
    // API 동작을 가정한 딜레이
    setTimeout(() => {
      alert(`${user.name} 사용자가 삭제되었습니다.`);
      navigate("/admin/users", { replace: true }); // 삭제 후 사용자 목록으로 이동
    }, 500);
  };

  const isAnyModalOpen =
    location.pathname === changeRoleModalPath ||
    location.pathname === initPasswordModalPath ||
    location.pathname === removeUserModalPath;

  // ESC 키 입력으로 모달 닫기
  useEffect(() => {
    if (!isAnyModalOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAnyModalOpen, closeModal]);

  // URL 변경으로 모달이 닫힐 때 비밀번호 초기화 단계 리셋
  useEffect(() => {
    if (location.pathname !== initPasswordModalPath) {
      setPasswordResetStep(1);
      setAuthCode("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [location.pathname, initPasswordModalPath]);

  const {
    projects: assignedProjects,
    isLoading: isProjectsLoading,
    error: projectsError,
    refetch: refetchProjects,
  } = useUserProjects(userId);
  const normalizeStatus = useCallback((status?: string) => {
    if (!status) return "";
    return status.replace(/_/g, " ").replace(/\s+/g, "").toLowerCase();
  }, []);
  const isActiveStatus = useCallback(
    (status?: string) => {
      const normalized = normalizeStatus(status);
      if (!normalized) return false;
      const activeStatusKeywords = [
        "inprogress",
        "review",
        "planning",
        "contract",
        "검토중",
        "진행중",
      ];
      return activeStatusKeywords.some((keyword) => normalized.includes(keyword));
    },
    [normalizeStatus],
  );
  const activeProjects = useMemo(
    () => assignedProjects.filter((project) => isActiveStatus(project.status)),
    [assignedProjects, isActiveStatus],
  );
  const displayedProjects = activeProjects.slice(0, 3);
  const hasOverflowingActiveProjects = activeProjects.length > 3;
  const canViewAllProjects = assignedProjects.length > 0;
  const userActivityHistory = useMemo(
    () => activityHistory.filter((activity) => activity.actor === user?.name),
    [user?.name],
  );
  const canViewFullHistory = userActivityHistory.length >= 15;

  // 유저 데이터를 찾을 수 없는 경우
  if (!user) {
    if (isUserLoading) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          회원 정보를 불러오는 중입니다...
        </div>
      );
    }
    return (
      <div className="h-full flex items-center justify-center">
        <Card variant="modal" className="login-theme shadow-lg w-full" style={{ maxWidth: "var(--login-card-max-width, 42rem)" }}>
          <CardHeader className="space-y-2 pb-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
            <h2 className="text-xl font-semibold">사용자를 찾을 수 없습니다.</h2>
            <p className="text-sm text-muted-foreground">
              {userError || `요청하신 사용자 ID(${userId})에 해당하는 정보를 찾을 수 없습니다.`}
            </p>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate("/admin/users")} className="mt-4">
              사용자 목록으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const changeRoleModal = (
    <ModalShell open={location.pathname === changeRoleModalPath} onClose={closeModal}>
      <Card variant="modal" className="login-theme border border-border shadow-lg">
        <CardHeader className="space-y-2 pb-6">
          <h2 className="text-xl text-center">권한/상태 변경</h2>
          <p className="text-sm text-muted-foreground text-center">
            {user.name}의 워크스페이스 권한과 계정 상태를 업데이트하세요.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-role" className="text-gray-700">
                권한
              </Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger
                  id="new-role"
                  className="h-9 rounded-md border border-border bg-input-background px-3 py-1 focus:bg-white focus:border-primary transition-colors"
                >
                  <SelectValue placeholder="권한을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Client">Client</SelectItem>
                  <SelectItem value="Developer">Developer</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-status" className="text-gray-700">
                계정 상태
              </Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) => setSelectedStatus(value as keyof typeof statusStyles)}
              >
                <SelectTrigger
                  id="new-status"
                  className="h-9 rounded-md border border-border bg-input-background px-3 py-1 focus:bg-white focus:border-primary transition-colors"
                >
                  <SelectValue placeholder="상태를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">활성</SelectItem>
                  <SelectItem value="INACTIVE">비활성</SelectItem>
                  <SelectItem value="SUSPENDED">정지</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-6 pt-6 flex justify-between gap-2">
            <Button variant="secondary" className="w-1/2" onClick={closeModal}>
              취소
            </Button>
            <Button className="w-1/2" onClick={handleChangeRole}>
              저장하기
            </Button>
          </div>
        </CardContent>
      </Card>
    </ModalShell>
  );

  const initPasswordModal = (
    <ModalShell open={location.pathname === initPasswordModalPath} onClose={closeModal}>
      <Card variant="modal" className="login-theme border border-border shadow-lg">
        <CardHeader className="space-y-2 pb-6">
            {passwordResetStep === 1 && (
              <>
                <h2 className="text-xl text-center">비밀번호 초기화</h2>
                  <p className="text-sm text-muted-foreground text-center">
                    {user.email}로 비밀번호 재설정 링크를 전송합니다.
                  </p>
                </>
              )}
              {passwordResetStep === 2 && (
                <>
                  <h2 className="text-xl text-center">코드 확인</h2>
                  <p className="text-sm text-muted-foreground text-center">
                    {user.email}로 전송된 인증 코드를 입력하세요.
                  </p>
                </>
              )}
              {passwordResetStep === 3 && (
                <>
                  <h2 className="text-xl text-center">새 비밀번호 설정</h2>
                  <p className="text-sm text-muted-foreground text-center">
                    {user.name}의 새 비밀번호를 입력하고 확인하세요.
                  </p>
                </>
              )}
            </CardHeader>
            <CardContent>
              {passwordResetStep === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password-email" className="text-gray-700">이메일</Label>
                    <Input
                      id="password-email"
                      value={user.email}
                      disabled
                      className="h-9 rounded-md border border-border bg-input-background px-3 py-1 focus:bg-white focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="mt-6 pt-6 flex justify-between gap-2">
                    <Button variant="secondary" className="w-1/2" onClick={closeModal}>
                      취소
                    </Button>
                    <Button className="w-1/2" onClick={handleSendCode}>코드 보내기</Button>
                  </div>
                </>
              )}
              {passwordResetStep === 2 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="auth-code" className="text-gray-700">인증 코드</Label>
                    <Input
                      id="auth-code"
                      value={authCode}
                      onChange={(e) => setAuthCode(e.target.value)}
                      placeholder="코드를 입력하세요"
                      className="h-9 rounded-md border border-border bg-input-background px-3 py-1 focus:bg-white focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="mt-6 pt-6 flex justify-between gap-2">
                    <Button variant="secondary" className="w-1/2" onClick={() => setPasswordResetStep(1)}>
                      뒤로
                    </Button>
                    <Button className="w-1/2" onClick={handleVerifyCode}>코드 확인</Button>
                  </div>
                </>
              )}
              {passwordResetStep === 3 && (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="text-gray-700">새 비밀번호</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-9 rounded-md border border-border bg-input-background px-3 py-1 focus:bg-white focus:border-primary transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-gray-700">새 비밀번호 확인</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-9 rounded-md border border-border bg-input-background px-3 py-1 focus:bg-white focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                  <div className="mt-6 pt-6 flex justify-between gap-2">
                    <Button variant="secondary" className="w-1/2" onClick={() => setPasswordResetStep(2)}>
                      뒤로
                    </Button>
                    <Button className="w-1/2" onClick={handleSetNewPassword}>비밀번호 설정</Button>
                  </div>
                </>
              )}
            </CardContent>
      </Card>
    </ModalShell>
  );

  const removeUserModal = (
    <ModalShell open={location.pathname === removeUserModalPath} onClose={closeModal}>
      <Card variant="modal" className="login-theme border border-border shadow-lg">
        <CardHeader className="space-y-2 pb-6">
          <h2 className="text-xl text-center">회원 삭제</h2>
          <p className="text-sm text-muted-foreground text-center">
            {user.name}의 WorkHub 접근 권한이 회수됩니다.
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center mb-4">
            이 구성원을 영구적으로 삭제하기 전에 필요한 데이터를 모두 내보냈는지 확인하세요.
            <br />
            <span className="font-semibold">이 작업은 되돌릴 수 없습니다.</span>
          </p>
          <div className="mt-6 pt-6 flex justify-between gap-2">
            <Button variant="secondary" className="w-1/2" onClick={closeModal}>
              취소
            </Button>
            <Button variant="destructive" className="w-1/2 text-white" onClick={handleRemoveUser}>
              회원 삭제
            </Button>
          </div>
        </CardContent>
      </Card>
    </ModalShell>
  );
  return (
    <>
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

      <div className="grid gap-6 lg:grid-cols-2 min-h-0">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">배정된 프로젝트</h3>
                <p className="text-sm text-muted-foreground">현재 담당하고 있는 프로젝트입니다.</p>
              </div>
              <Button
                variant="link"
                className="px-0 text-sm"
                disabled={!canViewAllProjects || isProjectsLoading}
                onClick={() => canViewAllProjects && navigate(`/admin/users/${user.id}/projects`)}
              >
                전체 보기
              </Button>
            </div>
          </div>
          <div
            className={`grid gap-4 pt-4 ${
              hasOverflowingActiveProjects ? "max-h-[520px] overflow-y-auto pr-1" : ""
            }`}
          >
            {isProjectsLoading ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                프로젝트를 불러오는 중입니다...
              </div>
            ) : null}
            {!isProjectsLoading && projectsError ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
                <p>프로젝트 정보를 가져오는 데 실패했습니다.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={refetchProjects}>
                  다시 시도
                </Button>
              </div>
            ) : null}
            {!isProjectsLoading && !projectsError && displayedProjects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                현재 진행 중인 프로젝트가 없습니다.
              </div>
            ) : null}
            {!isProjectsLoading && !projectsError
              ? displayedProjects.map((project) => {
                  const managerLabel = project.managers?.join(", ") || "미지정";
                  const developerLabel =
                    project.developers?.map((developer) => developer.name).join(", ") || "";
                  const progressValue = typeof project.progress === "number" ? project.progress : 0;
                  return (
                    <div
                      key={project.id}
                      className="cursor-pointer rounded-2xl border border-white/70 bg-white/90 shadow-sm backdrop-blur transition-shadow hover:shadow-lg"
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
                        <p className="text-sm text-muted-foreground">{project.description}</p>
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
                            <div className="h-full w-full bg-primary" style={{ transform: `translateX(-${100 - progressValue}%)` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              : null}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">활동 내역</h3>
                <p className="text-sm text-muted-foreground">지난 30일 동안의 주요 활동입니다.</p>
              </div>
              <Button
                variant="link"
                className="px-0 text-sm"
                disabled={!canViewFullHistory}
                onClick={() => canViewFullHistory && navigate(`/admin/users/${user.id}/history`)}
              >
                전체 보기
              </Button>
            </div>
          </div>
          <div
            className={`space-y-4 pt-2 ${
              userActivityHistory.length > 15 ? "max-h-[520px] overflow-y-auto pr-1" : ""
            }`}
          >
            <div className="overflow-x-hidden">
              {userActivityHistory.slice(0, 15).map((activity) => {
                const palette = activityTypePalette[activity.type] ?? activityTypePalette.default;
                const activityIcon = activityIconMap[activity.type] ?? (
                  <AlertCircle className="h-4 w-4 text-slate-400" aria-hidden />
                );
                return (
                  <div key={activity.id} className="flex items-start justify-between gap-3 rounded-lg bg-white/90 p-3 shadow-sm">
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
                          <div className="flex items-center gap-2">
                            {activityIcon}
                            <p className="text-sm font-medium text-foreground">{activity.message}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                        </div>
                      </div>
                    <div className="text-right text-sm text-muted-foreground whitespace-nowrap">
                      {activity.target ?? "—"}
                    </div>
                  </div>
                );
              })}
              {userActivityHistory.length === 0 && (
                <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                  활동 기록이 없습니다.
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          className="h-9 min-w-[120px] px-3 py-1 text-sm rounded-md border border-border"
          onClick={() => navigate(changeRoleModalPath)}
        >
          권한/상태 변경
        </Button>
        <Button
          variant="secondary"
          className="h-9 min-w-[120px] px-3 py-1 text-sm rounded-md border border-border"
          onClick={() => navigate(initPasswordModalPath)}
        >
          비밀번호 초기화
        </Button>
        <Button
          variant="destructive"
          className="h-9 min-w-[120px] px-3 py-1 text-sm rounded-md border border-border"
          onClick={() => navigate(removeUserModalPath)}
        >
          회원 삭제
        </Button>
      </div>
    </div>
    {changeRoleModal}
    {initPasswordModal}
    {removeUserModal}
    </>
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
