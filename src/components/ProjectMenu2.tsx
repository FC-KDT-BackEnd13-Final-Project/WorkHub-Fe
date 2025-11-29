import { Button2 } from "./ui/button2";
import { Card2, CardContent } from "./ui/card2";
import { ClipboardList, LayoutDashboard } from "lucide-react";
import "../index2.css";

interface NavigationProps {
  activeTab: "form" | "report";
  onTabChange: (tab: "form" | "report") => void;
}

export function ProjectMenu2({ activeTab, onTabChange }: NavigationProps) {
  return (
      <Card2 className="mb-6 pb-6">
        <CardContent className="pt-6">
          <div className="flex gap-2 justify-center">

            {/* Create Project Checklist */}
          <Button2
            variant={activeTab === "form" ? "default" : "outline"}
            onClick={() => onTabChange("form")}
            className="flex items-center gap-2"
          >
            <ClipboardList className="h-4 w-4" />
            Create Project Checklist
          </Button2>

            {/* Project Board */}
          <Button2
            variant={activeTab === "report" ? "default" : "outline"}
            onClick={() => onTabChange("report")}
            className="flex items-center gap-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            Project Board
          </Button2>
        </div>
      </CardContent>
    </Card2>
  );
}