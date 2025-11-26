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

const roles = ["All", "Client", "Developer", "Manager", "Admin"] as const;

const users = [
  {
    id: "usr-101",
    name: "Jane Smith",
    email: "jane@studio.kr",
    role: "Manager",
    company: "Nova FinTech",
    avatarUrl: "https://i.pravatar.cc/80?img=47",
    status: "Active",
    projects: 6,
    workload: "72%",
    joined: "2022-04-10",
  },
  {
    id: "usr-102",
    name: "Chris Davis",
    email: "chris@workhub.com",
    role: "Developer",
    company: "WorkHub Labs",
    avatarUrl: "https://i.pravatar.cc/80?img=12",
    status: "Active",
    projects: 4,
    workload: "64%",
    joined: "2023-01-18",
  },
  {
    id: "usr-103",
    name: "Ava Kim",
    email: "ava@designplus.io",
    role: "Client",
    company: "DesignPlus",
    avatarUrl: "https://i.pravatar.cc/80?img=32",
    status: "Pending",
    projects: 3,
    workload: "28%",
    joined: "2023-09-05",
  },
  {
    id: "usr-104",
    name: "Noah Lee",
    email: "noah@buildly.dev",
    role: "Admin",
    company: "WorkHub Labs",
    avatarUrl: "https://i.pravatar.cc/80?img=21",
    status: "Active",
    projects: 9,
    workload: "88%",
    joined: "2021-11-02",
  },
  {
    id: "usr-105",
    name: "Lena Morris",
    email: "lena@aperture.io",
    role: "Project Lead",
    company: "Aperture Studios",
    avatarUrl: "https://i.pravatar.cc/80?img=15",
    status: "Active",
    projects: 5,
    workload: "67%",
    joined: "2022-08-14",
  },
  {
    id: "usr-106",
    name: "Ethan Ward",
    email: "ethan@nova.io",
    role: "Developer",
    company: "Nova FinTech",
    avatarUrl: "https://i.pravatar.cc/80?img=18",
    status: "Active",
    projects: 4,
    workload: "61%",
    joined: "2022-10-01",
  },
  {
    id: "usr-107",
    name: "Nora Lee",
    email: "nora@globemart.com",
    role: "Client Manager",
    company: "GlobeMart",
    avatarUrl: "https://i.pravatar.cc/80?img=9",
    status: "Pending",
    projects: 3,
    workload: "35%",
    joined: "2023-02-19",
  },
  {
    id: "usr-108",
    name: "Chris Reynolds",
    email: "chris@unitylogistics.com",
    role: "Lead Engineer",
    company: "Unity Logistics",
    avatarUrl: "https://i.pravatar.cc/80?img=28",
    status: "Active",
    projects: 8,
    workload: "82%",
    joined: "2021-05-11",
  },
  {
    id: "usr-109",
    name: "Lena Park",
    email: "lena@lumina.ai",
    role: "UX Designer",
    company: "Lumina Labs",
    avatarUrl: "https://i.pravatar.cc/80?img=44",
    status: "Active",
    projects: 6,
    workload: "74%",
    joined: "2023-03-05",
  },
  {
    id: "usr-110",
    name: "Daniel Cho",
    email: "daniel@bluewave.io",
    role: "Data Analyst",
    company: "BlueWave Data",
    avatarUrl: "https://i.pravatar.cc/80?img=36",
    status: "Active",
    projects: 7,
    workload: "79%",
    joined: "2022-01-23",
  },
  {
    id: "usr-111",
    name: "Emily Carter",
    email: "emily@stellarhq.com",
    role: "Customer Success",
    company: "Stellar HQ",
    avatarUrl: "https://i.pravatar.cc/80?img=53",
    status: "Active",
    projects: 5,
    workload: "58%",
    joined: "2023-07-17",
  },
  {
    id: "usr-112",
    name: "Michael Green",
    email: "michael@atlasco.com",
    role: "QA Lead",
    company: "Atlas Co",
    avatarUrl: "https://i.pravatar.cc/80?img=63",
    status: "Pending",
    projects: 2,
    workload: "41%",
    joined: "2023-09-30",
  },
];

const PAGE_SIZE = 10;

export function AdminUsers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<(typeof roles)[number]>("All");
  const [companyFilter, setCompanyFilter] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term);
      const matchesRole = roleFilter === "All" || user.role === roleFilter;
      const matchesCompany = companyFilter === "All" || user.company === companyFilter;
      return matchesSearch && matchesRole && matchesCompany;
    });
  }, [search, roleFilter, companyFilter]);

  const companies = useMemo(() => {
    const set = new Set<string>();
    users.forEach((user) => set.add(user.company));
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
          Manage every member across the workspace, assign access, and review activity.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm md:flex-row md:items-center">
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="md:flex-1"
        />
        <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as (typeof roles)[number])}>
          <SelectTrigger className="md:w-52">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={companyFilter} onValueChange={(value) => setCompanyFilter(value)}>
          <SelectTrigger className="md:w-52">
            <SelectValue placeholder="All Companies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Companies</SelectItem>
            {companies.map((company) => (
              <SelectItem key={company} value={company}>
                {company}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button className="md:w-auto" onClick={() => navigate("/admin/users/add")}>
          + Add
        </Button>
      </div>

      <Card className="rounded-2xl bg-white shadow-sm">
        <CardContent className="px-6 pt-6 pb-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/4">User</TableHead>
                <TableHead className="w-1/6 text-center">Company</TableHead>
                <TableHead className="w-1/6 text-center">Role</TableHead>
                <TableHead className="w-1/6 text-center">Status</TableHead>
                <TableHead className="w-1/12 text-center">Projects</TableHead>
                <TableHead className="w-1/12 text-center">Workload</TableHead>
                <TableHead className="w-1/6 text-center">Joined</TableHead>
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
                  <TableCell className="text-center text-sm text-muted-foreground">{user.role}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={user.status === "Active" ? "default" : "secondary"}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-medium">{user.projects}</TableCell>
                  <TableCell className="text-center font-medium">{user.workload}</TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">
                    {new Date(user.joined).toLocaleDateString()}
                  </TableCell>


                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {filteredUsers.length > PAGE_SIZE && (
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
      )}
    </div>
  );
}
