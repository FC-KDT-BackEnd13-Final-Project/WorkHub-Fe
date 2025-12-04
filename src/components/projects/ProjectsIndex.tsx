import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Textarea } from "../ui/textarea";
import { AutoResizeTextarea } from "../ui/auto-resize-textarea";
import { format } from "date-fns";
import { companyUsers } from "../admin/userData";

// 프로젝트 리스트, 필터, 생성 모달을 통합 관리하는 페이지
const statusOptions = ["전체 상태", "진행 중", "완료", "보류", "취소"] as const;

const initialProjects = [
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
  },
];

type Status = "진행 중" | "완료" | "보류" | "취소";

export function ProjectsIndex() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>("전체 상태");
  const [projects, setProjects] = useState(initialProjects);
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
  const [currentManagerInput, setCurrentManagerInput] = useState("");
  const [currentDeveloperInput, setCurrentDeveloperInput] = useState("");
  const [isCompanyLookupOpen, setIsCompanyLookupOpen] = useState(false);
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const navigate = useNavigate();

  const addManager = () => {
    if (currentManagerInput.trim() && !newProject.managers.includes(currentManagerInput.trim())) {
      setNewProject((prev) => ({ ...prev, managers: [...prev.managers, currentManagerInput.trim()] }));
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
    if (currentDeveloperInput.trim() && !newProject.developers.includes(currentDeveloperInput.trim())) {
      setNewProject((prev) => ({ ...prev, developers: [...prev.developers, currentDeveloperInput.trim()] }));
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
    return projects.filter((project) => {
      const matchesStatus =
        statusFilter === "전체 상태" || project.status === statusFilter;
      const term = searchTerm.toLowerCase();
      const managerText = project.manager?.toLowerCase() ||
        (Array.isArray(project.managers)
          ? project.managers.join(", ").toLowerCase()
          : "");
      const matchesSearch =
        project.name.toLowerCase().includes(term) ||
        project.brand.toLowerCase().includes(term) ||
        managerText.includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [projects, searchTerm, statusFilter]);

  const companyDirectory = useMemo(() => {
    const names = new Set<string>();
    projects.forEach((project) => names.add(project.brand));
    companyUsers.forEach((user) => names.add(user.company));
    return Array.from(names).sort();
  }, [projects]);

  const filteredCompanyDirectory = useMemo(() => {
    const term = companySearchTerm.toLowerCase().trim();
    if (!term) return companyDirectory;
    return companyDirectory.filter((company) => company.toLowerCase().includes(term));
  }, [companyDirectory, companySearchTerm]);

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

  const handleCreateProject = () => {
    if (!newProject.name || !newProject.brand || newProject.managers.length === 0) return; // Managers required
    if (!newProject.startDate || !newProject.endDate) return;
    if (new Date(newProject.endDate) <= new Date(newProject.startDate)) return;
    const project = {
      id: crypto.randomUUID(),
      name: newProject.name,
      description: newProject.description,
      brand: newProject.brand,
      manager: newProject.managers.join(", "), // For display in existing cards
      developer: newProject.developers.join(", "), // For display in existing cards
      startDate: newProject.startDate,
      endDate: newProject.endDate,
      progress: 0,
      status: "진행 중" as Status,
      teamSize: newProject.managers.length + newProject.developers.length, // Simple calculation
      tasks: 0,
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
    setIsProjectModalOpen(false); // Close modal directly
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProjectModalOpen(false); // Close modal directly
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

  return (
    <div className="space-y-6">
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50">
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-full" style={{ maxWidth: "var(--login-card-max-width, 42rem)" }}>
              <Card className="login-theme border border-border shadow-lg">
                <CardHeader className="space-y-2 pb-6">
                  <h2 className="text-xl text-center">새 프로젝트 만들기</h2>
                  <p className="text-sm text-muted-foreground text-center">
                    워크스페이스에 프로젝트를 추가하려면 아래 정보를 입력하세요.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="projectName" className="text-gray-700">
                        프로젝트 이름
                      </Label>
                      <Input
                        id="projectName"
                        value={newProject.name}
                        onChange={(e) => setNewProject((prev) => ({ ...prev, name: e.target.value }))}
                        className="h-9 rounded-md border border-border bg-input-background px-3 py-1 focus:bg-white focus:border-primary transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="projectDescription" className="text-gray-700">
                        프로젝트 설명
                      </Label>
                      <AutoResizeTextarea
                        id="projectDescription"
                        value={newProject.description}
                        onChange={(e) => setNewProject((prev) => ({ ...prev, description: e.target.value }))}
                        className="w-full border rounded-md border-border bg-input-background px-3 py-2 focus:bg-white focus:border-primary transition-colors"
                        placeholder="프로젝트에 대한 간단한 설명을 입력하세요"
                        minHeight="36px"
                        maxHeight="200px"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brand" className="text-gray-700">
                        고객사
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="brand"
                          value={newProject.brand}
                          onChange={(e) => setNewProject((prev) => ({ ...prev, brand: e.target.value }))}
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
                              <p className="text-xs text-muted-foreground">검색 결과가 없습니다.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
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
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
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
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
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
                          newProject.endDate ? getPreviousDayISO(newProject.endDate) : undefined
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
                        min={newProject.startDate ? getNextDayISO(newProject.startDate) : undefined}
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
                    <Button variant="secondary" className="w-1/2" onClick={() => setIsProjectModalOpen(false)}>
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
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
        <p className="mt-2 text-muted-foreground">
          각 프로젝트의 현황을 확인하고 세부 정보로 바로 이동하세요.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm md:flex-row md:items-center">
        <Input
          placeholder="프로젝트를 검색하세요"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="md:flex-1"
        />
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as (typeof statusOptions)[number])}
        >
          <SelectTrigger className="h-9 rounded-md bg-input-background px-3 py-1 md:w-52">
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
        <Button className="h-9 px-4 text-sm md:w-auto" onClick={() => setIsProjectModalOpen(true)}>
          + 새 프로젝트
        </Button>
      </div>

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
                  <p className="text-xs text-muted-foreground mt-1">개발자 · {project.developer}</p>
                </div>
                <Badge variant={project.status === "완료" ? "default" : "secondary"}>{project.status}</Badge>
              </div>
              <CardDescription>{project.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">고객 담당자</span>
                  <span className="font-medium">{project.manager}</span>
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
                  <span className="font-medium">{format(new Date(project.startDate), "MMM dd, yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">마감일</span>
                  <span className="font-medium">{format(new Date(project.endDate), "MMM dd, yyyy")}</span>
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
