import type { ProjectApiItem } from "../types/project";

// ProjectsIndex의 Project 타입 (향후 별도 파일로 분리 가능)
export interface Project {
  id: string;
  name: string;
  brand: string;
  brandContact?: string;
  managers?: string[];
  developers: { id: string; name: string }[];
  manager?: string;
  developer?: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: "CONTRACT" | "IN_PROGRESS" | "DELIVERY" | "MAINTENANCE" | "COMPLETED" | "CANCELLED";
  teamSize: number;
  tasks: number;
  description: string;
}

/**
 * API 응답 데이터를 UI에서 사용하는 Project 타입으로 변환
 */
export function mapApiProjectToUiProject(apiProject: ProjectApiItem): Project {
  return {
    id: String(apiProject.projectId), // number → string 변환
    name: apiProject.projectTitle,
    description: apiProject.projectDescription,
    brand: apiProject.company.companyName,
    brandContact: "",
    startDate: apiProject.contractStartDate,
    endDate: apiProject.contractEndDate,
    status: apiProject.status,
    teamSize: apiProject.totalMembers,
    tasks: apiProject.workflowStep,

    // 배열 변환: 객체 배열 → 이름 문자열 배열
    managers: apiProject.clientMembers.map((m) => m.clientMemberName),
    developers: apiProject.devMembers.map((d) => ({
      id: String(d.devMemberId),
      name: d.devMemberName,
    })),

    // API에서 제공하지 않는 필드는 기본값 설정
    progress: 0, // TODO: workflowStep 기반 계산 로직 추가 가능
  };
}
