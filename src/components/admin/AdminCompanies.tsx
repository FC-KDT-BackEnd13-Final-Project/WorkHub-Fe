import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { PaginationControls } from "../common/PaginationControls";
import { calculateTotalPages, clampPage, paginate } from "../../utils/pagination";
import { useAdminUsersList } from "../../hooks/useAdminUsers";

type CompanyStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

type CompanySummary = {
  id: string;
  name: string;
  status: CompanyStatus;
  totalProjectCount: number;
  activeProjectCount: number;
  clientCount: number;
  joined: string;
};

const statusStyles: Record<
    CompanyStatus,
    { label: string; bg: string; color: string; border: string }
> = {
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
};


const PAGE_SIZE = 10;

const STATUS_PRIORITY: Record<CompanyStatus, number> = {
  ACTIVE: 1,
  INACTIVE: 2,
  SUSPENDED: 3,
};

const INACTIVE_PROJECT_KEYWORDS = ["완료", "complete", "done", "hold", "pause", "종료"];

function isActiveProject(status?: string) {
  if (!status) return false;
  const normalized = status.toLowerCase();
  return !INACTIVE_PROJECT_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function formatDate(date?: string) {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  return parsed.toLocaleDateString("ko-KR");
}

function getCompanyInitials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "-";
  return trimmed
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function normalizeCompanyStatus(status?: string): CompanyStatus {
  const normalized = (status ?? "ACTIVE").toUpperCase();
  if (normalized === "SUSPENDED") return "SUSPENDED";
  if (normalized === "INACTIVE") return "INACTIVE";
  return "ACTIVE";
}

export function AdminCompanies() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | CompanyStatus>("All");
  const [projectRange, setProjectRange] = useState<(typeof PROJECT_RANGE_OPTIONS)[number]["value"]>("All");
  const [clientRange, setClientRange] = useState<(typeof CLIENT_RANGE_OPTIONS)[number]["value"]>("All");
  const [joinStartDate, setJoinStartDate] = useState("");
  const [joinEndDate, setJoinEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { users: adminUsers, isLoading, error } = useAdminUsersList();

  const companySummaries = useMemo<CompanySummary[]>(() => {
    const map = new Map<string, CompanySummary>();
    adminUsers.forEach((user) => {
      if (!user.company) {
        return;
      }
      const companyId = user.company;
      const existing = map.get(companyId);
      const normalizedStatus = normalizeCompanyStatus(user.status);
      const totalProjects = (user.projects ?? []).length;
      const activeProjects = (user.projects ?? []).filter((project) =>
        isActiveProject(project.status),
      ).length;
      const joined = user.joined ?? "";
      if (!existing) {
        map.set(companyId, {
          id: companyId,
          name: companyId,
          status: normalizedStatus,
          totalProjectCount: totalProjects,
          activeProjectCount: activeProjects,
          clientCount: 1,
          joined,
        });
      } else {
        existing.clientCount += 1;
        existing.totalProjectCount += totalProjects;
        existing.activeProjectCount += activeProjects;
        if (STATUS_PRIORITY[normalizedStatus] > STATUS_PRIORITY[existing.status]) {
          existing.status = normalizedStatus;
        }
        if (!existing.joined || (joined && new Date(joined) < new Date(existing.joined))) {
          existing.joined = joined;
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, [adminUsers]);

  const filteredCompanies = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return companySummaries.filter((company) => {
      const matchesSearch = company.name.toLowerCase().includes(term);
      const matchesStatus = statusFilter === "All" || company.status === statusFilter;
      const matchesProjectRange = (() => {
        switch (projectRange) {
          case "0":
            return company.activeProjectCount === 0;
          case "1-2":
            return company.activeProjectCount >= 1 && company.activeProjectCount <= 2;
          case "3+":
            return company.activeProjectCount >= 3;
          default:
            return true;
        }
      })();
      const matchesClientRange = (() => {
        switch (clientRange) {
          case "1":
            return company.clientCount === 1;
          case "2-4":
            return company.clientCount >= 2 && company.clientCount <= 4;
          case "5+":
            return company.clientCount >= 5;
          default:
            return true;
        }
      })();
      const matchesJoinPeriod = (() => {
        if (!joinStartDate && !joinEndDate) return true;
        if (!company.joined) return false;

        const companyDate = new Date(company.joined);
        if (Number.isNaN(companyDate.getTime())) return false;

        if (joinStartDate) {
          const startDate = new Date(joinStartDate);
          if (companyDate < startDate) return false;
        }

        if (joinEndDate) {
          const endDate = new Date(joinEndDate);
          if (companyDate > endDate) return false;
        }

        return true;
      })();
      return matchesSearch && matchesStatus && matchesProjectRange && matchesClientRange && matchesJoinPeriod;
    });
  }, [companySummaries, searchTerm, statusFilter, projectRange, clientRange, joinStartDate, joinEndDate]);

    const rawTotalPages = calculateTotalPages(filteredCompanies.length, PAGE_SIZE);
    const totalPages = Math.max(1, rawTotalPages);
    const paginatedCompanies = paginate(filteredCompanies, currentPage, PAGE_SIZE);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, projectRange, clientRange, joinStartDate, joinEndDate]);

    useEffect(() => {
        setCurrentPage((prev) => clampPage(prev, totalPages));
    }, [totalPages]);

    const handleStatusFilterChange = (value: string) => {
    if (value === "All" || value === "ACTIVE" || value === "INACTIVE" || value === "SUSPENDED") {
      setStatusFilter(value);
      return;
    }
    setStatusFilter("All");
  };

  return (
    <div className="space-y-6 pb-10 pt-2 md:px-0 md:pb-12">
      <div className="rounded-2xl bg-white p-6 pb-9 shadow-sm">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Companies</h1>
          <p className="mt-2 text-muted-foreground">고객사 파트너십을 확인하고 진행 현황을 살펴보세요.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm mt-2 md:flex-row md:items-center md:gap-3 md:flex-nowrap">
        <div className="flex w-full gap-2 overflow-x-auto pb-1 md:hidden">
          <Input
            placeholder="고객사를 검색하세요"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-[200px] rounded-md border bg-input-background px-3 py-1 text-base transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          />
          <div className="min-w-[140px] flex-shrink-0">
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="border-input data-[placeholder]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-input-background px-3 py-1 text-sm outline-none focus-visible:ring-[3px]">
                <SelectValue placeholder="전체 상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">전체 상태</SelectItem>
                <SelectItem value="ACTIVE">활성</SelectItem>
                <SelectItem value="INACTIVE">비활성</SelectItem>
                <SelectItem value="SUSPENDED">정지</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 min-w-[320px]">
            <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground whitespace-nowrap">가입 기간</Label>
            <div className="flex items-center gap-1">
              <Input
                type="date"
                value={joinStartDate}
                onChange={(event) => setJoinStartDate(event.target.value)}
                className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 flex h-9 min-w-0 rounded-md border border-border bg-input-background px-3 py-1 text-base transition-[color,box-shadow] outline-none w-[140px] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                aria-label="가입 시작일"
              />
              <span className="px-1 text-sm text-muted-foreground">~</span>
              <Input
                type="date"
                value={joinEndDate}
                onChange={(event) => setJoinEndDate(event.target.value)}
                className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 flex h-9 min-w-0 rounded-md border border-border bg-input-background px-3 py-1 text-base transition-[color,box-shadow] outline-none w-[140px] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                aria-label="가입 종료일"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 min-w-[220px]">
            <Button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground hover:bg-primary/90 py-2 has-[>svg]:px-3 h-9 px-4 text-sm flex-1" onClick={() => navigate("/admin/users/companies/add")}>
              + 추가
            </Button>
            <Button
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 py-2 has-[>svg]:px-3 h-9 px-4 text-sm flex-1"
              variant="outline"
              onClick={() => navigate("/admin/users")}
            >
              회원 목록
            </Button>
          </div>
        </div>
        <div className="flex w-full flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:gap-3">
          <Input
            placeholder="고객사를 검색하세요"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-input-background px-3 py-1 text-base transition-[color,box-shadow] outline-none md:flex-1 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          />
          <div className="w-full md:w-40">
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="border-input data-[placeholder]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-input-background px-3 py-1 text-sm outline-none focus-visible:ring-[3px]">
                <SelectValue placeholder="전체 상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">전체 상태</SelectItem>
                <SelectItem value="ACTIVE">활성</SelectItem>
                <SelectItem value="INACTIVE">비활성</SelectItem>
                <SelectItem value="SUSPENDED">정지</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground whitespace-nowrap md:text-sm">
              가입 기간
            </Label>
            <div className="flex items-center gap-1">
              <Input
                type="date"
                value={joinStartDate}
                onChange={(event) => setJoinStartDate(event.target.value)}
                className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 flex h-9 min-w-0 rounded-md border border-border bg-input-background px-3 py-1 text-base transition-[color,box-shadow] outline-none w-[140px] md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                aria-label="가입 시작일"
              />
              <span className="px-1 text-sm text-muted-foreground">~</span>
              <Input
                type="date"
                value={joinEndDate}
                onChange={(event) => setJoinEndDate(event.target.value)}
                className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 flex h-9 min-w-0 rounded-md border border-border bg-input-background px-3 py-1 text-base transition-[color,box-shadow] outline-none w-[140px] md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                aria-label="가입 종료일"
              />
            </div>
          </div>

        </div>
        <div className="flex items-center gap-2 md:ml-auto md:flex-none">
          <Button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground hover:bg-primary/90 py-2 has-[>svg]:px-3 h-9 px-4 text-sm" onClick={() => navigate("/admin/users/companies/add")}>
            + 추가
          </Button>
          <Button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 py-2 has-[>svg]:px-3 h-9 px-4 text-sm" variant="outline" onClick={() => navigate("/admin/users")}>
            회원 목록
          </Button>
        </div>
      </div>


      <Card className="rounded-2xl bg-white shadow-sm">
        <CardContent className="px-6 pt-6 pb-6 space-y-4">
          <div className="md:hidden">
            {isLoading ? (
              <div className="rounded-xl border border-white/70 bg-white/90 p-4 text-center text-sm text-muted-foreground shadow-sm">
                고객사 목록을 불러오는 중입니다...
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center text-sm text-red-600">
                데이터를 불러오는 중 오류가 발생했습니다: {error}
              </div>
            ) : paginatedCompanies.length === 0 ? (
              <div className="rounded-xl border border-white/70 bg-white/90 p-4 text-center text-sm text-muted-foreground shadow-sm">
                조건에 맞는 고객사가 없습니다.
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedCompanies.map((company) => {
                  const palette = statusStyles[company.status];
                  return (
                    <div key={company.id} className="rounded-xl border border-white/70 bg-white/90 p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium text-foreground">{company.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {company.activeProjectCount > 0 ? "활성 프로젝트 진행 중" : "활성 프로젝트 없음"}
                          </p>
                        </div>
                        <span
                          className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0"
                          style={{ backgroundColor: palette.bg, color: palette.color, border: `1px solid ${palette.border}` }}
                        >
                          {palette.label}
                        </span>
                      </div>
                      <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-400">총 프로젝트</span>
                          <span className="font-semibold text-foreground">{company.totalProjectCount}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-400">진행중</span>
                          <span className="font-semibold text-foreground">{company.activeProjectCount}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-400">연동 고객</span>
                          <span className="font-semibold text-foreground">{company.clientCount}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-400">가입일</span>
                          <span>{formatDate(company.joined)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div data-slot="table-container" className="relative hidden w-full overflow-x-auto md:block">
            <table data-slot="table" className="w-full caption-bottom text-sm">
              <thead data-slot="table-header" className="[&_tr]:border-b">
                <tr data-slot="table-row" className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
                  <th data-slot="table-head" className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] w-1/3">
                    회사명
                  </th>
                  <th data-slot="table-head" className="text-foreground h-10 px-2 align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] w-1/6 text-center">
                    상태
                  </th>
                  <th data-slot="table-head" className="text-foreground h-10 px-2 align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] w-1/6 text-center">
                    총 프로젝트 수
                  </th>
                  <th data-slot="table-head" className="text-foreground h-10 px-2 align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] w-1/6 text-center">
                    진행중인 프로젝트 수
                  </th>
                  <th data-slot="table-head" className="text-foreground h-10 px-2 align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] w-1/6 text-center">
                    연동된 고객 수
                  </th>
                  <th data-slot="table-head" className="text-foreground h-10 px-2 align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] w-1/6 text-center">
                    가입일
                  </th>
                </tr>
              </thead>
              <tbody data-slot="table-body" className="[&_tr:last-child]:border-0">
                {isLoading ? (
                  <tr data-slot="table-row" className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
                    <td
                      data-slot="table-cell"
                      className="p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] text-center text-sm text-muted-foreground"
                      colSpan={6}
                    >
                      고객사 목록을 불러오는 중입니다...
                    </td>
                  </tr>
                ) : error ? (
                  <tr data-slot="table-row" className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
                    <td
                      data-slot="table-cell"
                      className="p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] text-center text-sm text-red-600"
                      colSpan={6}
                    >
                      데이터를 불러오는 중 오류가 발생했습니다: {error}
                    </td>
                  </tr>
                ) : paginatedCompanies.length === 0 ? (
                  <tr data-slot="table-row" className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
                    <td
                      data-slot="table-cell"
                      className="p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] text-center text-sm text-muted-foreground"
                      colSpan={6}
                    >
                      조건에 맞는 고객사가 없습니다.
                    </td>
                  </tr>
                ) : (
                  paginatedCompanies.map((company) => (
                    <tr key={company.id} data-slot="table-row" className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors group">
                      <td data-slot="table-cell" className="p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]">
                        <div>
                          <p className="font-medium">{company.name}</p>
                          <p className="text-xs text-muted-foreground">
                            최근 업데이트: {company.activeProjectCount > 0 ? "활성 프로젝트 진행 중" : "활성 프로젝트 없음"}
                          </p>
                        </div>
                      </td>
                      <td data-slot="table-cell" className="p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] text-center">
                        <span
                          data-slot="badge"
                          className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground"
                          style={{
                            backgroundColor: statusStyles[company.status].bg,
                            color: statusStyles[company.status].color,
                            border: `1px solid ${statusStyles[company.status].border}`,
                          }}
                        >
                          {statusStyles[company.status].label}
                        </span>
                      </td>
                      <td data-slot="table-cell" className="p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] text-center font-semibold">
                        {company.totalProjectCount}
                      </td>
                      <td data-slot="table-cell" className="p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] text-center font-semibold">
                        {company.activeProjectCount}
                      </td>
                      <td data-slot="table-cell" className="p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] text-center font-semibold">
                        {company.clientCount}
                      </td>
                      <td data-slot="table-cell" className="p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] text-center text-sm text-muted-foreground">
                        {formatDate(company.joined)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <PaginationControls
        className="mt-4"
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => {
          setCurrentPage(page);
        }}
      />
    </div>
  );
}
