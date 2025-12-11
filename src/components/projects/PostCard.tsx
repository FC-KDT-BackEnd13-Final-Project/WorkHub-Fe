import { ReactNode } from "react";
import { Card2, CardContent } from "../ui/card2";
import { Badge2 } from "../ui/badge2";

export const typeBadgeStyles: Record<string, { backgroundColor: string; color: string; borderColor: string }> = {
  공지: {
    backgroundColor: "#EEF2FF",
    color: "#4338CA",
    borderColor: "#C7D2FE",
  },
  질문: {
    backgroundColor: "#FFFBEB",
    color: "#B45309",
    borderColor: "#FDE68A",
  },
  일반: {
    backgroundColor: "#F9FAFB",
    color: "#374151",
    borderColor: "#E5E7EB",
  },
  답글: {
    backgroundColor: "#F1F5F9",
    color: "#0F172A",
    borderColor: "#E2E8F0",
  },
  접수: {
    backgroundColor: "#DBEAFE",
    color: "#1D4ED8",
    borderColor: "#BFDBFE",
  },
  처리중: {
    backgroundColor: "#FEF3C7",
    color: "#B45309",
    borderColor: "#FCD34D",
  },
  완료: {
    backgroundColor: "#DCFCE7",
    color: "#15803D",
    borderColor: "#BBF7D0",
  },
};

interface PostCardProps {
  post: {
    title: string;
    content: string;
    type: string;
  };
  metaItems: string[];
  headerLabel?: string;
  extraMenu?: ReactNode;
}

// 게시글 카드 UI를 재사용하기 위한 컴포넌트 (본문/비교 모달에서 공유)
export function PostCard({ post, metaItems, headerLabel, extraMenu }: PostCardProps) {
  const contentHtml = (() => {
    if (!post.content) return "";
    const hasHtmlTag = /<[^>]+>/.test(post.content);
    return hasHtmlTag ? post.content : post.content.replace(/\n/g, "<br />");
  })();
  const badgeStyle = typeBadgeStyles[post.type] ?? {
    backgroundColor: "#F3F4F6",
    color: "#111827",
    borderColor: "#E5E7EB",
  };

  return (
    <Card2>
      <CardContent className="space-y-4 p-6">
        <div className="space-y-2">
          {headerLabel && (
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {headerLabel}
            </p>
          )}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Badge2
                variant="outline"
                style={badgeStyle}
                className={badgeStyle ? "border" : undefined}
              >
                {post.type}
              </Badge2>
            </div>
            {extraMenu}
          </div>
          <h2 className="text-2xl font-semibold">{post.title}</h2>
          <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
            {metaItems.map(
              (item, index) =>
                item && (
                  <span key={`${item}-${index}`} className="whitespace-nowrap">
                    {item}
                  </span>
                ),
            )}
          </div>
        </div>
        <div className="space-y-3">
          <div
            className="prose max-w-none text-base leading-relaxed"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </div>
      </CardContent>
    </Card2>
  );
}
