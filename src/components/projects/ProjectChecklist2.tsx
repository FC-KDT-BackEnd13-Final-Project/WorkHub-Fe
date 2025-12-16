import { useForm } from "react-hook-form";
import { useState, useMemo, useEffect, useRef, type MouseEvent } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Card2, CardContent, CardHeader, CardTitle } from "../ui/card2";
import { Input2 } from "../ui/input2";
import { Label2 } from "../ui/label2";
import { Textarea2 } from "../ui/textarea2";
import { Button2 } from "../ui/button2";
import { FormQuestion2, type FormQuestionHandle } from "../ui/FormQuestion2";
import { useLocalStorageValue } from "../../hooks/useLocalStorageValue";
import { PROFILE_STORAGE_KEY, normalizeUserRole } from "../../constants/profile";
import { projectApi } from "../../lib/api";

// 프로젝트 기본 정보를 작성하는 체크리스트 폼
interface ChecklistData {
  Name: string;
  mobile: string;
  startDate: string;
  endDate: string;
  request: string;
}

type StoredProfileSettings = {
  profile?: {
    id?: string | null;
    role?: string | null;
  } | null;
};

export function ProjectChecklist2() {
  const { projectId, nodeId } = useParams<{ projectId?: string; nodeId?: string }>();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ChecklistData>();
  const formQuestionRef = useRef<FormQuestionHandle>(null);

  const [storedProfileSettings] = useLocalStorageValue<StoredProfileSettings | null>(
    PROFILE_STORAGE_KEY,
    {
      defaultValue: null,
      parser: (value) => JSON.parse(value),
      serializer: (value) => JSON.stringify(value),
    },
  );

  const userRole = useMemo(
    () => normalizeUserRole(storedProfileSettings?.profile?.role) ?? null,
    [storedProfileSettings?.profile?.role],
  );
  const authorName = storedProfileSettings?.profile?.id?.trim() ?? "";
  const authorPhone = storedProfileSettings?.profile?.phone?.trim() ?? "";
  const isClient = userRole === "CLIENT";
  const roleLocksChecklist = userRole === "ADMIN" || userRole === "DEVELOPER";
  const [isLocked, setIsLocked] = useState(false);
  const [checklistSaveSignal, setChecklistSaveSignal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [existingChecklistId, setExistingChecklistId] = useState<number | null>(null);
  const authorId = authorName || "작성자";
  const hasRouteContext = Boolean(projectId && nodeId);
  const onSubmit = async (data: ChecklistData) => {
    if (isClient || (roleLocksChecklist && isLocked)) {
      return;
    }
    if (!hasRouteContext) {
      toast.error("프로젝트 또는 노드 정보가 없습니다.");
      return;
    }
    if (existingChecklistId) {
      toast.error("이미 등록된 체크리스트가 있습니다. 수정은 추후 지원 예정입니다.");
      return;
    }

    const items = formQuestionRef.current?.getChecklistItems() ?? [];
    if (!items.length) {
      toast.error("최소 1개의 체크리스트 항목을 입력해주세요.");
      return;
    }

    const description = data.request?.trim();
    if (!description) {
      toast.error("전달사항을 입력해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await projectApi.createCheckList(projectId!, nodeId!, {
        description,
        items,
      });

      toast.success("체크리스트가 생성되었습니다.");
      setChecklistSaveSignal((prev) => prev + 1);
      setExistingChecklistId(response.checkListId ?? null);
      if (roleLocksChecklist) {
        setIsLocked(true);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "체크리스트 저장에 실패했습니다.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!hasRouteContext) {
      setExistingChecklistId(null);
      setApiError(null);
      setIsLocked(false);
      setValue("Name", authorName);
      setValue("mobile", authorPhone);
      return;
    }

    let cancelled = false;
    const fetchChecklist = async () => {
      setIsFetching(true);
      setApiError(null);
      try {
        const response = await projectApi.getCheckList(projectId!, nodeId!);
        if (cancelled) return;

        if (!response) {
          setExistingChecklistId(null);
          setIsLocked(false);
          formQuestionRef.current?.setChecklistItems();
          setValue("request", "");
          return;
        }

        setExistingChecklistId(response.checkListId ?? null);
        setValue("request", response.description ?? "");
        setValue("Name", authorName);
        setValue("mobile", authorPhone);
        const checklistItems = (response.items ?? [])
          .slice()
          .sort((a, b) => (a.itemOrder ?? 0) - (b.itemOrder ?? 0))
          .map((item, index) => ({
            itemTitle: item.itemTitle ?? "",
            itemOrder: item.itemOrder ?? index,
            templateId: item.templateId ?? null,
            options: (item.options ?? [])
              .slice()
              .sort((a, b) => (a.optionOrder ?? 0) - (b.optionOrder ?? 0))
              .map((option) => ({
                optionContent: option.optionContent ?? "",
                optionOrder: option.optionOrder ?? 0,
                fileUrls:
                  (option.files ?? [])
                    .map((file) => file.fileUrl)
                    .filter((url): url is string => Boolean(url)),
              })),
          }));

        formQuestionRef.current?.setChecklistItems(checklistItems);
        if (roleLocksChecklist) {
          setIsLocked(true);
        }
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "체크리스트 조회에 실패했습니다.";
        setApiError(message);
      } finally {
        if (!cancelled) {
          setIsFetching(false);
        }
      }
    };

    fetchChecklist();

    return () => {
      cancelled = true;
    };
  }, [
    hasRouteContext,
    projectId,
    nodeId,
    roleLocksChecklist,
    setValue,
    authorName,
    authorPhone,
  ]);

  useEffect(() => {
    setValue("Name", authorName);
    setValue("mobile", authorPhone);
  }, [authorName, authorPhone, setValue]);

  const [questionResetKey, setQuestionResetKey] = useState(0);
  const [unlockSignal, setUnlockSignal] = useState(0);

  const handleReset = () => {
    if (isClient || (roleLocksChecklist && isLocked) || isSubmitting || isFetching) {
      return;
    }
    reset();
    setQuestionResetKey((prev) => prev + 1);
  };

  const isFormDisabled =
    isClient || (roleLocksChecklist && isLocked) || isSubmitting || isFetching;
  const allowClientReview = isClient;
  const handleUnlock = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isSubmitting || isFetching) {
      return;
    }
    setIsLocked(false);
    setUnlockSignal((prev) => prev + 1);
  };

  return (
      <div className={`max-w-4xl mx-auto p-6 ${isFormDisabled ? "no-disabled-opacity" : ""}`}>
        <Card2>
          <CardHeader className="pb-6">
            <CardTitle className="text-center">체크리스트 작성</CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            {apiError && (
              <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {apiError}
              </div>
            )}
            {!hasRouteContext && (
              <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                프로젝트와 노드 정보를 확인한 뒤 체크리스트를 작성할 수 있습니다.
              </div>
            )}
            {existingChecklistId && (
              <div className="mb-4 rounded-md border border-muted-foreground/30 bg-muted/40 p-3 text-sm text-muted-foreground">
                이미 저장된 체크리스트가 있어 새로 생성할 수 없습니다. 수정이 필요하면 담당자에게 문의해주세요.
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Row 1: 작성자 + 전화번호 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 작성자 */}
                <div className="space-y-2">
                  <Label2 htmlFor="Name">작성자</Label2>
                  <Input2
                      id="Name"
                      placeholder="이름"
                      disabled={true}
                      readOnly
                      {...register("Name", {
                        required: "이름은 필수입니다."
                      })}
                      className={errors.Name ? "border-destructive" : ""}
                  />
                  {errors.Name && (
                      <p className="text-sm text-destructive">
                        {errors.Name.message}
                      </p>
                  )}
                </div>

                {/* 전화번호 */}
                <div className="space-y-2">
                  <Label2 htmlFor="mobile">전화번호</Label2>
                  <Input2
                      id="mobile"
                      type="tel"
                      placeholder="010-0000-0000"
                      disabled={true}
                      readOnly
                      {...register("mobile", {
                        required: "전화번호는 필수입니다.",
                        pattern: {
                          value: /^[0-9+\-\s()]+$/,
                          message: "전화번호 형식이 올바르지 않습니다."
                        }
                      })}
                      className={errors.mobile ? "border-destructive" : ""}
                  />
                  {errors.mobile && (
                      <p className="text-sm text-destructive">
                        {errors.mobile.message}
                      </p>
                  )}
                </div>
              </div>

              {/* Row 2: 전달사항 */}
              <div className="space-y-2">
                <Label2 htmlFor="request" className="flex items-center gap-1">
                  전달사항
                </Label2>
                <Textarea2
                    id="request"
                    placeholder="전달사항을 입력해주세요"
                    rows={3}
                    disabled={isFormDisabled}
                    {...register("request", {
                      required: "전달사항은 필수입니다.",
                      maxLength: {
                        value: 500,
                        message: "전달사항은 500자 이하여야 합니다.",
                      },
                    })}
                    className={errors.request ? "border-destructive" : ""}
                />
                {errors.request && (
                    <p className="text-sm text-destructive">
                      {errors.request.message}
                    </p>
                )}
              </div>

              {/* Row 3: 체크리스트 */}
              <FormQuestion2
                  ref={formQuestionRef}
                  resetSignal={questionResetKey}
                  disabled={isFormDisabled}
                  unlockSignal={unlockSignal}
                  allowSelectionWhenDisabled={allowClientReview}
                  allowCommentWhenDisabled={allowClientReview}
                  commentAuthor={authorId}
                  saveSignal={checklistSaveSignal}
              />

              {!isClient && (
                <div className="flex flex-col md:flex-row gap-3 pt-6 pb-4 border-t">
                  {roleLocksChecklist && isLocked ? (
                      <Button2
                        type="button"
                        className="flex-1"
                        onClick={handleUnlock}
                        disabled={isSubmitting || isFetching}
                      >
                        수정
                      </Button2>
                  ) : (
                      <Button2
                        type="submit"
                        className="flex-1"
                        disabled={
                          isFormDisabled || !hasRouteContext || Boolean(existingChecklistId)
                        }
                      >
                        {isSubmitting ? "저장 중..." : "저장"}
                      </Button2>
                  )}

                  <Button2
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                      className="flex-1"
                      disabled={isFormDisabled}
                  >
                    초기화
                  </Button2>
                </div>
              )}
            </form>
          </CardContent>
        </Card2>
      </div>
  );
}
