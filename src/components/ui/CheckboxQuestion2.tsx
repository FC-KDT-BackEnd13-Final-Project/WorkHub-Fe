// src/components/ui/CheckboxQuestion2.tsx
"use client";

import { useEffect, useRef } from "react";
import { Checkbox2 } from "./checkbox2";
import { Textarea2 } from "./textarea2";
import { EvidenceUpload2 } from "./EvidenceUpload2";

interface CheckboxQuestionProps {
    titleValue: string;
    onTitleChange: (value: string) => void;
    options: string[];
    selectedIndexes: number[];
    onSelectionChange: (index: number, checked: boolean) => void;
    evidences: Record<string, File[]>;
    onEvidenceUpload: (id: string, files: File[]) => void;
    fieldName: string;
    onOptionChange: (index: number, newValue: string) => void;

    onAddOption: () => void;
    onRemoveOption: (index: number) => void;
}

export function CheckboxQuestion2({
                                      titleValue,
                                      onTitleChange,
                                      options,
                                      selectedIndexes,
                                      onSelectionChange,
                                      evidences,
                                      onEvidenceUpload,
                                      fieldName,
                                      onOptionChange,
                                      onAddOption,
                                      onRemoveOption,
                                  }: CheckboxQuestionProps) {
    const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

    const autoResize = (index: number) => {
        const el = textareaRefs.current[index];
        if (!el) return;
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
    };

    useEffect(() => {
        options.forEach((_, idx) => autoResize(idx));
    }, [options]);

    return (
        <div className="space-y-2">
            {/* 체크리스트 제목 입력 */}
            <input
                value={titleValue}
                onChange={(e) => onTitleChange(e.target.value)}
                className="w-full px-3 py-2 rounded-md border text-sm"
                placeholder="제목을 입력하세요"
            />

            {/* 체크 항목: 2열 레이아웃 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {options.map((option, index) => {
                    const isChecked = selectedIndexes.includes(index);
                    const evidenceId = `${fieldName}-${index}`;
                    const hasEvidence = evidences[evidenceId]?.length > 0;
                    const isLast = index === options.length - 1;

                    return (
                        <div key={index} className="space-y-2">
                            {/* 한 줄: 체크박스 + 입력창 + (마지막 줄이면 + / -) */}
                            <div className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted/70 transition-colors">
                                {/* 체크박스 */}
                                <Checkbox2
                                    id={`${fieldName}-${index}`}
                                    checked={isChecked}
                                    onCheckedChange={(checked) =>
                                        onSelectionChange(index, checked as boolean)
                                    }
                                    className="shrink-0"
                                />

                                {/* 입력창 */}
                                <div className="flex-1">
                                    <Textarea2
                                        ref={(el) => (textareaRefs.current[index] = el)}
                                        value={option}
                                        onChange={(e) => {
                                            onOptionChange(index, e.target.value);
                                            autoResize(index);
                                        }}
                                        className="w-full min-h-[38px] resize-none overflow-hidden"
                                        placeholder={`check list ${index + 1}`}
                                    />
                                </div>

                                {/* 마지막 항목에만 세로 + / - 표시 */}
                                {isLast && (
                                    <div className="flex flex-col items-center justify-center ml-1 select-none text-sm text-muted-foreground">
                    <span
                        role="button"
                        onClick={onAddOption}
                        className="cursor-pointer hover:text-foreground leading-none"
                    >
                      +
                    </span>
                                        <span
                                            role="button"
                                            onClick={() => {
                                                if (options.length <= 1) return; // 최소 한 개는 남기기
                                                onRemoveOption(index);
                                            }}
                                            className="mt-1 cursor-pointer hover:text-foreground leading-none"
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
                                files={hasEvidence ? evidences[evidenceId] : []}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}