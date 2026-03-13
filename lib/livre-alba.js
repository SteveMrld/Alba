// ─── CE QUE L'AUBE SAIT — Structure éditoriale ───────────────────────────────

export const LIVRE_META = {
  titre: "Ce que l'aube sait",
  auteur: "ALBA",
  sousTitre: "Un livre pour l'année intérieure",
};

export const CHAPITRES = [
  { num: 1,  mois: 1,  titre: "Ce qui commence",        couleur: "#C8A96E", gravure: "commencement" },
  { num: 2,  mois: 2,  titre: "Ce qu'on porte",         couleur: "#9898C8", gravure: "porter" },
  { num: 3,  mois: 3,  titre: "Le corps sait",           couleur: "#78A878", gravure: "corps" },
  { num: 4,  mois: 4,  titre: "Les liens",               couleur: "#C87878", gravure: "lien" },
  { num: 5,  mois: 5,  titre: "Ce qui résiste",          couleur: "#C8A040", gravure: "resistance" },
  { num: 6,  mois: 6,  titre: "L'été intérieur",         couleur: "#E8A870", gravure: "ete" },
  { num: 7,  mois: 7,  titre: "Le silence",              couleur: "#7898A8", gravure: "silence" },
  { num: 8,  mois: 8,  titre: "Ce qu'on traverse",       couleur: "#A87858", gravure: "traversee" },
  { num: 9,  mois: 9,  titre: "Revenir à soi",           couleur: "#88A888", gravure: "retour" },
  { num: 10, mois: 10, titre: "Ce qui part",             couleur: "#B89870", gravure: "depart" },
  { num: 11, mois: 11, titre: "La gratitude sauvage",    couleur: "#C8B098", gravure: "gratitude" },
  { num: 12, mois: 12, titre: "Ce qui reste",            couleur: "#A898C8", gravure: "reste" },
];

// Types de pages selon le jour de la semaine
export const TYPES_PAR_JOUR = {
  1: "saviez-vous",    // Lundi
  2: "corps-cerveau",  // Mardi
  3: "conte",          // Mercredi
  4: "saviez-vous",    // Jeudi
  5: "corps-cerveau",  // Vendredi
  6: "pratique",       // Samedi
  0: "phrase",         // Dimanche
};

// 52 thèmes — un par semaine
export const THEMES_SEMAINES = [
  "la résilience", "le deuil et la perte", "l'identité", "la confiance",
  "le corps et ses mémoires", "la colère", "le pardon", "la solitude",
  "les relations", "la peur", "le temps qui passe", "la gratitude",
  "l'ambition", "la transmission", "les origines", "la créativité",
  "l'amour", "la séparation", "la parentalité", "le travail",
  "la liberté", "les limites", "l'intuition", "le courage",
  "la honte", "la joie", "la spiritualité", "le silence",
  "la guérison", "l'attachement", "la vulnérabilité", "la présence",
  "la mémoire", "le changement", "l'acceptation", "la curiosité",
  "les croyances héritées", "le corps émotionnel", "l'empathie", "la trahison",
  "le vide et le plein", "la patience", "l'échec", "la reconnaissance",
  "les rêves", "la communauté", "le sens", "la mort",
  "la renaissance", "l'enfance", "ce qu'on n'a pas dit", "ce qui reste",
];

// Prompts par type — utilisés par l'API
export const PROMPTS = {
  "saviez-vous": (theme, chapitre) => `Tu écris une page du livre "Ce que l'aube sait", chapitre "${chapitre}". Le thème de cette semaine est "${theme}".

Écris un "Le saviez-vous" — une entrée sur un concept de psychologie, neuroscience ou bien-être en lien avec ce thème. Pas de tiret, pas de liste, pas de mise en forme. De la prose uniquement. Entre 120 et 180 mots. Commence directement par le contenu, pas par un titre. Finit par une question courte — pas rhétorique, vraie. Style sobre, dense, sans formule générique. Jamais de "il est important de" ou "nous avons tous". Une voix qui sait.`,

  "corps-cerveau": (theme, chapitre) => `Tu écris une page du livre "Ce que l'aube sait", chapitre "${chapitre}". Le thème est "${theme}".

Écris une entrée "Corps & cerveau" — un fait scientifique sur le corps ou le cerveau en lien avec ce thème. Commence par le fait lui-même, formulé de façon frappante. Puis développe en 80-100 mots ce que ça change concrètement dans une vie. Pas de liste, pas de tiret. Prose uniquement. Une seule idée, bien tenue.`,

  "conte": (theme, chapitre) => `Tu écris une page du livre "Ce que l'aube sait", chapitre "${chapitre}". Le thème est "${theme}".

Écris un conte court — entre 150 et 200 mots. Une histoire inventée, avec un personnage, un lieu, une situation. Une vérité cachée dedans sur le thème, mais jamais explicitée. Pas de morale à la fin. Pas de "la morale de cette histoire". Juste l'histoire — et ce qu'elle laisse. Style sobre, universel. Ni folklorique forcé, ni moderne forcé. Intemporel.`,

  "pratique": (theme, chapitre) => `Tu écris une page du livre "Ce que l'aube sait", chapitre "${chapitre}". Le thème est "${theme}".

Écris une "Pratique oubliée" — une tradition, un rituel ou une pratique ancienne peu connue, en lien avec le thème. Pas d'exotisme forcé. Explique ce que c'était, pourquoi ça existait, ce qu'on peut en garder aujourd'hui. Entre 120 et 160 mots. Prose uniquement. Pas de liste. Une invitation concrète à la fin — une phrase, pas un paragraphe.`,

  "phrase": (theme, chapitre) => `Tu écris une page du livre "Ce que l'aube sait", chapitre "${chapitre}". Le thème est "${theme}".

Écris une "Phrase et son silence". D'abord une citation — courte, vraie, pas forcément célèbre. Elle peut être de quelqu'un de connu ou inventée dans l'esprit d'une tradition. Puis 60-80 mots qui la laissent résonner — pas une explication, un espace. Ce qu'elle ouvre. Ce qu'elle ne dit pas. Finit abruptement, sans conclusion.`,
};
