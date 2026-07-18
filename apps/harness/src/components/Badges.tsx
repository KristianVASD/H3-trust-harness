import type { Producer } from "@h3-trust/schema";

export function ProducerBadge({ producer }: { producer: Producer }) {
  return <span className={`chip producer-${producer}`}>Producer · {producer}</span>;
}

export function StatusChip({
  label,
  tone = "waiting",
}: {
  label: string;
  tone?: "waiting" | "active" | "done";
}) {
  return <span className={`chip status-${tone}`}>{label}</span>;
}
