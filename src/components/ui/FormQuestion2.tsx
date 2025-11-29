import { useState, useEffect } from "react";
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
    comment: string;
    isCommentOpen: boolean;
    status: "pending" | "approved" | "hold";
    locked: boolean;
}

interface FormQuestionProps {
    resetSignal: number;
}

const createChecklistGroup = (id: number): ChecklistGroup => ({
    id,
    title: "",
    rules: Array(6).fill(""), // check list 1 ~ 6 기본
    selectedIndexes: [],
    evidences: {},
    comment: "",
    isCommentOpen: false,
    status: "pending",
    locked: false,
});

export function FormQuestion2({ resetSignal }: FormQuestionProps) {
    const [groups, setGroups] = useState<ChecklistGroup[]>([
        createChecklistGroup(1),
    ]);

    // RESET
    useEffect(() => {
        setGroups([createChecklistGroup(1)]);
    }, [resetSignal]);

    // 체크리스트 카드 추가
    const handleAddGroup = () => {
        setGroups((prev) => [...prev, createChecklistGroup(prev.length + 1)]);
    };

    // 체크리스트 카드 제거
    const handleRemoveGroup = () => {
        setGroups((prev) => (prev.length <= 1 ? prev : prev.slice(0, -1)));
    };

    const toggleComment = (groupIndex: number) => {
        setGroups((prev) =>
            prev.map((g, i) =>
                i === groupIndex ? { ...g, isCommentOpen: !g.isCommentOpen } : g
            )
        );
    };

    const updateComment = (groupIndex: number, value: string) => {
        setGroups((prev) =>
            prev.map((g, i) =>
                i === groupIndex ? { ...g, comment: value } : g
            )
        );
    };

    return (
        <div>
            {/* 상단: 체크리스트 전체 + / - */}
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

                                onAddOption={() =>
                                    setGroups((prev) =>
                                        prev.map((g, i) =>
                                            i === groupIndex
                                                ? { ...g, rules: [...g.rules, ""] } // 새 항목 하나 추가
                                                : g,
                                        ),
                                    )
                                }
                                onRemoveOption={(removeIndex) =>
                                    setGroups((prev) =>
                                        prev.map((g, i) => {
                                            if (i !== groupIndex) return g;
                                            if (g.rules.length <= 1) return g; // 최소 한 개는 남기기

                                            // 1) rules에서 해당 인덱스 제거
                                            const newRules = g.rules.filter((_, idx) => idx !== removeIndex);

                                            // 2) 체크된 인덱스 재정렬
                                            const newSelected = g.selectedIndexes
                                                .filter((idx) => idx !== removeIndex)
                                                .map((idx) => (idx > removeIndex ? idx - 1 : idx));

                                            // 3) evidences 키 재정렬
                                            const prefix = `preCheck-${g.id}-`;
                                            const newEvidences: Record<string, File[]> = {};

                                            for (const [key, files] of Object.entries(g.evidences)) {
                                                // prefix랑 상관 없는 건 그대로 복사
                                                if (!key.startsWith(prefix)) {
                                                    newEvidences[key] = files;
                                                    continue;
                                                }

                                                const indexStr = key.slice(prefix.length);
                                                const oldIndex = Number(indexStr);

                                                // 숫자로 파싱이 안 되면 그냥 놔둠
                                                if (Number.isNaN(oldIndex)) {
                                                    newEvidences[key] = files;
                                                    continue;
                                                }

                                                // 지워진 인덱스면 건너뛰기 (=> 증거도 같이 삭제)
                                                if (oldIndex === removeIndex) {
                                                    continue;
                                                }

                                                // 그 뒤에 있던 인덱스는 -1 해줌
                                                const newIndex = oldIndex > removeIndex ? oldIndex - 1 : oldIndex;
                                                const newKey = `${prefix}${newIndex}`;
                                                newEvidences[newKey] = files;
                                            }

                                            return {
                                                ...g,
                                                rules: newRules,
                                                selectedIndexes: newSelected,
                                                evidences: newEvidences,
                                            };
                                        }),
                                    )
                                }
                            />

                            {/* 하단: 코멘트 / 버튼 영역 */}
                            <div className="mt-2 mb-2 flex items-center justify-between w-full gap-4">
                                {/* 말풍선 버튼 */}
                                <button
                                    type="button"
                                    onClick={() => toggleComment(groupIndex)}
                                    className="h-8 w-8 flex items-center justify-center rounded-md border border-border bg-background hover:bg-muted transition-colors"
                                >
                                    <MessagesSquare className="h-4 w-4 text-muted-foreground" />
                                </button>

                                {/* 동의 / 보류 버튼 */}
                                <div className="flex items-center gap-1 ml-auto">
                                    {/* 동의 */}
                                    <button
                                        type="button"
                                        disabled={group.locked}
                                        className={`h-9 px-4 text-sm rounded-md border ${
                                            group.status === "approved"
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-background border-border hover:bg-muted"
                                        } ${group.locked ? "opacity-70" : ""}`}
                                        onClick={() => {
                                            if (group.locked) return;
                                            if (!confirm("‘동의’로 확정하시겠습니까?")) return;
                                            setGroups((prev) =>
                                                prev.map((g, i) =>
                                                    i === groupIndex
                                                        ? { ...g, status: "approved", locked: true }
                                                        : g
                                                )
                                            );
                                        }}
                                    >
                                        동의
                                    </button>

                                    {/* 보류 */}
                                    <button
                                        type="button"
                                        disabled={group.locked}
                                        className={`h-9 px-4 text-sm rounded-md border ${
                                            group.status === "hold"
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-background border-border hover:bg-muted"
                                        } ${group.locked ? "opacity-70" : ""}`}
                                        onClick={() => {
                                            if (group.locked) return;
                                            if (!confirm("‘보류’로 확정하시겠습니까?")) return;
                                            setGroups((prev) =>
                                                prev.map((g, i) =>
                                                    i === groupIndex
                                                        ? { ...g, status: "hold", locked: true }
                                                        : g
                                                )
                                            );
                                        }}
                                    >
                                        보류
                                    </button>
                                </div>
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