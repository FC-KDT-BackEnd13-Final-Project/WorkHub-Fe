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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { PageHeader } from "../common/PageHeader";
import { FilterToolbar } from "../common/FilterToolbar";
import { calculateTotalPages, clampPage, paginate } from "../../../src/utils/pagination";
import { PaginationControls } from "../common/PaginationControls";
import { useAdminUsersList } from "../../hooks/useAdminUsers";

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
  const {
    users: adminUsers,
    isLoading: isRemoteLoading,
    error: remoteError,
  } = useAdminUsersList();
  const allUsers = adminUsers;

  // 검색/필터 조건이 많아 useMemo로 묶어 테이블 렌더 비용을 줄인다.
  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase();
    return allUsers.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term);
      const matchesRole = roleFilter === "All" || user.role === roleFilter;
      const matchesCompany = companyFilter === "All" || user.company === companyFilter;
      const matchesStatus = statusFilter === "All" || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesCompany && matchesStatus;
    });
  }, [search, roleFilter, companyFilter, statusFilter, allUsers]);

  const companies = useMemo(() => {
    const set = new Set<string>();
    allUsers.forEach((user) => {
      if (user.company) {
        set.add(user.company);
      }
    });
    return Array.from(set);
  }, [allUsers]);

  // 공통 pagination 유틸로 페이지 수 계산과 슬라이싱을 통일한다.
  const totalPages = calculateTotalPages(filteredUsers.length, PAGE_SIZE);
  const paginatedUsers = paginate(filteredUsers, currentPage, PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, companyFilter, statusFilter]);
  useEffect(() => {
    // 필터 적용 후 전체 페이지 수가 줄어들면 현재 페이지를 안전 범위로 되돌린다.
    setCurrentPage((prev) => clampPage(prev, totalPages));
  }, [totalPages]);

  return (
      <main className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
              <div className="space-y-6 pb-12">
      <PageHeader
        title="Users"
        description="구성원을 관리하고 권한을 지정하며 활동 현황을 확인하세요."
      />

      <FilterToolbar align="between">
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
          <div className="flex items-center gap-2">
              <Button className="md:w-auto" onClick={() => navigate("/admin/users/add")}>
                  + 추가
              </Button>
              <Button
                  variant="outline"
                  className="md:w-auto"
                  onClick={() => navigate("/admin/companies")}
              >
                  고객사 목록
              </Button>
          </div>
      </FilterToolbar>

      <Card className="rounded-2xl bg-white shadow-sm">
        <CardContent className="px-6 pt-6 pb-6 space-y-3">
          {isRemoteLoading ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              회원 목록을 불러오는 중입니다...
            </div>
          ) : null}
          {!isRemoteLoading && remoteError ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {remoteError}
            </div>
          ) : null}
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
              {paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-sm text-muted-foreground">
                    {isRemoteLoading ? "회원 목록을 불러오는 중입니다..." : "조건에 맞는 회원이 없습니다."}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => (
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
                      <Badge variant="secondary">{user.company || "소속 미지정"}</Badge>
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
                    <TableCell className="text-center font-medium">{user.projectCount ?? 0}</TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {user.joined ? new Date(user.joined).toLocaleDateString() : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
                  <PaginationControls className="mt-4" currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              </div>
          </div>
      </main>
  );
}
