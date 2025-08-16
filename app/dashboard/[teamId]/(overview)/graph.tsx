"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Line, LineChart } from "recharts"
import { useState } from "react"

interface GraphProps {
  data: Array<{
    month: string;
    total: number;
    averageScore: number;
  }>;
  type?: 'candidates' | 'documents';
}

export function Graph({ data, type = 'candidates' }: GraphProps) {
  const [viewType, setViewType] = useState<'total' | 'score'>('total');
  
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px] text-muted-foreground">
        <div className="text-center">
          <p>No data available</p>
          <p className="text-sm">Start uploading {type} to see trends</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {viewType === 'total' ? (
            <p className="text-primary">
              {type === 'candidates' ? 'Candidates' : 'Documents'}: {payload[0].value}
            </p>
          ) : (
            <p className="text-primary">
              Average Score: {payload[0].value}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (type === 'candidates') {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setViewType('total')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewType === 'total' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Total Candidates
          </button>
          <button
            onClick={() => setViewType('score')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewType === 'score' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Average Score
          </button>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          {viewType === 'total' ? (
            <BarChart data={data}>
              <XAxis
                dataKey="month"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="total"
                fill="currentColor"
                radius={[4, 4, 0, 0]}
                className="fill-primary"
              />
            </BarChart>
          ) : (
            <LineChart data={data}>
              <XAxis
                dataKey="month"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="averageScore"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  }

  // Documents chart (simpler, just totals)
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="month"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="total"
          fill="currentColor"
          radius={[4, 4, 0, 0]}
          className="fill-secondary"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
