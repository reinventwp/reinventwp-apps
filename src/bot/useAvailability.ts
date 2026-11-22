import { useEffect, useState } from "react";

const TIMEOUT_MS = 4000;

/**
 * Asks Reinvent WP Services once whether the assistant is on (the website, before it shows the assistant; wp-admin
 * passes null and reads `available` from the usage instead). Null until it has answered, then true or false; a
 * timeout or an unreachable Services is false.
 */
export default function useAvailability(statusUrl: string | null, enabled = true): boolean | null {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!statusUrl || !enabled || available !== null) return undefined;
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
  }, [statusUrl, enabled, available]);

  return available;
}
