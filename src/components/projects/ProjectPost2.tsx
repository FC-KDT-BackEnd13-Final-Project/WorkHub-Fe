import { Fragment, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Card2, CardContent } from "../ui/card2";
import {
  Table2,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table2";
import { Input2 } from "../ui/input2";
import { Button2 } from "../ui/button2";
import { RichTextDemo } from "../RichTextDemo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { CornerDownRight, Search } from "lucide-react";
import {
  loadRepliesForPost,
  type PostReplyItem,
} from "../../utils/postRepliesStorage";
import { typeBadgeStyles } from "./PostCard";
import {
  mockProjectPosts,
  type ProjectPostSummary,
} from "../../data/mockProjectPosts";
import {
  calculateTotalPages,
  clampPage,
  paginate,
} from "../../utils/pagination";
import { PaginationControls } from "../common/PaginationControls";

type Customer = ProjectPostSummary;

// 타입/색상 관련 타입
type PostType = Customer["type"]; // "공지" | "질문" | "일반"
type TypeFilter = "all" | PostType;

type StatusStyle = {
  background: string;
  text: string;
  border: string;
};

const replyTypeStyle: StatusStyle = {
  background: "#F1F5F9",
  text: "#0F172A",
  border: "#E2E8F0",
};

// 공지 / 질문 / 일반 색상 매핑
const statusStyles: Record<PostType, StatusStyle> = {
  공지: {
    background: typeBadgeStyles["공지"].backgroundColor,
    text: typeBadgeStyles["공지"].color,
    border: typeBadgeStyles["공지"].borderColor,
  },
  질문: {
    background: typeBadgeStyles["질문"].backgroundColor,
    text: typeBadgeStyles["질문"].color,
    border: typeBadgeStyles["질문"].borderColor,
  },
  일반: {
    background: typeBadgeStyles["일반"].backgroundColor,
    text: typeBadgeStyles["일반"].color,
    border: typeBadgeStyles["일반"].borderColor,
  },
};

const stripHtml = (value: string) =>
    value
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/\s+/g, " ")
        .trim();

const truncatePlainText = (value: string, limit = 50) => {
  if (!value) return "";
  const chars = Array.from(value);
  if (chars.length <= limit) {
    return value;
  }
  return `${chars.slice(0, limit).join("")}...`;
};

const formatDateOnly = (value: string) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
  }

  const dateMatch = value.match(/(\d{4})[\.\s년]+(\d{1,2})[\.\s월]+(\d{1,2})/);
  if (dateMatch) {
    const [, y, m, d] = dateMatch;
    return `${y}.${m.padStart(2, "0")}.${d.padStart(2, "0")}`;
  }

  const markerIndex = value.search(/오전|오후/i);
  const sliced = markerIndex !== -1 ? value.slice(0, markerIndex) : value;
  const normalized = sliced.replace(/\s+/g, " ").replace(/\.$/, "").trim();
  return normalized;
};

const formatReplyDate = (value: string) => formatDateOnly(value);
const formatPostDate = (value: string) => formatDateOnly(value);

// Mock data
const mockCustomers: Customer[] = mockProjectPosts;

export function ProjectPost2() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [customers] = useState<Customer[]>(mockCustomers);
  const [isWriting, setIsWriting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId, nodeId } =
      useParams<{ projectId?: string; nodeId?: string }>();

  const navigateToDetail = (post: Customer, reply?: PostReplyItem) => {
    const targetPath =
        projectId && nodeId
            ? `/projects/${projectId}/nodes/${nodeId}/posts/${post.id}`
            : `/projectpost/${post.id}`;
    navigate(targetPath, {
      state: reply ? { post, reply, isReplyView: true } : { post },
    });
  };

  // 검색 + 타입 필터
  const filteredCustomers = customers.filter((customer) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesType = typeFilter === "all" || customer.type === typeFilter;

    if (!term) return matchesType;

    const title = customer.title?.toLowerCase() ?? "";
    const content = customer.content?.toLowerCase() ?? "";
    const name = customer.customerName?.toLowerCase() ?? "";

    return (
        matchesType &&
        (name.includes(term) || title.includes(term) || content.includes(term))
    );
  });

  // 페이징 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;

  const totalPages = calculateTotalPages(
      filteredCustomers.length,
      itemsPerPage
  );
  const paginatedRows = paginate(filteredCustomers, currentPage, itemsPerPage);

  useEffect(() => {
    setCurrentPage((prev) => clampPage(prev, totalPages));
  }, [totalPages]);

  // location이 바뀔 때마다 다시 렌더링 → localStorage에서 최신 답글 읽어오기
  useEffect(() => {
    // 의도적으로 아무것도 안 해도 됨.
    // location이 바뀌면 컴포넌트가 다시 그려지고,
    // 그 때마다 loadRepliesForPost로 localStorage를 새로 읽는다.
  }, [location.key]);

  // isWriting 상태가 true일 때 글쓰기 UI
  if (isWriting) {
    return (
        <div className="w-full max-w-[1800px] mx-auto p-6 space-y-6">
          <div className="flex flex-col gap-4">
            <RichTextDemo
                showTypeSelector
                actionButtons={
                  <div className="flex items-center gap-2">
                    <Button2 variant="outline" onClick={() => setIsWriting(false)}>
                      취소
                    </Button2>
                    <Button2 onClick={() => setIsWriting(false)}>등록</Button2>
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
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm md:flex-row md:items-center">
          <Input2
              id="search"
              placeholder="검색어를 입력하세요"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="md:flex-1"
          />

          {/* 타입 필터 Select */}
          <Select
              value={typeFilter}
              onValueChange={(value) => setTypeFilter(value as TypeFilter)}
          >
            <SelectTrigger className="h-9 rounded-md border border-border bg-input-background px-3 py-1 md:w-52">
              <SelectValue placeholder="모든 타입" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="공지">공지</SelectItem>
              <SelectItem value="질문">질문</SelectItem>
              <SelectItem value="일반">일반</SelectItem>
            </SelectContent>
          </Select>

          <Button2
              className="h-9 px-4 text-sm md:w-auto"
              onClick={() => setIsWriting(true)}
          >
            문의 작성
          </Button2>
        </div>

        {/* 게시판 목록 */}
        <Card2 className="overflow-hidden">
          <CardContent className="p-0">
            <div className="w-full">
              <Table2>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-2 w-[56px] text-center">No</TableHead>
                    <TableHead>작성자</TableHead>
                    <TableHead>타입</TableHead>
                    <TableHead>제목</TableHead>
                    <TableHead>내용</TableHead>
                    <TableHead>생성일</TableHead>
                    <TableHead>수정일</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedRows.map((customer, index) => {
                    const statusStyle = statusStyles[customer.type];
                    // 이 글에 대한 답글들 localStorage에서 바로 읽기
                    const replies = loadRepliesForPost(customer.id) ?? [];
                    const normalizedContent = stripHtml(customer.content);
                    const truncatedTitle = truncatePlainText(customer.title, 15);
                    const truncatedContent = truncatePlainText(normalizedContent, 50);

                    return (
                        <Fragment key={customer.id}>
                          <TableRow
                              className="cursor-pointer"
                              onClick={() => navigateToDetail(customer)}
                          >
                            {/* No (전체 인덱스 유지) */}
                            <TableCell className="px-2 py-2 text-center whitespace-nowrap">
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

                            {/* 타입 - 색 배지 */}
                            <TableCell className="px-3 py-2 whitespace-nowrap">
                          <span
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border"
                              style={{
                                backgroundColor: statusStyle.background,
                                color: statusStyle.text,
                                borderColor: statusStyle.border,
                              }}
                          >
                            {customer.type}
                          </span>
                            </TableCell>

                            {/* 제목 (말줄임표) */}
                            <TableCell className="px-3 py-2 whitespace-normal">
                              <div className="w-[200px]" title={customer.title}>
                                {truncatedTitle}
                              </div>
                            </TableCell>

                            {/* 내용 (말줄임표) */}
                            <TableCell className="px-3 py-2 whitespace-normal">
                              <div className="w-[260px] truncate" title={normalizedContent}>
                                {truncatedContent}
                              </div>
                            </TableCell>

                            {/* 생성일 */}
                            <TableCell className="px-3 py-2 whitespace-nowrap">
                              {formatPostDate(customer.createdDate)}
                            </TableCell>

                            {/* 수정일 */}
                            <TableCell className="px-3 py-2 whitespace-nowrap">
                              {formatPostDate(customer.updatedDate)}
                            </TableCell>
                          </TableRow>

                          {/* 답글 리스트 (있을 때만) */}
                          {replies.length > 0 &&
                              replies.map((reply) => {
                                const formattedCreatedDate =
                                    formatReplyDate(reply.createdAt) || reply.createdAt;
                                const formattedUpdatedDate =
                                    formatReplyDate(
                                        reply.updatedAt || reply.createdAt
                                    ) ||
                                    reply.updatedAt ||
                                    reply.createdAt;

                                return (
                                    <TableRow
                                        key={`${customer.id}-${reply.id}`}
                                        className="bg-muted/20 cursor-pointer"
                                        onClick={() => navigateToDetail(customer, reply)}
                                    >
                                      {/* No 자리 비워두기 */}
                                      <TableCell className="px-2 py-2" />

                                      {/* 작성자 (↳ 아이콘 + 이름) */}
                                      <TableCell className="px-3 py-2 whitespace-nowrap">
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                          <CornerDownRight className="h-4 w-4 text-primary" />
                                          <span>{reply.author}</span>
                                        </div>
                                      </TableCell>

                                      {/* 타입: 답글 배지 */}
                                      <TableCell className="px-3 py-2 whitespace-nowrap">
                                <span
                                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border"
                                    style={{
                                      backgroundColor: replyTypeStyle.background,
                                      color: replyTypeStyle.text,
                                      borderColor: replyTypeStyle.border,
                                    }}
                                >
                                  답글
                                </span>
                                      </TableCell>

                                      {/* 제목 */}
                                      <TableCell className="px-3 py-2">
                                        <div
                                            className="block"
                                            style={{
                                              width: "200px",
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              whiteSpace: "nowrap",
                                            }}
                                            title={reply.title || "무제 답글"}
                                        >
                                          {reply.title || "무제 답글"}
                                        </div>
                                      </TableCell>

                                      {/* 내용 */}
                                      <TableCell className="px-3 py-2">
                                        <div
                                            className="block"
                                            style={{
                                              width: "260px",
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              whiteSpace: "nowrap",
                                            }}
                                            title={
                                                stripHtml(reply.content || "") || "내용 없음"
                                            }
                                        >
                                          {stripHtml(reply.content || "") || "내용 없음"}
                                        </div>
                                      </TableCell>

                                      {/* 생성일 / 수정일 */}
                                      <TableCell className="px-3 py-2 whitespace-nowrap text-sm">
                                        {formattedCreatedDate}
                                      </TableCell>
                                      <TableCell className="px-3 py-2 whitespace-nowrap text-sm">
                                        {formattedUpdatedDate}
                                      </TableCell>
                                    </TableRow>
                                );
                              })}
                        </Fragment>
                    );
                  })}
                </TableBody>
              </Table2>
            </div>
          </CardContent>
        </Card2>

        {/* 페이징 영역 */}
        {filteredCustomers.length > 0 && (
            <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                className="mt-4"
            />
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
