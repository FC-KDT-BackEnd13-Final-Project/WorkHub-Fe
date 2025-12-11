import { useState, useRef, useEffect, type ChangeEvent } from "react";
import { Button2 } from "./button2";
import { Input2 } from "./input2";
import { X, Upload, Link as LinkIcon } from "lucide-react";

interface EvidenceUploadProps {
    id: string;
    isChecked: boolean;
    onImageUpload: (id: string, files: File[]) => void;
    files: File[];
    links: string[];
    onLinksChange: (id: string, links: string[]) => void;
    disabled?: boolean;
}

export function EvidenceUpload2({
                                   id,
                                   isChecked,
                                   onImageUpload,
                                   files,
                                   links = [],
                                   onLinksChange,
                                   disabled = false,
                               }: EvidenceUploadProps) {
    // 파일 목록
    const [fileList, setFileList] = useState<File[]>(files || []);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        setFileList(files || []);
    }, [files]);

    const hasLinks = links?.length > 0;
    const [isAddingLink, setIsAddingLink] = useState(false);
    const [linkInput, setLinkInput] = useState("");
    const shouldRender = isChecked || fileList.length > 0 || hasLinks;
    if (!shouldRender) return null;

    // 파일 선택 시
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (disabled) return;
        const newFiles = Array.from(event.target.files || []);
        const updatedFiles = [...fileList, ...newFiles];

        setFileList(updatedFiles);
        onImageUpload(id, updatedFiles);

        // 같은 파일 다시 선택 가능하도록 초기화
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // 파일 제거
    const removeFile = (index: number) => {
        if (disabled) return;
        const newFiles = fileList.filter((_, i) => i !== index);
        setFileList(newFiles);
        onImageUpload(id, newFiles);
    };

    // 링크 추가
    const handleAddLink = () => {
        if (disabled) return;
        const url = linkInput.trim();
        if (!url) return;

        onLinksChange(id, [...links, url]);
        setLinkInput("");
        setIsAddingLink(false);
    };

    // 링크 제거
    const removeLink = (index: number) => {
        if (disabled) return;
        const next = links.filter((_, i) => i !== index);
        onLinksChange(id, next);
    };

    const hasAnyItem = fileList.length > 0 || hasLinks;

    return (
        <div className="mt-2 p-6 border rounded-md bg-muted/40">
            {/* 숨겨진 파일 input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                style={{ display: "none" }}
                id={`file-${id}`}
                disabled={disabled}
            />

            {/* 파일, 링크 업로드 */}
            <div className="mb-5 flex flex-wrap items-center gap-2">
                {/* 파일 선택 */}
                <Button2
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer flex items-center gap-2"
                    onClick={() => {
                        if (disabled) return;
                        fileInputRef.current?.click();
                    }}
                    disabled={disabled}
                >
                    <Upload className="h-4 w-4" />
                    파일 선택
                </Button2>

                {/* 링크 삽입 */}
                <Button2
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer flex items-center gap-2"
                    onClick={() => {
                        if (disabled) return;
                        setIsAddingLink((prev) => !prev);
                    }}
                    disabled={disabled}
                >
                    <LinkIcon className="h-4 w-4" />
                    링크 삽입
                </Button2>
            </div>

            {/* 링크 입력 영역 (토글) */}
            {isAddingLink && (
                <div className="mt-2 mb-4 flex items-center gap-2">
                    <Input2
                        type="url"
                        placeholder="https://example.com"
                        value={linkInput}
                        onChange={(e) => setLinkInput(e.target.value)}
                        className="flex-1 h-8 text-sm"
                        disabled={disabled}
                    />
                    {/* 추가 버튼 */}
                    <Button2
                        type="button"
                        size="sm"
                        className="h-8 px-3"
                        onClick={handleAddLink}
                        disabled={disabled}
                    >
                        추가
                    </Button2>

                    {/* 취소 버튼 */}
                    <Button2
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3"
                        onClick={() => {
                            setIsAddingLink(false);
                            setLinkInput("");
                        }}
                        disabled={disabled}
                    >
                        취소
                    </Button2>
                </div>
            )}

            {/* 파일 & 링크 리스트 */}
            {hasAnyItem && (
                <div className="space-y-2 mt-2">
                    {/* 파일들 */}
                    {fileList.map((file, index) => (
                        <div
                            key={`file-${index}`}
                            className="flex justify-between items-center p-2 border rounded-md bg-white shadow-sm"
                        >
                            <span className="text-sm">{file.name}</span>

                            {/* 삭제 버튼 */}
                            <Button2
                                type="button"
                                size="sm"
                                variant="destructive"
                                className="h-6 w-6 p-0 flex items-center justify-center"
                                onClick={() => removeFile(index)}
                                disabled={disabled}
                            >
                                <X className="h-4 w-4" />
                            </Button2>
                        </div>
                    ))}

                    {/* 링크들 */}
                    {links.map((url, index) => (
                        <div
                            key={`link-${index}`}
                            className="flex justify-between items-center p-2 border rounded-md bg-white shadow-sm"
                        >
                            <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm text-primary underline truncate max-w-xs"
                            >
                                {url}
                            </a>

                            {/* 삭제 버튼 */}
                            <Button2
                                type="button"
                                size="sm"
                                variant="destructive"
                                className="h-6 w-6 p-0 flex items-center justify-center"
                                onClick={() => removeLink(index)}
                                disabled={disabled}
                            >
                                <X className="h-4 w-4" />
                            </Button2>
                        </div>
                    ))}
                </div>
            )}

            {/* 파일/링크 둘 다 없을 때 문구 */}
            {!hasAnyItem && (
                <p className="text-xs text-muted-foreground mt-4">
                    첨부된 파일이 없습니다.
                </p>
            )}
        </div>
    );
}
