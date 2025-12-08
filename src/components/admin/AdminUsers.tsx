import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { companyUsers } from "./userData";

const statusStyles = {
  ACTIVE: {
    label: "활성",
    bg: "#ECFDF5",
    color: "#15803D",
    border: "#A7F3D0",
  },
  INACTIVE: {
    label: "비활성",
    bg: "#F9FAFB",
    color: "#374151",
    border: "#E5E7EB",
  },
  SUSPENDED: {
    label: "정지",
    bg: "#FEF2F2",
    color: "#B91C1C",
    border: "#FECACA",
  },
} as const;

const roles = ["All", "Client", "Developer", "Admin"] as const;
const statusOptions = ["All", "ACTIVE", "INACTIVE", "SUSPENDED"] as const;
const roleDisplayMap: Record<string, string> = {
  All: "전체 역할",
  Client: "클라이언트",
  Developer: "개발자",
  Admin: "관리자",
};

const PAGE_SIZE = 10;

export function AdminUsers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<(typeof roles)[number]>("All");
  const [companyFilter, setCompanyFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>("All");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase();
    return companyUsers.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term);
      const matchesRole = roleFilter === "All" || user.role === roleFilter;
      const matchesCompany = companyFilter === "All" || user.company === companyFilter;
      const matchesStatus = statusFilter === "All" || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesCompany && matchesStatus;
    });
  }, [search, roleFilter, companyFilter, statusFilter]);

  const companies = useMemo(() => {
    const set = new Set<string>();
    companyUsers.forEach((user) => set.add(user.company));
    return Array.from(set);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, companyFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight">Users</h1>
        <p className="mt-2 text-muted-foreground">
          워크스페이스 구성원을 관리하고 권한을 지정하며 활동 현황을 확인하세요.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm md:flex-row md:items-center">
        <Input
          placeholder="회원을 검색하세요"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="md:flex-1"
        />
        <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as (typeof roles)[number])}>
          <SelectTrigger className="md:w-52">
            <SelectValue placeholder="전체 역할" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role} value={role}>
                {roleDisplayMap[role] ?? role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={companyFilter} onValueChange={(value) => setCompanyFilter(value)}>
          <SelectTrigger className="md:w-52">
            <SelectValue placeholder="전체 회사" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">전체 회사</SelectItem>
            {companies.map((company) => (
              <SelectItem key={company} value={company}>
                {company}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as (typeof statusOptions)[number])}>
          <SelectTrigger className="md:w-52">
            <SelectValue placeholder="회원 상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">전체 상태</SelectItem>
            <SelectItem value="ACTIVE">활성</SelectItem>
            <SelectItem value="INACTIVE">비활성</SelectItem>
            <SelectItem value="SUSPENDED">정지</SelectItem>
          </SelectContent>
        </Select>
        <Button className="md:w-auto" onClick={() => navigate("/admin/users/add")}>
          + 추가
        </Button>
      </div>

      <Card className="rounded-2xl bg-white shadow-sm">
        <CardContent className="px-6 pt-6 pb-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/4">User</TableHead>
                <TableHead className="w-1/6 text-center">회사</TableHead>
                <TableHead className="w-1/6 text-center">역할</TableHead>
                <TableHead className="w-1/6 text-center">상태</TableHead>
                <TableHead className="w-1/12 text-center">프로젝트</TableHead>
                <TableHead className="w-1/6 text-center">가입일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/admin/users/${user.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/70 shadow-sm">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm font-semibold text-muted-foreground">
                            {user.name
                              .split(" ")
                              .map((part) => part[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{user.company}</Badge>
                  </TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">
                    {roleDisplayMap[user.role] ?? user.role}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      style={{
                        backgroundColor: statusStyles[user.status]?.bg ?? statusStyles.INACTIVE.bg,
                        color: statusStyles[user.status]?.color ?? statusStyles.INACTIVE.color,
                        border: `1px solid ${
                          statusStyles[user.status]?.border ?? statusStyles.INACTIVE.border
                        }`,
                      }}
                    >
                      {statusStyles[user.status]?.label ?? statusStyles.INACTIVE.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {Array.isArray(user.projects) ? user.projects.length : user.projects ?? 0}
                  </TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">
                    {new Date(user.joined).toLocaleDateString()}
                  </TableCell>


                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          {"<"}
        </Button>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          {">"}
        </Button>
      </div>
    </div>
  );
}
