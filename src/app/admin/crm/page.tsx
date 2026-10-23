import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CrmPage({
  searchParams,
}: {
  searchParams?: Promise<{ client?: string; q?: string }>;
}) {
  const params = await searchParams;
  if (params?.client) {
    redirect(`/admin/clienti/${encodeURIComponent(params.client)}`);
  }
  redirect("/admin/clienti");
}
