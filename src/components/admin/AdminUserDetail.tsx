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
    console.log(`Changing role for ${user.name} to ${selectedRole}`);
    // Simulate API call
    setTimeout(() => {
      alert(`Role for ${user.name} changed to ${selectedRole}`);
      closeModal();
    }, 500);
  };

  const handleSendCode = () => {
    console.log(`Sending auth code to ${user.email}`);
    // Simulate API call
    setTimeout(() => {
      alert(`Auth code sent to ${user.email}`);
      setPasswordResetStep(2);
    }, 500);
  };

  const handleVerifyCode = () => {
    console.log(`Verifying code: ${authCode}`);
    // Simulate API call
    if (authCode === "123456") { // Simple dummy code
      alert("Code verified!");
      setPasswordResetStep(3);
    } else {
      alert("Invalid code. Please try again.");
    }
  };

  const handleSetNewPassword = () => {
    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    console.log(`Setting new password for ${user.name}`);
    // Simulate API call
    setTimeout(() => {
      alert("Password successfully updated!");
      closeModal();
    }, 500);
  };

  const handleRemoveUser = () => {
    console.log(`Removing user: ${user.name}`);
    // Simulate API call
    setTimeout(() => {
      alert(`${user.name} has been removed.`);
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
            <Badge variant={user.status === "Active" ? "default" : "secondary"}>{user.status}</Badge>
            <span className="text-muted-foreground">Last active · {user.lastActive}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 min-h-0">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Assigned Projects</h3>
                <p className="text-sm text-muted-foreground">Active initiatives currently owned by the member.</p>
              </div>
              <Button
                variant="link"
                className="px-0 text-sm"
                disabled={!canViewAllProjects}
                onClick={() => canViewAllProjects && navigate(`/admin/users/${user.id}/projects`)}
              >
                View all
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
                      <span className="text-muted-foreground">Client Manager</span>
                      <span className="font-medium">{project.manager}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Team Size</span>
                      <span className="font-medium">{project.teamSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Workflow Steps</span>
                      <span className="font-medium">{project.tasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start</span>
                      <span className="font-medium">{project.start}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due</span>
                      <span className="font-medium">{project.due}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>Progress</span>
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
                <h3 className="text-lg font-semibold">Activity History</h3>
                <p className="text-sm text-muted-foreground">Recent events from the last 30 days.</p>
              </div>
              <Button
                variant="link"
                className="px-0 text-sm"
                disabled={!canViewFullHistory}
                onClick={() => canViewFullHistory && navigate(`/admin/users/${user.id}/history`)}
              >
                View all
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
            Change Role
          </Button>
          <Button
            variant="secondary"
            className="h-9 min-w-[120px] px-3 py-1 text-sm rounded-md border border-border"
            onClick={() => navigate(initPasswordModalPath)}
          >
            Initialize Password
          </Button>
          <Button
            variant="destructive"
            className="h-9 min-w-[120px] px-3 py-1 text-sm rounded-md border border-border"
            onClick={() => navigate(removeUserModalPath)}
          >
            Remove User
          </Button>
      </div>

      {/* Change Role Modal */}
      {location.pathname === changeRoleModalPath && (
        <div className="fixed inset-0 z-50">
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-full" style={{ maxWidth: "var(--login-card-max-width, 42rem)" }}>
              <Card className="login-theme border border-border shadow-lg">
                <CardHeader className="space-y-2 pb-6">
                  <h2 className="text-xl text-center">Change User Role</h2>
                  <p className="text-sm text-muted-foreground text-center">
                    Update workspace role and permissions for {user.name}.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-role" className="text-gray-700">New Role</Label>
                      <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger
                          id="new-role"
                          className="h-9 rounded-md border border-border bg-input-background px-3 py-1 focus:bg-white focus:border-primary transition-colors"
                        >
                          <SelectValue placeholder="Select a role" />
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
                      Cancel
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
                      <h2 className="text-xl text-center">Initialize Password</h2>
                      <p className="text-sm text-muted-foreground text-center">
                        Send a password reset link to {user.email}.
                      </p>
                    </>
                  )}
                  {passwordResetStep === 2 && (
                    <>
                      <h2 className="text-xl text-center">Verify Code</h2>
                      <p className="text-sm text-muted-foreground text-center">
                        Enter the authentication code sent to {user.email}.
                      </p>
                    </>
                  )}
                  {passwordResetStep === 3 && (
                    <>
                      <h2 className="text-xl text-center">Set New Password</h2>
                      <p className="text-sm text-muted-foreground text-center">
                        Enter and confirm your new password for {user.name}.
                      </p>
                    </>
                  )}
                </CardHeader>
                <CardContent>
                  {passwordResetStep === 1 && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="password-email" className="text-gray-700">Email</Label>
                        <Input
                          id="password-email"
                          value={user.email}
                          disabled
                          className="h-9 rounded-md border border-border bg-input-background px-3 py-1 focus:bg-white focus:border-primary transition-colors"
                        />
                      </div>
                      <div className="mt-6 pt-6 flex justify-between gap-2">
                        <Button variant="secondary" className="w-1/2" onClick={closeModal}>
                          Cancel
                        </Button>
                        <Button className="w-1/2" onClick={handleSendCode}>Send Code</Button>
                      </div>
                    </>
                  )}
                  {passwordResetStep === 2 && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="auth-code" className="text-gray-700">Authentication Code</Label>
                        <Input
                          id="auth-code"
                          value={authCode}
                          onChange={(e) => setAuthCode(e.target.value)}
                          placeholder="Enter code"
                          className="h-9 rounded-md border border-border bg-input-background px-3 py-1 focus:bg-white focus:border-primary transition-colors"
                        />
                      </div>
                      <div className="mt-6 pt-6 flex justify-between gap-2">
                        <Button variant="secondary" className="w-1/2" onClick={() => setPasswordResetStep(1)}>
                          Back
                        </Button>
                        <Button className="w-1/2" onClick={handleVerifyCode}>Verify Code</Button>
                      </div>
                    </>
                  )}
                  {passwordResetStep === 3 && (
                    <>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-password" className="text-gray-700">New Password</Label>
                          <Input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="h-9 rounded-md border border-border bg-input-background px-3 py-1 focus:bg-white focus:border-primary transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password" className="text-gray-700">Confirm New Password</Label>
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
                          Back
                        </Button>
                        <Button className="w-1/2" onClick={handleSetNewPassword}>Set Password</Button>
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
                  <h2 className="text-xl text-center">Remove User</h2>
                  <p className="text-sm text-muted-foreground text-center">
                    This will revoke {user.name}&rsquo;s access to WorkHub.
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Make sure you have exported any required data before permanently removing this member. This action can be undone.
                  </p>
                  <div className="mt-6 pt-6 flex justify-between gap-2">
                    <Button variant="secondary" className="w-1/2" onClick={closeModal}>
                      Cancel
                    </Button>
                    <Button variant="destructive" className="w-1/2 text-white" onClick={handleRemoveUser}>Remove User</Button>
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
