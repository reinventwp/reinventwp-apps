import { useEffect, useState } from "react";

const TIMEOUT_MS = 4000;

/**
 * Asks Reinvent WP Services once whether the assistant is on. False until it answers yes,
 * so the field never flashes when it's off or Services can't be reached. Null: no assistant
 * on this page (a hub built before the assistant).
 */
export default function useAvailability(statusUrl: string | null): boolean {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (!statusUrl) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    fetch(statusUrl, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => setAvailable(body?.data?.available === true))
      .catch(() => setAvailable(false))
      .finally(() => clearTimeout(timer));
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [statusUrl]);

  return available;
}
