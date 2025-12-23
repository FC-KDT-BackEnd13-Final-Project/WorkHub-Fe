import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { PageHeader } from "../common/PageHeader";
import { companyApi } from "@/lib/api";
import { toast } from "sonner";

// 다음 카카오 주소 검색 API 타입 선언
declare global {
    interface Window {
        daum: {
            Postcode: new (options: {
                oncomplete: (data: {
                    userSelectedType: "R" | "J";
                    roadAddress: string;
                    jibunAddress: string;
                    bname: string;
                    buildingName: string;
                    apartment: "Y" | "N";
                    zonecode: string;
                }) => void;
            }) => {
                open: () => void;
            };
        };
    }
}

export function AdminCompanyCreate() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        companyName: "",
        registrationNumber: "",
        address: "",
        managerPhone: "",
    });

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            companyName: formData.companyName.trim(),
            companyNumber: formData.registrationNumber.trim(),
            tel: formData.managerPhone.trim(),
            address: formData.address.trim(),
        };

        if (!payload.companyName || !payload.companyNumber || !payload.tel || !payload.address) {
            toast.error("모든 필드를 입력해주세요.");
            return;
        }

        try {
            await companyApi.addCompany(payload);
            toast.success("회사 등록이 완료되었습니다.");
            navigate("/admin/users/companies");
        } catch (error: any) {
            console.error("회사 등록 실패", error);
            const message =
              error?.response?.data?.message ||
              error?.message ||
              "회사 등록에 실패했습니다. 다시 시도해주세요.";
            toast.error(message);
        }
    };

    const handleReset = () => {
        setFormData({
            companyName: "",
            registrationNumber: "",
            address: "",
            managerPhone: "",
        });
    };

    const handleAddressSearch = () => {
        // 다음 카카오 주소 검색 API 사용
        new window.daum.Postcode({
            oncomplete: function (data) {
                let addr = "";
                let extraAddr = "";

                if (data.userSelectedType === "R") {
                    addr = data.roadAddress;
                } else {
                    addr = data.jibunAddress;
                }

                if (data.userSelectedType === "R") {
                    if (data.bname !== "" && /[동|로|가]$/g.test(data.bname)) {
                        extraAddr += data.bname;
                    }
                    if (data.buildingName !== "" && data.apartment === "Y") {
                        extraAddr += (extraAddr !== "" ? ", " + data.buildingName : data.buildingName);
                    }
                    if (extraAddr !== "") {
                        extraAddr = " (" + extraAddr + ")";
                    }
                    addr += extraAddr;
                }

                setFormData((prev) => ({
                    ...prev,
                    address: addr,
                }));
            },
        }).open();
    };

    return (
        <div className="space-y-6 pb-12">
            <PageHeader
                title="Companies"
                description="고객사 파트너십을 확인하고 진행 현황을 살펴보세요."
            />

            <div className="max-w-4xl mx-auto">
                <Card className="text-card-foreground flex flex-col gap-6 backdrop-blur rounded-2xl border border-white/70 bg-white shadow-sm transform scale-75 origin-center">
                    <CardHeader className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 pt-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6 pb-6 text-center">
                        <CardTitle className="text-2xl">회사 추가</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            새 고객사를 등록하고 주요 담당자를 설정하세요.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="px-6 [&:last-child]:pb-6">
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="grid gap-4 md:grid-cols-2">
                                {/* 회사명 */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="company-name"
                                        className="flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
                                    >
                                        회사명
                                    </Label>
                                    <Input
                                        id="company-name"
                                        required
                                        value={formData.companyName}
                                        onChange={(e) => handleInputChange("companyName", e.target.value)}
                                        className="md:text-sm file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-8 w-full min-w-0 rounded-md border px-2.5 py-1 text-sm bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-xs file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                                    />
                                </div>

                                {/* ✅ 사업자 등록번호 (회사명 기준으로 통일) */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="company-registration"
                                        className="flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
                                    >
                                        사업자 등록번호
                                    </Label>
                                    <Input
                                        id="company-registration"
                                        value={formData.registrationNumber}
                                        onChange={(e) => handleInputChange("registrationNumber", e.target.value)}
                                        className="md:text-sm file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-8 w-full min-w-0 rounded-md border px-2.5 py-1 text-sm bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-xs file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="company-address"
                                    className="flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
                                >
                                    회사 주소
                                </Label>
                                <div className="flex flex-row flex-wrap gap-2 md:flex-nowrap md:items-center">
                                    <Input
                                        id="company-address"
                                        placeholder="주소를 검색하거나 입력하세요"
                                        value={formData.address}
                                        onChange={(e) => handleInputChange("address", e.target.value)}
                                        className="md:text-sm file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex-1"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleAddressSearch}
                                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-9 px-4 py-2 has-[>svg]:px-3 md:w-auto"
                                    >
                                        검색
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="company-phone"
                                    className="flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
                                >
                                    대표번호
                                </Label>
                                <Input
                                    type="tel"
                                    id="company-phone"
                                    placeholder="010-0000-0000"
                                    value={formData.managerPhone}
                                    onChange={(e) => handleInputChange("managerPhone", e.target.value)}
                                    className="md:text-sm file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                                />
                            </div>

                            <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row">
                                <Button
                                    type="submit"
                                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3 flex-1"
                                >
                                    등록
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleReset}
                                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-9 px-4 py-2 has-[>svg]:px-3 flex-1"
                                >
                                    초기화
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
