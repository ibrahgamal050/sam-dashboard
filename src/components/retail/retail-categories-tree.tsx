import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type RetailCategoriesTreeProps = {
  sectionsCount: number;
  newSectionName: string;
  newSectionImage: string;
  onSectionNameChange: (value: string) => void;
  onSectionImageChange: (value: string) => void;
  onAddSection: () => void;
  isSaving: boolean;
  children: React.ReactNode;
};

export function RetailCategoriesTree({
  sectionsCount,
  newSectionName,
  newSectionImage,
  onSectionNameChange,
  onSectionImageChange,
  onAddSection,
  isSaving,
  children,
}: RetailCategoriesTreeProps) {
  return (
    <Card className="border-0 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold text-slate-900">أقسام الكتالوج</CardTitle>
        <Badge variant="secondary">{sectionsCount} أقسام</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={newSectionName}
            onChange={(event) => onSectionNameChange(event.target.value)}
            placeholder="اسم قسم جديد"
            className="h-10 w-full rounded-xl sm:w-72"
          />
          <Input
            value={newSectionImage}
            onChange={(event) => onSectionImageChange(event.target.value)}
            placeholder="رابط صورة القسم (اختياري)"
            className="h-10 w-full rounded-xl sm:w-72"
          />
          <Button className="h-10 rounded-xl" onClick={onAddSection} disabled={isSaving}>
            إضافة قسم
          </Button>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
