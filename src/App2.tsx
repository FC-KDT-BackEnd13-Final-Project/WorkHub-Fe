import { useState } from "react";
import { ProjectChecklist2 } from "./components/ProjectChecklist2";
import { ProjectPost2 } from "./components/ProjectPost2";
import { ProjectMenu2 } from "./components/ProjectMenu2";

export default function App2() {
  const [activeTab, setActiveTab] = useState<"form" | "report">("form");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <ProjectMenu2 activeTab={activeTab} onTabChange={setActiveTab} />
        
        {activeTab === "form" && <ProjectChecklist2 />}
        {activeTab === "report" && <ProjectPost2 />}
      </div>
    </div>
  );
}