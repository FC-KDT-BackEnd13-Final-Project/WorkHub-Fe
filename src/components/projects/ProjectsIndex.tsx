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
import { Check, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { projectApi } from "@/lib/api";
import { mapApiProjectToUiProject, type Project } from "@/utils/projectMapper";
import type { ProjectListParams, SortOrder, UpdateProjectPayload } from "@/types/project";
import { cn } from "../ui/utils";
import { ModalShell } from "../common/ModalShell";
import { PROFILE_STORAGE_KEY, type UserRole, normalizeUserRole } from "@/constants/profile";
import { useLocalStorageValue } from "@/hooks/useLocalStorageValue";
import { getErrorMessage, localizeErrorMessage } from "@/utils/errorMessages";
import { toast } from "sonner";

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

const statusLabels: Record<StatusFilter, string> = {
  ALL: "전체",
  CONTRACT: "계약",
  IN_PROGRESS: "진행 중",
  DELIVERY: "납품",
  MAINTENANCE: "유지 보수",
  COMPLETED: "완료",
  CANCELLED: "취소",
};

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

type DeveloperSelection = {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
};

const parseLabelToNameAndId = (label: string) => {
  const match = label.match(/^(.*)\s+\(([^)]+)\)$/);
  if (match) {
    return {
      name: match[1].trim(),
      id: match[2].trim(),
    };
  }
  const trimmed = label.trim();
  return {
    name: trimmed,
    id: "",
  };
};

const normalizeText = (value: string) => value.toLowerCase().replace(/\s+/g, "");
const stripLabelSuffix = (value: string) => value.replace(/\s*\([^)]*\)\s*$/, "").trim();
const formatLabelString = (value?: string) =>
  value
    ? value
        .split(",")
        .map((item) => stripLabelSuffix(item))
        .filter(Boolean)
        .join(", ")
    : "";

const createProjectFormState = () => ({
  name: "",
  description: "",
  brand: "",
  companyId: null as number | null,
  managers: [] as string[],
  developers: [] as DeveloperSelection[],
  startDate: "",
  endDate: "",
});

type ProjectFormState = ReturnType<typeof createProjectFormState>;

type StoredSettings = {
  profile?: {
    role?: string;
  };
};

type StoredUser = {
  role?: string;
};

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
  const [storedSettings] = useLocalStorageValue<StoredSettings | null>(PROFILE_STORAGE_KEY, {
    defaultValue: null,
    parser: (value) => JSON.parse(value),
    listen: true,
  });
  const [storedUser] = useLocalStorageValue<StoredUser | null>("user", {
    defaultValue: null,
    parser: (value) => JSON.parse(value),
    listen: true,
  });
  const userRole = useMemo<UserRole>(() => {
    const profileRole = normalizeUserRole(storedSettings?.profile?.role);
    if (profileRole) {
      return profileRole;
    }
    const storedUserRole = normalizeUserRole(storedUser?.role);
    return storedUserRole ?? "DEVELOPER";
  }, [storedSettings, storedUser]);
  const isClient = userRole === "CLIENT";
  const [statusModalProject, setStatusModalProject] = useState<Project | null>(null);
  const [statusModalValue, setStatusModalValue] = useState<ProjectStatus | "">("");
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  // 정렬: 기본값 = 최신순 (startDate 기준)
  const [sortOption, setSortOption] = useState<SortOption>("최신순");

  // 계약기간 필터(달력에서 직접 선택, 최대 1년)
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedCompanyContacts, setSelectedCompanyContacts] = useState<CompanyContact[]>([]);
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const [contactSearchTerm, setContactSearchTerm] = useState("");
  const [developerSearchTerm, setDeveloperSearchTerm] = useState("");
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isContactDropdownOpen, setIsContactDropdownOpen] = useState(false);
  const [isDeveloperDropdownOpen, setIsDeveloperDropdownOpen] = useState(false);
  const [projectProgressMap, setProjectProgressMap] = useState<
    Record<string, { total: number; completed: number; progress: number }>
  >({});
  const fetchedProjectProgress = useRef(new Set<string>());
  const navigate = useNavigate();
  const isEditingProjectForm = Boolean(editingProject);

  // API 연동을 위한 상태
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [isSavingProject, setIsSavingProject] = useState(false);

  // 무한 스크롤을 위한 ref
  const observerTarget = useRef<HTMLDivElement>(null);

  const developerDirectory = useMemo(() => {
    const map = new Map<string, DeveloperSelection>();

    companyUsers.forEach((user) => {
      map.set(user.id, {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      });
    });

    projects.forEach((project) => {
      project.developers.forEach((developer) => {
        if (!map.has(developer.id)) {
          map.set(developer.id, {
            id: developer.id,
            name: developer.name,
          });
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "ko-KR"));
  }, [projects]);

  const availableDeveloperOptions = useMemo(() => developerDirectory, [developerDirectory]);
  const visibleDeveloperOptions = useMemo(() => {
    const term = normalizeText(developerSearchTerm.trim());
    if (!term) return availableDeveloperOptions;
    return availableDeveloperOptions.filter((developer) =>
      normalizeText(`${developer.name} ${developer.email ?? ""} ${developer.id}`).includes(term),
    );
  }, [availableDeveloperOptions, developerSearchTerm]);
  const hasDeveloperSearch = developerSearchTerm.trim().length > 0;
  const selectedContactsLabel = useMemo(
    () => selectedCompanyContacts.map((contact) => contact.name).join(", "),
    [selectedCompanyContacts],
  );
  const selectedDevelopersLabel = useMemo(
    () => newProject.developers.map((developer) => developer.name).join(", "),
    [newProject.developers],
  );

  const toggleDeveloperSelection = (developerId: string) => {
    const selected = developerDirectory.find((developer) => developer.id === developerId);
    if (!selected) return;

    setNewProject((prev) => {
      const exists = prev.developers.some((developer) => developer.id === developerId);
      const developers = exists
        ? prev.developers.filter((developer) => developer.id !== developerId)
        : [...prev.developers, selected];
      return { ...prev, developers };
    });
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
      const uiProjects = response.projects?.map(mapApiProjectToUiProject) ?? [];

      if (loadMore) {
        setProjects((prev) => [...prev, ...uiProjects]);
      } else {
        setProjects(uiProjects);
      }

      setNextCursor(response.nextCursor);
      setHasMore(response.hasNext);
    } catch (err) {
      console.error("프로젝트 목록 로드 실패:", err);

      let errorMessage = "프로젝트를 불러오는데 실패했습니다.";

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "object" && err !== null && "response" in err) {
        const axiosError = err as any;
        errorMessage = axiosError.response?.data?.message || errorMessage;
      }

      setError(localizeErrorMessage(errorMessage) ?? errorMessage);
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

  const companyIdMap = useMemo(() => {
    const map = new Map<string, number>();
    projects.forEach((project) => {
      if (project.brand && typeof project.companyId === "number") {
        map.set(project.brand, project.companyId);
      }
    });
    return map;
  }, [projects]);

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
    const term = normalizeText(companySearchTerm.trim());
    if (!term) return [];
    return companyDirectory.filter((name) => normalizeText(name).includes(term));
  }, [companyDirectory, companySearchTerm]);

  const currentCompanyMembers: CompanyContact[] = selectedCompany
    ? companyContactMap.get(selectedCompany) ?? []
    : [];

  const filteredCompanyMembers = currentCompanyMembers;
  const visibleCompanyContacts = useMemo(() => {
    const term = normalizeText(contactSearchTerm.trim());
    if (!term) return filteredCompanyMembers;
    return filteredCompanyMembers.filter((member) =>
      normalizeText(`${member.name} ${member.email ?? ""} ${member.id}`).includes(term),
    );
  }, [filteredCompanyMembers, contactSearchTerm]);
  const hasContactSearch = contactSearchTerm.trim().length > 0;
  const formatContactLabel = (contact: CompanyContact) => {
    if (!contact.id || contact.id === contact.name) return contact.name;
    return `${contact.name} (${contact.id})`;
  };

  const formatDeveloperLabel = (developer: DeveloperSelection) => {
    if (!developer.id || developer.id === developer.name) return developer.name;
    return `${developer.name} (${developer.id})`;
  };

  const handleSelectCompany = (companyName: string) => {
    setSelectedCompany(companyName);
    setCompanySearchTerm(companyName);

    setSelectedCompanyContacts([]);
    setContactSearchTerm("");
    setIsContactDropdownOpen(false);
    setIsCompanyDropdownOpen(false);
    setIsDeveloperDropdownOpen(false);
    setDeveloperSearchTerm("");

    setNewProject((prev) => ({
      ...prev,
      brand: companyName,
      companyId: companyIdMap.get(companyName) ?? null,
      managers: [],
    }));
  };

  const handleToggleCompanyContact = (contact: CompanyContact) => {
    setSelectedCompanyContacts((prev) => {
      const exists = prev.some((item) =>
        item.id && contact.id ? item.id === contact.id : item.name === contact.name,
      );
      const next = exists
        ? prev.filter((item) =>
            item.id && contact.id ? item.id !== contact.id : item.name !== contact.name,
          )
        : [...prev, contact];

      setNewProject((prevProject) => ({
        ...prevProject,
        managers: next.map((item) => formatContactLabel(item)),
      }));

      return next;
    });
  };

  const resetCreateForm = useCallback(() => {
    setNewProject(createProjectFormState());
    setSelectedCompany(null);
    setCompanySearchTerm("");
    setSelectedCompanyContacts([]);
    setIsCompanyDropdownOpen(false);
    setIsContactDropdownOpen(false);
    setIsDeveloperDropdownOpen(false);
    setContactSearchTerm("");
    setDeveloperSearchTerm("");
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

  const handleSaveProject = async () => {
    if (isSavingProject) return;
    if (!newProject.name || !newProject.brand || newProject.managers.length === 0) return;
    if (!newProject.startDate || !newProject.endDate) return;
    if (new Date(newProject.endDate) <= new Date(newProject.startDate)) return;

    const parseNumericId = (value?: string) => {
      if (!value) return null;
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : null;
    };

    const managerIds = newProject.managers
      .map((label) => parseLabelToNameAndId(label).id)
      .map((id) => parseNumericId(id))
      .filter((id): id is number => id !== null);
    const managerIdPayload = managerIds.length > 0 ? managerIds : undefined;

    const developerIds = newProject.developers
      .map((developer) => parseNumericId(developer.id))
      .filter((id): id is number => id !== null);
    const developerIdPayload = developerIds.length > 0 ? developerIds : undefined;

    const managerText = newProject.managers.join(", ");
    const developerText = newProject.developers.map((dev) => formatDeveloperLabel(dev)).join(", ");
    const teamSize = newProject.managers.length + newProject.developers.length;

    if (editingProject) {
      const companyId = newProject.companyId ?? editingProject.companyId ?? null;
      if (!companyId) {
        toast.error("고객사 정보를 확인할 수 없습니다. 다시 선택해주세요.");
        return;
      }

      setIsSavingProject(true);
      try {
        const payload: UpdateProjectPayload = {
          projectName: newProject.name,
          projectDescription: newProject.description,
          company: companyId,
          starDate: newProject.startDate,
          endDate: newProject.endDate,
        };
        if (managerIdPayload) {
          payload.managerIds = managerIdPayload;
        }
        if (developerIdPayload) {
          payload.developerIds = developerIdPayload;
        }

        const updatedProject = await projectApi.update(editingProject.id, payload);
        const mappedProject = mapApiProjectToUiProject(updatedProject);

        setProjects((prev) =>
          prev.map((project) =>
            project.id === mappedProject.id
              ? {
                  ...project,
                  ...mappedProject,
                  progress: project.progress,
                }
              : project,
          ),
        );

        toast.success("프로젝트가 수정되었습니다.");
        resetCreateForm();
        setEditingProject(null);
        setIsProjectModalOpen(false);
      } catch (err) {
        const message = getErrorMessage(err, "프로젝트 수정에 실패했습니다.");
        toast.error(message);
        return;
      } finally {
        setIsSavingProject(false);
      }
      return;
    }

    const project: Project = {
      id: crypto.randomUUID(),
      name: newProject.name,
      description: newProject.description,
      brand: newProject.brand,
      companyId: newProject.companyId ?? undefined,
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
            .map((entry) => entry.trim())
            .filter(Boolean)
            .map((entry) => {
              const parsed = parseLabelToNameAndId(entry);
              return {
                id: parsed.id || parsed.name,
                name: parsed.name,
              };
            })
        : project.developers ?? [];

    const companyMembersForBrand = project.brand ? companyContactMap.get(project.brand) ?? [] : [];
    const selectedContactsForBrand =
        managerList.length > 0
            ? managerList.map((label) => {
                const parsed = parseLabelToNameAndId(label);
                return (
                    companyMembersForBrand.find(
                        (member) =>
                            (!!parsed.id && member.id === parsed.id) ||
                            member.name === parsed.name,
                    ) ?? {
                      id: parsed.id || "",
                      name: parsed.name,
                      email: "",
                      company: project.brand ?? "",
                      avatarUrl: undefined,
                    }
                );
              })
            : [];

    setNewProject({
      name: project.name,
      description: project.description,
      brand: project.brand,
      companyId: project.companyId ?? null,
      managers:
          selectedContactsForBrand.length > 0
              ? selectedContactsForBrand.map((contact) => formatContactLabel(contact))
              : managerList,
      developers: developerList,
      startDate: project.startDate,
      endDate: project.endDate,
    });
    setSelectedCompany(project.brand ? project.brand : null);
    setCompanySearchTerm(project.brand ?? "");
    setSelectedCompanyContacts(selectedContactsForBrand);
    setIsCompanyDropdownOpen(false);
    setIsContactDropdownOpen(false);
    setIsDeveloperDropdownOpen(false);
    setContactSearchTerm("");
    setDeveloperSearchTerm("");
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
    setIsChangingStatus(false);
  };

  const handleApplyStatusChange = async () => {
    if (!statusModalProject || !statusModalValue || isChangingStatus) return;

    setIsChangingStatus(true);
    try {
      await projectApi.changeStatus(statusModalProject.id, statusModalValue);
      setProjects((prev) =>
        prev.map((project) =>
          project.id === statusModalProject.id ? { ...project, status: statusModalValue } : project,
        ),
      );
      toast.success("프로젝트 상태가 변경되었습니다.");
      closeStatusModal();
    } catch (err) {
      const message = getErrorMessage(err, "프로젝트 상태 변경에 실패했습니다.");
      toast.error(message);
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (deletingProjectId) {
      toast.info("다른 프로젝트 삭제를 처리 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    const message = `"${project.name}" 프로젝트를 삭제할까요? 이 작업은 되돌릴 수 없습니다.`;
    if (!window.confirm(message)) {
      return;
    }

    setDeletingProjectId(project.id);

    try {
      await projectApi.delete(project.id);

      setProjects((prev) => prev.filter((item) => item.id !== project.id));

      if (editingProject && editingProject.id === project.id) {
        resetCreateForm();
        setEditingProject(null);
        setIsProjectModalOpen(false);
      }

      toast.success("프로젝트가 삭제되었습니다.");
    } catch (err) {
      console.error(`프로젝트(${project.id}) 삭제 실패:`, err);
      const message = getErrorMessage(err, "프로젝트 삭제에 실패했습니다.");
      toast.error(message);
    } finally {
      setDeletingProjectId((current) => (current === project.id ? null : current));
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
    setIsContactDropdownOpen(false);
  }, [selectedCompany]);

  useEffect(() => {
    if (availableDeveloperOptions.length === 0) {
      setIsDeveloperDropdownOpen(false);
    }
  }, [availableDeveloperOptions.length]);

  useEffect(() => {
    if (!isProjectModalOpen) {
      setIsCompanyDropdownOpen(false);
      setIsContactDropdownOpen(false);
      setIsDeveloperDropdownOpen(false);
    }
  }, [isProjectModalOpen]);

  useEffect(() => {
    if (!statusModalProject) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeStatusModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [statusModalProject]);

  useEffect(() => {
    projects.forEach((project) => {
      if (!project.id || fetchedProjectProgress.current.has(project.id)) return;

      const totalFromApi = typeof project.tasks === "number" ? project.tasks : 0;
      const completedFromApi =
        typeof project.approveWorkflow === "number" ? project.approveWorkflow : 0;

      // 목록 응답에 워크플로 수치가 있으면 추가 호출 없이 활용
      if (totalFromApi > 0 || completedFromApi > 0) {
        const progress =
          totalFromApi === 0 ? 0 : Math.round((completedFromApi / totalFromApi) * 100);
        setProjectProgressMap((prev) => ({
          ...prev,
          [project.id]: { total: totalFromApi, completed: completedFromApi, progress },
        }));
        fetchedProjectProgress.current.add(project.id);
        return;
      }

      fetchedProjectProgress.current.add(project.id);

      void (async () => {
        try {
          const response = await projectApi.getNodes(project.id);
          const nodes = response.projectNodes ?? [];
          const total = nodes.length;
          const completed = nodes.filter((node) =>
            ["DONE", "COMPLETED"].includes(node.nodeStatus),
          ).length;
          const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

          setProjectProgressMap((prev) => ({
            ...prev,
            [project.id]: { total, completed, progress },
          }));

          setProjects((prev) =>
            prev.map((item) =>
              item.id === project.id
                ? {
                    ...item,
                    tasks: total,
                    progress,
                  }
                : item,
            ),
          );
        } catch (error) {
          console.error(`프로젝트(${project.id}) 진행률 계산 실패:`, error);
          setProjectProgressMap((prev) => ({
            ...prev,
            [project.id]: {
              total: project.tasks ?? 0,
              completed: 0,
              progress: project.progress ?? 0,
            },
          }));
        }
      })();
    });
  }, [projects]);

  const getManagerDisplay = (project: Project) => {
    const fromString = formatLabelString(project.manager);
    if (fromString) return fromString;
    if (project.managers && project.managers.length > 0) {
      return project.managers.map((manager) => stripLabelSuffix(manager)).filter(Boolean).join(", ");
    }
    return "";
  };

  const getDeveloperDisplay = (project: Project) => {
    const fromString = formatLabelString(project.developer);
    if (fromString) return fromString;
    if (project.developers && project.developers.length > 0) {
      return project.developers.map((dev) => dev.name).filter(Boolean).join(", ");
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
          <ModalShell open onClose={closeStatusModal} maxWidth="28rem">
            <Card variant="modal" className="login-theme border border-border shadow-lg">
              <CardHeader className="space-y-2 pb-4">
                <h2 className="text-lg font-semibold text-center">프로젝트 상태 변경</h2>
                <p className="text-sm text-muted-foreground text-center">"{statusModalProject.name}"의 상태를 선택하세요.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={statusModalValue || undefined} onValueChange={(value) => setStatusModalValue(value as ProjectStatus)}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectStatusOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {statusLabels[option]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" className="w-1/2" onClick={closeStatusModal}>
                    취소
                  </Button>
                  <Button
                      type="button"
                      className="w-1/2"
                      disabled={!statusModalValue || isChangingStatus}
                      onClick={handleApplyStatusChange}
                  >
                    {isChangingStatus ? "변경 중..." : "상태 변경"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </ModalShell>
        )}

        {isProjectModalOpen && (
          <ModalShell open onClose={closeProjectModal} maxWidth="var(--login-card-max-width, 42rem)">
            <Card variant="modal" className="login-theme border border-border shadow-lg">
              <CardHeader className="space-y-2 pb-6">
                <h2 className="text-xl text-center">{isEditingProjectForm ? "프로젝트 수정" : "새 프로젝트 만들기"}</h2>
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
                          {/* 1단계: 고객사 선택 */}
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-800">고객사</Label>
                            <Popover
                              open={isCompanyDropdownOpen}
                              onOpenChange={(open) => {
                                setIsCompanyDropdownOpen(open);
                                if (open) {
                                  setCompanySearchTerm(selectedCompany ?? "");
                                }
                              }}
                            >
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-border bg-input-background px-3 py-2 text-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                                >
                                  <span className="text-left text-sm text-foreground">
                                    {selectedCompany ?? "고객사를 선택하세요"}
                                  </span>
                                  <svg
                                    className={cn("h-4 w-4 transition-transform", isCompanyDropdownOpen && "rotate-180")}
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
                                className="w-[var(--radix-popover-trigger-width)] max-w-none p-0"
                                style={{ width: "var(--radix-popover-trigger-width)" }}
                              >
                                <div className="border-b border-border px-3 py-2">
                                  <Input
                                    autoFocus
                                    value={companySearchTerm}
                                    onChange={(event) => {
                                      const value = event.target.value;
                                      setCompanySearchTerm(value);
                                    }}
                                    placeholder="고객사를 검색하세요"
                                    className="h-8 text-sm"
                                  />
                                </div>
                              <div className="max-h-[13.5rem] overflow-y-auto">
                                {companySearchTerm.trim()
                                  ? filteredCompanyDirectory.length > 0
                                    ? filteredCompanyDirectory.map((company) => {
                                        const isActive = selectedCompany === company;
                                        return (
                                          <button
                                            type="button"
                                            key={company}
                                            onMouseDown={(event) => {
                                              event.preventDefault();
                                              handleSelectCompany(company);
                                              setIsCompanyDropdownOpen(false);
                                            }}
                                            className={cn(
                                              "flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors",
                                              isActive ? "bg-primary/5 text-primary" : "hover:bg-accent/60",
                                            )}
                                          >
                                            <span>{company}</span>
                                            {isActive && <Check className="h-4 w-4 text-primary" aria-hidden="true" />}
                                          </button>
                                        );
                                      })
                                    : (
                                      <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                                        검색 결과가 없습니다.
                                      </p>
                                    )
                                  : (
                                    <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                                      검색어를 입력하면 고객사가 표시됩니다.
                                    </p>
                                  )}
                              </div>
                              </PopoverContent>
                            </Popover>
                          </div>

                          {/* 2단계: 담당자 선택 */}
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-800">담당자</Label>
                          <Popover
                            open={selectedCompany ? isContactDropdownOpen : false}
                            onOpenChange={(open) => {
                              if (!selectedCompany) return;
                              setIsContactDropdownOpen(open);
                              if (open) {
                                setContactSearchTerm("");
                              }
                            }}
                          >
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                disabled={!selectedCompany}
                                className={cn(
                                  "flex h-9 w-full items-center justify-between rounded-md border border-border bg-input-background px-3 text-sm transition-colors",
                                  selectedCompany
                                    ? "hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                                    : "cursor-not-allowed bg-muted text-muted-foreground",
                                )}
                              >
                                <span
                                  className={cn(
                                    "flex-1 truncate text-left",
                                    selectedContactsLabel ? "text-foreground" : "text-muted-foreground",
                                  )}
                                >
                                  {selectedContactsLabel || "담당자를 선택하세요"}
                                </span>
                                <svg
                                  className={cn(
                                    "ml-2 h-4 w-4 text-muted-foreground transition-transform",
                                    isContactDropdownOpen ? "rotate-180" : "",
                                  )}
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
                            {selectedCompany && (
                              <PopoverContent
                                side="bottom"
                                align="start"
                                avoidCollisions={false}
                                className="w-[var(--radix-popover-trigger-width)] max-w-none p-0"
                                style={{ width: "var(--radix-popover-trigger-width)" }}
                              >
                                <div className="border-b border-border px-3 py-2">
                                  <Input
                                    value={contactSearchTerm}
                                    onChange={(event) => setContactSearchTerm(event.target.value)}
                                    placeholder="담당자를 검색하세요"
                                    className="h-8 text-sm"
                                    autoFocus
                                  />
                                </div>
                                <div className="max-h-[13.5rem] overflow-y-auto">
                                  {hasContactSearch ? (
                                    visibleCompanyContacts.length > 0 ? (
                                      visibleCompanyContacts.map((member) => {
                                        const isSelected = selectedCompanyContacts.some(
                                          (contact) =>
                                            (!!contact.id && contact.id === member.id) ||
                                            contact.name === member.name,
                                        );
                                        return (
                                          <button
                                            type="button"
                                            key={member.id}
                                            onMouseDown={(event) => {
                                              event.preventDefault();
                                              handleToggleCompanyContact(member);
                                            }}
                                            className={cn(
                                              "flex w-full items-center justify-between px-3 py-1.5 text-left text-sm transition-colors",
                                              isSelected ? "bg-primary/5 text-primary" : "hover:bg-accent/60",
                                            )}
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
                                                  {member.email ?? "이메일 정보 없음"}
                                                </span>
                                              </div>
                                            </div>
                                            {isSelected && <Check className="h-4 w-4 text-primary" aria-hidden="true" />}
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
                                      검색어를 입력하면 결과가 표시됩니다.
                                    </p>
                                  )}
                                </div>
                              </PopoverContent>
                            )}
                          </Popover>
                        </div>
                        </div>

                        {/* 담당 개발자 */}
                        <div className="space-y-2">
                          <Label className="text-gray-700">담당 개발자</Label>
                          <Popover
                            open={isDeveloperDropdownOpen}
                            onOpenChange={(open) => {
                              if (availableDeveloperOptions.length === 0) return;
                              setIsDeveloperDropdownOpen(open);
                              if (open) {
                                setDeveloperSearchTerm("");
                              }
                            }}
                          >
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                disabled={availableDeveloperOptions.length === 0}
                                className={cn(
                                  "flex h-9 w-full items-center justify-between rounded-md border border-border bg-input-background px-3 text-sm transition-colors",
                                  availableDeveloperOptions.length > 0
                                    ? "hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                                    : "cursor-not-allowed bg-muted text-muted-foreground",
                                )}
                              >
                                <span
                                  className={cn(
                                    "flex-1 truncate text-left",
                                    selectedDevelopersLabel ? "text-foreground" : "text-muted-foreground",
                                  )}
                                >
                                  {selectedDevelopersLabel ||
                                    (availableDeveloperOptions.length === 0
                                      ? "등록된 개발자가 없습니다"
                                      : "개발 담당자를 선택하세요")}
                                </span>
                                <svg
                                  className={cn(
                                    "ml-2 h-4 w-4 text-muted-foreground transition-transform",
                                    isDeveloperDropdownOpen ? "rotate-180" : "",
                                  )}
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
                            {availableDeveloperOptions.length > 0 && (
                              <PopoverContent
                                side="bottom"
                                align="start"
                                avoidCollisions={false}
                                className="w-[var(--radix-popover-trigger-width)] max-w-none p-0"
                                style={{ width: "var(--radix-popover-trigger-width)" }}
                              >
                                <div className="border-b border-border px-3 py-2">
                                  <Input
                                    autoFocus
                                    value={developerSearchTerm}
                                    onChange={(event) => setDeveloperSearchTerm(event.target.value)}
                                    placeholder="개발자 검색"
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div className="max-h-[13.5rem] overflow-y-auto">
                                  {hasDeveloperSearch ? (
                                    visibleDeveloperOptions.length > 0 ? (
                                      visibleDeveloperOptions.map((developer) => {
                                        const isSelected = newProject.developers.some(
                                          (item) => item.id === developer.id,
                                        );
                                        return (
                                          <button
                                            type="button"
                                            key={developer.id}
                                            onMouseDown={(event) => {
                                              event.preventDefault();
                                              toggleDeveloperSelection(developer.id);
                                            }}
                                            className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent/60"
                                          >
                                            <div className="flex items-center gap-3">
                                              <img
                                                src={developer.avatarUrl || "/default-profile.png"}
                                                alt={`${developer.name} 프로필`}
                                                className="h-6 w-6 rounded-full object-cover"
                                              />
                                              <div className="flex flex-col leading-tight">
                                                <span className="text-sm font-medium">
                                                  {developer.name} ({developer.id})
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                  {developer.email ?? "이메일 정보 없음"}
                                                </span>
                                              </div>
                                            </div>
                                            {isSelected && <Check className="h-4 w-4 text-primary" aria-hidden="true" />}
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
                                      검색어를 입력하면 결과가 표시됩니다.
                                    </p>
                                  )}
                                </div>
                              </PopoverContent>
                            )}
                          </Popover>
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
                        <Button className="w-1/2" onClick={handleSaveProject} disabled={isSavingProject}>
                          {isSavingProject
                            ? "저장 중..."
                            : isEditingProjectForm
                              ? "프로젝트 수정"
                              : "프로젝트 생성"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </ModalShell>
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
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
          >
            <SelectTrigger className="h-9 rounded-md bg-input-background px-3 py-1 md:w-40">
              <SelectValue placeholder="상태 선택" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem value={option} key={option}>
                  {statusLabels[option]}
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
          {!isClient && (
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
          )}
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
                  const brandDisplay = project.brand || "-";
                  const managerDisplay = getManagerDisplay(project) || "담당자 없음";
                  const developerDisplay = getDeveloperDisplay(project) || "개발자 없음";
                  const progressInfo = projectProgressMap[project.id];
                  const progressValue =
                    progressInfo?.progress ?? (typeof project.progress === "number" ? project.progress : 0);
                  const totalSteps = progressInfo?.total ?? project.tasks ?? 0;
                  const completedSteps = progressInfo?.completed ?? 0;
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
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">고객사 · {brandDisplay}</p>
                              <CardTitle className="text-xl">{project.name}</CardTitle>
                              <p className="text-xs text-muted-foreground">고객 담당자 · {managerDisplay}</p>
                              <p className="text-xs text-muted-foreground">담당 개발자 · {developerDisplay}</p>
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
                                {statusLabels[project.status]}
                              </Badge>
                              {isProjectEditMode && (
                                  <ProjectActionMenu
                                      project={project}
                                      onEdit={handleEditProject}
                                      onDelete={handleDeleteProject}
                                      onChangeStatus={openStatusModal}
                                      isDeleting={deletingProjectId === project.id}
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
                              <span className="font-medium">
                                {progressInfo ? `${completedSteps}/${totalSteps}건` : `${totalSteps}건`}
                              </span>
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
                              <span>{progressValue}%</span>
                            </div>
                            <Progress value={progressValue} className="mt-2" />
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
  onDelete: (project: Project) => void | Promise<void>;
  onChangeStatus: (project: Project) => void;
  isDeleting?: boolean;
}

function ProjectActionMenu({
  project,
  onEdit,
  onDelete,
  onChangeStatus,
  isDeleting,
}: ProjectActionMenuProps) {
  const stopPointer = (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  };

  const handleTriggerClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  };

  const handleEdit = (event: Event) => {
    event.stopPropagation();
    onEdit(project);
  };

  const handleDelete = (event: Event) => {
    event.stopPropagation();
    void onDelete(project);
  };

  const handleStatusChange = (event: Event) => {
    event.stopPropagation();
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
              disabled={isDeleting}
          >
            {isDeleting ? "삭제 중..." : "삭제"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
  );
}
