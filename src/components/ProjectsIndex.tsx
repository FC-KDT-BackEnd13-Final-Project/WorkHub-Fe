import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { AutoResizeTextarea } from "./ui/auto-resize-textarea";
import { format } from "date-fns";

const statusOptions = ["All Status", "In Progress", "Done", "On Hold", "Canceled"] as const;

const initialProjects = [
  {
    id: "prj-1",
    name: "Website Redesign",
    brand: "Aperture Studios",
    managers: ["Lena Morris"],
    developers: ["김준호"],
    startDate: "2024-09-01",
    endDate: "2024-12-15",
    progress: 75,
    status: "In Progress",
    teamSize: 5,
    tasks: 24,
    description: "Complete overhaul of company website with modern design and improved user experience.",
  },
  {
    id: "prj-2",
    name: "Mobile App Development",
    brand: "Nova FinTech",
    managers: ["Ethan Ward"],
    developers: ["박지민", "최수진"],
    startDate: "2024-08-12",
    endDate: "2024-12-30",
    progress: 45,
    status: "On Hold",
    teamSize: 8,
    tasks: 32,
    description: "Native iOS and Android app for customer engagement with secure payment integration.",
  },
  {
    id: "prj-3",
    name: "Marketing Campaign",
    brand: "GlobeMart",
    managers: ["Nora Lee", "David Kim"],
    developers: ["이도윤"],
    startDate: "2024-07-01",
    endDate: "2024-12-10",
    progress: 90,
    status: "Done",
    teamSize: 3,
    tasks: 18,
    description: "Q4 digital marketing campaign across all channels, focusing on social media and email.",
  },
  {
    id: "prj-4",
    name: "Database Migration",
    brand: "Unity Logistics",
    managers: ["Chris Reynolds"],
    developers: ["정서현", "김민준"],
    startDate: "2024-06-10",
    endDate: "2024-12-01",
    progress: 100,
    status: "Done",
    teamSize: 4,
    tasks: 20,
    description: "Migration from legacy on-premise database to a scalable cloud infrastructure.",
  },
];

type Status = "In Progress" | "Done" | "On Hold" | "Canceled";

export function ProjectsIndex() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>("All Status");
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
        statusFilter === "All Status" || project.status === statusFilter;
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        project.name.toLowerCase().includes(term) ||
        project.brand.toLowerCase().includes(term) ||
        project.manager.toLowerCase().includes(term); // Keep manager for existing project display
      return matchesStatus && matchesSearch;
    });
  }, [projects, searchTerm, statusFilter]);

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
      status: "In Progress" as Status,
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

  return (
    <div className="space-y-6">
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50">
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-full" style={{ maxWidth: "var(--login-card-max-width, 42rem)" }}>
              <Card className="login-theme border border-border shadow-lg">
                <CardHeader className="space-y-2 pb-6">
                  <h2 className="text-xl text-center">
                    Create <span style={{ color: "var(--point-color)" }}>Project</span>
                  </h2>
                  <p className="text-sm text-muted-foreground text-center">
                    Fill out the details below to add a new project to your workspace.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="projectName" className="text-gray-700">
                        Project Name
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
                        Project Description
                      </Label>
                      <AutoResizeTextarea
                        id="projectDescription"
                        value={newProject.description}
                        onChange={(e) => setNewProject((prev) => ({ ...prev, description: e.target.value }))}
                        className="w-full border rounded-md border-border bg-input-background px-3 py-2 focus:bg-white focus:border-primary transition-colors"
                        placeholder="Enter a brief description of the project"
                        minHeight="36px"
                        maxHeight="200px"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brand" className="text-gray-700">
                        Company
                      </Label>
                      <Input
                        id="brand"
                        value={newProject.brand}
                        onChange={(e) => setNewProject((prev) => ({ ...prev, brand: e.target.value }))}
                        className="h-9 rounded-md border border-border bg-input-background px-3 py-1 focus:bg-white focus:border-primary transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manager" className="text-gray-700">
                        Manager Name(s)
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
                          placeholder="Add manager name"
                        />
                        <Button type="button" onClick={addManager} className="h-9 px-4">
                          Add
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
                        Developer Name(s)
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
                          placeholder="Add developer name"
                        />
                        <Button type="button" onClick={addDeveloper} className="h-9 px-4">
                          Add
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
                        Start Date
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
                        End Date
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
                      Cancel
                    </Button>
                    <Button className="w-1/2" onClick={handleCreateProject}>
                      Create Project
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
          Review progress across every initiative and jump directly into the details.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm md:flex-row md:items-center">
        <Input
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="md:flex-1"
        />
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as (typeof statusOptions)[number])}
        >
          <SelectTrigger className="h-9 rounded-md border border-border bg-input-background px-3 py-1 md:w-52">
            <SelectValue placeholder="All Status" />
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
          + New Project
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
                  <p className="text-xs text-muted-foreground mt-1">Developer · {project.developer}</p>
                </div>
                <Badge variant={project.status === "Done" ? "default" : "secondary"}>{project.status}</Badge>
              </div>
              <CardDescription>{project.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Client Manager</span>
                  <span className="font-medium">{project.manager}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Team Size</span>
                  <span className="font-medium">{project.teamSize} members</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Workflow Steps</span>
                  <span className="font-medium">{project.tasks} tasks</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start</span>
                  <span className="font-medium">{format(new Date(project.startDate), "MMM dd, yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due</span>
                  <span className="font-medium">{format(new Date(project.endDate), "MMM dd, yyyy")}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Progress</span>
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
