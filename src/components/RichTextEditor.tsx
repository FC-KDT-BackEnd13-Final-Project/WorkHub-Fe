import React, { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import {
    Bold,
    Italic,
    Underline,
    AlignLeft,
    AlignCenter,
    AlignRight,
    List,
    ListOrdered,
    Paperclip,
    Link2,
    X,
} from "lucide-react";

interface RichTextEditorProps {
    placeholder?: string;
    onChange?: (content: string) => void;
    initialContent?: string;
    className?: string;
}

export function RichTextEditor({
                                   placeholder = "Start typing...",
                                   onChange,
                                   initialContent = "",
                                   className = "",
                               }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachments, setAttachments] = useState<Array<{ id: string; name: string; size: number }>>([]);
    const [referenceLinks, setReferenceLinks] = useState<Array<{ id: string; url: string }>>([]);

    const generateId = () =>
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    useEffect(() => {
        if (!editorRef.current) return;
        if (editorRef.current.innerHTML !== initialContent) {
            editorRef.current.innerHTML = initialContent;
        }
    }, [initialContent]);

    const executeCommand = useCallback(
        (command: string, value?: string) => {
            document.execCommand(command, false, value);
            if (editorRef.current && onChange) {
                onChange(editorRef.current.innerHTML);
            }
            editorRef.current?.focus();
        },
        [onChange]
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            // 단축키 처리 (Ctrl/Cmd + B/I/U)
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case "b":
                        e.preventDefault();
                        executeCommand("bold");
                        break;
                    case "i":
                        e.preventDefault();
                        executeCommand("italic");
                        break;
                    case "u":
                        e.preventDefault();
                        executeCommand("underline");
                        break;
                }
            }
        },
        [executeCommand]
    );

    const handleInput = useCallback(() => {
        if (editorRef.current && onChange) {
            onChange(editorRef.current.innerHTML);
        }
    }, [onChange]);

    const insertLink = useCallback(() => {
        const url = window.prompt("Enter URL:");
        if (url) {
            executeCommand("createLink", url);
        }
    }, [executeCommand]);

    const formatBlock = useCallback(
        (tag: string) => {
            // 일부 브라우저는 'H1' 형태, 일부는 '<h1>' 형태를 기대함
            executeCommand("formatBlock", tag);
        },
        [executeCommand]
    );

    const isCommandActive = useCallback((command: string): boolean => {
        try {
            return document.queryCommandState(command);
        } catch {
            return false;
        }
    }, []);

    const clearFormatting = useCallback(() => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            editorRef.current?.focus();
            return;
        }

        const range = selection.getRangeAt(0);
        document.execCommand("removeFormat");
        document.execCommand("unlink");
        document.execCommand("formatBlock", false, "<p>");

        const selectedText = range.toString();
        range.deleteContents();

        const lines = selectedText.split(/\n/);
        const fragment = document.createDocumentFragment();
        lines.forEach((line, index) => {
            fragment.appendChild(document.createTextNode(line));
            if (index < lines.length - 1) {
                fragment.appendChild(document.createElement("br"));
            }
        });
        range.insertNode(fragment);
        selection.collapseToEnd();

        if (editorRef.current && onChange) {
            onChange(editorRef.current.innerHTML);
        }
        editorRef.current?.focus();
    }, [onChange]);

    const handleFileButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []) as File[];
        if (files.length === 0) return;
        setAttachments((prev) => [
            ...prev,
            ...files.map((file) => ({
                id: generateId(),
                name: file.name,
                size: file.size,
            })),
        ]);
        event.target.value = "";
    };

    const handleAddReferenceLink = () => {
        const url = window.prompt("첨부할 링크를 입력하세요:");
        if (!url) return;
        setReferenceLinks((prev) => [...prev, { id: generateId(), url }]);
    };

    const formatFileSize = (size: number) => {
        if (size >= 1024 * 1024) {
            return `${(size / (1024 * 1024)).toFixed(1)} MB`;
        }
        if (size >= 1024) {
            return `${(size / 1024).toFixed(1)} KB`;
        }
        return `${size} B`;
    };

    const removeAttachment = (id: string) => {
        setAttachments((prev) => prev.filter((file) => file.id !== id));
    };

    const removeReferenceLink = (id: string) => {
        setReferenceLinks((prev) => prev.filter((link) => link.id !== id));
    };

    return (
        <div
            className={`
        border border-border rounded-lg overflow-hidden bg-background
        ${className}
      `}
        >
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/30">
                {/* Text Formatting */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeCommand("bold")}
                        data-active={isCommandActive("bold").toString()}
                    >
                        <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeCommand("italic")}
                        data-active={isCommandActive("italic").toString()}
                    >
                        <Italic className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeCommand("underline")}
                        data-active={isCommandActive("underline").toString()}
                    >
                        <Underline className="h-4 w-4" />
                    </Button>
                </div>

                <Separator orientation="vertical" className="h-6" />

                {/* Headers */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => formatBlock("H1")}
                    >
                        H1
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => formatBlock("H2")}
                    >
                        H2
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => formatBlock("H3")}
                    >
                        H3
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => formatBlock("P")}
                    >
                        P
                    </Button>
                </div>

                <Separator orientation="vertical" className="h-6" />

                {/* Alignment */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeCommand("justifyLeft")}
                    >
                        <AlignLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeCommand("justifyCenter")}
                    >
                        <AlignCenter className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeCommand("justifyRight")}
                    >
                        <AlignRight className="h-4 w-4" />
                    </Button>
                </div>

                <Separator orientation="vertical" className="h-6" />

                {/* Lists */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeCommand("insertUnorderedList")}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeCommand("insertOrderedList")}
                    >
                        <ListOrdered className="h-4 w-4" />
                    </Button>
                </div>

                <Separator orientation="vertical" className="h-6" />

            </div>

            {/* Editor Area */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className={`
          p-4 focus:outline-none text-base
          prose prose-sm max-w-none rte-content
        `}
                style={{
                    direction: "ltr",
                    unicodeBidi: "plaintext",
                    minHeight: "250px",
                }}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                data-placeholder={placeholder}
            />

            {(attachments.length > 0 || referenceLinks.length > 0) && (
                <div className="border-t border-border bg-muted/40 pt-4 px-4 py-4 space-y-4">
                    {attachments.length > 0 && (
                        <div>
                            <p className="text-sm font-medium mb-2">첨부 파일</p>
                            <div className="space-y-2">
                                {attachments.map((file) => (
                                    <div
                                        key={file.id}
                                        className="flex items-center rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    >
                                        <div className="flex flex-1 flex-col pr-2">
                                            <span className="truncate">{file.name}</span>
                                            <span className="text-muted-foreground text-xs">{formatFileSize(file.size)}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => removeAttachment(file.id)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {referenceLinks.length > 0 && (
                        <div>
                            <p className="text-sm font-medium mb-2">참고 링크</p>
                            <div className="space-y-2">
                                {referenceLinks.map((link) => (
                                    <a
                                        key={link.id}
                                        href={link.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm text-primary underline-offset-4 hover:underline"
                                    >
                                        <span className="truncate pr-2">{link.url}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                removeReferenceLink(link.id);
                                            }}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
                [contentEditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #9ca3af;
                    pointer-events: none;
                }
                [data-active="true"] {
                    background-color: hsl(var(--accent));
                    color: hsl(var(--accent-foreground));
                }
            `}</style>
        </div>
    );
}
