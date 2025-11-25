import { useState } from "react";
import { CustomerForm2 } from "./components/CustomerForm2";
import { CustomerReport2 } from "./components/CustomerReport2";
import { CustomerMenu2 } from "./components/CustomerMenu2";

export default function App2() {
  const [activeTab, setActiveTab] = useState<"form" | "report">("form");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <CustomerMenu2 activeTab={activeTab} onTabChange={setActiveTab} />
        
        {activeTab === "form" && <CustomerForm2 />}
        {activeTab === "report" && <CustomerReport2 />}
      </div>
    </div>
  );
}