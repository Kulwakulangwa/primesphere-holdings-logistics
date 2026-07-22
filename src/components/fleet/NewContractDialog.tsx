import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export function NewContractDialog({ customerId }: { customerId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    route: "",
    contract_currency: "USD",
    contract_amount: "",
    start_date: "",
    end_date: "",
    status: "Draft",
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("contracts").insert({
        customer_id: customerId,
        route: f.route,
        contract_currency: f.contract_currency,
        contract_amount: Number(f.contract_amount || 0),
        start_date: f.start_date || null,
        end_date: f.end_date || null,
        status: f.status,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customer", customerId] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Contract created");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2"><Plus className="h-4 w-4" />New contract</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New contract</DialogTitle></DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5"><Label>Route</Label><Input value={f.route} onChange={(e) => setF({ ...f, route: e.target.value })} /></div>
          <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
            <div className="grid gap-1.5"><Label>Currency</Label>
              <Select value={f.contract_currency} onValueChange={(v) => setF({ ...f, contract_currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="TZS">TZS</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5"><Label>Amount</Label><Input inputMode="decimal" value={f.contract_amount} onChange={(e) => setF({ ...f, contract_amount: e.target.value })} /></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5"><Label>Start date</Label><Input type="date" value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>End date</Label><Input type="date" value={f.end_date} onChange={(e) => setF({ ...f, end_date: e.target.value })} /></div>
          </div>
          <div className="grid gap-1.5"><Label>Status</Label>
            <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={!f.route || save.isPending} className="gap-2">
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
