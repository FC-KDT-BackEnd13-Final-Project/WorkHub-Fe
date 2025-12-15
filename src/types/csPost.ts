/**
 * CS 게시글 상태
 */
export type CsPostStatus = "RECEIVED" | "IN_PROGRESS" | "COMPLETED";

/**
 * CS 게시글 API 응답 아이템
 */
export interface CsPostApiItem {
  csPostId: number;
  title: string;
  content: string;
  csPostStatus: CsPostStatus;
  customerName: string;
  createdAt: string; // ISO 8601 형식
  updatedAt: string; // ISO 8601 형식
}

/**
 * CS 게시글 목록 조회 API 응답
 */
export interface CsPostListApiResponse {
  content: CsPostApiItem[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

/**
 * CS 게시글 목록 조회 요청 파라미터
 */
export interface CsPostListParams {
  searchValue?: string;
  csPostStatus?: CsPostStatus;
  page?: number; // 0-based
  size?: number;
  sort?: string[]; // 예: ["createdAt,DESC"]
}

/**
 * CS 게시글 생성 요청 데이터
 */
export interface CreateCsPostPayload {
  title: string;
  content: string;
}
