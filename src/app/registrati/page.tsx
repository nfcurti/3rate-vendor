/* eslint-disable @next/next/no-img-element */

"use client";

import { motion } from "framer-motion";
import { Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  businessAuthApi,
  saveBusinessSession,
} from "@/lib/business-auth";

export default function RegistratiPage() {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "otp">("details");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState<{
    message: string;
    tone: "error" | "success";
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    if (password !== confirmPassword) {
      setStatus({
        message: "Le password non coincidono.",
        tone: "error",
      });
      return;
    }

    if (!acceptedTerms) {
      setStatus({
        message: "Accetta condizioni d'uso e privacy policy per continuare.",
        tone: "error",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await businessAuthApi.signup(email.trim(), password);
      setStep("otp");
      setStatus({
        message: "Ti abbiamo inviato un codice OTP via email.",
        tone: "success",
      });
    } catch (error) {
      setStatus({
        message:
          error instanceof Error
            ? error.message
            : "Registrazione non riuscita. Riprova.",
        tone: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValidateSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setIsSubmitting(true);

    try {
      const session = await businessAuthApi.validateSignup(
        email.trim(),
        otp.trim()
      );
      saveBusinessSession(session);
      router.push("/dashboard");
    } catch (error) {
      setStatus({
        message:
          error instanceof Error
            ? error.message
            : "Codice non valido. Riprova.",
        tone: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setStatus(null);
    setIsResending(true);

    try {
      await businessAuthApi.signupResendCode(email.trim());
      setStatus({ message: "Codice inviato di nuovo.", tone: "success" });
    } catch (error) {
      setStatus({
        message:
          error instanceof Error
            ? error.message
            : "Invio codice non riuscito. Riprova.",
        tone: "error",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen text-[#1f2b20]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <section className="relative order-last overflow-hidden bg-[#214e3a] text-white lg:order-none">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_10%,rgba(255,255,255,0.10),transparent_55%),radial-gradient(800px_circle_at_70%_20%,rgba(93,190,84,0.18),transparent_55%)]" />
          <div className="relative mx-auto flex h-full w-full max-w-2xl flex-col px-8 py-12 lg:px-14 lg:py-14">
            <div className="flex items-center gap-3">
              <Link href="/" className="hover:cursor-pointer">
                <img src="/brand/logo.svg" alt="3rate" className="h-12 w-auto" />
              </Link>
            </div>

            <div className="mt-12">
              <h1 className="text-4xl font-semibold leading-tight tracking-tight lg:text-5xl">
                Inizia a vendere
                <br />
                con 3Rate
              </h1>
              <p className="mt-5 max-w-xl text-sm text-white/75">
                Crea il tuo account venditore e accedi al pannello per gestire
                prodotti, ordini e pagamenti.
              </p>
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
            <h2 className="text-lg font-semibold">
              {step === "details" ? "Crea account venditore" : "Verifica email"}
            </h2>
            <p className="mt-1 text-xs text-[#6b746c]">
              {step === "details"
                ? "Compila i dati per registrare il tuo negozio."
                : `Inserisci il codice OTP inviato a ${email}.`}
            </p>

            {step === "details" ? (
              <form className="mt-6 space-y-4" onSubmit={handleSignup}>
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-[#6b746c]">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa39a]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="tuo@email.com"
                      required
                      className="h-11 w-full rounded-xl border border-[#e3e8e3] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#5DBE54] focus:ring-4 focus:ring-[#5DBE54]/15"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-[#6b746c]">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa39a]" />
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      className="h-11 w-full rounded-xl border border-[#e3e8e3] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#5DBE54] focus:ring-4 focus:ring-[#5DBE54]/15"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-[#6b746c]">
                    Conferma password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa39a]" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      className="h-11 w-full rounded-xl border border-[#e3e8e3] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#5DBE54] focus:ring-4 focus:ring-[#5DBE54]/15"
                    />
                  </div>
                </div>

                <label className="flex items-start gap-2 text-[10px] text-[#6b746c]">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(event) => setAcceptedTerms(event.target.checked)}
                    className="mt-1 h-3.5 w-3.5 shrink-0 rounded border-[#cfd6cf]"
                  />
                  Accetto le condizioni d&apos;uso e la privacy policy.
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2f5c45] text-sm font-semibold text-white shadow-sm hover:cursor-pointer hover:bg-[#284f3b] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Creazione account..." : "Crea account"}
                </button>
              </form>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={handleValidateSignup}>
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-[#6b746c]">
                    Codice OTP
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    placeholder="123456"
                    required
                    className="h-11 w-full rounded-xl border border-[#e3e8e3] bg-white px-4 text-sm outline-none focus:border-[#5DBE54] focus:ring-4 focus:ring-[#5DBE54]/15"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#2f5c45] text-sm font-semibold text-white shadow-sm hover:cursor-pointer hover:bg-[#284f3b] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Verifica in corso..." : "Verifica account"}
                </button>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isResending}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#e3e8e3] bg-white text-xs font-semibold text-[#1f2b20] hover:cursor-pointer hover:bg-[#f3f5f2] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isResending ? "Invio..." : "Invia di nuovo il codice"}
                </button>
              </form>
            )}

            {status && (
              <p
                className={`mt-4 text-xs font-semibold ${
                  status.tone === "success" ? "text-[#2f6b3c]" : "text-red-600"
                }`}
              >
                {status.message}
              </p>
            )}

            <div className="mt-6 text-center text-[10px] text-[#6b746c]">
              Hai già un account?{" "}
              <Link
                href="/"
                className="font-semibold text-[#2f6b3c] hover:cursor-pointer hover:underline"
              >
                Accedi
              </Link>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
