"use client";

import { useEffect, useMemo, useState } from "react";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { GripVertical, Pencil, Plus, PlusCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";

import { uploadImageFile } from "@/lib/upload-image";

import type {
  CatalogRow,
  CatalogSection,
  CategoryNode,
  EditForm,
  MerchantOption,
  SectionItem,
  StatusKey,
} from "./retail-catalog-types";
import { RetailAddProductDialog } from "./retail-add-product-dialog";
import { RetailCatalogHeader } from "./retail-catalog-header";
import { RetailCategoriesTree } from "./retail-categories-tree";
import { RetailProductEditorPanel } from "./retail-product-editor-panel";
import { RetailProductsTable } from "./retail-products-table";

type GlobalProductOption = {
  id: string;
  name: { ar?: string; en?: string };
  slug: string;
  category?: string;
  unit?: string;
  images?: { url: string }[];
};

type RetailCatalogManagerProps = {
  supermarket: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
  };
  catalogId?: string | null;
  rows: CatalogRow[];
  merchantOptions: MerchantOption[];
  categoriesTree: CategoryNode[];
  layout?: "default" | "split";
};

const formatCurrency = (value?: number | null) => {
  if (typeof value !== "number") return "-";
  const formatted = new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(value);
  return `${formatted} ج.م`;
};

const displayGlobalName = (value?: { ar?: string; en?: string } | null) =>
  value?.ar || value?.en || "";

const statusStyles: Record<StatusKey, string> = {
  published: "bg-emerald-50 text-emerald-600 border-emerald-100",
  draft: "bg-slate-100 text-slate-500 border-slate-200",
  inactive: "bg-rose-50 text-rose-600 border-rose-100",
  stockout: "bg-amber-50 text-amber-600 border-amber-100",
};

const sortNodes = (nodes: CategoryNode[]) =>
  nodes.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

const collectSectionItems = (node: CategoryNode, depth = 0, acc: SectionItem[] = []) => {
  const prefix = depth > 0 ? `${"--".repeat(depth)} ` : "";
  acc.push({ id: node.id, title: `${prefix}${node.name}`.trim() });
  const children = node.subCategories || [];
  sortNodes(children).forEach((child) => collectSectionItems(child, depth + 1, acc));
  return acc;
};

const buildSectionsFromTree = (tree: CategoryNode[]): CatalogSection[] =>
  sortNodes(tree).map((node) => ({
    id: node.id,
    title: node.name,
    items: collectSectionItems(node),
  }));

const flattenNodes = (nodes: CategoryNode[], level = 0, acc: Array<{ id: string; name: string; level: number }> = []) => {
  sortNodes(nodes).forEach((node) => {
    acc.push({ id: node.id, name: node.name, level });
    if (node.subCategories?.length) {
      flattenNodes(node.subCategories, level + 1, acc);
    }
  });
  return acc;
};

const normalizeTree = (nodes: CategoryNode[]): CategoryNode[] =>
  nodes.map((node, index) => ({
    ...node,
    order: index + 1,
    subCategories: normalizeTree(node.subCategories || []),
  }));

const updateNodeById = (
  nodes: CategoryNode[],
  nodeId: string,
  updater: (node: CategoryNode) => CategoryNode
): CategoryNode[] =>
  nodes.map((node) => {
    if (node.id === nodeId) return updater(node);
    if (node.subCategories?.length) {
      const updated = updateNodeById(node.subCategories, nodeId, updater);
      if (updated !== node.subCategories) {
        return { ...node, subCategories: updated };
      }
    }
    return node;
  });

const findNodeById = (nodes: CategoryNode[], nodeId: string): CategoryNode | null => {
  for (const node of nodes) {
    if (node.id === nodeId) return node;
    if (node.subCategories?.length) {
      const found = findNodeById(node.subCategories, nodeId);
      if (found) return found;
    }
  }
  return null;
};

const removeNodeById = (nodes: CategoryNode[], nodeId: string): CategoryNode[] =>
  nodes
    .filter((node) => node.id !== nodeId)
    .map((node) => ({
      ...node,
      subCategories: node.subCategories?.length ? removeNodeById(node.subCategories, nodeId) : [],
    }));

const updateListAtDroppable = (
  nodes: CategoryNode[],
  droppableId: string,
  updater: (list: CategoryNode[]) => CategoryNode[]
): CategoryNode[] => {
  if (droppableId === "root") {
    return updater(nodes);
  }
  const targetId = droppableId.replace("children:", "");
  return nodes.map((node) => {
    if (node.id === targetId) {
      return { ...node, subCategories: updater(node.subCategories || []) };
    }
    if (node.subCategories?.length) {
      const updated = updateListAtDroppable(node.subCategories, droppableId, updater);
      if (updated !== node.subCategories) {
        return { ...node, subCategories: updated };
      }
    }
    return node;
  });
};

export default function RetailCatalogManager({
  supermarket,
  catalogId,
  rows: initialRows,
  merchantOptions: initialMerchants,
  categoriesTree,
  layout = "default",
}: RetailCatalogManagerProps) {
  const { toast } = useToast();
  const initialSections = buildSectionsFromTree(categoriesTree || []);
  const initialCategoryNodes = flattenNodes(categoriesTree || []);
  const [rows, setRows] = useState<CatalogRow[]>(initialRows);
  const [merchants, setMerchants] = useState<MerchantOption[]>(initialMerchants);
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [catalogIdState, setCatalogIdState] = useState<string | null>(catalogId || null);
  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>(categoriesTree || []);
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionImage, setNewSectionImage] = useState("");
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingNodeName, setEditingNodeName] = useState("");
  const [editingNodeSlug, setEditingNodeSlug] = useState("");
  const [editingNodeImage, setEditingNodeImage] = useState("");
  const [addingParentId, setAddingParentId] = useState<string | null>(null);
  const [newChildName, setNewChildName] = useState("");
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  const [isSavingCategories, setIsSavingCategories] = useState(false);
  const [editingRow, setEditingRow] = useState<CatalogRow | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: "",
    category: "",
    size: "",
    stock: "",
    price: "",
    supplierName: "",
    supplierLocation: "",
    status: "published",
  });
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editImageInput, setEditImageInput] = useState("");
  const [isUploadingNewImage, setIsUploadingNewImage] = useState(false);
  const [isUploadingEditImage, setIsUploadingEditImage] = useState(false);
  const [page, setPage] = useState(1);
  const [isDesktop, setIsDesktop] = useState(false);
  const pageSize = 10;

  const sectionsState = useMemo(() => buildSectionsFromTree(categoryTree), [categoryTree]);
  const categoryNodesState = useMemo(() => flattenNodes(categoryTree), [categoryTree]);

  const [addState, setAddState] = useState(() => {
    const firstSection = initialSections[0];
    const firstItem = firstSection?.items[0];
    const firstNode = initialCategoryNodes[0];
    return {
      merchantProductId: initialMerchants[0]?.id || "",
      sectionId: firstSection?.id || "",
      itemId: firstItem?.id || "",
      nodeId: firstNode?.id || firstItem?.id || "",
    };
  });
  const [productQuery, setProductQuery] = useState("");
  const [globalResults, setGlobalResults] = useState<GlobalProductOption[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [selectedGlobal, setSelectedGlobal] = useState<GlobalProductOption | null>(null);
  const [createNewName, setCreateNewName] = useState<string | null>(null);
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductImages, setNewProductImages] = useState<string[]>([]);
  const [newProductImageInput, setNewProductImageInput] = useState("");

  const sectionsMap = useMemo(() => {
    return new Map(sectionsState.map((section) => [section.id, section]));
  }, [sectionsState]);

  const itemMap = useMemo(() => {
    const map = new Map<string, SectionItem>();
    sectionsState.forEach((section) => {
      section.items.forEach((item) => {
        map.set(`${section.id}::${item.id}`, item);
      });
    });
    return map;
  }, [sectionsState]);

  const nodeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    rows.forEach((row) => {
      const id = row.nodeId || row.itemId;
      if (!id) return;
      counts.set(id, (counts.get(id) || 0) + 1);
    });
    return counts;
  }, [rows]);

  const productsByNode = useMemo(() => {
    const map = new Map<string, CatalogRow[]>();
    rows.forEach((row) => {
      const id = row.nodeId || row.itemId;
      if (!id) return;
      const list = map.get(id) || [];
      list.push(row);
      map.set(id, list);
    });
    map.forEach((list, key) => {
      map.set(
        key,
        list.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      );
    });
    return map;
  }, [rows]);

  const nodeSectionMap = useMemo(() => {
    const map = new Map<string, string>();
    sectionsState.forEach((section) => {
      map.set(section.id, section.id);
      section.items.forEach((item) => map.set(item.id, section.id));
    });
    return map;
  }, [sectionsState]);

  useEffect(() => {
    setCatalogIdState(catalogId || null);
  }, [catalogId]);

  useEffect(() => {
    if (!categoriesTree?.length) return;
    setCategoryTree(categoriesTree);
  }, [categoriesTree]);

  useEffect(() => {
    if (!sectionsState.length) {
      setAddState((prev) => ({ ...prev, sectionId: "", itemId: "", nodeId: prev.nodeId || "" }));
      return;
    }
    setAddState((prev) => {
      const section =
        sectionsState.find((item) => item.id === prev.sectionId) || sectionsState[0];
      const item =
        section?.items.find((entry) => entry.id === prev.itemId) || section?.items[0];
      const nodeExists = categoryNodesState.some((node) => node.id === prev.nodeId);
      const matchedNode = item
        ? categoryNodesState.find((node) => node.id === item.id)
        : undefined;
      const nodeId =
        matchedNode?.id || (nodeExists ? prev.nodeId : categoryNodesState[0]?.id || item?.id || "");
      return {
        ...prev,
        sectionId: section?.id || "",
        itemId: item?.id || "",
        nodeId,
      };
    });
  }, [sectionsState, categoryNodesState]);

  useEffect(() => {
    if (categoryFilter === "all") return;
    if (!sectionsState.some((section) => section.id === categoryFilter)) {
      setCategoryFilter("all");
    }
  }, [categoryFilter, sectionsState]);

  useEffect(() => {
    if (!isAddOpen) return;
    setProductQuery("");
    setSelectedGlobal(null);
    setCreateNewName(null);
    setNewProductPrice("");
    setNewProductImages([]);
    setNewProductImageInput("");
  }, [isAddOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = window.matchMedia("(min-width: 1024px)");
    const handleChange = () => setIsDesktop(query.matches);
    handleChange();
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const queryValue = productQuery.trim();
    if (queryValue.length < 2) {
      setGlobalResults([]);
      setGlobalLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setGlobalLoading(true);
      try {
        const res = await fetch(
          `/api/retail/global-products?q=${encodeURIComponent(queryValue)}&limit=8`,
          { signal: controller.signal }
        );
        const data = await res.json().catch(() => ({}));
        const items = data?.data?.items || data?.items || [];
        setGlobalResults(items);
      } catch {
        setGlobalResults([]);
      } finally {
        setGlobalLoading(false);
      }
    }, 350);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [productQuery]);

  const currentSection = sectionsMap.get(addState.sectionId);
  const currentItems = currentSection?.items || [];
  const nodeOptions = categoryNodesState;
  const nodeLabel = (node: { name: string; level: number }) =>
    `${"--".repeat(node.level)} ${node.name}`.trim();

  const filteredMerchants = useMemo(() => {
    const needle = productQuery.trim().toLowerCase();
    if (!needle) return merchants.slice(0, 6);
    return merchants.filter((item) => item.name.toLowerCase().includes(needle)).slice(0, 6);
  }, [productQuery, merchants]);

  const handleAddChange = (key: keyof typeof addState, value: string) => {
    setAddState((prev) => {
      if (key === "sectionId") {
        const nextSection = sectionsMap.get(value);
        const nextItem = nextSection?.items[0];
        const matchedNode = nextItem
          ? categoryNodesState.find((node) => node.id === nextItem.id)
          : undefined;
        const fallbackNode =
          categoryNodesState.find((node) => node.id === prev.nodeId) || categoryNodesState[0];
        return {
          ...prev,
          sectionId: value,
          itemId: nextItem?.id || "",
          nodeId: matchedNode?.id || fallbackNode?.id || nextItem?.id || "",
        };
      }
      if (key === "itemId") {
        const matchedNode = categoryNodesState.find((node) => node.id === value);
        const fallbackNode =
          categoryNodesState.find((node) => node.id === prev.nodeId) || categoryNodesState[0];
        return {
          ...prev,
          itemId: value,
          nodeId: matchedNode?.id || fallbackNode?.id || value,
        };
      }
      return { ...prev, [key]: value };
    });
  };

  const rowMeta = useMemo(() => {
    const map = new Map<string, { sectionTitle: string; itemTitle: string }>();
    rows.forEach((row) => {
      const sectionTitle = sectionsMap.get(row.sectionId)?.title || "";
      const itemTitle = itemMap.get(`${row.sectionId}::${row.itemId}`)?.title || "";
      map.set(row.id, { sectionTitle, itemTitle });
    });
    return map;
  }, [rows, sectionsMap, itemMap]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== "all") {
        const desired = statusFilter === "active";
        if (row.catalogActive !== desired) return false;
      }
      if (categoryFilter !== "all" && row.sectionId !== categoryFilter) return false;
      if (!normalizedQuery) return true;
      const meta = rowMeta.get(row.id);
      const haystack = [row.name, meta?.sectionTitle, meta?.itemTitle, row.merchantProductId]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [rows, statusFilter, categoryFilter, query, rowMeta]);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pagedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  const setSaving = (id: string, value: boolean) => {
    setSavingMap((prev) => ({ ...prev, [id]: value }));
  };

  const updateRowsByMerchant = (merchantProductId: string, updates: Partial<CatalogRow>) => {
    setRows((prev) =>
      prev.map((row) => (row.merchantProductId === merchantProductId ? { ...row, ...updates } : row))
    );
  };

  const updateRowByCatalogId = (catalogProductId: string, updates: Partial<CatalogRow>) => {
    setRows((prev) => prev.map((row) => (row.id === catalogProductId ? { ...row, ...updates } : row)));
  };

  const updateMerchantMeta = (merchantProductId: string, updates: Partial<MerchantOption>) => {
    setMerchants((prev) =>
      prev.map((item) => (item.id === merchantProductId ? { ...item, ...updates } : item))
    );
  };

  const removeFromCatalog = async (row: CatalogRow) => {
    setSaving(row.id, true);
    setError(null);
    try {
      const res = await fetch(`/api/retail/catalog-products/${row.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "تعذر حذف الربط");
      }
      setRows((prev) => prev.filter((item) => item.id !== row.id));
    } catch (err: any) {
      setError(err?.message || "حدث خطأ غير متوقع");
    } finally {
      setSaving(row.id, false);
    }
  };

  const getStatusKey = (row: CatalogRow): StatusKey => {
    if (!row.catalogActive) return "inactive";
    if (!row.productActive) return "draft";
    if (!row.available) return "stockout";
    return "published";
  };

  const openEdit = (row: CatalogRow) => {
    const meta = rowMeta.get(row.id);
    handleCancelEditNode();
    setEditForm({
      name: row.name,
      category: meta?.sectionTitle || meta?.itemTitle || "",
      size: "",
      stock: typeof row.stock === "number" ? String(row.stock) : "",
      price: typeof row.price === "number" ? String(row.price) : "",
      supplierName: "",
      supplierLocation: "",
      status: getStatusKey(row),
    });
    setEditImages(row.image ? [row.image] : []);
    setEditingRow(row);
  };

  const handleEditChange = <K extends keyof EditForm>(key: K, value: EditForm[K]) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleEditSave = async () => {
    if (!editingRow) return;
    setSaving(editingRow.id, true);
    setError(null);
    try {
      const desired =
        editForm.status === "published"
          ? { available: true, productActive: true, catalogActive: true }
          : editForm.status === "draft"
          ? { productActive: false, catalogActive: true }
          : editForm.status === "stockout"
          ? { available: false, productActive: true, catalogActive: true }
          : { catalogActive: false };

      const update: Record<string, unknown> = {};
      const priceValue = editForm.price ? Number(editForm.price) : null;
      const stockValue = editForm.stock ? Number(editForm.stock) : null;
      if (typeof priceValue === "number" && Number.isFinite(priceValue)) update.price = priceValue;
      if (typeof stockValue === "number" && Number.isFinite(stockValue)) update.stock = stockValue;
      if (typeof desired.available === "boolean") update.available = desired.available;
      if (typeof desired.productActive === "boolean") update.isActive = desired.productActive;
      if (editForm.name) update.customName = editForm.name;
      update.customImages = editImages;

      if (Object.keys(update).length) {
        const res = await fetch(`/api/retail/merchant-products/${editingRow.merchantProductId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(update),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || "تعذر حفظ التعديلات");
        }
        updateRowsByMerchant(editingRow.merchantProductId, {
          available: typeof update.available === "boolean" ? update.available : editingRow.available,
          productActive: typeof update.isActive === "boolean" ? update.isActive : editingRow.productActive,
          price: typeof update.price === "number" ? update.price : editingRow.price,
          stock: typeof update.stock === "number" ? update.stock : editingRow.stock,
          name: editForm.name || editingRow.name,
          image: editImages[0] || editingRow.image,
        });
        updateMerchantMeta(editingRow.merchantProductId, {
          available:
            typeof update.available === "boolean" ? update.available : editingRow.available,
          isActive:
            typeof update.isActive === "boolean" ? update.isActive : editingRow.productActive,
          price: typeof update.price === "number" ? update.price : editingRow.price,
          stock: typeof update.stock === "number" ? update.stock : editingRow.stock,
          name: editForm.name || editingRow.name,
          image: editImages[0] || editingRow.image,
        });
      }

      if (
        typeof desired.catalogActive === "boolean" &&
        desired.catalogActive !== editingRow.catalogActive
      ) {
        const res = await fetch(`/api/retail/catalog-products/${editingRow.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: desired.catalogActive }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || "تعذر تحديث حالة الكتالوج");
        }
        updateRowByCatalogId(editingRow.id, { catalogActive: desired.catalogActive });
      }

      setEditingRow(null);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ غير متوقع");
    } finally {
      setSaving(editingRow.id, false);
    }
  };

  const handleReplaceImage = () => {
    const nextUrl = window.prompt("ادخل رابط الصورة الجديدة");
    if (!nextUrl) return;
    const trimmed = nextUrl.trim();
    if (!trimmed) return;
    setEditImages([trimmed]);
  };

  const handleRemoveImage = () => {
    setEditImages([]);
  };

  const handleAddEditImage = () => {
    const nextUrl = editImageInput.trim();
    if (!nextUrl) return;
    setEditImages((prev) => Array.from(new Set([...prev, nextUrl])));
    setEditImageInput("");
  };

  const handleRemoveEditImageAt = (index: number) => {
    setEditImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUploadNewProductImage = async (file: File) => {
    if (isUploadingNewImage) return;
    setIsUploadingNewImage(true);
    setError(null);
    try {
      const url = await uploadImageFile(file, { subdomain: supermarket.slug });
      setNewProductImages((prev) => Array.from(new Set([...prev, url])));
    } catch (err: any) {
      setError(err?.message || "تعذر رفع الصورة");
    } finally {
      setIsUploadingNewImage(false);
    }
  };

  const handleUploadEditImage = async (file: File) => {
    if (isUploadingEditImage) return;
    setIsUploadingEditImage(true);
    setError(null);
    try {
      const url = await uploadImageFile(file, { subdomain: supermarket.slug });
      setEditImages((prev) => Array.from(new Set([...prev, url])));
    } catch (err: any) {
      setError(err?.message || "تعذر رفع الصورة");
    } finally {
      setIsUploadingEditImage(false);
    }
  };

  const applyStatus = async (row: CatalogRow, status: StatusKey) => {
    setSaving(row.id, true);
    setError(null);
    try {
      const desired =
        status === "published"
          ? { available: true, productActive: true, catalogActive: true }
          : status === "draft"
          ? { productActive: false, catalogActive: true }
          : status === "stockout"
          ? { available: false, productActive: true, catalogActive: true }
          : { catalogActive: false };

      const merchantUpdate: Record<string, boolean> = {};
      if (typeof desired.available === "boolean" && desired.available !== row.available) {
        merchantUpdate.available = desired.available;
      }
      if (typeof desired.productActive === "boolean" && desired.productActive !== row.productActive) {
        merchantUpdate.isActive = desired.productActive;
      }

      if (Object.keys(merchantUpdate).length) {
        const res = await fetch(`/api/retail/merchant-products/${row.merchantProductId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(merchantUpdate),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || "تعذر تحديث حالة المنتج");
        }
        updateRowsByMerchant(row.merchantProductId, {
          available: merchantUpdate.available ?? row.available,
          productActive: merchantUpdate.isActive ?? row.productActive,
        });
        updateMerchantMeta(row.merchantProductId, {
          available: merchantUpdate.available ?? row.available,
          isActive: merchantUpdate.isActive ?? row.productActive,
        });
      }

      if (
        typeof desired.catalogActive === "boolean" &&
        desired.catalogActive !== row.catalogActive
      ) {
        const res = await fetch(`/api/retail/catalog-products/${row.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: desired.catalogActive }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || "تعذر تحديث حالة الكتالوج");
        }
        updateRowByCatalogId(row.id, { catalogActive: desired.catalogActive });
      }
    } catch (err: any) {
      setError(err?.message || "حدث خطأ غير متوقع");
    } finally {
      setSaving(row.id, false);
    }
  };

  const handleAddToCatalog = async () => {
    if (!catalogIdState) {
      setError("لا يوجد كتالوج مرتبط بهذا السوبرماركت.");
      return;
    }
    if (!addState.sectionId || !addState.itemId) {
      setError("يرجى اختيار القسم والعنصر.");
      return;
    }
    setSaving("add", true);
    setError(null);
    try {
      let merchantProductId = addState.merchantProductId;
      let merchantMeta = merchants.find((item) => item.id === merchantProductId);

      if (!merchantProductId) {
        const nameValue =
          createNewName?.trim() || displayGlobalName(selectedGlobal?.name) || productQuery.trim();
        if (!selectedGlobal && !nameValue) {
          throw new Error("يرجى كتابة اسم المنتج أو اختياره من القائمة.");
        }

        const categoryTitle = sectionsMap.get(addState.sectionId)?.title || "عام";
        let globalProduct = selectedGlobal;

        if (!globalProduct) {
          const createRes = await fetch("/api/retail/global-products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: nameValue,
              category: categoryTitle,
              unit: "piece",
              images: newProductImages.map((url) => ({ url })),
            }),
          });
          const createdData = await createRes.json().catch(() => ({}));
          if (!createRes.ok) {
            throw new Error(createdData?.error || "تعذر إنشاء المنتج.");
          }
          globalProduct = createdData?.item || createdData?.data?.item || null;
        }

        if (globalProduct?.id && !merchantProductId) {
          const existingMerchant = merchants.find(
            (item) => item.globalProductId === globalProduct?.id
          );
          if (existingMerchant) {
            merchantProductId = existingMerchant.id;
            merchantMeta = existingMerchant;
          }
        }

        if (merchantProductId) {
          setAddState((prev) => ({ ...prev, merchantProductId: String(merchantProductId) }));
        }

        if (merchantProductId) {
          const targetNodeId = addState.nodeId || addState.itemId;
          const nextOrder = (productsByNode.get(targetNodeId)?.length || 0) + 1;
          const res = await fetch("/api/retail/catalog-products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              supermarketId: supermarket.id,
              catalogId: catalogIdState,
              sectionId: addState.sectionId,
              itemId: addState.itemId,
              nodeId: targetNodeId,
              order: nextOrder,
              merchantProductId,
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(data?.error || "تعذر إضافة المنتج للكتالوج");
          }
          const merchant = merchantMeta || merchants.find((item) => item.id === merchantProductId);
          const catalogIdValue =
            data?.item?._id?.toString?.() || data?.item?._id || data?._id || String(Date.now());
          setRows((prev) => [
            {
              id: String(catalogIdValue),
              merchantProductId: String(merchantProductId),
              sectionId: addState.sectionId,
              itemId: addState.itemId,
              nodeId: targetNodeId,
              order: nextOrder,
              name: merchant?.name || nameValue || "منتج",
              price: merchant?.price ?? null,
              available: merchant?.available ?? true,
              productActive: merchant?.isActive ?? true,
              catalogActive: true,
              stock: merchant?.stock ?? null,
              image: merchant?.image,
            },
            ...prev,
          ]);
          setSelectedGlobal(null);
          setCreateNewName(null);
          setProductQuery("");
          setNewProductPrice("");
          setNewProductImages([]);
          setNewProductImageInput("");
          return;
        }

        const priceValue = newProductPrice ? Number(newProductPrice) : 0;
        if (!Number.isFinite(priceValue) || priceValue < 0) {
          throw new Error("يرجى إدخال سعر صالح.");
        }

        const merchantRes = await fetch("/api/retail/merchant-products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            merchantId: supermarket.id,
            globalProductId: globalProduct?.id,
            price: priceValue,
            customImages: newProductImages.map((url) => ({ url })),
          }),
        });
        const merchantData = await merchantRes.json().catch(() => ({}));
        if (!merchantRes.ok) {
          throw new Error(merchantData?.error || "تعذر إنشاء المنتج داخل السوبرماركت.");
        }
        merchantProductId = merchantData?.item?._id?.toString?.() || merchantData?.item?._id;
        if (!merchantProductId) {
          throw new Error("تعذر الحصول على معرّف المنتج.");
        }

        merchantMeta = {
          id: String(merchantProductId),
          name: displayGlobalName(globalProduct?.name) || nameValue,
          price: priceValue,
          image: newProductImages[0] || globalProduct?.images?.[0]?.url,
          available: true,
          isActive: true,
          stock: merchantData?.item?.stock ?? null,
        };

        setMerchants((prev) => {
          const exists = prev.some((item) => item.id === merchantMeta?.id);
          return exists || !merchantMeta ? prev : [merchantMeta, ...prev];
        });

        setAddState((prev) => ({ ...prev, merchantProductId: String(merchantProductId) }));
      }

      const targetNodeId = addState.nodeId || addState.itemId;
      const nextOrder = (productsByNode.get(targetNodeId)?.length || 0) + 1;
      const res = await fetch("/api/retail/catalog-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supermarketId: supermarket.id,
          catalogId: catalogIdState,
          sectionId: addState.sectionId,
          itemId: addState.itemId,
          nodeId: targetNodeId,
          order: nextOrder,
          merchantProductId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "تعذر إضافة المنتج للكتالوج");
      }
      const merchant = merchantMeta || merchants.find((item) => item.id === merchantProductId);
      const catalogIdValue =
        data?.item?._id?.toString?.() || data?.item?._id || data?._id || String(Date.now());
      setRows((prev) => [
        {
          id: String(catalogIdValue),
          merchantProductId: String(merchantProductId),
          sectionId: addState.sectionId,
          itemId: addState.itemId,
          nodeId: targetNodeId,
          order: nextOrder,
          name: merchant?.name || "منتج",
          price: merchant?.price ?? null,
          available: merchant?.available ?? true,
          productActive: merchant?.isActive ?? true,
          catalogActive: true,
          stock: merchant?.stock ?? null,
          image: merchant?.image,
        },
        ...prev,
      ]);
      setSelectedGlobal(null);
      setCreateNewName(null);
      setProductQuery("");
      setNewProductPrice("");
      setNewProductImages([]);
      setNewProductImageInput("");
    } catch (err: any) {
      setError(err?.message || "حدث خطأ غير متوقع");
    } finally {
      setSaving("add", false);
    }
  };

  const normalizeSlug = (value: string) => value.trim().replace(/\s+/g, "-");

  const persistCategories = async (
    nextTree: CategoryNode[],
    options?: { previousTree?: CategoryNode[]; toastTitle?: string }
  ) => {
    setIsSavingCategories(true);
    setError(null);
    try {
      const normalizedTree = normalizeTree(nextTree);
      const res = await fetch(`/api/retail/supermarkets/${supermarket.id}/categories`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: normalizedTree }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "تعذر حفظ الأقسام");
      }
      setCategoryTree(normalizedTree);
      const nextId = data?.item?._id?.toString?.() || data?.item?._id || data?._id;
      if (nextId) setCatalogIdState(String(nextId));
      toast({
        title: options?.toastTitle || "تم حفظ التعديلات",
        description: "تم تحديث أقسام الكتالوج.",
        action: options?.previousTree ? (
          <ToastAction
            altText="تراجع"
            onClick={() => {
              persistCategories(options.previousTree || [], { toastTitle: "تم التراجع" });
            }}
          >
            تراجع
          </ToastAction>
        ) : undefined,
      });
    } catch (err: any) {
      setError(err?.message || "حدث خطأ غير متوقع");
    } finally {
      setIsSavingCategories(false);
    }
  };

  const handleAddSection = async () => {
    const name = newSectionName.trim();
    if (!name) {
      setError("يرجى كتابة اسم القسم.");
      return;
    }
    const previousTree = categoryTree;
    const now = Date.now();
    const slug = normalizeSlug(name) || `section-${now}`;
    const nextOrder =
      Math.max(0, ...categoryTree.map((item) => item.order ?? 0)) + 1;
    const nextTree = [
      ...categoryTree,
      {
        id: `cat-${now}`,
        name,
        slug,
        imageUrl: newSectionImage.trim() || null,
        order: nextOrder,
        isActive: true,
        subCategories: [],
      },
    ];
    await persistCategories(nextTree, { previousTree, toastTitle: "تمت إضافة قسم" });
    setNewSectionName("");
    setNewSectionImage("");
  };

  const handleAddChild = async (parentId: string, childName: string) => {
    const name = childName.trim();
    if (!name) {
      setError("يرجى كتابة اسم القسم الفرعي.");
      return;
    }
    const previousTree = categoryTree;
    const now = Date.now();
    const slug = normalizeSlug(name) || `child-${now}`;
    const nextTree = updateNodeById(categoryTree, parentId, (node) => ({
      ...node,
      subCategories: [
        ...(node.subCategories || []),
        {
          id: `cat-${now}`,
          name,
          slug,
          order: (node.subCategories?.length || 0) + 1,
          isActive: true,
          subCategories: [],
        },
      ],
    }));
    await persistCategories(nextTree, { previousTree, toastTitle: "تمت إضافة قسم فرعي" });
    setAddingParentId(null);
    setNewChildName("");
  };

  const handleToggleNode = async (nodeId: string, isActive: boolean) => {
    const previousTree = categoryTree;
    const nextTree = updateNodeById(categoryTree, nodeId, (node) => ({
      ...node,
      isActive,
    }));
    await persistCategories(nextTree, { previousTree, toastTitle: "تم تحديث حالة القسم" });
  };

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    if (result.type === "product") {
      const sourceNodeId = source.droppableId.replace("products:", "");
      const destNodeId = destination.droppableId.replace("products:", "");
      const sourceList = productsByNode.get(sourceNodeId) || [];
      const destList = productsByNode.get(destNodeId) || [];
      const movedId = result.draggableId.replace("product:", "");
      const movedItem = sourceList.find((row) => row.id === movedId);
      if (!movedItem) return;

      const previousRows = rows;
      const nextSource = sourceList.filter((row) => row.id !== movedItem.id);
      let nextDest = destList.slice();

      if (sourceNodeId === destNodeId) {
        nextSource.splice(destination.index, 0, movedItem);
        nextDest = nextSource;
      } else {
        nextDest = destList.filter((row) => row.id !== movedItem.id);
        nextDest.splice(destination.index, 0, movedItem);
      }

      const updates = new Map<string, Partial<CatalogRow>>();
      const applyUpdate = (row: CatalogRow, nodeId: string, order: number) => {
        const sectionId = nodeSectionMap.get(nodeId) || row.sectionId;
        updates.set(row.id, {
          order,
          nodeId,
          itemId: nodeId,
          sectionId,
        });
      };

      nextSource.forEach((row, index) => {
        applyUpdate(row, sourceNodeId, index + 1);
      });
      nextDest.forEach((row, index) => {
        applyUpdate(row, destNodeId, index + 1);
      });

      const nextRows = rows.map((row) => {
        const update = updates.get(row.id);
        if (!update) return row;
        return { ...row, ...update };
      });

      setRows(nextRows);
      setError(null);

      try {
        const responses = await Promise.all(
          Array.from(updates.entries()).map(([id, update]) => {
            const nodeId = update.nodeId || sourceNodeId;
            const sectionId = update.sectionId || nodeSectionMap.get(nodeId) || "";
            return fetch(`/api/retail/catalog-products/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                order: update.order,
                nodeId,
                itemId: nodeId,
                sectionId,
              }),
            });
          })
        );
        const failed = responses.find((res) => !res.ok);
        if (failed) {
          throw new Error("تعذر تحديث ترتيب المنتجات");
        }
      } catch (err: any) {
        setRows(previousRows);
        setError(err?.message || "تعذر تحديث ترتيب المنتجات");
      }
      return;
    }

    if (source.droppableId === destination.droppableId) {
      const previousTree = categoryTree;
      const nextTree = updateListAtDroppable(categoryTree, source.droppableId, (list) => {
        const next = list.slice();
        const [moved] = next.splice(source.index, 1);
        next.splice(destination.index, 0, moved);
        return normalizeTree(next);
      });
      await persistCategories(nextTree, { previousTree, toastTitle: "تم تحديث الترتيب" });
      return;
    }

    let movedNode: CategoryNode | null = null;
    const afterRemoval = updateListAtDroppable(categoryTree, source.droppableId, (list) => {
      const next = list.slice();
      movedNode = next.splice(source.index, 1)[0];
      return normalizeTree(next);
    });

    if (!movedNode) return;
    const previousTree = categoryTree;
    const afterInsert = updateListAtDroppable(afterRemoval, destination.droppableId, (list) => {
      const next = list.slice();
      next.splice(destination.index, 0, movedNode as CategoryNode);
      return normalizeTree(next);
    });
    await persistCategories(afterInsert, { previousTree, toastTitle: "تم نقل القسم" });
  };

  const handleStartEditNode = (node: CategoryNode) => {
    setEditingRow(null);
    setEditingNodeId(node.id);
    setEditingNodeName(node.name);
    setEditingNodeSlug(node.slug || normalizeSlug(node.name));
    setEditingNodeImage(node.imageUrl || "");
  };

  const handleCancelEditNode = () => {
    setEditingNodeId(null);
    setEditingNodeName("");
    setEditingNodeSlug("");
    setEditingNodeImage("");
  };

  const handleSaveNode = async (nodeId: string) => {
    const name = editingNodeName.trim();
    if (!name) {
      setError("يرجى كتابة اسم القسم.");
      return;
    }
    const previousTree = categoryTree;
    const nextTree = updateNodeById(categoryTree, nodeId, (node) => ({
      ...node,
      name,
      slug:
        normalizeSlug(editingNodeSlug) ||
        normalizeSlug(name) ||
        node.slug ||
        `section-${Date.now()}`,
      imageUrl: editingNodeImage.trim() || null,
    }));
    await persistCategories(nextTree, { previousTree, toastTitle: "تم تعديل القسم" });
    handleCancelEditNode();
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (!window.confirm("هل تريد حذف هذا القسم؟ سيتم حذف العناصر التابعة له.")) return;
    const previousTree = categoryTree;
    const nextTree = normalizeTree(removeNodeById(categoryTree, nodeId));
    await persistCategories(nextTree, { previousTree, toastTitle: "تم حذف القسم" });
    if (editingNodeId === nodeId) handleCancelEditNode();
  };

  const toggleCollapse = (nodeId: string) => {
    setCollapsedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const openAddForNode = (nodeId: string) => {
    const sectionId = nodeSectionMap.get(nodeId);
    if (!sectionId) {
      setError("تعذر تحديد القسم المناسب لهذا التصنيف.");
      return;
    }
    setAddState((prev) => ({
      ...prev,
      sectionId,
      itemId: nodeId,
      nodeId,
    }));
    setIsAddOpen(true);
  };

  const renderNodes = (nodes: CategoryNode[], droppableId: string, depth = 0) => (
    <Droppable droppableId={droppableId} type="category">
      {(dropProvided) => (
        <div ref={dropProvided.innerRef} {...dropProvided.droppableProps} className="space-y-2">
          {nodes.map((node, index) => {
            const isEditing = editingNodeId === node.id;
            const isAddingChild = addingParentId === node.id;
            const hasChildren = (node.subCategories?.length || 0) > 0;
            const isCollapsed = !!collapsedNodes[node.id];
            const products = productsByNode.get(node.id) || [];
            return (
              <Draggable draggableId={node.id} index={index} key={node.id}>
                {(dragProvided) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    className={`rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm ${
                      depth > 0 ? "pr-4" : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-1 items-center gap-3">
                        <span
                          {...dragProvided.dragHandleProps}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400"
                        >
                          <GripVertical className="h-4 w-4" />
                        </span>
                        <div className="flex-1 space-y-1">
                          {isEditing ? (
                            <div className="space-y-2">
                              <Input
                                value={editingNodeName}
                                onChange={(event) => setEditingNodeName(event.target.value)}
                                className="h-9 rounded-lg"
                                placeholder="اسم القسم"
                              />
                              <Input
                                value={editingNodeImage}
                                onChange={(event) => setEditingNodeImage(event.target.value)}
                                className="h-9 rounded-lg"
                                placeholder="رابط صورة القسم (اختياري)"
                              />
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                {node.imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={node.imageUrl}
                                    alt={node.name}
                                    className="h-8 w-8 rounded-lg object-cover"
                                  />
                                ) : null}
                                <p className="text-sm font-semibold text-slate-900">{node.name}</p>
                              </div>
                              <p className="text-xs text-slate-400">{node.slug}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-50 px-3 py-1 text-xs text-slate-500">
                          {nodeCounts.get(node.id) || 0} منتج
                        </span>
                        {hasChildren ? (
                          <Button
                            variant="outline"
                            className="h-8 rounded-lg text-xs"
                            onClick={() => toggleCollapse(node.id)}
                          >
                            {isCollapsed ? "عرض الفروع" : "إخفاء الفروع"}
                          </Button>
                        ) : null}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">
                            {node.isActive === false ? "غير نشط" : "نشط"}
                          </span>
                          <Switch
                            checked={node.isActive !== false}
                            onCheckedChange={(checked) => handleToggleNode(node.id, checked)}
                          />
                        </div>
                        {isEditing ? (
                          <>
                            <Button
                              className="h-8 rounded-lg text-xs"
                              onClick={() => handleSaveNode(node.id)}
                              disabled={isSavingCategories}
                            >
                              حفظ
                            </Button>
                            <Button
                              variant="outline"
                              className="h-8 rounded-lg text-xs"
                              onClick={handleCancelEditNode}
                              disabled={isSavingCategories}
                            >
                              إلغاء
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              className="h-8 rounded-lg text-xs"
                              onClick={() => {
                                setAddingParentId(node.id);
                                setNewChildName("");
                              }}
                            >
                              <PlusCircle className="h-3.5 w-3.5" />
                              فرعي
                            </Button>
                            <Button
                              variant="outline"
                              className="h-8 rounded-lg text-xs"
                              onClick={() => handleStartEditNode(node)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              تعديل
                            </Button>
                            <Button
                              variant="outline"
                              className="h-8 rounded-lg text-xs text-rose-500"
                              onClick={() => handleDeleteNode(node.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              حذف
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {isAddingChild && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Input
                          value={newChildName}
                          onChange={(event) => setNewChildName(event.target.value)}
                          placeholder="اسم القسم الفرعي"
                          className="h-9 w-full rounded-lg sm:w-64"
                        />
                        <Button
                          className="h-9 rounded-lg text-xs"
                          onClick={() => handleAddChild(node.id, newChildName)}
                          disabled={isSavingCategories}
                        >
                          إضافة
                        </Button>
                        <Button
                          variant="outline"
                          className="h-9 rounded-lg text-xs"
                          onClick={() => {
                            setAddingParentId(null);
                            setNewChildName("");
                          }}
                          disabled={isSavingCategories}
                        >
                          إلغاء
                        </Button>
                      </div>
                    )}

                    {hasChildren ? null : (
                      <div className="mt-4 rounded-xl bg-slate-50 px-3 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-700">منتجات القسم</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] text-slate-400">
                              اسحب المنتجات بين الأقسام لإعادة التنظيم.
                            </span>
                            <Button
                              variant="outline"
                              className="h-7 rounded-lg text-[11px]"
                              onClick={() => openAddForNode(node.id)}
                            >
                              <Plus className="h-3.5 w-3.5" />
                              إضافة منتج
                            </Button>
                          </div>
                        </div>
                        <Droppable droppableId={`products:${node.id}`} type="product">
                          {(productDrop) => (
                            <div
                              ref={productDrop.innerRef}
                              {...productDrop.droppableProps}
                              className="mt-3 space-y-2"
                            >
                              {products.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-4 text-center text-xs text-slate-400">
                                  لا توجد منتجات في هذا القسم.
                                </div>
                              ) : (
                                products.map((product, productIndex) => (
                                  <Draggable
                                    key={product.id}
                                    draggableId={`product:${product.id}`}
                                    index={productIndex}
                                  >
                                    {(productDrag) => (
                                      <div
                                        ref={productDrag.innerRef}
                                        {...productDrag.draggableProps}
                                        {...productDrag.dragHandleProps}
                                        className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 cursor-pointer"
                                        onClick={() => openEdit(product)}
                                      >
                                        {product.image ? (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img
                                            src={product.image}
                                            alt={product.name}
                                            className="h-10 w-10 rounded-md object-cover"
                                          />
                                        ) : (
                                          <div className="h-10 w-10 rounded-md bg-slate-100" />
                                        )}
                                        <div className="flex-1 space-y-1">
                                          <p className="text-sm font-semibold text-slate-800">{product.name}</p>
                                          <p className="text-xs text-slate-400">
                                            {formatCurrency(product.price)}
                                          </p>
                                        </div>
                                        <span className="text-xs text-slate-400">
                                          #{product.order || productIndex + 1}
                                        </span>
                                      </div>
                                    )}
                                  </Draggable>
                                ))
                              )}
                              {productDrop.placeholder}
                            </div>
                          )}
                        </Droppable>
                        <div className="mt-3 flex justify-end">
                          <Button
                            variant="outline"
                            className="h-8 rounded-lg text-xs"
                            onClick={() => openAddForNode(node.id)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            إضافة منتج أسفل القسم
                          </Button>
                        </div>
                      </div>
                    )}

                    {!isCollapsed && hasChildren ? (
                      <div className="mt-3 pr-6 border-r border-slate-100">
                        {renderNodes(node.subCategories || [], `children:${node.id}`, depth + 1)}
                      </div>
                    ) : null}
                  </div>
                )}
              </Draggable>
            );
          })}
          {dropProvided.placeholder}
          {nodes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs text-slate-400">
              اسحب عناصر هنا أو أضف قسم جديد
            </div>
          ) : null}
        </div>
      )}
    </Droppable>
  );

  const isSplit = layout === "split";
  const isEditingSaving = editingRow ? !!savingMap[editingRow.id] : false;
  const editingNode = useMemo(
    () => (editingNodeId ? findNodeById(categoryTree, editingNodeId) : null),
    [editingNodeId, categoryTree]
  );
  const categoryEditorPanel = editingNodeId ? (
    <div className="rounded-[28px] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-400">لوحة القسم</p>
          <h3 className="text-lg font-semibold text-slate-900">
            {editingNodeName || editingNode?.name || "تعديل القسم"}
          </h3>
        </div>
        <Button variant="ghost" className="h-8 px-2" onClick={handleCancelEditNode}>
          إغلاق
        </Button>
      </div>
      <div className="mt-4 space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500">اسم القسم</p>
          <Input
            value={editingNodeName}
            onChange={(event) => setEditingNodeName(event.target.value)}
            className="h-10 rounded-xl"
            placeholder="مثال: منتجات الألبان"
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500">المعرف (Slug)</p>
          <Input
            value={editingNodeSlug}
            onChange={(event) => setEditingNodeSlug(event.target.value)}
            className="h-10 rounded-xl"
            placeholder="dairy-and-eggs"
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500">صورة القسم</p>
          <Input
            value={editingNodeImage}
            onChange={(event) => setEditingNodeImage(event.target.value)}
            className="h-10 rounded-xl"
            placeholder="رابط صورة القسم"
          />
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
          <span>حالة القسم</span>
          <Switch
            checked={editingNode?.isActive !== false}
            onCheckedChange={(checked) => handleToggleNode(editingNodeId, checked)}
          />
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            className="h-10 rounded-xl"
            onClick={() => handleSaveNode(editingNodeId)}
            disabled={isSavingCategories}
          >
            حفظ التعديلات
          </Button>
          <Button
            variant="outline"
            className="h-10 rounded-xl"
            onClick={handleCancelEditNode}
            disabled={isSavingCategories}
          >
            إلغاء
          </Button>
          <Button
            variant="outline"
            className="h-10 rounded-xl text-rose-500"
            onClick={() => handleDeleteNode(editingNodeId)}
            disabled={isSavingCategories}
          >
            حذف القسم
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  const editorPanel = (
    <RetailProductEditorPanel
      editingRow={editingRow}
      editForm={editForm}
      editImages={editImages}
      editImageInput={editImageInput}
      onEditFormChange={handleEditChange}
      onEditImageInputChange={setEditImageInput}
      onAddImage={handleAddEditImage}
      onRemoveImage={handleRemoveEditImageAt}
      onUploadImage={handleUploadEditImage}
      uploadingImage={isUploadingEditImage}
      onSave={handleEditSave}
      onClear={() => setEditingRow(null)}
      saving={isEditingSaving}
    />
  );
  const activeEditorPanel = editingNodeId ? categoryEditorPanel : editorPanel;

  const managerBody = (
    <>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <RetailAddProductDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        merchantsCount={merchants.length}
        productQuery={productQuery}
        onProductQueryChange={(value) => {
          setProductQuery(value);
          setSelectedGlobal(null);
          setCreateNewName(null);
          if (addState.merchantProductId) {
            setAddState((prev) => ({ ...prev, merchantProductId: "" }));
          }
        }}
        filteredMerchants={filteredMerchants}
        onSelectMerchant={(item) => {
          setAddState((prev) => ({ ...prev, merchantProductId: item.id }));
          setProductQuery(item.name);
          setSelectedGlobal(null);
          setCreateNewName(null);
        }}
        globalResults={globalResults}
        globalLoading={globalLoading}
        selectedGlobalId={selectedGlobal?.id}
        onSelectGlobal={(item) => {
          const label = displayGlobalName(item.name) || item.slug;
          setSelectedGlobal(item);
          setCreateNewName(null);
          setAddState((prev) => ({ ...prev, merchantProductId: "" }));
          setProductQuery(label);
        }}
        createNewLabel={createNewName}
        onSelectCreateNew={() => {
          const label = productQuery.trim();
          if (!label) return;
          setCreateNewName(label);
          setSelectedGlobal(null);
          setAddState((prev) => ({ ...prev, merchantProductId: "" }));
        }}
        newProductPrice={newProductPrice}
        onNewProductPriceChange={(value) => setNewProductPrice(value)}
        newProductImages={newProductImages}
        newProductImageInput={newProductImageInput}
        onNewProductImageInputChange={(value) => setNewProductImageInput(value)}
        onAddNewProductImage={() => {
          const url = newProductImageInput.trim();
          if (!url) return;
          setNewProductImages((prev) => Array.from(new Set([...prev, url])));
          setNewProductImageInput("");
        }}
        onRemoveNewProductImage={(index) => {
          setNewProductImages((prev) => prev.filter((_, idx) => idx !== index));
        }}
        onUploadNewProductImage={handleUploadNewProductImage}
        uploadingNewProductImage={isUploadingNewImage}
        sections={sectionsState}
        currentItems={currentItems}
        addState={addState}
        onAddStateChange={handleAddChange}
        nodeOptions={nodeOptions}
        nodeLabel={nodeLabel}
        onAddToCatalog={handleAddToCatalog}
        saving={!!savingMap.add}
        catalogId={catalogIdState}
        formatCurrency={formatCurrency}
        displayGlobalName={displayGlobalName}
      />

    

      <div className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
        <RetailCategoriesTree
          sectionsCount={sectionsState.length}
          newSectionName={newSectionName}
          newSectionImage={newSectionImage}
          onSectionNameChange={(value) => setNewSectionName(value)}
          onSectionImageChange={(value) => setNewSectionImage(value)}
          onAddSection={handleAddSection}
          isSaving={isSavingCategories}
        >
          {sectionsState.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
              لا توجد أقسام كتالوج لهذا السوبرماركت بعد.
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>{renderNodes(categoryTree, "root")}</DragDropContext>
          )}
        </RetailCategoriesTree>
      </div>

      {!isSplit ? (
        <Dialog open={!!editingRow} onOpenChange={(open) => !open && setEditingRow(null)}>
          <DialogContent dir="rtl" className="max-w-5xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-slate-900">
                {editingRow ? `معرف المنتج ${editingRow.id.slice(-4)} : ${editingRow.name}` : ""}
              </DialogTitle>
            </DialogHeader>

            <div className="mt-4 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500">اسم المنتج</p>
                  <Input
                    value={editForm.name}
                    onChange={(event) => handleEditChange("name", event.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500">التصنيف</p>
                    <select
                      value={editForm.category}
                      onChange={(event) => handleEditChange("category", event.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
                    >
                      <option value="">اختر التصنيف</option>
                      {sectionsState.map((section) => (
                        <option key={section.id} value={section.title}>
                          {section.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500">حجم المنتج</p>
                    <Input
                      value={editForm.size}
                      onChange={(event) => handleEditChange("size", event.target.value)}
                      className="h-11 rounded-xl"
                      placeholder="مثال: 350g"
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500">الكمية بالمخزون</p>
                    <Input
                      type="number"
                      value={editForm.stock}
                      onChange={(event) => handleEditChange("stock", event.target.value)}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500">سعر البيع</p>
                    <Input
                      type="number"
                      value={editForm.price}
                      onChange={(event) => handleEditChange("price", event.target.value)}
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500">اسم المورد</p>
                  <Input
                    value={editForm.supplierName}
                    onChange={(event) => handleEditChange("supplierName", event.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500">موقع المورد</p>
                    <select
                      value={editForm.supplierLocation}
                      onChange={(event) => handleEditChange("supplierLocation", event.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
                    >
                      <option value="">اختر الموقع</option>
                      <option value="egypt">القاهرة، مصر</option>
                      <option value="alex">الإسكندرية، مصر</option>
                      <option value="giza">الجيزة، مصر</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500">الحالة</p>
                    <select
                      value={editForm.status}
                      onChange={(event) => handleEditChange("status", event.target.value as StatusKey)}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
                    >
                      <option value="published">منشور</option>
                      <option value="draft">مسودة</option>
                      <option value="inactive">غير نشط</option>
                      <option value="stockout">نفد المخزون</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                  <div className="flex h-56 items-center justify-center rounded-xl bg-white">
                    {editImages[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={editImages[0]} alt={editingRow?.name || ""} className="h-44 w-44 object-contain" />
                    ) : (
                      <div className="h-44 w-44 rounded-xl bg-slate-100" />
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Button variant="outline" className="h-9 rounded-xl text-xs" onClick={handleReplaceImage}>
                      استبدال الصورة
                    </Button>
                    <Button
                      variant="outline"
                      className="h-9 rounded-xl text-xs text-rose-500"
                      onClick={handleRemoveImage}
                    >
                      حذف الصورة
                    </Button>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Input
                      value={editImageInput}
                      onChange={(event) => setEditImageInput(event.target.value)}
                      className="h-10 flex-1 rounded-xl"
                      placeholder="رابط صورة إضافية"
                    />
                    <Button variant="outline" className="h-10 rounded-xl text-xs" onClick={handleAddEditImage}>
                      إضافة صورة
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {(editImages.length ? editImages : Array.from({ length: 4 }).map(() => "")).map((img, idx) => (
                    <div key={idx} className="relative h-16 rounded-xl border border-slate-200 bg-white p-1">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt={editingRow?.name || ""} className="h-full w-full object-contain" />
                      ) : (
                        <div className="h-full w-full rounded-lg bg-slate-100" />
                      )}
                      {img ? (
                        <button
                          type="button"
                          className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs text-rose-500 shadow"
                          onClick={() => handleRemoveEditImageAt(idx)}
                        >
                          ×
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <DialogClose asChild>
                <Button variant="outline" className="h-11 rounded-xl border-rose-200 text-rose-500">
                  إلغاء والرجوع
                </Button>
              </DialogClose>
              <Button className="h-11 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700" onClick={handleEditSave}>
                حفظ التعديلات
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );

  if (!isSplit) {
    return (
      <section dir="rtl" className="space-y-6">
        {managerBody}
      </section>
    );
  }

  return (
    <section dir="rtl" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">{managerBody}</div>
      <aside className="hidden lg:block lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:self-start">
        {activeEditorPanel}
      </aside>
      {!isDesktop ? (
        <Sheet
          open={!!(editingRow || editingNodeId) && !isDesktop}
          onOpenChange={(open) => {
            if (!open) {
              setEditingRow(null);
              handleCancelEditNode();
            }
          }}
        >
          <SheetContent side="bottom" className="h-[85vh] overflow-y-auto bg-[#f3f7ff]">
            <SheetHeader>
              <SheetTitle>لوحة التعديل</SheetTitle>
            </SheetHeader>
            <div className="mt-4">{activeEditorPanel}</div>
          </SheetContent>
        </Sheet>
      ) : null}
    </section>
  );
}
