"""Cross-lingual alignment test.

30 question triplets, each phrased in EN/FR/AR. For each triplet we
retrieve the top-1 chunk in all three languages and check whether the
``category`` is the same. ``ALIGN`` if all three match,
``PARTIAL`` if exactly two match, ``DRIFT`` if all three disagree.

Target: >= 27/30 fully aligned.
"""

from __future__ import annotations

import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
except (AttributeError, ValueError):  # pragma: no cover
    pass

from rag_pipeline import FirstAidRAG

TRIPLETS: list[dict] = [
    {"id": "choking", "en": "What do I do if someone is choking?",
     "fr": "Que faire si quelqu'un s'étouffe ?",
     "ar": "ماذا أفعل إذا كان شخص ما يختنق؟"},
    {"id": "burn", "en": "How do I treat a burn on the hand?",
     "fr": "Comment soigner une brulure à la main ?",
     "ar": "كيف أعالج حرقاً في اليد؟"},
    {"id": "bleeding", "en": "How do I stop heavy bleeding from a wound?",
     "fr": "Comment arrêter un saignement important d'une plaie ?",
     "ar": "كيف أوقف نزيفاً شديداً من جرح؟"},
    {"id": "fracture", "en": "How do I treat a suspected bone fracture?",
     "fr": "Comment traiter une fracture osseuse présumée ?",
     "ar": "كيف أتعامل مع كسر مشتبه به في العظم؟"},
    {"id": "poisoning", "en": "What do I do if a child swallowed poison?",
     "fr": "Que faire si un enfant a avalé du poison ?",
     "ar": "ماذا أفعل إذا ابتلع طفل مادة سامة؟"},
    {"id": "drowning", "en": "What to do for someone who almost drowned?",
     "fr": "Que faire pour une personne qui a failli se noyer ?",
     "ar": "ماذا أفعل لشخص كاد يغرق؟"},
    {"id": "seizure", "en": "How do I help someone having a seizure?",
     "fr": "Comment aider quelqu'un qui fait une crise d'épilepsie ?",
     "ar": "كيف أساعد شخصاً يتعرض لنوبة صرع؟"},
    {"id": "cardiac", "en": "How do I perform CPR on an adult?",
     "fr": "Comment faire un massage cardiaque sur un adulte ?",
     "ar": "كيف أقوم بالإنعاش القلبي الرئوي على بالغ؟"},
    {"id": "stroke", "en": "How do I recognize a stroke and what to do?",
     "fr": "Comment reconnaitre un AVC et que faire ?",
     "ar": "كيف أتعرف على السكتة الدماغية وماذا أفعل؟"},
    {"id": "anaphylaxis", "en": "What to do for a severe allergic reaction?",
     "fr": "Que faire en cas de réaction allergique sévère ?",
     "ar": "ماذا أفعل في حالة الحساسية المفرطة؟"},
    {"id": "head-trauma", "en": "What to do for a head injury after fall?",
     "fr": "Que faire pour une blessure à la tête après une chute ?",
     "ar": "ماذا أفعل لإصابة في الرأس بعد سقوط؟"},
    {"id": "electric-shock", "en": "How to help someone who was electrocuted?",
     "fr": "Comment aider quelqu'un qui a été électrocuté ?",
     "ar": "كيف أساعد شخصاً تعرض لصعقة كهربائية؟"},
    {"id": "chemical-burn", "en": "How to treat a chemical burn on the skin?",
     "fr": "Comment soigner une brulure chimique sur la peau ?",
     "ar": "كيف أعالج حرقاً كيميائياً على الجلد؟"},
    {"id": "hypothermia", "en": "How to treat hypothermia from cold exposure?",
     "fr": "Comment soigner l'hypothermie due au froid ?",
     "ar": "كيف أعالج انخفاض حرارة الجسم من البرد؟"},
    {"id": "diabetic", "en": "What to do for low blood sugar emergency?",
     "fr": "Que faire en cas d'hypoglycémie d'urgence ?",
     "ar": "ماذا أفعل في حالة طوارئ انخفاض السكر؟"},
    {"id": "spinal", "en": "What to do for a suspected spinal injury?",
     "fr": "Que faire pour une suspicion de lésion de la colonne ?",
     "ar": "ماذا أفعل لإصابة محتملة في العمود الفقري؟"},
    {"id": "asthma", "en": "How to help someone in a severe asthma attack?",
     "fr": "Comment aider quelqu'un en crise d'asthme sévère ?",
     "ar": "كيف أساعد شخصاً في نوبة ربو شديدة؟"},
    {"id": "febrile-seizure", "en": "What to do for a child having febrile seizure?",
     "fr": "Que faire pour un enfant en convulsion fébrile ?",
     "ar": "ماذا أفعل لطفل في نوبة تشنج بسبب الحمى؟"},
    {"id": "co-poisoning", "en": "What to do for carbon monoxide poisoning?",
     "fr": "Que faire en cas d'intoxication au monoxyde de carbone ?",
     "ar": "ماذا أفعل في حالة التسمم بأول أكسيد الكربون؟"},
    {"id": "cpr-basics", "en": "Steps of cardiopulmonary resuscitation",
     "fr": "Étapes de la réanimation cardio-pulmonaire",
     "ar": "خطوات الإنعاش القلبي الرئوي"},
    {"id": "nosebleed", "en": "How do I stop a nosebleed in a child?",
     "fr": "Comment arrêter un saignement de nez chez un enfant ?",
     "ar": "كيف أوقف نزيفاً من الأنف عند طفل؟"},
    {"id": "sprain", "en": "How to treat a sprained ankle at home?",
     "fr": "Comment soigner une entorse de la cheville à la maison ?",
     "ar": "كيف أعالج التواء الكاحل في المنزل؟"},
    {"id": "cut", "en": "How to treat a small cut on the finger?",
     "fr": "Comment soigner une petite coupure au doigt ?",
     "ar": "كيف أعالج جرحاً صغيراً في الإصبع؟"},
    {"id": "insect-bite", "en": "What to do after a bee sting?",
     "fr": "Que faire après une piqûre d'abeille ?",
     "ar": "ماذا أفعل بعد قرصة نحلة؟"},
    {"id": "snake-bite", "en": "What to do after a snake bite?",
     "fr": "Que faire après une morsure de serpent ?",
     "ar": "ماذا أفعل بعد لدغة ثعبان؟"},
    {"id": "unconscious", "en": "How to help an unconscious person who is breathing?",
     "fr": "Comment aider une personne inconsciente qui respire ?",
     "ar": "كيف أساعد شخصاً فاقد الوعي يتنفس؟"},
    {"id": "shock", "en": "How to recognize and treat shock?",
     "fr": "Comment reconnaitre et soigner un état de choc ?",
     "ar": "كيف أتعرف على الصدمة وأعالجها؟"},
    {"id": "epipen", "en": "How and when to use an EpiPen?",
     "fr": "Comment et quand utiliser un stylo EpiPen ?",
     "ar": "كيف ومتى أستخدم حاقن الأدرينالين EpiPen؟"},
    {"id": "frostbite", "en": "How to treat frostbite on fingers?",
     "fr": "Comment soigner des gelures sur les doigts ?",
     "ar": "كيف أعالج قضمة الصقيع على الأصابع؟"},
    {"id": "baby-fall", "en": "What to do after a baby falls from changing table?",
     "fr": "Que faire après la chute d'un bébé d'une table à langer ?",
     "ar": "ماذا أفعل بعد سقوط رضيع من طاولة التغيير؟"},
]


def main() -> None:
    print("== Cross-lingual alignment test ==")
    rag = FirstAidRAG()
    if len(TRIPLETS) != 30:
        print(f"!! triplet count = {len(TRIPLETS)} (spec wants 30)")
    aligned = 0
    partial = 0
    drift = 0
    drift_details: list[str] = []

    for i, t in enumerate(TRIPLETS, 1):
        hits_en = rag.retrieve(t["en"], top_k=1)
        hits_fr = rag.retrieve(t["fr"], top_k=1)
        hits_ar = rag.retrieve(t["ar"], top_k=1)
        cat_en = hits_en[0]["metadata"].get("category") if hits_en else None
        cat_fr = hits_fr[0]["metadata"].get("category") if hits_fr else None
        cat_ar = hits_ar[0]["metadata"].get("category") if hits_ar else None
        cats = [cat_en, cat_fr, cat_ar]

        if cat_en == cat_fr == cat_ar:
            verdict = "ALIGN"
            aligned += 1
        elif len(set(cats)) == 2:
            verdict = "PARTIAL"
            partial += 1
        else:
            verdict = "DRIFT"
            drift += 1
            drift_details.append(f"{t['id']}: en={cat_en}, fr={cat_fr}, ar={cat_ar}")

        marker = "OK" if verdict == "ALIGN" else "..."
        print(f"  [{i:02d}/{len(TRIPLETS)}] {verdict:7s} {t['id']:18s} "
              f"en={cat_en}, fr={cat_fr}, ar={cat_ar}")

    total = len(TRIPLETS)
    print()
    print(f"== Score: {aligned}/{total} aligned, {partial} partial, {drift} drift ==")
    if drift_details:
        print("-- drift cases --")
        for d in drift_details:
            print(f"  - {d}")

    if aligned >= 27:
        print(f"\n=> PASS (>= 27/30)")
    else:
        print(f"\n=> FAIL (< 27/30)  needs cross-lingual seeds in weaker languages")


if __name__ == "__main__":
    main()
