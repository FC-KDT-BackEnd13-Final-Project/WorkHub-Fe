// API 응답 타입 (projectApi.getNodes는 data 배열을 반환)
export type NodeListApiResponse = NodeApiItem[];

export interface NodeApiItem {
    projectId: number;
    projectNodeId: number;
    title: string;
    description: string;
    nodeStatus: NodeStatus;
    confirmStatus: ConfirmStatus;
    nodeOrder: number;
    updatedAt: string;
    starDate: string;
    endDate: string;
    devMembers: {
        devMemberId: number;
        devMemberLoginId?: string;
        devMemberName: string;
        profileImg?: string | null;
    }
}

export type ConfirmStatus = "PENDING" | "APPROVED" | "REJECTED" | null;

export type NodeStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "PENDING_REVIEW"
  | "DONE"
  | "ON_HOLD"
  | "DELETED";
