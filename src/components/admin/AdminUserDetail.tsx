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
import { companyUsers, activityHistory } from "./userData";

const activityIconMap: Record<string, JSX.Element> = {
  comment: <MessageSquare className="h-4 w-4 text-slate-500" />,
  upload: <Upload className="h-4 w-4 text-slate-500" />,
  completed: <CheckCircle className="h-4 w-4 text-slate-500" />,
  login: <LogIn className="h-4 w-4 text-slate-500" />,
};

export function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const user = useMemo(() => companyUsers.find((item) => item.id === userId), [userId]);

  const basePath = `/admin/users/${userId}`;
  const changeRoleModalPath = `${basePath}/change-role`;
  const initPasswordModalPath = `${basePath}/init-password`;
  const removeUserModalPath = `${basePath}/remove-user`;

  const [selectedRole, setSelectedRole] = useState(user?.role || "User"); // Default to current role or 'User'

  // State for Initialize Password modal steps
  const [passwordResetStep, setPasswordResetStep] = useState(1);
  const [authCode, setAuthCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const closeModal = useCallback(() => {
    navigate(basePath, { replace: true });
    setPasswordResetStep(1); // Reset step when modal closes
    setAuthCode("");
    setNewPassword("");
    setConfirmPassword("");
  }, [navigate, basePath]);

  // Action handlers for modals
  const handleChangeRole = () => {
    console.log(`${user.name}의 역할을 ${selectedRole}로 변경`);
    // Simulate API call
    setTimeout(() => {
      alert(`${user.name}의 역할이 ${selectedRole}로 변경되었습니다.`);
      closeModal();
    }, 500);
  };

  const handleSendCode = () => {
    console.log(`${user.email}로 인증 코드를 전송`);
    // Simulate API call
    setTimeout(() => {
      alert(`${user.email}로 인증 코드를 전송했습니다.`);
      setPasswordResetStep(2);
    }, 500);
  };

  const handleVerifyCode = () => {
    console.log(`인증 코드 확인: ${authCode}`);
    // Simulate API call
    if (authCode === "123456") { // Simple dummy code
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
    // Simulate API call
    setTimeout(() => {
      alert("비밀번호가 성공적으로 변경되었습니다.");
      closeModal();
    }, 500);
  };

  const handleRemoveUser = () => {
    console.log(`사용자 삭제: ${user.name}`);
    // Simulate API call
    setTimeout(() => {
      alert(`${user.name} 사용자가 삭제되었습니다.`);
      navigate("/admin/users", { replace: true }); // Navigate to user list after removal
    }, 500);
  };

  // Effect to reset password reset step if modal is closed via URL change
  useEffect(() => {
    if (location.pathname !== initPasswordModalPath) {
      setPasswordResetStep(1);
      setAuthCode("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [location.pathname, initPasswordModalPath]);

  const [showAllProjects] = useState(false);
  const canViewAllProjects = (user?.projects.length ?? 0) >= 4;
  const canViewFullHistory = activityHistory.length >= 20;

  //유저 없음
  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="login-theme shadow-lg w-full" style={{ maxWidth: "var(--login-card-max-width, 42rem)" }}>
          <CardHeader className="space-y-2 pb-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
            <h2 className="text-xl font-semibold">사용자를 찾을 수 없습니다.</h2>
            <p className="text-sm text-muted-foreground">
              요청하신 사용자 ID({userId})에 해당하는 정보를 찾을 수 없습니다.
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

      <div className="grid gap-6 lg:grid-cols-2 min-h-0">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">배정된 프로젝트</h3>
                <p className="text-sm text-muted-foreground">현재 이 구성원에게 배정된 프로젝트입니다.</p>
              </div>
              <Button
                variant="link"
                className="px-0 text-sm"
                disabled={!canViewAllProjects}
                onClick={() => canViewAllProjects && navigate(`/admin/users/${user.id}/projects`)}
              >
                전체 보기
              </Button>
            </div>
          </div>
          <div
            className={`grid gap-4 pt-4 ${
              user.projects.length > 3 ? "max-h-[520px] overflow-y-auto pr-1" : ""
            }`}
          >
            {user.projects.slice(0, 3).map((project) => (
              <div
                key={project.id}
                className="cursor-pointer rounded-2xl border border-white/70 bg-white/90 shadow-sm backdrop-blur transition-shadow hover:shadow-lg"
              >
                <div className="space-y-2 px-6 pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{project.client}</p>
                      <h4 className="text-xl font-semibold">{project.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {project.role} · {project.owner}
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
                      <span className="font-medium">{project.manager}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">팀 규모</span>
                      <span className="font-medium">{project.teamSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">워크플로 단계</span>
                      <span className="font-medium">{project.tasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">시작일</span>
                      <span className="font-medium">{project.start}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">마감일</span>
                      <span className="font-medium">{project.due}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>진행률</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="relative mt-2 h-2 w-full overflow-hidden rounded-full bg-primary/20">
                      <div className="h-full w-full bg-primary" style={{ transform: `translateX(-${100 - project.progress}%)` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
            className={`space-y-4 pt-4 ${
              activityHistory.length > 20 ? "max-h-[480px] overflow-y-auto pr-1" : ""
            }`}
          >
            {activityHistory.slice(0, 20).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="rounded-full bg-muted p-2">
                  {activityIconMap[activity.type]}
                </div>
                <div>
                  <p className="font-medium text-sm">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            className="h-9 min-w-[120px] px-3 py-1 text-sm rounded-md border border-border"
            onClick={() => navigate(changeRoleModalPath)}
          >
            역할 변경
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

      {/* Change Role Modal */}
      {location.pathname === changeRoleModalPath && (
        <div className="fixed inset-0 z-50">
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-full" style={{ maxWidth: "var(--login-card-max-width, 42rem)" }}>
              <Card className="login-theme border border-border shadow-lg">
                <CardHeader className="space-y-2 pb-6">
                  <h2 className="text-xl text-center">User 역할 변경</h2>
                  <p className="text-sm text-muted-foreground text-center">
                    {user.name}의 워크스페이스 역할과 권한을 업데이트하세요.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-role" className="text-gray-700">새 역할</Label>
                      <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger
                          id="new-role"
                          className="h-9 rounded-md border border-border bg-input-background px-3 py-1 focus:bg-white focus:border-primary transition-colors"
                        >
                          <SelectValue placeholder="역할을 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Client">Client</SelectItem>
                          <SelectItem value="Developer">Developer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 flex justify-between gap-2">
                    <Button variant="secondary" className="w-1/2" onClick={closeModal}>
                      취소
                    </Button>
                    <Button className="w-1/2" onClick={handleChangeRole}>Save Changes</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Initialize Password Modal */}
      {location.pathname === initPasswordModalPath && (
        <div className="fixed inset-0 z-50">
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-full" style={{ maxWidth: "var(--login-card-max-width, 42rem)" }}>
              <Card className="login-theme border border-border shadow-lg">
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
            </div>
          </div>
        </div>
      )}

      {/* Remove User Modal */}
      {location.pathname === removeUserModalPath && (
        <div className="fixed inset-0 z-50">
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-full" style={{ maxWidth: "var(--login-card-max-width, 42rem)" }}>
              <Card className="login-theme border border-border shadow-lg">
                <CardHeader className="space-y-2 pb-6">
                  <h2 className="text-xl text-center">User 삭제</h2>
                  <p className="text-sm text-muted-foreground text-center">
                    {user.name}의 WorkHub 접근 권한이 회수됩니다.
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    이 구성원을 영구적으로 삭제하기 전에 필요한 데이터를 모두 내보냈는지 확인하세요. 이 작업은 되돌릴 수 없습니다.
                  </p>
                  <div className="mt-6 pt-6 flex justify-between gap-2">
                    <Button variant="secondary" className="w-1/2" onClick={closeModal}>
                      취소
                    </Button>
                    <Button variant="destructive" className="w-1/2 text-white" onClick={handleRemoveUser}>User 삭제</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
