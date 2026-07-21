import { CompetitorDetailView } from "@/components/competitor-detail-view";

export default async function CompetitorDetailPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <CompetitorDetailView id={id}/>; }
