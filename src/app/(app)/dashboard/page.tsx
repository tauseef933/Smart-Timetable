import Link from "next/link";
import {
  Users,
  UserX,
  RefreshCw,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { todayISO, formatTime, formatClassLabel } from "@/lib/utils-app";

export default async function DashboardPage() {
  const supabase = createClient();
  const today = todayISO();

  const [
    { count: teacherCount },
    { data: todayAbsences },
    { data: pendingSubs },
    { count: monthSubs },
    { count: slotCount },
  ] = await Promise.all([
    supabase
      .from("teachers")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("absences")
      .select("*, teacher:teachers(*)")
      .eq("date", today)
      .order("created_at", { ascending: false }),
    supabase
      .from("substitutions")
      .select(
        `*, original_teacher:teachers!substitutions_original_teacher_id_fkey(*), substitute_teacher:teachers!substitutions_substitute_teacher_id_fkey(*), timetable:timetable(*, class:classes(*), subject:subjects(*))`
      )
      .eq("date", today)
      .in("status", ["assigned", "notified"])
      .order("created_at", { ascending: false }),
    supabase
      .from("substitutions")
      .select("id", { count: "exact", head: true })
      .gte("date", today.slice(0, 8) + "01"),
    supabase.from("timetable").select("id", { count: "exact", head: true }),
  ]);

  const stats = [
    {
      label: "Active teachers",
      value: teacherCount ?? 0,
      icon: Users,
      href: "/teachers",
    },
    {
      label: "Absences today",
      value: todayAbsences?.length ?? 0,
      icon: UserX,
      href: "/absences",
    },
    {
      label: "Subs this month",
      value: monthSubs ?? 0,
      icon: RefreshCw,
      href: "/substitutions",
    },
    {
      label: "Timetable slots",
      value: slotCount ?? 0,
      icon: CalendarDays,
      href: "/timetable",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of today's schedule coverage and substitutions."
        actions={
          <Button asChild>
            <Link href="/absences">Mark absence</Link>
          </Button>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="group rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:border-teal-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                    {stat.value}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700 transition-colors group-hover:bg-teal-100">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              Today&apos;s absences
            </h2>
            <Link
              href="/absences"
              className="flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {!todayAbsences?.length ? (
            <EmptyState
              title="No absences today"
              description="All teachers are marked present for today."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {todayAbsences.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {(a.teacher as { full_name: string })?.full_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {a.reason || "No reason provided"}
                    </p>
                  </div>
                  <Badge variant="secondary">Absent</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              Pending substitutions
            </h2>
            <Link
              href="/substitutions"
              className="flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {!pendingSubs?.length ? (
            <EmptyState
              title="No pending substitutions"
              description="Substitutes assigned for today will appear here."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {pendingSubs.map((s) => {
                const tt = s.timetable as {
                  start_time: string;
                  end_time: string;
                  subject: { name: string };
                  class: { class_name: string; section: string };
                };
                return (
                  <li key={s.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {
                            (s.substitute_teacher as { full_name: string })
                              ?.full_name
                          }
                          <span className="font-normal text-slate-400">
                            {" "}
                            covering{" "}
                          </span>
                          {
                            (s.original_teacher as { full_name: string })
                              ?.full_name
                          }
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {tt?.subject?.name} ·{" "}
                          {formatClassLabel(
                            tt?.class?.class_name,
                            tt?.class?.section
                          )}{" "}
                          · {formatTime(tt?.start_time)}–
                          {formatTime(tt?.end_time)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          s.status === "notified" ? "default" : "secondary"
                        }
                      >
                        {s.status}
                      </Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
