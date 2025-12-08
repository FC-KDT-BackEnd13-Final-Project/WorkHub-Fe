import { ReactNode } from "react";
import { Card2, CardContent } from "../ui/card2";
import { Badge2 } from "../ui/badge2";

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
              <Badge2 variant="outline">{post.type}</Badge2>
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
          <div className="prose max-w-none text-base leading-relaxed whitespace-pre-line">
            {post.content}
          </div>
        </div>
      </CardContent>
    </Card2>
  );
}
