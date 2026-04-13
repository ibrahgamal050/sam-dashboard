import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import type { CatalogRow, EditForm, StatusKey } from "./retail-catalog-types";

type RetailProductEditorPanelProps = {
  editingRow: CatalogRow | null;
  editForm: EditForm;
  editImages: string[];
  editImageInput: string;
  onEditFormChange: <K extends keyof EditForm>(key: K, value: EditForm[K]) => void;
  onEditImageInputChange: (value: string) => void;
  onAddImage: () => void;
  onRemoveImage: (index: number) => void;
  onUploadImage?: (file: File) => void | Promise<void>;
  uploadingImage?: boolean;
  onSave: () => void;
  onClear: () => void;
  saving: boolean;
};

export function RetailProductEditorPanel({
  editingRow,
  editForm,
  editImages,
  editImageInput,
  onEditFormChange,
  onEditImageInputChange,
  onAddImage,
  onRemoveImage,
  onUploadImage,
  uploadingImage,
  onSave,
  onClear,
  saving,
}: RetailProductEditorPanelProps) {
  return (
    <Card className="border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <p className="text-xs text-slate-400">لوحة التعديل</p>
          <CardTitle className="text-base font-semibold text-slate-900">تعديل المنتج</CardTitle>
        </div>
        {editingRow ? <Badge variant="secondary">#{editingRow.id.slice(-4)}</Badge> : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {editingRow ? (
          <>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500">اسم المنتج</p>
              <Input
                value={editForm.name}
                onChange={(event) => onEditFormChange("name", event.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">سعر البيع</p>
                <Input
                  type="number"
                  value={editForm.price}
                  onChange={(event) => onEditFormChange("price", event.target.value)}
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">الكمية بالمخزون</p>
                <Input
                  type="number"
                  value={editForm.stock}
                  onChange={(event) => onEditFormChange("stock", event.target.value)}
                  className="h-10 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500">الحالة</p>
              <select
                value={editForm.status}
                onChange={(event) => onEditFormChange("status", event.target.value as StatusKey)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
              >
                <option value="published">منشور</option>
                <option value="draft">مسودة</option>
                <option value="inactive">غير نشط</option>
                <option value="stockout">نفد المخزون</option>
              </select>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500">صور المنتج</p>
              {editImages.length ? (
                <div className="grid grid-cols-3 gap-2">
                  {editImages.map((img, idx) => (
                    <div key={`${img}-${idx}`} className="relative h-20 rounded-xl border border-slate-200 bg-white p-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={editingRow.name} className="h-full w-full rounded-lg object-cover" />
                      <button
                        type="button"
                        className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs text-rose-500 shadow"
                        onClick={() => onRemoveImage(idx)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-xs text-slate-400">
                  لا توجد صور مضافة بعد.
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={editImageInput}
                  onChange={(event) => onEditImageInputChange(event.target.value)}
                  className="h-10 flex-1 rounded-xl"
                  placeholder="رابط صورة جديدة"
                />
                <Button variant="outline" className="h-10 rounded-xl text-xs" onClick={onAddImage}>
                  إضافة صورة
                </Button>
                {onUploadImage ? (
                  <label
                    className={`inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 ${
                      uploadingImage ? "pointer-events-none opacity-60" : ""
                    }`}
                  >
                    {uploadingImage ? "جارٍ الرفع..." : "رفع صورة"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/avif"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.currentTarget.value = "";
                        if (!file) return;
                        void onUploadImage(file);
                      }}
                    />
                  </label>
                ) : null}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            اختر منتجًا من القائمة لعرض تفاصيله هنا.
          </div>
        )}
      </CardContent>
      {editingRow ? (
        <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-4">
          <Button variant="outline" className="h-10 flex-1 rounded-xl" onClick={onClear} disabled={saving}>
            إلغاء التحديد
          </Button>
          <Button
            className="h-10 flex-1 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={onSave}
            disabled={saving}
          >
            حفظ التعديلات
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
