import React, { ReactNode, useRef, useState } from "react";
import { RichTextEditor } from "./RichTextEditor";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";

interface RichTextDemoProps {
    actionButtons?: ReactNode;
}

export function RichTextDemo({ actionButtons }: RichTextDemoProps) {
    const [content, setContent] = useState("");
    const [title, setTitle] = useState("");
    const [attachments, setAttachments] = useState<File[]>([]);
    const [links, setLinks] = useState<{ url: string; description: string }[]>([]);
    const [isAddingLink, setIsAddingLink] = useState(false);
    const [linkForm, setLinkForm] = useState({ url: "", description: "" });
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleContentChange = (newContent: string) => {
        setContent(newContent);
    };

    const clearEditor = () => {
        setContent("");
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []);
        if (files.length === 0) return;
        setAttachments((prev) => [...prev, ...files]);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    const handleAddLink = () => {
        const trimmedUrl = linkForm.url.trim();
        const trimmedDesc = linkForm.description.trim();
        if (!trimmedUrl) return;
        setLinks((prev) => [...prev, { url: trimmedUrl, description: trimmedDesc }]);
        setLinkForm({ url: "", description: "" });
        setIsAddingLink(false);
    };

    const removeLink = (index: number) => {
        setLinks((prev) => prev.filter((_, i) => i !== index));
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

                    {/* 파일/링크 첨부 */}
                    <div className="space-y-3 rounded-lg border border-dashed border-border/70 bg-muted/20 p-4">
                        <p className="text-sm font-medium text-muted-foreground">첨부</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                        <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                파일 선택
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setIsAddingLink((prev) => !prev)}>
                                링크 추가
                            </Button>
                        </div>

                        {isAddingLink && (
                            <div className="flex flex-col gap-2 rounded-md bg-background/80 p-3 sm:flex-row sm:items-center">
                                <input
                                    type="url"
                                    placeholder="https://example.com"
                                    value={linkForm.url}
                                    onChange={(e) => setLinkForm((prev) => ({ ...prev, url: e.target.value }))}
                                    className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                                <input
                                    type="text"
                                    placeholder="링크 설명"
                                    value={linkForm.description}
                                    onChange={(e) =>
                                        setLinkForm((prev) => ({ ...prev, description: e.target.value }))
                                    }
                                    className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={handleAddLink}>
                                        추가
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setIsAddingLink(false);
                                            setLinkForm({ url: "", description: "" });
                                        }}
                                    >
                                        취소
                                    </Button>
                                </div>
                            </div>
                        )}

                        {(attachments.length > 0 || links.length > 0) && (
                            <div className="space-y-2">
                                {attachments.map((file, index) => (
                                    <div
                                        key={`${file.name}-${index}`}
                                        className="flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm"
                                    >
                                        <span className="truncate">{file.name}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs text-muted-foreground"
                                            onClick={() => removeAttachment(index)}
                                        >
                                            삭제
                                        </Button>
                                    </div>
                                ))}
                                {links.map((link, index) => (
                                    <div
                                        key={`${link.url}-${index}`}
                                        className="flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium text-foreground">
                                                {link.description || "링크 설명 없음"}
                                            </span>
                                            <a
                                                href={link.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-xs text-primary underline"
                                            >
                                                {link.url}
                                            </a>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs text-muted-foreground"
                                            onClick={() => removeLink(index)}
                                        >
                                            삭제
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 하단 버튼들 (예시) */}
                    <div className="flex items-center justify-between gap-2">
                        <Button variant="outline" size="sm" onClick={clearEditor}>
                            내용 초기화
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
