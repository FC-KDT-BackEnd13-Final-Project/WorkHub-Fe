export type CheckListItemStatus = "PENDING" | "AGREED" | "ON_HOLD";

export interface CheckListOptionFileResponse {
  checkListOptionFileId: number;
  fileUrl: string;
  fileName: string;
  fileOrder: number;
}

export interface CheckListOptionResponse {
  checkListOptionId: number;
  optionContent: string;
  optionOrder: number;
  files: CheckListOptionFileResponse[];
}

export interface CheckListItemResponse {
  checkListItemId: number;
  itemTitle: string;
  itemOrder: number;
  status: CheckListItemStatus;
  confirmedAt: string | null;
  templateId: number | null;
  options: CheckListOptionResponse[];
}

export interface CheckListResponse {
  checkListId: number;
  description: string;
  projectNodeId: number;
  userId: number;
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
