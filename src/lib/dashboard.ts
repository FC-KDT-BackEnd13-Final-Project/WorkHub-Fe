import { apiClient } from "./api";

type ApiResponse<T> = {
  success?: boolean;
  code?: string;
  message?: string;
  data: T;
};

export interface DashboardSummary {
  pendingApprovals: number;
  totalProjects: number;
}

type CountPayload =
  | number
  | {
      count?: number;
      total?: number;
      totalCount?: number;
      value?: number;
      [key: string]: unknown;
    };

export interface MonthlyMetricPoint {
  month: string;
  value: number;
}

export interface MonthlyMetricsMetadata {
  usersCriteria?: string;
  projectsCriteria?: string;
  months?: number;
  startMonth?: string;
  endMonth?: string;
}

export interface MonthlyMetricsResponse {
  users: MonthlyMetricPoint[];
  projects: MonthlyMetricPoint[];
  metadata?: MonthlyMetricsMetadata;
}

export type ProjectDistributionCategory =
  | "PLANNING"
  | "DESIGN"
  | "DEVELOPMENT"
  | "QA"
  | "RELEASE"
  | "MAINTENANCE"
  | "ETC"
  | (string & {});

export interface ProjectDistributionItem {
  nodeCategory: ProjectDistributionCategory;
  totalNodes: number;
  completedNodes: number;
  completionRate: number;
}

export interface ProjectDistributionResponse {
  totalInProgressProjectCount: number;
  distributions: ProjectDistributionItem[];
}

const ADMIN_DASHBOARD_BASE_PATH = "/api/v1/admin/dashboard";

function assertSuccess<T>(payload: ApiResponse<T>, fallbackMessage: string): T {
  if (payload.success === false) {
    throw new Error(payload.message || fallbackMessage);
  }
  if (typeof payload.data === "undefined" || payload.data === null) {
    throw new Error(fallbackMessage);
  }
  return payload.data;
}

function extractCount(value: CountPayload, fallbackMessage: string): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "object" && value) {
    const candidates = [value.count, value.total, value.totalCount, value.value];
    for (const candidate of candidates) {
      if (typeof candidate === "number") {
        return candidate;
      }
      if (typeof candidate === "string" && candidate.trim()) {
        const parsed = Number(candidate);
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }
    }

    const values = Object.values(value);
    for (const entry of values) {
      if (typeof entry === "number") {
        return entry;
      }
    }
    for (const entry of values) {
      if (typeof entry === "string" && entry.trim()) {
        const parsed = Number(entry);
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }
    }
  }

  throw new Error(fallbackMessage);
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const response = await apiClient.get<ApiResponse<DashboardSummary>>("/api/v1/dashboard/summary");
  return assertSuccess(response.data, "대시보드 요약 정보를 불러오지 못했습니다.");
}

export async function fetchAdminUserCount(): Promise<number> {
  const response = await apiClient.get<ApiResponse<CountPayload>>(`${ADMIN_DASHBOARD_BASE_PATH}/users/count`);
  const data = assertSuccess(response.data, "총 사용자 수를 불러오지 못했습니다.");
  return extractCount(data, "총 사용자 수를 불러오지 못했습니다.");
}

export async function fetchAdminCompanyCount(): Promise<number> {
  const response = await apiClient.get<ApiResponse<CountPayload>>(`${ADMIN_DASHBOARD_BASE_PATH}/companies/count`);
  const data = assertSuccess(response.data, "총 회사 수를 불러오지 못했습니다.");
  return extractCount(data, "총 회사 수를 불러오지 못했습니다.");
}

export async function fetchAdminProjectCount(): Promise<number> {
  const response = await apiClient.get<ApiResponse<CountPayload>>(`${ADMIN_DASHBOARD_BASE_PATH}/projects/count`);
  const data = assertSuccess(response.data, "총 프로젝트 수를 불러오지 못했습니다.");
  return extractCount(data, "총 프로젝트 수를 불러오지 못했습니다.");
}

export async function fetchAdminMonthlyMetrics(months = 12): Promise<MonthlyMetricsResponse> {
  const response = await apiClient.get<ApiResponse<MonthlyMetricsResponse>>(
    `${ADMIN_DASHBOARD_BASE_PATH}/monthly-metrics`,
    {
      params: { months },
    },
  );
  return assertSuccess(response.data, "월별 지표를 불러오지 못했습니다.");
}

export async function fetchAdminProjectDistribution(): Promise<ProjectDistributionResponse> {
  const response = await apiClient.get<ApiResponse<ProjectDistributionResponse>>(
    `${ADMIN_DASHBOARD_BASE_PATH}/project-distribution`,
  );
  return assertSuccess(response.data, "프로젝트 단계별 비율을 불러오지 못했습니다.");
}
