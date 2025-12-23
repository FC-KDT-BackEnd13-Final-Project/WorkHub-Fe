export type CompanyStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface AdminCompanyResponse {
  companyId?: number;
  companyName?: string;
  companyNumber?: string;
  tel?: string;
  address?: string;
  status?: string;
  totalProjectCount?: number;
  activeProjectCount?: number;
  clientCount?: number;
  createdAt?: string;
  joinedAt?: string;
}

export interface PageSortInfo {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

export interface PageableInfo {
  pageNumber: number;
  pageSize: number;
  sort: PageSortInfo;
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

export interface AdminCompanyPage {
  content: AdminCompanyResponse[];
  pageable: PageableInfo;
  last: boolean;
  totalPages: number;
  totalElements: number;
  first: boolean;
  size: number;
  number: number;
  sort: PageSortInfo;
  numberOfElements: number;
  empty: boolean;
}

export interface AdminCompanyPageResponse {
  success: boolean;
  code: string;
  message: string;
  data: AdminCompanyPage;
}
