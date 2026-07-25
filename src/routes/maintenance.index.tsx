import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Wrench, Trash2, CheckCircle2, Clock, AlertCircle, ArrowUpRight, Pencil } from "lucide-react";
import { toast } from "sonner";

import { NewMaintenanceDialog } from "@/components/fleet/NewMaintenanceDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { maintenanceQuery } from "@/lib/queries"; // <-- uses central query with technician
import { fmtTZS } from "@/lib/format";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/maintenance/")({
  component: MaintenancePage,
  head: () => ({
    meta: [
      { title: "Maintenance — Primesphere Holdings Logistics" },
      { name: "description", content: "Track vehicle maintenance, costs, and service history." },
    ],
  }),
});

function MaintenancePage() {
  const qc = useQueryClient();
  const { data: records = [], isLoading } = useQuery(maintenanceQuery());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = records.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.description.toLowerCase().includes(s) ||
      r.vehicle?.reg_number.toLowerCase().includes(s) ||
      r.vehicle?.model.toLowerCase().includes(s) ||
      r.technician?.name?.toLowerCase().includes(s)
    );
  });

  const deleteRecord = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vehicle_maintenance").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance"] });
      toast.success("Maintenance record deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusIcon = (status: string) => {
    switch (status) {
      case "Completed": return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "In-Progress": return <Clock className="h-4 w-4 text-warning" />;
      default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const paymentStatusBadge = (paid: number, cost: number) => {
    if (paid >= cost) return <span className="inline-flex rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">Paid</span>;
    if (paid > 0) return <span className="inline-flex rounded-full bg-warning/25 px-2 py-0.5 text-[11px] font-medium text-warning-foreground dark:text-warning">Partial</span>;
    return <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">Unpaid</span>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-xl px-4 py-3 md:px-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Maintenance
          </h1>
          <p className="text-xs text-muted-foreground">Track vehicle service, repairs, and inspections.</p>
        </div>
        <NewMaintenanceDialog />
      </div>

      <main className="mx-auto max-w-[1400px] px-4 md:px-6 py-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by vehicle, description, or technician"
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Planned">Planned</SelectItem>
              <SelectItem value="In-Progress">In-Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Vehicle</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Technician</th>
                  <th className="px-4 py-3 font-medium text-right">Cost</th>
                  <th className="px-4 py-3 font-medium text-right">Paid</th>
                  <th className="px-4 py-3 font-medium text-right">Balance</th>
                  <th className="px-4 py-3 font-medium">Payment Status</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">Loading records…</td></tr>
                )}
                {!isLoading && filtered.length === 0 && (
                  <tr><td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">
                    {records.length === 0 ? "No maintenance records yet." : "No records match your filters."}
                  </td></tr>
                )}
                {filtered.map((r) => {
                  const balance = Number(r.cost_tzs) - (Number(r.paid_amount) || 0);
                  return (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition">
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {new Date(r.maintenance_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to="/vehicles/$vehicleId"
                          params={{ vehicleId: r.vehicle_id }}
                          className="inline-flex items-center gap-1 font-medium hover:text-primary"
                        >
                          {r.vehicle?.reg_number ?? "—"}
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                        <div className="text-[11px] text-muted-foreground">{r.vehicle?.model ?? ""}</div>
                      </td>
                      <td className="px-4 py-3 max-w-[240px] truncate">{r.description}</td>
                      <td className="px-4 py-3">{r.technician?.name || "—"}</td>
                      <td className="px-4 py-3 text-right tabular">{fmtTZS(Number(r.cost_tzs))}</td>
                      <td className="px-4 py-3 text-right tabular">{fmtTZS(Number(r.paid_amount) || 0)}</td>
                      <td className={cn("px-4 py-3 text-right tabular font-semibold", balance > 0 ? "text-destructive" : "text-success")}>
                        {fmtTZS(balance)}
                      </td>
                      <td className="px-4 py-3">{paymentStatusBadge(Number(r.paid_amount) || 0, Number(r.cost_tzs))}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
                          r.status === "Completed" && "bg-success/15 text-success",
                          r.status === "In-Progress" && "bg-warning/25 text-warning-foreground dark:text-warning",
                          r.status === "Planned" && "bg-muted text-muted-foreground",
                        )}>
                          {statusIcon(r.status)}
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <NewMaintenanceDialog
                            initialData={r}
                            trigger={<Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteRecord.mutate(r.id)}
                            disabled={deleteRecord.isPending}
                          >
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
