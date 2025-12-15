import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { userApi } from "../lib/api";
import type { AdminUserResponse, AdminUserViewModel } from "../types/adminUser";

const DEFAULT_AVATAR_URL = "/default-profile.png";

const DEFAULT_COMPANY_LABEL = "소속 미지정";

function mapApiRoleToDisplay(role?: string) {
  if (!role) return undefined;
  const normalized = role.toUpperCase();
  if (normalized === "ADMIN") return "Admin";
  if (normalized === "DEVELOPER") return "Developer";
  if (normalized === "CLIENT") return "Client";
  return role;
}

function mapAdminUserResponseToViewModel(user: AdminUserResponse): AdminUserViewModel {
  const role = mapApiRoleToDisplay(user.role) ?? "Client";
  const companyLabel =
    typeof user.companyId === "number" && user.companyId
      ? `Company #${user.companyId}`
      : DEFAULT_COMPANY_LABEL;
  return {
    id: user.userId?.toString() ?? "",
    name: user.userName ?? "이름 정보 없음",
    email: user.email ?? "",
    company: companyLabel,
    role,
    status: user.status ?? "ACTIVE",
    lastActive: "-",
    joined: "",
    phone: user.phone ?? "",
    avatarUrl: user.profileImg ?? DEFAULT_AVATAR_URL,
    loginId: user.loginId,
    projectCount: 0,
  };
}

type UseAdminUsersListResult = {
  users: AdminUserViewModel[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useAdminUsersList(): UseAdminUsersListResult {
  const [users, setUsers] = useState<AdminUserViewModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await userApi.getAdminUsers();
      const mapped = response.map(mapAdminUserResponseToViewModel);
      if (isMountedRef.current) {
        setUsers(mapped);
      }
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : "회원 목록을 불러오는 중 오류가 발생했습니다.";
      if (isMountedRef.current) {
        setError(message);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRefetch = useCallback(() => {
    void fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    isLoading,
    error,
    refetch: handleRefetch,
  };
}

type UseAdminUserResult = {
  user: AdminUserViewModel | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useAdminUser(userId?: string | null): UseAdminUserResult {
  const [user, setUser] = useState<AdminUserViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchUser = useCallback(async () => {
    if (!userId) {
      setUser(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await userApi.getAdminUserDetail(userId);
      const mapped = mapAdminUserResponseToViewModel(response);
      if (isMountedRef.current) {
        setUser(mapped);
      }
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : "회원 정보를 불러오지 못했습니다.";
      if (isMountedRef.current) {
        setError(message);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  const handleRefetch = useCallback(() => {
    void fetchUser();
  }, [fetchUser]);

  return {
    user,
    isLoading,
    error,
    refetch: handleRefetch,
  };
}
