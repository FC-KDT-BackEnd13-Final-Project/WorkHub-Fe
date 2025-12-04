export interface SupportTicket {
  id: string;
  customerName: string;
  type: "공지" | "질문" | "일반";
  title: string;
  content: string;
  createdDate: string;
  updatedDate: string;
  hashtag?: string;
  isOwner?: boolean;
}

export const supportTickets: SupportTicket[] = [
  {
    id: "sup-001",
    customerName: "홍길동",
    type: "질문",
    title: "계약 관련 문의",
    content: "계약 옵션을 다시 확인하고 싶습니다. 자세한 안내 부탁드려요.",
    createdDate: "2024-06-01 10:00",
    updatedDate: "2024-06-02 11:00",
    hashtag: "#계약",
    isOwner: false,
  },
  {
    id: "sup-002",
    customerName: "김영희",
    type: "일반",
    title: "프로젝트 일정 문의",
    content: "프로젝트 일정이 조금 밀린 것으로 보입니다. 현황 공유 부탁드려요.",
    createdDate: "2024-06-05 09:30",
    updatedDate: "2024-06-05 09:30",
    hashtag: "#일정",
    isOwner: false,
  },
  {
    id: "sup-003",
    customerName: "최민수",
    type: "공지",
    title: "자료 업로드 완료",
    content: "필요하셨던 자료 업로드 완료했습니다. 확인 부탁드립니다.",
    createdDate: "2024-06-07 14:20",
    updatedDate: "2024-06-07 14:20",
    hashtag: "#자료",
    isOwner: false,
  },
];

export const findSupportTicket = (id: string) => supportTickets.find((ticket) => ticket.id === id);
