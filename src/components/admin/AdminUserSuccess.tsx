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
        <h1 className="text-2xl font-semibold">회원 등록이 완료되었습니다!</h1>
        <p className="text-muted-foreground">
          환영 이메일을 발송하고 멤버 또는 고객 관리자에게 계정 정보를 공유하세요.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => navigate("/admin/users/add")}>회원 추가</Button>
          <Button variant="outline" onClick={() => navigate("/admin/users")}>
            회원 목록으로 이동
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
