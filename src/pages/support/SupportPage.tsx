import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { stripHtml, truncatePlainText } from "@/utils/text";
import { useNavigate, useParams } from "react-router-dom";
import { Card2, CardContent } from "@/components/ui/card2";
import { Input2 } from "../../components/ui/input2";
import { Button2 } from "../../components/ui/button2";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table2,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table2";
import { RichTextDemo, type RichTextDraft } from "@/components/RichTextDemo";
import {
  supportTicketStatusLabel,
  type SupportTicketStatus,
} from "@/data/supportTickets";
import { clampPage } from "@/utils/pagination";
import { PaginationControls } from "@/components/common/PaginationControls";
import { typeBadgeStyles } from "@/components/projects/PostCard";
import {
  loadSupportStatusMap,
  SUPPORT_STATUS_UPDATED_EVENT,
} from "@/utils/supportTicketStatusStorage";
import { csPostApi } from "@/lib/api";
import type { CsPostApiItem, CsPostStatus } from "@/types/csPost";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/errorMessages";
import { attachmentDraftsToFiles } from "@/utils/attachment";
import { mapCsPostFilesToAttachments } from "@/utils/csPostAttachments";
import type { AttachmentDraft } from "@/components/RichTextDemo";

// API 응답을 UI 형식으로 변환
interface Ticket {
  id: string;
  customerName: string;
  status?: SupportTicketStatus;
  title: string;
  content: string;
  createdDate: string;
  updatedDate: string;
  isOwner?: boolean;
  attachments: AttachmentDraft[];
}

const convertApiItemToTicket = (item: CsPostApiItem): Ticket => ({
  id: String(item.csPostId),
  customerName: item.userName ?? item.customerName,
  status: item.csPostStatus ?? undefined,
  title: item.title,
  content: item.content,
  createdDate: item.createdAt,
  updatedDate: item.updatedAt,
  isOwner: true,
  attachments: mapCsPostFilesToAttachments(item.files, `cs-file-${item.csPostId}`),
});

type StatusStyle = {
  background: string;
  text: string;
  border: string;
};

const createEmptyDraft = (): RichTextDraft => ({
  title: "",
  content: "",
  attachments: [],
  links: [],
  type: "질문",
});

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
  const [, setWriteDraft] = useState<RichTextDraft>(createEmptyDraft);
  const [writeEditorKey, setWriteEditorKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [writeError, setWriteError] = useState<string | null>(null);

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
      const message =
        (axios.isAxiosError(err) && err.response?.data?.message) ||
        getErrorMessage(err, "CS 게시글을 불러오는 중 오류가 발생했습니다.");
      setError(message);
      setTickets([]);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  };

  // 페이지, 검색어, 필터 변경 시 데이터 다시 가져오기
  useEffect(() => {
    void fetchCsPosts();
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

  const withStatusLabel = (ticket: Ticket) => {
    const statusLabel = ticket.status ? supportTicketStatusLabel[ticket.status] : "일반";
    return {
      ...ticket,
      type: statusLabel,
      ticketStatus: ticket.status,
      isOwner: true,
    };
  };

  const navigateToDetail = (ticket: Ticket) => {
    const postPayload = withStatusLabel(ticket);
    navigate(`/projects/${projectId ?? "project"}/nodes/support/${ticket.id}`, {
      state: { post: postPayload },
    });
  };

  const resetWriteDraft = () => {
    setWriteDraft(createEmptyDraft());
    setWriteEditorKey((prev) => prev + 1);
  };

  const handleStartWriting = () => {
    setWriteError(null);
    resetWriteDraft();
    setIsWriting(true);
  };

  const handleCancelWriting = (clear?: () => void) => {
    clear?.();
    resetWriteDraft();
    setIsWriting(false);
    setWriteError(null);
  };

  const canSubmitDraft = (draft: RichTextDraft) => {
    const hasBody = stripHtml(draft.content).length > 0;
    return Boolean(draft.title.trim() || hasBody);
  };

  const handleSubmitDraft = async (draft: RichTextDraft, clear: () => void) => {
    if (isSubmitting) return;
    if (!projectId) {
      toast.error("프로젝트 정보가 없습니다.");
      return;
    }
    if (!canSubmitDraft(draft)) {
      setWriteError("제목 또는 내용을 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setWriteError(null);
    const payload = {
      title: draft.title.trim() || "무제",
      content: draft.content,
    };

    const files = attachmentDraftsToFiles(draft.attachments);

    try {
      await csPostApi.create(projectId, payload, files);
      toast.success("CS 문의가 등록되었습니다.");
      clear();
      resetWriteDraft();
      setIsWriting(false);
      const isFirstPage = currentPage === 0;
      if (isFirstPage) {
        await fetchCsPosts();
      } else {
        setCurrentPage(0);
      }
    } catch (err) {
      const message = getErrorMessage(err, "CS 문의 등록에 실패했습니다.");
      setWriteError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <div className="space-y-4 md:space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold tracking-tight">CS 문의</h1>
          <p className="mt-2 text-muted-foreground">프로젝트 관련 문의를 확인하세요.</p>
        </div>

        {!isWriting && (
          <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm md:flex-row md:flex-nowrap md:items-center md:justify-between">
            <Input2
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearchTerm(searchInput);
                  setCurrentPage(0);
                }
              }}
              placeholder="검색어를 입력하세요"
              className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-input-background px-3 py-1 text-base transition-[color,box-shadow] outline-none md:flex-1 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            />

            <div className="flex w-full items-center gap-3 md:w-auto">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as SupportTicketStatus | "all");
                  setCurrentPage(0);
                }}
              >
                <SelectTrigger className="border-input data-[placeholder]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-9 flex-1 min-w-0 rounded-md border bg-input-background px-3 py-1 text-sm outline-none md:w-52 md:flex-none focus-visible:ring-[3px]">
                  <SelectValue placeholder="전체 상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="RECEIVED">접수</SelectItem>
                  <SelectItem value="IN_PROGRESS">처리중</SelectItem>
                  <SelectItem value="COMPLETED">완료</SelectItem>
                </SelectContent>
              </Select>

              <Button2
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground hover:bg-primary/90 py-2 has-[>svg]:px-3 h-9 px-4 text-sm flex-none min-w-[120px] md:w-auto"
                onClick={handleStartWriting}
              >
                문의 작성
              </Button2>
            </div>
          </div>
        )}

        {/* 작성 화면 */}
        {isWriting ? (
            <div className="w-full max-w-[1800px] mx-auto p-6 space-y-6">
              {writeError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {writeError}
                </div>
              )}
              <RichTextDemo
                  key={writeEditorKey}
                  onChange={(draft) => {
                    setWriteDraft(draft);
                    if (writeError) {
                      setWriteError(null);
                    }
                  }}
                  allowLinks={false}
                  actionButtons={
                    ({ clear, draft }) => (
                      <div className="flex items-center gap-2">
                        <Button2
                          variant="outline"
                          onClick={() => handleCancelWriting(clear)}
                          disabled={isSubmitting}
                        >
                          취소
                        </Button2>
                        <Button2
                          onClick={() => handleSubmitDraft(draft, clear)}
                          disabled={!canSubmitDraft(draft) || isSubmitting}
                        >
                          {isSubmitting ? "등록 중..." : "등록"}
                        </Button2>
                      </div>
                    )
                  }
              />
            </div>
        ) : (
            <div className="space-y-4">
                {/* 모바일 카드 */}
                <div className="md:hidden space-y-3 rounded-2xl border border-white/70 bg-white/98 p-4 shadow-sm">
                    <div className="grid gap-3">
                        {isLoading ? (
                            <div className="col-span-full py-8 text-center text-muted-foreground">
                                로딩 중...
                            </div>
                        ) : effectiveTickets.length === 0 ? (
                            <div className="col-span-full py-8 text-center text-muted-foreground">
                                조건에 맞는 문의가 없습니다.
                            </div>
                        ) : (
                            effectiveTickets.map((ticket) => (
                                <div
                                    key={ticket.id}
                                    className="rounded-xl border border-white/70 bg-white/95 p-4 shadow-sm"
                                    onClick={() => navigateToDetail(ticket)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") navigateToDetail(ticket);
                                    }}
                                >
                                    <div className="flex flex-col space-y-2">
                                        <p className="text-sm font-medium text-foreground">{ticket.title}</p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {stripHtml(ticket.content)}
                                        </p>
                                    </div>

                                    <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-[11px] text-slate-400">작성자</span>
                                            <span className="text-right font-medium text-foreground">
                {ticket.customerName}
              </span>
                                        </div>

                        {ticket.status && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-slate-400">상태</span>
                            <span
                              className="inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-sm font-medium"
                              style={{
                                backgroundColor: statusStyles[ticket.status].background,
                                color: statusStyles[ticket.status].text,
                                borderColor: statusStyles[ticket.status].border,
                              }}
                            >
                              {supportTicketStatusLabel[ticket.status]}
                            </span>
                          </div>
                        )}

                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-[11px] text-slate-400">생성일</span>
                                            <span>{formatDateOnly(ticket.createdDate)}</span>
                                        </div>

                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-[11px] text-slate-400">수정일</span>
                                            <span>{formatDateOnly(ticket.updatedDate)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

              {/* 에러 메시지 */}
              {error && (
                  <div className="text-center py-8 text-sm text-red-600">
                    {error}
                  </div>
              )}
              {/* 데스크톱 테이블 */}
              <div className="hidden md:block">
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
                            const statusLabel = ticket.status
                              ? supportTicketStatusLabel[ticket.status]
                              : undefined;
                            const statusStyle = ticket.status
                              ? statusStyles[ticket.status]
                              : undefined;
                            const hasStatus = Boolean(ticket.status && statusLabel && statusStyle);
                            const normalizedContent = stripHtml(ticket.content);
                            const truncatedTitle = truncatePlainText(ticket.title, 15);
                            const truncatedContent = truncatePlainText(normalizedContent, 50);

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
                                  {hasStatus && statusStyle && (
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

                                <TableCell className="px-3 py-2 whitespace-normal">
                                  <div className="w-[200px]" title={ticket.title}>
                                    {truncatedTitle}
                                  </div>
                                </TableCell>

                                <TableCell className="px-3 py-2 whitespace-normal">
                                  <div className="w-[260px] truncate" title={normalizedContent}>
                                    {truncatedContent}
                                  </div>
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
              </div>
            </div>
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
