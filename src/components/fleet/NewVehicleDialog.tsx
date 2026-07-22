import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Wrench } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { vehiclesQuery } from "@/lib/queries";

const STATUSES = ["Planned", "In-Progress", "Completed"];

export function NewMaintenanceDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: vehicles = [] } = useQuery(vehiclesQuery);

  const [vehicleId, setVehicleId] = useState<string>("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [duration, setDuration] = useState("");
  const [status, setStatus] = useState("Planned");

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("vehicle_maintenance").insert({
        vehicle_id: vehicleId,
        maintenance_date: date,
        description: description.trim(),
        cost_tzs: Number(cost || 0),
        duration_hours: duration ? Number(duration) : null,
        status,
        completed_at: status === "Completed" ? new Date().toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance"] });
      qc.invalidateQueries({ queryKey: ["vehicles"] }); // refresh vehicle stats if needed
      toast.success("Maintenance record added");
      setOpen(false);
      setVehicleId("");
      setDescription("");
      setCost("");
      setDuration("");
      setStatus("Planned");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetForm = () => {
    setVehicleId("");
    setDescription("");
    setCost("");
    setDuration("");
    setStatus("Planned");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); setOpen(o); }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Wrench className="h-4 w-4" /> New Maintenance
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log a maintenance event</DialogTitle>
          <DialogDescription>Record service, repairs, or inspections.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>Vehicle</Label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.reg_number} – {v.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="grid gap-1.5">
            <Label>Description</Label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Engine oil change, brake pad replacement..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Cost (TZS)</Label>
              <Input
                inputMode="decimal"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Duration (hours)</Label>
              <Input
                inputMode="decimal"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 2.5"
              />
            </div>
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
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={() => create.mutate()}
            disabled={!vehicleId || !description || !cost || create.isPending}
            className="gap-2"
          >
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Save record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
