"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2, Sparkles } from "lucide-react";
import {
  createAbsenceAction,
  confirmSubstitutionAction,
  deleteAbsenceAction,
} from "@/lib/actions/absences";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { AbsenceDetailed, SlotSuggestion, Teacher } from "@/lib/types";
import { formatTime, formatClassLabel, todayISO } from "@/lib/utils-app";

interface AbsencesManagerProps {
  teachers: Teacher[];
  absences: AbsenceDetailed[];
}

export function AbsencesManager({ teachers, absences }: AbsencesManagerProps) {
  const router = useRouter();
  const [teacherId, setTeacherId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [reason, setReason] = useState("");
  const [suggestions, setSuggestions] = useState<SlotSuggestion[]>([]);
  const [activeAbsenceTeacherId, setActiveAbsenceTeacherId] = useState("");
  const [activeDate, setActiveDate] = useState("");
  const [assignedSlotIds, setAssignedSlotIds] = useState<Set<string>>(
    new Set()
  );
  const [confirmingKey, setConfirmingKey] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const visibleSuggestions = suggestions.filter(
    (s) => !assignedSlotIds.has(s.slot.id)
  );

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createAbsenceAction({
        teacher_id: teacherId,
        date,
        reason,
      });
      if (!result.success) {
        toast.error(result.error || "Could not record absence.");
        return;
      }
      toast.success("Absence recorded. Review substitute suggestions below.");
      setSuggestions(result.data?.suggestions ?? []);
      setActiveAbsenceTeacherId(teacherId);
      setActiveDate(date);
      setAssignedSlotIds(new Set());
      setReason("");
      router.refresh();
    });
  }

  function handleConfirm(
    slotId: string,
    substituteTeacherId: string,
    key: string
  ) {
    setConfirmingKey(key);
    startTransition(async () => {
      const result = await confirmSubstitutionAction({
        timetable_id: slotId,
        original_teacher_id: activeAbsenceTeacherId,
        substitute_teacher_id: substituteTeacherId,
        date: activeDate,
      });
      setConfirmingKey(null);
      if (!result.success) {
        toast.error(result.error || "Could not assign substitute.");
        return;
      }
      toast.success("Substitute assigned successfully.");
      if (result.data && !result.data.emailSent) {
        toast.warning(
          result.data.emailError ||
            "Substitute was assigned but the notification email could not be sent."
        );
      }
      setAssignedSlotIds((prev) => new Set(prev).add(slotId));
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteAbsenceAction(id);
      setDeletingId(null);
      if (!result.success) {
        toast.error(result.error || "Could not delete absence.");
        return;
      }
      toast.success("Absence removed.");
      router.refresh();
    });
  }

  return (
    <div>
      <PageHeader
        title="Absences"
        description="Mark a teacher absent and assign substitutes for their periods."
      />

      <Card className="mb-8 border-slate-200/80 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-slate-800">
            Record absence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <Label htmlFor="teacher">Teacher</Label>
              <Select
                value={teacherId}
                onValueChange={setTeacherId}
                required
              >
                <SelectTrigger id="teacher">
                  <SelectValue placeholder="Select active teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Sick leave, personal day, etc."
                rows={2}
              />
            </div>
            <div className="sm:col-span-2">
              <Button
                type="submit"
                disabled={isPending || !teacherId}
                className="bg-teal-700 hover:bg-teal-800"
              >
                {isPending && !confirmingKey && !deletingId ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finding substitutes…
                  </>
                ) : (
                  "Record absence & find substitutes"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {suggestions.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">
            Substitute suggestions
          </h2>
          {visibleSuggestions.length === 0 ? (
            <EmptyState
              title="All periods covered"
              description="Substitutes have been assigned for every period on this absence."
            />
          ) : (
            <div className="space-y-4">
              {visibleSuggestions.map((item) => {
                const { slot, candidates } = item;
                const top = candidates.slice(0, 3);
                return (
                  <Card
                    key={slot.id}
                    className="border-slate-200/80 shadow-sm"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-sm font-semibold text-slate-800">
                            {slot.subject.name}
                          </CardTitle>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatClassLabel(
                              slot.class.class_name,
                              slot.class.section
                            )}{" "}
                            · {formatTime(slot.start_time)}–
                            {formatTime(slot.end_time)}
                            {slot.room_number
                              ? ` · Room ${slot.room_number}`
                              : ""}
                          </p>
                        </div>
                        <Badge variant="secondary">{slot.day_of_week}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {top.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          No available substitutes for this period.
                        </p>
                      ) : (
                        <ul className="divide-y divide-slate-100">
                          {top.map((c) => {
                            const key = `${slot.id}-${c.teacher.id}`;
                            const isRecommended = c.rank === 1;
                            const loading = confirmingKey === key;
                            return (
                              <li
                                key={key}
                                className={`flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between ${
                                  isRecommended
                                    ? "rounded-lg border border-teal-200/80 bg-teal-50/50 px-3 -mx-3"
                                    : ""
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-medium text-slate-800">
                                      #{c.rank} {c.teacher.full_name}
                                    </span>
                                    {isRecommended && (
                                      <Badge className="gap-1 bg-teal-700 hover:bg-teal-700">
                                        <Sparkles className="h-3 w-3" />
                                        Recommended
                                      </Badge>
                                    )}
                                    {c.sameSubject && (
                                      <Badge variant="outline">
                                        Same subject
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="mt-0.5 text-xs text-slate-500">
                                    {c.substitutionsThisMonth} substitution
                                    {c.substitutionsThisMonth === 1
                                      ? ""
                                      : "s"}{" "}
                                    this month
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant={isRecommended ? "default" : "outline"}
                                  className={
                                    isRecommended
                                      ? "bg-teal-700 hover:bg-teal-800"
                                      : ""
                                  }
                                  disabled={!!confirmingKey || isPending}
                                  onClick={() =>
                                    handleConfirm(
                                      slot.id,
                                      c.teacher.id,
                                      key
                                    )
                                  }
                                >
                                  {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Confirm"
                                  )}
                                </Button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      )}

      <section>
        <h2 className="mb-4 text-sm font-semibold text-slate-800">
          Recent absences
        </h2>
        {!absences.length ? (
          <EmptyState
            title="No absences recorded"
            description="When you mark a teacher absent, it will appear here."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {absences.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium text-slate-800">
                      {a.teacher.full_name}
                    </TableCell>
                    <TableCell className="text-slate-600">{a.date}</TableCell>
                    <TableCell className="max-w-xs truncate text-slate-500">
                      {a.reason || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-500 hover:text-red-600"
                            disabled={deletingId === a.id}
                          >
                            {deletingId === a.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete absence?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This removes the absence record for{" "}
                              <strong>{a.teacher.full_name}</strong> on{" "}
                              {a.date}. Existing substitutions are not removed.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => handleDelete(a.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
