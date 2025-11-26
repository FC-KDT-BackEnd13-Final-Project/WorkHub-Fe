import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { UserPlus, Building2 } from "lucide-react";

interface AdminAddMenuProps {
  activeTab: "user" | "company";
  onTabChange: (tab: "user" | "company") => void;
}

export function AdminAddMenu({ activeTab, onTabChange }: AdminAddMenuProps) {
  return (
    <div className="mb-6  pt-6 rounded-2xl bg-white shadow-sm">
      <Card className="rounded-2xl bg-transparent shadow-none">
        <CardContent className="flex flex-wrap justify-center gap-2 px-6 pt-6 pb-4">
          <Button
            variant={activeTab === "user" ? "default" : "outline"}
            onClick={() => onTabChange("user")}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            User
          </Button>
          <Button
            variant={activeTab === "company" ? "default" : "outline"}
            onClick={() => onTabChange("company")}
            className="flex items-center gap-2"
          >
            <Building2 className="h-4 w-4" />
            Company
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
