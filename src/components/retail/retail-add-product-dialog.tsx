import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import type { CatalogSection, MerchantOption, SectionItem, CategoryNode } from "./retail-catalog-types";

type GlobalProductOption = {
  id: string;
  name: { ar?: string; en?: string };
  slug: string;
  category?: string;
  unit?: string;
  images?: { url: string }[];
};

type AddState = {
  merchantProductId: string;
  sectionId: string;
  itemId: string;
  nodeId: string;
};

type RetailAddProductDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  merchantsCount: number;
  productQuery: string;
  onProductQueryChange: (value: string) => void;
  filteredMerchants: MerchantOption[];
  onSelectMerchant: (merchant: MerchantOption) => void;
  globalResults: GlobalProductOption[];
  globalLoading: boolean;
  selectedGlobalId?: string | null;
  onSelectGlobal: (item: GlobalProductOption) => void;
  createNewLabel?: string | null;
  onSelectCreateNew: () => void;
  newProductPrice: string;
  onNewProductPriceChange: (value: string) => void;
  newProductImages: string[];
  newProductImageInput: string;
  onNewProductImageInputChange: (value: string) => void;
  onAddNewProductImage: () => void;
  onRemoveNewProductImage: (index: number) => void;
  onUploadNewProductImage?: (file: File) => void | Promise<void>;
  uploadingNewProductImage?: boolean;
  sections: CatalogSection[];
  currentItems: SectionItem[];
  addState: AddState;
  onAddStateChange: (key: keyof AddState, value: string) => void;
  nodeOptions: Array<{ id: string; name: string; level: number }>;
  nodeLabel: (node: { name: string; level: number }) => string;
  onAddToCatalog: () => void;
  saving: boolean;
  catalogId?: string | null;
  formatCurrency: (value?: number | null) => string;
  displayGlobalName: (value?: { ar?: string; en?: string } | null) => string;
};

export function RetailAddProductDialog({
  open,
  onOpenChange,
  merchantsCount,
  productQuery,
  onProductQueryChange,
  filteredMerchants,
  onSelectMerchant,
  globalResults,
  globalLoading,
  selectedGlobalId,
  onSelectGlobal,
  createNewLabel,
  onSelectCreateNew,
  newProductPrice,
  onNewProductPriceChange,
  newProductImages,
  newProductImageInput,
  onNewProductImageInputChange,
  onAddNewProductImage,
  onRemoveNewProductImage,
  onUploadNewProductImage,
  uploadingNewProductImage,
  sections,
  currentItems,
  addState,
  onAddStateChange,
  nodeOptions,
  nodeLabel,
  onAddToCatalog,
  saving,
  catalogId,
  formatCurrency,
  displayGlobalName,
}: RetailAddProductDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-slate-900">إضافة منتج للكتالوج</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <Badge variant="secondary">{merchantsCount} منتجات</Badge>
          <div className="grid gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500">اسم المنتج</p>
              <Input
                value={productQuery}
                onChange={(event) => onProductQueryChange(event.target.value)}
                className="h-11 rounded-xl"
                placeholder="اكتب اسم المنتج للبحث"
              />
              <div className="mt-2 space-y-2">
                {filteredMerchants.length ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-2">
                    <p className="text-[11px] font-semibold text-slate-400">منتجات السوبرماركت</p>
                    <div className="mt-1 space-y-1">
                      {filteredMerchants.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-right text-sm hover:bg-slate-50"
                          onClick={() => onSelectMerchant(item)}
                        >
                          {item.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.image} alt={item.name} className="h-8 w-8 rounded-md object-cover" />
                          ) : (
                            <div className="h-8 w-8 rounded-md bg-slate-100" />
                          )}
                          <div className="flex-1 text-right">
                            <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                            <p className="text-xs text-slate-400">{formatCurrency(item.price)}</p>
                          </div>
                          <span className="text-xs text-slate-400">اختيار</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="rounded-xl border border-slate-200 bg-white p-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-slate-400">نتائج قاعدة البيانات</p>
                    {globalLoading ? <span className="text-[11px] text-slate-400">جارٍ البحث...</span> : null}
                  </div>
                  {globalResults.length ? (
                    <div className="mt-1 space-y-1">
                      {globalResults.map((item) => {
                        const label = displayGlobalName(item.name) || item.slug;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-right text-sm hover:bg-slate-50 ${
                              selectedGlobalId === item.id ? "bg-emerald-50" : ""
                            }`}
                            onClick={() => onSelectGlobal(item)}
                          >
                            {item.images?.[0]?.url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.images[0].url} alt={label} className="h-8 w-8 rounded-md object-cover" />
                            ) : (
                              <div className="h-8 w-8 rounded-md bg-slate-100" />
                            )}
                            <div className="flex-1 text-right">
                              <p className="text-sm font-semibold text-slate-800">{label}</p>
                              <p className="text-xs text-slate-400">{item.category || "عام"}</p>
                            </div>
                            <span className="text-xs text-slate-400">اختيار</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">لا توجد نتائج.</p>
                  )}
                </div>

                {productQuery.trim().length >= 2 ? (
                  <button
                    type="button"
                    className={`w-full rounded-xl border px-3 py-2 text-sm font-semibold ${
                      createNewLabel
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                    onClick={onSelectCreateNew}
                  >
                    إضافة "{productQuery.trim()}" كمنتج جديد
                  </button>
                ) : null}
              </div>
            </div>

            {!addState.merchantProductId ? (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">سعر المنتج (للمنتج الجديد)</p>
                <Input
                  type="number"
                  value={newProductPrice}
                  onChange={(event) => onNewProductPriceChange(event.target.value)}
                  className="h-11 rounded-xl"
                  placeholder="0"
                />
              </div>
            ) : null}

              {!addState.merchantProductId ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500">صور المنتج</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={newProductImageInput}
                    onChange={(event) => onNewProductImageInputChange(event.target.value)}
                    className="h-11 flex-1 rounded-xl"
                    placeholder="رابط الصورة"
                  />
                  <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={onAddNewProductImage}>
                    إضافة صورة
                  </Button>
                  {onUploadNewProductImage ? (
                    <label
                      className={`inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 ${
                        uploadingNewProductImage ? "pointer-events-none opacity-60" : ""
                      }`}
                    >
                      {uploadingNewProductImage ? "جارٍ الرفع..." : "رفع صورة"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/avif"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.currentTarget.value = "";
                          if (!file) return;
                          void onUploadNewProductImage(file);
                        }}
                      />
                    </label>
                  ) : null}
                </div>
                {newProductImages.length ? (
                  <div className="grid grid-cols-4 gap-2">
                    {newProductImages.map((url, idx) => (
                      <div key={`${url}-${idx}`} className="relative h-16 rounded-xl border border-slate-200 bg-white p-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="product" className="h-full w-full rounded-lg object-cover" />
                        <button
                          type="button"
                          className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs text-rose-500 shadow"
                          onClick={() => onRemoveNewProductImage(idx)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">يمكنك إضافة أكثر من صورة.</p>
                )}
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">القسم</p>
                <select
                  value={addState.sectionId}
                  onChange={(event) => onAddStateChange("sectionId", event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
                >
                  <option value="">اختر القسم</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">العنصر</p>
                <select
                  value={addState.itemId}
                  onChange={(event) => onAddStateChange("itemId", event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
                >
                  <option value="">اختر العنصر</option>
                  {currentItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500">التصنيف</p>
              {nodeOptions.length ? (
                <select
                  value={addState.nodeId}
                  onChange={(event) => onAddStateChange("nodeId", event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
                >
                  {nodeOptions.map((node) => (
                    <option key={node.id} value={node.id}>
                      {nodeLabel(node)}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  value={addState.nodeId}
                  onChange={(event) => onAddStateChange("nodeId", event.target.value)}
                  className="h-11 rounded-xl"
                />
              )}
            </div>

            <Button className="h-11 w-full rounded-xl" onClick={onAddToCatalog} disabled={saving}>
              إضافة
            </Button>
          </div>
          {!catalogId ? (
            <p className="text-xs text-amber-600">لا توجد شجرة تصنيفات لهذا السوبرماركت بعد.</p>
          ) : null}
        </div>
        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline" className="h-10 rounded-xl">
              إغلاق
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
