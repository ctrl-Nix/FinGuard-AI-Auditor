#!/usr/bin/env python3
"""
FinGuard CLI
=============
Terminal interface for quick panic checks and full audits.

Usage:
  # Panic check a message
  python cli.py panic "Your SBI account will be blocked. Share OTP now."

  # Panic check from stdin
  echo "Suspicious message" | python cli.py panic -

  # Panic check a file
  python cli.py panic --file message.txt

  # Full 3-layer audit of a text file
  python cli.py audit --file contract.txt --api-key YOUR_KEY

  # Batch panic check multiple messages from a file (one per line)
  python cli.py batch --file messages.txt

  # Run the API server
  python cli.py serve --port 8000
"""

from __future__ import annotations
import argparse
import json
import os
import sys
import time


# ── Colour helpers (ANSI, degrades gracefully on Windows) ─────────────────────

_COLOURS = {
    "red":    "\033[91m",
    "yellow": "\033[93m",
    "green":  "\033[92m",
    "cyan":   "\033[96m",
    "bold":   "\033[1m",
    "dim":    "\033[2m",
    "reset":  "\033[0m",
}

def _c(text: str, *colours: str) -> str:
    if not sys.stdout.isatty():
        return text
    codes = "".join(_COLOURS.get(c, "") for c in colours)
    return f"{codes}{text}{_COLOURS['reset']}"


def _verdict_colour(verdict: str) -> str:
    return {"SCAM": "red", "SUSPICIOUS": "yellow", "SAFE": "green"}.get(verdict, "reset")


def _bar(confidence: int, width: int = 40) -> str:
    filled = round(confidence / 100 * width)
    empty  = width - filled
    return f"[{'█' * filled}{'░' * empty}] {confidence}%"


# ── Panic check output ────────────────────────────────────────────────────────

def _print_panic_result(result, text_preview: str = "", json_out: bool = False) -> None:
    from finguard.engine.panic_engine import PanicResult

    if json_out:
        print(json.dumps({
            "verdict":    result.verdict,
            "confidence": result.confidence,
            "reasons":    result.reasons,
            "what_to_do": result.what_to_do,
            "latency_ms": result.latency_ms,
            "llm_enriched": result.llm_enriched,
        }, indent=2))
        return

    vc = _verdict_colour(result.verdict)
    print()
    print(_c(f"  {'─' * 54}", "dim"))
    if text_preview:
        preview = text_preview[:80].replace("\n", " ")
        print(_c(f"  Message: \"{preview}{'...' if len(text_preview) > 80 else ''}\"", "dim"))
    print()
    print(_c(f"  {result.verdict}", vc, "bold") + _c(f"  ({result.confidence}% confidence)", "dim"))
    print(_c(f"  {_bar(result.confidence)}", vc))
    print()

    if result.reasons:
        print(_c("  Why flagged:", "bold"))
        for r in result.reasons:
            print(_c(f"    ⚡ {r}", "dim"))
        print()

    print(_c("  What to do:", "bold"))
    for action in result.what_to_do:
        print(f"    {action}")
    print()

    meta = f"  ⚡ {result.latency_ms}ms"
    if result.llm_enriched:
        meta += " · 🤖 AI-enhanced"
    print(_c(meta, "dim"))
    print(_c(f"  {'─' * 54}", "dim"))
    print()


# ── Commands ──────────────────────────────────────────────────────────────────

def cmd_panic(args) -> int:
    """Run panic check on a single message."""
    from finguard.engine.panic_engine import run_panic_check, enrich_with_llm

    # Resolve text
    if args.file:
        with open(args.file, encoding="utf-8") as f:
            text = f.read()
    elif args.text == "-":
        text = sys.stdin.read()
    else:
        text = args.text

    if not text.strip():
        print(_c("Error: empty input", "red"), file=sys.stderr)
        return 1

    result = run_panic_check(text)

    if args.llm:
        api_key = args.api_key or os.environ.get("GEMINI_API_KEY", "")
        if api_key:
            result = enrich_with_llm(result, text, api_key)
        else:
            print(_c("Warning: --llm requested but no API key found. Set GEMINI_API_KEY or use --api-key.", "yellow"), file=sys.stderr)

    _print_panic_result(result, text_preview=text, json_out=args.json)

    # Exit code: 2=SCAM, 1=SUSPICIOUS, 0=SAFE (useful for shell scripting)
    return {"SCAM": 2, "SUSPICIOUS": 1, "SAFE": 0}.get(result.verdict, 0)


def cmd_batch(args) -> int:
    """Batch panic check — one message per line in a file."""
    from finguard.engine.panic_engine import run_panic_check

    source = args.file if args.file else "-"
    if source == "-":
        lines = sys.stdin.read().splitlines()
    else:
        with open(source, encoding="utf-8") as f:
            lines = f.readlines()

    lines = [l.strip() for l in lines if l.strip()]
    if not lines:
        print(_c("No messages to check.", "yellow"))
        return 0

    results = []
    scam_count = suspicious_count = safe_count = 0

    print(_c(f"\n  Scanning {len(lines)} messages...\n", "cyan"))

    for i, line in enumerate(lines, 1):
        result = run_panic_check(line)
        results.append(result)
        vc = _verdict_colour(result.verdict)
        preview = line[:60] + ("..." if len(line) > 60 else "")
        print(
            _c(f"  [{i:3}] ", "dim") +
            _c(f"{result.verdict:10}", vc, "bold") +
            _c(f" {result.confidence:3}%  ", "dim") +
            f'"{preview}"'
        )
        if result.verdict == "SCAM":        scam_count += 1
        elif result.verdict == "SUSPICIOUS": suspicious_count += 1
        else:                                safe_count += 1

    print()
    print(_c("  ─── Summary ───────────────────────────────────────", "dim"))
    print(_c(f"  🚨 SCAM:       {scam_count}", "red"))
    print(_c(f"  ⚠️  SUSPICIOUS:  {suspicious_count}", "yellow"))
    print(_c(f"  ✅ SAFE:        {safe_count}", "green"))
    print()

    if args.json:
        output = [
            {"message": line, "verdict": r.verdict, "confidence": r.confidence, "reasons": r.reasons}
            for line, r in zip(lines, results)
        ]
        print(json.dumps(output, indent=2))

    return 2 if scam_count > 0 else (1 if suspicious_count > 0 else 0)


def cmd_audit(args) -> int:
    """Full 3-layer audit of a document."""
    from finguard.engine.pipeline import run_audit

    if args.file:
        # Try PDF first
        if args.file.lower().endswith(".pdf"):
            try:
                import pypdf
                reader = pypdf.PdfReader(args.file)
                text = "".join(p.extract_text() or "" for p in reader.pages)
            except Exception as e:
                print(_c(f"Error reading PDF: {e}", "red"), file=sys.stderr)
                return 1
        else:
            with open(args.file, encoding="utf-8") as f:
                text = f.read()
    elif args.text:
        text = args.text
    else:
        text = sys.stdin.read()

    if not text.strip():
        print(_c("Error: empty input", "red"), file=sys.stderr)
        return 1

    api_key = args.api_key or os.environ.get("GEMINI_API_KEY", "")
    skip_llm = not api_key or args.no_llm

    print(_c("\n  Running 3-layer audit...", "cyan"))
    t0 = time.perf_counter()

    result = run_audit(text=text, api_key=api_key, skip_llm=skip_llm)

    elapsed = round((time.perf_counter() - t0) * 1000)
    risk = result["risk_report"]
    llm  = result.get("llm_explanation")

    if args.json:
        safe_result = {
            "risk_report": risk,
            "llm_explanation": llm,
            "total_pipeline_seconds": result["total_pipeline_seconds"],
            "error": result.get("error"),
        }
        print(json.dumps(safe_result, indent=2, default=str))
        return 0

    vc = _verdict_colour("SCAM" if risk["score"] >= 65 else ("SUSPICIOUS" if risk["score"] >= 30 else "SAFE"))
    print()
    print(_c(f"  {'─' * 54}", "dim"))
    print(_c(f"  {risk['label']}", vc, "bold") + _c(f"  ({risk['score']}/100)", "dim"))
    print(_c(f"  {_bar(risk['score'])}", vc))
    print(_c(f"  Flags: {risk['total_matches']}  High={risk['severity_counts']['high']}  Med={risk['severity_counts']['medium']}  Low={risk['severity_counts']['low']}", "dim"))
    print()

    if risk["breakdown"]:
        print(_c("  Detected issues:", "bold"))
        for item in risk["breakdown"][:8]:
            sev_c = {"high": "red", "medium": "yellow", "low": "cyan"}.get(item["severity"], "reset")
            print(
                _c(f"    [{item['severity'].upper():6}] ", sev_c) +
                _c(f"{item['rule_type'].replace('_',' ').title():25}", "bold") +
                _c(f" | {item['matched_text'][:40]}", "dim")
            )
        if len(risk["breakdown"]) > 8:
            print(_c(f"    ... and {len(risk['breakdown']) - 8} more", "dim"))
        print()

    if llm:
        print(_c("  Executive Summary:", "bold"))
        for line in llm["executive_summary"].split(". "):
            if line.strip():
                print(f"    {line.strip()}.")
        print()
        print(_c("  Actions:", "bold"))
        for line in llm["recommended_actions"].splitlines():
            if line.strip():
                print(f"    {line.strip()}")
        print()

    if result.get("error"):
        print(_c(f"  Notice: {result['error']}", "yellow"))

    print(_c(f"  ⚡ {elapsed}ms total", "dim"))
    print(_c(f"  {'─' * 54}", "dim"))
    print()

    return 2 if risk["score"] >= 65 else (1 if risk["score"] >= 30 else 0)


def cmd_serve(args) -> int:
    """Start the FastAPI server."""
    try:
        import uvicorn
    except ImportError:
        print(_c("Error: uvicorn not installed. Run: pip install uvicorn", "red"), file=sys.stderr)
        return 1

    print(_c(f"\n  Starting FinGuard API on http://0.0.0.0:{args.port}", "cyan"))
    print(_c(f"  Docs: http://localhost:{args.port}/docs\n", "dim"))
    import uvicorn
    uvicorn.run(
        "finguard.api.panic_api:app",
        host="0.0.0.0",
        port=args.port,
        reload=args.reload,
    )
    return 0


# ── Argument parser ───────────────────────────────────────────────────────────

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="finguard",
        description="FinGuard 3.0 — Financial Scam Detection CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python cli.py panic "Your account is blocked. Share OTP now."
  python cli.py panic --file sms.txt --llm --api-key YOUR_KEY
  echo "Suspicious message" | python cli.py panic -
  python cli.py batch --file messages.txt
  python cli.py audit --file contract.txt --api-key YOUR_KEY
  python cli.py audit --file contract.pdf --no-llm
  python cli.py serve --port 8000
        """
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # ── panic ──
    p = sub.add_parser("panic", help="Ultra-fast single-message scam check")
    p.add_argument("text", nargs="?", default="-",
                   help='Message text, or "-" to read from stdin')
    p.add_argument("--file", "-f", help="Read message from file")
    p.add_argument("--llm", action="store_true", help="Enable AI enrichment (needs API key)")
    p.add_argument("--api-key", default="", help="Gemini API key (or set GEMINI_API_KEY env var)")
    p.add_argument("--json", action="store_true", help="Output raw JSON")

    # ── batch ──
    b = sub.add_parser("batch", help="Batch check multiple messages (one per line)")
    b.add_argument("--file", "-f", help="File with one message per line (default: stdin)")
    b.add_argument("--json", action="store_true", help="Output JSON array")

    # ── audit ──
    a = sub.add_parser("audit", help="Full 3-layer forensic document audit")
    a.add_argument("text", nargs="?", default=None, help="Text to audit")
    a.add_argument("--file", "-f", help="File to audit (.txt or .pdf)")
    a.add_argument("--api-key", default="", help="Gemini API key")
    a.add_argument("--no-llm", action="store_true", help="Skip LLM layer (rules only)")
    a.add_argument("--json", action="store_true", help="Output raw JSON")

    # ── serve ──
    s = sub.add_parser("serve", help="Start the FastAPI REST server")
    s.add_argument("--port", type=int, default=8000, help="Port (default: 8000)")
    s.add_argument("--reload", action="store_true", help="Enable hot-reload (dev mode)")

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    dispatch = {
        "panic": cmd_panic,
        "batch": cmd_batch,
        "audit": cmd_audit,
        "serve": cmd_serve,
    }
    return dispatch[args.command](args)


if __name__ == "__main__":
    sys.exit(main())
