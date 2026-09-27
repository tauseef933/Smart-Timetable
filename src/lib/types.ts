export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

export type SubstitutionStatus = "assigned" | "notified" | "completed";

export interface Subject {
  id: string;
  name: string;
}

export interface Teacher {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export interface TeacherWithSubjects extends Teacher {
  subjects: Subject[];
}

export interface ClassRoom {
  id: string;
  class_name: string;
  section: string;
}

export interface TimetableSlot {
  id: string;
  teacher_id: string;
  class_id: string;
  subject_id: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  room_number: string | null;
}

export interface TimetableSlotDetailed extends TimetableSlot {
  teacher: Teacher;
  class: ClassRoom;
  subject: Subject;
}

export interface Absence {
  id: string;
  teacher_id: string;
  date: string;
  reason: string | null;
  created_at: string;
}

export interface AbsenceDetailed extends Absence {
  teacher: Teacher;
}

export interface Substitution {
  id: string;
  timetable_id: string;
  original_teacher_id: string;
  substitute_teacher_id: string;
  date: string;
  status: SubstitutionStatus;
  created_at: string;
}

export interface SubstitutionDetailed extends Substitution {
  original_teacher: Teacher;
  substitute_teacher: Teacher;
  timetable: TimetableSlotDetailed;
}

export interface AppSettings {
  id: string;
  college_name: string;
  college_logo_url: string | null;
  email_from_name: string | null;
  updated_at: string;
}

export interface SubstituteCandidate {
  teacher: Teacher;
  sameSubject: boolean;
  substitutionsThisMonth: number;
  rank: number;
}

export interface SlotSuggestion {
  slot: TimetableSlotDetailed;
  candidates: SubstituteCandidate[];
}

export interface ActionResult<T = void> {
  success: boolean;
  error?: string;
  data?: T;
}

export const DAYS_OF_WEEK: DayOfWeek[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const PERIODS = [
  { start: "08:00", end: "08:45", label: "Period 1" },
  { start: "08:45", end: "09:30", label: "Period 2" },
  { start: "09:30", end: "10:15", label: "Period 3" },
  { start: "10:30", end: "11:15", label: "Period 4" },
  { start: "11:15", end: "12:00", label: "Period 5" },
  { start: "12:00", end: "12:45", label: "Period 6" },
] as const;
