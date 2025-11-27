import { useMemo, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { format } from "date-fns";

const statusOptions = ["All Status", "In Progress", "Done", "On Hold", "Canceled"] as const;

const initialProjects = [
  {
    id: "prj-1",
    name: "Website Redesign",
    brand: "Aperture Studios",
    manager: "Lena Morris",
    developer: "김준호",
    startDate: "2024-09-01",
    endDate: "2024-12-15",
    progress: 75,
    status: "In Progress",
    teamSize: 5,
    tasks: 24,
    description: "Complete overhaul of company website with modern design",
  },
  {
    id: "prj-2",
    name: "Mobile App Development",
    brand: "Nova FinTech",
    manager: "Ethan Ward",
    developer: "박지민",
    startDate: "2024-08-12",
    endDate: "2024-12-30",
    progress: 45,
    status: "On Hold",
    teamSize: 8,
    tasks: 32,
    description: "Native iOS and Android app for customer engagement",
  },
  {
    id: "prj-3",
    name: "Marketing Campaign",
    brand: "GlobeMart",
    manager: "Nora Lee",
    developer: "이도윤",
    startDate: "2024-07-01",
    endDate: "2024-12-10",
    progress: 90,
    status: "Done",
    teamSize: 3,
    tasks: 18,
    description: "Q4 digital marketing campaign across all channels",
  },
  {
    id: "prj-4",
    name: "Database Migration",
    brand: "Unity Logistics",
    manager: "Chris Reynolds",
    developer: "정서현",
    startDate: "2024-06-10",
    endDate: "2024-12-01",
    progress: 100,
    status: "Done",
    teamSize: 4,
    tasks: 20,
    description: "Migration from legacy database to cloud infrastructure",
  },
];

type Status = "In Progress" | "Done" | "On Hold" | "Canceled";

export function ProjectsIndex() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>("All Status");
  const [projects, setProjects] = useState(initialProjects);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    brand: "",
    manager: "",
    developer: "",
    startDate: "",
    endDate: "",
  });
  const navigate = useNavigate();

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesStatus =
        statusFilter === "All Status" || project.status === statusFilter;
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        project.name.toLowerCase().includes(term) ||
        project.brand.toLowerCase().includes(term) ||
        project.manager.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [projects, searchTerm, statusFilter]);

  const handleCreateProject = () => {
    if (!newProject.name || !newProject.brand || !newProject.manager) return;
    const project = {
      id: crypto.randomUUID(),
      name: newProject.name,
      brand: newProject.brand,
      manager: newProject.manager,
      developer: newProject.developer,
      startDate: newProject.startDate,
      endDate: newProject.endDate,
      progress: 0,
      status: "In Progress" as Status,
      teamSize: 0,
      tasks: 0,
      description: "New initiative",
    };
    setProjects((prev) => [...prev, project]);
    setNewProject({ name: "", brand: "", manager: "", developer: "", startDate: "", endDate: "" });
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
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
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as (typeof statusOptions)[number])}>
          <SelectTrigger className="md:w-52">
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-9 px-4 text-sm md:w-auto" onClick={() => setIsDialogOpen(true)}>
              + New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
              <DialogDescription>
                Fill out the details below to add a new project to your workspace.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={newProject.name}
                  onChange={(e) => setNewProject((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Brand / Client Name</Label>
                <Input
                  id="brand"
                  value={newProject.brand}
                  onChange={(e) => setNewProject((prev) => ({ ...prev, brand: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manager">Manager Name</Label>
                <Input
                  id="manager"
                  value={newProject.manager}
                  onChange={(e) => setNewProject((prev) => ({ ...prev, manager: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="developer">Developer Name</Label>
                <Input
                  id="developer"
                  value={newProject.developer}
                  onChange={(e) => setNewProject((prev) => ({ ...prev, developer: e.target.value }))}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newProject.startDate}
                    onChange={(e) => setNewProject((prev) => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newProject.endDate}
                    onChange={(e) => setNewProject((prev) => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject}>Create Project</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
