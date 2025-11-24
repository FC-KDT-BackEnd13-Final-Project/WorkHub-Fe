import { useEffect, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import type { ProjectStatus } from "../types/project";

interface ProjectCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface NewProjectState {
  name: string;
  client: string;
  status: ProjectStatus;
  dueDate: string;
  description: string;
}

const DEFAULT_PROJECT_STATE: NewProjectState = {
  name: "",
  client: "",
  status: "진행중",
  dueDate: "",
  description: "",
};

export function ProjectCreateDialog({ open, onOpenChange }: ProjectCreateDialogProps) {
  const [newProject, setNewProject] = useState<NewProjectState>(DEFAULT_PROJECT_STATE);

  useEffect(() => {
    if (!open) {
      setNewProject(DEFAULT_PROJECT_STATE);
    }
  }, [open]);

  const closeDialog = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle>새 프로젝트 등록</DialogTitle>
          <DialogDescription>고객 정보와 마감일을 입력해 프로젝트를 생성하세요.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-800">프로젝트명</p>
            <Input
              placeholder="예: 모바일 앱 리뉴얼"
              value={newProject.name}
              onChange={(event) => setNewProject((prev) => ({ ...prev, name: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-800">고객사</p>
            <Input
              placeholder="회사명을 입력하세요"
              value={newProject.client}
              onChange={(event) => setNewProject((prev) => ({ ...prev, client: event.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-800">상태</p>
              <Select value={newProject.status} onValueChange={(value) => setNewProject((prev) => ({ ...prev, status: value as ProjectStatus }))}>
                <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="진행중">진행중</SelectItem>
                  <SelectItem value="대기">대기</SelectItem>
                  <SelectItem value="완료">완료</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-800">마감일</p>
              <Input
                type="date"
                value={newProject.dueDate}
                onChange={(event) => setNewProject((prev) => ({ ...prev, dueDate: event.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-800">메모</p>
            <Textarea
              placeholder="간단한 설명을 입력하세요"
              value={newProject.description}
              onChange={(event) => setNewProject((prev) => ({ ...prev, description: event.target.value }))}
              className="min-h-[100px]"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={closeDialog}>
            취소
          </Button>
          <Button className="px-6" onClick={closeDialog}>
            생성하기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
