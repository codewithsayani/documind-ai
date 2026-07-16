import { Metadata } from "next";
import { getRecentActivity } from "@/actions/projects";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { History } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "History" };

export default async function HistoryPage() {
  const activity = await getRecentActivity();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Activity History</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          A log of all your recent actions
        </p>
      </div>
      {activity.length === 0 ? (
        <EmptyState
          icon={<History className="w-8 h-8 text-muted-foreground" />}
          title="No history yet"
          description="Your activity log will appear here once you start generating documentation."
        />
      ) : (
        <ActivityFeed activities={activity} />
      )}
    </div>
  );
}
