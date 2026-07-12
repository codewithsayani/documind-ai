"use client";

import { motion } from "framer-motion";
import { cn, formatRelativeTime } from "@/lib/utils";
import {
  FolderPlus,
  FileText,
  Edit3,
  Download,
  GitBranch,
  Trash2,
} from "lucide-react";
import { ActivityLog, ActivityType } from "@/types";

const iconMap: Record<ActivityType, React.ElementType> = {
  project_created: FolderPlus,
  doc_generated: FileText,
  doc_edited: Edit3,
  doc_exported: Download,
  version_created: GitBranch,
  project_deleted: Trash2,
};

const colorMap: Record<ActivityType, string> = {
  project_created: "text-blue-500 bg-blue-500/10",
  doc_generated: "text-purple-500 bg-purple-500/10",
  doc_edited: "text-green-500 bg-green-500/10",
  doc_exported: "text-orange-500 bg-orange-500/10",
  version_created: "text-cyan-500 bg-cyan-500/10",
  project_deleted: "text-red-500 bg-red-500/10",
};

interface ActivityFeedProps {
  activities: ActivityLog[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-6 text-center">
        <p className="text-sm text-muted-foreground">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="divide-y divide-border">
        {activities.map((activity, i) => {
          const Icon = iconMap[activity.type] || FileText;
          const color = colorMap[activity.type] || "text-muted-foreground bg-muted";

          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-3 p-3 hover:bg-muted/30 transition-colors"
            >
              <div className={cn("p-1.5 rounded-md shrink-0", color)}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium leading-5 truncate">{activity.title}</p>
                {activity.description && (
                  <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                )}
              </div>
              <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                {formatRelativeTime(activity.created_at)}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
