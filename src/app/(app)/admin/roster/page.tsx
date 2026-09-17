import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Deep link: Roster now lives on Users. */
export default function AdminRosterRedirect() {
  redirect("/admin/users");
}
