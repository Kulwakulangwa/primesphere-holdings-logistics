import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, FileText, Eye } from "lucide-react";
import { NewInvoiceDialog } from "@/components/fleet/NewInvoiceDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { invoicesQuery } from "@/lib/queries";
import { fmtTZS } from "@/lib/format";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/fleet/StatusBadge";

export const Route = createFileRoute("/invoices/")({
  component: InvoicesPage,
  head: () => ({
    meta: [
      { title: "Invoices — Primesphere Holdings Logistics" },
      { name: "description", content: "Manage customer invoices and payments." },
    ],
  }),
});

function InvoicesPage() {
  const { data: invoices = [] } = useQuery(invoicesQuery);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = invoices.filter((inv) => {
    if (status !== "all" && inv.status !== status) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      inv.invoice_number.toLowerCase().includes(s) ||
      inv.customer?.company_name?.toLowerCase().includes(s) ||
      inv.customer?.phone?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-xl px-4 py-3 md:px-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Invoices</h1>
          <p className="text-xs text-muted-foreground">Track invoices and customer payments</p>
        </div>
        <NewInvoiceDialog />
      </div>

      <main className="mx-auto max-w-[1400px] px-4 md:px-6 py-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search invoice # or customer"
              className="pl-9"
            />
          </div>
          <Tabs value={status} onValueChange={setStatus}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="Draft">Draft</TabsTrigger>
              <TabsTrigger value="Sent">Sent</TabsTrigger>
              <TabsTrigger value="Partially Paid">Partially Paid</TabsTrigger>
              <TabsTrigger value="Paid">Paid</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Invoice #</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Period</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium text-right">Paid</th>
                  <th className="px-4 py-3 font-medium text-right">Balance</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No invoices found.</td></tr>
                )}
                {filtered.map((inv) => {
                  const balance = inv.total_amount_tzs - inv.paid_amount_tzs;
                  return (
                    <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs">{inv.invoice_number}</td>
                      <td className="px-4 py-3">{inv.customer?.company_name || "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(inv.period_start).toLocaleDateString()} – {new Date(inv.period_end).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">{fmtTZS(inv.total_amount_tzs)}</td>
                      <td className="px-4 py-3 text-right">{fmtTZS(inv.paid_amount_tzs)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{fmtTZS(balance)}</td>
                      <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                      <td className="px-2 py-3">
                        <Link
                          to="/invoices/$invoiceId"
                          params={{ invoiceId: inv.id }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </td>
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
