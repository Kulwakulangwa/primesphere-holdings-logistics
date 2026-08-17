import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Banknote, Pencil } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";

type Payment = {
  id: string;
  driver_id: string;
  payment_type: string;
  amount_tzs: number;
  payment_date: string;
  period_label: string | null;
  reference_trip: string | null;
  notes: string | null;
};

type NewDriverPaymentDialogProps = {
  driverId: string;
  suggestedSalary?: number;
  initialData?: Payment | null;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
};

export function NewDriverPaymentDialog({
  driverId,
  suggestedSalary,
  initialData,
  trigger,
  onSuccess,
}: NewDriverPaymentDialogProps) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"Salary" | "Advance">("Salary");
  const [amount, setAmount] = useState(String(suggestedSalary ?? 0));
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [period, setPeriod] = useState("");
  const [notes, setNotes] = useState("");

  // Pre-fill when editing
  useEffect(() => {
    if (initialData) {
      setType(initialData.payment_type as "Salary" | "Advance");
      setAmount(String(initialData.amount_tzs));
      setDate(initialData.payment_date);
      setPeriod(initialData.period_label || "");
      setNotes(initialData.notes || "");
    }
  }, [initialData]);

  // Auto-fill salary amount when adding new Salary payment
  useEffect(() => {
    if (!initialData && type === "Salary" && suggestedSalary) {
      setAmount(String(suggestedSalary));
    }
    if (!initialData && type === "Salary" && !suggestedSalary) {
      setAmount("");
    }
  }, [type, suggestedSalary, initialData]);

  const resetForm = () => {
    if (!initialData) {
      setType("Salary");
      setAmount(String(suggestedSalary ?? 0));
      setDate(new Date().toISOString().slice(0, 10));
      setPeriod("");
      setNotes("");
    }
  };

  const savePayment = useMutation({
    mutationFn: async () => {
      const payload = {
        driver_id: driverId,
        payment_type: type,
        amount_tzs: Number(amount || 0),
        payment_date: date,
        period_label: period.trim() || null,
        notes: notes.trim() || null,
      };
      if (initialData?.id) {
        // Update
        const { error } = await supabase
          .from("driver_payments")
          .update(payload)
          .eq("id", initialData.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from("driver_payments")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["driver", driverId] });
      qc.invalidateQueries({ queryKey: ["drivers"] });
      qc.invalidateQueries({ queryKey: ["drivers", "overview"] });
      qc.invalidateQueries({ queryKey: ["finance", "overview"] });
      toast.success(initialData ? "Payment updated" : "Payment recorded");
      setOpen(false);
      if (onSuccess) onSuccess();
      if (!initialData) resetForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open && !initialData) resetForm();
  };

  const defaultTrigger = initialData ? (
    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Edit payment">
      <Pencil className="h-4 w-4" />
    </Button>
  ) : (
    <Button variant="outline" size="sm" className="gap-2">
      <Banknote className="h-4 w-4" /> Record payment
    </Button>
  );

  const isEdit = !!initialData;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit payment" : "Record driver payment"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the payment details." : "Log salary payout or an extra cash advance."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <RadioGroup
            value={type}
            onValueChange={(v) => setType(v as "Salary" | "Advance")}
            className="flex gap-4"
          >
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <RadioGroupItem value="Salary" /> Salary
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <RadioGroupItem value="Advance" /> Cash advance
            </label>
          </RadioGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Amount (TZS)</Label>
              <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          {type === "Salary" && (
            <div className="grid gap-1.5">
              <Label>Period (e.g. Jul 2026)</Label>
              <Input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="Jul 2026" />
            </div>
          )}
          <div className="grid gap-1.5">
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={() => savePayment.mutate()}
            disabled={!amount || savePayment.isPending}
            className="gap-2"
          >
            {savePayment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (isEdit ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />)}
            {isEdit ? "Update" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
