import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from "recharts";
import { companyUsers } from "../admin/userData";

const buildUserGrowthData = () => {
  const now = new Date();
  return Array.from({ length: 12 }, (_, index) => {
    const base = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
    const nextMonth = new Date(base.getFullYear(), base.getMonth() + 1, 1);
    const label = base.toLocaleString("en-US", { month: "short" });

    const customers = companyUsers.filter((user) => {
      if (user.role !== "Client") return false;
      const joined = new Date(user.joined);
      return joined < nextMonth;
    }).length;

    const developers = companyUsers.filter((user) => {
      if (user.role !== "Developer") return false;
      const joined = new Date(user.joined);
      return joined < nextMonth;
    }).length;

    return {
      month: label,
      customers,
      developers,
    };
  });
};

const userGrowthData = buildUserGrowthData();

// 고객사/개발사 증감 추이를 12개월 단위로 시각화
export function UserGrowthStats() {
  return (
    <Card className="w-full rounded-2xl border shadow-sm p-6 min-h-[400px]">
      <CardHeader className="p-0">
        <CardTitle>사용자 증가 통계</CardTitle>
        <CardDescription>최근 12개월 간 고객사와 개발사 증가 추이</CardDescription>
      </CardHeader>
      <CardContent className="mt-6 h-[320px] p-0 flex items-center justify-center">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={userGrowthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#475569" }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#475569" }} />
            <Tooltip cursor={{ stroke: "rgba(59, 130, 246, 0.2)", strokeWidth: 2 }} />
            <Legend iconType="circle" />
            <Line type="monotone" dataKey="customers" name="고객사" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="developers" name="개발사" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
