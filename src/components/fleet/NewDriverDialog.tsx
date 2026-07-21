import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, UserPlus } from "lucide-react";
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

export function NewDriverDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [license, setLicense] = useState("");
  const [salary, setSalary] = useState("450000");
  const [base, setBase] = useState("Dar es Salaam");

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("drivers").insert({
        full_name: fullName,
        phone: phone || null,
        license_number: license || null,
        monthly_salary_tzs: Number(salary || 0),
        base_location: base || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers"] });
      toast.success("Driver added");
      setOpen(false);
      setFullName("");
      setPhone("");
      setLicense("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" /> Add driver
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a new driver</DialogTitle>
          <DialogDescription>Register a driver with payroll details.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>Full name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Mwangi" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+255 ..." />
            </div>
            <div className="grid gap-1.5">
              <Label>License #</Label>
              <Input value={license} onChange={(e) => setLicense(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Monthly salary (TZS)</Label>
              <Input inputMode="decimal" value={salary} onChange={(e) => setSalary(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Base location</Label>
              <Input value={base} onChange={(e) => setBase(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={() => create.mutate()}
            disabled={!fullName || create.isPending}
            className="gap-2"
          >
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Save driver
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
