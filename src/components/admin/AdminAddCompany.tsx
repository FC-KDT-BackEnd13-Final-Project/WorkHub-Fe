import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";

declare global {
  interface Window {
    daum?: {
      Postcode: new (
        options: {
          oncomplete: (data: { roadAddress: string; jibunAddress: string }) => void;
        }
      ) => { open: () => void };
    };
  }
}

export function AdminAddCompany() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    registration: "",
    address: "",
    manager: "",
    phone: "",
    email: "",
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    navigate("/admin/users/add/success");
  };

  const handleReset = () => {
    setForm({ name: "", registration: "", address: "", manager: "", phone: "", email: "" });
  };

  const handleSearchAddress = () => {
    if (!window.daum?.Postcode) {
      alert("주소 검색 서비스를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    new window.daum.Postcode({
      oncomplete: (data) => {
        const address = data.roadAddress || data.jibunAddress;
        if (address) {
          setForm((prev) => ({ ...prev, address }));
        }
      },
    }).open();
  };

  return (
    <>
      <Card className="rounded-2xl border border-white/70 bg-white shadow-sm">
        <CardHeader className="pb-6 text-center">
          <CardTitle className="text-2xl">회사 추가</CardTitle>
          <CardDescription>새 고객사를 등록하고 주요 담당자를 설정하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company-name">회사명</Label>
              <Input
                id="company-name"
                required
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-registration">사업자 등록번호</Label>
              <Input
                id="company-registration"
                value={form.registration}
                onChange={(event) => setForm((prev) => ({ ...prev, registration: event.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-address">회사 주소</Label>
            <div className="flex flex-col gap-2 md:flex-row">
              <Input
                id="company-address"
                placeholder="주소를 검색하거나 입력하세요"
                value={form.address}
                onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                className="md:w-auto"
                onClick={handleSearchAddress}
              >
                검색
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company-manager">담당자 이름</Label>
              <Input
                id="company-manager"
                required
                value={form.manager}
                onChange={(event) => setForm((prev) => ({ ...prev, manager: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-phone">담당자 전화번호</Label>
              <Input
                id="company-phone"
                type="tel"
                placeholder="010-0000-0000"
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-email">담당자 이메일</Label>
            <Input
              id="company-email"
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row">
            <Button type="submit" className="flex-1">
              등록
            </Button>
            <Button type="button" variant="outline" className="flex-1" onClick={handleReset}>
              초기화
            </Button>
          </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
