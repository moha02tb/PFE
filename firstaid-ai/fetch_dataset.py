"""Fetch first-aid Q&A entries from public Hugging Face datasets.

Tries several candidate datasets in order, filters every row by a curated
list of first-aid keywords, and writes the survivors to
``data/firstaid_raw.jsonl``.
"""

from __future__ import annotations

import difflib
import json
import os
import re
from pathlib import Path
from typing import Iterable

from datasets import load_dataset
from dotenv import load_dotenv

from arabic_seeds import expand_arabic_seeds

load_dotenv()

KEYWORDS = [
    "burn", "bleeding", "choking", "cpr", "fracture", "poisoning",
    "unconscious", "wound", "shock", "seizure", "allergic reaction",
    "drowning", "frostbite", "sprain", "nosebleed", "heart attack",
    "stroke", "overdose", "bite", "sting",
]

CATEGORY_MAP = {
    "burn": "burn", "scald": "burn",
    "bleed": "bleeding", "hemorrhage": "bleeding", "nosebleed": "bleeding",
    "chok": "airway", "drown": "airway", "asphyx": "airway",
    "cpr": "cardiac", "heart attack": "cardiac", "cardiac": "cardiac",
    "fracture": "trauma", "sprain": "trauma", "wound": "trauma", "cut": "trauma",
    "poison": "poisoning", "overdose": "poisoning",
    "uncon": "neuro", "seizure": "neuro", "stroke": "neuro",
    "shock": "shock", "anaphyl": "allergy", "allergic": "allergy",
    "frostbite": "thermal", "hypothermia": "thermal",
    "bite": "envenomation", "sting": "envenomation",
}

HIGH_SEVERITY = {
    "cpr", "heart attack", "cardiac", "stroke", "anaphyl",
    "drown", "chok", "overdose", "uncon", "seizure", "shock",
}

CANDIDATES = [
    {
        "name": "lavita/medical-qa-datasets",
        "config": None,
        "split": "train",
        "q_keys": ["question", "instruction", "input"],
        "a_keys": ["answer", "output", "response"],
    },
    {
        "name": "medalpaca/medical_meadow_medical_flashcards",
        "config": None,
        "split": "train",
        "q_keys": ["input", "instruction", "question"],
        "a_keys": ["output", "response", "answer"],
    },
    {
        "name": "keivalya/MedQuad-MedicalQnADataset",
        "config": None,
        "split": "train",
        "q_keys": ["Question", "question"],
        "a_keys": ["Answer", "answer"],
    },
]

# Phase 2.5 — additional emergency-medicine sources. These are tried after
# the main CANDIDATES list and are stricter about which rows we keep:
# row text must hit one of the EMERGENCY_KEYWORDS in addition to the
# general first-aid filter.
EMERGENCY_DATASETS = [
    {
        "name": "qiaojin/PubMedQA",
        "config": "pqa_artificial",
        "split": "train",
        "q_keys": ["question"],
        "a_keys": ["long_answer"],
    },
    {
        "name": "openlifescienceai/medmcqa",
        "config": None,
        "split": "train",
        "q_keys": ["question"],
        "a_keys": ["exp"],
    },
]

EMERGENCY_KEYWORDS = (
    "emergency", "trauma", "first aid", "first-aid", "wound", "fracture",
    "burn", "poisoning", "resuscitation", "airway", "anaphylaxis", "cpr",
    "shock", "hemorrhage", "hemorrhag", "bleeding", "seizure", "choking",
    "drowning", "stroke", "cardiac arrest", "asphyx",
)
EMERGENCY_RE = re.compile("|".join(re.escape(k) for k in EMERGENCY_KEYWORDS), re.IGNORECASE)

OUTPUT_PATH = Path(__file__).parent / "data" / "firstaid_raw.jsonl"
KEYWORD_RE = re.compile("|".join(re.escape(k) for k in KEYWORDS), re.IGNORECASE)


def first_present(row: dict, keys: Iterable[str]) -> str:
    for k in keys:
        v = row.get(k)
        if isinstance(v, str) and v.strip():
            return v.strip()
    return ""


def classify(text: str) -> tuple[str, str]:
    lowered = text.lower()
    category = "general"
    for needle, label in CATEGORY_MAP.items():
        if needle in lowered:
            category = label
            break
    severity = "high" if any(h in lowered for h in HIGH_SEVERITY) else "standard"
    return category, severity


def is_first_aid(text: str) -> bool:
    return bool(KEYWORD_RE.search(text))


def try_emergency_dataset(meta: dict, limit: int = 2000) -> list[dict]:
    """Stream an emergency-medicine dataset and keep first-aid hits.

    Two filters are applied: (1) the broad first-aid keyword set used for
    the main candidates, and (2) the narrower EMERGENCY_KEYWORDS list so
    we do not pull in generic pharmacology rows that happen to mention
    ``burn`` once.
    """
    print(f"  -> trying {meta['name']} (emergency filter) ...")
    token = os.getenv("HF_TOKEN") or None
    try:
        ds = load_dataset(
            meta["name"],
            meta["config"],
            split=meta["split"],
            token=token,
            trust_remote_code=True,
            streaming=True,
        )
    except Exception as exc:  # pragma: no cover - network errors
        print(f"     skipped ({exc.__class__.__name__}: {exc})")
        return []

    kept: list[dict] = []
    seen = 0
    for row in ds:
        seen += 1
        if seen > 50000:  # safety cap
            break
        if not isinstance(row, dict):
            continue
        question = first_present(row, meta["q_keys"])
        answer = first_present(row, meta["a_keys"])
        if not question or not answer:
            continue
        blob = f"{question}\n{answer}"
        if not (is_first_aid(blob) and EMERGENCY_RE.search(blob)):
            continue
        category, severity = classify(blob)
        kept.append(
            {
                "question": question[:400],
                "answer": answer[:1200],
                "source": meta["name"],
                "category": category,
                "severity_hint": severity,
            }
        )
        if len(kept) >= limit:
            break
    print(f"     scanned {seen}, kept {len(kept)} emergency entries")
    return kept


def dedupe_against_existing(
    new_rows: list[dict], existing: list[dict], threshold: float = 0.90
) -> list[dict]:
    """Drop any new row whose question is too similar (>= threshold ratio
    via difflib.SequenceMatcher) to any existing question."""
    existing_questions = [r["question"].lower().strip() for r in existing]
    existing_set = set(existing_questions)
    matcher = difflib.SequenceMatcher(autojunk=False)
    out: list[dict] = []
    dropped = 0
    for row in new_rows:
        q = row["question"].lower().strip()
        if q in existing_set:
            dropped += 1
            continue
        is_dup = False
        # Only run the expensive ratio check against a slice with similar
        # first-letter neighborhood to keep this tractable.
        prefix = q[:6]
        candidates = [e for e in existing_questions if e.startswith(prefix)]
        for cand in candidates:
            matcher.set_seqs(q, cand)
            if matcher.quick_ratio() < threshold:
                continue
            if matcher.ratio() >= threshold:
                is_dup = True
                break
        if is_dup:
            dropped += 1
        else:
            out.append(row)
            existing_questions.append(q)
            existing_set.add(q)
    print(f"     dedupe dropped {dropped}, kept {len(out)}")
    return out


def try_dataset(meta: dict) -> list[dict]:
    print(f"  -> trying {meta['name']} ...")
    token = os.getenv("HF_TOKEN") or None
    try:
        ds = load_dataset(
            meta["name"],
            meta["config"],
            split=meta["split"],
            token=token,
            trust_remote_code=True,
        )
    except Exception as exc:  # pragma: no cover - network errors
        print(f"     skipped ({exc.__class__.__name__}: {exc})")
        return []

    kept: list[dict] = []
    for row in ds:
        if not isinstance(row, dict):
            continue
        question = first_present(row, meta["q_keys"])
        answer = first_present(row, meta["a_keys"])
        if not question or not answer:
            continue
        blob = f"{question}\n{answer}"
        if not is_first_aid(blob):
            continue
        category, severity = classify(blob)
        kept.append(
            {
                "question": question,
                "answer": answer,
                "source": meta["name"],
                "category": category,
                "severity_hint": severity,
            }
        )
    print(f"     kept {len(kept)} first-aid entries")
    return kept


SEED_ENTRIES = [
    {
        "question": "How do I treat a minor burn at home?",
        "answer": (
            "Cool the burn under cool (not cold) running water for at least "
            "10 minutes. Remove jewellery or tight clothing near the burn "
            "before swelling starts. Cover the area loosely with a clean, "
            "non-stick dressing or cling film. Do not apply butter, "
            "toothpaste or ice. Take paracetamol for pain if needed. Seek "
            "medical help if the burn is larger than the palm of the hand, "
            "on the face, hands, feet, or genitals, or if blisters form."
        ),
    },
    {
        "question": "What should I do if someone is choking and cannot breathe?",
        "answer": (
            "If the person cannot cough, speak or breathe, act immediately. "
            "Give up to 5 sharp back blows between the shoulder blades with "
            "the heel of your hand. If that fails, give up to 5 abdominal "
            "thrusts (Heimlich manoeuvre): stand behind, fist above the "
            "navel, grasp with the other hand and pull sharply inward and "
            "upward. Alternate 5 back blows and 5 abdominal thrusts. Call "
            "emergency services (SAMU 190 in Tunisia, 15 in France) right "
            "away. If they become unconscious, start CPR."
        ),
    },
    {
        "question": "How do I stop severe bleeding from a wound?",
        "answer": (
            "Call emergency services immediately for severe bleeding. Apply "
            "firm, continuous direct pressure with a clean cloth or sterile "
            "dressing. Do not remove a soaked dressing; add more on top. "
            "Elevate the injured limb above the level of the heart if "
            "possible. If bleeding is life-threatening on a limb and direct "
            "pressure fails, apply a tourniquet 5-7 cm above the wound and "
            "note the time. Keep the person warm and lying down to prevent "
            "shock."
        ),
    },
    {
        "question": "What should I do if someone is having a heart attack?",
        "answer": (
            "Call emergency services right away (SAMU 190 in Tunisia, 15 in "
            "France). Have the person sit or lie down in a comfortable "
            "position, loosen tight clothing, and keep them calm. If they "
            "are not allergic and not bleeding, give one regular adult "
            "aspirin (300 mg) to chew slowly. Be ready to start CPR with "
            "chest compressions if they become unresponsive and stop "
            "breathing normally."
        ),
    },
    {
        "question": "How do I perform CPR on an adult?",
        "answer": (
            "Check responsiveness and call emergency services. Place the "
            "person on their back on a firm surface. Kneel beside them, "
            "place the heel of one hand in the centre of the chest, the "
            "other hand on top with fingers interlocked. Push hard and "
            "fast: 30 compressions about 5-6 cm deep at 100-120 per "
            "minute. Give 2 rescue breaths if trained, otherwise continue "
            "compressions only. Continue until help arrives or the person "
            "shows signs of life."
        ),
    },
    {
        "question": "What should I do if a child is having a severe allergic reaction (anaphylaxis)?",
        "answer": (
            "Anaphylaxis is life-threatening. Call emergency services "
            "immediately. If an adrenaline auto-injector (EpiPen) is "
            "available, use it in the outer thigh without delay; a second "
            "dose can be given after 5-15 minutes if symptoms persist. Lay "
            "the child flat with legs raised; if they are vomiting or "
            "having trouble breathing, place them on their side. Do not "
            "let them stand or walk. Note the time of the injection."
        ),
    },
    {
        "question": "How do I treat a nosebleed?",
        "answer": (
            "Sit upright and lean slightly forward (not back). Pinch the "
            "soft part of the nose just below the bony bridge firmly for "
            "10-15 minutes without releasing. Breathe through the mouth. "
            "Apply a cold pack to the bridge of the nose. Avoid blowing "
            "the nose, hot drinks or vigorous activity for several hours. "
            "Seek medical help if bleeding does not stop after 20 minutes, "
            "follows a head injury, or is very heavy."
        ),
    },
    {
        "question": "What should I do for a sprained ankle?",
        "answer": (
            "Follow the RICE protocol. Rest: avoid putting weight on the "
            "joint. Ice: apply a cold pack wrapped in a cloth for 15-20 "
            "minutes every 2-3 hours during the first 48 hours. "
            "Compression: wrap with an elastic bandage, not too tight. "
            "Elevation: raise the ankle above the level of the heart "
            "whenever possible. See a doctor if you cannot bear weight, "
            "the joint looks deformed, or pain persists beyond a few days."
        ),
    },
    {
        "question": "How do I help someone who is having a seizure?",
        "answer": (
            "Stay calm and protect them from injury. Move sharp or hard "
            "objects out of the way and cushion the head with something "
            "soft. Do not restrain them and do not put anything in their "
            "mouth. Time the seizure. When the seizure ends, place them "
            "on their side in the recovery position to keep the airway "
            "clear. Call emergency services if the seizure lasts longer "
            "than 5 minutes, repeats, the person is injured, pregnant, or "
            "it is their first seizure."
        ),
    },
    {
        "question": "What should I do if someone has been poisoned or has overdosed?",
        "answer": (
            "Call emergency services or poison control immediately. Do "
            "not induce vomiting unless explicitly told to by a "
            "professional. If the person is unconscious but breathing, "
            "place them in the recovery position. If they have stopped "
            "breathing, begin CPR. Try to identify the substance and the "
            "amount taken, and keep the container or packaging to show "
            "responders."
        ),
    },
    {
        "question": "How do I treat frostbite on the fingers?",
        "answer": (
            "Move the person to a warm place. Remove wet clothing and "
            "constricting items like rings. Rewarm the affected area in "
            "warm (not hot) water at 37-39 degrees Celsius for 20-30 "
            "minutes until the skin is soft and red. Do not rub the area "
            "or use direct heat such as a fire or heating pad. Cover with "
            "loose, sterile dressings and seek medical care, especially "
            "if blisters or numbness persist."
        ),
    },
    {
        "question": "Someone has been bitten by a snake. What should I do?",
        "answer": (
            "Call emergency services immediately. Keep the person calm "
            "and still; movement spreads venom. Keep the bitten limb at "
            "or slightly below heart level and immobilise it with a "
            "splint if possible. Remove jewellery and tight clothing "
            "before swelling. Do not cut the wound, suck out venom, "
            "apply ice or a tourniquet. Note the time of the bite and "
            "the snake's appearance if you can do so safely."
        ),
    },
    {
        "question": "How do I treat a bee or wasp sting?",
        "answer": (
            "If the stinger is visible, scrape it out with the edge of a "
            "card; do not squeeze with tweezers as that releases more "
            "venom. Wash the area with soap and water and apply a cold "
            "pack to reduce pain and swelling. Take an oral antihistamine "
            "or paracetamol if needed. Watch for signs of a severe "
            "allergic reaction (difficulty breathing, swelling of the "
            "face or throat) and call emergency services if they appear."
        ),
    },
    {
        "question": "What are the signs of a stroke and what should I do?",
        "answer": (
            "Use the FAST test: Face drooping on one side, Arm weakness "
            "(one arm drifts down when raised), Speech that is slurred "
            "or strange, Time to call emergency services immediately. "
            "Note the time symptoms started; this guides treatment. Keep "
            "the person still and comfortable. Do not give food, drink "
            "or medication. If they are unconscious but breathing, place "
            "them in the recovery position."
        ),
    },
    {
        "question": "How do I help someone who is unconscious but breathing?",
        "answer": (
            "Check the scene is safe, then check responsiveness by "
            "tapping and shouting. Open the airway with a head-tilt and "
            "chin-lift and confirm normal breathing for up to 10 "
            "seconds. Call emergency services. Place the person in the "
            "recovery position: roll them onto their side, top leg bent, "
            "head tilted back to keep the airway open. Monitor breathing "
            "until help arrives."
        ),
    },
    {
        "question": "What should I do if someone has nearly drowned?",
        "answer": (
            "Get the person out of the water safely without putting "
            "yourself in danger. Call emergency services. If they are "
            "not breathing, start CPR with 5 initial rescue breaths "
            "followed by 30 chest compressions and 2 breaths. Remove "
            "wet clothes and keep them warm to prevent hypothermia. "
            "Even if they seem to recover, they must be assessed at "
            "hospital because secondary drowning can occur hours later."
        ),
    },
    {
        "question": "How do I treat a deep cut on the hand?",
        "answer": (
            "Wash your own hands first if possible. Rinse the wound "
            "under clean running water and remove any visible debris "
            "you can reach easily. Apply firm direct pressure with a "
            "clean cloth or sterile dressing to stop the bleeding, and "
            "elevate the hand above heart level. Cover with a sterile "
            "dressing. Seek medical care if the cut is deep, gaping, "
            "very dirty, caused by a rusty or animal-related object, "
            "or if bleeding does not stop after 10-15 minutes of "
            "pressure."
        ),
    },
    {
        "question": "What should I do for someone showing signs of shock?",
        "answer": (
            "Call emergency services. Lay the person flat on their back "
            "and raise their legs about 30 cm if no spinal injury is "
            "suspected. Loosen tight clothing. Keep them warm with a "
            "blanket but do not overheat. Do not give them food or "
            "drink, even if they are thirsty. Reassure them, monitor "
            "breathing, and be ready to start CPR if they stop "
            "breathing normally."
        ),
    },
    {
        "question": "How do I treat a suspected bone fracture?",
        "answer": (
            "Keep the injured limb still in the position you found it. "
            "Do not try to realign the bone. Support the area above and "
            "below the injury with padding or a splint made from rigid "
            "material wrapped in cloth. Apply a cold pack wrapped in a "
            "towel to reduce swelling. Treat any external bleeding with "
            "direct pressure around (not on) the bone. Call emergency "
            "services, especially for suspected spine, hip or open "
            "fractures, and do not give food or drink in case surgery "
            "is needed."
        ),
    },
    {
        "question": "Que faire en cas de saignement de nez chez un enfant ?",
        "answer": (
            "Asseyez l'enfant et penchez-lui la tête legerement en "
            "avant, jamais en arriere. Pincez fermement la partie molle "
            "du nez pendant 10 a 15 minutes sans relacher. Demandez-lui "
            "de respirer par la bouche. Appliquez un linge froid sur "
            "l'arete du nez. Evitez de moucher ou de boire chaud "
            "pendant quelques heures. Consultez un medecin si le "
            "saignement ne s'arrete pas apres 20 minutes ou s'il fait "
            "suite a un choc a la tete."
        ),
    },
]


def seed_entries() -> list[dict]:
    rows: list[dict] = []
    for entry in SEED_ENTRIES:
        category, severity = classify(f"{entry['question']}\n{entry['answer']}")
        rows.append(
            {
                "question": entry["question"],
                "answer": entry["answer"],
                "source": "curated/seed",
                "category": category,
                "severity_hint": severity,
            }
        )
    return rows


def main() -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    print("== First-aid dataset fetch ==")

    aggregated: list[dict] = []
    for meta in CANDIDATES:
        try:
            aggregated.extend(try_dataset(meta))
        except Exception as exc:  # pragma: no cover - defensive
            print(f"     unexpected error: {exc}")
        if len(aggregated) >= 500:
            break

    seeds = seed_entries()
    print(f"  -> adding {len(seeds)} curated seed entries")
    aggregated.extend(seeds)

    arabic = expand_arabic_seeds()
    print(f"  -> adding {len(arabic)} Arabic-script seed entries")
    aggregated.extend(arabic)

    # Phase 2.5: pull additional emergency-medicine corpora and dedupe.
    for meta in EMERGENCY_DATASETS:
        try:
            extra = try_emergency_dataset(meta, limit=1500)
        except Exception as exc:  # pragma: no cover - defensive
            print(f"     unexpected error: {exc}")
            extra = []
        if extra:
            extra = dedupe_against_existing(extra, aggregated)
            aggregated.extend(extra)

    seen: set[str] = set()
    unique: list[dict] = []
    for row in aggregated:
        key = row["question"].lower().strip()
        if key in seen:
            continue
        seen.add(key)
        unique.append(row)

    with OUTPUT_PATH.open("w", encoding="utf-8") as fh:
        for row in unique:
            fh.write(json.dumps(row, ensure_ascii=False) + "\n")

    print(f"-> wrote {len(unique)} entries to {OUTPUT_PATH}")
    counts: dict[str, int] = {}
    for row in unique:
        counts[row["category"]] = counts.get(row["category"], 0) + 1
    for cat, n in sorted(counts.items(), key=lambda x: -x[1]):
        print(f"   {cat:15s} {n}")


if __name__ == "__main__":
    main()
