import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function AdminUserSuccess() {
  const navigate = useNavigate();

  return (
    <Card className="rounded-2xl border border-white/70 bg-white text-center shadow-sm">
      <CardContent className="flex flex-col items-center gap-4 py-16">
        <div className="rounded-full bg-emerald-50 p-4">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-semibold">User successfully created!</h1>
        <p className="text-muted-foreground">
          Send the welcome email and share credentials with the member or client admin.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => navigate("/admin/users/add")}>Add another user</Button>
          <Button variant="outline" onClick={() => navigate("/admin/users")}>
            Go to User List
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
