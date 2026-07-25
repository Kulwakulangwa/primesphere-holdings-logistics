import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, User, Pencil } from "lucide-react";
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

type Technician = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
};

type NewTechnicianDialogProps = {
  initialData?: Technician | null;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
};

export function NewTechnicianDialog({ initialData, trigger, onSuccess }: NewTechnicianDialogProps) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setPhone(initialData.phone ?? "");
      setEmail(initialData.email ?? "");
      setAddress(initialData.address ?? "");
    }
  }, [initialData]);

  const resetForm = () => {
    if (!initialData) {
      setName("");
      setPhone("");
      setEmail("");
      setAddress("");
    }
  };

  const createOrUpdate = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
      };
      if (initialData?.id) {
        const { error } = await supabase
          .from("technicians")
          .update(payload)
          .eq("id", initialData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("technicians")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["technicians"] });
      toast.success(initialData ? "Technician updated" : "Technician added");
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
    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Edit technician">
      <Pencil className="h-4 w-4" />
    </Button>
  ) : (
    <Button className="gap-2">
      <User className="h-4 w-4" /> Add Technician
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit technician" : "Add a new technician"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Update technician details." : "Register a new mechanic/technician."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>Full name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
          </div>
          <div className="grid gap-1.5">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+255 700 000 000" />
          </div>
          <div className="grid gap-1.5">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" />
          </div>
          <div className="grid gap-1.5">
            <Label>Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Dar es Salaam" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={() => createOrUpdate.mutate()}
            disabled={!name || createOrUpdate.isPending}
            className="gap-2"
          >
            {createOrUpdate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (initialData ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />)}
            {initialData ? "Update" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
