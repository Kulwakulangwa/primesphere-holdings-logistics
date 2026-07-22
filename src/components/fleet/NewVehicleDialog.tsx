import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Truck, Pencil } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Vehicle } from "@/lib/queries";

const STATUSES = ["Active", "Maintenance", "Retired"];

type NewVehicleDialogProps = {
  initialData?: Vehicle | null; // for edit mode
  trigger?: React.ReactNode; // custom trigger, defaults to "Add vehicle" button
  onSuccess?: () => void; // callback after successful save
};

export function NewVehicleDialog({ initialData, trigger, onSuccess }: NewVehicleDialogProps) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reg, setReg] = useState("");
  const [model, setModel] = useState("");
  const [capacity, setCapacity] = useState("30");
  const [status, setStatus] = useState("Active");

  // Pre‑fill when initialData changes
  useEffect(() => {
    if (initialData) {
      setReg(initialData.reg_number);
      setModel(initialData.model);
      setCapacity(String(initialData.capacity_tons));
      setStatus(initialData.status);
    } else {
      // Reset when dialog closes (but we need to handle that)
    }
  }, [initialData]);

  // Reset form when dialog opens without initialData
  const resetForm = () => {
    if (!initialData) {
      setReg("");
      setModel("");
      setCapacity("30");
      setStatus("Active");
    }
  };

  const createOrUpdate = useMutation({
    mutationFn: async () => {
      const payload = {
        reg_number: reg.trim(),
        model: model.trim(),
        capacity_tons: Number(capacity || 0),
        status,
      };
      if (initialData?.id) {
        // Update
        const { error } = await supabase
          .from("vehicles")
          .update(payload)
          .eq("id", initialData.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from("vehicles")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["vehicles", "overview"] });
      if (initialData?.id) {
        qc.invalidateQueries({ queryKey: ["vehicle", initialData.id] });
      }
      toast.success(initialData ? "Vehicle updated" : "Vehicle added");
      setOpen(false);
      if (onSuccess) onSuccess();
      // Reset if not edit
      if (!initialData) resetForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // When dialog opens/closes, reset if not edit
  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open && !initialData) resetForm();
  };

  const defaultTrigger = initialData ? (
    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Edit vehicle">
      <Pencil className="h-4 w-4" />
    </Button>
  ) : (
    <Button className="gap-2">
      <Truck className="h-4 w-4" /> Add vehicle
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit vehicle" : "Add a new vehicle"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Update the vehicle details." : "Register a truck or trailer to the fleet."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Registration #</Label>
              <Input value={reg} onChange={(e) => setReg(e.target.value)} placeholder="T 123 ABC" />
            </div>
            <div className="grid gap-1.5">
              <Label>Model</Label>
              <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Scania R500" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Capacity (tons)</Label>
              <Input inputMode="decimal" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={() => createOrUpdate.mutate()}
            disabled={!reg || !model || createOrUpdate.isPending}
            className="gap-2"
          >
            {createOrUpdate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (initialData ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />)}
            {initialData ? "Update vehicle" : "Save vehicle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
