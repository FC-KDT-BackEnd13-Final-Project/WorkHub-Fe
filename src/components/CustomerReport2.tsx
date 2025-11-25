import { useState } from "react";
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
];

export function CustomerReport2() {
  const [searchTerm, setSearchTerm] = useState("");
  const [customers] = useState<Customer[]>(mockCustomers);

  const filteredCustomers = customers.filter((customer) => {
    const term = searchTerm.toLowerCase();
    return (
        customer.customerName.toLowerCase().includes(term) ||
        customer.title.toLowerCase().includes(term) ||
        customer.content.toLowerCase().includes(term)
    );
  });

  const rows = filteredCustomers.length > 0 ? filteredCustomers : customers;

  return (
      <div className="w-full max-w-[1800px] mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input2
                  id="search"
                  style={{ paddingLeft: "2.5rem"}}
                  placeholder="검색어를 입력하세요."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button2 className="flex items-center gap-2">검색</Button2>
            <Button2 className="flex items-center gap-2">글쓰기</Button2>
          </div>
        </div>

        {/* Data Table2 */}
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
                  {rows.map((customer, index) => (
                      <TableRow key={customer.id}>
                        {/* No */}
                        <TableCell className="px-6 py-2 whitespace-nowrap">
                          {index + 1}
                        </TableCell>

                        {/* 작성자 */}
                        <TableCell className="px-3 py-2 whitespace-nowrap">
                          <div className="w-[80px] truncate" title={customer.customerName}>
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
                          {new Date(customer.createdDate).toLocaleDateString("ko-KR")}
                        </TableCell>

                        {/* 수정일 */}
                        <TableCell className="px-3 py-2 whitespace-nowrap">
                          {new Date(customer.updatedDate).toLocaleDateString("ko-KR")}
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

        {/* Empty State */}
        {filteredCustomers.length === 0 && searchTerm && (
            <Card2>
              <CardContent className="text-center py-8">
                <div className="text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2" />
                  <p>"{searchTerm}" 에 대한 검색 결과가 없습니다.</p>
                  <Button2
                      variant="outline"
                      onClick={() => setSearchTerm("")}
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
