"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TopBar() {
  return (
    <header className="fixed left-64 right-0 top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-8">
      <div />
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
            BC
          </div>
        </div>
      </div>
    </header>
  );
}