"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Search, X } from "lucide-react";
import {
  createTimetableSlotAction,
  deleteTimetableSlotAction,
} from "@/lib/actions/timetable";
import {
  DAYS_OF_WEEK,
  PERIODS,
  type ClassRoom,
  type DayOfWeek,
  type Subject,
  type Teacher,
  type TimetableSlotDetailed,
} from "@/lib/types";
import { formatClassLabel } from "@/lib/utils-app";
import { cn } from "@/lib/utils";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  slots: TimetableSlotDetailed[];
  teachers: Teacher[];
  classes: ClassRoom[];
  subjects: Subject[];
}

function shortName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return name;
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

function slotKey(day: DayOfWeek, start: string) {
  return `${day}-${start.slice(0, 5)}`;
}

export function TimetableGrid({ slots, teachers, classes, subjects }: Props) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [form, setForm] = useState({
    teacher_id: "",
    class_id: "",
    subject_id: "",
    day_of_week: "" as DayOfWeek | "",
    periodIndex: "",
    room_number: "",
  });

  const slotMap = useMemo(() => {
    const map = new Map<string, TimetableSlotDetailed[]>();
    for (const slot of slots) {
      const key = slotKey(slot.day_of_week, slot.start_time);
      const list = map.get(key) ?? [];
      list.push(slot);
      map.set(key, list);
    }
    return map;
  }, [slots]);

  const searchQuery = teacherSearch.trim().toLowerCase();
  const isSearching = searchQuery.length > 0;

  const matchedTeacherIds = useMemo(() => {
    if (!isSearching) return new Set<string>();
    return new Set(
      teachers
        .filter((t) => t.full_name.toLowerCase().includes(searchQuery))
        .map((t) => t.id)
    );
  }, [teachers, searchQuery, isSearching]);

  const matchedSlots = useMemo(() => {
    if (!isSearching) return [];
    return slots.filter(
      (s) =>
        matchedTeacherIds.has(s.teacher_id) ||
        s.teacher?.full_name?.toLowerCase().includes(searchQuery)
    );
  }, [slots, matchedTeacherIds, searchQuery, isSearching]);

  const matchedTeacherName =
    matchedSlots[0]?.teacher?.full_name ||
    teachers.find((t) => matchedTeacherIds.has(t.id))?.full_name ||
    null;

  async function handleCreate() {
    const period = PERIODS[Number(form.periodIndex)];
    if (
      !form.teacher_id ||
      !form.class_id ||
      !form.subject_id ||
      !form.day_of_week ||
      !period
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSaving(true);
    const result = await createTimetableSlotAction({
      teacher_id: form.teacher_id,
      class_id: form.class_id,
      subject_id: form.subject_id,
      day_of_week: form.day_of_week,
      start_time: period.start,
      end_time: period.end,
      room_number: form.room_number || undefined,
    });
    setSaving(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Slot added.");
    setAddOpen(false);
    setForm({
      teacher_id: "",
      class_id: "",
      subject_id: "",
      day_of_week: "",
      periodIndex: "",
      room_number: "",
    });
    router.refresh();
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const result = await deleteTimetableSlotAction(deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Slot removed.");
    router.refresh();
  }

  function isHighlighted(slot: TimetableSlotDetailed) {
    if (!isSearching) return false;
    return (
      matchedTeacherIds.has(slot.teacher_id) ||
      (slot.teacher?.full_name?.toLowerCase().includes(searchQuery) ?? false)
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={teacherSearch}
            onChange={(e) => setTeacherSearch(e.target.value)}
            placeholder="Search teacher — e.g. Tauseef"
            className="pl-9 pr-9"
            aria-label="Search teacher on timetable"
          />
          {isSearching && (
            <button
              type="button"
              onClick={() => setTeacherSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="shrink-0 bg-teal-700 hover:bg-teal-800"
        >
          <Plus className="mr-2 h-4 w-4" /> Add slot
        </Button>
      </div>

      {isSearching && (
        <div
          className={cn(
            "mb-4 rounded-lg border px-4 py-3 text-sm",
            matchedSlots.length > 0
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-slate-200 bg-slate-50 text-slate-600"
          )}
        >
          {matchedSlots.length > 0 ? (
            <>
              Showing{" "}
              <strong>
                {matchedSlots.length} class
                {matchedSlots.length === 1 ? "" : "es"}
              </strong>
              {matchedTeacherName ? (
                <>
                  {" "}
                  for <strong>{matchedTeacherName}</strong>
                </>
              ) : null}
              . Matching periods are highlighted on the grid.
            </>
          ) : (
            <>No classes found for “{teacherSearch.trim()}”.</>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className="w-28 px-3 py-3 text-left text-xs font-semibold text-slate-600">
                Period
              </th>
              {DAYS_OF_WEEK.map((day) => (
                <th
                  key={day}
                  className="px-2 py-3 text-left text-xs font-semibold text-slate-600"
                >
                  {day.slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((period) => (
              <tr
                key={period.label}
                className="border-b border-slate-100 last:border-0"
              >
                <td className="align-top px-3 py-2 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">
                    {period.label}
                  </span>
                  <br />
                  {period.start}–{period.end}
                </td>
                {DAYS_OF_WEEK.map((day) => {
                  const cellSlots =
                    slotMap.get(slotKey(day, period.start)) ?? [];
                  return (
                    <td key={day} className="align-top p-1.5">
                      <div className="flex min-h-[72px] flex-col gap-1">
                        {cellSlots.map((slot) => {
                          const highlighted = isHighlighted(slot);
                          const dimmed = isSearching && !highlighted;
                          return (
                            <div
                              key={slot.id}
                              className={cn(
                                "group relative rounded-lg border px-2 py-1.5 text-xs transition-all",
                                highlighted
                                  ? "border-amber-400 bg-amber-100 ring-2 ring-amber-300/70 shadow-sm"
                                  : dimmed
                                    ? "border-slate-100 bg-slate-50/50 opacity-35"
                                    : "border-teal-100 bg-teal-50/60"
                              )}
                            >
                              <p className="font-medium text-slate-800">
                                {slot.subject?.name}
                              </p>
                              <p className="text-slate-600">
                                {shortName(slot.teacher?.full_name ?? "")}
                              </p>
                              <p className="text-slate-500">
                                {formatClassLabel(
                                  slot.class?.class_name ?? "",
                                  slot.class?.section ?? ""
                                )}
                                {slot.room_number
                                  ? ` · Rm ${slot.room_number}`
                                  : ""}
                              </p>
                              <button
                                type="button"
                                onClick={() => setDeleteId(slot.id)}
                                className="absolute right-1 top-1 rounded p-0.5 opacity-0 transition-opacity hover:bg-red-100 group-hover:opacity-100"
                                aria-label="Delete slot"
                              >
                                <Trash2 className="h-3 w-3 text-red-600" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add timetable slot</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Teacher</Label>
              <Select
                value={form.teacher_id}
                onValueChange={(v) => setForm({ ...form, teacher_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
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
            <div className="grid gap-2">
              <Label>Class</Label>
              <Select
                value={form.class_id}
                onValueChange={(v) => setForm({ ...form, class_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {formatClassLabel(c.class_name, c.section)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Subject</Label>
              <Select
                value={form.subject_id}
                onValueChange={(v) => setForm({ ...form, subject_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Day</Label>
              <Select
                value={form.day_of_week}
                onValueChange={(v) =>
                  setForm({ ...form, day_of_week: v as DayOfWeek })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Period</Label>
              <Select
                value={form.periodIndex}
                onValueChange={(v) => setForm({ ...form, periodIndex: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map((p, i) => (
                    <SelectItem key={p.label} value={String(i)}>
                      {p.label} ({p.start}–{p.end})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="room">Room (optional)</Label>
              <Input
                id="room"
                value={form.room_number}
                onChange={(e) =>
                  setForm({ ...form, room_number: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving}
              className="bg-teal-700 hover:bg-teal-800"
            >
              {saving ? "Adding…" : "Add slot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this slot?</AlertDialogTitle>
            <AlertDialogDescription>
              The slot will be removed from the timetable. Slots with
              substitution history cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
