import { useMemo, useState } from "react";
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
import { Badge } from "../ui/badge";
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

const statusStyles: Record<CompanyStatus, { label: string; bg: string; color: string; border: string }> = {
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

const PROJECT_RANGE_OPTIONS = [
  { value: "All", label: "전체 프로젝트" },
  { value: "0", label: "진행 중 0건" },
  { value: "1-2", label: "1-2건 진행" },
  { value: "3+", label: "3건 이상" },
] as const;

const CLIENT_RANGE_OPTIONS = [
  { value: "All", label: "전체 고객 수" },
  { value: "1", label: "1명" },
  { value: "2-4", label: "2-4명" },
  { value: "5+", label: "5명 이상" },
] as const;

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

  const totalPages = calculateTotalPages(filteredCompanies.length, PAGE_SIZE);
  const paginatedCompanies = paginate(filteredCompanies, currentPage, PAGE_SIZE);

  const handleStatusFilterChange = (value: string) => {
    if (value === "All" || value === "ACTIVE" || value === "INACTIVE" || value === "SUSPENDED") {
      setStatusFilter(value);
      return;
    }
    setStatusFilter("All");
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader title="Companies" description="고객사 파트너십을 확인하고 진행 현황을 살펴보세요." />

      <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:flex-nowrap md:items-center md:justify-between">
          <Input
            placeholder="고객사를 검색하세요"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive md:flex-1"
          />
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-input-background px-3 py-2 text-sm whitespace-nowrap transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 md:w-48">
              <SelectValue placeholder="전체 상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">전체 상태</SelectItem>
              <SelectItem value="ACTIVE">활성</SelectItem>
              <SelectItem value="INACTIVE">비활성</SelectItem>
              <SelectItem value="SUSPENDED">정지</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Label className="flex items-center gap-2 font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 whitespace-nowrap text-xs md:text-sm">
              가입기간
            </Label>
            <div className="flex items-center gap-1">
              <Input
                type="date"
                value={joinStartDate}
                onChange={(e) => setJoinStartDate(e.target.value)}
                className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 flex min-w-0 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive h-9 w-[140px] rounded-md border border-border bg-input-background px-3 py-1"
              />
              <span className="px-1 text-sm text-muted-foreground">~</span>
              <Input
                type="date"
                value={joinEndDate}
                onChange={(e) => setJoinEndDate(e.target.value)}
                className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 flex min-w-0 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive h-9 w-[140px] rounded-md border border-border bg-input-background px-3 py-1"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3 md:w-auto"
              onClick={() => navigate("/admin/companies/add")}
            >
              + 추가
            </Button>
            <Button
              variant="outline"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-9 px-4 py-2 has-[>svg]:px-3 md:w-auto"
              onClick={() => navigate("/admin/users")}
            >
              회원 목록
            </Button>
          </div>
        </div>
      </div>

      <Card className="rounded-2xl bg-white shadow-sm">
        <CardContent className="px-6 pt-6 pb-6 space-y-3">
          <div data-slot="table-container" class="relative w-full overflow-x-auto">
            <table data-slot="table" class="w-full caption-bottom text-sm">
              <thead data-slot="table-header" class="[&_tr]:border-b">
                <tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
                  <th data-slot="table-head" class="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] w-1/3">회사명</th>
                  <th data-slot="table-head" class="text-foreground h-10 px-2 align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] w-1/6 text-center">상태</th>
                  <th data-slot="table-head" class="text-foreground h-10 px-2 align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] w-1/6 text-center">총 프로젝트 수</th>
                  <th data-slot="table-head" class="text-foreground h-10 px-2 align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] w-1/6 text-center">진행중인 프로젝트 수</th>
                  <th data-slot="table-head" class="text-foreground h-10 px-2 align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] w-1/6 text-center">연동된 고객 수</th>
                  <th data-slot="table-head" class="text-foreground h-10 px-2 align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] w-1/6 text-center">가입일</th>
                </tr>
              </thead>
              <tbody data-slot="table-body" class="[&_tr:last-child]:border-0">
                {isLoading ? (
                  <tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
                    <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] text-center text-sm text-muted-foreground" colSpan={6}>
                      고객사 목록을 불러오는 중입니다...
                    </td>
                  </tr>
                ) : error ? (
                  <tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
                    <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] text-center text-sm text-red-600" colSpan={6}>
                      데이터를 불러오는 중 오류가 발생했습니다: {error}
                    </td>
                  </tr>
                ) : paginatedCompanies.length === 0 ? (
                  <tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
                    <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] text-center text-sm text-muted-foreground" colSpan={6}>
                      조건에 맞는 고객사가 없습니다.
                    </td>
                  </tr>
                ) : (
                  paginatedCompanies.map((company) => (
                    <tr key={company.id} data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors group">
                      <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]">
                        <div>
                          <p class="font-medium">{company.name}</p>
                          <p class="text-xs text-muted-foreground">
                            최근 업데이트: {company.activeProjectCount > 0 ? "활성 프로젝트 진행 중" : "활성 프로젝트 없음"}
                          </p>
                        </div>
                      </td>
                      <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] text-center">
                        <span
                          data-slot="badge"
                          class="inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground"
                          style={{
                            backgroundColor: statusStyles[company.status].bg,
                            color: statusStyles[company.status].color,
                            border: `1px solid ${statusStyles[company.status].border}`,
                          }}
                        >
                          {statusStyles[company.status].label}
                        </span>
                      </td>
                      <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] text-center font-semibold">{company.totalProjectCount}</td>
                      <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] text-center font-semibold">{company.activeProjectCount}</td>
                      <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] text-center font-semibold">{company.clientCount}</td>
                      <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] text-center text-sm text-muted-foreground">
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
