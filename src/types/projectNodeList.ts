// API 응답 타입
export interface NodeListApiResponse {
  projectNodes: NodeApiItem[];
}

export interface NodeApiItem {
    projectId: number;
    projectNodeId: number;
    title: string;
    description: string;
    nodeStatus: NodeStatus;
    nodeOrder: number;
    updatedAt: string;
    starDate: string;
    endDate: string;
    devMembers: {
        devMemberId: number;
        devMemberName: string;
    }
}

export type NodeStatus =
  | "NOT_STARTED"
  | "PENDING_REVIEW"
  | "DONE"
  | "ON_HOLD"
  | "DELETED";