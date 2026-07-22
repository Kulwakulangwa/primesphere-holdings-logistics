import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Building2, ArrowUpRight } from "lucide-react";
import { AppHeader } from "@/components/fleet/AppHeader";
import { NewCustomerDialog } from "@/components/fleet/NewCustomerDialog";
import { Input } from "@/components/ui/input";
import { customersOverviewQuery } from "@/lib/queries";
import { fmtUSD } from "@/lib/format";
import { StatusBadge } from "@/components/fleet/StatusBadge";

export const Route = createFileRoute("/customers/")({
  component: CustomersPage,
  head: () => ({
    meta: [
      { title: "Customers — FleetPulse" },
      { name: "description", content: "Client accounts, contracts and revenue generated per customer." },
    ],
  }),
});

function CustomersPage() {
  const { data: customers = [] } = useQuery(customersOverviewQuery);
  const [q, setQ] = useState("");
  const filtered = customers.filter((c) => !q || c.company_name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="min-h-screen bg-background">
      <AppHeader right={<NewCustomerDialog />} />
      <main className="mx-auto max-w-[1400px] px-4 md:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Building2 className="h-6 w-6 text-primary" />Customers</h1>
          <p className="text-sm text-muted-foreground">Client accounts, contracts and total revenue booked.</p>
        </div>

        <div className="mb-4 relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search customers…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>

        <div className="overflow-hidden rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium text-right">Trips</th>
                <th className="px-4 py-3 font-medium text-right">Contracts</th>
                <th className="px-4 py-3 font-medium text-right">Revenue</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No customers yet.</td></tr>}
              {filtered.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{c.company_name}</td>
                  <td className="px-4 py-3">{c.contact_person ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-right tabular">{c.trip_count}</td>
                  <td className="px-4 py-3 text-right tabular">{c.contract_count}</td>
                  <td className="px-4 py-3 text-right tabular font-semibold">{fmtUSD(c.revenue_usd)}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-2 py-3">
                    <Link to="/customers/$customerId" params={{ customerId: c.id }} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground">
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
