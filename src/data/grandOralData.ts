export interface GrandOralTopic {
  id: string;
  title: string;
  specialties: string;
  pairCategory: 'maths-physique' | 'maths-nsi' | 'svt-physique' | 'ses-maths' | 'philo-humanites';
  problemStatement: string;
  hook: string;
  outline: Array<{ part: string; duration: string; details: string }>;
  keyConcepts: string[];
  juryQuestions: string[];
}

export interface GrandOralCriterion {
  id: string;
  label: string;
  description: string;
  maxPoints: number;
}

export interface SpecialtyModule {
  id: string;
  specialty: 'nsi' | 'ses';
  grade: '1ere' | 'terminale';
  title: string;
  summary: string;
  keySnippetTitle: string;
  keySnippet: string;
  bulletPoints: string[];
  exercise: {
    prompt: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  };
}

export const GRAND_ORAL_CRITERIA: GrandOralCriterion[] = [
  {
    id: 'voix',
    label: 'Qualité orale & gestion du temps',
    description: 'Voix audible, débit posé, regard engagé, respect des 10 minutes sans lire de notes.',
    maxPoints: 4,
  },
  {
    id: 'structure',
    label: 'Clarté de la démarche & argumentation',
    description: 'Problématique précise, transitions fluides, démonstration rigoureuse et conclusion ouverte.',
    maxPoints: 4,
  },
  {
    id: 'connaissances',
    label: 'Maîtrise des notions du programme',
    description: 'Vocabulaire scientifique/économique exact, théorèmes et modèles correctement mobilisés.',
    maxPoints: 4,
  },
  {
    id: 'interaction',
    label: 'Qualité de l’échange avec le jury',
    description: 'Écoute active, capacité à reformuler, rebondir et défendre son point de vue avec nuance.',
    maxPoints: 4,
  },
  {
    id: 'critique',
    label: 'Esprit critique & limites du modèle',
    description: 'Capacité à identifier les hypothèses simplificatrices, biais ou prolongements du sujet.',
    maxPoints: 4,
  },
];

export const GRAND_ORAL_TOPICS: GrandOralTopic[] = [
  {
    id: 'go-cryptographie-rsa',
    title: 'Cryptographie RSA et nombres premiers',
    specialties: 'Mathématiques · NSI',
    pairCategory: 'maths-nsi',
    problemStatement:
      'Comment l’arithmétique modulaire et la complexité de factorisation garantissent-elles la sécurité des paiements en ligne ?',
    hook: 'Chaque seconde, des millions de connexions HTTPS échangent des secrets sur un réseau public grâce à une asymétrie mathématique vieille de 45 ans.',
    outline: [
      {
        part: 'I. Fondements arithmétiques',
        duration: '3 min',
        details: 'Théorème de Bézout, petit théorème de Fermat, génération des clés publique (n, e) et privée d.',
      },
      {
        part: 'II. Implémentation et coût algorithmique',
        duration: '4 min',
        details: 'Exponentiation rapide en O(log e), test de primalité probabiliste, différence entre temps polynomial et factorisation sous-exponentielle.',
      },
      {
        part: 'III. Limites et horizon post-quantique',
        duration: '3 min',
        details: 'Algorithme de Shor, taille minimale des clés (2048–4096 bits) et transition vers les réseaux euclidiens.',
      },
    ],
    keyConcepts: ['Congruences modulo n', 'Algorithme d’Euclide étendu', 'Exponentiation rapide', 'Complexité algorithmique'],
    juryQuestions: [
      'Pourquoi choisit-on deux grands nombres premiers p et q de tailles voisines mais pas trop proches ?',
      'Quelle est la complexité de l’exponentiation rapide par rapport à une boucle naïve ?',
      'Pourquoi utilise-t-on RSA uniquement pour échanger une clé symétrique AES dans TLS ?',
    ],
  },
  {
    id: 'go-pendule-foucault',
    title: 'Équations différentielles et trajectoire des satellites',
    specialties: 'Mathématiques · Physique-Chimie',
    pairCategory: 'maths-physique',
    problemStatement:
      'Comment les lois de Kepler et les équations différentielles permettent-elles de placer un satellite en orbite géostationnaire ?',
    hook: 'Un satellite météorologique semble immobile au-dessus de l’équateur alors qu’il file à plus de 11 000 km/h dans l’espace.',
    outline: [
      {
        part: 'I. Mise en équation par la mécanique newtonienne',
        duration: '3 min',
        details: 'Seconde loi de Newton dans le repère de Frenet, gravitation universelle et démonstration de la 3ᵉ loi de Kepler.',
      },
      {
        part: 'II. Calcul précis de l’altitude géostationnaire',
        duration: '4 min',
        details: 'Résolution numérique avec T = 86 164 s (jour sidéral) donnant h ≈ 35 786 km, plan équatorial obligatoire.',
      },
      {
        part: 'III. Perturbations et maintien à poste',
        duration: '3 min',
        details: 'Influence luni-solaire, applatissement terrestre et gestion de fin de vie sur orbite cimetière.',
      },
    ],
    keyConcepts: ['Repère de Frenet', '3ᵉ loi de Kepler', 'Jour sidéral vs jour solaire', 'Équation différentielle du 2nd ordre'],
    juryQuestions: [
      'Pourquoi utilise-t-on la durée du jour sidéral (23 h 56 min) plutôt que 24 h exactement ?',
      'Peut-on placer un satellite géostationnaire à la verticale de Paris ? Pourquoi ?',
      'Comment évolue la vitesse orbitale si l’on double le rayon de l’orbite ?',
    ],
  },
  {
    id: 'go-epidemie-sir',
    title: 'Modélisation mathématique d’une épidémie (modèle SIR)',
    specialties: 'SVT · Mathématiques',
    pairCategory: 'svt-physique',
    problemStatement:
      'Dans quelle mesure un système différentiel simple permet-il d’estimer le seuil d’immunité collective d’une population ?',
    hook: 'Avant même la mise au point d’un vaccin, trois équations couplées suffisent à anticiper le pic hospitalier d’une maladie infectieuse.',
    outline: [
      {
        part: 'I. Compartiments biologiques et hypothèses',
        duration: '3 min',
        details: 'Sains (S), Infectés (I), Rétablis (R) ; mécanismes de réponse immunitaire adaptative et mémoire lymphocytaire.',
      },
      {
        part: 'II. Dynamique mathématique et nombre R₀',
        duration: '4 min',
        details: 'Étude du signe de dI/dt, apparition du seuil p_c = 1 − 1/R₀, résolution numérique par méthode d’Euler.',
      },
      {
        part: 'III. Limites du modèle homogène',
        duration: '3 min',
        details: 'Hétérogénéité sociale, mutations virales, perte d’immunité (modèles SEIR et SIRS).',
      },
    ],
    keyConcepts: ['Méthode d’Euler', 'Taux de reproduction R₀', 'Immunité adaptative', 'Seuil vaccinal'],
    juryQuestions: [
      'Si R₀ = 4, quel pourcentage minimal de la population faut-il immuniser pour stopper l’épidémie ?',
      'Quelles hypothèses du modèle SIR sont les plus irréalistes dans une grande métropole ?',
      'Quel est le rôle des lymphocytes B mémoire dans le passage au compartiment R ?',
    ],
  },
  {
    id: 'go-taxe-carbone',
    title: 'Taxe carbone et efficacité des incitations économiques',
    specialties: 'SES · Mathématiques',
    pairCategory: 'ses-maths',
    problemStatement:
      'Une tarification croissante du carbone peut-elle concilier réduction des émissions et justice sociale ?',
    hook: 'Polluer gratuitement coûte collectivement bien plus cher que le prix affiché à la pompe : c’est le paradoxe des externalités négatives.',
    outline: [
      {
        part: 'I. Défaillance de marché et externalité négative',
        duration: '3 min',
        details: 'Écart entre coût marginal privé et coût marginal social, principe pollueur-payeur de Pigou.',
      },
      {
        part: 'II. Élasticité-prix et modélisation de l’impact',
        duration: '4 min',
        details: 'Effet prix à court vs long terme, comparaison avec le marché européen des quotas (EU-ETS).',
      },
      {
        part: 'III. Acceptabilité sociale et redistribution',
        duration: '3 min',
        details: 'Effet régressif sur les ménages modestes ruraux, mécanisme du dividende climat redistribué.',
      },
    ],
    keyConcepts: ['Externalité négative', 'Taxe pigouvienne', 'Élasticité-prix', 'Quotas d’émission'],
    juryQuestions: [
      'Pourquoi l’élasticité-prix de la demande de carburant est-elle faible à court terme ?',
      'Quelle différence majeure existe-t-il entre une taxe carbone et un marché de quotas ?',
      'Comment éviter que la taxe ne pèse proportionnellement plus sur les ménages modestes ?',
    ],
  },
  {
    id: 'go-ia-biais-ethique',
    title: 'Algorithmes de décision et responsabilité morale',
    specialties: 'Philosophie · NSI',
    pairCategory: 'philo-humanites',
    problemStatement:
      'Déléguer une décision de sélection à un algorithme rend-il le jugement plus juste ou simplement plus opaque ?',
    hook: 'Un algorithme ne ressent ni colère ni fatigue, et pourtant il peut reproduire à grande échelle les discriminations des données passées.',
    outline: [
      {
        part: 'I. La promesse de neutralité calculatoire',
        duration: '3 min',
        details: 'Fonctionnement d’un classifieur supervisé (k-NN, régression) et idéal d’impartialité procédurale.',
      },
      {
        part: 'II. Biais de données et boîte noire',
        duration: '4 min',
        details: 'Corrélations statistiques vs causalité, perte d’explicabilité et illusion d’objectivité.',
      },
      {
        part: 'III. Responsabilité humaine et éthique de la décision',
        duration: '3 min',
        details: 'Distinction entre calcul et jugement prudentiel (Aristote, Kant), exigences d’auditabilité et de recours.',
      },
    ],
    keyConcepts: ['Apprentissage supervisé', 'Biais d’échantillonnage', 'Justice procédurale', 'Responsabilité morale'],
    juryQuestions: [
      'Un algorithme peut-il être tenu responsable au sens moral ou juridique du terme ?',
      'Comment détecter mathématiquement un biais caché dans un jeu de données d’entraînement ?',
      'La transparence du code source suffit-elle à garantir l’équité d’une décision automatisée ?',
    ],
  },
  {
    id: 'go-imagerie-medicale',
    title: 'Ondes ultrasonores et effet Doppler en échographie',
    specialties: 'Physique-Chimie · SVT',
    pairCategory: 'svt-physique',
    problemStatement:
      'Comment la physique des ondes permet-elle de mesurer la vitesse du flux sanguin sans aucune intervention chirurgicale ?',
    hook: 'Le même phénomène acoustique qui modifie le son d’une sirène d’ambulance permet aujourd’hui de dépister une sténose artérielle en temps réel.',
    outline: [
      {
        part: 'I. Propagation des ultrasons dans les tissus biologiques',
        duration: '3 min',
        details: 'Impédance acoustique, réflexion aux interfaces, choix des fréquences (2 à 15 MHz) entre résolution et pénétration.',
      },
      {
        part: 'II. Principe de l’effet Doppler sanguin',
        duration: '4 min',
        details: 'Décalage en fréquence Δf = 2 f₀ v cos(θ) / c sur les globules rouges en mouvement, rôle de l’angle d’incidence.',
      },
      {
        part: 'III. Apports cliniques et limites',
        duration: '3 min',
        details: 'Dépistage des thromboses et malformations cardiaques ; limites face aux os et à l’air (gel échographique).',
      },
    ],
    keyConcepts: ['Effet Doppler', 'Ultrasons', 'Impédance acoustique', 'Hémodynamique'],
    juryQuestions: [
      'Pourquoi applique-t-on toujours un gel aqueux entre la sonde et la peau du patient ?',
      'Que se passe-t-il dans la formule Doppler si la sonde est perpendiculaire au vaisseau (θ = 90°) ?',
      'Pourquoi les hautes fréquences améliorent-elles la résolution mais pénètrent-elles moins profondément ?',
    ],
  },
];

export const SPECIALTY_MODULES: SpecialtyModule[] = [
  // --- NSI ---
  {
    id: 'nsi-complexite-tri',
    specialty: 'nsi',
    grade: '1ere',
    title: 'Complexité temporelle & Algorithmes de tri',
    summary:
      'Analyser le nombre d’opérations élémentaires en fonction de la taille n d’une liste et prouver la terminaison et la correction grâce à un invariant de boucle.',
    keySnippetTitle: 'Tri par insertion en Python — O(n²) dans le pire cas, O(n) si déjà trié',
    keySnippet: `def tri_insertion(tab: list[int]) -> list[int]:
    for i in range(1, len(tab)):
        cle = tab[i]
        j = i - 1
        while j >= 0 and tab[j] > cle:
            tab[j + 1] = tab[j]
            j -= 1
        tab[j + 1] = cle
    return tab`,
    bulletPoints: [
      'Invariant de boucle : au début de l’itération i, la sous-liste tab[0..i-1] est déjà triée.',
      'Variant de boucle : j décroît strictement et reste ≥ -1, garantissant la terminaison.',
      'Recherche dichotomique sur tableau trié : complexité logarithmique O(log₂ n).',
    ],
    exercise: {
      prompt: 'Dans le pire cas (tableau trié en ordre décroissant), quelle est la complexité du tri par insertion sur n éléments ?',
      options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'],
      correctAnswer: 'O(n²)',
      explanation: 'Le nombre de comparaisons vaut 1 + 2 + … + (n−1) = n(n−1)/2, soit un ordre de grandeur quadratique O(n²).',
    },
  },
  {
    id: 'nsi-recursivite-arbres',
    specialty: 'nsi',
    grade: 'terminale',
    title: 'Récursivité, Diviser pour Régner & Arbres binaires',
    summary:
      'Décomposer un problème en sous-problèmes indépendants (Tri fusion en O(n log n)) et parcourir un arbre binaire de recherche (ABR) en préfixe, infixe ou postfixe.',
    keySnippetTitle: 'Hauteur et parcours infixe d’un Arbre Binaire de Recherche (Python)',
    keySnippet: `def hauteur(arbre) -> int:
    if arbre is None:
        return 0
    return 1 + max(hauteur(arbre.gauche), hauteur(arbre.droit))

def parcours_infixe(arbre, res=None) -> list:
    if res is None: res = []
    if arbre is not None:
        parcours_infixe(arbre.gauche, res)
        res.append(arbre.valeur)
        parcours_infixe(arbre.droit, res)
    return res`,
    bulletPoints: [
      'Un algorithme récursif exige toujours un cas de base et un appel sur une taille strictement inférieure.',
      'Le parcours infixe d’un ABR renvoie toujours les valeurs triées par ordre croissant.',
      'Le tri fusion divise en deux moitiés puis fusionne en temps linéaire → O(n log n) garanti.',
    ],
    exercise: {
      prompt: 'Quel parcours d’un Arbre Binaire de Recherche (ABR) produit systématiquement les clés dans l’ordre croissant ?',
      options: ['Parcours préfixe', 'Parcours infixe', 'Parcours postfixe', 'Parcours en largeur'],
      correctAnswer: 'Parcours infixe',
      explanation: 'Le parcours infixe visite le sous-arbre gauche (valeurs inférieures), puis la racine, puis le sous-arbre droit (valeurs supérieures).',
    },
  },
  {
    id: 'nsi-sql-relationnel',
    specialty: 'nsi',
    grade: 'terminale',
    title: 'Bases de données relationnelles & SQL',
    summary:
      'Modéliser des relations avec clés primaires et étrangères, garantir l’intégrité référentielle et écrire des requêtes de sélection, jointure et agrégation.',
    keySnippetTitle: 'Requête SQL avec jointure interne et agrégation (GROUP BY)',
    keySnippet: `SELECT e.nom, COUNT(n.id) AS nb_notes, ROUND(AVG(n.valeur), 2) AS moyenne
FROM eleves e
INNER JOIN notes n ON n.eleve_id = e.id
WHERE n.trimestre = 2
GROUP BY e.id, e.nom
HAVING AVG(n.valeur) >= 14
ORDER BY moyenne DESC;`,
    bulletPoints: [
      'Clé primaire (PRIMARY KEY) : identifie de manière unique et non nulle chaque tuple.',
      'Clé étrangère (FOREIGN KEY) : assure la cohérence référentielle entre deux tables.',
      'WHERE filtre les lignes avant agrégation ; HAVING filtre les groupes après GROUP BY.',
    ],
    exercise: {
      prompt: 'En SQL, quelle clause permet de filtrer les résultats APRÈS un regroupement GROUP BY sur une moyenne AVG() ?',
      options: ['WHERE', 'HAVING', 'ORDER BY', 'DISTINCT'],
      correctAnswer: 'HAVING',
      explanation: 'WHERE s’applique aux lignes individuelles avant regroupement ; HAVING filtre sur les fonctions d’agrégation (AVG, COUNT, SUM) après GROUP BY.',
    },
  },
  {
    id: 'nsi-reseaux-routage',
    specialty: 'nsi',
    grade: 'terminale',
    title: 'Protocoles réseaux, Routage RIP & OSPF',
    summary:
      'Comprendre l’encapsulation TCP/IP, le calcul d’adresse réseau par masque de sous-réseau et la différence entre vecteurs de distance (RIP) et état des liens (OSPF).',
    keySnippetTitle: 'Calcul du coût d’un lien dans le protocole OSPF (algorithme de Dijkstra)',
    keySnippet: `Coût OSPF d'une liaison = bande_passante_référence / bande_passante_lien
Exemple (référence = 100 Mbit/s) :
  - Liaison Fast Ethernet 100 Mbit/s -> coût = 1
  - Liaison 10 Mbit/s                -> coût = 10
  - Liaison Fibre 1 Gbit/s           -> coût = 0,1 (ou 1 selon référence)`,
    bulletPoints: [
      'RIP minimise le nombre de sauts (max 15 routeurs), sans tenir compte du débit réel.',
      'OSPF applique l’algorithme de Dijkstra sur le graphe pondéré par les coûts de bande passante.',
      'TCP garantit la fiabilité (acquittements ACK, retransmission) contrairement à UDP.',
    ],
    exercise: {
      prompt: 'Sur quel critère principal le protocole de routage RIP choisit-il la meilleure route entre deux routeurs ?',
      options: [
        'Le débit maximal des liens',
        'Le nombre minimal de sauts (routeurs traversés)',
        'La latence en millisecondes',
        'La taille des paquets IP',
      ],
      correctAnswer: 'Le nombre minimal de sauts (routeurs traversés)',
      explanation: 'RIP (Routing Information Protocol) utilise uniquement le nombre de sauts comme métrique, contrairement à OSPF qui pondère par la bande passante.',
    },
  },

  // --- SES ---
  {
    id: 'ses-marche-equilibre',
    specialty: 'ses',
    grade: '1ere',
    title: 'Fonctionnement d’un marché concurrentiel & Surplus',
    summary:
      'Analyser la formation du prix d’équilibre par confrontation de l’offre croissante et de la demande décroissante, ainsi que les effets d’une taxe forfaitaire.',
    keySnippetTitle: 'Condition d’équilibre et gain à l’échange',
    keySnippet: `Équilibre concurrentiel : Offre Q_o(P*) = Demande Q_d(P*)
Surplus du consommateur = Disposition maximale à payer − Prix payé (P*)
Surplus du producteur   = Prix reçu (P*) − Coût marginal de production
Une taxe forfaitaire déplace la courbe d'offre vers le haut : P augmente, Q diminue.`,
    bulletPoints: [
      'En concurrence pure et parfaite, les agents sont preneurs de prix (price takers).',
      'Le prix d’équilibre maximise le surplus total (consommateurs + producteurs).',
      'Une subvention déplace l’offre vers la droite, abaissant le prix d’équilibre et augmentant la quantité.',
    ],
    exercise: {
      prompt: 'Sur un marché concurrentiel, quel est l’effet immédiat d’une hausse du coût des matières premières sur la courbe d’offre et le prix d’équilibre ?',
      options: [
        'Déplacement de l’offre vers la droite et baisse du prix',
        'Déplacement de l’offre vers la gauche (haut) et hausse du prix',
        'Déplacement de la demande vers la droite et hausse de la quantité',
        'Aucun effet sur l’équilibre',
      ],
      correctAnswer: 'Déplacement de l’offre vers la gauche (haut) et hausse du prix',
      explanation: 'À prix inchangé, les entreprises produisent moins car leur coût marginal augmente : la courbe d’offre recule vers la gauche, faisant monter le prix d’équilibre.',
    },
  },
  {
    id: 'ses-croissance-pgf',
    specialty: 'ses',
    grade: 'terminale',
    title: 'Sources de la croissance économique & Progrès technique',
    summary:
      'Distinguer croissance extensive (accumulation de travail et capital) et croissance intensive portée par la Productivité Globale des Facteurs (PGF) et les institutions.',
    keySnippetTitle: 'Décomposition comptable de la croissance du PIB',
    keySnippet: `Taux de croissance du PIB = Contribution du travail (L)
                          + Contribution du capital (K)
                          + Productivité Globale des Facteurs (PGF)

Croissance endogène : capital humain, R&D et infrastructures publiques génèrent
des rendements croissants et des externalités positives durables.`,
    bulletPoints: [
      'Le progrès technique est endogène : il résulte d’investissements en R&D, éducation et brevets.',
      'La destruction créatrice (Schumpeter) renouvelle l’appareil productif mais crée des perdants à court terme.',
      'Des institutions inclusives (droits de propriété, État de droit) incitent à innover.',
    ],
    exercise: {
      prompt: 'Que mesure la Productivité Globale des Facteurs (PGF) dans l’analyse des sources de la croissance ?',
      options: [
        'Uniquement le nombre d’heures travaillées dans l’année',
        'La part de la croissance du PIB non expliquée par la seule hausse des quantités de travail et de capital',
        'Le taux d’inflation annuel mesuré par l’IPC',
        'Le solde de la balance commerciale',
      ],
      correctAnswer:
        'La part de la croissance du PIB non expliquée par la seule hausse des quantités de travail et de capital',
      explanation: 'La PGF capte l’efficacité combinée des facteurs (progrès technique, organisation du travail, compétences), moteur de la croissance intensive.',
    },
  },
  {
    id: 'ses-mobilite-sociale',
    specialty: 'ses',
    grade: 'terminale',
    title: 'Structure sociale & Mobilité intergénérationnelle',
    summary:
      'Lire les tables de mobilité (destinée et recrutement), distinguer mobilité structurelle et fluidité sociale (odds ratios), et analyser le rôle de l’école.',
    keySnippetTitle: 'Distinction clé des tables de mobilité (INSEE)',
    keySnippet: `Table de destinée    : « Que deviennent les enfants de cadres ? » (lecture en ligne/colonne selon origine)
Table de recrutement : « D'où viennent les cadres d'aujourd'hui ? »
Mobilité observée    = Mobilité structurelle (mutation des emplois) + Mobilité nette (fluidité)`,
    bulletPoints: [
      'L’évolution de la structure des emplois (déclin agricole, essor des cadres) génère de la mobilité structurelle.',
      'Le paradoxe d’Anderson montre qu’un diplôme plus élevé que celui des parents ne garantit pas toujours un statut supérieur.',
      'Capital économique, culturel et social (Bourdieu) ou calcul coûts/avantages (Boudon) expliquent la reproduction sociale.',
    ],
    exercise: {
      prompt: 'Quelle table permet de répondre à la question : « Parmi les ouvriers actuels, quelle part a un père qui était lui-même ouvrier ? »',
      options: [
        'La table de destinée',
        'La table de recrutement',
        'La courbe de Lorenz',
        'Le tableau entrées-sorties',
      ],
      correctAnswer: 'La table de recrutement',
      explanation: 'La table de recrutement s’intéresse à l’origine sociale des personnes occupant aujourd’hui une catégorie socioprofessionnelle donnée.',
    },
  },
  {
    id: 'ses-action-climat',
    specialty: 'ses',
    grade: 'terminale',
    title: 'Action publique pour l’environnement & Biens communs',
    summary:
      'Comprendre la tragédie des biens communs (climat non-excluable et rival), les stratégies de passager clandestin à l’échelle internationale et les instruments de politique climatique.',
    keySnippetTitle: 'Les 4 instruments complémentaires de la politique climatique',
    keySnippet: `1. Réglementation   : normes d'émissions, interdictions (efficace mais peu flexible)
2. Taxation         : taxe carbone (signal-prix incitatif + recettes fiscales)
3. Marché de quotas : plafond quantitatif garanti (EU-ETS) mais prix volatil
4. Subventions R&D  : soutien aux technologies bas-carbone (effet d'apprentissage)`,
    bulletPoints: [
      'Le climat est un bien commun mondial : chaque État est tenté par le comportement de passager clandestin.',
      'La réglementation fixe une obligation uniforme ; la taxe et les quotas incitent à réduire là où le coût est le plus faible.',
      'Un policy-mix combine signal-prix, normes techniques et accompagnement social.',
    ],
    exercise: {
      prompt: 'Pourquoi le climat est-il qualifié de « bien commun » en économie ?',
      options: [
        'Il est excluable et non rival',
        'Il est non excluable et rival (les émissions d’un pays réduisent le budget carbone disponible pour tous)',
        'Il est produit exclusivement par des entreprises privées',
        'Il ne subit aucune externalité',
      ],
      correctAnswer:
        'Il est non excluable et rival (les émissions d’un pays réduisent le budget carbone disponible pour tous)',
      explanation: 'Personne ne peut être exclu du climat stable (non excluable), mais la capacité d’absorption de l’atmosphère est limitée (rivalité), d’où un risque de surexploitation.',
    },
  },
];
