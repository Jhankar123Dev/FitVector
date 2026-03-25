"""
Standalone jobspy runner — executed as a subprocess by scraper_service.
Reads JSON kwargs from stdin, runs jobspy, writes JSON results to stdout.

Running in a subprocess means if Playwright / Chromium crashes, only this
child process dies — the main uvicorn server process is completely unaffected.
"""
from __future__ import annotations

import json
import sys
import traceback

# ── Use OS certificate store (fixes corporate SSL issues) ────────────────
try:
    import truststore
    truststore.inject_into_ssl()
except ImportError:
    pass

# Suppress InsecureRequestWarning if truststore falls back
try:
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
except Exception:
    pass


# ── Main runner ──────────────────────────────────────────────────────────


def main() -> None:
    try:
        raw = sys.stdin.read()
        kwargs = json.loads(raw)

        site = kwargs.get("site_name", ["?"])
        term = kwargs.get("search_term", "?")
        sys.stderr.write(f"[jobspy_runner] Scraping {site} for '{term}'\n")
        sys.stderr.flush()

        from jobspy import scrape_jobs  # type: ignore[import-untyped]

        df = scrape_jobs(**kwargs)

        if df is None or df.empty:
            sys.stderr.write(f"[jobspy_runner] {site}: 0 results\n")
            sys.stdout.write("[]")
            return

        records = df.to_dict(orient="records")
        sys.stderr.write(f"[jobspy_runner] {site}: {len(records)} results\n")
        sys.stdout.write(json.dumps(records, default=str))

    except Exception as exc:
        sys.stdout.write("[]")
        sys.stderr.write(f"[jobspy_runner] ERROR: {exc}\n")
        sys.stderr.write(traceback.format_exc())
        sys.exit(1)


if __name__ == "__main__":
    main()
