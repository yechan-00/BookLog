interface MetricCardProps {
  label: string;
  value: string;
  detail: string;
}

export function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <section className="card metric">
      <h3>{label}</h3>
      <p className="metric-value">{value}</p>
      <p className="metric-detail">{detail}</p>
    </section>
  );
}
