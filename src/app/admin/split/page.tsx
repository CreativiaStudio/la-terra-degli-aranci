import { redirect } from "next/navigation";

export default function SplitPage() {
  redirect("/admin/cassa?tab=societa");
}
