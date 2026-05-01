"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { EvolutionPoint } from "@/lib/types";

export function EvolutionChart({ data }: { data: EvolutionPoint[] }) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d7dfd6" />
          <XAxis dataKey="date" stroke="#51746e" />
          <YAxis stroke="#51746e" />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="weight" stroke="#21544d" strokeWidth={3} name="Peso" />
          <Line type="monotone" dataKey="waist" stroke="#f3a68c" strokeWidth={2} name="Cintura" />
          <Line type="monotone" dataKey="bodyFatPercent" stroke="#d89d2a" strokeWidth={2} name="% gordura" />
          <Line type="monotone" dataKey="phaseAngle" stroke="#658d65" strokeWidth={2} name="Ângulo de fase" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

