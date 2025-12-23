import { format } from "date-fns";

import { type HistoryEvent } from "@/data/historyData";
import type { AdminActionType, AdminHistoryItem, AdminHistoryType } from "@/types/history";

const historyTypeLabels: Record<AdminHistoryType, string> = {
  PROJECT: "프로젝트",
  PROJECT_NODE: "프로젝트 단계",
  CS_POST: "CS 게시글",
  CS_QNA: "CS 문의",
  PROJECT_CLIENT_MEMBER: "고객사 담당자",
  PROJECT_DEV_MEMBER: "개발사 담당자",
  POST: "게시글",
  POST_COMMENT: "게시글 댓글",
  CHECK_LIST_ITEM: "체크리스트",
  CHECK_LIST_ITEM_COMMENT: "체크리스트 댓글",
};

const actionTypeLabels: Record<AdminActionType, string> = {
  CREATE: "추가",
  UPDATE: "수정",
  DELETE: "삭제",
  MOVE: "이동",
  HIDE: "숨김",
};

const actionPaletteMap: Record<AdminActionType, HistoryEvent["type"]> = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  MOVE: "move",
  HIDE: "hide",
};

const historyCategoryMap: Partial<Record<AdminHistoryType, HistoryEvent["category"]>> = {
  PROJECT: "project",
  PROJECT_NODE: "project",
  CS_POST: "post",
  CS_QNA: "post",
  PROJECT_CLIENT_MEMBER: "project",
  PROJECT_DEV_MEMBER: "project",
  POST: "post",
  POST_COMMENT: "post",
  CHECK_LIST_ITEM: "checklist",
  CHECK_LIST_ITEM_COMMENT: "checklist",
};

const historySubCategoryMap: Partial<Record<AdminHistoryType, HistoryEvent["subCategory"]>> = {
  PROJECT: "project",
  PROJECT_NODE: "projectPhase",
  CS_POST: "csPost",
  CS_QNA: "csQna",
  PROJECT_CLIENT_MEMBER: "projectClient",
  PROJECT_DEV_MEMBER: "projectAgency",
  POST: "post",
  POST_COMMENT: "postComment",
  CHECK_LIST_ITEM: "checklist",
  CHECK_LIST_ITEM_COMMENT: "checklistComment",
};

const formatDateTime = (value: string) => format(new Date(value), "yyyy.MM.dd HH:mm");

export const mapHistoryItemToEvent = (item: AdminHistoryItem): HistoryEvent => {
  const historyLabel = historyTypeLabels[item.historyType] ?? item.historyType;
  const actionLabel = actionTypeLabels[item.actionType] ?? item.actionType;
  const paletteKey = actionPaletteMap[item.actionType] ?? "update";

  return {
    id: item.changeLogId,
    type: paletteKey,
    message: `${historyLabel}(이)가 ${actionLabel}되었습니다`,
    timestamp: formatDateTime(item.updatedAt),
    updatedAt: item.updatedAt,
    updatedBy: item.updatedBy?.userName ?? "시스템",
    createdBy: item.updatedBy?.userName ?? "",
    updatedByProfileImg: item.updatedBy?.profileImg,
    target: historyLabel,
    ipAddress: item.ipAddress,
    userAgent: item.userAgent,
    category: historyCategoryMap[item.historyType],
    subCategory: historySubCategoryMap[item.historyType],
  };
};
