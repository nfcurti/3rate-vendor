"use client";

import { Loader2, Package, Save, WandSparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
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
import { Sidebar } from "../../_components/Sidebar";
import { ViewTransition } from "../../_components/ViewTransition";

function parseIds(params: URLSearchParams) {
  const batch = params.get("ids") ?? params.get("skus");
  if (batch) return batch.split(",").map((v) => v.trim()).filter(Boolean);
  const single = params.get("id") ?? params.get("sku");
  return single ? [single] : [];
}

function parseNumber(value: string) {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
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
  const [size, setSize] = useState("");
  const [colors, setColors] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

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
            setSize(found.size ?? "");
            setColors(found.colors.join(", "));
            setImageUrl(found.imagesUrls[0] ?? "");
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
    setUploadingImage(true);
    setStatusMessage(null);
    try {
      const url = await uploadBusinessImage(file);
      setImageUrl(url);
    } catch (error) {
      setStatusMessage({ message: formatApiErrorMessage(error), tone: "error" });
    } finally {
      setUploadingImage(false);
    }
  }

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
          colors: colors
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
          size: size.trim(),
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
        if (size.trim()) updates.size = size.trim();
        if (colors.trim()) {
          updates.colors = colors
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean);
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
        colors: colors
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        size: size.trim(),
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
                              value={totalStock}
                              onChange={(e) => setTotalStock(e.target.value)}
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
                            <input
                              type="text"
                              value={size}
                              onChange={(e) => setSize(e.target.value)}
                              placeholder="Es: M, L, XL"
                              className="h-10 w-full rounded-xl border border-black/10 bg-[#F9FAFB] px-3 text-[12px] outline-none placeholder:text-[#9aa39a] focus:border-[#214e3a]/35 focus:ring-1 focus:ring-[#214e3a]/20"
                            />
                          </div>

                          <div>
                            <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">
                              Colori
                            </label>
                            <input
                              type="text"
                              value={colors}
                              onChange={(e) => setColors(e.target.value)}
                              placeholder="Es: Nero, Bianco"
                              className="h-10 w-full rounded-xl border border-black/10 bg-[#F9FAFB] px-3 text-[12px] outline-none placeholder:text-[#9aa39a] focus:border-[#214e3a]/35 focus:ring-1 focus:ring-[#214e3a]/20"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="mb-1.5 block text-[12px] font-semibold text-[#1f2b20]">
                              Immagine prodotto
                            </label>
                            <div className="flex flex-wrap items-center gap-3">
                              <input
                                type="file"
                                accept="image/*"
                                disabled={uploadingImage}
                                onChange={(e) => void handleImageUpload(e.target.files?.[0] ?? null)}
                                className="text-[12px] file:mr-3 file:rounded-lg file:border-0 file:bg-[#214e3a] file:px-3 file:py-2 file:text-[11px] file:font-semibold file:text-white hover:file:cursor-pointer"
                              />
                              {imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={imageUrl}
                                  alt=""
                                  className="h-12 w-12 rounded-xl object-cover ring-1 ring-black/10"
                                />
                              ) : null}
                            </div>
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
                              value={restockAmount}
                              onChange={(e) => setRestockAmount(e.target.value)}
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
