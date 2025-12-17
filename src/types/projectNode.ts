// 노드 생성 요청용
export interface CreateNodePayload {
    title: string;
    description: string;
    developerUserId: number;
    startDate: string;
    endDate: string;
}

export interface UpdateNodePayload {
    title?: string;
    description?: string;
    developerUserId?: number;
    startDate?: string;
    endDate?: string;
}

export type NodeStatusPayload = "NOT_STARTED" | "IN_PROGRESS" | "PENDING_REVIEW" | "DONE" | "ON_HOLD";

export interface UpdateNodeOrderPayload {
    projectNodeId: number;
    nodeOrder: number;
}
