export interface ProjectPostSummary {
  id: string;
  customerName: string;
  type: "공지" | "질문" | "일반";
  title: string;
  content: string;
  createdDate: string;
  updatedDate: string;
  hashtag:
      | "req"
      | "def"
      | "wireframe"
      | "design"
      | "publishing"
      | "development"
      | "qa";
}

export const mockProjectPosts: ProjectPostSummary[] = [
  {
    id: "1",
    customerName: "abcd",
    type: "질문",
    title: "제목입니다. 제목이 길어졌을 때 어떻게 보이는지 테스트용입니다.",
    content:
        "내용입니다. 이 내용도 길어졌을 때 말줄임표(...)가 잘 나오는지 확인하기 위한 더미 텍스트입니다.",
    createdDate: "2025-11-20",
    updatedDate: "2025-11-21",
    hashtag: "req",
  },
  {
    id: "2",
    customerName: "abcd",
    type: "공지",
    title: "공지 제목입니다.",
    content: "공지 내용입니다.",
    createdDate: "2025-11-20",
    updatedDate: "2025-11-21",
    hashtag: "design",
  },
  {
    id: "3",
    customerName: "abcd",
    type: "일반",
    title: "일반 글 제목입니다.",
    content: "일반 글 내용입니다.",
    createdDate: "2025-11-20",
    updatedDate: "2025-11-21",
    hashtag: "development",
  },
  {
    id: "4",
    customerName: "abcd",
    type: "질문",
    title: "질문입니다.",
    content: "질문 내용입니다.",
    createdDate: "2025-11-20",
    updatedDate: "2025-11-21",
    hashtag: "qa",
  },
  {
    id: "5",
    customerName: "abcd",
    type: "질문",
    title: "제목입니다.",
    content: "내용입니다.",
    createdDate: "2025-11-20",
    updatedDate: "2025-11-21",
    hashtag: "wireframe",
  },
  {
    id: "6",
    customerName: "abcd",
    type: "질문",
    title: "제목입니다.",
    content: "내용입니다.",
    createdDate: "2025-11-20",
    updatedDate: "2025-11-21",
    hashtag: "publishing",
  },
  {
    id: "7",
    customerName: "abcd",
    type: "질문",
    title: "제목입니다.",
    content: "내용입니다.",
    createdDate: "2025-11-20",
    updatedDate: "2025-11-21",
    hashtag: "publishing",
  },
  {
    id: "8",
    customerName: "abcd",
    type: "질문",
    title: "제목입니다.",
    content: "내용입니다.",
    createdDate: "2025-11-20",
    updatedDate: "2025-11-21",
    hashtag: "publishing",
  },
  {
    id: "9",
    customerName: "abcd",
    type: "질문",
    title: "제목입니다.",
    content: "내용입니다.",
    createdDate: "2025-11-20",
    updatedDate: "2025-11-21",
    hashtag: "publishing",
  },
  {
    id: "10",
    customerName: "abcd",
    type: "질문",
    title: "제목입니다.",
    content: "내용입니다.",
    createdDate: "2025-11-20",
    updatedDate: "2025-11-21",
    hashtag: "publishing",
  },
  {
    id: "11",
    customerName: "abcde",
    type: "질문",
    title: "제목입니다!",
    content: "내용입니다.",
    createdDate: "2025-11-20",
    updatedDate: "2025-11-21",
    hashtag: "publishing",
  },
];
