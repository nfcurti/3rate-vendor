/* eslint-disable @next/next/no-img-element */

"use client";

import { motion } from "framer-motion";
import { Mail } from "lucide-react";

export default function PasswordDimenticataPage() {
  return (
    <div className="min-h-screen text-[#1f2b20]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <section className="relative order-last overflow-hidden bg-[#214e3a] text-white lg:order-none">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_10%,rgba(255,255,255,0.10),transparent_55%),radial-gradient(800px_circle_at_70%_20%,rgba(93,190,84,0.18),transparent_55%)]" />
          <div className="relative mx-auto flex h-full w-full max-w-2xl flex-col px-8 py-12 lg:px-14 lg:py-14">
            <div className="flex items-center gap-3">
              <a href="/" className="hover:cursor-pointer">
                <img src="/brand/logo.svg" alt="3rate" className="h-12 w-auto" />
              </a>
            </div>

            <div className="mt-12">
              <h1 className="text-4xl font-semibold leading-tight tracking-tight lg:text-5xl">
                Recupera il tuo
                <br />
                accesso
              </h1>
              <p className="mt-5 max-w-xl text-sm text-white/75">
                Ti invieremo un link per reimpostare la password e rientrare nel
                pannello venditore.
              </p>

              <div className="mt-10 space-y-6">
                <div>
                  <div className="text-sm font-semibold">Sicurezza</div>
                  <div className="mt-1 text-xs text-white/70">
                    Se l&apos;email è registrata, riceverai istruzioni in pochi
                    minuti.
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold">Supporto</div>
                  <div className="mt-1 text-xs text-white/70">
                    Se non trovi l&apos;email, controlla anche nello spam.
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
            <h2 className="text-lg font-semibold">Password dimenticata</h2>
            <p className="mt-1 text-xs text-[#6b746c]">
              Inserisci la tua email per ricevere il link di reimpostazione
            </p>

            <form className="mt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-[#6b746c]">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa39a]" />
                  <input
                    type="email"
                    placeholder="tuo@email.com"
                    className="h-11 w-full rounded-xl border border-[#e3e8e3] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#5DBE54] focus:ring-4 focus:ring-[#5DBE54]/15"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2f5c45] text-sm font-semibold text-white shadow-sm hover:cursor-pointer hover:bg-[#284f3b] active:translate-y-px"
              >
                Invia link
                <span aria-hidden>→</span>
              </button>
            </form>

            <div className="mt-6 text-center text-[10px] text-[#6b746c]">
              Ti sei ricordato la password?{" "}
              <a
                href="/"
                className="font-semibold text-[#2f6b3c] hover:cursor-pointer hover:underline"
              >
                Torna al login
              </a>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}

