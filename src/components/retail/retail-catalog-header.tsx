import { Download, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

type RetailCatalogHeaderProps = {
  name: string;
  onAdd: () => void;
};

export function RetailCatalogHeader({ name, onAdd }: RetailCatalogHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-sm text-slate-500">قائمة المنتجات</p>
        <h1 className="text-2xl font-semibold text-slate-900">{name}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" className="h-10 gap-2 text-sm">
          <Download className="h-4 w-4" />
          استيراد
        </Button>
        <Button variant="outline" className="h-10 gap-2 text-sm">
          <Download className="h-4 w-4" />
          تصدير
        </Button>
        <Button className="h-10 gap-2 bg-[#6D4BFF] text-sm hover:bg-[#5c3df0]" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          إضافة منتج
        </Button>
      </div>
    </div>
  );
}
