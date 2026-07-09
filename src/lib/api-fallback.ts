export async function withApiFallback<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

export function statusAlertClass(tone: "error" | "success") {
  return tone === "success"
    ? "rounded-xl border border-[#bbf7d0] bg-[#ecf8eb] px-4 py-3 text-[12px] font-semibold text-[#2d4f36]"
    : "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-semibold text-red-700";
}
