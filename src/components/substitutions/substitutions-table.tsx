"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Trash2 } from "lucide-react";
import {
  updateSubstitutionStatusAction,
  deleteSubstitutionAction,
} from "@/lib/actions/absences";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import type { SubstitutionDetailed, SubstitutionStatus } from "@/lib/types";
import { formatTime, formatClassLabel } from "@/lib/utils-app";

interface SubstitutionsTableProps {
  substitutions: SubstitutionDetailed[];
}

function statusVariant(
  status: SubstitutionStatus
): "default" | "secondary" | "outline" {
  if (status === "completed") return "outline";
  if (status === "notified") return "default";
  return "secondary";
}

export function SubstitutionsTable({
  substitutions,
}: SubstitutionsTableProps) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function markCompleted(id: string) {
    setUpdatingId(id);
    startTransition(async () => {
      const result = await updateSubstitutionStatusAction(id, "completed");
      setUpdatingId(null);
      if (!result.success) {
        toast.error(result.error || "Could not update status.");
        return;
      }
      toast.success("Substitution marked as completed.");
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteId(null);
    setUpdatingId(id);
    startTransition(async () => {
      const result = await deleteSubstitutionAction(id);
      setUpdatingId(null);
      if (!result.success) {
        toast.error(result.error || "Could not delete substitution.");
        return;
      }
      toast.success("Substitution deleted.");
      router.refresh();
    });
  }

  const deleteTarget = substitutions.find((s) => s.id === deleteId);

  return (
    <div>
      <PageHeader
        title="Substitutions"
        description="Track assigned substitutes, mark periods complete, or remove entries."
      />

      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Original</TableHead>
              <TableHead>Substitute</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {substitutions.map((s) => {
              const tt = s.timetable;
              const loading = updatingId === s.id;
              return (
                <TableRow key={s.id}>
                  <TableCell className="whitespace-nowrap text-slate-600">
                    {s.date}
                  </TableCell>
                  <TableCell className="font-medium text-slate-800">
                    {s.original_teacher.full_name}
                  </TableCell>
                  <TableCell className="text-slate-800">
                    {s.substitute_teacher.full_name}
                  </TableCell>
                  <TableCell>{tt.subject.name}</TableCell>
                  <TableCell>
                    {formatClassLabel(
                      tt.class.class_name,
                      tt.class.section
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-slate-600">
                    {formatTime(tt.start_time)}–{formatTime(tt.end_time)}
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {tt.room_number || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(s.status)}>{s.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {s.status !== "completed" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPending && loading}
                          onClick={() => markCompleted(s.id)}
                          className="gap-1"
                        >
                          {loading && updatingId === s.id && !deleteId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4" />
                              Complete
                            </>
                          )}
                        </Button>
                      ) : (
                        <span className="mr-1 text-xs text-slate-400">Done</span>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-500 hover:text-red-600"
                        disabled={isPending && loading}
                        onClick={() => setDeleteId(s.id)}
                        aria-label="Delete substitution"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete substitution?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the substitution record
              {deleteTarget
                ? ` for ${deleteTarget.substitute_teacher.full_name} covering ${deleteTarget.original_teacher.full_name} on ${deleteTarget.date}`
                : ""}
              . This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
