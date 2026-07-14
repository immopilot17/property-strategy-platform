import { requireRolePage } from "@/lib/auth/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRolePage("admin");
  return children;
}

