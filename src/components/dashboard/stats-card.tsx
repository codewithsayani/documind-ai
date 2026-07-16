"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { TrendingUp } from "lucide-react";
import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description: string;
  trend?: number;
  isLimit?: boolean;
  limitPercent?: number;
}

export function StatsCard({
  title,
  value,
  icon,
  description,
  trend,
  isLimit,
  limitPercent,
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 text-xs text-green-500">
            <TrendingUp className="w-3 h-3" />
            <span>+{trend}%</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      {isLimit && limitPercent !== undefined && (
        <div className="mt-3">
          <Progress
            value={limitPercent}
            className={cn(
              "h-1.5",
              limitPercent >= 80 ? "text-red-500" : ""
            )}
          />
        </div>
      )}
    </motion.div>
  );
}
