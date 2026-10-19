import { AppShell } from "@/components/app-shell";
import { PlatformProvider } from "@/components/platform-provider";

export default function Home() {
  return <PlatformProvider><AppShell /></PlatformProvider>;
}
