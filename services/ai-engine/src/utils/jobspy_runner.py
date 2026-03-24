"""
Standalone jobspy runner — executed as a subprocess by scraper_service.
Reads JSON kwargs from stdin, runs jobspy, writes JSON results to stdout.

Running in a subprocess means if Playwright / Chromium crashes, only this
child process dies — the main uvicorn server process is completely unaffected.
"""
from __future__ import annotations

import json
import os
import ssl
import sys
import traceback

# ── Aggressively disable SSL verification at every level ─────────────────
# This subprocess is isolated — safe to do this here.
os.environ["PYTHONHTTPSVERIFY"] = "0"
os.environ["REQUESTS_CA_BUNDLE"] = ""
os.environ["CURL_CA_BUNDLE"] = ""

# Patch ssl module — this is the deepest level
_orig_create_default_context = ssl.create_default_context


def _no_verify_context(*args, **kwargs):  # type: ignore[no-untyped-def]
    ctx = _orig_create_default_context(*args, **kwargs)
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


ssl.create_default_context = _no_verify_context  # type: ignore[assignment]
ssl._create_default_https_context = _no_verify_context  # type: ignore[assignment]

# Patch urllib3's context creator (where the actual TLS handshake context is made)
try:
    import urllib3.util.ssl_ as _urllib3_ssl

    _orig_urllib3_ctx = _urllib3_ssl.create_urllib3_context

    def _insecure_urllib3_context(*args, **kwargs):  # type: ignore[no-untyped-def]
        ctx = _orig_urllib3_ctx(*args, **kwargs)
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        return ctx

    _urllib3_ssl.create_urllib3_context = _insecure_urllib3_context

    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
except Exception:
    pass

# Also patch requests.Session.send to pass verify=False
import requests  # noqa: E402

_original_send = requests.Session.send


def _patched_send(self: requests.Session, *args, **kwargs):  # type: ignore[no-untyped-def]
    kwargs["verify"] = False
    return _original_send(self, *args, **kwargs)


requests.Session.send = _patched_send  # type: ignore[method-assign]


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
