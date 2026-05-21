"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Save, X } from "lucide-react"
import type { DeliveryZone, CreateDeliveryZoneRequest } from "@/types/delivery-zones"

interface ZoneEditorFormProps {
  zone?: DeliveryZone | null
  entityId: string
  entityType?: "restaurant" | "supermarket"
  allowedZoneTypes?: Array<"circle" | "polygon">
  onSave: (zoneData: CreateDeliveryZoneRequest | (Partial<DeliveryZone> & { id: string })) => Promise<void>
  onDelete?: (zoneId: string) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  className?: string
}

const ZONE_COLORS = [
  { name: "Синий", value: "#3B82F6" },
  { name: "Зеленый", value: "#10B981" },
  { name: "Красный", value: "#EF4444" },
  { name: "Фиолетовый", value: "#8B5CF6" },
  { name: "Оранжевый", value: "#F97316" },
  { name: "Розовый", value: "#EC4899" },
  { name: "Бирюзовый", value: "#14B8A6" },
  { name: "Желтый", value: "#F59E0B" },
]

export default function ZoneEditorForm({
  zone,
  entityId,
  entityType = "restaurant",
  allowedZoneTypes = ["circle", "polygon"],
  onSave,
  onDelete,
  onCancel,
  isLoading = false,
  className = "",
}: ZoneEditorFormProps) {
  const initialZoneType = zone?.zone_type || allowedZoneTypes[0] || "polygon"
  const [formData, setFormData] = useState({
    name: zone?.name || "",
    description: zone?.description || "",
    delivery_fee: zone?.delivery_fee?.toString() || "0",
    color: zone?.color || "#3B82F6",
    zone_type: initialZoneType,
    is_active: zone?.is_active ?? true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Название зоны обязательно"
    }

    const fee = Number.parseFloat(formData.delivery_fee)
    if (isNaN(fee) || fee < 0) {
      newErrors.delivery_fee = "Стоимость доставки должна быть корректным числом"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    const zoneData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      delivery_fee: Number.parseFloat(formData.delivery_fee),
      color: formData.color,
      zone_type: formData.zone_type,
      is_active: formData.is_active,
    }

    if (zone) {
      // Update existing zone
      await onSave({ ...zoneData, id: zone.id })
    } else {
      // Create new zone - geometry will be added by parent component
      await onSave({
        ...zoneData,
        ...(entityType === "supermarket" ? { supermarketId: entityId } : { restaurantId: entityId }),
      } as CreateDeliveryZoneRequest)
    }
  }

  const handleDelete = async () => {
    if (zone && onDelete && window.confirm("Удалить эту зону доставки?")) {
      await onDelete(zone.id)
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{zone ? "Редактировать зону" : "Добавить новую зону"}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {zone && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {zone.zone_type === "circle" ? "Круг" : "Полигон"}
            </Badge>
            <Badge variant={zone.is_active ? "default" : "secondary"} className="text-xs">
              {zone.is_active ? "Активна" : "Отключена"}
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Zone Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Название зоны *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Введите название зоны"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Необязательное описание"
              rows={2}
            />
          </div>

          {/* Delivery Fee */}
          <div className="space-y-2">
            <Label htmlFor="delivery_fee">Стоимость доставки (EGP) *</Label>
            <Input
              id="delivery_fee"
              type="number"
              step="0.01"
              min="0"
              value={formData.delivery_fee}
              onChange={(e) => setFormData((prev) => ({ ...prev, delivery_fee: e.target.value }))}
              placeholder="0.00"
              className={errors.delivery_fee ? "border-red-500" : ""}
            />
            {errors.delivery_fee && <p className="text-sm text-red-500">{errors.delivery_fee}</p>}
          </div>

          {/* Zone Type */}
          {allowedZoneTypes.length > 1 ? (
            <div className="space-y-2">
              <Label>Тип зоны</Label>
              <Select
                value={formData.zone_type}
                onValueChange={(value: "circle" | "polygon") =>
                  setFormData((prev) => ({ ...prev, zone_type: value }))
                }
                disabled={!!zone} // Can't change type of existing zone
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allowedZoneTypes.includes("circle") && <SelectItem value="circle">Круг</SelectItem>}
                  {allowedZoneTypes.includes("polygon") && <SelectItem value="polygon">Произвольный полигон</SelectItem>}
                </SelectContent>
              </Select>
              {zone && (
                <p className="text-xs text-muted-foreground">Тип зоны нельзя изменить после создания</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Тип зоны</Label>
              <div className="rounded-lg border px-3 py-2 text-sm text-muted-foreground">
                {formData.zone_type === "polygon" ? "Произвольный полигон" : "Круг"}
              </div>
            </div>
          )}

          {/* Color */}
          <div className="space-y-2">
            <Label>Цвет зоны</Label>
            <div className="flex flex-wrap gap-2">
              {ZONE_COLORS.map((colorOption) => (
                <button
                  key={colorOption.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, color: colorOption.value }))}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === colorOption.value
                      ? "border-foreground scale-110"
                      : "border-muted-foreground/30 hover:border-muted-foreground"
                  }`}
                  style={{ backgroundColor: colorOption.value }}
                  title={colorOption.name}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: formData.color }} />
              <span className="text-sm text-muted-foreground">{formData.color}</span>
            </div>
          </div>

          {/* Active Status */}
          {zone && (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Статус зоны</Label>
                <p className="text-sm text-muted-foreground">Отключенные зоны не используются для доставки</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              {zone && onDelete && (
                <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={isLoading}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Удалить зону
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Отмена
              </Button>
              <Button type="submit" disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Сохранение..." : zone ? "Обновить зону" : "Создать зону"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
