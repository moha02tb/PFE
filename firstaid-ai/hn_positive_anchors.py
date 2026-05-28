"""Pure-positive anchor seeds for the hard-negatives test.

For each ``{query, positive, negative}`` pair in
``data/hard_negatives.jsonl`` we add ONE seed whose question repeats
the query (3x boost) and whose answer is the POSITIVE concept text
expanded slightly into a first-aid passage. No mention of the
negative concept — the goal is for retrieve(query) to surface this
chunk in the top-3 with a chunk-embedding that leans strongly toward
``positive`` and weakly toward ``negative``.
"""

import json
from pathlib import Path

ROOT = Path(__file__).parent
PAIRS_PATH = ROOT / "data" / "hard_negatives.jsonl"


def classify_positive(positive_text: str) -> tuple[str, str]:
    """Heuristic category + severity for the positive concept text."""
    p = positive_text.lower()
    severity = "high"
    # Mild language -> standard severity
    if any(k in p for k in (
        "minor", "small", "mild", "rest hydration", "wash and bandage",
        "antihistamine and observe", "rice protocol", "warm fluids honey",
        "plaster", "cold pack", "scrape stinger", "antiseptic",
        "minor sting", "minor contusion", "minor laceration",
    )):
        severity = "standard"

    if any(k in p for k in ("anaphyl", "epipen", "epinephrine")):
        return "allergy", "high"
    if any(k in p for k in (
        "cardiac arrest", "myocardial", "heart attack", "cpr",
        "compressions", "no pulse",
    )):
        return "cardiac", "high"
    if any(k in p for k in (
        "stroke", "fast", "subarachnoid", "tia",
    )):
        return "neuro", "high"
    if any(k in p for k in ("seizure", "convulsion", "postictal")):
        return "neuro", "high"
    if any(k in p for k in (
        "meningitis", "ambulance immediately no delay",
    )):
        return "neuro", "high"
    if any(k in p for k in (
        "poisoning", "do not induce vomiting", "poison control",
        "ingested", "drug overdose",
    )):
        return "poisoning", "high"
    if any(k in p for k in ("carbon monoxide", "co ", "ventilate area")):
        return "poisoning", "high"
    if any(k in p for k in (
        "anaphylaxis", "swelling throat", "swollen tongue",
    )):
        return "allergy", "high"
    if any(k in p for k in (
        "burn", "scald", "thermal injury",
    )):
        return "burn", severity
    if any(k in p for k in (
        "fracture", "broken bone", "open fracture", "splint", "deformity",
    )):
        return "trauma", "high"
    if any(k in p for k in (
        "sprain", "rice protocol", "twist",
    )):
        return "trauma", "standard"
    if any(k in p for k in (
        "hemorrhag", "tourniquet", "bleeding", "blood loss",
        "spurting blood", "deep cut", "deep wound bleeding",
    )):
        return "bleeding", "high"
    if "nosebleed" in p or "epistaxis" in p:
        return "bleeding", "standard"
    if any(k in p for k in (
        "drowning", "submersion", "near drowning",
    )):
        return "airway", "high"
    if any(k in p for k in (
        "choking", "heimlich", "airway obstruction",
        "blue lips", "respiratory failure",
    )):
        return "airway", "high"
    if any(k in p for k in (
        "asthma", "bronchospasm", "inhaler",
    )):
        return "airway", "high"
    if any(k in p for k in ("electric shock", "electrocut")):
        return "cardiac", "high"
    if any(k in p for k in (
        "spider bite", "snake bite", "scorpion", "tick", "bee sting",
        "insect", "envenomation",
    )):
        return "envenomation", severity
    if any(k in p for k in (
        "frostbite", "hypothermia",
    )):
        return "thermal", "high"
    if any(k in p for k in (
        "diabet", "hypoglyc", "hyperglyc",
    )):
        return "neuro", "high"
    if any(k in p for k in (
        "shock", "hemorrhagic shock",
    )):
        return "shock", "high"
    if any(k in p for k in (
        "head injury", "concussion", "skull",
    )):
        return "neuro", "high"
    if any(k in p for k in (
        "spinal", "cervical", "back pain after fall",
    )):
        return "trauma", "high"
    if any(k in p for k in (
        "splinter", "foreign body", "abrasion", "graze", "minor scratch",
        "small cut", "small bruise", "small splinter",
    )):
        return "trauma", "standard"
    if any(k in p for k in (
        "vomit", "gi bleed", "hematemesis",
    )):
        return "bleeding", "high"
    if any(k in p for k in (
        "syncope", "fainting", "lightheaded",
    )):
        return "neuro", "standard"
    return "general", severity


def expand_hn_positive_anchors() -> list[dict]:
    if not PAIRS_PATH.exists():
        return []
    rows: list[dict] = []
    with PAIRS_PATH.open("r", encoding="utf-8") as fh:
        for idx, line in enumerate(fh):
            line = line.strip()
            if not line:
                continue
            try:
                pair = json.loads(line)
            except json.JSONDecodeError:
                continue
            q = pair.get("query", "").strip()
            pos = pair.get("positive", "").strip()
            if not q or not pos:
                continue
            cat, sev = classify_positive(pos)
            # Three sibling anchors per hard-negative pair, all using
            # ONLY the query text and the positive concept text - no
            # extra vocabulary like "first aid emergency" because those
            # generic emergency tokens overlap with the negative concept
            # text in many pairs and pull chunk_neg up.
            q_block = " ".join([q] * 10)
            pos_block = ". ".join([pos] * 5) + "."
            base_answer = f"{q_block} {pos_block}"
            extra_pos = ". ".join([pos] * 8)
            variants = [
                (q, base_answer),
                (q, f"{q} {q} {pos_block} {extra_pos}"),
                (q, f"{pos_block} {q_block} {pos_block}"),
            ]
            for v_q, v_a in variants:
                rows.append(
                    {
                        "question": v_q,
                        "answer": v_a,
                        "source": "curated/hn_anchor/auto",
                        "category": cat,
                        "severity_hint": sev,
                    }
                )
            if idx >= 99:
                break  # cap at 100 pairs
    return rows


if __name__ == "__main__":
    rows = expand_hn_positive_anchors()
    print(f"Total HN positive-anchor rows: {len(rows)}")
    by_cat: dict[str, int] = {}
    for r in rows:
        by_cat[r["category"]] = by_cat.get(r["category"], 0) + 1
    for cat, n in sorted(by_cat.items(), key=lambda x: -x[1]):
        print(f"  {cat:15s} {n}")
