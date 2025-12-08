import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { companyUsers } from "./userData";

const roles = ["Client", "Developer", "Admin"] as const;
const roleLabels: Record<(typeof roles)[number], string> = {
  Client: "클라이언트",
  Developer: "개발자",
  Admin: "관리자",
};

export function AdminAddUser() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    role: "Client",
    phone: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isCompanyLookupOpen, setIsCompanyLookupOpen] = useState(false);
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameCheckStatus, setUsernameCheckStatus] = useState<"idle" | "success" | "error">("idle");
  const [usernameCheckMessage, setUsernameCheckMessage] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    navigate("/admin/users/add/success");
  };

  const handleReset = () => {
    setForm({
      name: "",
      email: "",
      company: "",
      role: "Client",
      phone: "",
      username: "",
      password: "",
      confirmPassword: "",
    });
    setError("");
    setIsCompanyLookupOpen(false);
    setCompanySearchTerm("");
    setUsernameCheckStatus("idle");
    setUsernameCheckMessage("");
  };

  const companyDirectory = useMemo(() => {
    const set = new Set<string>();
    companyUsers.forEach((user) => {
      if (user.company) set.add(user.company);
    });
    return Array.from(set).sort();
  }, []);

  const filteredCompanies = useMemo(() => {
    const term = companySearchTerm.trim().toLowerCase();
    if (!term) return companyDirectory;
    return companyDirectory.filter((company) => company.toLowerCase().includes(term));
  }, [companyDirectory, companySearchTerm]);

  // 조회 리스트에서 회사명을 선택하면 입력 값으로 채움
  const handleSelectCompany = (company: string) => {
    setForm((prev) => ({ ...prev, company }));
    setIsCompanyLookupOpen(false);
    setCompanySearchTerm("");
  };

  // ID 중복 여부를 간단히 검사해 사용자에게 알려줌
  const handleCheckUsername = () => {
    const username = form.username.trim();
    if (!username) {
      setUsernameCheckStatus("error");
      setUsernameCheckMessage("ID를 입력해주세요.");
      return;
    }
    setIsCheckingUsername(true);
    setUsernameCheckStatus("idle");
    setUsernameCheckMessage("");
    setTimeout(() => {
      const exists = companyUsers.some(
        (user) => user.id?.toLowerCase() === username.toLowerCase()
      );
      if (exists) {
        setUsernameCheckStatus("error");
        setUsernameCheckMessage("이미 사용 중인 ID입니다.");
      } else {
        setUsernameCheckStatus("success");
        setUsernameCheckMessage("사용 가능한 ID입니다.");
      }
      setIsCheckingUsername(false);
    }, 400);
  };

  return (
    <Card className="rounded-2xl border border-white/70 bg-white shadow-sm">
      <CardHeader className="pb-6 text-center">
        <CardTitle className="text-2xl">회원 추가</CardTitle>
        <CardDescription>새 멤버를 초대하고 워크스페이스 권한을 설정하세요.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="user-company">회사명</Label>
              <div className="flex gap-2">
                <Input
                  id="user-company"
                  required
                  value={form.company}
                  readOnly
                  placeholder="조회 버튼으로 회사를 선택하세요"
                  onClick={() => setIsCompanyLookupOpen(true)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="whitespace-nowrap"
                  onClick={() => setIsCompanyLookupOpen((prev) => !prev)}
                >
                  조회
                </Button>
              </div>
              {isCompanyLookupOpen && (
                <div className="space-y-3 rounded-xl border border-border bg-background/80 p-3 shadow-sm">
                  <Input
                    placeholder="회사명을 검색하세요"
                    value={companySearchTerm}
                    onChange={(event) => setCompanySearchTerm(event.target.value)}
                  />
                  <div className="max-h-48 space-y-1 overflow-y-auto pt-1 pb-1">
                    {filteredCompanies.length ? (
                      filteredCompanies.map((company) => (
                        <button
                          key={company}
                          type="button"
                          onClick={() => handleSelectCompany(company)}
                          className="w-full rounded-lg border border-transparent px-3 py-2 text-left text-sm transition-colors hover:border-border hover:bg-accent"
                        >
                          {company}
                        </button>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">검색 결과가 없습니다.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>역할</Label>
              <Select
                value={form.role}
                onValueChange={(value) => setForm((prev) => ({ ...prev, role: value as (typeof roles)[number] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="역할을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {roleLabels[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="user-name">이름</Label>
              <Input
                id="user-name"
                required
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-phone">전화번호</Label>
              <Input
                id="user-phone"
                type="tel"
                placeholder="010-0000-0000"
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="user-email">이메일</Label>
              <Input
                id="user-email"
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>ID</Label>
              <div className="flex gap-2">
                <Input
                  id="user-username"
                  required
                  value={form.username}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, username: event.target.value }));
                    setUsernameCheckStatus("idle");
                    setUsernameCheckMessage("");
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCheckUsername}
                  disabled={isCheckingUsername}
                >
                  중복 확인
                </Button>
              </div>
              {usernameCheckMessage && (
                <p
                  className={`text-sm ${
                    usernameCheckStatus === "success" ? "text-emerald-600" : "text-destructive"
                  }`}
                >
                  {usernameCheckMessage}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="user-password">비밀번호</Label>
              <Input
                id="user-password"
                type="password"
                required
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-confirm-password">비밀번호 확인</Label>
              <Input
                id="user-confirm-password"
                type="password"
                required
                value={form.confirmPassword}
                onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="border-none">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row">
            <Button type="submit" className="flex-1">
              등록
            </Button>
            <Button type="button" variant="outline" className="flex-1" onClick={handleReset}>
              초기화
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
