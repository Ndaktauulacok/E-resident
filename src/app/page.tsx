import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Landing } from "@/components/landing";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [user, inst] = await Promise.all([
    getCurrentUser(),
    db.systemSetting.findUnique({ where: { key: "institution.name" } }),
  ]);
  return (
    <Landing
      institution={String(inst?.value ?? "Kolej Vokasional Sungai Petani 1")}
      signedIn={user ? { name: user.name } : null}
    />
  );
}
