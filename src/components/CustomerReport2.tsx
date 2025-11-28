import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card2, CardContent } from "./ui/card2";
import {
  Table2,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table2";
import { Search } from "lucide-react";
import { Input2 } from "./ui/input2";
import { Button2 } from "./ui/button2";
import { Badge2 } from "./ui/badge2";
import { RichTextDemo } from "./RichTextDemo";

interface Customer {
  id: string;
  customerName: string; // 작성자
  type: "notice" | "question" | "general"; // 타입
  title: string; // 제목
  content: string; // 내용
  createdDate: string; // 생성일
  updatedDate: string; // 수정일
  hashtag:
      | "req"
      | "def"
      | "wireframe"
      | "design"
      | "publishing"
      | "development"
      | "qa"; // 해시태그
}

// Mock data
const mockCustomers: Customer[] = [
  {
    id: "1",
    customerName: "abcd",
    type: "question",
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
    type: "notice",
    title: "공지 제목입니다.",
    content: "공지 내용입니다.",
    createdDate: "2025-11-20",
    updatedDate: "2025-11-21",
    hashtag: "design",
  },
  {
    id: "3",
    customerName: "abcd",
    type: "general",
    title: "일반 글 제목입니다.",
    content: "일반 글 내용입니다.",
    createdDate: "2025-11-20",
    updatedDate: "2025-11-21",
    hashtag: "development",
  },
  {
    id: "4",
    customerName: "abcd",
    type: "question",
    title: "질문입니다.",
    content: "질문 내용입니다.",
    createdDate: "2025-11-20",
    updatedDate: "2025-11-21",
    hashtag: "qa",
  },
  {
    id: "5",
    customerName: "abcd",
    type: "question",
    title: "제목입니다.",
    content: "내용입니다.",
    createdDate: "2025-11-20",
    updatedDate: "2025-11-21",
    hashtag: "wireframe",
  },
  {
    id: "6",
    customerName: "abcd",
    type: "question",
    title: "제목입니다.",
    content: "내용입니다.",
    createdDate: "2025-11-20",
    updatedDate: "2025-11-21",
    hashtag: "publishing",
  },
  {
    id: "7",
    customerName: "abcd",
    type: "question",
    title: "제목입니다.",
    content: "내용입니다.",
    createdDate: "2025-11-20",
    updatedDate: "2025-11-21",
    hashtag: "publishing",
  },
  {
    id: "8",
    customerName: "abcd",
    type: "question",
    title: "제목입니다.",
    content: "내용입니다.",
    createdDate: "2025-11-20",
    updatedDate: "2025-11-21",
    hashtag: "publishing",
  },
  {
    id: "9",
    customerName: "abcd",
    type: "question",
    title: "제목입니다.",
    content: "내용입니다.",
    createdDate: "2025-11-20",
    updatedDate: "2025-11-21",
    hashtag: "publishing",
  },
  {
    id: "10",
    customerName: "abcd",
    type: "question",
    title: "제목입니다.",
    content: "내용입니다.",
    createdDate: "2025-11-20",
    updatedDate: "2025-11-21",
    hashtag: "publishing",
  },
  {
    id: "11",
    customerName: "abcde",
    type: "question",
    title: "제목입니다!",
    content: "내용입니다.",
    createdDate: "2025-11-20",
    updatedDate: "2025-11-21",
    hashtag: "publishing",
  },
];

export function CustomerReport2() {
  const [searchTerm, setSearchTerm] = useState("");
  const [customers] = useState<Customer[]>(mockCustomers);
  const [isWriting, setIsWriting] = useState(false);
  const navigate = useNavigate();
  const { projectId, nodeId } = useParams<{ projectId?: string; nodeId?: string }>();

  // 검색 필터
  const filteredCustomers = customers.filter((customer) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
        customer.customerName.toLowerCase().includes(term) ||
        customer.title.toLowerCase().includes(term) ||
        customer.content.toLowerCase().includes(term)
    );
  });

  // 페이징 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.max(
      1,
      Math.ceil(filteredCustomers.length / itemsPerPage)
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedRows = filteredCustomers.slice(
      indexOfFirstItem,
      indexOfLastItem
  );

  // isWriting 상태가 true일 때 글쓰기 UI 보여주기 위해 RichTextDemo 리턴
  if (isWriting) {
    return (
        <div className="w-full max-w-[1800px] mx-auto p-6 space-y-6">
          <div className="flex flex-col gap-4">
            <RichTextDemo
                actionButtons={
                    <div className="flex items-center gap-2">
                      <Button2 variant="outline" onClick={() => setIsWriting(false)}>
                        취소
                      </Button2>
                      <Button2 onClick={() => setIsWriting(false)}>
                        등록
                      </Button2>
                    </div>
                }
            />
          </div>
        </div>
    );
  }

  return (
      <div className="w-full max-w-[1800px] mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          {/* 검색어 창 */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input2
                  id="search"
                  style={{ paddingLeft: "2.5rem" }}
                  placeholder="검색어를 입력하세요."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // 검색어 바뀌면 1페이지로 리셋
                  }}
                  className="pl-10"
              />
            </div>
          </div>
          {/* 검색, 글쓰기 버튼 */}
          <div className="flex gap-2">
            <Button2 className="flex items-center gap-2">검색</Button2>
            <Button2 className="flex items-center gap-2" onClick={() => setIsWriting(true)}>글쓰기</Button2>
          </div>
        </div>

        {/* 게시판 목록 */}
        <Card2>
          <CardContent className="p-0">
            <div className="w-full">
              <Table2>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-4">No</TableHead>
                    <TableHead>작성자</TableHead>
                    <TableHead>타입</TableHead>
                    <TableHead>제목</TableHead>
                    <TableHead>내용</TableHead>
                    <TableHead>생성일</TableHead>
                    <TableHead>수정일</TableHead>
                    <TableHead>해시태그</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedRows.map((customer, index) => (
                    <TableRow
                      key={customer.id}
                      className="cursor-pointer"
                      onClick={() => {
                        const targetPath =
                          projectId && nodeId
                            ? `/projects/${projectId}/nodes/${nodeId}/posts/${customer.id}`
                            : `/projectpost/${customer.id}`;
                        navigate(targetPath, {
                          state: { post: customer },
                        });
                      }}
                    >
                        {/* No (전체 인덱스 유지) */}
                        <TableCell className="px-6 py-2 whitespace-nowrap">
                          {indexOfFirstItem + index + 1}
                        </TableCell>

                        {/* 작성자 */}
                        <TableCell className="px-3 py-2 whitespace-nowrap">
                          <div
                              className="w-[80px] truncate"
                              title={customer.customerName}
                          >
                            {customer.customerName}
                          </div>
                        </TableCell>

                        {/* 타입 */}
                        <TableCell className="px-3 py-2 whitespace-nowrap">
                          {customer.type}
                        </TableCell>

                        {/* 제목 (말줄임표) */}
                        <TableCell className="px-3 py-2">
                          <div
                              className="block"
                              style={{
                                width: "200px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={customer.title}
                          >
                            {customer.title}
                          </div>
                        </TableCell>

                        {/* 내용 (말줄임표) */}
                        <TableCell className="px-3 py-2">
                          <div
                              className="block"
                              style={{
                                width: "260px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={customer.content}
                          >
                            {customer.content}
                          </div>
                        </TableCell>

                        {/* 생성일 */}
                        <TableCell className="px-3 py-2 whitespace-nowrap">
                          {new Date(customer.createdDate).toLocaleDateString(
                              "ko-KR"
                          )}
                        </TableCell>

                        {/* 수정일 */}
                        <TableCell className="px-3 py-2 whitespace-nowrap">
                          {new Date(customer.updatedDate).toLocaleDateString(
                              "ko-KR"
                          )}
                        </TableCell>

                        {/* 해시태그 */}
                        <TableCell className="px-3 py-2 whitespace-nowrap">
                          <Badge2 variant="outline">{customer.hashtag}</Badge2>
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table2>
            </div>
          </CardContent>
        </Card2>

        {/* 페이징 영역 */}
        {filteredCustomers.length > 0 && (
            <div className="flex items-center justify-center gap-2">
              <Button2
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
              >
                {"<"}
              </Button2>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button2
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button2>
              ))}

              <Button2
                  variant="outline"
                  size="sm"
                  onClick={() =>
                      setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
              >
                {">"}
              </Button2>
            </div>
        )}

        {/* Empty State */}
        {filteredCustomers.length === 0 && searchTerm && (
            <Card2>
              <CardContent className="text-center py-8">
                <div className="text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2" />
                  <p>"{searchTerm}" 에 대한 검색 결과가 없습니다.</p>
                  <Button2
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("");
                        setCurrentPage(1);
                      }}
                      className="mt-2"
                  >
                    전체 데이터 보기
                  </Button2>
                </div>
              </CardContent>
            </Card2>
        )}
      </div>
  );
}
