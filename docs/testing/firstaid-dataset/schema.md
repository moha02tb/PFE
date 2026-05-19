# First-Aid Dataset V2 Schema

Each line in `generated_cases/firstaid_expanded_v1.jsonl` is one JSON object.

## Required fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | yes | Stable unique case id, using the `fa2-` prefix. |
| `topic` | string | yes | One controlled topic from the coverage matrix. |
| `subtopic` | string | yes | Specific scenario family within the topic. Near-duplicate question variants share the same subtopic. |
| `question` | string | yes | User-facing question or utterance. May include short, panic-style, misspelled, age-specific, or unsafe variants. |
| `expected_answer` | string | yes | Concise first-aid answer grounded in `raw_sources/` notes. Must avoid diagnosis, unsafe steps, and medication dosage advice. |
| `safety_level` | string | yes | One of `low`, `moderate`, `urgent`, `emergency`, or `out_of_scope`. |
| `must_include` | array[string] | yes | Two to five required concepts the retrieval answer should contain or clearly imply. |
| `must_not_include` | array[string] | yes | Dangerous, unsupported, or incorrect concepts that the retrieval answer must avoid. |
| `source` | string | yes | Local source-note reference, usually `raw_sources/firstaid_source_notes.md#<topic>`. |
| `language` | string | yes | ISO-style language code. Initial v2 data uses `en`. |
| `difficulty` | string | yes | One of `basic`, `intermediate`, or `advanced`, based on scenario nuance and risk. |

## Safety rules

- Do not include diagnosis claims.
- Do not include medication dosage advice.
- Life-threatening cases must instruct the user to call local emergency services.
- Country-specific emergency numbers should not be used unless verified for the target country. Use `call local emergency services` by default.
- Poisoning answers must not recommend inducing vomiting.
- Unconscious-person answers must not recommend giving food or drink.
- Possible spine, head, neck, or back injury answers must not recommend moving the person unless needed for immediate safety or CPR.
- Embedded objects should not be removed by a lay responder. Stabilize/pad around them and seek urgent or emergency care.

## Controlled topics

The topic set is defined in `audits/coverage_matrix.csv` and mirrored by the validation script.
