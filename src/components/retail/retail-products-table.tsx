import { Calendar, ChevronDown, Filter, MoreHorizontal, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import type { CatalogRow, CatalogSection, StatusKey } from "./retail-catalog-types";

type RetailProductsTableProps = {
  rows: CatalogRow[];
  pagedRows: CatalogRow[];
  rowMeta: Map<string, { sectionTitle: string; itemTitle: string }>;
  query: string;
  onQueryChange: (value: string) => void;
  statusFilter: "all" | "active" | "inactive";
  onStatusFilterChange: (value: "all" | "active" | "inactive") => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  sections: CatalogSection[];
  statusStyles: Record<StatusKey, string>;
  getStatusKey: (row: CatalogRow) => StatusKey;
  applyStatus: (row: CatalogRow, status: StatusKey) => void;
  onOpenEdit: (row: CatalogRow) => void;
  savingMap: Record<string, boolean>;
  page: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  formatCurrency: (value?: number | null) => string;
};

export function RetailProductsTable({
  rows,
  pagedRows,
  rowMeta,
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  sections,
  statusStyles,
  getStatusKey,
  applyStatus,
  onOpenEdit,
  savingMap,
  page,
  totalPages,
  pageSize,
  totalCount,
  onPageChange,
  formatCurrency,
}: RetailProductsTableProps) {
  return (
    <Card className="border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              className="w-48 bg-transparent text-right text-sm text-slate-700 outline-none"
              placeholder="ابحث"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
              <Calendar className="h-4 w-4" />
              12 Sep - 28 Oct 2024
            </button>
            <select
              value={statusFilter}
              onChange={(event) => onStatusFilterChange(event.target.value as "all" | "active" | "inactive")}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600"
            >
              <option value="all">الحالة</option>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(event) => onCategoryFilterChange(event.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600"
            >
              <option value="all">التصنيف</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.title}
                </option>
              ))}
            </select>
            <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
              <Filter className="h-4 w-4" />
              تصفية
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-right">
                  <input type="checkbox" className="h-4 w-4" />
                </th>
                <th className="px-4 py-3 text-right">اسم المنتج</th>
                <th className="px-4 py-3 text-right">التصنيف</th>
                <th className="px-4 py-3 text-right">المخزون</th>
                <th className="px-4 py-3 text-right">السعر</th>
                <th className="px-4 py-3 text-right">الحالة</th>
                <th className="px-4 py-3 text-right">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    {rows.length ? "لا توجد نتائج مطابقة." : "لا توجد منتجات مرتبطة بالكتالوج بعد."}
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => {
                  const meta = rowMeta.get(row.id);
                  const statusKey = getStatusKey(row);
                  const isSaving = savingMap[row.id];
                  const stockValue = typeof row.stock === "number" ? row.stock : "-";
                  const stockLabel =
                    !row.available || row.stock === 0
                      ? { label: "غير متوفر", color: "text-rose-500" }
                      : typeof row.stock === "number" && row.stock <= 5
                      ? { label: "مخزون منخفض", color: "text-amber-500" }
                      : { label: "متوفر", color: "text-emerald-600" };

                  return (
                    <tr
                      key={row.id}
                      className="cursor-pointer transition hover:bg-slate-50"
                      onClick={() => onOpenEdit(row)}
                    >
                      <td className="px-4 py-4 text-right" onClick={(event) => event.stopPropagation()}>
                        <input type="checkbox" className="h-4 w-4" />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center gap-3">
                          {row.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={row.image} alt={row.name} className="h-10 w-10 rounded-lg object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-slate-100" />
                          )}
                          <span className="font-medium text-slate-800">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right text-slate-500">
                        {meta?.sectionTitle || meta?.itemTitle || "-"}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800">{stockValue}</span>
                          <span className={`text-xs ${stockLabel.color}`}>{stockLabel.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-slate-700">
                        {formatCurrency(row.price)}
                      </td>
                      <td className="px-4 py-4 text-right" onClick={(event) => event.stopPropagation()}>
                        <div className="relative">
                          <select
                            value={statusKey}
                            onChange={(event) => applyStatus(row, event.target.value as StatusKey)}
                            disabled={isSaving}
                            className={`h-8 appearance-none rounded-full border px-3 pr-7 text-xs font-semibold ${statusStyles[statusKey]}`}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <option value="published">منشور</option>
                            <option value="draft">مسودة</option>
                            <option value="inactive">غير نشط</option>
                            <option value="stockout">نفد المخزون</option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right" onClick={(event) => event.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => onOpenEdit(row)}
                          disabled={isSaving}
                        >
                          <MoreHorizontal className="h-4 w-4 text-slate-500" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            نتيجة {totalCount === 0 ? 0 : (page - 1) * pageSize + 1}-
            {Math.min(page * pageSize, totalCount)} من {totalCount}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-8 px-3 text-xs"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              السابق
            </Button>
            <span className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600">{page}</span>
            <Button
              variant="outline"
              className="h-8 px-3 text-xs"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
            >
              التالي
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
