import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Archive, Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/fleet/AppHeader";
import { NewContractDialog } from "@/components/fleet/NewContractDialog";
import { StatusBadge } from "@/components/fleet/StatusBadge";
import { Button } from "@/components/ui/button";
import { customerDetailQuery } from "@/lib/queries";
import { fmtUSD, fmtTZS } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/customers/$customerId")({
  component: CustomerProfile,
  head: () => ({ meta: [{ title: "Customer — FleetPulse" }] }),
});

function CustomerProfile() {
  const { customerId } = Route.useParams();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(customerDetailQuery(customerId));

  const archive = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("customers").update({ status: "Archived" }).eq("id", customerId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customer", customerId] }); toast.success("Customer archived"); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="min-h-screen"><AppHeader /><div className="p-10 text-muted-foreground">Loading…</div></div>;
  if (!data) return <div className="min-h-screen"><AppHeader /><div className="p-10">Customer not found.</div></div>;

  const { customer, contracts, trips } = data;
  const revenue = trips.reduce((s, t) => s + Number(t.financial?.contract_amount ?? 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="border-b bg-gradient-to-br from-primary/8 via-background to-accent/20">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 py-6">
          <Link to="/customers" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Customers
          </Link>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2"><StatusBadge status={customer.status} /></div>
              <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight">{customer.company_name}</h1>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                {customer.contact_person && <span>{customer.contact_person}</span>}
                {customer.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{customer.phone}</span>}
                {customer.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{customer.email}</span>}
                {customer.address && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{customer.address}</span>}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => archive.mutate()} className="gap-1.5">
              <Archive className="h-4 w-4" />Archive
            </Button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Metric label="Total revenue" value={fmtUSD(revenue)} />
            <Metric label="Trips" value={String(trips.length)} />
            <Metric label="Contracts" value={String(contracts.length)} />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1200px] px-4 md:px-6 py-8 space-y-8">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Contracts</h2>
            <NewContractDialog customerId={customerId} />
          </div>
          <div className="overflow-hidden rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Route</th>
                  <th className="px-4 py-3 font-medium">Period</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {contracts.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">No contracts.</td></tr>}
                {contracts.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="px-4 py-3">{c.route}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.start_date ?? "—"} → {c.end_date ?? "—"}</td>
                    <td className="px-4 py-3 text-right tabular">{c.contract_currency} {c.contract_amount.toLocaleString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Trip history</h2>
          <div className="overflow-hidden rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Trip Code</th>
                  <th className="px-4 py-3 font-medium">Route</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Contract</th>
                </tr>
              </thead>
              <tbody>
                {trips.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">No trips linked yet.</td></tr>}
                {trips.map((t) => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link to="/trips/$tripId" params={{ tripId: t.id }} className="hover:underline">{t.trip_code}</Link>
                    </td>
                    <td className="px-4 py-3">{t.origin_destination}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3 text-right tabular">
                      {fmtUSD(t.financial?.contract_amount)}
                      <div className="text-[11px] text-muted-foreground">{fmtTZS(t.financial?.total_contract_tzs)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-bold tabular">{value}</div>
    </div>
  );
}
