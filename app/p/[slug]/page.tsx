import { PlatformProvider } from "@/components/platform-provider";
import { PublicProjectPage } from "@/components/views/public-project-page";

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PlatformProvider><PublicProjectPage slug={decodeURIComponent(slug)} /></PlatformProvider>;
}
