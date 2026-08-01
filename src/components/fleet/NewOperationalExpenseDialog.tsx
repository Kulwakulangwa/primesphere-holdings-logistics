import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Camera } from "lucide-react";
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

const CATEGORIES = ["Rent", "Loan Repayment", "Stationery", "Utilities", "Insurance", "Other"];

export function NewOperationalExpenseDialog({ onSuccess }: { onSuccess?: () => void }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Other");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [expenseType, setExpenseType] = useState<"border" | "local" | "both">("both");
  const [file, setFile] = useState<File | null>(null);

  const add = useMutation({
    mutationFn: async () => {
      let receipt_url: string | null = null;
      if (file) {
        const path = `operational/${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, "_")}`;
        const { error } = await supabase.storage.from("receipts").upload(path, file);
        if (error) throw error;
        receipt_url = path;
      }
      const { error } = await supabase.from("operational_expenses").insert({
        description,
        category,
        amount_tzs: Number(amount || 0),
        expense_date: expenseDate,
        expense_type: expenseType,
        receipt_url,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["operational_expenses"] });
      qc.invalidateQueries({ queryKey: ["finance", "overview"] });
      toast.success("Operational expense added");
      setOpen(false);
      if (onSuccess) onSuccess();
      // Reset form
      setDescription("");
      setCategory("Other");
      setAmount("");
      setExpenseDate(new Date().toISOString().slice(0, 10));
      setExpenseType("both");
      setFile(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add operational expense</DialogTitle>
          <DialogDescription>
            Record costs not tied to a specific trip (rent, loan, stationery, etc.)
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Office rent for July"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Amount (TZS)</Label>
              <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Date</Label>
              <Input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Expense type</Label>
              <Select value={expenseType} onValueChange={(v) => setExpenseType(v as "border" | "local" | "both")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="border">Border only</SelectItem>
                  <SelectItem value="local">Local only</SelectItem>
                  <SelectItem value="both">Both (shared)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label className="flex items-center gap-1.5">
              <Camera className="h-3.5 w-3.5" /> Receipt (optional)
            </Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file && <div className="text-xs text-muted-foreground">{file.name}</div>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={() => add.mutate()}
            disabled={!description || !amount || add.isPending}
            className="gap-2"
          >
            {add.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
