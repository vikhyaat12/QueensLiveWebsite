import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/http";
import CustomerDashboard from "../dashboard";

export const metadata: Metadata = {
  title: "My Support Tickets | Queens Care Laboratories",
  robots: { index: false, follow: false },
};

export default async function TicketsPage() {
  const user = await requireUser();
  if (!user) redirect("/account?redirect=/account/tickets");
  return <CustomerDashboard initialTab="tickets" />;
}
