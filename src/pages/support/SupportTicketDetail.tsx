import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ProjectPostDetail, type ReplyDraftPayload } from "../../components/projects/ProjectPostDetail";
import { supportTicketStatusLabel, type SupportTicketStatus } from "../../data/supportTickets";
import { loadSupportStatus } from "../../utils/supportTicketStatusStorage";
import { csPostApi } from "../../lib/api";
import type { CsPostDetailResponse } from "../../types/csPost";
import { saveRepliesForPost, type PostReplyItem } from "../../utils/postRepliesStorage";
import { convertQnaResponseToReply, convertQnaToReply } from "../../utils/supportQnaMapper";
import { toast } from "sonner";
import type { RichTextDraft } from "../../components/RichTextDemo";
import { getErrorMessage } from "@/utils/errorMessages";

// API 응답을 UI 형식으로 변환
interface TicketDetail {
  id: string;
  customerName: string;
  status?: SupportTicketStatus;
  title: string;
  content: string;
  createdDate: string;
  updatedDate: string;
  type: string;
  ticketStatus?: SupportTicketStatus;
  isOwner: boolean;
  hashtag?: string;
}

const convertApiDetailToTicket = (data: CsPostDetailResponse): TicketDetail => {
  const normalizedStatus = data.csPostStatus ?? undefined;
  const statusLabel = normalizedStatus
    ? supportTicketStatusLabel[normalizedStatus]
    : undefined;
  return {
    id: String(data.csPostId),
    customerName: data.customerName,
    status: normalizedStatus,
    title: data.title,
    content: data.content,
    createdDate: data.createdAt,
    updatedDate: data.updatedAt,
    type: statusLabel ?? "일반",
    ticketStatus: normalizedStatus,
    isOwner: true,
    hashtag: "",
  };
};

// 단일 문의 상세를 보여주며 목록 경로로 복귀 링크를 제공
export function SupportTicketDetail() {
  const navigate = useNavigate();
  const { projectId, ticketId } = useParams<{ projectId?: string; ticketId?: string }>();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [isReplySubmitting, setIsReplySubmitting] = useState(false);
  const [isInlineCommentSubmitting, setIsInlineCommentSubmitting] = useState(false);
  const backPath = projectId ? `/projects/${projectId}/nodes/support` : undefined;

  useEffect(() => {
    const fetchTicketAndComments = async () => {
      if (!projectId || !ticketId) {
        setError("프로젝트 ID 또는 게시글 ID가 없습니다.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // 게시글과 댓글을 병렬로 가져오기
        const [ticketResponse, commentsResponse] = await Promise.all([
          csPostApi.getDetail(projectId, ticketId),
          csPostApi.getQnas(projectId, ticketId, {
            page: 0,
            size: 100,
            sort: ["createdAt,ASC"],
          }),
        ]);

        const convertedTicket = convertApiDetailToTicket(ticketResponse);
        const allReplies = commentsResponse.content.flatMap(convertQnaToReply);

        // localStorage에 저장
        saveRepliesForPost(convertedTicket.id, allReplies);

        // ticket을 먼저 설정
        setTicket(convertedTicket);

        // 약간의 딜레이 후 commentsLoaded를 true로 설정하여 리렌더링 트리거
        setTimeout(() => {
          setCommentsLoaded(true);
          setIsLoading(false);
        }, 300);
      } catch (err) {
        console.error("❌ API 에러:", err);
        setError(getErrorMessage(err, "CS 게시글을 불러오는 중 오류가 발생했습니다."));
        setTicket(null);
        setIsLoading(false);
      }
    };

    fetchTicketAndComments();
  }, [projectId, ticketId]);

  // 로딩 중 또는 댓글이 아직 로드되지 않음
  if (isLoading || !commentsLoaded) {
    return (
      <div className="space-y-6 pb-12 pt-6">
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-lg font-medium">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 에러 발생
  if (error) {
    return (
      <div className="space-y-6 pb-12 pt-6">
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-lg font-medium text-red-600">오류가 발생했습니다</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    );
  }

  // 데이터 없음
  if (!ticket) {
    return (
      <div className="space-y-6 pb-12 pt-6">
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-lg font-medium">해당 문의를 찾을 수 없습니다.</p>
          <p className="text-sm text-muted-foreground">다시 목록에서 선택해 주세요.</p>
        </div>
      </div>
    );
  }

  const overrideStatus = loadSupportStatus(ticket.id);
  const effectiveStatus = overrideStatus ?? ticket.status;
  const ticketWithStatusLabel = {
    ...ticket,
    status: effectiveStatus,
    type: effectiveStatus ? supportTicketStatusLabel[effectiveStatus] : ticket.type,
    ticketStatus: effectiveStatus,
    isOwner: true,
    hashtag: ticket.hashtag || "",
  };

  const handleUpdateTicket = async (draft: RichTextDraft) => {
    if (!projectId || !ticketId) {
      toast.error("프로젝트 정보가 없습니다.");
      throw new Error("Missing project information");
    }

    const payload = {
      title: draft.title.trim() || "무제",
      content: draft.content,
      files: [],
    };

    try {
      await csPostApi.update(projectId, ticketId, payload);
      toast.success("CS 문의가 수정되었습니다.");
      const refreshed = await csPostApi.getDetail(projectId, ticketId);
      setTicket(convertApiDetailToTicket(refreshed));
    } catch (err) {
      const message = getErrorMessage(err, "CS 문의 수정에 실패했습니다.");
      toast.error(message);
      throw err instanceof Error ? err : new Error(message);
    }
  };

  const handleStatusChange = async (nextStatus: SupportTicketStatus) => {
    if (!projectId || !ticketId) {
      toast.error("프로젝트 정보가 없습니다.");
      throw new Error("Missing project information");
    }

    setIsStatusUpdating(true);
    try {
      const updated = await csPostApi.changeStatus(projectId, ticketId, nextStatus);
      setTicket(convertApiDetailToTicket(updated));
      toast.success("CS 문의 상태가 변경되었습니다.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "CS 문의 상태 변경에 실패했습니다.";
      toast.error(message);
      throw err instanceof Error ? err : new Error(message);
    } finally {
      setIsStatusUpdating(false);
    }
  };

  const handleCreateReply = async (draft: ReplyDraftPayload) => {
    if (!projectId || !ticketId) {
      toast.error("프로젝트 정보가 없습니다.");
      throw new Error("Missing project information");
    }

    setIsReplySubmitting(true);
    try {
      const response = await csPostApi.createQna(projectId, ticketId, {
        qnaContent: draft.content,
      });
      toast.success("댓글이 등록되었습니다.");
      return convertQnaResponseToReply(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : "CS 댓글 등록에 실패했습니다.";
      toast.error(message);
      throw err instanceof Error ? err : new Error(message);
    } finally {
      setIsReplySubmitting(false);
    }
  };

  const handleCreateInlineComment = async ({
    content,
    parentId,
  }: {
    content: string;
    parentId?: string | null;
  }) => {
    if (!projectId || !ticketId) {
      toast.error("프로젝트 정보가 없습니다.");
      throw new Error("Missing project information");
    }

    const parsedParentId = parentId ? Number(parentId) : undefined;
    const parentQnaId = parentId && Number.isNaN(parsedParentId) ? undefined : parsedParentId;

    setIsInlineCommentSubmitting(true);
    try {
      const response = await csPostApi.createQna(projectId, ticketId, {
        qnaContent: content,
        parentQnaId,
      });
      return convertQnaResponseToReply(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : "CS 댓글 등록에 실패했습니다.";
      toast.error(message);
      throw err instanceof Error ? err : new Error(message);
    } finally {
      setIsInlineCommentSubmitting(false);
    }
  };

  const handleUpdateInlineComment = async ({
    content,
    commentId,
  }: {
    content: string;
    commentId: string;
  }) => {
    if (!projectId || !ticketId) {
      toast.error("프로젝트 정보가 없습니다.");
      throw new Error("Missing project information");
    }

    try {
      const response = await csPostApi.updateQna(projectId, ticketId, commentId, {
        qnaContent: content,
      });
      toast.success("댓글이 수정되었습니다.");
      return convertQnaResponseToReply(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : "CS 댓글 수정에 실패했습니다.";
      toast.error(message);
      throw err instanceof Error ? err : new Error(message);
    }
  };

  const handleDeleteInlineComment = async (commentId: string) => {
    if (!projectId || !ticketId) {
      toast.error("프로젝트 정보가 없습니다.");
      throw new Error("Missing project information");
    }

    try {
      await csPostApi.deleteQna(projectId, ticketId, commentId);
      toast.success("댓글이 삭제되었습니다.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "CS 댓글 삭제에 실패했습니다.";
      toast.error(message);
      throw err instanceof Error ? err : new Error(message);
    }
  };

  const handleDeleteTicket = async () => {
    if (isDeleting) return;
    if (!projectId || !ticketId) {
      toast.error("프로젝트 정보가 없습니다.");
      return;
    }
    const confirmed = window.confirm("해당 CS 문의를 삭제하시겠습니까?");
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await csPostApi.delete(projectId, ticketId);
      toast.success("CS 문의가 삭제되었습니다.");
      const targetPath = backPath ?? `/projects/${projectId}/nodes/support`;
      navigate(targetPath, { replace: true });
    } catch (err) {
      const message = getErrorMessage(err, "CS 문의 삭제에 실패했습니다.");
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ProjectPostDetail
      key={`support-${ticket.id}-${commentsLoaded ? 'loaded' : 'loading'}`}
      initialPost={ticketWithStatusLabel}
      backPath={backPath}
      showBackButton={true}
      startInEditMode={false}
      onSubmitPostEdit={handleUpdateTicket}
      onChangeTicketStatus={handleStatusChange}
      onSubmitReplyDraft={handleCreateReply}
      onSubmitInlineComment={handleCreateInlineComment}
      onUpdateInlineComment={handleUpdateInlineComment}
      onDeleteInlineComment={handleDeleteInlineComment}
      onDeletePost={handleDeleteTicket}
      isDeletingPost={isDeleting}
      showPostTypeSelector={false}
      isStatusUpdating={isStatusUpdating}
      isReplySubmitting={isReplySubmitting}
      isInlineCommentSubmitting={isInlineCommentSubmitting}
      showStatusControls={true}
    />
  );
}
