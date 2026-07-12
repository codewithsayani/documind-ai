import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDocumentationById, getVersions, restoreVersion, deleteVersion } from "@/actions/documentation";
import { VersionsList } from "@/components/documentation/versions-list";

export const metadata: Metadata = { title: "Version History" };

interface VersionsPageProps {
  params: Promise<{ id: string }>;
}

export default async function VersionsPage({ params }: VersionsPageProps) {
  const { id } = await params;
  const [documentation, versions] = await Promise.all([
    getDocumentationById(id),
    getVersions(id),
  ]);

  if (!documentation) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Version History</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {versions.length} version{versions.length !== 1 ? "s" : ""} • {documentation.title}
        </p>
      </div>
      <VersionsList documentationId={id} versions={versions} />
    </div>
  );
}
