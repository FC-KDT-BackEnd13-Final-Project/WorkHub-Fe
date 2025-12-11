import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card2, CardContent } from "../../components/ui/card2";
import { Input2 } from "../../components/ui/input2";
import { Button2 } from "../../components/ui/button2";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table2,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table2";
import { RichTextDemo } from "../../components/RichTextDemo";
import {
  supportTickets,
  supportTicketStatusLabel,
  type SupportTicketStatus,
} from "../../data/supportTickets";
import { calculateTotalPages, paginate, clampPage } from "../../utils/pagination";
import { PageHeader } from "../../components/common/PageHeader";
import { FilterToolbar } from "../../components/common/FilterToolbar";
import { PaginationControls } from "../../components/common/PaginationControls";
import { CornerDownRight } from "lucide-react";
import { loadRepliesForPost, type PostReplyItem } from "../../utils/postRepliesStorage";
import { typeBadgeStyles } from "../../components/projects/PostCard";
import {
  loadSupportStatusMap,
  SUPPORT_STATUS_UPDATED_EVENT,
} from "../../utils/supportTicketStatusStorage";

// SupportTicket 타입 재사용
type Ticket = (typeof supportTickets)[number];

type StatusStyle = {
  background: string;
  text: string;
  border: string;
};

// 답글 배지 색상
const replyTypeStyle: StatusStyle = {
  background: "#F1F5F9",
  text: "#0F172A",
  border: "#E2E8F0",
};

const statusStyles: Record<SupportTicketStatus, StatusStyle> = {
  RECEIVED: {
    background: typeBadgeStyles["접수"].backgroundColor,
    text: typeBadgeStyles["접수"].color,
    border: typeBadgeStyles["접수"].borderColor,
  },
  IN_PROGRESS: {
    background: typeBadgeStyles["처리중"].backgroundColor,
    text: typeBadgeStyles["처리중"].color,
    border: typeBadgeStyles["처리중"].borderColor,
  },
  COMPLETED: {
    background: typeBadgeStyles["완료"].backgroundColor,
    text: typeBadgeStyles["완료"].color,
    border: typeBadgeStyles["완료"].borderColor,
  },
};

const stripHtml = (value: string) =>
    value
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/\s+/g, " ")
        .trim();

const formatDateOnly = (value: string) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}.${m}.${d}`;
  }
  return value;
};

const formatReplyDate = (value: string) => formatDateOnly(value);

// SupportPage 본문
export function SupportPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId?: string }>();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SupportTicketStatus>("all");
  const [isWriting, setIsWriting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, SupportTicketStatus>>({});

  const ITEMS_PER_PAGE = 8;

  // 검색 + 필터
  const effectiveTickets = useMemo(
      () =>
          supportTickets.map((ticket) => ({
            ...ticket,
            status: statusOverrides[ticket.id] ?? ticket.status,
          })),
      [statusOverrides],
  );

  const filteredTickets = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return effectiveTickets.filter(
        (ticket) =>
            (statusFilter === "all" || ticket.status === statusFilter) &&
            (ticket.title.toLowerCase().includes(term) ||
                ticket.content.toLowerCase().includes(term) ||
                ticket.customerName.toLowerCase().includes(term))
    );
  }, [effectiveTickets, searchTerm, statusFilter]);

  const totalPages = calculateTotalPages(filteredTickets.length, ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage((prev) => clampPage(prev, totalPages));
  }, [totalPages]);

  useEffect(() => {
    const refreshStatusOverrides = () => {
      setStatusOverrides(loadSupportStatusMap());
    };
    refreshStatusOverrides();
    if (typeof window !== "undefined") {
      const handleUpdate = () => refreshStatusOverrides();
      window.addEventListener("focus", handleUpdate);
      window.addEventListener("storage", handleUpdate);
      window.addEventListener(
          SUPPORT_STATUS_UPDATED_EVENT,
          handleUpdate as EventListener,
      );
      return () => {
        window.removeEventListener("focus", handleUpdate);
        window.removeEventListener("storage", handleUpdate);
        window.removeEventListener(
            SUPPORT_STATUS_UPDATED_EVENT,
            handleUpdate as EventListener,
        );
      };
    }
    return undefined;
  }, []);

  const paginatedTickets = useMemo(
      () => paginate(filteredTickets, currentPage, ITEMS_PER_PAGE),
      [filteredTickets, currentPage]
  );

  const goToPage = (page: number) => setCurrentPage(clampPage(page, totalPages));

  const withStatusLabel = (ticket: Ticket) => ({
    ...ticket,
    type: supportTicketStatusLabel[ticket.status],
    ticketStatus: ticket.status,
    isOwner: true,
  });

  const navigateToDetail = (ticket: Ticket, reply?: PostReplyItem) => {
    const postPayload = withStatusLabel(ticket);
    navigate(`/projects/${projectId ?? "project"}/nodes/support/${ticket.id}`, {
      state: reply
          ? { post: postPayload, reply, isReplyView: true }
          : { post: postPayload },
    });
  };

  return (
      <div className="space-y-6">
        <PageHeader title="CS 문의" description="프로젝트 관련 문의를 확인하세요." />

        {/* 검색 / 필터 */}
        {!isWriting && (
            <FilterToolbar align="between">
              <Input2
                  value={searchInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchInput(value);
                    setSearchTerm(value);
                    goToPage(1);
                  }}
                  placeholder="검색어를 입력하세요"
                  className="md:flex-1"
              />

              <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value as SupportTicketStatus | "all");
                    goToPage(1);
                  }}
              >
                <SelectTrigger className="h-9 rounded-md border bg-input-background px-3 py-1 md:w-52">
                  <SelectValue placeholder="전체 상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="RECEIVED">접수</SelectItem>
                  <SelectItem value="IN_PROGRESS">처리중</SelectItem>
                  <SelectItem value="COMPLETED">완료</SelectItem>
                </SelectContent>
              </Select>

              <Button2 className="h-9 px-4 text-sm md:w-auto" onClick={() => setIsWriting(true)}>
                문의 작성
              </Button2>
            </FilterToolbar>
        )}

        {/* 작성 화면 */}
        {isWriting ? (
            <div className="w-full max-w-[1800px] mx-auto p-6 space-y-6">
              <RichTextDemo
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
        ) : (
            <>
              {/* 목록 */}
              <Card2 className="overflow-hidden">
                <CardContent className="p-0">
                  <Table2>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="px-2 w-[56px] text-center">No</TableHead>
                        <TableHead>작성자</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead>제목</TableHead>
                        <TableHead>내용</TableHead>
                        <TableHead>생성일</TableHead>
                        <TableHead>수정일</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {paginatedTickets.map((ticket, index) => {
                        const replies = loadRepliesForPost(ticket.id) ?? [];
                        const statusLabel = supportTicketStatusLabel[ticket.status];
                        const statusStyle = statusStyles[ticket.status];

                        return (
                            <Fragment key={ticket.id}>
                              {/* 원글 */}
                              <TableRow
                                  className="cursor-pointer"
                                  onClick={() => navigateToDetail(ticket)}
                              >
                                <TableCell className="px-2 py-2 text-center">
                                  {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                                </TableCell>

                                <TableCell className="px-3 py-2 whitespace-nowrap">
                                  {ticket.customerName}
                                </TableCell>

                                <TableCell className="px-3 py-2 whitespace-nowrap">
                            <span
                                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border"
                                style={{
                                  backgroundColor: statusStyle.background,
                                  color: statusStyle.text,
                                  borderColor: statusStyle.border,
                                }}
                            >
                              {statusLabel}
                            </span>
                                </TableCell>

                                <TableCell className="px-3 py-2">
                                  <div className="w-[200px] truncate">{ticket.title}</div>
                                </TableCell>

                                <TableCell className="px-3 py-2">
                                  <div className="w-[260px] truncate">{ticket.content}</div>
                                </TableCell>

                                <TableCell className="px-3 py-2 whitespace-nowrap">
                                  {formatDateOnly(ticket.createdDate)}
                                </TableCell>

                                <TableCell className="px-3 py-2 whitespace-nowrap">
                                  {formatDateOnly(ticket.updatedDate)}
                                </TableCell>
                              </TableRow>

                              {/* 답글 */}
                              {replies.length > 0 &&
                                  replies.map((reply) => {
                                    const created = formatReplyDate(reply.createdAt);
                                    const updated = formatReplyDate(reply.updatedAt || reply.createdAt);

                                    return (
                                        <TableRow
                                            key={`${ticket.id}-${reply.id}`}
                                            className="bg-muted/20 cursor-pointer"
                                            onClick={() => navigateToDetail(ticket, reply)}
                                        >
                                          <TableCell />
                                          <TableCell className="px-3 py-2 whitespace-nowrap">
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                              <CornerDownRight className="h-4 w-4 text-primary" />
                                              {reply.author}
                                            </div>
                                          </TableCell>

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

                                          <TableCell className="px-3 py-2">
                                            <div className="w-[200px] truncate">
                                              {reply.title || "무제 답글"}
                                            </div>
                                          </TableCell>

                                          <TableCell className="px-3 py-2">
                                            <div
                                                className="w-[260px] truncate"
                                                title={stripHtml(reply.content) || "내용 없음"}
                                            >
                                              {stripHtml(reply.content) || "내용 없음"}
                                            </div>
                                          </TableCell>

                                          <TableCell className="px-3 py-2 whitespace-nowrap text-sm">
                                            {created}
                                          </TableCell>

                                          <TableCell className="px-3 py-2 whitespace-nowrap text-sm">
                                            {updated}
                                          </TableCell>
                                        </TableRow>
                                    );
                                  })}
                            </Fragment>
                        );
                      })}

                      {filteredTickets.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                              조건에 맞는 문의가 없습니다.
                            </TableCell>
                          </TableRow>
                      )}
                    </TableBody>
                  </Table2>
                </CardContent>
              </Card2>

              <div className="flex justify-end mt-4">
                <Button2 variant="outline" onClick={() => navigate(-1)}>
                  ← 뒤로가기
                </Button2>
              </div>
            </>
        )}

        {/* 페이징 */}
        {!isWriting && filteredTickets.length > 0 && (
            <div className="flex flex-col items-center gap-2 pt-4 text-muted-foreground">
              <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
              />
            </div>
        )}
      </div>
  );
}
