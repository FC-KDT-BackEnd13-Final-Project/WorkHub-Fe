import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { ProjectPostDetail } from "../components/ProjectPostDetail";
import { findSupportTicket } from "../data/supportTickets";

export function SupportTicketDetail() {
  const { projectId, ticketId } = useParams<{ projectId?: string; ticketId?: string }>();
  const ticket = useMemo(() => (ticketId ? findSupportTicket(ticketId) : undefined), [ticketId]);

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

  const backPath = projectId ? `/projects/${projectId}/nodes/support` : undefined;

  return (
    <ProjectPostDetail initialPost={ticket} backPath={backPath} showBackButton={true} startInEditMode={false} />
  );
}
