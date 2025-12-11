// 노드 생성 요청용
export interface CreateNodePayload {
    title: string;
    description: string;
    developerUserId: number;
    startDate: string;
    endDate: string;
}