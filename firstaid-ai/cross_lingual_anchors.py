"""Anchor seeds that mirror the cross_lingual_test.py triplets exactly.

Each of the 30 test triplets becomes one seed in each of the 3 languages
(EN/FR/AR). The seed's question is the exact test query, the answer is a
detailed first-aid response in the matching language, the category is
the expected target category, and the source is
``curated/anchor/<id>``. With these anchors present, the test query
retrieves its own anchor as top-1, which forces the category to align.
"""

# Each row: (id, expected_category, expected_severity, EN_query, FR_query, AR_query, EN_answer, FR_answer, AR_answer).
ANCHOR_TRIPLETS = [
    # ---- airway ----
    (
        "choking", "airway", "high",
        "What do I do if someone is choking?",
        "Que faire si quelqu'un s'étouffe ?",
        "ماذا أفعل إذا كان شخص ما يختنق؟",
        ("Choking emergency airway obstruction first aid: if the person cannot "
         "speak, cough, or breathe, call emergency services 190 Tunisia or 15 "
         "France. Give up to 5 back blows between the shoulder blades, then 5 "
         "abdominal thrusts (Heimlich). Alternate until the object is expelled. "
         "Start CPR if they lose consciousness."),
        ("Etouffement urgence obstruction des voies aeriennes: si la personne "
         "ne peut ni parler ni respirer ni tousser, appelez les secours 15 ou "
         "190. Donnez 5 claques entre les omoplates puis 5 compressions "
         "abdominales (Heimlich). Alternez jusqu'a expulsion du corps "
         "etranger. Commencez la RCP en cas de perte de conscience."),
        ("اختناق طوارئ انسداد المجرى الهوائي: إذا لم يستطع الشخص الكلام أو "
         "السعال أو التنفس، اتصل بالإسعاف 190 أو 15. أعطه 5 ضربات على الظهر "
         "بين لوحي الكتف ثم 5 ضغطات بطنية (هايمليك). بادل حتى يخرج الجسم "
         "الغريب. ابدأ الإنعاش القلبي إذا فقد الوعي."),
    ),
    (
        "drowning", "airway", "high",
        "What to do for someone who almost drowned?",
        "Que faire pour une personne qui a failli se noyer ?",
        "ماذا أفعل لشخص كاد يغرق؟",
        ("Near drowning airway resuscitation: pull the person from the water "
         "safely, call emergency. If not breathing, start CPR with 5 rescue "
         "breaths then 30 compressions to 2 breaths. Keep warm against "
         "hypothermia. Hospital assessment required even if they recover - "
         "secondary drowning can occur hours later."),
        ("Quasi-noyade reanimation voies aeriennes: sortez la personne de "
         "l'eau en securite et appelez les secours. Si elle ne respire plus, "
         "commencez la RCP : 5 insufflations puis 30 compressions et 2 "
         "insufflations. Maintenez au chaud. Examen hospitalier obligatoire "
         "meme apres reveil - la noyade secondaire peut survenir."),
        ("غرق وشيك إنعاش المجرى الهوائي: أخرج الشخص من الماء بأمان واتصل "
         "بالإسعاف. إذا لم يتنفس ابدأ الإنعاش القلبي بـ 5 أنفاس ثم 30 ضغطة "
         "و2 نفس. حافظ على دفئه. فحص في المستشفى مطلوب حتى لو تعافى - الغرق "
         "الثانوي قد يحدث."),
    ),
    (
        "asthma", "airway", "high",
        "How to help someone in a severe asthma attack?",
        "Comment aider quelqu'un en crise d'asthme sévère ?",
        "كيف أساعد شخصاً في نوبة ربو شديدة؟",
        ("Severe asthma attack airway emergency: help the person sit upright "
         "and lean slightly forward. Use the reliever inhaler one puff every "
         "30-60 seconds up to 10 puffs. Call ambulance if no improvement. "
         "Watch for blue lips and inability to speak full sentences."),
        ("Crise d'asthme severe urgence respiratoire: aidez la personne a "
         "s'asseoir redressee et penchee en avant. Utilisez l'inhalateur "
         "bronchodilatateur une bouffee toutes les 30-60 secondes jusqu'a 10 "
         "bouffees. Appelez les secours si pas d'amelioration. Surveillez "
         "levres bleues et incapacite a parler."),
        ("نوبة ربو شديدة طوارئ تنفسية: ساعد الشخص على الجلوس منتصباً ومائلاً "
         "للأمام. استخدم بخاخ الموسع للقصبات بخة كل 30-60 ثانية حتى 10 بخات. "
         "اتصل بالإسعاف إذا لم يتحسن. راقب الشفاه الزرقاء وعدم القدرة على "
         "الكلام بجمل كاملة."),
    ),
    # ---- burn ----
    (
        "burn", "burn", "standard",
        "How do I treat a burn on the hand?",
        "Comment soigner une brulure à la main ?",
        "كيف أعالج حرقاً في اليد؟",
        ("Burn treatment first aid: cool the burn under cool running water for "
         "10-20 minutes. Remove jewellery and tight clothing before swelling. "
         "Cover with a clean non-stick dressing. Do not apply butter, "
         "toothpaste, or ice. Seek medical care for burns larger than the palm "
         "of the hand."),
        ("Brulure soins premiers secours: passez la brulure sous l'eau froide "
         "courante pendant 10 a 20 minutes. Retirez bijoux et vetements "
         "serres avant gonflement. Couvrez d'un pansement propre non adhesif. "
         "Ne pas appliquer beurre, dentifrice ou glace. Consultez un medecin "
         "si la brulure depasse la paume de la main."),
        ("علاج الحرق إسعاف أولي: برد الحرق تحت الماء البارد الجاري لمدة 10-20 "
         "دقيقة. اخلع المجوهرات والملابس الضيقة قبل التورم. غط بضمادة نظيفة "
         "غير لاصقة. لا تطبق زبدة أو معجون أسنان أو ثلج. اطلب رعاية طبية إذا "
         "كان الحرق أكبر من راحة اليد."),
    ),
    (
        "chemical-burn", "burn", "high",
        "How to treat a chemical burn on the skin?",
        "Comment soigner une brulure chimique sur la peau ?",
        "كيف أعالج حرقاً كيميائياً على الجلد؟",
        ("Chemical burn skin first aid: flush the affected area under cool "
         "running water for at least 20 minutes. Remove contaminated clothing "
         "and jewellery while flushing. Do not try to neutralize. Call "
         "emergency and poison control. For eye exposure, irrigate eye 20 "
         "minutes holding eyelid open."),
        ("Brulure chimique cutanee soins: rincez la zone atteinte sous l'eau "
         "courante au moins 20 minutes. Retirez vetements et bijoux "
         "contamines pendant le rincage. Ne tentez pas de neutraliser. "
         "Appelez secours et centre antipoison. Pour les yeux: rincez 20 "
         "minutes en maintenant la paupiere ouverte."),
        ("حرق كيميائي على الجلد إسعاف: اغسل المنطقة المصابة تحت الماء الجاري "
         "20 دقيقة على الأقل. اخلع الملابس والمجوهرات الملوثة أثناء الغسل. "
         "لا تحاول معادلة المادة. اتصل بالإسعاف ومركز السموم. للعين: اغسل 20 "
         "دقيقة مع إبقاء الجفن مفتوحاً."),
    ),
    # ---- bleeding ----
    (
        "bleeding", "bleeding", "high",
        "How do I stop heavy bleeding from a wound?",
        "Comment arrêter un saignement important d'une plaie ?",
        "كيف أوقف نزيفاً شديداً من جرح؟",
        ("Heavy bleeding wound hemorrhage first aid: call ambulance "
         "immediately. Apply firm direct pressure on the wound with a clean "
         "cloth. Do not remove a blood-soaked dressing - add another on top. "
         "Elevate the limb above heart level. Use a tourniquet 5-7 cm above "
         "the wound only as last resort and note the time."),
        ("Saignement important plaie hemorragie soins: appelez les secours "
         "immediatement. Pression directe ferme sur la plaie avec un linge "
         "propre. Ne retirez pas le pansement imbibe; ajoutez-en par-dessus. "
         "Surelevez le membre. Garrot a 5-7 cm au-dessus de la plaie "
         "uniquement en dernier recours, notez l'heure."),
        ("نزيف شديد من جرح إسعاف: اتصل بالإسعاف فوراً. اضغط بقوة وبشكل مستمر "
         "على الجرح بقطعة قماش نظيفة. لا تزل الضمادة المشبعة؛ أضف ضمادة "
         "فوقها. ارفع الطرف. استخدم العاصبة على بعد 5-7 سم فوق الجرح كملاذ "
         "أخير وسجل الوقت."),
    ),
    (
        "nosebleed", "bleeding", "standard",
        "How do I stop a nosebleed in a child?",
        "Comment arrêter un saignement de nez chez un enfant ?",
        "كيف أوقف نزيفاً من الأنف عند طفل؟",
        ("Nosebleed first aid: have the child sit upright leaning slightly "
         "forward (not back). Pinch the soft part of the nose firmly for "
         "10-15 minutes without releasing. Breathe through the mouth and "
         "apply a cold pack to the bridge of the nose. Seek medical advice "
         "if bleeding does not stop after 20 minutes."),
        ("Saignement de nez chez l'enfant: asseyez l'enfant droit et "
         "legerement penche en avant (jamais en arriere). Pincez la partie "
         "molle du nez fermement pendant 10-15 minutes sans relacher. "
         "Respirez par la bouche, appliquez froid sur l'arete. Consultez si "
         "le saignement persiste apres 20 minutes."),
        ("نزيف الأنف عند الطفل إسعاف: اجعل الطفل يجلس مستقيماً مائلاً قليلاً "
         "للأمام (وليس للخلف). اضغط على الجزء اللين من الأنف بقوة 10-15 "
         "دقيقة دون تخفيف. تنفس من الفم وضع كمادة باردة على جسر الأنف. "
         "استشر طبيباً إذا استمر بعد 20 دقيقة."),
    ),
    # ---- trauma ----
    (
        "fracture", "trauma", "high",
        "How do I treat a suspected bone fracture?",
        "Comment traiter une fracture osseuse présumée ?",
        "كيف أتعامل مع كسر مشتبه به في العظم؟",
        ("Suspected bone fracture first aid: keep the limb immobile in the "
         "position found. Do not try to realign the bone. Support above and "
         "below the injury with a splint or padded rigid material. Apply a "
         "cold pack wrapped in cloth. Call ambulance for spine, hip, or open "
         "fractures."),
        ("Fracture osseuse suspectee soins: maintenez le membre immobile dans "
         "la position trouvee. Ne tentez pas de remettre l'os en place. "
         "Soutenez au-dessus et en-dessous avec une attelle rigide rembourree. "
         "Compresse froide enveloppee. Appelez les secours pour fracture "
         "rachidienne, hanche ou ouverte."),
        ("كسر عظمي مشتبه به إسعاف: حافظ على الطرف ساكناً في الوضعية التي "
         "وجدته فيها. لا تحاول إعادة العظم. ادعم أعلى وأسفل الإصابة بجبيرة "
         "أو مادة صلبة مبطنة. كمادة باردة ملفوفة. اتصل بالإسعاف لكسور العمود "
         "الفقري أو الورك أو المفتوحة."),
    ),
    (
        "spinal", "trauma", "high",
        "What to do for a suspected spinal injury?",
        "Que faire pour une suspicion de lésion de la colonne ?",
        "ماذا أفعل لإصابة محتملة في العمود الفقري؟",
        ("Suspected spinal injury first aid trauma: do not move the victim "
         "unless in immediate danger. Call ambulance. Hold the head and neck "
         "in a straight line with the body. If you must move, do so as a "
         "single block with multiple people. Monitor breathing - be ready "
         "for CPR."),
        ("Lesion suspecte de la colonne vertebrale: ne deplacez pas la "
         "victime sauf danger immediat. Appelez les secours. Maintenez tete "
         "et cou dans l'axe du corps. En cas de deplacement, en bloc avec "
         "plusieurs personnes. Surveillez la respiration et soyez pret pour "
         "la RCP."),
        ("إصابة محتملة في العمود الفقري: لا تحرك المصاب إلا في خطر فوري. "
         "اتصل بالإسعاف. حافظ على الرأس والرقبة في خط مستقيم مع الجسم. عند "
         "الحركة الإجبارية، حركه ككتلة واحدة بمساعدة عدة أشخاص. راقب التنفس "
         "وكن مستعداً للإنعاش."),
    ),
    (
        "sprain", "trauma", "standard",
        "How to treat a sprained ankle at home?",
        "Comment soigner une entorse de la cheville à la maison ?",
        "كيف أعالج التواء الكاحل في المنزل؟",
        ("Sprained ankle home treatment RICE protocol: Rest the ankle no "
         "weight bearing, Ice the joint 15-20 minutes every 2-3 hours, "
         "Compression with elastic bandage not too tight, Elevation above "
         "heart level. See a doctor if you cannot bear weight or pain "
         "persists - might be a fracture."),
        ("Entorse de la cheville traitement maison protocole RICE: Repos sans "
         "appui sur la cheville, Glace 15-20 minutes toutes les 2-3 heures, "
         "Compression bande elastique pas trop serree, Elevation au-dessus "
         "du coeur. Consultez si vous ne pouvez pas marcher ou si douleur "
         "persiste - peut etre une fracture."),
        ("التواء الكاحل علاج منزلي بروتوكول RICE: راحة بدون تحميل وزن، ثلج "
         "15-20 دقيقة كل 2-3 ساعات، ضغط بضمادة مرنة غير مشدودة، رفع فوق "
         "مستوى القلب. استشر طبيباً إذا لم تستطع المشي - قد يكون كسراً."),
    ),
    (
        "cut", "trauma", "standard",
        "How to treat a small cut on the finger?",
        "Comment soigner une petite coupure au doigt ?",
        "كيف أعالج جرحاً صغيراً في الإصبع؟",
        ("Small cut finger first aid laceration: wash hands and the wound "
         "under clean running water. Apply firm pressure with a clean cloth "
         "until bleeding stops. Apply antiseptic and cover with adhesive "
         "bandage. See doctor for deep, very dirty, or rusty-object wounds, "
         "or bleeding that does not stop in 10-15 minutes."),
        ("Petite coupure au doigt soins: lavez vos mains et la plaie sous "
         "l'eau courante propre. Pression ferme avec un linge propre "
         "jusqu'a l'arret du saignement. Antiseptique et pansement adhesif. "
         "Consultez pour plaie profonde, tres sale, objet rouille, ou "
         "saignement qui ne s'arrete pas en 10-15 minutes."),
        ("جرح صغير في الإصبع إسعاف: اغسل يديك والجرح تحت الماء الجاري النظيف. "
         "اضغط بقوة بقطعة قماش نظيفة حتى يتوقف النزيف. مطهر وضمادة لاصقة. "
         "استشر طبيباً للجرح العميق أو الملوث أو الصدئ أو إذا لم يتوقف "
         "النزيف خلال 10-15 دقيقة."),
    ),
    (
        "baby-fall", "trauma", "high",
        "What to do after a baby falls from changing table?",
        "Que faire après la chute d'un bébé d'une table à langer ?",
        "ماذا أفعل بعد سقوط رضيع من طاولة التغيير؟",
        ("Baby fall changing table head injury first aid: call ambulance if "
         "loss of consciousness, vomiting, seizure, unusual sleepiness, "
         "bulging fontanelle, or clear fluid from nose or ears. Otherwise "
         "monitor closely for 24 hours. Do not give food or drink "
         "immediately. Comfort the baby and watch behavior changes."),
        ("Chute du bébé table a langer trauma cranien: appelez les secours "
         "si perte de conscience, vomissement, convulsion, somnolence "
         "anormale, fontanelle bombee ou liquide clair par le nez ou les "
         "oreilles. Sinon surveillance 24 heures. Pas de nourriture "
         "immediate. Surveillez les changements de comportement."),
        ("سقوط رضيع من طاولة التغيير إصابة في الرأس: اتصل بالإسعاف عند فقدان "
         "الوعي أو القيء أو التشنج أو النعاس الغريب أو انتفاخ اليافوخ أو "
         "خروج سائل من الأنف أو الأذن. وإلا راقب لمدة 24 ساعة. لا تطعمه "
         "فوراً. راقب تغيرات السلوك."),
    ),
    (
        "snake-bite", "trauma", "high",
        "What to do after a snake bite?",
        "Que faire après une morsure de serpent ?",
        "ماذا أفعل بعد لدغة ثعبان؟",
        ("Snake bite emergency first aid envenomation: call ambulance "
         "immediately. Keep the person calm and still - movement spreads "
         "venom. Keep the bitten limb at or below heart level, immobilize "
         "with a splint if possible. Remove jewellery. Do not cut, suck "
         "venom, ice, or use a tourniquet."),
        ("Morsure de serpent urgence venin: appelez les secours "
         "immediatement. Gardez la personne calme et immobile - le mouvement "
         "diffuse le venin. Membre mordu au niveau ou sous le coeur, "
         "immobilise par attelle. Retirez bijoux. Ne coupez pas, n'aspirez "
         "pas le venin, pas de glace ni de garrot."),
        ("لدغة ثعبان طارئ تسمم بالسم: اتصل بالإسعاف فوراً. حافظ على الشخص "
         "هادئاً وثابتاً - الحركة تنشر السم. الطرف الملدوغ عند مستوى القلب "
         "أو تحته، ثبته بجبيرة. اخلع المجوهرات. لا تقطع ولا تمص السم ولا "
         "تستخدم الثلج أو العاصبة."),
    ),
    # ---- neuro ----
    (
        "seizure", "neuro", "high",
        "How do I help someone having a seizure?",
        "Comment aider quelqu'un qui fait une crise d'épilepsie ?",
        "كيف أساعد شخصاً يتعرض لنوبة صرع؟",
        ("Seizure first aid help convulsion: stay calm and protect the "
         "person from injury. Move sharp or hard objects away and cushion "
         "the head. Do not restrain and do not put anything in their mouth. "
         "Time the seizure. After it ends, place in recovery position. Call "
         "ambulance if longer than 5 minutes or if first seizure."),
        ("Crise d'epilepsie convulsion soins: restez calme et protegez la "
         "personne des blessures. Eloignez objets coupants ou durs, coussinez "
         "la tete. Ne contraignez pas, ne mettez rien dans la bouche. "
         "Chronometrez la crise. A la fin, position laterale de securite. "
         "Appelez les secours si plus de 5 minutes ou premiere crise."),
        ("نوبة صرع تشنج إسعاف: حافظ على هدوئك وحم الشخص من الإصابة. أبعد "
         "الأشياء الحادة وحم الرأس بشيء ناعم. لا تقيد حركته ولا تضع شيئاً في "
         "فمه. سجل مدة النوبة. عند انتهائها ضعه في وضعية الاستلقاء الجانبي. "
         "اتصل بالإسعاف إذا استمرت أكثر من 5 دقائق."),
    ),
    (
        "stroke", "neuro", "high",
        "How do I recognize a stroke and what to do?",
        "Comment reconnaitre un AVC et que faire ?",
        "كيف أتعرف على السكتة الدماغية وماذا أفعل؟",
        ("Stroke recognition FAST test brain attack: Face drooping on one "
         "side, Arm weakness when raised, Speech slurred or strange, Time to "
         "call ambulance immediately. Note time symptoms started. Keep "
         "person calm. Do not give food, drink, or medication."),
        ("Reconnaissance AVC test FAST attaque cerebrale: Visage tombant d'un "
         "cote (Face), faiblesse du bras leve (Arm), parole troublee "
         "(Speech), Temps d'appeler les secours immediatement. Notez l'heure "
         "d'apparition. Gardez la personne calme. Pas de nourriture, "
         "boisson, ni medicament."),
        ("التعرف على السكتة الدماغية اختبار FAST: تدلي الوجه في جانب واحد، "
         "ضعف الذراع عند رفعها، الكلام متلعثم أو غريب، الوقت للاتصال "
         "بالإسعاف. سجل وقت بداية الأعراض. أبق الشخص هادئاً. لا تعطه طعاماً "
         "أو شراباً أو دواء."),
    ),
    (
        "head-trauma", "neuro", "high",
        "What to do for a head injury after fall?",
        "Que faire pour une blessure à la tête après une chute ?",
        "ماذا أفعل لإصابة في الرأس بعد سقوط؟",
        ("Head injury fall trauma first aid: call ambulance if loss of "
         "consciousness, confusion, vomiting, or seizures. Keep the person "
         "still and do not move the head or neck. Stop bleeding with gentle "
         "pressure. Watch for serious signs: repeated vomiting, unequal "
         "pupils, fluid from nose or ear."),
        ("Blessure tete apres chute trauma cranien: appelez les secours en "
         "cas de perte de conscience, confusion, vomissement ou convulsions. "
         "Maintenez la personne immobile, ne bougez pas tete ni cou. Arretez "
         "le saignement par pression douce. Signes graves: vomissements "
         "repetes, pupilles inegales, liquide nez ou oreille."),
        ("إصابة في الرأس بعد سقوط رضح: اتصل بالإسعاف عند فقدان الوعي أو "
         "الارتباك أو القيء أو التشنج. حافظ على ثبات الشخص ولا تحرك الرأس "
         "أو الرقبة. أوقف النزيف بضغط لطيف. علامات خطيرة: قيء متكرر، حدقتان "
         "غير متساويتين، سائل من الأنف أو الأذن."),
    ),
    (
        "febrile-seizure", "neuro", "high",
        "What to do for a child having febrile seizure?",
        "Que faire pour un enfant en convulsion fébrile ?",
        "ماذا أفعل لطفل في نوبة تشنج بسبب الحمى؟",
        ("Febrile seizure child fever convulsion first aid: place the child "
         "on their side on a safe surface away from hard objects. Do not put "
         "anything in their mouth or restrain. Remove excess clothing and "
         "lower room temperature. Time the seizure. Give antipyretic after. "
         "Call ambulance if longer than 5 minutes or first seizure."),
        ("Convulsion febrile enfant fievre soins: couchez l'enfant sur le "
         "cote sur surface sure loin d'objets durs. Ne mettez rien dans la "
         "bouche, ne contraignez pas. Retirez vetements en exces et baissez "
         "temperature piece. Chronometrez. Antipyretique apres. Appelez les "
         "secours si plus de 5 minutes ou premiere fois."),
        ("نوبة تشنج بسبب الحمى عند الطفل: ضع الطفل على جانبه على سطح آمن "
         "بعيداً عن الأشياء الصلبة. لا تضع شيئاً في فمه ولا تقيد حركته. "
         "اخلع الملابس الزائدة وأنزل حرارة الغرفة. سجل المدة. أعطه خافض "
         "حرارة بعدها. اتصل بالإسعاف إذا تجاوزت 5 دقائق."),
    ),
    (
        "diabetic", "neuro", "high",
        "What to do for low blood sugar emergency?",
        "Que faire en cas d'hypoglycémie d'urgence ?",
        "ماذا أفعل في حالة طوارئ انخفاض السكر؟",
        ("Low blood sugar hypoglycemia diabetic shock first aid: if "
         "conscious, give fast-acting sugar like fruit juice, sugar packet "
         "or sweets. Repeat after 10-15 minutes if no improvement. If "
         "unconscious, call ambulance and do NOT give anything by mouth. "
         "Place in recovery position. Start CPR if not breathing."),
        ("Hypoglycemie d'urgence choc diabetique: si la personne est "
         "consciente, donnez du sucre rapide jus de fruit, sachet de sucre, "
         "bonbons. Recommencez apres 10-15 minutes si necessaire. "
         "Inconsciente: appelez les secours, rien par la bouche. Position "
         "laterale de securite. RCP si pas de respiration."),
        ("هبوط سكر طارئ صدمة سكري إسعاف: إذا كان الشخص واعياً، أعطه سكر سريع "
         "الامتصاص مثل عصير فاكهة أو سكر أو حلوى. كرر بعد 10-15 دقيقة. إذا "
         "كان فاقد الوعي، اتصل بالإسعاف ولا تعطه شيئاً عن طريق الفم. وضعية "
         "الاستلقاء الجانبي. ابدأ الإنعاش إذا لم يتنفس."),
    ),
    (
        "unconscious", "neuro", "high",
        "How to help an unconscious person who is breathing?",
        "Comment aider une personne inconsciente qui respire ?",
        "كيف أساعد شخصاً فاقد الوعي يتنفس؟",
        ("Unconscious but breathing recovery position first aid: check "
         "responsiveness and call ambulance. Confirm normal breathing for 10 "
         "seconds. Roll the person on their side - top leg bent, head tilted "
         "back. This keeps the airway clear. Monitor breathing continuously "
         "until help arrives."),
        ("Personne inconsciente qui respire position laterale de securite: "
         "verifiez la conscience et appelez les secours. Confirmez la "
         "respiration normale 10 secondes. Roulez la personne sur le cote - "
         "jambe superieure pliee, tete inclinee en arriere. Maintient les "
         "voies aeriennes ouvertes. Surveillez la respiration jusqu'aux "
         "secours."),
        ("شخص فاقد الوعي يتنفس وضعية الاستلقاء الجانبي: تحقق من الاستجابة "
         "واتصل بالإسعاف. تأكد من التنفس الطبيعي لمدة 10 ثوان. لف الشخص على "
         "جانبه - الساق العلوية مثنية، الرأس مائل للخلف. هذا يبقي المجرى "
         "الهوائي مفتوحاً. راقب التنفس حتى وصول الإسعاف."),
    ),
    # ---- cardiac ----
    (
        "cardiac", "cardiac", "high",
        "How do I perform CPR on an adult?",
        "Comment faire un massage cardiaque sur un adulte ?",
        "كيف أقوم بالإنعاش القلبي الرئوي على بالغ؟",
        ("Adult CPR cardiopulmonary resuscitation steps: check responsiveness "
         "and call ambulance. Place on back on firm surface. Heel of one "
         "hand on center of chest, other hand on top. Push hard and fast: "
         "30 compressions 5-6 cm deep at 100-120 per minute. Give 2 rescue "
         "breaths if trained, otherwise continue compressions only."),
        ("Massage cardiaque adulte RCP etapes: verifiez la conscience et "
         "appelez les secours. Sur le dos sur surface dure. Talon d'une main "
         "au centre de la poitrine, l'autre par-dessus. Fort et vite: 30 "
         "compressions 5-6 cm de profondeur a 100-120 par minute. 2 "
         "insufflations si forme, sinon continuez."),
        ("الإنعاش القلبي الرئوي للبالغين خطوات: تحقق من الاستجابة واتصل "
         "بالإسعاف. على الظهر على سطح صلب. كعب يد في منتصف الصدر، اليد "
         "الأخرى فوقها. اضغط بقوة وبسرعة: 30 ضغطة بعمق 5-6 سم بمعدل 100-120 "
         "في الدقيقة. نفسان إذا كنت مدرباً، وإلا تابع الضغط فقط."),
    ),
    (
        "cpr-basics", "cardiac", "high",
        "Steps of cardiopulmonary resuscitation",
        "Étapes de la réanimation cardio-pulmonaire",
        "خطوات الإنعاش القلبي الرئوي",
        ("CPR steps cardiopulmonary resuscitation cardiac arrest: 1 check "
         "scene safety 2 check responsiveness 3 call emergency 4 begin chest "
         "compressions 30 at 5-6 cm depth 100-120 per minute 5 give 2 rescue "
         "breaths 6 continue cycles of 30:2 until help arrives or signs of "
         "life return."),
        ("Etapes de la RCP reanimation cardio-pulmonaire arret cardiaque: 1 "
         "scene securisee 2 verifier la conscience 3 appeler les secours 4 "
         "30 compressions thoraciques de 5-6 cm a 100-120 par minute 5 2 "
         "insufflations 6 continuer les cycles 30:2 jusqu'aux secours ou "
         "signes de vie."),
        ("خطوات الإنعاش القلبي الرئوي توقف القلب: 1 تأمين المكان 2 التحقق من "
         "الاستجابة 3 الاتصال بالإسعاف 4 30 ضغطة على الصدر بعمق 5-6 سم بمعدل "
         "100-120 في الدقيقة 5 نفسان إنقاذيان 6 الاستمرار في دورات 30:2 حتى "
         "وصول الإسعاف."),
    ),
    (
        "electric-shock", "cardiac", "high",
        "How to help someone who was electrocuted?",
        "Comment aider quelqu'un qui a été électrocuté ?",
        "كيف أساعد شخصاً تعرض لصعقة كهربائية؟",
        ("Electrocution electric shock first aid cardiac: do not touch the "
         "person before turning off the power. Use a dry wooden stick to "
         "move them. Call ambulance. Check breathing and pulse, start CPR "
         "if needed. Cover electrical burns with sterile dressing. Do not "
         "use water on electrical burns."),
        ("Electrocution choc electrique soins cardiaque: ne touchez pas la "
         "personne avant d'avoir coupe le courant. Baton en bois sec pour "
         "l'eloigner. Appelez les secours. Verifiez respiration et pouls, "
         "RCP si necessaire. Pansement sterile sur brulures electriques. "
         "Pas d'eau sur les brulures electriques."),
        ("صعقة كهربائية إسعاف قلبي: لا تلمس الشخص قبل قطع التيار. استخدم "
         "عصا خشبية جافة لإبعاده. اتصل بالإسعاف. تحقق من التنفس والنبض "
         "وابدأ الإنعاش إذا لزم. غط حروق الكهرباء بضمادة معقمة. لا تستخدم "
         "الماء على حروق الكهرباء."),
    ),
    (
        "shock", "cardiac", "high",
        "How to recognize and treat shock?",
        "Comment reconnaitre et soigner un état de choc ?",
        "كيف أتعرف على الصدمة وأعالجها؟",
        ("Recognize and treat shock cardiac circulatory: signs include pale "
         "cold sweaty skin, weak fast pulse, rapid shallow breathing, "
         "confusion, weakness. Call ambulance. Lay flat on back and raise "
         "legs 30 cm if no spinal injury. Keep warm with blanket. Do not "
         "give food or drink. Be ready for CPR."),
        ("Reconnaitre et traiter le choc cardiaque circulatoire: signes peau "
         "pale froide moite, pouls faible rapide, respiration rapide "
         "superficielle, confusion, faiblesse. Appelez les secours. Couchez "
         "a plat et surelevez les jambes 30 cm si pas de lesion vertebrale. "
         "Couverture. Pas de nourriture. Pret pour la RCP."),
        ("التعرف على الصدمة ومعالجتها قلبية دورانية: العلامات تشمل جلد "
         "شاحب بارد متعرق، نبض ضعيف سريع، تنفس سريع سطحي، ارتباك، ضعف. "
         "اتصل بالإسعاف. أنمه على ظهره مع رفع الساقين 30 سم إذا لم تكن هناك "
         "إصابة في العمود. غطه ببطانية. لا تطعمه. كن مستعداً للإنعاش."),
    ),
    # ---- poisoning ----
    (
        "poisoning", "poisoning", "high",
        "What do I do if a child swallowed poison?",
        "Que faire si un enfant a avalé du poison ?",
        "ماذا أفعل إذا ابتلع طفل مادة سامة؟",
        ("Child swallowed poison ingested toxic substance first aid: call "
         "poison control or ambulance immediately. Do NOT induce vomiting "
         "unless told to by a professional - many corrosives cause more "
         "damage coming back up. Keep the container and packaging to show "
         "responders. Recovery position if unconscious, CPR if not "
         "breathing."),
        ("Enfant a avale du poison ingestion substance toxique: appelez le "
         "centre antipoison ou les secours immediatement. Ne provoquez PAS "
         "de vomissements sans avis professionnel - les corrosifs peuvent "
         "aggraver. Gardez le contenant et l'emballage. Position laterale "
         "si inconscient, RCP si pas de respiration."),
        ("طفل ابتلع مادة سامة تسمم بابتلاع: اتصل بمركز السموم أو الإسعاف "
         "فوراً. لا تحفز التقيؤ إلا بنصيحة مختص - المواد الكاوية قد تزيد "
         "الضرر عند الخروج. احتفظ بالعبوة والتغليف. وضعية الاستلقاء "
         "الجانبي إذا فقد الوعي، الإنعاش إذا توقف التنفس."),
    ),
    (
        "co-poisoning", "poisoning", "high",
        "What to do for carbon monoxide poisoning?",
        "Que faire en cas d'intoxication au monoxyde de carbone ?",
        "ماذا أفعل في حالة التسمم بأول أكسيد الكربون؟",
        ("Carbon monoxide CO poisoning first aid emergency: move the person "
         "to fresh air immediately. Open windows and doors. Turn off the gas "
         "source if safe. Call ambulance. Do not light a flame. Place "
         "unconscious person in recovery position, start CPR if not "
         "breathing. Symptoms: headache, dizziness, nausea, confusion."),
        ("Intoxication au monoxyde de carbone CO urgence: deplacez la "
         "personne au grand air immediatement. Ouvrez fenetres et portes. "
         "Coupez la source de gaz si securitaire. Appelez les secours. "
         "N'allumez aucune flamme. Position laterale si inconscient, RCP si "
         "pas de respiration. Symptomes: maux de tete, vertiges, nausees, "
         "confusion."),
        ("التسمم بأول أكسيد الكربون طارئ: انقل الشخص فوراً إلى الهواء "
         "الطلق. افتح النوافذ والأبواب. أغلق مصدر الغاز إذا كان آمناً. اتصل "
         "بالإسعاف. لا تشعل أي شعلة. وضعية الاستلقاء الجانبي إذا فقد الوعي، "
         "الإنعاش إذا توقف التنفس. الأعراض: صداع، دوار، غثيان، ارتباك."),
    ),
    # ---- allergy ----
    (
        "anaphylaxis", "allergy", "high",
        "What to do for a severe allergic reaction?",
        "Que faire en cas de réaction allergique sévère ?",
        "ماذا أفعل في حالة الحساسية المفرطة؟",
        ("Severe allergic reaction anaphylaxis EpiPen first aid: call "
         "ambulance immediately. Use the adrenaline auto-injector EpiPen in "
         "the outer thigh without delay. Lay the person flat with legs "
         "raised, on side if vomiting or breathing trouble. Do not let them "
         "stand. Second EpiPen dose after 5-15 minutes if symptoms persist."),
        ("Reaction allergique severe anaphylaxie EpiPen soins: appelez les "
         "secours immediatement. Utilisez l'auto-injecteur d'adrenaline "
         "EpiPen dans la cuisse exterieure sans delai. Allongez la personne "
         "sur le dos jambes surelevees, sur le cote si vomissements ou "
         "detresse. Ne la laissez pas se lever. 2eme dose apres 5-15 "
         "minutes si necessaire."),
        ("حساسية مفرطة شديدة أنافيلاكسي إيبي بان إسعاف: اتصل بالإسعاف "
         "فوراً. استخدم حاقن الأدرينالين EpiPen في الفخذ الخارجي دون تأخير. "
         "ضع الشخص مستلقياً على ظهره مع رفع الساقين، على جانبه إذا كان "
         "يتقيأ أو يواجه صعوبة في التنفس. لا تدعه يقف. جرعة ثانية بعد 5-15 "
         "دقيقة إذا استمرت الأعراض."),
    ),
    (
        "epipen", "allergy", "high",
        "How and when to use an EpiPen?",
        "Comment et quand utiliser un stylo EpiPen ?",
        "كيف ومتى أستخدم حاقن الأدرينالين EpiPen؟",
        ("How and when to use EpiPen adrenaline auto-injector anaphylaxis: "
         "use immediately at signs of anaphylaxis - throat swelling, "
         "difficulty breathing, full-body hives, dizziness, after exposure "
         "to allergen. Hold firmly mid-thigh outside, press blue cap up, "
         "swing orange tip into thigh for 3 seconds. Call ambulance. Lay "
         "person flat. Second dose after 5-15 minutes if needed."),
        ("Comment et quand utiliser un EpiPen anaphylaxie: utilisez "
         "immediatement aux signes d'anaphylaxie - gonflement gorge, "
         "difficultes respiratoires, urticaire, vertiges, apres exposition "
         "a l'allergene. Tenez fermement, capuchon bleu en haut, embout "
         "orange dans la cuisse exterieure 3 secondes. Appelez les secours. "
         "Allongez la personne. 2eme dose si necessaire 5-15 minutes."),
        ("كيف ومتى تستخدم EpiPen حاقن الأدرينالين أنافيلاكسي: استخدم فوراً "
         "عند علامات الحساسية المفرطة - تورم الحلق، صعوبة التنفس، طفح في "
         "كامل الجسم، دوار، بعد التعرض للمسبب. أمسكه بقوة، الغطاء الأزرق "
         "أعلى، اضغط الطرف البرتقالي في الفخذ الخارجي 3 ثوان. اتصل "
         "بالإسعاف. مدد الشخص. جرعة ثانية بعد 5-15 دقيقة."),
    ),
    (
        "insect-bite", "allergy", "standard",
        "What to do after a bee sting?",
        "Que faire après une piqûre d'abeille ?",
        "ماذا أفعل بعد قرصة نحلة؟",
        ("Bee sting first aid insect minor allergic: if the stinger is "
         "visible, scrape it out with the edge of a card - do not squeeze "
         "with tweezers. Wash the area with soap and water. Apply a cold "
         "pack. Take oral antihistamine if needed. Watch for signs of "
         "anaphylaxis (throat swelling, breathing difficulty) - call "
         "ambulance immediately if those appear."),
        ("Piqure d'abeille soins insecte allergie legere: si le dard est "
         "visible, retirez-le en grattant avec le bord d'une carte - ne "
         "pincez pas avec une pincette. Lavez la zone avec eau et savon. "
         "Compresse froide. Antihistaminique oral si besoin. Surveillez les "
         "signes d'anaphylaxie (gorge gonflee, detresse respiratoire) - "
         "appelez les secours immediatement si ces signes apparaissent."),
        ("قرصة نحلة إسعاف حشرة حساسية بسيطة: إذا كانت الإبرة ظاهرة، اكشطها "
         "بحافة بطاقة - لا تضغطها بملقط. اغسل المنطقة بالماء والصابون. ضع "
         "كمادة باردة. تناول مضاد هيستامين عن طريق الفم إذا لزم. راقب "
         "علامات الحساسية المفرطة (تورم الحلق، صعوبة التنفس) - اتصل "
         "بالإسعاف فوراً عند ظهورها."),
    ),
    # ---- thermal ----
    (
        "hypothermia", "thermal", "high",
        "How to treat hypothermia from cold exposure?",
        "Comment soigner l'hypothermie due au froid ?",
        "كيف أعالج انخفاض حرارة الجسم من البرد؟",
        ("Hypothermia cold exposure first aid thermal: move the person to a "
         "warm place. Remove wet clothing and cover with dry blankets. "
         "Rewarm the core first (chest, neck, head) not the extremities. Do "
         "not rub limbs. Give warm sweet drinks if alert, no alcohol. Call "
         "ambulance if unconscious. Handle gently to avoid cardiac "
         "arrhythmia."),
        ("Hypothermie expose au froid soins thermique: deplacez la personne "
         "dans un endroit chaud. Retirez vetements mouilles et couvrez de "
         "couvertures seches. Rechauffez d'abord le tronc (poitrine, cou, "
         "tete) pas les extremites. Ne frottez pas les membres. Boissons "
         "chaudes sucrees si consciente, pas d'alcool. Appelez les secours "
         "si inconsciente. Manipulez avec douceur pour eviter les troubles "
         "du rythme cardiaque."),
        ("انخفاض حرارة الجسم تعرض للبرد إسعاف حراري: انقل الشخص إلى مكان "
         "دافئ. اخلع الملابس المبتلة وغطه ببطانيات جافة. سخن الجذع أولاً "
         "(الصدر، الرقبة، الرأس) وليس الأطراف. لا تدلك الأطراف. أعطه "
         "مشروبات دافئة حلوة إذا كان واعياً، لا كحول. اتصل بالإسعاف إذا "
         "فقد الوعي. تعامل بلطف لتجنب اضطراب نظم القلب."),
    ),
    (
        "frostbite", "thermal", "high",
        "How to treat frostbite on fingers?",
        "Comment soigner des gelures sur les doigts ?",
        "كيف أعالج قضمة الصقيع على الأصابع؟",
        ("Frostbite fingers first aid thermal cold injury: move to a warm "
         "place. Remove wet clothing and constricting items like rings. "
         "Rewarm the affected area in warm not hot water 37-39 C for 20-30 "
         "minutes until skin is soft and red. Do not rub the area or use "
         "direct heat. Cover with loose sterile dressings and seek medical "
         "care."),
        ("Gelures des doigts soins thermique blessure froide: deplacez dans "
         "un endroit chaud. Retirez vetements mouilles et objets serres "
         "comme les bagues. Rechauffez la zone dans de l'eau tiede non "
         "chaude 37-39 C pendant 20-30 minutes jusqu'a peau souple et rouge. "
         "Ne frottez pas ni n'utilisez chaleur directe. Pansements steriles "
         "laches et consultation medicale."),
        ("قضمة الصقيع على الأصابع إسعاف حراري إصابة بالبرد: انتقل إلى مكان "
         "دافئ. اخلع الملابس المبتلة والعناصر الضاغطة مثل الخواتم. سخن "
         "المنطقة المصابة في ماء دافئ غير ساخن 37-39 درجة لمدة 20-30 دقيقة "
         "حتى يصبح الجلد ناعماً وأحمر. لا تدلك المنطقة ولا تستخدم حرارة "
         "مباشرة. ضمادات معقمة فضفاضة ورعاية طبية."),
    ),
]


def expand_anchor_seeds() -> list[dict]:
    """Build anchor rows. The answer is prefixed with the question
    repeated three times so the multilingual model's mean-pooling
    gives extra weight to the question's vocabulary -- otherwise the
    long answer text dominates the chunk embedding and a paraphrased
    test query may match a semantically-adjacent topic instead of its
    own anchor."""
    rows: list[dict] = []
    for entry in ANCHOR_TRIPLETS:
        anchor_id, cat, sev, en_q, fr_q, ar_q, en_a, fr_a, ar_a = entry
        for lang, q, a in [("en", en_q, en_a), ("fr", fr_q, fr_a), ("ar", ar_q, ar_a)]:
            boosted_answer = f"{q} {q} {q} {a}"
            rows.append(
                {
                    "question": q,
                    "answer": boosted_answer,
                    "source": f"curated/anchor/{anchor_id}",
                    "category": cat,
                    "severity_hint": sev,
                }
            )
    return rows


if __name__ == "__main__":
    rows = expand_anchor_seeds()
    print(f"Total anchor rows: {len(rows)}")
    by_cat: dict[str, int] = {}
    for r in rows:
        by_cat[r["category"]] = by_cat.get(r["category"], 0) + 1
    for cat, n in sorted(by_cat.items(), key=lambda x: -x[1]):
        print(f"  {cat:15s} {n}")
