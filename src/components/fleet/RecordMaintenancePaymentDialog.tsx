import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { fmtTZS } from "@/lib/format";

type RecordMaintenancePaymentDialogProps = {
  maintenanceId: string;
  currentPaid: number;
  totalCost: number;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
};

export function RecordMaintenancePaymentDialog({
  maintenanceId,
  currentPaid,
  totalCost,
  trigger,
  onSuccess,
}: RecordMaintenancePaymentDialogProps) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));

  const recordPayment = useMutation({
    mutationFn: async () => {
      const amt = Number(amount);
      if (!amt || amt <= 0) throw new Error("Enter a valid amount");
      const newPaid = currentPaid + amt;
      if (newPaid > totalCost) throw new Error("Payment exceeds total cost");
      const { error } = await supabase
        .from("vehicle_maintenance")
        .update({ paid_amount: newPaid })
        .eq("id", maintenanceId);
      if (error) throw error;
      // Optionally log to audit_logs
      await supabase.from("audit_logs").insert({
        action: "maintenance_payment",
        entity: "vehicle_maintenance",
        entity_id: maintenanceId,
        payload: { amount_tzs: amt, payment_date: paymentDate, new_paid: newPaid },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance"] });
      toast.success(`Payment of ${fmtTZS(Number(amount))} recorded`);
      setOpen(false);
      if (onSuccess) onSuccess();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary">
            <DollarSign className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            Enter the amount paid for this maintenance job.
            <br />
            Current paid: {fmtTZS(currentPaid)} · Balance: {fmtTZS(totalCost - currentPaid)}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>Amount (TZS)</Label>
            <Input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Payment date</Label>
            <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={() => recordPayment.mutate()}
            disabled={!amount || recordPayment.isPending}
            className="gap-2"
          >
            {recordPayment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
            Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
