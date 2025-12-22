import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import logoImage from "../../../image/logo.png";
import placeholderImage from "../../../image/photo.png";
import { historyPalette, type HistoryEvent } from "../../data/historyData";
import { Users, FileText, LayoutDashboard, CheckSquare } from "lucide-react";
import { PaginationControls } from "../../components/common/PaginationControls";
import { PageHeader } from "../../components/common/PageHeader";
import { historyApi } from "@/lib/history";
import type { AdminActionType, AdminHistoryItem, AdminHistoryType } from "@/types/history";

type CategoryFilter = "user" | "post" | "project" | "checklist" | "all";
type PostFilter = "all" | "post" | "postComment" | "csPost" | "csQna";
type ProjectFilter = "all" | "projectAgency" | "projectClient" | "project" | "projectPhase";
type ChecklistFilter = "all" | "checklist" | "checklistComment";
const actionTypeLabels: Record<AdminActionType, string> = {
  CREATE: "생성",
  UPDATE: "수정",
  DELETE: "삭제",
};

const actionPaletteMap: Record<AdminActionType, HistoryEvent["type"]> = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
};

const historyTypeLabels: Record<AdminHistoryType, string> = {
  PROJECT: "프로젝트",
  PROJECT_NODE: "프로젝트 노드",
  CS_POST: "CS게시글",
  CS_QNA: "CSQNA",
  PROJECT_CLIENT_MEMBER: "프로젝트 고객사 멤버",
  PROJECT_DEV_MEMBER: "프로젝트 개발사 멤버",
  POST: "게시글",
  POST_COMMENT: "게시글 댓글",
  CHECK_LIST_ITEM: "체크리스트 아이템",
  CHECK_LIST_ITEM_COMMENT: "체크리스트 아이템 댓글",
};

const historyCategoryMap: Record<AdminHistoryType, CategoryFilter> = {
  PROJECT: "project",
  PROJECT_NODE: "project",
  CS_POST: "post",
  CS_QNA: "post",
  PROJECT_CLIENT_MEMBER: "project",
  PROJECT_DEV_MEMBER: "project",
  POST: "post",
  POST_COMMENT: "post",
  CHECK_LIST_ITEM: "checklist",
  CHECK_LIST_ITEM_COMMENT: "checklist",
};

const historySubCategoryMap: Partial<Record<AdminHistoryType, HistoryEvent["subCategory"]>> = {
  PROJECT: "project",
  PROJECT_NODE: "projectPhase",
  CS_POST: "csPost",
  CS_QNA: "csQna",
  PROJECT_CLIENT_MEMBER: "projectClient",
  PROJECT_DEV_MEMBER: "projectAgency",
  POST: "post",
  POST_COMMENT: "postComment",
  CHECK_LIST_ITEM: "checklist",
  CHECK_LIST_ITEM_COMMENT: "checklistComment",
};

const eventActionLabels: Record<HistoryEvent["type"], string> = {
  create: "생성",
  update: "수정",
  delete: "삭제",
  move: "이동",
  hide: "숨김",
};

const formatDateTime = (value: string) => format(new Date(value), "yyyy.MM.dd HH:mm");

const mapHistoryItemToEvent = (item: AdminHistoryItem): HistoryEvent => {
  const historyLabel = historyTypeLabels[item.historyType] ?? item.historyType;
  const actionLabel = actionTypeLabels[item.actionType] ?? item.actionType;
  const paletteKey = actionPaletteMap[item.actionType] ?? "update";

  return {
    id: item.changeLogId,
    type: paletteKey,
    message: `${historyLabel}(이)가 ${actionLabel}되었습니다`,
    timestamp: formatDateTime(item.updatedAt),
    updatedAt: item.updatedAt,
    updatedBy: item.updatedBy?.userName ?? "시스템",
    createdBy: item.updatedBy?.userName ?? "",
    updatedByProfileImg: item.updatedBy?.profileImg,
    target: historyLabel,
    ipAddress: item.ipAddress,
    userAgent: item.userAgent,
    category: historyCategoryMap[item.historyType],
    subCategory: historySubCategoryMap[item.historyType],
  };
};

export function UserHistoryPage() {
  const [activeTab, setActiveTab] = useState<"user" | "post" | "project" | "checklist">("user");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [postFilter, setPostFilter] = useState<PostFilter>("all");
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>("all");
  const [checklistFilter, setChecklistFilter] = useState<ChecklistFilter>("all");
  const [historyEvents, setHistoryEvents] = useState<HistoryEvent[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const desktopInputClass =
    "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-input-background px-3 py-1 text-base transition-[color,box-shadow] outline-none md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";
  const desktopSelectTriggerClass =
    "border-input data-[placeholder]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-input-background px-3 py-1 text-sm outline-none focus-visible:ring-[3px]";

  const getInitials = (value?: string) => {
    if (!value) return "NA";
    const cleaned = value.trim();
    if (!cleaned) return "NA";
    const parts = cleaned.split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const second = parts[1]?.[0] ?? cleaned[1] ?? "";
    return (first + (second ?? "")).slice(0, 2).toUpperCase();
  };

  const isSystemActor = (name?: string) => {
    if (!name) return true;
    const normalized = name.toLowerCase();
    return ["시스템", "bot", "센터"].some((keyword) => normalized.includes(keyword.toLowerCase()));
  };
  const getActorAvatar = (name?: string, profileImg?: string | null) => {
    if (isSystemActor(name)) {
      return { src: logoImage, alt: "WorkHub 로고" };
    }
    if (profileImg) {
      return { src: profileImg, alt: name ?? "사용자" };
    }
    return { src: placeholderImage, alt: name ?? "기본 아바타" };
  };
  const renderMeta = (event: HistoryEvent) => (
    <div className="text-xs text-muted-foreground leading-relaxed space-y-0.5 break-words">
      <div>
        실행자: {event.updatedBy || "시스템"} · {formatDateTime(event.updatedAt)}
      </div>
      {event.ipAddress && <div>IP: {event.ipAddress}</div>}
      {event.userAgent && (
        <div
          className="break-all text-wrap overflow-hidden text-ellipsis"
          style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
          title={`User Agent: ${event.userAgent}`}
        >
          User Agent: {event.userAgent}
        </div>
      )}
    </div>
  );

  const fetchHistoryData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const sortParam = `updatedAt,${sortOrder === "desc" ? "DESC" : "ASC"}`;
      const params = {
        page: currentPage - 1,
        size: pageSize,
        sort: sortParam,
      };

      const resolveHistoryTypes = (): AdminHistoryType[] | null => {
        if (activeTab === "post") {
          const map: Record<PostFilter, AdminHistoryType[]> = {
            all: ["POST", "POST_COMMENT", "CS_POST", "CS_QNA"],
            post: ["POST"],
            postComment: ["POST_COMMENT"],
            csPost: ["CS_POST"],
            csQna: ["CS_QNA"],
          };
          return map[postFilter];
        }
        if (activeTab === "project") {
          const map: Record<ProjectFilter, AdminHistoryType[]> = {
            all: ["PROJECT", "PROJECT_DEV_MEMBER", "PROJECT_CLIENT_MEMBER", "PROJECT_NODE"],
            projectAgency: ["PROJECT_DEV_MEMBER"],
            projectClient: ["PROJECT_CLIENT_MEMBER"],
            project: ["PROJECT"],
            projectPhase: ["PROJECT_NODE"],
          };
          return map[projectFilter];
        }
        if (activeTab === "checklist") {
          const map: Record<ChecklistFilter, AdminHistoryType[]> = {
            all: ["CHECK_LIST_ITEM", "CHECK_LIST_ITEM_COMMENT"],
            checklist: ["CHECK_LIST_ITEM"],
            checklistComment: ["CHECK_LIST_ITEM_COMMENT"],
          };
          return map[checklistFilter];
        }
        return null;
      };

      const historyTypes = resolveHistoryTypes();

      let data: Awaited<ReturnType<typeof historyApi.getAdminHistories>>;

      if (activeTab === "user") {
        data = await historyApi.getAllAdminHistories(params);
      } else if (historyTypes && historyTypes.length > 0) {
        data = await historyApi.getHistoriesByType(historyTypes, params);
      } else {
        data = await historyApi.getAdminHistories(params);
      }

      setTotalPages(Math.max(data.totalPages ?? 1, 1));
      setHistoryEvents(data.content.map(mapHistoryItemToEvent));
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : "히스토리를 불러오지 못했습니다.";
      setError(message);
      setHistoryEvents([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, postFilter, projectFilter, checklistFilter, currentPage, pageSize, sortOrder]);

  const filteredEvents = useMemo(() => {
    let events: HistoryEvent[] = [...historyEvents];

    if (categoryFilter !== "all") {
      events = events.filter((event) => event.category === categoryFilter);
    }

    if (searchTerm.trim()) {
      const query = searchTerm.trim().toLowerCase();
      events = events.filter(
        (event) =>
          event.message.toLowerCase().includes(query) ||
          event.updatedBy.toLowerCase().includes(query) ||
          event.createdBy.toLowerCase().includes(query) ||
          (event.target?.toLowerCase().includes(query) ?? false),
      );
    }

    if (activeTab === "post" && postFilter !== "all") {
      events = events.filter((event) => event.subCategory === postFilter);
    }

    if (activeTab === "project" && projectFilter !== "all") {
      events = events.filter((event) => event.subCategory === projectFilter);
    }

    if (activeTab === "checklist" && checklistFilter !== "all") {
      events = events.filter((event) => event.subCategory === checklistFilter);
    }

    events.sort((a, b) => {
      const aDate = new Date(a.updatedAt).getTime();
      const bDate = new Date(b.updatedAt).getTime();
      return sortOrder === "desc" ? bDate - aDate : aDate - bDate;
    });

    return events;
  }, [activeTab, categoryFilter, searchTerm, postFilter, projectFilter, checklistFilter, sortOrder, historyEvents]);

  const effectiveTotalPages = searchTerm.trim()
    ? Math.max(1, Math.ceil(filteredEvents.length / pageSize))
    : totalPages;
  const paginatedEvents = filteredEvents;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, categoryFilter, searchTerm, postFilter, projectFilter, checklistFilter, sortOrder]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    fetchHistoryData();
  }, [fetchHistoryData]);

  const renderSortSelect = (className?: string, inline?: boolean) => (
    <Select value={sortOrder} onValueChange={(value: "desc" | "asc") => setSortOrder(value)}>
      <SelectTrigger
        className={`${desktopSelectTriggerClass} ${inline ? "md:w-32" : "md:w-44 md:min-w-[160px]"} min-w-0 ${className ?? ""}`}
      >
        <SelectValue placeholder="정렬 기준" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="desc">최신순</SelectItem>
        <SelectItem value="asc">오래된순</SelectItem>
      </SelectContent>
    </Select>
  );

  const renderMobileFilterLayout = (controls: ReactNode[] = []) => {
    const hasAdditional = controls.length > 0;

    return (
      <div className="flex flex-col gap-3">
        <Input
          placeholder="작업을 검색하세요"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="md:text-sm text-sm"
        />
        <div className={`flex w-full gap-3 ${hasAdditional ? "flex-row" : "flex-col"}`}>
          {controls.map((control, index) => (
            <div key={`mobile-filter-${index}`} className={`${hasAdditional ? "flex-1" : "w-full"}`}>
              {control}
            </div>
          ))}
          <div className={`${hasAdditional ? "flex-1" : "w-full"}`}>{renderSortSelect()}</div>
        </div>
      </div>
    );
  };

  const renderDesktopFiltersByTab = () => {
    switch (activeTab) {
      case "user":
        return (
          <div className="flex flex-col gap-3 md:flex-row md:flex-nowrap md:items-center md:justify-end w-full">
            <Input
              placeholder="작업을 검색하세요"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className={`${desktopInputClass} md:w-80`}
            />
            {renderSortSelect("md:shrink-0")}
          </div>
        );
      case "post":
        return (
          <div className="flex flex-col gap-3 md:flex-row md:flex-nowrap md:items-center md:justify-end w-full">
            <Input
              placeholder="작업을 검색하세요"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className={`${desktopInputClass} md:w-80`}
            />
            <Select value={postFilter} onValueChange={(value: PostFilter) => setPostFilter(value)} className="md:shrink-0">
              <SelectTrigger className={`${desktopSelectTriggerClass} min-w-[200px] md:w-48`}>
                <SelectValue placeholder="분류 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="post">게시글</SelectItem>
                <SelectItem value="postComment">게시글 댓글</SelectItem>
                <SelectItem value="csPost">CS 게시글</SelectItem>
                <SelectItem value="csQna">CS QnA</SelectItem>
              </SelectContent>
            </Select>
            {renderSortSelect("md:shrink-0")}
          </div>
        );
      case "project":
        return (
          <div className="flex flex-col gap-3 md:flex-row md:flex-nowrap md:items-center md:justify-end w-full">
            <Input
              placeholder="작업을 검색하세요"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className={`${desktopInputClass} md:w-80`}
            />
            <Select value={projectFilter} onValueChange={(value: ProjectFilter) => setProjectFilter(value)} className="md:shrink-0">
              <SelectTrigger className={`${desktopSelectTriggerClass} min-w-[200px] md:w-48`}>
                <SelectValue placeholder="분류 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="projectAgency">개발사</SelectItem>
                <SelectItem value="projectClient">고객사</SelectItem>
                <SelectItem value="project">프로젝트</SelectItem>
                <SelectItem value="projectPhase">프로젝트 단계</SelectItem>
              </SelectContent>
            </Select>
            {renderSortSelect("md:shrink-0")}
          </div>
        );
      case "checklist":
        return (
          <div className="flex flex-col gap-3 md:flex-row md:flex-nowrap md:items-center md:justify-end w-full">
            <Input
              placeholder="작업을 검색하세요"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className={`${desktopInputClass} md:w-80`}
            />
            <Select value={checklistFilter} onValueChange={(value: ChecklistFilter) => setChecklistFilter(value)} className="md:shrink-0">
              <SelectTrigger className={`${desktopSelectTriggerClass} min-w-[200px] md:w-48`}>
                <SelectValue placeholder="분류 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="checklist">체크리스트</SelectItem>
                <SelectItem value="checklistComment">체크리스트 댓글</SelectItem>
              </SelectContent>
            </Select>
            {renderSortSelect("md:shrink-0")}
          </div>
        );
      default:
        return null;
    }
  };

  const renderMobileFiltersByTab = () => {
    switch (activeTab) {
      case "user":
        return renderMobileFilterLayout();
      case "post":
        return renderMobileFilterLayout([
          <Select value={postFilter} onValueChange={(value: PostFilter) => setPostFilter(value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="분류 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="post">게시글</SelectItem>
              <SelectItem value="postComment">게시글 댓글</SelectItem>
              <SelectItem value="csPost">CS 게시글</SelectItem>
              <SelectItem value="csQna">CS QnA</SelectItem>
            </SelectContent>
          </Select>,
        ]);
      case "project":
        return renderMobileFilterLayout([
          <Select value={projectFilter} onValueChange={(value: ProjectFilter) => setProjectFilter(value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="분류 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="projectAgency">개발사</SelectItem>
              <SelectItem value="projectClient">고객사</SelectItem>
              <SelectItem value="project">프로젝트</SelectItem>
              <SelectItem value="projectPhase">프로젝트 단계</SelectItem>
            </SelectContent>
          </Select>,
        ]);
      case "checklist":
        return renderMobileFilterLayout([
          <Select value={checklistFilter} onValueChange={(value: ChecklistFilter) => setChecklistFilter(value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="분류 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="checklist">체크리스트</SelectItem>
              <SelectItem value="checklistComment">체크리스트 댓글</SelectItem>
            </SelectContent>
          </Select>,
        ]);
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-10 pt-2 md:px-0 md:pb-12">
      <PageHeader title="History" description="사용자 활동 로그를 한눈에 확인하세요." />

      <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto md:flex-none md:flex-nowrap">
          {[
            { id: "user", label: "사용자(전체)", icon: Users, category: "all" },
            { id: "post", label: "게시글", icon: FileText, category: "post" },
            { id: "project", label: "프로젝트", icon: LayoutDashboard, category: "project" },
            { id: "checklist", label: "체크리스트", icon: CheckSquare, category: "checklist" },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const paddingClass = tab.id === "user" ? "px-4 md:px-6" : "px-2 md:px-4";
            const widthClass =
              tab.id === "user"
                ? "flex-1 min-w-0 md:flex-none md:min-w-[180px]"
                : "flex-1 min-w-0 md:flex-none md:min-w-[140px]";
            return (
              <Button
                key={tab.id}
                variant={isActive ? "default" : "outline"}
                className={`flex items-center justify-center gap-1 ${paddingClass} py-2 text-xs ${widthClass} md:gap-2 md:text-sm`}
                onClick={() => {
                  setActiveTab(tab.id as typeof activeTab);
                  setCategoryFilter(tab.category as CategoryFilter);
                }}
              >
                <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>
        <div className="flex flex-col gap-3 w-full md:flex-1">
          <div className="md:hidden">{renderMobileFiltersByTab()}</div>
          <div className="hidden w-full md:block">{renderDesktopFiltersByTab()}</div>
        </div>
      </div>

      <Card className="rounded-2xl border border-white/70 bg-white/90 shadow-sm backdrop-blur">
        <CardContent className="px-6 pt-6 pb-6 md:px-6 md:pt-6 md:pb-6">
          {error && (
            <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {isLoading && !error && (
            <div className="mb-4 text-sm text-muted-foreground">히스토리를 불러오는 중입니다...</div>
          )}
          <div className="md:hidden">
            <div className="relative w-full pr-1">
              <div className="space-y-4">
                {paginatedEvents.map((event) => {
                  const palette = historyPalette[event.type] ?? historyPalette.update;
                  const avatar = getActorAvatar(event.updatedBy, event.updatedByProfileImg);
                  return (
                    <div key={event.id} className="rounded-xl border border-white/70 bg-white/95 p-4 shadow-sm cursor-default">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/70 shadow-sm">
                          <img src={avatar.src} alt={avatar.alt} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium text-foreground">{event.message}</p>
                          {renderMeta(event)}
                        </div>
                      </div>
                      <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0 sm:min-w-[140px]">
                            <span className="text-[11px] text-slate-400 w-16 shrink-0">대상</span>
                            <span className="font-medium text-foreground break-words flex-1 text-right">
                              {event.target ?? "—"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-1 justify-end min-w-0 sm:min-w-[140px]">
                            <span className="text-[11px] text-slate-400 w-16 text-right">실행자</span>
                            <span className="inline-flex items-center justify-center rounded-md border border-transparent bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground w-fit whitespace-nowrap shrink-0">
                              {event.updatedBy ?? "시스템"}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0 sm:min-w-[140px]">
                            <span className="text-[11px] text-slate-400 w-16 shrink-0">작업 유형</span>
                            <span
                              className="inline-flex items-center justify-start rounded-md border px-2 py-0.5 text-[11px] font-medium w-fit whitespace-nowrap shrink-0"
                              style={{ backgroundColor: palette.iconBg, color: palette.iconColor, borderColor: palette.iconBg }}
                            >
                              {eventActionLabels[event.type]}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-1 justify-end min-w-0 sm:min-w-[140px]">
                            <span className="text-[11px] text-slate-400 w-16 text-right">발생 시각</span>
                            <span className="break-words text-right flex-1">
                              {format(new Date(event.updatedAt), "yyyy.MM.dd HH:mm")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {paginatedEvents.length === 0 && (
                  <div className="px-4 py-4 text-center text-sm text-muted-foreground">
                    조건에 맞는 히스토리가 없습니다. 필터를 조정해 다시 시도해 주세요.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="relative hidden w-full overflow-x-auto md:block">
            <table className="table-fixed w-full caption-bottom text-sm">
              <colgroup>
                <col style={{ width: "57%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "13%" }} />
              </colgroup>
              <thead className="[&_tr]:border-b">
                <tr className="hover:bg-muted/50 border-b transition-colors">
                  <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap">
                    활동 내용
                  </th>
                  <th className="text-foreground h-10 px-2 align-middle font-medium whitespace-nowrap text-center">
                    대상
                  </th>
                  <th className="text-foreground h-10 px-2 align-middle font-medium whitespace-nowrap text-center">
                    실행자
                  </th>
                  <th className="text-foreground h-10 px-2 align-middle font-medium whitespace-nowrap text-center">
                    작업 유형
                  </th>
                  <th className="text-foreground h-10 px-2 align-middle font-medium whitespace-nowrap text-center">
                    발생 시각
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {paginatedEvents.map((event) => {
                  const palette = historyPalette[event.type] ?? historyPalette.update;
                  const avatar = getActorAvatar(event.updatedBy, event.updatedByProfileImg);
                  return (
                    <tr key={event.id} className="hover:bg-muted/50 border-b transition-colors">
                      <td className="p-2 align-middle whitespace-normal break-words">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/70 shadow-sm">
                            <img src={avatar.src} alt={avatar.alt} className="h-full w-full object-cover" />
                          </div>
                          <div className="space-y-1 min-w-0">
                            <p className="font-medium text-foreground truncate" title={event.message}>
                              {event.message}
                            </p>
                            {renderMeta(event)}
                          </div>
                        </div>
                      </td>
                      <td className="p-2 align-middle whitespace-nowrap text-center text-sm text-muted-foreground">
                        {event.target ?? "—"}
                      </td>
                      <td className="p-2 align-middle whitespace-nowrap text-center">
                        <span className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground border-transparent">
                          {event.updatedBy ?? "시스템"}
                        </span>
                      </td>
                      <td className="p-2 align-middle whitespace-nowrap text-center">
                      <span
                          className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0"
                          style={{ backgroundColor: palette.iconBg, color: palette.iconColor, borderColor: palette.iconBg }}
                        >
                          {eventActionLabels[event.type]}
                        </span>
                      </td>
                      <td className="p-2 align-middle whitespace-nowrap text-center text-sm text-muted-foreground">
                        {format(new Date(event.updatedAt), "yyyy.MM.dd HH:mm")}
                      </td>
                    </tr>
                  );
                })}
                {paginatedEvents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">
                      조건에 맞는 히스토리가 없습니다. 필터를 조정해 다시 시도해 주세요.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredEvents.length > 0 && (
        <PaginationControls
          className="mt-4"
          currentPage={currentPage}
          totalPages={effectiveTotalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
