# Dataset Expansion Report

Generated file: `firstaid_dataset_v2/generated_cases/firstaid_expanded_v1.jsonl`
Total number of examples: 2015
Duplicate count: 0

## Examples per topic

| Item | Count |
| --- | ---: |
| bleeding | 65 |
| wounds | 65 |
| burns | 65 |
| electrical_burns | 65 |
| choking_adult | 65 |
| choking_child | 65 |
| choking_infant | 65 |
| cpr | 65 |
| unconscious_person | 65 |
| breathing_difficulty | 65 |
| seizure | 65 |
| poisoning | 65 |
| drug_exposure | 65 |
| allergic_reaction | 65 |
| anaphylaxis | 65 |
| heart_attack | 65 |
| stroke_symptoms | 65 |
| heat_exhaustion | 65 |
| heat_stroke | 65 |
| hypothermia | 65 |
| frostbite | 65 |
| nosebleed | 65 |
| eye_injury | 65 |
| foreign_object | 65 |
| animal_bite | 65 |
| insect_sting | 65 |
| fracture | 65 |
| sprain | 65 |
| shock | 65 |
| fainting | 65 |
| unsafe_or_out_of_scope | 65 |

## Examples per safety level

| Item | Count |
| --- | ---: |
| low | 110 |
| moderate | 115 |
| urgent | 685 |
| emergency | 1040 |
| out_of_scope | 65 |

## Validation warnings

- Validation passed with no warnings.

## Remaining weak topics

- None by count threshold; all topics have at least 50 examples.

## Recommendations for manual medical review

- Review all emergency, poisoning, drug exposure, infant choking, CPR, stroke, heart attack, anaphylaxis, and spine/head injury cases before production use.
- Confirm the dataset against current local first-aid training standards and local emergency-number policy before localization.
- Keep medication-related language limited to calling emergency services, poison control, dispatcher instructions, and existing prescribed auto-injectors; do not add dosage instructions.
- Treat this as retrieval/evaluation data until reviewed by a qualified first-aid or clinical reviewer.
