import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDocumentationById } from "@/actions/documentation";
import { DocViewer } from "@/components/documentation/doc-viewer";

export const metadata: Metadata = { title: "Documentation" };

interface DocPageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentationPage({ params }: DocPageProps) {
  const { id } = await params;
  const documentation = await getDocumentationById(id);

  if (!documentation) notFound();

  return <DocViewer documentation={documentation} />;
}
