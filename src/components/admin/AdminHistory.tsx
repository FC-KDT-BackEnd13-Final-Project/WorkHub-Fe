import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

const filters = ["Today", "7 days", "30 days", "All"] as const;

const activities = [
  { id: 1, user: "Chris Davis", description: "updated Project Atlas and assigned two tasks", time: "Today · 09:12" },
  { id: 2, user: "Jane Smith", description: "uploaded design_review_v2.pdf to Marketing Sprint", time: "Today · 08:43" },
  { id: 3, user: "Noah Lee", description: "created new workspace for client Lumina Labs", time: "Yesterday · 21:18" },
  { id: 4, user: "Ava Kim", description: "added 3 new members to WorkHub Beta program", time: "Yesterday · 14:05" },
];

export function AdminHistory() {
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("Today");

  return (
    <div className="space-y-6 pb-12">
      <Card className="rounded-2xl border border-white/70 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>Monitor every significant change across the workspace.</CardDescription>
        </CardHeader>
      </Card>

      <Card className="rounded-2xl border border-white/70 bg-white shadow-sm">
        <CardContent className="flex flex-wrap gap-2 py-6">
          {filters.map((filter) => (
            <Button
              key={filter}
              variant={filter === activeFilter ? "default" : "outline"}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-white/70 bg-white shadow-sm">
        <CardContent className="divide-y divide-slate-100">
          {activities.map((activity) => (
            <div key={activity.id} className="py-4">
              <p className="font-medium">{activity.user}</p>
              <p className="text-sm text-muted-foreground">{activity.description}</p>
              <p className="text-xs text-muted-foreground">{activity.time}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
