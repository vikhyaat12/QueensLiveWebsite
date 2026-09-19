import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/http";
import AdminDashboard from "../../dashboard";

export const metadata: Metadata = {
  title: "Admin Support Settings | Queen's Care Business OS",
  robots: { index: false, follow: false },
};

export default async function AdminSupportSettingsPage() {
  const user = await requireUser(["admin", "employee"]);
  if (!user) redirect("/admin/login?redirect=/admin/support/settings");
  return (
    <AdminDashboard
      currentUser={{ name: user.name, role: user.role, email: user.email }}
      initialTab="support-settings"
    />
  );
}
