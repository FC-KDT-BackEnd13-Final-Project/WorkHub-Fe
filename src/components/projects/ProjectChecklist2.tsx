import { useForm } from "react-hook-form";
import { useState, useMemo, type MouseEvent } from "react";
import { Card2, CardContent, CardHeader, CardTitle } from "../ui/card2";
import { Input2 } from "../ui/input2";
import { Label2 } from "../ui/label2";
import { Textarea2 } from "../ui/textarea2";
import { Button2 } from "../ui/button2";
import { FormQuestion2 } from "../ui/FormQuestion2";
import { useLocalStorageValue } from "../../hooks/useLocalStorageValue";
import { PROFILE_STORAGE_KEY, normalizeUserRole } from "../../constants/profile";

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
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChecklistData>();

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
  const roleLocksChecklist = userRole === "ADMIN" || userRole === "DEVELOPER";
  const [isLocked, setIsLocked] = useState(false);
  const authorId = storedProfileSettings?.profile?.id?.trim() || "작성자";
  const onSubmit = (data: ChecklistData) => {
    if (isClient || (roleLocksChecklist && isLocked)) {
      return;
    }
    console.log("Customer Data:", data);
    alert("저장 완료!");
    if (roleLocksChecklist) {
      setIsLocked(true);
    }
  };

  const [questionResetKey, setQuestionResetKey] = useState(0);
  const [unlockSignal, setUnlockSignal] = useState(0);

  const handleReset = () => {
    if (isClient || (roleLocksChecklist && isLocked)) {
      return;
    }
    reset();
    setQuestionResetKey((prev) => prev + 1);
  };

  const isFormDisabled = isClient || (roleLocksChecklist && isLocked);
  const allowClientReview = isClient;
  const handleUnlock = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Row 1: 작성자 + 전화번호 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 작성자 */}
                <div className="space-y-2">
                  <Label2 htmlFor="Name">작성자</Label2>
                  <Input2
                      id="Name"
                      placeholder="이름"
                      disabled={isFormDisabled}
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
                      disabled={isFormDisabled}
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
                    {...register("request")}
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
                  resetSignal={questionResetKey}
                  disabled={isFormDisabled}
                  unlockSignal={unlockSignal}
                  allowSelectionWhenDisabled={allowClientReview}
                  allowCommentWhenDisabled={allowClientReview}
                  commentAuthor={authorId}
              />

              {!isClient && (
                <div className="flex flex-col md:flex-row gap-3 pt-6 pb-4 border-t">
                  {roleLocksChecklist && isLocked ? (
                      <Button2 type="button" className="flex-1" onClick={handleUnlock}>
                        수정
                      </Button2>
                  ) : (
                      <Button2 type="submit" className="flex-1">
                        저장
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
