import { Metadata } from "next";
import { getUsageHistory } from "@/actions/search";
import { BarChart2, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Usage" };

export default async function UsagePage() {
  const history = await getUsageHistory();
  const today = new Date().toISOString().split("T")[0];
  const todayRecord = history.find((h) => h.date === today);
  const totalGenerations = history.reduce((sum, h) => sum + h.generation_count, 0);

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Usage</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Track your daily generation usage</p>
      </div>

      {/* Today's usage */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold">Today&apos;s Generations</h2>
          </div>
          <Badge variant="secondary">Free Plan</Badge>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-2xl">{todayRecord?.generation_count || 0}</span>
            <span className="text-muted-foreground self-end">/ 5 limit</span>
          </div>
          <Progress
            value={((todayRecord?.generation_count || 0) / 5) * 100}
            className="h-3"
          />
          <p className="text-xs text-muted-foreground">
            {Math.max(0, 5 - (todayRecord?.generation_count || 0))} generations remaining today
          </p>
        </div>
      </div>

      {/* Total stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold">{totalGenerations}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Generations</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold">{history.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Active Days</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold">
            {history.length > 0
              ? (totalGenerations / history.length).toFixed(1)
              : 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Avg / Day</p>
        </div>
      </div>

      {/* History Table */}
      {history.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <BarChart2 className="w-4 h-4" /> 30-Day History
            </h2>
          </div>
          <div className="divide-y divide-border">
            {history.map((record) => (
              <div key={record.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-sm text-muted-foreground w-28">{formatDate(record.date)}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Progress
                      value={(record.generation_count / 5) * 100}
                      className="h-1.5 flex-1"
                    />
                    <span className="text-xs font-medium w-8 text-right">
                      {record.generation_count}/5
                    </span>
                  </div>
                </div>
                {record.date === today && (
                  <Badge variant="secondary" className="text-xs">Today</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
