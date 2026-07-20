import { ToolDetailView } from "@/components/tool-detail-view";

export default async function ToolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ToolDetailView id={id}/>;
}
