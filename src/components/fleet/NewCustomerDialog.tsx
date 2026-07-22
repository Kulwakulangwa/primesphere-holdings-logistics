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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export function NewCustomerDialog({ trigger }: { trigger?: React.ReactNode }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ company_name: "", contact_person: "", phone: "", email: "", address: "" });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("customers").insert(f);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer added");
      setOpen(false);
      setF({ company_name: "", contact_person: "", phone: "", email: "", address: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button className="gap-2"><Plus className="h-4 w-4" />Add customer</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New customer</DialogTitle></DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5"><Label>Company name</Label><Input value={f.company_name} onChange={(e) => setF({ ...f, company_name: e.target.value })} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5"><Label>Contact person</Label><Input value={f.contact_person} onChange={(e) => setF({ ...f, contact_person: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Phone</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
          </div>
          <div className="grid gap-1.5"><Label>Email</Label><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          <div className="grid gap-1.5"><Label>Address</Label><Textarea rows={2} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={!f.company_name || save.isPending} className="gap-2">
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
