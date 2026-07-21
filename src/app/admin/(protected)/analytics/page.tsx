'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Building2, FileQuestion, Send, ClipboardCheck } from 'lucide-react';

interface MonthlyPoint {
  year: number;
  month: number;
  period: string;
  new_companies: number;
  quizzes_generated: number;
  quizzes_published: number;
  quiz_attempts: number;
}

interface YearlyPoint {
  year: number;
  new_companies: number;
  quizzes_generated: number;
  quizzes_published: number;
  quiz_attempts: number;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function StatCard({ label, value, icon: Icon, deltaPct }: { label: string; value: number; icon: any; deltaPct?: number | null }) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-blue-500/20">
          <Icon className="h-4 w-4 text-green-400" />
        </div>
        {deltaPct !== undefined && deltaPct !== null && (
          <div className={`flex items-center gap-1 text-xs font-medium ${deltaPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {deltaPct >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(deltaPct).toFixed(0)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-semibold text-white">{value.toLocaleString()}</div>
      <div className="text-sm text-zinc-500 mt-0.5">{label}</div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [monthly, setMonthly] = useState<MonthlyPoint[]>([]);
  const [yearly, setYearly] = useState<YearlyPoint[]>([]);
  const [totals, setTotals] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [compareWithPreviousYear, setCompareWithPreviousYear] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/admin/analytics');
        const data = await res.json();
        setMonthly(data.monthly || []);
        setYearly(data.yearly || []);
        setTotals(data.totals || null);
        if (data.yearly?.length) {
          setSelectedYear(data.yearly[data.yearly.length - 1].year);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const availableYears = useMemo(() => yearly.map((y) => y.year), [yearly]);

  const monthlyChartData = useMemo(() => {
    if (!selectedYear) return [];
    return MONTH_NAMES.map((name, idx) => {
      const monthNum = idx + 1;
      const current = monthly.find((m) => m.year === selectedYear && m.month === monthNum);
      const previous = monthly.find((m) => m.year === selectedYear - 1 && m.month === monthNum);
      return {
        month: name,
        [`${selectedYear}`]: current?.quizzes_generated || 0,
        ...(compareWithPreviousYear ? { [`${selectedYear - 1}`]: previous?.quizzes_generated || 0 } : {}),
      };
    });
  }, [monthly, selectedYear, compareWithPreviousYear]);

  const momDelta = useMemo(() => {
    if (monthly.length < 2) return null;
    const sorted = [...monthly].sort((a, b) => a.period.localeCompare(b.period));
    const current = sorted[sorted.length - 1];
    const previous = sorted[sorted.length - 2];
    if (!previous || previous.quizzes_generated === 0) return null;
    return ((current.quizzes_generated - previous.quizzes_generated) / previous.quizzes_generated) * 100;
  }, [monthly]);

  if (isLoading) {
    return <div className="p-8 text-zinc-500">Loading analytics...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold text-white mb-1">Growth Analytics</h1>
      <p className="text-sm text-zinc-500 mb-6">QuizzViz platform growth — quiz generation, publishing, and attempts over time.</p>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Total companies" value={Number(totals?.total_companies || 0)} icon={Building2} />
        <StatCard label="Quizzes generated" value={Number(totals?.total_quizzes_generated || 0)} icon={FileQuestion} deltaPct={momDelta} />
        <StatCard label="Quizzes published" value={Number(totals?.total_quizzes_published || 0)} icon={Send} />
        <StatCard label="Quiz attempts" value={Number(totals?.total_attempts || 0)} icon={ClipboardCheck} />
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h2 className="text-lg font-medium text-white">Monthly quiz generations</h2>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-zinc-400">
              <input
                type="checkbox"
                checked={compareWithPreviousYear}
                onChange={(e) => setCompareWithPreviousYear(e.target.checked)}
                className="rounded border-zinc-600"
              />
              Compare with previous year
            </label>
            <select
              value={selectedYear ?? ''}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-sm text-white"
            >
              {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={monthlyChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
            <YAxis stroke="#71717a" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
            <Legend />
            {selectedYear && (
              <Line type="monotone" dataKey={`${selectedYear}`} stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
            )}
            {compareWithPreviousYear && selectedYear && (
              <Line type="monotone" dataKey={`${selectedYear - 1}`} stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3 }} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-medium text-white mb-5">Yearly totals</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={yearly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="year" stroke="#71717a" fontSize={12} />
            <YAxis stroke="#71717a" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
            <Legend />
            <Bar dataKey="new_companies" name="New companies" fill="#a855f7" radius={[4, 4, 0, 0]} />
            <Bar dataKey="quizzes_generated" name="Quizzes generated" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="quizzes_published" name="Quizzes published" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
