"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  createClassAction,
  updateClassAction,
  deleteClassAction,
} from "@/lib/actions/classes";
import type { ClassRoom } from "@/lib/types";
import { formatClassLabel } from "@/lib/utils-app";
import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  classes: ClassRoom[];
}

export function ClassesManager({ classes }: Props) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ClassRoom | null>(null);
  const [class_name, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  function openCreate() {
    setEditing(null);
    setClassName("");
    setSection("");
    setDialogOpen(true);
  }

  function openEdit(c: ClassRoom) {
    setEditing(c);
    setClassName(c.class_name);
    setSection(c.section);
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const result = editing
      ? await updateClassAction({ id: editing.id, class_name, section })
      : await createClassAction({ class_name, section });
    setSaving(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(editing ? "Class updated." : "Class added.");
    setDialogOpen(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const result = await deleteClassAction(deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Class deleted.");
    router.refresh();
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate} className="bg-teal-700 hover:bg-teal-800">
          <Plus className="mr-2 h-4 w-4" /> Add class
        </Button>
      </div>

      {!classes.length ? (
        <EmptyState
          title="No classes yet"
          description="Add class sections to build your timetable."
          action={
            <Button onClick={openCreate} className="bg-teal-700 hover:bg-teal-800">
              Add class
            </Button>
          }
        />
      ) : (
        <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Section</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-slate-800">
                    {formatClassLabel(c.class_name, c.section)}
                  </TableCell>
                  <TableCell className="text-slate-600">{c.section}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit class" : "Add class"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="class_name">Class name</Label>
              <Input id="class_name" value={class_name} onChange={(e) => setClassName(e.target.value)} placeholder="e.g. Grade 10" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="section">Section</Label>
              <Input id="section" value={section} onChange={(e) => setSection(e.target.value)} placeholder="e.g. A" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-teal-700 hover:bg-teal-800">
              {saving ? "Saving…" : editing ? "Save changes" : "Add class"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete class?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Classes with timetable slots must be cleared first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
