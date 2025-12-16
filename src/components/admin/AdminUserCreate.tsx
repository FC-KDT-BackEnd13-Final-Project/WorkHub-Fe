import { AdminAddUser } from "./AdminAddUser";
import { PageHeader } from "../common/PageHeader";

export function AdminUserCreate() {
  return (
    <div className="space-y-6 pb-12">
      <PageHeader title="Users" description="구성원을 관리하고 권한을 지정하며 활동 현황을 확인하세요." />
      <AdminAddUser />
    </div>
  );
}
