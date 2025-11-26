import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { AdminAddMenu } from "./AdminAddMenu";
import { AdminAddUser } from "./AdminAddUser";
import { AdminAddCompany } from "./AdminAddCompany";

type Tab = "user" | "company";

export function AdminUserCreate() {
  const params = useParams<{ type?: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>(params.type === "company" ? "company" : "user");

  useEffect(() => {
    setActiveTab(params.type === "company" ? "company" : "user");
  }, [params.type]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === "company") {
      navigate("/admin/users/add/company", { replace: true });
    } else {
      navigate("/admin/users/add", { replace: true });
    }
  };

  return (
    <div className="pt-8 pb-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <AdminAddMenu activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
        <div className="mx-auto max-w-4xl">
          {activeTab === "user" ? <AdminAddUser /> : <AdminAddCompany />}
        </div>
      </div>
    </div>
  );
}
