import Link from "next/link";

export function SettingsHint({ item }: { item: string }) {
  return (
    <>
      Add {item} in{" "}
      <Link
        href="/settings"
        className="font-semibold underline underline-offset-2 hover:text-amber-950"
      >
        Settings
      </Link>
    </>
  );
}

export function StatusBanner({
  kind,
  children,
}: {
  kind: "error" | "success";
  children: React.ReactNode;
}) {
  const cls =
    kind === "error"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-emerald-200 bg-emerald-50 text-emerald-900";
  return (
    <div className={`rounded-xl border px-3 py-2 text-sm ${cls}`}>{children}</div>
  );
}
