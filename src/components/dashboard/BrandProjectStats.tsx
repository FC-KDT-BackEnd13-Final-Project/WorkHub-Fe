import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Legend, Bar, CartesianGrid } from "recharts";

const brandData = [
  { brand: "Kakao", active: 12, completed: 7 },
  { brand: "Naver", active: 8, completed: 4 },
  { brand: "Samsung", active: 15, completed: 12 },
  { brand: "Coupang", active: 5, completed: 2 },
];

// 브랜드별 활성/완료 프로젝트 수를 막대 차트로 표현
export function BrandProjectStats() {
  return (
    <Card className="w-full rounded-2xl border shadow-sm p-6 min-h-[400px]">
      <CardHeader className="p-0">
        <CardTitle>브랜드별 프로젝트 통계</CardTitle>
        <CardDescription>주요 브랜드의 활성 및 완료 프로젝트 현황</CardDescription>
      </CardHeader>
      <CardContent className="mt-6 h-[320px] p-0 flex items-center justify-center">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={brandData} barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="brand" tickLine={false} axisLine={false} tick={{ fill: "#475569" }} />
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#475569" }} />
            <Tooltip cursor={{ fill: "rgba(15, 23, 42, 0.04)" }} />
            <Legend iconType="circle" />
            <Bar dataKey="active" name="Active" fill="var(--point-color)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="completed" name="Completed" fill="#94a3b8" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
