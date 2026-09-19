import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/http";
import AdminDashboard from "./dashboard";

import type { Tab } from "./components/shared";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) redirect("/admin/login");
  const sp = searchParams ? await searchParams : {};
  return (
    <AdminDashboard
      currentUser={{ name: user.name, role: user.role, email: user.email }}
      initialTab={sp.tab as Tab | undefined}
    />
  );
}



