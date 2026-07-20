import { SourceDetailView } from "@/components/source-detail-view";
export default async function SourceDetailPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <SourceDetailView id={id}/>; }
