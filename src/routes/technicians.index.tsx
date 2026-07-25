import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Trash2, Pencil, User, Eye } from "lucide-react";
import { toast } from "sonner";

import { NewTechnicianDialog } from "@/components/fleet/NewTechnicianDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fmtTZS } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/technicians/")({
  component: TechniciansPage,
  head: () => ({
    meta: [
      { title: "Technicians — Primesphere Holdings Logistics" },
      { name: "description", content: "Manage mechanics and technicians." },
    ],
  }),
});

function TechniciansPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const { data: technicians = [], isLoading } = useQuery({
    queryKey: ["technicians"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("technicians")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // For each technician, we also want to show total maintenance cost and paid amount
  const { data: maintenanceData } = useQuery({
    queryKey: ["maintenance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_maintenance")
        .select("technician_id, cost_tzs, paid_amount");
      if (error) throw error;
      return data;
    },
  });

  const deleteTechnician = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("technicians").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["technicians"] });
      toast.success("Technician removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Calculate totals per technician
  const technicianStats = new Map();
  (maintenanceData ?? []).forEach((m) => {
    if (!m.technician_id) return;
    const existing = technicianStats.get(m.technician_id) || { totalCost: 0, totalPaid: 0 };
    existing.totalCost += Number(m.cost_tzs);
    existing.totalPaid += Number(m.paid_amount || 0);
    technicianStats.set(m.technician_id, existing);
  });

  const filtered = technicians.filter((t) =>
    t.name.toLowerCase().includes(q.toLowerCase()) ||
    t.phone?.includes(q) ||
    t.email?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-xl px-4 py-3 md:px-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Technicians
          </h1>
          <p className="text-xs text-muted-foreground">Manage mechanics and technicians</p>
        </div>
        <NewTechnicianDialog />
      </div>

      <main className="mx-auto max-w-[1400px] px-4 md:px-6 py-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, phone, email"
              className="pl-9"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium text-right">Total Work</th>
                  <th className="px-4 py-3 font-medium text-right">Paid</th>
                  <th className="px-4 py-3 font-medium text-right">Balance</th>
                  <th className="w-24" />
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Loading…</td></tr>
                )}
                {!isLoading && filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No technicians found.</td></tr>
                )}
                {filtered.map((t) => {
                  const stats = technicianStats.get(t.id) || { totalCost: 0, totalPaid: 0 };
                  const balance = stats.totalCost - stats.totalPaid;
                  return (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">
                        <Link
                          to="/technicians/$technicianId"
                          params={{ technicianId: t.id }}
                          className="hover:underline hover:text-primary transition"
                        >
                          {t.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{t.phone || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{t.email || "—"}</td>
                      <td className="px-4 py-3 text-right">{fmtTZS(stats.totalCost)}</td>
                      <td className="px-4 py-3 text-right">{fmtTZS(stats.totalPaid)}</td>
                      <td className={cn("px-4 py-3 text-right font-semibold", balance > 0 ? "text-destructive" : "text-success")}>
                        {fmtTZS(balance)}
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            to="/technicians/$technicianId"
                            params={{ technicianId: t.id }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                            aria-label="View technician"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <NewTechnicianDialog initialData={t} trigger={<Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>} />
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteTechnician.mutate(t.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
