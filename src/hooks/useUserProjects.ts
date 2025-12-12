import { useCallback, useEffect, useRef, useState } from "react";
import { projectApi } from "../lib/api";
import { mapApiProjectToUiProject, type Project } from "../utils/projectMapper";
import type { ProjectListParams } from "../types/project";

type UseUserProjectsResult = {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useUserProjects(userId?: string | null): UseUserProjectsResult {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchProjects = useCallback(async () => {
    if (!userId) {
      setProjects([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const aggregatedProjects: Project[] = [];
      let cursor: number | undefined = undefined;
      let hasNext = true;

      while (hasNext) {
        const params: ProjectListParams = {
          cursor,
          size: 50,
        };

        const response = await projectApi.getList(params);
        const mapped = response.projects?.map(mapApiProjectToUiProject) ?? [];
        aggregatedProjects.push(...mapped);

        hasNext = response.hasNext;
        cursor = response.nextCursor ?? undefined;

        if (!hasNext || cursor === undefined) {
          break;
        }
      }

      const filtered = aggregatedProjects.filter((project) =>
        project.developers?.some((developer) => developer.id === String(userId)),
      );

      if (isMountedRef.current) {
        setProjects(filtered);
      }
    } catch (fetchError) {
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : "프로젝트를 불러오는 중 오류가 발생했습니다.";
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
    fetchProjects();
  }, [fetchProjects]);

  const refetch = useCallback(() => {
    void fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    isLoading,
    error,
    refetch,
  };
}
