import { apiClient } from "./api";
import type {
  AdminHistoryListParams,
  AdminHistoryPage,
  AdminHistoryPageResponse,
  AdminHistoryType,
} from "@/types/history";

export const historyApi = {
  getAdminHistories: async (params?: AdminHistoryListParams): Promise<AdminHistoryPage> => {
    const response = await apiClient.get<AdminHistoryPageResponse>("/api/v1/admin/histories", {
      params,
      paramsSerializer: {
        serialize: (rawParams) => {
          const searchParams = new URLSearchParams();
          Object.entries(rawParams ?? {}).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
            if (Array.isArray(value)) {
              value.forEach((item) => searchParams.append(key, String(item)));
            } else {
              searchParams.append(key, String(value));
            }
          });
          return searchParams.toString();
        },
      },
    });

    const { success, message, data } = response.data;

    if (success) return data;

    throw new Error(message || "히스토리를 불러오지 못했습니다.");
  },

  getHistoriesByType: async (
    types: AdminHistoryType | AdminHistoryType[],
    params?: Omit<AdminHistoryListParams, "types">,
  ): Promise<AdminHistoryPage> => {
    const response = await apiClient.get<AdminHistoryPageResponse>("/api/v1/admin/histories", {
      params: { ...params, types },
      paramsSerializer: {
        serialize: (rawParams) => {
          const searchParams = new URLSearchParams();
          Object.entries(rawParams ?? {}).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
            if (Array.isArray(value)) {
              value.forEach((item) => searchParams.append(key, String(item)));
            } else {
              searchParams.append(key, String(value));
            }
          });
          return searchParams.toString();
        },
      },
    });

    const { success, message, data } = response.data;

    if (success) return data;

    throw new Error(message || "히스토리를 불러오지 못했습니다.");
  },
};
