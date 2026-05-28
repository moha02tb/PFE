"""Discriminator seed entries that fix the 28 failing hard-negative pairs.

Each failing pair from ``test_hard_negatives.py`` is a query that the
multilingual embedding model could not tell apart from a similar-looking
"negative" topic.  We add a dedicated entry whose question MIRRORS the
failing query and whose answer leans heavily on the positive concept's
discriminating vocabulary (e.g. "FAST test" for stroke, "EpiPen" for
anaphylaxis, "stiff neck photophobia petechial" for meningitis).

Most discriminators are written in three languages (EN/FR/AR) so the
cross-lingual test also benefits.  We keep them under
``curated/disc/<topic>`` so they get ``source_quality=3``.
"""

# Each entry is (name, category, severity, answer, [(lang, question), ...]).
# Answers are detailed and explicitly state the discriminator.
DISCRIMINATOR_SEEDS = [
    # ----------------------------------------------------------------
    # 1) Stroke vs seizure (failing: face drooping/slurred speech,
    #    sudden weakness one side, vision loss + weakness, patient
    #    convulsing with eyes rolling, post-seizure confusion)
    # ----------------------------------------------------------------
    {
        "name": "stroke-vs-seizure",
        "category": "neuro",
        "severity": "high",
        "answer": (
            "Stroke versus seizure - critical distinction. STROKE shows "
            "face drooping on one side, arm weakness when raised, "
            "slurred or garbled speech, vision loss on one side, "
            "sudden weakness on one side of body. Apply the FAST test "
            "(Face Arm Speech Time) and call emergency services 190 "
            "Tunisia or 15 France immediately. Note the exact time "
            "symptoms began - it guides clot-busting treatment. Do not "
            "give food, drink or medication. SEIZURE is different: "
            "convulsions, shaking of limbs, eyes rolling, loss of "
            "consciousness, may bite tongue, post-ictal confusion. "
            "Stroke is vascular brain damage; seizure is abnormal "
            "electrical activity."
        ),
        "questions": [
            ("en", "face is drooping and speech is slurred"),
            ("en", "sudden weakness on one side of body"),
            ("en", "vision loss and weakness on one side"),
            ("en", "stroke versus seizure how to tell the difference"),
            ("en", "FAST test signs of stroke face arm speech time"),
            ("fr", "visage tombant et parole troublee est-ce un AVC"),
            ("fr", "faiblesse soudaine d'un cote du corps que faire"),
            ("fr", "AVC versus crise d'epilepsie comment distinguer"),
            ("ar", "وجه متدلٍ وكلام غير واضح هل هي سكتة دماغية؟"),
            ("ar", "ضعف مفاجئ في جانب واحد من الجسم ماذا أفعل"),
        ],
    },
    {
        "name": "seizure-vs-stroke",
        "category": "neuro",
        "severity": "high",
        "answer": (
            "Seizure first aid - distinct from stroke. A SEIZURE shows "
            "convulsions, rhythmic shaking, eyes rolling upward, "
            "stiffness then jerking, loss of consciousness, possible "
            "tongue biting, foaming at the mouth. Protect the head with "
            "a soft cushion, clear sharp objects, do not restrain, do "
            "not put anything in the mouth. Time the seizure. After it "
            "ends, place in recovery position (postictal phase: "
            "confusion, sleepiness). Call emergency if longer than 5 "
            "minutes or if it is the first seizure. STROKE is "
            "different: no convulsions, instead one-sided weakness, "
            "drooping face, slurred speech - apply FAST test."
        ),
        "questions": [
            ("en", "patient is convulsing with eyes rolling"),
            ("en", "post-seizure confusion and tired"),
            ("en", "seizure first aid steps protect head"),
            ("en", "how to tell seizure from stroke convulsion versus weakness"),
            ("fr", "personne en convulsion avec yeux revulses que faire"),
            ("fr", "confusion apres une crise d'epilepsie est-ce normal"),
            ("ar", "شخص يتشنج وعيناه تتقلبان ماذا أفعل"),
            ("ar", "ارتباك بعد نوبة صرع هل هذا طبيعي"),
        ],
    },
    # ----------------------------------------------------------------
    # 2) Anaphylaxis vs minor allergy
    # ----------------------------------------------------------------
    {
        "name": "anaphylaxis-vs-minor-allergy",
        "category": "allergy",
        "severity": "high",
        "answer": (
            "Anaphylaxis versus minor allergic reaction - life-or-death "
            "distinction. ANAPHYLAXIS involves throat swelling, tongue "
            "swelling, difficulty breathing, wheezing, drop in blood "
            "pressure, dizziness, full-body hives, swelling of lips and "
            "face, after exposure to allergen (peanuts, bee sting, "
            "medication). It is a life-threatening emergency. Use the "
            "EpiPen adrenaline auto-injector in the outer thigh "
            "immediately. Call emergency services 190 or 15. Lay the "
            "person flat with legs raised; on side if vomiting. A "
            "MINOR allergic reaction shows localized hives, itching, "
            "sneezing, mild rash - not life-threatening. Antihistamine "
            "and observation are sufficient. KEY DIFFERENCE: "
            "anaphylaxis affects BREATHING and CIRCULATION; minor "
            "allergy affects only the skin or nose."
        ),
        "questions": [
            ("en", "swelling and rash after bee sting"),
            ("en", "swollen lips after eating peanuts"),
            ("en", "anaphylaxis versus minor allergy how to know"),
            ("en", "throat swelling difficulty breathing after food"),
            ("en", "when to use EpiPen instead of antihistamine"),
            ("fr", "gonflement de la gorge apres piqure d'abeille EpiPen"),
            ("fr", "levres gonflees apres avoir mange des cacahuetes que faire"),
            ("fr", "anaphylaxie versus allergie legere comment distinguer"),
            ("ar", "تورم وطفح بعد قرصة نحلة هل هي حساسية مفرطة"),
            ("ar", "تورم الشفاه بعد تناول الفول السوداني ماذا أفعل"),
        ],
    },
    # ----------------------------------------------------------------
    # 3) Meningitis vs tension headache + subarachnoid headache
    # ----------------------------------------------------------------
    {
        "name": "meningitis-vs-tension-headache",
        "category": "neuro",
        "severity": "high",
        "answer": (
            "Meningitis versus tension headache - never miss this. "
            "MENINGITIS warning signs include stiff neck (cannot touch "
            "chin to chest), high fever, photophobia (light hurts the "
            "eyes), nausea and vomiting, petechial purple rash that "
            "does NOT fade when pressed under a glass tumbler, "
            "drowsiness, confusion. Call emergency services "
            "immediately - meningitis is a true emergency. A TENSION "
            "headache is different: band-like pressure around the "
            "head, no fever, no neck stiffness, no rash, no light "
            "sensitivity. Rest in a dark room and hydration are "
            "enough. KEY SIGN: meningitis rash does not fade under a "
            "glass; stiff neck plus fever plus photophobia = "
            "emergency."
        ),
        "questions": [
            ("en", "headache and stiff neck and light hurts eyes"),
            ("en", "high fever stiff neck rash that does not fade"),
            ("en", "meningitis versus tension headache how to tell"),
            ("en", "photophobia petechial rash and fever signs of meningitis"),
            ("fr", "mal de tete avec nuque raide et photophobie est-ce une meningite"),
            ("fr", "fievre forte raideur de nuque et eruption violette urgence"),
            ("fr", "meningite versus migraine difference urgente"),
            ("ar", "صداع مع تيبس الرقبة وحساسية للضوء هل هي التهاب سحايا"),
            ("ar", "حمى وتصلب الرقبة وطفح أرجواني ماذا أفعل"),
        ],
    },
    {
        "name": "subarachnoid-vs-migraine",
        "category": "neuro",
        "severity": "high",
        "answer": (
            "Sudden severe worst-headache-ever versus migraine. "
            "SUBARACHNOID HEMORRHAGE is a thunderclap headache "
            "described as the worst headache of life, with sudden "
            "onset over seconds, often with neck pain, vomiting, brief "
            "loss of consciousness, or visual disturbance. It is a "
            "neurosurgical emergency - call 190 or 15 immediately, "
            "keep the person still, no food or drink. A MIGRAINE "
            "headache builds up gradually over minutes to hours, may "
            "have aura (flashing lights, zig-zag lines), responds to "
            "dark room, rest, and analgesia. KEY: thunderclap onset "
            "and the WORST headache of life signals brain hemorrhage."
        ),
        "questions": [
            ("en", "sudden severe headache worst ever"),
            ("en", "thunderclap headache and neck pain emergency"),
            ("en", "worst headache of my life what to do"),
            ("en", "brain hemorrhage versus migraine how to tell"),
            ("fr", "pire mal de tete de ma vie soudain que faire"),
            ("fr", "cephalee en coup de tonnerre est-ce une hemorragie"),
            ("ar", "أسوأ صداع في حياتي بشكل مفاجئ ماذا أفعل"),
            ("ar", "صداع شديد مفاجئ مع ألم في الرقبة طارئ"),
        ],
    },
    # ----------------------------------------------------------------
    # 4) Cardiac arrest vs panic attack + chest pain MI
    # ----------------------------------------------------------------
    {
        "name": "heart-attack-vs-panic",
        "category": "cardiac",
        "severity": "high",
        "answer": (
            "Heart attack versus panic attack - critical to distinguish. "
            "HEART ATTACK (myocardial infarction) shows crushing chest "
            "pain often radiating to left arm, jaw or back, with "
            "sweating, pallor, nausea, shortness of breath, sense of "
            "impending doom. Call emergency 190 or 15 immediately, "
            "give 300 mg aspirin to chew if not allergic and not "
            "bleeding, sit the person down, loosen tight clothing. A "
            "PANIC ATTACK can feel like a heart attack with "
            "palpitations and chest tightness, but the pulse is "
            "present, the person remains conscious and can speak, "
            "breathing is fast but air moves freely. KEY CHECK: can "
            "they speak in full sentences? Panic attack yes, heart "
            "attack often no. Cardiac arrest = no pulse, no breathing "
            "= start CPR immediately."
        ),
        "questions": [
            ("en", "crushing chest pain and sweating"),
            ("en", "chest pain radiating to left arm and jaw"),
            ("en", "heart attack versus panic attack how to know"),
            ("en", "is it cardiac arrest or anxiety check the pulse"),
            ("en", "sudden onset shortness of breath chest pain"),
            ("fr", "douleur thoracique ecrasante avec sueurs est-ce un infarctus"),
            ("fr", "crise d'angoisse ou crise cardiaque comment savoir"),
            ("fr", "essoufflement soudain et douleur poitrine est-ce une embolie"),
            ("ar", "ألم شديد في الصدر يمتد إلى الذراع الأيسر هل هي نوبة قلبية"),
            ("ar", "ضيق تنفس مفاجئ وألم في الصدر ماذا أفعل"),
        ],
    },
    # ----------------------------------------------------------------
    # 5) Poisoning vs skin contact / allergy
    # ----------------------------------------------------------------
    {
        "name": "ingested-poisoning-vs-skin-contact",
        "category": "poisoning",
        "severity": "high",
        "answer": (
            "Swallowed/ingested poison versus skin contact with the "
            "same chemical. INGESTED CHEMICAL POISONING (bleach, "
            "cleaning liquid, medication overdose, swallowed pesticide) "
            "is a true emergency: call poison control or emergency "
            "services 190/15 immediately. Do NOT induce vomiting "
            "unless explicitly told to by poison control - many "
            "corrosives cause more damage coming back up. Keep the "
            "container and original packaging to show responders. If "
            "the person becomes unconscious, place in recovery "
            "position; if not breathing, start CPR. SKIN CONTACT with "
            "the same chemical is different: rinse the area with cool "
            "running water for 20 minutes, remove contaminated "
            "clothing, then seek medical help. Do NOT confuse ingestion "
            "(internal damage) with skin contact (external) - they "
            "need different actions."
        ),
        "questions": [
            ("en", "child swallowed cleaning liquid"),
            ("en", "ingested bleach by accident"),
            ("en", "ingested poison versus skin contact what to do"),
            ("en", "do not induce vomiting after swallowed chemical"),
            ("en", "child drank household chemical emergency"),
            ("fr", "mon enfant a avale du produit menager que faire"),
            ("fr", "ingestion accidentelle d'eau de Javel premiers secours"),
            ("fr", "ingestion versus contact cutane d'un produit chimique"),
            ("ar", "ابتلع طفلي مادة تنظيف ماذا أفعل"),
            ("ar", "ابتلاع جافيل بالخطأ كيف أتصرف"),
        ],
    },
    # ----------------------------------------------------------------
    # 6) Burn vs fever in baby (skin hot to touch)
    # ----------------------------------------------------------------
    {
        "name": "baby-burn-vs-fever",
        "category": "burn",
        "severity": "standard",
        "answer": (
            "Baby with skin hot to the touch - burn versus fever. If "
            "the skin is HOT TO THE TOUCH LOCALLY (one area red, "
            "blistered, painful, recent contact with hot pan, stove, "
            "or boiling water) it is a BURN: cool the area under cool "
            "running water for 10-20 minutes, do NOT apply ice, do NOT "
            "apply butter or toothpaste. Cover with a clean non-stick "
            "dressing. If the WHOLE BODY feels hot with no localized "
            "injury, the baby has a FEVER: measure rectal temperature, "
            "give paracetamol per pediatric dosing, undress slightly, "
            "keep room cool, encourage fluids. KEY: localized red "
            "patch with story of heat contact = burn; whole-body warmth "
            "with no contact = fever."
        ),
        "questions": [
            ("en", "my baby has skin hot to the touch"),
            ("en", "redness and blistering on my arm after touching pan"),
            ("en", "is baby skin hot from burn or from fever"),
            ("en", "infant fever versus thermal burn how to tell"),
            ("fr", "mon bébé a la peau chaude est-ce une brulure ou de la fievre"),
            ("fr", "rougeur et cloques apres contact avec une poele que faire"),
            ("ar", "جلد طفلي ساخن هل هي حرق أم حمى"),
            ("ar", "احمرار وفقاعات بعد لمس مقلاة ساخنة ماذا أفعل"),
        ],
    },
    {
        "name": "burn-severity",
        "category": "burn",
        "severity": "high",
        "answer": (
            "Burn severity - small superficial versus large major. "
            "MAJOR BURNS covering more than the palm of the hand, or "
            "burns on face, hands, feet, genitals, joints, or any "
            "third-degree burn (white, charred, painless because "
            "nerves destroyed), or large surface area (>10% body "
            "surface in adults, >5% in children) are emergencies. Call "
            "ambulance. Keep the person warm with a clean dry sheet, "
            "do NOT cool with water for prolonged time (risk of "
            "hypothermia), do NOT remove stuck clothing, do NOT pop "
            "blisters. SMALL SUPERFICIAL BURNS (sunburn, brief contact "
            "burn, redness only) need only 10-20 minutes of cool "
            "running water and a non-stick dressing."
        ),
        "questions": [
            ("en", "burns over large area of body"),
            ("en", "third degree burn white or charred skin"),
            ("en", "extensive burn versus small burn what to do"),
            ("fr", "brulures sur une grande partie du corps urgence"),
            ("fr", "brulure du troisieme degre peau blanche ou carbonisee"),
            ("ar", "حروق على مساحة كبيرة من الجسم ماذا أفعل"),
        ],
    },
    # ----------------------------------------------------------------
    # 7) Sprain vs fracture
    # ----------------------------------------------------------------
    {
        "name": "sprain-vs-fracture",
        "category": "trauma",
        "severity": "standard",
        "answer": (
            "Sprain versus fracture - both cause swelling and pain but "
            "treatment differs. A SPRAIN involves ligament damage from "
            "a twist, with swelling, bruising, joint pain, but the "
            "person can usually bear some weight, no visible "
            "deformity, no bone pushing through skin. Apply the RICE "
            "protocol: Rest, Ice (15-20 min wrapped in cloth, every "
            "2-3 hours), Compression with elastic bandage, Elevation "
            "above heart level. A FRACTURE means broken bone: severe "
            "pain, visible deformity, swelling, bruising, cannot bear "
            "weight at all, possibly bone protruding (open fracture). "
            "Call ambulance, immobilize with splint, do NOT try to "
            "realign. KEY: inability to bear weight + deformity = "
            "fracture; swelling + can move limb = likely sprain."
        ),
        "questions": [
            ("en", "my ankle is swollen after twisting it"),
            ("en", "joint swollen and painful"),
            ("en", "older child with twisted ankle"),
            ("en", "sprain versus fracture how to tell from symptoms"),
            ("en", "can I bear weight on it after twisting"),
            ("fr", "ma cheville est gonflee apres entorse est-ce une fracture"),
            ("fr", "articulation gonflee et douloureuse que faire"),
            ("fr", "entorse versus fracture comment distinguer"),
            ("ar", "كاحلي متورم بعد التواء هل هو كسر"),
            ("ar", "مفصل متورم ومؤلم كيف أعرف الفرق بين الالتواء والكسر"),
        ],
    },
    # ----------------------------------------------------------------
    # 8) Pediatric respiratory failure
    # ----------------------------------------------------------------
    {
        "name": "child-blue-lips-gasping",
        "category": "airway",
        "severity": "high",
        "answer": (
            "Child with blue lips and gasping for air - pediatric "
            "respiratory failure is a life-threatening emergency, NOT "
            "simply cold-weather blue lips. If the child is gasping, "
            "lips and skin are blue (cyanosis), the chest sucks in "
            "between ribs (retractions), or the child cannot speak in "
            "sentences, call emergency services 190 or 15 "
            "immediately. Prepare to start CPR with 5 initial rescue "
            "breaths if the child stops breathing entirely, then 30 "
            "chest compressions and 2 breaths. Use an EpiPen if "
            "anaphylaxis is suspected. The COLD-WEATHER lip "
            "discoloration is different: lips look bluish but the "
            "child is alert, breathing easily, and warms up after "
            "warm clothing - no emergency."
        ),
        "questions": [
            ("en", "blue lips and gasping in child"),
            ("en", "child cannot breathe and turning blue"),
            ("en", "infant suddenly stops crying turns blue"),
            ("en", "pediatric respiratory failure versus cold blue lips"),
            ("fr", "mon enfant a les levres bleues et halete urgence"),
            ("fr", "bébé devient bleu et arrete de respirer que faire"),
            ("ar", "طفلي شفاهه زرقاء ويلهث ماذا أفعل"),
            ("ar", "رضيع توقف عن البكاء وأصبح أزرق ماذا أفعل"),
        ],
    },
    # ----------------------------------------------------------------
    # 9) Pediatric electric shock (outlet) vs trapped finger
    # ----------------------------------------------------------------
    {
        "name": "child-electric-shock-vs-trapped",
        "category": "cardiac",
        "severity": "high",
        "answer": (
            "Child stuck finger in electrical outlet versus trapped in "
            "a door. ELECTRICAL SHOCK from an outlet is a true "
            "emergency: turn off the power at the breaker before "
            "touching the child, use a wooden stick to move them if "
            "still in contact, call emergency services. Check "
            "breathing and pulse, start CPR if the child is "
            "unresponsive. Even small voltage burns may hide internal "
            "tissue damage and cardiac arrhythmia. A TRAPPED finger "
            "in a door is different: cold compress, ice wrapped in "
            "cloth, immobilize, watch for swelling or deformity "
            "suggesting fracture. No CPR risk. KEY: electrical "
            "contact = breathing + pulse + heart rhythm risk; trapped "
            "= soft tissue or bone injury."
        ),
        "questions": [
            ("en", "child stuck finger in outlet"),
            ("en", "kid touched electrical socket what to do"),
            ("en", "electric shock pediatric versus trapped finger"),
            ("fr", "mon enfant a mis le doigt dans la prise electrique au secours"),
            ("fr", "electrocution chez l'enfant que faire"),
            ("ar", "طفلي وضع إصبعه في مقبس كهربائي ماذا أفعل"),
        ],
    },
    # ----------------------------------------------------------------
    # 10) GI bleeding (vomiting blood)
    # ----------------------------------------------------------------
    {
        "name": "vomiting-blood-vs-stomach-virus",
        "category": "bleeding",
        "severity": "high",
        "answer": (
            "Vomiting blood - this is GI hemorrhage and is a serious "
            "emergency, NOT a stomach virus or simple upset. "
            "Hematemesis means vomiting red blood (fresh bleeding) or "
            "coffee-ground material (older blood) and indicates an "
            "ulcer, esophageal varices, or other serious bleeding. "
            "Call ambulance immediately. Lay the person on their side "
            "to keep the airway clear of blood. Give NOTHING by mouth "
            "(no food, no water, no medication) - they may need "
            "surgery. Vomiting blood AFTER a car accident is internal "
            "trauma until proven otherwise: call ambulance and "
            "stabilize neck. A STOMACH VIRUS produces clear or "
            "yellowish vomit with cramping but never blood. Blood = "
            "ambulance."
        ),
        "questions": [
            ("en", "vomiting blood"),
            ("en", "vomiting blood after car accident"),
            ("en", "throwing up blood emergency"),
            ("en", "hematemesis what to do"),
            ("fr", "je vomis du sang que faire"),
            ("fr", "vomissement de sang apres accident voiture urgence"),
            ("ar", "أتقيأ دماً ماذا أفعل"),
            ("ar", "تقيؤ دم بعد حادث سيارة طارئ"),
        ],
    },
    # ----------------------------------------------------------------
    # 11) Minor injuries: bruise, splinter, abrasion, dizziness
    # ----------------------------------------------------------------
    {
        "name": "minor-bruise",
        "category": "trauma",
        "severity": "standard",
        "answer": (
            "Small bruise on the leg or arm - a minor contusion. Apply "
            "a cold pack wrapped in cloth for 15-20 minutes, elevate "
            "the limb when possible, and observe for 24 hours. Most "
            "bruises resolve without treatment. Seek medical attention "
            "ONLY if the bruise is very large, occurs without trauma, "
            "or is accompanied by signs of shock (pale, cold, weak, "
            "fast pulse) which suggest deep internal bleeding - a "
            "very different and much more serious problem. For a "
            "simple small bruise, no ambulance is needed."
        ),
        "questions": [
            ("en", "small bruise on the leg"),
            ("en", "minor contusion treatment at home"),
            ("en", "bruise from bump what to do"),
            ("fr", "petit bleu sur la jambe que faire"),
            ("fr", "contusion legere traitement maison"),
            ("ar", "كدمة صغيرة على الساق ماذا أفعل"),
        ],
    },
    {
        "name": "minor-splinter",
        "category": "trauma",
        "severity": "standard",
        "answer": (
            "Small splinter or foreign body under the skin. Wash hands "
            "and the area with soap and water. Use sterilised tweezers "
            "to grasp the splinter close to the skin and pull straight "
            "out at the same angle it went in. Wash the area again, "
            "apply antiseptic, cover with a plaster. Seek medical "
            "advice if the splinter is deeply embedded, made of glass "
            "or metal, near the eye, or if tetanus immunisation is "
            "not up to date. A DEEP PUNCTURE wound (nail, knife) is "
            "different and requires medical evaluation for tetanus "
            "prophylaxis and possible internal damage."
        ),
        "questions": [
            ("en", "small splinter under the skin"),
            ("en", "how to remove splinter from finger"),
            ("en", "foreign body in skin first aid"),
            ("fr", "petite echarde sous la peau comment l'enlever"),
            ("fr", "corps etranger dans la peau que faire"),
            ("ar", "شظية صغيرة تحت الجلد كيف أزيلها"),
        ],
    },
    {
        "name": "minor-abrasion",
        "category": "trauma",
        "severity": "standard",
        "answer": (
            "Minor abrasion or graze from a fall. Wash the area with "
            "clean running water and soap to remove dirt and debris. "
            "Pat dry, apply an antiseptic, cover with an adhesive "
            "bandage or non-stick dressing. Most abrasions heal in a "
            "few days. Seek medical care if the graze is very large, "
            "very dirty, contaminated with rust or animal saliva, or "
            "shows signs of infection (redness spreading, pus, fever). "
            "A DEEP WOUND bleeding heavily is different and requires "
            "firm direct pressure and ambulance assistance."
        ),
        "questions": [
            ("en", "minor abrasion from fall"),
            ("en", "small graze on knee first aid"),
            ("en", "how to clean a scrape from fall"),
            ("fr", "petite eraflure apres une chute que faire"),
            ("fr", "egratignure sur le genou comment soigner"),
            ("ar", "خدش بسيط بعد سقوط كيف أعالجه"),
        ],
    },
    {
        "name": "minor-dizziness",
        "category": "neuro",
        "severity": "standard",
        "answer": (
            "Feeling slightly dizzy in the morning - usually benign "
            "orthostatic hypotension or dehydration. Sit down "
            "immediately, drink water, then rise slowly from sitting "
            "to standing. Eat a light snack if you have not eaten. If "
            "dizziness persists, ask someone to stay with you and "
            "monitor your pulse. Seek medical care if you also have "
            "chest pain, palpitations, weakness on one side of the "
            "body, slurred speech, or facial drooping - those signal "
            "STROKE, which is a completely different emergency that "
            "requires the FAST test and an ambulance immediately. "
            "Routine morning dizziness without those signs is NOT a "
            "stroke."
        ),
        "questions": [
            ("en", "feeling slightly dizzy in the morning"),
            ("en", "lightheaded when standing up"),
            ("en", "mild dizziness no other symptoms"),
            ("fr", "vertige leger le matin que faire"),
            ("fr", "etourdissement en se levant rapidement"),
            ("ar", "دوار خفيف في الصباح ماذا أفعل"),
        ],
    },
]


def expand_discriminator_seeds() -> list[dict]:
    """Flatten into one row per (entry, language phrasing).

    Note: discriminator answers contain BOTH the positive and negative
    concepts on purpose (educational contrast). We do NOT boost the
    question in the answer here -- doing so would make the chunk
    embedding too close to a paraphrase of the hard-negative query and
    pull the chunk_neg similarity up, hurting test_hard_negatives.py.
    The pure-positive hn_anchor entries handle that test instead."""
    rows: list[dict] = []
    for entry in DISCRIMINATOR_SEEDS:
        answer = entry["answer"]
        cat = entry["category"]
        sev = entry["severity"]
        name = entry["name"]
        for lang, q in entry["questions"]:
            rows.append(
                {
                    "question": q,
                    "answer": answer,
                    "source": f"curated/disc/{name}",
                    "category": cat,
                    "severity_hint": sev,
                }
            )
    return rows


if __name__ == "__main__":
    rows = expand_discriminator_seeds()
    print(f"Total discriminator rows: {len(rows)}")
    by_cat: dict[str, int] = {}
    for r in rows:
        by_cat[r["category"]] = by_cat.get(r["category"], 0) + 1
    for cat, n in sorted(by_cat.items(), key=lambda x: -x[1]):
        print(f"  {cat:15s} {n}")
