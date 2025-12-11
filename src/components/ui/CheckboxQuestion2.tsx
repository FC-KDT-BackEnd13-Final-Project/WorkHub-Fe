import { useEffect, useRef } from "react";
import { Checkbox2 } from "./checkbox2";
import { Textarea2 } from "./textarea2";
import { EvidenceUpload2 } from "./EvidenceUpload2";

interface EvidenceData {
    files: File[];
    links: string[];
}

interface CheckboxQuestionProps {
    titleValue: string;
    onTitleChange: (value: string) => void;
    options: string[];
    selectedIndexes: number[];
    onSelectionChange: (index: number, checked: boolean) => void;
    evidences: Record<string, EvidenceData>;
    onEvidenceUpload: (id: string, files: File[]) => void;
    onEvidenceLinksChange: (id: string, links: string[]) => void;
    fieldName: string;
    onOptionChange: (index: number, newValue: string) => void;

    onAddOption: () => void;
    onRemoveOption: (index: number) => void;
    disabled?: boolean;
    selectionEnabled?: boolean;
}

export function CheckboxQuestion2({
                                      titleValue,
                                      onTitleChange,
                                      options,
                                      selectedIndexes,
                                      onSelectionChange,
                                      evidences,
                                      onEvidenceUpload,
                                      onEvidenceLinksChange,
                                      fieldName,
                                      onOptionChange,
                                      onAddOption,
                                      onRemoveOption,
                                      disabled = false,
                                      selectionEnabled,
                                  }: CheckboxQuestionProps) {
    const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
    const canSelect = selectionEnabled ?? !disabled;

    const autoResize = (index: number) => {
        const el = textareaRefs.current[index];
        if (!el) return;
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
    };

    useEffect(() => {
        options.forEach((_, idx) => autoResize(idx));
    }, [options]);

    const optionList = options.map((option, idx) => ({ option, idx }));

    return (
        <div className="space-y-2">
            {/* 체크리스트 제목 입력 */}
            <input
                value={titleValue}
                onChange={(e) => onTitleChange(e.target.value)}
                className="w-full px-3 py-2 rounded-md border text-sm"
                placeholder="제목을 입력하세요"
                disabled={disabled}
            />

            {/* 체크 항목: 2열 레이아웃 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {optionList.map(({ option, idx }) => {
                    const isChecked = selectedIndexes.includes(idx);
                    const evidenceId = `${fieldName}-${idx}`;
                    const evidenceItem = evidences[evidenceId];
                    const hasEvidence =
                        (evidenceItem?.files?.length ?? 0) > 0 || (evidenceItem?.links?.length ?? 0) > 0;
                    const isLast = idx === options.length - 1;

                    return (
                        <div key={idx} className="space-y-2">
                            {/* 한 줄: 체크박스 + 입력창 + (마지막 줄이면 + / -) */}
                            <div className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted/70 transition-colors">
                                {/* 체크박스 */}
                                <Checkbox2
                                    id={`${fieldName}-${idx}`}
                                    checked={isChecked}
                                    onCheckedChange={(checked) => {
                                        if (!canSelect) return;
                                        onSelectionChange(idx, checked as boolean);
                                    }}
                                    className="shrink-0"
                                    disabled={!canSelect}
                                />

                                {/* 입력창 */}
                                <div className="flex-1">
                                    <Textarea2
                                        ref={(el) => (textareaRefs.current[idx] = el)}
                                        value={option}
                                        onChange={(e) => {
                                            onOptionChange(idx, e.target.value);
                                            autoResize(idx);
                                        }}
                                        className="w-full min-h-[38px] resize-none overflow-hidden"
                                        placeholder={`check list ${idx + 1}`}
                                        disabled={disabled}
                                    />
                                </div>

                                {/* 마지막 항목에만 + / - 표시 */}
                                {isLast && !disabled && (
                                    <div className="flex flex-col items-center justify-center ml-1 select-none text-sm text-muted-foreground">
                                        <span
                                            role="button"
                                            onClick={onAddOption}
                                            className="leading-none cursor-pointer hover:text-foreground"
                                        >
                                            +
                                        </span>
                                        <span
                                            role="button"
                                            onClick={() => {
                                                if (options.length <= 1) return;
                                                onRemoveOption(idx);
                                            }}
                                            className="mt-1 leading-none cursor-pointer hover:text-foreground"
                                        >
                                            -
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* 체크된 항목만 EvidenceUpload2 노출 */}
                            <EvidenceUpload2
                                id={evidenceId}
                                isChecked={isChecked}
                                onImageUpload={onEvidenceUpload}
                                onLinksChange={onEvidenceLinksChange}
                                files={evidenceItem?.files ?? []}
                                links={evidenceItem?.links ?? []}
                                disabled={disabled}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
