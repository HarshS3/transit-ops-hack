import { redirect } from "next/navigation";
import { readSession, RBAC } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await readSession();
  if (!user) redirect("/login");
  const allowed = RBAC[user.role] || [];
  return (
    <div className="min-h-screen flex">
      <Sidebar allowed={allowed} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar user={{ name: user.name, role: user.role }} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
