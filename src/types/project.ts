// API 응답 타입
export interface ProjectApiResponse {
  projects: ProjectApiItem[];
  nextCursor: number;
  hasNext: boolean;
  size: number;
}

export interface ProjectApiItem {
  projectId: number;
  projectTitle: string;
  projectDescription: string;
  status: ProjectStatus;
  contractStartDate: string; // "2025-12-10" 형식
  contractEndDate: string;
  company: {
    companyId: number;
    companyName: string;
  };
  devMembers: {
    devMemberId: number;
    devMemberName: string;
  }[];
  clientMembers: {
    clientMemberId: number;
    clientMemberName: string;
  }[];
  totalMembers: number;
  workflowStep: number;
}

export type ProjectStatus =
  | "CONTRACT"
  | "IN_PROGRESS"
  | "DELIVERY"
  | "MAINTENANCE"
  | "COMPLETED"
  | "CANCELLED";

export type SortOrder = "LATEST" | "OLDEST";

// 쿼리 파라미터 타입
export interface ProjectListParams {
  startDate?: string; // "2025-12-10" 형식
  endDate?: string;
  status?: ProjectStatus;
  sortOrder?: SortOrder;
  cursor?: number;
  size?: number;
}