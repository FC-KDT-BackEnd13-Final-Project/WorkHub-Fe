import { useForm } from "react-hook-form";
import { useState, useMemo, useEffect, useRef, useCallback, type MouseEvent } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Archive, Layers, Sparkles, Trash2 } from "lucide-react";
import { Card2, CardContent, CardHeader, CardTitle } from "../ui/card2";
import { Input2 } from "../ui/input2";
import { Label2 } from "../ui/label2";
import { Textarea2 } from "../ui/textarea2";
import { Button2 } from "../ui/button2";
import { Checkbox2 } from "../ui/checkbox2";
import { FormQuestion2, type FormQuestionHandle } from "../ui/FormQuestion2";
import { useLocalStorageValue } from "../../hooks/useLocalStorageValue";
import { PROFILE_STORAGE_KEY, normalizeUserRole } from "../../constants/profile";
import { fileApi, projectApi } from "../../lib/api";
import { createPortal } from "react-dom";
import type { ConfirmStatus, NodeApiItem } from "../../types/projectNodeList";
import type {
  CheckListCommentResponse,
  CheckListItemPayload,
  CheckListItemResponse,
  CheckListItemStatus,
  CheckListItemUpdatePayload,
  CheckListResponse,
  CheckListUpdateRequest,
} from "../../types/checkList";

const CHECKLIST_TEMPLATE_STORAGE_KEY = "workhub:checklistTemplates:v1";

type ProjectChecklist2Props = {
  initialNodeInfo?: Partial<NodeApiItem> | null;
  nodeInfoLoading?: boolean;
};

type ChecklistTemplateDraft = {
  id: string;
  name: string;
  memo?: string;
  savedAt: string;
  request: string;
  items: CheckListItemPayload[];
};

const sanitizeTemplateItems = (items: CheckListItemPayload[]): CheckListItemPayload[] =>
  items.map((item) => ({
    itemTitle: item.itemTitle,
    itemOrder: item.itemOrder,
    templateId: item.templateId ?? null,
    options: (item.options ?? []).map((option) => ({
      optionContent: option.optionContent,
      optionOrder: option.optionOrder,
      fileUrls: [],
    })),
  }));

const parseTemplateStorage = (value: string): ChecklistTemplateDraft[] => {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item) => {
        const items = Array.isArray(item.items)
          ? sanitizeTemplateItems(item.items as CheckListItemPayload[])
          : ([] as CheckListItemPayload[]);
        return {
          id: typeof item.id === "string" ? item.id : `template-${Date.now()}`,
          name:
            typeof item.name === "string"
              ? item.name
              : typeof item.itemTitle === "string"
                ? (item.itemTitle as string)
                : "템플릿",
          memo:
            typeof item.memo === "string"
              ? item.memo
              : typeof item.description === "string"
                ? (item.description as string)
                : "",
          savedAt:
            typeof item.savedAt === "string" ? item.savedAt : new Date().toISOString(),
          request:
            typeof item.request === "string"
              ? item.request
              : typeof item.description === "string"
                ? (item.description as string)
                : "",
          items,
        } satisfies ChecklistTemplateDraft;
      })
      .filter((item) => Array.isArray(item.items));
  } catch (error) {
    console.error("템플릿 정보를 불러오지 못했습니다.", error);
    return [];
  }
};

const cloneTemplateItems = (items: CheckListItemPayload[]): CheckListItemPayload[] =>
  sanitizeTemplateItems(items);

const extractFileNameFromUrl = (value: string): string => {
  if (!value) return "첨부파일";
  try {
    const url = new URL(value);
    const lastChunk = url.pathname.split("/").filter(Boolean).pop();
    return decodeURIComponent(lastChunk ?? value);
  } catch {
    const sanitized = value.split("?")[0] ?? value;
    const fallback = sanitized.split("/").filter(Boolean).pop();
    return fallback ? decodeURIComponent(fallback) : value;
  }
};

const convertTemplateItemsToResponses = (
  items: CheckListItemPayload[],
): CheckListItemResponse[] => {
  const sanitizedItems = sanitizeTemplateItems(items);
  return sanitizedItems.map((item, itemIndex) => ({
    checkListItemId: -((itemIndex + 1) * 1000),
    itemTitle: item.itemTitle,
    itemOrder: typeof item.itemOrder === "number" ? item.itemOrder : itemIndex,
    status: null,
    confirmedAt: null,
    templateId: item.templateId ?? null,
    options: (item.options ?? []).map((option, optionIndex) => ({
      checkListOptionId: -((itemIndex + 1) * 1000 + optionIndex + 1),
      optionContent: option.optionContent,
      optionOrder: typeof option.optionOrder === "number" ? option.optionOrder : optionIndex,
      // 템플릿 적용 시 첨부파일은 제외 (S3 URL 충돌 방지)
      files: [],
    })),
  }));
};

const formatTemplateTimestamp = (value: string): string => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("ko", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const generateTemplateId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `template-${Date.now()}`;
};

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

export function ProjectChecklist2({ initialNodeInfo = null, nodeInfoLoading = false }: ProjectChecklist2Props) {
  const { projectId, nodeId } = useParams<{ projectId?: string; nodeId?: string }>();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ChecklistData>();
  const formQuestionRef = useRef<FormQuestionHandle>(null);
  const [storedTemplates, setStoredTemplates] = useLocalStorageValue<ChecklistTemplateDraft[]>(
    CHECKLIST_TEMPLATE_STORAGE_KEY,
    {
      defaultValue: [],
      parser: parseTemplateStorage,
      serializer: (value) => JSON.stringify(value ?? []),
    },
  );
  const templates = useMemo(() => {
    const items = Array.isArray(storedTemplates) ? storedTemplates : [];
    return [...items].sort(
      (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
    );
  }, [storedTemplates]);
  const [isTemplateListOpen, setTemplateListOpen] = useState(false);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateMemo, setTemplateMemo] = useState("");
  const [shouldValidateTemplate, setShouldValidateTemplate] = useState(false);

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
  const isClient = userRole === "CLIENT";
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
  const [isConfirmingFinalApproval, setIsConfirmingFinalApproval] = useState(false);
  const [nodeConfirmStatus, setNodeConfirmStatus] = useState<ConfirmStatus | null>(null);
  const [nodeRejectText, setNodeRejectText] = useState<string | null>(null);
  const [isRejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  useEffect(() => {
    if (!isRejectModalOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setRejectModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isRejectModalOpen]);
  const [existingChecklistId, setExistingChecklistId] = useState<number | null>(null);
  const [serverChecklistItems, setServerChecklistItems] = useState<CheckListItemResponse[]>([]);
  const [serverDescription, setServerDescription] = useState("");
  const [appliedAuthor, setAppliedAuthor] = useState<AuthorFields>(localAuthor);
  const authorId = localAuthor.name || "작성자";
  const hasRouteContext = Boolean(projectId && nodeId);
  const nodeInfoRef = useRef<NodeApiItem | null>(null);

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

  const appliedAuthorRef = useRef(appliedAuthor);
  const resetRef = useRef(reset);

  useEffect(() => {
    appliedAuthorRef.current = appliedAuthor;
    resetRef.current = reset;
  }, [appliedAuthor, reset]);

  const applyChecklistSnapshot = useCallback(
    (description: string, items?: CheckListItemResponse[], authorFields?: AuthorFields) => {
      const normalizedDescription = description ?? "";
      const resolvedAuthor = authorFields ?? appliedAuthorRef.current;
      setServerDescription(normalizedDescription);
      setServerChecklistItems(items ?? []);
      setAppliedAuthor(resolvedAuthor);
      resetRef.current({
        Name: resolvedAuthor.name,
        mobile: resolvedAuthor.phone,
        request: normalizedDescription,
      });

      if (formQuestionRef.current) {
        const nextItems = items && items.length > 0 ? items : undefined;
        formQuestionRef.current.setChecklistItems(nextItems);
      }
    },
    [],
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

  /**
   * 부분 업데이트: 실제 변경된 항목만 감지하여 UPDATE/CREATE/DELETE 명령 생성
   *
   * 매칭 전략:
   * - itemOrder 기준으로 매칭 (같은 위치 = 같은 항목)
   * - itemOrder가 기존 범위를 벗어나면 CREATE
   * - 기존 항목 중 새 목록에 없는 것은 DELETE
   */
  const buildUpdateCommands = (
    existingItems: CheckListItemResponse[],
    newItems: CheckListItemPayload[],
  ): CheckListItemUpdatePayload[] => {
    const commands: CheckListItemUpdatePayload[] = [];
    const processedIds = new Set<number>();

    // 1. 새 항목들을 순회하면서 CREATE 또는 UPDATE 판단
    newItems.forEach((newItem, newIndex) => {
      // 같은 순서(index)의 기존 항목이 있는지 확인
      const existingItem = existingItems[newIndex];

      if (!existingItem || existingItem.checkListItemId < 0) {
        // CREATE: 기존 항목이 없거나 임시 ID인 경우
        commands.push({
          changeType: "CREATE",
          itemTitle: newItem.itemTitle,
          itemOrder: newIndex,
          templateId: newItem.templateId ?? null,
          options: (newItem.options ?? []).map((option, optionOrder) => ({
            changeType: "CREATE",
            optionContent: option.optionContent,
            optionOrder,
            files: option.fileUrls.map((fileUrl, fileOrder) => ({
              changeType: "CREATE" as const,
              fileUrl,
              fileOrder,
            })),
          })),
        });
      } else {
        // UPDATE: 기존 항목 수정
        const itemId = existingItem.checkListItemId;
        processedIds.add(itemId);

        const titleChanged = existingItem.itemTitle !== newItem.itemTitle;
        const orderChanged = existingItem.itemOrder !== newIndex;
        const templateChanged = (existingItem.templateId ?? null) !== (newItem.templateId ?? null);

        // 옵션 변경 감지
        const optionCommands = buildOptionUpdateCommands(
          existingItem.options ?? [],
          newItem.options ?? []
        );

        // 항목이나 옵션이 변경된 경우에만 UPDATE 명령 추가
        if (titleChanged || orderChanged || templateChanged || optionCommands.length > 0) {
          commands.push({
            changeType: "UPDATE",
            checkListItemId: itemId,
            itemTitle: titleChanged ? newItem.itemTitle : undefined,
            itemOrder: orderChanged ? newIndex : undefined,
            templateId: templateChanged ? (newItem.templateId ?? null) : undefined,
            options: optionCommands.length > 0 ? optionCommands : undefined,
          });
        }
      }
    });

    // 2. 삭제된 항목 찾기 (새 목록보다 기존 목록이 더 긴 경우)
    for (let i = newItems.length; i < existingItems.length; i++) {
      const item = existingItems[i];
      if (item.checkListItemId > 0 && !processedIds.has(item.checkListItemId)) {
        commands.push({
          changeType: "DELETE",
          checkListItemId: item.checkListItemId,
        });
      }
    }

    return commands;
  };

  /**
   * 옵션 변경 감지 및 명령 생성
   */
  const buildOptionUpdateCommands = (
    existingOptions: CheckListOptionResponse[],
    newOptions: CheckListOptionPayload[],
  ) => {
    const commands: any[] = [];
    const existingOptionsMap = new Map(
      existingOptions.map((opt) => [opt.checkListOptionId, opt])
    );
    const processedIds = new Set<number>();

    // 1. 새 옵션들을 순회하면서 CREATE 또는 UPDATE 판단
    newOptions.forEach((newOption, optionOrder) => {
      const existingOption = existingOptions.find(
        (opt) => opt.optionContent === newOption.optionContent && opt.optionOrder === optionOrder
      );

      if (!existingOption || existingOption.checkListOptionId < 0) {
        // CREATE: 새 옵션 추가
        commands.push({
          changeType: "CREATE",
          optionContent: newOption.optionContent,
          optionOrder,
          files: newOption.fileUrls.map((fileUrl, fileOrder) => ({
            changeType: "CREATE" as const,
            fileUrl,
            fileOrder,
          })),
        });
      } else {
        // UPDATE: 기존 옵션 수정
        const optionId = existingOption.checkListOptionId;
        processedIds.add(optionId);

        const contentChanged = existingOption.optionContent !== newOption.optionContent;
        const orderChanged = existingOption.optionOrder !== optionOrder;

        // 파일 변경 감지
        const fileCommands = buildFileUpdateCommands(
          existingOption.files ?? [],
          newOption.fileUrls ?? []
        );

        if (contentChanged || orderChanged || fileCommands.length > 0) {
          commands.push({
            changeType: "UPDATE",
            checkListOptionId: optionId,
            optionContent: contentChanged ? newOption.optionContent : undefined,
            optionOrder: orderChanged ? optionOrder : undefined,
            files: fileCommands.length > 0 ? fileCommands : undefined,
          });
        }
      }
    });

    // 2. 삭제된 옵션 찾기
    existingOptions.forEach((option) => {
      if (option.checkListOptionId > 0 && !processedIds.has(option.checkListOptionId)) {
        commands.push({
          changeType: "DELETE",
          checkListOptionId: option.checkListOptionId,
        });
      }
    });

    return commands;
  };

  /**
   * 파일 변경 감지 및 명령 생성
   */
  const buildFileUpdateCommands = (
    existingFiles: CheckListOptionFileResponse[],
    newFileUrls: string[],
  ) => {
    const commands: any[] = [];
    const existingFileUrlsMap = new Map(
      existingFiles.map((file) => [file.fileUrl, file])
    );
    const processedIds = new Set<number>();

    // 1. 새 파일들을 순회
    newFileUrls.forEach((fileUrl, fileOrder) => {
      const existingFile = existingFiles.find((file) => file.fileUrl === fileUrl);

      if (!existingFile) {
        // CREATE: 새 파일 추가
        commands.push({
          changeType: "CREATE" as const,
          fileUrl,
          fileOrder,
        });
      } else {
        // UPDATE: 파일 순서 변경 체크
        const fileId = existingFile.checkListOptionFileId;
        processedIds.add(fileId);

        if (existingFile.fileOrder !== fileOrder) {
          commands.push({
            changeType: "UPDATE" as const,
            checkListOptionFileId: fileId,
            fileUrl: undefined, // URL은 변경 안 함
            fileOrder,
          });
        }
        // 순서도 안 변경된 경우 명령 생성 안 함 (기존 유지)
      }
    });

    // 2. 삭제된 파일 찾기
    existingFiles.forEach((file) => {
      if (!processedIds.has(file.checkListOptionFileId)) {
        commands.push({
          changeType: "DELETE" as const,
          checkListOptionFileId: file.checkListOptionFileId,
        });
      }
    });

    return commands;
  };

  const templateCount = templates.length;

  const persistTemplateDraft = useCallback(
    (payload: { name: string; memo: string; request: string; items: CheckListItemPayload[] }) => {
      const nextTemplate: ChecklistTemplateDraft = {
        id: generateTemplateId(),
        name: payload.name,
        memo: payload.memo || undefined,
        savedAt: new Date().toISOString(),
        request: payload.request,
        items: cloneTemplateItems(payload.items),
      };
      setStoredTemplates((previousTemplates) => {
        const base = Array.isArray(previousTemplates) ? previousTemplates : [];
        return [nextTemplate, ...base].slice(0, 20);
      });
      toast.success("템플릿으로 저장했습니다.");
    },
    [setStoredTemplates],
  );

  const handleTemplateApply = useCallback(
    (templateId: string) => {
      const target = templates.find((template) => template.id === templateId);
      if (!target) {
        toast.error("선택한 템플릿을 찾을 수 없습니다.");
        return;
      }
      const convertedItems = convertTemplateItemsToResponses(target.items ?? []);
      formQuestionRef.current?.setChecklistItems(convertedItems);
      setValue("request", target.request ?? "", { shouldDirty: true });
      setTemplateListOpen(false);
      toast.success("템플릿을 적용했습니다.");
    },
    [setValue, templates],
  );

  const handleTemplateDelete = useCallback(
    (templateId: string) => {
      if (typeof window !== "undefined") {
        const confirmed = window.confirm("선택한 템플릿을 삭제할까요?");
        if (!confirmed) {
          return;
        }
      }
      setStoredTemplates((previousTemplates) => {
        const base = Array.isArray(previousTemplates) ? previousTemplates : [];
        return base.filter((template) => template.id !== templateId);
      });
      toast.success("템플릿을 삭제했습니다.");
    },
    [setStoredTemplates],
  );

  const handleTemplateToggle = useCallback((nextValue: boolean) => {
    setSaveAsTemplate(nextValue);
    if (!nextValue) {
      setShouldValidateTemplate(false);
    }
  }, []);

  const handleChecklistAttachmentDownload = useCallback(
    async (fileKey: string, fileName: string) => {
      if (!fileKey) {
        toast.error("다운로드할 파일 정보를 찾을 수 없습니다.");
        return;
      }

      // 링크 형태의 첨부는 새 탭으로 이동만 시킨다.
      if (/^https?:\/\//i.test(fileKey)) {
        if (typeof window !== "undefined") {
          window.open(fileKey, "_blank", "noopener,noreferrer");
        }
        return;
      }

      try {
        const fileInfo = await fileApi.getDownloadUrl(fileKey, fileName);
        const targetUrl = fileInfo?.presignedUrl ?? fileInfo?.fileUrl;
        if (!targetUrl) {
          throw new Error("다운로드 URL이 없습니다.");
        }
        const anchor = document.createElement("a");
        anchor.href = targetUrl;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      } catch (error) {
        console.error("체크리스트 첨부 다운로드 실패", error);
        toast.error("파일을 다운로드할 수 없습니다. 잠시 후 다시 시도해주세요.");
      }
    },
    [],
  );

  const handleChecklistItemStatusChange = useCallback(
    async (checkListItemId: number, nextStatus: CheckListItemStatus) => {
      if (!projectId || !nodeId || !existingChecklistId) {
        toast.error("체크리스트 정보를 찾을 수 없습니다.");
        return false;
      }

      try {
        await projectApi.updateCheckListItemStatus(
          projectId,
          nodeId,
          existingChecklistId,
          checkListItemId,
          nextStatus,
        );
        setServerChecklistItems((prev) =>
          prev.map((item) =>
            item.checkListItemId === checkListItemId
              ? { ...item, status: nextStatus }
              : item,
          ),
        );
        toast.success(
          nextStatus === "AGREED"
            ? "해당 항목을 동의로 설정했습니다."
            : "해당 항목을 보류로 설정했습니다.",
        );
        return true;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "체크리스트 상태 변경에 실패했습니다.";
        toast.error(message);
        return false;
      }
    },
    [existingChecklistId, nodeId, projectId, setServerChecklistItems],
  );
  const checklistStatusUpdater = existingChecklistId
    ? handleChecklistItemStatusChange
    : undefined;

  const handleChecklistCommentSubmit = useCallback(
    async (
      params: {
        checkListItemId: number;
        content: string;
        attachments: File[];
        fileMeta: { fileName: string; fileOrder: number }[];
        parentCommentId?: number | null;
      },
    ): Promise<CheckListCommentResponse | void> => {
      if (!projectId || !nodeId || !existingChecklistId) {
        toast.error("체크리스트 정보를 찾을 수 없습니다.");
        throw new Error("체크리스트 정보를 찾을 수 없습니다.");
      }

      const { checkListItemId, content, attachments, fileMeta, parentCommentId = null } = params;

      try {
        return await projectApi.createCheckListComment(
          projectId,
          nodeId,
          existingChecklistId,
          checkListItemId,
          {
            content,
            parentCommentId,
            files: fileMeta,
          },
          attachments,
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "체크리스트 댓글 작성에 실패했습니다.";
        toast.error(message);
        throw error;
      }
    },
    [existingChecklistId, nodeId, projectId],
  );

  const checklistCommentSubmitter = existingChecklistId
    ? handleChecklistCommentSubmit
    : undefined;

  const handleChecklistCommentFetch = useCallback(
    async (checkListItemId: number): Promise<CheckListCommentResponse[]> => {
      if (!projectId || !nodeId || !existingChecklistId) {
        throw new Error("체크리스트 정보를 찾을 수 없습니다.");
      }

      try {
        return await projectApi.getCheckListComments(
          projectId,
          nodeId,
          existingChecklistId,
          checkListItemId,
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "체크리스트 댓글 조회에 실패했습니다.";
        throw new Error(message);
      }
    },
    [existingChecklistId, nodeId, projectId],
  );

  const checklistCommentFetcher = existingChecklistId ? handleChecklistCommentFetch : undefined;

  const handleChecklistCommentUpdate = useCallback(
    async (
      params: {
        checkListItemId: number;
        commentId: number;
        content: string;
        attachments: File[];
        fileMeta: { fileName: string; fileOrder: number }[];
      },
    ): Promise<CheckListCommentResponse | void> => {
      if (!projectId || !nodeId || !existingChecklistId) {
        toast.error("체크리스트 정보를 찾을 수 없습니다.");
        throw new Error("체크리스트 정보를 찾을 수 없습니다.");
      }

      const { checkListItemId, commentId, content, attachments, fileMeta } = params;

      try {
        return await projectApi.updateCheckListComment(
          projectId,
          nodeId,
          existingChecklistId,
          checkListItemId,
          commentId,
          {
            content,
            files: fileMeta,
          },
          attachments,
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "체크리스트 댓글 수정에 실패했습니다.";
        toast.error(message);
        throw error;
      }
    },
    [existingChecklistId, nodeId, projectId],
  );

  const checklistCommentUpdater = existingChecklistId ? handleChecklistCommentUpdate : undefined;

  const handleChecklistCommentDelete = useCallback(
    async (params: { checkListItemId: number; commentId: number }) => {
      if (!projectId || !nodeId || !existingChecklistId) {
        toast.error("체크리스트 정보를 찾을 수 없습니다.");
        throw new Error("체크리스트 정보를 찾을 수 없습니다.");
      }

      const { checkListItemId, commentId } = params;

      try {
        await projectApi.deleteCheckListComment(
          projectId,
          nodeId,
          existingChecklistId,
          checkListItemId,
          commentId,
        );
        toast.success("댓글이 삭제되었습니다.");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "체크리스트 댓글 삭제에 실패했습니다.";
        toast.error(message);
        throw error instanceof Error ? error : new Error(message);
      }
    },
    [existingChecklistId, nodeId, projectId],
  );

  const checklistCommentDeleter = existingChecklistId ? handleChecklistCommentDelete : undefined;
  const onSubmit = async (data: ChecklistData) => {
    if (!canEditChecklist || (roleLocksChecklist && isLocked)) {
      return;
    }
    if (!hasRouteContext) {
      toast.error("프로젝트 또는 노드 정보가 없습니다.");
      return;
    }

    const submission = formQuestionRef.current?.getChecklistSubmission();
    const items = submission?.items ?? [];
    const files = submission?.files ?? [];
    if (!items.length) {
      toast.error("최소 1개의 체크리스트 항목을 입력해주세요.");
      return;
    }

    const description = data.request?.trim();
    if (!description) {
      toast.error("전달사항을 입력해주세요.");
      return;
    }

    const trimmedTemplateName = templateName.trim();
    const trimmedTemplateMemo = templateMemo.trim();
    if (saveAsTemplate && !trimmedTemplateName) {
      setShouldValidateTemplate(true);
      toast.error("템플릿 제목을 입력해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);
      if (!existingChecklistId) {
        const response = await projectApi.createCheckList(
          projectId!,
          nodeId!,
          {
            description,
            items,
            saveAsTemplate: saveAsTemplate ? true : false,
            templateTitle: saveAsTemplate ? trimmedTemplateName : undefined,
            templateDescription: saveAsTemplate ? trimmedTemplateMemo : undefined,
          },
          files,
        );

        toast.success("체크리스트가 생성되었습니다.");
        setExistingChecklistId(response.checkListId ?? null);
        const createdAuthor = deriveAuthorFields(response);
        applyChecklistSnapshot(response.description ?? description, response.items ?? [], createdAuthor);
        if (roleLocksChecklist) {
          setIsLocked(true);
        }
      } else {
        // 부분 업데이트: 실제 변경된 항목만 감지하여 전송
        const updateCommands = buildUpdateCommands(serverChecklistItems, items);
        const payload: CheckListUpdateRequest = {
          description,
          items: updateCommands,
        };

        const response = await projectApi.updateCheckList(projectId!, nodeId!, payload, files);
        toast.success("체크리스트가 수정되었습니다.");
        setExistingChecklistId(response.checkListId ?? existingChecklistId);
        const updatedAuthor = deriveAuthorFields(response);
        applyChecklistSnapshot(response.description ?? description, response.items ?? [], updatedAuthor);
        if (roleLocksChecklist) {
          setIsLocked(true);
        }
      }
      if (saveAsTemplate) {
        // 서버에 템플릿 저장 요청은 이미 API로 전송됨
        // 추가로 로컬 스토리지에도 저장 (백업용)
        persistTemplateDraft({
          name: trimmedTemplateName,
          memo: trimmedTemplateMemo,
          request: description,
          items,
        });
        handleTemplateToggle(false);
        setTemplateName("");
        setTemplateMemo("");
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
      nodeInfoRef.current = null;
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
    if (!hasRouteContext) {
      nodeInfoRef.current = null;
      return;
    }

    if (initialNodeInfo) {
      const normalizedRejectText =
        typeof initialNodeInfo.rejectText === "string"
          ? initialNodeInfo.rejectText.trim() || null
          : initialNodeInfo.rejectText ?? null;
      nodeInfoRef.current = {
        ...nodeInfoRef.current,
        ...initialNodeInfo,
        rejectText: normalizedRejectText,
      };
      setNodeRejectText(normalizedRejectText ?? null);
      const fetchedStatus =
        typeof initialNodeInfo === "string"
          ? (initialNodeInfo as unknown as ConfirmStatus)
          : (initialNodeInfo as any)?.confirmStatus ?? null;
      setNodeConfirmStatus(fetchedStatus);
      return;
    }

    if (nodeInfoLoading) {
      return;
    }

    let cancelled = false;

    const fetchNodeInfo = async () => {
      try {
        const nodeData = await projectApi.getNode(projectId!, nodeId!);
        if (cancelled) return;
        if (typeof nodeData === "object" && nodeData !== null) {
          const normalizedRejectText =
            typeof nodeData.rejectText === "string"
              ? nodeData.rejectText.trim() || null
              : nodeData.rejectText ?? null;
          nodeInfoRef.current = { ...nodeData, rejectText: normalizedRejectText };
          setNodeRejectText(normalizedRejectText);
        } else {
          nodeInfoRef.current = nodeData;
          setNodeRejectText(null);
        }
        const fetchedStatus =
          typeof nodeData === "string" ? nodeData : nodeData?.confirmStatus ?? null;
        setNodeConfirmStatus(fetchedStatus);
      } catch (error) {
        if (cancelled) return;
        console.error("노드 정보 조회 실패", error);
      }
    };

    fetchNodeInfo();

    return () => {
      cancelled = true;
    };
  }, [hasRouteContext, initialNodeInfo, nodeInfoLoading, projectId, nodeId]);

  useEffect(() => {
    if (existingChecklistId) {
      return;
    }
    setAppliedAuthor(localAuthor);
    setValue("Name", localAuthor.name);
    setValue("mobile", localAuthor.phone);
  }, [existingChecklistId, localAuthor, setValue]);
  useEffect(() => {
    if (existingChecklistId) {
      handleTemplateToggle(false);
      setTemplateName("");
      setTemplateMemo("");
      setTemplateListOpen(false);
    }
  }, [existingChecklistId, handleTemplateToggle]);

  const [questionResetKey, setQuestionResetKey] = useState(0);
  const [unlockSignal, setUnlockSignal] = useState(0);

  const handleReset = () => {
    if (!canEditChecklist || (roleLocksChecklist && isLocked) || isSubmitting || isFetching) {
      return;
    }
    handleTemplateToggle(false);
    setTemplateName("");
    setTemplateMemo("");
    setTemplateListOpen(false);
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
  const shouldShowDecisionButtons =
    Boolean(existingChecklistId) && isFormDisabled && !canEditChecklist;
  const shouldShowStatusBadges = Boolean(existingChecklistId);
  const allowCommentsWhileLocked = Boolean(existingChecklistId);
  const allowClientReview = false;
  const isCreatingChecklist = !existingChecklistId;
  const templateTitleError =
    isCreatingChecklist && saveAsTemplate && shouldValidateTemplate && !templateName.trim().length;
  const templateButtonLabel = templateCount ? `템플릿 가져오기 (${templateCount})` : "템플릿 가져오기";
  const templateButtonDisabled =
    !isCreatingChecklist || !canEditChecklist || (roleLocksChecklist && isLocked) || isSubmitting || isFetching;
  const allItemsAgreed = useMemo(
    () =>
      serverChecklistItems.length > 0 &&
      serverChecklistItems.every((item) => (item.status ?? "PENDING") === "AGREED"),
    [serverChecklistItems],
  );
  const normalizedConfirmStatus = useMemo(() => {
    const source =
      nodeConfirmStatus ??
      (typeof nodeInfoRef.current === "string"
        ? nodeInfoRef.current
        : nodeInfoRef.current?.confirmStatus ?? null);
    return typeof source === "string" ? source.toUpperCase() : "";
  }, [nodeConfirmStatus]);
  const isNodeApproved = normalizedConfirmStatus === "APPROVED";
  const isNodePending = normalizedConfirmStatus === "PENDING";
  const shouldShowFinalApprovalButton =
    canEditChecklist && Boolean(existingChecklistId) && isLocked && allItemsAgreed;
  const shouldShowClientApprovalButtons = !canEditChecklist && isNodePending;
  const shouldShowRejectNotice =
    canEditChecklist && normalizedConfirmStatus === "REJECTED" && Boolean(nodeRejectText);
  const handleUnlock = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!canEditChecklist || isSubmitting || isFetching) {
      return;
    }
    setIsLocked(false);
    setUnlockSignal((prev) => prev + 1);
  };

  const handleFinalApprovalRequest = useCallback(async () => {
    if (!projectId || !nodeId || !existingChecklistId) {
      toast.error("체크리스트 정보를 찾을 수 없습니다.");
      return;
    }
    if (isConfirmingFinalApproval || isSubmitting || isFetching) {
      return;
    }
    const confirmed = window.confirm("최종 승인 요청을 보내시겠습니까?");
    if (!confirmed) return;
    try {
      setIsConfirmingFinalApproval(true);
      await projectApi.requestNodeFinalApproval(projectId, nodeId, {
        confirmStatus: "PENDING",
        rejectMessage: null,
      });
      toast.success("최종 승인 요청을 보냈습니다.");
      setNodeConfirmStatus("PENDING");
      nodeInfoRef.current =
        typeof nodeInfoRef.current === "object" && nodeInfoRef.current !== null
          ? { ...nodeInfoRef.current, confirmStatus: "PENDING" }
          : { confirmStatus: "PENDING" };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "최종 승인 요청에 실패했습니다.";
      toast.error(message);
    } finally {
      setIsConfirmingFinalApproval(false);
    }
  }, [existingChecklistId, isConfirmingFinalApproval, isFetching, isSubmitting, nodeId, projectId]);

  const handleClientApproval = useCallback(
    async (nextStatus: ConfirmStatus, rejectMessage: string | null) => {
      if (!projectId || !nodeId) {
        toast.error("프로젝트 또는 노드 정보를 찾을 수 없습니다.");
        return;
      }
      if (isConfirmingFinalApproval || isSubmitting || isFetching) {
        return;
      }

      try {
        setIsConfirmingFinalApproval(true);
        await projectApi.requestNodeFinalApproval(projectId, nodeId, {
          confirmStatus: nextStatus,
          rejectMessage,
        });
        setNodeConfirmStatus(nextStatus);
        nodeInfoRef.current =
          typeof nodeInfoRef.current === "object" && nodeInfoRef.current !== null
            ? {
                ...nodeInfoRef.current,
                confirmStatus: nextStatus,
                rejectText: nextStatus === "REJECTED" ? rejectMessage?.trim() || null : null,
              }
            : {
                confirmStatus: nextStatus,
                rejectText: nextStatus === "REJECTED" ? rejectMessage?.trim() || null : null,
              };
        setNodeRejectText(nextStatus === "REJECTED" ? rejectMessage?.trim() || null : null);
        toast.success(nextStatus === "APPROVED" ? "승인되었습니다." : "보류되었습니다.");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "승인 요청 처리에 실패했습니다.";
        toast.error(message);
      } finally {
        setIsConfirmingFinalApproval(false);
      }
    },
    [isConfirmingFinalApproval, isFetching, isSubmitting, nodeId, projectId],
  );

  return (
    <>
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
            {shouldShowRejectNotice && (
              <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <p className="font-semibold">이전에 보류된 요청입니다.</p>
                <p className="whitespace-pre-line text-xs text-destructive/90">
                  {nodeRejectText}
                </p>
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

              {/* Template helpers */}
              {isCreatingChecklist && (
                <>
                <div className="rounded-lg border border-dashed border-slate-200 bg-muted/40 p-4 space-y-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-amber-100 p-1 text-amber-600">
                        <Sparkles className="size-4" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">체크리스트 템플릿</p>
                        <p className="text-xs text-muted-foreground">
                          자주 쓰는 체크리스트를 저장해두고 빠르게 불러올 수 있습니다.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-1 items-start gap-3">
                      <Checkbox2
                          id="registerAsTemplate"
                          checked={saveAsTemplate}
                          onCheckedChange={(checked) => handleTemplateToggle(checked === true)}
                          disabled={isFormDisabled}
                      />
                      <div className="space-y-1">
                        <Label2 htmlFor="registerAsTemplate" className="font-medium text-sm">
                          현재 작성 중인 체크리스트를 템플릿으로 저장
                        </Label2>
                        <p className="text-xs text-muted-foreground">
                          전달사항과 체크리스트 항목 구성이 그대로 복사되어 다음 작성 시 바로 사용할 수 있습니다.
                        </p>
                      </div>
                    </div>
                    <Button2
                        type="button"
                        variant="outline"
                        size="sm"
                        className="whitespace-nowrap self-start"
                        onClick={() => setTemplateListOpen((prev) => !prev)}
                        disabled={templateButtonDisabled}
                    >
                      <Archive className="mr-1 size-4" /> {templateButtonLabel}
                    </Button2>
                  </div>
                  {saveAsTemplate && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label2 htmlFor="templateName">템플릿 제목</Label2>
                        <Input2
                            id="templateName"
                            placeholder="예: 신규 온보딩 체크리스트"
                            value={templateName}
                            onChange={(event) => setTemplateName(event.target.value)}
                            disabled={isFormDisabled}
                            className={templateTitleError ? "border-destructive" : ""}
                        />
                        {templateTitleError && (
                            <p className="text-xs text-destructive">템플릿 제목을 입력해주세요.</p>
                        )}
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label2 htmlFor="templateMemo" className="flex items-center justify-between gap-2">
                          템플릿 설명
                          <span className="text-xs text-muted-foreground">선택 사항</span>
                        </Label2>
                        <Textarea2
                            id="templateMemo"
                            rows={2}
                            placeholder="템플릿에 대한 설명을 입력해주세요."
                            value={templateMemo}
                            onChange={(event) => setTemplateMemo(event.target.value)}
                            disabled={isFormDisabled}
                        />
                      </div>
                    </div>
                  )}
                </div>
                {isTemplateListOpen && (
                  <div className="rounded-md border border-slate-100 bg-white shadow-sm">
                    <div className="max-h-64 overflow-y-auto divide-y">
                      {templates.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 px-4 py-8 text-center text-muted-foreground">
                          <div className="rounded-full border border-dashed p-4">
                            <Layers className="size-8" aria-hidden="true" />
                          </div>
                          <p className="text-sm font-medium text-foreground">저장된 템플릿이 없습니다.</p>
                          <p className="text-xs text-muted-foreground">하단의 "템플릿으로 저장" 옵션을 사용해 첫 템플릿을 만들어보세요.</p>
                        </div>
                      ) : (
                        templates.map((template) => (
                          <div key={template.id} className="flex flex-col gap-2 px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <p className="text-sm font-semibold text-foreground">{template.name}</p>
                              <p className="text-xs text-muted-foreground whitespace-pre-line line-clamp-3">
                                {template.request || template.memo || "설명이 없습니다."}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                              <span>항목 {template.items.length}개</span>
                              <span>{formatTemplateTimestamp(template.savedAt)}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-1">
                              <Button2
                                  type="button"
                                  size="sm"
                                  className="flex-1 sm:flex-none"
                                  onClick={() => handleTemplateApply(template.id)}
                              >
                                불러오기
                              </Button2>
                              <Button2
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="text-muted-foreground"
                                  onClick={() => handleTemplateDelete(template.id)}
                              >
                                <Trash2 className="mr-1 size-4" /> 삭제
                              </Button2>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
                </>
              )}

              {/* Row 3: 체크리스트 */}
              <FormQuestion2
                  ref={formQuestionRef}
                  resetSignal={questionResetKey}
                  disabled={isFormDisabled}
                  unlockSignal={unlockSignal}
                  allowSelectionWhenDisabled={allowClientReview}
                  allowCommentWhenDisabled={allowCommentsWhileLocked}
                  commentAuthor={authorId}
                  saveSignal={checklistSaveSignal}
                  onRemoteFileDownload={handleChecklistAttachmentDownload}
                  onItemStatusUpdate={checklistStatusUpdater}
                  showDecisionButtons={shouldShowDecisionButtons}
                  showStatusBadges={shouldShowStatusBadges}
                  onSubmitComment={checklistCommentSubmitter}
                  onFetchComments={checklistCommentFetcher}
                  onUpdateComment={checklistCommentUpdater}
                  onDeleteComment={checklistCommentDeleter}
              />

              {canEditChecklist && (
                <div className="flex flex-col md:flex-row gap-2 pt-4 pb-4 border-t">
                  {roleLocksChecklist && isLocked ? (
                    shouldShowFinalApprovalButton ? (
                      <Button2
                        type="button"
                        className="flex-1"
                        onClick={handleFinalApprovalRequest}
                        disabled={
                          isSubmitting ||
                          isFetching ||
                          isConfirmingFinalApproval ||
                          isNodeApproved ||
                          isNodePending
                        }
                      >
                        {isNodeApproved
                          ? "최종 승인 완료"
                          : isNodePending
                            ? "승인 대기중"
                            : normalizedConfirmStatus === "REJECTED"
                              ? "재승인 요청"
                              : isConfirmingFinalApproval
                                ? "요청 중..."
                                : "최종 승인 요청"}
                      </Button2>
                    ) : (
                      <Button2
                        type="button"
                        className="flex-1"
                        onClick={handleUnlock}
                        disabled={isSubmitting || isFetching}
                      >
                        수정
                      </Button2>
                    )
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

              {shouldShowClientApprovalButtons && (
                <div className="flex flex-col md:flex-row gap-2 pt-4 pb-4 border-t">
                  <Button2
                    type="button"
                    className="flex-1"
                    onClick={() => {
                      const confirmed = window.confirm("해당 단계를 승인하시겠습니까?");
                      if (!confirmed) return;
                      void handleClientApproval("APPROVED", null);
                    }}
                    disabled={isSubmitting || isFetching || isConfirmingFinalApproval || !hasRouteContext}
                  >
                    {isConfirmingFinalApproval ? "요청 중..." : "승인"}
                  </Button2>
                  <Button2
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setRejectReason("");
                      setRejectModalOpen(true);
                    }}
                    disabled={isSubmitting || isFetching || isConfirmingFinalApproval || !hasRouteContext}
                  >
                    보류
                  </Button2>
                </div>
              )}
            </form>
          </CardContent>
        </Card2>
      </div>

      {isRejectModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[1300] flex items-center justify-center">
            <div
              className="absolute inset-0"
              onClick={() => setRejectModalOpen(false)}
              aria-hidden="true"
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            />
            <div
              className="relative z-[1301] w-[50vw] max-w-3xl min-w-[280px] rounded-lg border p-6 shadow-xl"
              style={{ backgroundColor: "#fff" }}
            >
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">보류 사유 입력</p>
                  <p className="text-sm text-muted-foreground">
                    보류 사유를 입력하면 상대방에게 전달됩니다.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted"
                  onClick={() => setRejectModalOpen(false)}
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2">
                <Label2 htmlFor="rejectReason">보류 사유</Label2>
                <Textarea2
                  id="rejectReason"
                  rows={4}
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  disabled={isConfirmingFinalApproval}
                  placeholder="예: 전달받은 자료가 누락되어 확인이 불가능합니다."
                />
              </div>
              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button2
                  type="button"
                  variant="outline"
                  onClick={() => setRejectModalOpen(false)}
                  disabled={isConfirmingFinalApproval}
                >
                  취소
                </Button2>
                <Button2
                  type="button"
                  onClick={() => {
                    const trimmed = rejectReason.trim();
                    if (!trimmed) {
                      toast.error("보류 사유를 입력해주세요.");
                      return;
                    }
                    void handleClientApproval("REJECTED", trimmed);
                    setRejectModalOpen(false);
                  }}
                  disabled={
                    isConfirmingFinalApproval ||
                    isSubmitting ||
                    isFetching ||
                    !hasRouteContext ||
                    !rejectReason.trim().length
                  }
                >
                  보류하기
                </Button2>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
