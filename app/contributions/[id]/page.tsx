import { PlatformProvider } from "@/components/platform-provider";
import { PublicContributionPage } from "@/components/views/public-contribution-page";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <PlatformProvider><PublicContributionPage id={decodeURIComponent(id)} /></PlatformProvider>; }
