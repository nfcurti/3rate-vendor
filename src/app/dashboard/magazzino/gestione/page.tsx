"use client";

import { ImagePlus, Loader2, Package, Save, Trash2, Upload, WandSparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { formatApiErrorMessage } from "@/lib/business-auth";
import {
  businessArticlesApi,
  getShippingOptions,
  type ArticleListing,
  type ShippingOption,
} from "@/lib/business-articles";
import type { ProductCategory } from "@/lib/business-info";
import { uploadBusinessImage } from "@/lib/business-info";
import { DashboardViewHeader } from "../../_components/DashboardViewHeader";
import { FormDropdown } from "../../_components/FormDropdown";
import {
  FormDropdownWithOther,
  getPresetOrCustomValue,
  resolvePresetSelection,
} from "../../_components/FormDropdownWithOther";
import { Sidebar } from "../../_components/Sidebar";
import { ViewTransition } from "../../_components/ViewTransition";

function parseIds(params: URLSearchParams) {
  const batch = params.get("ids") ?? params.get("skus");
  if (batch) return batch.split(",").map((v) => v.trim()).filter(Boolean);
  const single = params.get("id") ?? params.get("sku");
  return single ? [single] : [];
}

const SIZE_PRESETS = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "Unica"] as const;
const COLOR_PRESETS = [
  "Nero",
  "Bianco",
  "Argento",
  "Blu",
  "Rosso",
  "Verde",
  "Beige",
  "Grigio",
  "Marrone",
  "Rosa",
  "Multicolore",
] as const;

function parseNumber(value: string) {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function sanitizeIntegerInput(value: string) {
  return value.replace(/\D/g, "");
}

function GestioneMagazzinoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") ?? "edit";
  const articleIds = parseIds(searchParams);

  const isCreate = mode === "create";
  const isBatch = mode === "batch";
  const isRestock = mode === "restock";

  const title = isCreate
    ? "Nuovo prodotto"
    : isBatch
      ? "Modifica in blocco"
      : isRestock
        ? "Rifornisci prodotto"
        : "Modifica prodotto";

  const ctaLabel = isCreate
    ? "Crea prodotto"
    : isBatch
      ? "Applica modifiche in blocco"
      : isRestock
        ? "Conferma rifornimento"
        : "Salva modifiche";

  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    message: string;
    tone: "error" | "success";
  } | null>(null);

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [article, setArticle] = useState<ArticleListing | null>(null);

  const [description, setDescription] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [totalStock, setTotalStock] = useState("");
  const [restockAmount, setRestockAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [shippingOptionId, setShippingOptionId] = useState("");
  const [sizeSelection, setSizeSelection] = useState("");
  const [sizeCustom, setSizeCustom] = useState("");
  const [colorSelection, setColorSelection] = useState("");
  const [colorCustom, setColorCustom] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageName, setImageName] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setStatusMessage(null);

      try {
        const [categoriesPayload, shippingPayload, listings] = await Promise.all([
          businessArticlesApi.getCategories(),
          getShippingOptions(),
          isCreate ? Promise.resolve([]) : businessArticlesApi.getListings(),
        ]);

        if (cancelled) return;

        setCategories(categoriesPayload);
        setShippingOptions(shippingPayload);

        if (!isCreate && articleIds.length === 1) {
          const found = listings.find((item) => item._id === articleIds[0]) ?? null;
          setArticle(found);
          if (found) {
            setDescription(found.description);
            setOriginalPrice(String(found.originalPrice));
            setDiscountedPrice(
              found.discountedPrice !== undefined ? String(found.discountedPrice) : ""
            );
            setTotalStock(String(found.totalStock));
            setCategoryId(found.categoryIds[0] ?? "");
            setShippingOptionId(found.shippingOptionIds[0] ?? "");
            const sizePreset = resolvePresetSelection([...SIZE_PRESETS], found.size ?? "");
            setSizeSelection(sizePreset.selection);
            setSizeCustom(sizePreset.custom);
            const colorValue = found.colors.join(", ");
            const colorPreset = resolvePresetSelection([...COLOR_PRESETS], colorValue);
            setColorSelection(colorPreset.selection);
            setColorCustom(colorPreset.custom);
            setImageUrl(found.imagesUrls[0] ?? "");
            setImageName(found.imagesUrls[0] ? "Immagine prodotto" : "");
          } else {
            setStatusMessage({ message: "Prodotto non trovato.", tone: "error" });
          }
        }

        if (shippingPayload[0]?._id && !shippingOptionId) {
          setShippingOptionId(shippingPayload[0]._id);
        }
        if (categoriesPayload[0]?._id && !categoryId) {
          setCategoryId(categoriesPayload[0]._id);
        }
      } catch (error) {
        if (!cancelled) {
          setStatusMessage({
            message: formatApiErrorMessage(error),
            tone: "error",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, articleIds.join(",")]);

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: category._id ?? "",
        label: category.name || "Categoria",
      })),
    [categories]
  );

  const shippingOptionsList = useMemo(
    () =>
      shippingOptions.map((option) => ({
        value: option._id ?? "",
        label: option.name,
      })),
    [shippingOptions]
  );

  async function handleImageUpload(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatusMessage({ message: "Carica un file immagine valido.", tone: "error" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setStatusMessage({ message: "L'immagine deve essere inferiore a 10 MB.", tone: "error" });
      return;
    }

    setUploadingImage(true);
    setStatusMessage(null);
    try {
      const url = await uploadBusinessImage(file);
      setImageUrl(url);
      setImageName(file.name);
    } catch (error) {
      setStatusMessage({ message: formatApiErrorMessage(error), tone: "error" });
    } finally {
      setUploadingImage(false);
    }
  }

  function handleImageFiles(fileList: FileList | File[]) {
    const file = Array.from(fileList)[0];
    if (file) void handleImageUpload(file);
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function clearImage() {
    setImageUrl("");
    setImageName("");
  }

  const resolvedSize = getPresetOrCustomValue(sizeSelection, sizeCustom);
  const resolvedColor = getPresetOrCustomValue(colorSelection, colorCustom);

  async function handleSubmit() {
    setSaving(true);
    setStatusMessage(null);

    try {
      if (isCreate) {
        const price = parseNumber(originalPrice);
        const stock = parseNumber(totalStock);
        if (!description.trim()) throw new Error("Inserisci il nome del prodotto.");
        if (price === undefined || price <= 0) throw new Error("Inserisci un prezzo valido.");
        if (stock === undefined || stock < 0) throw new Error("Inserisci una quantità valida.");
        if (!categoryId) throw new Error("Seleziona una categoria.");
        if (!shippingOptionId) {
          throw new Error("Nessuna opzione di spedizione disponibile. Contatta il supporto.");
        }

        await businessArticlesApi.createListing({
          description: description.trim(),
          originalPrice: price,
          totalStock: stock,
          categoryIds: [categoryId],
          shippingOptionIds: [shippingOptionId],
          discountedPrice: parseNumber(discountedPrice),
          imagesUrls: imageUrl ? [imageUrl] : [],
          colors: resolvedColor
            ? resolvedColor
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean)
            : [],
          size: resolvedSize,
        });

        setStatusMessage({ message: "Prodotto creato con successo.", tone: "success" });
        router.push("/dashboard/magazzino");
        return;
      }

      if (isRestock) {
        const articleId = articleIds[0];
        if (!articleId || !article) throw new Error("Prodotto non trovato.");
        const add = parseNumber(restockAmount);
        if (add === undefined || add <= 0) {
          throw new Error("Inserisci una quantità da aggiungere.");
        }

        await businessArticlesApi.updateListing({
          articleId,
          totalStock: article.totalStock + add,
          availableStock: article.availableStock + add,
        });

        setStatusMessage({ message: "Rifornimento completato.", tone: "success" });
        router.push("/dashboard/magazzino");
        return;
      }

      if (isBatch) {
        if (articleIds.length === 0) throw new Error("Nessun prodotto selezionato.");

        const updates: Record<string, unknown> = {};
        if (description.trim()) updates.description = description.trim();
        const price = parseNumber(originalPrice);
        if (price !== undefined) updates.originalPrice = price;
        const discount = parseNumber(discountedPrice);
        if (discount !== undefined) updates.discountedPrice = discount;
        const stock = parseNumber(totalStock);
        if (stock !== undefined) {
          updates.totalStock = stock;
          updates.availableStock = stock;
        }
        if (categoryId) updates.categoryIds = [categoryId];
        if (shippingOptionId) updates.shippingOptionIds = [shippingOptionId];
        if (sizeSelection) updates.size = resolvedSize;
        if (colorSelection) {
          updates.colors = resolvedColor
            ? resolvedColor
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean)
            : [];
        }

        if (Object.keys(updates).length === 0) {
          throw new Error("Compila almeno un campo da aggiornare.");
        }

        await Promise.all(
          articleIds.map((articleId) =>
            businessArticlesApi.updateListing({ articleId, ...updates })
          )
        );

        setStatusMessage({ message: "Modifiche applicate in blocco.", tone: "success" });
        router.push("/dashboard/magazzino");
        return;
      }

      const articleId = articleIds[0];
      if (!articleId) throw new Error("Prodotto non trovato.");
      const price = parseNumber(originalPrice);
      const stock = parseNumber(totalStock);
      if (!description.trim()) throw new Error("Inserisci il nome del prodotto.");
      if (price === undefined || price <= 0) throw new Error("Inserisci un prezzo valido.");
      if (stock === undefined || stock < 0) throw new Error("Inserisci una quantità valida.");

      await businessArticlesApi.updateListing({
        articleId,
        description: description.trim(),
        originalPrice: price,
        discountedPrice: parseNumber(discountedPrice),
        totalStock: stock,
        availableStock: stock,
        categoryIds: categoryId ? [categoryId] : undefined,
        shippingOptionIds: shippingOptionId ? [shippingOptionId] : undefined,
        imagesUrls: imageUrl ? [imageUrl] : [],
        colors: resolvedColor
          ? resolvedColor
              .split(",")
              .map((value) => value.trim())
              .filter(Boolean)
          : [],
        size: resolvedSize,
      });

      setStatusMessage({ message: "Prodotto aggiornato.", tone: "success" });
      router.push("/dashboard/magazzino");
    } catch (error) {
      setStatusMessage({ message: formatApiErrorMessage(error), tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f5f2] text-[#1f2b20]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <Sidebar />

        <main className="w-full">
          <ViewTransition>
            <DashboardViewHeader
              title={title}
              backHref="/dashboard/magazzino"
              backAriaLabel="Torna al magazzino"
            />

            <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-7 lg:px-8">
              {statusMessage ? (
                <p
                  className={clsx(
                    "text-xs font-semibold",
                    statusMessage.tone === "success" ? "text-[#2f6b3c]" : "text-red-600"
                  )}
                >
                  {statusMessage.message}
                </p>
              ) : null}

              {loading ? (
                <div className="flex items-center justify-center rounded-2xl bg-white py-16 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                  <Loader2 className="h-6 w-6 animate-spin text-[#214e3a]" />
                </div>
              ) : (
                <>
                  {!isCreate ? (
                    <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                      <div className="flex items-center gap-3">
                        {isBatch ? (
                          <WandSparkles className="h-5 w-5 text-[#214e3a]" />
                        ) : (
                          <Package className="h-5 w-5 text-[#214e3a]" />
                        )}
                        <div>
                          <div className="text-[14px] font-semibold text-[#111827]">
                            {isBatch
                              ? `${articleIds.length} prodotti selezionati`
                              : article?.description || "Prodotto selezionato"}
                          </div>
                          <div className="mt-1 text-[11px] text-[#6b7280]">
                            {articleIds.length > 0
                              ? articleIds.join(", ")
                              : "Nessun prodotto specificato"}
                          </div>
                        </div>
                      </div>
                    </section>
                  ) : null}

                  <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {!isRestock ? (
                        <>
                          <div className="md:col-span-2">
                            <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">
                              Nome prodotto {isCreate ? "(*)" : ""}
                            </label>
                            <input
                              type="text"
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              placeholder={
                                isBatch ? "Lascia vuoto per non modificare" : "Nome prodotto"
                              }
                              className="h-10 w-full rounded-xl border border-black/10 bg-[#F9FAFB] px-3 text-[12px] outline-none placeholder:text-[#9aa39a] focus:border-[#214e3a]/35 focus:ring-1 focus:ring-[#214e3a]/20"
                            />
                          </div>

                          <div>
                            <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">
                              Categoria {isCreate ? "(*)" : ""}
                            </label>
                            <FormDropdown
                              options={
                                categoryOptions.length > 0
                                  ? categoryOptions
                                  : [{ value: "", label: "Nessuna categoria disponibile" }]
                              }
                              value={categoryId}
                              onChange={setCategoryId}
                              placeholder="Seleziona categoria"
                              aria-label="Categoria prodotto"
                            />
                          </div>

                          <div>
                            <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">
                              Opzione spedizione {isCreate ? "(*)" : ""}
                            </label>
                            <FormDropdown
                              options={
                                shippingOptionsList.length > 0
                                  ? shippingOptionsList
                                  : [{ value: "", label: "Nessuna opzione disponibile" }]
                              }
                              value={shippingOptionId}
                              onChange={setShippingOptionId}
                              placeholder="Seleziona spedizione"
                              aria-label="Opzione spedizione"
                            />
                          </div>

                          <div>
                            <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">
                              Prezzo listino (€) {isCreate ? "(*)" : ""}
                            </label>
                            <input
                              type="text"
                              value={originalPrice}
                              onChange={(e) => setOriginalPrice(e.target.value)}
                              placeholder={isBatch ? "Lascia vuoto per non modificare" : "79,00"}
                              className="h-10 w-full rounded-xl border border-black/10 bg-[#F9FAFB] px-3 text-[12px] outline-none placeholder:text-[#9aa39a] focus:border-[#214e3a]/35 focus:ring-1 focus:ring-[#214e3a]/20"
                            />
                          </div>

                          <div>
                            <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">
                              Prezzo scontato (€)
                            </label>
                            <input
                              type="text"
                              value={discountedPrice}
                              onChange={(e) => setDiscountedPrice(e.target.value)}
                              placeholder="Opzionale"
                              className="h-10 w-full rounded-xl border border-black/10 bg-[#F9FAFB] px-3 text-[12px] outline-none placeholder:text-[#9aa39a] focus:border-[#214e3a]/35 focus:ring-1 focus:ring-[#214e3a]/20"
                            />
                          </div>

                          <div>
                            <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">
                              Disponibilità {isCreate ? "(*)" : ""}
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={totalStock}
                              onChange={(e) => setTotalStock(sanitizeIntegerInput(e.target.value))}
                              placeholder={
                                isBatch ? "Lascia vuoto per non modificare" : "20"
                              }
                              className="h-10 w-full rounded-xl border border-black/10 bg-[#F9FAFB] px-3 text-[12px] outline-none placeholder:text-[#9aa39a] focus:border-[#214e3a]/35 focus:ring-1 focus:ring-[#214e3a]/20"
                            />
                          </div>

                          <div>
                            <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">
                              Taglia
                            </label>
                            <FormDropdownWithOther
                              options={[...SIZE_PRESETS]}
                              value={sizeSelection}
                              customValue={sizeCustom}
                              onValueChange={setSizeSelection}
                              onCustomValueChange={setSizeCustom}
                              placeholder="Seleziona taglia"
                              aria-label="Taglia prodotto"
                              customPlaceholder="Es: 42, 38 IT"
                            />
                          </div>

                          <div>
                            <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">
                              Colori
                            </label>
                            <FormDropdownWithOther
                              options={[...COLOR_PRESETS]}
                              value={colorSelection}
                              customValue={colorCustom}
                              onValueChange={setColorSelection}
                              onCustomValueChange={setColorCustom}
                              placeholder="Seleziona colore"
                              aria-label="Colore prodotto"
                              customPlaceholder="Es: Bordeaux, Verde oliva"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">
                              Immagine prodotto
                            </label>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/jpg"
                              className="hidden"
                              disabled={uploadingImage}
                              onChange={(e) => {
                                if (e.target.files) handleImageFiles(e.target.files);
                                e.currentTarget.value = "";
                              }}
                            />
                            {imageUrl ? (
                              <div className="overflow-hidden rounded-2xl border border-black/10 bg-[#fafafa]">
                                <div className="relative aspect-[4/3] max-h-56 w-full bg-[#f3f4f6] sm:max-w-sm">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={imageUrl}
                                    alt={imageName || "Anteprima prodotto"}
                                    className="h-full w-full object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={clearImage}
                                    disabled={uploadingImage}
                                    className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 text-white hover:cursor-pointer hover:bg-black/75 disabled:cursor-not-allowed disabled:opacity-60"
                                    aria-label="Rimuovi immagine"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/5 px-4 py-3">
                                  <div className="min-w-0">
                                    <p className="truncate text-[12px] font-semibold text-[#111827]">
                                      {imageName || "Immagine caricata"}
                                    </p>
                                    <p className="text-[11px] text-[#6b7280]">
                                      PNG, JPG o WEBP fino a 10 MB
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={openFilePicker}
                                    disabled={uploadingImage}
                                    className="inline-flex h-9 items-center justify-center rounded-lg border border-black/10 bg-white px-4 text-[11px] font-semibold text-[#214e3a] hover:cursor-pointer hover:bg-[#f8faf8] disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Sostituisci
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                className={clsx(
                                  "rounded-2xl border-2 border-dashed bg-[#fafafa] px-4 py-8 text-center transition-colors",
                                  isDragActive
                                    ? "border-[#214e3a]/45 bg-[#f1f6f3]"
                                    : "border-black/15",
                                  uploadingImage && "pointer-events-none opacity-70"
                                )}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  setIsDragActive(true);
                                }}
                                onDragLeave={(e) => {
                                  e.preventDefault();
                                  setIsDragActive(false);
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  setIsDragActive(false);
                                  if (e.dataTransfer.files?.length) {
                                    handleImageFiles(e.dataTransfer.files);
                                  }
                                }}
                              >
                                {uploadingImage ? (
                                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#214e3a]" />
                                ) : (
                                  <Upload className="mx-auto h-8 w-8 text-[#9aa39a]" strokeWidth={1.5} />
                                )}
                                <p className="mt-2 text-[12px] font-medium text-[#1f2b20]">
                                  {uploadingImage
                                    ? "Caricamento immagine..."
                                    : "Trascina l'immagine qui"}
                                </p>
                                <p className="mt-1 text-[11px] text-[#9aa39a]">
                                  PNG, JPG o WEBP fino a 10 MB
                                </p>
                                <button
                                  type="button"
                                  onClick={openFilePicker}
                                  disabled={uploadingImage}
                                  className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-black/10 bg-[#214e3a] px-4 text-[11px] font-semibold text-white hover:cursor-pointer hover:bg-[#1a3f2e] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <ImagePlus className="h-4 w-4" />
                                  Sfoglia file
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="md:col-span-2">
                            <div className="rounded-xl bg-[#f8faf8] p-4 text-[12px] text-[#6b7280]">
                              Stock attuale:{" "}
                              <span className="font-semibold text-[#111827]">
                                {article?.availableStock ?? 0} disponibili /{" "}
                                {article?.totalStock ?? 0} totali
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">
                              Quantità da aggiungere (*)
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={restockAmount}
                              onChange={(e) =>
                                setRestockAmount(sanitizeIntegerInput(e.target.value))
                              }
                              placeholder="Es: 20"
                              className="h-10 w-full rounded-xl border border-black/10 bg-[#F9FAFB] px-3 text-[12px] outline-none placeholder:text-[#9aa39a] focus:border-[#214e3a]/35 focus:ring-1 focus:ring-[#214e3a]/20"
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <div className="mt-5 flex justify-end">
                      <button
                        type="button"
                        disabled={saving || uploadingImage}
                        onClick={() => void handleSubmit()}
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#214e3a] px-5 text-[12px] font-semibold text-white hover:cursor-pointer hover:bg-[#1a3f2e] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {saving ? "Salvataggio..." : ctaLabel}
                      </button>
                    </div>
                  </section>
                </>
              )}
            </div>
          </ViewTransition>
        </main>
      </div>
    </div>
  );
}

export default function GestioneMagazzinoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f3f5f2]" />}>
      <GestioneMagazzinoContent />
    </Suspense>
  );
}
