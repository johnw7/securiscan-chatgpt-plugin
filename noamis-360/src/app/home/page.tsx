import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

/** Aiguillage après connexion selon le rôle. */
export default async function HomeRedirect() {
  const session = await getSession();
  if (!session) redirect("/login?error=no_access");
  redirect(session.role === "client" ? "/portal" : "/dashboard");
}
