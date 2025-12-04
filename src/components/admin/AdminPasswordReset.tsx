import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { Check } from "lucide-react";

export function AdminPasswordReset() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("임시 비밀번호가 발급되었습니다. 이메일을 확인해주세요.");
  };

  return (
    <Card className="rounded-2xl border border-white/70 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>비밀번호 초기화</CardTitle>
        <CardDescription>구성원의 이메일로 임시 비밀번호를 발송합니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="reset-email">이메일</Label>
            <Input
              id="reset-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <Button type="submit">비밀번호 초기화</Button>
        </form>
        {message && (
          <Alert className="mt-6 border-emerald-100 bg-emerald-50 text-emerald-700">
            <Check className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
