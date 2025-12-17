import React, { ReactNode, useEffect, useRef, useState } from "react";
import { RichTextEditor } from "./RichTextEditor";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export interface AttachmentDraft {
    id: string;
    name: string;
    size: number;
    dataUrl: string;
}

export interface RichTextDraft {
    title: string;
    content: string;
    attachments: AttachmentDraft[];
    links: { url: string; description: string; linkId?: number }[];
    type: "공지" | "질문" | "일반";
}

interface RichTextDemoActionHelpers {
    draft: RichTextDraft;
    clear: () => void;
}

interface RichTextDemoProps {
    actionButtons?: ReactNode | ((helpers: RichTextDemoActionHelpers) => ReactNode);
    onChange?: (draft: RichTextDraft) => void;
    initialDraft?: Partial<RichTextDraft>;
    showTypeSelector?: boolean;
    allowLinks?: boolean;
}

export function RichTextDemo({
    actionButtons,
    onChange,
    initialDraft,
    showTypeSelector = false,
    allowLinks = true,
}: RichTextDemoProps) {
    const defaultDraft: RichTextDraft = {
        title: initialDraft?.title ?? "",
        content: initialDraft?.content ?? "",
        attachments: initialDraft?.attachments ?? [],
        links: initialDraft?.links ?? [],
        type: initialDraft?.type ?? "질문",
    };
    const [draft, setDraft] = useState<RichTextDraft>(defaultDraft);
    const [isAddingLink, setIsAddingLink] = useState(false);
    const [linkForm, setLinkForm] = useState({ url: "", description: "" });
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const setDraftWithNotify = (updater: (prev: RichTextDraft) => RichTextDraft) => {
        setDraft((prev) => {
            const nextDraft = updater(prev);
            onChange?.(nextDraft);
            return nextDraft;
        });
    };

    const handleContentChange = (newContent: string) => {
        setDraftWithNotify((prev) => ({ ...prev, content: newContent }));
    };

    const clearEditor = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        setIsAddingLink(false);
        setLinkForm({ url: "", description: "" });
        setDraftWithNotify(() => ({ ...defaultDraft }));
    };

    const fileToAttachment = (file: File): Promise<AttachmentDraft> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                resolve({
                    id: `att-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                    name: file.name,
                    size: file.size,
                    dataUrl: typeof reader.result === "string" ? reader.result : "",
                });
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []);
        if (files.length === 0) return;
        try {
            const attachments = await Promise.all(files.map(fileToAttachment));
            setDraftWithNotify((prev) => ({
                ...prev,
                attachments: [...prev.attachments, ...attachments],
            }));
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error("첨부 파일을 읽는 중 오류가 발생했습니다.", error);
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const removeAttachment = (index: number) => {
        setDraftWithNotify((prev) => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index),
        }));
    };

    const handleAddLink = () => {
        if (!allowLinks) return;
        const trimmedUrl = linkForm.url.trim();
        const trimmedDesc = linkForm.description.trim();
        if (!trimmedUrl) return;
        setDraftWithNotify((prev) => ({
            ...prev,
            links: [...prev.links, { url: trimmedUrl, description: trimmedDesc }],
        }));
        setLinkForm({ url: "", description: "" });
        setIsAddingLink(false);
    };

    const removeLink = (index: number) => {
        if (!allowLinks) return;
        setDraftWithNotify((prev) => ({
            ...prev,
            links: prev.links.filter((_, i) => i !== index),
        }));
    };

    useEffect(() => {
        if (!allowLinks) {
            if (isAddingLink) {
                setIsAddingLink(false);
                setLinkForm({ url: "", description: "" });
            }
            if (draft.links.length > 0) {
                setDraftWithNotify((prev) => ({
                    ...prev,
                    links: [],
                }));
            }
        }
    }, [allowLinks, isAddingLink, draft.links.length]);

    const renderedActionButtons =
        typeof actionButtons === "function"
            ? actionButtons({ draft, clear: clearEditor })
            : actionButtons;

    return (
        <div className="space-y-6">
            {/* Editor Card */}
            <Card>
                <CardContent className="space-y-4 pt-6">
                    {showTypeSelector && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">게시글 타입</p>
                            <Select
                                value={draft.type}
                                onValueChange={(value) =>
                                    setDraftWithNotify((prev) => ({
                                        ...prev,
                                        type: value as RichTextDraft["type"],
                                    }))
                                }
                            >
                                <SelectTrigger className="w-full md:w-48">
                                    <SelectValue placeholder="타입 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="공지">공지</SelectItem>
                                    <SelectItem value="질문">질문</SelectItem>
                                    <SelectItem value="일반">일반</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* 제목 입력 */}
                    <input
                        type="text"
                        placeholder="제목을 입력하세요"
                        value={draft.title}
                        onChange={(e) =>
                            setDraftWithNotify((prev) => ({ ...prev, title: e.target.value }))
                        }
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-xl focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                    />

                    {/* 본문 에디터 */}
                    <RichTextEditor
                        placeholder="내용을 입력하세요."
                        onChange={handleContentChange}
                        initialContent={draft.content}
                        className="w-full"
                    />

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
                            {allowLinks && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsAddingLink((prev) => !prev)}
                                >
                                    링크 추가
                                </Button>
                            )}
                        </div>

                        {allowLinks && isAddingLink && (
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

                        {(draft.attachments.length > 0 || (allowLinks && draft.links.length > 0)) && (
                            <div className="space-y-2">
                                {draft.attachments.map((file, index) => (
                                    <div
                                        key={file.id}
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
                                {allowLinks &&
                                    draft.links.map((link, index) => (
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
                            {renderedActionButtons}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
