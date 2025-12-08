import { Button2 } from "../ui/button2";
import { Card2, CardContent } from "../ui/card2";
import { ClipboardList, LayoutDashboard } from "lucide-react";
import "../../index2.css";

// 체크리스트/게시판 탭을 토글하는 프로젝트 상세 메뉴
interface NavigationProps {
  activeTab: "form" | "report";
  onTabChange: (tab: "form" | "report") => void;
}

export function ProjectMenu2({ activeTab, onTabChange }: NavigationProps) {
  return (
      <Card2 className="my-9 py-6 border-0 shadow-none">
        <CardContent className="py-9">
          <div className="flex gap-2 justify-center py-9">

            {/* Create Project Checklist */}
          <Button2
            variant={activeTab === "form" ? "default" : "outline"}
            onClick={() => onTabChange("form")}
            className="flex items-center gap-2"
          >
            <ClipboardList className="h-4 w-4" />
            체크리스트 작성
          </Button2>

            {/* Project Board */}
          <Button2
            variant={activeTab === "report" ? "default" : "outline"}
            onClick={() => onTabChange("report")}
            className="flex items-center gap-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            프로젝트 게시판
          </Button2>
        </div>
      </CardContent>
    </Card2>
  );
}
