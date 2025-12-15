import { useEffect, useMemo, useState } from "react";
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
  supportTicketStatusLabel,
  type SupportTicketStatus,
} from "../../data/supportTickets";
import { clampPage } from "../../utils/pagination";
import { PageHeader } from "../../components/common/PageHeader";
import { FilterToolbar } from "../../components/common/FilterToolbar";
import { PaginationControls } from "../../components/common/PaginationControls";
import { typeBadgeStyles } from "../../components/projects/PostCard";
import {
  loadSupportStatusMap,
  SUPPORT_STATUS_UPDATED_EVENT,
} from "../../utils/supportTicketStatusStorage";
import { csPostApi } from "../../lib/api";
import type { CsPostApiItem, CsPostStatus } from "../../types/csPost";

// API 응답을 UI 형식으로 변환
interface Ticket {
  id: string;
  customerName: string;
  status: SupportTicketStatus;
  title: string;
  content: string;
  createdDate: string;
  updatedDate: string;
  isOwner?: boolean;
}

const convertApiItemToTicket = (item: CsPostApiItem): Ticket => ({
  id: String(item.csPostId),
  customerName: item.customerName,
  status: item.csPostStatus,
  title: item.title,
  content: item.content,
  createdDate: item.createdAt,
  updatedDate: item.updatedAt,
  isOwner: true,
});

type StatusStyle = {
  background: string;
  text: string;
  border: string;
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

// SupportPage 본문
export function SupportPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId?: string }>();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SupportTicketStatus>("all");
  const [isWriting, setIsWriting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0); // 0-based for API
  const [statusOverrides, setStatusOverrides] = useState<Record<string, SupportTicketStatus>>({});

  // API 상태
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 8;

  // API 데이터 가져오기
  const fetchCsPosts = async () => {
    if (!projectId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await csPostApi.getList(projectId, {
        searchValue: searchTerm || undefined,
        csPostStatus: statusFilter === "all" ? undefined : (statusFilter as CsPostStatus),
        page: currentPage,
        size: ITEMS_PER_PAGE,
        sort: ["createdAt,DESC"],
      });

      const convertedTickets = response.content.map(convertApiItemToTicket);
      setTickets(convertedTickets);
      setTotalPages(response.totalPages);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("CS 게시글을 불러오는 중 오류가 발생했습니다.");
      }
      setTickets([]);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  };

  // 페이지, 검색어, 필터 변경 시 데이터 다시 가져오기
  useEffect(() => {
    fetchCsPosts();
  }, [projectId, currentPage, searchTerm, statusFilter]);

  // 상태 오버라이드 로드
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

  // 상태 오버라이드 적용
  const effectiveTickets = useMemo(
      () =>
          tickets.map((ticket) => ({
            ...ticket,
            status: statusOverrides[ticket.id] ?? ticket.status,
          })),
      [tickets, statusOverrides],
  );

  const goToPage = (page: number) => setCurrentPage(clampPage(page - 1, totalPages - 1)); // UI는 1-based, API는 0-based

  const withStatusLabel = (ticket: Ticket) => ({
    ...ticket,
    type: supportTicketStatusLabel[ticket.status],
    ticketStatus: ticket.status,
    isOwner: true,
  });

  const navigateToDetail = (ticket: Ticket) => {
    const postPayload = withStatusLabel(ticket);
    navigate(`/projects/${projectId ?? "project"}/nodes/support/${ticket.id}`, {
      state: { post: postPayload },
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
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setSearchTerm(searchInput);
                      setCurrentPage(0);
                    }
                  }}
                  placeholder="검색어를 입력하세요 (Enter로 검색)"
                  className="md:flex-1"
              />

              <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value as SupportTicketStatus | "all");
                    setCurrentPage(0);
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
              {/* 에러 메시지 */}
              {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
                    {error}
                  </div>
              )}

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
                      {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                              로딩 중...
                            </TableCell>
                          </TableRow>
                      ) : effectiveTickets.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                              조건에 맞는 문의가 없습니다.
                            </TableCell>
                          </TableRow>
                      ) : (
                          effectiveTickets.map((ticket, index) => {
                            const statusLabel = supportTicketStatusLabel[ticket.status];
                            const statusStyle = statusStyles[ticket.status];
                            const hasStatus = ticket.status && statusLabel && statusStyle;

                            return (
                                <TableRow
                                    key={ticket.id}
                                    className="cursor-pointer"
                                    onClick={() => navigateToDetail(ticket)}
                                >
                                  <TableCell className="px-2 py-2 text-center">
                                    {currentPage * ITEMS_PER_PAGE + index + 1}
                                  </TableCell>

                                  <TableCell className="px-3 py-2 whitespace-nowrap">
                                    {ticket.customerName}
                                  </TableCell>

                                  <TableCell className="px-3 py-2 whitespace-nowrap">
                                    {hasStatus && (
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
                                    )}
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
                            );
                          })
                      )}
                    </TableBody>
                  </Table2>
                </CardContent>
              </Card2>

            </>
        )}

        {/* 페이징 */}
        {!isWriting && !isLoading && effectiveTickets.length > 0 && (
            <div className="flex flex-col items-center gap-2 pt-4 text-muted-foreground">
              <PaginationControls
                  currentPage={currentPage + 1}
                  totalPages={totalPages}
                  onPageChange={goToPage}
              />
            </div>
        )}
      </div>
  );
}
