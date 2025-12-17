import type {
  ConfirmStatus,
  NodeApiItem,
  NodeStatus as ApiNodeStatus,
} from "../types/projectNodeList";

// ProjectNodesBoard의 Node 타입
export type NodeStatus = "NOT_STARTED" | "IN_PROGRESS" | "PENDING_REVIEW" | "ON_HOLD" | "DONE";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Node {
  id: string;
  projectNodeId: number;
  title: string;
  description: string;
  tags: string[];
  filesCount: number;
  linksCount: number;
  developer: string;
  developerUserId?: number;
  status: NodeStatus;
  approvalStatus?: ApprovalStatus; // optional (서버에서 제공하지 않으면 undefined)
  approvalStatusLabel?: string;
  updatedAt: string;
  startDate: string;
  endDate: string;
  hasNotification: boolean;
}

/**
 * API NodeStatus를 UI NodeStatus로 변환
 */
function mapApiStatusToUiStatus(apiStatus: ApiNodeStatus): NodeStatus {
  switch (apiStatus) {
    case "NOT_STARTED":
      return "NOT_STARTED";
    case "IN_PROGRESS":
      return "IN_PROGRESS";
    case "PENDING_REVIEW":
      return "PENDING_REVIEW";
    case "ON_HOLD":
      return "ON_HOLD";
    case "DONE":
      return "DONE";
    case "DELETED":
      // DELETED는 ON_HOLD로 매핑 (또는 필터링 가능)
      return "ON_HOLD";
    default:
      return "NOT_STARTED";
  }
}

/**
 * UI 상태를 API 상태로 변환
 */
export function mapUiStatusToApiStatus(status: NodeStatus): ApiNodeStatus {
  switch (status) {
    case "NOT_STARTED":
      return "NOT_STARTED";
    case "IN_PROGRESS":
      return "IN_PROGRESS";
    case "PENDING_REVIEW":
      return "PENDING_REVIEW";
    case "ON_HOLD":
      return "ON_HOLD";
    case "DONE":
      return "DONE";
    default:
      return "NOT_STARTED";
  }
}

/**
 * API 응답 데이터를 UI에서 사용하는 Node 타입으로 변환
 */
export function mapApiNodeToUiNode(apiNode: NodeApiItem): Node {
  return {
    id: String(apiNode.projectNodeId), // number → string 변환
    projectNodeId: apiNode.projectNodeId,
    title: apiNode.title,
    description: apiNode.description,
    status: mapApiStatusToUiStatus(apiNode.nodeStatus),
    updatedAt: apiNode.updatedAt,
    startDate: apiNode.starDate, // API의 오타(starDate)를 그대로 사용
    endDate: apiNode.endDate,

    // 개발자 정보
    developer: apiNode.devMembers?.devMemberName || "",
    developerUserId: apiNode.devMembers?.devMemberId,

    // API에서 제공하지 않는 필드는 기본값 설정
    tags: [],
    filesCount: 0,
    linksCount: 0,
    approvalStatus: mapConfirmStatusToApprovalStatus(apiNode.confirmStatus),
    approvalStatusLabel: mapConfirmStatusToLabel(apiNode.confirmStatus),
    hasNotification: false,
  };
}

export function mapConfirmStatusToApprovalStatus(confirmStatus: ConfirmStatus): ApprovalStatus | undefined {
  if (confirmStatus === null || confirmStatus === undefined) {
    return undefined;
  }

  const normalized =
    typeof confirmStatus === "string"
      ? confirmStatus.trim().toUpperCase()
      : confirmStatus;

  if (normalized === "APPROVED" || normalized === "CONFIRMED" || normalized === "CONFIRM") {
    return "APPROVED";
  }
  if (normalized === "REJECTED" || normalized === "REJECT" || normalized === "DENIED") {
    return "REJECTED";
  }
  if (normalized === "PENDING" || normalized === "WAIT" || normalized === "WAITING" || normalized === "REQUEST" || normalized === "REQUESTED") {
    return "PENDING";
  }

  // 알 수 없는 문자열이면 표시하지 않음
  return undefined;
}

export function mapConfirmStatusToLabel(confirmStatus: ConfirmStatus): string | undefined {
  const status = mapConfirmStatusToApprovalStatus(confirmStatus);
  if (!status) return undefined;
  const labels: Record<ApprovalStatus, string> = {
    PENDING: "승인 대기",
    APPROVED: "승인 완료",
    REJECTED: "반려",
  };
  return labels[status];
}
