import { notFound } from "next/navigation";
import {
  TeamInjuriesScreen,
  TeamNewsScreen,
  TeamUnitScreen,
  isTeamSection,
  isTeamUnit,
  loadTeamPage,
} from "@/components/features/team";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TeamSectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ abbr: string; section: string }>;
  searchParams?: Promise<{ all?: string | string[] }>;
}) {
  const { abbr, section } = await params;
  if (!isTeamSection(section)) notFound();
  const data = await loadTeamPage(abbr);
  const query = searchParams ? await searchParams : {};
  const all = Array.isArray(query.all) ? query.all[0] : query.all;
  if (section === "injuries") return <TeamInjuriesScreen data={data} />;
  if (section === "news") return <TeamNewsScreen data={data} />;
  if (!isTeamUnit(section)) notFound();
  return <TeamUnitScreen data={data} unit={section} showAll={all === "1"} />;
}
