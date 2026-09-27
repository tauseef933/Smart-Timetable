"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, UserMinus, Plus } from "lucide-react";
import {
  createTeacherAction,
  updateTeacherAction,
  deactivateTeacherAction,
} from "@/lib/actions/teachers";
import type { Subject, TeacherWithSubjects } from "@/lib/types";
import { EmptyState } from "@/components/layout/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Props {
  teachers: TeacherWithSubjects[];
  subjects: Subject[];
}

type FormState = {
  full_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  subject_ids: string[];
};

const emptyForm = (): FormState => ({
  full_name: "",
  email: "",
  phone: "",
  is_active: true,
  subject_ids: [],
});

export function TeachersManager({ teachers, subjects }: Props) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TeacherWithSubjects | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(teacher: TeacherWithSubjects) {
    setEditing(teacher);
    setForm({
      full_name: teacher.full_name,
      email: teacher.email,
      phone: teacher.phone ?? "",
      is_active: teacher.is_active,
      subject_ids: teacher.subjects.map((s) => s.id),
    });
    setDialogOpen(true);
  }

  function toggleSubject(id: string) {
    setForm((f) => ({
      ...f,
      subject_ids: f.subject_ids.includes(id)
        ? f.subject_ids.filter((x) => x !== id)
        : [...f.subject_ids, id],
    }));
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      full_name: form.full_name,
      email: form.email,
      phone: form.phone || undefined,
      subject_ids: form.subject_ids,
    };
    const result = editing
      ? await updateTeacherAction({ id: editing.id, ...payload, is_active: form.is_active })
      : await createTeacherAction(payload);
    setSaving(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(editing ? "Teacher updated." : "Teacher added.");
    setDialogOpen(false);
    router.refresh();
  }

  async function handleDeactivate() {
    if (!deactivateId) return;
    setDeactivating(true);
    const result = await deactivateTeacherAction(deactivateId);
    setDeactivating(false);
    setDeactivateId(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Teacher deactivated.");
    router.refresh();
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate} className="bg-teal-700 hover:bg-teal-800">
          <Plus className="mr-2 h-4 w-4" /> Add teacher
        </Button>
      </div>

      {!teachers.length ? (
        <EmptyState
          title="No teachers yet"
          description="Add your first teacher to get started."
          action={
            <Button onClick={openCreate} className="bg-teal-700 hover:bg-teal-800">
              Add teacher
            </Button>
          }
        />
      ) : (
        <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium text-slate-800">{t.full_name}</TableCell>
                  <TableCell className="text-slate-600">{t.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {t.subjects.length
                        ? t.subjects.map((s) => (
                            <Badge key={s.id} variant="secondary" className="text-xs">
                              {s.name}
                            </Badge>
                          ))
                        : <span className="text-xs text-slate-400">None</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.is_active ? "default" : "secondary"}>
                      {t.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {t.is_active && (
                      <Button variant="ghost" size="icon" onClick={() => setDeactivateId(t.id)}>
                        <UserMinus className="h-4 w-4 text-amber-600" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit teacher" : "Add teacher"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            {editing && (
              <div className="flex items-center gap-2">
                <Checkbox id="is_active" checked={form.is_active} onCheckedChange={(c) => setForm({ ...form, is_active: c === true })} />
                <Label htmlFor="is_active">Active</Label>
              </div>
            )}
            <div className="grid gap-2">
              <Label>Subjects</Label>
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border border-slate-200 p-3">
                {subjects.map((s) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <Checkbox checked={form.subject_ids.includes(s.id)} onCheckedChange={() => toggleSubject(s.id)} id={`sub-${s.id}`} />
                    <Label htmlFor={`sub-${s.id}`} className="font-normal">{s.name}</Label>
                  </div>
                ))}
                {!subjects.length && <p className="text-xs text-slate-500">No subjects defined yet.</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-teal-700 hover:bg-teal-800">
              {saving ? "Saving…" : editing ? "Save changes" : "Add teacher"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deactivateId} onOpenChange={(o) => !o && setDeactivateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate teacher?</AlertDialogTitle>
            <AlertDialogDescription>
              They will no longer appear as active for scheduling. You can reactivate them from edit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivate} disabled={deactivating} className="bg-amber-600 hover:bg-amber-700">
              {deactivating ? "Deactivating…" : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
