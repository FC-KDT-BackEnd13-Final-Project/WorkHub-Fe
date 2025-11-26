import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { companyUsers } from "./userData";

export function AdminUserProjects() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const user = useMemo(() => companyUsers.find((item) => item.id === userId), [userId]);

  if (!user) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center text-muted-foreground shadow-sm">
        User not found.
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

      <div className="rounded-2xl bg-white p-6 shadow-sm min-h-0">
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold">Assigned Projects · All</h3>
          <p className="text-sm text-muted-foreground">
            Full project list currently owned by {user.name}.
          </p>
        </div>
        <div className="grid gap-4 pt-4 max-h-[640px] overflow-y-auto pr-1 md:grid-cols-2">
          {user.projects.map((project) => (
            <div
              key={project.id}
              className="rounded-2xl border border-white/70 bg-white/90 shadow-sm backdrop-blur transition-shadow hover:shadow-lg cursor-pointer"
              onClick={() => navigate(`/projects/${project.id}/nodes`)}
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
                    <div
                      className="h-full w-full bg-primary"
                      style={{ transform: `translateX(-${100 - project.progress}%)` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
