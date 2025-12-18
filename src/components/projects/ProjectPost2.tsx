import { Fragment, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
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
import { typeBadgeStyles } from "./PostCard";
import { clampPage } from "@/utils/pagination";
import { PaginationControls } from "../common/PaginationControls";
import { createPost, fetchPostThreads, flattenPostReplies, mapLabelToPostType, mapPostTypeToLabel } from "@/lib/posts";
import type { PostThreadResponse } from "@/types/post";
import type { RichTextDraft } from "../RichTextDemo";

// 타입/색상 관련 타입
type PostType = "공지" | "질문" | "일반";
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

import { stripHtml, truncatePlainText } from "@/utils/text";

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

type ThreadRow = {
  id: string;
  customerName: string;
  type: PostType;
  title: string;
  content: string;
  createdDate: string;
  updatedDate: string;
};

const DEFAULT_POST_IP = "0.0.0.0";

const dataUrlToFile = (dataUrl: string, fileName: string) => {
  const [header, encoded] = dataUrl.split(",");
  const mimeMatch = /data:(.*?);base64/.exec(header ?? "");
  const mime = mimeMatch?.[1] ?? "application/octet-stream";
  const binary = atob(encoded ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], fileName, { type: mime });
};

export function ProjectPost2() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [threads, setThreads] = useState<PostThreadResponse[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isWriting, setIsWriting] = useState(false);
  const [draft, setDraft] = useState<RichTextDraft | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId, nodeId } =
      useParams<{ projectId?: string; nodeId?: string }>();

  const navigateToDetail = (postId: string, replyId?: string) => {
    const targetPath =
        projectId && nodeId
            ? `/projects/${projectId}/nodes/${nodeId}/posts/${postId}`
            : `/projectpost/${postId}`;
    navigate(targetPath, {
      state: replyId ? { replyId, isReplyView: true } : undefined,
    });
  };

  // 페이징 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;

  const paginatedRows = useMemo(() => {
    return threads.map((thread) => {
      const label = mapPostTypeToLabel(thread.postType);
      return {
        id: String(thread.postId),
        customerName: "알 수 없음",
        type: label,
        title: thread.title,
        content: thread.contentPreview,
        createdDate: thread.createdAt,
        updatedDate: thread.createdAt,
      } satisfies ThreadRow;
    });
  }, [threads]);

  useEffect(() => {
    setCurrentPage((prev) => clampPage(prev, totalPages));
  }, [totalPages]);

  // location이 바뀔 때마다 다시 렌더링
  useEffect(() => {
    // 의도적으로 아무것도 안 해도 됨.
    // location이 바뀌면 컴포넌트가 다시 그려지고,
  }, [location.key]);

  useEffect(() => {
    if (!projectId || !nodeId) return;
    setLoading(true);
    const requestType = typeFilter === "all" ? undefined : mapLabelToPostType(typeFilter);
    fetchPostThreads({
      projectId,
      nodeId,
      keyword: searchTerm.trim() || undefined,
      postType: requestType,
      page: currentPage - 1,
      size: itemsPerPage,
    })
      .then((response) => {
        setThreads(response.posts ?? []);
        setTotalPages(Math.max(response.totalPages ?? 1, 1));
        setFetchError(null);
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "게시글을 불러오는 데 실패했습니다.";
        setFetchError(message);
        toast.error(message);
      })
      .finally(() => setLoading(false));
  }, [currentPage, nodeId, projectId, refreshKey, searchTerm, typeFilter]);

  // isWriting 상태가 true일 때 글쓰기 UI
  if (isWriting) {
    return (
        <div className="w-full max-w-[1800px] mx-auto p-6 space-y-6">
          <div className="flex flex-col gap-4">
            <RichTextDemo
                showTypeSelector
                onChange={setDraft}
                actionButtons={
                  <div className="flex items-center gap-2">
                    <Button2 variant="outline" onClick={() => setIsWriting(false)}>
                      취소
                    </Button2>
                    <Button2
                      onClick={async () => {
                        if (!projectId || !nodeId) {
                          toast.error("프로젝트 정보를 확인할 수 없습니다.");
                          return;
                        }
                        if (!draft || (!draft.title.trim() && !draft.content.trim())) {
                          toast.error("제목 또는 내용을 입력해주세요.");
                          return;
                        }
                        try {
                          const files = (draft.attachments ?? [])
                            .filter((file) => file.dataUrl)
                            .map((file) => dataUrlToFile(file.dataUrl, file.name));
                          await createPost({
                            projectId,
                            nodeId,
                            payload: {
                              title: draft.title.trim(),
                              content: draft.content.trim(),
                              postType: mapLabelToPostType(draft.type),
                              postIp: DEFAULT_POST_IP,
                              links: draft.links?.map((link) => ({
                                url: link.url,
                                description: link.description,
                              })),
                            },
                            files,
                          });
                          toast.success("게시글이 등록되었습니다.");
                          setIsWriting(false);
                          setDraft(null);
                          setCurrentPage(1);
                          setRefreshKey((prev) => prev + 1);
                        } catch (error) {
                          const message = error instanceof Error ? error.message : "게시글 등록에 실패했습니다.";
                          toast.error(message);
                        }
                      }}
                    >
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
      <div className="w-full max-w-[1800px] mx-auto px-0 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm md:flex-row md:flex-nowrap md:items-center md:justify-between">
          <Input2
              id="search"
              placeholder="검색어를 입력하세요"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-input-background px-3 py-1 text-base transition-[color,box-shadow] outline-none md:flex-1 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          />

          <div className="flex w-full items-center gap-3 md:w-auto">
            {/* 타입 필터 Select */}
            <Select
                value={typeFilter}
                onValueChange={(value) => {
                  setTypeFilter(value as TypeFilter);
                  setCurrentPage(1);
                }}
            >
              <SelectTrigger className="border-input data-[placeholder]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-9 flex-1 min-w-0 rounded-md border bg-input-background px-3 py-1 text-sm outline-none md:w-52 md:flex-none focus-visible:ring-[3px]">
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
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground hover:bg-primary/90 py-2 has-[>svg]:px-3 h-9 px-4 text-sm flex-none min-w-[120px] md:w-auto"
                onClick={() => setIsWriting(true)}
            >
              문의 작성
            </Button2>
          </div>
        </div>
        {/* 모바일 카드 */}
        <div className="md:hidden space-y-3 rounded-2xl border border-white/70 bg-white/98 p-4 shadow-sm">
          <div className="grid gap-3">
            {loading && (
                <div className="col-span-full text-center text-muted-foreground py-8">
                  게시글을 불러오는 중입니다...
                </div>
            )}
            {!loading && paginatedRows.length === 0 && (
                <div className="col-span-full text-center text-muted-foreground py-8">
                  조건에 맞는 게시글이 없습니다.
                </div>
            )}
            {!loading &&
                paginatedRows.length > 0 &&
                    paginatedRows.map((customer) => {
                      const normalizedContent = stripHtml(customer.content);
                      const statusStyle = statusStyles[customer.type];
                      return (
                          <div
                              key={customer.id}
                              className="rounded-xl border border-white/70 bg-white/95 p-4 shadow-sm"
                          role="button"
                          tabIndex={0}
                          onClick={() => navigateToDetail(customer.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              navigateToDetail(customer.id);
                            }
                          }}
                          >
                        <div className="flex flex-col space-y-2">
                          <span
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-sm font-medium border self-start"
                              style={{
                                backgroundColor: statusStyle.background,
                                color: statusStyle.text,
                                borderColor: statusStyle.border,
                              }}
                          >
                            {customer.type}
                          </span>
                          <p className="text-sm font-medium text-foreground">{customer.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {normalizedContent || "내용이 없습니다."}
                          </p>
                        </div>
                        <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-slate-400">작성자</span>
                            <span className="text-right font-medium text-foreground">
                              {customer.customerName}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-slate-400">생성일</span>
                            <span>{formatPostDate(customer.createdDate)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-slate-400">수정일</span>
                            <span>{formatPostDate(customer.updatedDate)}</span>
                          </div>
                        </div>
                      </div>
                  );
                })}
          </div>
        </div>

        {/* 게시판 목록 - 데스크톱 */}
        <div className="hidden md:block">
          <Card2 className="text-card-foreground flex flex-col gap-6 rounded-2xl border border-white/70 bg-white/90 shadow-sm backdrop-blur overflow-hidden">
            <CardContent className="p-0">
              <div className="w-full">
                <Table2>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-foreground h-10 align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] px-2 w-[56px] text-center">
                        No
                      </TableHead>
                      <TableHead className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]">
                        작성자
                      </TableHead>
                      <TableHead className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]">
                        타입
                      </TableHead>
                      <TableHead className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]">
                        제목
                      </TableHead>
                      <TableHead className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]">
                        내용
                      </TableHead>
                      <TableHead className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]">
                        생성일
                      </TableHead>
                      <TableHead className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]">
                        수정일
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {paginatedRows.map((customer, index) => {
                      const statusStyle = statusStyles[customer.type];
                      const normalizedContent = stripHtml(customer.content);
                      const truncatedTitle = truncatePlainText(customer.title, 15);
                      const truncatedContent = truncatePlainText(normalizedContent, 50);
                      const thread = threads.find((item) => String(item.postId) === customer.id);
                      const replies = thread ? flattenPostReplies(thread.replies ?? []) : [];

                      return (
                          <Fragment key={customer.id}>
                            <TableRow
                                className="cursor-pointer"
                                onClick={() => navigateToDetail(customer.id)}
                            >
                              {/* No (전체 인덱스 유지) */}
                              <TableCell className="p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] px-2 py-2 text-center">
                                {indexOfFirstItem + index + 1}
                              </TableCell>

                              {/* 작성자 */}
                              <TableCell className="p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] px-3 py-2 whitespace-nowrap">
                                <div
                                    className="w-[80px] truncate"
                                    title={customer.customerName}
                                >
                                  {customer.customerName}
                                </div>
                              </TableCell>

                              {/* 타입 - 색 배지 */}
                              <TableCell className="p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] px-3 py-2 whitespace-nowrap">
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
                              <TableCell className="p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] px-3 py-2 whitespace-normal">
                                <div className="w-[200px]" title={customer.title}>
                                  {truncatedTitle}
                                </div>
                              </TableCell>

                              {/* 내용 (말줄임표) */}
                              <TableCell className="p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] px-3 py-2 whitespace-normal">
                                <div className="w-[260px] truncate" title={normalizedContent}>
                                  {truncatedContent}
                                </div>
                              </TableCell>

                              {/* 생성일 */}
                              <TableCell className="p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] px-3 py-2 whitespace-nowrap">
                                {formatPostDate(customer.createdDate)}
                              </TableCell>

                              {/* 수정일 */}
                              <TableCell className="p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] px-3 py-2 whitespace-nowrap">
                                {formatPostDate(customer.updatedDate)}
                              </TableCell>
                            </TableRow>

                            {/* 답글 리스트 (있을 때만) */}
                            {replies.length > 0 &&
                                replies.map((reply) => {
                                  const formattedCreatedDate =
                                      formatReplyDate(reply.createdAt) || reply.createdAt;
                                  const formattedUpdatedDate =
                                      formatReplyDate(reply.createdAt) || reply.createdAt;

                                  return (
                                      <TableRow
                                          key={`${customer.id}-${reply.postId}`}
                                          className="bg-muted/20 cursor-pointer"
                                          onClick={() => navigateToDetail(customer.id, String(reply.postId))}
                                      >
                                        {/* No 자리 비워두기 */}
                                        <TableCell className="px-2 py-2" />

                                        {/* 작성자 (↳ 아이콘 + 이름) */}
                                        <TableCell className="px-3 py-2 whitespace-nowrap">
                                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <CornerDownRight className="h-4 w-4 text-primary" />
                                            <span>답글</span>
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
                                                  stripHtml(reply.contentPreview || "") || "내용 없음"
                                              }
                                          >
                                            {stripHtml(reply.contentPreview || "") || "내용 없음"}
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
        </div>

        {/* 페이징 영역 */}
        {totalPages > 1 && (
            <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                className="mt-4"
            />
        )}

        {/* Empty State */}
        {!loading && paginatedRows.length === 0 && searchTerm && (
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
        {fetchError && !searchTerm && (
            <div className="text-center py-8 text-sm text-red-600">
              {fetchError}
            </div>
        )}
      </div>
  );
}
