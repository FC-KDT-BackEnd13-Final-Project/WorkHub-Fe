import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import { AutoResizeTextarea } from "../ui/auto-resize-textarea";
import { format } from "date-fns";
import { companyUsers } from "../admin/userData";

// 상태 옵션
const statusOptions = ["전체 상태", "진행 중", "완료", "보류", "취소"] as const;

// 정렬 옵션: createdAt 기준
const sortOptions = ["최신순", "오래된순"] as const;

type Status = "진행 중" | "완료" | "보류" | "취소";
type SortOption = (typeof sortOptions)[number];

type Project = {
  id: string;
  name: string;
  brand: string;
  // 배열 형태(기존 목업 데이터용)
  managers?: string[];
  developers?: string[];
  // 문자열 형태(새로 생성된 프로젝트용)
  manager?: string;
  developer?: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: Status;
  teamSize: number;
  tasks: number;
  description: string;
  createdAt: string;
};

const initialProjects: Project[] = [
  {
    id: "prj-1",
    name: "웹사이트 리디자인",
    brand: "Aperture Studios",
    managers: ["Lena Morris"],
    developers: ["김준호"],
    startDate: "2024-09-01",
    endDate: "2024-12-15",
    progress: 75,
    status: "진행 중",
    teamSize: 5,
    tasks: 24,
    description: "모던한 디자인과 향상된 사용자 경험을 갖춘 회사 웹사이트 전면 개편",
    createdAt: "2024-09-10T10:00:00Z",
  },
  {
    id: "prj-2",
    name: "모바일 앱 개발",
    brand: "Nova FinTech",
    managers: ["Ethan Ward"],
    developers: ["박지민", "최수진"],
    startDate: "2024-08-12",
    endDate: "2024-12-30",
    progress: 45,
    status: "보류",
    teamSize: 8,
    tasks: 32,
    description: "안전한 결제 연동을 갖춘 고객 참여용 iOS·Android 네이티브 앱 개발",
    createdAt: "2024-08-20T13:20:00Z",
  },
  {
    id: "prj-3",
    name: "마케팅 캠페인",
    brand: "GlobeMart",
    managers: ["Nora Lee", "David Kim"],
    developers: ["이도윤"],
    startDate: "2024-07-01",
    endDate: "2024-12-10",
    progress: 90,
    status: "완료",
    teamSize: 3,
    tasks: 18,
    description: "소셜 미디어와 이메일에 집중한 Q4 옴니채널 디지털 마케팅 캠페인",
    createdAt: "2024-07-05T09:00:00Z",
  },
  {
    id: "prj-4",
    name: "데이터베이스 마이그레이션",
    brand: "Unity Logistics",
    managers: ["Chris Reynolds"],
    developers: ["정서현", "김민준"],
    startDate: "2024-06-10",
    endDate: "2024-12-01",
    progress: 100,
    status: "완료",
    teamSize: 4,
    tasks: 20,
    description: "레거시 온프레미스 데이터베이스를 확장형 클라우드 인프라로 이전",
    createdAt: "2024-06-15T15:30:00Z",
  },
];

// 날짜 유틸 함수들
const getNextDayISO = (dateString: string) => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0]!;
};

const getPreviousDayISO = (dateString: string) => {
  const date = new Date(dateString);
  date.setDate(date.getDate() - 1);
  return date.toISOString().split("T")[0]!;
};

// 필터용: 시작일 기준 최대 1년(1년 - 1일) 뒤까지만 허용
const getOneYearLaterISO = (dateString: string) => {
  const date = new Date(dateString);
  date.setFullYear(date.getFullYear() + 1);
  date.setDate(date.getDate() - 1);
  return date.toISOString().split("T")[0]!;
};

export function ProjectsIndex() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
      useState<(typeof statusOptions)[number]>("전체 상태");
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    brand: "",
    managers: [] as string[],
    developers: [] as string[],
    startDate: "",
    endDate: "",
  });

  // 정렬: 기본값 = 최신순 (createdAt 기준)
  const [sortOption, setSortOption] = useState<SortOption>("최신순");

  // 계약기간 필터(달력에서 직접 선택, 최대 1년)
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const [currentManagerInput, setCurrentManagerInput] = useState("");
  const [currentDeveloperInput, setCurrentDeveloperInput] = useState("");
  const [isCompanyLookupOpen, setIsCompanyLookupOpen] = useState(false);
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const navigate = useNavigate();

  const addManager = () => {
    if (
        currentManagerInput.trim() &&
        !newProject.managers.includes(currentManagerInput.trim())
    ) {
      setNewProject((prev) => ({
        ...prev,
        managers: [...prev.managers, currentManagerInput.trim()],
      }));
      setCurrentManagerInput("");
    }
  };

  const removeManager = (managerToRemove: string) => {
    setNewProject((prev) => ({
      ...prev,
      managers: prev.managers.filter((manager) => manager !== managerToRemove),
    }));
  };

  const addDeveloper = () => {
    if (
        currentDeveloperInput.trim() &&
        !newProject.developers.includes(currentDeveloperInput.trim())
    ) {
      setNewProject((prev) => ({
        ...prev,
        developers: [...prev.developers, currentDeveloperInput.trim()],
      }));
      setCurrentDeveloperInput("");
    }
  };

  const removeDeveloper = (developerToRemove: string) => {
    setNewProject((prev) => ({
      ...prev,
      developers: prev.developers.filter((developer) => developer !== developerToRemove),
    }));
  };

  const filteredProjects = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    const filtered = projects.filter((project) => {
      // 상태 필터
      const matchesStatus =
          statusFilter === "전체 상태" || project.status === statusFilter;

      // 검색어 필터 (이름, 브랜드, 매니저)
      const managerText =
          project.manager?.toLowerCase() ??
          (project.managers ? project.managers.join(", ").toLowerCase() : "");

      const matchesSearch =
          project.name.toLowerCase().includes(term) ||
          project.brand.toLowerCase().includes(term) ||
          managerText.includes(term);

      // 기간 필터: 프로젝트 기간과 선택한 필터 기간이 겹치는지 확인
      const projectStart = new Date(project.startDate);
      const projectEnd = new Date(project.endDate);
      const filterStart = filterStartDate ? new Date(filterStartDate) : undefined;
      const filterEnd = filterEndDate ? new Date(filterEndDate) : undefined;

      let matchesPeriod = true;

      if (filterStart && filterEnd) {
        // [프로젝트 기간]과 [필터 기간]이 서로 겹치면 통과
        matchesPeriod = projectEnd >= filterStart && projectStart <= filterEnd;
      } else if (filterStart) {
        matchesPeriod = projectEnd >= filterStart;
      } else if (filterEnd) {
        matchesPeriod = projectStart <= filterEnd;
      }

      return matchesStatus && matchesSearch && matchesPeriod;
    });

    // 정렬 (생성일 기준 createdAt)
    const sorted = [...filtered].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();

      if (sortOption === "최신순") {
        // 최근에 생성된 카드가 위로
        return bTime - aTime;
      }
      if (sortOption === "오래된순") {
        // 오래전에 생성된 카드가 위로
        return aTime - bTime;
      }

      return 0;
    });

    return sorted;
  }, [projects, searchTerm, statusFilter, sortOption, filterStartDate, filterEndDate]);

  const companyDirectory = useMemo(() => {
    const names = new Set<string>();
    projects.forEach((project) => names.add(project.brand));
    companyUsers.forEach((user) => names.add(user.company));
    return Array.from(names).sort();
  }, [projects]);

  const filteredCompanyDirectory = useMemo(() => {
    const term = companySearchTerm.toLowerCase().trim();
    if (!term) return companyDirectory;
    return companyDirectory.filter((company) =>
        company.toLowerCase().includes(term),
    );
  }, [companyDirectory, companySearchTerm]);

  const handleCreateProject = () => {
    if (!newProject.name || !newProject.brand || newProject.managers.length === 0) return;
    if (!newProject.startDate || !newProject.endDate) return;
    if (new Date(newProject.endDate) <= new Date(newProject.startDate)) return;

    const project: Project = {
      id: crypto.randomUUID(),
      name: newProject.name,
      description: newProject.description,
      brand: newProject.brand,
      manager: newProject.managers.join(", "),
      developer: newProject.developers.join(", "),
      startDate: newProject.startDate,
      endDate: newProject.endDate,
      progress: 0,
      status: "진행 중",
      teamSize: newProject.managers.length + newProject.developers.length,
      tasks: 0,
      createdAt: new Date().toISOString(), // 🔥 생성 시각 기준 정렬용
    };

    setProjects((prev) => [...prev, project]);
    setNewProject({
      name: "",
      description: "",
      brand: "",
      managers: [],
      developers: [],
      startDate: "",
      endDate: "",
    });
    setCurrentManagerInput("");
    setCurrentDeveloperInput("");
    setIsProjectModalOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProjectModalOpen(false);
      }
    };

    if (isProjectModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProjectModalOpen]);

  useEffect(() => {
    if (!isProjectModalOpen) {
      setIsCompanyLookupOpen(false);
      setCompanySearchTerm("");
    }
  }, [isProjectModalOpen]);

  const handleSelectCompany = (company: string) => {
    setNewProject((prev) => ({ ...prev, brand: company }));
    setIsCompanyLookupOpen(false);
    setCompanySearchTerm("");
  };

  const getManagerDisplay = (project: Project) => {
    if (project.manager) return project.manager;
    if (project.managers && project.managers.length > 0) {
      return project.managers.join(", ");
    }
    return "";
  };

  const getDeveloperDisplay = (project: Project) => {
    if (project.developer) return project.developer;
    if (project.developers && project.developers.length > 0) {
      return project.developers.join(", ");
    }
    return "";
  };

  return (
      <div className="space-y-6">
        {/* 프로젝트 생성 모달 */}
        {isProjectModalOpen && (
            <div className="fixed inset-0 z-50">
              <div className="min-h-screen flex items-center justify-center">
                <div
                    className="w-full"
                    style={{ maxWidth: "var(--login-card-max-width, 42rem)" }}
                >
                  <Card className="login-theme border border-border shadow-lg">
                    <CardHeader className="space-y-2 pb-6">
                      <h2 className="text-xl text-center">새 프로젝트 만들기</h2>
                      <p className="text-sm text-muted-foreground text-center">
                        워크스페이스에 프로젝트를 추가하려면 아래 정보를 입력하세요.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* 프로젝트 이름 */}
                        <div className="space-y-2">
                          <Label htmlFor="projectName" className="text-gray-700">
                            프로젝트 이름
                          </Label>
                          <Input
                              id="projectName"
                              value={newProject.name}
                              onChange={(e) =>
                                  setNewProject((prev) => ({ ...prev, name: e.target.value }))
                              }
                              className="h-9 rounded-md border border-border bg-input-background px-3 py-1 focus:bg-white focus:border-primary transition-colors"
                          />
                        </div>

                        {/* 프로젝트 설명 */}
                        <div className="space-y-2">
                          <Label htmlFor="projectDescription" className="text-gray-700">
                            프로젝트 설명
                          </Label>
                          <AutoResizeTextarea
                              id="projectDescription"
                              value={newProject.description}
                              onChange={(e) =>
                                  setNewProject((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                  }))
                              }
                              className="w-full border rounded-md border-border bg-input-background px-3 py-2 focus:bg-white focus:border-primary transition-colors"
                              placeholder="프로젝트에 대한 간단한 설명을 입력하세요"
                              minHeight="36px"
                              maxHeight="200px"
                          />
                        </div>

                        {/* 고객사 */}
                        <div className="space-y-2">
                          <Label htmlFor="brand" className="text-gray-700">
                            고객사
                          </Label>
                          <div className="flex gap-2">
                            <Input
                                id="brand"
                                value={newProject.brand}
                                onChange={(e) =>
                                    setNewProject((prev) => ({
                                      ...prev,
                                      brand: e.target.value,
                                    }))
                                }
                                className="h-9 flex-1 rounded-md border border-border bg-input-background px-3 py-1 focus:bg-white focus:border-primary transition-colors"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                className="h-9 whitespace-nowrap px-4"
                                onClick={() => setIsCompanyLookupOpen((prev) => !prev)}
                            >
                              조회
                            </Button>
                          </div>
                          {isCompanyLookupOpen && (
                              <div className="space-y-3 rounded-xl border border-border bg-background/80 p-3 shadow-sm backdrop-blur">
                                <Input
                                    placeholder="회사명을 검색하세요"
                                    value={companySearchTerm}
                                    onChange={(e) => setCompanySearchTerm(e.target.value)}
                                    className="h-9 rounded-md border border-border bg-input-background px-3 py-1 focus:bg-white focus:border-primary transition-colors"
                                />
                                <div className="max-h-48 overflow-y-auto space-y-1 pt-1 pb-1">
                                  {filteredCompanyDirectory.length > 0 ? (
                                      filteredCompanyDirectory.map((company) => (
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
                                      <p className="text-xs text-muted-foreground">
                                        검색 결과가 없습니다.
                                      </p>
                                  )}
                                </div>
                              </div>
                          )}
                        </div>

                        {/* 담당 매니저 */}
                        <div className="space-y-2">
                          <Label htmlFor="manager" className="text-gray-700">
                            담당 매니저
                          </Label>
                          <div className="flex gap-2">
                            <Input
                                id="manager"
                                value={currentManagerInput}
                                onChange={(e) => setCurrentManagerInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && currentManagerInput.trim()) {
                                    addManager();
                                  }
                                }}
                                className="h-9 flex-grow rounded-md border border-border bg-input-background px-3 py-1 focus:bg-white focus:border-primary transition-colors"
                                placeholder="매니저 이름을 입력하세요"
                            />
                            <Button type="button" onClick={addManager} className="h-9 px-4">
                              추가
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {newProject.managers.map((manager, index) => (
                                <Badge
                                    key={index}
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                >
                                  {manager}
                                  <button
                                      type="button"
                                      onClick={() => removeManager(manager)}
                                      className="ml-1 text-xs text-secondary-foreground/70 hover:text-secondary-foreground"
                                  >
                                    &times;
                                  </button>
                                </Badge>
                            ))}
                          </div>
                        </div>

                        {/* 담당 개발자 */}
                        <div className="space-y-2">
                          <Label htmlFor="developer" className="text-gray-700">
                            담당 개발자
                          </Label>
                          <div className="flex gap-2">
                            <Input
                                id="developer"
                                value={currentDeveloperInput}
                                onChange={(e) => setCurrentDeveloperInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && currentDeveloperInput.trim()) {
                                    addDeveloper();
                                  }
                                }}
                                className="h-9 flex-grow rounded-md border border-border bg-input-background px-3 py-1 focus:bg-white focus:border-primary transition-colors"
                                placeholder="개발자 이름을 입력하세요"
                            />
                            <Button type="button" onClick={addDeveloper} className="h-9 px-4">
                              추가
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {newProject.developers.map((developer, index) => (
                                <Badge
                                    key={index}
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                >
                                  {developer}
                                  <button
                                      type="button"
                                      onClick={() => removeDeveloper(developer)}
                                      className="ml-1 text-xs text-secondary-foreground/70 hover:text-secondary-foreground"
                                  >
                                    &times;
                                  </button>
                                </Badge>
                            ))}
                          </div>
                        </div>

                        {/* 시작일 / 마감일 */}
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="startDate" className="text-gray-700">
                              시작일
                            </Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={newProject.startDate}
                                max={
                                  newProject.endDate
                                      ? getPreviousDayISO(newProject.endDate)
                                      : undefined
                                }
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setNewProject((prev) => {
                                    const updated = { ...prev, startDate: value };
                                    if (
                                        updated.endDate &&
                                        value &&
                                        new Date(updated.endDate) <= new Date(value)
                                    ) {
                                      updated.endDate = getNextDayISO(value);
                                    }
                                    return updated;
                                  });
                                }}
                                className="h-9 rounded-md border border-border bg-input-background px-3 py-1 focus:bg-white focus:border-primary transition-colors"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="endDate" className="text-gray-700">
                              마감일
                            </Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={newProject.endDate}
                                min={
                                  newProject.startDate
                                      ? getNextDayISO(newProject.startDate)
                                      : undefined
                                }
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setNewProject((prev) => {
                                    if (
                                        prev.startDate &&
                                        value &&
                                        new Date(value) <= new Date(prev.startDate)
                                    ) {
                                      return prev;
                                    }
                                    return { ...prev, endDate: value };
                                  });
                                }}
                                className="h-9 rounded-md border border-border bg-input-background px-3 py-1 focus:bg-white focus:border-primary transition-colors"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-6 flex justify-between gap-2">
                        <Button
                            variant="secondary"
                            className="w-1/2"
                            onClick={() => setIsProjectModalOpen(false)}
                        >
                          취소
                        </Button>
                        <Button className="w-1/2" onClick={handleCreateProject}>
                          프로젝트 생성
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
        )}

        {/* 헤더 */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-2 text-muted-foreground">
            각 프로젝트의 현황을 확인하고 세부 정보로 바로 이동하세요.
          </p>
        </div>

        {/* 상단 필터 영역 */}
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm md:flex-row md:items-center">
          {/* 검색어 */}
          <Input
              placeholder="프로젝트를 검색하세요"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="md:flex-1"
          />

          {/* 상태 필터 */}
          <Select
              value={statusFilter}
              onValueChange={(value) =>
                  setStatusFilter(value as (typeof statusOptions)[number])
              }
          >
            <SelectTrigger className="h-9 rounded-md bg-input-background px-3 py-1 md:w-40">
              <SelectValue placeholder="전체 상태" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                  <SelectItem value={option} key={option}>
                    {option}
                  </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 계약기간 (시작/종료 하나의 폼) */}
          <div className="flex items-center gap-2">
            <Label className="whitespace-nowrap text-xs md:text-sm">계약기간</Label>
            <div className="flex items-center gap-1">
              {/* 기간 시작 */}
              <Input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFilterStartDate(value);

                    // 시작일 변경 시, 종료일이 1년 범위를 넘으면 잘라줌
                    if (value && filterEndDate) {
                      const maxEnd = getOneYearLaterISO(value);
                      if (new Date(filterEndDate) > new Date(maxEnd)) {
                        setFilterEndDate(maxEnd);
                      }
                    }
                  }}
                  className="h-9 w-[140px] rounded-md border border-border bg-input-background px-3 py-1"
              />

              <span className="px-1 text-sm text-muted-foreground">~</span>

              {/* 기간 종료 (시작일 ~ 시작일 + 1년 - 1일) */}
              <Input
                  type="date"
                  value={filterEndDate}
                  min={filterStartDate || undefined}
                  max={filterStartDate ? getOneYearLaterISO(filterStartDate) : undefined}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="h-9 w-[140px] rounded-md border border-border bg-input-background px-3 py-1"
              />
            </div>
          </div>

          {/* 정렬 옵션 (createdAt 기준) */}
          <Select
              value={sortOption}
              onValueChange={(value) => setSortOption(value as SortOption)}
          >
            <SelectTrigger className="h-9 rounded-md bg-input-background px-3 py-1 md:w-29">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 새 프로젝트 버튼 */}
          <Button
              className="h-9 px-4 text-sm md:w-auto"
              onClick={() => setIsProjectModalOpen(true)}
          >
            + 새 프로젝트
          </Button>
        </div>

        {/* 프로젝트 카드 리스트 */}
        <div className="grid gap-4 lg:grid-cols-3">
          {filteredProjects.map((project) => (
              <Card
                  key={project.id}
                  className="cursor-pointer rounded-2xl border border-white/70 bg-white/90 shadow-sm backdrop-blur transition-shadow hover:shadow-lg"
                  onClick={() => navigate(`/projects/${project.id}/nodes`)}
              >
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{project.brand}</p>
                      <CardTitle className="text-xl">{project.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        개발자 · {getDeveloperDisplay(project)}
                      </p>
                    </div>
                    <Badge
                        variant={project.status === "완료" ? "default" : "secondary"}
                    >
                      {project.status}
                    </Badge>
                  </div>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">고객 담당자</span>
                      <span className="font-medium">{getManagerDisplay(project)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">팀 규모</span>
                      <span className="font-medium">{project.teamSize}명</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">워크플로 단계</span>
                      <span className="font-medium">{project.tasks}건</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">시작일</span>
                      <span className="font-medium">
                    {format(new Date(project.startDate), "MMM dd, yyyy")}
                  </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">마감일</span>
                      <span className="font-medium">
                    {format(new Date(project.endDate), "MMM dd, yyyy")}
                  </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>진행률</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="mt-2" />
                  </div>
                </CardContent>
              </Card>
          ))}
        </div>
      </div>
  );
}