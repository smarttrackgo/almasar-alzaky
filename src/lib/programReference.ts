export function programReference(pkg: { _id?: unknown; packageReference?: string | null } | null | undefined) {
  if (!pkg) return "—";
  if (pkg.packageReference) return pkg.packageReference;
  const rawId = String(pkg._id ?? "");
  const clean = rawId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return `PRG-${clean.slice(-8) || "PROGRAM"}`;
}
