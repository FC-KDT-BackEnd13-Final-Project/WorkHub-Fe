import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card2, CardContent } from "../../components/ui/card2";
import { Input2 } from "../../components/ui/input2";
import { Button2 } from "../../components/ui/button2";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import {
  Table2,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table2";
import { RichTextDemo } from "../../components/RichTextDemo";
import { supportTickets } from "../../data/supportTickets";

// 프로젝트별 CS 문의 목록과 작성 폼을 렌더링하는 페이지
export function SupportPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId?: string }>();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "notice" | "question" | "general">("all");
  const [isWriting, setIsWriting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 8;

  const filteredTickets = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return supportTickets.filter(
      (ticket) =>
        (typeFilter === "all" || ticket.type === typeFilter) &&
        (ticket.title.toLowerCase().includes(term) ||
          ticket.content.toLowerCase().includes(term) ||
          ticket.customerName.toLowerCase().includes(term))
    );
  }, [searchTerm, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / ITEMS_PER_PAGE));
  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTickets.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTickets, currentPage]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight">CS 문의</h1>
        <p className="mt-2 text-muted-foreground">프로젝트 관련 문의를 확인하세요.</p>
      </div>
      {!isWriting && (
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm md:flex-row md:items-center">
          <Input2
            value={searchInput}
            onChange={(event) => {
              const value = event.target.value;
              setSearchInput(value);
              setSearchTerm(value);
              goToPage(1);
            }}
            placeholder="검색어를 입력하세요"
            className="md:flex-1"
          />
          <Select
            value={typeFilter}
            onValueChange={(value) => {
              setTypeFilter(value as typeof typeFilter);
              goToPage(1);
            }}
          >
            <SelectTrigger className="h-9 rounded-md border border-border bg-input-background px-3 py-1 md:w-52">
              <SelectValue placeholder="전체 상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="notice">공지</SelectItem>
              <SelectItem value="question">질문</SelectItem>
              <SelectItem value="general">일반</SelectItem>
            </SelectContent>
          </Select>
          <Button2 className="h-9 px-4 text-sm md:w-auto" onClick={() => setIsWriting(true)}>
            문의 작성
          </Button2>
        </div>
      )}
      {isWriting ? (
        <div className="w-full max-w-[1800px] mx-auto p-6 space-y-6">
          <div className="flex flex-col gap-4">
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
        </div>
      ) : (
        <Card2>
          <CardContent className="space-y-6">
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTickets.map((ticket, index) => (
                  <TableRow
                    key={ticket.id}
                    className="cursor-pointer"
                    onClick={() =>
                      navigate(`/projects/${projectId ?? "project"}/nodes/support/${ticket.id}`, {
                        state: { post: ticket },
                      })
                    }
                  >
                    <TableCell className="px-6 py-2 whitespace-nowrap">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </TableCell>
                    <TableCell className="px-3 py-2 whitespace-nowrap">{ticket.customerName}</TableCell>
                    <TableCell className="px-3 py-2 whitespace-nowrap">{ticket.type}</TableCell>
                    <TableCell className="px-3 py-2">
                      <div className="w-[200px] truncate" title={ticket.title}>
                        {ticket.title}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <div className="w-[260px] truncate" title={ticket.content}>
                        {ticket.content}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2 whitespace-nowrap">{ticket.createdDate}</TableCell>
                    <TableCell className="px-3 py-2 whitespace-nowrap">{ticket.updatedDate}</TableCell>
                  </TableRow>
                ))}
                {filteredTickets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                      조건에 맞는 문의가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table2>
          </CardContent>
        </Card2>
      )}
      {!isWriting && filteredTickets.length > 0 && (
        <div className="flex flex-col items-center gap-2 border-t pt-4 text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            <Button2
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="이전 페이지"
            >
              {"<"}
            </Button2>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <Button2
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => goToPage(page)}
              >
                {page}
              </Button2>
            ))}
            <Button2
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="다음 페이지"
            >
              {">"}
            </Button2>
          </div>
        </div>
      )}
    </div>
  );
}
