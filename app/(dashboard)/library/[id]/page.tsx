import { KnowledgeDetailView } from "@/components/knowledge-detail-view";
export default async function KnowledgeDetailPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <KnowledgeDetailView id={id}/>; }
