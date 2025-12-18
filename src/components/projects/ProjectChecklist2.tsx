import { useForm } from "react-hook-form";
import { useState, useMemo, useEffect, useRef, useCallback, type MouseEvent } from "react";
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
import type {
  CheckListItemPayload,
  CheckListItemResponse,
  CheckListItemUpdatePayload,
  CheckListResponse,
  CheckListUpdateRequest,
} from "../../types/checkList";

// 프로젝트 기본 정보를 작성하는 체크리스트 폼
interface ChecklistData {
  Name: string;
  mobile: string;
  startDate: string;
  endDate: string;
  request: string;
}

type AuthorFields = {
  name: string;
  phone: string;
};

type StoredProfileSettings = {
  profile?: {
    id?: string | null;
    role?: string | null;
    phone?: string | null;
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
  const localAuthor = useMemo<AuthorFields>(
    () => ({
      name: authorName,
      phone: authorPhone,
    }),
    [authorName, authorPhone],
  );
  const canEditChecklist = userRole === "ADMIN" || userRole === "DEVELOPER";
  const roleLocksChecklist = canEditChecklist;
  const [isLocked, setIsLocked] = useState(false);
  const [checklistSaveSignal, setChecklistSaveSignal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [existingChecklistId, setExistingChecklistId] = useState<number | null>(null);
  const [serverChecklistItems, setServerChecklistItems] = useState<CheckListItemResponse[]>([]);
  const [serverDescription, setServerDescription] = useState("");
  const [appliedAuthor, setAppliedAuthor] = useState<AuthorFields>(localAuthor);
  const authorId = localAuthor.name || "작성자";
  const hasRouteContext = Boolean(projectId && nodeId);

  const deriveAuthorFields = useCallback(
    (response?: CheckListResponse | null): AuthorFields => {
      const safeTrim = (value?: string | null) => (typeof value === "string" ? value.trim() : "");
      if (!response) {
        return localAuthor;
      }
      const userSummary = response.user ?? null;
      const resolvedName =
        safeTrim(response.userName) ||
        safeTrim(response.userLoginId) ||
        safeTrim(userSummary?.userName) ||
        safeTrim(userSummary?.loginId) ||
        (typeof response.userId === "number" && response.userId > 0
          ? `사용자 #${response.userId}`
          : localAuthor.name);
      const resolvedPhone =
        safeTrim(response.userPhone) ||
        safeTrim(userSummary?.phone) ||
        safeTrim(userSummary?.mobile) ||
        localAuthor.phone;
      return {
        name: resolvedName || localAuthor.name,
        phone: resolvedPhone || localAuthor.phone,
      };
    },
    [localAuthor],
  );

  const buildChecklistPayloadFromResponse = useCallback(
    (items?: CheckListItemResponse[]): CheckListItemPayload[] => {
      if (!items || items.length === 0) {
        return [];
      }

      return items
        .slice()
        .sort((a, b) => (a.itemOrder ?? 0) - (b.itemOrder ?? 0))
        .map((item, itemIndex) => ({
          itemTitle: item.itemTitle ?? "",
          itemOrder: item.itemOrder ?? itemIndex,
          templateId: item.templateId ?? null,
          options: (item.options ?? [])
            .slice()
            .sort((a, b) => (a.optionOrder ?? 0) - (b.optionOrder ?? 0))
            .map((option, optionIndex) => ({
              optionContent: option.optionContent ?? "",
              optionOrder: option.optionOrder ?? optionIndex,
              fileUrls:
                (option.files ?? [])
                  .map((file) => file.fileUrl)
                  .filter((url): url is string => Boolean(url)),
            })),
        }));
    },
    [],
  );

  const applyChecklistSnapshot = useCallback(
    (description: string, items?: CheckListItemResponse[], authorFields?: AuthorFields) => {
      const normalizedDescription = description ?? "";
      const resolvedAuthor = authorFields ?? appliedAuthor;
      setServerDescription(normalizedDescription);
      setServerChecklistItems(items ?? []);
      setAppliedAuthor(resolvedAuthor);
      reset({
        Name: resolvedAuthor.name,
        mobile: resolvedAuthor.phone,
        request: normalizedDescription,
      });

      const payload = buildChecklistPayloadFromResponse(items);
      if (formQuestionRef.current) {
        if (payload.length > 0) {
          formQuestionRef.current.setChecklistItems(payload);
        } else {
          formQuestionRef.current.setChecklistItems();
        }
      }
    },
    [appliedAuthor, buildChecklistPayloadFromResponse, reset],
  );

  const buildCreateCommands = (items: CheckListItemPayload[]): CheckListItemUpdatePayload[] =>
    items.map((item, itemOrder) => ({
      changeType: "CREATE",
      itemTitle: item.itemTitle,
      itemOrder,
      templateId: item.templateId ?? null,
      options: (item.options ?? []).map((option, optionOrder) => ({
        changeType: "CREATE",
        optionContent: option.optionContent,
        optionOrder,
        files: option.fileUrls.map((fileUrl, fileOrder) => ({
          changeType: "CREATE" as const,
          fileUrl,
          fileOrder,
        })),
      })),
    }));
  const onSubmit = async (data: ChecklistData) => {
    if (!canEditChecklist || (roleLocksChecklist && isLocked)) {
      return;
    }
    if (!hasRouteContext) {
      toast.error("프로젝트 또는 노드 정보가 없습니다.");
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
      if (!existingChecklistId) {
        const response = await projectApi.createCheckList(projectId!, nodeId!, {
          description,
          items,
        });

        toast.success("체크리스트가 생성되었습니다.");
        setExistingChecklistId(response.checkListId ?? null);
        const createdAuthor = deriveAuthorFields(response);
        applyChecklistSnapshot(response.description ?? description, response.items ?? [], createdAuthor);
        if (roleLocksChecklist) {
          setIsLocked(true);
        }
      } else {
        const deleteCommands: CheckListItemUpdatePayload[] = serverChecklistItems
          .map((item) => item.checkListItemId)
          .filter((id): id is number => typeof id === "number")
          .map((id) => ({
            changeType: "DELETE" as const,
            checkListItemId: id,
          }));

        const createCommands = buildCreateCommands(items);
        const payload: CheckListUpdateRequest = {
          description,
          items: [...deleteCommands, ...createCommands],
        };

        const response = await projectApi.updateCheckList(projectId!, nodeId!, payload);
        toast.success("체크리스트가 수정되었습니다.");
        setExistingChecklistId(response.checkListId ?? existingChecklistId);
        const updatedAuthor = deriveAuthorFields(response);
        applyChecklistSnapshot(response.description ?? description, response.items ?? [], updatedAuthor);
        if (roleLocksChecklist) {
          setIsLocked(true);
        }
      }
      setChecklistSaveSignal((prev) => prev + 1);
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
      applyChecklistSnapshot("", [], localAuthor);
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
          applyChecklistSnapshot("", [], localAuthor);
          return;
        }

        setExistingChecklistId(response.checkListId ?? null);
        const fetchedAuthor = deriveAuthorFields(response);
        applyChecklistSnapshot(response.description ?? "", response.items ?? [], fetchedAuthor);
        if (roleLocksChecklist) {
          setIsLocked(true);
        } else {
          setIsLocked(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasRouteContext, projectId, nodeId, roleLocksChecklist]);

  useEffect(() => {
    if (existingChecklistId) {
      return;
    }
    setAppliedAuthor(localAuthor);
    setValue("Name", localAuthor.name);
    setValue("mobile", localAuthor.phone);
  }, [existingChecklistId, localAuthor, setValue]);

  const [questionResetKey, setQuestionResetKey] = useState(0);
  const [unlockSignal, setUnlockSignal] = useState(0);

  const handleReset = () => {
    if (!canEditChecklist || (roleLocksChecklist && isLocked) || isSubmitting || isFetching) {
      return;
    }
    if (existingChecklistId) {
      applyChecklistSnapshot(serverDescription, serverChecklistItems, appliedAuthor);
      if (roleLocksChecklist) {
        setIsLocked(true);
      }
      return;
    }
    applyChecklistSnapshot("", [], localAuthor);
    formQuestionRef.current?.setChecklistItems();
    setQuestionResetKey((prev) => prev + 1);
  };

  const isFormDisabled =
    !canEditChecklist || (roleLocksChecklist && isLocked) || isSubmitting || isFetching;
  const allowClientReview = false;
  const handleUnlock = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!canEditChecklist || isSubmitting || isFetching) {
      return;
    }
    setIsLocked(false);
    setUnlockSignal((prev) => prev + 1);
  };

  return (
      <div className={`max-w-4xl mx-auto px-8 sm:px-6 py-6 ${isFormDisabled ? "no-disabled-opacity" : ""}`}>
        <Card2 className="px-6 sm:px-0">
          <CardHeader className="pb-6 px-2 sm:px-6">
            <CardTitle className="text-center text-2xl">체크리스트 작성</CardTitle>
          </CardHeader>
          <CardContent className="pb-6 px-2 sm:px-6">
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
              <div className="mb-4 rounded-md bg-muted/40 px-3 py-2 text-sm font-medium text-blue-600 text-center">
                체크리스트가 이미 등록되어 있습니다. "수정" 버튼을 눌러 내용을 편집하고 다시 저장할 수 있습니다.
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

              {canEditChecklist && (
                <div className="flex flex-col md:flex-row gap-2 pt-4 pb-4 border-t">
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
                        disabled={isFormDisabled || !hasRouteContext}
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
