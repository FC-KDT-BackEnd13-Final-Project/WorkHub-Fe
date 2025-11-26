import { useState, useEffect } from "react"; // ✅ useEffect 추가
import { Card2, CardContent } from "./card2";
import { Label2 } from "./label2";
import { CheckboxQuestion2 } from "./CheckboxQuestion2";
import { Textarea2 } from "./textarea2";
import { MessagesSquare } from "lucide-react";

interface ChecklistGroup {
    id: number;
    title: string;
    rules: string[];
    selectedIndexes: number[];
    evidences: Record<string, File[]>;
    comment: string;        // 카드 전체에 대한 코멘트
    isCommentOpen: boolean; // 코멘트 창 열림/닫힘 상태
}

// ✅ CustomerForm에서 내려주는 prop 타입 추가
interface FormQuestionProps {
    resetSignal: number;
}

// 체크리스트 카드 하나의 초기 상태
const createChecklistGroup = (id: number): ChecklistGroup => ({
    id,
    title: "",
    rules: Array(6).fill(""), // check list 1 ~ 6
    selectedIndexes: [],
    evidences: {},
    comment: "",
    isCommentOpen: false,
});

export function FormQuestion2({ resetSignal }: FormQuestionProps) {
    // 여러 개의 체크리스트 카드 관리
    const [groups, setGroups] = useState<ChecklistGroup[]>([
        createChecklistGroup(1),
    ]);

    // ✅ resetSignal이 바뀔 때마다 상태 초기화
    useEffect(() => {
        setGroups([createChecklistGroup(1)]); // 카드 하나만, 완전 초기 상태로
    }, [resetSignal]);

    // 카드(체크리스트 전체) 추가
    const handleAddGroup = () => {
        setGroups((prev) => [...prev, createChecklistGroup(prev.length + 1)]);
    };

    // 카드(체크리스트 전체) 제거 – 최소 1개는 남기기
    const handleRemoveGroup = () => {
        setGroups((prev) => (prev.length <= 1 ? prev : prev.slice(0, -1)));
    };

    const toggleComment = (groupIndex: number) => {
        setGroups((prev) =>
            prev.map((g, i) =>
                i === groupIndex ? { ...g, isCommentOpen: !g.isCommentOpen } : g,
            ),
        );
    };

    const updateComment = (groupIndex: number, value: string) => {
        setGroups((prev) =>
            prev.map((g, i) =>
                i === groupIndex ? { ...g, comment: value } : g,
            ),
        );
    };

    return (
        <div>
            {/* 상단 제목 + 카드 전체 추가/삭제 버튼 */}
            <div className="flex items-center justify-between mb-2">
                <Label2 className="flex items-center gap-1 text-sm font-medium">
                    체크리스트
                </Label2>

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={handleAddGroup}
                        className="h-6 w-6 rounded-md border text-xs flex items-center justify-center hover:bg-muted/80"
                    >
                        +
                    </button>
                    <button
                        type="button"
                        onClick={handleRemoveGroup}
                        className="h-6 w-6 rounded-md border text-xs flex items-center justify-center hover:bg-muted/80"
                    >
                        -
                    </button>
                </div>
            </div>

            {/* 체크리스트 카드들 */}
            <div className="space-y-6">
                {groups.map((group, groupIndex) => (
                    <Card2
                        key={group.id}
                        className="border border-border/60 shadow-none bg-muted/40"
                    >
                        <CardContent className="pt-4">
                            {/* 체크리스트 본문 */}
                            <CheckboxQuestion2
                                titleValue={group.title}
                                onTitleChange={(value) =>
                                    setGroups((prev) =>
                                        prev.map((g, i) =>
                                            i === groupIndex ? { ...g, title: value } : g,
                                        ),
                                    )
                                }
                                fieldName={`preCheck-${group.id}`}
                                options={group.rules}
                                selectedIndexes={group.selectedIndexes}
                                onSelectionChange={(itemIndex, checked) =>
                                    setGroups((prev) =>
                                        prev.map((g, i) => {
                                            if (i !== groupIndex) return g;
                                            const selected = checked
                                                ? [...g.selectedIndexes, itemIndex]
                                                : g.selectedIndexes.filter((v) => v !== itemIndex);
                                            return { ...g, selectedIndexes: selected };
                                        }),
                                    )
                                }
                                evidences={group.evidences}
                                onEvidenceUpload={(evidenceId, files) =>
                                    setGroups((prev) =>
                                        prev.map((g, i) => {
                                            if (i !== groupIndex) return g;
                                            return {
                                                ...g,
                                                evidences: { ...g.evidences, [evidenceId]: files },
                                            };
                                        }),
                                    )
                                }
                                onOptionChange={(itemIndex, newValue) =>
                                    setGroups((prev) =>
                                        prev.map((g, i) => {
                                            if (i !== groupIndex) return g;
                                            const nextRules = [...g.rules];
                                            nextRules[itemIndex] = newValue;
                                            return { ...g, rules: nextRules };
                                        }),
                                    )
                                }
                            />

                            {/* 하단: 말풍선 버튼 + 코멘트 영역 */}
                            <div className="mt-4 mb-2 flex justify-end w-full">
                                <button
                                    type="button"
                                    onClick={() => toggleComment(groupIndex)}
                                    className="h-8 w-8 flex items-center justify-center rounded-md border border-border bg-background hover:bg-muted transition-colors"
                                    aria-label="코멘트 작성"
                                >
                                    <MessagesSquare className="h-4 w-4 text-muted-foreground" />
                                </button>
                            </div>

                            {group.isCommentOpen && (
                                <div className="mt-3 pb-6">
                                    <Textarea2
                                        value={group.comment}
                                        onChange={(e) =>
                                            updateComment(groupIndex, e.target.value)
                                        }
                                        placeholder="이 체크리스트에 대한 코멘트를 입력해주세요"
                                        rows={3}
                                        className="text-sm"
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card2>
                ))}
            </div>
        </div>
    );
}