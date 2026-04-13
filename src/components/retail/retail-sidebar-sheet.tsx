"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type RetailSidebarSheetProps = {
  name: string;
  slug: string;
};

const navItems = [
  { label: "لوحة التحكم", active: false },
  { label: "التحليلات", active: false },
  { label: "المخزون", active: true },
  { label: "العملاء", active: false },
  { label: "الموظفون", active: false },
  { label: "التقارير", active: false },
  { label: "الإعدادات", active: false },
];

export default function RetailSidebarSheet({ name, slug }: RetailSidebarSheetProps) {
  return (
    <div className="lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="h-10 w-10 rounded-2xl text-lg">
            ☰
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[280px] bg-white px-5" dir="rtl">
          <SheetHeader>
            <SheetTitle className="text-sm font-semibold text-slate-600">القائمة</SheetTitle>
          </SheetHeader>
          <div className="mt-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e9f4ff] text-[#2e6fe6]">
                🛒
              </div>
              <div>
                <p className="text-xs text-slate-400">FastCart</p>
                <p className="text-sm font-semibold">{name}</p>
              </div>
            </div>
            <div className="rounded-2xl bg-[#f2f7ff] px-3 py-2 text-xs text-slate-500">{slug}</div>
            <nav className="space-y-2 text-sm text-slate-600">
              {navItems.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between rounded-2xl px-3 py-2 ${
                    item.active ? "bg-[#e9f4ff] text-[#2e6fe6] font-semibold" : "hover:bg-slate-50"
                  }`}
                >
                  <span>{item.label}</span>
                </div>
              ))}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
