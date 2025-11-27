import { useState } from "react";
import { CustomerReport2 } from "../components/CustomerReport2";
import { CustomerForm2 } from "../components/CustomerForm2";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Button } from "../components/ui/button";

export function SupportPage() {
  const [isWriting, setIsWriting] = useState(false);

  return (
    <div className="space-y-6 pb-12 pt-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight">CS 문의</h1>
        <p className="mt-2 text-muted-foreground">프로젝트 관련 문의와 응답을 한 곳에서 관리하세요.</p>
      </div>

      {isWriting ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsWriting(false)}>
              목록으로
            </Button>
          </div>
          <CustomerForm2 />
        </div>
      ) : (
        <CustomerReport2 />
      )}
    </div>
  );
}
