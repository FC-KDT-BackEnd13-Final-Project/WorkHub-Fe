export type PostRevision = {
  id: string;
  version: number;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt?: string;
  editor: string;
  editedAt: string;
};

export const postRevisionsByPostId: Record<string, PostRevision[]> = {
  default: [
    {
      id: "rev-001",
      version: 3,
      title: "메인 대시보드 QA 및 일정 업데이트",
      content: "QA에서 보고된 그래프 누락 현상을 공유합니다.\n추가로 일정 조정이 필요합니다.",
      author: "김지은",
      createdAt: "2025-11-18 09:00",
      updatedAt: "2025-11-20 11:15",
      editor: "이현우",
      editedAt: "2025-11-21 08:40",
    },
    {
      id: "rev-002",
      version: 2,
      title: "메인 대시보드 QA 및 일정 업데이트",
      content: "QA에서 그래프 누락 현상 확인했습니다.\n원인 파악 중입니다.",
      author: "김지은",
      createdAt: "2025-11-18 09:00",
      updatedAt: "2025-11-19 17:05",
      editor: "박서준",
      editedAt: "2025-11-19 17:05",
    },
    {
      id: "rev-003",
      version: 1,
      title: "메인 대시보드 QA 및 일정 업데이트",
      content: "대시보드 QA 결과와 향후 일정 공유드립니다.",
      author: "김지은",
      createdAt: "2025-11-18 09:00",
      editor: "김지은",
      editedAt: "2025-11-18 09:00",
    },
  ],
  empty: [],
};
