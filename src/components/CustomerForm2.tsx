import { useForm } from "react-hook-form";
import { Card2, CardContent, CardHeader, CardTitle } from "./ui/card2";
import { Input2 } from "./ui/input2";
import { Label2 } from "./ui/label2";
import { Textarea2 } from "./ui/textarea2";
import { Button2 } from "./ui/button2";
import { FormQuestion2 } from "./ui/FormQuestion2";
import { useState } from "react";

interface CustomerFormData {
  Name: string;
  mobile: string;
  startDate: string;
  endDate: string;
  request: string;
}

export function CustomerForm2() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CustomerFormData>();

  const onSubmit = (data: CustomerFormData) => {
    console.log("Customer Data:", data);
    alert("저장 완료!");
  };

  const [questionResetKey, setQuestionResetKey] = useState(0);

  const handleReset = () => {
    reset();
    setQuestionResetKey((prev) => prev + 1);
  };

  return (
      <div className="max-w-4xl mx-auto p-6">
        <Card2>
          <CardHeader className="pb-6">
            <CardTitle className="text-center">Create Project Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Row 1: 작성자 + 전화번호 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 작성자 */}
                <div className="space-y-2">
                  <Label2 htmlFor="Name">작성자</Label2>
                  <Input2
                      id="Name"
                      placeholder="이름"
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
                      placeholder="010-XXXX-XXXX"
                      {...register("mobile", {
                        required: "전화번호는 필수입니다.",
                        pattern: {
                          value: /^[0-9+\-\s()]+$/,
                          message: "Format nomor mobile tidak valid"
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

              {/* Row 2: 시작일 + 종료일 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 시작일 */}
                <div className="space-y-2">
                  <Label2 htmlFor="startDate">시작일</Label2>
                  <Input2
                      id="startDate"
                      type="date"
                      {...register("startDate", {
                        required: "시작일은 필수입니다."
                      })}
                      className={errors.startDate ? "border-destructive" : ""}
                  />
                  {errors.startDate && (
                      <p className="text-sm text-destructive">
                        {errors.startDate.message}
                      </p>
                  )}
                </div>

                {/* 종료일 */}
                <div className="space-y-2">
                  <Label2 htmlFor="endDate">종료일</Label2>
                  <Input2
                      id="endDate"
                      type="date"
                      {...register("endDate", {
                        required: "종료일은 필수입니다."
                      })}
                      className={errors.endDate ? "border-destructive" : ""}
                  />
                  {errors.endDate && (
                      <p className="text-sm text-destructive">
                        {errors.endDate.message}
                      </p>
                  )}
                </div>
              </div>

              {/* Row 3: 요청사항 */}
              <div className="space-y-2">
                <Label2 htmlFor="request" className="flex items-center gap-1">
                  요청사항
                </Label2>
                <Textarea2
                    id="request"
                    placeholder="요청사항을 입력해주세요"
                    rows={3}
                    {...register("request")}
                    className={errors.request ? "border-destructive" : ""}
                />
                {errors.request && (
                    <p className="text-sm text-destructive">
                      {errors.request.message}
                    </p>
                )}
              </div>

              {/* Row 4: 체크리스트 */}
              <FormQuestion2 resetSignal ={questionResetKey} />

              {/* submit: Save + Reset 버튼 */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 pb-6 border-t">
                {/* Save */}
                <Button2
                    type="submit"
                    className="flex-1"
                >
                  Save
                </Button2>

                {/* Reset */}
                <Button2
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    className="flex-1"
                >
                  Reset
                </Button2>
              </div>
            </form>
          </CardContent>
        </Card2>
      </div>
  );
}