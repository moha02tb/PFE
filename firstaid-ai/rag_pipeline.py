"""First Aid pure-RAG pipeline for Pharmacie Connect.

Runs 100% locally: sentence-transformers for embedding, ChromaDB for
storage, no LLM API calls. ``chat()`` returns the top retrieved
passages directly, with an ``escalate`` flag derived from the metadata
``severity_hint`` of the best hit.

Importable as::

    from rag_pipeline import FirstAidRAG
    rag = FirstAidRAG()
    result = rag.chat("I burnt my hand on a hot pan, what should I do?")

Run as ``python rag_pipeline.py`` for an interactive CLI.
"""

from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import chromadb
from chromadb.config import Settings
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

load_dotenv()

ROOT = Path(__file__).parent
CHROMA_PATH = ROOT / "chroma_db"
COLLECTION_NAME = "firstaid"
FEEDBACK_PATH = ROOT / "data" / "feedback.jsonl"
EMBED_MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

DEFAULT_TOP_K = 5
ANSWER_CHUNKS = 3              # chunks to surface as the "reply"
HISTORY_WINDOW = 5             # max exchanges (user+assistant pairs) kept
HISTORY_CONTEXT_TURNS = 2      # last N user turns prepended to the query
HIGH_CONFIDENCE_DIST = 0.45    # cosine distance thresholds (lower = closer)
MEDIUM_CONFIDENCE_DIST = 0.65
NO_CONTEXT_DIST = 0.72         # above this -> treat as out-of-domain

URGENCY_TRIGGERS = (
    # English
    "severe", "unconscious", "not breathing", "baby", "child",
    "not responding", "heavy bleeding", "can't breathe", "cant breathe",
    "turning blue", "no pulse", "collapsed", "spurting", "anaphyl",
    "emergency", "dying", "life-threatening", "spinal injury", "paralyz",
    "cannot move", "no pulse", "choking", "chok",
    # French
    "grave", "inconscient", "ne respire pas", "bebe", "bébé", "enfant",
    "saignement abondant", "respire plus", "urgence", "paralys",
    # Arabic (MSA + dialect, script + transliterated)
    "شديد", "فاقد الوعي", "لا يتنفس", "طفل", "رضيع", "نزيف حاد",
    "ما يتنفسش", "وليدي", "البيبي", "ما يتحركش", "ما يجاوبش",
)


SYNONYMS: dict[str, list[str]] = {
    "heart attack": [
        "cardiac arrest", "chest pain", "MI", "myocardial",
        "crise cardiaque", "arret cardiaque", "douleur poitrine",
        "نوبة قلبية", "سكتة قلبية", "ألم الصدر",
    ],
    "choking": [
        "airway obstruction", "Heimlich", "can't breathe", "foreign body",
        "etouffement", "obstruction des voies respiratoires",
        "اختناق", "انسداد المجرى الهوائي", "مناورة هايمليك",
    ],
    "stroke": [
        # NOTE: "FAST" intentionally removed - too ambiguous with the
        # English adverb (matches "language fast" etc.). "FAST test" is
        # acceptable because it's a 2-word phrase.
        "brain attack", "face drooping", "FAST test", "slurred speech",
        "AVC", "accident vasculaire cerebral", "paralysie faciale",
        "سكتة دماغية", "جلطة دماغية", "تدلي الوجه",
    ],
    "burn": [
        "scald", "thermal injury", "fire injury", "blister",
        "brulure", "echaudure",
        "حرق", "حرقة", "كي", "حروق",
    ],
    "seizure": [
        "convulsion", "epilepsy", "fit", "shaking", "convulsing",
        "crise epileptique", "convulsions",
        "نوبة صرع", "تشنج", "ارتعاش",
    ],
    "fracture": [
        "broken bone", "break", "crack", "splint",
        "os casse", "cassure",
        "كسر", "كسور", "عظم مكسور",
    ],
    "bleeding": [
        "hemorrhage", "blood loss", "wound", "spurting",
        "saignement", "hemorragie", "plaie",
        "نزيف", "جرح", "فقدان الدم",
    ],
    "poisoning": [
        "overdose", "toxic ingestion", "swallowed",
        "intoxication", "empoisonnement",
        "تسمم", "ابتلاع مادة سامة", "جرعة زائدة",
    ],
    "drowning": [
        "near drowning", "water rescue", "submersion",
        "noyade", "noye",
        "غرق", "نقاذ من الماء", "إنقاذ من الغرق",
    ],
    "anaphylaxis": [
        "allergic reaction", "epinephrine", "epipen", "swelling throat",
        "reaction allergique", "anaphylaxie", "adrenaline",
        "حساسية مفرطة", "تورم الحلق", "أدرينالين",
    ],
}


def _detect_script(text: str) -> str:
    """Return 'ar' if the text is mostly Arabic, 'fr' if French-ish,
    otherwise 'en'."""
    if not text:
        return "en"
    arabic = sum(1 for c in text if "؀" <= c <= "ۿ")
    if arabic >= 3:
        return "ar"
    lowered = text.lower()
    fr_markers = ("é", "è", "ê", "à", "ç", "ù", "que faire", "j'ai", "comment",
                  "brulure", "bebe", "enfant", "saignement", "voies")
    if any(m in lowered for m in fr_markers):
        return "fr"
    return "en"


def _looks_like_script(term: str, script: str) -> bool:
    if script == "ar":
        return any("؀" <= c <= "ۿ" for c in term)
    if script == "fr":
        # Accept FR-marked terms; reject Arabic.
        if any("؀" <= c <= "ۿ" for c in term):
            return False
        lowered = term.lower()
        return any(m in lowered for m in (
            "é", "è", "ê", "à", "ç", "ù", "brul", "saign", "etouf",
            "noya", "crise", "obstruct", "voies", "douleur", "poitrine",
            "intox", "empoison", "reaction allerg", "anaphyla", "adrenaline",
            "accident vasculaire", "convuls", "paralysie",
        ))
    # English: reject Arabic; allow everything else (including French
    # words that happen to also work in English).
    return not any("؀" <= c <= "ۿ" for c in term)


_QUERY_AGE_PATTERNS = {
    "infant": [
        r"\binfant\b", r"\bnewborn\b", r"\bneonat\w*\b", r"\bbaby\b",
        r"\bbébé\b", r"\bbebe\b", r"\bnourrisson\b",
        "رضيع", "البيبي", "وليدي",
    ],
    "child": [
        r"\bchild\b", r"\btoddler\b", r"\bp[ae]ediatric\w*\b",
        r"\bson\b", r"\bdaughter\b", r"\bkid\b",
        r"\benfant\b", r"\bgosse\b", r"\bgarçon\b", r"\bfille\b",
        "طفل", "أطفال", "ابني", "ابنتي",
    ],
    "elderly": [
        r"\belder(ly|s)?\b", r"\bgeriatric\b",
        r"\bpersonne agée\b", r"\bgrand-(père|mère)\b",
        "كبار السن", "المسن",
    ],
    "adult": [
        r"\badult\b",
        r"\bman\b", r"\bwoman\b", r"\bfather\b", r"\bmother\b",
        r"\bhomme\b", r"\bfemme\b",
        "بالغ", "رجل", "امرأة",
    ],
}
_QUERY_AGE_PRIORITY = ("infant", "child", "elderly", "adult")


def _detect_query_age_group(query: str) -> str:
    """Return the age group the *query* is asking about (or "any" if
    unclear) - used to compute the age_match_boost in retrieval."""
    if not query:
        return "any"
    lowered = query.lower()
    for label in _QUERY_AGE_PRIORITY:
        for pat in _QUERY_AGE_PATTERNS[label]:
            try:
                if re.search(pat, lowered) or re.search(pat, query):
                    return label
            except re.error:
                if pat in lowered or pat in query:
                    return label
    return "any"


def _term_present(needle: str, haystack_lower: str) -> bool:
    """Substring match that requires word-boundary edges for single-word
    needles (Arabic short forms AND English/French acronyms like 'FAST'
    or 'MI'). Multi-word terms ("heart attack") use a plain substring
    check because they already imply boundaries."""
    needle = needle.lower()
    if not needle or not haystack_lower:
        return False
    if needle not in haystack_lower:
        return False
    # Multi-word needles: trust substring (they already span word boundaries).
    if " " in needle:
        return True
    # Single-word needle: enforce non-letter boundary on either side so
    # that "FAST"/"MI"/"كي" don't match inside "fast" sentences,
    # "primitive", or "كيف".
    n = len(needle)
    for i in range(len(haystack_lower) - n + 1):
        if haystack_lower[i : i + n] != needle:
            continue
        left_ok = i == 0 or not haystack_lower[i - 1].isalpha()
        right_ok = (i + n) == len(haystack_lower) or not haystack_lower[i + n].isalpha()
        if left_ok and right_ok:
            return True
    return False


def _expand_query(query: str) -> str:
    """Inject a single primary term when the user typed only a synonym.

    Aggressive expansion would dominate the embedding, so we only fire
    when the original query lacks the primary term but does contain one
    of its synonyms. In that case we append exactly ONE same-script
    surrogate so the embedding nudges toward the primary concept without
    drowning the original wording.
    """
    if not query:
        return query
    script = _detect_script(query)
    lowered = query.lower()
    extras: list[str] = []

    for primary, syns in SYNONYMS.items():
        if _term_present(primary, lowered):
            # Already explicit, no rewrite needed.
            continue
        for s in syns:
            if not _term_present(s, lowered):
                continue
            # Synonym present but primary missing - choose ONE bridge term
            # that matches the input script. Prefer the English primary
            # (always concise), fall back to the first same-script synonym.
            bridge: Optional[str] = None
            if _looks_like_script(primary, script):
                bridge = primary
            else:
                for alt in syns:
                    if alt.lower() == s.lower():
                        continue
                    if _looks_like_script(alt, script):
                        bridge = alt
                        break
            if bridge and bridge.lower() not in (e.lower() for e in extras):
                extras.append(bridge)
            break  # one synonym per primary is enough

    if not extras:
        return query
    return f"{query} {' '.join(extras[:2])}"


REFUSAL_REPLY = (
    "I do not have relevant first-aid information for that question. "
    "Consultez un medecin si les symptomes persistent."
)
EMPTY_REPLY = (
    "Please describe the first-aid situation so I can help. "
    "Consultez un medecin si les symptomes persistent."
)
DISCLAIMER_TAIL = "Consultez un medecin si les symptomes persistent."

# (symptom set, condition, severity, escalate, first_steps).
# Symptoms are matched case-insensitively as substrings. A rule fires
# when ALL of its required symptoms appear in the input list. Rules are
# tried in order; the first match wins, so put more specific rules first.
SYMPTOM_RULES: list[dict] = [
    {
        "symptoms": ["unconscious", "not breathing"],
        "condition": "cardiac arrest",
        "severity": "high",
        "escalate": True,
        "first_steps": [
            "Call emergency services immediately (SAMU 190 in Tunisia, 15 in France).",
            "Place the person on their back on a firm surface.",
            "Start CPR: 30 chest compressions (5-6 cm deep, 100-120/min), then 2 breaths if trained.",
            "Continue CPR without interruption until help arrives.",
        ],
    },
    {
        "symptoms": ["unconscious", "breathing"],
        "condition": "recovery position needed",
        "severity": "high",
        "escalate": True,
        "first_steps": [
            "Call emergency services.",
            "Roll the person onto their side (recovery position) to keep the airway clear.",
            "Tilt the head back slightly and lift the chin.",
            "Monitor breathing continuously until help arrives.",
        ],
    },
    {
        "symptoms": ["chest pain", "left arm", "sweating"],
        "condition": "heart attack",
        "severity": "high",
        "escalate": True,
        "first_steps": [
            "Call emergency services immediately.",
            "Have the person sit or lie down in a comfortable position.",
            "Loosen tight clothing and keep them calm.",
            "If not allergic and not bleeding, give 300 mg aspirin to chew slowly.",
            "Be ready to start CPR if they become unresponsive.",
        ],
    },
    {
        "symptoms": ["chest pain", "shortness of breath"],
        "condition": "possible heart attack",
        "severity": "high",
        "escalate": True,
        "first_steps": [
            "Call emergency services.",
            "Have the person rest in a comfortable position.",
            "Loosen tight clothing.",
            "Monitor breathing and prepare for CPR if needed.",
        ],
    },
    {
        "symptoms": ["blue lips", "silence", "grabbing throat"],
        "condition": "choking",
        "severity": "high",
        "escalate": True,
        "first_steps": [
            "Call emergency services if the airway stays blocked.",
            "Give up to 5 sharp back blows between the shoulder blades.",
            "If not cleared, give up to 5 abdominal thrusts (Heimlich).",
            "Alternate back blows and abdominal thrusts until the object is expelled or they become unconscious.",
        ],
    },
    {
        "symptoms": ["cannot speak", "cannot breathe"],
        "condition": "severe airway obstruction",
        "severity": "high",
        "escalate": True,
        "first_steps": [
            "Call emergency services.",
            "Perform back blows and abdominal thrusts immediately.",
            "If they become unconscious, begin CPR.",
        ],
    },
    {
        "symptoms": ["confusion", "slurred speech", "face drooping"],
        "condition": "stroke",
        "severity": "high",
        "escalate": True,
        "first_steps": [
            "Use the FAST test (Face, Arm, Speech, Time) and call emergency services.",
            "Note the time the symptoms started.",
            "Keep the person still and comfortable.",
            "Do not give food, drink or medication.",
            "If unconscious but breathing, place in the recovery position.",
        ],
    },
    {
        "symptoms": ["weakness one side", "vision loss"],
        "condition": "possible stroke",
        "severity": "high",
        "escalate": True,
        "first_steps": [
            "Call emergency services immediately.",
            "Keep the person still and reassure them.",
            "Do not give food or drink.",
        ],
    },
    {
        "symptoms": ["hives", "swelling", "difficulty breathing"],
        "condition": "anaphylaxis",
        "severity": "high",
        "escalate": True,
        "first_steps": [
            "Call emergency services immediately.",
            "Use an adrenaline auto-injector (EpiPen) in the outer thigh without delay.",
            "Lay the person flat with legs raised; on their side if vomiting or breathing trouble.",
            "Do not let them stand or walk; a second EpiPen dose can be given after 5-15 minutes.",
        ],
    },
    {
        "symptoms": ["swollen tongue", "throat closing"],
        "condition": "anaphylaxis",
        "severity": "high",
        "escalate": True,
        "first_steps": [
            "Call emergency services.",
            "Use an EpiPen in the outer thigh.",
            "Sit them up if breathing is hard, lie flat otherwise.",
        ],
    },
    {
        "symptoms": ["high fever", "stiff neck", "light sensitivity"],
        "condition": "possible meningitis",
        "severity": "high",
        "escalate": True,
        "first_steps": [
            "Call emergency services immediately.",
            "Keep the person calm and minimize light/noise.",
            "Do not delay medical care, even if symptoms seem to ease.",
        ],
    },
    {
        "symptoms": ["seizure", "shaking"],
        "condition": "seizure",
        "severity": "high",
        "escalate": True,
        "first_steps": [
            "Protect the head and clear sharp objects away.",
            "Do not restrain them and do not put anything in their mouth.",
            "Time the seizure.",
            "When it ends, place in the recovery position.",
            "Call emergency services if it lasts > 5 minutes, repeats, or is the first seizure.",
        ],
    },
    {
        "symptoms": ["bleeding", "deep wound"],
        "condition": "severe bleeding",
        "severity": "high",
        "escalate": True,
        "first_steps": [
            "Call emergency services for life-threatening bleeding.",
            "Apply firm, continuous direct pressure with a clean cloth.",
            "Do not remove the dressing if it soaks through; add another on top.",
            "Elevate the limb above heart level if possible.",
            "Apply a tourniquet 5-7 cm above the wound only as a last resort and note the time.",
        ],
    },
    {
        "symptoms": ["spurting blood", "wound"],
        "condition": "arterial bleeding",
        "severity": "high",
        "escalate": True,
        "first_steps": [
            "Call emergency services right away.",
            "Apply hard, direct pressure with a clean cloth.",
            "Use a tourniquet 5-7 cm above the wound if the limb keeps spurting.",
            "Note the time the tourniquet went on.",
        ],
    },
    {
        "symptoms": ["burn", "redness", "blistering"],
        "condition": "burn",
        "severity": "standard",
        "escalate": False,
        "first_steps": [
            "Cool the burn under running cool water for 10-20 minutes.",
            "Remove jewellery and tight clothing before swelling.",
            "Cover with a clean non-stick dressing.",
            "Do not apply butter, ice, or toothpaste.",
            "Seek medical care if larger than a palm or on face/hands/feet.",
        ],
    },
    {
        "symptoms": ["burn", "chemical"],
        "condition": "chemical burn",
        "severity": "high",
        "escalate": True,
        "first_steps": [
            "Flush the area with running water for at least 20 minutes.",
            "Remove contaminated clothing and jewellery while flushing.",
            "Do not try to neutralize the chemical.",
            "Call emergency services and poison control.",
        ],
    },
    {
        "symptoms": ["bleeding nose"],
        "condition": "nosebleed",
        "severity": "standard",
        "escalate": False,
        "first_steps": [
            "Sit upright and lean slightly forward.",
            "Pinch the soft part of the nose firmly for 10-15 minutes.",
            "Breathe through the mouth and apply a cold pack to the bridge of the nose.",
            "Seek medical help if bleeding does not stop after 20 minutes.",
        ],
    },
    {
        "symptoms": ["swollen ankle", "twisted"],
        "condition": "sprain",
        "severity": "standard",
        "escalate": False,
        "first_steps": [
            "Apply the RICE protocol: Rest, Ice, Compression, Elevation.",
            "Avoid putting weight on the joint.",
            "Apply a cold pack for 15-20 minutes every 2-3 hours.",
            "See a doctor if you cannot bear weight or pain persists.",
        ],
    },
    {
        "symptoms": ["fracture", "deformity"],
        "condition": "bone fracture",
        "severity": "high",
        "escalate": True,
        "first_steps": [
            "Keep the limb still in the position you found it.",
            "Support above and below the injury with a splint or padding.",
            "Apply a cold pack wrapped in cloth to reduce swelling.",
            "Call emergency services, especially for spine, hip, or open fractures.",
        ],
    },
    {
        "symptoms": ["swallowed poison"],
        "condition": "poisoning",
        "severity": "high",
        "escalate": True,
        "first_steps": [
            "Call emergency services or poison control immediately.",
            "Do not induce vomiting unless told to by a professional.",
            "If unconscious but breathing, place in the recovery position.",
            "Keep the substance container to show responders.",
        ],
    },
    {
        "symptoms": ["headache", "dizziness", "near gas heater"],
        "condition": "carbon monoxide poisoning",
        "severity": "high",
        "escalate": True,
        "first_steps": [
            "Move the person to fresh air immediately.",
            "Open windows and doors and turn off the gas source if safe.",
            "Call emergency services.",
            "Start CPR if breathing stops.",
        ],
    },
    {
        "symptoms": ["shivering", "cold", "confusion"],
        "condition": "hypothermia",
        "severity": "high",
        "escalate": True,
        "first_steps": [
            "Move the person to a warm place and remove wet clothing.",
            "Rewarm the core first (chest, neck, head) with blankets.",
            "Give warm sweet drinks if they are alert (no alcohol).",
            "Handle gently to avoid cardiac arrhythmia.",
        ],
    },
    {
        "symptoms": ["near drowning", "unresponsive"],
        "condition": "drowning",
        "severity": "high",
        "escalate": True,
        "first_steps": [
            "Get the person out of the water safely.",
            "Call emergency services and start CPR if not breathing (5 breaths, then 30:2).",
            "Keep them warm to prevent hypothermia.",
            "All near-drowning victims need hospital assessment for secondary drowning.",
        ],
    },
    {
        "symptoms": ["electric shock", "burns"],
        "condition": "electric shock",
        "severity": "high",
        "escalate": True,
        "first_steps": [
            "Cut the power before touching the person.",
            "Call emergency services and start CPR if needed.",
            "Cover burns with sterile dressings - do not use water on electrical burns.",
        ],
    },
]


class FirstAidRAG:
    """Pure retrieval pipeline backed by ChromaDB + sentence-transformers."""

    def __init__(
        self,
        chroma_path: Optional[Path] = None,
        collection_name: str = COLLECTION_NAME,
        embed_model_name: str = EMBED_MODEL_NAME,
    ) -> None:
        self.chroma_path = Path(chroma_path or CHROMA_PATH)
        if not self.chroma_path.exists():
            raise FileNotFoundError(
                f"ChromaDB not found at {self.chroma_path}. "
                "Run embed_and_store.py first."
            )
        self.client = chromadb.PersistentClient(
            path=str(self.chroma_path),
            settings=Settings(anonymized_telemetry=False, allow_reset=True),
        )
        self.collection = self.client.get_collection(collection_name)
        self.embedder = SentenceTransformer(embed_model_name)

    # ------------------------------------------------------------------ retrieve
    def retrieve(self, query: str, top_k: int = DEFAULT_TOP_K) -> list[dict]:
        """Hybrid retrieval. Pulls top-K * 4 candidates from ChromaDB, then
        re-ranks by ``final_score`` (cosine + quality + has_steps +
        age-match), enforces a top-1 quality floor and top-3 source
        diversity, then returns the top-K.
        """
        if not query or not query.strip():
            return []
        vec = self.embedder.encode(
            [query], convert_to_numpy=True, normalize_embeddings=True
        )[0].tolist()
        pool_size = max(top_k * 4, 20)
        res = self.collection.query(
            query_embeddings=[vec],
            n_results=pool_size,
            include=["documents", "metadatas", "distances"],
        )
        docs = res.get("documents", [[]])[0]
        metas = res.get("metadatas", [[]])[0]
        dists = res.get("distances", [[]])[0]
        if not docs:
            return []
        query_age = _detect_query_age_group(query)

        pool: list[dict] = []
        for doc, meta, dist in zip(docs, metas, dists):
            meta = dict(meta or {})
            meta["distance"] = float(dist)
            cos_sim = max(0.0, 1.0 - meta["distance"])
            # source_quality_boost: 1 -> 0.0, 2 -> 0.1, 3 -> 0.2 (matches
            # spec where boost weight is 0.20).
            sq = int(meta.get("source_quality") or 1)
            quality_boost = {3: 1.0, 2: 0.5, 1: 0.0}.get(sq, 0.0)
            has_steps_boost = 1.0 if meta.get("has_steps") else 0.0
            chunk_age = meta.get("age_group") or "all"
            age_match_boost = 1.0 if (
                query_age == "any" or chunk_age == "all" or chunk_age == query_age
            ) else 0.0

            final_score = (
                0.60 * cos_sim
                + 0.20 * quality_boost
                + 0.10 * has_steps_boost
                + 0.10 * age_match_boost
            )
            meta["final_score"] = float(final_score)
            meta["cos_sim"] = float(cos_sim)
            pool.append({"text": doc, "metadata": meta})

        # Rank by hybrid score (descending).
        pool.sort(key=lambda c: c["metadata"]["final_score"], reverse=True)

        # Quality floor: source_quality=1 may not be top-1. Push to >= rank 3.
        if pool and (pool[0]["metadata"].get("source_quality") or 1) == 1:
            promoted = None
            for i in range(1, len(pool)):
                if (pool[i]["metadata"].get("source_quality") or 1) >= 2:
                    promoted = pool.pop(i)
                    break
            if promoted is not None:
                pool.insert(0, promoted)

        # Diversity in top-3: if all 3 share the same source document,
        # swap #3 with the next-best chunk from a different source.
        if len(pool) >= 3:
            sources = [(c["metadata"].get("source") or "?") for c in pool[:3]]
            if len(set(sources)) == 1:
                target_source = sources[0]
                replacement_idx = None
                for j in range(3, len(pool)):
                    src_j = pool[j]["metadata"].get("source") or "?"
                    if src_j != target_source:
                        replacement_idx = j
                        break
                if replacement_idx is not None:
                    pool[2], pool[replacement_idx] = pool[replacement_idx], pool[2]

        # Category filter: if top-1 is very confident (cos_sim >= 0.80)
        # restrict the remaining results to its category.
        top1 = pool[0] if pool else None
        if top1 is not None and top1["metadata"].get("cos_sim", 0.0) >= 0.80:
            cat = top1["metadata"].get("category")
            if cat:
                same_cat = [
                    c for c in pool if c["metadata"].get("category") == cat
                ]
                others = [
                    c for c in pool if c["metadata"].get("category") != cat
                ]
                pool = same_cat + others  # preserve order, just bias

        return pool[:top_k]

    # ------------------------------------------------------------------ prompt
    def build_prompt(
        self,
        query: str,
        context: list[dict],
        history: Optional[list[dict]] = None,
    ) -> str:
        """Concatenate retrieved chunks into a human-readable reply body.

        Kept for API parity with a future LLM upgrade - currently this is
        the same content surfaced as ``chat()['reply']``.
        """
        history = history or []  # accepted for API compatibility, unused
        parts: list[str] = []
        for i, item in enumerate(context, 1):
            meta = item.get("metadata", {})
            parts.append(
                f"[{i}] ({meta.get('category','?')}, "
                f"severity={meta.get('severity_hint','?')})\n{item['text']}"
            )
        return "\n\n".join(parts) if parts else ""

    # ------------------------------------------------------------------ feedback
    def log_feedback(self, query: str, result: dict, helpful: bool) -> None:
        """Append a feedback record to ``data/feedback.jsonl``.

        Stores only the query text and aggregate signals - no user id,
        no IP, no PII. Used by ``review_feedback`` to surface
        improvement targets.
        """
        if not isinstance(result, dict):
            result = {}
        sources = result.get("sources") or []
        top_cat = (sources[0].get("category") if sources else None)
        record = {
            "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "query": (query or "").strip()[:300],
            "top_category": top_cat,
            "confidence": result.get("confidence"),
            "escalate": bool(result.get("escalate")),
            "helpful": bool(helpful),
        }
        FEEDBACK_PATH.parent.mkdir(parents=True, exist_ok=True)
        with FEEDBACK_PATH.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(record, ensure_ascii=False) + "\n")

    def review_feedback(self, path: Optional[Path] = None) -> dict:
        """Aggregate stats from the feedback log."""
        path = Path(path) if path else FEEDBACK_PATH
        if not path.exists():
            print("(no feedback log yet)")
            return {
                "total": 0,
                "helpful_pct": 0.0,
                "top_categories": [],
                "improvement_targets": [],
            }
        records: list[dict] = []
        with path.open("r", encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    records.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
        total = len(records)
        helpful = sum(1 for r in records if r.get("helpful"))
        pct = (100.0 * helpful / total) if total else 0.0

        cat_counts: dict[str, int] = {}
        for r in records:
            cat = r.get("top_category") or "?"
            cat_counts[cat] = cat_counts.get(cat, 0) + 1
        top_cats = sorted(cat_counts.items(), key=lambda x: -x[1])[:5]

        unhelpful = [r for r in records if not r.get("helpful")]
        unhelpful_queries = [r.get("query", "") for r in unhelpful][:5]

        print(f"Feedback summary: {total} queries logged")
        print(f"  helpful: {helpful}/{total} ({pct:.1f}%)")
        print("  top categories:")
        for cat, n in top_cats:
            print(f"    {cat:15s} {n}")
        print("  improvement targets (helpful=False):")
        for q in unhelpful_queries:
            print(f"    - {q[:120]}")
        return {
            "total": total,
            "helpful_pct": pct,
            "top_categories": top_cats,
            "improvement_targets": unhelpful_queries,
        }

    # ------------------------------------------------------------------ format_response
    def format_response(self, chunks: list[dict], escalate: bool = False) -> dict:
        """Turn retrieved chunks into a structured response.

        Returns ``{ steps, warning, do_not, reassurance }``.
        - ``steps``     numbered actions extracted from chunk text
        - ``warning``   non-empty when ``escalate`` is True
        - ``do_not``    sentences mentioning "do not" / "avoid" / "never"
        - ``reassurance`` calming line shown to the user
        """
        steps: list[str] = []
        do_not: list[str] = []
        seen_steps: set[str] = set()
        seen_dn: set[str] = set()

        for chunk in chunks or []:
            text = chunk.get("text") if isinstance(chunk, dict) else None
            if not text:
                continue
            answer_part = text.split("A:", 1)[1] if "A:" in text else text
            for sentence in _split_sentences(answer_part):
                lowered = sentence.lower()
                if _is_negative_step(lowered):
                    key = lowered[:90]
                    if key not in seen_dn:
                        do_not.append(sentence.strip())
                        seen_dn.add(key)
                    continue
                if _looks_like_step(sentence):
                    key = lowered[:90]
                    if key not in seen_steps:
                        steps.append(sentence.strip())
                        seen_steps.add(key)

        steps = steps[:8]
        do_not = do_not[:6]

        warning = ""
        if escalate:
            warning = (
                "Call SAMU 190 (Tunisia) or 15 (France) immediately if the "
                "situation is life-threatening or the person stops "
                "breathing."
            )

        reassurance = (
            "Stay calm and follow these steps. "
            + DISCLAIMER_TAIL
        )

        if not steps:
            # Fallback: surface the first non-empty answer sentence so the
            # client always has something actionable to show.
            for chunk in chunks or []:
                txt = (chunk.get("text") if isinstance(chunk, dict) else "") or ""
                ans = txt.split("A:", 1)[1] if "A:" in txt else txt
                first = _first_sentence(ans)
                if first:
                    steps = [first]
                    break

        return {
            "steps": steps,
            "warning": warning,
            "do_not": do_not,
            "reassurance": reassurance,
        }

    # ------------------------------------------------------------------ symptom_check
    def symptom_check(self, symptoms: list[str]) -> dict:
        """Match a list of symptom strings against the local rule set.

        Returns ``{ condition, severity, escalate, first_steps, matched_symptoms }``.
        If nothing matches, ``condition`` is ``None`` and ``first_steps`` is
        a single line pointing the user toward emergency services.
        """
        if not symptoms:
            return {
                "condition": None,
                "severity": "unknown",
                "escalate": False,
                "first_steps": [
                    "Please describe at least one symptom so I can help.",
                ],
                "matched_symptoms": [],
            }

        normalized = [str(s).strip().lower() for s in symptoms if str(s).strip()]
        if not normalized:
            return {
                "condition": None,
                "severity": "unknown",
                "escalate": False,
                "first_steps": ["Please describe at least one symptom so I can help."],
                "matched_symptoms": [],
            }

        joined = " | ".join(normalized)
        best: Optional[dict] = None
        best_score = 0
        for rule in SYMPTOM_RULES:
            required = [s.lower() for s in rule["symptoms"]]
            hits = sum(1 for r in required if r in joined)
            if hits == len(required) and hits > best_score:
                best = rule
                best_score = hits
        if best is None:
            return {
                "condition": None,
                "severity": "unknown",
                "escalate": False,
                "first_steps": [
                    "I could not identify a known emergency pattern.",
                    "If symptoms are severe or worsening, call SAMU 190 (Tunisia) or 15 (France).",
                ],
                "matched_symptoms": normalized,
            }
        return {
            "condition": best["condition"],
            "severity": best["severity"],
            "escalate": best["escalate"],
            "first_steps": list(best["first_steps"]),
            "matched_symptoms": [s for s in best["symptoms"] if s.lower() in joined],
        }

    # ------------------------------------------------------------------ chat
    def chat(
        self,
        message: str,
        history: Optional[list[dict]] = None,
    ) -> dict:
        """Run one chat turn against the RAG store.

        Parameters
        ----------
        message : str
            The current user utterance.
        history : list[dict]
            Prior turns in the form ``[{"role": "user"|"assistant",
            "content": "..."}, ...]``. The function returns an updated
            history under the same shape (sliding window of HISTORY_WINDOW
            exchanges = 2*HISTORY_WINDOW turn entries).
        """
        history = list(history or [])
        message = (message or "").strip()
        if not message:
            updated = _trim_history(history)
            return {
                "reply": EMPTY_REPLY,
                "sources": [],
                "confidence": "low",
                "escalate": False,
                "history": updated,
            }

        if _is_meaningless_input(message):
            updated = _trim_history(
                history + [
                    {"role": "user", "content": message},
                    {"role": "assistant", "content": REFUSAL_REPLY},
                ]
            )
            return {
                "reply": REFUSAL_REPLY,
                "sources": [],
                "confidence": "low",
                "escalate": False,
                "history": updated,
            }

        # Stitch the last N user turns onto the current query so follow-ups
        # like "what about for a child?" resolve against the prior topic.
        prior_user_turns = [
            h.get("content", "") for h in history if h.get("role") == "user"
        ][-HISTORY_CONTEXT_TURNS:]
        retrieval_query = " ".join(prior_user_turns + [message]).strip()
        # Query expansion - inject synonyms to broaden retrieval.
        retrieval_query = _expand_query(retrieval_query)

        retrieved = self.retrieve(retrieval_query, top_k=DEFAULT_TOP_K)
        if not retrieved:
            updated = _trim_history(
                history + [
                    {"role": "user", "content": message},
                    {"role": "assistant", "content": REFUSAL_REPLY},
                ]
            )
            return {
                "reply": REFUSAL_REPLY,
                "sources": [],
                "confidence": "low",
                "escalate": False,
                "history": updated,
            }

        # ``retrieved`` is now sorted by hybrid score, so retrieved[0]
        # may not be the closest by raw cosine distance. The no-context
        # refusal check must consult the SMALLEST distance across the
        # candidates, otherwise a quality-boosted standard chunk could
        # mask a much closer match (or vice versa).
        best_dist = min(
            (c["metadata"].get("distance", 1.0) for c in retrieved),
            default=1.0,
        )
        top3_categories = [
            (c.get("metadata", {}) or {}).get("category", "?")
            for c in retrieved[:3]
        ]
        category_spread = len(set(top3_categories))

        # Refusal when (a) the nearest hit is too far, OR (b) the nearest
        # hit is somewhat distant AND the top-3 disagree on category - a
        # strong signal that nothing in the corpus is actually about this
        # topic.
        should_refuse = best_dist >= NO_CONTEXT_DIST or (
            best_dist >= 0.66 and category_spread >= 3
        )
        if should_refuse:
            updated = _trim_history(
                history + [
                    {"role": "user", "content": message},
                    {"role": "assistant", "content": REFUSAL_REPLY},
                ]
            )
            return {
                "reply": REFUSAL_REPLY,
                "sources": _sources_from_context(retrieved),
                "confidence": "low",
                "escalate": False,
                "history": updated,
            }

        # Severity-aware re-ranking: when the user's wording signals urgency,
        # promote any high-severity chunk to the top of the result list.
        urgent = _has_urgency_trigger(message)
        if urgent:
            retrieved = _severity_rerank(retrieved)

        top_chunks = retrieved[:ANSWER_CHUNKS]
        body = self.build_prompt(message, top_chunks)
        reply = f"{body}\n\n{DISCLAIMER_TAIL}".strip()

        if best_dist < HIGH_CONFIDENCE_DIST:
            confidence = "high"
        elif best_dist < MEDIUM_CONFIDENCE_DIST:
            confidence = "medium"
        else:
            confidence = "low"

        # Calibration: a coherent top-3 (all in the same category) is a
        # stronger signal than the raw distance suggests; conversely a
        # top-3 that spans 3 different categories is ambiguous and should
        # be downgraded.
        top3_cats_for_reply = [
            (c.get("metadata", {}) or {}).get("category", "?")
            for c in top_chunks
        ]
        coherence = len(set(top3_cats_for_reply))
        if coherence == 1 and confidence == "medium":
            confidence = "high"
        elif coherence >= 3:
            confidence = "low"

        escalate = any(
            (c["metadata"].get("severity_hint") == "high")
            for c in top_chunks
        )
        if urgent:
            # Safety override: when the user's wording itself signals
            # urgency, escalate even if the retrieved chunks happen to
            # carry "standard" severity tags.
            escalate = True

        # Safety: never show "low" confidence next to an escalate=True
        # reply - bump it to medium so the UI never under-sells the
        # urgency of an emergency.
        if escalate and confidence == "low":
            confidence = "medium"

        structured = self.format_response(top_chunks, escalate=escalate)

        updated = _trim_history(
            history + [
                {"role": "user", "content": message},
                {"role": "assistant", "content": reply},
            ]
        )

        return {
            "reply": reply,
            "sources": _sources_from_context(retrieved),
            "confidence": confidence,
            "escalate": escalate,
            "history": updated,
            "structured": structured,
        }


_SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?؟])\s+")
_NUMBERED_STEP_RE = re.compile(r"^\s*(?:\d+[.)]|[-*•])\s+")
_NEGATIVE_RE = re.compile(
    r"\b(do not|don'?t|never|avoid|n'utilisez pas|ne pas|"
    r"لا تستخدم|لا تطبق|لا تحاول|لا تحرك|لا تعطه|لا تدلك|لا تدعه|لا تضع)\b",
    re.IGNORECASE,
)
_STEP_VERB_RE = re.compile(
    r"\b("
    r"call|apply|place|press|cool|wash|cover|give|remove|use|sit|lay|"
    r"start|continue|monitor|tilt|raise|elevate|loosen|move|note|"
    r"flush|secure|"
    r"appelez|placez|pressez|couvrez|donnez|retirez|posez|"
    r"اتصل|ضع|طبق|اضغط|غط|أعط|اخلع|استخدم|ابدأ|واصل|ارفع|راقب"
    r")\b",
    re.IGNORECASE,
)


def _split_sentences(text: str) -> list[str]:
    if not text:
        return []
    parts = _SENTENCE_SPLIT_RE.split(text.strip())
    return [p for p in (s.strip() for s in parts) if 10 < len(p) < 400]


def _first_sentence(text: str) -> str:
    parts = _split_sentences(text)
    return parts[0] if parts else ""


def _looks_like_step(sentence: str) -> bool:
    if _NUMBERED_STEP_RE.match(sentence):
        return True
    if _STEP_VERB_RE.search(sentence):
        return True
    return False


def _is_negative_step(sentence_lower: str) -> bool:
    return bool(_NEGATIVE_RE.search(sentence_lower))


def _has_urgency_trigger(query: str) -> bool:
    """Return True if the query contains any urgency keyword."""
    if not query:
        return False
    lowered = query.lower()
    for trigger in URGENCY_TRIGGERS:
        if trigger in lowered:
            return True
    return False


def _severity_rerank(chunks: list[dict]) -> list[dict]:
    """Move all severity=high chunks to the front, preserving their
    relative order and the relative order of the standard chunks."""
    if not chunks:
        return chunks
    high = [c for c in chunks if c.get("metadata", {}).get("severity_hint") == "high"]
    other = [c for c in chunks if c.get("metadata", {}).get("severity_hint") != "high"]
    return high + other


def _trim_history(history: list[dict]) -> list[dict]:
    """Keep only the last HISTORY_WINDOW user+assistant exchange pairs."""
    if not history:
        return []
    return history[-(2 * HISTORY_WINDOW) :]


def _is_meaningless_input(query: str) -> bool:
    """Detect inputs that are not real questions: no alpha chars,
    a single repeated character, etc. Used as a cheap pre-filter to
    avoid embedding obvious garbage."""
    q = query.strip()
    if not q:
        return False  # empty handled separately by the caller
    alpha_count = sum(1 for c in q if c.isalpha())
    if alpha_count == 0:
        return True
    compact = "".join(q.lower().split())
    if len(compact) >= 5 and len(set(compact)) == 1:
        return True
    return False


def _sources_from_context(context: list[dict]) -> list[dict]:
    sources = []
    for item in context:
        meta = item.get("metadata", {})
        sources.append(
            {
                "source": meta.get("source", "?"),
                "category": meta.get("category", "?"),
                "severity_hint": meta.get("severity_hint", "?"),
                "distance": meta.get("distance"),
                "question": meta.get("question", ""),
            }
        )
    return sources


def _cli() -> None:
    print("First Aid RAG (Pharmacie Connect, local-only) - type 'exit' to quit")
    try:
        rag = FirstAidRAG()
    except FileNotFoundError as exc:
        print(f"!! {exc}")
        return
    history: list[dict] = []
    while True:
        try:
            msg = input("\nyou> ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break
        if not msg:
            continue
        if msg.lower() in {"exit", "quit", ":q"}:
            break
        result = rag.chat(msg, history=history)
        history = result.get("history", history)
        print(f"\nbot> {result['reply']}")
        print(
            f"     confidence={result['confidence']}  "
            f"escalate={result['escalate']}  sources={len(result['sources'])}"
        )


if __name__ == "__main__":
    _cli()
