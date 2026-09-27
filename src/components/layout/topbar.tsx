"use client";

import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth";

interface TopbarProps {
  email: string;
  onMenuClick: () => void;
}

export function Topbar({ email, onMenuClick }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden sm:block">
          <p className="text-sm font-medium text-slate-800">Administration</p>
          <p className="text-xs text-slate-400">Manage timetables & substitutes</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden max-w-[200px] truncate text-sm text-slate-500 md:inline">
          {email}
        </span>
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm" className="gap-2">
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
