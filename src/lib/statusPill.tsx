import clsx from "clsx";

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    AVAILABLE: "badge-ok",
    ON_TRIP: "badge-info",
    IN_SHOP: "badge-warn",
    RETIRED: "badge-bad",
    OFF_DUTY: "badge-muted",
    SUSPENDED: "badge-bad",
    DRAFT: "badge-muted",
    DISPATCHED: "badge-info",
    COMPLETED: "badge-ok",
    CANCELLED: "badge-bad",
    ACTIVE: "badge-warn",
    CLOSED: "badge-ok",
  };
  const label = status.replace(/_/g, " ").toLowerCase().replace(/\b./g, (m) => m.toUpperCase());
  return <span className={clsx("badge", map[status] || "badge-muted")}>{label}</span>;
}
