import { useCallback, useEffect, useRef, useState } from "react";
import { companyApi, type CompanyPageParams } from "@/lib/api";
import type { AdminCompanyPage, AdminCompanyResponse } from "@/types/company";

const DEFAULT_SORT = "createdAt,DESC";
const PAGE_FETCH_SIZE = 100;
const MAX_PAGE_ITERATIONS = 50;

type UseAdminCompanyListOptions = {
  pageSize?: number;
  sort?: CompanyPageParams["sort"];
};

type UseAdminCompanyListResult = {
  companies: AdminCompanyResponse[];
  isLoading: boolean;
  error: string | null;
  lastFetchedPage?: AdminCompanyPage;
  refetch: () => void;
};

export function useAdminCompanyList(options?: UseAdminCompanyListOptions): UseAdminCompanyListResult {
  const [companies, setCompanies] = useState<AdminCompanyResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedPage, setLastFetchedPage] = useState<AdminCompanyPage | undefined>(undefined);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const pageSize = options?.pageSize ?? PAGE_FETCH_SIZE;
  const sort = options?.sort ?? DEFAULT_SORT;

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const aggregated: AdminCompanyResponse[] = [];
      let pageIndex = 0;
      let hasNext = true;
      let lastPageData: AdminCompanyPage | undefined;
      for (let iteration = 0; iteration < MAX_PAGE_ITERATIONS && hasNext; iteration += 1) {
        const page = await companyApi.getCompanyPage({
          page: pageIndex,
          size: pageSize,
          sort,
        });
        lastPageData = page;
        aggregated.push(...(page.content ?? []));
        hasNext = !page.last;
        pageIndex += 1;
        if (!hasNext || page.content.length === 0) {
          break;
        }
      }
      if (isMountedRef.current) {
        setCompanies(aggregated);
        setLastFetchedPage(lastPageData);
      }
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : "고객사 목록을 불러오는 중 오류가 발생했습니다.";
      if (isMountedRef.current) {
        setError(message);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [pageSize, sort]);

  useEffect(() => {
    void fetchCompanies();
  }, [fetchCompanies]);

  const handleRefetch = useCallback(() => {
    void fetchCompanies();
  }, [fetchCompanies]);

  return {
    companies,
    isLoading,
    error,
    lastFetchedPage,
    refetch: handleRefetch,
  };
}
