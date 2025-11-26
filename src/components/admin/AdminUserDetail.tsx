import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { MessageSquare, Upload, CheckCircle, LogIn } from "lucide-react";
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

  const user = useMemo(() => companyUsers.find((item) => item.id === userId), [userId]);

  const [actionModal, setActionModal] = useState<"role" | "password" | "remove" | null>(null);
  const closeModal = () => setActionModal(null);

  const [showAllProjects] = useState(false);
  const canViewAllProjects = (user?.projects.length ?? 0) >= 4;
  const canViewFullHistory = activityHistory.length >= 20;

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
            variant="outline"
            className="h-10 min-w-[120px] px-3 text-xs"
            onClick={() => setActionModal("role")}
          >
            Change Role
          </Button>
          <Button
            variant="secondary"
            className="h-10 min-w-[120px] px-3 text-xs"
            onClick={() => setActionModal("password")}
          >
            Initialize Password
          </Button>
          <Button
            variant="destructive"
            className="h-10 min-w-[120px] px-3 text-xs"
            onClick={() => setActionModal("remove")}
          >
            Remove User
          </Button>
      </div>

      <Dialog open={actionModal === "role"} onOpenChange={(open) => (!open ? closeModal() : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Update workspace role and permissions for {user.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="new-role">New Role</Label>
              <Input id="new-role" placeholder="e.g. Admin, Manager" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-notes">Notes</Label>
              <Input id="role-notes" placeholder="Optional notes for audit log" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionModal === "password"} onOpenChange={(open) => (!open ? closeModal() : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Initialize Password</DialogTitle>
            <DialogDescription>Send a password reset link to {user.email}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="password-user">User</Label>
              <Input id="password-user" value={user.name} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-email">Email</Label>
              <Input id="password-email" value={user.email} disabled />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={() => navigate("/admin/password")}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionModal === "remove"} onOpenChange={(open) => (!open ? closeModal() : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove User</DialogTitle>
            <DialogDescription>
              This will revoke {user.name}&rsquo;s access to WorkHub.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Make sure you have exported any required data before removing this member. This action can be
            undone by re-inviting them later.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button variant="destructive">Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
