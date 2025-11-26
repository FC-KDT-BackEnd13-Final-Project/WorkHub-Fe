import React, { ReactNode, useState } from "react";
import { RichTextEditor } from "./RichTextEditor";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";

interface RichTextDemoProps {
    actionButtons?: ReactNode;
}

export function RichTextDemo({ actionButtons }: RichTextDemoProps) {
    const [content, setContent] = useState("");
    const [title, setTitle] = useState("");

    const handleContentChange = (newContent: string) => {
        setContent(newContent);
    };

    const clearEditor = () => {
        setContent("");
    };

    return (
        <div className="space-y-6">
            {/* Editor Card */}
            <Card>
                <CardContent className="space-y-4 pt-6">
                    {/* 제목 입력 */}
                    <input
                        type="text"
                        placeholder="제목을 입력하세요"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-xl focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                    />

                    {/* 본문 에디터 */}
                    <RichTextEditor
                        placeholder="내용을 입력하세요."
                        onChange={handleContentChange}
                        initialContent={content}
                        className="w-full"
                    />

                    {/* 하단 버튼들 (예시) */}
                    <div className="flex items-center justify-between gap-2">
                        <Button variant="outline" size="sm" onClick={clearEditor}>
                            Clear Content
                        </Button>
                        <div className="flex gap-2">
                            {actionButtons}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
