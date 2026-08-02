"use client";

import {
  ImagePlus,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { formatApiErrorMessage } from "@/lib/business-auth";
import {
  businessArticlesApi,
  getShippingOptions,
  type ShippingOption,
} from "@/lib/business-articles";
import type { ProductCategory } from "@/lib/business-info";
import { uploadBusinessImage } from "@/lib/business-info";
import { DashboardViewHeader } from "../_components/DashboardViewHeader";
import { FormDropdown, type FormDropdownOption } from "../_components/FormDropdown";
import { Sidebar } from "../_components/Sidebar";
import { ViewTransition } from "../_components/ViewTransition";

const STATUS_OPTIONS: FormDropdownOption[] = [
  { value: "active", label: "Attivo" },
  { value: "draft", label: "Bozza" },
  { value: "hidden", label: "Nascosto" },
];

function parseNumber(value: string) {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-1.5 text-[12px] font-semibold text-[#1f2b20]">{children}</div>;
}

const inputClass =
  "h-10 w-full rounded-xl border border-black/10 bg-[#F9FAFB] px-3 text-[12px] text-[#1f2b20] outline-none placeholder:text-[#9aa39a] focus:border-[#214e3a]/35 focus:ring-1 focus:ring-[#214e3a]/20";

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors hover:cursor-pointer",
        checked ? "bg-[#76C043]" : "bg-[#e5e7eb]",
      )}
    >
      <span
        className={clsx(
          "absolute top-0.5 block h-5 w-5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

type VariantChipShape = "pill" | "squarish";

type VariantRow = {
  id: string;
  name: string;
  values: string[];
  selectedValue: string;
  chipShape: VariantChipShape;
  /** Se true, il nome è mostrato come etichetta (es. Colore / Taglia). */
  isPreset?: boolean;
};

type UploadedImage = {
  id: string;
  name: string;
  file: File;
  sizeLabel: string;
  previewUrl: string;
};

export default function ScansionaAggiungiPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    message: string;
    tone: "error" | "success";
  } | null>(null);

  const [productName, setProductName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [shippingOptionId, setShippingOptionId] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [productStatus, setProductStatus] = useState("active");
  const [shipping, setShipping] = useState(true);
  const [catalogVisible, setCatalogVisible] = useState(true);
  const [featured, setFeatured] = useState(false);

  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadedImagesRef = useRef<UploadedImage[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([
    {
      id: "1",
      name: "Colore",
      values: ["Nero", "Bianco", "Argento"],
      selectedValue: "Nero",
      chipShape: "pill",
      isPreset: true,
    },
    {
      id: "2",
      name: "Taglia",
      values: ["S", "M", "L", "XL"],
      selectedValue: "M",
      chipShape: "squarish",
      isPreset: true,
    },
  ]);

  function removeVariant(id: string) {
    setVariants((v) => v.filter((x) => x.id !== id));
  }

  function addVariant() {
    setVariants((v) => [
      ...v,
      {
        id: String(Date.now()),
        name: "",
        values: [],
        selectedValue: "",
        chipShape: "pill",
      },
    ]);
  }

  function setVariantSelected(id: string, value: string) {
    setVariants((list) =>
      list.map((row) => (row.id === id ? { ...row, selectedValue: value } : row)),
    );
  }

  function addVariantValue(id: string) {
    const label = typeof window !== "undefined" ? window.prompt("Nome del valore", "") : null;
    if (label == null || !label.trim()) return;
    const v = label.trim();
    setVariants((list) =>
      list.map((row) =>
        row.id === id
          ? { ...row, values: [...row.values, v], selectedValue: row.selectedValue || v }
          : row,
      ),
    );
  }

  function updateVariantName(id: string, name: string) {
    setVariants((list) => list.map((row) => (row.id === id ? { ...row, name } : row)));
  }

  function appendImageFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const validFiles = files.filter(
      (file) => file.type.startsWith("image/") && file.size <= 10 * 1024 * 1024,
    );
    if (validFiles.length === 0) return;

    const next = validFiles.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      file,
      sizeLabel: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      previewUrl: URL.createObjectURL(file),
    }));

    setUploadedImages((prev) => [...prev, ...next]);
  }

  function removeUploadedImage(id: string) {
    setUploadedImages((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  useEffect(() => {
    uploadedImagesRef.current = uploadedImages;
  }, [uploadedImages]);

  useEffect(() => {
    let cancelled = false;

    async function loadMeta() {
      setMetaLoading(true);
      try {
        const [categoriesPayload, shippingPayload] = await Promise.all([
          businessArticlesApi.getCategories(),
          getShippingOptions(),
        ]);
        if (cancelled) return;
        setCategories(categoriesPayload);
        setShippingOptions(shippingPayload);
        if (categoriesPayload[0]?._id) setCategoryId(categoriesPayload[0]._id);
        if (shippingPayload[0]?._id) setShippingOptionId(shippingPayload[0]._id);
      } catch (error) {
        if (!cancelled) {
          setStatusMessage({ message: formatApiErrorMessage(error), tone: "error" });
        }
      } finally {
        if (!cancelled) setMetaLoading(false);
      }
    }

    void loadMeta();
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryOptions = useMemo(
    () =>
      categories.map((item) => ({
        value: item._id ?? "",
        label: item.name ?? "Categoria",
      })),
    [categories]
  );

  const shippingOptionsDropdown = useMemo(
    () =>
      shippingOptions.map((option) => ({
        value: option._id ?? "",
        label: option.name,
      })),
    [shippingOptions]
  );

  function getVariantValue(name: string) {
    const row = variants.find((variant) => variant.name.toLowerCase() === name.toLowerCase());
    return row?.selectedValue?.trim() ?? "";
  }

  async function handlePublish() {
    setPublishing(true);
    setStatusMessage(null);

    try {
      const price = parseNumber(salePrice);
      const stock = parseNumber(stockQuantity);
      const description = [productName.trim(), shortDescription.trim(), fullDescription.trim()]
        .filter(Boolean)
        .join(" — ");

      if (!productName.trim()) throw new Error("Inserisci il nome del prodotto.");
      if (price === undefined || price <= 0) throw new Error("Inserisci un prezzo valido.");
      if (stock === undefined || stock < 0) throw new Error("Inserisci una quantità valida.");
      if (!categoryId) throw new Error("Seleziona una categoria.");
      if (!shippingOptionId) {
        throw new Error("Nessuna opzione di spedizione disponibile.");
      }

      const imageUrls: string[] = [];
      for (const image of uploadedImages) {
        const url = await uploadBusinessImage(image.file);
        imageUrls.push(url);
      }

      const colors = getVariantValue("Colore");
      const size = getVariantValue("Taglia");

      const created = await businessArticlesApi.createListing({
        description: description || productName.trim(),
        originalPrice: price,
        totalStock: stock,
        categoryIds: [categoryId],
        shippingOptionIds: shipping ? [shippingOptionId] : [],
        imagesUrls: imageUrls,
        colors: colors ? [colors] : [],
        size,
      });

      if (productStatus !== "active" && created._id) {
        await businessArticlesApi.pauseListing(created._id);
      }

      setStatusMessage({ message: "Prodotto pubblicato con successo.", tone: "success" });
      router.push("/dashboard/magazzino");
    } catch (error) {
      setStatusMessage({ message: formatApiErrorMessage(error), tone: "error" });
    } finally {
      setPublishing(false);
    }
  }

  useEffect(() => {
    return () => {
      uploadedImagesRef.current.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f3f5f2] text-[#1f2b20]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <Sidebar />

        <main className="w-full">
          <ViewTransition>
          <DashboardViewHeader title="Aggiungi nuovo prodotto" />

          <div className="mx-auto w-full max-w-6xl px-4 py-7 lg:px-8">
            {statusMessage ? (
              <p
                className={clsx(
                  "mb-4 text-xs font-semibold",
                  statusMessage.tone === "success" ? "text-[#2f6b3c]" : "text-red-600"
                )}
              >
                {statusMessage.message}
              </p>
            ) : null}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_270px] lg:items-start">
              <div className="min-w-0 space-y-4">
                <section className="rounded-3xl bg-white p-6 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                  <h2 className="text-lg font-semibold tracking-tight">Informazioni di base</h2>
                  <div className="mt-5 space-y-4">
                    <div>
                      <FieldLabel>Nome prodotto</FieldLabel>
                      <input
                        type="text"
                        className={inputClass}
                        placeholder="Es. Cuffie Wireless Pro"
                        value={productName}
                        onChange={(event) => setProductName(event.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <FieldLabel>SKU</FieldLabel>
                        <input type="text" className={inputClass} placeholder="SKU-001" />
                      </div>
                      <div>
                        <FieldLabel>Barcode / EAN</FieldLabel>
                        <input type="text" className={inputClass} placeholder="8001234567890" />
                      </div>
                    </div>
                    <div>
                      <FieldLabel>Descrizione breve</FieldLabel>
                      <input
                        type="text"
                        className={inputClass}
                        placeholder="Una riga per il catalogo"
                        value={shortDescription}
                        onChange={(event) => setShortDescription(event.target.value)}
                      />
                    </div>
                    <div>
                      <FieldLabel>Descrizione completa</FieldLabel>
                      <textarea
                        rows={4}
                        className="min-h-[120px] w-full resize-y rounded-xl border border-black/10 bg-[#F9FAFB] px-3 py-2.5 text-[12px] text-[#1f2b20] outline-none placeholder:text-[#9aa39a] focus:border-[#214e3a]/35 focus:ring-1 focus:ring-[#214e3a]/20"
                        placeholder="Dettagli, specifiche, cosa riceve il cliente…"
                        value={fullDescription}
                        onChange={(event) => setFullDescription(event.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <FieldLabel>Categoria</FieldLabel>
                        <FormDropdown
                          aria-label="Categoria"
                          placeholder={metaLoading ? "Caricamento..." : "Seleziona categoria"}
                          options={categoryOptions}
                          value={categoryId}
                          onChange={setCategoryId}
                        />
                      </div>
                      <div>
                        <FieldLabel>Marca / Produttore</FieldLabel>
                        <input type="text" className={inputClass} placeholder="Marca" />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl bg-white p-6 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                  <h2 className="text-lg font-semibold tracking-tight">Prezzi e inventario</h2>
                  <div className="mt-5 space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <FieldLabel>Prezzo di vendita</FieldLabel>
                        <input
                          type="text"
                          className={inputClass}
                          placeholder="€ 0,00"
                          value={salePrice}
                          onChange={(event) => setSalePrice(event.target.value)}
                        />
                      </div>
                      <div>
                        <FieldLabel>Costo unitario</FieldLabel>
                        <input type="text" className={inputClass} placeholder="€ 0,00" />
                      </div>
                      <div>
                        <FieldLabel>Quantità in stock</FieldLabel>
                        <input
                          type="number"
                          className={inputClass}
                          placeholder="0"
                          min={0}
                          value={stockQuantity}
                          onChange={(event) => setStockQuantity(event.target.value)}
                        />
                      </div>
                      <div>
                        <FieldLabel>Soglia scorte basse</FieldLabel>
                        <input type="number" className={inputClass} placeholder="5" min={0} />
                      </div>
                    </div>
                    <div>
                      <FieldLabel>Ubicazione magazzino</FieldLabel>
                      <input type="text" className={inputClass} placeholder="Scaffale A-12" />
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-xl bg-[#f6f7f6] px-4 py-3">
                      <div className="flex flex-col gap-1">
                      <span className="text-[12px] font-semibold text-[#1f2b20]">Spedizione disponibile</span>
                      <span className="text-[12px] font-regular text-[#6B7280]">Il prodotto sarà visibile con possibilità di spedizione</span>
                      </div>
                      <Toggle
                        
                        id="ship-toggle"
                        checked={shipping}
                        onChange={setShipping}
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl bg-white p-6 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                  <h2 className="text-lg font-semibold tracking-tight">Dimensioni e spedizione</h2>
                  <div className="mt-5 space-y-4">
                    <div>
                      <FieldLabel>Opzione spedizione</FieldLabel>
                      <FormDropdown
                        aria-label="Opzione spedizione"
                        placeholder={metaLoading ? "Caricamento..." : "Seleziona opzione"}
                        options={shippingOptionsDropdown}
                        value={shippingOptionId}
                        onChange={setShippingOptionId}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div>
                        <FieldLabel>Peso (kg)</FieldLabel>
                        <input type="text" className={inputClass} placeholder="0" />
                      </div>
                      <div>
                        <FieldLabel>Lunghezza (cm)</FieldLabel>
                        <input type="text" className={inputClass} placeholder="0" />
                      </div>
                      <div>
                        <FieldLabel>Larghezza (cm)</FieldLabel>
                        <input type="text" className={inputClass} placeholder="0" />
                      </div>
                      <div>
                        <FieldLabel>Altezza (cm)</FieldLabel>
                        <input type="text" className={inputClass} placeholder="0" />
                      </div>
                    </div>
                    <div>
                      <FieldLabel>Costo spedizione</FieldLabel>
                      <input type="text" className={inputClass} placeholder="€ 0,00" />
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-semibold tracking-tight text-[#111827]">
                      Varianti Prodotto
                    </h2>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="inline-flex h-10 items-center justify-center rounded-lg bg-[#2D4F36] px-5 text-[12px] font-semibold text-white hover:cursor-pointer hover:bg-[#264530]"
                    >
                      Aggiungi variante
                    </button>
                  </div>
                  <div className="mt-6 space-y-4">
                    {variants.map((row) => {
                      const showNameInput = !row.isPreset;
                      return (
                        <div
                          key={row.id}
                          className="rounded-xl border border-[#e8eaed] bg-[#F8F9FA] p-4 sm:p-5"
                        >
                          <div className="flex items-center justify-between gap-3">
                            {showNameInput ? (
                              <input
                                type="text"
                                className="min-w-0 flex-1 border-0 bg-transparent text-[13px] font-semibold text-[#111827] outline-none placeholder:text-[#9aa39a] focus:ring-0"
                                value={row.name}
                                onChange={(e) => updateVariantName(row.id, e.target.value)}
                                placeholder="Nome attributo (es. Materiale)"
                                aria-label="Nome attributo variante"
                              />
                            ) : (
                              <span className="text-[13px] font-semibold text-[#111827]">
                                {row.name}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => removeVariant(row.id)}
                              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#dc2626] hover:cursor-pointer hover:bg-red-50"
                              aria-label={row.name ? `Rimuovi ${row.name}` : "Rimuovi variante"}
                            >
                              <Trash2 className="h-[18px] w-[18px]" strokeWidth={2} />
                            </button>
                          </div>
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            {row.values.map((v) => {
                              const selected = row.selectedValue === v;
                              const squarish = row.chipShape === "squarish";
                              return (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() => setVariantSelected(row.id, v)}
                                  className={clsx(
                                    "inline-flex min-h-9 items-center justify-center bg-white text-[12px] font-semibold text-[#111827] transition-colors hover:cursor-pointer",
                                    squarish
                                      ? "min-w-9 rounded-lg px-2.5 py-2"
                                      : "rounded-full px-4 py-2",
                                    selected
                                      ? "border-2 border-[#7ED321] shadow-[0_0_0_1px_rgba(126,211,33,0.25)]"
                                      : "border border-[#e5e7eb] hover:border-[#d1d5db]",
                                  )}
                                >
                                  {v}
                                </button>
                              );
                            })}
                            <button
                              type="button"
                              onClick={() => addVariantValue(row.id)}
                              className="inline-flex min-h-9 items-center gap-1 rounded-lg border-2 border-dashed border-[#d1d5db] bg-[#f3f4f6] px-3 py-2 text-[12px] font-semibold text-[#6b7280] hover:cursor-pointer hover:border-[#9ca3af] hover:bg-[#eceff1] hover:text-[#374151]"
                            >
                              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                              Aggiungi
                            </button>
                          </div>
                          {row.values.length === 0 && showNameInput ? (
                            <p className="mt-2 text-[11px] text-[#9aa39a]">
                              Aggiungi valori con &quot;+ Aggiungi&quot; o rimuovi questa variante.
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>

              <aside className="min-w-0 space-y-4 lg:sticky lg:top-6">
                <section className="rounded-3xl bg-white p-5 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                  <h2 className="text-base font-semibold tracking-tight">Immagini prodotto</h2>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) appendImageFiles(e.target.files);
                      e.currentTarget.value = "";
                    }}
                  />
                  <div
                    className={clsx(
                      "mt-4 rounded-2xl border-2 border-dashed bg-[#fafafa] px-4 py-8 text-center transition-colors",
                      isDragActive
                        ? "border-[#214e3a]/45 bg-[#f1f6f3]"
                        : "border-black/15",
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
                      if (e.dataTransfer.files?.length) appendImageFiles(e.dataTransfer.files);
                    }}
                  >
                    <Upload className="mx-auto h-8 w-8 text-[#9aa39a]" strokeWidth={1.5} />
                    <p className="mt-2 text-[12px] font-medium text-[#1f2b20]">
                      Trascina le immagini qui
                    </p>
                    <p className="mt-1 text-[11px] text-[#9aa39a]">PNG, JPG fino a 10 MB</p>
                    <button
                      type="button"
                      onClick={openFilePicker}
                      className="mt-4 inline-flex h-7 items-center justify-center rounded-lg border border-black/10 bg-[#2E4F38] px-4 text-xs font-semibold text-[#ffffff] hover:cursor-pointer hover:bg-[#2E4F38]/60"
                    >
                      Sfoglia file
                    </button>
                  </div>
                  <div className="mt-4 rounded-xl border border-[#16A34A]/25 bg-[#ecfce7] px-3 py-2.5 text-[9px] leading-snug text-[#166534]">
                  Carica almeno 3 immagini ad alta risoluzione con sfondo bianco per aumentare le conversioni del 35%
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {uploadedImages.map((img) => (
                      <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl ring-1 ring-black/10">
                        <img
                          src={img.previewUrl}
                          alt={img.name}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeUploadedImage(img.id)}
                          className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-md bg-black/60 text-white opacity-0 transition-opacity hover:cursor-pointer hover:bg-black/75 group-hover:opacity-100"
                          aria-label={`Rimuovi ${img.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <div className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-2 py-1 text-[9px] font-medium text-white">
                          {img.name} • {img.sizeLabel}
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={openFilePicker}
                      className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-black/15 bg-[#fafafa] text-[#9aa39a] hover:cursor-pointer hover:border-[#214e3a]/30 hover:text-[#214e3a]"
                    >
                      <ImagePlus className="h-6 w-6" strokeWidth={1.5} />
                      <span className="text-[10px] font-semibold">Aggiungi</span>
                    </button>
                  </div>
                </section>

                <section className="rounded-3xl bg-white p-5 shadow-[0_12px_28px_rgba(16,24,16,0.06)]">
                  <h2 className="text-base font-semibold tracking-tight">Stato e visibilità</h2>
                  <div className="mt-4 space-y-4">
                    <div>
                      <FieldLabel>Stato</FieldLabel>
                      <FormDropdown
                        aria-label="Stato prodotto"
                        placeholder="Seleziona stato"
                        options={STATUS_OPTIONS}
                        value={productStatus}
                        onChange={setProductStatus}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-[#f6f7f6] px-3 py-3">
                      <span className="text-[12px] font-semibold">Visibile nel catalogo</span>
                      <Toggle
                        id="cat-vis"
                        checked={catalogVisible}
                        onChange={setCatalogVisible}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-[#f6f7f6] px-3 py-3">
                      <span className="text-[12px] font-semibold">Prodotto in evidenza</span>
                      <Toggle id="feat" checked={featured} onChange={setFeatured} />
                    </div>
                  </div>
                </section>
              </aside>
            </div>

            <div className="mt-10 flex justify-end border-t border-black/5 pt-6">
              <button
                type="button"
                disabled={publishing || metaLoading}
                onClick={() => void handlePublish()}
                className="inline-flex h-12 min-w-[180px] items-center justify-center gap-2 rounded-xl bg-[#214e3a] px-8 text-[13px] font-semibold text-white hover:cursor-pointer hover:bg-[#1c4332] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {publishing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Pubblicazione...
                  </>
                ) : (
                  "Pubblica prodotto"
                )}
              </button>
            </div>
          </div>
          </ViewTransition>
        </main>
      </div>
    </div>
  );
}
