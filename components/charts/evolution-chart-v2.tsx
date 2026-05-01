"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { EvolutionPoint } from "@/lib/types";

export function EvolutionChartV2({ data }: { data: EvolutionPoint[] }) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: -24 }}>
          <CartesianGrid vertical={false} stroke="#eef2f5" />
          <XAxis dataKey="date" axisLine={false} tickLine={false} stroke="#94a3b8" fontSize={12} />
          <YAxis axisLine={false} tickLine={false} stroke="#94a3b8" fontSize={12} />
          <Tooltip
            contentStyle={{
              borderRadius: 16,
              border: "1px solid #e5eaee",
              boxShadow: "0 12px 30px rgba(15,23,42,0.08)"
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Line type="monotone" dataKey="weight" stroke="#1f9d8b" strokeWidth={3} dot={false} activeDot={{ r: 5 }} name="Peso" />
          <Line type="monotone" dataKey="waist" stroke="#3fb6a7" strokeWidth={2.5} dot={false} name="Cintura" />
          <Line type="monotone" dataKey="bodyFatPercent" stroke="#7ccdc2" strokeWidth={2} dot={false} name="% gordura" />
            <Line type="monotone" dataKey="phaseAngle" stroke="#0f766e" strokeWidth={2} dot={false} name="Ângulo de fase" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

