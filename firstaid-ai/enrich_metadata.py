"""Enrich every chunk in ChromaDB with seven additional metadata fields.

Detection is purely keyword-based (no API calls). Existing fields
(``category``, ``severity_hint``, ``source``) are preserved; the
following are added:

* ``severity``       — copy of ``severity_hint`` (canonical name for retrieval)
* ``age_group``      — adult / child / infant / all
* ``body_part``      — head / chest / limb / airway / skin / all
* ``action_type``    — immediate / preventive / monitoring
* ``language``       — en / fr / ar / mixed
* ``has_steps``      — bool (numbered procedure)
* ``has_warning``    — bool ("do not" / "avoid" / "ne pas" / "لا")
* ``source_quality`` — 3 (curated/seeds), 2 (filtered datasets), 1 (raw)
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
except (AttributeError, ValueError):  # pragma: no cover
    pass

import chromadb
from chromadb.config import Settings

ROOT = Path(__file__).parent
CHROMA_PATH = ROOT / "chroma_db"
COLLECTION_NAME = "firstaid"

# ---- detection rules ----

AGE_KEYWORDS = {
    "infant": [
        r"\binfant\b", r"\bnewborn\b", r"\bneonat\w*\b", r"\bbaby\b",
        r"\bbébé\b", r"\bbebe\b", r"\bnourrisson\b",
        r"رضيع", r"البيبي", r"وليدي",
    ],
    "child": [
        r"\bchild\b", r"\bchildren\b", r"\btoddler\b", r"\bpediatric\b",
        r"\bp[ae]ediatric\w*\b", r"\bson\b", r"\bdaughter\b", r"\bkid\b",
        r"\benfant\b", r"\bgosse\b", r"\bgarçon\b", r"\bfille\b",
        r"طفل", r"أطفال", r"ابني", r"ابنتي", r"بنتي",
    ],
    "elderly": [
        r"\belder(ly|s)?\b", r"\bgeriatric\b", r"\baged\b",
        r"\bpersonne agée\b", r"\bgrand-(père|mère)\b",
        r"كبار السن", r"المسن",
    ],
    "adult": [
        r"\badult\b", r"\bman\b", r"\bwoman\b", r"\bfather\b", r"\bmother\b",
        r"\bhomme\b", r"\bfemme\b",
        r"بالغ", r"رجل", r"امرأة",
    ],
}
AGE_PRIORITY = ("infant", "child", "elderly", "adult")  # rule precedence

BODY_KEYWORDS = {
    "head": [
        r"\bhead\b", r"\bbrain\b", r"\bskull\b", r"\bface\b", r"\bscalp\b",
        r"\bcrâne\b", r"\bcerveau\b", r"\btête\b", r"\bvisage\b",
        r"رأس", r"وجه", r"دماغ",
    ],
    "chest": [
        r"\bchest\b", r"\bthorax\b", r"\bheart\b", r"\bcardiac\b", r"\bsternum\b",
        r"\bcoeur\b", r"\bthorax\b", r"\bpoitrine\b",
        r"صدر", r"قلب",
    ],
    "limb": [
        r"\barm\b", r"\bhand\b", r"\bfinger\b", r"\bleg\b", r"\bfoot\b",
        r"\bankle\b", r"\bknee\b", r"\bwrist\b", r"\belbow\b", r"\bshoulder\b",
        r"\bbras\b", r"\bmain\b", r"\bdoigt\b", r"\bjambe\b", r"\bpied\b",
        r"\bcheville\b", r"\bgenou\b",
        r"يد", r"رجل", r"ذراع", r"إصبع", r"ساق",
    ],
    "airway": [
        r"\bairway\b", r"\bthroat\b", r"\btrachea\b", r"\blung\b",
        r"\bbreath\w*\b", r"\bchok\w+\b",
        r"\bvoies aériennes\b", r"\bgorge\b", r"\bpoumons?\b",
        r"مجرى الهواء", r"حلق", r"رئة", r"تنفس",
    ],
    "skin": [
        r"\bskin\b", r"\bderm\w*\b", r"\bcutaneous\b", r"\brash\b",
        r"\bburn\b", r"\bblister\b",
        r"\bpeau\b", r"\bbrûlure\b", r"\brougeur\b",
        r"جلد", r"بشرة", r"حرق", r"طفح",
    ],
}

IMMEDIATE_RE = re.compile(
    r"\b(immediately|right away|at once|call|press|apply|"
    r"start cpr|begin|stop the bleeding|"
    r"immédiatement|tout de suite|appelez|pressez|"
    r"فوراً|بالعجلة|اتصل|اضغط)\b",
    re.IGNORECASE,
)
MONITORING_RE = re.compile(
    r"\b(monitor|watch|observe|check|surveill\w*|surveiller|surveille|"
    r"keep an eye|راقب|تحقق)\b",
    re.IGNORECASE,
)
PREVENTIVE_RE = re.compile(
    r"\b(prevent|avoid|reduce risk|prophylax\w*|prévent\w*|éviter|"
    r"لتجنب|للوقاية)\b",
    re.IGNORECASE,
)

STEP_REGEXES = [
    re.compile(r"(?:(?:^|\n)\s*\d+\.\s)"),
    re.compile(r"(?:(?:^|\n)\s*\d+\)\s)"),
    re.compile(r"\bStep\s*\d+[:.\)]", re.IGNORECASE),
    re.compile(r"\bÉtape\s*\d+", re.IGNORECASE),
    re.compile(r"أولا|ثانيا|ثالثا"),
]
WARNING_RE = re.compile(
    r"\b(do not|don'?t|never|avoid|"
    r"ne pas|évite[zr]?|n'utilisez pas|"
    r"لا تستخدم|لا تطبق|لا تحاول|لا تحرك|لا تعطه|لا تدلك|لا تدعه|لا تضع)\b",
    re.IGNORECASE,
)
ARABIC_RANGE = re.compile(r"[؀-ۿ]")
FRENCH_MARKERS = re.compile(
    r"(é|è|ê|à|ç|ù|que faire|j'ai|comment soign|brulure|bébé|enfant|"
    r"saignement|voies aériennes|secours)",
    re.IGNORECASE,
)


def detect_language(text: str) -> str:
    if not text:
        return "en"
    has_ar = bool(ARABIC_RANGE.search(text))
    has_fr = bool(FRENCH_MARKERS.search(text.lower()))
    has_en = bool(re.search(r"[a-z]", text, re.IGNORECASE))
    flags = sum((has_ar, has_fr, has_en))
    if flags >= 2:
        # Mixed only if at least two scripts contribute meaningfully.
        if has_ar:
            ar_chars = sum(1 for c in text if "؀" <= c <= "ۿ")
            if ar_chars > len(text) * 0.2:
                return "mixed" if has_en else "ar"
        if has_fr and has_en:
            return "mixed"
    if has_ar:
        return "ar"
    if has_fr:
        return "fr"
    return "en"


def detect_age_group(text: str) -> str:
    if not text:
        return "all"
    lowered = text.lower()
    for label in AGE_PRIORITY:
        for pat in AGE_KEYWORDS[label]:
            if re.search(pat, lowered) or re.search(pat, text):
                return label
    return "all"


def detect_body_part(text: str) -> str:
    if not text:
        return "all"
    lowered = text.lower()
    for label, pats in BODY_KEYWORDS.items():
        for pat in pats:
            if re.search(pat, lowered) or re.search(pat, text):
                return label
    return "all"


def detect_action_type(text: str) -> str:
    if not text:
        return "monitoring"
    if IMMEDIATE_RE.search(text):
        return "immediate"
    if MONITORING_RE.search(text):
        return "monitoring"
    if PREVENTIVE_RE.search(text):
        return "preventive"
    return "immediate"


def detect_has_steps(text: str) -> bool:
    hits = sum(len(r.findall(text or "")) for r in STEP_REGEXES)
    return hits >= 2


def detect_has_warning(text: str) -> bool:
    return bool(WARNING_RE.search(text or ""))


def detect_source_quality(source: str) -> int:
    s = (source or "").lower()
    if s.startswith("curated/"):
        return 3
    if "medmcqa" in s or "pubmedqa" in s or "med_qa" in s or "medtext" in s \
            or "medqa-usmle" in s or "chatdoctor" in s or "medical-embeddings" in s:
        return 2
    return 1


def main() -> None:
    print(f"== Metadata enrichment ==")
    client = chromadb.PersistentClient(
        path=str(CHROMA_PATH),
        settings=Settings(anonymized_telemetry=False, allow_reset=True),
    )
    collection = client.get_collection(COLLECTION_NAME)
    total = collection.count()
    print(f"   loaded {total} chunks")
    sys.stdout.flush()

    offset = 0
    batch_size = 1000
    coverage: dict[str, int] = {
        "age_group": 0, "body_part": 0, "action_type": 0,
        "language": 0, "has_steps": 0, "has_warning": 0,
        "source_quality": 0, "severity": 0, "category": 0,
    }
    missing_required = 0
    by_lang: dict[str, int] = {}
    by_age: dict[str, int] = {}
    by_body: dict[str, int] = {}
    by_quality: dict[int, int] = {}

    while offset < total:
        res = collection.get(
            limit=batch_size, offset=offset,
            include=["documents", "metadatas"],
        )
        ids = res.get("ids") or []
        if not ids:
            break
        docs = res.get("documents") or []
        metas = res.get("metadatas") or []

        new_metas: list[dict] = []
        for doc, meta in zip(docs, metas):
            meta = dict(meta or {})
            doc = doc or ""

            # Enrichment.
            sev = meta.get("severity_hint") or meta.get("severity") or "standard"
            meta["severity_hint"] = sev
            meta["severity"] = sev

            ag = detect_age_group(doc)
            bp = detect_body_part(doc)
            ac = detect_action_type(doc)
            lg = detect_language(doc)
            hs = detect_has_steps(doc)
            hw = detect_has_warning(doc)
            sq = detect_source_quality(meta.get("source") or "")

            meta.update(
                {
                    "age_group": ag,
                    "body_part": bp,
                    "action_type": ac,
                    "language": lg,
                    "has_steps": bool(hs),
                    "has_warning": bool(hw),
                    "source_quality": int(sq),
                }
            )

            # Coverage tracking.
            for k in ("severity", "category"):
                if meta.get(k):
                    coverage[k] += 1
                else:
                    missing_required += 1
            for k in ("age_group", "body_part", "action_type",
                      "language", "source_quality"):
                if meta.get(k) is not None:
                    coverage[k] += 1
            # bools always populated, count True only as "has X".
            if meta["has_steps"]:
                coverage["has_steps"] += 1
            if meta["has_warning"]:
                coverage["has_warning"] += 1

            by_lang[lg] = by_lang.get(lg, 0) + 1
            by_age[ag] = by_age.get(ag, 0) + 1
            by_body[bp] = by_body.get(bp, 0) + 1
            by_quality[sq] = by_quality.get(sq, 0) + 1

            new_metas.append(meta)

        # Push the enriched metadata back.
        collection.update(ids=ids, metadatas=new_metas)
        offset += len(ids)
        print(f"   processed {offset}/{total}")
        sys.stdout.flush()

    print(f"\n-- coverage report --")
    for field, n in coverage.items():
        pct = 100.0 * n / max(1, total)
        print(f"   {field:18s} {n:>6d}  ({pct:5.1f}%)")
    print(f"   chunks missing required metadata: {missing_required}")

    print("\n-- distribution --")
    print(f"  language:       {sorted(by_lang.items(), key=lambda x: -x[1])}")
    print(f"  age_group:      {sorted(by_age.items(), key=lambda x: -x[1])}")
    print(f"  body_part:      {sorted(by_body.items(), key=lambda x: -x[1])}")
    print(f"  source_quality: {sorted(by_quality.items(), key=lambda x: x[0])}")

    # Verify required fields populated.
    print(f"\n-- verification --")
    print(f"  category present : {coverage['category']} / {total}")
    print(f"  severity present : {coverage['severity']} / {total}")
    assert coverage["category"] == total, "Some chunks missing category!"
    assert coverage["severity"] == total, "Some chunks missing severity!"
    print(f"  OK — all chunks have category and severity")


if __name__ == "__main__":
    main()
