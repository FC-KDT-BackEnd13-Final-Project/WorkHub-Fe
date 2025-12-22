import { apiClient } from "./api";

export interface DashboardSummary {
  pendingApprovals: number;
  totalProjects: number;
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const response = await apiClient.get<{ success?: boolean; message?: string; data: DashboardSummary }>(
    "/api/v1/dashboard/summary",
  );
  const payload = response.data;
  if (payload.success === false) {
    throw new Error(payload.message || "대시보드 요약 정보를 불러오지 못했습니다.");
  }
  return payload.data;
}
