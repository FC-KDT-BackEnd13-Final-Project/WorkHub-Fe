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
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Check } from "lucide-react";
import { useAdminUsersList } from "../../hooks/useAdminUsers";

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
  const { users: adminUsers } = useAdminUsersList();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.company) {
      setError("고객사를 선택해주세요.");
      return;
    }
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
    adminUsers.forEach((user) => {
      if (user.company) set.add(user.company);
    });
    return Array.from(set).sort();
  }, [adminUsers]);

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
    setError("");
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
      const exists = adminUsers.some(
        (user) => user.loginId?.toLowerCase() === username.toLowerCase() || user.id.toLowerCase() === username.toLowerCase(),
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
    <div className="max-w-4xl mx-auto">
      <Card className="text-card-foreground flex flex-col gap-6 backdrop-blur rounded-2xl border border-white/70 bg-white shadow-sm transform scale-75 origin-center">
      <CardHeader className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 pt-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6 pb-6 text-center">
        <CardTitle className="text-2xl">회원 추가</CardTitle>
        <CardDescription className="text-muted-foreground">새 멤버를 초대하고 워크스페이스 권한을 설정하세요.</CardDescription>
      </CardHeader>
      <CardContent className="px-6 [&:last-child]:pb-6">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50">
                고객사
              </Label>
              <Popover
                open={isCompanyLookupOpen}
                onOpenChange={(open) => {
                  setIsCompanyLookupOpen(open);
                  if (!open) {
                    setCompanySearchTerm("");
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-input-background px-3 py-2 text-sm transition-colors hover:bg-white dark:hover:bg-input/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-input/30"
                  >
                    <span className={`text-left text-sm ${form.company ? "text-foreground" : "text-muted-foreground"}`}>
                      {form.company || "고객사를 선택하세요"}
                    </span>
                    <svg
                      className={`h-4 w-4 transition-transform ${isCompanyLookupOpen ? "rotate-180" : ""}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="m6 9 6 6 6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  side="bottom"
                  align="start"
                  avoidCollisions={false}
                  className="bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 origin-[var(--radix-popover-content-transform-origin)] rounded-md border shadow-md outline-hidden w-[var(--radix-popover-trigger-width)] max-w-none p-0"
                  style={{ width: "var(--radix-popover-trigger-width)" }}
                >
                  <div className="border-b border-border px-3 py-2">
                    <Input
                      placeholder="고객사를 검색하세요"
                      value={companySearchTerm}
                      onChange={(event) => setCompanySearchTerm(event.target.value)}
                      autoFocus
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="max-h-[13.5rem] overflow-y-auto">
                    {companySearchTerm.trim() ? (
                      filteredCompanies.length ? (
                        filteredCompanies.map((company) => {
                          const isActive = form.company === company;
                          return (
                            <button
                              key={company}
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault();
                                handleSelectCompany(company);
                              }}
                              className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                                isActive ? "bg-primary/5 text-primary" : "hover:bg-accent/60"
                              }`}
                            >
                              <span>{company}</span>
                              {isActive && <Check className="h-4 w-4 text-primary" aria-hidden="true" />}
                            </button>
                          );
                        })
                      ) : (
                        <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                          검색 결과가 없습니다.
                        </p>
                      )
                    ) : (
                      <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                        검색어를 입력하면 고객사가 표시됩니다.
                      </p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50">역할</Label>
              <Select
                value={form.role}
                onValueChange={(value) => setForm((prev) => ({ ...prev, role: value as (typeof roles)[number] }))}
              >
                <SelectTrigger className="border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-input-background px-3 py-2 text-sm whitespace-nowrap transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
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
              <Label htmlFor="user-name" className="flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50">이름</Label>
              <Input
                id="user-name"
                required
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-phone" className="flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50">전화번호</Label>
              <Input
                id="user-phone"
                type="tel"
                placeholder="010-0000-0000"
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="user-email" className="flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50">이메일</Label>
              <Input
                id="user-email"
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50">ID</Label>
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
                  className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                />
                <Button
                  type="button"
                  onClick={handleCheckUsername}
                  disabled={isCheckingUsername}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-9 px-4 py-2 has-[>svg]:px-3"
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
              <Label htmlFor="user-password" className="flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50">비밀번호</Label>
              <Input
                id="user-password"
                type="password"
                required
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-confirm-password" className="flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50">비밀번호 확인</Label>
              <Input
                id="user-confirm-password"
                type="password"
                required
                value={form.confirmPassword}
                onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="border-none">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row">
            <Button
              type="submit"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3 flex-1"
            >
              등록
            </Button>
            <Button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-9 px-4 py-2 has-[>svg]:px-3 flex-1"
            >
              초기화
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
    </div>
  );
}
