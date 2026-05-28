/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  AreaChart,
  Area
} from 'recharts';

import { TrendingUp, TrendingDown, Star, ArrowUpRight, Award } from 'lucide-react';

// ==========================================
// 1. MINI TREND LINE (SVG-based for light weight & high density)
// ==========================================
interface MiniTrendLineProps {
  data: number[];
  isPositive?: boolean;
  width?: number;
  height?: number;
}

export function MiniTrendLine({ data, isPositive = true, width = 100, height = 30 }: MiniTrendLineProps) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  const strokeColor = isPositive ? '#10B981' : '#EF4444';

  return (
    <svg width={width} height={height} className="overflow-visible" id="component-mini-trend">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

// ==========================================
// 2. FUNNEL CHART
// ==========================================
interface FunnelStage {
  stage: string;
  count: number;
  value?: number;
  percentage: number; // conversion from top
}

interface FunnelChartProps {
  stages: FunnelStage[];
  color?: string;
}

export function FunnelChart({ stages, color = '#1D4ED8' }: FunnelChartProps) {
  return (
    <div className="space-y-4" id="component-funnel-chart">
      {stages.map((stage, idx) => {
        const nextStage = stages[idx + 1];
        const conversionDrop = nextStage ? ((nextStage.count / stage.count) * 100).toFixed(0) : null;
        
        return (
          <div key={idx} className="relative">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 hover:shadow-xs transition">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 bg-slate-900 text-white rounded-md flex items-center justify-center font-mono font-bold text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="text-[#0F172A] font-extrabold">{stage.stage}</span>
                </div>
                <div className="text-right font-mono text-[11px]">
                  <span className="font-bold text-slate-800">{stage.count} Leads</span>
                  {stage.value !== undefined && (
                    <span className="text-slate-500 font-medium ml-1.5">(${stage.value.toLocaleString()})</span>
                  )}
                </div>
              </div>

              {/* Progress visual tracker */}
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500" 
                  style={{ 
                    width: `${stage.percentage}%`,
                    backgroundColor: color 
                  }} 
                />
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
                <span>Conversion rate from core</span>
                <span>{stage.percentage}%</span>
              </div>
            </div>

            {/* Downward dropoff indicator */}
            {conversionDrop && (
              <div className="flex justify-center my-1.5">
                <div className="bg-blue-50 text-blue-700 border border-blue-150 px-2.5 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1">
                  <span>↓ {conversionDrop}% conversion to next phase</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// 3. DONUT CHART
// ==========================================
interface DonutData {
  name: string;
  value: number;
}

interface DonutChartProps {
  data: DonutData[];
  colors?: string[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
}

const DEFAULT_CELL_COLORS = ['#1D4ED8', '#60A5FA', '#34D399', '#FB7185', '#FBBF24', '#A78BFA'];

export function DonutChart({ 
  data, 
  colors = DEFAULT_CELL_COLORS, 
  height = 180, 
  innerRadius = 50, 
  outerRadius = 75 
}: DonutChartProps) {
  const totalLeads = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="relative flex flex-col items-center justify-center" id="component-donut-chart">
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="#fff" strokeWidth={1} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const entry = payload[0];
                  return (
                    <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs font-semibold shadow-md font-mono border border-slate-800">
                      <span className="block text-[10px] uppercase font-bold text-slate-400">{entry.name}</span>
                      <span className="block text-white text-xs mt-0.5">{entry.value} Leads</span>
                      <span className="block text-emerald-400 text-[10px]">{((Number(entry.value) / totalLeads) * 100).toFixed(1)}% stake</span>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Embedded text inside center hole */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -mt-4 text-center pointer-events-none">
        <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block leading-none">TOTAL UNIT</span>
        <span className="text-xl font-black text-slate-900 tracking-tight block mt-1">{totalLeads}</span>
      </div>

      {/* Grid Indicators list */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] mt-4 font-semibold w-full">
        {data.map((entry, index) => (
          <div key={index} className="flex items-center gap-1.5 truncate text-slate-600">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: colors[index % colors.length] }} />
            <span className="truncate">{entry.name}:</span>
            <span className="font-mono text-[#0F172A] font-bold shrink-0">{entry.value} ({((entry.value / totalLeads) * 100).toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 4. GAUGE CHART
// ==========================================
interface GaugeChartProps {
  percentage: number; // 0 to 100
  title: string;
  metricLabel?: string;
  color?: string;
}

export function GaugeChart({ percentage, title, metricLabel, color = '#1D4ED8' }: GaugeChartProps) {
  // SVG calculation values
  const radius = 55;
  const strokeWidth = 10;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl" id="component-gauge-chart">
      <span className="text-[10px] text-[#64748B] font-extrabold uppercase tracking-widest mb-3 block">{title}</span>
      
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* SVG radial bar */}
        <svg className="transform -rotate-90" width="128" height="128">
          {/* Background circle track */}
          <circle
            className="text-slate-200"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            r={normalizedRadius}
            cx="64"
            cy="64"
          />
          {/* Active outline trail */}
          <circle
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            fill="transparent"
            r={normalizedRadius}
            cx="64"
            cy="64"
          />
        </svg>

        {/* Dynamic score label placed strictly in center bounds */}
        <div className="absolute text-center">
          <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">{percentage}%</span>
          {metricLabel && (
            <span className="text-[9px] text-[#64748B] font-bold block uppercase tracking-wider mt-0.5">{metricLabel}</span>
          )}
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-150 px-2 rounded-full py-0.5">
        <Star className="w-3 h-3 text-emerald-600 shrink-0" />
        <span>Above SLA Benchmark</span>
      </div>
    </div>
  );
}

// ==========================================
// 5. VERTICAL BAR CHART
// ==========================================
interface BarData {
  label: string;
  comparison: number;
  secondary?: number;
}

interface VerticalBarChartProps {
  data: BarData[];
  comparisonKey: string;
  secondaryKey?: string;
  hoverColor?: string;
}

export function VerticalBarChart({ data, comparisonKey, secondaryKey, hoverColor = '#1D4ED8' }: VerticalBarChartProps) {
  return (
    <div style={{ width: '100%', height: 230 }} id="component-vertical-bar">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
          <XAxis 
            dataKey="label" 
            stroke="#94A3B8" 
            fontSize={9} 
            tickLine={false} 
            axisLine={false}
            fontFamily="JetBrains Mono"
          />
          <YAxis 
            stroke="#94A3B8" 
            fontSize={9} 
            tickLine={false} 
            axisLine={false}
            fontFamily="JetBrains Mono"
          />
          <Tooltip
            cursor={{ fill: 'rgba(100, 116, 139, 0.04)' }}
            contentStyle={{ 
              backgroundColor: '#0F172A', 
              borderRadius: '8px', 
              color: '#fff', 
              fontFamily: 'JetBrains Mono',
              fontSize: '11px',
              border: 'none',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          />
          <Bar dataKey={comparisonKey} fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={25}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={hoverColor} />
            ))}
          </Bar>
          {secondaryKey && (
            <Bar dataKey={secondaryKey} fill="#F97316" radius={[4, 4, 0, 0]} barSize={25} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ==========================================
// 6. HORIZONTAL BAR CHART
// ==========================================
interface HorizontalBarChartProps {
  data: BarData[];
  comparisonKey: string;
}

export function HorizontalBarChart({ data, comparisonKey }: HorizontalBarChartProps) {
  return (
    <div style={{ width: '100%', height: data.length * 45 + 20 }} id="component-horizontal-bar">
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
        >
          <XAxis 
            type="number" 
            stroke="#94A3B8" 
            fontSize={9} 
            tickLine={false} 
            axisLine={false}
            fontFamily="JetBrains Mono"
          />
          <YAxis 
            dataKey="label" 
            type="category" 
            stroke="#111c2e" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            width={100}
            fontFamily="Inter"
            fontWeight="bold"
          />
          <Tooltip
            cursor={{ fill: 'rgba(100, 116, 139, 0.04)' }}
            contentStyle={{ 
              backgroundColor: '#0F172A', 
              borderRadius: '8px', 
              color: '#fff', 
              fontFamily: 'JetBrains Mono',
              fontSize: '11px',
              border: 'none',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          />
          <Bar dataKey={comparisonKey} fill="#1D4ED8" radius={[0, 4, 4, 0]} barSize={16}>
            {data.map((entry, index) => {
              // Fade color index for aesthetic rhythm
              const brightness = 2 + index * 4;
              return <Cell key={`cell-${index}`} fill={`hsl(224, 82%, ${35 + brightness}%)`} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ==========================================
// 7. STACKED BAR CHART
// ==========================================
interface StackedBarData {
  label: string;
  segmentA: number;
  segmentB: number;
  segmentC?: number;
}

interface StackedBarChartProps {
  data: StackedBarData[];
  keys: string[]; // e.g. ["segmentA", "segmentB"]
  colors?: string[];
}

export function StackedBarChart({ data, keys, colors = ['#1D4ED8', '#60A5FA', '#34D399'] }: StackedBarChartProps) {
  return (
    <div style={{ width: '100%', height: 230 }} id="component-stacked-bar">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
          <XAxis 
            dataKey="label" 
            stroke="#94A3B8" 
            fontSize={9} 
            tickLine={false} 
            axisLine={false}
            fontFamily="JetBrains Mono"
          />
          <YAxis 
            stroke="#94A3B8" 
            fontSize={9} 
            tickLine={false} 
            axisLine={false}
            fontFamily="JetBrains Mono"
          />
          <Tooltip
            cursor={{ fill: 'rgba(100, 116, 139, 0.04)' }}
            contentStyle={{ 
              backgroundColor: '#0F172A', 
              borderRadius: '8px', 
              color: '#fff', 
              fontFamily: 'JetBrains Mono',
              fontSize: '11px',
              border: 'none',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          />
          {keys.map((key, index) => (
            <Bar 
              key={key} 
              dataKey={key} 
              stackId="a" 
              fill={colors[index % colors.length]} 
              radius={index === keys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              barSize={25}
            />
          ))}
          <Legend 
            verticalAlign="bottom" 
            height={24} 
            iconType="circle" 
            iconSize={8}
            wrapperStyle={{ fontSize: 9, fontFamily: 'Inter', fontWeight: 'semibold', color: '#64748B' }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
