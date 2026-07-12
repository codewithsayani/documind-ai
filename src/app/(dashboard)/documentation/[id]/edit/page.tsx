import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDocumentationById } from "@/actions/documentation";
import { DocEditor } from "@/components/documentation/doc-editor";

export const metadata: Metadata = { title: "Edit Documentation" };

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDocumentationPage({ params }: EditPageProps) {
  const { id } = await params;
  const documentation = await getDocumentationById(id);

  if (!documentation) notFound();

  return <DocEditor documentation={documentation} />;
}
