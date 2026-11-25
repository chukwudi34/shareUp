import { redirect } from "next/navigation";
import { getSessionUser } from "./api";
import type { User } from "./types";

export async function requireUser(returnTo = "/"): Promise<User> {
  const user = await getSessionUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  }

  return user;
}

export async function requireStaff(returnTo = "/admin"): Promise<User> {
  const user = await requireUser(returnTo);

  if (!user.isStaff) {
    redirect("/");
  }

  return user;
}

/** Staff guard for a single admin module. Ops and finance hold different permissions. */
export async function requirePermission(permission: string, returnTo = "/admin"): Promise<User> {
  const user = await requireStaff(returnTo);

  if (!user.permissions.includes(permission)) {
    redirect("/admin");
  }

  return user;
}
