import { PublicProfilePage } from "@/components/views/public-profile-page";
export default async function Page({ params }: { params: Promise<{ nickname: string }> }) {
  const { nickname } = await params;
  return <PublicProfilePage nickname={nickname}/>;
}
