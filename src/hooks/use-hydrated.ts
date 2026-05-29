import { useEffect, useState } from "react";

/** Returns true once mounted on the client. Avoids SSR/localStorage hydration mismatch. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
