"""Regional access helpers for assistant accounts.

Assistant accounts are restricted to one broad Tunisia region. The mappings
below group the 24 Tunisian governorates into north, middle, and south zones.
"""

from __future__ import annotations

import unicodedata
from typing import Iterable

from sqlalchemy import func


ASSISTANT_REGION_ORDER = ("north", "middle", "south")
VALID_ASSISTANT_REGIONS = set(ASSISTANT_REGION_ORDER)

REGION_ALIASES = {
    "north": "north",
    "nord": "north",
    "middle": "middle",
    "center": "middle",
    "centre": "middle",
    "central": "middle",
    "south": "south",
    "sud": "south",
}

REGION_LABELS = {
    "north": "North Tunisia",
    "middle": "Middle Tunisia",
    "south": "South Tunisia",
}

REGION_DISPLAY_GOVERNORATES = {
    "north": [
        "Tunis",
        "Ariana",
        "Ben Arous",
        "Manouba",
        "Bizerte",
        "Nabeul",
        "Zaghouan",
        "Beja",
        "Jendouba",
        "Kef",
        "Siliana",
    ],
    "middle": [
        "Sousse",
        "Monastir",
        "Mahdia",
        "Kairouan",
        "Kasserine",
        "Sidi Bouzid",
        "Sfax",
    ],
    "south": [
        "Gabes",
        "Medenine",
        "Tataouine",
        "Gafsa",
        "Tozeur",
        "Kebili",
    ],
}

REGION_GOVERNORATES = {
    "north": {
        "Tunis",
        "Ariana",
        "Ben Arous",
        "Manouba",
        "Bizerte",
        "Nabeul",
        "Zaghouan",
        "Beja",
        "Béja",
        "Jendouba",
        "Kef",
        "Le Kef",
        "Siliana",
    },
    "middle": {
        "Sousse",
        "Monastir",
        "Mahdia",
        "Kairouan",
        "Kasserine",
        "Sidi Bouzid",
        "Sfax",
    },
    "south": {
        "Gabes",
        "Gabès",
        "Medenine",
        "Médenine",
        "Tataouine",
        "Gafsa",
        "Tozeur",
        "Kebili",
        "Kébili",
    },
}


def normalize_text(value: str | None) -> str:
    """Return a lowercase ASCII key with accents and duplicate spaces removed."""
    if value is None:
        return ""

    decomposed = unicodedata.normalize("NFKD", str(value).strip())
    ascii_text = "".join(char for char in decomposed if not unicodedata.combining(char))
    return " ".join(ascii_text.replace("-", " ").replace("_", " ").lower().split())


def normalize_region(value: str | None) -> str | None:
    normalized = normalize_text(value)
    if not normalized:
        return None
    return REGION_ALIASES.get(normalized)


def region_label(region: str | None) -> str:
    normalized = normalize_region(region)
    if not normalized:
        return "Unknown region"
    return REGION_LABELS[normalized]


def governorates_for_region(region: str | None) -> list[str]:
    normalized = normalize_region(region)
    if not normalized:
        return []
    return list(REGION_DISPLAY_GOVERNORATES[normalized])


def accepted_governorates_for_region(region: str | None) -> list[str]:
    normalized = normalize_region(region)
    if not normalized:
        return []
    return sorted(REGION_GOVERNORATES[normalized])


def region_options() -> list[dict]:
    """Return stable region option metadata for API clients."""
    return [
        {
            "value": region,
            "label": REGION_LABELS[region],
            "governorates": governorates_for_region(region),
        }
        for region in ASSISTANT_REGION_ORDER
    ]


def _region_keys(region: str | None) -> set[str]:
    return {normalize_text(name) for name in accepted_governorates_for_region(region)}


def governorate_in_region(governorate: str | None, region: str | None) -> bool:
    if not governorate:
        return False
    return normalize_text(governorate) in _region_keys(region)


def region_filter_values(region: str | None) -> list[str]:
    """Return lowercase values suitable for SQL lower(column) IN (...)."""
    values: set[str] = set()
    for governorate in accepted_governorates_for_region(region):
        values.add(governorate.lower())
        values.add(normalize_text(governorate))
    return sorted(values)


def apply_region_scope(query, model, region: str | None):
    """Apply an assistant region filter to a SQLAlchemy query when needed."""
    values = region_filter_values(region)
    if not values:
        return query
    return query.filter(func.lower(model.governorate).in_(values))


def region_access_error(governorate: str | None, region: str | None) -> str | None:
    normalized_region = normalize_region(region)
    if not normalized_region:
        return None
    if not governorate:
        return (
            "Governorate is required for assistant accounts assigned to "
            f"{region_label(normalized_region)}"
        )
    if not governorate_in_region(governorate, normalized_region):
        return (
            f"Governorate '{governorate}' is outside the assistant region "
            f"({region_label(normalized_region)})"
        )
    return None


def has_any_out_of_region(governorates: Iterable[str | None], region: str | None) -> bool:
    return any(region_access_error(governorate, region) for governorate in governorates)
