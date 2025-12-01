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

const roles = ["Developer", "Manager", "Client"] as const;

export function AdminAddUser() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    role: "Developer",
    phone: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isCompanyLookupOpen, setIsCompanyLookupOpen] = useState(false);
  const [companySearchTerm, setCompanySearchTerm] = useState("");

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
      role: "Developer",
      phone: "",
      username: "",
      password: "",
      confirmPassword: "",
    });
    setError("");
    setIsCompanyLookupOpen(false);
    setCompanySearchTerm("");
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

  const handleSelectCompany = (company: string) => {
    setForm((prev) => ({ ...prev, company }));
    setIsCompanyLookupOpen(false);
    setCompanySearchTerm("");
  };

  return (
    <Card className="rounded-2xl border border-white/70 bg-white shadow-sm">
      <CardHeader className="pb-6 text-center">
        <CardTitle className="text-2xl">Add User</CardTitle>
        <CardDescription>Invite a new member and set their initial workspace permissions.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="user-company">Company</Label>
              <div className="flex gap-2">
                <Input
                  id="user-company"
                  required
                  value={form.company}
                  onChange={(event) => setForm((prev) => ({ ...prev, company: event.target.value }))}
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
              <Label>Role</Label>
              <Select
                value={form.role}
                onValueChange={(value) => setForm((prev) => ({ ...prev, role: value as (typeof roles)[number] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="user-name">Name</Label>
              <Input
                id="user-name"
                required
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-phone">Phone Number</Label>
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
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>User ID</Label>
              <div className="flex gap-2">
                <Input
                  id="user-username"
                  required
                  value={form.username}
                  onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
                />
                <Button type="button" variant="outline">
                  Duplicate Check
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="user-password">Password</Label>
              <Input
                id="user-password"
                type="password"
                required
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-confirm-password">Confirm Password</Label>
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
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row">
            <Button type="submit" className="flex-1">
              Create User
            </Button>
            <Button type="button" variant="outline" className="flex-1" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
