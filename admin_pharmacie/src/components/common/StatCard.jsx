import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const StatCard = ({ icon, label, value, change, changeColor }) => {
  const trend = (change || '').trim();
  const isPositive = trend.startsWith('+');
  const isNegative = trend.startsWith('-');
  const IndicatorIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  const trendColor = isPositive
    ? 'text-green-600 bg-green-50 border-green-200'
    : isNegative
      ? 'text-red-600 bg-red-50 border-red-200'
      : 'text-slate-600 bg-slate-50 border-slate-200';

  return (
    <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
      <CardHeader className="flex flex-row items-start justify-between pb-4 space-y-0 p-0">
        <div className="space-y-2 flex-1">
          <CardTitle className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 font-semibold">
            {label}
          </CardTitle>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">{value}</span>
            <span className="rounded-full border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[9px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-medium">
              Live
            </span>
          </div>
        </div>

        <div className="h-12 w-12 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-lg shrink-0">
          {icon}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0 p-0">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${trendColor}`}>
            <IndicatorIcon size={14} />
            <span>{change}</span>
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">vs last period</span>
        </div>

        <div className="h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${
              isPositive ? 'bg-green-500' : isNegative ? 'bg-red-500' : 'bg-blue-500'
            } transition-all duration-500`}
            style={{ width: isPositive ? '75%' : isNegative ? '45%' : '60%' }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
