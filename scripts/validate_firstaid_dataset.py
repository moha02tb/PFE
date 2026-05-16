#!/usr/bin/env python3
"""Validate the generated first-aid JSONL dataset and refresh the audit report."""

from __future__ import annotations

import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATASET_PATH = ROOT / "firstaid_dataset_v2" / "generated_cases" / "firstaid_expanded_v1.jsonl"
REPORT_PATH = ROOT / "firstaid_dataset_v2" / "audits" / "dataset_expansion_report.md"
SUMMARY_PATH = ROOT / "firstaid_dataset_v2" / "audits" / "validation_summary.json"

REQUIRED_FIELDS = {
    "id",
    "topic",
    "subtopic",
    "question",
    "expected_answer",
    "safety_level",
    "must_include",
    "must_not_include",
    "source",
    "language",
    "difficulty",
}

TOPICS = [
    "bleeding",
    "wounds",
    "burns",
    "electrical_burns",
    "choking_adult",
    "choking_child",
    "choking_infant",
    "cpr",
    "unconscious_person",
    "breathing_difficulty",
    "seizure",
    "poisoning",
    "drug_exposure",
    "allergic_reaction",
    "anaphylaxis",
    "heart_attack",
    "stroke_symptoms",
    "heat_exhaustion",
    "heat_stroke",
    "hypothermia",
    "frostbite",
    "nosebleed",
    "eye_injury",
    "foreign_object",
    "animal_bite",
    "insect_sting",
    "fracture",
    "sprain",
    "shock",
    "fainting",
    "unsafe_or_out_of_scope",
]

VALID_SAFETY_LEVELS = {"low", "moderate", "urgent", "emergency", "out_of_scope"}
VALID_DIFFICULTY = {"basic", "intermediate", "advanced"}
MIN_EXAMPLES_PER_TOPIC = 50


def normalize_question(text: str) -> str:
    lowered = text.lower()
    lowered = re.sub(r"[^a-z0-9\s]", " ", lowered)
    return re.sub(r"\s+", " ", lowered).strip()


def has_negation_near(text: str, start: int, end: int) -> bool:
    window = text[max(0, start - 55) : min(len(text), end + 40)]
    negations = (
        "do not",
        "don't",
        "dont",
        "never",
        "avoid",
        "must not",
        "should not",
        "not recommend",
        "cannot",
        "can't",
    )
    return any(negation in window for negation in negations)


def unsafe_phrase_present(text: str, phrases: list[str]) -> bool:
    lowered = text.lower()
    for phrase in phrases:
        for match in re.finditer(re.escape(phrase), lowered):
            if not has_negation_near(lowered, match.start(), match.end()):
                return True
    return False


def unsafe_move_present(text: str) -> bool:
    lowered = text.lower()
    phrases = ["move the person", "move someone", "move them", "move him", "move her"]
    for phrase in phrases:
        for match in re.finditer(re.escape(phrase), lowered):
            window = lowered[max(0, match.start() - 70) : min(len(lowered), match.end() + 80)]
            if has_negation_near(lowered, match.start(), match.end()):
                continue
            if "unless" in window and ("safety" in window or "cpr" in window or "danger" in window):
                continue
            return True
    return False


def spine_or_head_context(text: str) -> bool:
    lowered = text.lower()
    markers = [
        "spine",
        "spinal",
        "neck injury",
        "neck fracture",
        "neck or back",
        "back injury",
        "head injury",
        "head trauma",
        "skull",
        "car crash",
        "crash",
        "major trauma",
        "possible fracture",
    ]
    return any(marker in lowered for marker in markers)


def read_jsonl(path: Path) -> tuple[list[dict], list[str]]:
    cases: list[dict] = []
    errors: list[str] = []
    if not path.exists():
        return cases, [f"Dataset file not found: {path}"]
    with path.open("r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, start=1):
            stripped = line.strip()
            if not stripped:
                errors.append(f"line {line_no}: empty line")
                continue
            try:
                obj = json.loads(stripped)
            except json.JSONDecodeError as exc:
                errors.append(f"line {line_no}: invalid JSON: {exc}")
                continue
            if not isinstance(obj, dict):
                errors.append(f"line {line_no}: JSON value must be an object")
                continue
            obj["_line_no"] = line_no
            cases.append(obj)
    return cases, errors


def validate_cases(cases: list[dict]) -> tuple[list[str], list[str], dict]:
    errors: list[str] = []
    warnings: list[str] = []
    topic_counts = Counter()
    safety_counts = Counter()
    normalized_questions: defaultdict[str, list[int]] = defaultdict(list)
    ids: defaultdict[str, list[int]] = defaultdict(list)

    for case in cases:
        line_no = case.get("_line_no", "?")
        missing = REQUIRED_FIELDS - set(case)
        if missing:
            errors.append(f"line {line_no}: missing fields: {', '.join(sorted(missing))}")
            continue

        ids[str(case["id"])].append(line_no)
        topic_counts[case["topic"]] += 1
        safety_counts[case["safety_level"]] += 1
        normalized_questions[normalize_question(str(case["question"]))].append(line_no)

        if not str(case["question"]).strip():
            errors.append(f"line {line_no}: empty question")
        if not str(case["expected_answer"]).strip():
            errors.append(f"line {line_no}: empty expected_answer")
        if case["topic"] not in TOPICS:
            errors.append(f"line {line_no}: unknown topic {case['topic']!r}")
        if case["safety_level"] not in VALID_SAFETY_LEVELS:
            errors.append(f"line {line_no}: invalid safety_level {case['safety_level']!r}")
        if case["difficulty"] not in VALID_DIFFICULTY:
            errors.append(f"line {line_no}: invalid difficulty {case['difficulty']!r}")
        if not isinstance(case["must_include"], list) or not (2 <= len(case["must_include"]) <= 5):
            errors.append(f"line {line_no}: must_include must be a list with 2 to 5 concepts")
        if not isinstance(case["must_not_include"], list) or len(case["must_not_include"]) < 2:
            errors.append(f"line {line_no}: must_not_include must be a list with at least 2 concepts")
        if not str(case["source"]).startswith("raw_sources/"):
            warnings.append(f"line {line_no}: source is not under raw_sources/")

        answer = str(case["expected_answer"])
        combined = f"{case['question']} {answer}"
        lowered_answer = answer.lower()

        if case["safety_level"] == "emergency" and "local emergency services" not in lowered_answer:
            errors.append(f"line {line_no}: emergency case does not mention local emergency services")

        if case["topic"] in {"poisoning", "drug_exposure"}:
            if unsafe_phrase_present(answer, ["induce vomiting", "make them vomit", "make someone vomit"]):
                errors.append(f"line {line_no}: poisoning/drug case recommends vomiting")

        if case["topic"] == "unconscious_person" or "unconscious" in combined.lower() or "unresponsive" in combined.lower():
            if unsafe_phrase_present(answer, ["give food", "give water", "give drink", "offer food", "offer water", "offer drink"]):
                errors.append(f"line {line_no}: unconscious/unresponsive case recommends food or drink")

        if spine_or_head_context(combined) and unsafe_move_present(answer):
            errors.append(f"line {line_no}: possible spine/head injury case recommends moving unnecessarily")

    for topic in TOPICS:
        if topic_counts[topic] < MIN_EXAMPLES_PER_TOPIC:
            errors.append(f"topic {topic}: only {topic_counts[topic]} examples, expected at least {MIN_EXAMPLES_PER_TOPIC}")

    duplicate_questions = {q: lines for q, lines in normalized_questions.items() if len(lines) > 1}
    for question, lines in list(duplicate_questions.items())[:20]:
        errors.append(f"duplicate normalized question at lines {lines}: {question!r}")
    if len(duplicate_questions) > 20:
        errors.append(f"{len(duplicate_questions) - 20} more duplicate normalized questions omitted from output")

    duplicate_ids = {case_id: lines for case_id, lines in ids.items() if len(lines) > 1}
    for case_id, lines in duplicate_ids.items():
        errors.append(f"duplicate id {case_id!r} at lines {lines}")

    weak_topics = [topic for topic in TOPICS if topic_counts[topic] < MIN_EXAMPLES_PER_TOPIC]
    stats = {
        "total_examples": len(cases),
        "topic_counts": dict(topic_counts),
        "safety_counts": dict(safety_counts),
        "duplicate_question_count": sum(len(lines) - 1 for lines in duplicate_questions.values()),
        "duplicate_id_count": sum(len(lines) - 1 for lines in duplicate_ids.values()),
        "weak_topics": weak_topics,
    }
    return errors, warnings, stats


def table(title: str, counts: dict, order: list[str]) -> list[str]:
    rows = [f"## {title}", "", "| Item | Count |", "| --- | ---: |"]
    for item in order:
        rows.append(f"| {item} | {counts.get(item, 0)} |")
    rows.append("")
    return rows


def write_report(errors: list[str], warnings: list[str], stats: dict) -> None:
    validation_lines = []
    if errors:
        validation_lines.append(f"- Validation failed with {len(errors)} error(s).")
        validation_lines.extend(f"- ERROR: {error}" for error in errors[:30])
        if len(errors) > 30:
            validation_lines.append(f"- ... {len(errors) - 30} additional error(s) omitted.")
    elif warnings:
        validation_lines.append(f"- Validation passed with {len(warnings)} warning(s).")
        validation_lines.extend(f"- WARNING: {warning}" for warning in warnings[:30])
        if len(warnings) > 30:
            validation_lines.append(f"- ... {len(warnings) - 30} additional warning(s) omitted.")
    else:
        validation_lines.append("- Validation passed with no warnings.")

    lines = [
        "# Dataset Expansion Report",
        "",
        f"Generated file: `{DATASET_PATH.relative_to(ROOT)}`",
        f"Total number of examples: {stats.get('total_examples', 0)}",
        f"Duplicate count: {stats.get('duplicate_question_count', 0)}",
        "",
    ]
    lines.extend(table("Examples per topic", stats.get("topic_counts", {}), TOPICS))
    lines.extend(table("Examples per safety level", stats.get("safety_counts", {}), ["low", "moderate", "urgent", "emergency", "out_of_scope"]))
    lines.extend(["## Validation warnings", ""])
    lines.extend(validation_lines)
    lines.extend(
        [
            "",
            "## Remaining weak topics",
            "",
            "- " + (", ".join(stats.get("weak_topics", [])) if stats.get("weak_topics") else "None by count threshold; all topics have at least 50 examples."),
            "",
            "## Recommendations for manual medical review",
            "",
            "- Review all emergency, poisoning, drug exposure, infant choking, CPR, stroke, heart attack, anaphylaxis, and spine/head injury cases before production use.",
            "- Confirm the dataset against current local first-aid training standards and local emergency-number policy before localization.",
            "- Keep medication-related language limited to calling emergency services, poison control, dispatcher instructions, and existing prescribed auto-injectors; do not add dosage instructions.",
            "- Treat this as retrieval/evaluation data until reviewed by a qualified first-aid or clinical reviewer.",
            "",
        ]
    )
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    cases, parse_errors = read_jsonl(DATASET_PATH)
    errors, warnings, stats = validate_cases(cases) if cases else ([], [], {"total_examples": 0, "topic_counts": {}, "safety_counts": {}, "duplicate_question_count": 0, "weak_topics": TOPICS})
    errors = parse_errors + errors
    write_report(errors, warnings, stats)
    SUMMARY_PATH.write_text(
        json.dumps({"errors": errors, "warnings": warnings, "stats": stats}, indent=2, sort_keys=True),
        encoding="utf-8",
    )

    print(f"Validated {stats.get('total_examples', 0)} examples from {DATASET_PATH.relative_to(ROOT)}")
    print(f"Duplicate normalized questions: {stats.get('duplicate_question_count', 0)}")
    print(f"Warnings: {len(warnings)}")
    print(f"Errors: {len(errors)}")
    if errors:
        for error in errors[:20]:
            print(f"ERROR: {error}")
        if len(errors) > 20:
            print(f"... {len(errors) - 20} more error(s)")
        return 1
    if warnings:
        for warning in warnings[:20]:
            print(f"WARNING: {warning}")
        if len(warnings) > 20:
            print(f"... {len(warnings) - 20} more warning(s)")
    print("Validation passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
