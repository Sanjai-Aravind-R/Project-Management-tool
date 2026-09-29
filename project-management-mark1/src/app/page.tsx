import { getSessionUser } from "@/lib/auth";
import { getWorkspaceData } from "@/lib/workspace";
import Workspace from "@/components/workspace";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSessionUser();
  const data = await getWorkspaceData(user?.id);
  return <Workspace initialData={JSON.parse(JSON.stringify(data))} />;
}
