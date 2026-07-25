import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Phone, Mail, MapPin, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { technicianDetailQuery } from "@/lib/queries";
import { fmtTZS } from "@/lib/format";
import { StatusBadge } from "@/components/fleet/StatusBadge";

export const Route = createFileRoute("/technicians/$technicianId")({
  component: TechnicianDetailPage,
  head: ({ params }) => ({
    meta: [
      { title: `Technician — Primesphere Holdings Logistics` },
      { name: "description", content: "View technician details and maintenance history." },
    ],
  }),
});

function TechnicianDetailPage() {
  const { technicianId } = Route.useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery(technicianDetailQuery(technicianId));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
          Loading technician…
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-[1200px] px-6 py-10">
          <Link to="/technicians" className="text-sm text-primary hover:underline">
            ← Back to technicians
          </Link>
          <div className="mt-6 text-lg font-semibold">Technician not found</div>
        </div>
      </div>
    );
  }

  const { technician, maintenance, totalCost, totalPaid, balance } = data;

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-xl px-4 py-3 md:px-6 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/technicians" })}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{technician.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {technician.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {technician.phone}
                </span>
              )}
              {technician.email && (
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {technician.email}
                </span>
              )}
              {technician.address && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {technician.address}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1200px] px-4 md:px-6 py-6">
        {/* Stats */}
        <div className="grid gap-3 md:grid-cols-4 mb-6">
          <StatCard
            icon={<Wrench className="h-4 w-4" />}
            label="Total jobs"
            value={String(maintenance.length)}
            sub="Maintenance records"
            tone="primary"
          />
          <StatCard
            icon={<DollarSign className="h-4 w-4" />}
            label="Total cost"
            value={fmtTZS(totalCost)}
            sub="All jobs combined"
            tone="warning"
          />
          <StatCard
            icon={<Banknote className="h-4 w-4" />}
            label="Amount paid"
            value={fmtTZS(totalPaid)}
            sub="Cash paid to technician"
            tone="success"
          />
          <StatCard
            icon={<DollarSign className="h-4 w-4" />}
            label="Outstanding balance"
            value={fmtTZS(balance)}
            sub={balance > 0 ? "Amount owed" : "Fully paid"}
            tone={balance > 0 ? "destructive" : "success"}
          />
        </div>

        {/* Maintenance records */}
        <div className="rounded-xl border bg-card">
          <div className="border-b bg-muted/40 px-4 py-3 text-sm font-semibold">
            Maintenance history
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/20 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Vehicle</th>
                  <th className="px-4 py-2 font-medium">Description</th>
                  <th className="px-4 py-2 font-medium text-right">Cost</th>
                  <th className="px-4 py-2 font-medium text-right">Paid</th>
                  <th className="px-4 py-2 font-medium text-right">Balance</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {maintenance.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      No maintenance records for this technician.
                    </td>
                  </tr>
                )}
                {maintenance.map((m) => {
                  const bal = Number(m.cost_tzs) - (Number(m.paid_amount) || 0);
                  return (
                    <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">
                        {new Date(m.maintenance_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">
                        <Link
                          to="/vehicles/$vehicleId"
                          params={{ vehicleId: m.vehicle_id }}
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {m.vehicle?.reg_number || "—"}
                        </Link>
                        <div className="text-[11px] text-muted-foreground">{m.vehicle?.model || ""}</div>
                      </td>
                      <td className="px-4 py-2 max-w-[200px] truncate">{m.description}</td>
                      <td className="px-4 py-2 text-right">{fmtTZS(Number(m.cost_tzs))}</td>
                      <td className="px-4 py-2 text-right">{fmtTZS(Number(m.paid_amount) || 0)}</td>
                      <td className={cn("px-4 py-2 text-right font-semibold", bal > 0 ? "text-destructive" : "text-success")}>
                        {fmtTZS(bal)}
                      </td>
                      <td className="px-4 py-2"><StatusBadge status={m.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

// Small stat card component
function StatCard({ icon, label, value, sub, tone }: any) {
  const toneMap = {
    primary: "border-primary/30 bg-primary/8",
    success: "border-success/40 bg-success/10",
    warning: "border-warning/40 bg-warning/15",
    destructive: "border-destructive/40 bg-destructive/10",
    accent: "border-border bg-card",
  };
  return (
    <div className={cn("rounded-xl border p-4", toneMap[tone])}>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
        <span className="grid h-6 w-6 place-items-center rounded bg-muted">{icon}</span>
        {label}
      </div>
      <div className="mt-2 text-xl md:text-2xl font-bold tabular">{value}</div>
      <div className="mt-0.5 text-[11px] text-muted-foreground tabular">{sub}</div>
    </div>
  );
}
