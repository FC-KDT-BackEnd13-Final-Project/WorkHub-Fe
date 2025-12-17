import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../ui/card";
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
import { PageHeader } from "../common/PageHeader";
import { PaginationControls } from "../common/PaginationControls";
import { calculateTotalPages, clampPage, paginate } from "../../utils/pagination";
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
    const [statusFilter, setStatusFilter] =
        useState<(typeof statusOptions)[number]>("All");
    const [currentPage, setCurrentPage] = useState(1);

    const {
        users: adminUsers,
        isLoading,
        error,
    } = useAdminUsersList();

    const allUsers = adminUsers ?? [];

    const companies = useMemo(() => {
        const set = new Set<string>();
        allUsers.forEach((user) => {
            if (user.company) set.add(user.company);
        });
        return Array.from(set);
    }, [allUsers]);

    const filteredUsers = useMemo(() => {
        const term = search.toLowerCase();
        return allUsers.filter((user) => {
            const matchesSearch =
                user.name.toLowerCase().includes(term) ||
                user.email.toLowerCase().includes(term);

            const matchesRole = roleFilter === "All" || user.role === roleFilter;
            const matchesCompany =
                companyFilter === "All" || user.company === companyFilter;
            const matchesStatus =
                statusFilter === "All" || user.status === statusFilter;

            return matchesSearch && matchesRole && matchesCompany && matchesStatus;
        });
    }, [allUsers, search, roleFilter, companyFilter, statusFilter]);

    const totalPages = calculateTotalPages(filteredUsers.length, PAGE_SIZE);
    const safeTotalPages = Math.max(1, totalPages);
    const paginatedUsers = paginate(filteredUsers, currentPage, PAGE_SIZE);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, roleFilter, companyFilter, statusFilter]);

    useEffect(() => {
        setCurrentPage((prev) => clampPage(prev, safeTotalPages));
    }, [safeTotalPages]);

    return (
        <div className="space-y-6 pb-12">
            <PageHeader
                title="Users"
                description="구성원을 관리하고 권한을 지정하며 활동 현황을 확인하세요."
            />

            {/* ✅ AdminCompanies와 동일한 필터 박스 래퍼 */}
            <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:flex-nowrap md:items-center md:justify-between">
                    <Input
                        placeholder="회원을 검색하세요"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="md:flex-1"
                    />

                    <Select
                        value={roleFilter}
                        onValueChange={(value) => setRoleFilter(value as (typeof roles)[number])}
                    >
                        <SelectTrigger className="md:w-48">
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

                    <Select value={companyFilter} onValueChange={setCompanyFilter}>
                        <SelectTrigger className="md:w-48">
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

                    <Select
                        value={statusFilter}
                        onValueChange={(value) =>
                            setStatusFilter(value as (typeof statusOptions)[number])
                        }
                    >
                        <SelectTrigger className="md:w-48">
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
                        <Button onClick={() => navigate("/admin/users/add")}>+ 추가</Button>
                        <Button variant="outline" onClick={() => navigate("/admin/users/companies")}>
                            고객사 목록
                        </Button>
                    </div>
                </div>
            </div>

            <Card className="rounded-2xl bg-white shadow-sm">
                <CardContent className="px-6 pt-6 pb-6 space-y-3">
                    <div data-slot="table-container" className="relative w-full overflow-x-auto">
                        <table data-slot="table" className="w-full caption-bottom text-sm">
                            <thead data-slot="table-header" className="[&_tr]:border-b">
                            <tr
                                data-slot="table-row"
                                className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors"
                            >
                                <th
                                    data-slot="table-head"
                                    className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap w-1/3"
                                >
                                    User
                                </th>
                                <th
                                    data-slot="table-head"
                                    className="text-foreground h-10 px-2 align-middle font-medium whitespace-nowrap w-1/6 text-center"
                                >
                                    회사
                                </th>
                                <th
                                    data-slot="table-head"
                                    className="text-foreground h-10 px-2 align-middle font-medium whitespace-nowrap w-1/6 text-center"
                                >
                                    역할
                                </th>
                                <th
                                    data-slot="table-head"
                                    className="text-foreground h-10 px-2 align-middle font-medium whitespace-nowrap w-1/6 text-center"
                                >
                                    상태
                                </th>
                                <th
                                    data-slot="table-head"
                                    className="text-foreground h-10 px-2 align-middle font-medium whitespace-nowrap w-1/12 text-center"
                                >
                                    프로젝트
                                </th>
                                <th
                                    data-slot="table-head"
                                    className="text-foreground h-10 px-2 align-middle font-medium whitespace-nowrap w-1/6 text-center"
                                >
                                    가입일
                                </th>
                            </tr>
                            </thead>

                            <tbody data-slot="table-body" className="[&_tr:last-child]:border-0">
                            {isLoading ? (
                                <tr
                                    data-slot="table-row"
                                    className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors"
                                >
                                    <td
                                        data-slot="table-cell"
                                        className="p-2 align-middle whitespace-nowrap text-center text-sm text-muted-foreground"
                                        colSpan={6}
                                    >
                                        회원 목록을 불러오는 중입니다...
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr
                                    data-slot="table-row"
                                    className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors"
                                >
                                    <td
                                        data-slot="table-cell"
                                        className="p-2 align-middle whitespace-nowrap text-center text-sm text-red-600"
                                        colSpan={6}
                                    >
                                        데이터를 불러오는 중 오류가 발생했습니다: {error}
                                    </td>
                                </tr>
                            ) : paginatedUsers.length === 0 ? (
                                <tr
                                    data-slot="table-row"
                                    className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors"
                                >
                                    <td
                                        data-slot="table-cell"
                                        className="p-2 align-middle whitespace-nowrap text-center text-sm text-muted-foreground"
                                        colSpan={6}
                                    >
                                        조건에 맞는 회원이 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                paginatedUsers.map((user) => (
                                    <tr
                                        key={user.id}
                                        data-slot="table-row"
                                        className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors cursor-pointer"
                                        onClick={() => navigate(`/admin/users/${user.id}`)}
                                    >
                                        <td data-slot="table-cell" className="p-2 align-middle whitespace-nowrap">
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
                                        </td>

                                        <td
                                            data-slot="table-cell"
                                            className="p-2 align-middle whitespace-nowrap text-center"
                                        >
                                            <Badge variant="secondary">{user.company || "소속 미지정"}</Badge>
                                        </td>

                                        <td
                                            data-slot="table-cell"
                                            className="p-2 align-middle whitespace-nowrap text-center text-sm text-muted-foreground"
                                        >
                                            {roleDisplayMap[user.role] ?? user.role}
                                        </td>

                                        <td
                                            data-slot="table-cell"
                                            className="p-2 align-middle whitespace-nowrap text-center"
                                        >
                        <span
                            data-slot="badge"
                            className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0"
                            style={{
                                backgroundColor:
                                    statusStyles[user.status]?.bg ?? statusStyles.INACTIVE.bg,
                                color:
                                    statusStyles[user.status]?.color ?? statusStyles.INACTIVE.color,
                                border: `1px solid ${
                                    statusStyles[user.status]?.border ??
                                    statusStyles.INACTIVE.border
                                }`,
                            }}
                        >
                          {statusStyles[user.status]?.label ?? statusStyles.INACTIVE.label}
                        </span>
                                        </td>

                                        <td
                                            data-slot="table-cell"
                                            className="p-2 align-middle whitespace-nowrap text-center font-semibold"
                                        >
                                            {user.projectCount ?? 0}
                                        </td>

                                        <td
                                            data-slot="table-cell"
                                            className="p-2 align-middle whitespace-nowrap text-center text-sm text-muted-foreground"
                                        >
                                            {user.joined ? new Date(user.joined).toLocaleDateString("ko-KR") : "-"}
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {filteredUsers.length > 0 ? (
                <PaginationControls
                    className="mt-4"
                    currentPage={currentPage}
                    totalPages={safeTotalPages}
                    onPageChange={setCurrentPage}
                />
            ) : null}
        </div>
    );
}