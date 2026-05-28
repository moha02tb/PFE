"""French first-aid seed entries.

20 emergency scenarios x 10 question phrasings = 200 entries.
Mirrors ``arabic_seeds.py`` for the cross-lingual alignment test.
Each entry pairs a French question phrasing with the same detailed
French answer; styles cover formal/informal/Tunisian-mix/parent/
symptom/emergency/do-not/steps/question/severity variants.
"""

FRENCH_FIRSTAID: list[dict] = [
    {
        "name": "burn",
        "category": "burn",
        "severity": "standard",
        "answer": (
            "En cas de brûlure: passez la zone sous l'eau froide courante "
            "pendant 10 a 20 minutes. Retirez bijoux et vetements serres "
            "avant que la zone enfle. Couvrez avec un pansement propre "
            "non adhesif. Ne pas appliquer beurre, dentifrice ou glace. "
            "Consultez un medecin si la brûlure est plus large que la "
            "paume, sur le visage, les mains, les pieds ou les parties "
            "genitales, ou si des cloques apparaissent."
        ),
        "questions": [
            "Que faire en cas de brûlure grave ?",
            "j'ai une brûlure comment je fais ?",
            "walid brûlé comment aider ?",
            "mon bébé s'est brûlé que faire ?",
            "peau rouge cloquee apres contact avec flamme",
            "brûlure grave besoin aide immediate",
            "ne pas mettre de glace sur une brûlure",
            "etapes premiers secours brûlure",
            "comment traiter une brûlure au deuxieme degre ?",
            "brûlure legere vs brûlure grave difference",
        ],
    },
    {
        "name": "choking",
        "category": "airway",
        "severity": "high",
        "answer": (
            "Si la personne s'etouffe et ne peut ni respirer ni tousser "
            "ni parler, agissez immediatement. Appelez les secours "
            "(15 en France, 190 en Tunisie). Donnez jusqu'a 5 claques "
            "fortes entre les omoplates. Si l'objet n'est pas expulse, "
            "donnez 5 compressions abdominales (manoeuvre de Heimlich) "
            ": poing au-dessus du nombril, tirez fortement vers vous et "
            "vers le haut. Alternez 5 claques et 5 compressions. Si la "
            "personne perd connaissance, commencez le massage cardiaque."
        ),
        "questions": [
            "Que faire si quelqu'un s'etouffe ?",
            "mon ami s'etouffe avec de la nourriture aide vite",
            "walid s'etouffe que faire urgent",
            "mon bébé s'etouffe avec du lait que faire",
            "personne ne respire plus avalee morceau de pain",
            "etouffement urgence besoin aide immediate",
            "ne pas donner d'eau a une personne qui s'etouffe",
            "etapes manoeuvre Heimlich enfant adulte",
            "comment faire la manoeuvre de Heimlich ?",
            "etouffement leger toux vs etouffement total difference",
        ],
    },
    {
        "name": "bleeding",
        "category": "bleeding",
        "severity": "high",
        "answer": (
            "Pour un saignement abondant: appelez les secours immediatement. "
            "Appliquez une pression ferme et continue sur la plaie avec "
            "un linge propre ou une compresse sterile. Ne retirez pas un "
            "pansement imbibe de sang ; ajoutez-en un autre par-dessus. "
            "Surelevez le membre blesse au-dessus du coeur si possible. "
            "Si le saignement met la vie en danger sur un membre et que "
            "la pression directe ne suffit pas, posez un garrot a 5-7 cm "
            "au-dessus de la plaie et notez l'heure. Maintenez la personne "
            "au chaud pour eviter le choc."
        ),
        "questions": [
            "Comment arreter un saignement abondant ?",
            "ca saigne beaucoup que faire vite",
            "khouya jrah el dem yesil bezzef shnoua na3mel",
            "mon enfant a une grosse plaie qui saigne au secours",
            "sang qui gicle d'une plaie profonde a la jambe",
            "hemorragie grave urgence besoin aide immediate",
            "ne pas retirer le pansement imbibe de sang",
            "etapes pour stopper un saignement majeur",
            "quand poser un garrot pour stopper l'hemorragie ?",
            "saignement leger vs saignement abondant difference",
        ],
    },
    {
        "name": "fracture",
        "category": "trauma",
        "severity": "standard",
        "answer": (
            "En cas de fracture suspectee: maintenez le membre blesse "
            "immobile dans la position trouvee. Ne tentez pas de "
            "remettre l'os en place. Soutenez la zone au-dessus et "
            "en-dessous de la blessure avec un rembourrage ou une "
            "attelle faite de materiaux rigides emballes dans un tissu. "
            "Appliquez une compresse froide enveloppee dans une "
            "serviette pour reduire l'enflure. Traitez tout saignement "
            "externe en exerçant une pression autour de l'os, pas sur "
            "lui. Appelez les secours, surtout pour les fractures "
            "suspectes de la colonne, de la hanche ou les fractures "
            "ouvertes."
        ),
        "questions": [
            "Comment traiter une fracture osseuse presumee ?",
            "je crois que je me suis casse le bras",
            "walid kassar idou comment aider",
            "mon enfant est tombe son bras semble casse",
            "deformation du membre apres une chute violente",
            "fracture grave urgence besoin aide immediate",
            "ne pas remettre l'os en place soi-meme",
            "etapes immobilisation fracture en attendant les secours",
            "comment faire une attelle de fortune ?",
            "fracture fermee vs fracture ouverte difference",
        ],
    },
    {
        "name": "poisoning",
        "category": "poisoning",
        "severity": "high",
        "answer": (
            "En cas d'intoxication: appelez immediatement les secours "
            "ou le centre antipoison. Ne provoquez pas de vomissements "
            "sauf instruction d'un professionnel. Si la personne est "
            "inconsciente mais respire, placez-la en position laterale "
            "de securite. Si elle ne respire plus, commencez le massage "
            "cardiaque. Essayez d'identifier la substance et la quantite "
            "ingerees, et gardez le contenant ou l'emballage pour les "
            "secouristes."
        ),
        "questions": [
            "Que faire si un enfant a avale du poison ?",
            "mon fils a bu de l'eau de javel aide",
            "walid chreb javel chnowa na3mel",
            "mon bébé a avale du produit menager au secours",
            "vomissements et confusion apres ingestion d'un produit",
            "intoxication urgence besoin aide immediate",
            "ne pas faire vomir sans avis medical",
            "etapes premiers secours intoxication chimique",
            "quand appeler le centre antipoison ?",
            "intoxication legere vs intoxication grave difference",
        ],
    },
    {
        "name": "drowning",
        "category": "airway",
        "severity": "high",
        "answer": (
            "Sortez la personne de l'eau en toute securite sans vous "
            "mettre en danger. Appelez les secours immediatement. "
            "Si la victime ne respire pas, commencez la reanimation "
            "cardio-pulmonaire avec 5 insufflations puis 30 "
            "compressions et 2 insufflations. Retirez les vetements "
            "mouilles et maintenez-la au chaud pour eviter "
            "l'hypothermie. Meme si elle semble se remettre, faites-la "
            "examiner a l'hopital car une noyade secondaire peut "
            "survenir plusieurs heures plus tard."
        ),
        "questions": [
            "Que faire pour une personne qui a failli se noyer ?",
            "on a sorti un enfant de l'eau il ne respire plus",
            "walid gher9 fil ma comment aider",
            "mon bébé est tombe dans la piscine au secours",
            "victime apres immersion respire faiblement et tousse",
            "noyade urgence besoin aide immediate",
            "ne pas laisser la victime de noyade sans surveillance medicale",
            "etapes reanimation apres noyade",
            "comment faire le bouche-a-bouche apres noyade ?",
            "quasi-noyade vs noyade complete difference",
        ],
    },
    {
        "name": "seizure",
        "category": "neuro",
        "severity": "high",
        "answer": (
            "Gardez votre calme et protegez la personne des blessures. "
            "Eloignez les objets tranchants et placez quelque chose "
            "de mou sous la tete. Ne la maintenez pas et ne mettez "
            "rien dans sa bouche. Chronometrez la crise. A la fin, "
            "mettez la personne en position laterale de securite pour "
            "maintenir les voies aeriennes ouvertes. Appelez les "
            "secours si la crise dure plus de 5 minutes, se repete, "
            "si la personne est blessee, enceinte, ou si c'est sa "
            "premiere crise."
        ),
        "questions": [
            "Comment aider quelqu'un qui fait une crise d'epilepsie ?",
            "ma soeur convulse au sol que faire",
            "walid 3andou nouba comment aider",
            "mon enfant a soudain des convulsions au secours",
            "tremblements et perte de conscience d'un proche",
            "crise convulsive urgence besoin aide immediate",
            "ne pas mettre d'objet dans la bouche d'un epileptique",
            "etapes pour gerer une crise d'epilepsie",
            "comment placer un epileptique en position de securite ?",
            "crise breve vs etat de mal epileptique difference",
        ],
    },
    {
        "name": "cardiac-arrest",
        "category": "cardiac",
        "severity": "high",
        "answer": (
            "Appelez les secours immediatement (15 en France, 190 en "
            "Tunisie). Placez la personne sur le dos sur une surface "
            "dure. Mettez le talon d'une main au centre de la poitrine, "
            "l'autre main par-dessus. Appuyez fort et vite : 30 "
            "compressions de 5-6 cm de profondeur a 100-120 par minute. "
            "Donnez 2 insufflations si vous etes forme, sinon continuez "
            "le massage. Poursuivez sans interruption jusqu'a l'arrivee "
            "des secours ou au reveil de la personne."
        ),
        "questions": [
            "Comment faire un massage cardiaque sur un adulte ?",
            "mon pere s'est ecroule son coeur s'est arrete",
            "baba twa9af 9albou chnowa na3mel",
            "mon mari est inconscient pas de pouls au secours",
            "personne effondree sans pouls ni respiration",
            "arret cardiaque urgence besoin aide immediate",
            "ne pas arreter le massage tant que les secours ne sont pas la",
            "etapes RCP adulte avec ou sans bouche-a-bouche",
            "combien de compressions thoraciques par minute ?",
            "massage cardiaque adulte vs enfant difference",
        ],
    },
    {
        "name": "stroke",
        "category": "neuro",
        "severity": "high",
        "answer": (
            "Utilisez le test FAST: visage tombant d'un cote, faiblesse "
            "d'un bras quand il est leve, parole troublee ou etrange, "
            "appelez les secours immediatement. Notez l'heure d'apparition "
            "des symptomes, c'est crucial pour le traitement. Gardez la "
            "personne calme et confortable. Ne lui donnez ni nourriture, "
            "ni boisson, ni medicament. Si elle est inconsciente mais "
            "respire, placez-la en position laterale de securite."
        ),
        "questions": [
            "Comment reconnaitre un AVC et que faire ?",
            "ma mere ne parle plus son visage est tordu vite",
            "mema lsanha twa9af et wajha tordu chnowa na3mel",
            "ma grand-mere a soudain un cote paralyse au secours",
            "visage tombant sur le cote et bras faible",
            "AVC en cours urgence besoin aide immediate",
            "ne pas donner a manger ou a boire a un suspect d'AVC",
            "etapes du test FAST face arm speech time",
            "comment savoir si c'est vraiment un AVC ?",
            "AVC ischemique vs hemorragique difference",
        ],
    },
    {
        "name": "anaphylaxis",
        "category": "allergy",
        "severity": "high",
        "answer": (
            "L'anaphylaxie met la vie en danger. Appelez les secours "
            "immediatement. Si un auto-injecteur d'adrenaline (EpiPen) "
            "est disponible, utilisez-le dans la cuisse exterieure sans "
            "delai. Une seconde dose peut etre donnee apres 5-15 "
            "minutes si les symptomes persistent. Allongez la personne "
            "sur le dos jambes surelevees ; sur le cote en cas de "
            "vomissements ou de detresse respiratoire. Ne la laissez "
            "pas se lever ou marcher."
        ),
        "questions": [
            "Que faire en cas de reaction allergique severe ?",
            "mon fils a la gorge qui enfle apres avoir mange des cacahuetes",
            "walidi wajhou monfokh w ma yetnafesh chnowa na3mel",
            "mon bébé a une reaction allergique grave au secours",
            "gonflement de la gorge et difficultes a respirer",
            "anaphylaxie urgence besoin aide immediate EpiPen",
            "ne pas laisser la personne se lever apres injection d'adrenaline",
            "etapes utilisation EpiPen chez un enfant",
            "comment utiliser un stylo auto-injecteur d'adrenaline ?",
            "allergie legere vs choc anaphylactique difference",
        ],
    },
    {
        "name": "head-trauma",
        "category": "neuro",
        "severity": "high",
        "answer": (
            "Apres une blessure a la tete: appelez les secours si la "
            "personne est inconsciente, confuse ou vomit. Maintenez sa "
            "stabilite et ne bougez ni la tete ni le cou. Arretez tout "
            "saignement par une pression douce. Surveillez la respiration "
            "et la conscience. Cherchez des signes graves : vomissements "
            "repetes, convulsions, perte de connaissance, liquide clair "
            "ou sang sortant du nez ou des oreilles, pupilles inegales. "
            "Ne donnez ni nourriture ni boisson."
        ),
        "questions": [
            "Que faire pour une blessure a la tete apres une chute ?",
            "mon fils s'est cogne tres fort la tete que faire",
            "walid darab rasou b chedda chnowa na3mel",
            "mon bébé est tombe du lit a langer sur la tete au secours",
            "vomissements et confusion apres un choc a la tete",
            "trauma cranien grave urgence besoin aide immediate",
            "ne pas bouger la victime d'un trauma cranien serieux",
            "etapes surveillance apres choc a la tete",
            "comment savoir si une commotion est grave ?",
            "bosse legere vs trauma cranien grave difference",
        ],
    },
    {
        "name": "electric-shock",
        "category": "cardiac",
        "severity": "high",
        "answer": (
            "En cas d'electrocution: ne touchez pas la personne avant "
            "d'avoir coupe le courant a la source. Utilisez un baton "
            "en bois sec pour l'eloigner de la source. Appelez les "
            "secours immediatement. Verifiez respiration et pouls et "
            "commencez la reanimation si necessaire. Traitez les "
            "brûlures en les couvrant d'un pansement sterile. N'utilisez "
            "pas d'eau sur une brûlure electrique. Placez la personne "
            "inconsciente mais respirant en position laterale de "
            "securite."
        ),
        "questions": [
            "Comment aider quelqu'un qui a ete electrocute ?",
            "mon ami a touche un cable electrique il est par terre",
            "khouya electrocute aide vite",
            "mon enfant a mis le doigt dans la prise au secours",
            "personne par terre apres contact avec fil electrique",
            "electrocution urgence besoin aide immediate",
            "ne pas toucher une victime tant que le courant n'est pas coupe",
            "etapes premiers secours electrocution",
            "comment isoler la victime d'une electrocution ?",
            "choc electrique leger vs electrocution grave difference",
        ],
    },
    {
        "name": "chemical-burn",
        "category": "burn",
        "severity": "high",
        "answer": (
            "Pour une brûlure chimique: rincez la zone atteinte sous "
            "l'eau courante pendant au moins 20 minutes. Retirez "
            "soigneusement les vetements et les bijoux contamines "
            "pendant le rinçage. Ne tentez pas de neutraliser le "
            "produit chimique avec d'autres substances. Appelez les "
            "secours et le centre antipoison. Pour les yeux, rincez "
            "avec de l'eau propre pendant 20 minutes en maintenant la "
            "paupiere ouverte. Conservez le contenant du produit pour "
            "les secouristes."
        ),
        "questions": [
            "Comment soigner une brûlure chimique sur la peau ?",
            "j'ai renverse de l'acide sur moi vite",
            "tay7etli madda kimyowi 3ala el jeld chnowa na3mel",
            "mon enfant a mis du produit de nettoyage dans les yeux au secours",
            "peau brûlante apres contact avec produit menager",
            "brûlure chimique urgence besoin aide immediate",
            "ne pas neutraliser un produit chimique avec un autre",
            "etapes pour rincer une brûlure chimique aux yeux",
            "comment proteger les yeux d'un eclaboussure chimique ?",
            "brûlure thermique vs brûlure chimique difference",
        ],
    },
    {
        "name": "hypothermia",
        "category": "thermal",
        "severity": "high",
        "answer": (
            "En cas d'hypothermie: deplacez la personne dans un endroit "
            "chaud. Retirez les vetements mouilles et couvrez-la de "
            "couvertures seches. Rechauffez d'abord le tronc (poitrine, "
            "cou, tete) et non les extremites. Ne frottez pas les "
            "membres. Donnez des boissons chaudes sucrees si elle est "
            "consciente, mais pas d'alcool. Appelez les secours, "
            "surtout si la personne est inconsciente. Manipulez avec "
            "douceur pour eviter les troubles du rythme cardiaque."
        ),
        "questions": [
            "Comment soigner l'hypothermie due au froid ?",
            "mon ami a froid intense il tremble fort",
            "khouya bared barcha w yer3ach chnowa na3mel",
            "mon enfant est tombe dans la neige au secours",
            "tremblements et confusion apres exposition au froid",
            "hypothermie grave urgence besoin aide immediate",
            "ne pas frotter les extremites en cas d'hypothermie",
            "etapes rechauffement progressif apres hypothermie",
            "comment rechauffer une personne sans la bruler ?",
            "hypothermie legere vs grave difference",
        ],
    },
    {
        "name": "diabetic-shock",
        "category": "neuro",
        "severity": "high",
        "answer": (
            "En cas d'hypoglycemie severe (choc diabetique): si la "
            "personne est consciente, donnez-lui quelque chose de sucre "
            "rapidement absorbable comme un jus de fruit, du sucre ou "
            "des bonbons. Recommencez apres 10-15 minutes si l'etat ne "
            "s'ameliore pas. Si elle est inconsciente, appelez les "
            "secours immediatement et ne lui donnez rien par la bouche. "
            "Placez-la en position laterale de securite. Si elle ne "
            "respire plus, commencez la reanimation cardio-pulmonaire."
        ),
        "questions": [
            "Que faire en cas d'hypoglycemie d'urgence ?",
            "mon ami diabetique tremble et transpire que faire",
            "khouya 3andou sokri w sokrou tab chnowa na3mel",
            "mon papa diabetique est inconscient au secours",
            "sueurs froides et confusion chez un diabetique",
            "choc diabetique urgence besoin aide immediate",
            "ne pas donner d'insuline a un diabetique en hypoglycemie",
            "etapes resucrage pour une hypoglycemie severe",
            "comment savoir si c'est une hypo ou une hyperglycemie ?",
            "hypoglycemie legere vs choc diabetique difference",
        ],
    },
    {
        "name": "spinal-injury",
        "category": "trauma",
        "severity": "high",
        "answer": (
            "En cas de suspicion de lesion de la colonne: ne deplacez "
            "pas la victime sauf danger immediat. Appelez les secours. "
            "Maintenez la tete et le cou dans l'axe du corps avec vos "
            "mains de chaque cote de la tete. Si vous devez la "
            "deplacer, faites-le en bloc avec plusieurs personnes. Ne "
            "flechissez pas le cou et ne tournez pas la tete. "
            "Surveillez la respiration et soyez pret a faire un massage "
            "cardiaque."
        ),
        "questions": [
            "Que faire pour une suspicion de lesion de la colonne ?",
            "mon frere est tombe d'echelle il ne sent plus ses jambes",
            "khouya tah men ettalla 3andou alam fil dhahr",
            "mon enfant est tombe de velo il dit ne plus sentir son cou au secours",
            "incapacite a bouger les membres apres une chute violente",
            "lesion vertebrale urgence besoin aide immediate",
            "ne pas bouger une victime de trauma rachidien",
            "etapes immobilisation cervicale en attendant les secours",
            "comment proteger le cou d'une victime d'accident ?",
            "entorse cervicale vs lesion grave de la colonne difference",
        ],
    },
    {
        "name": "asthma-attack",
        "category": "airway",
        "severity": "high",
        "answer": (
            "En crise d'asthme severe: aidez la personne a s'asseoir "
            "redressee et legerement penchee en avant. Demandez-lui "
            "d'utiliser son inhalateur (bouffee toutes les 30-60 "
            "secondes, jusqu'a 10 bouffees). Appelez les secours si "
            "l'amelioration tarde ou si l'inhalateur ne suffit pas. "
            "Gardez-la calme et encouragez-la a respirer lentement. "
            "Ne la couchez pas. Surveillez les signes d'aggravation : "
            "levres bleues, incapacite a parler, epuisement."
        ),
        "questions": [
            "Comment aider quelqu'un en crise d'asthme severe ?",
            "mon enfant n'arrive plus a respirer aide vite",
            "walidi ma yet'9desh yetnafess chnowa na3mel",
            "mon bébé a une crise d'asthme grave la ventoline ne marche pas au secours",
            "respiration sifflante et levres bleues",
            "crise d'asthme severe urgence besoin aide immediate",
            "ne pas allonger une personne en crise d'asthme",
            "etapes utilisation ventoline en crise severe",
            "comment savoir si une crise d'asthme est grave ?",
            "asthme leger vs crise severe difference",
        ],
    },
    {
        "name": "febrile-seizure",
        "category": "neuro",
        "severity": "high",
        "answer": (
            "Convulsion febrile chez l'enfant: couchez l'enfant sur le "
            "cote sur une surface sure, loin des objets durs ou "
            "tranchants. Ne mettez rien dans sa bouche et ne le "
            "maintenez pas. Retirez les vetements en exces et diminuez "
            "la temperature de la piece. Chronometrez la crise. Apres, "
            "mettez-le en position laterale de securite et donnez un "
            "antipyretique. Appelez les secours si la crise dure plus "
            "de 5 minutes ou si c'est sa premiere convulsion. Ne le "
            "plongez pas dans un bain froid."
        ),
        "questions": [
            "Que faire pour un enfant en convulsion febrile ?",
            "mon bébé fait des convulsions a cause de la fievre que faire",
            "walidi 3andou sou5ouna w ybadda yter3ach chnowa na3mel",
            "mon enfant 40 de fievre il convulse au secours",
            "tremblements de tout le corps chez un enfant febrile",
            "convulsion febrile urgence besoin aide immediate",
            "ne pas plonger un enfant convulsif dans l'eau froide",
            "etapes prise en charge convulsion febrile",
            "comment proteger un enfant pendant une convulsion ?",
            "tremblements de fievre simple vs convulsion febrile difference",
        ],
    },
    {
        "name": "co-poisoning",
        "category": "poisoning",
        "severity": "high",
        "answer": (
            "En cas d'intoxication suspectee au monoxyde de carbone: "
            "deplacez immediatement la personne au grand air. Ouvrez "
            "fenetres et portes. Appelez les secours. Coupez la source "
            "de gaz si vous pouvez le faire en securite. N'allumez "
            "aucune etincelle. Si la personne est inconsciente, placez-la "
            "en position laterale de securite. Si elle ne respire plus, "
            "commencez la reanimation cardio-pulmonaire. Les symptomes "
            "incluent maux de tete, vertiges, nausees, confusion, perte "
            "de connaissance."
        ),
        "questions": [
            "Que faire en cas d'intoxication au monoxyde de carbone ?",
            "ma famille mal a la tete et nausees pres du chauffage gaz",
            "el 3a'ila masmouma men ghazz comment aider",
            "mon mari et mon fils inconscients pres du chauffe-eau au secours",
            "vertiges et confusion dans une piece avec chauffage gaz",
            "intoxication au CO urgence besoin aide immediate",
            "ne pas allumer de feu si suspicion de fuite de gaz",
            "etapes a suivre apres exposition au monoxyde de carbone",
            "comment detecter une fuite de gaz dangereux ?",
            "intoxication CO legere vs grave difference",
        ],
    },
    {
        "name": "cpr",
        "category": "cardiac",
        "severity": "high",
        "answer": (
            "Pour la reanimation cardio-pulmonaire sur un adulte: "
            "verifiez la conscience et appelez de l'aide. Couchez la "
            "personne sur le dos sur une surface dure. Mettez-vous "
            "a genoux a cote, placez le talon d'une main au centre de "
            "la poitrine, l'autre main par-dessus, doigts entrelaces. "
            "Appuyez fort et vite : 30 compressions de 5-6 cm de "
            "profondeur a 100-120 par minute. Donnez 2 insufflations "
            "si vous etes forme, sinon continuez les compressions. "
            "Repetez sans interruption jusqu'a l'arrivee des secours."
        ),
        "questions": [
            "Etapes de la reanimation cardio-pulmonaire ?",
            "comment faire un massage cardiaque etape par etape",
            "kifech na3mel massage cardiaque",
            "mon enfant doit faire un massage cardiaque sur son grand-pere",
            "personne sans pouls ni respiration RCP necessaire",
            "RCP urgence besoin aide immediate",
            "ne pas arreter les compressions tant que les secours ne sont pas la",
            "etapes RCP avec bouche-a-bouche et compressions thoraciques",
            "comment compter les compressions thoraciques par minute ?",
            "massage cardiaque adulte vs enfant vs bébé difference",
        ],
    },
]


def expand_french_seeds() -> list[dict]:
    """Return one row per (scenario, question phrasing) — 20 x 10 = 200 rows."""
    rows: list[dict] = []
    for sc in FRENCH_FIRSTAID:
        answer = sc["answer"]
        cat = sc["category"]
        sev = sc["severity"]
        name = sc["name"]
        for q in sc["questions"]:
            rows.append(
                {
                    "question": q,
                    "answer": answer,
                    "source": f"curated/french/{name}",
                    "category": cat,
                    "severity_hint": sev,
                }
            )
    return rows


if __name__ == "__main__":
    rows = expand_french_seeds()
    print(f"Total French seed rows: {len(rows)}")
    by_cat: dict[str, int] = {}
    for r in rows:
        by_cat[r["category"]] = by_cat.get(r["category"], 0) + 1
    for cat, n in sorted(by_cat.items(), key=lambda x: -x[1]):
        print(f"  {cat:15s} {n}")
