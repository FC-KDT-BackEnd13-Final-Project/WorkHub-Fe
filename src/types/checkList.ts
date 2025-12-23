export type CheckListItemStatus = "PENDING" | "AGREED" | "ON_HOLD";

export interface CheckListOptionFileResponse {
  checkListOptionFileId: number;
  fileUrl: string;
  fileName: string;
  file_url?: string;
  file_name?: string;
  fileOrder: number;
}

export interface CheckListCommentFileResponse {
  checkListCommentFileId?: number;
  commentFileId?: number;
  fileUrl?: string;
  fileName?: string;
  file_url?: string;
  file_name?: string;
  fileOrder?: number;
}

export interface CheckListOptionResponse {
  checkListOptionId: number;
  optionContent: string;
  optionOrder: number;
  isSelected: boolean;
  files: CheckListOptionFileResponse[];
}

export interface CheckListItemResponse {
  checkListItemId: number;
  itemTitle: string;
  itemOrder: number;
  status: CheckListItemStatus | null;
  confirmedAt: string | null;
  templateId: number | null;
  options: CheckListOptionResponse[];
}

export interface CheckListCommentFilePayload {
  fileName: string;
  fileOrder: number;
}

export interface CheckListCommentRequest {
  content: string;
  parentCommentId?: number | null;
  parentClCommentId?: number | null;
  files?: CheckListCommentFilePayload[];
}

export interface CheckListCommentUpdateRequest {
  content: string;
  files?: CheckListCommentFilePayload[];
}

export interface CheckListCommentResponse {
  checkListCommentId?: number;
  clCommentId?: number;
  checkListItemId?: number;
  userId?: number;
  authorName?: string | null;
  userName?: string | null;
  parentCommentId?: number | null;
  parentClCommentId?: number | null;
  content?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  attachments?: CheckListCommentFileResponse[];
  files?: CheckListCommentFileResponse[];
  children?: CheckListCommentResponse[];
}

export interface CheckListUserSummary {
  userId?: number;
  userName?: string | null;
  loginId?: string | null;
  phone?: string | null;
  mobile?: string | null;
  email?: string | null;
}

export interface CheckListResponse {
  checkListId: number;
  description: string;
  projectNodeId: number;
  userId: number;
  userName?: string | null;
  userLoginId?: string | null;
  userPhone?: string | null;
  userEmail?: string | null;
  user?: CheckListUserSummary | null;
  items: CheckListItemResponse[];
}

export interface CheckListOptionPayload {
  optionContent: string;
  optionOrder: number;
  fileUrls: string[];
}

export interface CheckListItemPayload {
  itemTitle: string;
  itemOrder: number;
  templateId?: number | null;
  options: CheckListOptionPayload[];
}

export interface CheckListCreateRequest {
  description: string;
  items: CheckListItemPayload[];
  saveAsTemplate?: boolean;
  templateTitle?: string;
  templateDescription?: string;
}

export type CheckListUpdateCommandType = "CREATE" | "UPDATE" | "DELETE";

export interface CheckListOptionFileUpdatePayload {
  changeType: CheckListUpdateCommandType;
  checkListOptionFileId?: number;
  fileUrl?: string;
  fileOrder?: number;
}

export interface CheckListOptionUpdatePayload {
  changeType: CheckListUpdateCommandType;
  checkListOptionId?: number;
  optionContent?: string;
  optionOrder?: number;
  files?: CheckListOptionFileUpdatePayload[];
}

export interface CheckListItemUpdatePayload {
  changeType: CheckListUpdateCommandType;
  checkListItemId?: number;
  itemTitle?: string;
  itemOrder?: number;
  templateId?: number | null;
  options?: CheckListOptionUpdatePayload[];
}

export interface CheckListUpdateRequest {
  description?: string;
  items?: CheckListItemUpdatePayload[];
}
