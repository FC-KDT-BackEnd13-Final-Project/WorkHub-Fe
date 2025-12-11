import { MouseEvent, PointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
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
import { ChevronDown, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { projectApi } from "../../lib/api";
import { mapApiProjectToUiProject, type Project } from "../../utils/projectMapper";
import type { ProjectListParams, SortOrder } from "../../types/project";
import { cn } from "../ui/utils";

// 상태 옵션
const statusOptions = [
  "ALL",
  "CONTRACT",
  "IN_PROGRESS",
  "DELIVERY",
  "MAINTENANCE",
  "COMPLETED",
  "CANCELLED",
] as const;

const projectStatusOptions: ProjectStatus[] = statusOptions.filter(
    (option): option is ProjectStatus => option !== "ALL",
);

// 정렬 옵션: startDate 기준
const sortOptions = ["최신순", "오래된순"] as const;

type StatusFilter = (typeof statusOptions)[number];
type ProjectStatus = Exclude<StatusFilter, "ALL">;

type StatusStyle = {
  background: string;
  text: string;
  border: string;
};

const statusStyles: Record<ProjectStatus, StatusStyle> = {
  CONTRACT: {
    background: "#EEF2FF", // indigo-50
    text: "#4338CA", // indigo-700
    border: "#C7D2FE", // indigo-200
  },
  IN_PROGRESS: {
    background: "#EFF6FF", // blue-50
    text: "#1D4ED8", // blue-700
    border: "#BFDBFE", // blue-200
  },
  DELIVERY: {
    background: "#FFFBEB", // amber-50
    text: "#B45309", // amber-700
    border: "#FDE68A", // amber-200
  },
  MAINTENANCE: {
    background: "#F0FDFA", // teal-50
    text: "#0F766E", // teal-700
    border: "#99F6E4", // teal-200
  },
  COMPLETED: {
    background: "#ECFDF5", // green-50
    text: "#047857", // green-700
    border: "#A7F3D0", // green-200
  },
  CANCELLED: {
    background: "#FEF2F2", // red-50
    text: "#B91C1C", // red-700
    border: "#FECACA", // red-200
  },
};

type SortOption = (typeof sortOptions)[number];
type CompanyContact = {
  id: string;
  name: string;
  email: string;
  company: string;
  avatarUrl?: string;
};

const createProjectFormState = () => ({
  name: "",
  description: "",
  brand: "",
  managers: [] as string[],
  developers: [] as { id: string; name: string }[],
  startDate: "",
  endDate: "",
});

type ProjectFormState = ReturnType<typeof createProjectFormState>;

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

// UI 정렬 옵션을 API SortOrder로 변환
const getSortOrderForApi = (uiSort: SortOption): SortOrder => {
  if (uiSort === "최신순") return "LATEST";
  if (uiSort === "오래된순") return "OLDEST";
  return "LATEST"; // 기본값
};

export function ProjectsIndex() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [projects, setProjects] = useState<Project[]>([]);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newProject, setNewProject] = useState<ProjectFormState>(
      createProjectFormState,
  );
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isProjectEditMode, setIsProjectEditMode] = useState(false);
  const [statusModalProject, setStatusModalProject] = useState<Project | null>(null);
  const [statusModalValue, setStatusModalValue] = useState<ProjectStatus | "">("");

  // 정렬: 기본값 = 최신순 (startDate 기준)
  const [sortOption, setSortOption] = useState<SortOption>("최신순");

  // 계약기간 필터(달력에서 직접 선택, 최대 1년)
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const [currentDeveloperInput, setCurrentDeveloperInput] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const [selectedCompanyContacts, setSelectedCompanyContacts] = useState<string[]>([]);
  const [isContactDropdownOpen, setIsContactDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const isEditingProjectForm = Boolean(editingProject);

  // API 연동을 위한 상태
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // 무한 스크롤을 위한 ref
  const observerTarget = useRef<HTMLDivElement>(null);
  const contactDropdownRef = useRef<HTMLDivElement>(null);

  const addDeveloper = () => {
    const trimmed = currentDeveloperInput.trim();
    if (!trimmed) return;
    if (newProject.developers.some((dev) => dev.name === trimmed)) return;
    setNewProject((prev) => ({
      ...prev,
      developers: [...prev.developers, { id: crypto.randomUUID(), name: trimmed }],
    }));
    setCurrentDeveloperInput("");
  };

  const removeDeveloper = (developerToRemove: string) => {
    setNewProject((prev) => ({
      ...prev,
      developers: prev.developers.filter((developer) => developer.name !== developerToRemove),
    }));
  };

  // API 호출 함수
  const fetchProjects = useCallback(async (loadMore = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const params: ProjectListParams = {
        startDate: filterStartDate || undefined,
        endDate: filterEndDate || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        sortOrder: getSortOrderForApi(sortOption),
        cursor: loadMore ? nextCursor ?? undefined : undefined,
      };

      const response = await projectApi.getList(params);

      // API 응답을 UI 타입으로 변환
      const uiProjects = response.projects?.map(mapApiProjectToUiProject) ?? [];

      if (loadMore) {
        // 무한 스크롤: 기존 목록에 추가
        setProjects((prev) => [...prev, ...uiProjects]);
      } else {
        // 새로운 검색: 목록 교체
        setProjects(uiProjects);
      }

      setNextCursor(response.nextCursor);
      setHasMore(response.hasNext);
    } catch (err) {
      console.error("프로젝트 목록 로드 실패:", err);

      // 서버 응답 메시지 추출
      let errorMessage = "프로젝트를 불러오는데 실패했습니다.";

      if (err instanceof Error) {
        // API에서 던진 에러 메시지 (api.ts의 throw new Error(message))
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null && 'response' in err) {
        // axios 에러인 경우
        const axiosError = err as any;
        errorMessage = axiosError.response?.data?.message || errorMessage;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [filterStartDate, filterEndDate, statusFilter, sortOption, nextCursor]);

  // 초기 로드 및 필터 변경 시 데이터 새로고침
  useEffect(() => {
    fetchProjects(false); // 첫 페이지 로드
  }, [filterStartDate, filterEndDate, statusFilter, sortOption]);

  // 검색어 필터링 (클라이언트 사이드)
  // 서버에서 이미 status, date, sort 필터링/정렬을 처리하므로 검색어만 처리
  const filteredProjects = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return projects;

    return projects.filter((project) => {
      const managerText =
          project.manager?.toLowerCase() ??
          (project.managers ? project.managers.join(", ").toLowerCase() : "");

      return (
          project.name.toLowerCase().includes(term) ||
          project.brand.toLowerCase().includes(term) ||
          managerText.includes(term)
      );
    });
  }, [projects, searchTerm]);

  const companyDirectory = useMemo(() => {
    const names = new Set<string>();
    companyUsers.forEach((user) => names.add(user.company));
    projects.forEach((project) => {
      if (project.brand) {
        names.add(project.brand);
      }
    });
    return Array.from(names).sort();
  }, [companyUsers, projects]);

  const companyContactMap = useMemo(() => {
    const map = new Map<string, CompanyContact[]>();

    companyUsers.forEach((user) => {
      if (!map.has(user.company)) {
        map.set(user.company, []);
      }
      map.get(user.company)!.push({
        id: user.id,
        name: user.name,
        email: user.email,
        company: user.company,
        avatarUrl: user.avatarUrl,
      });
    });

    return map;
  }, [companyUsers]);

  const filteredCompanyDirectory = useMemo(() => {
    const term = companySearchTerm.toLowerCase().trim();
    if (!term) return [];
    return companyDirectory
      .filter((name) => name.toLowerCase().includes(term))
      .filter((name) => name !== selectedCompany);
  }, [companyDirectory, companySearchTerm, selectedCompany]);

  const currentCompanyMembers: CompanyContact[] = selectedCompany
    ? companyContactMap.get(selectedCompany) ?? []
    : [];

  const filteredCompanyMembers = currentCompanyMembers;

  const handleSelectCompany = (companyName: string) => {
    setSelectedCompany(companyName);
    setCompanySearchTerm(companyName);

    setSelectedCompanyContacts([]);
    setIsContactDropdownOpen(false);

    setNewProject((prev) => ({
      ...prev,
      brand: companyName,
      managers: [],
    }));
  };

  const handleToggleCompanyContact = (contactName: string) => {
    setSelectedCompanyContacts((prev) => {
      const exists = prev.includes(contactName);
      const next = exists ? prev.filter((name) => name !== contactName) : [...prev, contactName];

      setNewProject((prevProject) => ({
        ...prevProject,
        managers: next,
      }));

      return next;
    });
  };

  const resetCreateForm = useCallback(() => {
    setNewProject(createProjectFormState());
    setCurrentDeveloperInput("");
    setSelectedCompany(null);
    setCompanySearchTerm("");
    setSelectedCompanyContacts([]);
    setIsContactDropdownOpen(false);
  }, []);

  const closeProjectModal = useCallback(() => {
    setIsProjectModalOpen(false);
    setEditingProject((prev) => {
      if (prev) {
        resetCreateForm();
      }
      return null;
    });
  }, [resetCreateForm]);

  const handleOpenCreateModal = () => {
    setEditingProject(null);
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = () => {
    if (!newProject.name || !newProject.brand || newProject.managers.length === 0)
      return;
    if (!newProject.startDate || !newProject.endDate) return;
    if (new Date(newProject.endDate) <= new Date(newProject.startDate)) return;

    const managerText = newProject.managers.join(", ");
    const developerText = newProject.developers.map((dev) => dev.name).join(", ");
    const teamSize = newProject.managers.length + newProject.developers.length;

    if (editingProject) {
      setProjects((prev) =>
        prev.map((project) =>
          project.id === editingProject.id
            ? {
                ...project,
                name: newProject.name,
                description: newProject.description,
                brand: newProject.brand,
                manager: managerText,
                developer: developerText,
                managers: [...newProject.managers],
                developers: [...newProject.developers],
                startDate: newProject.startDate,
                endDate: newProject.endDate,
                teamSize,
              }
            : project,
        ),
      );
    } else {
      const project: Project = {
        id: crypto.randomUUID(),
        name: newProject.name,
        description: newProject.description,
        brand: newProject.brand,
        manager: managerText,
        developer: developerText,
        managers: [...newProject.managers],
        developers: [...newProject.developers],
        startDate: newProject.startDate,
        endDate: newProject.endDate,
        progress: 0,
        status: "IN_PROGRESS",
        teamSize,
        tasks: 0,
      };

      setProjects((prev) => [...prev, project]);
    }
    resetCreateForm();
    setEditingProject(null);
    setIsProjectModalOpen(false);
  };

  const handleEditProject = (project: Project) => {
    const managerList = project.manager
        ? project.manager.split(",").map((name) => name.trim()).filter(Boolean)
        : project.managers ?? [];
    const developerList = project.developer
        ? project.developer
            .split(",")
            .map((name) => name.trim())
            .filter(Boolean)
            .map((name) => ({ id: name, name }))
        : project.developers ?? [];

    setNewProject({
      name: project.name,
      description: project.description,
      brand: project.brand,
      managers: managerList,
      developers: developerList,
      startDate: project.startDate,
      endDate: project.endDate,
    });
    setCurrentDeveloperInput("");
    setSelectedCompany(project.brand ? project.brand : null);
    setCompanySearchTerm(project.brand ?? "");
    setSelectedCompanyContacts(managerList);
    setIsContactDropdownOpen(false);
    setEditingProject(project);
    setIsProjectModalOpen(true);
  };

  const openStatusModal = (project: Project) => {
    setStatusModalProject(project);
    setStatusModalValue(project.status);
  };

  const closeStatusModal = () => {
    setStatusModalProject(null);
    setStatusModalValue("");
  };

  const handleApplyStatusChange = () => {
    if (!statusModalProject || !statusModalValue) return;
    setProjects((prev) =>
        prev.map((project) =>
            project.id === statusModalProject.id
                ? { ...project, status: statusModalValue }
                : project,
        ),
    );
    closeStatusModal();
  };

  const handleDeleteProject = (project: Project) => {
    const message = `"${project.name}" 프로젝트를 삭제할까요? 이 작업은 되돌릴 수 없습니다.`;
    if (window.confirm(message)) {
      setProjects((prev) => prev.filter((item) => item.id !== project.id));
      if (editingProject && editingProject.id === project.id) {
        resetCreateForm();
        setEditingProject(null);
        setIsProjectModalOpen(false);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeProjectModal();
      }
    };

    if (isProjectModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeProjectModal, isProjectModalOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!contactDropdownRef.current) return;
      if (!contactDropdownRef.current.contains(event.target as Node)) {
        setIsContactDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setIsContactDropdownOpen(false);
  }, [selectedCompany]);

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
      return project.developers.map((dev) => dev.name).join(", ");
    }
    return "";
  };

  // 무한 스크롤 - Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // 관찰 대상이 화면에 보이고, 더 불러올 데이터가 있고, 현재 로딩 중이 아닐 때
        if (entries[0]?.isIntersecting && hasMore && !isLoading) {
          fetchProjects(true); // 다음 페이지 로드
        }
      },
      { threshold: 0.1 } // 10%만 보여도 트리거
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, fetchProjects]);

  return (
      <div className="space-y-6">
        {statusModalProject && (
            <div className="fixed inset-0 z-40">
              <div className="min-h-screen flex items-center justify-center p-4 bg-black/40">
                <div className="w-full" style={{ maxWidth: "28rem" }}>
                  <Card className="border border-border shadow-lg">
                    <CardHeader className="space-y-2 pb-4">
                      <h2 className="text-lg font-semibold text-center">프로젝트 상태 변경</h2>
                      <p className="text-sm text-muted-foreground text-center">
                        "{statusModalProject.name}"의 상태를 선택하세요.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Select
                          value={statusModalValue || undefined}
                          onValueChange={(value) => setStatusModalValue(value as ProjectStatus)}
                      >
                        <SelectTrigger className="h-10 w-full">
                          <SelectValue placeholder="상태 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {projectStatusOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            className="w-1/2"
                            onClick={closeStatusModal}
                        >
                          취소
                        </Button>
                        <Button
                            type="button"
                            className="w-1/2"
                            disabled={!statusModalValue}
                            onClick={handleApplyStatusChange}
                        >
                          상태 변경
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
        )}
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
                      <h2 className="text-xl text-center">
                        {isEditingProjectForm ? "프로젝트 수정" : "새 프로젝트 만들기"}
                      </h2>
                      <p className="text-sm text-muted-foreground text-center">
                        {isEditingProjectForm
                            ? "선택한 프로젝트 정보를 업데이트하세요."
                            : "워크스페이스에 프로젝트를 추가하려면 아래 정보를 입력하세요."}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* 프로젝트 이름 */}
                        <div className="space-y-2">
                          <Label htmlFor="projectName" className="text-gray-700">
                            프로젝트 이름
                          </Label>
                          <Input
                              id="projectName"
                              value={newProject.name}
                              onChange={(e) =>
                                  setNewProject((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                  }))
                              }
                              className="rounded-md border border-border bg-input-background px-3 py-2 focus:bg-white focus:border-primary transition-colors"
                          />
                        </div>

                        {/* 프로젝트 설명 */}
                        <div className="space-y-2">
                          <Label
                              htmlFor="projectDescription"
                              className="text-gray-700"
                          >
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
                              className="w-full border rounded-md border-border bg-input-background px-3 py-2 text-sm focus:bg-white focus:border-primary transition-colors"
                              placeholder="프로젝트에 대한 간단한 설명을 입력하세요"
                              minHeight="36px"
                              maxHeight="200px"
                          />
                        </div>

                        {/* 회사 & 담당자 */}
                        <div className="grid gap-6 md:grid-cols-2">
                          {/* 1단계: 회사 선택 */}
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-800">고객사</Label>
                            <div className="relative">
                              <Input
                                value={companySearchTerm}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setCompanySearchTerm(value);
                                  setSelectedCompany(null);
                                  setSelectedCompanyContacts([]);
                                  setContactSearchTerm("");
                                  setNewProject((prev) => ({
                                    ...prev,
                                    brand: value,
                                    managers: [],
                                  }));
                                }}
                                placeholder="회사명을 입력하세요"
                                className="rounded-md border border-border bg-input-background px-3 py-2 text-sm focus:bg-white focus:border-primary transition-colors"
                              />

                              {filteredCompanyDirectory.length > 0 && (
                                <div className="absolute left-0 right-0 z-30 mt-1 w-full max-h-52 overflow-y-auto rounded-md border border-border bg-white shadow-md">
                                  <div className="divide-y divide-border">
                                    {filteredCompanyDirectory.map((company) => {
                                      const isActive = selectedCompany === company;
                                      return (
                                        <button
                                          key={company}
                                          type="button"
                                          onClick={() => handleSelectCompany(company)}
                                          className={cn(
                                            "flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors",
                                            isActive
                                              ? "bg-primary/5 text-primary"
                                              : "bg-white hover:bg-accent/60",
                                          )}
                                        >
                                          <span>{company}</span>
                                          {isActive && (
                                            <span className="text-[11px] font-medium text-primary">
                                              선택됨
                                            </span>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 2단계: 담당자 선택 */}
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-800">담당자</Label>

                            <div className="relative" ref={contactDropdownRef}>
                              <button
                                type="button"
                                onClick={() => selectedCompany && setIsContactDropdownOpen((prev) => !prev)}
                                disabled={!selectedCompany}
                                aria-haspopup="listbox"
                                aria-expanded={isContactDropdownOpen}
                                className={cn(
                                  "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-border bg-input-background px-3 py-2 text-sm transition-colors",
                                  selectedCompany
                                    ? "hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                                    : "cursor-not-allowed bg-muted text-muted-foreground",
                                )}
                              >
                                <span className="flex flex-1 flex-wrap gap-1 text-left">
                                  {selectedCompanyContacts.length > 0 ? (
                                    selectedCompanyContacts.map((name) => (
                                      <span
                                        key={name}
                                        className="inline-flex items-center justify-center gap-1 rounded-md border border-transparent bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                                      >
                                        {name}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-sm text-muted-foreground">담당자를 선택하세요</span>
                                  )}
                                </span>
                                <ChevronDown
                                  className={cn(
                                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                                    isContactDropdownOpen ? "rotate-180" : "",
                                  )}
                                />
                              </button>

                              {isContactDropdownOpen && selectedCompany && (
                                <div className="absolute left-0 right-0 z-30 mt-1 w-full max-h-56 overflow-y-auto rounded-md border border-border bg-white shadow-md">
                                  {filteredCompanyMembers.length > 0 ? (
                                    filteredCompanyMembers.map((member) => {
                                      const isSelected = selectedCompanyContacts.includes(member.name);
                                      return (
                                        <button
                                          key={member.id}
                                          type="button"
                                          onClick={() => handleToggleCompanyContact(member.name)}
                                          className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent/60 ${
                                            isSelected ? "bg-primary/5 text-primary" : ""
                                          }`}
                                        >
                                          <div className="flex items-center gap-3">
                                            <img
                                              src={member.avatarUrl || "/default-profile.png"}
                                              alt={`${member.name} 프로필`}
                                              className="h-6 w-6 rounded-full object-cover"
                                            />
                                            <div className="flex flex-col leading-tight">
                                              <span className="text-sm font-medium">
                                                {member.name} ({member.id})
                                              </span>
                                              <span className="text-xs text-muted-foreground">
                                                {member.email}
                                              </span>
                                            </div>
                                          </div>
                                          <span className="text-xs font-medium text-primary">
                                            {isSelected ? "선택됨" : ""}
                                          </span>
                                        </button>
                                      );
                                    })
                                  ) : (
                                    <p className="py-6 text-center text-xs text-muted-foreground">
                                      등록된 담당자가 없습니다.
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
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
                                onChange={(e) =>
                                    setCurrentDeveloperInput(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (
                                      e.key === "Enter" &&
                                      currentDeveloperInput.trim()
                                  ) {
                                    addDeveloper();
                                  }
                                }}
                                className="flex-grow rounded-md border border-border bg-input-background px-3 py-2 focus:bg-white focus:border-primary transition-colors"
                                placeholder="개발자 이름을 입력하세요"
                            />
                            <Button
                                type="button"
                                onClick={addDeveloper}
                                className="px-4 py-2"
                            >
                              추가
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {newProject.developers.map((developer, index) => (
                                <Badge
                                    key={`${developer.id}-${index}`}
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                >
                                  {developer.name}
                                  <button
                                      type="button"
                                      onClick={() => removeDeveloper(developer.name)}
                                      className="ml-1 text-xs text-secondary-foreground/70 hover:text-secondary-foreground"
                                  >
                                    &times;
                                  </button>
                                </Badge>
                            ))}
                          </div>
                        </div>

                        {/* 시작일 / 마감일 */}
                        <div className="grid gap-6 sm:grid-cols-2">
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
                                className="rounded-md border border-border bg-input-background px-3 py-2 focus:bg-white focus:border-primary transition-colors"
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
                                className="rounded-md border border-border bg-input-background px-3 py-2 focus:bg-white focus:border-primary transition-colors"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-6 flex justify-between gap-2">
                        <Button
                            variant="secondary"
                            className="w-1/2"
                            onClick={closeProjectModal}
                        >
                          취소
                        </Button>
                        <Button className="w-1/2" onClick={handleSaveProject}>
                          {isEditingProjectForm ? "프로젝트 수정" : "프로젝트 생성"}
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
                  setStatusFilter(value as StatusFilter)
              }
          >
            <SelectTrigger className="h-9 rounded-md bg-input-background px-3 py-1 md:w-40">
              <SelectValue placeholder="ALL" />
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
            <Label className="whitespace-nowrap text-xs md:text-sm">
              계약기간
            </Label>
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

          {/* 정렬 옵션 (startDate 기준) */}
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

          {/* 새 프로젝트 + 편집 모드 버튼 */}
          <div className="flex items-center gap-2">
            <Button
                className="h-9 px-4 text-sm md:w-auto"
                onClick={handleOpenCreateModal}
            >
              + 새 프로젝트
            </Button>
            <Button
                variant={isProjectEditMode ? "default" : "outline"}
                className="h-9 px-4 text-sm"
                onClick={() => setIsProjectEditMode((prev) => !prev)}
            >
              {isProjectEditMode ? "편집 완료" : "편집"}
            </Button>
          </div>
        </div>

        {/* 로딩 상태 */}
        {isLoading && !projects.length && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">프로젝트 목록을 불러오는 중...</p>
            </div>
        )}

        {/* 에러 상태 */}
        {error && (
            <div className="rounded-2xl bg-white p-6 shadow-sm text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => fetchProjects(false)} variant="outline">
                다시 시도
              </Button>
            </div>
        )}

        {/* 결과 없음 */}
        {!isLoading && !error && filteredProjects.length === 0 && (
            <div className="rounded-2xl bg-white p-12 shadow-sm text-center">
              <p className="text-muted-foreground">
                {searchTerm ? "검색 결과가 없습니다." : "프로젝트가 없습니다."}
              </p>
            </div>
        )}

        {/* 프로젝트 카드 리스트 */}
        {!isLoading && !error && filteredProjects.length > 0 && (
            <>
              <div className="grid gap-4 lg:grid-cols-3">
                {filteredProjects.map((project) => {
                  const badgeColors = statusStyles[project.status];
                  return (
                      <Card
                          key={project.id}
                          className="cursor-pointer rounded-2xl border border-white/70 bg-white/90 shadow-sm backdrop-blur transition-shadow hover:shadow-lg"
                          onClick={() =>
                              navigate(`/projects/${project.id}/nodes`, {
                                state: {
                                  projectName: project.name,      // 예: "모바일 앱 개발"
                                  developers: project.developers ?? [],
                                  // 필요하면 brand도 같이 보낼 수 있음
                                  // brand: project.brand,
                                },
                              })
                          }
                      >
                        <CardHeader className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground">{project.brand}</p>
                              <CardTitle className="text-xl">{project.name}</CardTitle>
                              <p className="text-xs text-muted-foreground mt-1">
                                개발자 · {getDeveloperDisplay(project)}
                              </p>
                            </div>
                            <div
                                className="flex items-center gap-2"
                                data-project-card-action="true"
                                onClick={(event) => event.stopPropagation()}
                                onPointerDown={(event) => event.stopPropagation()}
                            >
                              <Badge
                                  variant="outline"
                                  style={{
                                    backgroundColor: badgeColors.background,
                                    color: badgeColors.text,
                                    borderColor: badgeColors.border,
                                  }}
                              >
                                {project.status}
                              </Badge>
                              {isProjectEditMode && (
                                  <ProjectActionMenu
                                      project={project}
                                      onEdit={handleEditProject}
                                      onDelete={handleDeleteProject}
                                      onChangeStatus={openStatusModal}
                                  />
                              )}
                            </div>
                          </div>
                          <CardDescription>{project.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid gap-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">고객 담당자</span>
                              <span className="font-medium">
                            {getManagerDisplay(project)}
                          </span>
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
                  );
                })}
              </div>

              {/* 무한 스크롤 Sentinel (관찰 대상) */}
              {hasMore && (
                  <div ref={observerTarget} className="flex justify-center py-8">
                    {isLoading && (
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    )}
                  </div>
              )}
            </>
        )}
      </div>
  );
}

interface ProjectActionMenuProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onChangeStatus: (project: Project) => void;
}

function ProjectActionMenu({ project, onEdit, onDelete, onChangeStatus }: ProjectActionMenuProps) {
  const stopPointer = (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  };

  const handleTriggerClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  };

  const handleEdit = (event: Event) => {
    event.stopPropagation();
    event.preventDefault();
    onEdit(project);
  };

  const handleDelete = (event: Event) => {
    event.stopPropagation();
    event.preventDefault();
    onDelete(project);
  };

  const handleStatusChange = (event: Event) => {
    event.stopPropagation();
    event.preventDefault();
    onChangeStatus(project);
  };

  return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
              type="button"
              aria-label="프로젝트 액션"
              className="rounded-full p-1 text-muted-foreground transition hover:bg-muted"
              onClick={handleTriggerClick}
              onPointerDown={stopPointer}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
            align="end"
            alignOffset={-18}
            sideOffset={6}
            className="min-w-0 w-auto"
            style={{ minWidth: "auto", width: "auto" }}
        >
          <DropdownMenuItem onSelect={handleStatusChange}>상태 변경</DropdownMenuItem>
          <DropdownMenuItem onSelect={handleEdit}>수정</DropdownMenuItem>
          <DropdownMenuItem
              onSelect={handleDelete}
              variant="destructive"
              className="text-destructive"
          >
            삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
  );
}
