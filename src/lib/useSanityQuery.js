import { useCallback, useEffect, useState } from "react";
import { fetchCached, useFallback } from "./sanity";

/**
 * Fetch GROQ query dari Sanity.
 * status: "loading" | "success" | "error"
 * Jika gagal dan fallback aktif, data lama dipakai (status "success", isFallback true).
 */
export function useSanityQuery(query, { map = (d) => d, fallback } = {}) {
  const [state, setState] = useState({
    status: "loading",
    data: null,
    error: null,
    isFallback: false,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetchCached(query)
      .then((raw) => {
        if (!cancelled) {
          setState({ status: "success", data: map(raw), error: null, isFallback: false });
        }
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("[sanity]", error);
        if (useFallback && fallback !== undefined) {
          console.warn(
            "[sanity] Fetch gagal — menampilkan data lama dari src/data/ (fallback). " +
              "Cek VITE_SANITY_PROJECT_ID, dataset public, dan CORS origin untuk " +
              window.location.origin,
          );
          setState({ status: "success", data: fallback, error, isFallback: true });
        } else {
          setState({ status: "error", data: null, error, isFallback: false });
        }
      });

    return () => {
      cancelled = true;
    };
    // map & fallback dianggap statis per pemakaian
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, attempt]);

  const retry = useCallback(() => {
    setState((s) => ({ ...s, status: "loading", error: null }));
    setAttempt((n) => n + 1);
  }, []);

  return { ...state, retry };
}
