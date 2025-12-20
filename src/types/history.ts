export type AdminHistoryType =
  | "PROJECT"
  | "PROJECT_NODE"
  | "CS_POST"
  | "CS_QNA"
  | "PROJECT_CLIENT_MEMBER"
  | "PROJECT_DEV_MEMBER"
  | "POST"
  | "POST_COMMENT"
  | "CHECK_LIST_ITEM"
  | "CHECK_LIST_ITEM_COMMENT";

export type AdminActionType = "CREATE" | "UPDATE" | "DELETE";

export type AdminHistoryUser = {
  userId: number;
  userName: string;
  profileImg?: string | null;
};

export type AdminHistoryItem = {
  changeLogId: number;
  historyType: AdminHistoryType;
  targetId: number;
  actionType: AdminActionType;
  beforeData?: string | null;
  createdBy?: AdminHistoryUser | null;
  updatedBy?: AdminHistoryUser | null;
  updatedAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type PageableSort = {
  unsorted: boolean;
  sorted: boolean;
  empty: boolean;
};

export type PageableInfo = {
  pageNumber: number;
  pageSize: number;
  sort: PageableSort;
  offset: number;
  unpaged: boolean;
  paged: boolean;
};

export type AdminHistoryPage = {
  content: AdminHistoryItem[];
  pageable: PageableInfo;
  totalPages: number;
  totalElements: number;
  last: boolean;
  number: number;
  size: number;
  sort: PageableSort;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
};

export type AdminHistoryPageResponse = {
  success: boolean;
  code: string;
  message: string;
  data: AdminHistoryPage;
};

export type AdminHistoryListParams = {
  page?: number;
  size?: number;
  sort?: string | string[];
  types?: AdminHistoryType | AdminHistoryType[];
};
