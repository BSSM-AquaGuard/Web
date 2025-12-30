import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SensorPoint } from "@/types";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function SensorChart({ title, data }: { title: string; data: SensorPoint[] }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">센서 데이터가 없습니다.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="t" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="temperatureC"
                name="Temp(°C)"
                stroke="#1e3a8a"
                dot={false}
                strokeWidth={2}
                connectNulls
              />
              <Line type="monotone" dataKey="turbidityNTU" name="Turb(NTU)" stroke="#2563eb" dot={false} strokeWidth={2} connectNulls />
              <Line
                type="monotone"
                dataKey="dissolvedOxygenMgL"
                name="DO(mg/L)"
                stroke="#0ea5e9"
                dot={false}
                strokeWidth={2}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="doSaturationPercent"
                name="DO Sat(%)"
                stroke="#f97316"
                dot={false}
                strokeWidth={2}
                connectNulls
              />
              <Line type="monotone" dataKey="ph" name="pH" stroke="#22c55e" dot={false} strokeWidth={2} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
