/* eslint-disable @next/next/no-img-element */

"use client";

import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { businessAuthApi, saveBusinessSession } from "@/lib/business-auth";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<{
    message: string;
    tone: "error" | "success";
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setStatus({
        message: "Inserisci email e password.",
        tone: "error",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const session = await businessAuthApi.login(trimmedEmail, password);
      saveBusinessSession(session);
      router.push("/dashboard");
    } catch (error) {
      setStatus({
        message:
          error instanceof Error
            ? error.message
            : "Accesso non riuscito. Riprova.",
        tone: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen text-[#1f2b20]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <section className="relative order-last overflow-hidden bg-[#214e3a] text-white lg:order-none">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_10%,rgba(255,255,255,0.10),transparent_55%),radial-gradient(800px_circle_at_70%_20%,rgba(93,190,84,0.18),transparent_55%)]" />
          <div className="relative mx-auto flex h-full w-full max-w-2xl flex-col px-8 py-12 lg:px-14 lg:py-14">
            <div className="flex items-center gap-3">
              <img src="/brand/logo.svg" alt="3rate" className="h-12 w-auto" />
            </div>

            <div className="mt-12">
              <h1 className="text-4xl font-semibold leading-tight tracking-tight lg:text-5xl">
                Benvenuto nel tuo
                <br />
                Pannello venditore
              </h1>
              <p className="mt-5 max-w-xl text-sm text-white/75">
                Gestisci il tuo negozio, monitora le vendite e fai crescere il
                tuo business con 3Rate.
              </p>

              <div className="mt-10 space-y-6">
                <div>
                  <div className="text-sm font-semibold">
                    Analytics in tempo reale
                  </div>
                  <div className="mt-1 text-xs text-white/70">
                    Monitora le tue vendite e i guadagni istantaneamente.
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold">
                    Gestione inventario semplice
                  </div>
                  <div className="mt-1 text-xs text-white/70">
                    Aggiungi prodotti con la scansione di QR e barcode.
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold">Supporto dedicato</div>
                  <div className="mt-1 text-xs text-white/70">
                    Il nostro team è sempre pronto ad aiutarti.
                  </div>
                </div>
              </div>

              <div className="mt-14 grid grid-cols-3 gap-6 text-left">
                <div>
                  <div className="text-2xl font-semibold text-[#5DBE54]">
                    3,000+
                  </div>
                  <div className="mt-1 text-[10px] text-white/70">
                    Venditori Attivi
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-[#5DBE54]">
                    €12M+
                  </div>
                  <div className="mt-1 text-[10px] text-white/70">
                    Transazioni
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-[#5DBE54]">
                    4.9/5
                  </div>
                  <div className="mt-1 text-[10px] text-white/70">
                    Rating Medio
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="order-first flex min-h-[min(100dvh,720px)] items-center justify-center bg-[#f3f5f2] px-6 py-10 sm:py-12 lg:order-none lg:min-h-0">
          <motion.div
            className="w-full max-w-[420px] rounded-2xl bg-white p-7 shadow-[0_18px_40px_rgba(16,24,16,0.12)] ring-1 ring-black/5"
            initial={{ opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <h2 className="text-lg font-semibold">Accedi al tuo account</h2>
            <p className="mt-1 text-xs text-[#6b746c]">
              Inserisci le tue credenziali per continuare
            </p>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-[11px] font-semibold text-[#6b746c]"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa39a]" />
                  <input
                    id="email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="tuo@email.com"
                    required
                    className="h-11 w-full rounded-xl border border-[#e3e8e3] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#5DBE54] focus:ring-4 focus:ring-[#5DBE54]/15"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-[11px] font-semibold text-[#6b746c]"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa39a]" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    required
                    className="h-11 w-full rounded-xl border border-[#e3e8e3] bg-white pl-11 pr-11 text-sm outline-none focus:border-[#5DBE54] focus:ring-4 focus:ring-[#5DBE54]/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#9aa39a] hover:cursor-pointer hover:bg-black/5"
                    aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <div className="mt-2 flex flex-col gap-2 text-[10px] text-[#6b746c] sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                  <label className="flex w-fit items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 shrink-0 rounded border-[#cfd6cf]"
                    />
                    Ricordami
                  </label>
                  <Link
                    href="/password-dimenticata"
                    className="w-fit shrink-0 font-semibold text-[#2f6b3c] hover:cursor-pointer hover:underline"
                  >
                    Password dimenticata?
                  </Link>
                </div>
              </div>

              {status && (
                <p
                  className={`text-xs font-semibold ${
                    status.tone === "success" ? "text-[#2f6b3c]" : "text-red-600"
                  }`}
                >
                  {status.message}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2f5c45] text-sm font-semibold text-white shadow-sm hover:cursor-pointer hover:bg-[#284f3b] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Accesso in corso..." : "Accedi"}
                {!isSubmitting && <span aria-hidden>→</span>}
              </button>
            </form>

            <div className="mt-6 text-center text-[10px] text-[#6b746c]">
              Non hai ancora un account?{" "}
              <Link
                href="/registrati"
                className="font-semibold text-[#2f6b3c] hover:cursor-pointer hover:underline"
              >
                Registrati ora
              </Link>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
