import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Textarea } from "../components/ui/textarea";

export function SettingsPage() {
  const [notificationSettings, setNotificationSettings] = useState({
    taskUpdates: true,
    commentMentions: true,
    dailyDigest: false,
    weeklyReport: true,
  });

  const [projectDefaults, setProjectDefaults] = useState({
    template: "Agile sprint",
    reviewers: "2 approvers",
    sprintLength: "2 weeks",
  });

  const [automationNotes, setAutomationNotes] = useState(
    "Notify me when handoffs are delayed more than 24 hours.",
  );

  const [apiKey, setApiKey] = useState("workhub_live_9f39d2********");

  return (
    <div className="space-y-6 pb-12 pt-6 min-h-0">
      <div className="flex flex-wrap items-center gap-6 rounded-2xl bg-white p-6 shadow-sm">
        <Avatar className="size-16">
          <AvatarImage src="https://i.pravatar.cc/80?img=18" alt="Project Admin" className="object-cover" />
          <AvatarFallback className="bg-slate-100 text-lg font-semibold text-foreground">PM</AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <div>
            <h2 className="text-2xl font-semibold">Workspace Settings</h2>
            <p className="text-sm text-muted-foreground">
              Configure preferences for the project management team.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="secondary">Workspace Admin</Badge>
            <Badge variant="secondary">Nova FinTech</Badge>
            <span className="text-muted-foreground">Last updated · 5 minutes ago</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 min-h-0">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="border-b pb-4">
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Control how project updates reach the admin team.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {Object.entries(notificationSettings).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-xl border px-4 py-3">
                <div>
                  <p className="font-medium">
                    {key === "taskUpdates"
                      ? "Task status changes"
                      : key === "commentMentions"
                        ? "Comment mentions"
                        : key === "dailyDigest"
                          ? "Daily digest email"
                          : "Weekly health report"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {key === "taskUpdates"
                      ? "Trigger Slack alerts when tasks move between stages."
                      : key === "commentMentions"
                        ? "Receive push notifications for @mentions."
                        : key === "dailyDigest"
                          ? "Send a daily morning summary at 9AM."
                          : "Send a workspace-wide status email every Friday."}
                  </p>
                </div>
                <Switch
                  checked={value}
                  onCheckedChange={(next) =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      [key]: next,
                    }))
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="border-b pb-4">
            <CardTitle>Project Defaults</CardTitle>
            <CardDescription>Templates and guardrails for new project spaces.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="template">Default template</Label>
              <Input
                id="template"
                value={projectDefaults.template}
                onChange={(event) =>
                  setProjectDefaults((prev) => ({ ...prev, template: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reviewers">Required reviewers</Label>
              <Input
                id="reviewers"
                value={projectDefaults.reviewers}
                onChange={(event) =>
                  setProjectDefaults((prev) => ({ ...prev, reviewers: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sprint">Sprint length</Label>
              <Input
                id="sprint"
                value={projectDefaults.sprintLength}
                onChange={(event) =>
                  setProjectDefaults((prev) => ({ ...prev, sprintLength: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="automation-notes">Automation notes</Label>
              <Textarea
                id="automation-notes"
                value={automationNotes}
                onChange={(event) => setAutomationNotes(event.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline">Reset</Button>
              <Button>Save defaults</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="border-b pb-4">
            <CardTitle>Integrations</CardTitle>
            <CardDescription>Manage access keys and automation hooks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">Primary API key</Label>
              <div className="flex items-center gap-3">
                <Input id="api-key" value={apiKey} onChange={(event) => setApiKey(event.target.value)} />
                <Button variant="secondary">Rotate</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhook">Webhook endpoint</Label>
              <Input id="webhook" placeholder="https://hooks.workhub.dev/..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sync">Sync window (hours)</Label>
              <Input id="sync" type="number" placeholder="e.g. 12" />
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline">Disconnect</Button>
              <Button>Update integrations</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm lg:col-span-2">
          <CardHeader className="border-b pb-4">
            <CardTitle>Workspace Policies</CardTitle>
            <CardDescription>Shared rules that apply to every project.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border bg-white/60 px-4 py-3 shadow-sm">
                <p className="text-sm text-muted-foreground">Required approvers</p>
                <p className="text-2xl font-semibold">2</p>
              </div>
              <div className="rounded-2xl border bg-white/60 px-4 py-3 shadow-sm">
                <p className="text-sm text-muted-foreground">Auto-archive</p>
                <p className="text-2xl font-semibold">90 days</p>
              </div>
              <div className="rounded-2xl border bg-white/60 px-4 py-3 shadow-sm">
                <p className="text-sm text-muted-foreground">Escalation SLA</p>
                <p className="text-2xl font-semibold">4 hrs</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="policy-notes">Policy notes</Label>
              <Textarea id="policy-notes" placeholder="Document change approval process, escalation contacts..." />
            </div>
            <div className="flex justify-end">
              <Button>Save policies</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
