#!/usr/bin/env python3
"""Create train/validation/test splits grouped by topic and subtopic."""

from __future__ import annotations

import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATASET_PATH = ROOT / "firstaid_dataset_v2" / "generated_cases" / "firstaid_expanded_v1.jsonl"
OUT_DIR = ROOT / "firstaid_dataset_v2" / "generated_cases"
SPLIT_FILES = {
    "train": OUT_DIR / "train.jsonl",
    "validation": OUT_DIR / "validation.jsonl",
    "test": OUT_DIR / "test.jsonl",
}


def stable_sort_key(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def read_cases() -> list[dict]:
    cases: list[dict] = []
    with DATASET_PATH.open("r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                cases.append(json.loads(line))
    return cases


def split_cases(cases: list[dict]) -> dict[str, list[dict]]:
    by_topic_group: dict[str, dict[str, list[dict]]] = defaultdict(lambda: defaultdict(list))
    for case in cases:
        by_topic_group[case["topic"]][case["subtopic"]].append(case)

    splits = {"train": [], "validation": [], "test": []}
    group_split: dict[str, str] = {}
    for topic, groups in sorted(by_topic_group.items()):
        group_ids = sorted(groups, key=lambda g: stable_sort_key(f"{topic}:{g}"))
        total = len(group_ids)
        train_n = round(total * 0.70)
        validation_n = round(total * 0.15)
        if train_n + validation_n >= total:
            validation_n = max(1, validation_n)
            train_n = max(1, total - validation_n - 1)

        train_groups = set(group_ids[:train_n])
        validation_groups = set(group_ids[train_n : train_n + validation_n])

        for group_id in group_ids:
            if group_id in train_groups:
                split = "train"
            elif group_id in validation_groups:
                split = "validation"
            else:
                split = "test"
            group_split[group_id] = split
            splits[split].extend(sorted(groups[group_id], key=lambda c: c["id"]))

    for split in splits:
        splits[split].sort(key=lambda c: (c["topic"], c["subtopic"], c["id"]))
    return splits


def write_splits(splits: dict[str, list[dict]]) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for split, path in SPLIT_FILES.items():
        with path.open("w", encoding="utf-8") as f:
            for case in splits[split]:
                f.write(json.dumps(case, ensure_ascii=False, sort_keys=True) + "\n")


def assert_no_subtopic_leakage(splits: dict[str, list[dict]]) -> None:
    owners: dict[str, str] = {}
    for split, cases in splits.items():
        for case in cases:
            key = f"{case['topic']}::{case['subtopic']}"
            previous = owners.setdefault(key, split)
            if previous != split:
                raise AssertionError(f"Subtopic leakage for {key}: {previous} and {split}")


def print_summary(splits: dict[str, list[dict]]) -> None:
    total = sum(len(cases) for cases in splits.values())
    print(f"Total examples: {total}")
    for split in ["train", "validation", "test"]:
        cases = splits[split]
        topic_counts = Counter(case["topic"] for case in cases)
        print(f"{split}: {len(cases)} examples ({len(cases) / total:.1%}) -> {SPLIT_FILES[split].relative_to(ROOT)}")
        low_topics = [topic for topic, count in sorted(topic_counts.items()) if count == 0]
        if low_topics:
            print(f"  missing topics: {', '.join(low_topics)}")
        else:
            per_topic_values = sorted(topic_counts.values())
            print(f"  per-topic min/max: {per_topic_values[0]}/{per_topic_values[-1]}")


def main() -> None:
    cases = read_cases()
    splits = split_cases(cases)
    assert_no_subtopic_leakage(splits)
    write_splits(splits)
    print_summary(splits)


if __name__ == "__main__":
    main()
