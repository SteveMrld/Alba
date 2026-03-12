import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useAutoAnimate } from "@formkit/auto-animate/react";

// ─── TYPED PHRASE — Apparition lettre par lettre ─────────────────────────────
const TypedPhrase = ({ text, style = {}, speed = 22, className = "" }) => {
  const [displayed, setDisplayed] = React.useState("");
  const [done, setDone] = React.useState(false);
  const prevText = React.useRef("");

  React.useEffect(() => {
    if (!text) { setDisplayed(""); setDone(false); return; }
    if (text === prevText.current) return; // même texte, pas de re-type
    prevText.current = text;
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className={className} style={{ ...style }}>
      {displayed}
      {!done && (
        <span style={{
          display: "inline-block", width: "1px", height: "1em",
          background: style.color || "#C8A96E",
          marginLeft: "1px", verticalAlign: "text-bottom",
          animation: "albaCursorBlink 0.7s step-end infinite",
        }} />
      )}
    </span>
  );
};

// ─── ÉCLATS D'AUBE — Système de progression ───────────────────────────────────
// Chaque acte dans l'app génère des éclats. Silencieux. Mystérieux.
// L'utilisateur ne voit jamais le total exact — juste que le chemin avance.
const ECLATS_PAR_ACTE = {
  rituel_matin:      3,  // Rituel du matin accompli
  fragment:          2,  // Fragment posé dans l'Ardoise
  miroir:            4,  // Miroir utilisé
  souffle:           3,  // Exercice de souffle
  bilan:             5,  // Bilan crépuscule rempli
  tempete_nommee:    4,  // Tempête nommée dans la Boîte
  tempete_traversee: 8,  // Tempête marquée comme traversée
  jour_actif:        2,  // Chaque nouveau jour de présence
};

// Seuils d'éclats pour ouvrir chaque Porte (Clé II → VI)
// Clé I est toujours ouverte — le premier pas ne se mérite pas, il se fait.
const SEUILS_PORTES = [0, 15, 35, 65, 100, 150];

// Symboles des 6 Clés — la mythologie d'ALBA
const PICTOS_INLINE = {
  1: `<path d="M24 9c-3.8 3.2-5.8 6.6-5.8 10.1 0 4.4 2.6 7.2 5.8 8.5 3.2-1.3 5.8-4.1 5.8-8.5C29.8 15.6 27.8 12.2 24 9Z"/><path d="M24 28v6"/><path d="M19.5 38h9"/>`,
  2: `<path d="M24 38V24"/><path d="M24 24c0-5.5 3.5-9 8.5-10.5"/><path d="M24 28c-3.2 0-6 2.5-7 6"/><path d="M24 20c-2.2-3.8-6.2-5.8-10-6.5"/><path d="M32.5 13.5c1.3.8 1.7 2.5.9 3.8-.8 1.3-2.5 1.7-3.8.9"/><path d="M17 34.2c1.4-.5 2.9.2 3.4 1.6.5 1.4-.2 2.9-1.6 3.4"/><path d="M14 13.5c1.5 0 2.7 1.2 2.7 2.7S15.5 19 14 19"/>`,
  3: `<path d="M10 28c4.2-3.5 8.8-5.2 14-5.2S33.8 24.5 38 28"/><path d="M14 33c3-2.3 6.4-3.4 10-3.4S31 30.7 34 33"/><path d="M19 38c1.5-.9 3.2-1.4 5-1.4s3.5.5 5 1.4"/>`,
  4: `<path d="M24 12c4.2 2.8 7 6.2 7 10.4 0 6.2-5 11.6-11 13.6-2.2-2.4-3.4-5-3.4-7.7 0-4.8 3.3-7.8 7.4-8.9"/><path d="M27 14c-1.4 3.1-3.9 5.6-7.6 7.5"/>`,
  5: `<path d="M14 18c0 9.5 4.4 16 10 16s10-6.5 10-16"/><path d="M14 18c2.4 2.2 5.7 3.4 10 3.4s7.6-1.2 10-3.4"/><path d="M16.5 16c1.4-2 4-3 7.5-3s6.1 1 7.5 3"/>`,
  6: `<path d="M24 12v8"/><path d="M24 28v8"/><path d="M12 24h8"/><path d="M28 24h8"/><path d="M17 17l5 5"/><path d="M31 31l-5-5"/><path d="M31 17l-5 5"/><path d="M17 31l5-5"/><circle cx="24" cy="24" r="2.5"/>`,
  7: `<circle cx="18" cy="30" r="1.8"/><path d="M20.8 28.8c2.8-1.8 5.2-4.3 7-7.5"/><path d="M27.8 21.3c.8-1.4 1.5-3 2.1-4.8"/><path d="M28.8 14.5c1.6 1.2 3 2.9 3.8 4.9"/><path d="M32.6 19.4c.5 1.3.8 2.7.8 4.2"/><path d="M30.2 14.5c-1 2.6-2.4 5.1-4.2 7.2"/>`,
  8: `<circle cx="18" cy="24" r="6.5"/><circle cx="30" cy="24" r="6.5"/>`,
  9: `<circle cx="24" cy="24" r="13"/><path d="M24 15l7 9-7 9-7-9 7-9Z"/>`,
  10: `<path d="M16 28c1.5 4.8 5.6 8 10.4 8 5.1 0 9.4-3.6 10.6-8.8"/><path d="M32 13c-1.2 3.8-4.4 6.4-8 7.6"/><path d="M18.5 18.5C20 13.9 24 11 28.3 11c1.5 0 3 .4 4.3 1"/><path d="M18 18l6 2-2 6"/>`,
  11: `<circle cx="24" cy="24" r="12"/><path d="M24 18v12"/><path d="M18 24h12"/>`,
  12: `<circle cx="24" cy="24" r="3.2"/><path d="M24 11v5"/><path d="M24 32v5"/><path d="M11 24h5"/><path d="M32 24h5"/><path d="M15.5 15.5l3.5 3.5"/><path d="M29 29l3.5 3.5"/><path d="M32.5 15.5L29 19"/><path d="M19 29l-3.5 3.5"/>`,
};

// Composant picto inline — rendu SVG garanti, couleur dynamique
const PortePicto = ({ index, couleur, size = 44 }) => {
  const paths = PICTOS_INLINE[index] || PICTOS_INLINE[1];
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none"
      stroke={couleur} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: paths }}
    />
  );
};

// ─── GRAVURES & CALLIGRAPHIE ──────────────────────────────────────────────────
const GRAVURES_PORTES = [
  null,
  // I — Reconnaître — 見 — bougie allumée
  { kanji: "見", langue: "ja", gravure: `<line x1="24" y1="36" x2="24" y2="22" stroke-width="1"/><rect x="20" y="36" width="8" height="4" rx="1" stroke-width="0.8" fill="none"/><path d="M24 20 Q21 15 24 11 Q27 15 24 20" stroke-width="0.9" fill="none"/><path d="M22 13 Q24 9 26 13" stroke-width="0.7" fill="none"/>` },
  // II — Comprendre — ف — livre ouvert
  { kanji: "ف", langue: "ar", gravure: `<path d="M24 10 L13 14 L13 38 L24 42 L35 38 L35 14 Z" stroke-width="0.9" fill="none"/><line x1="24" y1="10" x2="24" y2="42" stroke-width="0.8"/><line x1="15" y1="18" x2="22" y2="18" stroke-width="0.6"/><line x1="15" y1="22" x2="22" y2="22" stroke-width="0.6"/><line x1="15" y1="26" x2="22" y2="26" stroke-width="0.6"/><line x1="26" y1="18" x2="33" y2="18" stroke-width="0.6"/><line x1="26" y1="22" x2="33" y2="22" stroke-width="0.6"/>` },
  // III — Ressentir — 感 — cœur simple
  { kanji: "感", langue: "ja", gravure: `<path d="M24 37 Q10 26 10 19 Q10 12 17 12 Q21 12 24 17 Q27 12 31 12 Q38 12 38 19 Q38 26 24 37Z" stroke-width="0.9" fill="none"/>` },
  // IV — Lâcher — ن — oiseau qui s'envole
  { kanji: "ن", langue: "ar", gravure: `<path d="M24 38 L24 22" stroke-width="0.9"/><path d="M24 22 Q18 16 12 18" stroke-width="0.9" fill="none"/><path d="M24 22 Q30 16 36 18" stroke-width="0.9" fill="none"/><path d="M24 22 Q19 20 16 22" stroke-width="0.6" fill="none"/><path d="M24 22 Q29 20 32 22" stroke-width="0.6" fill="none"/><path d="M20 42 Q24 46 28 42" stroke-width="0.6" fill="none"/>` },
  // V — Recevoir — 受 — coupe / calice
  { kanji: "受", langue: "ja", gravure: `<path d="M14 16 Q14 28 24 32 Q34 28 34 16" stroke-width="0.9" fill="none"/><line x1="14" y1="16" x2="34" y2="16" stroke-width="0.8"/><line x1="24" y1="32" x2="24" y2="40" stroke-width="0.8"/><line x1="18" y1="40" x2="30" y2="40" stroke-width="0.8"/><path d="M18 10 Q24 6 30 10" stroke-width="0.6" fill="none"/>` },
  // VI — Devenir — ك — chrysalide qui s'ouvre
  { kanji: "ك", langue: "ar", gravure: `<ellipse cx="24" cy="26" rx="7" ry="11" stroke-width="0.9" fill="none"/><path d="M17 18 Q10 14 12 8 Q18 4 24 10" stroke-width="0.7" fill="none"/><path d="M31 18 Q38 14 36 8 Q30 4 24 10" stroke-width="0.7" fill="none"/><line x1="24" y1="8" x2="24" y2="4" stroke-width="0.7"/>` },
  // VII — Créer — 創 — plume / roseau
  { kanji: "創", langue: "ja", gravure: `<path d="M34 10 Q36 14 28 22 L16 40" stroke-width="0.9" fill="none"/><path d="M34 10 Q30 8 28 22 L16 40" stroke-width="0.9" fill="none"/><path d="M28 22 L22 20" stroke-width="0.6" fill="none"/><path d="M26 26 L20 24" stroke-width="0.6" fill="none"/><path d="M24 30 L18 28" stroke-width="0.6" fill="none"/>` },
  // VIII — Relier — و — deux arbres dont les racines se rejoignent
  { kanji: "و", langue: "ar", gravure: `<line x1="16" y1="8" x2="16" y2="24" stroke-width="0.9"/><line x1="32" y1="8" x2="32" y2="24" stroke-width="0.9"/><path d="M12 14 Q16 10 20 14" stroke-width="0.7" fill="none"/><path d="M28 14 Q32 10 36 14" stroke-width="0.7" fill="none"/><path d="M16 24 Q24 30 32 24" stroke-width="0.8" fill="none"/><path d="M16 28 Q24 36 32 28" stroke-width="0.6" fill="none"/>` },
  // IX — Protéger — 守 — main ouverte, doigts vers le haut
  { kanji: "守", langue: "ja", gravure: `<rect x="14" y="26" width="20" height="14" rx="3" stroke-width="0.9" fill="none"/><line x1="17" y1="26" x2="17" y2="14" stroke-width="0.9"/><line x1="21" y1="26" x2="21" y2="10" stroke-width="0.9"/><line x1="25" y1="26" x2="25" y2="10" stroke-width="0.9"/><line x1="29" y1="26" x2="29" y2="14" stroke-width="0.9"/><path d="M17 14 Q15 10 17 8 Q19 10 17 14" stroke-width="0.6" fill="none"/>` },
  // X — Transmettre — ب — deux bougies, une allume l'autre
  { kanji: "ب", langue: "ar", gravure: `<line x1="16" y1="38" x2="16" y2="24" stroke-width="0.9"/><rect x="13" y="38" width="6" height="3" rx="1" stroke-width="0.7" fill="none"/><path d="M16 22 Q14 18 16 14 Q18 18 16 22" stroke-width="0.8" fill="none"/><line x1="32" y1="38" x2="32" y2="24" stroke-width="0.9"/><rect x="29" y="38" width="6" height="3" rx="1" stroke-width="0.7" fill="none"/><path d="M32 22 Q30 18 32 14 Q34 18 32 22" stroke-width="0.8" fill="none"/><path d="M18 16 Q24 20 30 16" stroke-width="0.6" fill="none" stroke-dasharray="1.5,1.5"/>` },
  // XI — Habiter — 住 — maison simple avec seuil
  { kanji: "住", langue: "ja", gravure: `<path d="M24 8 L10 20 L14 20 L14 38 L34 38 L34 20 L38 20 Z" stroke-width="0.9" fill="none"/><rect x="20" y="28" width="8" height="10" rx="1" stroke-width="0.7" fill="none"/><line x1="10" y1="42" x2="38" y2="42" stroke-width="0.7"/>` },
  // XII — Être — ق — arbre seul, racines et branches
  { kanji: "ق", langue: "ar", gravure: `<line x1="24" y1="10" x2="24" y2="38" stroke-width="0.9"/><path d="M14 22 Q24 16 34 22" stroke-width="0.8" fill="none"/><path d="M16 28 Q24 22 32 28" stroke-width="0.7" fill="none"/><path d="M19 33 Q24 29 29 33" stroke-width="0.6" fill="none"/><path d="M18 38 Q24 42 30 38" stroke-width="0.7" fill="none"/><path d="M20 42 Q24 46 28 42" stroke-width="0.6" fill="none"/>` },
];

const GravurePorte = ({ index, couleur, size = 120 }) => {
  const g = GRAVURES_PORTES[index];
  if (!g) return null;
  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      {/* Calligraphie en filigrane */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.72,
        lineHeight: 1,
        color: `${couleur}12`,
        fontFamily: g.langue === "ar" ? "'Noto Naskh Arabic', serif" : "'Noto Serif JP', serif",
        pointerEvents: "none",
        userSelect: "none",
        direction: g.langue === "ar" ? "rtl" : "ltr",
      }}>
        {g.kanji}
      </div>
      {/* Gravure SVG */}
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none"
        stroke={couleur} strokeLinecap="round" strokeLinejoin="round"
        style={{ position: "relative", zIndex: 1, opacity: 0.85 }}
        dangerouslySetInnerHTML={{ __html: g.gravure }}
      />
    </div>
  );
};

const SYMBOLES_CLES = [
  { emoji: "🪔", nom: "une lampe",          phrase: "Tu as commencé à regarder ce qui est là." },
  { emoji: "🌿", nom: "une feuille vivante", phrase: "Quelque chose en toi a commencé à comprendre." },
  { emoji: "🌊", nom: "une vague",           phrase: "Tu as accepté de ressentir ce que tu portais." },
  { emoji: "🍂", nom: "une feuille qui tombe", phrase: "Tu as posé quelque chose que tu n'avais pas à porter seul." },
  { emoji: "🌑", nom: "un bol ouvert",       phrase: "Tu t'es permis de recevoir." },
  { emoji: "✦",  nom: "une étoile",          phrase: "Tu deviens qui tu es quand tu n'as plus rien à prouver." },
];

// Couleurs de lumière selon l'heure — la Porte s'illumine différemment la nuit et le jour
const getLumierePorte = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 8)   return { primary: "#F5C77E", secondary: "#FFE8C4", name: "aube" };    // Aube
  if (h >= 8 && h < 17)  return { primary: "#E8D5B0", secondary: "#FFF8ED", name: "jour" };    // Jour
  if (h >= 17 && h < 20) return { primary: "#E8B89A", secondary: "#FFD4B8", name: "crépuscule" }; // Crépuscule
  return { primary: "#C8A96E", secondary: "#2A2010", name: "nuit" };                            // Nuit
};

// ─── LETTRES DES PORTES — Écrites une fois, pour toujours ────────────────────
// Ces lettres seront remplacées par les vraies textes de Steve.
// Elles arrivent quelques heures après que la Porte s'est ouverte.
const LETTRES_PORTES = [
  {
    cle: "I — Reconnaître",
    titre: "Tu as osé regarder",
    corps: `Il y a quelque chose de courageux dans ce que tu viens de faire.

Pas courageux au sens héroïque du mot. Courageux au sens où la plupart des gens ne le font pas — regarder vraiment ce qui est là, sans détourner les yeux, sans minimiser, sans se dire que ça pourrait être pire.

Tu as commencé.

C'est la chose la plus difficile et la plus rare : commencer. Non pas dans le grand sens des commencements — mais dans ce geste minuscule et immense de dire : je suis là, et quelque chose en moi mérite qu'on s'en occupe.

ALBA te voit.

Elle ne juge pas ce qu'elle voit. Elle tient juste la lumière pendant que tu regardes.

Le chemin continue.`,
  },
  {
    cle: "II — Comprendre",
    titre: "Ce qui se répète essaie de te parler",
    corps: `Les patterns ne sont pas des prisons.

Ce sont des messages que tu n'as pas encore eu les outils pour décoder. Et maintenant, quelque chose en toi commence à les lire différemment — non plus avec la douleur de celui qui les subit, mais avec la curiosité de celui qui comprend.

Comprendre ne guérit pas instantanément. Mais comprendre change la façon dont on porte les choses.

Tu portes moins bêtement, maintenant.

Il y a une intelligence en toi qui travaille depuis longtemps dans l'ombre. Elle t'a conduit jusqu'ici. Fais-lui confiance.

Le chemin continue.`,
  },
  {
    cle: "III — Ressentir",
    titre: "Le corps savait",
    corps: `Il t'attendait.

Tout ce que tu as mis de côté, repoussé, anesthésié — il le gardait pour toi. Sans colère. Avec une patience infinie.

Ressentir fait peur parce qu'on croit que si on laisse entrer la vague, elle va tout emporter. Mais la vague ne détruit pas ceux qui la laissent passer. Elle emporte seulement ce qui n'avait plus besoin de rester.

Tu as osé t'asseoir avec ce que tu évitais.

C'est un acte d'amour envers toi-même — peut-être le premier d'une longue série.

Le chemin continue.`,
  },
  {
    cle: "IV — Lâcher",
    titre: "Ce n'était pas à toi de porter ça",
    corps: `Il y a des poids qu'on prend si tôt, si naturellement, qu'on finit par croire qu'ils font partie de nous.

Ils n'en font pas partie.

Tu as posé quelque chose aujourd'hui. Peut-être sans t'en rendre compte. Peut-être avec beaucoup de conscience. Mais tu l'as posé.

Lâcher n'est pas abandonner. Lâcher, c'est reconnaître que tu n'as jamais eu à porter ça seul — et que tu n'as plus à le faire.

Tes mains sont plus libres maintenant.

Remarque ce que ça fait.

Le chemin continue.`,
  },
  {
    cle: "V — Recevoir",
    titre: "Tu mérites ce que tu donnes aux autres",
    corps: `C'est souvent là que ça coince.

Donner, tu sais faire. Tu l'as appris tôt. Parfois trop tôt. Parfois parce que c'était la seule façon d'avoir une place.

Mais recevoir — vraiment recevoir, sans minimiser, sans rembourser immédiatement, sans trouver que tu ne le mérites pas assez — c'est autre chose.

Tu commences à t'y autoriser.

Pas parfaitement. Pas sans résistance. Mais quelque chose en toi s'est ouvert comme une porte qu'on pousse depuis l'intérieur.

La joie, le repos, l'amour — ils n'ont pas besoin d'être mérités. Ils ont besoin d'être accueillis.

Le chemin continue.`,
  },
  {
    cle: "VI — Devenir",
    titre: "Qui tu es quand tu n'as plus rien à prouver",
    corps: `Tu es arrivé jusqu'ici.

Pas en ligne droite. Pas sans tomber. Pas sans vouloir parfois rebrousser chemin. Mais tu es là.

Ce que tu es devenu n'est pas une version finale. Il n'y en a pas. Mais c'est une version plus vraie — dégagée de ce qui n'était pas à toi, réconciliée avec ce qui l'était.

ALBA ne te dit pas que tu es arrivé. Elle te dit que tu avances, et que tu sais maintenant pourquoi.

Porte cette clarté avec toi.

Elle appartient au chemin que tu as fait — et à personne d'autre.

L'aube est en toi.`,
  },
];


// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
// Sur Vercel : ajouter dans .env.local
//   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
//   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
const SUPABASE_URL  = "https://yuwqokjkpooozgtsvfkc.supabase.co";
const SUPABASE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1d3Fva2prcG9vb3pndHN2ZmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5Njk4MjIsImV4cCI6MjA4ODU0NTgyMn0.5IHYvE6lnwl-PTAhcpT9c2lkhlxSu6w9rGksfCEfCPc";
const SB_ENABLED = true;

// ─── AUTH SUPABASE — Magic Link ───────────────────────────────────────────────
// Token de session stocké en mémoire + localStorage
let _authToken = null;
let _authUser  = null;

const sbAuth = {
  // Magic link (OTP)
  async sendMagicLink(email) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, create_user: true }),
    });
    return r.ok;
  },

  signInWithGoogle() {
    const redirectTo = encodeURIComponent(window.location.origin);
    window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${redirectTo}`;
  },

  // Inscription
  async signUp(email, password) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await r.json();
    if (data.access_token) {
      _authToken = data.access_token;
      _authUser  = data.user;
      try {
        localStorage.setItem("alba_auth_token", data.access_token);
        localStorage.setItem("alba_auth_user",  JSON.stringify(data.user));
      } catch {}
      return { user: data.user, error: null };
    }
    return { user: null, error: data.msg || data.error_description || "Erreur lors de l'inscription." };
  },

  // Connexion
  async signIn(email, password) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await r.json();
    if (data.access_token) {
      _authToken = data.access_token;
      _authUser  = data.user;
      try {
        localStorage.setItem("alba_auth_token", data.access_token);
        localStorage.setItem("alba_auth_user",  JSON.stringify(data.user));
      } catch {}
      return { user: data.user, error: null };
    }
    return { user: null, error: "Email ou mot de passe incorrect." };
  },

  // Réinitialisation mot de passe
  async resetPassword(email) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return r.ok;
  },

  // Charger session depuis localStorage
  loadSession() {
    try {
      const t = localStorage.getItem("alba_auth_token");
      const u = localStorage.getItem("alba_auth_user");
      if (t && u) {
        _authToken = t;
        _authUser  = JSON.parse(u);
        return _authUser;
      }
    } catch {}
    return null;
  },

  // Déconnexion
  signOut() {
    _authToken = null;
    _authUser  = null;
    try {
      localStorage.removeItem("alba_auth_token");
      localStorage.removeItem("alba_auth_user");
    } catch {}
  },

  getUser()  { return _authUser; },
  getToken() { return _authToken; },
};

// Helper token — utilise le token auth si dispo, sinon anon key
const getAuthHeader = () => ({
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${_authToken || SUPABASE_KEY}`,
  "Content-Type": "application/json",
});

// Client Supabase léger (sans SDK — juste fetch)
const sb = {
  async get(table, match) {
    if (!SB_ENABLED) return null;
    const params = Object.entries(match).map(([k,v]) => `${k}=eq.${encodeURIComponent(v)}`).join("&");
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}&limit=1`, {
      headers: getAuthHeader(),
    });
    const data = await r.json();
    return Array.isArray(data) ? data[0] || null : null;
  },
  async upsert(table, row) {
    if (!SB_ENABLED) return null;
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { ...getAuthHeader(), Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(row),
    });
    return r.ok ? await r.json() : null;
  },
  async list(table, match) {
    if (!SB_ENABLED) return [];
    const params = Object.entries(match).map(([k,v]) => `${k}=eq.${encodeURIComponent(v)}`).join("&");
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}&order=created_at.asc`, {
      headers: getAuthHeader(),
    });
    return r.ok ? await r.json() : [];
  },
  async delete(table, match) {
    if (!SB_ENABLED) return;
    const params = Object.entries(match).map(([k,v]) => `${k}=eq.${encodeURIComponent(v)}`).join("&");
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });
  },
};

// UUID persistant local (bridge avant auth)
const getUserKey = () => {
  try {
    let k = localStorage.getItem("alba_user_key");
    if (!k) { k = crypto.randomUUID(); localStorage.setItem("alba_user_key", k); }
    return k;
  } catch { return "local-user"; }
};

// ─── HOOK PERSISTANCE ─────────────────────────────────────────────────────────
/*
  SQL à exécuter dans Supabase → SQL Editor :

  create table alba_profiles (
    id uuid primary key default gen_random_uuid(),
    user_key text unique not null,
    prenom text, naissance text, intention text,
    created_at timestamptz default now()
  );

  create table if not exists alba_fil (
    id text primary key,
    user_key text not null,
    texte text not null,
    type text not null default 'insight',
    created_at timestamptz default now()
  );
  create index if not exists idx_alba_fil_user on alba_fil(user_key);

  create table if not exists alba_lettres (
    id text primary key,
    user_key text not null,
    porte_index int not null,
    lue boolean default false,
    delivered_at timestamptz default now()
  );
  create index if not exists idx_alba_lettres_user on alba_lettres(user_key);

  create table alba_postits (
    id bigint primary key generated always as identity,
    user_key text not null,
    jour text not null,
    postit_id bigint not null,
    texte text, type text, heure text,
    created_at timestamptz default now(),
    unique(user_key, jour, postit_id)
  );

  create table alba_progress (
    id uuid primary key default gen_random_uuid(),
    user_key text unique not null,
    jours_actifs int default 1,
    postits_total int default 0,
    conversations_total int default 0,
    bilans_total int default 0,
    souffle_total int default 0,
    cle_active int default 0,
    updated_at timestamptz default now()
  );
*/

const useAlbaDB = () => {
  const userKey = useRef(getUserKey());
  const saveTimeout = useRef({});

  // ── Profil ──
  const saveProfile = useCallback(async (data) => {
    try {
      localStorage.setItem("alba_profile", JSON.stringify(data));
    } catch {}
    await sb.upsert("alba_profiles", {
      user_key: userKey.current,
      prenom: data.prenom,
      naissance: data.naissance,
      intention: data.intention,
      intention_secondaire: data.intentionSecondaire || "",
      sensibilite: data.sensibilite || "intuitif",
    });
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const local = localStorage.getItem("alba_profile");
      if (local) return JSON.parse(local);
    } catch {}
    const row = await sb.get("alba_profiles", { user_key: userKey.current });
    if (row) {
      const data = {
        prenom: row.prenom,
        naissance: row.naissance,
        intention: row.intention,
        intentionSecondaire: row.intention_secondaire || "",
        sensibilite: row.sensibilite || "intuitif",
      };
      try { localStorage.setItem("alba_profile", JSON.stringify(data)); } catch {}
      return data;
    }
    return null;
  }, []);

  // ── Post-its (avec debounce) ──
  const savePostits = useCallback(async (jour, postits) => {
    // localStorage
    try {
      const all = JSON.parse(localStorage.getItem("alba_postits") || "{}");
      all[jour] = postits;
      localStorage.setItem("alba_postits", JSON.stringify(all));
    } catch {}
    // Supabase : debounce 1s
    clearTimeout(saveTimeout.current[jour]);
    saveTimeout.current[jour] = setTimeout(async () => {
      if (!SB_ENABLED) return;
      // Supprimer les anciens du jour, réinsérer
      await sb.delete("alba_postits", { user_key: userKey.current, jour });
      for (const p of postits) {
        await sb.upsert("alba_postits", {
          user_key: userKey.current, jour,
          postit_id: p.id, texte: p.texte, type: p.type, heure: p.heure,
        });
      }
    }, 1000);
  }, []);

  const loadAllPostits = useCallback(async () => {
    // localStorage
    try {
      const local = localStorage.getItem("alba_postits");
      if (local) return JSON.parse(local);
    } catch {}
    // Supabase
    const rows = await sb.list("alba_postits", { user_key: userKey.current });
    if (rows.length > 0) {
      const byJour = {};
      for (const r of rows) {
        if (!byJour[r.jour]) byJour[r.jour] = [];
        byJour[r.jour].push({ id: r.postit_id, texte: r.texte, type: r.type, heure: r.heure });
      }
      try { localStorage.setItem("alba_postits", JSON.stringify(byJour)); } catch {}
      return byJour;
    }
    return {};
  }, []);

  // ── Progress ──
  const saveProgress = useCallback(async (stats, cleActive) => {
    try {
      localStorage.setItem("alba_progress", JSON.stringify({ stats, cleActive }));
    } catch {}
    await sb.upsert("alba_progress", {
      user_key: userKey.current,
      jours_actifs: stats.joursActifs,
      postits_total: stats.postitsTotal,
      conversations_total: stats.conversationsTotal,
      bilans_total: stats.bilansTotal,
      souffle_total: stats.souffleTotal,
      cle_active: cleActive,
    });
  }, []);

  const loadProgress = useCallback(async () => {
    try {
      const local = localStorage.getItem("alba_progress");
      if (local) return JSON.parse(local);
    } catch {}
    const row = await sb.get("alba_progress", { user_key: userKey.current });
    if (row) {
      return {
        stats: {
          joursActifs: row.jours_actifs,
          postitsTotal: row.postits_total,
          conversationsTotal: row.conversations_total,
          bilansTotal: row.bilans_total,
          souffleTotal: row.souffle_total,
        },
        cleActive: row.cle_active,
      };
    }
    return null;
  }, []);

  return { saveProfile, loadProfile, savePostits, loadAllPostits, saveProgress, loadProgress };
};

// ─── GOOGLE FONTS ────────────────────────────────────────────────────────────
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@200;300;400&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; background: #1A1714; }
    input, textarea { outline: none; }
    ::-webkit-scrollbar { width: 3px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #C8A96E44; border-radius: 2px; }
    @keyframes albaCursorBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
@keyframes albaRipple {
  from { transform: scale(0); opacity: 1; }
  to   { transform: scale(3.5); opacity: 0; }
}
@keyframes albaTapPulse {
  0%   { transform: scale(1); }
  40%  { transform: scale(0.93); }
  100% { transform: scale(1); }
}
@keyframes fadeUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; } to { opacity: 1; }
    }
    @keyframes pulse-ring {
      0%   { transform: scale(1);   opacity: 0.5; }
      100% { transform: scale(1.7); opacity: 0; }
    }
    @keyframes breath-expand {
      0%,100% { transform: scale(1);    opacity: 0.6; }
      50%      { transform: scale(1.35); opacity: 1; }
    }
    @keyframes float {
      0%,100% { transform: translateY(0px); }
      50%      { transform: translateY(-8px); }
    }
    @keyframes shimmer {
      0%   { background-position: -200% center; }
      100% { background-position:  200% center; }
    }
    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes grain {
      0%,100% { transform: translate(0,0); }
      10%     { transform: translate(-2%,-3%); }
      30%     { transform: translate(3%,2%); }
      50%     { transform: translate(-1%,4%); }
      70%     { transform: translate(2%,-2%); }
      90%     { transform: translate(-3%,1%); }
    }
    @keyframes alba-breathe {
      0%,100% { opacity: 0.055; transform: scale(1); }
      50%     { opacity: 0.09;  transform: scale(1.08); }
    }
  `}</style>
);

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const HEURE = new Date().getHours();
const T = {
  nuit:    "#1A1714",
  nuit2:   "#211E1A",
  or:      "#C8A96E",
  orPale:  "#F0E2BC",
  aube:    "#FAF6F0",
  brume:   "#D4CCC5",
  aurore:  "#E8B89A",
  aurore2: "#D4856A",
  fond:    "#141210",
  serif:   "'Cormorant Garamond', Georgia, serif",
  sans:    "'Jost', sans-serif",
};

// ─── NUMÉROLOGIE ─────────────────────────────────────────────────────────────
function reduire(n) {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split("").reduce((a, d) => a + parseInt(d), 0);
  }
  return n;
}
function cheminDeVie(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return reduire(reduire(d) + reduire(m) + reduire(y));
}
const CHEMINS = {
  1: { titre: "Le Pionnier",      essence: "Tu es venu(e) pour ouvrir, créer, initier. Là où les autres attendent, tu avances." },
  2: { titre: "Le Médiateur",     essence: "Tu portes le don de la sensibilité et de la paix. L'harmonie est ta mission profonde." },
  3: { titre: "Le Créateur",      essence: "Tu es expression, joie, transmission. Ta voix est un cadeau que le monde attend." },
  4: { titre: "Le Bâtisseur",     essence: "Tu construis ce qui dure. Fondations, structure, fiabilité — tu es la colonne vertébrale." },
  5: { titre: "Le Voyageur",      essence: "Tu es liberté et transformation. Le changement est ta maison, l'inconnu ton territoire." },
  6: { titre: "Le Guérisseur",    essence: "Tu portes en toi l'amour inconditionnel. Prendre soin des autres est ta respiration." },
  7: { titre: "Le Mystique",      essence: "Tu cherches la vérité derrière le voile. L'invisible est plus réel pour toi que le visible." },
  8: { titre: "L'Alchimiste",     essence: "Tu transformes tout ce que tu touches. Pouvoir, abondance, karma — tu es là pour maîtriser." },
  9: { titre: "Le Sage",          essence: "Tu es universel, compassionnel. Ta mission dépasse ta propre vie — tu guéris l'humanité." },
  11: { titre: "Le Messager",     essence: "Tu es canal entre les mondes. Une intuition extraordinaire habite chaque souffle." },
  22: { titre: "Le Maître Bâtisseur", essence: "Tu construis des ponts entre le rêve et le réel. Ton impact est collectif, historique." },
};

const BLESSURES = [
  { nom: "Abandon",     couleur: "#7B9EA8", question: "Quelqu'un t'a-t-il quitté avant que tu sois prêt(e) ?" },
  { nom: "Trahison",    couleur: "#A87B7B", question: "As-tu fait confiance à quelqu'un qui t'a blessé(e) ?" },
  { nom: "Humiliation", couleur: "#8A7BA8", question: "T'a-t-on déjà fait sentir petit(e) ou indigne ?" },
  { nom: "Injustice",   couleur: "#7BA88A", question: "As-tu eu le sentiment d'être traité(e) de manière injuste ?" },
  { nom: "Rejet",       couleur: "#A89E7B", question: "T'es-tu déjà senti(e) exclu(e) ou pas à ta place ?" },
  { nom: "Croissance",  couleur: "#C8A96E", question: "Qu'est-ce que tu veux cultiver en toi ?" },
  { nom: "Présence",    couleur: "#9EC8B4", question: "Comment veux-tu habiter ce moment ?" },
];

const BLESSURES_PAR_INTENTION = {
  "Une rupture, une séparation":       "Abandon",
  "Un deuil, une perte":               "Abandon",
  "Je me sens perdu(e)":               "Rejet",
  "Un épuisement profond":             "Humiliation",
  "Une trahison":                      "Trahison",
  "Une maladie, un diagnostic":        "Injustice",
  "Je cherche qui je suis":            "Rejet",
  "Je vais bien — je veux cultiver ça":"Croissance",
  "Je veux grandir, explorer":         "Croissance",
  "Je cherche un espace à moi":        "Présence",
  "Je veux apprendre à mieux me connaître": "Croissance",
};

const LIVRES = {
  "Abandon":     { titre: "Le Prophète",                auteur: "Khalil Gibran",       mot: "Sur la séparation" },
  "Trahison":    { titre: "Les Quatre Accords Toltèques",auteur: "Don Miguel Ruiz",    mot: "Sur la confiance" },
  "Humiliation": { titre: "Mille Soleils Splendides",   auteur: "Khaled Hosseini",     mot: "Sur la dignité" },
  "Injustice":   { titre: "La Force de l'âme",          auteur: "Nelson Mandela",      mot: "Sur la résistance" },
  "Rejet":       { titre: "Du chaos naît une étoile",   auteur: "Steve Moradel",       mot: "Sur le retour à soi" },
  "Croissance":  { titre: "L'Homme en quête de sens",   auteur: "Viktor Frankl",       mot: "Sur le sens" },
  "Présence":    { titre: "Le Pouvoir du moment présent",auteur: "Eckhart Tolle",      mot: "Sur l'instant" },
};

// ─── HELPER CENTRAL — contexte profil double intention ────────────────────────
// Source unique de vérité pour tous les composants et prompts IA
const getContextProfil = (data) => {
  if (!data) return { blessure: BLESSURES[0], blessure2: null, nomBlessure: "Abandon", nomBlessure2: null, hasTempete: true, hasCroissance: false, hasDual: false, texteContexte: "" };
  const intentionPrincipale   = data.intention           || "";
  const intentionSecondaire   = data.intentionSecondaire || "";

  const resoudreNomBlessure = (intention) =>
    BLESSURES_PAR_INTENTION[intention]
    || BLESSURES.find(b => intention.toLowerCase().includes(b.nom.toLowerCase()))?.nom
    || null;

  const nomBlessure1 = resoudreNomBlessure(intentionPrincipale);
  const nomBlessure2 = intentionSecondaire ? resoudreNomBlessure(intentionSecondaire) : null;

  // Utilise la première intention trouvée comme blessure principale
  const nomBlessureFinal = nomBlessure1 || nomBlessure2 || "Abandon";
  const blessure  = BLESSURES.find(b => b.nom === nomBlessureFinal) || BLESSURES[0];
  const blessure2 = nomBlessure2 && nomBlessure2 !== nomBlessureFinal
    ? BLESSURES.find(b => b.nom === nomBlessure2) || null
    : null;

  const NOMS_CROISSANCE = ["Croissance", "Présence"];
  const hasTempete   = blessure  && !NOMS_CROISSANCE.includes(blessure.nom);
  const hasCroissance = (blessure2 && NOMS_CROISSANCE.includes(blessure2.nom))
    || NOMS_CROISSANCE.includes(blessure.nom);
  const hasDual      = hasTempete && hasCroissance;

  // Texte synthétique pour les prompts IA
  let texteContexte;
  if (hasDual) {
    texteContexte = `${data.prenom} traverse à la fois ${intentionPrincipale.toLowerCase()} et cherche à grandir (${intentionSecondaire.toLowerCase()}). Blessure principale : ${blessure.nom}. Aussi en chemin de croissance.`;
  } else if (hasCroissance) {
    texteContexte = `${data.prenom} cherche à grandir et à se construire. Chemin : ${blessure.nom}.`;
  } else {
    texteContexte = `${data.prenom} traverse : ${intentionPrincipale}. Blessure principale : ${blessure.nom}.`;
  }

  return { blessure, blessure2, nomBlessure: nomBlessureFinal, nomBlessure2, hasTempete, hasCroissance, hasDual, texteContexte };
};

// Citations enrichies — dont les phrases adaptées de Steve
const CITATIONS = [
  // Universelles
  { texte: "Ta douleur est le bris de l'enveloppe qui enfermait ta compréhension.", auteur: "Khalil Gibran" },
  { texte: "L'aube ne promet rien. Elle se lève, simplement.", auteur: "ALBA" },
  { texte: "Guérir, ce n'est pas effacer. C'est intégrer.", auteur: "ALBA" },
  { texte: "Tu n'as pas à mériter la lumière. Tu en es fait.", auteur: "Steve Moradel" },
  { texte: "Rien de vivant ne renaît sous la pression.", auteur: "ALBA" },
  // Adaptées — sur la traversée
  { texte: "Ce que tu ressens aujourd'hui n'est pas une décision. C'est une émotion. Et une émotion passe.", auteur: "ALBA" },
  { texte: "Ta valeur ne dépend pas de la capacité de l'autre à la voir.", auteur: "ALBA" },
  { texte: "La réparation la plus solide est celle que l'on construit sans attendre qu'on nous rende justice.", auteur: "ALBA" },
  { texte: "On ne peut pas vouloir la vie de quelqu'un à sa place.", auteur: "ALBA" },
  { texte: "L'absence de reconnaissance ne change pas la vérité de ce que tu as donné.", auteur: "ALBA" },
  // Sur l'amour et la séparation
  { texte: "Certaines séparations ne sont pas des ruptures d'amour — ce sont des tentatives de survie.", auteur: "ALBA" },
  { texte: "Le lien peut rester vivant même quand la forme qui le portait est morte.", auteur: "ALBA" },
  { texte: "L'amour peut revenir, mais seulement quand il cesse d'être attendu comme une réparation.", auteur: "ALBA" },
  { texte: "Ce que tu prends pour de l'indifférence est souvent une émotion qui a été enfermée.", auteur: "ALBA" },
  // Sur la liberté intérieure
  { texte: "Je n'ai plus besoin de savoir pour être juste.", auteur: "ALBA" },
  { texte: "Je ne ferme aucune porte. Mais je n'attends plus derrière aucune.", auteur: "ALBA" },
  { texte: "J'aime encore, mais je n'attends plus. Et c'est ce qui me rend libre.", auteur: "ALBA" },
  { texte: "Tu avances maintenant sans te renier.", auteur: "ALBA" },
  // Sur la croissance
  { texte: "Ce silence en toi n'est pas du vide. C'est de l'espace.", auteur: "ALBA" },
  { texte: "Ce que tu cherches, tu le portes déjà.", auteur: "ALBA" },
  { texte: "Il n'y a rien à réparer. Il y a juste à être.", auteur: "ALBA" },
];

const CLES = [
  { num: "I",   nom: "Reconnaître", desc: "Nommer ce qui fait mal, sans le minimiser ni s'y noyer.", couleur: "#7B9EA8" },
  { num: "II",  nom: "Comprendre",  desc: "Voir le pattern qui se répète et le reconnaître pour ce qu'il est.", couleur: "#A87B7B" },
  { num: "III", nom: "Ressentir",   desc: "S'asseoir avec ce qu'on évite. Le corps sait. Il attendait.", couleur: "#8A7BA8" },
  { num: "IV",  nom: "Lâcher",      desc: "Poser ce qu'on porte pour les autres. Les dettes qu'on n'a pas contractées.", couleur: "#7BA88A" },
  { num: "V",   nom: "Recevoir",    desc: "Accueillir la joie, l'amour, le repos — sans chercher à le mériter.", couleur: "#A89E7B" },
  { num: "VI",  nom: "Devenir",     desc: "Qui tu es quand tu n'as plus rien à prouver.", couleur: T.or },
];

// ─── PHRASES DU MATIN ────────────────────────────────────────────────────────
// 30 phrases — une par jour (cyclique), selon la clé active
const PHRASES_MATIN = {
  default: [
    "Quelque chose en toi sait déjà.",
    "Aujourd'hui, tu n'as rien à prouver.",
    "Ce que tu traverses te traverse pour une raison.",
    "Tu as survécu à tout ce que tu pensais ne pas pouvoir surmonter.",
    "La douceur n'est pas une faiblesse. C'est une forme de courage.",
    "Ce matin existe. C'est suffisant.",
    "Il y a une lumière en toi que personne ne peut éteindre.",
    "Tu peux commencer là où tu es.",
    "Quelque chose commence doucement.",
    "Ce que tu ressens est réel. Et ça passera aussi.",
    "Aujourd'hui, laisse entrer ce qui veut entrer.",
    "Il n'y a rien à réparer. Il y a juste à être.",
    "Tu mérites la même douceur que tu donnes aux autres.",
    "Ce silence en toi n'est pas du vide. C'est de l'espace.",
    "Respire. Tu es encore là.",
    "Ce que tu portes a un poids. Pose-le un instant.",
    "Rien ne t'oblige à aller vite.",
    "Ton histoire n'est pas terminée.",
    "Ce matin est une page blanche. Pas une obligation.",
    "Il est permis de ne pas savoir.",
    "La nuit a fait son travail. Le jour commence.",
    "Ce que tu crois impossible a déjà commencé à changer.",
    "Tu n'as pas besoin de tout comprendre aujourd'hui.",
    "Quelque chose de doux t'attend dans cette journée.",
    "Ta présence suffit.",
    "Ce matin, accorde-toi une seule chose : être.",
    "Tout ne doit pas être résolu. Certaines choses demandent juste du temps.",
    "Tu es en train de traverser quelque chose. Pas de t'y noyer.",
    "L'aube revient toujours.",
    "Ce que tu cherches, tu le portes déjà.",
  ],
  // Variantes selon la clé active
  cle: {
    0: "Aujourd'hui, regarde ce qui est là — sans chercher à le changer.",        // Reconnaître
    1: "Derrière chaque répétition, il y a une leçon qui attend d'être vue.",     // Comprendre
    2: "Ce que tu évites de ressentir prend de la place. Laisse-le exister.",     // Ressentir
    3: "Qu'est-ce que tu portes pour quelqu'un d'autre depuis trop longtemps ?",  // Lâcher
    4: "Tu as le droit de recevoir. Sans mérite, sans raison.",                   // Recevoir
    5: "Qui es-tu quand tu n'as plus rien à prouver ?",                          // Devenir
  },
};

const getPhraseduJour = (cleActive = 0) => {
  const jour = new Date().getDay(); // 0–6
  // 1 fois sur 4 : phrase liée à la clé. Les autres fois : phrase du pool
  if (jour % 4 === 0) return PHRASES_MATIN.cle[cleActive] || PHRASES_MATIN.default[0];
  const idx = (new Date().getDate() + cleActive) % PHRASES_MATIN.default.length;
  return PHRASES_MATIN.default[idx];
};

// ─── RECOMMANDATIONS ─────────────────────────────────────────────────────────

// ─── QUESTIONS DU CRÉPUSCULE ─────────────────────────────────────────────────
const QUESTIONS_CREPUSCULE = [
  "Qu'as-tu traversé aujourd'hui ?",
  "Qu'est-ce que cette journée t'a appris ?",
  "Quel moment aurait mérité plus d'attention ?",
  "Qu'as-tu laissé derrière toi aujourd'hui ?",
  "Quelle émotion a dominé cette journée ?",
  "Qu'est-ce que tu ne veux pas emporter dans la nuit ?",
  "Si cette journée avait un mot, lequel serait-il ?",
  "Qu'as-tu donné aujourd'hui ? Qu'as-tu reçu ?",
  "Qu'est-ce qui t'a pesé ? Qu'est-ce qui t'a soulagé ?",
  "À quoi ressemblait ton silence aujourd'hui ?",
];

const getQuestionCrepuscule = () => {
  const idx = new Date().getDate() % QUESTIONS_CREPUSCULE.length;
  return QUESTIONS_CREPUSCULE[idx];
};

// ─── GRAIN OVERLAY ────────────────────────────────────────────────────────────
const Grain = () => (
  <div style={{
    position: "fixed", inset: 0, pointerEvents: "none", zIndex: 999,
    opacity: 0.045,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
    animation: "grain 8s steps(10) infinite",
  }} />
);

// ─── HORIZON GLOW ─────────────────────────────────────────────────────────────
const Horizon = () => (
  <>
    {/* Souffle vivant — pulse toutes les 12s, quasi imperceptible */}
    <div style={{
      position: "fixed", top: "50%", left: "50%",
      transform: "translate(-50%, -50%)",
      width: "70vw", height: "70vw", maxWidth: 500, maxHeight: 500,
      borderRadius: "50%", pointerEvents: "none", zIndex: 0,
      background: `radial-gradient(circle, ${T.or}22 0%, transparent 70%)`,
      animation: "alba-breathe 12s ease-in-out infinite",
    }} />
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, height: "40vh", pointerEvents: "none", zIndex: 0,
      background: `radial-gradient(ellipse 90% 60% at 50% 100%, ${T.or}18 0%, transparent 70%)`,
    }} />
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, height: "30vh", pointerEvents: "none", zIndex: 0,
      background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${T.aurore}08 0%, transparent 70%)`,
    }} />
  </>
);

// ─── BOUTON ────────────────────────────────────────────────────────────────────
const Btn = ({ children, onClick, secondary, small }) => {
  const [hov, setHov] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [ripple, setRipple] = useState(null);

  const handlePress = (e) => {
    setPressed(true);
    if (!secondary) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left;
      const y = (e.touches?.[0]?.clientY ?? e.clientY) - rect.top;
      setRipple({ x, y, id: Date.now() });
      setTimeout(() => setRipple(null), 550);
    }
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setPressed(false); }}
      onMouseDown={handlePress}
      onMouseUp={() => setPressed(false)}
      onTouchStart={handlePress}
      onTouchEnd={() => setPressed(false)}
      style={{
        position: "relative", overflow: "hidden",
        background: secondary ? "transparent" : hov ? T.orPale : T.or,
        color: secondary ? (hov ? T.orPale : T.brume) : T.nuit,
        border: secondary ? `1px solid ${T.brume}44` : "none",
        fontFamily: T.sans, fontWeight: 300,
        fontSize: small ? "0.7rem" : "0.72rem",
        letterSpacing: "0.35em", textTransform: "uppercase",
        padding: small ? "0.55rem 1.4rem" : "0.85rem 2.4rem",
        borderRadius: "1px", cursor: "pointer",
        transition: "all 0.25s ease, transform 0.12s ease",
        display: "inline-flex", alignItems: "center", gap: "0.6rem",
        transform: pressed ? "scale(0.95)" : "scale(1)",
        WebkitTapHighlightColor: "transparent",
      }}>
      {ripple && (
        <span key={ripple.id} style={{
          position: "absolute",
          left: ripple.x - 60, top: ripple.y - 60,
          width: 120, height: 120, borderRadius: "50%",
          background: `${T.nuit}22`,
          animation: "albaRipple 0.55s ease-out forwards",
          pointerEvents: "none",
        }} />
      )}
      {children}
    </button>
  );
};

// ─── ORNEMENT ─────────────────────────────────────────────────────────────────
const Ornement = ({ style }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", ...style }}>
    <div style={{ height: 1, width: 50, background: `linear-gradient(to right, transparent, ${T.or}66)` }} />
    <div style={{ width: 4, height: 4, background: T.or, transform: "rotate(45deg)", opacity: 0.7 }} />
    <div style={{ width: 3, height: 3, background: T.or, transform: "rotate(45deg)", opacity: 0.35 }} />
    <div style={{ width: 4, height: 4, background: T.or, transform: "rotate(45deg)", opacity: 0.7 }} />
    <div style={{ height: 1, width: 50, background: `linear-gradient(to left, transparent, ${T.or}66)` }} />
  </div>
);

// ─── SCREEN WRAPPER ────────────────────────────────────────────────────────────
const Screen = ({ children, centered, style }) => (
  <div style={{
    minHeight: "100vh", width: "100%", position: "relative", zIndex: 2,
    display: "flex", flexDirection: "column",
    alignItems: centered ? "center" : undefined,
    justifyContent: centered ? "center" : undefined,
    padding: "6vh 1.5rem 8vh",
    ...style,
  }}>
    {children}
  </div>
);

// ─── PAYWALL — Abonnement 9€/mois ────────────────────────────────────────────
const PaywallScreen = ({ onClose, userKey, userEmail, onPremiumActivated }) => {
  const [mode, setMode]           = useState("plans"); // plans | gift_buy | gift_redeem
  const [plan, setPlan]           = useState("monthly"); // monthly | annual
  const [loading, setLoading]     = useState(false);
  const [err, setErr]             = useState(null);
  // Cadeau — achat
  const [giftDuration, setGiftDuration] = useState("1month");
  const [senderEmail, setSenderEmail]   = useState(userEmail || "");
  const [recipientName, setRecipientName] = useState("");
  const [giftMessage, setGiftMessage]   = useState("");
  const [giftCode, setGiftCode]         = useState(""); // après paiement
  const [giftSuccess, setGiftSuccess]   = useState(false);
  // Code cadeau — saisie
  const [redeemCode, setRedeemCode]     = useState("");
  const [redeemSuccess, setRedeemSuccess] = useState(null);

  const startCheckout = async () => {
    setLoading(true); setErr(null);
    try {
      const r = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userKey, email: userEmail, plan }),
      });
      const data = await r.json();
      if (data.url) window.location.href = data.url;
      else setErr("Impossible d'ouvrir le paiement. Réessaie.");
    } catch { setErr("Une erreur est survenue."); }
    setLoading(false);
  };

  const buyGift = async () => {
    setLoading(true); setErr(null);
    try {
      const r = await fetch("/api/gift/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration: giftDuration, senderEmail, recipientName, message: giftMessage }),
      });
      const data = await r.json();
      if (data.url) window.location.href = data.url;
      else setErr(data.error || "Erreur lors de la création du cadeau.");
    } catch { setErr("Une erreur est survenue."); }
    setLoading(false);
  };

  const redeemGift = async () => {
    setLoading(true); setErr(null);
    try {
      const r = await fetch("/api/gift/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: redeemCode, userKey }),
      });
      const data = await r.json();
      if (data.success) {
        setRedeemSuccess(data);
        if (onPremiumActivated) setTimeout(onPremiumActivated, 2000);
      } else setErr(data.error || "Code invalide.");
    } catch { setErr("Une erreur est survenue."); }
    setLoading(false);
  };

  const inputStyle = {
    width: "100%", background: "#1A1510",
    border: `1px solid ${T.brume}33`, borderRadius: "6px",
    padding: "0.8rem 1rem", fontFamily: T.sans, fontSize: "0.9rem",
    color: T.aube, outline: "none", boxSizing: "border-box",
    marginBottom: "0.7rem",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      background: "rgba(10,8,6,0.96)",
      display: "flex", alignItems: "flex-end",
      animation: "fadeIn 0.3s ease",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: 540, margin: "0 auto",
        background: `linear-gradient(170deg, #1A1714, #141210)`,
        borderTop: `1px solid ${T.or}33`,
        borderRadius: "20px 20px 0 0",
        padding: "2rem 2rem 4rem",
        animation: "fadeUp 0.35s ease forwards",
        maxHeight: "92vh", overflowY: "auto",
      }}>
        {/* En-tête */}
        <div style={{ textAlign: "center", marginBottom: "1.8rem" }}>
          <div style={{ fontSize: "1.8rem", marginBottom: "0.6rem", filter: `drop-shadow(0 0 12px ${T.or}66)` }}>✦</div>
          <div style={{ fontFamily: T.serif, fontSize: "1.4rem", color: T.orPale, marginBottom: "0.3rem" }}>
            ALBA — Accès complet
          </div>
          <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.88rem", color: T.brume, lineHeight: 1.7 }}>
            Le Miroir. Les Lettres. La voix d'ALBA.
          </div>
        </div>

        {/* Navigation modes */}
        <div style={{ display: "flex", borderBottom: `1px solid ${T.brume}18`, marginBottom: "1.6rem" }}>
          {[
            { id: "plans", label: "S'abonner" },
            { id: "gift_buy", label: "Offrir" },
            { id: "gift_redeem", label: "J'ai un code" },
          ].map(m => (
            <button key={m.id} onClick={() => { setMode(m.id); setErr(null); }} style={{
              flex: 1, background: "none", border: "none", cursor: "pointer",
              padding: "0.7rem 0",
              fontFamily: T.sans, fontWeight: 300, fontSize: "0.62rem",
              letterSpacing: "0.35em", textTransform: "uppercase",
              color: mode === m.id ? T.or : T.brume,
              borderBottom: `2px solid ${mode === m.id ? T.or : "transparent"}`,
              transition: "all 0.2s",
            }}>{m.label}</button>
          ))}
        </div>

        {/* ── MODE : PLANS ── */}
        {mode === "plans" && (
          <>
            {/* Features */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.8rem" }}>
              {[
                { icon: "🌊", label: "Le Miroir", desc: "Un reflet renvoyé. Sans jugement. Illimité." },
                { icon: "✦",  label: "Lettres des Portes", desc: "6 lettres uniques, une par Clé franchie." },
                { icon: "🌿", label: "Lettre mensuelle", desc: "ALBA t'écrit une fois par mois. Longue. Intime." },
              ].map((item, i) => (
                <div key={i} style={{
                  display: "flex", gap: "0.9rem", alignItems: "flex-start",
                  padding: "0.8rem 1rem", background: `${T.or}07`,
                  border: `1px solid ${T.or}15`, borderRadius: "6px",
                }}>
                  <span style={{ fontSize: "1rem", flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontFamily: T.serif, color: T.orPale, fontSize: "0.9rem" }}>{item.label}</div>
                    <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.7rem", color: T.brume, marginTop: "0.15rem" }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Choix plan */}
            <div style={{ display: "flex", gap: "0.7rem", marginBottom: "1.4rem" }}>
              {[
                { id: "monthly", price: "9€", period: "/ mois", sub: "" },
                { id: "annual",  price: "79€", period: "/ an", sub: "Soit 6,60€/mois · 2 mois offerts" },
              ].map(p => (
                <button key={p.id} onClick={() => setPlan(p.id)} style={{
                  flex: 1, background: plan === p.id ? `${T.or}15` : "transparent",
                  border: `2px solid ${plan === p.id ? T.or : T.brume + "33"}`,
                  borderRadius: "10px", padding: "1rem 0.8rem",
                  cursor: "pointer", textAlign: "center", transition: "all 0.2s",
                }}>
                  <div style={{ fontFamily: T.serif, fontSize: "1.5rem", color: plan === p.id ? T.or : T.orPale }}>{p.price}</div>
                  <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.68rem", letterSpacing: "0.3em", color: T.brume, marginTop: "0.2rem" }}>{p.period}</div>
                  {p.sub && <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.62rem", color: `${T.or}EE`, marginTop: "0.3rem" }}>{p.sub}</div>}
                </button>
              ))}
            </div>

            {err && <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.85rem", color: "#D4856A", textAlign: "center", marginBottom: "0.8rem" }}>{err}</div>}
            <button onClick={startCheckout} disabled={loading} style={{
              width: "100%", background: loading ? `${T.or}66` : T.or,
              border: "none", borderRadius: "6px", padding: "1rem",
              cursor: loading ? "default" : "pointer",
              fontFamily: T.sans, fontWeight: 300, fontSize: "0.6rem",
              letterSpacing: "0.4em", textTransform: "uppercase",
              color: T.nuit, transition: "all 0.2s",
            }}>
              {loading ? "Ouverture du paiement…" : plan === "annual" ? "Commencer — 79€ / an" : "Commencer — 9€ / mois"}
            </button>
          </>
        )}

        {/* ── MODE : OFFRIR ── */}
        {mode === "gift_buy" && (
          <>
            <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.95rem", color: T.brume, lineHeight: 1.8, marginBottom: "1.4rem" }}>
              Offrez ALBA à quelqu'un qui traverse quelque chose.<br/>
              Ils recevront un code à activer quand ils voudront.
            </p>

            {/* Durée */}
            <div style={{ display: "flex", gap: "0.7rem", marginBottom: "1.2rem" }}>
              {[
                { id: "1month", label: "1 mois", price: "9€" },
                { id: "1year",  label: "1 an",   price: "79€" },
              ].map(d => (
                <button key={d.id} onClick={() => setGiftDuration(d.id)} style={{
                  flex: 1, background: giftDuration === d.id ? `${T.or}15` : "transparent",
                  border: `2px solid ${giftDuration === d.id ? T.or : T.brume + "33"}`,
                  borderRadius: "10px", padding: "0.9rem",
                  cursor: "pointer", textAlign: "center", transition: "all 0.2s",
                }}>
                  <div style={{ fontFamily: T.serif, fontSize: "1.3rem", color: giftDuration === d.id ? T.or : T.orPale }}>{d.price}</div>
                  <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.65rem", letterSpacing: "0.3em", color: T.brume, marginTop: "0.2rem" }}>{d.label}</div>
                </button>
              ))}
            </div>

            <input value={senderEmail} onChange={e => setSenderEmail(e.target.value)}
              placeholder="Votre email (pour recevoir la confirmation)"
              style={inputStyle} />
            <input value={recipientName} onChange={e => setRecipientName(e.target.value)}
              placeholder="Prénom du destinataire (optionnel)"
              style={inputStyle} />
            <textarea value={giftMessage} onChange={e => setGiftMessage(e.target.value)}
              placeholder="Un mot à transmettre avec le code… (optionnel)"
              rows={3} style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }} />

            {/* Phrase ALBA générée */}
            <div style={{ padding: "0.8rem 1rem", background: `${T.or}08`, border: `1px solid ${T.or}18`, borderRadius: "6px", marginBottom: "1.2rem" }}>
              <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.85rem", color: `${T.orPale}EE`, lineHeight: 1.7, margin: 0 }}>
                "Quelqu'un pense à toi. ALBA t'attend."
              </p>
            </div>

            {err && <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.85rem", color: "#D4856A", textAlign: "center", marginBottom: "0.8rem" }}>{err}</div>}
            <button onClick={buyGift} disabled={loading} style={{
              width: "100%", background: loading ? `${T.or}66` : T.or,
              border: "none", borderRadius: "6px", padding: "1rem",
              cursor: loading ? "default" : "pointer",
              fontFamily: T.sans, fontWeight: 300, fontSize: "0.6rem",
              letterSpacing: "0.4em", textTransform: "uppercase",
              color: T.nuit, transition: "all 0.2s",
            }}>
              {loading ? "Ouverture du paiement…" : `Offrir ALBA — ${giftDuration === "1year" ? "79€" : "9€"}`}
            </button>
          </>
        )}

        {/* ── MODE : ACTIVER UN CODE ── */}
        {mode === "gift_redeem" && (
          <>
            {redeemSuccess ? (
              <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>✦</div>
                <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "1.1rem", color: T.orPale, lineHeight: 1.9, marginBottom: "0.5rem" }}>
                  Bienvenue dans ALBA.
                </p>
                <p style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.7rem", color: T.brume }}>
                  {redeemSuccess.durationLabel === "1year" ? "1 an" : "1 mois"} d'accès activé.
                </p>
              </div>
            ) : (
              <>
                <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.95rem", color: T.brume, lineHeight: 1.8, marginBottom: "1.4rem" }}>
                  Quelqu'un vous a offert ALBA.<br/>
                  Entrez votre code pour activer l'accès.
                </p>
                <input
                  value={redeemCode} onChange={e => setRedeemCode(e.target.value.toUpperCase())}
                  placeholder="ALBA-XXXX-XXXX"
                  style={{ ...inputStyle, fontFamily: "monospace", letterSpacing: "0.15em", fontSize: "1.1rem", textAlign: "center" }}
                />
                {err && <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.85rem", color: "#D4856A", textAlign: "center", marginBottom: "0.8rem" }}>{err}</div>}
                <button onClick={redeemGift} disabled={loading || !redeemCode.trim()} style={{
                  width: "100%", background: redeemCode.trim() && !loading ? T.or : `${T.or}44`,
                  border: "none", borderRadius: "6px", padding: "1rem",
                  cursor: redeemCode.trim() && !loading ? "pointer" : "default",
                  fontFamily: T.sans, fontWeight: 300, fontSize: "0.6rem",
                  letterSpacing: "0.4em", textTransform: "uppercase",
                  color: T.nuit, transition: "all 0.2s",
                }}>
                  {loading ? "Activation…" : "Activer mon cadeau"}
                </button>
              </>
            )}
          </>
        )}

        <button onClick={onClose} style={{
          width: "100%", marginTop: "1rem",
          background: "none", border: "none", cursor: "pointer",
          fontFamily: T.sans, fontWeight: 300, fontSize: "0.62rem",
          letterSpacing: "0.3em", textTransform: "uppercase",
          color: T.brume, padding: "0.5rem",
        }}>
          Continuer en accès gratuit
        </button>
      </div>
    </div>
  );
};

// ─── ÉCRAN AUTH — Magic Link ──────────────────────────────────────────────────
const AuthScreen = ({ onAuth }) => {
  const [email, setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [pressed, setPressed] = useState(false);

  const handleSend = async () => {
    setErrMsg("");
    if (!email.includes("@")) { setErrMsg("Adresse email invalide."); return; }
    setLoading(true);
    const ok = await sbAuth.sendMagicLink(email.trim().toLowerCase());
    setLoading(false);
    if (ok) setSent(true);
    else setErrMsg("Une erreur est survenue. Réessaie.");
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: T.nuit,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "2rem",
    }}>
      {/* Halo */}
      <div style={{
        position: "absolute", top: "15%", left: "50%",
        transform: "translateX(-50%)",
        width: 300, height: 300,
        background: `radial-gradient(ellipse, ${T.or}15 0%, transparent 70%)`,
        pointerEvents: "none",
      }}/>

      {/* Logo */}
      <div style={{ fontFamily: T.serif, fontSize: "2.2rem", letterSpacing: "0.28em", color: T.or, marginBottom: "0.3rem" }}>ALBA</div>
      <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.95rem", color: T.brume, marginBottom: "2.8rem" }}>L'aube en toi</div>

      <div style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: "1rem", animation: "fadeUp 0.7s ease forwards" }}>

        {!sent ? (
          <>
            <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.95rem", color: T.brume, textAlign: "center", lineHeight: 1.8, margin: "0 0 0.5rem" }}>
              Entre ton email.<br/>ALBA t'envoie un lien de connexion.
            </p>

            {/* Bouton Google */}
            <button
              onClick={() => sbAuth.signInWithGoogle()}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem",
                width: "100%", padding: "0.85rem 1rem",
                background: "#1E1A16", border: `1px solid ${T.brume}33`,
                borderRadius: "6px", cursor: "pointer",
                fontFamily: T.sans, fontWeight: 300, fontSize: "0.75rem",
                letterSpacing: "0.08em", color: T.aube,
                transition: "border-color 0.2s",
                WebkitTapHighlightColor: "transparent",
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = `${T.brume}66`}
              onMouseOut={e => e.currentTarget.style.borderColor = `${T.brume}33`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuer avec Google
            </button>

            {/* Séparateur */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", margin: "0.2rem 0" }}>
              <div style={{ flex: 1, height: 1, background: `${T.brume}22` }} />
              <span style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.72rem", color: `${T.brume}55` }}>ou</span>
              <div style={{ flex: 1, height: 1, background: `${T.brume}22` }} />
            </div>

            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder="ton@email.com"
              autoFocus
              style={{
                background: "#1E1A16",
                border: `1px solid ${T.brume}33`,
                borderRadius: "6px", padding: "0.95rem 1.1rem",
                fontFamily: T.sans, fontSize: "0.95rem", color: T.aube,
                outline: "none", width: "100%", boxSizing: "border-box",
                transition: "border 0.2s",
                textAlign: "center",
              }}
              onFocus={e => e.target.style.borderColor = `${T.or}55`}
              onBlur={e => e.target.style.borderColor = `${T.brume}33`}
            />

            {errMsg && (
              <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.85rem", color: "#D4856A", textAlign: "center" }}>
                {errMsg}
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={loading || !email.includes("@")}
              onMouseDown={() => setPressed(true)}
              onMouseUp={() => setPressed(false)}
              onTouchStart={() => setPressed(true)}
              onTouchEnd={() => setPressed(false)}
              style={{
                background: loading ? `${T.or}55` : T.or,
                border: "none", borderRadius: "4px",
                padding: "1rem", cursor: loading ? "default" : "pointer",
                fontFamily: T.sans, fontWeight: 300, fontSize: "0.6rem",
                letterSpacing: "0.45em", textTransform: "uppercase",
                color: T.nuit, transition: "all 0.2s",
                transform: pressed ? "scale(0.97)" : "scale(1)",
                opacity: !email.includes("@") ? 0.45 : 1,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {loading ? "Envoi…" : "Recevoir mon lien"}
            </button>

            <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.72rem", color: `${T.brume}66`, textAlign: "center", lineHeight: 1.6, margin: "0.2rem 0 0" }}>
              Pas de mot de passe. Un lien suffit.
            </p>
          </>
        ) : (
          <div style={{ textAlign: "center", animation: "fadeUp 0.6s ease forwards" }}>
            <div style={{ fontSize: "2rem", color: T.or, marginBottom: "1.2rem" }}>✦</div>
            <p style={{ fontFamily: T.serif, fontWeight: 300, fontSize: "1.1rem", color: T.orPale, lineHeight: 1.7, marginBottom: "0.8rem" }}>
              Vérifie ta boîte mail.
            </p>
            <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.88rem", color: T.brume, lineHeight: 1.8, marginBottom: "2rem" }}>
              Un lien t'attend.<br/>Clique dessus — ALBA s'ouvre.
            </p>
            <p style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.65rem", color: `${T.brume}55`, letterSpacing: "0.1em" }}>
              {email}
            </p>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              style={{
                marginTop: "1.5rem", background: "none", border: "none",
                cursor: "pointer", fontFamily: T.serif, fontStyle: "italic",
                fontSize: "0.75rem", color: `${T.brume}77`, padding: "0.3rem",
              }}
            >
              Changer d'email
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── SPLASH ────────────────────────────────────────────────────────────────────
const VIDEOS_AMBIANCE = {
  nuit:  ["/videos/etoiles.mp4", "/videos/nuages.mp4"],
  matin: ["/videos/caraibe.mp4", "/videos/vagues.mp4"],
  jour:  ["/videos/foret.mp4",   "/videos/desert.mp4"],
  soir:  ["/videos/savane2.mp4", "/videos/savane.mp4", "/videos/nuages.mp4"],
};

const getVideoAmbiance = () => {
  const h = new Date().getHours();
  const pool = h < 6 ? VIDEOS_AMBIANCE.nuit
             : h < 12 ? VIDEOS_AMBIANCE.matin
             : h < 17 ? VIDEOS_AMBIANCE.jour
             : VIDEOS_AMBIANCE.soir;
  return pool[Math.floor(Math.random() * pool.length)];
};

const Splash = ({ onEnd }) => {
  const [phase, setPhase] = useState("logo"); // logo | landing
  const [heroVideo] = useState(() => getVideoAmbiance());

  useEffect(() => {
    const t = setTimeout(() => setPhase("landing"), 2200);
    return () => clearTimeout(t);
  }, []);

  if (phase === "logo") {
    return (
      <Screen centered>
        <style>{`
          @keyframes logoFadeIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
          @keyframes taglineFade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        `}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontFamily: T.serif, fontWeight: 300, fontSize: "clamp(4.5rem, 14vw, 8rem)",
            letterSpacing: "0.4em", lineHeight: 1,
            background: `linear-gradient(90deg, ${T.or}, ${T.orPale}, ${T.or})`,
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animation: "logoFadeIn 1.4s ease forwards, shimmer 3s linear infinite",
          }}>ALBA</div>
          <div style={{
            fontFamily: T.sans, fontWeight: 300, fontSize: "0.65rem",
            letterSpacing: "0.5em", textTransform: "uppercase", color: T.brume,
            marginTop: "1.2rem",
            animation: "taglineFade 1.2s ease forwards 0.9s", opacity: 0,
          }}>L'aube en toi</div>
        </div>
      </Screen>
    );
  }

  // ── LANDING PAGE ──
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: T.nuit,
      display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes landFadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes landFadeUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes orb { 0%,100%{transform:scale(1) translate(0,0)} 50%{transform:scale(1.08) translate(-10px,10px)} }
      `}</style>

      {/* Vidéo de fond */}
      <video autoPlay loop muted playsInline style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        objectFit: "cover", opacity: 0.32, pointerEvents: "none",
      }}>
        <source src={heroVideo} type="video/mp4" />
      </video>

      {/* Overlay gradient */}
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(to bottom, ${T.nuit}CC 0%, ${T.nuit}55 40%, ${T.nuit}CC 80%, ${T.nuit} 100%)`,
        pointerEvents: "none",
      }}/>

      {/* Orbe doré central */}
      <div style={{
        position: "absolute", top: "30%", left: "50%",
        transform: "translateX(-50%)",
        width: 320, height: 320, borderRadius: "50%",
        background: `radial-gradient(circle, ${T.or}1A 0%, transparent 70%)`,
        animation: "orb 6s ease-in-out infinite",
        pointerEvents: "none",
      }}/>

      {/* Contenu */}
      <div style={{
        position: "relative", zIndex: 10,
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "2rem 1.5rem",
        textAlign: "center",
      }}>

        {/* Logo */}
        <div style={{
          fontFamily: T.serif, fontWeight: 300,
          fontSize: "clamp(3.5rem, 12vw, 6rem)",
          letterSpacing: "0.4em",
          background: `linear-gradient(90deg, ${T.or}, ${T.orPale}, ${T.or})`,
          backgroundSize: "200% auto",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          animation: "shimmer 4s linear infinite, landFadeIn 0.8s ease forwards",
          marginBottom: "0.6rem",
        }}>ALBA</div>

        <div style={{
          fontFamily: T.sans, fontWeight: 300, fontSize: "0.6rem",
          letterSpacing: "0.5em", textTransform: "uppercase", color: T.brume,
          marginBottom: "3rem",
          animation: "landFadeIn 0.8s ease forwards 0.3s", opacity: 0,
        }}>L'aube en toi</div>

        {/* Phrase centrale */}
        <div style={{
          fontFamily: T.serif, fontStyle: "italic",
          fontSize: "clamp(1.1rem, 3.5vw, 1.4rem)",
          color: T.orPale, lineHeight: 1.8,
          maxWidth: 340, marginBottom: "1.5rem",
          animation: "landFadeUp 0.9s ease forwards 0.6s", opacity: 0,
        }}>
          Un espace pour toi.<br/>
          Présent à 3h du matin.<br/>
          Présent les jours de lumière.
        </div>

        <div style={{
          fontFamily: T.serif, fontStyle: "italic",
          fontSize: "0.9rem", color: T.brume,
          maxWidth: 300, lineHeight: 1.7,
          marginBottom: "3.5rem",
          animation: "landFadeUp 0.9s ease forwards 0.9s", opacity: 0,
        }}>
          Pas un journal. Pas une appli de méditation.<br/>
          Une maison intérieure.
        </div>

        {/* Bouton principal */}
        <div style={{ animation: "landFadeUp 0.9s ease forwards 1.2s", opacity: 0, width: "100%", maxWidth: 300 }}>
          <button
            onClick={onEnd}
            style={{
              width: "100%",
              background: `linear-gradient(135deg, ${T.or}, #D4A058)`,
              border: "none", borderRadius: "2px",
              padding: "1rem 2rem",
              fontFamily: T.sans, fontWeight: 300, fontSize: "0.6rem",
              letterSpacing: "0.45em", textTransform: "uppercase",
              color: T.nuit, cursor: "pointer",
              boxShadow: `0 0 40px ${T.or}33`,
              transition: "all 0.3s",
            }}
            onMouseEnter={e => e.target.style.boxShadow = `0 0 60px ${T.or}55`}
            onMouseLeave={e => e.target.style.boxShadow = `0 0 40px ${T.or}33`}
          >
            Entrer dans ALBA
          </button>
        </div>

        {/* Signatures */}
        <div style={{
          marginTop: "3rem",
          display: "flex", gap: "2rem", alignItems: "center",
          animation: "landFadeIn 0.9s ease forwards 1.5s", opacity: 0,
        }}>
          {["Présent chaque jour", "Gratuit pour commencer", "Sans publicité"].map((t, i) => (
            <div key={i} style={{
              fontFamily: T.sans, fontWeight: 300,
              fontSize: "0.58rem", letterSpacing: "0.3em",
              textTransform: "uppercase", color: `${T.brume}DD`,
              textAlign: "center",
            }}>{t}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── ONBOARDING ────────────────────────────────────────────────────────────────
const inputStyle = {
  background: "transparent",
  border: "none",
  borderBottom: `1px solid ${T.brume}55`,
  color: T.aube,
  fontFamily: T.serif,
  fontSize: "clamp(1.3rem, 4vw, 1.8rem)",
  fontWeight: 300,
  fontStyle: "italic",
  padding: "0.5rem 0",
  width: "100%",
  textAlign: "center",
  transition: "border-color 0.3s",
};

const Label = ({ children }) => (
  <div style={{
    fontFamily: T.sans, fontWeight: 300, fontSize: "0.65rem",
    letterSpacing: "0.45em", textTransform: "uppercase", color: T.brume,
    marginBottom: "1.5rem", textAlign: "center",
  }}>{children}</div>
);

const FadeSlide = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -12 }}
    transition={{ duration: 0.38, ease: [0.25, 0.1, 0.25, 1] }}
  >
    {children}
  </motion.div>
);

// ── Breadcrumb dots ──────────────────────────────────────────────────────────
const BreadcrumbDots = ({ current, total = 6 }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.55rem", marginBottom: "2.8rem" }}>
    {Array.from({ length: total }, (_, i) => {
      const isPast    = i < current;
      const isActive  = i === current;
      const isFuture  = i > current;
      return (
        <div key={i} style={{
          width:  isActive ? 20 : isPast ? 7 : 5,
          height: isActive ? 5  : isPast ? 7 : 5,
          borderRadius: isActive ? "3px" : "50%",
          background: isActive
            ? T.or
            : isPast
            ? `${T.or}CC`
            : `${T.brume}33`,
          boxShadow: isActive ? `0 0 8px ${T.or}88` : "none",
          transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
          flexShrink: 0,
        }} />
      );
    })}
  </div>
);

// ── AHA Moment ───────────────────────────────────────────────────────────────
const AHA_PHRASES = [
  "Tu n'as rien à prouver ici.",
  "Ce que tu portes a de la valeur.",
  "Tu es déjà exactement là où tu dois être.",
  "Certaines choses n'ont pas besoin d'être résolues. Juste entendues.",
  "Il n'y a pas d'erreur dans ce que tu ressens.",
];

const AhaMoment = ({ prenom, onContinue }) => {
  const [phase, setPhase] = useState(0);
  const phrase = AHA_PHRASES[Math.floor((prenom.charCodeAt(0) || 0) % AHA_PHRASES.length)];

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1200);
    const t2 = setTimeout(() => setPhase(2), 2800);
    const t3 = setTimeout(() => setPhase(3), 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const f = (v, d = 0) => ({
    opacity: v ? 1 : 0,
    transform: v ? "translateY(0)" : "translateY(12px)",
    transition: `opacity 1.4s ease ${d}s, transform 1.4s ease ${d}s`,
  });

  return (
    <div style={{
      position: "fixed", inset: 0, background: T.nuit,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      zIndex: 100, padding: "2rem",
    }}>
      <div style={{ position: "absolute", width: 320, height: 320, borderRadius: "50%", background: `radial-gradient(circle, ${T.or}08 0%, transparent 70%)`, animation: "albaHaloPulse 5s ease-in-out infinite", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 320 }}>
        <div style={f(phase >= 0)}>
          <p style={{ fontFamily: T.serif, fontWeight: 300, fontSize: "clamp(1.6rem, 7vw, 2.4rem)", color: T.orPale, letterSpacing: "0.1em", margin: 0 }}>
            {prenom}.
          </p>
        </div>

        <div style={{ marginTop: "2rem", ...f(phase >= 1) }}>
          <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "clamp(1.05rem, 4vw, 1.3rem)", color: T.brume, lineHeight: 1.8, margin: 0 }}>
            {phrase}
          </p>
        </div>

        <div style={{ marginTop: "1rem", ...f(phase >= 2) }}>
          <div style={{ width: 20, height: 1, background: `linear-gradient(90deg, transparent, ${T.or}88, transparent)`, margin: "0 auto" }} />
        </div>

        {phase >= 3 && (
          <div style={{ marginTop: "3rem", animation: "albaBtnAppear 0.8s ease both" }}>
            <button onClick={onContinue} style={{
              background: "transparent", border: `1px solid ${T.or}66`,
              borderRadius: "3px", padding: "0.85rem 2.4rem",
              color: T.orPale, fontFamily: T.serif, fontStyle: "italic",
              fontSize: "1rem", letterSpacing: "0.05em", cursor: "pointer",
              transition: "border-color 0.3s",
              WebkitTapHighlightColor: "transparent",
            }}>
              Je continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Step = ({ num, label, children, onNext, onBack, canNext }) => (
  <Screen centered>
    <div style={{ width: "100%", maxWidth: 480, animation: "fadeUp 0.8s ease forwards" }}>
      <BreadcrumbDots current={num - 1} total={6} />
      <Label>{label}</Label>
      {children}

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", marginTop: "3rem" }}>
        {canNext && <Btn onClick={onNext}>Continuer</Btn>}
        {onBack && <Btn secondary small onClick={onBack}>Revenir</Btn>}
      </div>
    </div>
  </Screen>
);

const MOIS_NOMS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

const PictoSens = ({ id, couleur, size = 26 }) => {
  const s = { width: size, height: size, flexShrink: 0 };
  if (id === "intuitif") return (
    <svg viewBox="0 0 24 24" fill="none" stroke={couleur} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={s}>
      <path d="M12 21c0 0-7-5-7-11a7 7 0 0 1 14 0c0 6-7 11-7 11z" />
      <path d="M12 10 Q9 14 12 17 Q15 14 12 10z" fill={couleur} fillOpacity="0.25" stroke="none"/>
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
  if (id === "spirituel") return (
    <svg viewBox="0 0 24 24" fill="none" stroke={couleur} strokeWidth="1.2" strokeLinecap="round" style={s}>
      <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z" fill={couleur} fillOpacity="0.18" />
    </svg>
  );
  if (id === "rationnel") return (
    <svg viewBox="0 0 24 24" fill="none" stroke={couleur} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={s}>
      <circle cx="12" cy="12" r="8" />
      <path d="M8 12 Q10 8 12 12 Q14 16 16 12" />
      <circle cx="12" cy="12" r="1.2" fill={couleur} fillOpacity="0.5" stroke="none"/>
    </svg>
  );
  if (id === "transition") return (
    <svg viewBox="0 0 24 24" fill="none" stroke={couleur} strokeWidth="1.3" strokeLinecap="round" style={s}>
      <path d="M2 14 Q5 8 8 14 Q11 20 14 14 Q17 8 22 12" />
      <path d="M2 10 Q5 4 8 10 Q11 16 14 10 Q17 4 22 8" opacity="0.35"/>
    </svg>
  );
  return null;
};

const SENSIBILITES = [
  {
    id: "intuitif",
    titre: "Je ressens les choses profondément",
    desc: "Sensibilité intuitive, ouverture au symbolique",
    couleur: "#7BA88A",
  },
  {
    id: "spirituel",
    titre: "Je cherche du sens dans les signes",
    desc: "Numérologie, astrologie, spiritualité, synchronicités",
    couleur: "#C8A96E",
  },
  {
    id: "rationnel",
    titre: "Je fonctionne plutôt par la raison",
    desc: "Psychologie, concret, ancrage dans le réel",
    couleur: "#7B9EA8",
  },
  {
    id: "transition",
    titre: "Je suis en transition, je cherche",
    desc: "Ni l'un ni l'autre — ouvert(e) à découvrir",
    couleur: "#A87BC8",
  },
];

const Onboarding = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [stepDir, setStepDir] = useState(1);
  const [showAha, setShowAha] = useState(false);

  const goNext = (s) => { setStepDir(1); setStep(s); };
  const goBack = (s) => { setStepDir(-1); setStep(s); };
  const [prenom, setPrenom] = useState("");
  const [sensibilite, setSensibilite] = useState("");
  const [intentions, setIntentions] = useState([]);  // multi-select tempête, max 2
  const [intentionSoleil, setIntentionSoleil] = useState("");
  const [jour, setJour] = useState("");
  const [mois, setMois] = useState("");
  const [annee, setAnnee] = useState(1980);
  const [anneeConfirm, setAnneeConfirm] = useState(false);
  const [autreTexte, setAutreTexte] = useState("");
  const [signe, setSigne] = useState("");
  const [couleurPred, setCouleurPred] = useState("");

  const SIGNES = [
    { id: "belier",     label: "Bélier",      svg: <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 28 C20 28 20 18 20 15"/><path d="M20 15 C20 8 12 5 10 10 C8 15 12 18 16 16"/><path d="M20 15 C20 8 28 5 30 10 C32 15 28 18 24 16"/><circle cx="13" cy="10" r="3.5" fill="none"/><circle cx="27" cy="10" r="3.5" fill="none"/><path d="M17 28 L23 28" strokeWidth="1.2"/></svg> },
    { id: "taureau",    label: "Taureau",      svg: <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="20" cy="22" r="9"/><path d="M11 22 C11 14 8 9 6 8"/><path d="M29 22 C29 14 32 9 34 8"/><path d="M6 8 C8 6 12 7 14 10"/><path d="M34 8 C32 6 28 7 26 10"/></svg> },
    { id: "gemeaux",    label: "Gémeaux",      svg: <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><line x1="13" y1="8" x2="13" y2="32"/><line x1="27" y1="8" x2="27" y2="32"/><path d="M10 8 Q20 11 30 8"/><path d="M10 32 Q20 29 30 32"/><line x1="13" y1="20" x2="27" y2="20" strokeWidth="1"/></svg> },
    { id: "cancer",     label: "Cancer",       svg: <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M10 20 C10 13 16 9 20 12 C24 15 24 22 20 24 C16 26 12 24 13 20 C14 16 18 15 20 18"/><path d="M30 20 C30 27 24 31 20 28 C16 25 16 18 20 16 C24 14 28 16 27 20 C26 24 22 25 20 22"/></svg> },
    { id: "lion",       label: "Lion",         svg: <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="17" cy="16" r="7"/><path d="M24 16 C28 16 32 19 32 23 C32 28 28 31 24 30 C22 29.5 21 28 21 26"/><path d="M32 28 C33 30 35 34 34 36"/></svg> },
    { id: "vierge",     label: "Vierge",       svg: <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="8" x2="12" y2="32"/><path d="M12 8 C15 8 22 9 22 15 C22 20 16 21 12 20"/><path d="M12 20 C16 20 24 21 24 27 C24 31 20 32 17 32"/><path d="M22 32 C24 32 28 31 28 28 C28 25 25 25 24 27"/></svg> },
    { id: "balance",    label: "Balance",      svg: <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="32" x2="32" y2="32"/><line x1="20" y1="32" x2="20" y2="14"/><line x1="9" y1="14" x2="31" y2="14"/><path d="M9 14 L14 22 L20 14 L26 22 L31 14"/><path d="M13 22 L27 22" strokeWidth="0.8" strokeDasharray="2 2"/></svg> },
    { id: "scorpion",   label: "Scorpion",     svg: <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="8" x2="10" y2="26"/><line x1="20" y1="8" x2="20" y2="26"/><path d="M10 8 C13 8 20 9 20 15 C20 20 15 22 10 20"/><path d="M20 26 Q28 26 30 22 Q32 18 28 16 L30 18 L32 14"/></svg> },
    { id: "sagittaire", label: "Sagittaire",   svg: <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="30" x2="30" y2="10"/><polyline points="18,10 30,10 30,22"/><line x1="8" y1="32" x2="14" y2="26"/></svg> },
    { id: "capricorne", label: "Capricorne",   svg: <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M10 8 C10 8 10 22 10 26 C10 30 13 33 17 33 C22 33 25 29 25 26"/><path d="M10 14 C13 12 18 13 20 17 C22 21 20 26 17 27"/><path d="M25 26 C25 22 28 19 31 22 C33 24 32 28 29 30"/></svg> },
    { id: "verseau",    label: "Verseau",      svg: <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M7 17 Q11 13 15 17 Q19 21 23 17 Q27 13 33 17"/><path d="M7 25 Q11 21 15 25 Q19 29 23 25 Q27 21 33 25"/></svg> },
    { id: "poissons",   label: "Poissons",     svg: <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8 20 C8 14 12 8 20 8 C28 8 32 14 32 20"/><path d="M8 20 C8 26 12 32 20 32 C28 32 32 26 32 20"/><line x1="8" y1="20" x2="32" y2="20" strokeWidth="0.8"/><path d="M5 16 L8 20 L5 24"/><path d="M35 16 L32 20 L35 24"/></svg> },
  ];

  const COULEURS_PRED = [
    { id: "noir",     label: "Noir",     hex: "#1A1A1A" },
    { id: "blanc",    label: "Blanc",    hex: "#F5F0E8" },
    { id: "or",       label: "Or",       hex: "#C8A96E" },
    { id: "rouge",    label: "Rouge",    hex: "#C84040" },
    { id: "bordeaux", label: "Bordeaux", hex: "#8B2040" },
    { id: "bleu",     label: "Bleu",     hex: "#4A6EA8" },
    { id: "vert",     label: "Vert",     hex: "#4A8A5A" },
    { id: "violet",   label: "Violet",   hex: "#7B4EA8" },
    { id: "pourpre",  label: "Pourpre",  hex: "#8B3A6A" },
    { id: "rose",     label: "Rose",     hex: "#C87BA0" },
    { id: "orange",   label: "Orange",   hex: "#C87040" },
    { id: "gris",     label: "Gris",     hex: "#8A8278" },
  ];

  const INTENTIONS_TEMPETE = [
    "Une rupture, une séparation",
    "Un deuil, une perte",
    "Un épuisement profond",
    "Une trahison",
    "Je me sens perdu(e)",
    "Une maladie, un diagnostic",
    "Je cherche qui je suis",
  ];

  const INTENTIONS_SOLEIL = [
    "Je vais bien — je veux cultiver ça",
    "Je veux grandir, explorer",
    "Je cherche un espace à moi",
    "Je veux apprendre à mieux me connaître",
    "Autre chose…",
  ];

  const jourMax = mois ? new Date(annee, parseInt(mois), 0).getDate() : 31;
  const dateStr = jour && mois && anneeConfirm ? `${annee}-${mois.padStart(2,"0")}-${jour.padStart(2,"0")}` : "";

  const selStyle = (active) => ({
    background: active ? `${T.or}15` : "transparent",
    border: `1px solid ${active ? T.or + "66" : T.brume + "33"}`,
    color: active ? T.orPale : T.brume,
    fontFamily: T.serif, fontStyle: "italic",
    fontSize: "clamp(0.85rem, 2.2vw, 1rem)",
    padding: "0.5rem 0.3rem", borderRadius: "2px", cursor: "pointer",
    transition: "all 0.2s", textAlign: "center", flexShrink: 0,
  });

  const pct = ((annee - 1920) / (2010 - 1920) * 100).toFixed(1);

  // ── Variant Framer Motion pour transitions entre étapes ──────────────────────
  const stepVariants = {
    initial: (dir) => ({ opacity: 0, x: dir > 0 ? 24 : -24 }),
    animate: { opacity: 1, x: 0 },
    exit: (dir) => ({ opacity: 0, x: dir > 0 ? -24 : 24 }),
  };

  // ── ÉTAPE 0 — Prénom ──────────────────────────────────────────────────────
  if (step === 0) return (
    <Step num={1} label="Comment t'appelles-tu ?" onNext={() => { setShowAha(true); }} canNext={prenom.length > 1}>
      <input style={inputStyle} placeholder="Ton prénom…" value={prenom}
        onChange={e => setPrenom(e.target.value)}
        onFocus={e => e.target.style.borderColor = T.or}
        onBlur={e => e.target.style.borderColor = `${T.brume}55`} />
      <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.9rem", color: T.brume, textAlign: "center", marginTop: "1.2rem" }}>
        Ce prénom ne sera partagé avec personne. Il est juste pour nous.
      </p>
    </Step>
  );

  // ── AHA MOMENT ──────────────────────────────────────────────────────────
  if (showAha) return (
    <AhaMoment prenom={prenom} onContinue={() => { setShowAha(false); setStep(1); }} />
  );

  // ── ÉTAPE 1 — Sensibilité ─────────────────────────────────────────────────
  if (step === 1) return (
    <Screen centered>
      <div style={{ width: "100%", maxWidth: 480, animation: "fadeUp 0.8s ease forwards" }}>
        <BreadcrumbDots current={1} total={6} />
        <div style={{ fontFamily: T.serif, fontWeight: 300, fontSize: "clamp(1.3rem, 4vw, 1.7rem)", color: T.orPale, textAlign: "center", marginBottom: "0.6rem", lineHeight: 1.3 }}>
          Comment tu te situes, {prenom} ?
        </div>
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.9rem", color: T.brume, textAlign: "center", marginBottom: "2.5rem" }}>
          Pas de bonne réponse. Juste ce qui te ressemble le plus.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          {SENSIBILITES.map(s => {
            const sel = sensibilite === s.id;
            return (
              <button key={s.id} onClick={() => setSensibilite(s.id)} style={{
                background: sel ? `${s.couleur}18` : `${T.nuit2}`,
                border: `1px solid ${sel ? s.couleur + "77" : T.brume + "22"}`,
                borderRadius: "6px", cursor: "pointer", padding: "1rem 1.2rem",
                textAlign: "left", transition: "all 0.25s",
                display: "flex", alignItems: "center", gap: "1rem",
              }}>
                <PictoSens id={s.id} couleur={sel ? s.couleur : T.brume + "99"} size={26} />
                <div>
                  <div style={{ fontFamily: T.serif, fontSize: "1rem", color: sel ? T.orPale : T.aube, fontStyle: "italic", marginBottom: "0.25rem" }}>
                    {sel ? "✦ " : ""}{s.titre}
                  </div>
                  <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.7rem", color: sel ? s.couleur : T.brume, letterSpacing: "0.05em" }}>
                    {s.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", marginTop: "2.5rem" }}>
          {sensibilite && (
            <Btn onClick={() => setStep(2)}>Continuer</Btn>
          )}
          <Btn secondary small onClick={() => setStep(0)}>Revenir</Btn>
        </div>
      </div>
    </Screen>
  );

  // ── ÉTAPE 2 — Date de naissance ───────────────────────────────────────────
  if (step === 2) return (
    <Step num={3} label={sensibilite === "rationnel" ? "Quelle est ta date de naissance ?" : "Quelle est ta date de naissance ?"}
      onNext={() => setStep(3)}
      onBack={() => setStep(1)}
      canNext={!!dateStr}>

      {/* Jour */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.68rem", letterSpacing: "0.45em", textTransform: "uppercase", color: T.brume, textAlign: "center", marginBottom: "0.8rem" }}>Jour</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", justifyContent: "center" }}>
          {Array.from({length: jourMax}, (_,i) => String(i+1)).map(j => (
            <button key={j} onClick={() => setJour(j === jour ? "" : j)}
              style={{ ...selStyle(jour === j), minWidth: 32, padding: "0.45rem 0.2rem" }}>
              {j}
            </button>
          ))}
        </div>
      </div>

      {/* Mois */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.68rem", letterSpacing: "0.45em", textTransform: "uppercase", color: T.brume, textAlign: "center", marginBottom: "0.8rem" }}>Mois</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", justifyContent: "center" }}>
          {MOIS_NOMS.map((m, i) => {
            const val = String(i+1);
            return (
              <button key={m} onClick={() => setMois(val === mois ? "" : val)}
                style={{ ...selStyle(mois === val), minWidth: 70, padding: "0.5rem 0.4rem", fontSize: "0.82rem" }}>
                {m}
              </button>
            );
          })}
        </div>
      </div>

      {/* Année */}
      <div style={{ marginBottom: "0.5rem" }}>
        <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.68rem", letterSpacing: "0.45em", textTransform: "uppercase", color: T.brume, textAlign: "center", marginBottom: "1rem" }}>Année</div>
        <div style={{ textAlign: "center", marginBottom: "1.2rem" }}>
          <span style={{
            fontFamily: T.serif, fontWeight: 300, fontSize: "clamp(2.2rem, 8vw, 3rem)",
            color: anneeConfirm ? T.or : T.orPale, letterSpacing: "0.1em", transition: "color 0.3s",
          }}>{annee}</span>
        </div>
        <style>{`
          .alba-slider{-webkit-appearance:none;appearance:none;width:100%;height:2px;background:linear-gradient(to right,${T.or} 0%,${T.or} ${pct}%,${T.brume}44 ${pct}%,${T.brume}44 100%);outline:none;border-radius:2px;}
          .alba-slider::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:${T.or};cursor:pointer;border:2px solid ${T.nuit};box-shadow:0 0 8px ${T.or}66;}
          .alba-slider::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:${T.or};cursor:pointer;border:2px solid ${T.nuit};}
        `}</style>
        <input type="range" className="alba-slider" min={1920} max={2010} step={1}
          value={annee}
          onChange={e => { setAnnee(parseInt(e.target.value)); setAnneeConfirm(false); }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
          {[1920,1940,1960,1980,2000,2010].map(y => (
            <button key={y} onClick={() => { setAnnee(y); setAnneeConfirm(false); }} style={{
              background: "none", border: "none", cursor: "pointer",
              fontFamily: T.sans, fontWeight: 300, fontSize: "0.68rem",
              letterSpacing: "0.05em", color: T.brume, padding: "0.2rem",
            }}>{y}</button>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: "1.2rem" }}>
          <button onClick={() => setAnneeConfirm(true)} style={{
            background: anneeConfirm ? `${T.or}22` : "transparent",
            border: `1px solid ${anneeConfirm ? T.or + "77" : T.brume + "44"}`,
            color: anneeConfirm ? T.or : T.aube,
            fontFamily: T.sans, fontWeight: 300, fontSize: "0.65rem",
            letterSpacing: "0.35em", textTransform: "uppercase",
            padding: "0.6rem 1.8rem", borderRadius: "2px", cursor: "pointer", transition: "all 0.25s",
          }}>{anneeConfirm ? `✦ ${annee} confirmé` : `Confirmer ${annee}`}</button>
        </div>
      </div>

      <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.88rem", color: T.brume, textAlign: "center", marginTop: "1.5rem" }}>
        {sensibilite === "rationnel"
          ? "Ta date de naissance nous aide à construire ton profil psychologique."
          : "Ta date ouvre une carte unique — le portrait de ton âme."}
      </p>
    </Step>
  );

  // ── ÉTAPE 3 — Intention ───────────────────────────────────────────────────
  if (step === 3) return (
    <Screen centered>
      <div style={{ width: "100%", maxWidth: 480, animation: "fadeUp 0.8s ease forwards" }}>
        <BreadcrumbDots current={3} total={6} />

        <Label>Qu'est-ce qui t'amène ici, {prenom} ?</Label>

        {/* Groupe tempête */}
        <div style={{ marginBottom: "0.5rem" }}>
          <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.62rem", letterSpacing: "0.45em", textTransform: "uppercase", color: T.brume, marginBottom: "0.8rem", paddingLeft: "0.2rem" }}>
            Je traverse quelque chose
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.68rem" }}>
            {INTENTIONS_TEMPETE.map(i => {
              const sel = intentions.includes(i);
              const maxAtteint = intentions.length >= 2 && !sel;
              return (
                <button key={i} onClick={() => {
                  if (maxAtteint) return;
                  setIntentions(sel ? intentions.filter(x => x !== i) : [...intentions, i]);
                }} style={{
                  background: sel ? `${T.aurore}15` : "transparent",
                  border: `1px solid ${sel ? T.aurore + "66" : maxAtteint ? T.brume + "11" : T.brume + "22"}`,
                  color: sel ? T.orPale : maxAtteint ? `${T.aube}88` : `${T.aube}EE`,
                  fontFamily: T.serif, fontStyle: "italic",
                  fontSize: "clamp(0.9rem, 2.4vw, 1rem)",
                  padding: "0.75rem 1.1rem", borderRadius: "4px",
                  cursor: maxAtteint ? "default" : "pointer",
                  transition: "all 0.2s", textAlign: "left",
                }}>{sel ? "✦ " : ""}{i}</button>
              );
            })}
          </div>
        </div>

        {/* Séparateur */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", margin: "1.4rem 0" }}>
          <div style={{ flex: 1, height: "1px", background: `${T.brume}22` }} />
          <span style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.75rem", color: T.brume }}>et / ou</span>
          <div style={{ flex: 1, height: "1px", background: `${T.brume}22` }} />
        </div>

        {/* Groupe soleil */}
        <div style={{ marginBottom: "0.5rem" }}>
          <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.62rem", letterSpacing: "0.45em", textTransform: "uppercase", color: T.brume, marginBottom: "0.8rem", paddingLeft: "0.2rem" }}>
            Je cherche un espace pour grandir
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.68rem" }}>
            {INTENTIONS_SOLEIL.map(i => {
              const sel = intentionSoleil === i;
              return (
                <button key={i} onClick={() => setIntentionSoleil(sel ? "" : i)} style={{
                  background: sel ? `${T.or}12` : "transparent",
                  border: `1px solid ${sel ? T.or + "55" : T.brume + "22"}`,
                  color: sel ? T.orPale : `${T.aube}EE`,
                  fontFamily: T.serif, fontStyle: "italic",
                  fontSize: "clamp(0.9rem, 2.4vw, 1rem)",
                  padding: "0.75rem 1.1rem", borderRadius: "4px", cursor: "pointer",
                  transition: "all 0.2s", textAlign: "left",
                }}>{sel ? "✦ " : ""}{i}</button>
              );
            })}
          </div>
        </div>

        {intentions.includes("Autre chose…") && (
          <input
            value={autreTexte}
            onChange={e => setAutreTexte(e.target.value)}
            placeholder="Dis-moi en quelques mots…"
            style={{
              ...inputStyle, fontSize: "1rem", fontStyle: "italic",
              borderBottom: `1px solid ${T.or}55`, marginTop: "0.5rem",
            }}
            onFocus={e => e.target.style.borderColor = T.or}
            onBlur={e => e.target.style.borderColor = `${T.or}55`}
            autoFocus
          />
        )}

        {intentions.length >= 2 && (
          <div style={{ textAlign: "center", fontFamily: T.serif, fontStyle: "italic", fontSize: "0.75rem", color: `${T.brume}DD`, marginTop: "0.5rem" }}>
            Tu peux choisir jusqu'à 2 intentions
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", marginTop: "2.5rem" }}>
          {(intentions.length > 0 || intentionSoleil) && (!intentions.includes("Autre chose…") || autreTexte.length > 2) &&
            <Btn onClick={() => setStep(4)}>Continuer</Btn>
          }
          <Btn secondary small onClick={() => setStep(2)}>Revenir</Btn>
        </div>
      </div>
    </Screen>
  );

  // ── ÉTAPE 4 — Signe astrologique ─────────────────────────────────────────
  if (step === 4) return (
    <Screen centered>
      <div style={{ width: "100%", maxWidth: 480, animation: "fadeUp 0.8s ease forwards" }}>
        <BreadcrumbDots current={4} total={6} />
        <div style={{ fontFamily: T.serif, fontWeight: 300, fontSize: "clamp(1.2rem, 4vw, 1.6rem)", color: T.orPale, textAlign: "center", marginBottom: "0.5rem", lineHeight: 1.3 }}>
          Ton signe, {prenom} ?
        </div>
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.9rem", color: T.brume, textAlign: "center", marginBottom: "2rem" }}>
          Pas une croyance. Une langue parmi d'autres.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.6rem", marginBottom: "2rem" }}>
          {SIGNES.map(s => {
            const sel = signe === s.id;
            return (
              <button key={s.id} onClick={() => setSigne(s.id)} style={{
                background: sel ? `${T.or}12` : "transparent",
                border: `1px solid ${sel ? T.or + "55" : T.brume + "18"}`,
                borderRadius: "8px", padding: "0.8rem 0.3rem 0.6rem",
                cursor: "pointer", transition: "all 0.25s",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem",
                boxShadow: sel ? `0 0 14px ${T.or}22` : "none",
              }}>
                <div style={{
                  width: 36, height: 36,
                  color: sel ? T.or : `${T.brume}DD`,
                  filter: sel ? `drop-shadow(0 0 4px ${T.or}88)` : "none",
                  transition: "all 0.25s",
                }}>
                  {s.svg}
                </div>
                <span style={{
                  fontFamily: T.serif, fontSize: "0.62rem", fontStyle: "italic",
                  color: sel ? T.orPale : `${T.brume}CC`,
                  letterSpacing: "0.03em",
                  transition: "color 0.25s",
                }}>{s.label}</span>
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <Btn onClick={() => setStep(5)} canNext={!!signe} disabled={!signe} style={{ opacity: signe ? 1 : 0.4 }}>Continuer</Btn>
          <Btn secondary small onClick={() => setStep(3)}>Revenir</Btn>
        </div>
      </div>
    </Screen>
  );

  // ── ÉTAPE 5 — Couleur de prédilection ────────────────────────────────────
  if (step === 5) return (
    <Screen centered>
      <div style={{ width: "100%", maxWidth: 480, animation: "fadeUp 0.8s ease forwards" }}>
        <BreadcrumbDots current={5} total={6} />
        <div style={{ fontFamily: T.serif, fontWeight: 300, fontSize: "clamp(1.2rem, 4vw, 1.6rem)", color: T.orPale, textAlign: "center", marginBottom: "0.5rem", lineHeight: 1.3 }}>
          Ta couleur, {prenom} ?
        </div>
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.9rem", color: T.brume, textAlign: "center", marginBottom: "2rem" }}>
          Celle qui te ressemble. Celle que tu portes ou que tu rêves.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.6rem", marginBottom: "2rem" }}>
          {COULEURS_PRED.map(c => (
            <button key={c.id} onClick={() => setCouleurPred(c.id)} style={{
              background: couleurPred === c.id ? `${c.hex}25` : "transparent",
              border: `2px solid ${couleurPred === c.id ? c.hex : T.brume + "22"}`,
              borderRadius: "8px", padding: "0.8rem 0.4rem",
              cursor: "pointer", transition: "all 0.2s",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: c.hex,
                border: `1px solid ${T.brume}33`,
                boxShadow: couleurPred === c.id ? `0 0 10px ${c.hex}66` : "none",
              }}/>
              <span style={{ fontFamily: T.serif, fontSize: "0.68rem", color: couleurPred === c.id ? T.orPale : T.brume, fontStyle: "italic" }}>{c.label}</span>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          {couleurPred && <Btn onClick={() => {
            const intentPrincipale = intentions[0] === "Autre chose…" ? autreTexte : (intentions[0] || intentionSoleil || "");
            const intentSecondaire = intentions[1]
              ? (intentions[1] === "Autre chose…" ? autreTexte : intentions[1])
              : (intentions[0] && intentionSoleil ? intentionSoleil : "");
            onComplete({
              prenom,
              naissance: dateStr,
              intention: intentPrincipale,
              intentionSecondaire: intentSecondaire,
              sensibilite,
              signe,
              couleur: couleurPred,
            });
          }}>Entrer dans l'aube</Btn>}
          <Btn secondary small onClick={() => setStep(4)}>Revenir</Btn>
        </div>
      </div>
    </Screen>
  );
};


// ─── SON DENTELLE ────────────────────────────────────────────────────────────
const useAlbaSound = () => {
  const jouer = (nom) => {
    if (typeof localStorage === "undefined") return;
    if (localStorage.getItem("alba_son_preference") !== "oui") return;
    try {
      const audio = new Audio(`/sons/${nom}.mp3`);
      audio.volume = 0.22;
      audio.play().catch(() => {});
    } catch(e) {}
  };
  return { jouer };
};

// ─── CARTE D'ÂME SVG ─────────────────────────────────────────────────────────
const CARTE_DATA = {
  1:  { mot: "PIONNIER",   element: "Feu",   forme: "triangle",   palette: ["#E8956D","#C8623A","#F5C4A8"] },
  2:  { mot: "HARMONIE",   element: "Eau",   forme: "vague",      palette: ["#7BA8C8","#4A7FA0","#B8D8EC"] },
  3:  { mot: "CRÉATEUR",   element: "Air",   forme: "spirale",    palette: ["#C8A96E","#A07840","#ECD9A8"] },
  4:  { mot: "FONDATION",  element: "Terre", forme: "carré",      palette: ["#8A9E7B","#5A7A4A","#C0D4B0"] },
  5:  { mot: "LIBERTÉ",    element: "Éther", forme: "étoile",     palette: ["#9E7BC8","#7040A0","#D4B8EC"] },
  6:  { mot: "AMOUR",      element: "Cœur",  forme: "cercle",     palette: ["#C87B9E","#A04070","#ECB8D4"] },
  7:  { mot: "MYSTÈRE",    element: "Lune",  forme: "croissant",  palette: ["#7B9EC8","#3A5A8A","#B8C8EC"] },
  8:  { mot: "PUISSANCE",  element: "Soleil",forme: "octogone",   palette: ["#C8B46E","#906A20","#ECD8A0"] },
  9:  { mot: "SAGESSE",    element: "Cosmos",forme: "étoile9",    palette: ["#9EC8B4","#4A8A6A","#C0E4D4"] },
  11: { mot: "MESSAGER",   element: "Éclair",forme: "double",     palette: ["#C8C87B","#8A8A30","#ECECB0"] },
  22: { mot: "BÂTISSEUR",  element: "Monde", forme: "mandala",    palette: ["#C89E7B","#8A5A30","#ECD4B0"] },
};

// 🔄 Sur Vercel : ajouter tes images GPT dans /public/cartes/
// Nommer les fichiers : carte-1.jpg, carte-2.jpg ... carte-9.jpg, carte-11.jpg, carte-22.jpg
const CARTE_IMAGES = {
  1:  "/cartes/carte-1.jpg",
  2:  "/cartes/carte-2.jpg",
  3:  "/cartes/carte-3.jpg",
  4:  "/cartes/carte-4.jpg",
  5:  "/cartes/carte-5.jpg",
  6:  "/cartes/carte-6.jpg",
  7:  "/cartes/carte-7.jpg",
  8:  "/cartes/carte-8.jpg",
  9:  "/cartes/carte-9.jpg",
  11: "/cartes/carte-11.jpg",
  22: "/cartes/carte-22.jpg",
};

const CarteAme = ({ data, small }) => {
  const cdv = cheminDeVie(data.naissance);
  const carte = CARTE_DATA[cdv] || CARTE_DATA[9];
  const { blessure } = getContextProfil(data);
  const [c1, c2, c3] = carte.palette;

  const W = small ? 180 : 280;
  const H = small ? 280 : 440;
  const cx = W / 2;
  const cy = H / 2;

  // Génère des étoiles pseudo-aléatoires basées sur le cdv
  const stars = Array.from({length: 18}, (_, i) => ({
    x: ((cdv * 137 + i * 73) % (W - 20)) + 10,
    y: ((cdv * 89 + i * 113) % (H - 20)) + 10,
    r: ((i * cdv) % 3 === 0) ? 1.5 : 0.8,
    op: 0.3 + ((i * cdv) % 5) * 0.12,
  }));

  // Forme centrale selon le chemin
  const renderForme = () => {
    const r = small ? 42 : 65;
    switch(carte.forme) {
      case "triangle": {
        const pts = [
          [cx, cy - r],
          [cx - r * 0.866, cy + r * 0.5],
          [cx + r * 0.866, cy + r * 0.5],
        ].map(p => p.join(",")).join(" ");
        return <polygon points={pts} fill="none" stroke={c1} strokeWidth="1.5" opacity="0.7" />;
      }
      case "carré": {
        const s = r * 1.2;
        return <rect x={cx-s/2} y={cy-s/2} width={s} height={s} fill="none" stroke={c1} strokeWidth="1.5" opacity="0.7" transform={`rotate(15 ${cx} ${cy})`}/>;
      }
      case "octogone": {
        const pts = Array.from({length:8}, (_,i) => {
          const a = (i * Math.PI / 4) - Math.PI/8;
          return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
        }).join(" ");
        return <polygon points={pts} fill="none" stroke={c1} strokeWidth="1.5" opacity="0.7" />;
      }
      case "étoile":
      case "étoile9": {
        const n = carte.forme === "étoile9" ? 9 : 5;
        const pts = Array.from({length: n*2}, (_, i) => {
          const a = (i * Math.PI / n) - Math.PI/2;
          const rr = i % 2 === 0 ? r : r * 0.45;
          return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`;
        }).join(" ");
        return <polygon points={pts} fill={`${c1}18`} stroke={c1} strokeWidth="1.2" opacity="0.75" />;
      }
      case "double": {
        return <>
          <line x1={cx-r*0.4} y1={cy-r} x2={cx-r*0.4} y2={cy+r} stroke={c1} strokeWidth="1.5" opacity="0.7"/>
          <line x1={cx+r*0.4} y1={cy-r} x2={cx+r*0.4} y2={cy+r} stroke={c1} strokeWidth="1.5" opacity="0.7"/>
        </>;
      }
      default:
        return <circle cx={cx} cy={cy} r={r} fill="none" stroke={c1} strokeWidth="1.5" opacity="0.7" />;
    }
  };

  // Si une vraie image GPT est disponible, on l'affiche avec overlay texte
  const imageUrl = CARTE_IMAGES[cdv];
  if (imageUrl) {
    return (
      <div style={{
        width: W, height: H,
        borderRadius: 8, overflow: "hidden",
        position: "relative",
        filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.6))",
        display: "inline-block",
      }}>
        <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
        {/* Overlay gradient bas pour lisibilité texte */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "50%",
          background: "linear-gradient(to top, rgba(10,8,6,0.95), transparent)",
        }}/>
        {/* Bordure */}
        <div style={{
          position: "absolute", inset: 1, borderRadius: 7,
          border: `1px solid ${c1}55`,
          pointerEvents: "none",
        }}/>
        {/* Texte bas */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: small ? "0.8rem" : "1.2rem", textAlign: "center" }}>
          <div style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: small ? 14 : 18, color: c3, opacity: 0.95, marginBottom: 4 }}>
            {data.prenom}
          </div>
          <div style={{ fontFamily: "Arial Narrow,sans-serif", fontSize: small ? 6 : 8, color: c1, opacity: 0.7, letterSpacing: "0.5em", textTransform: "uppercase" }}>
            {carte.mot}
          </div>
        </div>
      </div>
    );
  }

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}
      style={{ display: "block", filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.6))" }}>
      <defs>
        <radialGradient id={`grad-${cdv}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={c2} stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#1A1714" stopOpacity="1"/>
        </radialGradient>
        <radialGradient id={`glow-${cdv}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={c1} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={c1} stopOpacity="0"/>
        </radialGradient>
      </defs>

      {/* Fond */}
      <rect width={W} height={H} rx="8" fill="#1A1714"/>
      <rect width={W} height={H} rx="8" fill={`url(#grad-${cdv})`}/>

      {/* Bordure dorée */}
      <rect x="1" y="1" width={W-2} height={H-2} rx="7"
        fill="none" stroke={c1} strokeWidth="0.8" opacity="0.4"/>
      <rect x="6" y="6" width={W-12} height={H-12} rx="5"
        fill="none" stroke={c1} strokeWidth="0.3" opacity="0.2"/>

      {/* Étoiles fond */}
      {stars.map((s,i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={c3} opacity={s.op}/>
      ))}

      {/* Halo central */}
      <circle cx={cx} cy={cy} r={small ? 55 : 85}
        fill={`url(#glow-${cdv})`} opacity="0.6"/>

      {/* Cercles concentriques décoratifs */}
      <circle cx={cx} cy={cy} r={small ? 60 : 95} fill="none" stroke={c1} strokeWidth="0.4" opacity="0.15" strokeDasharray="3 6"/>
      <circle cx={cx} cy={cy} r={small ? 72 : 112} fill="none" stroke={c1} strokeWidth="0.3" opacity="0.1" strokeDasharray="1 8"/>

      {/* Forme centrale */}
      {renderForme()}

      {/* Chiffre chemin de vie au centre */}
      <text x={cx} y={cy + (small ? 8 : 12)} textAnchor="middle"
        fontFamily="Georgia, serif" fontStyle="italic"
        fontSize={small ? 28 : 44} fill={c3} opacity="0.9">{cdv}</text>

      {/* Nom du chemin */}
      <text x={cx} y={small ? H - 95 : H - 150} textAnchor="middle"
        fontFamily="Georgia, serif" fontStyle="italic"
        fontSize={small ? 9 : 13} fill={c3} opacity="0.7" letterSpacing="1">
        {CHEMINS[cdv]?.titre || ""}
      </text>

      {/* Ornement central haut */}
      <text x={cx} y={small ? 28 : 38} textAnchor="middle"
        fontFamily="Georgia, serif" fontSize={small ? 8 : 11}
        fill={c1} opacity="0.5" letterSpacing="4">✦ · ✦</text>

      {/* Prénom */}
      <text x={cx} y={small ? H - 70 : H - 108} textAnchor="middle"
        fontFamily="Georgia, serif" fontStyle="italic"
        fontSize={small ? 13 : 20} fill={c3} opacity="0.95"
        letterSpacing="2">{data.prenom}</text>

      {/* Mot-force */}
      <text x={cx} y={small ? H - 52 : H - 76} textAnchor="middle"
        fontFamily="'Arial Narrow', sans-serif" fontWeight="300"
        fontSize={small ? 6 : 8} fill={c1} opacity="0.65"
        letterSpacing={small ? 5 : 8}>{carte.mot}</text>

      {/* Blessure */}
      <text x={cx} y={small ? H - 36 : H - 54} textAnchor="middle"
        fontFamily="Georgia, serif" fontStyle="italic"
        fontSize={small ? 7 : 10} fill={c3} opacity="0.45"
        letterSpacing="1">{blessure.nom} · Clé I</text>

      {/* Ligne séparatrice bas */}
      <line x1={cx - (small ? 30 : 50)} y1={small ? H-44 : H-66}
            x2={cx + (small ? 30 : 50)} y2={small ? H-44 : H-66}
        stroke={c1} strokeWidth="0.5" opacity="0.3"/>

      {/* ALBA signature */}
      <text x={cx} y={small ? H - 14 : H - 22} textAnchor="middle"
        fontFamily="'Arial Narrow', sans-serif"
        fontSize={small ? 6 : 8} fill={c1} opacity="0.35"
        letterSpacing={small ? 6 : 10}>ALBA</text>
    </svg>
  );
};

// ─── PORTRAIT D'ÂME ───────────────────────────────────────────────────────────
const Portrait = ({ data, onContinue }) => {
  if (!data) return null;
  const cdv = cheminDeVie(data.naissance);
  const chemin = CHEMINS[cdv] || CHEMINS[9];
  const { blessure } = getContextProfil(data);
  const livre     = LIVRES[blessure.nom] || LIVRES["Abandon"];
  const citation  = CITATIONS[cdv % CITATIONS.length];
  const cle       = CLES[0];
  const sens      = data.sensibilite || "intuitif";
  const isRationnel = sens === "rationnel";
  const labelChemin  = isRationnel ? "Profil psychologique" : "Chemin de vie";
  const labelBlessure = isRationnel ? "Zone de vulnérabilité" : "Blessure à traverser";

  // ── Phases cinématiques ──────────────────────────────────────────────────
  // 0 = écran noir avec "Attends un instant"
  // 1 = prénom + étoile dorée  
  // 2 = carte + archétype
  // 3 = blessure
  // 4 = citation
  // 5 = portrait complet + bouton
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const delays = [3200, 3400, 3800, 3600, 4000];
    let t;
    const advance = (p) => {
      t = setTimeout(() => {
        setPhase(p + 1);
        if (p + 1 < 5) advance(p + 1);
      }, delays[p]);
    };
    advance(0);
    return () => clearTimeout(t);
  }, []);

  const fade = (visible, delay = 0) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(18px)",
    transition: `opacity 1.8s ease ${delay}s, transform 1.8s ease ${delay}s`,
  });

  // ── Phase 0–4 : révélation séquentielle plein écran ─────────────────────
  if (phase < 5) return (
    <div style={{
      position: "fixed", inset: 0,
      background: T.nuit,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      zIndex: 100, overflow: "hidden",
    }}>
      {/* Vidéo ambiante très discrète */}
      <video autoPlay loop muted playsInline style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        objectFit: "cover", opacity: 0.28, pointerEvents: "none",
      }}>
        <source src={HEURE < 6 ? "/videos/etoiles.mp4" : "/videos/nuages.mp4"} type="video/mp4" />
      </video>

      {/* Halo central doré, pulse très lent */}
      <div style={{
        position: "absolute",
        width: 360, height: 360, borderRadius: "50%",
        background: `radial-gradient(circle, ${T.or}0A 0%, transparent 70%)`,
        animation: "pulse 4s ease-in-out infinite",
        pointerEvents: "none",
      }} />

      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.15);opacity:1} }
        @keyframes shimmerLine { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
        @keyframes starSpin { 0%{transform:rotate(0deg) scale(1)} 50%{transform:rotate(180deg) scale(1.1)} 100%{transform:rotate(360deg) scale(1)} }
      `}</style>

      {/* ── PHASE 0 — "Attends un instant" ── */}
      <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "2rem" }}>
        <div style={{ ...fade(phase >= 0) }}>
          <p style={{
            fontFamily: T.serif, fontStyle: "italic",
            fontSize: "clamp(1.1rem, 4vw, 1.4rem)",
            color: T.brume, letterSpacing: "0.03em", lineHeight: 1.9,
          }}>
            Attends un instant.
          </p>
          <p style={{
            fontFamily: T.serif, fontStyle: "italic",
            fontSize: "clamp(1.1rem, 4vw, 1.4rem)",
            color: T.brume, marginTop: "0.3rem",
            ...fade(phase >= 0, 0.6),
          }}>
            ALBA t'écoute.
          </p>
        </div>

        {/* ── PHASE 1 — Prénom + étoile ── */}
        {phase >= 1 && (
          <div style={{ marginTop: "3.5rem", ...fade(phase >= 1) }}>
            {/* Étoile animée */}
            <div style={{
              fontSize: "1.4rem", color: T.or, marginBottom: "1.2rem",
              animation: "starSpin 8s linear infinite",
              display: "inline-block",
            }}>✦</div>
            <div style={{
              fontFamily: T.serif, fontWeight: 300,
              fontSize: "clamp(2.2rem, 9vw, 3.5rem)",
              color: T.orPale, letterSpacing: "0.08em",
              lineHeight: 1,
            }}>
              {data.prenom}
            </div>
            <div style={{
              marginTop: "0.8rem",
              fontFamily: T.sans, fontWeight: 300, fontSize: "0.68rem",
              letterSpacing: "0.6em", textTransform: "uppercase",
              color: T.brume, ...fade(phase >= 1, 0.5),
            }}>
              {isRationnel ? "profil d'accompagnement" : "portrait d'âme"}
            </div>
          </div>
        )}

        {/* ── PHASE 2 — Archétype ── */}
        {phase >= 2 && (
          <div style={{ marginTop: "2.5rem", ...fade(phase >= 2) }}>
            <div style={{
              display: "inline-flex", alignItems: "baseline", gap: "1rem",
              borderBottom: `1px solid ${T.or}33`, paddingBottom: "0.8rem",
            }}>
              {!isRationnel && (
                <span style={{
                  fontFamily: T.serif, fontSize: "3.5rem", fontWeight: 300,
                  color: T.or, lineHeight: 1, opacity: 0.85,
                }}>{cdv}</span>
              )}
              <span style={{
                fontFamily: T.serif, fontStyle: "italic",
                fontSize: "clamp(1.2rem, 4.5vw, 1.6rem)",
                color: T.orPale,
              }}>{chemin.titre}</span>
            </div>
            {sens === "spirituel" && !isRationnel && (
              <div style={{
                marginTop: "0.6rem",
                fontFamily: T.sans, fontWeight: 300, fontSize: "0.58rem",
                color: T.brume, letterSpacing: "0.2em",
                ...fade(phase >= 2, 0.4),
              }}>
                {CARTE_DATA[cdv]?.element || ""} · {CARTE_DATA[cdv]?.mot || ""}
              </div>
            )}
          </div>
        )}

        {/* ── PHASE 3 — Blessure ── */}
        {phase >= 3 && (
          <div style={{ marginTop: "2rem", ...fade(phase >= 3) }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "0.7rem",
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: blessure.couleur,
                boxShadow: `0 0 8px ${blessure.couleur}`,
              }} />
              <span style={{
                fontFamily: T.serif, fontStyle: "italic",
                fontSize: "clamp(1rem, 3.5vw, 1.25rem)",
                color: blessure.couleur, opacity: 0.9,
              }}>
                {isRationnel ? "Vulnérabilité · " : "Blessure · "}{blessure.nom}
              </span>
            </div>
          </div>
        )}

        {/* ── PHASE 4 — Citation ── */}
        {phase >= 4 && (
          <div style={{
            marginTop: "2.5rem", maxWidth: 340, margin: "2.5rem auto 0",
            ...fade(phase >= 4),
          }}>
            <p style={{
              fontFamily: T.serif, fontStyle: "italic",
              fontSize: "clamp(0.9rem, 3vw, 1.05rem)",
              color: T.orPale, lineHeight: 1.9, opacity: 0.85,
            }}>
              « {citation.texte} »
            </p>
            <p style={{
              marginTop: "0.6rem",
              fontFamily: T.sans, fontWeight: 300, fontSize: "0.6rem",
              letterSpacing: "0.35em", color: T.brume,
            }}>— {citation.auteur}</p>

            {/* Ligne shimmer sous la citation */}
            <div style={{
              marginTop: "2rem", height: "1px", width: "100%", overflow: "hidden",
              background: `${T.or}22`, position: "relative",
            }}>
              <div style={{
                position: "absolute", top: 0, left: 0, height: "100%", width: "30%",
                background: `linear-gradient(to right, transparent, ${T.or}88, transparent)`,
                animation: "shimmerLine 2.5s ease infinite",
              }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── Phase 5 : Portrait complet défilant ─────────────────────────────────
  return (
    <Screen style={{ maxWidth: 560, margin: "0 auto", paddingTop: "5vh" }}>
      <style>{`
        @keyframes cardReveal { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        .portrait-card { animation: cardReveal 0.9s ease forwards; opacity: 0; }
      `}</style>

      {/* ── En-tête : prénom + carte ── */}
      <div className="portrait-card" style={{ textAlign: "center", marginBottom: "2.5rem", animationDelay: "0s" }}>
        <div style={{
          fontFamily: T.sans, fontWeight: 300, fontSize: "0.68rem",
          letterSpacing: "0.55em", textTransform: "uppercase", color: T.brume, marginBottom: "1rem",
        }}>{isRationnel ? "profil d'accompagnement" : "portrait d'âme"}</div>

        {/* Carte ou symbole */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
          {!isRationnel
            ? <CarteAme data={data} />
            : (
              <div style={{
                width: 130, height: 130, borderRadius: "50%",
                border: `1.5px solid ${T.brume}44`,
                background: `radial-gradient(circle, ${T.or}10 0%, transparent 70%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontFamily: T.serif, fontSize: "2.8rem", color: T.or, opacity: 0.85 }}>◎</span>
              </div>
            )
          }
        </div>

        <div style={{
          fontFamily: T.serif, fontWeight: 300,
          fontSize: "clamp(2rem, 8vw, 2.8rem)",
          color: T.orPale, letterSpacing: "0.06em",
        }}>{data.prenom}</div>
      </div>

      {/* ── Chemin de vie ── */}
      <div className="portrait-card" style={{
        background: `linear-gradient(135deg, ${T.nuit2} 0%, #2A2420 100%)`,
        border: `1px solid ${T.or}33`, borderRadius: "6px", padding: "1.8rem",
        marginBottom: "1rem", position: "relative", overflow: "hidden",
        animationDelay: "0.15s",
      }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 140, height: 140, borderRadius: "50%", background: `radial-gradient(circle, ${T.or}10, transparent 70%)` }} />
        <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem", letterSpacing: "0.5em", textTransform: "uppercase", color: T.brume, marginBottom: "0.7rem" }}>{labelChemin}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.8rem", marginBottom: "0.5rem" }}>
          {!isRationnel && <span style={{ fontFamily: T.serif, fontSize: "2.6rem", fontWeight: 300, color: T.or, lineHeight: 1 }}>{cdv}</span>}
          <span style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "1.2rem", color: T.orPale }}>{chemin.titre}</span>
        </div>
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.95rem", color: T.aube, opacity: 0.92, lineHeight: 1.75 }}>{chemin.essence}</p>
        {sens === "spirituel" && !isRationnel && (
          <div style={{ marginTop: "0.7rem", fontFamily: T.sans, fontWeight: 300, fontSize: "0.58rem", color: T.brume, letterSpacing: "0.15em" }}>
            {CARTE_DATA[cdv]?.element || ""} · {CARTE_DATA[cdv]?.mot || ""}
          </div>
        )}
      </div>

      {/* ── Blessure ── */}
      <div className="portrait-card" style={{
        background: `linear-gradient(135deg, ${T.nuit2} 0%, #2A2420 100%)`,
        border: `1px solid ${blessure.couleur}44`, borderRadius: "6px", padding: "1.5rem",
        marginBottom: "1rem", animationDelay: "0.3s",
      }}>
        <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem", letterSpacing: "0.5em", textTransform: "uppercase", color: T.brume, marginBottom: "0.6rem" }}>{labelBlessure}</div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.4rem" }}>
          <div style={{ width: 7, height: 7, background: blessure.couleur, borderRadius: "50%", boxShadow: `0 0 6px ${blessure.couleur}` }} />
          <span style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "1.15rem", color: T.orPale }}>{blessure.nom}</span>
        </div>
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.9rem", color: T.aube, opacity: 0.88, lineHeight: 1.75 }}>{blessure.question}</p>
      </div>

      {/* ── Citation ── */}
      <div className="portrait-card" style={{
        padding: "1.5rem", borderLeft: `2px solid ${T.or}55`,
        marginBottom: "1rem", animationDelay: "0.45s",
      }}>
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "1rem", color: T.orPale, lineHeight: 1.85, marginBottom: "0.5rem" }}>
          « {citation.texte} »
        </p>
        <p style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.6rem", letterSpacing: "0.3em", color: T.brume }}>— {citation.auteur}</p>
      </div>

      {/* ── Livre ── */}
      <div className="portrait-card" style={{
        background: `linear-gradient(135deg, ${T.nuit2} 0%, #2A2420 100%)`,
        border: `1px solid ${T.brume}22`, borderRadius: "6px", padding: "1.4rem",
        marginBottom: "1rem", animationDelay: "0.6s",
        display: "flex", alignItems: "center", gap: "1.2rem",
      }}>
        <div style={{
          width: 40, height: 54, flexShrink: 0,
          background: `linear-gradient(135deg, ${T.or}33, ${T.aurore}22)`,
          border: `1px solid ${T.or}44`, borderRadius: "2px",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke={T.or} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            <line x1="9" y1="7" x2="15" y2="7" opacity="0.6"/>
            <line x1="9" y1="11" x2="13" y2="11" opacity="0.4"/>
          </svg></div>
        <div>
          <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem", letterSpacing: "0.4em", textTransform: "uppercase", color: T.brume, marginBottom: "0.3rem" }}>Lecture pour toi</div>
          <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "1rem", color: T.orPale }}>{livre.titre}</div>
          <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.65rem", color: T.brume, marginTop: "0.2rem" }}>{livre.auteur}</div>
        </div>
      </div>

      {/* ── Première Clé ── */}
      <div className="portrait-card" style={{
        border: `1px solid ${cle.couleur}44`, borderRadius: "6px", padding: "1.4rem",
        marginBottom: "2.5rem", background: `${cle.couleur}08`, animationDelay: "0.75s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.4rem" }}>
          <span style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.8rem", color: cle.couleur, opacity: 0.92 }}>Clé {cle.num}</span>
          <span style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "1.1rem", color: T.orPale }}>{cle.nom}</span>
        </div>
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.9rem", color: T.aube, opacity: 0.92, lineHeight: 1.75 }}>{cle.desc}</p>
      </div>

      <div className="portrait-card" style={{ textAlign: "center", animationDelay: "0.9s" }}>
        <Btn onClick={onContinue}>Entrer dans ALBA</Btn>
      </div>
    </Screen>
  );
};

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
const NavItem = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} style={{
    background: "none", border: "none", cursor: "pointer",
    display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem",
    padding: "0.5rem 0.8rem",
    color: active ? T.or : T.brume,
    transition: "color 0.25s",
    flexShrink: 0,
  }}>
    <span style={{ fontSize: "1.1rem" }}>{icon}</span>
    <span style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem", letterSpacing: "0.3em", textTransform: "uppercase" }}>{label}</span>
  </button>
);

// ─── MOTEUR DE PROGRESSION ────────────────────────────────────────────────────
// La clé se débloque par l'engagement réel, pas le temps seul.
// Conditions par clé :
//  I   → toujours active (entrée)
//  II  → 3 post-its posés + 1 conversation
//  III → 2 jours distincts d'ardoise + 1 exercice souffle
//  IV  → 5 jours actifs total + bilan ardoise généré
//  V   → 10 jours actifs + 3 bilans générés
//  VI  → toutes les conditions précédentes + 20 jours actifs

const calcEclats = (stats) => {
  return (
    ((stats.joursActifs    || 0) * ECLATS_PAR_ACTE.jour_actif) +
    ((stats.postitsTotal   || 0) * ECLATS_PAR_ACTE.fragment) +
    ((stats.conversationsTotal || 0) * ECLATS_PAR_ACTE.miroir) +
    ((stats.souffleTotal   || 0) * ECLATS_PAR_ACTE.souffle) +
    ((stats.bilansTotal    || 0) * ECLATS_PAR_ACTE.bilan) +
    ((stats.tempetesNommees  || 0) * ECLATS_PAR_ACTE.tempete_nommee) +
    ((stats.tempetesTraversees || 0) * ECLATS_PAR_ACTE.tempete_traversee)
  );
};

const calcProgressionCle = (stats) => {
  const eclats = calcEclats(stats);
  for (let i = SEUILS_PORTES.length - 1; i >= 0; i--) {
    if (eclats >= SEUILS_PORTES[i]) return i;
  }
  return 0;
};

const getConditionsCle = (idx, stats) => {
  const { joursActifs, postitsTotal, conversationsTotal, bilansTotal, souffleTotal } = stats;
  const conditions = [
    null, // Clé I toujours active
    [ // Clé II
      { label: "3 pensées posées sur l'ardoise", done: postitsTotal >= 3, val: Math.min(postitsTotal, 3), max: 3 },
      { label: "1 conversation avec ALBA",       done: conversationsTotal >= 1, val: Math.min(conversationsTotal,1), max: 1 },
    ],
    [ // Clé III
      { label: "2 jours d'ardoise",              done: joursActifs >= 2, val: Math.min(joursActifs,2), max: 2 },
      { label: "1 exercice de souffle",          done: souffleTotal >= 1, val: Math.min(souffleTotal,1), max: 1 },
    ],
    [ // Clé IV
      { label: "5 jours actifs",                 done: joursActifs >= 5, val: Math.min(joursActifs,5), max: 5 },
      { label: "1 bilan d'ardoise généré",       done: bilansTotal >= 1, val: Math.min(bilansTotal,1), max: 1 },
    ],
    [ // Clé V
      { label: "10 jours actifs",                done: joursActifs >= 10, val: Math.min(joursActifs,10), max: 10 },
      { label: "3 bilans générés",               done: bilansTotal >= 3, val: Math.min(bilansTotal,3), max: 3 },
    ],
    [ // Clé VI
      { label: "20 jours actifs",                done: joursActifs >= 20, val: Math.min(joursActifs,20), max: 20 },
      { label: "Toutes les clés précédentes",    done: bilansTotal >= 3 && joursActifs >= 20, val: bilansTotal >= 3 && joursActifs >= 20 ? 1 : 0, max: 1 },
    ],
  ];
  return conditions[idx] || null;
};

// ─── ANIMATION PORTE ─────────────────────────────────────────────────────────
// Deux battants qui s'ouvrent. De la lumière. Un symbole. Une phrase.
// C'est le moment le plus important de l'application.
const PorteAnimation = ({ cleIndex, onEnd }) => {
  const [phase, setPhase] = useState("fermee"); // fermee → ouverture → lumiere → phrase → fondu
  const lumiere = getLumierePorte();
  const symbole = SYMBOLES_CLES[cleIndex];
  const cle = CLES[cleIndex];
  const isNuit = lumiere.name === "nuit";

  useEffect(() => {
    // Séquence cinématique
    const t1 = setTimeout(() => setPhase("ouverture"), 400);
    const t2 = setTimeout(() => setPhase("lumiere"),   1600);
    const t3 = setTimeout(() => setPhase("phrase"),    2800);
    const t4 = setTimeout(() => setPhase("fondu"),     5500);
    const t5 = setTimeout(() => onEnd(),               6200);
    return () => [t1,t2,t3,t4,t5].forEach(clearTimeout);
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: isNuit ? "#0A0806" : "#1A1208",
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden",
      opacity: phase === "fondu" ? 0 : 1,
      transition: "opacity 0.7s ease",
    }}>

      {/* ── Lumière qui inonde depuis le centre ── */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at center, ${lumiere.primary}${isNuit ? "55" : "88"} 0%, transparent 70%)`,
        opacity: ["lumiere","phrase","fondu"].includes(phase) ? 1 : 0,
        transition: "opacity 1.4s ease",
      }}/>

      {/* ── Battant gauche ── */}
      <div style={{
        position: "absolute",
        left: 0, top: 0, width: "50%", height: "100%",
        background: `linear-gradient(to right, #131110, #1E1A16)`,
        borderRight: `1px solid ${lumiere.primary}30`,
        transformOrigin: "left center",
        transform: phase === "fermee" ? "rotateY(0deg)" : "rotateY(-42deg)",
        transition: "transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        transformStyle: "preserve-3d",
        boxShadow: "4px 0 30px #00000066",
        // Texture bois/or sur le battant
        backgroundImage: `repeating-linear-gradient(
          180deg,
          transparent 0px,
          transparent 48px,
          ${lumiere.primary}08 48px,
          ${lumiere.primary}08 50px
        )`,
      }}>
        {/* Poignée gauche */}
        <div style={{
          position: "absolute", right: "12%", top: "50%",
          transform: "translateY(-50%)",
          width: 8, height: 40, borderRadius: 4,
          background: lumiere.primary, opacity: 0.6,
        }}/>
      </div>

      {/* ── Battant droit ── */}
      <div style={{
        position: "absolute",
        right: 0, top: 0, width: "50%", height: "100%",
        background: `linear-gradient(to left, #131110, #1E1A16)`,
        borderLeft: `1px solid ${lumiere.primary}30`,
        transformOrigin: "right center",
        transform: phase === "fermee" ? "rotateY(0deg)" : "rotateY(42deg)",
        transition: "transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        transformStyle: "preserve-3d",
        boxShadow: "-4px 0 30px #00000066",
        backgroundImage: `repeating-linear-gradient(
          180deg,
          transparent 0px,
          transparent 48px,
          ${lumiere.primary}08 48px,
          ${lumiere.primary}08 50px
        )`,
      }}>
        {/* Poignée droite */}
        <div style={{
          position: "absolute", left: "12%", top: "50%",
          transform: "translateY(-50%)",
          width: 8, height: 40, borderRadius: 4,
          background: lumiere.primary, opacity: 0.6,
        }}/>
      </div>

      {/* ── Contenu central (symbole + phrase) ── */}
      <div style={{
        position: "relative", zIndex: 10,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: "1.4rem",
        opacity: ["phrase","fondu"].includes(phase) ? 1 : 0,
        transform: ["phrase","fondu"].includes(phase) ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 1s ease, transform 1s ease",
        padding: "0 2rem", textAlign: "center",
      }}>
        {/* Numéro de clé */}
        <div style={{
          fontFamily: "'Georgia', serif", fontStyle: "italic",
          fontSize: "0.75rem", letterSpacing: "0.5em",
          color: lumiere.primary, opacity: 0.7,
          textTransform: "uppercase",
        }}>
          Clé {cle.num}
        </div>

        {/* Symbole */}
        <div style={{
          fontSize: "3.2rem",
          filter: `drop-shadow(0 0 24px ${lumiere.primary}99)`,
        }}>
          {symbole.emoji}
        </div>

        {/* Nom de la Clé */}
        <div style={{
          fontFamily: "'Georgia', serif",
          fontSize: "clamp(1.6rem, 5vw, 2.4rem)",
          color: "#F5EFE6",
          letterSpacing: "0.12em",
        }}>
          {cle.nom}
        </div>

        {/* Ligne d'or */}
        <div style={{
          width: 48, height: 1,
          background: lumiere.primary,
          opacity: 0.6,
        }}/>

        {/* Phrase ALBA */}
        <div style={{
          fontFamily: "'Georgia', serif", fontStyle: "italic",
          fontSize: "clamp(0.95rem, 2.5vw, 1.15rem)",
          color: "#8C7F74",
          maxWidth: 280, lineHeight: 1.7,
        }}>
          {symbole.phrase}
        </div>

        {/* Mot d'ALBA */}
        <div style={{
          fontFamily: "'Georgia', serif",
          fontSize: "0.65rem", letterSpacing: "0.45em",
          color: lumiere.primary, opacity: 0.5,
          textTransform: "uppercase", marginTop: "0.5rem",
        }}>
          ALBA
        </div>
      </div>

      {/* ── Particules d'éclats ── */}
      {["phrase","fondu"].includes(phase) && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {[...Array(12)].map((_, i) => (
            <div key={i} style={{
              position: "absolute",
              left: `${10 + (i * 7.2) % 80}%`,
              top: `${15 + (i * 11.3) % 70}%`,
              width: i % 3 === 0 ? 3 : 2,
              height: i % 3 === 0 ? 3 : 2,
              borderRadius: "50%",
              background: lumiere.primary,
              opacity: 0.15 + (i % 5) * 0.08,
              animation: `pulse-eclat ${1.5 + (i % 4) * 0.4}s ease-in-out infinite`,
              animationDelay: `${(i % 3) * 0.3}s`,
            }}/>
          ))}
        </div>
      )}

      <style>{`
        @keyframes pulse-eclat {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.6); }
        }
      `}</style>
    </div>
  );
};

// ─── COMPOSANT PROGRESSION ────────────────────────────────────────────────────
const ProgressionCles = ({ stats, clesDebloquees, onSelectCle, cleActive }) => {
  const [expanded, setExpanded] = useState(null);

  return (
    <div style={{ padding: "0 1.5rem 2rem" }}>
      <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.65rem", letterSpacing: "0.5em", textTransform: "uppercase", color: T.brume, marginBottom: "1.2rem" }}>
        Ton chemin · {clesDebloquees + 1} / 6
      </div>

      {/* Barre de progression globale */}
      <div style={{ marginBottom: "1.8rem" }}>
        <div style={{ height: 2, background: `${T.brume}35`, borderRadius: 1, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${((clesDebloquees) / 5) * 100}%`,
            background: `linear-gradient(to right, ${CLES[0].couleur}, ${T.or})`,
            borderRadius: 1,
            transition: "width 0.8s ease",
          }}/>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {CLES.map((cle, i) => {
          const debloquee = i <= clesDebloquees;
          const estActive = i === cleActive;
          const estSuivante = i === clesDebloquees + 1;
          const conditions = getConditionsCle(i, stats);
          const isExpanded = expanded === i;

          return (
            <div key={cle.num}>
              <button
                onClick={() => {
                  if (debloquee) { onSelectCle(i); }
                  setExpanded(isExpanded ? null : i);
                }}
                style={{
                  width: "100%", textAlign: "left", cursor: debloquee ? "pointer" : "default",
                  background: estActive
                    ? `linear-gradient(135deg, ${cle.couleur}18, ${T.nuit2})`
                    : debloquee ? `${T.nuit2}` : "transparent",
                  border: estActive
                    ? `1px solid ${cle.couleur}55`
                    : debloquee ? `1px solid ${T.brume}25` : `1px solid ${T.brume}12`,
                  borderLeft: debloquee ? `3px solid ${cle.couleur}` : `3px solid ${T.brume}20`,
                  borderRadius: "4px",
                  padding: "0.9rem 1.1rem",
                  transition: "all 0.25s",
                  opacity: !debloquee && !estSuivante ? 0.35 : 1,
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                  {/* Numéro / état */}
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    border: `1px solid ${debloquee ? cle.couleur + "70" : T.brume + "30"}`,
                    background: estActive ? `${cle.couleur}20` : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: T.serif, fontStyle: "italic", fontSize: "0.75rem",
                    color: debloquee ? cle.couleur : T.brume,
                  }}>
                    {debloquee && !estActive ? "✓" : cle.num}
                  </div>

                  {/* Nom + état */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <span style={{
                        fontFamily: T.serif, fontStyle: "italic",
                        fontSize: "1rem",
                        color: debloquee ? T.orPale : T.brume,
                      }}>{cle.nom}</span>
                      {estActive && (
                        <span style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.58rem", letterSpacing: "0.35em", textTransform: "uppercase", color: cle.couleur, opacity: 0.92 }}>
                          en cours
                        </span>
                      )}
                      {!debloquee && estSuivante && (
                        <span style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.58rem", letterSpacing: "0.35em", textTransform: "uppercase", color: T.brume, opacity: 0.5 }}>
                          prochaine
                        </span>
                      )}
                    </div>
                    {estActive && (
                      <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.78rem", color: T.brume, marginTop: "0.2rem", lineHeight: 1.5 }}>
                        {cle.desc}
                      </p>
                    )}
                  </div>

                  {/* Flèche expand */}
                  {(!debloquee || estSuivante) && conditions && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.brume} strokeWidth="1.5" strokeLinecap="round" style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0, opacity: 0.5 }}>
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  )}
                </div>
              </button>

              {/* Conditions à remplir */}
              {isExpanded && conditions && !debloquee && (
                <div style={{
                  background: `${T.nuit2}`,
                  border: `1px solid ${T.brume}15`,
                  borderTop: "none", borderRadius: "0 0 4px 4px",
                  padding: "0.9rem 1.1rem 1rem 1.1rem",
                  animation: "fadeUp 0.2s ease forwards",
                }}>
                  <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.62rem", letterSpacing: "0.4em", textTransform: "uppercase", color: T.brume, marginBottom: "0.8rem", opacity: 0.6 }}>
                    Pour débloquer
                  </div>
                  {conditions.map((c, ci) => (
                    <div key={ci} style={{ marginBottom: "0.6rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                        <span style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.82rem", color: c.done ? T.or : T.aube, opacity: c.done ? 1 : 0.6 }}>
                          {c.done ? "✦ " : ""}{c.label}
                        </span>
                        <span style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.65rem", color: T.brume, opacity: 0.5 }}>
                          {c.val}/{c.max}
                        </span>
                      </div>
                      <div style={{ height: 2, background: `${T.brume}35`, borderRadius: 1 }}>
                        <div style={{
                          height: "100%", borderRadius: 1,
                          width: `${(c.val / c.max) * 100}%`,
                          background: c.done ? T.or : cle.couleur,
                          transition: "width 0.5s ease",
                        }}/>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── ACCUEIL ──────────────────────────────────────────────────────────────────
// ─── ÉCHOS HUMAINS ────────────────────────────────────────────────────────────
// 40 fragments vrais — imparfaits, humains, pas des aphorismes
const ECHOS_HUMAINS = [
  "Je crois que j'ai besoin de moins en faire pour les autres.",
  "Aujourd'hui j'ai pleuré sans vraiment savoir pourquoi. Ça a fait du bien.",
  "Je commence à accepter que je ne saurai peut-être jamais pourquoi ça s'est passé comme ça.",
  "J'ai réalisé ce soir que j'attends encore des excuses qui ne viendront pas.",
  "Je crois que je confonds être fort et ne pas sentir.",
  "Quelque chose en moi commence à lâcher. Je ne sais pas si c'est bien ou pas.",
  "J'aimerais être plus doux avec moi-même. Je ne sais pas encore comment.",
  "Je me suis surpris à sourire aujourd'hui. Ça faisait longtemps.",
  "J'ai l'impression que je guéris en dormant. Comme si la nuit faisait quelque chose que le jour ne peut pas faire.",
  "Ce soir je n'arrive pas à être là où je suis. Je suis ailleurs.",
  "Je réalise que j'ai passé des années à attendre la permission de quelqu'un.",
  "Je crois que j'ai besoin de silence. Pas de solitude — de silence.",
  "Aujourd'hui quelqu'un m'a dit que j'avais l'air bien. Je ne sais pas si c'est vrai.",
  "J'essaie de ne plus m'expliquer autant. C'est plus épuisant qu'on ne le croit.",
  "Je reviens souvent à la même question : est-ce que j'ai bien fait ?",
  "Ce soir j'ai l'impression que tout ce que je traverse a une forme. Je ne la vois pas encore.",
  "J'ai relu quelque chose que j'avais écrit il y a trois mois. Je me reconnaissais à peine.",
  "Je commence à comprendre que certaines personnes ne changeront pas. C'est dur.",
  "J'aimerais pouvoir dire merci à quelqu'un qui n'est plus là.",
  "Ce matin j'avais peur sans raison précise. Juste peur.",
  "Je crois que je m'isole quand j'aurais besoin de l'inverse.",
  "Aujourd'hui j'ai fait une chose que je remettais depuis longtemps. Rien d'extraordinaire. Mais ça comptait.",
  "Je réalise que je parle beaucoup mais que je dis rarement ce que je ressens vraiment.",
  "Ce soir j'ai l'impression de tenir quelque chose de fragile. Je ne veux pas l'abîmer.",
  "Parfois la fatigue n'est pas physique. C'est une fatigue d'avoir fait semblant.",
  "Je crois que j'ai besoin d'entendre que ça va aller. Même si je ne suis pas sûr que ce soit vrai.",
  "Aujourd'hui j'ai choisi de ne pas me justifier. C'était étrange. Et bien.",
  "Je reviens toujours au même endroit en moi. Comme si quelque chose m'attendait là.",
  "Ce matin la lumière était différente. Je ne sais pas ce que ça voulait dire mais ça m'a touché.",
  "Je commence à accepter que certaines choses ne se réparent pas — elles se transforment.",
  "J'ai passé la journée à faire comme si. Ce soir je n'ai plus la force.",
  "Quelqu'un m'a dit quelque chose de vrai aujourd'hui. Je ne m'y attendais pas.",
  "Je crois que ce que je cherche n'est pas dehors.",
  "Ce soir j'ai envie de rien faire. Et pour une fois je me permets.",
  "J'ai réalisé que je demande toujours pardon alors que ce n'est pas moi qui ai eu tort.",
  "Aujourd'hui j'ai eu l'impression que quelque chose en moi recommençait doucement.",
  "Je ne sais pas où je vais. Mais je sens que je suis en train de marcher dans la bonne direction.",
  "Ce soir je n'arrive pas à dormir. Pas d'angoisse. Juste trop de choses qui tournent.",
  "J'ai essayé d'être gentil avec moi-même aujourd'hui. C'est plus difficile que d'être gentil avec quelqu'un d'autre.",
  "Je crois que traverser quelque chose et en parler, c'est déjà commencer à le poser.",
];

const getEchoHumain = () => {
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return ECHOS_HUMAINS[dayIndex % ECHOS_HUMAINS.length];
};

// ─── ACCUEIL ──────────────────────────────────────────────────────────────────
// ─── BAROMÈTRE NERVEUX ────────────────────────────────────────────────────────
// Basé sur la théorie polyvagale de Stephen Porges
const ETATS_NERVEUX = [
  {
    id: "securite",
    label: "En sécurité",
    sous: "Je me sens ancré, présent",
    couleur: "#7BA88A",
    icone: "◉",
    description: "Ton système nerveux est en mode connexion. C'est le sol fertile pour réfléchir, créer, ressentir en profondeur.",
    suggestion: "Profite de cette clarté — c'est le bon moment pour explorer quelque chose de nouveau.",
  },
  {
    id: "mobilise",
    label: "Mobilisé",
    sous: "Agité, tendu ou hyperactif",
    couleur: "#C8A040",
    icone: "◈",
    description: "Ton système sympathique est activé. Ton corps est en alerte. Ce n'est pas un défaut — c'est de l'énergie.",
    suggestion: "Avant d'aller plus loin, essaie 4 respirations lentes. Expire deux fois plus long que l'inspire.",
  },
  {
    id: "fige",
    label: "Figé",
    sous: "Engourdi, déconnecté",
    couleur: "#8888AA",
    icone: "◌",
    description: "Ton système nerveux est en mode protection. Le gel est une réponse sage face à l'accablement.",
    suggestion: "Pose une main sur ton cœur. Sens sa chaleur. Tu n'as rien à faire d'autre pour l'instant.",
  },
  {
    id: "effondre",
    label: "Effondré",
    sous: "Épuisé, submergé",
    couleur: "#A87878",
    icone: "○",
    description: "Tu portes beaucoup. Le système nerveux peut s'épuiser. Ce que tu ressens est réel et légitime.",
    suggestion: "Aujourd'hui, une seule chose compte : te reposer sans te juger. ALBA reste là.",
  },
];

// Analyse des patterns du baromètre sur 14 jours
const analysePatternNerveux = () => {
  try {
    const history = JSON.parse(localStorage.getItem("alba_barometre_history") || "{}");
    const entries = Object.entries(history)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 14);

    if (entries.length < 5) return null;

    const counts = { securite: 0, mobilise: 0, fige: 0, effondre: 0 };
    entries.forEach(([, etat]) => { if (counts[etat] !== undefined) counts[etat]++; });

    const total = entries.length;
    const dominant = Object.entries(counts).sort(([,a],[,b]) => b - a)[0];
    const [id, count] = dominant;
    const pct = Math.round((count / total) * 100);

    // Détecter les alternances mobilisé/effondré
    const vals = entries.map(([,e]) => e);
    let alternances = 0;
    for (let i = 0; i < vals.length - 1; i++) {
      if ((vals[i] === "mobilise" && vals[i+1] === "effondre") ||
          (vals[i] === "effondre" && vals[i+1] === "mobilise")) alternances++;
    }

    if (alternances >= 3) {
      return { type: "cycle", message: "Ton système nerveux oscille entre mobilisation et effondrement depuis plusieurs jours. Ce cycle est épuisant — et reconnaissable." };
    }

    if (id === "securite" && pct >= 60) {
      return { type: "stable", message: `Sur ${total} jours observés, tu étais ancré ${pct}% du temps. Quelque chose te stabilise en ce moment.` };
    }
    if (id === "effondre" && pct >= 50) {
      return { type: "alerte", message: `Plusieurs jours de suite en mode effondrement. Ce n'est pas une fragilité — c'est un signal. Ton corps demande quelque chose.` };
    }
    if (id === "mobilise" && pct >= 60) {
      return { type: "tension", message: `Tu es en état d'alerte depuis ${count} jours sur ${total}. Ton système sympathique travaille fort. Il mérite du repos.` };
    }
    if (id === "fige" && pct >= 40) {
      return { type: "gel", message: `L'engourdissement revient souvent. Le gel est une protection — mais il mérite d'être nommé, doucement.` };
    }
    return null;
  } catch { return null; }
};

const BarometreNerveux = () => {
  const todayKey = new Date().toISOString().split("T")[0];
  const storageKey = "alba_barometre_" + todayKey;

  const [etatChoisi, setEtatChoisi] = useState(() => {
    try { return localStorage.getItem(storageKey) || null; } catch { return null; }
  });
  const [showDetail, setShowDetail] = useState(!!localStorage.getItem(storageKey));
  const [pressed, setPressed] = useState(null);

  const choisir = (id) => {
    setEtatChoisi(id);
    try {
      localStorage.setItem(storageKey, id);
      // Historique pour pattern detection
      const history = JSON.parse(localStorage.getItem("alba_barometre_history") || "{}");
      history[todayKey] = id;
      localStorage.setItem("alba_barometre_history", JSON.stringify(history));
    } catch {}
    setTimeout(() => setShowDetail(true), 300);
  };

  const etat = ETATS_NERVEUX.find(e => e.id === etatChoisi);

  return (
    <div style={{ margin: "1.5rem 1rem 0", padding: "1.2rem 1.2rem 1rem", background: `linear-gradient(135deg, #161310, #1A1612)`, borderRadius: "8px", border: `1px solid ${T.or}18` }}>

      {!etatChoisi || !showDetail ? (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
            <div>
              <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.58rem", letterSpacing: "0.45em", textTransform: "uppercase", color: T.brume, marginBottom: "0.25rem" }}>
                Baromètre nerveux
              </div>
              <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.95rem", color: T.aube }}>
                Où est ton système nerveux là ?
              </div>
            </div>
            <div style={{ fontSize: "0.65rem", color: `${T.brume}66`, fontFamily: T.sans }}>Polyvagal</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.55rem", marginTop: "1rem" }}>
            {ETATS_NERVEUX.map(e => (
              <button
                key={e.id}
                onMouseDown={() => setPressed(e.id)}
                onMouseUp={() => setPressed(null)}
                onTouchStart={() => setPressed(e.id)}
                onTouchEnd={() => setPressed(null)}
                onClick={() => choisir(e.id)}
                style={{
                  background: pressed === e.id ? `${e.couleur}20` : `${e.couleur}0C`,
                  border: `1px solid ${e.couleur}${pressed === e.id ? "66" : "33"}`,
                  borderRadius: "6px", padding: "0.75rem 0.6rem",
                  cursor: "pointer", textAlign: "left",
                  transform: pressed === e.id ? "scale(0.96)" : "scale(1)",
                  transition: "all 0.15s ease",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <div style={{ fontSize: "1rem", color: e.couleur, marginBottom: "0.3rem" }}>{e.icone}</div>
                <div style={{ fontFamily: T.serif, fontSize: "0.88rem", color: T.aube, fontStyle: "italic", marginBottom: "0.15rem" }}>{e.label}</div>
                <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.62rem", color: `${T.brume}AA`, letterSpacing: "0.02em", lineHeight: 1.4 }}>{e.sous}</div>
              </button>
            ))}
          </div>
        </>
      ) : etat ? (
        <div style={{ animation: "fadeUp 0.6s ease forwards" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", marginBottom: "0.8rem" }}>
            <div style={{ fontSize: "1.1rem", color: etat.couleur }}>{etat.icone}</div>
            <div>
              <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.95rem", color: T.aube }}>{etat.label}</div>
              <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.6rem", letterSpacing: "0.35em", textTransform: "uppercase", color: `${etat.couleur}AA` }}>aujourd'hui</div>
            </div>
            <button onClick={() => { setEtatChoisi(null); setShowDetail(false); try { localStorage.removeItem(storageKey); } catch {} }} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: `${T.brume}55`, fontSize: "0.7rem", fontFamily: T.sans }}>
              changer
            </button>
          </div>
          <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.88rem", color: T.brume, lineHeight: 1.75, margin: "0 0 0.7rem" }}>
            {etat.description}
          </p>
          <div style={{ borderTop: `1px solid ${etat.couleur}22`, paddingTop: "0.7rem" }}>
            <p style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.75rem", color: `${etat.couleur}DD`, letterSpacing: "0.02em", lineHeight: 1.6, margin: 0 }}>
              → {etat.suggestion}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

// ─── ACCUEIL ─────────────────────────────────────────────────────────────────
const Accueil = ({ data, onNavigate, cleActive = 0, progressStats }) => {
  if (!data) return null;
  const cdv = cheminDeVie(data.naissance);
  const chemin = CHEMINS[cdv] || CHEMINS[9];
  const cle = CLES[cleActive] || CLES[0];
  const citation = CITATIONS[cdv % CITATIONS.length];
  const { blessure, hasCroissance, hasDual } = getContextProfil(data);
  const livre = LIVRES[blessure.nom] || LIVRES["Abandon"];

  const heure = new Date().getHours();
  const salut = heure < 6 ? "Tu veilles encore" : heure < 12 ? "Bonjour" : heure < 18 ? "Bon après-midi" : "Bonsoir";
  const momentLabel = heure < 6 ? "En pleine nuit" : heure < 12 ? "Ce matin" : heure < 18 ? "Cet après-midi" : "Ce soir";
  const isMatin = heure >= 5 && heure < 12;
  const phraseDuJour = getPhraseduJour(cleActive);

  // ── Mémoire de présence ──────────────────────────────────────────────────
  const getPresenceAlba = () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const lastVisit = localStorage.getItem("alba_last_visit");
      const streakRaw = localStorage.getItem("alba_streak") || "0";
      const streak = parseInt(streakRaw, 10);
      const alreadyGreeted = localStorage.getItem("alba_greeted_" + today);

      // Mettre à jour le streak et la dernière visite
      if (!alreadyGreeted) {
        localStorage.setItem("alba_greeted_" + today, "1");
        if (lastVisit) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const wasYesterday = lastVisit === yesterday.toISOString().split("T")[0];
          localStorage.setItem("alba_streak", wasYesterday ? streak + 1 : 1);
        } else {
          localStorage.setItem("alba_streak", "1");
        }
        localStorage.setItem("alba_last_visit", today);
      }

      // Pas de phrase si première visite ou déjà salué aujourd'hui
      if (!lastVisit || alreadyGreeted) return null;

      const joursAbsence = Math.floor(
        (new Date(today) - new Date(lastVisit)) / (1000 * 60 * 60 * 24)
      );
      const streakActuel = alreadyGreeted ? streak : parseInt(localStorage.getItem("alba_streak") || "1", 10);

      if (joursAbsence >= 14) return "Tu reviens après un long moment. ALBA était là.";
      if (joursAbsence >= 7)  return "Une semaine. Quelque chose t'a ramené ici.";
      if (joursAbsence >= 3)  return "Tu étais parti quelques jours. Bienvenue.";
      if (joursAbsence >= 2)  return "Tu reviens. Quelque chose t'a ramené ici.";
      if (streakActuel >= 7)  return "Sept jours de suite. Tu as fait de cet endroit quelque chose de réel.";
      if (streakActuel >= 3)  return `${streakActuel} soirs de suite. Il se passe quelque chose.`;
      return null;
    } catch { return null; }
  };
  const phrasePresence = getPresenceAlba();


  // Analyse les mots des post-its des 7 derniers jours
  const getMiroirSemaine = () => {
    if (!progressStats?.allPostits) return null;
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
    const STOPS = new Set(["je","tu","il","elle","on","nous","vous","ils","elles","le","la","les","un","une","des","de","du","en","et","ou","à","au","aux","est","sont","était","ai","as","a","avons","avez","ont","me","te","se","ma","ta","sa","mon","ton","son","ce","qui","que","qu","ne","pas","plus","très","aussi","mais","donc","car","ni","pour","par","sur","sous","dans","avec","sans","ça","c","j","n","s","m","d","l","y","bien","même","tout","toujours","jamais","encore","quand","si","comme","où"]);
    const freq = {};
    Object.entries(progressStats.allPostits || {}).forEach(([dateKey, posts]) => {
      if (new Date(dateKey + "T00:00:00") < cutoff) return;
      posts.forEach(p => {
        p.texte.toLowerCase()
          .replace(/[^a-zàâäéèêëîïôùûüç\s]/g, " ")
          .split(/\s+/)
          .filter(w => w.length > 3 && !STOPS.has(w))
          .forEach(w => { freq[w] = (freq[w] || 0) + 1; });
      });
    });
    const sorted = Object.entries(freq).sort((a,b) => b[1]-a[1]).slice(0,4);
    const total = Object.values(progressStats.allPostits || {}).reduce((s, a) => s + a.length, 0);
    if (sorted.length < 2 || total < 3) return null;
    return sorted.map(([mot]) => mot);
  };
  const miroirMots = getMiroirSemaine();

  // ── Mémoire — fragment passé (7-21 jours) ──────────────────────────────────
  const getFragmentMémoire = () => {
    if (!progressStats?.allPostits) return null;
    // Une fois par semaine — affiché les lundis et mercredis
    const jour = new Date().getDay();
    if (jour !== 1 && jour !== 3) return null;
    const today = new Date();
    // Cherche un postit entre 7 et 21 jours en arrière
    const candidats = [];
    Object.entries(progressStats.allPostits || {}).forEach(([dateKey, posts]) => {
      const d = new Date(dateKey + "T00:00:00");
      const diff = Math.floor((today - d) / (1000 * 60 * 60 * 24));
      if (diff >= 7 && diff <= 21) {
        posts.forEach(p => {
          if (p.texte && p.texte.trim().length > 15) {
            candidats.push({ texte: p.texte.trim(), diff });
          }
        });
      }
    });
    if (candidats.length === 0) return null;
    // Choisit le plus récent dans la fenêtre
    candidats.sort((a, b) => a.diff - b.diff);
    return candidats[0];
  };
  const fragmentMémoire = getFragmentMémoire();

  const ENTREES = [
    { id: "presence", label: "Présence",  desc: "Un reflet intérieur",         couleur: "#7B9EA8" },
    { id: "ardoise",  label: "Ardoise",   desc: "Poser ce qui traverse", couleur: "#C8A96E" },
    { id: "evasion",  label: "Évasion",   desc: "Un espace de beauté",   couleur: "#9EC8B4" },
    { id: "souffle",  label: "Souffle",   desc: "Respirer",              couleur: "#D4856A" },
  ];

  // Vidéo selon l'heure
  const [heroVideo] = useState(() => getVideoAmbiance());

  return (
    <div style={{ paddingBottom: "6rem" }}>

      {/* ── HERO PERSONNEL ── */}
      <div style={{
        position: "relative", overflow: "hidden",
        padding: "2.5rem 1.5rem 2rem",
        background: `linear-gradient(160deg, #1A1510, ${T.nuit})`,
        borderBottom: `1px solid ${T.brume}15`,
      }}>
        {/* Vidéo de fond hero */}
        <video autoPlay loop muted playsInline style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", zIndex: 0, opacity: 0.32,
        }}><source src={heroVideo} type="video/mp4"/></video>

        {/* Halo arrière-plan */}
        <div style={{
          position: "absolute", top: -40, right: -40,
          width: 200, height: 200, borderRadius: "50%",
          background: `radial-gradient(circle, ${cle.couleur}10 0%, transparent 70%)`,
          pointerEvents: "none", zIndex: 1,
        }}/>

        {/* Moment du jour */}
        <div style={{
          fontFamily: T.sans, fontWeight: 300, fontSize: "0.65rem",
          letterSpacing: "0.55em", textTransform: "uppercase",
          color: T.brume, marginBottom: "0.6rem",
          animation: "fadeUp 0.6s ease forwards",
          position: "relative", zIndex: 1,
        }}>{momentLabel} · {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</div>

        {/* Salutation — TypedPhrase pour première visite du jour */}
        <h1 style={{
          fontFamily: T.serif, fontWeight: 300,
          fontSize: "clamp(1.8rem, 6vw, 2.4rem)",
          color: T.orPale, lineHeight: 1.2, marginBottom: "0.5rem",
        }}>
          <TypedPhrase
            text={`${salut}, ${data.prenom}.`}
            speed={45}
            style={{ color: T.orPale, fontFamily: T.serif }}
          />
        </h1>

        {/* Sous-titre chemin */}
        <p style={{
          fontFamily: T.serif, fontStyle: "italic",
          fontSize: "0.95rem", color: T.brume, lineHeight: 1.6,
          animation: "fadeUp 0.7s ease forwards 0.2s", opacity: 0,
        }}>Chemin {cdv} — {chemin.titre}</p>

        {/* Phrase de présence — discrète, éphémère */}
        {phrasePresence && (
          <TypedPhrase
            text={phrasePresence}
            style={{
              fontFamily: T.serif, fontStyle: "italic",
              fontSize: "0.82rem", color: `${T.brume}BB`,
              lineHeight: 1.6, marginTop: "0.5rem", display: "block",
            }}
          />
        )}

        {/* Carte miniature flottante */}
        <div style={{
          position: "absolute", right: 1.5 + "rem", top: "50%",
          transform: "translateY(-50%)",
          animation: "float 6s ease-in-out infinite, fadeIn 1s ease forwards 0.4s",
          opacity: 0,
        }}>
          <CarteAme data={data} small />
        </div>
      </div>

      {/* ── PHRASE DU JOUR / RITUEL DU MATIN ── */}
      <div style={{
        margin: "1.2rem 1.5rem 0",
        position: "relative",
        animation: "fadeUp 0.7s ease forwards 0.25s", opacity: 0,
      }}>
        {/* Fond avec shimmer */}
        <div style={{
          background: `linear-gradient(135deg, ${T.nuit2}cc, #1A1410cc)`,
          border: `1px solid ${T.or}28`,
          borderRadius: "8px",
          padding: "1.5rem 1.6rem",
          overflow: "hidden",
          position: "relative",
        }}>
          {/* Ligne dorée horizontale shimmer */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: `linear-gradient(to right, transparent, ${T.or}55, transparent)` }} />

          {/* Label */}
          <div style={{
            display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.9rem",
          }}>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.or, opacity: 0.7 }} />
            <span style={{
              fontFamily: T.sans, fontWeight: 300, fontSize: "0.62rem",
              letterSpacing: "0.5em", textTransform: "uppercase", color: T.brume,
            }}>{isMatin ? "Rituel du matin" : "Pour ce moment"}</span>
          </div>

          {/* La phrase — grande, italique, présente */}
          <TypedPhrase
            text={phraseDuJour}
            speed={35}
            style={{
              fontFamily: T.serif, fontStyle: "italic",
              fontSize: "clamp(1.05rem, 3.2vw, 1.25rem)",
              color: T.orPale, lineHeight: 1.85,
              letterSpacing: "0.01em",
              display: "block",
            }}
          />
        </div>
      </div>

      {/* ── MIROIR DE LA SEMAINE ── (visible uniquement si assez de données) */}
      {miroirMots && (
        <div style={{
          margin: "1rem 1.5rem 0",
          background: `linear-gradient(135deg, ${T.nuit2}ee, #191510ee)`,
          border: `1px solid ${T.or}22`,
          borderRadius: "8px",
          padding: "1.4rem 1.6rem",
          animation: "fadeUp 0.7s ease forwards 0.28s", opacity: 0,
          position: "relative", overflow: "hidden",
        }}>
          {/* Ligne dorée top */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: `linear-gradient(to right, transparent, ${T.or}44, transparent)` }} />

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.or, opacity: 0.6 }} />
            <span style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.47rem", letterSpacing: "0.5em", textTransform: "uppercase", color: T.brume }}>
              Miroir de la semaine
            </span>
          </div>

          <p style={{
            fontFamily: T.serif, fontStyle: "italic",
            fontSize: "0.95rem", color: `${T.aube}cc`,
            lineHeight: 1.8, marginBottom: "1rem",
          }}>
            Cette semaine, {miroirMots.length === 1 ? "un mot" : `${miroirMots.length} mots`} {miroirMots.length === 1 ? "revient" : "reviennent"} dans ce que tu poses :
          </p>

          {/* Mots clés */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
            {miroirMots.map((mot, i) => (
              <div key={mot} style={{
                border: `1px solid ${T.or}${i === 0 ? "55" : "28"}`,
                borderRadius: "20px",
                padding: "0.3rem 0.9rem",
                fontFamily: T.serif, fontStyle: "italic",
                fontSize: "0.95rem",
                color: i === 0 ? T.or : `${T.orPale}DD`,
                background: i === 0 ? `${T.or}08` : "transparent",
                transition: "all 0.2s",
              }}>
                {mot}
              </div>
            ))}
          </div>

          {/* Phrase de reflet */}
          <p style={{
            marginTop: "1rem",
            fontFamily: T.serif, fontStyle: "italic",
            fontSize: "0.82rem", color: T.brume,
            lineHeight: 1.7,
          }}>
            Ce n'est pas un jugement. C'est simplement ce que tu portes en ce moment.
          </p>
        </div>
      )}

      {/* ── MÉMOIRE — fragment passé ── */}
      {fragmentMémoire && (
        <div style={{
          margin: "1rem 1.5rem 0",
          background: `linear-gradient(135deg, ${T.nuit2}dd, #16120Edd)`,
          border: `1px solid ${T.brume}18`,
          borderRadius: "8px",
          padding: "1.3rem 1.6rem",
          animation: "fadeUp 0.7s ease forwards 0.32s", opacity: 0,
          position: "relative", overflow: "hidden",
        }}>
          {/* Ligne discrète en haut */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: `linear-gradient(to right, transparent, ${T.brume}25, transparent)` }} />

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.9rem" }}>
            <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.brume, opacity: 0.5 }} />
            <span style={{
              fontFamily: T.sans, fontWeight: 300, fontSize: "0.44rem",
              letterSpacing: "0.5em", textTransform: "uppercase", color: `${T.brume}CC`,
            }}>
              Il y a {fragmentMémoire.diff} jour{fragmentMémoire.diff > 1 ? "s" : ""}, tu écrivais
            </span>
          </div>

          <p style={{
            fontFamily: T.serif, fontStyle: "italic",
            fontSize: "0.92rem", color: `${T.brume}cc`,
            lineHeight: 1.75, margin: 0,
            borderLeft: `2px solid ${T.brume}25`,
            paddingLeft: "0.9rem",
          }}>
            "{fragmentMémoire.texte.length > 120
              ? fragmentMémoire.texte.slice(0, 120) + "…"
              : fragmentMémoire.texte}"
          </p>
        </div>
      )}

      {/* ── ÉCHO HUMAIN ── */}
      <div style={{
        margin: "1rem 1.5rem 0",
        animation: "fadeUp 0.7s ease forwards 0.35s", opacity: 0,
      }}>
        <div style={{
          background: "transparent",
          border: `1px solid ${T.brume}18`,
          borderRadius: "8px",
          padding: "1.2rem 1.5rem",
          position: "relative",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.8rem" }}>
            <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.brume, opacity: 0.4 }} />
            <span style={{
              fontFamily: T.sans, fontWeight: 300, fontSize: "0.43rem",
              letterSpacing: "0.5em", textTransform: "uppercase", color: `${T.brume}BB`,
            }}>Quelqu'un a déposé ceci</span>
          </div>
          <p style={{
            fontFamily: T.serif, fontStyle: "italic",
            fontSize: "0.9rem", color: `${T.brume}DD`,
            lineHeight: 1.75, margin: 0,
          }}>
            "{getEchoHumain()}"
          </p>
        </div>
      </div>

      {/* ── CLÉ DU JOUR ── */}
      <div style={{
        margin: "1.2rem 1.5rem 0",
        background: `linear-gradient(135deg, ${T.nuit2}, #1E1A14)`,
        border: `1px solid ${cle.couleur}40`,
        borderLeft: `3px solid ${cle.couleur}`,
        borderRadius: "4px",
        padding: "1.4rem 1.5rem",
        animation: "fadeUp 0.7s ease forwards 0.3s", opacity: 0,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", right: -10, top: -10,
          width: 80, height: 80, borderRadius: "50%",
          background: `radial-gradient(circle, ${cle.couleur}10, transparent 70%)`,
        }}/>
        <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem", letterSpacing: "0.5em", textTransform: "uppercase", color: T.brume, marginBottom: "0.8rem" }}>
          Clé du jour
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.6rem" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
            border: `1px solid ${cle.couleur}60`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: T.serif, fontStyle: "italic", fontSize: "0.85rem", color: cle.couleur,
          }}>{cle.num}</div>
          <span style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "1.3rem", color: T.orPale }}>{cle.nom}</span>
        </div>
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.92rem", color: T.aube, opacity: 0.92, lineHeight: 1.75 }}>{cle.desc}</p>
      </div>

      {/* ── MINI PROGRESSION ── */}
      <div style={{
        margin: "0.8rem 1.5rem 0",
        padding: "0.75rem 1rem",
        background: `${T.nuit2}`,
        border: `1px solid ${T.brume}12`,
        borderRadius: "4px",
        animation: "fadeUp 0.7s ease forwards 0.4s", opacity: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <span style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.62rem", letterSpacing: "0.45em", textTransform: "uppercase", color: T.brume }}>
            Chemin des clés
          </span>
          <span style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.7rem", color: T.or }}>
            {cleActive + 1} / 6
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.3rem" }}>
          {CLES.map((k, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i <= cleActive ? k.couleur : `${T.brume}35`,
              transition: "background 0.4s ease",
              opacity: i === cleActive ? 1 : i < cleActive ? 0.6 : 0.25,
            }}/>
          ))}
        </div>
      </div>

      {/* ── CITATION ── */}
      <div style={{
        margin: "1rem 1.5rem 0",
        borderLeft: `2px solid ${T.or}40`,
        paddingLeft: "1.2rem",
        animation: "fadeUp 0.7s ease forwards 0.45s", opacity: 0,
      }}>
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "1rem", color: T.orPale, lineHeight: 1.85, marginBottom: "0.4rem" }}>
          « {citation.texte} »
        </p>
        <p style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.56rem", letterSpacing: "0.35em", textTransform: "uppercase", color: T.brume }}>
          — {citation.auteur}
        </p>
      </div>

      {/* ── ENTRÉES RAPIDES ── */}
      <div style={{ margin: "1.5rem 1.5rem 0" }}>
        <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem", letterSpacing: "0.5em", textTransform: "uppercase", color: T.brume, marginBottom: "0.8rem" }}>
          Où veux-tu aller ?
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem" }}>
          {ENTREES.map((e, i) => (
            <button key={e.id} onClick={() => onNavigate(e.id)} style={{
              background: `linear-gradient(145deg, ${T.nuit2}, #181410)`,
              border: `1px solid ${e.couleur}25`,
              borderTop: `2px solid ${e.couleur}60`,
              borderRadius: "4px", padding: "1.1rem",
              textAlign: "left", cursor: "pointer",
              animation: `fadeUp 0.6s ease forwards ${0.5 + i * 0.07}s`, opacity: 0,
              transition: "border-color 0.25s, transform 0.2s",
            }}>
              <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "1.05rem", color: T.orPale, marginBottom: "0.25rem" }}>
                {e.label}
              </div>
              <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.56rem", letterSpacing: "0.2em", color: T.brume, opacity: 0.7 }}>
                {e.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── RECOMMANDATIONS PERSONNALISÉES ── */}
      {(() => {
        // Mapper l'intention/état vers les thèmes de recommandation
        const intentionBasse = (data.intention || "").toLowerCase();
        const intentionBasse2 = (data.intentionSecondaire || "").toLowerCase();
        const etatsDetectes = [];
        const detecter = (s) => {
          if (s.includes("rupture") || s.includes("séparation") || s.includes("separation")) etatsDetectes.push("separation");
          if (s.includes("deuil") || s.includes("perte") || s.includes("perdu")) etatsDetectes.push("deuil");
          if (s.includes("épuisement") || s.includes("epuisement") || s.includes("burn")) etatsDetectes.push("burn-out");
          if (s.includes("anxiété") || s.includes("anxiete") || s.includes("anxieux")) etatsDetectes.push("anxiete");
          if (s.includes("trahison")) etatsDetectes.push("relation-toxique");
          if (s.includes("maladie") || s.includes("diagnostic")) etatsDetectes.push("maladie");
          if (s.includes("qui je suis") || s.includes("perdu")) etatsDetectes.push("quete-de-sens");
          if (s.includes("grandir") || s.includes("explorer") || s.includes("connaître") || s.includes("connaitre")) etatsDetectes.push("croissance");
        };
        detecter(intentionBasse);
        if (intentionBasse2) detecter(intentionBasse2);
        if (etatsDetectes.length === 0) etatsDetectes.push("quete-de-sens");

        const recos = getRecommandationsPersonnalisees(etatsDetectes, cleActive + 1, 2);
        if (!recos.length) return null;

        return (
          <div style={{ margin: "1rem 1.5rem 0", animation: "fadeUp 0.7s ease forwards 0.75s", opacity: 0 }}>
            <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.62rem", letterSpacing: "0.45em", textTransform: "uppercase", color: T.brume, marginBottom: "0.8rem" }}>
              Pour toi · Ce moment
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {recos.map((r) => {
                const isLivre = r.type === "livre";
                const acc = isLivre ? T.or : "#9EC8B4";
                return (
                  <div key={r.id} style={{
                    display: "flex", alignItems: "flex-start", gap: "0.9rem",
                    background: T.nuit2, border: `1px solid ${acc}18`,
                    borderLeft: `3px solid ${acc}55`,
                    borderRadius: "0 6px 6px 0", padding: "0.9rem 1rem",
                  }}>
                    <div style={{ flexShrink: 0, marginTop: "0.15rem" }}>
                      {isLivre ? (
                        <div style={{ width: 8, height: 44, borderRadius: "1px", background: `linear-gradient(to bottom, ${T.or}90, ${T.aurore}60)` }}/>
                      ) : (
                        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={acc} strokeWidth="1.5" strokeLinecap="round" opacity={0.7}>
                          <circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16"/>
                        </svg>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.42rem", letterSpacing: "0.35em", textTransform: "uppercase", color: acc, marginBottom: "0.25rem", opacity: 0.92 }}>
                        {isLivre ? "Livre" : "Podcast"} · {r.auteur}
                      </div>
                      <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.92rem", color: T.orPale, lineHeight: 1.3, marginBottom: "0.3rem" }}>{r.titre}</div>
                      <div style={{ fontFamily: T.serif, fontSize: "0.75rem", color: T.aube, opacity: 0.6, lineHeight: 1.6 }}>{r.description.slice(0, 90)}…</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── BLESSURE / QUESTION cliquable ── */}
      <button onClick={() => onNavigate("presence", { question: blessure.question })} style={{
        display: "block", width: "calc(100% - 3rem)",
        margin: "1rem 1.5rem 0",
        padding: "1.2rem 1.4rem",
        background: `${blessure.couleur}08`,
        border: `1px solid ${blessure.couleur}25`,
        borderRadius: "4px",
        animation: "fadeUp 0.7s ease forwards 0.85s", opacity: 0,
        cursor: "pointer", textAlign: "left",
        transition: "border-color 0.25s, background 0.25s",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: blessure.couleur, flexShrink: 0 }}/>
            <span style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem", letterSpacing: "0.4em", textTransform: "uppercase", color: blessure.couleur }}>
              {hasDual ? "En chemin · " : "En traversée · "}{blessure.nom}
            </span>
          </div>
          {/* Hint "répondre" */}
          <span style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.62rem", letterSpacing: "0.3em", textTransform: "uppercase", color: blessure.couleur, opacity: 0.6 }}>
            Répondre →
          </span>
        </div>
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.95rem", color: T.aube, opacity: 0.92, lineHeight: 1.75 }}>
          {blessure.question}
        </p>
      </button>

      {/* ── BAROMÈTRE NERVEUX ── */}
      <BarometreNerveux />

      {/* ── RITUEL DU MATIN ── (visible avant midi) */}
      {isMatin && <RituelMatin data={data} cleActive={cleActive} onComplete={() => {}} />}

      {/* ── RITUEL DU CRÉPUSCULE ── (visible après 18h) */}
      {heure >= 18 && <RituelCrepuscule data={data} onPoser={(txt) => {
        // On stocke la réponse dans l'Ardoise du soir via localStorage
        const key = new Date().toISOString().split("T")[0];
        const saved = JSON.parse(localStorage.getItem("alba_postits") || "{}");
        const existing = saved[key] || [];
        const nouveau = { id: Date.now(), texte: txt, type: "bilan", heure: new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) };
        saved[key] = [nouveau, ...existing];
        localStorage.setItem("alba_postits", JSON.stringify(saved));
      }} />}

      {/* ── RECOMMANDATIONS ── */}
      <RecommandationsBlock data={data} />

      {/* ── PARCOURS DES CLÉS ── */}
      {progressStats && (
        <div style={{ margin: "1.5rem 0 0" }}>
          <div style={{ padding: "0 1.5rem", marginBottom: "0.4rem" }}>
            <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem", letterSpacing: "0.5em", textTransform: "uppercase", color: T.brume }}>
              Parcours des clés
            </div>
          </div>
          <ProgressionCles
            stats={progressStats}
            clesDebloquees={cleActive}
            onSelectCle={() => {}}
            cleActive={cleActive}
          />
        </div>
      )}

    </div>
  );
};

// ─── RITUEL DU CRÉPUSCULE ────────────────────────────────────────────────────
// ─── LE CIEL — Rituel du Cairn ────────────────────────────────────────────────

const ETATS_CAIRN = [
  { id: "chagrin",        label: "quelque chose que je perds",              couleur: "#4A6FA5", hex: "#4A6FA5" },
  { id: "fatigue",        label: "je n'en peux plus",                       couleur: "#7A7A8A", hex: "#7A7A8A" },
  { id: "colere",         label: "quelque chose en moi résiste",            couleur: "#C45C2A", hex: "#C45C2A" },
  { id: "solitude",       label: "je suis seul avec ça",                    couleur: "#2A3A5C", hex: "#2A3A5C" },
  { id: "questionnement", label: "je ne sais plus",                         couleur: "#8A6FA5", hex: "#8A6FA5" },
  { id: "traversee",      label: "je suis en chemin malgré tout",           couleur: "#C8A96E", hex: "#C8A96E" },
  { id: "espoir",         label: "quelque chose recommence",                couleur: "#6A9E8A", hex: "#6A9E8A" },
  { id: "douceur",        label: "je me traite avec soin",                  couleur: "#C4857A", hex: "#C4857A" },
  { id: "gratitude",      label: "j'ai reçu quelque chose",                 couleur: "#D4A84B", hex: "#D4A84B" },
  { id: "paix",           label: "je suis posé",                            couleur: "#8AA88A", hex: "#8AA88A" },
  { id: "joie",           label: "quelque chose de léger",                  couleur: "#E8B89A", hex: "#E8B89A" },
  { id: "guerison",       label: "je sens que ça change en moi",            couleur: "#D4C8B8", hex: "#D4C8B8" },
];

const PHRASES_CAIRN = {
  chagrin:        "Le chagrin est une forme d'amour qui cherche où aller.",
  fatigue:        "Poser ce qu'on porte, c'est déjà un acte de courage.",
  colere:         "La colère dit quelque chose de juste. Écoute-la.",
  solitude:       "D'autres ont veillé dans le même silence ce soir.",
  questionnement: "Ne pas savoir est parfois la réponse la plus honnête.",
  traversee:      "Être en chemin, c'est déjà être arrivé quelque part.",
  espoir:         "Quelque chose en toi sait que ça peut recommencer.",
  douceur:        "Prendre soin de soi n'est pas un luxe. C'est un retour.",
  gratitude:      "Ce que tu as reçu continue à travailler en toi.",
  paix:           "La paix n'est pas l'absence. C'est une présence.",
  joie:           "Laisse la légèreté prendre toute la place qu'elle mérite.",
  guerison:       "La guérison ne prévient pas. Elle arrive doucement.",
};

// Génère des points de ciel simulés + les vrais depuis Supabase
const genererEtoilesCiel = (pierresReelles) => {
  const rng = (seed) => { let x = Math.sin(seed) * 10000; return x - Math.floor(x); };
  const points = [];
  // ~200 points de fond (histoire collective simulée)
  for (let i = 0; i < 200; i++) {
    const etat = ETATS_CAIRN[Math.floor(rng(i * 7.3) * ETATS_CAIRN.length)];
    points.push({
      id: `bg_${i}`, x: rng(i * 3.7) * 100, y: rng(i * 5.1) * 100,
      couleur: etat.couleur, taille: 1 + rng(i * 2.3) * 2,
      opacite: 0.15 + rng(i * 4.1) * 0.35, isReal: false,
    });
  }
  // Pierres réelles par-dessus
  pierresReelles.forEach((p, i) => {
    points.push({
      id: `real_${p.id || i}`,
      x: 5 + rng((p.created_at || i) * 9.1 + 1) * 90,
      y: 5 + rng((p.created_at || i) * 6.7 + 2) * 90,
      couleur: (ETATS_CAIRN.find(e => e.id === p.etat) || ETATS_CAIRN[5]).couleur,
      taille: 2 + rng(i * 1.7) * 2, opacite: 0.5 + rng(i * 3.3) * 0.4, isReal: true,
    });
  });
  return points;
};

const CielCairn = ({ userId, db }) => {
  const [introVue, setIntroVue]     = useState(() => {
    try { return localStorage.getItem("alba_ciel_intro_vue") === "1"; } catch { return false; }
  });
  const [introPhase, setIntroPhase] = useState(0); // 0=texte 1=fondu
  const [etape, setEtape]           = useState(0); // 0=ciel 1=question 2=etats 3=geste 4=envol 5=retour
  const [texte, setTexte]           = useState("");
  const [etatChoisi, setEtatChoisi] = useState(null);
  const [pierres, setPierres]       = useState([]);
  const [nouvellePierre, setNouvellePierre] = useState(null);
  const [piedDePage, setPiedDePage] = useState(false);
  const [dejaFaitAujd, setDejaFaitAujd] = useState(false);
  const [isHolding, setIsHolding]   = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [particules, setParticules] = useState([]);
  const holdTimerRef = useRef(null);
  const holdIntervalRef = useRef(null);

  const today = new Date().toISOString().split("T")[0];

  // Charger les pierres depuis Supabase
  useEffect(() => {
    const charger = async () => {
      try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/alba_cairn?select=id,etat,created_at&order=created_at.desc&limit=300`, {
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
        });
        if (r.ok) { const d = await r.json(); setPierres(d); }
      } catch {}
      // Vérifier si déjà fait aujourd'hui
      try {
        const fait = localStorage.getItem(`alba_cairn_${today}`);
        if (fait) setDejaFaitAujd(true);
      } catch {}
    };
    charger();
  }, []);

  const etoiles = useMemo(() => genererEtoilesCiel(pierres), [pierres]);

  // Sauvegarder la pierre
  const sauvegarderPierre = async () => {
    const pierre = { etat: etatChoisi.id, user_token: userId || "anon", created_at: new Date().toISOString() };
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/alba_cairn`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(pierre),
      });
      localStorage.setItem(`alba_cairn_${today}`, "1");
      setDejaFaitAujd(true);
    } catch {}
    setNouvellePierre({ x: 48 + Math.random() * 4, y: 20 + Math.random() * 10, couleur: etatChoisi.couleur, isNew: true });
    setPierres(prev => [...prev, { ...pierre, id: Date.now() }]);
  };

  // Geste maintien
  const startHold = () => {
    setIsHolding(true);
    let progress = 0;
    holdIntervalRef.current = setInterval(() => {
      progress += 2;
      setHoldProgress(progress);
      // Générer particules
      if (progress % 10 === 0) {
        setParticules(prev => [...prev, {
          id: Date.now() + Math.random(),
          angle: Math.random() * 360,
          distance: 40 + Math.random() * 30,
          size: 2 + Math.random() * 3,
          couleur: etatChoisi.couleur,
        }]);
      }
      if (progress >= 100) {
        clearInterval(holdIntervalRef.current);
        setIsHolding(false);
        setHoldProgress(100);
        try { const a = new Audio("/sons/cairn.mp3"); a.volume = 0.2; a.play().catch(()=>{}); } catch(e) {}
        setTimeout(() => setEtape(4), 300);
      }
    }, 30);
  };

  const stopHold = () => {
    clearInterval(holdIntervalRef.current);
    setIsHolding(false);
    if (holdProgress < 100) setHoldProgress(0);
  };

  // Nettoyage
  useEffect(() => () => { clearInterval(holdIntervalRef.current); clearTimeout(holdTimerRef.current); }, []);

  // ── CIEL (étape 0 et 5) ────────────────────────────────────────────────────
  const CielView = ({ showNouvelleEtoile }) => (
    <div style={{ position: "relative", width: "100%", height: "100vh", background: "#030205", overflow: "hidden" }}>
      {/* Nébuleuse de fond */}
      <div style={{ position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 80% 60% at 50% 40%, #1A0F2A44 0%, transparent 70%)",
        pointerEvents: "none" }} />

      {/* Étoiles */}
      {etoiles.map(e => (
        <div key={e.id} style={{
          position: "absolute", left: `${e.x}%`, top: `${e.y}%`,
          width: e.taille, height: e.taille, borderRadius: "50%",
          background: e.couleur, opacity: e.opacite,
          boxShadow: e.isReal ? `0 0 ${e.taille * 3}px ${e.couleur}55` : "none",
          transition: "opacity 2s ease",
          animation: e.isReal ? `alba-breathe ${8 + Math.random() * 8}s ease-in-out infinite` : "none",
        }} />
      ))}

      {/* Nouvelle étoile — brille plus fort */}
      {showNouvelleEtoile && nouvellePierre && (
        <div style={{
          position: "absolute", left: `${nouvellePierre.x}%`, top: `${nouvellePierre.y}%`,
          width: 6, height: 6, borderRadius: "50%",
          background: nouvellePierre.couleur,
          boxShadow: `0 0 20px ${nouvellePierre.couleur}, 0 0 40px ${nouvellePierre.couleur}55`,
          animation: "alba-breathe 3s ease-in-out infinite",
          zIndex: 10,
        }} />
      )}

      {/* Compteur discret */}
      <div style={{ position: "absolute", bottom: "7rem", left: 0, right: 0, textAlign: "center" }}>
        <p style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.42rem", letterSpacing: "0.5em", textTransform: "uppercase", color: `${T.brume}55` }}>
          {pierres.length + 200} présences dans ce ciel
        </p>
      </div>

      {/* Bouton déposer / déjà fait */}
      <div style={{ position: "absolute", bottom: "3.5rem", left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        {dejaFaitAujd && etape !== 5 ? (
          <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.9rem", color: `${T.brume}BB` }}>
            Ta pierre est dans le ciel ce soir.
          </p>
        ) : etape === 5 ? (
          <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.95rem", color: `${etatChoisi?.couleur}cc` }}>
            Elle brille là-haut. Tu peux rester.
          </p>
        ) : (
          <button onClick={() => setEtape(1)} style={{
            background: "transparent", border: `1px solid ${T.or}33`,
            borderRadius: "30px", padding: "0.8rem 2rem",
            fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem",
            letterSpacing: "0.5em", textTransform: "uppercase",
            color: `${T.or}EE`, cursor: "pointer",
            transition: "all 0.4s ease",
          }}>
            Déposer une pierre
          </button>
        )}
      </div>
    </div>
  );

  // ── INTRO — première visite seulement ────────────────────────────────────
  if (!introVue) return (
    <div style={{
      minHeight: "100vh", background: "#060408",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "2.5rem",
      animation: "fadeIn 1s ease forwards",
    }}>
      {/* Étoiles décoratives */}
      {[...Array(40)].map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${Math.random()*100}%`, top: `${Math.random()*100}%`,
          width: Math.random()*2+1, height: Math.random()*2+1,
          borderRadius: "50%",
          background: `rgba(${180+Math.floor(Math.random()*60)},${160+Math.floor(Math.random()*60)},${100+Math.floor(Math.random()*80)},${0.3+Math.random()*0.5})`,
          pointerEvents: "none",
        }}/>
      ))}

      <div style={{ textAlign: "center", maxWidth: 320, position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: "1.8rem", marginBottom: "2rem", filter: "drop-shadow(0 0 12px rgba(200,169,110,0.6))" }}>
          ✦
        </div>
        <p style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontStyle: "italic", fontWeight: 300,
          fontSize: "clamp(1.1rem, 4vw, 1.3rem)",
          color: "#E8D5B0", lineHeight: 1.9,
          marginBottom: "1rem",
          animation: "fadeUp 0.8s ease forwards 0.3s", opacity: 0,
        }}>
          Un espace partagé.
        </p>
        <p style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontStyle: "italic", fontWeight: 300,
          fontSize: "clamp(1.1rem, 4vw, 1.3rem)",
          color: "#D4CCC5", lineHeight: 1.9,
          marginBottom: "2.5rem",
          animation: "fadeUp 0.8s ease forwards 0.8s", opacity: 0,
        }}>
          Chaque pierre déposée ici<br/>devient une étoile.
        </p>
        <button
          onClick={() => {
            try { localStorage.setItem("alba_ciel_intro_vue", "1"); } catch {}
            setIntroVue(true);
          }}
          style={{
            background: "none",
            border: "1px solid rgba(200,169,110,0.35)",
            borderRadius: "6px",
            padding: "0.85rem 2.5rem",
            fontFamily: "'Jost', sans-serif",
            fontWeight: 300, fontSize: "0.68rem",
            letterSpacing: "0.5em", textTransform: "uppercase",
            color: "#C8A96E", cursor: "pointer",
            animation: "fadeUp 0.8s ease forwards 1.4s", opacity: 0,
            transition: "all 0.2s",
          }}
        >
          Entrer
        </button>
      </div>
    </div>
  );

  if (etape === 0 || etape === 5) return <CielView showNouvelleEtoile={etape === 5} />;

  // ── ÉTAPE 1 : Question ─────────────────────────────────────────────────────
  if (etape === 1) return (
    <div style={{ minHeight: "100vh", background: "#060408", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ position: "absolute", top: "25%", left: "50%", transform: "translateX(-50%)", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${T.or}08 0%, transparent 70%)`, animation: "alba-breathe 8s ease-in-out infinite", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 340, position: "relative", zIndex: 1 }}>
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "clamp(1.2rem, 4vw, 1.5rem)", color: T.orPale, lineHeight: 1.9, textAlign: "center", marginBottom: "2.5rem", animation: "fadeUp 1s ease forwards" }}>
          Qu'est-ce que tu portes<br/>en ce moment ?
        </p>
        <textarea
          value={texte} onChange={e => setTexte(e.target.value)}
          placeholder="En un mot, une phrase…"
          rows={3} autoFocus
          style={{
            width: "100%", background: "transparent", border: "none",
            borderBottom: `1px solid ${texte ? T.or + "44" : T.brume + "22"}`,
            color: T.aube, fontFamily: T.serif, fontStyle: "italic",
            fontSize: "1.05rem", padding: "0.5rem 0", outline: "none",
            resize: "none", boxSizing: "border-box", lineHeight: 1.7,
            textAlign: "center", transition: "border-color 0.3s",
          }}
        />
        <button onClick={() => setEtape(2)} style={{
          marginTop: "2rem", background: "transparent", border: `1px solid ${T.or}30`,
          borderRadius: "30px", padding: "0.75rem 1.8rem",
          fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem",
          letterSpacing: "0.45em", textTransform: "uppercase",
          color: `${T.or}88`, cursor: "pointer", display: "block",
          margin: "2rem auto 0", transition: "all 0.3s",
        }}>
          {texte.trim() ? "Continuer →" : "Passer →"}
        </button>
      </div>
    </div>
  );

  // ── ÉTAPE 2 : Choix état ───────────────────────────────────────────────────
  if (etape === 2) return (
    <div style={{ minHeight: "100vh", background: "#060408", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 1.5rem", overflowY: "auto" }}>
      <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "1rem", color: `${T.brume}bb`, textAlign: "center", marginBottom: "2rem", lineHeight: 1.8, animation: "fadeUp 0.6s ease forwards" }}>
        Cette chose que tu portes,<br/>elle ressemble plutôt à…
      </p>
      <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {ETATS_CAIRN.map((e, i) => (
          <button key={e.id} onClick={() => { setEtatChoisi(e); setEtape(3); }}
            style={{
              background: "transparent", border: `1px solid ${e.couleur}25`,
              borderLeft: `3px solid ${e.couleur}55`,
              borderRadius: "6px", padding: "0.85rem 1.2rem",
              fontFamily: T.serif, fontStyle: "italic", fontSize: "0.95rem",
              color: `${T.aube}EE`, cursor: "pointer", textAlign: "left",
              transition: "all 0.2s", animation: `fadeUp 0.4s ease forwards ${i * 0.04}s`,
              opacity: 0,
            }}
            onMouseEnter={e2 => { e2.currentTarget.style.background = `${e.couleur}12`; e2.currentTarget.style.color = T.aube; }}
            onMouseLeave={e2 => { e2.currentTarget.style.background = "transparent"; e2.currentTarget.style.color = `${T.aube}EE`; }}
          >
            {e.label}
          </button>
        ))}
      </div>
    </div>
  );

  // ── ÉTAPE 3 : Geste (maintenir) ────────────────────────────────────────────
  if (etape === 3 && etatChoisi) return (
    <div style={{
      minHeight: "100vh", background: "#060408",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "2rem", overflow: "hidden", position: "relative",
    }}>
      {/* Wash de couleur progressif */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse at center, ${etatChoisi.couleur}${Math.floor(holdProgress * 0.18).toString(16).padStart(2,"0")} 0%, transparent 70%)`,
        transition: "background 0.3s ease",
      }} />

      {/* Phrase ALBA */}
      <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "1rem", color: `${etatChoisi.couleur}cc`, textAlign: "center", lineHeight: 1.85, maxWidth: 280, marginBottom: "3rem", animation: "fadeUp 0.8s ease forwards", position: "relative", zIndex: 1 }}>
        {PHRASES_CAIRN[etatChoisi.id]}
      </p>

      {/* La pierre — cercle à maintenir */}
      <div style={{ position: "relative", zIndex: 2 }}>
        {/* Particules */}
        {particules.map(p => (
          <div key={p.id} style={{
            position: "absolute",
            left: `calc(50% + ${Math.cos(p.angle * Math.PI / 180) * p.distance}px)`,
            top: `calc(50% + ${Math.sin(p.angle * Math.PI / 180) * p.distance}px)`,
            width: p.size, height: p.size, borderRadius: "50%",
            background: p.couleur, opacity: 0.6,
            transform: "translate(-50%, -50%)",
            transition: "opacity 1s ease",
            animation: "fadeIn 0.3s ease forwards",
          }} />
        ))}

        {/* Anneau de progression */}
        <svg width={120} height={120} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-90deg)" }}>
          <circle cx={60} cy={60} r={54} fill="none" stroke={`${etatChoisi.couleur}22`} strokeWidth={2} />
          <circle cx={60} cy={60} r={54} fill="none" stroke={etatChoisi.couleur} strokeWidth={2}
            strokeDasharray={`${2 * Math.PI * 54}`}
            strokeDashoffset={`${2 * Math.PI * 54 * (1 - holdProgress / 100)}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.1s linear" }}
          />
        </svg>

        {/* Bouton pierre */}
        <div
          onMouseDown={startHold} onMouseUp={stopHold} onMouseLeave={stopHold}
          onTouchStart={startHold} onTouchEnd={stopHold}
          style={{
            width: 80, height: 80, borderRadius: "50%",
            background: `radial-gradient(circle, ${etatChoisi.couleur}55 0%, ${etatChoisi.couleur}22 60%, transparent 100%)`,
            border: `1px solid ${etatChoisi.couleur}66`,
            cursor: "pointer", userSelect: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            transform: isHolding ? "scale(1.08)" : "scale(1)",
            transition: "transform 0.2s ease",
            boxShadow: isHolding ? `0 0 30px ${etatChoisi.couleur}44` : `0 0 15px ${etatChoisi.couleur}22`,
          }}
        />
      </div>

      <p style={{ marginTop: "2.5rem", fontFamily: T.sans, fontWeight: 300, fontSize: "0.44rem", letterSpacing: "0.5em", textTransform: "uppercase", color: `${T.brume}55`, animation: "fadeUp 1s ease forwards 0.5s", opacity: 0, position: "relative", zIndex: 1 }}>
        {holdProgress < 100 ? "Maintiens pour déposer" : "…"}
      </p>
    </div>
  );

  // ── ÉTAPE 4 : Envol ────────────────────────────────────────────────────────
  if (etape === 4) {
    useEffect(() => {
      sauvegarderPierre();
      const t = setTimeout(() => setEtape(5), 3000);
      return () => clearTimeout(t);
    }, []);

    return (
      <div style={{ minHeight: "100vh", background: "#060408", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
        {/* Fond wash */}
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 70%, ${etatChoisi.couleur}18 0%, transparent 60%)`, animation: "fadeIn 1s ease forwards", pointerEvents: "none" }} />

        {/* Étoile qui monte */}
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: etatChoisi.couleur,
          boxShadow: `0 0 20px ${etatChoisi.couleur}, 0 0 40px ${etatChoisi.couleur}55`,
          animation: "pierreEnvol 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards",
        }} />

        <style>{`
          @keyframes pierreEnvol {
            0%   { transform: translateY(0) scale(1); opacity: 1; }
            60%  { transform: translateY(-40vh) scale(1.3); opacity: 0.9; }
            100% { transform: translateY(-80vh) scale(0.4); opacity: 0; }
          }
        `}</style>

        <p style={{ position: "absolute", bottom: "30%", fontFamily: T.serif, fontStyle: "italic", fontSize: "1rem", color: `${T.brume}CC`, animation: "fadeIn 1s ease forwards 0.5s", opacity: 0 }}>
          Ta lumière a rejoint le ciel.
        </p>
      </div>
    );
  }

  return null;
};

// ─── RITUEL DU MATIN ──────────────────────────────────────────────────────────

// Séquence guidée 3 minutes — ancrée dans la Porte active

const RITUELS_PAR_PORTE = {
  1:  { ancrage: "Pose une main sur la poitrine. Sens ton cœur battre.", question: "Qu'est-ce que tu portes ce matin que tu pourrais nommer ?", intention: "Aujourd'hui je regarde ce qui est là, sans le fuir." },
  2:  { ancrage: "Ferme les yeux. Pense à une chose qui se répète dans ta vie.", question: "Qu'est-ce que cette répétition veut t'apprendre ?", intention: "Aujourd'hui je reste curieux de ce que je ne comprends pas encore." },
  3:  { ancrage: "Assieds-toi. Pose les deux pieds à plat. Sens le sol.", question: "Quelle émotion est là en ce moment, sans que tu l'aies invitée ?", intention: "Aujourd'hui j'accueille ce que je ressens sans l'effacer." },
  4:  { ancrage: "Inspire profondément. En expirant, imagine que tu poses quelque chose.", question: "Qu'est-ce que tu portes pour quelqu'un d'autre depuis trop longtemps ?", intention: "Aujourd'hui je pose ce qui n'est pas à moi." },
  5:  { ancrage: "Pense à une personne qui t'a donné quelque chose. Laisse entrer ce souvenir.", question: "Qu'est-ce qui t'empêche de recevoir vraiment ?", intention: "Aujourd'hui je m'autorise à recevoir sans mériter d'abord." },
  6:  { ancrage: "Regarde tes mains. Ce sont les mains de quelqu'un qui devient.", question: "Qui es-tu quand tu n'as rien à prouver à personne ?", intention: "Aujourd'hui je suis la personne que je suis en train de devenir." },
  7:  { ancrage: "Pense à quelque chose que tu veux créer. Laisse-le exister une seconde.", question: "Qu'est-ce qui attend en toi d'être fait ?", intention: "Aujourd'hui je laisse naître quelque chose, même imparfait." },
  8:  { ancrage: "Pense à quelqu'un qui compte pour toi. Envoie-lui une pensée silencieuse.", question: "Qu'est-ce que le lien avec les autres te demande en ce moment ?", intention: "Aujourd'hui je m'ouvre au lien sans me perdre." },
  9:  { ancrage: "Visualise un espace qui te protège. Un lieu intérieur sûr.", question: "De quoi as-tu besoin pour te sentir en sécurité aujourd'hui ?", intention: "Aujourd'hui je prends soin de ce qui me protège." },
  10: { ancrage: "Pense à quelque chose que tu as appris dans la douleur.", question: "À qui pourrais-tu transmettre quelque chose de ce chemin ?", intention: "Aujourd'hui ce que j'ai traversé a une valeur." },
  11: { ancrage: "Sens ton corps dans l'espace où tu es. Tu es ici.", question: "Dans quel espace te sens-tu vraiment chez toi ?", intention: "Aujourd'hui j'habite pleinement l'endroit où je suis." },
  12: { ancrage: "Ferme les yeux. Ne cherche rien. Juste être.", question: "Si tu n'avais rien à faire aujourd'hui, qui serais-tu ?", intention: "Aujourd'hui j'existe, simplement." },
};

const SOUFFLES_MATIN = [
  { label: "4-4-4", inspire: 4, tiens: 4, expire: 4 },
  { label: "4-7-8", inspire: 4, tiens: 7, expire: 8 },
  { label: "5-5",   inspire: 5, tiens: 0, expire: 5 },
];

const RituelMatin = ({ data, cleActive = 0, onComplete }) => {
  const porteNum = (cleActive % 12) + 1;
  const rituel = RITUELS_PAR_PORTE[porteNum] || RITUELS_PAR_PORTE[1];
  const souffle = SOUFFLES_MATIN[new Date().getDate() % SOUFFLES_MATIN.length];

  const [etape, setEtape] = useState(0); // 0=intro 1=ancrage 2=souffle 3=question 4=intention 5=done
  const [reponse, setReponse]   = useState("");
  const [souffleEtat, setSouffleEtat] = useState("inspire"); // inspire|tiens|expire
  const [souffleTimer, setSouffleTimer] = useState(null);
  const [souffleCycles, setSouffleCycles] = useState(0);
  const [souffleCount, setSouffleCount] = useState(souffle.inspire);
  const [rituelFait] = useState(() => {
    try { return localStorage.getItem("alba_rituel_" + new Date().toISOString().split("T")[0]) === "1"; } catch { return false; }
  });

  // Déjà fait aujourd'hui
  if (rituelFait && etape === 0) return (
    <div style={{ margin: "1rem 1.5rem 0", padding: "1rem 1.4rem", border: `1px solid ${T.or}15`, borderRadius: "8px", display: "flex", alignItems: "center", gap: "0.7rem" }}>
      <span style={{ color: T.or, fontSize: "0.9rem" }}>✦</span>
      <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.85rem", color: `${T.brume}DD`, margin: 0 }}>
        Rituel du matin accompli. Bonne journée, {data.prenom}.
      </p>
    </div>
  );

  const marquerFait = () => {
    try { localStorage.setItem("alba_rituel_" + new Date().toISOString().split("T")[0], "1"); } catch {}
    if (onComplete) onComplete();
  };

  // Souffle — cycle automatique
  useEffect(() => {
    if (etape !== 2) return;
    if (souffleCycles >= 3) { setEtape(3); return; }

    const phases = [
      { etat: "inspire",  dur: souffle.inspire * 1000, next: souffle.tiens > 0 ? "tiens" : "expire" },
      ...(souffle.tiens > 0 ? [{ etat: "tiens", dur: souffle.tiens * 1000, next: "expire" }] : []),
      { etat: "expire",  dur: souffle.expire * 1000, next: "inspire" },
    ];

    let phaseIdx = phases.findIndex(p => p.etat === souffleEtat);
    if (phaseIdx === -1) phaseIdx = 0;
    const phase = phases[phaseIdx];

    // Compte à rebours
    let remaining = Math.ceil(phase.dur / 1000);
    setSouffleCount(remaining);
    const countdown = setInterval(() => {
      remaining--;
      setSouffleCount(remaining);
      if (remaining <= 0) clearInterval(countdown);
    }, 1000);

    const t = setTimeout(() => {
      clearInterval(countdown);
      if (phase.next === "inspire" && souffleEtat === "expire") {
        setSouffleCycles(c => c + 1);
      }
      setSouffleEtat(phase.next);
    }, phase.dur);

    setSouffleTimer(t);
    return () => { clearTimeout(t); clearInterval(countdown); };
  }, [etape, souffleEtat, souffleCycles]);

  const cardStyle = {
    margin: "1rem 1.5rem 0",
    background: `linear-gradient(135deg, #16120A, ${T.nuit})`,
    border: `1px solid ${T.or}28`,
    borderRadius: "10px",
    padding: "1.8rem 1.6rem",
    animation: "fadeUp 0.5s ease forwards",
    position: "relative", overflow: "hidden",
  };

  const labelStyle = {
    fontFamily: T.sans, fontWeight: 300, fontSize: "0.58rem",
    letterSpacing: "0.55em", textTransform: "uppercase", color: `${T.or}88`,
    marginBottom: "1.2rem", display: "flex", alignItems: "center", gap: "0.5rem",
  };

  const btnNext = (label, onClick) => (
    <button onClick={onClick} style={{
      marginTop: "1.4rem", background: `${T.or}15`, border: `1px solid ${T.or}40`,
      borderRadius: "6px", padding: "0.75rem 1.4rem",
      fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem",
      letterSpacing: "0.35em", textTransform: "uppercase",
      color: T.or, cursor: "pointer", transition: "all 0.2s",
      display: "block", width: "100%",
    }}>{label}</button>
  );

  // ── ÉTAPE 0 : Intro ──────────────────────────────────────────────────────────
  if (etape === 0) return (
    <div style={cardStyle}>
      <div style={{ position: "absolute", top: -40, right: -40, width: 150, height: 150, borderRadius: "50%", background: `radial-gradient(circle, ${T.or}10, transparent 70%)`, pointerEvents: "none" }} />
      <div style={labelStyle}><span>✦</span> Rituel du matin</div>
      <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "clamp(1rem, 3vw, 1.15rem)", color: T.orPale, lineHeight: 1.9, marginBottom: "0.4rem" }}>
        Trois minutes pour toi, {data.prenom}.<br/>
        <span style={{ fontSize: "0.9rem", color: T.brume }}>Ancrage · Souffle · Intention.</span>
      </p>
      {btnNext("Commencer →", () => setEtape(1))}
    </div>
  );

  // ── ÉTAPE 1 : Ancrage ────────────────────────────────────────────────────────
  if (etape === 1) return (
    <div style={cardStyle}>
      <div style={labelStyle}><span>1 / 3</span> Ancrage</div>
      <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "clamp(1rem, 3vw, 1.1rem)", color: T.orPale, lineHeight: 1.9, marginBottom: "1rem" }}>
        {rituel.ancrage}
      </p>
      <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.88rem", color: `${T.brume}aa`, lineHeight: 1.7 }}>
        Prends le temps qu'il faut. Il n'y a rien d'autre à faire en ce moment.
      </p>
      {btnNext("C'est fait →", () => setEtape(2))}
    </div>
  );

  // ── ÉTAPE 2 : Souffle ────────────────────────────────────────────────────────
  if (etape === 2) {
    const progress = souffleCycles / 3;
    const souffleLabels = { inspire: "Inspire", tiens: "Retiens", expire: "Expire" };
    const souffleCouleurs = { inspire: T.or, tiens: T.aurore, expire: "#9EC8B4" };
    return (
      <div style={cardStyle}>
        <div style={labelStyle}><span>2 / 3</span> Souffle</div>
        <div style={{ textAlign: "center", padding: "1rem 0" }}>
          {/* Cercle animé */}
          <div style={{
            width: 100, height: 100, borderRadius: "50%", margin: "0 auto 1.2rem",
            border: `2px solid ${souffleCouleurs[souffleEtat]}55`,
            background: `radial-gradient(circle, ${souffleCouleurs[souffleEtat]}18 0%, transparent 70%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.8s ease",
            transform: souffleEtat === "inspire" ? "scale(1.1)" : souffleEtat === "expire" ? "scale(0.9)" : "scale(1)",
            boxShadow: `0 0 ${souffleEtat === "tiens" ? "20px" : "8px"} ${souffleCouleurs[souffleEtat]}22`,
          }}>
            <span style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "1.8rem", color: souffleCouleurs[souffleEtat] }}>
              {souffleCount}
            </span>
          </div>
          <p style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.6rem", letterSpacing: "0.5em", textTransform: "uppercase", color: souffleCouleurs[souffleEtat] }}>
            {souffleLabels[souffleEtat]}
          </p>
          {/* Barre de progression cycles */}
          <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginTop: "1.2rem" }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: 24, height: 3, borderRadius: 2, background: i < souffleCycles ? T.or : `${T.brume}25`, transition: "background 0.4s" }} />
            ))}
          </div>
          <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.78rem", color: `${T.brume}BB`, marginTop: "0.8rem" }}>
            {souffleCycles < 3 ? `${3 - souffleCycles} cycle${3 - souffleCycles > 1 ? "s" : ""} restant${3 - souffleCycles > 1 ? "s" : ""}` : "…"}
          </p>
        </div>
      </div>
    );
  }

  // ── ÉTAPE 3 : Question ───────────────────────────────────────────────────────
  if (etape === 3) return (
    <div style={cardStyle}>
      <div style={labelStyle}><span>3 / 3</span> Question du matin</div>
      <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "clamp(1rem, 3vw, 1.12rem)", color: T.orPale, lineHeight: 1.9, marginBottom: "1.2rem" }}>
        {rituel.question}
      </p>
      <textarea
        value={reponse} onChange={e => setReponse(e.target.value)}
        placeholder="Quelques mots suffisent…"
        rows={3}
        style={{
          width: "100%", background: "transparent", border: "none",
          borderBottom: `1px solid ${reponse ? T.or + "44" : T.brume + "22"}`,
          color: T.aube, fontFamily: T.serif, fontStyle: "italic",
          fontSize: "1rem", padding: "0.4rem 0", outline: "none",
          resize: "none", boxSizing: "border-box", lineHeight: 1.7,
        }}
      />
      {btnNext(reponse.trim() ? "Poser →" : "Passer →", () => {
        if (reponse.trim()) {
          // Sauvegarder dans l'Ardoise
          try {
            const key = new Date().toISOString().split("T")[0];
            const saved = JSON.parse(localStorage.getItem("alba_postits") || "{}");
            saved[key] = [{ id: Date.now(), texte: reponse.trim(), type: "matin", heure: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) }, ...(saved[key] || [])];
            localStorage.setItem("alba_postits", JSON.stringify(saved));
          } catch {}
        }
        setEtape(4);
      })}
    </div>
  );

  // ── ÉTAPE 4 : Intention ──────────────────────────────────────────────────────
  if (etape === 4) return (
    <div style={cardStyle}>
      <div style={labelStyle}><span>✦</span> Ton intention du jour</div>
      <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "clamp(1.05rem, 3.2vw, 1.2rem)", color: T.orPale, lineHeight: 1.9, marginBottom: "1.4rem" }}>
        {rituel.intention}
      </p>
      <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.85rem", color: `${T.brume}CC`, lineHeight: 1.7 }}>
        Porte cette phrase avec toi aujourd'hui. Elle n'a pas besoin d'être vraie tout de suite.
      </p>
      {btnNext("C'est noté ✦", () => { setEtape(5); marquerFait(); })}
    </div>
  );

  // ── ÉTAPE 5 : Terminé ────────────────────────────────────────────────────────
  return (
    <div style={{ margin: "1rem 1.5rem 0", padding: "1.2rem 1.6rem", background: `${T.or}08`, border: `1px solid ${T.or}25`, borderRadius: "8px", animation: "fadeUp 0.5s ease forwards" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
        <span style={{ color: T.or, fontSize: "0.9rem" }}>✦</span>
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.9rem", color: T.orPale, margin: 0 }}>
          Rituel accompli. La journée commence.
        </p>
      </div>
    </div>
  );
};

const RituelCrepuscule = ({ data, onPoser }) => {
  const [reponse, setReponse] = useState("");
  const [pose, setPose] = useState(false);
  const question = getQuestionCrepuscule();

  if (pose) return (
    <div style={{
      margin: "1rem 1.5rem 0",
      padding: "1.2rem 1.6rem",
      background: `${T.or}06`,
      border: `1px solid ${T.or}20`,
      borderRadius: "8px",
      animation: "fadeUp 0.6s ease forwards",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ color: T.or, fontSize: "0.8rem" }}>✦</span>
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.9rem", color: T.brume }}>
          Posé dans ton ardoise. Bonne nuit, {data.prenom}.
        </p>
      </div>
    </div>
  );

  return (
    <div style={{
      margin: "1rem 1.5rem 0",
      background: `linear-gradient(135deg, #1A1510, #131008)`,
      border: `1px solid ${T.aurore}22`,
      borderRadius: "8px",
      padding: "1.5rem 1.6rem",
      animation: "fadeUp 0.7s ease forwards 0.5s", opacity: 0,
      position: "relative", overflow: "hidden",
    }}>
      {/* Lueur chaude */}
      <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle, ${T.aurore}12, transparent 70%)`, pointerEvents: "none" }} />

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.aurore, opacity: 0.7 }} />
        <span style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.47rem", letterSpacing: "0.5em", textTransform: "uppercase", color: `${T.aurore}99` }}>
          Rituel du crépuscule
        </span>
      </div>

      <p style={{
        fontFamily: T.serif, fontStyle: "italic",
        fontSize: "clamp(1rem, 3vw, 1.15rem)",
        color: T.orPale, lineHeight: 1.85, marginBottom: "1.2rem",
      }}>
        {question}
      </p>

      <textarea
        value={reponse}
        onChange={e => setReponse(e.target.value)}
        placeholder="Quelques mots suffisent…"
        rows={2}
        style={{
          width: "100%", background: "transparent",
          border: "none", borderBottom: `1px solid ${reponse ? T.aurore + "44" : T.brume + "22"}`,
          color: T.aube, fontFamily: T.serif, fontStyle: "italic",
          fontSize: "1rem", padding: "0.4rem 0",
          resize: "none", lineHeight: 1.7, outline: "none",
          transition: "border-color 0.3s",
        }}
        onFocus={e => e.target.style.borderColor = `${T.aurore}55`}
        onBlur={e => e.target.style.borderColor = reponse ? `${T.aurore}44` : `${T.brume}22`}
      />

      {reponse.trim().length > 2 && (
        <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end", animation: "fadeUp 0.4s ease forwards" }}>
          <button onClick={() => { onPoser(reponse.trim()); setPose(true); }} style={{
            background: "transparent",
            border: `1px solid ${T.aurore}44`,
            borderRadius: "20px", padding: "0.5rem 1.3rem",
            fontFamily: T.serif, fontStyle: "italic",
            fontSize: "0.9rem", color: T.aurore,
            cursor: "pointer", transition: "all 0.25s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = `${T.aurore}10`; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            Poser pour la nuit
          </button>
        </div>
      )}
    </div>
  );
};

// ─── RECOMMANDATIONS ─────────────────────────────────────────────────────────
const getRecommandations = (nomBlessure, sens, cdv) => {
  // Retourne livres et podcasts depuis LIVRES/PODCASTS selon la blessure
  const livres = LIVRES?.[nomBlessure] ? [LIVRES[nomBlessure]] : [];
  const podcasts = [];
  return { livres, podcasts };
};

const RecommandationsBlock = ({ data }) => {
  const [onglet, setOnglet] = useState("livres");
  const [ouvert, setOuvert] = useState(false);

  const cdv = cheminDeVie(data.naissance);
  const { nomBlessure } = getContextProfil(data);
  const sens = data.sensibilite || "intuitif";
  const { livres, podcasts } = getRecommandations(nomBlessure, sens, cdv);
  const items = onglet === "livres" ? livres : podcasts;

  return (
    <div style={{ margin: "1rem 1.5rem 0", animation: "fadeUp 0.7s ease forwards 0.7s", opacity: 0 }}>
      {/* Titre cliquable pour ouvrir/fermer */}
      <button onClick={() => setOuvert(v => !v)} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "none", border: "none", cursor: "pointer",
        padding: "0.8rem 0", borderBottom: `1px solid ${T.brume}15`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.brume, opacity: 0.5 }} />
          <span style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.47rem", letterSpacing: "0.5em", textTransform: "uppercase", color: T.brume }}>
            Pour toi en ce moment
          </span>
        </div>
        <span style={{ color: T.brume, fontSize: "0.7rem", opacity: 0.6, transition: "transform 0.3s", display: "inline-block", transform: ouvert ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
      </button>

      {ouvert && (
        <div style={{ animation: "fadeUp 0.4s ease forwards" }}>
          {/* Sous-onglets */}
          <div style={{ display: "flex", gap: "0.3rem", margin: "0.8rem 0" }}>
            {["livres","podcasts"].map(o => (
              <button key={o} onClick={() => setOnglet(o)} style={{
                background: onglet === o ? `${T.or}12` : "transparent",
                border: `1px solid ${onglet === o ? T.or + "44" : T.brume + "22"}`,
                borderRadius: "20px", padding: "0.35rem 0.9rem",
                fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem",
                letterSpacing: "0.3em", textTransform: "uppercase",
                color: onglet === o ? T.or : T.brume,
                cursor: "pointer", transition: "all 0.2s",
              }}>{o === "livres" ? "📖 Livres" : "🎙 Podcasts"}</button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
            {items.map((item, i) => (
              <div key={i} style={{
                background: `${T.nuit2}`,
                border: `1px solid ${T.brume}15`,
                borderRadius: "6px",
                padding: "1rem 1.2rem",
                display: "flex", alignItems: "center", gap: "1rem",
                animation: `fadeUp 0.5s ease forwards ${i * 0.08}s`, opacity: 0,
              }}>
                <div style={{
                  width: 36, height: 48, flexShrink: 0, borderRadius: "2px",
                  background: `linear-gradient(135deg, ${T.or}22, ${T.aurore}12)`,
                  border: `1px solid ${T.or}22`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1rem",
                }}>{onglet === "livres" ? "📖" : "🎙"}</div>
                <div>
                  <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.98rem", color: T.orPale, lineHeight: 1.3 }}>{item.titre}</div>
                  <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.62rem", color: T.brume, marginTop: "0.25rem" }}>{item.auteur}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── LETTRES D'ALBA ──────────────────────────────────────────────────────────
const LettresAlba = ({ data, allPostits, isPremium, onShowPaywall }) => {
  const [lettres, setLettres] = useState([]);
  const [generation, setGeneration] = useState(false);
  const [lettreOuverte, setLettreOuverte] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const uk = localStorage.getItem("alba_user_key") || "local";
        const rows = await sb.list("alba_lettres", { user_key: uk });
        if (rows && rows.length > 0) {
          setLettres(rows.map(r => ({ id: r.id, date: r.delivered_at, titre: r.titre, texte: r.texte, type: r.type || "hebdo", lue: r.lue })));
          return;
        }
      } catch {}
      const saved = localStorage.getItem("alba_lettres");
      if (saved) try { setLettres(JSON.parse(saved)); } catch {}
    })();
  }, []);

  const saveLettres = async (list) => {
    setLettres(list);
    localStorage.setItem("alba_lettres", JSON.stringify(list));
    // Sync Supabase
    try {
      const uk = localStorage.getItem("alba_user_key") || "local";
      if (list[0]) {
        const l = list[0];
        await sb.upsert("alba_lettres", {
          id: l.id, user_key: uk,
          porte_index: l.type === "porte" ? parseInt(l.id.split("_")[1] || 0) : -1,
          titre: l.titre, texte: l.texte, type: l.type || "hebdo",
          lue: l.lue || false, delivered_at: l.date,
        });
      }
    } catch {}
  };

  // Vérifie si une lettre a déjà été générée cette semaine
  const lettreDejaGeneree = () => {
    if (lettres.length === 0) return false;
    const derniere = new Date(lettres[0].date);
    const maintenant = new Date();
    const joursEcoules = (maintenant - derniere) / (1000 * 60 * 60 * 24);
    return joursEcoules < 7;
  };

  // Collecte tous les post-its des 7 derniers jours
  const getPostits7Jours = () => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
    const tous = [];
    Object.entries(allPostits || {}).forEach(([dateKey, posts]) => {
      if (new Date(dateKey + "T00:00:00") >= cutoff) {
        posts.forEach(p => tous.push(p.texte));
      }
    });
    return tous;
  };

  const genererLettre = async () => {
    const fragments = getPostits7Jours();
    if (fragments.length < 2) return;
    setGeneration(true);

    const cdv = cheminDeVie(data.naissance);
    const chemin = CHEMINS[cdv] || CHEMINS[9];
    const { nomBlessure, hasDual, hasCroissance, texteContexte } = getContextProfil(data);
    const sens = data.sensibilite || "intuitif";

    const prompt = `Tu es ALBA. Tu écris une lettre à ${data.prenom}.
Profil : Chemin ${cdv} — ${chemin.titre}. Sensibilité : ${sens}.
Contexte : ${texteContexte}
${hasDual ? `Note : ${data.prenom} traverse quelque chose de difficile ET cherche à grandir simultanément. Ta lettre doit honorer les deux dimensions — la blessure sans la nier, le chemin de croissance sans le forcer.` : ""}

Voici les fragments que ${data.prenom} a posés cette semaine sur son ardoise :
${fragments.map((f,i) => `${i+1}. "${f}"`).join("\n")}

Écris une vraie lettre — pas un résumé, pas une liste. Une lettre intime, douce, qui nomme ce que tu entends entre les lignes. 
Pas de bullet points. De la prose uniquement. Entre 150 et 220 mots.
Commence par "Chère ${data.prenom}," ou "${data.prenom},".
Nomme un ou deux fils qui traversent la semaine sans tout expliquer.
Laisse de l'espace. Termine par une phrase qui ouvre vers la semaine suivante.
Signe simplement : ALBA`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 400,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const d = await res.json();
      const texte = d.content?.[0]?.text?.trim() || "";
      if (texte) {
        const nouvelleLettres = [{
          id: Date.now(),
          texte,
          date: new Date().toISOString(),
          fragments: fragments.length,
        }, ...lettres];
        saveLettres(nouvelleLettres);
        setLettreOuverte(nouvelleLettres[0]);
      }
    } catch {}
    setGeneration(false);
  };

  const peutGenerer = getPostits7Jours().length >= 2 && !lettreDejaGeneree();
  const semaineFmt = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <div style={{ padding: "0 1.5rem 6rem" }}>

      {/* ── En-tête ── */}
      <div style={{ padding: "1.5rem 0 1rem" }}>
        <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.65rem", letterSpacing: "0.55em", textTransform: "uppercase", color: T.brume, marginBottom: "0.4rem" }}>
          Lettres d'ALBA
        </div>
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.95rem", color: `${T.brume}cc`, lineHeight: 1.8 }}>
          Chaque semaine, ALBA lit ton ardoise et t'écrit une lettre.
        </p>
      </div>

      {/* ── Bouton générer — premium ── */}
      {peutGenerer && (
        <div style={{ marginBottom: "1.5rem" }}>
          <button onClick={isPremium ? genererLettre : onShowPaywall} disabled={generation} style={{
            width: "100%", padding: "1.1rem",
            background: generation ? "transparent" : `${T.or}10`,
            border: `1px solid ${generation ? T.brume + "22" : T.or + "44"}`,
            borderRadius: "6px", cursor: generation ? "default" : "pointer",
            fontFamily: T.serif, fontStyle: "italic",
            fontSize: "1rem", color: generation ? T.brume : T.or,
            transition: "all 0.3s",
          }}>
            {generation ? "ALBA écrit…" : isPremium ? "Recevoir la lettre de la semaine" : "✦ Débloquer les Lettres — 9€/mois"}
          </button>
          {generation && (
            <p style={{ textAlign: "center", marginTop: "0.8rem", fontFamily: T.serif, fontStyle: "italic", fontSize: "0.85rem", color: T.brume }}>
              Elle lit ton ardoise…
            </p>
          )}
        </div>
      )}

      {!peutGenerer && !lettreDejaGeneree() && (
        <div style={{
          padding: "1.2rem", marginBottom: "1.5rem",
          background: `${T.nuit2}`,
          border: `1px solid ${T.brume}15`,
          borderRadius: "6px",
        }}>
          <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.9rem", color: T.brume, lineHeight: 1.8 }}>
            Pose encore quelques fragments dans ton ardoise — ALBA aura besoin d'au moins deux moments pour t'écrire.
          </p>
        </div>
      )}

      {lettreDejaGeneree() && (
        <div style={{
          padding: "0.8rem 1rem", marginBottom: "1.5rem",
          border: `1px solid ${T.brume}15`, borderRadius: "6px",
        }}>
          <p style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.65rem", letterSpacing: "0.35em", textTransform: "uppercase", color: T.brume }}>
            Prochaine lettre disponible dans quelques jours
          </p>
        </div>
      )}

      {/* ── Bibliothèque de lettres ── */}
      {lettres.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 0" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "1rem", opacity: 0.3 }}>✉</div>
          <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.9rem", color: T.brume, lineHeight: 1.8 }}>
            Tes lettres apparaîtront ici.<br/>Elles resteront pour toi.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
          {lettres.map((l, i) => (
            <button key={l.id} onClick={() => setLettreOuverte(l)} style={{
              background: i === 0 ? `${T.or}06` : "transparent",
              border: `1px solid ${i === 0 ? T.or + "28" : T.brume + "15"}`,
              borderRadius: "6px", padding: "1.1rem 1.3rem",
              cursor: "pointer", textAlign: "left",
              transition: "all 0.25s",
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = `${T.or}33`}
              onMouseLeave={e => e.currentTarget.style.borderColor = i === 0 ? `${T.or}28` : `${T.brume}15`}
            >
              <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.62rem", letterSpacing: "0.45em", textTransform: "uppercase", color: T.brume, marginBottom: "0.4rem" }}>
                {semaineFmt(l.date)} · {l.fragments} fragment{l.fragments > 1 ? "s" : ""}
              </div>
              <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.92rem", color: T.orPale, lineHeight: 1.5 }}>
                {l.texte.split("\n")[0].slice(0, 60)}…
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Lettre ouverte ── */}
      {lettreOuverte && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(10,8,6,0.92)",
          display: "flex", alignItems: "flex-end",
          animation: "fadeIn 0.3s ease",
        }} onClick={() => setLettreOuverte(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: "100%", maxWidth: 560, margin: "0 auto",
            background: `linear-gradient(170deg, #1C1810, #141210)`,
            borderTop: `1px solid ${T.or}28`,
            borderRadius: "16px 16px 0 0",
            padding: "2rem 1.8rem 4rem",
            maxHeight: "85vh", overflowY: "auto",
            animation: "fadeUp 0.4s ease forwards",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
              <div>
                <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.62rem", letterSpacing: "0.5em", textTransform: "uppercase", color: T.or, marginBottom: "0.3rem" }}>
                  Lettre d'ALBA
                </div>
                <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.68rem", color: T.brume }}>
                  {semaineFmt(lettreOuverte.date)}
                </div>
              </div>
              <button onClick={() => setLettreOuverte(null)} style={{
                background: "none", border: `1px solid ${T.brume}25`,
                color: T.brume, width: 28, height: 28, borderRadius: "50%",
                cursor: "pointer", fontSize: "0.7rem",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>✕</button>
            </div>

            {/* Ligne dorée */}
            <div style={{ width: 40, height: 1, background: `linear-gradient(to right, ${T.or}, transparent)`, marginBottom: "1.8rem" }} />

            <p style={{
              fontFamily: T.serif, fontStyle: "italic",
              fontSize: "clamp(1rem, 3vw, 1.1rem)",
              color: T.orPale, lineHeight: 2,
              whiteSpace: "pre-wrap",
            }}>{lettreOuverte.texte}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── COMPAGNON DU JOUR (conservé pour compatibilité) ─────────────────────────
const CompagnonDuJour = ({ data }) => {
  const cdv = cheminDeVie(data.naissance);
  const cle = CLES[0];
  const citation = CITATIONS[cdv % CITATIONS.length];
  const { blessure } = getContextProfil(data);
  const livre = LIVRES[blessure.nom] || LIVRES["Abandon"];

  return (
    <div style={{ padding: "1.5rem 0 6rem", maxWidth: 520, margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.68rem", letterSpacing: "0.5em", textTransform: "uppercase", color: T.brume, marginBottom: "0.4rem" }}>Aujourd'hui</div>
        <h2 style={{ fontFamily: T.serif, fontWeight: 300, fontSize: "1.6rem", color: T.orPale }}>Bonjour, {data.prenom}.</h2>
      </div>
      <div style={{ borderLeft: `2px solid ${T.or}55`, padding: "1.2rem 1.5rem", marginBottom: "1.2rem" }}>
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "1.05rem", color: T.orPale, lineHeight: 1.8, marginBottom: "0.5rem" }}>« {citation.texte} »</p>
        <p style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.62rem", letterSpacing: "0.3em", color: T.brume }}>— {citation.auteur}</p>
      </div>
    </div>
  );
};

// ─── BIBLIOTHÈQUE PHOTOS ─────────────────────────────────────────────────────
// 🔄 Sur Vercel : remplacer `gradient` par `url: "/evasion/nom-fichier.jpg"`
const PHOTOS = {
  puissance: [
    { url: "/evasion/puissance-1.jpg", legende: "Ce qui résiste finit par sculpter" },
    { url: "/evasion/puissance-2.jpg", legende: "La falaise ne recule pas devant la vague" },
    { url: "/evasion/puissance-3.jpg", legende: "La force naît du silence des hauteurs" },
  ],
  douceur: [
    { url: "/evasion/douceur-1.jpg", legende: "La forêt n'explique pas sa lumière" },
    { url: "/evasion/douceur-2.jpg", legende: "L'eau sait où elle va" },
    { url: "/evasion/douceur-3.jpg", legende: "La douceur est une forme de courage" },
  ],
  liberte: [
    { url: "/evasion/liberte-1.jpg", legende: "Tout horizon est une invitation" },
    { url: "/evasion/liberte-2.jpg", legende: "La mer ne demande pas la permission" },
    { url: "/evasion/liberte-3.jpg", legende: "Le désert apprend à voyager léger" },
  ],
  ancrage: [
    { url: "/evasion/ancrage-1.jpg", legende: "Les racines profondes ne craignent pas le vent" },
    { url: "/evasion/ancrage-2.jpg", legende: "La montagne n'a pas besoin qu'on la remarque" },
    { url: "/evasion/ancrage-3.jpg", legende: "Être là, simplement" },
  ],
  mystere: [
    { url: "/evasion/mystere-1.jpg", legende: "Ce que l'on cherche cherche aussi" },
    { url: "/evasion/mystere-2.jpg", legende: "La brume cache ce qui n'est pas encore prêt" },
    { url: "/evasion/mystere-3.jpg", legende: "L'invisible est plus réel que le visible" },
  ],
  savane: [
    { url: "/evasion/savane-1.jpg", legende: "La savane sait attendre" },
    { url: "/evasion/savane-4.jpg", legende: "Chaque coucher de soleil est une permission de lâcher" },
    { url: "/evasion/savane-5.jpg", legende: "L'Afrique garde les secrets des origines" },
  ],
  mer: [
    { url: "/evasion/mer-1.jpg", legende: "La mer des Caraïbes ne juge pas" },
    { url: "/evasion/mer-2.jpg", legende: "L'océan reçoit tout, retient rien" },
    { url: "/evasion/mer-3.jpg", legende: "L'eau sait guérir ce que les mots ne peuvent pas" },
  ],
  aube: [
    { url: "/evasion/aube-1.jpg", legende: "L'aube ne promet rien. Elle se lève, simplement." },
    { url: "/evasion/aube-2.jpg", legende: "Chaque matin est une seconde chance" },
    { url: "/evasion/aube-3.jpg", legende: "Du chaos naît une étoile" },
  ],
  resilience: [
    { url: "/evasion/resilience-1.jpg", legende: "Ce qui survit devient racine" },
    { url: "/evasion/resilience-2.jpg", legende: "Après la tempête, la lumière est différente" },
    { url: "/evasion/savane-2.jpg", legende: "La vie repousse toujours" },
  ],
};

// Sélection selon le chemin de vie et la blessure
const getPhotos = (cdv, blessure) => {
  const map = {
    1: "puissance", 8: "puissance",
    2: "douceur",   6: "douceur",
    3: "liberte",   5: "liberte",
    4: "ancrage",  22: "ancrage",
    7: "mystere",  11: "mystere",
    9: "savane",
  };
  const cat1 = map[cdv] || "aube";
  const cat2 = ["Abandon","Rejet"].includes(blessure) ? "mer"
              : ["Trahison"].includes(blessure) ? "resilience"
              : "aube";
  return {
    principal: PHOTOS[cat1],
    secondaire: PHOTOS[cat2],
    categorie: cat1,
    all: [...(PHOTOS[cat1] || []), ...(PHOTOS[cat2] || [])],
  };
};

// ─── ÉVASION ──────────────────────────────────────────────────────────────────
const VIDEOS = [
  { src: "/videos/etoiles.mp4",  legende: "Certaines nuits, le monde entier se tait pour toi.",          label: "Étoiles" },
  { src: "/videos/caraibe.mp4",  legende: "Il y a des endroits qui te rappellent qui tu es vraiment.",   label: "Caraïbes" },
  { src: "/videos/vagues.mp4",   legende: "Laisse venir ce qui vient. Laisse partir ce qui part.",        label: "Vagues" },
  { src: "/videos/desert.mp4",   legende: "Le vide n'est pas un manque. C'est de l'espace.",             label: "Désert" },
  { src: "/videos/nuages.mp4",   legende: "Tout passe. C'est la seule promesse que la vie tient.",        label: "Nuages" },
  { src: "/videos/savane2.mp4",  legende: "Tu n'as pas à tout comprendre pour continuer d'avancer.",     label: "Savane" },
  { src: "/videos/foret.mp4",    legende: "Il existe en toi quelque chose que rien n'a pu abîmer.",       label: "Forêt" },
  { src: "/videos/savane.mp4",   legende: "Chaque coucher de soleil est une permission de lâcher.",       label: "Crépuscule" },
];

// ─── TERRITOIRES DES CLÉS ─────────────────────────────────────────────────────
const TERRITOIRES_CLES = [
  {
    index: 1, nom: "Reconnaître", symbole: "/pictos/porte-01-reconnaitre.svg", couleur: "#C8A96E",
    video: "/videos/etoiles.mp4",
    ambiance: { bg: "#1A1408", accent: "#C8A96E", texte: "Avant de changer quoi que ce soit, il faut voir ce qui est là." },
    souffle: "La lumière ne juge pas ce qu'elle éclaire.",
    questions: [
      "Qu'est-ce que tu continues à faire semblant de ne pas savoir sur toi-même ?",
      "Si tu retirais le rôle que tu joues pour les autres — qui resterait-il ?",
      "Quelle vérité évites-tu depuis si longtemps qu'elle a pris la forme d'une habitude ?",
    ],
    pratiques: [
      { niveau: 1, label: "Ouvrir", exercices: [
        "Pose une main sur ta poitrine. Demande-toi : \"Qu'est-ce que je ressens là, maintenant ?\" Reste 3 minutes sans chercher à répondre.",
        "Écris une phrase commençant par \"Je fais semblant que…\" sans la corriger.",
        "Ce soir, avant de dormir, nomme une chose que tu as vue aujourd'hui sur toi-même.",
        "Observe ta façon de parler de toi quand tu te présentes à quelqu'un. Qu'est-ce que tu mets en avant ? Qu'est-ce que tu ne dis jamais ?",
        "Prends un moment dans la journée pour ne rien faire. Juste être là. Observe ce qui remonte.",
      ]},
      { niveau: 2, label: "Traverser", exercices: [
        "Trace une ligne au centre d'une page. À gauche : ce que tu contrôles. À droite : ce que tu ne contrôles pas. Place chaque chose de son côté.",
        "Écris la liste de tout ce que tu portes et qui n'est pas à toi.",
        "Parle à quelqu'un de confiance d'une chose que tu ne dis jamais.",
        "Rappelle-toi un moment où tu as agi contre ce que tu ressentais. Qu'est-ce qui t'a retenu ?",
        "Écris : \"La chose que je reconnais en moi et que j'aurais aimé reconnaître plus tôt, c'est…\"",
      ]},
      { niveau: 3, label: "Intégrer", exercices: [
        "Relis ce que tu as écrit depuis le début de cette Clé. Qu'est-ce qui t'étonne ?",
        "Écris une lettre à la version de toi qui n'avait pas encore reconnu ça.",
        "Choisis une chose que tu vas arrêter de faire semblant.",
        "Dis à voix haute ce que tu sais sur toi-même et que tu n'as encore jamais dit à personne.",
        "Écris la différence entre qui tu croyais être avant et qui tu commences à voir maintenant.",
      ]},
    ],
  },
  {
    index: 2, nom: "Comprendre", symbole: "/pictos/porte-02-comprendre.svg", couleur: "#7BA88A",
    video: "/videos/foret.mp4",
    ambiance: { bg: "#0E1610", accent: "#7BA88A", texte: "Comprendre, c'est remonter à la source sans se noyer dedans." },
    souffle: "Comprendre n'est pas excuser. C'est voir plus loin.",
    questions: [
      "Quelle histoire te racontes-tu sur toi-même depuis si longtemps que tu l'as prise pour la réalité ?",
      "De qui as-tu appris à te voir de cette façon ?",
      "Si tu comprenais vraiment d'où vient ta douleur — qu'est-ce que ça changerait ?",
    ],
    pratiques: [
      { niveau: 1, label: "Ouvrir", exercices: [
        "Pense à une réaction que tu as eue cette semaine et qui t'a surpris toi-même. D'où venait-elle vraiment ?",
        "Écris : \"Je me critique souvent pour… Mais en réalité, cette critique m'a été transmise par…\"",
        "Rappelle-toi une scène d'enfance où tu as décidé quelque chose sur toi-même. Laquelle ?",
        "Identifie une phrase qu'on t'a dite souvent quand tu étais enfant. Est-ce que tu y crois encore ?",
        "Observe aujourd'hui quelque chose que tu fais par automatisme. D'où vient ce geste ?",
      ]},
      { niveau: 2, label: "Traverser", exercices: [
        "Identifie un schéma qui se répète dans ta vie. Dans quel contexte est-il apparu pour la première fois ?",
        "Écris sans filtre ce que tu aurais aimé qu'on te dise quand tu étais enfant.",
        "Observe aujourd'hui une fois où tu te comportes avec toi-même comme quelqu'un t'a traité autrefois.",
        "Écris : \"La blessure que je comprends mieux maintenant, c'est…\"",
        "Pense à quelqu'un qui t'a fait du mal. Est-ce que tu comprends d'où ça venait pour eux — sans excuser ?",
      ]},
      { niveau: 3, label: "Intégrer", exercices: [
        "Réécris l'histoire que tu te racontes sur toi-même — mais cette fois avec de la bienveillance.",
        "Dis à voix haute, seul : \"Ce n'était pas ma faute.\" Observe ce que tu ressens.",
        "Choisis une croyance sur toi-même que tu es prêt à déposer. Écris-la, puis déchire le papier.",
        "Écris une lettre à quelqu'un qui t'a transmis quelque chose de lourd — sans l'envoyer. Dis-lui que tu comprends, et que tu rends ce qui est à lui.",
        "Qu'est-ce que comprendre t'a donné que tu n'avais pas avant ? Écris-le.",
      ]},
    ],
  },
  {
    index: 3, nom: "Ressentir", symbole: "/pictos/porte-03-ressentir.svg", couleur: "#7B9EA8",
    video: "/videos/vagues.mp4",
    ambiance: { bg: "#0A1318", accent: "#7B9EA8", texte: "Ressentir n'est pas souffrir davantage. C'est arrêter de porter seul." },
    souffle: "Ce que tu ressens ne te définit pas. Mais l'ignorer te rétrécit.",
    questions: [
      "Quelle émotion as-tu appris à ne jamais montrer ? Pourquoi ?",
      "Où dans ton corps portes-tu ce que tu ne dis pas ?",
      "Si tes émotions pouvaient parler — qu'est-ce qu'elles diraient depuis tout ce temps ?",
    ],
    pratiques: [
      { niveau: 1, label: "Ouvrir", exercices: [
        "Assieds-toi cinq minutes. Scanne ton corps de la tête aux pieds. Note ce qui attire ton attention.",
        "Aujourd'hui, quand une émotion monte, ne la nomme pas tout de suite. Laisse-la être là 30 secondes.",
        "Écris : \"En ce moment je ressens… et mon corps dit…\"",
        "Pense à une situation récente où tu as dit \"ça va\" alors que ce n'était pas tout à fait vrai. Qu'est-ce qui était là, vraiment ?",
        "Choisis une couleur qui correspond à ce que tu ressens aujourd'hui. Pourquoi cette couleur ?",
      ]},
      { niveau: 2, label: "Traverser", exercices: [
        "Rappelle-toi la dernière fois que tu as pleuré. Était-ce vraiment pour la raison apparente ?",
        "Note une émotion que tu évites. Qu'est-ce que tu crains qu'il se passe si tu la laisses venir ?",
        "Permets-toi aujourd'hui d'exprimer quelque chose que tu gardes d'habitude pour toi.",
        "Écris la liste des émotions que tu t'autorises — et celles que tu t'interdis. Qui t'a appris ces règles ?",
        "Reste cinq minutes avec une émotion difficile sans essayer de la résoudre. Juste la nommer, encore et encore.",
      ]},
      { niveau: 3, label: "Intégrer", exercices: [
        "Écris une lettre à une émotion que tu as longtemps rejetée. Commence par : \"Je t'ai ignoré parce que…\"",
        "Choisis un moment de la semaine passée où tu as ressenti quelque chose d'intense. Honore-le en l'écrivant vraiment.",
        "Dis à quelqu'un de confiance quelque chose que tu ressens mais que tu n'as jamais dit.",
        "Écris ce que ça t'a coûté de ne pas ressentir pendant longtemps.",
        "Qu'est-ce que tu ressens maintenant que tu n'aurais pas pu ressentir avant ? Note-le — c'est de l'espace gagné.",
      ]},
    ],
  },
  {
    index: 4, nom: "Lâcher", symbole: "/pictos/porte-04-lacher.svg", couleur: "#D4856A",
    video: "/videos/desert.mp4",
    ambiance: { bg: "#180E08", accent: "#D4856A", texte: "Ce que tu portes encore t'appartient-il vraiment ?" },
    souffle: "Lâcher n'est pas perdre. C'est choisir ce qu'on veut porter.",
    questions: [
      "Qu'est-ce que tu continues à tenir alors que ça t'épuise ?",
      "Si tu lâchais vraiment — qu'est-ce que tu aurais peur de devenir ?",
      "Quelle rancœur te coûte plus qu'elle ne t'a jamais rapporté ?",
    ],
    pratiques: [
      { niveau: 1, label: "Ouvrir", exercices: [
        "Fais la liste de trois choses que tu portes et qui ne t'appartiennent plus. Juste les nommer.",
        "Observe aujourd'hui une fois où tu t'accroches à quelque chose par peur plutôt que par désir.",
        "Écris : \"Je refuse encore de lâcher… parce que j'ai peur que…\"",
        "Pense à quelque chose que tu possèdes — un objet, une habitude, une relation — et demande-toi : est-ce que ça me nourrit encore, ou est-ce que je le garde par réflexe ?",
        "Écris la différence entre abandonner et lâcher prise.",
      ]},
      { niveau: 2, label: "Traverser", exercices: [
        "Écris toutes les phrases qui commencent par \"Et si j'avais…\" Relis-les une fois. Puis barre-les toutes. L'idée n'est pas d'oublier — c'est de ne plus laisser ton énergie coincée là.",
        "Pense à quelqu'un que tu n'as pas pardonné. Souviens-toi : lâcher prise ne veut pas dire donner raison. Ça veut dire retrouver ta paix, même si l'autre ne comprend pas.",
        "Identifie une version de toi-même que tu es prêt à laisser partir. Dis-lui au revoir par écrit.",
        "Qu'est-ce que tu attends encore que quelqu'un reconnaisse, s'excuse, ou comprenne ? Qu'est-ce que tu ferais si tu n'attendais plus ?",
        "Fais quelque chose aujourd'hui que tu remets depuis longtemps parce que tu attends que ce soit parfait.",
      ]},
      { niveau: 3, label: "Intégrer", exercices: [
        "Écris une lettre à quelqu'un que tu as du mal à pardonner. Tu n'as pas à l'envoyer.",
        "Identifie une attente envers quelqu'un qui ne sera jamais satisfaite. Comment tu vis sans elle ?",
        "Choisis une chose concrète à lâcher cette semaine. Pas une idée — un acte.",
        "Qu'est-ce que lâcher t'a rendu ? Écris ce qui est revenu depuis que tu portes moins.",
        "Écris une promesse à toi-même : ce que tu ne porteras plus jamais seul.",
      ]},
    ],
  },
  {
    index: 5, nom: "Recevoir", symbole: "/pictos/porte-05-recevoir.svg", couleur: "#A87BC8",
    video: "/videos/nuages.mp4",
    ambiance: { bg: "#110D18", accent: "#A87BC8", texte: "Tu as passé longtemps à donner. Maintenant apprends à t'ouvrir." },
    souffle: "Recevoir demande plus de courage que donner.",
    questions: [
      "Pourquoi est-ce plus facile pour toi de donner que de recevoir ?",
      "Qu'est-ce que tu refuses de te donner à toi-même que tu donnerais sans hésiter à quelqu'un que tu aimes ?",
      "Si tu méritais vraiment d'être aimé tel que tu es — qu'est-ce qui changerait dans ta vie ?",
    ],
    pratiques: [
      { niveau: 1, label: "Ouvrir", exercices: [
        "Écris une lettre où toutes les phrases commencent par \"Je me pardonne…\" Laisse venir ce qui vient. Ne cherche pas à bien faire. C'est un espace pour t'accueillir, pas pour t'expliquer.",
        "Accepte un compliment aujourd'hui sans le minimiser. Dis juste : \"Merci.\"",
        "Fais une chose aujourd'hui uniquement pour toi, sans que ça serve à quelqu'un d'autre.",
        "Écris trois choses que tu mérites et que tu ne t'accordes pas encore.",
        "Note une fois où quelqu'un t'a offert quelque chose — attention, temps, amour — et où tu l'as esquivé. Qu'est-ce qui s'est passé en toi ?",
      ]},
      { niveau: 2, label: "Traverser", exercices: [
        "Demande de l'aide pour quelque chose que tu aurais géré seul. Observe ce que ça fait.",
        "Note une situation où tu sabotes ce qui est bon pour toi. D'où vient ce réflexe ?",
        "Écris : \"Je mérite… même si je n'ai pas encore…\"",
        "Passe une heure à faire quelque chose qui te nourrit — pas quelque chose de productif. Juste ce qui te fait du bien. Observe la résistance si elle est là.",
        "Écris ce que tu ressentirais si tu te permettais d'être pleinement aimé tel que tu es, maintenant, sans condition.",
      ]},
      { niveau: 3, label: "Intégrer", exercices: [
        "Parle à toi-même comme tu parlerais à quelqu'un que tu aimes profondément. Qu'est-ce que tu te dirais ?",
        "Identifie quelqu'un dans ta vie qui te donne sans compter. Est-ce que tu le laisses vraiment faire ?",
        "Écris une liste de ce que tu es prêt à recevoir maintenant. Pas un jour — maintenant.",
        "Écris une lettre d'amour à toi-même. Pas de modestie, pas d'ironie. Juste la vérité de ce que tu vois de beau en toi.",
        "Qu'est-ce que recevoir a changé en toi depuis le début de cette Clé ?",
      ]},
    ],
  },
  {
    index: 6, nom: "Devenir", symbole: "/pictos/porte-06-devenir.svg", couleur: "#E8D5B0",
    video: "/videos/caraibe.mp4",
    ambiance: { bg: "#0A1018", accent: "#E8D5B0", texte: "Tu n'arrives pas quelque part. Tu te révèles à toi-même." },
    souffle: "Tu n'es pas en train de te réparer. Tu es en train de te révéler.",
    questions: [
      "Qui es-tu quand tu n'as plus rien à prouver ?",
      "Quelle vie mènerais-tu si tu te faisais pleinement confiance ?",
      "Qu'est-ce que tu veux laisser derrière toi — pas comme héritage, mais comme trace vivante ?",
    ],
    pratiques: [
      { niveau: 1, label: "Ouvrir", exercices: [
        "Écris qui tu es sans utiliser ton métier, ton rôle ou tes accomplissements.",
        "Note une valeur que tu veux incarner davantage. Comment elle se manifeste déjà en toi ?",
        "Imagine-toi dans 5 ans, pleinement toi-même. Qu'est-ce qui est différent ?",
        "Écris une liste de ce qui te rend vivant — pas utile, pas efficace. Vivant.",
        "Qu'est-ce que tu ferais si tu savais que tu ne peux pas échouer ?",
      ]},
      { niveau: 2, label: "Traverser", exercices: [
        "Identifie une peur qui t'empêche d'avancer. Est-ce ta peur ou celle de quelqu'un d'autre ?",
        "Écris une décision que tu remets à plus tard par manque de confiance en toi. Qu'est-ce qui se passerait si tu la prenais maintenant ?",
        "Fais aujourd'hui quelque chose qui correspond à la personne que tu veux devenir — même petit.",
        "Écris la différence entre la vie que tu mènes et la vie que tu veux mener. Qu'est-ce qui les sépare vraiment ?",
        "Identifie une chose que tu fais encore pour correspondre à ce que les autres attendent de toi. Est-ce que tu veux continuer ?",
      ]},
      { niveau: 3, label: "Intégrer", exercices: [
        "Écris une lettre à la version de toi dans 10 ans. Qu'est-ce que tu veux lui dire ?",
        "Choisis une chose que tu vas commencer — pas finir, pas perfectionner. Commencer.",
        "Dis à voix haute : \"Je suis en train de devenir quelqu'un que j'aime.\" Observe ce que ça fait.",
        "Relis tout ce que tu as traversé dans ALBA. Qu'est-ce que tu as appris sur toi que tu ne savais pas au début ?",
        "Écris le portrait de la personne que tu deviens — avec les mots d'un ami qui t'aime.",
      ]},
    ],
  },
];


// ─── PORTES VII–XII ────────────────────────────────────────────────────────────
const TERRITOIRES_AVANCES = [
  {
    index: 7, nom: "Créer", symbole: "/pictos/porte-07-creer.svg", couleur: "#E8A87C",
    video: "/videos/braise.mp4",
    ambiance: { bg: "#1A1008", accent: "#E8A87C", texte: "Tu as traversé beaucoup. Maintenant quelque chose veut naître." },
    souffle: "Créer, ce n'est pas produire. C'est laisser sortir ce qui cherchait une forme.",
    questions: [
      "Qu'est-ce que tu portes depuis longtemps et qui cherche encore à exister ?",
      "Qu'est-ce qui t'empêche de créer — la peur du jugement, la peur de l'échec, ou la peur que ce ne soit pas assez bien ?",
      "Si tu pouvais créer une seule chose avant de mourir — qu'est-ce que ce serait ?",
    ],
    pratiques: [
      { niveau: 1, label: "Ouvrir", exercices: [
        "Prends une feuille. Dessine, écris, trace — sans intention. Juste laisser la main aller. 5 minutes sans te juger.",
        "Écris la liste de tout ce que tu voulais créer et que tu n'as jamais commencé. Sans te justifier.",
        "Choisis une chose dans cette liste. Pas la plus grande — la plus proche de toi maintenant.",
        "Note ce que tu ressentirais si tu créais vraiment cette chose. Pas ce que les autres en diraient. Toi.",
        "Passe 10 minutes aujourd'hui à faire quelque chose avec tes mains — cuisine, dessin, écriture. Sans objectif.",
      ]},
      { niveau: 2, label: "Traverser", exercices: [
        "Identifie la voix intérieure qui dit \"c'est nul\", \"c'est déjà été fait\", \"qui tu es pour faire ça\". D'où vient-elle ?",
        "Commence quelque chose aujourd'hui — même 10 minutes. Pas pour finir. Pour commencer.",
        "Écris : \"Ce que je veux créer dit de moi que…\"",
        "Trouve une personne qui crée quelque chose que tu admires. Qu'est-ce qui te touche dans ce qu'elle fait ?",
        "Écris la différence entre créer pour être vu et créer pour exister.",
      ]},
      { niveau: 3, label: "Intégrer", exercices: [
        "Relis ce que tu as créé ou commencé depuis le début de cette Porte. Qu'est-ce qui te surprend ?",
        "Partage quelque chose que tu as créé avec une personne de confiance. Observe ce que ça fait de montrer.",
        "Écris une lettre à la peur qui t'a longtemps empêché de créer.",
        "Choisis un engagement créatif que tu tiens pour les 30 prochains jours. Petit mais réel.",
        "Écris ce que créer t'a rendu de toi-même.",
      ]},
    ],
  },
  {
    index: 8, nom: "Relier", symbole: "/pictos/porte-08-relier.svg", couleur: "#9EC8B4",
    video: "/videos/cercles.mp4",
    ambiance: { bg: "#0A1610", accent: "#9EC8B4", texte: "Tu as appris à être avec toi. Maintenant tu peux être vraiment avec les autres." },
    souffle: "Revenir vers les autres depuis un endroit solide.",
    questions: [
      "Dans quelle relation te perds-tu encore toi-même ?",
      "Qu'est-ce que tu n'as jamais dit à quelqu'un que tu aimes parce que tu ne savais pas comment ?",
      "Quelle relation dans ta vie mérite d'être réparée — ou laissée partir avec douceur ?",
    ],
    pratiques: [
      { niveau: 1, label: "Ouvrir", exercices: [
        "Pense à quelqu'un que tu aimes. Écris ce que tu aimes en lui sans jamais lui avoir dit.",
        "Observe aujourd'hui une conversation que tu as. Est-ce que tu écoutes vraiment, ou tu attends de parler ?",
        "Écris : \"La relation dans laquelle je me sens le plus moi-même, c'est…\"",
        "Identifie quelqu'un que tu as éloigné sans le vouloir. Qu'est-ce qui s'est passé ?",
        "Note une chose que tu pourrais faire aujourd'hui pour nourrir une relation qui compte.",
      ]},
      { niveau: 2, label: "Traverser", exercices: [
        "Écris une lettre à quelqu'un à qui tu veux dire quelque chose d'important. Tu décides si tu l'envoies.",
        "Identifie un schéma qui revient dans tes relations — comment tu te comportes quand tu as peur d'être quitté ou déçu.",
        "Choisis une relation tendue. Qu'est-ce que tu peux changer dans ta façon d'être — sans attendre que l'autre change ?",
        "Écris la différence entre être seul et être solitaire. Où en es-tu ?",
        "Pense à quelqu'un qui t'a aimé sans que tu l'aies pleinement reçu. Comment tu vis ça ?",
      ]},
      { niveau: 3, label: "Intégrer", exercices: [
        "Dis à quelqu'un de confiance ce que tu as traversé dans ALBA. Pas tout — quelque chose de vrai.",
        "Fais un acte concret de réconciliation — avec quelqu'un, ou avec une partie de toi-même.",
        "Écris ce que tu attends désormais d'une relation — en termes de ce que tu es prêt à donner.",
        "Identifie une relation que tu as nourrie différemment depuis que tu as commencé ce parcours. Qu'est-ce qui a changé ?",
        "Écris le portrait de la façon dont tu veux aimer — pas être aimé. Aimer.",
      ]},
    ],
  },
  {
    index: 9, nom: "Protéger", symbole: "/pictos/porte-09-proteger.svg", couleur: "#B8A0D8",
    video: "/videos/pierre.mp4",
    ambiance: { bg: "#100D18", accent: "#B8A0D8", texte: "Protéger ce qui est sacré en toi n'est pas de l'égoïsme. C'est de la clarté." },
    souffle: "Une limite posée avec amour protège les deux personnes.",
    questions: [
      "Où dans ta vie dis-tu oui alors que tu veux dire non ?",
      "Quelle peur te rend incapable de poser une limite — la peur de décevoir, d'être abandonné, de paraître difficile ?",
      "Qu'est-ce qui mérite d'être protégé en toi — et que tu as laissé traverser trop souvent ?",
    ],
    pratiques: [
      { niveau: 1, label: "Ouvrir", exercices: [
        "Fais la liste des situations où tu te sacrifies sans que ça te soit demandé.",
        "Observe aujourd'hui une fois où tu dis oui alors que non serait plus juste. Juste observer — pas changer encore.",
        "Écris : \"La chose en moi que je protège le moins, c'est…\"",
        "Identifie une limite que tu aimerais poser. Qu'est-ce qui t'en empêche ?",
        "Note la différence entre une limite rigide et une limite claire. Tu veux laquelle ?",
      ]},
      { niveau: 2, label: "Traverser", exercices: [
        "Dis non à quelque chose aujourd'hui. Pas de justification. Juste non.",
        "Écris une limite que tu veux poser à quelqu'un. Formule-la depuis l'amour, pas depuis la colère.",
        "Identifie quelqu'un qui franchit régulièrement ce qui est important pour toi. Qu'est-ce qui te retient ?",
        "Écris ce que ça te coûte de ne pas te protéger.",
        "Pense à quelqu'un qui sait se protéger avec grâce. Qu'est-ce que tu peux apprendre de lui ?",
      ]},
      { niveau: 3, label: "Intégrer", exercices: [
        "Pose une limite réelle cette semaine. Observe comment l'autre réagit — et comment tu te sens.",
        "Écris une lettre à la version de toi qui a laissé passer trop de choses. Avec compassion.",
        "Note ce que protéger ton espace intérieur a rendu possible dans ta vie.",
        "Identifie ce qui est maintenant sacré pour toi — ce que tu ne négocieras plus.",
        "Écris : \"Je me protège maintenant parce que je sais que…\"",
      ]},
    ],
  },
  {
    index: 10, nom: "Transmettre", symbole: "/pictos/porte-10-transmettre.svg", couleur: "#C8A96E",
    video: "/videos/savane.mp4",
    ambiance: { bg: "#140F08", accent: "#C8A96E", texte: "Tu as appris quelque chose de rare. La question n'est plus quoi apprendre — mais quoi donner." },
    souffle: "Ce que tu as traversé n'est pas qu'à toi. Ça peut éclairer quelqu'un d'autre.",
    questions: [
      "Qu'est-ce que tu as compris sur toi-même que tu aurais aimé savoir 10 ans plus tôt ?",
      "À qui pourrais-tu transmettre quelque chose de ce que tu as traversé ?",
      "Quelle est la différence entre enseigner et témoigner ?",
    ],
    pratiques: [
      { niveau: 1, label: "Ouvrir", exercices: [
        "Écris trois choses que tu sais maintenant et qui auraient changé ta vie si tu les avais sues plus tôt.",
        "Pense à quelqu'un dans ton entourage qui traverse quelque chose que tu as traversé. Comment être présent sans imposer ton chemin ?",
        "Écris : \"Ce que j'ai à transmettre, ce n'est pas un savoir. C'est…\"",
        "Rappelle-toi quelqu'un qui t'a transmis quelque chose sans le savoir. Qu'a-t-il fait exactement ?",
        "Note la différence entre donner des conseils et partager une expérience.",
      ]},
      { niveau: 2, label: "Traverser", exercices: [
        "Écris un texte court sur quelque chose que tu as traversé. Pour toi d'abord. Pas pour être publié.",
        "Parle à quelqu'un de confiance de ce que tu as appris sur toi depuis le début de ce parcours.",
        "Identifie une façon concrète de transmettre — écrire, parler, être présent, témoigner. Laquelle te ressemble ?",
        "Écris ce que tu ne veux pas transmettre — les schémas, les croyances, les blessures que tu choisis de ne pas passer.",
        "Qu'est-ce que transmettre te demande de faire que tu n'as pas encore fait ?",
      ]},
      { niveau: 3, label: "Intégrer", exercices: [
        "Fais quelque chose de concret pour quelqu'un — une conversation vraie, une lettre, un geste.",
        "Écris ce que tu veux que les gens qui te connaissent aient reçu de toi — pas après ta mort, maintenant.",
        "Note ce que transmettre t'a appris sur toi que tu ne savais pas encore.",
        "Choisis quelque chose à partager avec quelqu'un qui en a besoin — une pensée, une pratique, un livre.",
        "Écris la lettre que tu aurais aimé recevoir à un moment difficile. Garde-la. Elle est peut-être pour quelqu'un d'autre un jour.",
      ]},
    ],
  },
  {
    index: 11, nom: "Habiter", symbole: "/pictos/porte-11-habiter.svg", couleur: "#A8B8C8",
    video: "/videos/vagues.mp4",
    ambiance: { bg: "#0A1016", accent: "#A8B8C8", texte: "Tu as beaucoup cherché. Maintenant apprends à rester là où tu es." },
    souffle: "Habiter sa vie, c'est arrêter d'en être le spectateur.",
    questions: [
      "Dans quels moments de ta vie es-tu vraiment présent — pas en train de penser à avant ou après ?",
      "Qu'est-ce que tu fuis encore en te réfugiant dans le passé ou le futur ?",
      "Si ta vie actuelle méritait d'être habitée pleinement — qu'est-ce qui changerait dans ta façon d'être là ?",
    ],
    pratiques: [
      { niveau: 1, label: "Ouvrir", exercices: [
        "Pendant un repas aujourd'hui, pose ton téléphone. Mange en étant là — vraiment là. Goûts, textures, sensations.",
        "Marche 10 minutes sans destination précise. Observe ce qui est là — pas ce qui devrait être là.",
        "Écris : \"Les moments où je suis vraiment présent, c'est quand…\"",
        "Note une habitude qui t'éloigne de l'instant présent. Juste la nommer.",
        "Assieds-toi dans un endroit que tu connais bien. Regarde-le comme si c'était la première fois.",
      ]},
      { niveau: 2, label: "Traverser", exercices: [
        "Identifie quelque chose dans ta vie actuelle que tu n'as pas encore vraiment accepté. Qu'est-ce que ça changerait si tu l'habitais tel que c'est ?",
        "Écris : \"La vie que je vis en ce moment mérite…\"",
        "Passe une heure sans plan, sans objectif, sans écran. Juste être là.",
        "Observe une relation proche. Est-ce que tu es vraiment présent dedans ou est-ce que tu es ailleurs ?",
        "Écris ce que tu rates quand tu n'es pas là.",
      ]},
      { niveau: 3, label: "Intégrer", exercices: [
        "Écris ce que \"habiter ta vie\" signifie concrètement pour toi — dans les actes du quotidien.",
        "Choisis un endroit — une pièce, un lieu — et vas-y passer du temps. Sans but. Juste être là.",
        "Note ce qui a changé dans ta façon d'être présent depuis le début de ce parcours.",
        "Écris une promesse à toi-même sur la façon dont tu veux habiter les prochains mois.",
        "Qu'est-ce que habiter vraiment ta vie rend possible que tu ne croyais pas possible avant ?",
      ]},
    ],
  },
  {
    index: 12, nom: "Être", symbole: "/pictos/porte-12-etre.svg", couleur: "#F5EFE6",
    video: "/videos/aube.mp4",
    ambiance: { bg: "#0A0A0E", accent: "#F5EFE6", texte: "Tu es arrivé quelque part. Pas à la fin — au commencement de toi-même." },
    souffle: "Il n'y a plus rien à devenir. Il y a juste à être ce que tu es déjà.",
    questions: [
      "Qui es-tu quand tu enlèves tout ce que tu fais, tout ce que tu possèdes, tous les rôles que tu joues ?",
      "Est-ce que tu t'aimes — pas malgré ce que tu es, mais à cause de ce que tu es ?",
      "Si tu avais une seule phrase à transmettre à quelqu'un qui commence ce chemin — quelle serait-elle ?",
    ],
    pratiques: [
      { niveau: 1, label: "Ouvrir", exercices: [
        "Écris qui tu es en une phrase. Pas ton nom, pas ton métier. Toi.",
        "Passe un moment aujourd'hui à ne rien faire. Pas méditer — être. Observer ce qui monte quand il n'y a rien à faire.",
        "Écris : \"Je suis en paix avec…\"",
        "Note une chose en toi que tu n'aurais pas acceptée au début de ce parcours et que tu accueilles maintenant.",
        "Qu'est-ce que tu n'as plus besoin de prouver ?",
      ]},
      { niveau: 2, label: "Traverser", exercices: [
        "Écris la liste de tout ce que tu portais quand tu as commencé ALBA. Qu'est-ce que tu ne portes plus ?",
        "Parle à voix haute de toi-même — seul — comme tu parlerais de quelqu'un que tu aimes et que tu respectes.",
        "Écris une lettre à la version de toi qui a ouvert ALBA pour la première fois. Qu'est-ce que tu lui dirais ?",
        "Identifie le moment dans ce parcours où quelque chose a vraiment changé. Qu'est-ce qui s'est passé ?",
        "Qu'est-ce qu'être toi signifie aujourd'hui que ça ne signifiait pas avant ?",
      ]},
      { niveau: 3, label: "Intégrer", exercices: [
        "Relis les lettres que tu as écrites tout au long du parcours. Qu'est-ce qui t'étonne dans ce que tu étais ?",
        "Écris le portrait de la personne que tu es maintenant — sans modestie, sans fausse humilité.",
        "Choisis un acte qui symbolise pour toi la fin d'un cycle et le début d'un autre.",
        "Écris ce que tu veux que ta vie soit — maintenant, depuis cet endroit où tu es.",
        "Dis à quelqu'un que tu aimes quelque chose que tu n'aurais pas pu dire avant d'avoir traversé tout ça.",
      ]},
    ],
  },
];

// ─── LUMIÈRES QUOTIDIENNES ────────────────────────────────────────────────────
const LUMIERES = [
  // CORPS
  { id: 1, famille: "Corps", titre: "Ce que le corps garde", texte: "Le corps se souvient de tout ce que l'esprit a voulu oublier. Les traumatismes ne disparaissent pas — ils se logent. Dans le ventre, la gorge, le dos, les épaules. Ce n'est pas une métaphore : les émotions non traitées modifient le tonus musculaire, la posture, la respiration. La bonne nouvelle : ce qui a été logé peut être libéré. Pas seulement par la parole — par le mouvement, le souffle, le toucher.", acte: "Pose une main sur un endroit de ton corps qui retient quelque chose. Respire vers cet endroit. Rien d'autre." },
  { id: 2, famille: "Corps", titre: "Les émotions dans l'intestin", texte: "L'intestin contient 500 millions de neurones et produit 95% de la sérotonine du corps. Ce n'est pas un hasard si l'angoisse se sent dans le ventre avant d'être pensée dans la tête. La communication entre le cerveau et le système digestif va dans les deux sens. Nourrir son microbiote, c'est aussi nourrir son état émotionnel.", acte: "Observe la prochaine fois que tu ressens une émotion. Où est-elle dans ton corps ? Dans le ventre ? La poitrine ? La gorge ?" },
  { id: 3, famille: "Corps", titre: "Le jeûne et l'espace intérieur", texte: "Quand le corps ne digère pas, il nettoie. Mais au-delà de la biologie, le jeûne crée un espace intérieur. Les traditions l'ont su avant la science : le ramadan, le carême, les retraites de vipassana. Priver le corps de nourriture, c'est aussi rediriger l'énergie vers d'autres perceptions. Beaucoup décrivent une clarté mentale, une sensibilité accrue, une présence différente au monde.", acte: "Si tu peux, saute un repas. Observe ce qui se passe — pas dans ton corps, dans ta tête." },
  { id: 4, famille: "Corps", titre: "Ce que la respiration change", texte: "Le souffle est le seul système autonome du corps que tu peux contrôler consciemment. Ralentir la respiration à 6 cycles par minute induit un état de cohérence cardiaque — le cœur, le cerveau et le système nerveux se synchronisent. En 5 minutes, le taux de cortisol baisse. Le souffle est le raccourci vers l'état intérieur.", acte: "5 minutes. Inspire 5 secondes, expire 5 secondes. Rien d'autre." },
  { id: 5, famille: "Corps", titre: "Le fascia, mémoire silencieuse", texte: "Le fascia est ce tissu conjonctif qui enveloppe chaque muscle, chaque organe, chaque os. Il est continu — une seule pièce qui traverse tout le corps. Les ostéopathes le savent : une tension au niveau des hanches peut venir d'un choc émotionnel ancien. Le fascia se souvient — jusqu'à ce qu'il soit travaillé, relâché, réhydraté. C'est pour ça qu'un massage profond peut déclencher des larmes sans raison apparente.", acte: "Étire-toi lentement. Reste 2 minutes dans chaque position. Observe ce qui remonte." },
  { id: 6, famille: "Corps", titre: "Le sommeil comme thérapie", texte: "Pendant le sommeil paradoxal, le cerveau retraite les émotions de la journée — mais sans les hormones de stress. C'est pour ça que \"la nuit porte conseil\" est biologiquement vrai : le lendemain matin, le même souvenir douloureux est moins chargé émotionnellement. Priver quelqu'un de sommeil, c'est lui retirer sa capacité à guérir émotionnellement.", acte: "Protège une nuit. Pas d'écran une heure avant. Observe la différence demain matin." },
  { id: 7, famille: "Corps", titre: "Le mouvement comme langage", texte: "Avant la parole, il y avait le corps. Les traumatismes sont des réponses de survie figées dans le corps. Les animaux les libèrent naturellement par le tremblement. Les humains ont appris à se contrôler — au détriment de la décharge. Danser, courir, trembler volontairement : c'est libérer ce qui était bloqué.", acte: "Bouge pendant 5 minutes sans objectif. Pas du sport — du mouvement libre." },
  // PRATIQUE
  { id: 8, famille: "Pratique", titre: "L'hypnose ericksonienne", texte: "Milton Erickson a découvert que chaque personne a en elle les ressources pour aller mieux — l'inconscient n'est pas un lieu de pulsions sombres, c'est un réservoir de solutions. L'hypnose ericksonienne crée un état de réceptivité dans lequel les résistances s'allègent. Un langage poétique, métaphorique, indirect — qui contourne la censure du mental. On l'utilise pour la douleur chronique, les phobies, le deuil, la confiance en soi.", acte: "Ferme les yeux. Imagine un endroit où tu te sens parfaitement en sécurité. Reste-y 5 minutes." },
  { id: 9, famille: "Pratique", titre: "Le journaling thérapeutique", texte: "James Pennebaker a conduit dans les années 80 une expérience simple : écrire sur un traumatisme pendant 20 minutes, 4 jours de suite. Résultat : moins d'anxiété, moins de visites chez le médecin. L'écriture ne guérit pas — elle organise. Elle transforme une expérience brute et chaotique en récit, et le récit donne du sens.", acte: "Écris pendant 20 minutes sur quelque chose que tu n'as jamais vraiment écrit. Sans relire. Sans corriger." },
  { id: 10, famille: "Pratique", titre: "L'EMDR", texte: "Eye Movement Desensitization and Reprocessing. La technique consiste à exposer quelqu'un à un souvenir traumatique tout en faisant des stimulations bilatérales — yeux, sons, tapotements. Le cerveau retraite le souvenir et le stocke différemment — moins chargé, moins présent. L'OMS la reconnaît comme traitement du stress post-traumatique.", acte: "Pense à un souvenir légèrement inconfortable. Bouge les yeux de gauche à droite pendant 30 secondes. Observe." },
  { id: 11, famille: "Pratique", titre: "La méditation de bienveillance", texte: "Metta signifie \"bienveillance\" en pali. La pratique : générer intentionnellement de la chaleur d'abord pour soi, puis pour des proches, puis pour des neutres, puis pour des difficiles. Les études montrent que 8 semaines de pratique augmentent l'activation de l'insula — la zone du cerveau liée à l'empathie. C'est un entraînement — pas un sentiment qu'on attend, mais qu'on cultive.", acte: "Dis mentalement à quelqu'un que tu aimes : \"Puisses-tu être heureux. Puisses-tu être en paix.\" Répète 5 fois. Puis dis-le à toi-même." },
  { id: 12, famille: "Pratique", titre: "La visualisation", texte: "Le cerveau ne fait pas bien la différence entre une expérience vécue et une expérience visualisée avec précision. Les neurones s'activent de la même façon. C'est pour ça que les sportifs de haut niveau visualisent leurs performances avant de les faire — pas comme un vœu, comme un entraînement neurologique.", acte: "Ferme les yeux et visualise une version de toi qui gère une situation difficile avec calme et clarté. En détail — ce que tu dis, comment tu te tiens, ce que tu ressens." },
  { id: 13, famille: "Pratique", titre: "Le jeûne et les envies", texte: "Au-delà des bénéfices métaboliques, le jeûne intermittent change le rapport à soi. Il demande d'apprendre à distinguer la faim physique de la faim émotionnelle. Il développe une tolérance à l'inconfort dans une société qui offre une satisfaction immédiate à tout moment. Les pratiquants décrivent une relation différente à leurs envies — pas seulement de nourriture.", acte: "Observe la prochaine fois que tu manges sans avoir faim. Qu'est-ce que tu cherchais vraiment ?" },
  { id: 14, famille: "Pratique", titre: "La cohérence cardiaque", texte: "Le cœur possède 40 000 neurones et génère un champ électromagnétique 60 fois plus puissant que celui du cerveau. La cohérence cardiaque — cet état de synchronisation entre le rythme cardiaque, la respiration et le système nerveux — est mesurable et reproductible. 5 minutes, 3 fois par jour, à 6 respirations par minute. Effets prouvés sur le stress et l'anxiété.", acte: "Essaie le 365 : inspire 5 secondes, expire 5 secondes. 5 minutes. 3 fois dans la journée si possible." },
  // SAGESSE
  { id: 15, famille: "Sagesse", titre: "Les 4 accords toltèques", texte: "Don Miguel Ruiz a distillé une sagesse ancienne en 4 principes. Que ta parole soit impeccable. Ne prends rien personnellement. Ne fais pas de suppositions. Fais toujours de ton mieux. Ces quatre règles semblent simples. Les tenir une seule journée révèle à quel point elles ne le sont pas.", acte: "Choisis un des quatre accords. Tiens-le pour aujourd'hui seulement. Observe." },
  { id: 16, famille: "Sagesse", titre: "Marc Aurèle et le moment présent", texte: "Deux mille ans avant le mouvement mindfulness, un empereur romain écrivait chaque soir dans un journal jamais destiné à la publication. Ce qu'il répète inlassablement : tu ne contrôles que ton jugement, pas les événements. La douleur n'est pas dans ce qui arrive — elle est dans ce qu'on pense de ce qui arrive. L'obstacle est le chemin.", acte: "Face à une situation difficile, demande-toi : est-ce que je souffre de l'événement, ou de ce que j'en pense ?" },
  { id: 17, famille: "Sagesse", titre: "Rumi et le vide comme porte", texte: "Rumi, poète soufi du XIIIe siècle, a pour image centrale le ney — la flûte de roseau qui pleure depuis qu'on l'a coupée du roseau. Cette coupure n'est pas une blessure — c'est ce qui lui donne sa musique. Le vide en nous n'est pas un manque à combler. C'est l'espace d'où vient le son.", acte: "Écris une chose que tu as perdue et qui t'a donné quelque chose que tu n'aurais pas eu autrement." },
  { id: 18, famille: "Sagesse", titre: "Jung et l'ombre", texte: "Carl Gustav Jung appelait \"l'ombre\" tout ce que nous refusons de voir en nous — nos colères, nos jalousies, nos lâchetés, nos désirs inavoués. Ce que nous ne reconnaissons pas en nous, nous le projetons sur les autres. Faire la paix avec son ombre — pas la combattre, l'accueillir — c'est une des formes les plus profondes d'honnêteté envers soi-même.", acte: "Identifie quelque chose qui t'énerve profondément chez quelqu'un. Est-ce que tu reconnais cette chose en toi, quelque part ?" },
  { id: 19, famille: "Sagesse", titre: "L'impermanence", texte: "Anicca — l'impermanence — est l'une des trois marques de l'existence dans le bouddhisme. Tout change, tout passe, rien n'est fixe. Ce n'est pas du pessimisme : c'est une libération. La souffrance vient de l'attachement à ce qui ne peut pas durer. Mais l'impermanence vaut aussi pour la douleur — elle aussi passera.", acte: "Face à quelque chose de difficile que tu vis en ce moment. Rappelle-toi : dans 5 ans, où sera-ce ?" },
  { id: 20, famille: "Sagesse", titre: "Les Évangiles comme textes intérieurs", texte: "Peu importe la foi — les Évangiles contiennent des textes d'une profondeur psychologique rare. \"Enlève d'abord la poutre de ton propre œil.\" \"Qui veut sauver sa vie la perdra.\" Ce ne sont pas des injonctions morales — ce sont des descriptions précises du fonctionnement de l'ego. Lus comme textes intérieurs, sans dogme, ils disent quelque chose d'universel.", acte: "Relis une parabole — le fils prodigue, le bon samaritain. Lis-la comme si elle parlait de toi maintenant." },
  { id: 21, famille: "Sagesse", titre: "Viktor Frankl et le sens", texte: "Viktor Frankl a survécu à Auschwitz et en a tiré une thérapie : la logothérapie. Sa thèse : l'humain peut supporter presque n'importe quoi s'il trouve un sens à ce qu'il traverse. \"Celui qui a un pourquoi peut supporter presque n'importe quel comment.\" Le sens ne se trouve pas — il se crée.", acte: "Face à quelque chose de difficile dans ta vie, demande-toi : quel sens est-ce que je peux choisir de lui donner ?" },
  // ÉCOUTE
  { id: 22, famille: "Écoute", titre: "Le corps n'oublie rien", texte: "Bessel van der Kolk démontre dans ce livre que les traumatismes ne sont pas seulement des souvenirs — ils sont des expériences corporelles figées. Il y présente des approches que la psychiatrie traditionnelle ignorait : EMDR, yoga, théâtre, neurofeedback. Pas parce qu'elles sont alternatives — parce qu'elles atteignent ce que la parole seule ne peut pas atteindre.", acte: "Retiens un nom : Bessel van der Kolk. Si un jour tu veux comprendre pourquoi le corps parle, commence par là." },
  { id: 23, famille: "Écoute", titre: "L'homme en quête de sens", texte: "Écrit en 9 jours après la libération des camps, ce livre de Viktor Frankl n'a pas pris une ride. C'est à la fois un témoignage et une théorie — la preuve que même dans les conditions les plus extrêmes, quelque chose en nous reste libre. Pas libre de ce qui nous arrive. Libre de comment nous y répondons.", acte: "Aujourd'hui, identifie une situation où tu n'as pas le choix de ce qui se passe — mais où tu as le choix de comment tu y réponds." },
  { id: 24, famille: "Écoute", titre: "Pourquoi dormons-nous ?", texte: "Matthew Walker a passé 20 ans à étudier le sommeil. Le sommeil n'est pas un temps mort : c'est quand le cerveau consolide les apprentissages, nettoie les déchets métaboliques, retraite les émotions. Priver quelqu'un de sommeil, c'est le priver de santé mentale à long terme.", acte: "Cette nuit : couche-toi 30 minutes plus tôt que d'habitude. Observe ce que ça change demain." },
  { id: 25, famille: "Écoute", titre: "Les 4 accords toltèques", texte: "Don Miguel Ruiz a écrit un des livres les plus vendus au monde sur la croissance personnelle — et l'un des plus solides. Pas de psychologie de comptoir : une sagesse ancienne reformulée avec simplicité. Ce qui le distingue : il ne propose pas des techniques, mais des principes de vie. On peut le relire chaque année et y trouver quelque chose de nouveau.", acte: "Trouve ce livre. Ouvre-le à la première page. Lis juste la première page." },
  { id: 26, famille: "Écoute", titre: "Conversations avec Dieu", texte: "Neale Donald Walsch a écrit ce livre dans un état de désespoir profond. Il a commencé une lettre de colère — et quelque chose a répondu. Peu importe ce qu'on pense de la nature de cette réponse : le dialogue qui en résulte pose des questions que peu de livres osent poser sur l'amour, la peur, la culpabilité. Lu comme une conversation intérieure radicalement honnête.", acte: "Écris aujourd'hui une lettre à une force plus grande que toi — que tu l'appelles Dieu, le Vivant, la Vie, ou rien. Dis ce que tu n'as jamais dit." },
  { id: 27, famille: "Écoute", titre: "La puissance de la joie", texte: "Frédéric Lenoir distingue le plaisir — fugace, dépendant de l'extérieur — de la joie, qui est un état profond indépendant des circonstances. Il traverse les traditions — stoïcisme, bouddhisme, christianisme mystique — pour montrer que la joie se cultive. Pas comme une injonction au bonheur, mais comme une discipline intérieure.", acte: "Nomme trois choses qui te donnent une joie profonde — pas un plaisir, une joie. Observe ce qu'elles ont en commun." },
  { id: 28, famille: "Écoute", titre: "Les Pensées de Marc Aurèle", texte: "Marcus Aurelius était l'homme le plus puissant du monde — et il passait ses nuits à se rappeler qu'il n'était rien. Ces notes personnelles, jamais destinées à être publiées, sont d'une modernité troublante. Il parle de l'ego, du temps, de la mort, de la colère, de la compassion. Chaque entrée est courte. On peut l'ouvrir au hasard.", acte: "Ouvre ce livre au hasard — ou cherche une citation de Marc Aurèle en ligne. Lis-la lentement. Deux fois." },
];

// Obtenir la lumière du jour (tourne en boucle)
const getLumiereDuJour = () => {
  const debut = new Date("2025-01-01");
  const auj = new Date();
  const joursSinceDebut = Math.floor((auj - debut) / (1000 * 60 * 60 * 24));
  return LUMIERES[joursSinceDebut % LUMIERES.length];
};

// ─── BASE DE RECOMMANDATIONS ─────────────────────────────────────────────────
const RECO_LIVRES = [
  { id: "tolle-moment-present", titre: "Le Pouvoir du moment présent", auteur: "Eckhart Tolle", type: "livre", themes: ["anxiete","mental","meditation","present","burn-out"], portes: [1,3,11], description: "Une seule idée, développée avec profondeur : la souffrance naît du mental qui vit dans le passé ou le futur. La sortie est toujours ici, maintenant." },
  { id: "tolle-nouvelle-terre", titre: "Nouvelle Terre", auteur: "Eckhart Tolle", type: "livre", themes: ["eveil","ego","quete-de-sens","transformation","mental"], portes: [2,6,12], description: "Tolle décortique l'ego — cette voix dans la tête qui croit être toi — et montre comment s'en libérer sans le combattre." },
  { id: "marc-aurele-pensees", titre: "Pensées pour moi-même", auteur: "Marc Aurèle", type: "livre", themes: ["mental","anxiete","present","sagesse","stoicisme"], portes: [1,4,11], description: "L'homme le plus puissant du monde passait ses nuits à se rappeler qu'il n'était rien. Ces notes privées sont d'une modernité troublante." },
  { id: "guillemin-deux-petits-pas", titre: "Deux petits pas sur le sable mouillé", auteur: "Anne-Dauphine Guillemin", type: "livre", themes: ["deuil","enfant","maladie","amour","perte"], portes: [3,4,5], description: "Une mère accompagne sa fille atteinte d'une maladie rare. Un texte d'une grâce bouleversante sur l'amour et ce que la vie garde même dans les moments les plus sombres." },
  { id: "frankl-sens", titre: "L'Homme en quête de sens", auteur: "Viktor Frankl", type: "livre", themes: ["deuil","souffrance","sens","resilience","perte","mort"], portes: [4,6,12], description: "Écrit après Auschwitz. La thèse : on peut supporter presque n'importe quoi si on trouve un sens à ce qu'on traverse. Le sens ne se trouve pas — il se crée." },
  { id: "rinpoche-tibetain", titre: "Le Livre tibétain de la vie et de la mort", auteur: "Sogyal Rinpoché", type: "livre", themes: ["deuil","mort","spiritualite","invisible","apres-la-mort"], portes: [4,10,12], description: "La grande référence bouddhiste sur la mort et ce qui vient après. Un accompagnement profond pour ceux qui ont perdu quelqu'un ou apprivoisent leur propre finitude." },
  { id: "gibran-prophete", titre: "Le Prophète", auteur: "Khalil Gibran", type: "livre", themes: ["separation","amour","deuil","sens","beaute","relations"], portes: [5,8,12], description: "Un des textes les plus beaux jamais écrits sur l'amour, la liberté, la mort. Des poèmes en prose qui disent ce que les mots ordinaires ne peuvent pas dire." },
  { id: "rosenberg-communication", titre: "Les Mots sont des fenêtres (ou des murs)", auteur: "Marshall Rosenberg", type: "livre", themes: ["relations","communication","colere","conflit","separation"], portes: [8,9], description: "La Communication Non Violente. Parler depuis ce qu'on ressent plutôt que depuis ce qu'on reproche. Transforme les relations de l'intérieur." },
  { id: "van-der-kolk-corps", titre: "Le Corps n'oublie rien", auteur: "Bessel van der Kolk", type: "livre", themes: ["trauma","corps","guerison","emotions","therapie","maladie"], portes: [2,3,4], description: "Les traumatismes ne sont pas que des souvenirs — ils vivent dans le corps. Van der Kolk montre comment les libérer. Un livre qui change la façon de se comprendre." },
  { id: "odoul-dis-moi", titre: "Dis-moi où tu as mal, je te dirai pourquoi", auteur: "Michel Odoul", type: "livre", themes: ["corps","maladie","emotions","guerison","psychosomatique"], portes: [2,3,5], description: "Chaque douleur physique dit quelque chose d'une tension émotionnelle. Odoul décrypte le langage du corps comme mémoire vivante." },
  { id: "calestrémé-energie", titre: "La Clé de Votre Énergie", auteur: "Natacha Calestrémé", type: "livre", themes: ["energie","guerison","emotions","corps","trauma"], portes: [3,4,5], description: "22 protocoles pour se libérer émotionnellement. Des guérisons que la médecine classique n'expliquait pas. Accessible, concret, parfois bouleversant." },
  { id: "coelho-alchimiste", titre: "L'Alchimiste", auteur: "Paulo Coelho", type: "livre", themes: ["quete-de-sens","destin","transformation","courage","reve"], portes: [6,7,10], description: "Un berger andalou part chercher un trésor. Ce qu'il trouve, c'est lui-même. Court, lumineux, universel." },
  { id: "prophetie-andes", titre: "La Prophétie des Andes", auteur: "James Redfield", type: "livre", themes: ["quete-de-sens","synchronicites","eveil","energie","transformation"], portes: [1,6,7], description: "Un roman initiatique sur les coïncidences qui ne sont pas des coïncidences. Neuf révélations sur la façon dont l'énergie circule entre les êtres." },
  { id: "conversations-dieu", titre: "Conversations avec Dieu", auteur: "Neale Donald Walsch", type: "livre", themes: ["quete-de-sens","spiritualite","amour","sens","invisible"], portes: [5,10,12], description: "Une lettre de colère à Dieu — et une réponse. Ce dialogue dit des choses que peu de livres osent dire sur l'amour et la peur." },
  { id: "dialogues-ange", titre: "Dialogues avec l'Ange", auteur: "Gitta Mallasz", type: "livre", themes: ["spiritualite","invisible","quete-de-sens","mort","eveil"], portes: [5,10,12], description: "Budapest, 1943. Quatre personnes reçoivent des messages d'une présence qu'elles appellent l'Ange. Un texte qui ne ressemble à aucun autre." },
  { id: "lenoir-puissance-joie", titre: "La Puissance de la joie", auteur: "Frédéric Lenoir", type: "livre", themes: ["quete-de-sens","bonheur","sagesse","transformation","bien-etre"], portes: [6,11,12], description: "La différence entre le plaisir — fugace — et la joie, état profond indépendant des circonstances. La joie se cultive." },
  { id: "4-accords-tolteques", titre: "Les Quatre Accords Toltèques", auteur: "Don Miguel Ruiz", type: "livre", themes: ["croyances","mental","relations","liberte","confiance-en-soi"], portes: [1,2,4], description: "Quatre principes tirés de la sagesse toltèque. Simples à lire, difficiles à tenir — et profondément libérateurs." },
  { id: "bourbeau-5-blessures", titre: "Les 5 blessures qui empêchent d'être soi-même", auteur: "Lise Bourbeau", type: "livre", themes: ["croyances","schemas","confiance-en-soi","blessures","relations"], portes: [2,5,9], description: "Cinq blessures fondamentales — rejet, abandon, humiliation, trahison, injustice — et comment elles façonnent nos comportements à notre insu." },
  { id: "transurfing-zeland", titre: "Transurfing — Les espaces des variantes", auteur: "Vadim Zeland", type: "livre", themes: ["realite","intention","energie","transformation","eveil"], portes: [6,7,9], description: "Nous naviguons entre des variantes possibles de notre vie — et notre énergie intérieure détermine laquelle se manifeste. Déroutant, unique, puissant." },
  { id: "cameron-artist-way", titre: "Libérez votre créativité", auteur: "Julia Cameron", type: "livre", themes: ["creativite","confiance-en-soi","blocage-creatif","transformation"], portes: [7], description: "12 semaines pour débloquer sa créativité. La créativité est liée à la spiritualité, et tout le monde peut créer. Un programme qui a changé des millions de vies." },
  { id: "allix-test", titre: "Le Test", auteur: "Stéphane Allix", type: "livre", themes: ["deuil","mort","invisible","spiritualite","apres-la-mort"], portes: [4,10,12], description: "Allix cache des objets dans son cercueil, puis interroge des médiums à son insu. Ce qu'il découvre ébranle ses certitudes. Rigoureux sur ce que la science n'explique pas." },
  { id: "ferguson-nerf-vague", titre: "Les Pouvoirs Secrets du Nerf Vague", auteur: "Anna Ferguson", type: "livre", themes: ["corps","trauma","anxiete","stress","guerison","burn-out"], portes: [3,4,11], description: "Le nerf vague régule les émotions, le stress, l'inflammation. Anna Ferguson montre comment l'activer pour sortir de l'état de survie — respiration, froid, son. Un livre ancré dans la science du système nerveux." },
  { id: "moradel-niagara", titre: "Sur les Hauteurs des Chutes du Niagara", auteur: "Steve Moradel", type: "livre", themes: ["quete-de-sens","identite","liberte","roman"], portes: [1,6,12], description: "Un roman qui traverse l'identité, la quête, la liberté. Depuis les racines caribéennes, il dit quelque chose d'universel sur ce qu'on cherche quand on regarde vers l'horizon." },
];

const RECO_PODCASTS = [
  { id: "change-ma-vie", titre: "Change ma vie", auteur: "Clotilde Dusoulier", type: "podcast", themes: ["mental","emotions","confiance-en-soi","anxiete","bien-etre"], portes: [1,2,3], description: "Plus de 40 millions d'écoutes. Des outils précis et concrets pour mieux se comprendre et changer de l'intérieur. La référence absolue en français." },
  { id: "vie-interieure", titre: "La Vie intérieure", auteur: "Christophe André", type: "podcast", themes: ["emotions","meditation","pleine-conscience","anxiete","present"], portes: [3,11], description: "4 à 5 minutes par épisode sur des émotions précises. Un espace de reconnexion à soi, rare et juste. Sur France Culture." },
  { id: "metamorphose", titre: "Métamorphose", auteur: "Anne Ghesquière", type: "podcast", themes: ["transformation","spiritualite","sante","psychologie","quete-de-sens"], portes: [2,6,10], description: "La référence française des podcasts bien-être. On pioche à la carte selon ce qu'on traverse." },
  { id: "passeport-invisible", titre: "Passeport pour l'invisible", auteur: "Stéphane Allix", type: "podcast", themes: ["spiritualite","mort","deuil","invisible","apres-la-mort"], portes: [4,10,12], description: "Les expériences aux frontières du visible. Rigoureux, ouvert, bouleversant. Pour ceux qui questionnent l'invisible." },
  { id: "huberman-lab", titre: "Huberman Lab", auteur: "Andrew Huberman", type: "podcast", themes: ["corps","sommeil","stress","cerveau","burn-out","science"], portes: [3,4,11], description: "Le neuroscientifique de Stanford traduit la science du cerveau en protocoles pratiques. Chaque épisode vaut plusieurs heures de lecture." },
  { id: "esther-perel", titre: "Where Should We Begin?", auteur: "Esther Perel", type: "podcast", themes: ["relations","couple","separation","communication","amour"], portes: [4,8,9], description: "De vrais couples en séance de thérapie. En direct, sans filtre. Ce qu'on entend ressemble à ce qu'on vit. Le meilleur podcast sur l'amour et la rupture." },
  { id: "feeling-good", titre: "Feeling Good Podcast", auteur: "Dr David Burns", type: "podcast", themes: ["depression","anxiete","therapie-cognitive","croyances","confiance-en-soi"], portes: [1,2,4], description: "Le psychiatre Burns répond à des questions réelles sur la dépression, l'anxiété, la honte. Direct, efficace." },
  { id: "tara-brach", titre: "Tara Brach Podcast", auteur: "Tara Brach", type: "podcast", themes: ["meditation","trauma","pleine-conscience","acceptation","guerison"], portes: [3,5,11], description: "Psychologue et enseignante bouddhiste. Ses méditations guidées sur la présence et l'auto-compassion sont parmi les plus belles disponibles." },
  { id: "dialogues-midal", titre: "Dialogues", auteur: "Fabrice Midal", type: "podcast", themes: ["philosophie","meditation","present","sens","bien-etre"], portes: [1,11,12], description: "Le fondateur de l'École Occidentale de Méditation en dialogue avec des penseurs. Une façon douce et profonde d'approcher la méditation." },
  { id: "le-phare", titre: "Le Phare", auteur: "Julien Maurel", type: "podcast", themes: ["transformation","spiritualite","resilience","quete-de-sens","foi"], portes: [6,10,12], description: "Des témoignages de transformation spirituelle. Des gens ordinaires qui racontent comment quelque chose a basculé en eux." },
  { id: "instant-zen", titre: "L'Instant Zen", auteur: "Chen Li / Le Monastère", type: "podcast", themes: ["meditation","present","anxiete","bien-etre","paix"], portes: [3,11,12], description: "Un podcast de méditation et de sagesse zen par le Monastère. Des épisodes courts, apaisants, ancrés dans la tradition bouddhiste. Pour ceux qui ont besoin de silence intérieur." },
];

const ETATS_THEMES_MAP = {
  "separation":       ["separation","amour","deuil","relations","guerison"],
  "deuil":            ["deuil","mort","perte","invisible","souffrance"],
  "anxiete":          ["anxiete","mental","stress","present","burn-out"],
  "burn-out":         ["burn-out","corps","stress","energie","present"],
  "quete-de-sens":    ["quete-de-sens","sens","eveil","spiritualite","transformation"],
  "creer":            ["creativite","blocage-creatif","reve","transformation","confiance-en-soi"],
  "relation-toxique": ["relations","schemas","blessures","croyances","communication"],
  "confiance-en-soi": ["croyances","schemas","liberte","confiance-en-soi","blessures"],
  "trauma":           ["trauma","corps","guerison","emotions","blessures"],
  "se-reconnecter":   ["corps","present","meditation","emotions","bien-etre"],
  "heureux":          ["sens","bonheur","quete-de-sens","sagesse","transformation"],
  "maladie":          ["maladie","corps","guerison","psychosomatique","energie"],
};

const getRecommandationsPersonnalisees = (etats = [], porte = null, max = 3) => {
  const themes = [...new Set(etats.flatMap(e => ETATS_THEMES_MAP[e] || []))];
  const tous = [...RECO_LIVRES, ...RECO_PODCASTS];
  if (!themes.length && !porte) return tous.slice(0, max);
  return tous
    .filter(r => r.themes.some(t => themes.includes(t)) || (porte && r.portes?.includes(porte)))
    .sort((a, b) => {
      const sA = a.themes.filter(t => themes.includes(t)).length + (porte && a.portes?.includes(porte) ? 2 : 0);
      const sB = b.themes.filter(t => themes.includes(t)).length + (porte && b.portes?.includes(porte) ? 2 : 0);
      return sB - sA;
    })
    .slice(0, max);
};

// ─── SYSTÈME SEMI-ADAPTATIF ────────────────────────────────────────────────────
// Cartographie : mots-clés → index d'exercice prioritaire par Clé
// Format : { cleIndex: { motCle: indexExercicePrioritaire } }
const SIGNAL_MAP = {
  // Clé I — Reconnaître
  1: {
    mots: [
      { tags: ["peur","effrayé","effrayée","angoisse","anxieux","anxieuse","inquiet","inquiète"], exercice: 0, niveau: 0 },
      { tags: ["rôle","masque","semblant","façade","image","paraître"], exercice: 1, niveau: 0 },
      { tags: ["habitude","automatique","répète","répétition","pattern","schéma"], exercice: 2, niveau: 1 },
      { tags: ["porter","portes","charge","poids","lourd","lourde"], exercice: 1, niveau: 1 },
      { tags: ["contrôle","maîtrise","maîtriser","gérer","gestion"], exercice: 0, niveau: 1 },
    ]
  },
  // Clé II — Comprendre
  2: {
    mots: [
      { tags: ["enfance","enfant","petite","petit","parents","mère","père","famille"], exercice: 2, niveau: 0 },
      { tags: ["critique","critiques","jugement","juger","me juge","nul","nulle"], exercice: 1, niveau: 0 },
      { tags: ["répète","répétition","schéma","pattern","encore","toujours"], exercice: 0, niveau: 1 },
      { tags: ["faute","coupable","responsable","ma faute"], exercice: 1, niveau: 2 },
    ]
  },
  // Clé III — Ressentir
  3: {
    mots: [
      { tags: ["corps","ventre","gorge","poitrine","tension","contracté","contractée"], exercice: 0, niveau: 0 },
      { tags: ["colère","rage","furieux","furieuse","en colère"], exercice: 2, niveau: 1 },
      { tags: ["tristesse","triste","pleurer","pleuré","larmes"], exercice: 0, niveau: 1 },
      { tags: ["vide","absent","absente","détaché","détachée","rien","insensible"], exercice: 1, niveau: 1 },
      { tags: ["honte","humilié","humiliée","gêne","embarrassé"], exercice: 0, niveau: 2 },
    ]
  },
  // Clé IV — Lâcher
  4: {
    mots: [
      { tags: ["porter","portes","charge","poids","épuisé","épuisée","fatigue"], exercice: 0, niveau: 0 },
      { tags: ["et si","regret","regrette","aurait","aurais","raté","raté"], exercice: 0, niveau: 1 },
      { tags: ["pardonner","pardonne","pardon","rancune","rancœur"], exercice: 1, niveau: 1 },
      { tags: ["parfait","perfectionnisme","jamais assez","bien faire"], exercice: 2, niveau: 1 },
      { tags: ["lettre","écrire","écrit","écrire à"], exercice: 0, niveau: 2 },
    ]
  },
  // Clé V — Recevoir
  5: {
    mots: [
      { tags: ["mérite","mériter","mérité","valeur","compte","importes"], exercice: 0, niveau: 0 },
      { tags: ["seul","seule","aide","aidé","demander","demande"], exercice: 0, niveau: 1 },
      { tags: ["saboter","sabote","empêche","bloque","bloqué"], exercice: 1, niveau: 1 },
      { tags: ["amour","aimer","aimé","aimée","aime"], exercice: 0, niveau: 2 },
    ]
  },
  // Clé VI — Devenir
  6: {
    mots: [
      { tags: ["peur","bloqué","bloquée","peur d'avancer","remet","reporte"], exercice: 0, niveau: 1 },
      { tags: ["avenir","futur","demain","dans quelques","années"], exercice: 2, niveau: 0 },
      { tags: ["valeur","valeurs","sens","vouloir","envie"], exercice: 1, niveau: 0 },
      { tags: ["lettre","écrire","écrit"], exercice: 0, niveau: 2 },
    ]
  },
};

// Extrait le dernier texte significatif de l'Ardoise
const extraireSignal = (allPostits) => {
  if (!allPostits) return "";
  try {
    // Cherche dans les post-its (objets avec .content ou .texte)
    const tous = Object.values(allPostits).flat().filter(Boolean);
    if (!tous.length) return "";
    // Trie par date décroissante si possible
    const sorted = tous.sort((a, b) => {
      const da = new Date(a.createdAt || a.created_at || 0);
      const db2 = new Date(b.createdAt || b.created_at || 0);
      return db2 - da;
    });
    const dernier = sorted[0];
    return (dernier.content || dernier.texte || dernier.text || "").toLowerCase();
  } catch { return ""; }
};

// Détecte les signaux dans un texte et retourne l'exercice recommandé
const detecterSignal = (texte, cleIndex) => {
  if (!texte || !cleIndex) return null;
  const map = SIGNAL_MAP[cleIndex];
  if (!map) return null;
  const txt = texte.toLowerCase();
  for (const signal of map.mots) {
    if (signal.tags.some(tag => txt.includes(tag))) {
      return { niveau: signal.niveau, exerciceIdx: signal.exercice, tag: signal.tags[0] };
    }
  }
  return null;
};

// ─── LUMIÈRE QUOTIDIENNE ──────────────────────────────────────────────────────
const FAMILLE_COULEURS = {
  "Corps":    "#D4856A",
  "Pratique": "#7B9EA8",
  "Sagesse":  "#C8A96E",
  "Écoute":   "#A87BC8",
};

const LumiereDuJour = () => {
  const lumiere = getLumiereDuJour();
  const couleur = FAMILLE_COULEURS[lumiere.famille] || T.or;
  const [acteVu, setActeVu] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("alba_lumiere_lue");
      const aujourd = new Date().toDateString();
      if (saved === aujourd) setActeVu(true);
    } catch {}
  }, []);

  const marquerLue = () => {
    setActeVu(true);
    try { localStorage.setItem("alba_lumiere_lue", new Date().toDateString()); } catch {};
  };

  return (
    <div style={{ padding: "1.5rem 1.5rem 8rem", maxWidth: 540, margin: "0 auto" }}>
      <style>{`@keyframes fadeUpL { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }`}</style>

      {/* En-tête */}
      <div style={{ textAlign: "center", marginBottom: "2rem", animation: "fadeUpL 0.5s ease forwards" }}>
        <div style={{
          fontFamily: T.sans, fontWeight: 300, fontSize: "0.62rem",
          letterSpacing: "0.5em", textTransform: "uppercase",
          color: couleur, marginBottom: "0.5rem",
        }}>Lumière du jour · {lumiere.famille}</div>
        <div style={{
          fontFamily: T.serif, fontSize: "1.4rem", fontWeight: 300,
          color: T.orPale, lineHeight: 1.3,
        }}>{lumiere.titre}</div>
      </div>

      {/* Texte */}
      <div style={{
        padding: "1.5rem",
        background: `${couleur}0A`,
        border: `1px solid ${couleur}22`,
        borderRadius: "8px",
        marginBottom: "1.5rem",
        animation: "fadeUpL 0.6s ease forwards 0.1s", opacity: 0,
      }}>
        <p style={{
          fontFamily: T.serif, fontSize: "1rem",
          color: T.aube, lineHeight: 1.9, margin: 0,
        }}>{lumiere.texte}</p>
      </div>

      {/* Acte du jour */}
      <div
        onClick={marquerLue}
        style={{
          padding: "1.2rem 1.4rem",
          background: acteVu ? `${couleur}18` : `${T.nuit2}`,
          border: `1px solid ${acteVu ? couleur + "55" : couleur + "33"}`,
          borderLeft: `3px solid ${couleur}`,
          borderRadius: "0 8px 8px 0",
          cursor: "pointer",
          transition: "all 0.3s",
          animation: "fadeUpL 0.6s ease forwards 0.2s", opacity: 0,
        }}
      >
        <div style={{
          fontFamily: T.sans, fontWeight: 300, fontSize: "0.58rem",
          letterSpacing: "0.4em", textTransform: "uppercase",
          color: couleur, marginBottom: "0.6rem",
        }}>Pour aujourd'hui</div>
        <p style={{
          fontFamily: T.serif, fontStyle: "italic",
          fontSize: "0.95rem", color: acteVu ? couleur : T.orPale,
          lineHeight: 1.7, margin: 0,
        }}>{lumiere.acte}</p>
        {acteVu && (
          <div style={{
            marginTop: "0.8rem",
            fontFamily: T.sans, fontWeight: 300, fontSize: "0.58rem",
            letterSpacing: "0.3em", textTransform: "uppercase",
            color: couleur,
          }}>✓ Lu aujourd'hui</div>
        )}
      </div>

      {/* Navigation entre lumières */}
      <div style={{
        marginTop: "2rem", textAlign: "center",
        fontFamily: T.serif, fontStyle: "italic",
        fontSize: "0.78rem", color: `${T.brume}CC`, lineHeight: 1.7,
        animation: "fadeUpL 0.6s ease forwards 0.3s", opacity: 0,
      }}>
        Une lumière par jour.<br/>
        Demain, une autre fenêtre s'ouvrira.
      </div>
    </div>
  );
};

// ─── CONSTELLATION DES 6 CLÉS ─────────────────────────────────────────────────
// 6 étoiles disposées en arc, chaque clé = 2 portes (12 portes au total)
const NOMS_CLES = ["Reconnaître", "Comprendre", "Ressentir", "Lâcher", "Recevoir", "Devenir"];
const COULEURS_CLES = ["#C8A96E", "#9EA8C8", "#A8C8A0", "#C8A0A8", "#A0C0C8", "#C8B8A0"];

const ConstellationCles = ({ cleActive, porteIdx, porteDebloquee, onSelectPorte, couleur }) => {
  const W = 280, H = 72;
  // 6 étoiles en arc léger
  const stars = NOMS_CLES.map((nom, i) => {
    const t = i / 5; // 0 → 1
    const x = 24 + t * (W - 48);
    const y = H / 2 + Math.sin(t * Math.PI) * -14; // arc vers le haut
    const porteA = i * 2;
    const porteB = i * 2 + 1;
    const debloqueeA = porteDebloquee(porteA);
    const debloqueeB = porteDebloquee(porteB);
    const active = i === cleActive;
    const accessible = debloqueeA;
    return { nom, x, y, porteA, porteB, active, accessible, debloqueeA, debloqueeB, couleur: COULEURS_CLES[i] };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
        {/* Lignes de connexion */}
        {stars.map((s, i) => {
          if (i === 0) return null;
          const prev = stars[i - 1];
          return (
            <line key={`line-${i}`}
              x1={prev.x} y1={prev.y} x2={s.x} y2={s.y}
              stroke={s.accessible ? `${T.brume}40` : `${T.brume}18`}
              strokeWidth="0.8"
              strokeDasharray={s.accessible ? "none" : "3 3"}
            />
          );
        })}

        {/* Étoiles */}
        {stars.map((s, i) => {
          const r = s.active ? 7 : s.accessible ? 5 : 3.5;
          const fill = s.active ? s.couleur : s.accessible ? `${s.couleur}60` : `${T.brume}25`;
          const glow = s.active ? `drop-shadow(0 0 6px ${s.couleur}88)` : "none";
          return (
            <g key={i} onClick={() => s.accessible && onSelectPorte(s.porteA)}
               style={{ cursor: s.accessible ? "pointer" : "default" }}>
              {/* Halo pour étoile active */}
              {s.active && (
                <circle cx={s.x} cy={s.y} r={r + 5}
                  fill="none" stroke={s.couleur} strokeWidth="0.5" opacity="0.3" />
              )}
              {/* Étoile SVG à 5 branches */}
              <polygon
                points={Array.from({length: 10}, (_, j) => {
                  const angle = (j * 36 - 90) * Math.PI / 180;
                  const radius = j % 2 === 0 ? r : r * 0.42;
                  return `${s.x + radius * Math.cos(angle)},${s.y + radius * Math.sin(angle)}`;
                }).join(" ")}
                fill={fill}
                style={{ filter: glow, transition: "all 0.4s" }}
              />
              {/* Points sous-portes */}
              {s.accessible && (
                <>
                  <circle cx={s.x - 4} cy={s.y + r + 5} r="1.5"
                    fill={s.debloqueeA ? s.couleur : `${T.brume}40`} />
                  <circle cx={s.x + 4} cy={s.y + r + 5} r="1.5"
                    fill={s.debloqueeB ? s.couleur : `${T.brume}40`} />
                </>
              )}
            </g>
          );
        })}
      </svg>

      {/* Label de la clé active */}
      <div style={{
        fontFamily: T.sans, fontWeight: 300, fontSize: "0.55rem",
        letterSpacing: "0.35em", textTransform: "uppercase",
        color: couleur, opacity: 0.9,
      }}>
        {NOMS_CLES[cleActive]}
      </div>
    </div>
  );
};

const TerritoireCle = ({ cleActive = 0, progressStats = {}, allPostits = {} }) => {
  const [section, setSection] = useState("pratique");
  const [niveauPratique, setNiveauPratique] = useState(0);
  const [exerciceFait, setExerciceFait] = useState({});
  const [signal, setSignal] = useState(null);
  const [exercicesMis, setExercicesMis] = useState([]);
  const [porteIdx, setPorteIdx] = useState(Math.max(0, cleActive - 1)); // navigation locale

  const tousLesTerrItoires = TERRITOIRES_CLES; // 12 portes
  const territoire = tousLesTerrItoires[porteIdx] || tousLesTerrItoires[0];
  const eclats = calcEclats(progressStats);
  const porteDebloquee = (idx) => eclats >= (SEUILS_PORTES[idx] || 0);

  // Sync si cleActive change depuis l'extérieur
  useEffect(() => { setPorteIdx(Math.max(0, cleActive - 1)); }, [cleActive]);
  const pratique = territoire.pratiques[niveauPratique];

  // Déterminer le niveau selon la progression
  useEffect(() => {
    const eclats = calcEclats(progressStats);
    const seuil = SEUILS_PORTES[Math.max(0, cleActive - 1)] || 0;
    const progression = eclats - seuil;
    if (progression > 30) setNiveauPratique(2);
    else if (progression > 12) setNiveauPratique(1);
    else setNiveauPratique(0);
  }, [cleActive, progressStats]);

  // Détecter le signal depuis le dernier texte écrit
  useEffect(() => {
    const texte = extraireSignal(allPostits);
    const detected = detecterSignal(texte, cleActive);
    if (detected) {
      setSignal(detected);
      setNiveauPratique(detected.niveau);
    }
  }, [allPostits, cleActive]);

  // Réordonner les exercices si signal détecté
  useEffect(() => {
    const exs = [...(territoire.pratiques[niveauPratique]?.exercices || [])];
    if (signal && signal.niveau === niveauPratique && signal.exerciceIdx < exs.length) {
      // Mettre l'exercice recommandé en premier
      const [cible] = exs.splice(signal.exerciceIdx, 1);
      exs.unshift(cible);
    }
    setExercicesMis(exs);
  }, [niveauPratique, signal, territoire]);

  // Charger les exercices faits
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`alba_exercices_cle${porteIdx}`);
      if (saved) setExerciceFait(JSON.parse(saved));
      else setExerciceFait({});
    } catch {}
  }, [porteIdx]);

  const toggleExercice = (idx) => {
    const updated = { ...exerciceFait, [idx]: !exerciceFait[idx] };
    setExerciceFait(updated);
    try { localStorage.setItem(`alba_exercices_cle${porteIdx}`, JSON.stringify(updated)); } catch {}
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* Vidéo de fond propre à la Porte */}
      <video
        key={territoire.video}
        autoPlay muted loop playsInline
        style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          objectFit: "cover", zIndex: 0, opacity: 0.08,
          transition: "opacity 1s ease",
        }}
      >
        <source src={territoire.video} type="video/mp4" />
      </video>

    <div style={{ position: "relative", zIndex: 1, padding: "1.5rem 1.5rem 8rem", maxWidth: 540, margin: "0 auto" }}>
      <style>{`@keyframes fadeUpCle { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }`}</style>

      {/* Navigation entre Portes — avec verrouillage */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: "1.5rem",
        background: `${T.nuit2}CC`,
        border: `1px solid ${territoire.couleur}33`,
        borderRadius: "8px", padding: "0.7rem 0.5rem",
      }}>
        <button
          onClick={() => { if (porteIdx > 0) { setPorteIdx(p => p - 1); setSection("pratique"); }}}
          style={{
            background: porteIdx === 0 ? "transparent" : `${territoire.couleur}22`,
            border: porteIdx === 0 ? `1px solid ${T.brume}22` : `1px solid ${territoire.couleur}55`,
            borderRadius: "6px", width: 44, height: 44,
            cursor: porteIdx === 0 ? "default" : "pointer",
            color: porteIdx === 0 ? `${T.brume}40` : territoire.couleur,
            fontSize: "1.3rem", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s", flexShrink: 0,
          }}
        >←</button>

        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{
            fontFamily: T.sans, fontWeight: 300, fontSize: "0.62rem",
            letterSpacing: "0.5em", textTransform: "uppercase",
            color: territoire.couleur, marginBottom: "0.5rem",
          }}>
            Porte {territoire.index} · {territoire.nom}
          </div>
          {/* ── Constellation des 6 Clés — chemin de vie SVG ── */}
          <ConstellationCles
            cleActive={Math.floor(porteIdx / 2)}
            porteIdx={porteIdx}
            porteDebloquee={porteDebloquee}
            onSelectPorte={(i) => { if (porteDebloquee(i)) { setPorteIdx(i); setSection("pratique"); }}}
            couleur={territoire.couleur}
          />
        </div>

        <button
          onClick={() => {
            const next = porteIdx + 1;
            if (next < tousLesTerrItoires.length && porteDebloquee(next)) {
              setPorteIdx(next); setSection("pratique");
            }
          }}
          style={{
            background: (porteIdx >= tousLesTerrItoires.length - 1 || !porteDebloquee(porteIdx + 1)) ? "transparent" : `${territoire.couleur}22`,
            border: (porteIdx >= tousLesTerrItoires.length - 1 || !porteDebloquee(porteIdx + 1)) ? `1px solid ${T.brume}22` : `1px solid ${territoire.couleur}55`,
            borderRadius: "6px", width: 44, height: 44,
            cursor: (porteIdx >= tousLesTerrItoires.length - 1 || !porteDebloquee(porteIdx + 1)) ? "default" : "pointer",
            color: (porteIdx >= tousLesTerrItoires.length - 1 || !porteDebloquee(porteIdx + 1)) ? `${T.brume}40` : territoire.couleur,
            fontSize: "1.3rem", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s", flexShrink: 0,
          }}
        >{porteDebloquee(porteIdx + 1) ? "→" : "🔒"}</button>
      </div>

      {/* Message porte verrouillée */}
      {!porteDebloquee(porteIdx) && (
        <div style={{
          textAlign: "center", padding: "2rem 1.5rem",
          background: `${T.brume}08`, border: `1px solid ${T.brume}18`,
          borderRadius: "8px", marginBottom: "1.5rem",
        }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "0.8rem" }}>🔒</div>
          <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.95rem", color: T.brume, lineHeight: 1.8 }}>
            Cette porte n'est pas encore ouverte.<br/>
            <span style={{ fontSize: "0.8rem", color: `${T.brume}CC` }}>Continue ton chemin pour la franchir.</span>
          </div>
        </div>
      )}

      {/* Phrase d'ambiance Porte */}
      <div style={{
        fontFamily: T.serif, fontStyle: "italic",
        fontSize: "0.78rem", color: `${territoire.couleur}88`,
        textAlign: "center", marginBottom: "1.8rem", lineHeight: 1.6,
        animation: "fadeUpCle 0.4s ease forwards",
      }}>{territoire.ambiance?.texte}</div>

      {/* En-tête Clé — Porte architecturale */}
      <div style={{
        textAlign: "center", marginBottom: "2rem",
        animation: "fadeUpCle 0.6s ease forwards",
        position: "relative",
      }}>
        {/* La Porte Ancienne */}
        <div style={{ position: "relative", width: 240, margin: "0 auto 1.5rem" }}>
          {/* Calligraphie géante en filigrane derrière */}
          {GRAVURES_PORTES[territoire.index] && (
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "9rem", lineHeight: 1,
              color: `${territoire.couleur}06`,
              fontFamily: GRAVURES_PORTES[territoire.index]?.langue === "ar"
                ? "'Noto Naskh Arabic', serif" : "'Noto Serif JP', serif",
              pointerEvents: "none", userSelect: "none",
              direction: GRAVURES_PORTES[territoire.index]?.langue === "ar" ? "rtl" : "ltr",
            }}>{GRAVURES_PORTES[territoire.index]?.kanji}</div>
          )}

          <svg width="240" height="300" viewBox="0 0 200 260" fill="none"
            stroke={territoire.couleur} strokeLinecap="round" strokeLinejoin="round">

            {/* ── Socle / marches ── */}
            <line x1="10" y1="252" x2="190" y2="252" strokeWidth="1.2" opacity="0.5"/>
            <line x1="18" y1="245" x2="182" y2="245" strokeWidth="0.7" opacity="0.3"/>

            {/* ── Pilastres extérieurs ── */}
            <line x1="22" y1="245" x2="22" y2="95" strokeWidth="1.2" opacity="0.5"/>
            <line x1="178" y1="245" x2="178" y2="95" strokeWidth="1.2" opacity="0.5"/>

            {/* ── Chapiteaux ── */}
            <path d="M14 95 Q22 88 30 95" strokeWidth="0.8" fill="none" opacity="0.4"/>
            <path d="M170 95 Q178 88 186 95" strokeWidth="0.8" fill="none" opacity="0.4"/>
            <line x1="14" y1="95" x2="186" y2="95" strokeWidth="0.5" opacity="0.2"/>

            {/* ── Arche principale ── */}
            <path d="M35 245 L35 105 Q35 30 100 30 Q165 30 165 105 L165 245"
              strokeWidth="1.2" fill={`${territoire.couleur}04`} opacity="0.8"/>

            {/* ── Arche intérieure ── */}
            <path d="M48 245 L48 110 Q48 46 100 46 Q152 46 152 110 L152 245"
              strokeWidth="0.6" fill="none" opacity="0.4"/>

            {/* ── Clé de voûte ornementée ── */}
            <path d="M88 30 Q100 22 112 30" strokeWidth="0.8" fill="none" opacity="0.6"/>
            <path d="M92 30 Q100 26 108 30" strokeWidth="0.5" fill="none" opacity="0.4"/>
            <circle cx="100" cy="22" r="4" strokeWidth="0.8" fill="none" opacity="0.5"/>
            <circle cx="100" cy="22" r="2" strokeWidth="0.5" fill="none" opacity="0.3"/>

            {/* ── Fronton haut ── */}
            <path d="M22 95 Q22 88 30 88 L170 88 Q178 88 178 95" strokeWidth="0.6" fill="none" opacity="0.3"/>

            {/* ── Panneau supérieur (tympan) ── */}
            <path d="M52 108 Q52 58 100 58 Q148 58 148 108 L148 118 L52 118 Z"
              strokeWidth="0.5" fill={`${territoire.couleur}05`} opacity="0.6"/>

            {/* ── Moulures panneau supérieur ── */}
            <path d="M58 112 Q58 66 100 66 Q142 66 142 112" strokeWidth="0.4" fill="none" opacity="0.25"/>

            {/* ── Panneau principal (milieu) ── */}
            <rect x="52" y="126" width="96" height="72" rx="2"
              strokeWidth="0.5" fill={`${territoire.couleur}04`} opacity="0.5"/>
            <rect x="58" y="131" width="84" height="62" rx="1"
              strokeWidth="0.3" fill="none" opacity="0.2"/>

            {/* ── Panneau inférieur ── */}
            <rect x="52" y="206" width="96" height="36" rx="2"
              strokeWidth="0.5" fill={`${territoire.couleur}03`} opacity="0.4"/>
            <rect x="60" y="211" width="80" height="26" rx="1"
              strokeWidth="0.3" fill="none" opacity="0.2"/>

            {/* ── Gonds gauche ── */}
            <rect x="35" y="130" width="10" height="6" rx="1" strokeWidth="0.6" fill={`${territoire.couleur}15`} opacity="0.5"/>
            <rect x="35" y="190" width="10" height="6" rx="1" strokeWidth="0.6" fill={`${territoire.couleur}15`} opacity="0.5"/>

            {/* ── Poignée ── */}
            <path d="M138 165 Q145 161 145 168 Q145 175 138 171" strokeWidth="0.9" fill="none" opacity="0.55"/>
            <circle cx="136" cy="168" r="2.5" strokeWidth="0.7" fill={`${territoire.couleur}20`} opacity="0.5"/>

            {/* ── Serrure ── */}
            <rect x="130" y="156" width="14" height="10" rx="2" strokeWidth="0.5" fill="none" opacity="0.3"/>
            <circle cx="137" cy="159" r="2" strokeWidth="0.5" fill="none" opacity="0.3"/>
            <line x1="137" y1="161" x2="137" y2="164" strokeWidth="0.5" opacity="0.3"/>

            {/* ── Filets décoratifs ── */}
            <line x1="52" y1="122" x2="148" y2="122" strokeWidth="0.4" opacity="0.25"/>
            <line x1="52" y1="202" x2="148" y2="202" strokeWidth="0.4" opacity="0.25"/>
          </svg>

          {/* Contenu flottant sur la porte */}
          <div style={{
            position: "absolute",
            top: "47%", left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: "0.6rem",
            width: 90,
          }}>
            {/* Numéro romain */}
            <div style={{
              fontFamily: T.sans, fontWeight: 300,
              fontSize: "0.42rem", letterSpacing: "0.4em",
              color: `${territoire.couleur}88`,
              textTransform: "uppercase",
            }}>{["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"][territoire.index - 1]}</div>

            {/* Picto GPT */}
            <img
              src={`/pictos/porte-${String(territoire.index).padStart(2,"0")}-${["","reconnaitre","comprendre","ressentir","lacher","recevoir","devenir","creer","relier","proteger","transmettre","habiter","etre"][territoire.index]}.svg`}
              alt={territoire.nom}
              style={{ width: 52, height: 52, opacity: 0.9 }}
            />

            {/* Nom */}
            <div style={{
              fontFamily: T.serif, fontStyle: "italic",
              fontSize: "0.8rem", color: territoire.couleur,
              letterSpacing: "0.04em", textAlign: "center",
            }}>{territoire.nom}</div>
          </div>
        </div>
        <div style={{
          fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem",
          letterSpacing: "0.5em", textTransform: "uppercase",
          color: territoire.couleur, marginBottom: "0.3rem",
        }}>Clé {territoire.index}</div>
        <div style={{
          fontFamily: T.serif, fontSize: "1.6rem", fontWeight: 300,
          color: T.orPale, letterSpacing: "0.08em",
        }}>{territoire.nom}</div>
        <div style={{
          fontFamily: T.serif, fontStyle: "italic",
          fontSize: "0.85rem", color: T.brume, marginTop: "0.6rem",
          lineHeight: 1.6,
        }}>{territoire.souffle}</div>
      </div>

      {/* Sélecteur section */}
      <div style={{
        display: "flex", gap: "0", marginBottom: "2rem",
        border: `1px solid ${territoire.couleur}33`, borderRadius: "4px",
        overflow: "hidden",
      }}>
        {[["pratique", "Pratiques"], ["questions", "Questions"]].map(([id, label]) => (
          <button key={id} onClick={() => setSection(id)} style={{
            flex: 1, padding: "0.7rem",
            background: section === id ? `${territoire.couleur}22` : "transparent",
            border: "none", cursor: "pointer",
            fontFamily: T.sans, fontWeight: 300, fontSize: "0.65rem",
            letterSpacing: "0.3em", textTransform: "uppercase",
            color: section === id ? territoire.couleur : T.brume,
            borderRight: id === "pratique" ? `1px solid ${territoire.couleur}33` : "none",
            transition: "all 0.2s",
          }}>{label}</button>
        ))}
      </div>

      {/* PRATIQUES */}
      {section === "pratique" && (
        <div style={{ animation: "fadeUpCle 0.5s ease forwards" }}>
          {/* Sélecteur niveau */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", justifyContent: "center" }}>
            {territoire.pratiques.map((p, i) => (
              <button key={i} onClick={() => setNiveauPratique(i)} style={{
                padding: "0.4rem 0.9rem",
                background: niveauPratique === i ? territoire.couleur : "transparent",
                border: `1px solid ${niveauPratique === i ? territoire.couleur : territoire.couleur + "44"}`,
                borderRadius: "20px", cursor: "pointer",
                fontFamily: T.sans, fontWeight: 300, fontSize: "0.62rem",
                letterSpacing: "0.25em", textTransform: "uppercase",
                color: niveauPratique === i ? T.nuit : territoire.couleur,
                transition: "all 0.2s",
              }}>{p.label}</button>
            ))}
          </div>

          <div style={{
            fontFamily: T.sans, fontWeight: 300, fontSize: "0.62rem",
            letterSpacing: "0.4em", textTransform: "uppercase",
            color: `${territoire.couleur}88`, marginBottom: "1.2rem", textAlign: "center",
          }}>3 exercices · niveau {pratique.label.toLowerCase()}</div>

          {/* Signal détecté */}
          {signal && (
            <div style={{
              padding: "0.8rem 1.2rem", marginBottom: "1.2rem",
              background: `${territoire.couleur}12`,
              border: `1px solid ${territoire.couleur}33`,
              borderRadius: "6px",
              fontFamily: T.serif, fontStyle: "italic",
              fontSize: "0.82rem", color: territoire.couleur,
              lineHeight: 1.6, textAlign: "center",
            }}>
              ALBA a entendu ce que tu as écrit.<br/>
              <span style={{ color: T.brume, fontSize: "0.75rem" }}>Un exercice a été mis en avant pour toi.</span>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {(exercicesMis.length ? exercicesMis : pratique.exercices).map((ex, i) => (
              <div
                key={i}
                onClick={() => toggleExercice(i)}
                style={{
                  padding: "1.2rem 1.4rem",
                  background: exerciceFait[i] ? `${territoire.couleur}15` : `${T.nuit2}`,
                  border: `1px solid ${exerciceFait[i] ? territoire.couleur + "44" : territoire.couleur + "22"}`,
                  borderRadius: "6px", cursor: "pointer",
                  transition: "all 0.25s",
                  animation: `fadeUpCle 0.5s ease forwards ${i * 0.1}s`, opacity: 0,
                }}
              >
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                    border: `1px solid ${territoire.couleur}66`,
                    background: exerciceFait[i] ? territoire.couleur : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s",
                  }}>
                    {exerciceFait[i] && <span style={{ fontSize: "0.6rem", color: T.nuit }}>✓</span>}
                  </div>
                  <p style={{
                    fontFamily: T.serif, fontStyle: "italic",
                    fontSize: "0.92rem", color: exerciceFait[i] ? territoire.couleur : T.orPale,
                    lineHeight: 1.7, margin: 0,
                    textDecoration: exerciceFait[i] ? "none" : "none",
                  }}>{ex}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: "2rem", textAlign: "center",
            fontFamily: T.serif, fontStyle: "italic",
            fontSize: "0.78rem", color: `${T.brume}CC`,
          }}>
            Appuie sur un exercice pour le marquer comme fait.<br/>
            Chaque acte génère des Éclats d'aube.
          </div>
        </div>
      )}

      {/* QUESTIONS */}
      {section === "questions" && (
        <div style={{ animation: "fadeUpCle 0.5s ease forwards" }}>
          <div style={{
            fontFamily: T.sans, fontWeight: 300, fontSize: "0.62rem",
            letterSpacing: "0.4em", textTransform: "uppercase",
            color: `${territoire.couleur}88`, marginBottom: "1.5rem", textAlign: "center",
          }}>3 questions à méditer</div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            {territoire.questions.map((q, i) => (
              <div key={i} style={{
                padding: "1.4rem 1.5rem",
                background: `${T.nuit2}`,
                border: `1px solid ${territoire.couleur}22`,
                borderLeft: `3px solid ${territoire.couleur}88`,
                borderRadius: "0 6px 6px 0",
                animation: `fadeUpCle 0.5s ease forwards ${i * 0.15}s`, opacity: 0,
              }}>
                <p style={{
                  fontFamily: T.serif, fontStyle: "italic",
                  fontSize: "1rem", color: T.orPale,
                  lineHeight: 1.75, margin: 0,
                }}>{q}</p>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: "2rem", textAlign: "center",
            fontFamily: T.serif, fontStyle: "italic",
            fontSize: "0.78rem", color: `${T.brume}CC`, lineHeight: 1.7,
          }}>
            Ces questions ne demandent pas de réponse immédiate.<br/>
            Laisse-les travailler en toi.
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

const Evasion = ({ data }) => {
  const cdv = cheminDeVie(data.naissance);
  const { blessure } = getContextProfil(data);
  const { all, categorie } = getPhotos(cdv, blessure.nom);
  const [mode, setMode] = useState("video"); // "photo" | "video"
  const [actif, setActif] = useState(0);
  const [loaded, setLoaded] = useState({});
  const touchStart = useRef(null);
  const videoRef = useRef(null);

  const items = mode === "video" ? VIDEOS : all;
  const item = items[actif] || items[0];

  const navigate = (dir) => {
    setActif(a => (a + dir + items.length) % items.length);
  };

  const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (!touchStart.current) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) navigate(diff > 0 ? 1 : -1);
    touchStart.current = null;
  };

  const catLabel = {
    puissance: "Puissance", douceur: "Douceur", liberte: "Liberté",
    ancrage: "Ancrage", mystere: "Mystère", savane: "Savane",
    mer: "Mer & Caraïbes", aube: "Aube", resilience: "Résilience",
  };

  return (
    <div style={{ padding: "0 0 6rem" }}>

      {/* ── HEADER ── */}
      <div style={{ padding: "1.5rem 1.5rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.65rem", letterSpacing: "0.55em", textTransform: "uppercase", color: T.brume, marginBottom: "0.3rem" }}>
            Évasion · {mode === "video" ? "Ambiances" : catLabel[categorie] || ""}
          </div>
          <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "1.3rem", color: T.orPale }}>
            Laisse-les simplement être là.
          </div>
        </div>
        {/* Toggle Photo / Vidéo */}
        <div style={{ display: "flex", gap: "4px", background: T.nuit2, borderRadius: "20px", padding: "3px" }}>
          {["video","photo"].map(m => (
            <button key={m} onClick={() => { setMode(m); setActif(0); }} style={{
              background: mode === m ? T.or : "transparent",
              color: mode === m ? "#000" : T.brume,
              border: "none", borderRadius: "16px",
              padding: "4px 10px", cursor: "pointer",
              fontFamily: T.sans, fontWeight: 300,
              fontSize: "0.6rem", letterSpacing: "0.15em",
              textTransform: "uppercase", transition: "all 0.25s",
            }}>{m === "video" ? "Vidéo" : "Photo"}</button>
          ))}
        </div>
      </div>

      {/* ── VIEWER PRINCIPAL ── */}
      <div
        style={{
          position: "relative", overflow: "hidden",
          margin: "0 1.5rem", borderRadius: "10px",
          aspectRatio: "9/16", maxHeight: "70vh",
          background: T.nuit2,
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* VIDEO */}
        {mode === "video" && item.src && (
          <video
            key={item.src}
            ref={videoRef}
            autoPlay loop muted playsInline
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          >
            <source src={item.src} type="video/mp4"/>
          </video>
        )}

        {/* PHOTO */}
        {mode === "photo" && item.url && (
          <img
            key={actif}
            src={item.url} alt=""
            onLoad={() => setLoaded(l => ({...l, [actif]: true}))}
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%", objectFit: "cover",
              opacity: loaded[actif] ? 1 : 0,
              transition: "opacity 0.6s ease",
            }}
          />
        )}

        {/* Gradient bas */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "55%",
          background: "linear-gradient(to top, rgba(8,6,5,0.96) 0%, rgba(8,6,5,0.4) 55%, transparent 100%)",
          pointerEvents: "none",
        }}/>

        {/* Légende */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "2rem 1.5rem 1.5rem" }}>
          <p style={{
            fontFamily: T.serif, fontStyle: "italic",
            fontSize: "clamp(1rem, 3vw, 1.1rem)",
            color: T.orPale, lineHeight: 1.7,
            textShadow: "0 1px 6px rgba(0,0,0,0.7)",
          }}>« {item.legende} »</p>
        </div>

        {/* Compteur */}
        <div style={{ position: "absolute", top: 12, right: 14, fontFamily: T.sans, fontWeight: 300, fontSize: "0.68rem", letterSpacing: "0.3em", color: "rgba(255,255,255,0.5)" }}>
          {actif + 1} / {items.length}
        </div>

        {/* Flèches */}
        <button onClick={() => navigate(-1)} style={{
          position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
          background: "rgba(0,0,0,0.4)", border: "none", borderRadius: "50%",
          width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(8px)",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.aube} strokeWidth="1.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <button onClick={() => navigate(1)} style={{
          position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
          background: "rgba(0,0,0,0.4)", border: "none", borderRadius: "50%",
          width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(8px)",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.aube} strokeWidth="1.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

      {/* ── MINIATURES ── */}
      <div style={{ display: "flex", gap: "0.5rem", margin: "1rem 1.5rem 0", overflowX: "auto", paddingBottom: "0.2rem" }}>
        {items.map((p, i) => (
          <button key={i} onClick={() => setActif(i)} style={{
            flexShrink: 0, width: 56, height: 56, borderRadius: "6px",
            border: `2px solid ${actif === i ? T.or : "transparent"}`,
            background: T.nuit2, cursor: "pointer", padding: 0, overflow: "hidden",
            opacity: actif === i ? 1 : 0.4, transition: "all 0.2s",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {mode === "photo" && p.url && <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>}
            {mode === "video" && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.2rem" }}>▶</div>
                <div style={{ fontFamily: T.sans, fontSize: "0.58rem", color: T.brume, letterSpacing: "0.1em" }}>{p.label}</div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* ── NOTE PROFIL ── */}
      <div style={{ margin: "1rem 1.5rem 0", padding: "0.9rem 1.2rem", borderLeft: `2px solid ${T.or}25`, background: T.nuit2, borderRadius: "0 4px 4px 0" }}>
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.82rem", color: T.brume, lineHeight: 1.7 }}>
          {mode === "photo"
            ? <>Sélection pour chemin <span style={{ color: T.orPale }}>{cdv}</span> — en traversée de <span style={{ color: T.orPale }}>{blessure.nom.toLowerCase()}</span>.</>
            : <>Ambiances sonores et visuelles. Laisse le mouvement faire son travail.</>
          }
        </p>
      </div>
    </div>
  );
};

// ─── SOUFFLE ──────────────────────────────────────────────────────────────────
// ─── SOUFFLE INLINE (pour Profil) ────────────────────────────────────────────
const SouffleInline = () => {
  const [mode, setMode] = useState(0);
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState("inspire");
  const [count, setCount] = useState(4);
  const [cyclesDone, setCyclesDone] = useState(0);
  const completedRef = useRef(false);

  const MODES = [
    { nom: "Ancrage",      inspire: 4, retiens: 4, expire: 4, retiens2: 4, couleur: "#7B9EA8" },
    { nom: "Lâcher-prise", inspire: 4, retiens: 0, expire: 8, retiens2: 0, couleur: T.aurore },
    { nom: "Présence",     inspire: 5, retiens: 2, expire: 7, retiens2: 0, couleur: "#8A7BA8" },
  ];

  const m = MODES[mode];
  const phases = [
    { nom: "inspire",  dur: m.inspire,  label: "Inspire",  show: m.inspire > 0 },
    { nom: "retiens",  dur: m.retiens,  label: "Retiens",  show: m.retiens > 0 },
    { nom: "expire",   dur: m.expire,   label: "Expire",   show: m.expire > 0 },
    { nom: "retiens2", dur: m.retiens2, label: "Vide",     show: m.retiens2 > 0 },
  ].filter(p => p.show);

  useEffect(() => {
    if (!active) return;
    const idx = phases.findIndex(p => p.nom === phase);
    const cur = phases[idx] || phases[0];
    setCount(cur.dur);
    const interval = setInterval(() => {
      setCount(c => {
        if (c <= 1) {
          const nextIdx = (idx + 1) % phases.length;
          setPhase(phases[nextIdx].nom);
          if (nextIdx === 0) setCyclesDone(n => n + 1);
          return phases[nextIdx].dur;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [active, phase, mode]);

  const expanding = phase === "inspire" || phase === "retiens";
  const phaseLabel = phases.find(p => p.nom === phase)?.label || "Inspire";

  return (
    <div style={{
      background: T.nuit2,
      border: `1px solid ${m.couleur}22`,
      borderRadius: "8px",
      padding: "1.5rem",
    }}>
      {/* Sélecteur de mode */}
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.5rem" }}>
        {MODES.map((mo, i) => (
          <button key={i} onClick={() => { setMode(i); setActive(false); setPhase("inspire"); setCyclesDone(0); }} style={{
            flex: 1, background: mode === i ? `${mo.couleur}15` : "transparent",
            border: `1px solid ${mode === i ? mo.couleur + "55" : T.brume + "22"}`,
            borderRadius: "4px", padding: "0.45rem 0.2rem",
            fontFamily: T.sans, fontWeight: 300, fontSize: "0.44rem",
            letterSpacing: "0.25em", textTransform: "uppercase",
            color: mode === i ? mo.couleur : T.brume,
            cursor: "pointer", transition: "all 0.2s",
          }}>{mo.nom}</button>
        ))}
      </div>

      {/* Orbe */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.2rem" }}>
        <div style={{
          width: active ? (expanding ? 90 : 60) : 70,
          height: active ? (expanding ? 90 : 60) : 70,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${m.couleur}33, ${m.couleur}08)`,
          border: `1px solid ${m.couleur}${active ? "66" : "33"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 1s ease",
          boxShadow: active ? `0 0 30px ${m.couleur}22` : "none",
        }}>
          {active ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: T.serif, fontSize: "1.4rem", color: m.couleur, lineHeight: 1 }}>{count}</div>
              <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.42rem", letterSpacing: "0.3em", textTransform: "uppercase", color: m.couleur, opacity: 0.92, marginTop: "0.2rem" }}>{phaseLabel}</div>
            </div>
          ) : (
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: m.couleur, opacity: 0.6 }} />
          )}
        </div>

        <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
          <button onClick={() => { setActive(!active); if (!active) { setPhase("inspire"); setCount(m.inspire); } }} style={{
            background: active ? `${m.couleur}15` : "transparent",
            border: `1px solid ${m.couleur}44`,
            borderRadius: "20px", padding: "0.5rem 1.4rem",
            fontFamily: T.serif, fontStyle: "italic",
            fontSize: "0.9rem", color: m.couleur,
            cursor: "pointer", transition: "all 0.3s",
          }}>{active ? "Pause" : cyclesDone > 0 ? "Continuer" : "Commencer"}</button>

          {cyclesDone > 0 && (
            <span style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.62rem", letterSpacing: "0.3em", color: T.brume }}>
              {cyclesDone} cycle{cyclesDone > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const Souffle = ({ onComplete }) => {
  const [phase, setPhase] = useState("inspire");
  const [count, setCount] = useState(4);
  const [active, setActive] = useState(false);
  const [mode, setMode] = useState(0);
  const [cyclesDone, setCyclesDone] = useState(0);
  const completedRef = useRef(false);

  const MODES = [
    { nom: "Ancrage",     inspire: 4, retiens: 4, expire: 4, retiens2: 4, couleur: "#7B9EA8", desc: "Respiration carrée — revenir au présent" },
    { nom: "Lâcher-prise", inspire: 4, retiens: 0, expire: 8, retiens2: 0, couleur: T.aurore, desc: "4-8 — relâcher la tension" },
    { nom: "Présence",    inspire: 5, retiens: 2, expire: 7, retiens2: 0, couleur: "#8A7BA8", desc: "Cohérence cardiaque — apaiser le système nerveux" },
  ];

  const m = MODES[mode];
  const phases = [
    { nom: "inspire",   dur: m.inspire,   label: "Inspire",    show: m.inspire > 0 },
    { nom: "retiens",   dur: m.retiens,   label: "Retiens",    show: m.retiens > 0 },
    { nom: "expire",    dur: m.expire,    label: "Expire",     show: m.expire > 0 },
    { nom: "retiens2",  dur: m.retiens2,  label: "Vide",       show: m.retiens2 > 0 },
  ].filter(p => p.show);

  useEffect(() => {
    if (!active) return;
    const idx = phases.findIndex(p => p.nom === phase);
    const cur = phases[idx];
    setCount(cur.dur);
    const interval = setInterval(() => {
      setCount(c => {
        if (c <= 1) {
          const nextIdx = (idx + 1) % phases.length;
          const next = phases[nextIdx];
          setPhase(next.nom);
          // Un cycle complet = retour à la première phase
          if (nextIdx === 0) {
            setCyclesDone(n => {
              const newN = n + 1;
              if (newN === 1 && !completedRef.current) {
                completedRef.current = true;
                if (onComplete) onComplete();
              }
              return newN;
            });
          }
          return next.dur;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [active, phase, mode]);

  const expanding = phase === "inspire" || phase === "retiens";
  const phaseLabel = phases.find(p => p.nom === phase)?.label || "";

  const SOUFFLE_VIDEOS = ["/videos/vagues.mp4", "/videos/desert.mp4", "/videos/foret.mp4"];
  const videoSrc = SOUFFLE_VIDEOS[mode];

  return (
    <div style={{ position: "relative", minHeight: "100vh", padding: "2rem 0 6rem", maxWidth: 520, margin: "0 auto", textAlign: "center", overflow: "hidden" }}>
      <video key={videoSrc} autoPlay loop muted playsInline style={{
        position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
        objectFit: "cover", zIndex: 0,
        opacity: active ? 0.32 : 0.14, transition: "opacity 2s ease",
      }}><source src={videoSrc} type="video/mp4"/></video>
      <div style={{ position: "relative", zIndex: 1 }}>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.68rem", letterSpacing: "0.5em", textTransform: "uppercase", color: T.brume, marginBottom: "0.4rem" }}>Espace</div>
        <h2 style={{ fontFamily: T.serif, fontWeight: 300, fontSize: "1.6rem", color: T.orPale }}>Le Souffle</h2>
      </div>

      {/* Mode selector */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "3rem", justifyContent: "center" }}>
        {MODES.map((mo, i) => (
          <button key={i} onClick={() => { setMode(i); setActive(false); setPhase("inspire"); }} style={{
            background: mode === i ? `${mo.couleur}22` : "transparent",
            border: `1px solid ${mode === i ? mo.couleur + "77" : T.brume + "33"}`,
            color: mode === i ? mo.couleur : T.brume,
            fontFamily: T.sans, fontWeight: 300, fontSize: "0.62rem",
            letterSpacing: "0.25em", textTransform: "uppercase",
            padding: "0.5rem 0.9rem", borderRadius: "2px", cursor: "pointer",
            transition: "all 0.25s",
          }}>{mo.nom}</button>
        ))}
      </div>

      <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.95rem", color: T.brume, marginBottom: "3rem" }}>{m.desc}</p>

      {/* Breathing circle */}
      <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "3rem" }}>
        {active && (
          <>
            <div style={{
              position: "absolute", width: 160, height: 160, borderRadius: "50%",
              border: `1px solid ${m.couleur}44`,
              animation: "pulse-ring 3s ease-out infinite",
            }} />
            <div style={{
              position: "absolute", width: 180, height: 180, borderRadius: "50%",
              border: `1px solid ${m.couleur}22`,
              animation: "pulse-ring 3s ease-out infinite 1s",
            }} />
          </>
        )}
        <div style={{
          width: 150, height: 150, borderRadius: "50%",
          border: `2px solid ${m.couleur}66`,
          background: `radial-gradient(circle, ${m.couleur}18 0%, transparent 70%)`,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          transition: "transform 0.8s ease, opacity 0.3s",
          transform: active ? (expanding ? "scale(1.2)" : "scale(0.85)") : "scale(1)",
          animation: active ? undefined : "float 4s ease-in-out infinite",
        }}>
          {active ? (
            <>
              <div style={{ fontFamily: T.serif, fontSize: "2.5rem", fontWeight: 300, color: m.couleur, lineHeight: 1 }}>{count}</div>
              <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.58rem", letterSpacing: "0.4em", textTransform: "uppercase", color: m.couleur, opacity: 0.92, marginTop: "0.3rem" }}>{phaseLabel}</div>
            </>
          ) : (
            <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.95rem", color: T.brume }}>prêt(e) ?</div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
        <Btn onClick={() => { setActive(!active); if (!active) setPhase("inspire"); }}>
          {active ? "Pause" : "Commencer"}
        </Btn>
      </div>
      </div>{/* /zIndex wrapper */}
    </div>
  );
};

// ─── ARDOISE ──────────────────────────────────────────────────────────────────

// Icônes SVG — pack ALBA custom
const ICONS = {
  pensee:    (c="#C8A96E") => <img src="/icons/ardoise_pensee.svg"    width="16" height="16" style={{ filter: c !== "#C8A96E" ? "none" : "none", opacity: 0.9 }} />,
  emotion:   (c="#D4856A") => <img src="/icons/ardoise_emotion.svg"   width="16" height="16" style={{ opacity: 0.9 }} />,
  gratitude: (c="#7BA88A") => <img src="/icons/ardoise_gratitude.svg" width="16" height="16" style={{ opacity: 0.9 }} />,
  question:  (c="#7B9EA8") => <img src="/icons/ardoise_question.svg"  width="16" height="16" style={{ opacity: 0.9 }} />,
  victoire:  (c="#A87BC8") => <img src="/icons/ardoise_victoire.svg"  width="16" height="16" style={{ opacity: 0.9 }} />,
  bilan: (c="#C8A96E") => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-5"/>
    </svg>
  ),
  plus: (c="#8C7F74") => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  fermer: (c="#8C7F74") => <img src="/icons/general_fermer.svg" width="14" height="14" style={{ opacity: 0.7 }} />,
};

const POSTIT_TYPES = [
  { id: "pensee",    label: "Pensée",    couleur: "#C8A96E", papier: "#1E1A10", bord: "#C8A96E" },
  { id: "emotion",   label: "Émotion",   couleur: "#D4856A", papier: "#1E1210", bord: "#D4856A" },
  { id: "gratitude", label: "Gratitude", couleur: "#7BA88A", papier: "#101E12", bord: "#7BA88A" },
  { id: "question",  label: "Question",  couleur: "#7B9EA8", papier: "#101518", bord: "#7B9EA8" },
  { id: "victoire",  label: "Victoire",  couleur: "#A87BC8", papier: "#150E1E", bord: "#A87BC8" },
];

const Ardoise = ({ data, db, onPostitAjoute, onBilanGenere, onPostitsChange, isPremium, onShowPaywall }) => {
  const [sousOnglet, setSousOnglet] = useState("ardoise");
  const [allPostitsLocal, setAllPostitsLocal] = useState({});

  const handlePostitsChange = (updated) => {
    setAllPostitsLocal(updated);
    if (onPostitsChange) onPostitsChange(updated);
  };

  return (
    <div>
      {/* ── Sous-navigation ── */}
      <div style={{
        display: "flex",
        borderBottom: `1px solid ${T.brume}18`,
        background: T.nuit,
        position: "sticky", top: 52, zIndex: 40,
      }}>
        {[
          { id: "ardoise", label: "Ardoise" },
          { id: "fil",     label: "Fil" },
          { id: "lettres", label: "Lettres" },
        ].map(o => (
          <button key={o.id} onClick={() => setSousOnglet(o.id)} style={{
            flex: 1, background: "none", border: "none", cursor: "pointer",
            padding: "0.85rem 0",
            fontFamily: T.sans, fontWeight: 300,
            fontSize: "0.65rem", letterSpacing: "0.35em", textTransform: "uppercase",
            color: sousOnglet === o.id ? T.or : T.brume,
            borderBottom: `2px solid ${sousOnglet === o.id ? T.or : "transparent"}`,
            transition: "all 0.25s",
          }}>{o.label}</button>
        ))}
      </div>
      {sousOnglet === "ardoise" && <ArdoiseInner data={data} db={db} onPostitAjoute={onPostitAjoute} onBilanGenere={onBilanGenere} onPostitsChange={handlePostitsChange} />}
      {sousOnglet === "fil"     && <FilDeVie data={data} db={db} />}
      {sousOnglet === "lettres" && <LettresAlba data={data} allPostits={allPostitsLocal} isPremium={isPremium} onShowPaywall={onShowPaywall} />}
    </div>
  );
};

const ArdoiseInner = ({ data, db, onPostitAjoute, onBilanGenere, onPostitsChange }) => {
  const todayKey = new Date().toISOString().split("T")[0];
  const [jourActif, setJourActif] = useState(todayKey);
  const [allPostits, setAllPostits] = useState({});
  const [texte, setTexte] = useState("");
  const [type, setType] = useState("pensee");
  const [loading, setLoading] = useState(false);
  const [bilan, setBilan] = useState(null);
  const [showBilan, setShowBilan] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const pressing = useRef(null);
  const pressTimer = useRef(null);
  const [deletingId, setDeletingId] = useState(null);
  const [gridParent] = useAutoAnimate({ duration: 280, easing: "ease-out" });

  // ── Boîte des Tempêtes ───────────────────────────────────────────────────
  const [tempetes, setTempetes] = useState([]); // [{ id, texte, date, vue }]
  const [showTempeteForm, setShowTempeteForm] = useState(false);
  const [tempeteTexte, setTempeteTexte] = useState("");
  const [tempeteReveil, setTempeteReveil] = useState(null); // tempête à montrer

  useEffect(() => {
    const saved = localStorage.getItem("alba_tempetes");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTempetes(parsed);
        // Vérifier si une tempête doit "se réveiller"
        const maintenant = new Date();
        const aReveiller = parsed.find(t => {
          if (t.vue) return false;
          const dateT = new Date(t.date);
          const joursEcoules = (maintenant - dateT) / (1000 * 60 * 60 * 24);
          return joursEcoules >= (t.delaiJours || 21);
        });
        if (aReveiller) setTempeteReveil(aReveiller);
      } catch {}
    }
  }, []);

  const saveTempetes = (list) => {
    setTempetes(list);
    localStorage.setItem("alba_tempetes", JSON.stringify(list));
  };

  const fermerTempete = () => {
    if (!tempeteTexte.trim()) return;
    // Délai aléatoire entre 14 et 42 jours
    const delaiJours = 14 + Math.floor(Math.random() * 28);
    const nouvelle = {
      id: Date.now(),
      texte: tempeteTexte.trim(),
      date: new Date().toISOString(),
      delaiJours,
      vue: false,
    };
    saveTempetes([...tempetes, nouvelle]);
    setTempeteTexte("");
    setShowTempeteForm(false);
  };

  const marquerTempeteVue = (id) => {
    const updated = tempetes.map(t => t.id === id ? { ...t, vue: true } : t);
    saveTempetes(updated);
    setTempeteReveil(null);
  };

  // Charger les post-its au montage
  useEffect(() => {
    if (!db) return;
    db.loadAllPostits().then(saved => {
      if (saved && Object.keys(saved).length > 0) {
        setAllPostits(saved);
        if (onPostitsChange) onPostitsChange(saved);
      }
    });
  }, []);

  // Post-its du jour affiché
  const postits = allPostits[jourActif] || [];
  const setPostits = (fn) => {
    setAllPostits(a => {
      const prev = a[jourActif] || [];
      const next = typeof fn === "function" ? fn(prev) : fn;
      const updated = { ...a, [jourActif]: next };
      if (db) db.savePostits(jourActif, next);
      if (onPostitsChange) onPostitsChange(updated);
      return updated;
    });
  };

  // Génère les 7 derniers jours
  const getDays = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("fr-FR", { weekday: "short" });
      const num = d.getDate();
      days.push({ key, label, num, isToday: key === todayKey });
    }
    return days;
  };
  const days = getDays();

  // Rotation pseudo-aléatoire stable par id
  const getRotation = (id) => {
    const n = id % 1000;
    return ((n * 7 + 13) % 11) - 5; // entre -5 et +5 degrés
  };
  const getSize = (texte) => {
    if (texte.length < 30) return "small";
    if (texte.length < 80) return "medium";
    return "large";
  };

  const ajouter = () => {
    if (!texte.trim()) return;
    setPostits(p => [{
      id: Date.now(),
      texte: texte.trim(),
      type,
      heure: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    }, ...p]);
    setTexte("");
    setShowForm(false);
    if (onPostitAjoute) onPostitAjoute();
  };

  const startPress = (id) => {
    pressTimer.current = setTimeout(() => { setDeletingId(id); pressing.current = id; }, 500);
  };
  const endPress = (id) => {
    clearTimeout(pressTimer.current);
    if (pressing.current === id) { setPostits(p => p.filter(x => x.id !== id)); pressing.current = null; setDeletingId(null); }
    else { pressing.current = null; setDeletingId(null); }
  };

  const genererBilan = async () => {
    if (postits.length === 0) return;
    setLoading(true); setShowBilan(true);
    const cdv = cheminDeVie(data.naissance);
    const chemin = CHEMINS[cdv] || CHEMINS[9];
    const { texteContexte } = getContextProfil(data);
    const resume = postits.map(p => `[${POSTIT_TYPES.find(t=>t.id===p.type)?.label}] ${p.texte}`).join("\n");
    const prompt = `Tu es ALBA. Tu lis les pensées que ${data.prenom} a posées sur son ardoise aujourd'hui.
Profil : Chemin ${cdv} — ${chemin.titre}. Contexte : ${texteContexte}
Voici ce qu'il/elle a posé :
${resume}
Écris une courte lettre — 4 à 7 phrases. Pas un résumé. Une lettre intime et vraie. Nomme ce que tu entends entre les lignes. Termine par une phrase qui ouvre. Signe "ALBA".`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
      });
      const d = await res.json();
      setBilan(d.content?.[0]?.text || "…");
      if (onBilanGenere) onBilanGenere();
    } catch { setBilan("Je n'ai pas pu lire ton ardoise ce soir. Reviens demain — je serai là."); }
    setLoading(false);
  };

  // ── Synthèse poétique — apparaît automatiquement après 3 fragments dans la semaine ──
  const [synthesePoetique, setSynthesePoetique]     = useState(null);
  const [syntheseLoading, setSyntheseLoading]       = useState(false);
  const [syntheseGeneree, setSyntheseGeneree]       = useState(false);

  useEffect(() => {
    // Ne générer qu'une fois par semaine
    const weekKey = (() => {
      const d = new Date(); const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(d.setDate(diff)).toISOString().split("T")[0];
    })();
    const cacheKey = `alba_synthese_${weekKey}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) { setSynthesePoetique(cached); return; }

    // Compter les fragments de la semaine
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
    let fragmentsSemaine = [];
    Object.entries(allPostits).forEach(([dateKey, posts]) => {
      if (new Date(dateKey + "T00:00:00") >= cutoff) {
        posts.forEach(p => { if (p.texte) fragmentsSemaine.push(p.texte); });
      }
    });

    if (fragmentsSemaine.length >= 3 && !syntheseGeneree) {
      setSyntheseGeneree(true);
      setSyntheseLoading(true);
      const cdv = cheminDeVie(data.naissance);
      const chemin = CHEMINS[cdv] || CHEMINS[9];
      const extrait = fragmentsSemaine.slice(0, 6).map(t => `"${t.slice(0, 120)}"`).join("\n");
      const prompt = `Tu es ALBA. Tu as lu les fragments que ${data.prenom} a posés cette semaine sur son ardoise (Chemin ${cdv} — ${chemin.titre}).

Voici ce qu'il·elle a écrit :
${extrait}

Écris UNE SEULE phrase poétique — pas analytique, pas thérapeutique. Une phrase qui nomme ce que tu entends entre les lignes. Qui touche quelque chose de vrai sans l'expliquer. Entre 15 et 30 mots. Pas de signature. Pas de guillemets. Juste la phrase.`;

      fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 120, messages: [{ role: "user", content: prompt }] }),
      }).then(r => r.json()).then(d => {
        const texteGenere = d.content?.[0]?.text?.trim() || null;
        if (texteGenere) {
          setSynthesePoetique(texteGenere);
          localStorage.setItem(cacheKey, texteGenere);
        }
        setSyntheseLoading(false);
      }).catch(() => setSyntheseLoading(false));
    }
  }, [allPostits]);


  const stats = POSTIT_TYPES.map(t => ({ ...t, count: postits.filter(p => p.type === t.id).length })).filter(t => t.count > 0);

  return (
    <div style={{ padding: "0 0 6rem" }}>

      {/* ── SYNTHÈSE POÉTIQUE — apparaît après 3 fragments dans la semaine ── */}
      {(syntheseLoading || synthesePoetique) && (
        <div style={{
          margin: "1.2rem 1.5rem 0",
          padding: "1.3rem 1.6rem",
          background: "transparent",
          border: `1px solid ${T.or}15`,
          borderLeft: `2px solid ${T.or}40`,
          borderRadius: "6px",
          animation: "fadeUp 0.8s ease forwards",
          position: "relative", overflow: "hidden",
        }}>
          {/* Halo très subtil */}
          <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle, ${T.or}08, transparent 70%)`, pointerEvents: "none" }} />

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.9rem" }}>
            <span style={{ color: T.or, fontSize: "0.65rem", opacity: 0.6 }}>✦</span>
            <span style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.42rem", letterSpacing: "0.5em", textTransform: "uppercase", color: `${T.or}66` }}>
              Ce que j'entends cette semaine
            </span>
          </div>

          {syntheseLoading ? (
            <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: `${T.or}55`, animation: `alba-breathe 1.4s ease ${i*0.2}s infinite` }} />
              ))}
            </div>
          ) : (
            <p style={{
              fontFamily: T.serif, fontStyle: "italic",
              fontSize: "1rem", color: `${T.orPale}EE`,
              lineHeight: 1.85, margin: 0, letterSpacing: "0.01em",
            }}>
              {synthesePoetique}
            </p>
          )}
        </div>
      )}

      {/* ── RÉVEIL D'UNE TEMPÊTE ── */}
      {tempeteReveil && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(10,8,6,0.94)",

          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "fadeIn 0.5s ease",
          padding: "1.5rem",
        }}>
          <div style={{
            width: "100%", maxWidth: 480,
            background: `linear-gradient(160deg, #1C1710, #141210)`,
            border: `1px solid ${T.or}33`,
            borderRadius: "12px",
            padding: "2.5rem 2rem",
            textAlign: "center",
            boxShadow: "0 0 60px rgba(200,169,110,0.08)",
          }}>
            {/* Étoile pulsante */}
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              border: `1px solid ${T.or}44`,
              background: `radial-gradient(circle, ${T.or}15, transparent 70%)`,
              margin: "0 auto 2rem",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "pulse 3s ease-in-out infinite",
            }}>
              <span style={{ color: T.or, fontSize: "1.1rem" }}>✦</span>
            </div>

            <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.62rem", letterSpacing: "0.55em", textTransform: "uppercase", color: T.brume, marginBottom: "1.5rem" }}>
              ALBA se souvient
            </div>

            <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "1rem", color: T.brume, lineHeight: 1.8, marginBottom: "1.5rem" }}>
              Il y a quelque temps, tu as fermé une tempête.
            </p>

            {/* La tempête */}
            <div style={{
              background: `${T.or}08`,
              border: `1px solid ${T.or}22`,
              borderRadius: "8px",
              padding: "1.2rem 1.4rem",
              marginBottom: "2rem",
            }}>
              <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "1.05rem", color: T.orPale, lineHeight: 1.8 }}>
                « {tempeteReveil.texte} »
              </p>
              <p style={{ marginTop: "0.6rem", fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem", letterSpacing: "0.3em", color: T.brume }}>
                {new Date(tempeteReveil.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>

            <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "1.1rem", color: T.or, lineHeight: 1.9, marginBottom: "2rem" }}>
              Tu l'as traversée.
            </p>

            <Btn onClick={() => marquerTempeteVue(tempeteReveil.id)}>Je vois ça</Btn>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ padding: "1.5rem 1.5rem 1rem", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.65rem", letterSpacing: "0.55em", textTransform: "uppercase", color: T.brume, marginBottom: "0.35rem" }}>Ardoise</div>
          <div style={{ fontFamily: T.serif, fontWeight: 300, fontSize: "1.4rem", color: T.orPale, lineHeight: 1.1 }}>
            {jourActif === todayKey
              ? new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
              : new Date(jourActif + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {/* Bouton Tempête */}
          <button onClick={() => setShowTempeteForm(true)} title="Fermer une tempête" style={{
            background: "transparent",
            border: `1px solid ${T.brume}28`,
            color: T.brume, width: 34, height: 34, borderRadius: "50%",
            cursor: "pointer", fontSize: "0.9rem",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.25s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${T.aurore}55`; e.currentTarget.style.color = T.aurore; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = `${T.brume}28`; e.currentTarget.style.color = T.brume; }}
          >⛈</button>

          {postits.length > 0 && jourActif === todayKey && (
            <button onClick={genererBilan} style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              background: "transparent", border: `1px solid ${T.or}44`,
              color: T.or, fontFamily: T.sans, fontWeight: 300,
              fontSize: "0.58rem", letterSpacing: "0.35em", textTransform: "uppercase",
              padding: "0.5rem 0.9rem", borderRadius: "2px", cursor: "pointer",
              transition: "all 0.25s",
            }}>
              {ICONS.bilan()} Bilan
            </button>
          )}
        </div>
      </div>

      {/* ── FORMULAIRE TEMPÊTE ── */}
      {showTempeteForm && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(10,8,6,0.90)",
          display: "flex", alignItems: "flex-end",
          animation: "fadeIn 0.3s ease",
        }} onClick={() => setShowTempeteForm(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: "100%", maxWidth: 540, margin: "0 auto",
            background: `linear-gradient(170deg, #1A1714, #141210)`,
            borderTop: `1px solid ${T.brume}28`,
            borderRadius: "16px 16px 0 0",
            padding: "2rem 1.8rem 3rem",
            animation: "fadeUp 0.35s ease forwards",
          }}>
            <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem", letterSpacing: "0.5em", textTransform: "uppercase", color: T.brume, marginBottom: "0.5rem" }}>
              Boîte des Tempêtes
            </div>
            <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.95rem", color: T.brume, lineHeight: 1.8, marginBottom: "1.5rem" }}>
              Nomme ce que tu traverses. ALBA le garde.<br/>
              Dans quelques semaines, elle te rappellera que tu l'as traversé.
            </p>

            <textarea
              value={tempeteTexte}
              onChange={e => setTempeteTexte(e.target.value)}
              placeholder="Ce que je traverse en ce moment…"
              rows={3}
              autoFocus
              style={{
                width: "100%", background: `${T.nuit2}`,
                border: `1px solid ${T.brume}33`,
                borderRadius: "6px", color: T.aube,
                fontFamily: T.serif, fontStyle: "italic",
                fontSize: "1rem", padding: "0.9rem 1rem",
                resize: "none", lineHeight: 1.7,
                transition: "border-color 0.3s",
              }}
              onFocus={e => e.target.style.borderColor = `${T.aurore}55`}
              onBlur={e => e.target.style.borderColor = `${T.brume}33`}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.2rem" }}>
              <button onClick={() => { setShowTempeteForm(false); setTempeteTexte(""); }} style={{
                background: "none", border: "none", color: T.brume,
                fontFamily: T.sans, fontWeight: 300, fontSize: "0.68rem",
                letterSpacing: "0.3em", textTransform: "uppercase", cursor: "pointer",
              }}>Annuler</button>

              {tempeteTexte.trim().length > 3 && (
                <button onClick={fermerTempete} style={{
                  background: "transparent",
                  border: `1px solid ${T.aurore}55`,
                  borderRadius: "20px", padding: "0.6rem 1.5rem",
                  fontFamily: T.serif, fontStyle: "italic",
                  fontSize: "0.95rem", color: T.aurore,
                  cursor: "pointer", transition: "all 0.25s",
                }}>Fermer cette tempête</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CALENDRIER 7 JOURS ── */}
      <div style={{ padding: "0 1.5rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "0.4rem", justifyContent: "space-between" }}>
          {days.map(d => {
            const hasEntries = (allPostits[d.key] || []).length > 0;
            const isActive = d.key === jourActif;
            return (
              <button key={d.key} onClick={() => { setJourActif(d.key); setShowForm(false); }} style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                gap: "0.3rem", padding: "0.5rem 0.2rem",
                background: isActive ? `${T.or}12` : "transparent",
                border: `1px solid ${isActive ? T.or + "50" : T.brume + "20"}`,
                borderRadius: "6px", cursor: "pointer", transition: "all 0.2s",
              }}>
                <span style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.58rem", letterSpacing: "0.2em", textTransform: "uppercase", color: isActive ? T.or : T.brume, opacity: 0.7 }}>
                  {d.label}
                </span>
                <span style={{ fontFamily: T.serif, fontSize: "0.95rem", color: isActive ? T.or : T.aube, opacity: isActive ? 1 : 0.5, fontWeight: isActive ? 400 : 300 }}>
                  {d.num}
                </span>
                {/* Dot si des entrées existent */}
                <div style={{
                  width: 4, height: 4, borderRadius: "50%",
                  background: hasEntries ? T.or : "transparent",
                  opacity: hasEntries ? 0.7 : 0,
                  transition: "all 0.2s",
                }}/>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── LÉGENDE TYPES ── */}
      <div style={{ padding: "0 1.5rem", display: "flex", gap: "0.7rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {POSTIT_TYPES.map(t => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.couleur, opacity: 0.7 }}/>
            <span style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem", letterSpacing: "0.25em", textTransform: "uppercase", color: T.brume, opacity: 0.7 }}>{t.label}</span>
            {stats.find(s => s.id === t.id) && (
              <span style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem", color: t.couleur, opacity: 0.92 }}>
                ×{stats.find(s => s.id === t.id).count}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* ── CANVAS ARDOISE ── */}
      <div style={{
        margin: "0 1rem",
        minHeight: postits.length === 0 ? 280 : "auto",
        background: "linear-gradient(145deg, #161310, #1A1612, #14110E)",
        borderRadius: "8px",
        border: `1px solid rgba(200,169,110,0.1)`,
        boxShadow: "inset 0 2px 20px rgba(0,0,0,0.4), 0 4px 30px rgba(0,0,0,0.3)",
        position: "relative",
        padding: "1.2rem",
        // Texture grain subtile
        backgroundImage: `
          linear-gradient(145deg, #161310, #1A1612, #14110E),
          url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")
        `,
      }}>

        {/* État vide */}
        {postits.length === 0 && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: "0.8rem",
          }}>
            <div style={{ opacity: 0.15 }}>
              {/* Lignes de règles fantômes */}
              {[0,1,2,3].map(i => (
                <div key={i} style={{ width: 180, height: 1, background: T.or, marginBottom: 28, opacity: 0.3 }}/>
              ))}
            </div>
            <p style={{
              position: "absolute",
              fontFamily: T.serif, fontStyle: "italic", fontSize: "0.95rem",
              color: T.brume, opacity: 0.5, textAlign: "center", lineHeight: 1.8,
            }}>
              Pose ce qui traverse,<br/>même si c'est petit.
            </p>
          </div>
        )}

        {/* Grille de post-its */}
        <div ref={gridParent} style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "0.8rem",
        }}>
          {postits.map((p, i) => {
            const t = POSTIT_TYPES.find(t => t.id === p.type);
            const rot = getRotation(p.id % 1000);
            const size = getSize(p.texte);
            const isLarge = size === "large";
            const isSmall = size === "small";
            const isDeleting = deletingId === p.id;

            return (
              <div
                key={p.id}
                onMouseDown={() => startPress(p.id)}
                onMouseUp={() => endPress(p.id)}
                onMouseLeave={() => { clearTimeout(pressTimer.current); pressing.current = null; setDeletingId(null); }}
                onTouchStart={() => startPress(p.id)}
                onTouchEnd={() => endPress(p.id)}
                style={{
                  gridColumn: isLarge ? "span 2" : "span 1",
                  background: `linear-gradient(145deg, ${t.papier}, ${t.papier}dd)`,
                  border: `1px solid ${t.bord}25`,
                  borderTop: `3px solid ${t.bord}`,
                  borderRadius: "3px",
                  padding: isSmall ? "0.8rem 0.9rem" : "1rem 1.1rem",
                  transform: isDeleting
                    ? `rotate(${rot}deg) scale(0.9)`
                    : `rotate(${rot}deg)`,
                  transformOrigin: "center center",
                  boxShadow: isDeleting
                    ? `0 2px 8px rgba(0,0,0,0.2)`
                    : `3px 4px 12px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.3)`,
                  cursor: "grab",
                  transition: "transform 0.25s ease, box-shadow 0.25s ease, opacity 0.25s",
                  opacity: isDeleting ? 0.4 : 1,
                  animation: "fadeUp 0.35s ease forwards",
                  userSelect: "none",
                  position: "relative",
                  overflow: "hidden",
                }}>
                {/* Pli coin */}
                <div style={{
                  position: "absolute", bottom: 0, right: 0,
                  width: 0, height: 0,
                  borderStyle: "solid",
                  borderWidth: "0 0 14px 14px",
                  borderColor: `transparent transparent rgba(0,0,0,0.25) transparent`,
                }}/>
                {/* Type label */}
                <div style={{
                  display: "flex", alignItems: "center", gap: "0.35rem",
                  marginBottom: "0.5rem",
                }}>
                  {ICONS[p.type]?.(t.couleur)}
                  <span style={{
                    fontFamily: T.sans, fontWeight: 300, fontSize: "0.62rem",
                    letterSpacing: "0.4em", textTransform: "uppercase", color: t.couleur, opacity: 0.92,
                  }}>{t.label}</span>
                  <span style={{
                    marginLeft: "auto",
                    fontFamily: T.sans, fontWeight: 300, fontSize: "0.58rem",
                    color: T.brume, opacity: 0.5,
                  }}>{p.heure}</span>
                </div>
                {/* Texte */}
                <p style={{
                  fontFamily: T.serif, fontStyle: "italic",
                  fontSize: isSmall ? "0.88rem" : "0.95rem",
                  color: T.aube, lineHeight: 1.65, opacity: 0.9,
                }}>{p.texte}</p>
                {/* Hint suppression */}
                {isDeleting && (
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(0,0,0,0.5)",
                  }}>
                    <span style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.68rem", letterSpacing: "0.4em", color: "#fff", textTransform: "uppercase" }}>Supprimer</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── HINT SUPPRESSION ── */}
      {postits.length > 0 && (
        <div style={{ textAlign: "center", marginTop: "0.6rem" }}>
          <span style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.62rem", letterSpacing: "0.3em", textTransform: "uppercase", color: T.brume, opacity: 0.35 }}>
            Maintenir pour supprimer
          </span>
        </div>
      )}

      {/* ── FORMULAIRE AJOUT ── */}
      {showForm ? (
        <div style={{
          margin: "1.2rem 1rem 0",
          background: `linear-gradient(145deg, ${typeActif.papier}, #181510)`,
          border: `1px solid ${typeActif.bord}33`,
          borderTop: `3px solid ${typeActif.bord}`,
          borderRadius: "3px",
          padding: "1.2rem",
          boxShadow: "3px 4px 16px rgba(0,0,0,0.4)",
          animation: "fadeUp 0.3s ease forwards",
        }}>
          {/* Sélecteur type */}
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            {POSTIT_TYPES.map(t => (
              <button key={t.id} onClick={() => setType(t.id)} style={{
                display: "flex", alignItems: "center", gap: "0.35rem",
                background: type === t.id ? `${t.couleur}18` : "transparent",
                border: `1px solid ${type === t.id ? t.couleur + "60" : T.brume + "25"}`,
                color: type === t.id ? t.couleur : T.brume,
                fontFamily: T.sans, fontWeight: 300, fontSize: "0.65rem",
                letterSpacing: "0.2em", textTransform: "uppercase",
                padding: "0.32rem 0.65rem", borderRadius: "20px", cursor: "pointer",
                transition: "all 0.2s",
              }}>
                {ICONS[t.id]?.(type === t.id ? t.couleur : T.brume)}
                {t.label}
              </button>
            ))}
          </div>

          {/* Zone de saisie */}
          <textarea
            value={texte}
            onChange={e => setTexte(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ajouter(); } }}
            placeholder="Ce qui est là, maintenant…"
            autoFocus rows={3}
            style={{
              width: "100%", background: "transparent", border: "none",
              borderBottom: `1px solid ${typeActif.bord}30`,
              color: T.aube, fontFamily: T.serif, fontStyle: "italic",
              fontSize: "1rem", lineHeight: 1.75, resize: "none", padding: "0.3rem 0",
            }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
            <button onClick={() => { setShowForm(false); setTexte(""); }} style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              background: "none", border: "none", color: T.brume,
              fontFamily: T.sans, fontWeight: 300, fontSize: "0.68rem",
              letterSpacing: "0.3em", textTransform: "uppercase", cursor: "pointer",
            }}>
              {ICONS.fermer(T.brume)} Annuler
            </button>
            <Btn small onClick={ajouter}>Poser</Btn>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem",
          width: "calc(100% - 2rem)", margin: "1.2rem 1rem 0",
          background: "transparent",
          border: `1px dashed ${T.brume}30`,
          borderRadius: "3px", padding: "1rem",
          color: T.brume, fontFamily: T.serif, fontStyle: "italic",
          fontSize: "0.95rem", cursor: "pointer", transition: "all 0.25s",
        }}>
          {ICONS.plus(T.brume)}
          Poser quelque chose…
        </button>
      )}

      {/* ── BILAN PANEL ── */}
      {showBilan && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(10,8,6,0.92)",
          display: "flex", alignItems: "flex-end",
          animation: "fadeIn 0.3s ease",
        }} onClick={() => !loading && setShowBilan(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: "100%", maxWidth: 540, margin: "0 auto",
            background: `linear-gradient(170deg, #1A1714, #141210)`,
            borderTop: `1px solid ${T.or}33`,
            borderRadius: "16px 16px 0 0",
            padding: "2rem 1.8rem 3.5rem",
            animation: "fadeUp 0.4s ease forwards",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.8rem" }}>
              <div>
                <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.65rem", letterSpacing: "0.5em", textTransform: "uppercase", color: T.or, marginBottom: "0.4rem" }}>Bilan d'ALBA</div>
                <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.95rem", color: T.brume }}>
                  {postits.length} fragment{postits.length > 1 ? "s" : ""} lu{postits.length > 1 ? "s" : ""}
                </div>
              </div>
              {!loading && (
                <button onClick={() => setShowBilan(false)} style={{
                  background: "none", border: `1px solid ${T.brume}25`,
                  color: T.brume, width: 30, height: 30, borderRadius: "50%",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {ICONS.fermer(T.brume)}
                </button>
              )}
            </div>

            {loading ? (
              <div style={{ padding: "2.5rem 0", textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", gap: "0.6rem", marginBottom: "1.2rem" }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{
                      width: 5, height: 5, borderRadius: "50%", background: T.or,
                      animation: `fadeIn 1s ease ${i*0.3}s infinite alternate`,
                    }}/>
                  ))}
                </div>
                <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.9rem", color: T.brume }}>
                  ALBA lit ton ardoise…
                </p>
              </div>
            ) : (
              <div>
                <div style={{ width: 40, height: 1, background: `linear-gradient(to right, ${T.or}, transparent)`, marginBottom: "1.5rem" }}/>
                <p style={{
                  fontFamily: T.serif, fontStyle: "italic",
                  fontSize: "1.05rem", color: T.orPale, lineHeight: 2,
                  whiteSpace: "pre-wrap",
                }}>{bilan}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── JOURNAL ──────────────────────────────────────────────────────────────────
const Journal = ({ data }) => {
  const [entries, setEntries] = useState([]);
  const [current, setCurrent] = useState("");
  const [saved, setSaved] = useState(false);

  const QUESTIONS = [
    "Qu'est-ce que tu protèges encore que tu pourrais laisser partir ?",
    "À qui appartient la douleur que tu portes aujourd'hui ?",
    "Qu'est-ce que tu aurais voulu que quelqu'un te dise ce matin ?",
    "Si tu n'avais plus peur, qu'est-ce que tu ferais ?",
    "Qu'est-ce qui te semble impossible et qui ne l'est peut-être pas ?",
  ];

  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const question = QUESTIONS[new Date().getDay() % QUESTIONS.length];

  const save = () => {
    if (!current.trim()) return;
    setEntries(e => [{ date: today, texte: current, question }, ...e]);
    setCurrent("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ padding: "1.5rem 0 6rem", maxWidth: 520, margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.68rem", letterSpacing: "0.5em", textTransform: "uppercase", color: T.brume, marginBottom: "0.4rem" }}>Journal d'âme</div>
        <h2 style={{ fontFamily: T.serif, fontWeight: 300, fontSize: "1.6rem", color: T.orPale }}>{today}</h2>
      </div>

      <div style={{
        background: `linear-gradient(135deg, ${T.nuit2}, #252018)`,
        border: `1px solid ${T.or}33`, borderRadius: "4px",
        padding: "1.5rem", marginBottom: "1.5rem",
        animation: "fadeUp 0.8s ease forwards",
      }}>
        <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.68rem", letterSpacing: "0.45em", textTransform: "uppercase", color: T.brume, marginBottom: "1rem" }}>Question du jour</div>
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "1.1rem", color: T.orPale, lineHeight: 1.8, marginBottom: "1.5rem" }}>{question}</p>
        <textarea
          value={current}
          onChange={e => setCurrent(e.target.value)}
          placeholder="Écris ici, librement…"
          style={{
            width: "100%", minHeight: 120,
            background: "transparent",
            border: `1px solid ${T.brume}33`,
            borderRadius: "2px",
            color: T.aube, fontFamily: T.serif, fontStyle: "italic",
            fontSize: "1rem", lineHeight: 1.8,
            padding: "1rem", resize: "vertical",
            transition: "border-color 0.3s",
          }}
          onFocus={e => e.target.style.borderColor = `${T.or}55`}
          onBlur={e => e.target.style.borderColor = `${T.brume}33`}
        />
        <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "1rem" }}>
          {saved && <span style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.85rem", color: T.or, animation: "fadeIn 0.5s ease" }}>Gardé dans ton journal ✦</span>}
          <Btn small onClick={save}>Garder</Btn>
        </div>
      </div>

      {entries.length > 0 && (
        <div>
          <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.68rem", letterSpacing: "0.45em", textTransform: "uppercase", color: T.brume, marginBottom: "1rem" }}>Tes pages</div>
          {entries.map((e, i) => (
            <div key={i} style={{
              borderLeft: `2px solid ${T.or}33`, padding: "1rem 1.2rem",
              marginBottom: "1rem", animation: "fadeIn 0.6s ease forwards",
            }}>
              <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.58rem", letterSpacing: "0.35em", textTransform: "uppercase", color: T.brume, marginBottom: "0.4rem" }}>{e.date}</div>
              <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.95rem", color: T.aube, opacity: 0.88, lineHeight: 1.7 }}>{e.texte.length > 120 ? e.texte.slice(0, 120) + "…" : e.texte}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── PROFIL ────────────────────────────────────────────────────────────────────
// ─── MOT SECRET ──────────────────────────────────────────────────────────────
const MOTS_PAR_PORTE = {
  1: "Reconnaissance", 2: "Compréhension", 3: "Ressenti",
  4: "Lâcher-prise",   5: "Réception",     6: "Devenir",
  7: "Création",       8: "Lien",          9: "Protection",
  10: "Transmission",  11: "Présence",     12: "Être",
};

const MotSecret = ({ data, progressStats }) => {
  const [mot, setMot]     = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!data) return;
    const getLundi = () => {
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const lundi = new Date(d.setDate(diff));
      return lundi.toISOString().split("T")[0];
    };

    const cacheKey = `alba_mot_secret_${getLundi()}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) { setMot(cached); return; }

    // Construire le contexte depuis les fragments + porte active
    const fragments = (() => {
      try {
        const raw = localStorage.getItem("alba_postits");
        if (!raw) return [];
        const all = JSON.parse(raw);
        return all.slice(-10).map(p => p.texte || p.content || "").filter(Boolean);
      } catch { return []; }
    })();

    const porteActive = progressStats?._cleActive || data?.cleActive || 1;
    const etats = (() => {
      try {
        const keys = Object.keys(localStorage).filter(k => k.startsWith("alba_cairn_"));
        return keys.slice(-5).map(k => localStorage.getItem(k)).filter(Boolean);
      } catch { return []; }
    })();

    if (fragments.length === 0 && etats.length === 0) {
      const fallback = MOTS_PAR_PORTE[porteActive] || "Traversée";
      localStorage.setItem(cacheKey, fallback);
      setMot(fallback);
      return;
    }

    setLoading(true);
    const prompt = `Tu accompagnes ${data.prenom || "quelqu'un"} dans son chemin intérieur.

Voici quelques fragments qu'il·elle a écrits récemment dans son Ardoise :
${fragments.map((f, i) => `- "${f}"`).join("\n") || "(aucun fragment cette semaine)"}

États déposés dans le Ciel cette semaine :
${etats.join(", ") || "(aucun)"}

Porte active : Porte ${porteActive} — ${MOTS_PAR_PORTE[porteActive] || ""}

En lisant cela, quel est le mot qui représente le mieux ce que cette personne traverse en ce moment ?
Réponds avec un seul mot. Pas une phrase. Juste un mot. Choisis parmi : Traversée, Courage, Patience, Retour, Éveil, Transformation, Ancrage, Douceur, Lumière, Lâcher, Ouverture, Silence, Réparation, Confiance, Présence, Souffle, Passage, Gardien, Racines, Aube. 
Ou propose un autre mot si aucun ne convient. Un seul mot.`;

    fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 20,
        messages: [{ role: "user", content: prompt }],
      }),
    })
      .then(r => r.json())
      .then(d => {
        const raw = d.content?.[0]?.text?.trim() || "";
        const motFinal = raw.split(/[\s\n.,!?]/)[0] || MOTS_PAR_PORTE[porteActive] || "Traversée";
        localStorage.setItem(cacheKey, motFinal);
        setMot(motFinal);
      })
      .catch(() => {
        const fallback = MOTS_PAR_PORTE[porteActive] || "Traversée";
        setMot(fallback);
      })
      .finally(() => setLoading(false));
  }, []);

  if (!mot && !loading) return null;

  return (
    <div style={{
      textAlign: "center",
      padding: "1.8rem 1.4rem 1.6rem",
      marginBottom: "0.8rem",
      background: `${T.or}05`,
      border: `1px solid ${T.or}15`,
      borderRadius: "6px",
      animation: "fadeUp 0.7s ease forwards 0.1s", opacity: 0,
    }}>
      <div style={{
        fontFamily: T.sans, fontWeight: 300, fontSize: "0.42rem",
        letterSpacing: "0.5em", textTransform: "uppercase",
        color: T.brume, marginBottom: "1rem",
      }}>
        Ce que j'entends en toi
      </div>
      {loading ? (
        <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.85rem", color: `${T.brume}BB` }}>
          ALBA écoute…
        </div>
      ) : (
        <>
          <div style={{
            fontFamily: T.serif, fontWeight: 300,
            fontSize: "clamp(2rem, 8vw, 2.8rem)",
            color: T.or, letterSpacing: "0.05em",
            lineHeight: 1, marginBottom: "0.8rem",
            filter: `drop-shadow(0 0 20px ${T.or}44)`,
          }}>
            {mot}
          </div>
          <div style={{
            fontFamily: T.serif, fontStyle: "italic",
            fontSize: "0.75rem", color: `${T.brume}BB`,
          }}>
            renouvelé chaque semaine
          </div>
        </>
      )}
    </div>
  );
};


// ─── LA SALLE DES TROUVAILLES ────────────────────────────────────────────────
const CATEGORIES_TROUVAILLES = [
  { id: "tout",         label: "Tout",          emoji: "✦",  img: null },
  { id: "livre",        label: "Livre",         emoji: "📖", img: "livre" },
  { id: "film",         label: "Film",          emoji: "🎬", img: "bobine" },
  { id: "serie",        label: "Série",         emoji: "🎞", img: "bobine" },
  { id: "podcast",      label: "Podcast",       emoji: "🎙", img: "casque" },
  { id: "musique",      label: "Musique",       emoji: "♪",  img: "musique" },
  { id: "album",        label: "Album",         emoji: "🎵", img: "musique" },
  { id: "pratique",     label: "Pratique",      emoji: "🌿", img: "lotus" },
  { id: "lieu",         label: "Lieu",          emoji: "🏛",  img: "globe" },
  { id: "voyage",       label: "Voyage",        emoji: "✈",  img: "globe" },
  { id: "destination",  label: "Destination",   emoji: "🌍", img: "boussole" },
  { id: "citation",     label: "Citation",      emoji: "❝",  img: "carnet" },
  { id: "poeme",        label: "Poème",         emoji: "🪶", img: "carnet" },
  { id: "exposition",   label: "Exposition",    emoji: "🖼",  img: "cristal" },
  { id: "spectacle",    label: "Spectacle",     emoji: "🎭", img: "masque" },
  { id: "theatre",      label: "Théâtre",       emoji: "🎭", img: "masque" },
  { id: "danse",        label: "Danse",         emoji: "🩰", img: "danse" },
  { id: "rituel",       label: "Rituel",        emoji: "🕯",  img: "bougie" },
  { id: "idee",         label: "Idée",          emoji: "💡", img: "etoile" },
  { id: "philosophie",  label: "Philosophie",   emoji: "∞",  img: "cristal" },
  { id: "priere",       label: "Prière",        emoji: "🙏", img: "main" },
  { id: "meditation",   label: "Méditation",    emoji: "◎",  img: "lotus" },
  { id: "respiration",  label: "Respiration",   emoji: "〰", img: "cloche" },
  { id: "mouvement",    label: "Mouvement",     emoji: "〰", img: "danse" },
  { id: "sport",        label: "Sport",         emoji: "⚡", img: "danse" },
  { id: "art",          label: "Art",           emoji: "🎨", img: "cristal" },
  { id: "photo",        label: "Photographie",  emoji: "📷", img: "oeil" },
  { id: "peinture",     label: "Peinture",      emoji: "🖌",  img: "cristal" },
  { id: "sculpture",    label: "Sculpture",     emoji: "🗿",  img: "cristal" },
  { id: "architecture", label: "Architecture",  emoji: "🏛",  img: "porte" },
  { id: "nature",       label: "Nature",        emoji: "🌿", img: "plante" },
  { id: "plante",       label: "Plante",        emoji: "🌱", img: "plante" },
  { id: "animal",       label: "Animal",        emoji: "🦋", img: "papillon" },
  { id: "recette",      label: "Recette",       emoji: "🍃", img: "the" },
  { id: "the",          label: "Thé",           emoji: "🍵", img: "the" },
  { id: "parfum",       label: "Parfum",        emoji: "✿",  img: "parfum" },
  { id: "objet",        label: "Objet",         emoji: "◇",  img: "cristal" },
  { id: "lettre",       label: "Lettre",        emoji: "✉",  img: "carnet" },
  { id: "journal",      label: "Journal",       emoji: "📓", img: "carnet" },
  { id: "reve",         label: "Rêve",          emoji: "🌙", img: "oeil" },
  { id: "silence",      label: "Silence",       emoji: "◌",  img: "silence" },
];

const TROUVAILLES_DEMO = [
  { id:1, categorie:"livre", titre:"L'homme qui voulait être heureux", pourquoi:"Je l'ai lu dans une période où j'étais perdu. Il m'a rappelé que nous avons plus de liberté que nous le croyons.", jours:17 },
  { id:2, categorie:"pratique", titre:"La méditation Vipassana", pourquoi:"Dix jours de silence. Je ne savais pas que j'avais autant de bruit en moi.", jours:34 },
  { id:3, categorie:"film", titre:"Paterson", pourquoi:"Un film sur la beauté du quotidien. Sur l'idée que la vie ordinaire peut être un poème.", jours:8 },
  { id:4, categorie:"citation", titre:"'Ce qui ne me tue pas me rend plus fort'", pourquoi:"Je l'ai relu le soir d'une rupture. Ce soir-là, ça m'a suffi.", jours:52 },
  { id:5, categorie:"musique", titre:"Nuvole Bianche — Ludovico Einaudi", pourquoi:"Quand les mots ne venaient plus, cette musique parlait à ma place.", jours:3 },
  { id:6, categorie:"voyage", titre:"Kyoto en novembre", pourquoi:"Les érables rouges. Le silence des temples tôt le matin. J'ai compris quelque chose sur le passage du temps.", jours:91 },
  { id:7, categorie:"priere", titre:"La prière de la sérénité", pourquoi:"Accepter ce qu'on ne peut pas changer. Je la dis encore chaque matin.", jours:22 },
  { id:8, categorie:"podcast", titre:"On Being — Krista Tippett", pourquoi:"Des conversations sur ce qui compte vraiment. Je me sens moins seul après chaque épisode.", jours:14 },
  { id:9, categorie:"rituel", titre:"Écrire trois choses le soir", pourquoi:"Pas de la gratitude forcée. Juste observer ce qui s'est passé. Ça change le regard.", jours:45 },
  { id:10, categorie:"lieu", titre:"La forêt de Fontainebleau au lever du soleil", pourquoi:"Il y a une lumière là-bas qui remet les choses à leur juste place.", jours:6 },
  { id:11, categorie:"philosophie", titre:"Le stoïcisme — Marc Aurèle", pourquoi:"Pensées pour moi-même. Écrit par un empereur pour lui-même, jamais pour être publié. C'est ce qui le rend si honnête.", jours:28 },
  { id:12, categorie:"respiration", titre:"La cohérence cardiaque", pourquoi:"5 minutes. Trois fois par jour. Je ne croyais pas que respirer pouvait changer autant de choses.", jours:19 },
];

const SalleDesTrouvailles = ({ data }) => {
  const [filtre, setFiltre] = useState("tout");
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ categorie: "", titre: "", pourquoi: "" });
  const [formSent, setFormSent] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [trouvailles, setTrouvailles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger les trouvailles approuvées depuis Supabase
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/trouvailles?limit=60`);
        const d = await res.json();
        setTrouvailles(d.trouvailles || []);
      } catch {
        // Fallback silencieux — grille vide
        setTrouvailles([]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = trouvailles.filter(t => filtre === "tout" || t.categorie === filtre);
  const getCat = (id) => CATEGORIES_TROUVAILLES.find(c => c.id === id) || { emoji: "✦", label: id, img: null };

  // Vue carte ouverte
  if (selected) {
    const c = getCat(selected.categorie);
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "#0A0806",
        display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        padding: "2rem",
        animation: "fadeUp 0.5s ease forwards",
      }}>
        {/* Halo central */}
        <div style={{
          position: "absolute", top: "35%", left: "50%", transform: "translate(-50%,-50%)",
          width: 300, height: 300, borderRadius: "50%",
          background: `radial-gradient(circle, ${T.or}08 0%, transparent 70%)`,
          pointerEvents: "none",
        }}/>

        <button onClick={() => setSelected(null)} style={{
          position: "absolute", top: "1.2rem", left: "1.2rem",
          background: "transparent", border: "none",
          color: T.brume, fontFamily: T.sans, fontSize: "0.5rem",
          letterSpacing: "0.3em", textTransform: "uppercase", cursor: "pointer",
        }}>← Retour</button>

        {/* Image objet */}
        {c.img ? (
          <img src={`/trouvailles/${c.img}.jpg`} alt={c.label}
            style={{ width: 100, height: 100, objectFit: "cover", borderRadius: "8px", opacity: 0.85, marginBottom: "1.5rem" }}
          />
        ) : (
          <div style={{ fontSize: "2.5rem", marginBottom: "1.5rem", opacity: 0.7 }}>{c.emoji}</div>
        )}

        {/* Catégorie */}
        <div style={{
          fontFamily: T.sans, fontWeight: 300, fontSize: "0.58rem",
          letterSpacing: "0.5em", textTransform: "uppercase",
          color: `${T.or}88`, marginBottom: "0.8rem",
        }}>{c.label}</div>

        {/* Titre */}
        <div style={{
          fontFamily: T.serif, fontStyle: "italic",
          fontSize: "clamp(1.3rem, 4vw, 1.7rem)",
          color: T.orPale, fontWeight: 300,
          textAlign: "center", lineHeight: 1.4,
          marginBottom: "2rem", maxWidth: 380,
        }}>{selected.titre}</div>

        {/* Séparateur */}
        <div style={{ width: 40, height: 1, background: `${T.or}44`, marginBottom: "2rem" }}/>

        {/* Texte anonyme */}
        <div style={{
          fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem",
          letterSpacing: "0.3em", textTransform: "uppercase",
          color: T.brume, marginBottom: "1rem",
        }}>Quelqu'un a écrit…</div>

        <p style={{
          fontFamily: T.serif, fontStyle: "italic",
          fontSize: "clamp(0.9rem, 3vw, 1rem)",
          color: T.aube, lineHeight: 1.9,
          textAlign: "center", maxWidth: 360,
          fontWeight: 300,
        }}>{selected.pourquoi}</p>

        {/* Jours */}
        <div style={{
          marginTop: "2.5rem",
          fontFamily: T.sans, fontWeight: 300, fontSize: "0.58rem",
          letterSpacing: "0.3em", color: `${T.brume}BB`,
        }}>Laissé ici il y a {selected.jours} {selected.jours === 1 ? "jour" : "jours"}</div>
      </div>
    );
  }

  // Formulaire dépôt
  if (showForm) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "#0A0806",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "2rem",
        animation: "fadeUp 0.5s ease forwards",
      }}>
        <button onClick={() => setShowForm(false)} style={{
          position: "absolute", top: "1.2rem", left: "1.2rem",
          background: "transparent", border: "none",
          color: T.brume, fontFamily: T.sans, fontSize: "0.5rem",
          letterSpacing: "0.3em", textTransform: "uppercase", cursor: "pointer",
        }}>← Retour</button>

        {formSent ? (
          <div style={{ textAlign: "center", animation: "fadeUp 0.6s ease forwards" }}>
            <div style={{ fontSize: "2rem", marginBottom: "1.5rem" }}>✦</div>
            <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "clamp(1.1rem, 3.5vw, 1.4rem)", color: T.orPale, marginBottom: "1rem", fontWeight: 300 }}>
              Ta trouvaille est déposée.
            </div>
            <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.9rem", color: T.brume, lineHeight: 1.8 }}>
              Quelqu'un la trouvera peut-être un jour.
            </p>
          </div>
        ) : (
          <div style={{ width: "100%", maxWidth: 420 }}>
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
              <div style={{ fontSize: "1.8rem", marginBottom: "1rem", opacity: 0.6 }}>✦</div>
              <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "clamp(1.1rem, 3.5vw, 1.3rem)", color: T.orPale, fontWeight: 300, marginBottom: "0.5rem" }}>
                Tu peux laisser ici ce qui t'a aidé.
              </div>
              <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.82rem", color: T.brume, lineHeight: 1.7 }}>
                Quelqu'un le trouvera peut-être un jour.
              </p>
            </div>

            {/* Catégorie */}
            <div style={{ marginBottom: "1.2rem" }}>
              <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.58rem", letterSpacing: "0.4em", textTransform: "uppercase", color: T.brume, marginBottom: "0.6rem" }}>Catégorie</div>
              <select value={formData.categorie} onChange={e => setFormData({...formData, categorie: e.target.value})} style={{
                width: "100%", background: `${T.nuit2}`, border: `1px solid ${T.brume}33`,
                borderRadius: "4px", padding: "0.7rem 0.8rem",
                color: formData.categorie ? T.aube : T.brume,
                fontFamily: T.serif, fontStyle: "italic", fontSize: "0.9rem",
                outline: "none", cursor: "pointer",
              }}>
                <option value="" style={{ background: "#1E1A16" }}>Choisir…</option>
                {CATEGORIES_TROUVAILLES.filter(c => c.id !== "tout").map(c => (
                  <option key={c.id} value={c.id} style={{ background: "#1E1A16" }}>{c.emoji} {c.label}</option>
                ))}
              </select>
            </div>

            {/* Titre */}
            <div style={{ marginBottom: "1.2rem" }}>
              <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.58rem", letterSpacing: "0.4em", textTransform: "uppercase", color: T.brume, marginBottom: "0.6rem" }}>Titre</div>
              <input value={formData.titre} onChange={e => setFormData({...formData, titre: e.target.value})}
                placeholder="Le nom du livre, du film, de la pratique…"
                maxLength={100}
                style={{
                  width: "100%", background: "transparent", border: `1px solid ${T.brume}33`,
                  borderRadius: "4px", padding: "0.7rem 0.8rem",
                  color: T.aube, fontFamily: T.serif, fontStyle: "italic", fontSize: "0.9rem",
                  outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            {/* Pourquoi */}
            <div style={{ marginBottom: "2rem" }}>
              <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.58rem", letterSpacing: "0.4em", textTransform: "uppercase", color: T.brume, marginBottom: "0.6rem" }}>Pourquoi ça t'a aidé</div>
              <textarea value={formData.pourquoi} onChange={e => setFormData({...formData, pourquoi: e.target.value})}
                placeholder="Quelques mots sincères. Pas besoin de tout expliquer."
                maxLength={280}
                rows={3}
                style={{
                  width: "100%", background: "transparent", border: `1px solid ${T.brume}33`,
                  borderRadius: "4px", padding: "0.7rem 0.8rem",
                  color: T.aube, fontFamily: T.serif, fontStyle: "italic", fontSize: "0.9rem",
                  outline: "none", resize: "none", boxSizing: "border-box",
                }}
              />
              <div style={{ textAlign: "right", fontFamily: T.sans, fontSize: "0.5rem", color: `${T.brume}BB`, marginTop: "0.3rem" }}>
                {formData.pourquoi.length} / 280
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <Btn
                onClick={async () => {
                  if (formData.categorie && formData.titre.length > 2 && formData.pourquoi.length > 10) {
                    setFormLoading(true);
                    try {
                      await fetch("/api/trouvailles", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          categorie: formData.categorie,
                          titre: formData.titre,
                          pourquoi: formData.pourquoi,
                          user_key: localStorage.getItem("alba_user_key") || null,
                        }),
                      });
                      try { const a = new Audio("/sons/trouvaille.mp3"); a.volume = 0.2; a.play().catch(()=>{}); } catch(e) {}
                      setFormSent(true);
                    } catch {
                      setFormSent(true); // Afficher succès même si erreur réseau
                    }
                    setFormLoading(false);
                  }
                }}
                disabled={formLoading || !formData.categorie || formData.titre.length < 3 || formData.pourquoi.length < 10}
              >{formLoading ? "Dépôt en cours…" : "Déposer dans la salle"}</Btn>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Vue principale
  return (
    <div style={{ paddingBottom: "5rem" }}>
      {/* En-tête */}
      <div style={{ textAlign: "center", padding: "1.5rem 1rem 1rem" }}>
        <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.58rem", letterSpacing: "0.5em", textTransform: "uppercase", color: T.brume, marginBottom: "0.5rem" }}>
          La Salle des
        </div>
        <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "clamp(1.4rem, 4.5vw, 1.8rem)", color: T.orPale, fontWeight: 300, marginBottom: "0.6rem" }}>
          Trouvailles
        </div>
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.82rem", color: T.brume, lineHeight: 1.8, maxWidth: 340, margin: "0 auto" }}>
          Certaines choses dans la vie nous sont données par d'autres.<br/>
          Ces gens-là sont passés par ici.
        </p>
      </div>

      {/* Filtres — scroll horizontal */}
      <div style={{ overflowX: "auto", padding: "1rem 1rem 0.5rem", scrollbarWidth: "none" }}>
        <div style={{ display: "flex", gap: "0.5rem", width: "max-content" }}>
          {CATEGORIES_TROUVAILLES.map(c => (
            <button key={c.id} onClick={() => setFiltre(c.id)} style={{
              background: filtre === c.id ? `${T.or}18` : "transparent",
              border: `1px solid ${filtre === c.id ? T.or + "55" : T.brume + "22"}`,
              borderRadius: "20px", padding: "0.35rem 0.8rem",
              color: filtre === c.id ? T.orPale : T.brume,
              fontFamily: T.serif, fontStyle: "italic", fontSize: "0.78rem",
              cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
            }}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grille cartes */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", fontFamily: T.serif, fontStyle: "italic", fontSize: "0.9rem", color: T.brume }}>
          …
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.95rem", color: T.brume, lineHeight: 1.8 }}>
            Aucune trouvaille ici encore.<br/>Sois le premier à en laisser une.
          </div>
        </div>
      ) : (
      <div style={{ padding: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
        {filtered.map(t => {
          const c = getCat(t.categorie);
          return (
            <div key={t.id} onClick={() => setSelected(t)} style={{
              background: `${T.nuit2}`,
              border: `1px solid ${T.brume}18`,
              borderRadius: "8px", padding: "1.2rem 1rem",
              cursor: "pointer", transition: "all 0.3s",
              position: "relative", overflow: "hidden",
              minHeight: 120,
            }}>
              {/* Image objet en fond */}
              {getCat(t.categorie).img && (
                <img src={`/trouvailles/${getCat(t.categorie).img}.jpg`}
                  style={{
                    position: "absolute", bottom: -10, right: -10,
                    width: 90, height: 90, objectFit: "cover",
                    opacity: 0.18, borderRadius: "4px",
                    pointerEvents: "none",
                  }}
                />
              )}
              {/* Gradient overlay */}
              <div style={{
                position: "absolute", inset: 0,
                background: `linear-gradient(135deg, ${T.nuit2} 40%, transparent 100%)`,
                pointerEvents: "none",
              }}/>
              {/* Catégorie */}
              <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.4rem", letterSpacing: "0.4em", textTransform: "uppercase", color: `${T.or}88`, marginBottom: "0.6rem" }}>
                {c.emoji} {c.label}
              </div>
              {/* Titre */}
              <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "clamp(0.82rem, 2.5vw, 0.95rem)", color: T.orPale, fontWeight: 300, lineHeight: 1.4, marginBottom: "0.8rem" }}>
                {t.titre}
              </div>
              {/* Jours */}
              <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.4rem", letterSpacing: "0.2em", color: `${T.brume}55` }}>
                il y a {t.jours}j
              </div>
            </div>
          );
        })}
      </div>
      )} {/* fin conditionnel grille */}

      {/* Bouton déposer */}
      <div style={{ textAlign: "center", padding: "1.5rem 1rem" }}>
        <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.82rem", color: T.brume, marginBottom: "1rem", lineHeight: 1.7 }}>
          Tu as quelque chose à laisser ici ?
        </div>
        <Btn onClick={() => setShowForm(true)}>Déposer une trouvaille</Btn>
      </div>
    </div>
  );
};

// ─── BIBLIOTHÈQUE DES SAGESSES ───────────────────────────────────────────────
const SAGESSES = [
  { id: "ikigai", nom: "Ikigai", origine: "Japonais", fichier: "ikigai", texte: "Quelqu'un t'a demandé un jour ce que tu voulais faire de ta vie. Tu as peut-être répondu quelque chose de raisonnable. Mais l'Ikigai pose une autre question — quatre en réalité, simultanément : qu'est-ce qui me passionne ? Qu'est-ce que je sais faire vraiment ? Ce que je fais est-il utile au monde ? Puis-je en vivre ? L'Ikigai, c'est le point où ces quatre cercles se rejoignent. Pour certains, il est évident depuis l'enfance. Pour d'autres, il se révèle à cinquante ans, après une crise, après un deuil. Mais il est là. Il a toujours été là." },
  { id: "kintsugi", nom: "Kintsugi", origine: "Japonais", fichier: "kintsugi", texte: "Un bol tombe. Se brise en sept morceaux. Dans la plupart des maisons du monde, on jette ou on cache. Au Japon, on prend de la laque mêlée d'or et on réassemble — lentement, soigneusement. Les fractures deviennent les parties les plus visibles. Les plus lumineuses. Il n'y a pas de honte dans ce qui a été brisé. Il y a une histoire. Et cette histoire mérite d'être portée en or. Tu n'as pas à effacer ce qui t'a cassé. Tu peux choisir de le réparer à la vue de tous." },
  { id: "hygge", nom: "Hygge", origine: "Danois", fichier: "hygge", texte: "Ce n'est pas un objet qu'on achète ni un endroit où l'on va. C'est une qualité de présence. Une bougie allumée un soir de novembre. Une conversation qui dure trop longtemps autour d'une table. Un plaid, un livre, la pluie dehors. Les Danois ont un mot pour ce que beaucoup cherchent sans savoir le nommer : cet état où l'on n'a nulle part à être sinon là, avec les gens qu'on aime, dans la lumière douce de l'instant qui suffit." },
  { id: "sabr", nom: "Sabr", origine: "Arabe", fichier: "sabr", texte: "On traduit souvent Sabr par patience. Mais c'est insuffisant. La patience peut être passive, résignée, épuisée. Le Sabr est autre chose — une endurance active, lucide, presque guerrière. C'est tenir debout dans l'épreuve sans perdre la foi dans le mouvement. C'est savoir que la tempête a une durée, même quand on ne voit pas la rive. Dans la tradition soufie, le Sabr n'est pas la soumission à la douleur — c'est la dignité qu'on garde au milieu d'elle." },
  { id: "wabi-sabi", nom: "Wabi-Sabi", origine: "Japonais", fichier: "wabi-sabi", texte: "Une tasse ébréchée. Un visage qui a vieilli. Un jardin que l'automne a défait. L'esthétique japonaise du Wabi-Sabi enseigne que la beauté n'est pas dans la perfection — elle est dans l'impermanence, dans le passage du temps laissé visible, dans ce qui est incomplet parce que la vie l'est aussi. Rien n'est permanent. Rien n'est achevé. Rien n'est parfait. Et c'est exactement pour cette raison que tout peut être beau." },
  { id: "tawakkul", nom: "Tawakkul", origine: "Arabe", fichier: "tawakkul", texte: "Il y a un récit qu'on aime dans la tradition islamique : un homme attache son chameau avant de dormir, puis dit 'je fais confiance à Dieu'. Un sage lui répond : 'Attache ton chameau, puis fais confiance à Dieu.' Le Tawakkul n'est pas l'abandon de l'effort — c'est la paix qui suit l'effort. Faire sa part, complètement, honnêtement. Puis lâcher ce qu'on ne peut pas contrôler. Cette frontière entre responsabilité et lâcher-prise est l'une des plus difficiles à trouver. Et l'une des plus libératrices." },
  { id: "ubuntu", nom: "Ubuntu", origine: "Bantou", fichier: "ubuntu", texte: "Un anthropologue proposa un jour un jeu à des enfants d'un village africain. Il posa un panier de friandises sous un arbre et dit : le premier arrivé gagne tout. Il s'attendait à voir les enfants courir séparément. Ils se prirent par la main et coururent ensemble. Ils partagèrent. Quand il leur demanda pourquoi, ils répondirent : Ubuntu. Comment l'un d'entre nous pourrait-il être heureux si les autres ne le sont pas ? Je suis parce que nous sommes." },
  { id: "yugen", nom: "Yūgen", origine: "Japonais", fichier: "yugen", texte: "Il n'existe pas de traduction exacte. C'est ce qu'on ressent en regardant la brume descendre sur une montagne le soir. C'est l'émotion qui monte quand on voit des oies sauvages disparaître dans les nuages. C'est la conscience soudaine et vertigineuse que l'univers est infiniment plus vaste que soi — et que cette vastitude, au lieu d'écraser, libère. Le Yūgen ne s'explique pas. Il se reconnaît quand il traverse, comme une onde, le centre de la poitrine." },
  { id: "fitra", nom: "Fitra", origine: "Arabe", fichier: "fitra", texte: "Avant que le monde ne t'apprenne qui être, avant les peurs héritées et les masques construits, il y avait quelque chose. Une nature originelle. Intacte, pure, orientée vers la lumière comme une plante vers le soleil. La tradition islamique appelle ça la Fitra — l'état dans lequel chaque être arrive au monde. Toute la vie spirituelle, dans cette perspective, n'est pas une conquête. C'est un retour. Un lent désapprentissage de ce qui t'a éloigné de ce que tu étais déjà." },
  { id: "baraka", nom: "Baraka", origine: "Arabe", fichier: "baraka", texte: "Certains lieux semblent chargés d'une énergie invisible. Certaines personnes entrent dans une pièce et quelque chose change. Certains moments — un coucher de soleil, une étreinte, une prière collective — semblent touchés par autre chose que le hasard. Dans les traditions arabes et africaines, on appelle ça la Baraka : une bénédiction qui circule, qui se transmet, qui se reçoit. Elle n'est pas réservée aux saints. Elle passe par les actes justes, les intentions pures, les mains qui donnent sans compter." },
  { id: "ataraxia", nom: "Ataraxia", origine: "Grec", fichier: "ataraxia", texte: "Les épicuriens et les stoïciens avaient des visions différentes du bonheur mais s'accordaient sur un point : l'Ataraxia, la tranquillité de l'âme, était le but. Non pas l'euphorie — l'euphorie s'effondre. Non pas l'absence de sensation — c'est la mort. Mais un état stable, une paix qui ne dépend pas des circonstances extérieures. Quelque chose qu'aucun événement ne peut complètement défaire. Les Grecs croyaient qu'on pouvait y arriver. Qu'il suffisait de travailler sa pensée comme on travaille son corps." },
  { id: "kaizen", nom: "Kaizen", origine: "Japonais", fichier: "kaizen", texte: "Après la défaite de 1945, le Japon était en ruine. Ce qui allait suivre n'a pas été une révolution spectaculaire — ce fut des millions de petits gestes quotidiens d'amélioration. Kai : changer. Zen : pour le mieux. Chaque jour, un peu mieux qu'hier. Pas de grand soir, pas de transformation radicale. Juste la discipline douce de ne jamais s'arrêter de progresser. Le Kaizen enseigne que la constance est plus puissante que l'intensité. Que ce qu'on fait chaque jour est plus important que ce qu'on fait parfois." },
  { id: "lagom", nom: "Lagom", origine: "Suédois", fichier: "lagom", texte: "La légende dit que le mot vient des Vikings qui passaient un bol de bière à la ronde : 'laget om', pour le groupe. Chacun buvait sa juste part, ni trop ni trop peu, pour que tous puissent partager. Aujourd'hui, Lagom désigne cet art suédois de l'équilibre juste — dans l'alimentation, le travail, la décoration, la vie sociale. Ni excès ni manque. Juste assez. Dans un monde qui valorise le toujours plus, le Lagom est presque une forme de rébellion douce." },
  { id: "sisu", nom: "Sisu", origine: "Finnois", fichier: "sisu", texte: "Les Finlandais ont survécu à des hivers qui auraient tué d'autres peuples. Pas grâce à l'optimisme — grâce au Sisu. C'est une force qui ne se voit pas dans les moments faciles. Elle n'apparaît que quand tout est épuisé : l'énergie, l'espoir, les ressources. Et là, au fond, il reste quelque chose. Une résistance sans spectacle, sans discours. Juste la décision silencieuse de continuer. Le Sisu ne promet pas que ça va aller. Il dit seulement : je ne m'arrête pas là." },
  { id: "sankofa", nom: "Sankofa", origine: "Akan", fichier: "sankofa", texte: "Dans la tradition Akan du Ghana, on représente le Sankofa par un oiseau qui vole vers l'avant en tournant la tête vers l'arrière, tenant dans son bec un œuf — l'avenir. Le message est simple et profond : il n'est jamais trop tard pour retourner chercher ce qu'on a oublié. Les erreurs du passé ne sont pas des fardeaux — elles sont des enseignements. Les racines ne retiennent pas — elles nourrissent. Pour avancer vraiment, il faut savoir d'où on vient." },
  { id: "qalb", nom: "Qalb", origine: "Arabe", fichier: "qalb", texte: "En arabe, Qalb signifie cœur — mais aussi ce qui se retourne, ce qui oscille. Ce n'est pas l'image romantique du cœur occidental. C'est quelque chose de plus profond et plus instable : le centre de l'être humain, le siège de la conscience, le lieu où se jouent les transformations réelles. Dans la spiritualité soufie, le Qalb est un miroir. Quand il est poli par l'attention et la sincérité, il reflète la lumière divine. Quand il est encombré, il ne voit plus rien." },
  { id: "eudaimonia", nom: "Eudaimonia", origine: "Grec", fichier: "eudaimonia", texte: "Aristote n'a jamais cru que le bonheur était une sensation. Pour lui, l'Eudaimonia — souvent traduit par 'bonheur' mais qui signifie littéralement 'bon démon, bon génie intérieur' — c'est une activité. C'est la vie qui se déploie selon ce qu'on est profondément. Non pas ce qui fait plaisir, mais ce qui permet à la nature la plus haute de l'être humain de s'exprimer. L'Eudaimonia n'est pas un état qu'on atteint. C'est une direction dans laquelle on marche, chaque jour, en faisant le choix d'être pleinement ce qu'on est." },
  { id: "arete", nom: "Areté", origine: "Grec", fichier: "arete", texte: "Pour les Grecs anciens, l'Areté n'était pas réservée aux héros. Un cheval qui court vite a son Areté. Un couteau bien aiguisé a le sien. Chaque être a une excellence qui lui est propre — une manière d'être pleinement ce qu'il est censé être. L'Areté humaine, c'est donner le meilleur de soi non pour être admiré, mais parce que c'est la seule manière juste d'habiter sa vie. C'est l'artisan qui soigne le dos de la statue que personne ne verra jamais. Parce que lui, il sait." },
  { id: "maktub", nom: "Maktub", origine: "Arabe", fichier: "maktub", texte: "Paulo Coelho l'a rendu célèbre. Mais avant le roman, le mot existait dans les souks, dans les mosquées, dans les lettres entre voyageurs. Maktub : c'est écrit. Pas au sens d'une fatalité qui écrase — au sens d'une trame plus grande que soi dans laquelle chaque événement a un sens qu'on ne voit pas toujours immédiatement. Ce qui devait arriver est arrivé. Ce qu'on a perdu avait peut-être à partir. Et ce qui vient — même si on ne peut pas encore le nommer — est déjà en chemin." },
  { id: "meraki", nom: "Meraki", origine: "Grec", fichier: "meraki", texte: "Les Grecs modernes utilisent ce mot pour décrire ce qu'on met dans ce qu'on fait quand on le fait vraiment. La cuisinière qui prépare le repas en pensant à chaque convive. Le musicien qui joue pour une salle vide avec autant d'âme que pour mille personnes. L'artisan qui peaufine un détail que personne ne remarquera. Le Meraki, c'est quand l'acte et la personne ne font plus qu'un. Quand on n'est plus en train de faire quelque chose — on est ce qu'on fait." },
  { id: "maat", nom: "Ma'at", origine: "Égyptien", fichier: "maat", texte: "Dans l'Égypte ancienne, Ma'at était à la fois une déesse et un principe cosmique. Elle représentait l'ordre, la vérité, la justice, l'harmonie — tout ce qui maintient le monde en équilibre. Après la mort, le cœur du défunt était pesé contre sa plume. Si le cœur était alourdi par le mensonge, l'injustice, les actes contraires à Ma'at, la balance penchait. Vivre selon Ma'at, c'était vivre de façon à ce que son cœur reste léger. Pas innocent — juste." },
  { id: "satori", nom: "Satori", origine: "Japonais", fichier: "satori", texte: "On ne peut pas décider d'avoir un Satori. On ne peut pas le provoquer, le planifier, le mériter par accumulation d'efforts. C'est un éveil soudain — un instant où la réalité se voit telle qu'elle est, sans les filtres habituels de l'ego et du mental. Les maîtres Zen créaient des conditions pour que cela arrive : méditation, kōan, travail, silence. Mais le Satori lui-même arrive comme la lumière entre les nuages. Bref, total, transformateur. Et après, on ne voit plus les choses tout à fait pareil." },
];

const BibliothequeSagesses = () => {
  const [selected, setSelected] = useState(null);

  if (selected) {
    const s = selected;
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "#0A0806",
        display: "flex", flexDirection: "column",
      }}>
        {/* Image plein écran */}
        <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
          <img src={`/sagesses/${s.fichier}.jpg`} alt={s.nom}
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }}/>
          {/* Gradient bas */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: "55%",
            background: "linear-gradient(to top, #0A0806 0%, transparent 100%)",
          }}/>
          {/* Bouton retour */}
          <button onClick={() => setSelected(null)} style={{
            position: "absolute", top: "1.2rem", left: "1.2rem",
            background: "rgba(10,8,6,0.6)", border: `1px solid ${T.brume}33`,
            borderRadius: "6px", padding: "0.5rem 0.9rem",
            color: T.brume, fontFamily: T.sans, fontSize: "0.5rem",
            letterSpacing: "0.3em", textTransform: "uppercase", cursor: "pointer",
          }}>← Retour</button>
        </div>

        {/* Texte */}
        <div style={{ padding: "1.5rem 1.5rem 2.5rem", flexShrink: 0 }}>
          <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.58rem", letterSpacing: "0.5em", textTransform: "uppercase", color: `${T.or}88`, marginBottom: "0.5rem" }}>
            {s.origine}
          </div>
          <div style={{ fontFamily: T.serif, fontSize: "clamp(1.6rem, 5vw, 2rem)", color: T.orPale, fontStyle: "italic", marginBottom: "1rem", fontWeight: 300 }}>
            {s.nom}
          </div>
          <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "clamp(0.9rem, 3vw, 1rem)", color: T.aube, lineHeight: 1.85, fontWeight: 300 }}>
            {s.texte}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 0 4rem" }}>
      <div style={{ textAlign: "center", padding: "1.5rem 1rem 1rem" }}>
        <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.58rem", letterSpacing: "0.5em", textTransform: "uppercase", color: T.brume, marginBottom: "0.5rem" }}>
          Bibliothèque
        </div>
        <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "clamp(1.1rem, 3.5vw, 1.3rem)", color: T.orPale, fontWeight: 300 }}>
          Les Sagesses du monde
        </div>
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.82rem", color: T.brume, marginTop: "0.4rem", lineHeight: 1.7 }}>
          22 mots que toutes les langues n'ont pas.
        </p>
      </div>

      {/* Grille 2 colonnes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px", padding: "0 2px" }}>
        {SAGESSES.map(s => (
          <div key={s.id} onClick={() => setSelected(s)} style={{
            position: "relative", aspectRatio: "1/1", overflow: "hidden", cursor: "pointer",
          }}>
            <img src={`/sagesses/${s.fichier}.jpg`} alt={s.nom}
              style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }}/>
            {/* Gradient */}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to top, rgba(10,8,6,0.75) 0%, transparent 50%)",
            }}/>
            {/* Nom */}
            <div style={{
              position: "absolute", bottom: "0.7rem", left: 0, right: 0,
              textAlign: "center",
              fontFamily: T.serif, fontStyle: "italic",
              fontSize: "clamp(0.85rem, 2.8vw, 1rem)",
              color: T.orPale, fontWeight: 300,
              textShadow: "0 1px 8px rgba(0,0,0,0.8)",
            }}>{s.nom}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── LETTRE MENSUELLE ──────────────────────────────────────────────────────
const SUPABASE_URL_LM = "https://yuwqokjkpooozgtsvfkc.supabase.co";
const SUPABASE_KEY_LM = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1d3Fva2prcG9vb3pndHN2ZmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5Njk4MjIsImV4cCI6MjA4ODU0NTgyMn0.5IHYvE6lnwl-PTAhcpT9c2lkhlxSu6w9rGksfCEfCPc";

const LettreMensuelleCTA = ({ nomMois, mois, userKey, onLettre }) => {
  const [generating, setGenerating] = useState(false);
  const [err, setErr] = useState(null);

  const SB_URL = "https://yuwqokjkpooozgtsvfkc.supabase.co";
  const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1d3Fva2prcG9vb3pndHN2ZmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5Njk4MjIsImV4cCI6MjA4ODU0NTgyMn0.5IHYvE6lnwl-PTAhcpT9c2lkhlxSu6w9rGksfCEfCPc";

  useEffect(() => {
    const uk = userKey || (typeof localStorage !== "undefined" ? localStorage.getItem("alba_user_key") : null);
    if (!uk) return;
    generer(uk);
  }, [userKey]);

  const generer = async (uk) => {
    setGenerating(true); setErr(null);
    try {
      // Profil utilisateur
      const profR = await fetch(`${SB_URL}/rest/v1/alba_profiles?user_key=eq.${encodeURIComponent(uk)}&select=prenom,chemin,sensibilite&limit=1`, {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
      });
      const profRows = await profR.json();
      const prof = profRows?.[0] || {};
      const prenom = prof.prenom || "toi";
      const chemin = prof.chemin || "";
      const sensibilite = prof.sensibilite || "";

      // Post-its récents pour contexte
      const postR = await fetch(`${SB_URL}/rest/v1/alba_cairn?user_key=eq.${encodeURIComponent(uk)}&select=etat&order=created_at.desc&limit=10`, {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
      });
      const postits = await postR.json();
      const etats = (postits || []).map(p => p.etat).filter(Boolean).slice(0, 6).join(", ");

      // Génération Claude
      const prompt = `Tu es ALBA, une présence douce et lumineuse. Tu écris une lettre mensuelle personnelle et intime à ${prenom}.

Contexte :
- Chemin de vie : ${chemin || "non précisé"}
- Sensibilité : ${sensibilite || "non précisée"}  
- Ce qu'elle a traversé récemment : ${etats || "rien de partagé encore"}
- Mois : ${nomMois}

Écris une lettre de 3-4 paragraphes en français, à la deuxième personne (tu/toi). Style doux, poétique, intime. Commence directement par une phrase forte adressée à ${prenom}. Termine sur une image ou une invitation intérieure. Pas de formule de politesse.`;

      const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const aiData = await aiRes.json();
      const contenu = aiData.content?.[0]?.text;
      if (!contenu) throw new Error("vide");

      // Sauvegarde Supabase — une seule fois par mois
      await fetch(`${SB_URL}/rest/v1/alba_lettres_mensuelles`, {
        method: "POST",
        headers: {
          apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates"
        },
        body: JSON.stringify({ user_key: uk, mois, contenu })
      });

      onLettre(contenu);
    } catch(e) {
      setErr("ALBA n'a pas pu écrire ce mois-ci. Réessaie dans un moment.");
      setGenerating(false);
    }
  };

  if (generating) return (
    <div style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
      <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.95rem", color: T.brume, lineHeight: 2 }}>
        ALBA écrit ta lettre…<br/>
        <span style={{ fontSize: "0.8rem", color: `${T.brume}77` }}>Un instant.</span>
      </div>
    </div>
  );

  if (err) return (
    <div style={{ textAlign: "center", padding: "2rem 1.5rem" }}>
      <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.85rem", color: "#D4856A", lineHeight: 1.8 }}>{err}</p>
    </div>
  );

  return (
    <div style={{ textAlign: "center", padding: "2rem 1.5rem" }}>
      <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.9rem", color: T.brume }}>Préparation…</p>
    </div>
  );
};

const LettreMensuelle = ({ userKey, isPremium, onShowPaywall }) => {
  const [lettre, setLettre] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lue, setLue] = useState(false);
  const [premiumLocal, setPremiumLocal] = useState(isPremium);
  const mois = new Date().toISOString().slice(0, 7);
  const nomMois = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  // Vérification premium directement via Supabase côté client
  useEffect(() => {
    const uk = userKey || (typeof localStorage !== "undefined" ? localStorage.getItem("alba_user_key") : null);
    if (!uk) return;
    fetch(`${SUPABASE_URL_LM}/rest/v1/alba_profiles?user_key=eq.${encodeURIComponent(uk)}&select=is_premium&limit=1`, {
      headers: { apikey: SUPABASE_KEY_LM, Authorization: `Bearer ${SUPABASE_KEY_LM}` }
    })
      .then(r => r.json())
      .then(rows => { if (rows?.[0]?.is_premium) setPremiumLocal(true); })
      .catch(() => {});
  }, [userKey]);

  useEffect(() => {
    if (isPremium) setPremiumLocal(true);
  }, [isPremium]);

  const estPremium = true; // BETA: premium activé pour tous

  useEffect(() => {
    const uk = userKey || (typeof localStorage !== "undefined" ? localStorage.getItem("alba_user_key") : null);
    if (!estPremium || !uk) { setLoading(false); return; }
    // Lecture directe Supabase côté client
    const SB_URL = "https://yuwqokjkpooozgtsvfkc.supabase.co";
    const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1d3Fva2prcG9vb3pndHN2ZmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5Njk4MjIsImV4cCI6MjA4ODU0NTgyMn0.5IHYvE6lnwl-PTAhcpT9c2lkhlxSu6w9rGksfCEfCPc";
    fetch(`${SB_URL}/rest/v1/alba_lettres_mensuelles?user_key=eq.${encodeURIComponent(uk)}&mois=eq.${mois}&select=contenu&limit=1`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
    })
      .then(r => r.json())
      .then(rows => { setLettre(rows?.[0]?.contenu || null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userKey, estPremium, mois]);

  if (loading && !estPremium) return (
    <div style={{ textAlign: "center", padding: "2rem", color: T.brume, fontFamily: T.serif, fontStyle: "italic", fontSize: "0.9rem" }}>Vérification…</div>
  );

  if (!estPremium) return (
    <div style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
      <div style={{ fontSize: "1.4rem", marginBottom: "1rem", opacity: 0.6 }}>✉</div>
      <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.95rem", color: T.brume, lineHeight: 1.8, marginBottom: "1.5rem" }}>
        Chaque mois, ALBA t'écrit une lettre personnelle.<br/>
        <span style={{ fontSize: "0.85rem", color: `${T.brume}CC` }}>Réservé aux membres.</span>
      </p>
      <button onClick={onShowPaywall} style={{
        background: "none", border: `1px solid ${T.or}44`, borderRadius: "6px",
        padding: "0.75rem 2rem", fontFamily: T.sans, fontWeight: 300,
        fontSize: "0.65rem", letterSpacing: "0.45em", textTransform: "uppercase",
        color: T.or, cursor: "pointer",
      }}>Devenir membre</button>
    </div>
  );

  if (loading) return (
    <div style={{ textAlign: "center", padding: "2rem", color: T.brume, fontFamily: T.serif, fontStyle: "italic", fontSize: "0.9rem" }}>
      ALBA écrit…
    </div>
  );

  if (!lettre) return (
    <LettreMensuelleCTA
      nomMois={nomMois} mois={mois} userKey={userKey}
      onLettre={setLettre}
    />
  );

  return (
    <div style={{
      background: `${T.nuit2}CC`,
      border: `1px solid ${T.or}22`,
      borderRadius: "10px",
      padding: "2rem 1.5rem",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Filigrane subtil */}
      <div style={{
        position: "absolute", top: "1rem", right: "1.2rem",
        fontFamily: T.serif, fontSize: "0.6rem", letterSpacing: "0.3em",
        textTransform: "uppercase", color: `${T.or}33`,
      }}>ALBA · {nomMois}</div>

      {/* Ligne décorative */}
      <div style={{ width: 28, height: 1, background: `${T.or}55`, marginBottom: "1.5rem" }} />

      {/* Corps de la lettre */}
      <div style={{
        fontFamily: T.serif, fontSize: "clamp(0.95rem, 3.5vw, 1.05rem)",
        color: T.aube, lineHeight: 2, fontWeight: 300,
        whiteSpace: "pre-wrap",
        animation: lue ? "none" : "fadeUp 0.8s ease forwards",
      }}>
        {lettre.contenu}
      </div>

      {/* Signature */}
      <div style={{ marginTop: "2rem", display: "flex", alignItems: "center", gap: "0.8rem" }}>
        <div style={{ flex: 1, height: 1, background: `${T.or}22` }} />
        <span style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.85rem", color: `${T.or}88` }}>ALBA</span>
        <div style={{ flex: 1, height: 1, background: `${T.or}22` }} />
      </div>
    </div>
  );
};

const Profil = ({ data, onUpdateData, progressStats, onSignOut, isPremium, onShowPaywall, authUserKey }) => {
  const cdv = cheminDeVie(data.naissance);
  const chemin = CHEMINS[cdv] || CHEMINS[9];
  const { blessure, hasDual, hasCroissance } = getContextProfil(data);
  const isRationnel = data.sensibilite === "rationnel";

  const [tempetes, setTempetes] = useState([]);
  const [editIntention, setEditIntention] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("alba_tempetes");
    if (saved) try { setTempetes(JSON.parse(saved)); } catch {}
  }, []);

  const nbJours = (() => {
    const saved = localStorage.getItem("alba_first_day");
    if (!saved) { localStorage.setItem("alba_first_day", new Date().toISOString()); return 1; }
    const diff = (new Date() - new Date(saved)) / (1000 * 60 * 60 * 24);
    return Math.max(1, Math.floor(diff) + 1);
  })();

  const INTENTIONS_TEMPETE = ["rupture","deuil","épuisement","trahison","perdu(e)","maladie","cherche qui je suis"];
  const INTENTIONS_LUMIERE = ["je vais bien","grandir","explorer","espace à moi","mieux me connaître","autre"];

  const SENS_LABELS = {
    intuitif:   { emoji: "🌿", label: "Intuitif·ve" },
    spirituel:  { emoji: "✦",  label: "Spirituel·le" },
    rationnel:  { emoji: "🧠", label: "Rationnel·le" },
    transition: { emoji: "🌊", label: "En transition" },
  };
  const sensInfo = SENS_LABELS[data.sensibilite] || SENS_LABELS.intuitif;

  return (
    <div style={{ padding: "0 1.5rem 6rem" }}>

      {/* ── Portrait ── */}
      <div style={{ textAlign: "center", padding: "2rem 0 1.5rem", animation: "fadeUp 0.7s ease forwards" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
          <CarteAme data={data} small />
        </div>
        <h2 style={{ fontFamily: T.serif, fontWeight: 300, fontSize: "1.8rem", color: T.orPale, marginBottom: "0.3rem" }}>
          {data.prenom}
        </h2>
        <p style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem", letterSpacing: "0.5em", textTransform: "uppercase", color: T.brume }}>
          {isRationnel ? "Profil" : `Chemin ${cdv}`} · {chemin.titre}
        </p>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "1.2rem" }}>
        {[
          { label: "Jours avec ALBA", val: nbJours, icon: "◌" },
          { label: "Sensibilité",     val: `${sensInfo.emoji} ${sensInfo.label}`, icon: "" },
          { label: "Tempêtes fermées",val: tempetes.length, icon: "⛈" },
          { label: "Traversées",      val: tempetes.filter(t => t.vue).length, icon: "✦" },
        ].map((item, i) => (
          <div key={i} style={{
            padding: "1rem", background: T.nuit2,
            border: `1px solid ${T.brume}18`, borderRadius: "6px",
            animation: `fadeUp 0.6s ease forwards ${i * 0.08}s`, opacity: 0,
          }}>
            <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.44rem", letterSpacing: "0.4em", textTransform: "uppercase", color: T.brume, marginBottom: "0.5rem" }}>
              {item.label}
            </div>
            <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "1.2rem", color: T.orPale }}>
              {item.val}
            </div>
          </div>
        ))}
      </div>

      {/* ── Bibliothèque des Sagesses ── */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{
          fontFamily: T.sans, fontWeight: 300, fontSize: "0.62rem",
          letterSpacing: "0.5em", textTransform: "uppercase",
          color: T.brume, marginBottom: "1rem",
        }}>Bibliothèque des Sagesses</div>
        <BibliothequeSagesses />
      </div>

      {/* ── Lettre mensuelle ── */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{
          fontFamily: T.sans, fontWeight: 300, fontSize: "0.62rem",
          letterSpacing: "0.5em", textTransform: "uppercase",
          color: T.brume, marginBottom: "1rem",
        }}>La lettre du mois</div>
        <div style={{fontFamily:"monospace",fontSize:"0.6rem",color:"#4A8A5A",marginBottom:"0.5rem",padding:"0 1rem"}}>debug: premium={String(isPremium)} key={authUserKey?.slice(0,8)}</div>
        <LettreMensuelle userKey={authUserKey} isPremium={isPremium} onShowPaywall={onShowPaywall} />
      </div>

      {/* ── Mot Secret ── généré par Claude API chaque lundi ── */}
      <MotSecret data={data} progressStats={progressStats} />

      {/* ── Éclats d'aube ── discret, poétique, pas un score ── */}
      {(() => {
        const eclats = calcEclats(progressStats);
        const cleIdx = progressStats ? (Array.isArray(progressStats.cleActive) ? 0 : (progressStats._cleActive || 0)) : 0;
        const prochainSeuil = SEUILS_PORTES[Math.min(cleIdx + 1, SEUILS_PORTES.length - 1)];
        const pct = prochainSeuil > 0 ? Math.min((eclats / prochainSeuil) * 100, 100) : 100;
        const phrase = eclats < 5
          ? "Le chemin commence."
          : eclats < 20
          ? "Quelque chose se met en mouvement."
          : eclats < 50
          ? "Le chemin continue."
          : "Tu avances.";
        return (
          <div style={{
            padding: "1.2rem 1.4rem", marginBottom: "0.8rem",
            background: `${T.or}06`,
            border: `1px solid ${T.or}18`,
            borderRadius: "6px",
            animation: "fadeUp 0.7s ease forwards 0.25s", opacity: 0,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.9rem" }}>
              <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.47rem", letterSpacing: "0.45em", textTransform: "uppercase", color: T.or }}>
                Éclats d'aube
              </div>
              <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.75rem", color: `${T.or}88` }}>
                ✦
              </div>
            </div>
            {/* Barre de progression — sans chiffre */}
            <div style={{ height: 2, background: `${T.brume}35`, borderRadius: 1, overflow: "hidden", marginBottom: "0.9rem" }}>
              <div style={{
                height: "100%",
                width: `${pct}%`,
                background: `linear-gradient(to right, ${T.brume}60, ${T.or})`,
                borderRadius: 1,
                transition: "width 1.2s ease",
              }}/>
            </div>
            <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.88rem", color: `${T.orPale}88` }}>
              {phrase}
            </div>
          </div>
        );
      })()}

      {/* ── Intention / Blessure ── */}
      <div style={{
        padding: "1.2rem 1.4rem", marginBottom: "0.8rem",
        background: `${blessure.couleur}08`,
        border: `1px solid ${blessure.couleur}25`,
        borderRadius: "6px",
        animation: "fadeUp 0.7s ease forwards 0.3s", opacity: 0,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
          <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.47rem", letterSpacing: "0.45em", textTransform: "uppercase", color: blessure.couleur }}>
            Ce que tu traverses
          </div>
          <button onClick={() => setEditIntention(true)} style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: T.sans, fontWeight: 300, fontSize: "0.47rem",
            letterSpacing: "0.3em", textTransform: "uppercase",
            color: T.brume,
          }}>Changer →</button>
        </div>
        <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "1rem", color: T.orPale }}>
          {data.intention}
        </div>
        {data.intentionSecondaire && (
          <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.9rem", color: T.or, marginTop: "0.3rem", opacity: 0.88 }}>
            et aussi · {data.intentionSecondaire}
          </div>
        )}
      </div>

      {/* ── Tempêtes archivées ── */}
      {tempetes.length > 0 && (
        <div style={{ marginBottom: "0.8rem", animation: "fadeUp 0.7s ease forwards 0.4s", opacity: 0 }}>
          <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.47rem", letterSpacing: "0.5em", textTransform: "uppercase", color: T.brume, marginBottom: "0.8rem", paddingTop: "0.4rem" }}>
            Boîte des Tempêtes
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {tempetes.map(t => (
              <div key={t.id} style={{
                padding: "0.9rem 1.1rem",
                background: t.vue ? `${T.or}06` : T.nuit2,
                border: `1px solid ${t.vue ? T.or + "25" : T.brume + "15"}`,
                borderRadius: "6px",
                display: "flex", gap: "0.8rem", alignItems: "flex-start",
              }}>
                <span style={{ marginTop: "0.2rem", fontSize: "0.8rem", opacity: 0.6 }}>{t.vue ? "✦" : "⛈"}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.9rem", color: t.vue ? `${T.or}cc` : `${T.aube}88`, lineHeight: 1.7 }}>
                    {t.texte}
                  </p>
                  <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.44rem", letterSpacing: "0.3em", color: T.brume, marginTop: "0.4rem" }}>
                    {new Date(t.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    {t.vue ? " · traversée" : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Essence du chemin ── */}
      {!isRationnel && (
        <div style={{
          padding: "1.3rem 1.5rem", marginBottom: "1rem",
          borderLeft: `2px solid ${T.or}44`,
          animation: "fadeUp 0.7s ease forwards 0.5s", opacity: 0,
        }}>
          <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.95rem", color: T.orPale, lineHeight: 1.9 }}>
            {chemin.essence}
          </p>
        </div>
      )}

      {/* ── Accès Souffle ── */}
      <div style={{ marginTop: "1.5rem", marginBottom: "0.5rem", animation: "fadeUp 0.7s ease forwards 0.6s", opacity: 0 }}>
        <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.47rem", letterSpacing: "0.5em", textTransform: "uppercase", color: T.brume, marginBottom: "0.8rem" }}>
          Prendre un moment
        </div>
        <SouffleInline />
      </div>

      {/* ── Déconnexion ── */}
      {onSignOut && (
        <div style={{ marginTop: "0.5rem", textAlign: "center" }}>
          <button onClick={onSignOut} style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: T.sans, fontWeight: 300, fontSize: "0.62rem",
            letterSpacing: "0.4em", textTransform: "uppercase",
            color: `${T.brume}33`,
          }}>Se déconnecter</button>
        </div>
      )}

      {/* ── Réinitialiser ── */}
      <div style={{ marginTop: "1rem", textAlign: "center" }}>
        {!resetConfirm ? (
          <button onClick={() => setResetConfirm(true)} style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: T.sans, fontWeight: 300, fontSize: "0.62rem",
            letterSpacing: "0.4em", textTransform: "uppercase",
            color: `${T.brume}44`,
          }}>Recommencer depuis le début</button>
        ) : (
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <button onClick={() => setResetConfirm(false)} style={{
              background: "none", border: `1px solid ${T.brume}22`,
              borderRadius: "20px", padding: "0.5rem 1rem",
              fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem",
              letterSpacing: "0.3em", color: T.brume, cursor: "pointer",
            }}>Annuler</button>
            <button onClick={() => {
              localStorage.clear();
              window.location.reload();
            }} style={{
              background: "none", border: `1px solid #A87B7B44`,
              borderRadius: "20px", padding: "0.5rem 1rem",
              fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem",
              letterSpacing: "0.3em", color: "#A87B7B", cursor: "pointer",
            }}>Oui, tout effacer</button>
          </div>
        )}
      </div>

      {/* ── Panneau changement d'intention ── */}
      {editIntention && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(10,8,6,0.92)",
          display: "flex", alignItems: "flex-end",
          animation: "fadeIn 0.3s ease",
        }} onClick={() => setEditIntention(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: "100%", maxWidth: 540, margin: "0 auto",
            background: `linear-gradient(170deg, #1A1714, #141210)`,
            borderTop: `1px solid ${T.brume}28`,
            borderRadius: "16px 16px 0 0",
            padding: "2rem 1.8rem 3rem",
            animation: "fadeUp 0.35s ease forwards",
          }}>
            <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem", letterSpacing: "0.5em", textTransform: "uppercase", color: T.brume, marginBottom: "1.2rem" }}>
              Qu'est-ce qui t'amène en ce moment ?
            </div>

            {/* Groupe tempête */}
            <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.44rem", letterSpacing: "0.4em", textTransform: "uppercase", color: T.brume, marginBottom: "0.6rem" }}>
              Je traverse quelque chose
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1rem" }}>
              {INTENTIONS_TEMPETE.map(intent => {
                const sel = data.intention === intent;
                return (
                  <button key={intent} onClick={() => {
                    const newIntention = sel ? "" : intent;
                    if (onUpdateData) onUpdateData({ ...data, intention: newIntention });
                  }} style={{
                    background: sel ? `${T.aurore}15` : "transparent",
                    border: `1px solid ${sel ? T.aurore + "55" : T.brume + "18"}`,
                    borderRadius: "6px", padding: "0.75rem 1rem",
                    fontFamily: T.serif, fontStyle: "italic", fontSize: "0.9rem",
                    color: sel ? T.orPale : `${T.aube}88`,
                    cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                  }}>{sel ? "✦ " : ""}{intent}</button>
                );
              })}
            </div>

            {/* Séparateur */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", margin: "0.5rem 0 1rem" }}>
              <div style={{ flex: 1, height: "1px", background: `${T.brume}22` }} />
              <span style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.7rem", color: T.brume }}>et / ou</span>
              <div style={{ flex: 1, height: "1px", background: `${T.brume}22` }} />
            </div>

            {/* Groupe soleil */}
            <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.44rem", letterSpacing: "0.4em", textTransform: "uppercase", color: T.brume, marginBottom: "0.6rem" }}>
              Je cherche un espace pour grandir
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {INTENTIONS_LUMIERE.map(intent => {
                const sel = data.intentionSecondaire === intent || (!data.intentionSecondaire && data.intention === intent);
                return (
                  <button key={intent} onClick={() => {
                    // Si pas de tempête sélectionnée, soleil va dans intention principale
                    if (!data.intention) {
                      if (onUpdateData) onUpdateData({ ...data, intention: sel ? "" : intent, intentionSecondaire: "" });
                    } else {
                      const newSec = sel ? "" : intent;
                      if (onUpdateData) onUpdateData({ ...data, intentionSecondaire: newSec });
                    }
                  }} style={{
                    background: sel ? `${T.or}12` : "transparent",
                    border: `1px solid ${sel ? T.or + "55" : T.brume + "18"}`,
                    borderRadius: "6px", padding: "0.75rem 1rem",
                    fontFamily: T.serif, fontStyle: "italic", fontSize: "0.9rem",
                    color: sel ? T.or : `${T.aube}88`,
                    cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                  }}>{sel ? "✦ " : ""}{intent}</button>
                );
              })}
            </div>

            <button onClick={() => setEditIntention(false)} style={{
              marginTop: "1.5rem", width: "100%", padding: "0.8rem",
              background: "transparent", border: `1px solid ${T.or}33`,
              borderRadius: "6px", fontFamily: T.sans, fontWeight: 300,
              fontSize: "0.5rem", letterSpacing: "0.4em", textTransform: "uppercase",
              color: T.or, cursor: "pointer",
            }}>Enregistrer</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── FIL DE VIE ───────────────────────────────────────────────────────────────
const FilDeVie = ({ data, db }) => {
  const [moments, setMoments] = useState([]);
  const [ajout, setAjout] = useState(false);
  const [texte, setTexte] = useState("");
  const [type, setType] = useState("insight");
  const [loaded, setLoaded] = useState(false);
  const [carteOuverte, setCarteOuverte] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const pressTimer = useRef(null);

  const TYPES = [
    { id: "insight",   label: "Prise de conscience", couleur: "#C8A96E", symbole: "/pictos/porte-06-devenir.svg" },
    { id: "emotion",   label: "Émotion traversée",   couleur: "#D4856A", symbole: "○" },
    { id: "victoire",  label: "Victoire intérieure",  couleur: "#7BA88A", symbole: "◇" },
    { id: "question",  label: "Question ouverte",     couleur: "#7B9EA8", symbole: "◎" },
    { id: "passage",   label: "Moment de passage",    couleur: "#A87BC8", symbole: "/pictos/porte-09-proteger.svg" },
  ];

  const typeInfo = (id) => TYPES.find(t => t.id === id) || TYPES[0];
  const formatDate = (iso) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  useEffect(() => {
    (async () => {
      try {
        const uk = localStorage.getItem("alba_user_key") || "local";
        const rows = await sb.list("alba_fil", { user_key: uk });
        if (rows && rows.length > 0) {
          setMoments(rows.map(r => ({ id: r.id, texte: r.texte, type: r.type, date: r.created_at })));
          setLoaded(true);
          return;
        }
      } catch {}
      try {
        const stored = localStorage.getItem("alba_fil");
        if (stored) setMoments(JSON.parse(stored));
      } catch {}
      setLoaded(true);
    })();
  }, []);

  const saveMoments = async (list) => {
    setMoments(list);
    try { localStorage.setItem("alba_fil", JSON.stringify(list)); } catch {}
  };

  const addMoment = async () => {
    if (!texte.trim()) return;
    const nouveau = { id: String(Date.now()), texte: texte.trim(), type, date: new Date().toISOString() };
    const newList = [nouveau, ...moments];
    saveMoments(newList);
    setTexte(""); setAjout(false);
    // Sauvegarder dans Supabase
    try {
      const uk = localStorage.getItem("alba_user_key") || "local";
      await sb.upsert("alba_fil", { id: nouveau.id, user_key: uk, texte: nouveau.texte, type: nouveau.type, created_at: nouveau.date });
    } catch {}
  };

  const startPress = (id) => {
    pressTimer.current = setTimeout(() => setDeletingId(id), 600);
  };
  const endPress = () => clearTimeout(pressTimer.current);

  const DEMO = [
    { id: -1, texte: "Quelque chose en moi commence à se poser. Je ne sais pas encore quoi.", type: "insight",  date: new Date(Date.now() - 14 * 86400000).toISOString() },
    { id: -2, texte: "J'ai pleuré pour la première fois depuis longtemps. Ça a fait du bien.",  type: "emotion",  date: new Date(Date.now() - 9  * 86400000).toISOString() },
    { id: -3, texte: "Est-ce que ma peur est vraiment la mienne, ou celle que j'ai héritée ?",  type: "question", date: new Date(Date.now() - 4  * 86400000).toISOString() },
  ];
  const affiche = moments.length > 0 ? moments : (loaded ? DEMO : []);

  const W = 320; const CARD_H = 110; const GAP = 30;
  const ENTRY_H = CARD_H + GAP;
  const n = affiche.length;
  const SVG_H = Math.max(500, n * ENTRY_H + 120);
  const cx = W / 2; const amplitude = 52;
  const nodeY = (i) => 80 + i * ENTRY_H + CARD_H / 2;
  const nodeX = (i) => cx + (i % 2 === 0 ? -amplitude : amplitude);

  const buildPath = () => {
    if (n === 0) return `M ${cx} 40 L ${cx} ${SVG_H - 40}`;
    let d = `M ${cx} 40`;
    for (let i = 0; i < n; i++) {
      const x = nodeX(i); const y = nodeY(i);
      const prevX = i === 0 ? cx : nodeX(i - 1);
      const prevY = i === 0 ? 40 : nodeY(i - 1);
      const cpX = (prevX + x) / 2;
      d += ` C ${cpX} ${prevY}, ${cpX} ${y}, ${x} ${y}`;
    }
    const lastX = nodeX(n - 1); const lastY = nodeY(n - 1);
    d += ` C ${(lastX + cx) / 2} ${lastY}, ${(lastX + cx) / 2} ${SVG_H - 40}, ${cx} ${SVG_H - 40}`;
    return d;
  };

  return (
    <div style={{ padding: "1.5rem 0 8rem", maxWidth: 520, margin: "0 auto", minHeight: "100vh" }}>

      {/* ── Carte ouverte en plein écran ── */}
      {carteOuverte && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(10,8,6,0.92)",
          display: "flex", alignItems: "flex-end",
          animation: "fadeIn 0.3s ease",
        }} onClick={() => setCarteOuverte(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: "100%", maxWidth: 540, margin: "0 auto",
            background: `linear-gradient(170deg, #1A1714, #141210)`,
            borderTop: `1px solid ${typeInfo(carteOuverte.type).couleur}44`,
            borderRadius: "16px 16px 0 0",
            padding: "2rem 1.8rem 4rem",
            animation: "fadeUp 0.35s ease forwards",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span style={{ fontSize: "0.9rem", color: typeInfo(carteOuverte.type).couleur }}>{typeInfo(carteOuverte.type).symbole}</span>
                <span style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.62rem", letterSpacing: "0.4em", textTransform: "uppercase", color: typeInfo(carteOuverte.type).couleur }}>
                  {typeInfo(carteOuverte.type).label}
                </span>
              </div>
              <span style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem", color: `${T.brume}BB` }}>
                {formatDate(carteOuverte.date)}
              </span>
            </div>
            <div style={{ width: 30, height: 1, background: `linear-gradient(to right, ${typeInfo(carteOuverte.type).couleur}66, transparent)`, marginBottom: "1.5rem" }} />
            <p style={{
              fontFamily: T.serif, fontStyle: "italic",
              fontSize: "clamp(1rem, 3vw, 1.15rem)",
              color: T.orPale, lineHeight: 2,
            }}>{carteOuverte.texte}</p>
            {carteOuverte.id > 0 && (
              <button onClick={() => {
                saveMoments(moments.filter(m => m.id !== carteOuverte.id));
                setCarteOuverte(null);
              }} style={{
                marginTop: "2rem", background: "none", border: "none",
                fontFamily: T.sans, fontWeight: 300, fontSize: "0.47rem",
                letterSpacing: "0.4em", textTransform: "uppercase",
                color: `${T.brume}44`, cursor: "pointer",
              }}>Retirer ce moment</button>
            )}
          </div>
        </div>
      )}

      {/* ── Suppression confirmée ── */}
      {deletingId && (
        <div style={{
          position: "fixed", bottom: "5rem", left: "50%", transform: "translateX(-50%)",
          zIndex: 100, background: T.nuit2,
          border: `1px solid ${T.brume}33`, borderRadius: "8px",
          padding: "0.8rem 1.2rem",
          display: "flex", gap: "1rem", alignItems: "center",
          animation: "fadeUp 0.3s ease forwards",
          boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        }}>
          <span style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.85rem", color: T.brume }}>Supprimer ce moment ?</span>
          <button onClick={() => { saveMoments(moments.filter(m => m.id !== deletingId)); setDeletingId(null); }} style={{
            background: "none", border: `1px solid #A87B7B44`, borderRadius: "4px",
            padding: "0.3rem 0.7rem", color: "#A87B7B", fontFamily: T.sans, fontWeight: 300,
            fontSize: "0.5rem", letterSpacing: "0.3em", cursor: "pointer",
          }}>Oui</button>
          <button onClick={() => setDeletingId(null)} style={{
            background: "none", border: "none", color: T.brume,
            fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem",
            letterSpacing: "0.3em", cursor: "pointer",
          }}>Non</button>
        </div>
      )}

      {/* ── En-tête ── */}
      <div style={{ textAlign: "center", marginBottom: "0.5rem", padding: "0 1.5rem" }}>
        <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.68rem", letterSpacing: "0.5em", textTransform: "uppercase", color: T.brume, marginBottom: "0.8rem" }}>
          Fil de Vie
        </div>
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "1rem", color: T.orPale, lineHeight: 1.8 }}>
          Les moments qui t'ont traversé.
        </p>
        {moments.length === 0 && loaded && (
          <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.82rem", color: T.brume, marginTop: "0.3rem" }}>
            ↓ Trois instants à titre d'exemple — les tiens commenceront ici.
          </p>
        )}
      </div>

      {/* ── Bouton Ajouter ── */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
        <button onClick={() => setAjout(!ajout)} style={{
          background: ajout ? `${T.or}18` : "transparent",
          border: `1px solid ${ajout ? T.or + "77" : T.brume + "33"}`,
          color: ajout ? T.or : T.brume,
          fontFamily: T.sans, fontWeight: 300, fontSize: "0.6rem",
          letterSpacing: "0.35em", textTransform: "uppercase",
          padding: "0.55rem 1.4rem", borderRadius: "2px", cursor: "pointer",
          transition: "all 0.25s",
        }}>{ajout ? "✕ Annuler" : "+ Ajouter un moment"}</button>
      </div>

      {/* ── Panneau d'ajout ── */}
      {ajout && (
        <div style={{
          margin: "0 1.5rem 2rem", background: T.nuit2,
          border: `1px solid ${T.or}33`, borderRadius: "6px",
          padding: "1.5rem", animation: "fadeUp 0.4s ease forwards",
        }}>
          <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.68rem", letterSpacing: "0.4em", textTransform: "uppercase", color: T.brume, marginBottom: "1rem" }}>
            Quel moment veux-tu garder ?
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.2rem" }}>
            {TYPES.map(t => (
              <button key={t.id} onClick={() => setType(t.id)} style={{
                background: type === t.id ? `${t.couleur}22` : "transparent",
                border: `1px solid ${type === t.id ? t.couleur + "88" : T.brume + "33"}`,
                color: type === t.id ? t.couleur : T.brume,
                fontFamily: T.sans, fontWeight: 300, fontSize: "0.58rem",
                letterSpacing: "0.15em", padding: "0.4rem 0.8rem",
                borderRadius: "2px", cursor: "pointer", transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: "0.4rem",
              }}>{t.symbole.endsWith?.(".svg") ? <img src={t.symbole} width={14} height={14} alt="" /> : <span>{t.symbole}</span>}{t.label}</button>
            ))}
          </div>
          <textarea value={texte} onChange={e => setTexte(e.target.value)}
            placeholder="Une phrase. Un fragment. Ce qui est vrai pour toi maintenant…"
            rows={3} style={{
              width: "100%", background: "transparent",
              border: "none", borderBottom: `1px solid ${T.or}44`,
              color: T.aube, fontFamily: T.serif, fontStyle: "italic",
              fontSize: "1rem", resize: "none", outline: "none",
              lineHeight: 1.7, padding: "0.5rem 0", boxSizing: "border-box",
            }}/>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
            <button onClick={addMoment} style={{
              background: texte.trim().length > 3 ? `${T.or}22` : "transparent",
              border: `1px solid ${texte.trim().length > 3 ? T.or + "77" : T.brume + "33"}`,
              color: texte.trim().length > 3 ? T.or : T.brume,
              fontFamily: T.sans, fontWeight: 300, fontSize: "0.6rem",
              letterSpacing: "0.3em", textTransform: "uppercase",
              padding: "0.55rem 1.4rem", borderRadius: "2px", cursor: "pointer",
              transition: "all 0.25s",
            }}>Garder ce moment</button>
          </div>
        </div>
      )}

      {/* ── Timeline SVG + cartes ── */}
      <div style={{ position: "relative", width: "100%", overflow: "hidden" }}>
        <svg viewBox={`0 0 ${W} ${SVG_H}`} width="100%" height={SVG_H}
          style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 0 }}
          preserveAspectRatio="xMidYMin meet">
          <defs>
            <linearGradient id="filGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={T.or} stopOpacity="0.15"/>
              <stop offset="30%"  stopColor={T.or} stopOpacity="0.6"/>
              <stop offset="70%"  stopColor={T.or} stopOpacity="0.6"/>
              <stop offset="100%" stopColor={T.or} stopOpacity="0.15"/>
            </linearGradient>
            <filter id="glowFil">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            {TYPES.map(t => (
              <radialGradient key={t.id} id={`glow_${t.id}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor={t.couleur} stopOpacity="0.35"/>
                <stop offset="100%" stopColor={t.couleur} stopOpacity="0"/>
              </radialGradient>
            ))}
          </defs>
          <path d={buildPath()} stroke="url(#filGradient)" strokeWidth="1.5" fill="none" filter="url(#glowFil)"/>
          <path d={buildPath()} stroke={T.or} strokeWidth="0.5" fill="none" opacity="0.4"/>
          {affiche.map((m, i) => {
            const x = nodeX(i); const y = nodeY(i); const ti = typeInfo(m.type);
            return (
              <g key={m.id}>
                <circle cx={x} cy={y} r={18} fill={`url(#glow_${m.type})`}/>
                <circle cx={x} cy={y} r={5}  fill={ti.couleur} opacity="0.9"/>
                <circle cx={x} cy={y} r={8}  fill="none" stroke={ti.couleur} strokeWidth="1" opacity="0.5"/>
              </g>
            );
          })}
        </svg>

        {/* ── Cartes ── */}
        <div style={{ position: "relative", zIndex: 1, height: SVG_H }}>
          {affiche.map((m, i) => {
            const ti = typeInfo(m.type);
            const side = i % 2 === 0 ? "left" : "right";
            const yPx = nodeY(i) - CARD_H / 2;
            const isDemo = m.id < 0;
            return (
              <div key={m.id} style={{
                position: "absolute", top: yPx,
                left: side === "left" ? "2%" : "auto",
                right: side === "right" ? "2%" : "auto",
                width: "43%",
                animation: `fadeUp 0.7s ease forwards ${i * 0.12}s`, opacity: 0,
              }}>
                <div style={{
                  position: "absolute", top: "50%",
                  [side === "left" ? "right" : "left"]: "-12%",
                  width: "12%", height: "1px",
                  background: `linear-gradient(${side === "left" ? "to right" : "to left"}, transparent, ${ti.couleur}66)`,
                }}/>
                <div
                  onClick={() => !isDemo && setCarteOuverte(m)}
                  onTouchStart={() => !isDemo && startPress(m.id)}
                  onTouchEnd={endPress}
                  onMouseDown={() => !isDemo && startPress(m.id)}
                  onMouseUp={endPress}
                  style={{
                    background: `linear-gradient(135deg, ${T.nuit2}ee 0%, ${T.nuit}cc 100%)`,
                    border: `1px solid ${ti.couleur}${isDemo ? "33" : "55"}`,
                    borderRadius: "6px", padding: "0.9rem 1rem",
                    backdropFilter: "blur(8px)",
                    boxShadow: `0 4px 24px ${ti.couleur}18, 0 1px 6px rgba(0,0,0,0.4)`,
                    opacity: isDemo ? 0.55 : 1,
                    cursor: isDemo ? "default" : "pointer",
                    transition: "transform 0.25s, box-shadow 0.25s",
                    userSelect: "none",
                  }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.62rem", letterSpacing: "0.3em", textTransform: "uppercase", color: T.brume }}>
                      {formatDate(m.date)}
                    </span>
                    {ti.symbole.endsWith?.(".svg") ? <img src={ti.symbole} width={14} height={14} alt="" style={{ opacity: 0.92 }} /> : <span style={{ fontSize: "0.65rem", color: ti.couleur, opacity: 0.92 }}>{ti.symbole}</span>}
                  </div>
                  <p style={{
                    fontFamily: T.serif, fontStyle: "italic",
                    fontSize: "0.82rem", color: T.orPale,
                    lineHeight: 1.65, margin: 0,
                    display: "-webkit-box", WebkitLineClamp: 4,
                    WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>{m.texte}</p>
                  <div style={{ marginTop: "0.6rem", fontFamily: T.sans, fontWeight: 300, fontSize: "0.46rem", letterSpacing: "0.25em", textTransform: "uppercase", color: ti.couleur, opacity: 0.7 }}>
                    {ti.label}
                  </div>
                  {!isDemo && (
                    <div style={{ marginTop: "0.3rem", fontFamily: T.sans, fontWeight: 300, fontSize: "0.4rem", letterSpacing: "0.2em", color: `${T.brume}44` }}>
                      Appui long pour suppr.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bas du fil ── */}
      {loaded && (
        <div style={{ textAlign: "center", marginTop: "2rem", paddingBottom: "2rem" }}>
          <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.85rem", color: T.brume, lineHeight: 1.8 }}>
            {moments.length === 0
              ? "Ton fil commence à la première phrase que tu gardes."
              : `${moments.length} moment${moments.length > 1 ? "s" : ""} gardé${moments.length > 1 ? "s" : ""}.`}
          </p>
        </div>
      )}
    </div>
  );
};


// ─── LE MIROIR ───────────────────────────────────────────────────────────────
// Pas un chat. Un reflet. L'utilisateur pose une phrase — ALBA renvoie une seule
// phrase. Un seul appel API. Pas de suite. Pas de conversation.
const Presence = ({ data, onStart, isPremium, onShowPaywall }) => {
  const [texte, setTexte]       = useState("");
  const [reflet, setReflet]     = useState(null);  // la phrase renvoyée
  const [loading, setLoading]   = useState(false);
  const [phase, setPhase]       = useState("idle"); // idle | writing | listening | revealed | silence
  const textareaRef             = useRef(null);

  // Premium gate — afficher paywall si non abonné et tentative d'utiliser le Miroir
  const handleEcouterGated = () => {
    if (!isPremium) { if (onShowPaywall) onShowPaywall(); return; }
    ecouter();
  };

  const cdv     = cheminDeVie(data.naissance);
  const chemin  = CHEMINS[cdv] || CHEMINS[9];
  const { blessure, hasDual, hasTempete, hasCroissance, texteContexte } = getContextProfil(data);
  const sens      = data.sensibilite || "intuitif";

  // Quelques mots d'attente — variés, jamais les mêmes
  const ATTENTES = [
    "Je garde tes mots.",
    "Je t'écoute.",
    "Je réfléchis à ce que tu viens de dire…",
    "Un instant.",
    "…",
  ];

  const SYSTEM_MIROIR = `Tu es ALBA. Tu es un miroir intérieur — pas un coach, pas un assistant, pas un thérapeute.
Tu lis ce que ${data.prenom} vient de poser.
Profil : ${chemin.titre}. Contexte : ${texteContexte}
${hasDual ? `Note importante : ${data.prenom} traverse quelque chose de difficile ET cherche à grandir en même temps. Ce n'est pas une contradiction — c'est une complexité humaine. Ton reflet peut tenir les deux.` : hasCroissance ? "Elle cherche à grandir, à se construire." : `Blessure traversée : ${blessure.nom}.`}
Sensibilité : ${sens}.
${sens === "spirituel" ? "Tu peux utiliser un langage symbolique, archétypal, mais sobrement." : ""}
${sens === "rationnel" ? "Zéro ésotérisme. Ancré, sobre, psychologique." : ""}

Ta fonction : refléter. Pas expliquer. Pas conseiller. Pas questionner.

Comment réfléchir :
- Tu nommes ce que la personne a dit, avec un léger décalage qui permet de voir plus clair.
- Tu utilises ses propres mots, pas les tiens.
- Tu peux dire "le mot qui revient", "tu dis que", "il apparaît", "quelque chose en toi nomme…"
- Tu ne dis JAMAIS "je pense que", "tu devrais", "peut-être que tu devrais".
- Tu n'expliques pas. Tu révèles doucement.

Exemples du ton juste :
- "Tu dis que tu te sens perdu. Le mot perdu mérite d'être regardé."
- "Aujourd'hui le mot qui revient : fatigue."
- "Quelque chose en toi nomme ça : solitude."
- "Tu parles de force. Et peut-être que la force, parfois, fatigue."
- "Rien ne presse."
- "Ce que tu ressens mérite d'exister."

Ta réponse : UNE à DEUX phrases maximum. Courtes. Justes. Mémorables.
Tu n'es pas Claude. Tu es ALBA.`;

  const ecouter = async () => {
    if (!texte.trim() || loading) return;
    setLoading(true);
    setPhase("listening");
    if (onStart) onStart();

    // Pause — ALBA semble lire
    await new Promise(r => setTimeout(r, 1800 + Math.random() * 1200));

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 120,
          system: SYSTEM_MIROIR,
          messages: [{ role: "user", content: texte.trim() }],
        }),
      });
      const d = await res.json();
      const phrase = d.content?.[0]?.text?.trim() || "Je garde tes mots.";
      setReflet(phrase);
      setPhase("revealed");
    } catch {
      setReflet("Je suis là, même dans le silence.");
      setPhase("revealed");
    }
    setLoading(false);
  };

  const recommencer = () => {
    setTexte("");
    setReflet(null);
    setPhase("idle");
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const motAttente = ATTENTES[Math.floor(Math.random() * ATTENTES.length)];

  // ── Mode Silence (bouton "être là") ──────────────────────────────────────
  if (phase === "silence") return (
    <div style={{
      position: "fixed", inset: 0, background: T.nuit, zIndex: 50,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      <video autoPlay loop muted playsInline style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        objectFit: "cover", opacity: 0.2, pointerEvents: "none",
      }}>
        <source src={HEURE < 6 ? "/videos/etoiles.mp4" : "/videos/nuages.mp4"} type="video/mp4" />
      </video>
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "2rem" }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          border: `1px solid ${T.or}25`,
          background: `radial-gradient(circle, ${T.or}08, transparent 70%)`,
          margin: "0 auto 2.5rem",
          animation: "pulse 6s ease-in-out infinite",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ color: T.or, opacity: 0.4, fontSize: "1.1rem" }}>✦</span>
        </div>
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "1.1rem", color: `${T.brume}cc`, lineHeight: 2 }}>
          Tu es ici.
        </p>
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.9rem", color: T.brume, marginTop: "0.3rem" }}>
          Reste aussi longtemps que tu veux.
        </p>
        <button onClick={() => setPhase("idle")} style={{
          marginTop: "3rem", background: "none", border: `1px solid ${T.brume}25`,
          borderRadius: "20px", padding: "0.5rem 1.4rem",
          fontFamily: T.sans, fontWeight: 300, fontSize: "0.65rem",
          letterSpacing: "0.4em", textTransform: "uppercase",
          color: T.brume, cursor: "pointer",
        }}>Revenir</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "calc(100vh - 120px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 1.5rem 6rem", maxWidth: 520, margin: "0 auto" }}>

      {/* Vidéo fond très discrète */}
      <video autoPlay loop muted playsInline style={{
        position: "fixed", inset: 0, width: "100%", height: "100%",
        objectFit: "cover", zIndex: 0, opacity: 0.18, pointerEvents: "none",
      }}>
        <source src={HEURE < 6 || HEURE >= 21 ? "/videos/etoiles.mp4" : "/videos/nuages.mp4"} type="video/mp4" />
      </video>

      <div style={{ position: "relative", zIndex: 1, width: "100%", textAlign: "center" }}>

        {/* ── En-tête ── */}
        <div style={{ marginBottom: "3rem", animation: "fadeUp 0.7s ease forwards" }}>
          <div style={{
            fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem",
            letterSpacing: "0.55em", textTransform: "uppercase",
            color: T.brume, marginBottom: "1.2rem",
          }}>Le Miroir</div>

          {/* Pattern nerveux si disponible */}
          {(() => {
            const pattern = analysePatternNerveux();
            if (!pattern) return null;
            const couleurPattern = pattern.type === "stable" ? "#7BA88A" : pattern.type === "alerte" ? "#A87878" : pattern.type === "cycle" ? "#C8A040" : "#8888AA";
            return (
              <div style={{ margin: "0 0 2rem", padding: "0.9rem 1rem", background: `${couleurPattern}0C`, border: `1px solid ${couleurPattern}33`, borderRadius: "6px", textAlign: "left", animation: "fadeUp 0.7s ease forwards 0.2s", opacity: 0 }}>
                <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.55rem", letterSpacing: "0.4em", textTransform: "uppercase", color: couleurPattern, marginBottom: "0.4rem" }}>Pattern nerveux · 14 jours</div>
                <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.88rem", color: T.brume, lineHeight: 1.7, margin: 0 }}>{pattern.message}</p>
              </div>
            );
          })()}

          {/* Cercle pulsant */}
          <div style={{
            width: 60, height: 60, borderRadius: "50%",
            border: `1px solid ${T.or}${phase === "listening" ? "66" : "30"}`,
            background: `radial-gradient(circle, ${T.or}${phase === "listening" ? "18" : "08"}, transparent 70%)`,
            margin: "0 auto",
            animation: phase === "listening" ? "pulse 2s ease-in-out infinite" : "pulse 6s ease-in-out infinite",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.8s ease",
          }}>
            <span style={{ color: T.or, opacity: phase === "listening" ? 0.9 : 0.35, fontSize: "1rem", transition: "opacity 0.8s" }}>✦</span>
          </div>
        </div>

        {/* ── Phase : écriture ── */}
        {phase !== "revealed" && (
          <div style={{ animation: "fadeUp 0.8s ease forwards 0.1s", opacity: 0 }}>
            {/* Invitation */}
            <p style={{
              fontFamily: T.serif, fontStyle: "italic",
              fontSize: "clamp(1rem, 3vw, 1.15rem)",
              color: `${T.brume}cc`, lineHeight: 1.9, marginBottom: "2rem",
            }}>
              {phase === "listening"
                ? motAttente
                : "Pose ici ce qui est là.\nUne phrase, un mot, ce que tu portes."}
            </p>

            {phase !== "listening" && (
              <>
                <textarea
                  ref={textareaRef}
                  value={texte}
                  onChange={e => { setTexte(e.target.value); setPhase(e.target.value.length > 0 ? "writing" : "idle"); }}
                  placeholder="…"
                  rows={3}
                  style={{
                    width: "100%", background: "transparent",
                    border: "none", borderBottom: `1px solid ${texte ? T.or + "44" : T.brume + "22"}`,
                    color: T.aube, fontFamily: T.serif, fontStyle: "italic",
                    fontSize: "clamp(1.05rem, 3vw, 1.2rem)",
                    padding: "0.5rem 0", resize: "none", lineHeight: 1.8,
                    textAlign: "center", outline: "none",
                    transition: "border-color 0.4s",
                  }}
                  onFocus={e => e.target.style.borderColor = `${T.or}55`}
                  onBlur={e => e.target.style.borderColor = texte ? `${T.or}44` : `${T.brume}22`}
                  autoFocus
                />

                {/* Bouton Écouter — premium */}
                {texte.trim().length > 0 && (
                  <div style={{ marginTop: "2rem", animation: "fadeUp 0.5s ease forwards" }}>
                    <button onClick={isPremium ? ecouter : onShowPaywall} style={{
                      background: "transparent",
                      border: `1px solid ${T.or}55`,
                      borderRadius: "24px",
                      padding: "0.7rem 2.2rem",
                      fontFamily: T.serif, fontStyle: "italic",
                      fontSize: "1rem", color: T.or,
                      cursor: "pointer", letterSpacing: "0.04em",
                      transition: "all 0.3s",
                    }}
                      onMouseEnter={e => { e.target.style.background = `${T.or}12`; e.target.style.borderColor = T.or; }}
                      onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.borderColor = `${T.or}55`; }}
                    >
                      {isPremium ? "Laisser venir" : "✦ Débloquer le Miroir"}
                    </button>
                    {!isPremium && (
                      <div style={{ marginTop: "0.8rem", fontFamily: T.serif, fontStyle: "italic", fontSize: "0.78rem", color: T.brume, textAlign: "center" }}>
                        Accès complet — 9€ / mois
                      </div>
                    )}
                  </div>
                )}

                {/* Bouton silence */}
                <div style={{ marginTop: texte ? "1.2rem" : "2.5rem" }}>
                  <button onClick={() => setPhase("silence")} style={{
                    background: "none", border: "none",
                    fontFamily: T.serif, fontStyle: "italic",
                    fontSize: "0.85rem", color: T.brume,
                    cursor: "pointer", letterSpacing: "0.02em",
                  }}>
                    Je veux juste être là
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Phase : reflet révélé ── */}
        {phase === "revealed" && reflet && (
          <div style={{ animation: "fadeUp 1.2s ease forwards" }}>
            {/* Ce que l'utilisateur avait écrit — petit, discret */}
            <p style={{
              fontFamily: T.serif, fontStyle: "italic",
              fontSize: "0.85rem", color: T.brume,
              lineHeight: 1.7, marginBottom: "2.5rem",
              maxWidth: 360, margin: "0 auto 2.5rem",
            }}>
              « {texte.trim()} »
            </p>

            {/* Ligne séparatrice */}
            <div style={{ width: 40, height: 1, background: `linear-gradient(to right, transparent, ${T.or}55, transparent)`, margin: "0 auto 2.5rem" }} />

            {/* Le reflet ALBA — grand, lumineux — apparition lettre par lettre */}
            <TypedPhrase
              text={reflet}
              style={{
                fontFamily: T.serif, fontStyle: "italic",
                fontSize: "clamp(1.2rem, 4vw, 1.5rem)",
                color: T.orPale, lineHeight: 1.9,
                maxWidth: 380, margin: "0 auto",
                letterSpacing: "0.01em", display: "block",
              }}
              speed={28}
            />

            {/* Signature */}
            <p style={{
              marginTop: "1.2rem",
              fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem",
              letterSpacing: "0.5em", textTransform: "uppercase",
              color: T.brume,
            }}>ALBA</p>

            {/* Actions */}
            <div style={{ marginTop: "3rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.9rem" }}>
              <button onClick={recommencer} style={{
                background: "transparent", border: `1px solid ${T.brume}28`,
                borderRadius: "20px", padding: "0.55rem 1.6rem",
                fontFamily: T.serif, fontStyle: "italic",
                fontSize: "0.9rem", color: T.brume,
                cursor: "pointer", transition: "all 0.25s",
              }}
                onMouseEnter={e => { e.target.style.borderColor = `${T.or}44`; e.target.style.color = T.or; }}
                onMouseLeave={e => { e.target.style.borderColor = `${T.brume}28`; e.target.style.color = `${T.brume}CC`; }}
              >
                Poser autre chose
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── ERROR BOUNDARY ───────────────────────────────────────────────────────────
class AlbaErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null, stack: "" }; }
  static getDerivedStateFromError(err) { return { error: err }; }
  componentDidCatch(err, info) {
    let profile = "";
    try { profile = localStorage.getItem("alba_profile") || "null"; } catch {}
    this.setState({ stack: info?.componentStack || "", profile });
    console.error("ALBA crash:", err.message, info?.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ background:"#1A1714", minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2rem", fontFamily:"serif", color:"#C8A96E", textAlign:"center" }}>
          <div style={{ fontSize:"2rem", marginBottom:"1rem" }}>✦</div>
          <div style={{ fontSize:"1.1rem", fontStyle:"italic", marginBottom:"0.5rem" }}>Alba a rencontré un problème.</div>
          <div style={{ fontSize:"0.75rem", color:"#7A7060", marginBottom:"1rem", maxWidth:300, lineHeight:1.6 }}>
            {this.state.error.message}
          </div>
          <div style={{ fontSize:"0.68rem", color:"#5A5040", marginBottom:"2rem", maxWidth:340, lineHeight:1.5, fontFamily:"monospace", textAlign:"left", whiteSpace:"pre-wrap", wordBreak:"break-all" }}>
            {this.state.stack?.split("\n").slice(0,6).join("\n")}
          </div>
          <div style={{ fontSize:"0.68rem", color:"#4A8A5A", marginBottom:"2rem", maxWidth:340, lineHeight:1.5, fontFamily:"monospace", textAlign:"left", whiteSpace:"pre-wrap", wordBreak:"break-all" }}>
            PROFILE: {this.state.profile}
          </div>
          <button onClick={() => {
            try { localStorage.removeItem("alba_profile"); } catch {}
            window.location.reload();
          }} style={{ background:"transparent", border:"1px solid #C8A96E55", borderRadius:"6px", padding:"0.7rem 1.5rem", color:"#C8A96E", cursor:"pointer", fontFamily:"serif", fontStyle:"italic" }}>
            Réinitialiser et relancer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── WELCOME SILENCIEUX ───────────────────────────────────────────────────────
const WelcomeSilencieux = ({ onCommencer, onConnexion }) => {
  const [phase, setPhase] = useState(0);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    const delays = [2200, 2400, 2000, 2600];
    let timers = [];
    delays.forEach((d, i) => {
      const total = delays.slice(0, i + 1).reduce((a, b) => a + b, 0);
      timers.push(setTimeout(() => setPhase(i + 1), total));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  const skip = () => {
    if (skipped) return;
    setSkipped(true);
    setPhase(4);
  };

  const fade = (visible, delay = 0) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(14px)",
    transition: `opacity 1.6s ease ${delay}s, transform 1.6s ease ${delay}s`,
    pointerEvents: "none",
  });

  return (
    <div
      onClick={phase < 4 ? skip : undefined}
      style={{
        position: "fixed", inset: 0,
        background: T.nuit,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        zIndex: 100, userSelect: "none", cursor: phase < 4 ? "pointer" : "default",
      }}
    >
      <style>{`
        @keyframes albaHaloPulse { 0%,100%{opacity:.35;transform:scale(1)} 50%{opacity:.55;transform:scale(1.08)} }
        @keyframes albaStarFloat { 0%,100%{transform:rotate(0deg) scale(1)} 50%{transform:rotate(180deg) scale(1.12)} }
        @keyframes albaLineGrow { from{transform:scaleX(0)} to{transform:scaleX(1)} }
        @keyframes albaBtnAppear { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Halo doré central — très subtil */}
      <div style={{
        position: "absolute", width: 440, height: 440, borderRadius: "50%",
        background: `radial-gradient(circle, ${T.or}0D 0%, transparent 68%)`,
        animation: "albaHaloPulse 5s ease-in-out infinite",
        pointerEvents: "none",
      }} />

      {/* Contenu centré */}
      <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "2rem", maxWidth: 340 }}>

        {/* Phase 0 — Phrase d'ouverture */}
        <div style={fade(phase >= 0)}>
          <p style={{
            fontFamily: T.serif, fontStyle: "italic",
            fontSize: "clamp(1.25rem, 5vw, 1.65rem)",
            color: T.brume, letterSpacing: "0.02em", lineHeight: 1.7,
            margin: 0,
          }}>
            Il n'y a rien à réparer.
          </p>
        </div>

        {/* Phase 1 */}
        <div style={{ marginTop: "1.6rem", ...fade(phase >= 1) }}>
          <p style={{
            fontFamily: T.serif, fontStyle: "italic",
            fontSize: "clamp(1.05rem, 4vw, 1.35rem)",
            color: `${T.brume}CC`, letterSpacing: "0.02em", lineHeight: 1.8,
            margin: 0,
          }}>
            Seulement quelque chose à entendre.
          </p>
        </div>

        {/* Phase 2 — "En toi." isolé */}
        <div style={{ marginTop: "0.8rem", ...fade(phase >= 2) }}>
          <p style={{
            fontFamily: T.serif, fontStyle: "italic",
            fontSize: "clamp(1.05rem, 4vw, 1.35rem)",
            color: `${T.or}CC`, letterSpacing: "0.06em", lineHeight: 1.8,
            margin: 0,
          }}>
            En toi.
          </p>
        </div>

        {/* Phase 3 — Logo ALBA */}
        <div style={{ marginTop: "3.2rem", ...fade(phase >= 3) }}>
          {/* Séparateur doré */}
          <div style={{
            width: 28, height: 1,
            background: `linear-gradient(90deg, transparent, ${T.or}, transparent)`,
            margin: "0 auto 2rem",
            animation: phase >= 3 ? "albaLineGrow 1.2s ease 0.3s both" : "none",
            transformOrigin: "center",
          }} />
          {/* Étoile */}
          <div style={{
            fontSize: "0.85rem", color: T.or,
            animation: "albaStarFloat 10s linear infinite",
            display: "inline-block", marginBottom: "1.2rem",
          }}>✦</div>
          {/* Titre */}
          <div style={{
            fontFamily: T.serif, fontWeight: 300,
            fontSize: "clamp(2.4rem, 10vw, 3.8rem)",
            color: T.orPale, letterSpacing: "0.22em",
            lineHeight: 1, marginBottom: "0.6rem",
          }}>
            ALBA
          </div>
          <div style={{
            fontFamily: T.sans, fontWeight: 300,
            fontSize: "0.62rem", letterSpacing: "0.55em",
            textTransform: "uppercase", color: `${T.brume}99`,
            ...fade(phase >= 3, 0.5),
          }}>
            l'aube en toi
          </div>
        </div>

        {/* Phase 4 — CTA */}
        {phase >= 4 && (
          <div style={{ marginTop: "3.5rem", animation: "albaBtnAppear 0.9s ease both" }}>
            <button
              onClick={onCommencer}
              style={{
                display: "block", width: "100%",
                padding: "0.95rem 2rem",
                background: "transparent",
                border: `1px solid ${T.or}88`,
                borderRadius: "4px",
                color: T.orPale,
                fontFamily: T.serif, fontStyle: "italic",
                fontSize: "1.05rem", letterSpacing: "0.04em",
                cursor: "pointer",
                transition: "border-color 0.3s, color 0.3s",
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = T.or; e.currentTarget.style.color = T.or; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = `${T.or}88`; e.currentTarget.style.color = T.orPale; }}
            >
              Commencer
            </button>
            <button
              onClick={onConnexion}
              style={{
                display: "block", width: "100%",
                marginTop: "1rem",
                padding: "0.6rem",
                background: "transparent", border: "none",
                color: `${T.brume}77`,
                fontFamily: T.sans, fontSize: "0.72rem",
                letterSpacing: "0.12em", textTransform: "uppercase",
                cursor: "pointer",
                transition: "color 0.3s",
              }}
              onMouseOver={e => e.currentTarget.style.color = T.brume}
              onMouseOut={e => e.currentTarget.style.color = `${T.brume}77`}
            >
              J'ai déjà un compte
            </button>
          </div>
        )}
      </div>

      {/* Hint tap discret */}
      {phase < 4 && (
        <div style={{
          position: "absolute", bottom: "2.5rem",
          fontFamily: T.sans, fontSize: "0.6rem",
          letterSpacing: "0.18em", textTransform: "uppercase",
          color: `${T.brume}44`,
          ...fade(phase >= 1, 1),
          pointerEvents: "none",
        }}>
          toucher pour continuer
        </div>
      )}
    </div>
  );
};

// ─── APP ──────────────────────────────────────────────────────────────────────
function AlbaInner() {
  const [view, setView] = useState("splash");
  const [authUser, setAuthUser] = useState(null);
  const [isPremium, setIsPremium] = useState(true); // BETA: premium activé pour tous
  const [showPaywall, setShowPaywall] = useState(false);
  const [userData, setUserData] = useState(null);
  const [tab, setTab] = useState("compagnon");
  const [tabHistory, setTabHistory] = useState([]);
  const [navContext, setNavContext] = useState(null);
  const [cleActive, setCleActive] = useState(0);
  const [porteOuverte, setPorteOuverte] = useState(null); // index 0-5 ou null
  const [lettrePortePendante, setLettrePortePendante] = useState(null); // lettre à livrer dans X heures
  const [allPostitsApp, setAllPostitsApp] = useState({}); // partagé Ardoise → Accueil
  const [progressStats, setProgressStats] = useState({
    joursActifs: 1, postitsTotal: 0,
    conversationsTotal: 0, bilansTotal: 0, souffleTotal: 0,
    tempetesNommees: 0, tempetesTraversees: 0,
  });
  const [dbReady, setDbReady] = useState(false);
  const db = useAlbaDB();

  // ── Son ambiant ──
  const [sonActif, setSonActif] = useState(false);
  const [sonChoix, setSonChoix] = useState(null); // null = pas encore demandé
  const [sonIndex, setSonIndex] = useState(0);
  const [sonVisible, setSonVisible] = useState(false); // mini player visible
  const audioRef = useRef(null);

  const AMBIANCES = [
    { id: "aube",      label: "L'Aube intérieure",  fichier: "aube.mp3" },
    { id: "traversee", label: "La Traversée",        fichier: "traversee.mp3" },
    { id: "souffle",   label: "Le Souffle sacré",    fichier: "souffle.mp3" },
    { id: "nuit",      label: "La Nuit des étoiles", fichier: "nuit.mp3" },
    { id: "passage",   label: "Le Passage",           fichier: "passage.mp3" },
    { id: "silence",   label: "Le Silence habité",   fichier: "silence.mp3" },
  ];

  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      const pref = localStorage.getItem("alba_son_preference");
      if (pref === "oui") { setSonChoix("oui"); setSonActif(true); }
      else if (pref === "non") setSonChoix("non");
      // null = pas encore demandé
    }
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    if (sonActif && sonChoix === "oui") {
      audioRef.current.src = "/sons/" + AMBIANCES[sonIndex].fichier;
      audioRef.current.volume = 0.18;
      audioRef.current.loop = true;
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [sonActif, sonIndex, sonChoix]);

  const activerSon = () => {
    localStorage.setItem("alba_son_preference", "oui");
    setSonChoix("oui");
    setSonActif(true);
  };
  const refuserSon = () => {
    localStorage.setItem("alba_son_preference", "non");
    setSonChoix("non");
  };
  const toggleSon = () => setSonActif(v => !v);
  const nextAmbiance = () => setSonIndex(i => (i + 1) % AMBIANCES.length);

  // ── Chargement initial ──
  useEffect(() => {
    (async () => {
      // Capturer le Magic Link depuis l'URL (#access_token=...)
      const hash = window.location.hash;
      if (hash && hash.includes("access_token")) {
        const params = new URLSearchParams(hash.replace("#", ""));
        const access_token = params.get("access_token");
        const type = params.get("type");
        // Lien de réinitialisation mot de passe → rediriger vers /reset-password
        if (type === "recovery" && access_token) {
          window.location.href = "/reset-password" + hash;
          return;
        }
        const refresh_token = params.get("refresh_token");
        if (access_token) {
          try {
            // Récupérer l'utilisateur avec ce token
            const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
              headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${access_token}` }
            });
            if (r.ok) {
              const user = await r.json();
              _authToken = access_token;
              _authUser = user;
              try {
                localStorage.setItem("alba_auth_token", access_token);
                localStorage.setItem("alba_auth_user", JSON.stringify(user));
              } catch {}
              // Nettoyer l'URL
              window.history.replaceState(null, "", window.location.pathname);
            }
          } catch {}
        }
      }
      // Vérifier session auth
      const existingUser = sbAuth.loadSession();
      if (existingUser) {
        setAuthUser(existingUser);
        // Vérifier statut premium directement via Supabase (client-side)
        try {
          const _sbUrl = "https://yuwqokjkpooozgtsvfkc.supabase.co";
          const _sbKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1d3Fva2prcG9vb3pndHN2ZmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5Njk4MjIsImV4cCI6MjA4ODU0NTgyMn0.5IHYvE6lnwl-PTAhcpT9c2lkhlxSu6w9rGksfCEfCPc";
          const _uk = existingUser.id || localStorage.getItem("alba_user_key") || "local";
          const _pr = await fetch(`${_sbUrl}/rest/v1/alba_profiles?user_key=eq.${encodeURIComponent(_uk)}&select=is_premium&limit=1`, {
            headers: { apikey: _sbKey, Authorization: `Bearer ${_sbKey}` }
          });
          const _rows = await _pr.json();
          if (_rows?.[0]?.is_premium === true) setIsPremium(true);
        } catch {}
      }
      // Profil
      const rawProfile = await db.loadProfile();
      const profile = rawProfile ? {
        prenom: "", naissance: "01/01/1990", sensibilite: "intuitif",
        intention: "", intentionSecondaire: "", cleActive: 0,
        ...rawProfile,
        intention: rawProfile.intention || "",
        intentionSecondaire: rawProfile.intentionSecondaire || "",
        prenom: rawProfile.prenom || "",
        naissance: rawProfile.naissance || "01/01/1990",
        sensibilite: rawProfile.sensibilite || "intuitif",
      } : null;
      if (profile) {
        setUserData(profile);
        if (existingUser) {
          setView("app");
        } else {
          setView("auth");
        }
      } else if (existingUser) {
        // Auth mais pas encore de profil → onboarding
        setView("onboarding");
      }
      // Progression
      const prog = await db.loadProgress();
      if (prog) {
        setProgressStats(prog.stats);
        setCleActive(prog.cleActive);
      }
      setDbReady(true);
      // Vérifier retour Stripe
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("subscribed") === "1") {
          setIsPremium(true);
          window.history.replaceState({}, "", "/");
        }
      }
    })();
  }, []);

  // ── Sauvegarde progression à chaque changement ──
  const saveTimeout = useRef(null);
  useEffect(() => {
    if (!dbReady) return;
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      db.saveProgress(progressStats, cleActive);
    }, 800);
  }, [progressStats, cleActive, dbReady]);

  // Vérifier si une lettre de Porte est en attente de livraison
  useEffect(() => {
    try {
      const pending = localStorage.getItem("alba_lettre_porte_pending");
      if (pending) {
        const { cleIdx, deliverAt } = JSON.parse(pending);
        if (Date.now() >= deliverAt) {
          // Livrer la lettre dans l'Ardoise
          const lettre = LETTRES_PORTES[cleIdx];
          if (lettre) {
            const lettreEntry = {
              id: `porte_${cleIdx}_${Date.now()}`,
              date: new Date().toISOString(),
              titre: `✦ ${lettre.cle} — ${lettre.titre}`,
              texte: lettre.corps,
              type: "porte",
            };
            const existing = JSON.parse(localStorage.getItem("alba_lettres") || "[]");
            // Ne livrer qu'une seule fois par Clé
            const alreadyDelivered = existing.some(l => l.id && l.id.startsWith(`porte_${cleIdx}`));
            if (!alreadyDelivered) {
              localStorage.setItem("alba_lettres", JSON.stringify([lettreEntry, ...existing]));
            }
          }
          localStorage.removeItem("alba_lettre_porte_pending");
        }
      }
    } catch(e) {}
  }, [dbReady]);

  const incrementStat = (key, n = 1) => {
    setProgressStats(s => {
      const updated = { ...s, [key]: (s[key] || 0) + n };
      const nouvelle = calcProgressionCle(updated);
      if (nouvelle > cleActive) {
        setCleActive(nouvelle);
        // Confetti dorés — moment symbolique de franchissement
        setTimeout(() => {
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#C8A96E", "#F0E2BC", "#D4B896", "#E8D4A8", "#FAF6F0"],
            scalar: 0.9,
            gravity: 0.8,
            drift: 0.2,
            ticks: 180,
          });
        }, 400);
        // Déclencher l'animation de la Porte
        setPorteOuverte(nouvelle);
        // Programmer la lettre pour dans 3-8h (aléatoire, mystérieux)
        const delai = (3 + Math.random() * 5) * 60 * 60 * 1000;
        try {
          localStorage.setItem("alba_lettre_porte_pending", JSON.stringify({
            cleIdx: nouvelle,
            deliverAt: Date.now() + delai,
          }));
        } catch(e) {}
      }
      return updated;
    });
  };

  const handleAuth = async (user) => {
    setAuthUser(user);
    // Mettre à jour le userKey dans localStorage avec l'auth ID
    if (user.id) {
      try { localStorage.setItem("alba_user_key", user.id); } catch {}
    }
    // Charger profil + premium directement depuis Supabase
    try {
      localStorage.removeItem("alba_profile");
      const SUPABASE_URL = "https://yuwqokjkpooozgtsvfkc.supabase.co";
      const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1d3Fva2prcG9vb3pndHN2ZmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5Njk4MjIsImV4cCI6MjA4ODU0NTgyMn0.5IHYvE6lnwl-PTAhcpT9c2lkhlxSu6w9rGksfCEfCPc";
      const r = await fetch(`${SUPABASE_URL}/rest/v1/alba_profiles?user_key=eq.${encodeURIComponent(user.id)}&limit=1`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
      });
      const rows = await r.json();
      const row = rows?.[0];
      if (row) {
        // Premium depuis le profil
        if (row.is_premium === true) setIsPremium(true);
        const profile = {
          prenom: row.prenom || "",
          naissance: row.naissance || "01/01/1990",
          sensibilite: row.sensibilite || "intuitif",
          intention: row.intention || "",
          intentionSecondaire: row.intention_secondaire || "",
        };
        try { localStorage.setItem("alba_profile", JSON.stringify(profile)); } catch {}
        setUserData(profile);
        setView("app");
        return;
      }
    } catch {}
    // Pas de profil → onboarding
    if (userData) {
      setView("app");
    } else {
      setView("onboarding");
    }
  };

  const handleSignOut = () => {
    sbAuth.signOut();
    setAuthUser(null);
    setUserData(null);
    setView("auth");
  };

  const handleComplete = (data) => {
    setUserData(data);
    db.saveProfile(data); // Sauvegarde immédiate
    setView("portrait");
  };

  const goTab = (id, context = null) => {
    setTabHistory(h => [...h, tab]);
    setTab(id);
    setNavContext(context);
  };

  const goBack = () => {
    if (tabHistory.length > 0) {
      const prev = tabHistory[tabHistory.length - 1];
      setTabHistory(h => h.slice(0, -1));
      setTab(prev);
      setNavContext(null);
    }
  };

  const goHome = () => {
    setTab("compagnon");
    setTabHistory([]);
    setNavContext(null);
  };

  const TABS = [
    { id: "compagnon",    label: "Jour" },
    { id: "presence",     label: "Miroir" },
    { id: "ardoise",      label: "Ardoise" },
    { id: "cle",          label: "Ma Clé" },
    { id: "ciel",         label: "Le Ciel" },
    { id: "trouvailles",  label: "Trouvailles" },
    { id: "profil",       label: "Profil" },
  ];

  // Icônes nav SVG
  const NavIcon = ({ id, active }) => {
    const map = {
      compagnon: "/icons/navigation_jour.svg",
      presence:  "/icons/navigation_presence.svg",
      ardoise:   "/icons/navigation_ardoise.svg",
      evasion:   "/icons/navigation_evasion.svg",
      souffle:   "/icons/navigation_souffle.svg",
    };
    if (id === "trouvailles") return (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? "#C8A96E" : "#B0A59A"} strokeWidth="1.2" strokeLinecap="round"
        style={{ opacity: active ? 1 : 0.85, transition: "all 0.25s" }}>
        <path d="M12 3l1.5 4.5H18l-3.75 2.7 1.5 4.5L12 12l-3.75 2.7 1.5-4.5L6 7.5h4.5z"/>
        <circle cx="12" cy="12" r="9" strokeDasharray="2 3" opacity="0.4"/>
      </svg>
    );
    if (id === "lumiere" || id === "ciel") return (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
        style={{ color: active ? "#C8A96E" : "#B0A59A", opacity: active ? 1 : 0.85, transition: "all 0.25s" }}>
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>
    );
    if (id === "profil") return (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
        style={{ color: active ? "#C8A96E" : "#8C7F74", opacity: active ? 1 : 0.85, transition: "all 0.25s" }}>
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    );
    if (id === "cle") return (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
        style={{ color: active ? "#C8A96E" : "#B0A59A", opacity: active ? 1 : 0.85, transition: "all 0.25s" }}>
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
      </svg>
    );
    const src = map[id];
    if (!src) return null;
    return (
      <img
        src={src}
        width={22} height={22}
        style={{
          opacity: active ? 1 : 0.4,
          filter: active
            ? "brightness(1.2) sepia(1) saturate(3) hue-rotate(5deg)"
            : "brightness(0.6) grayscale(1)",
          transition: "all 0.25s",
        }}
      />
    );
  };

  return (
    <div style={{ background: T.nuit, minHeight: "100vh", color: T.aube, fontFamily: T.serif }}>
      <FontLoader />
      <Grain />
      <Horizon />

      {/* ── PAYWALL ── */}
      {showPaywall && (
        <PaywallScreen
          onClose={() => setShowPaywall(false)}
          userKey={authUser?.id || (typeof localStorage !== "undefined" ? localStorage.getItem("alba_user_key") : "local")}
          userEmail={authUser?.email || ""}
        />
      )}

      {/* ── ANIMATION PORTE ── */}
      {porteOuverte !== null && (
        <PorteAnimation
          cleIndex={porteOuverte}
          onEnd={() => setPorteOuverte(null)}
        />
      )}

      {view === "welcome" && (
        <WelcomeSilencieux
          onCommencer={() => setView("auth")}
          onConnexion={() => setView("auth")}
        />
      )}
      {view === "splash" && <Splash onEnd={() => {
        const dest = authUser ? (userData ? "app" : "onboarding") : "welcome";
        setView(dest);
        if (dest === "app" && typeof localStorage !== "undefined" && localStorage.getItem("alba_son_preference") === "oui") {
          setTimeout(() => {
            try { const a = new Audio("/sons/aube.mp3"); a.volume = 0.18; a.play().catch(()=>{}); } catch(e) {}
          }, 800);
        }
      }} />}
      {view === "auth"    && <AuthScreen onAuth={handleAuth} />}
      {view === "onboarding" && (
        <AnimatePresence mode="wait">
          <motion.div
            key="onboarding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Onboarding onComplete={handleComplete} />
          </motion.div>
        </AnimatePresence>
      )}
      {view === "portrait" && <Portrait data={userData} onContinue={() => setView("app")} />}

      {view === "app" && (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ position: "relative", zIndex: 2, maxWidth: 560, margin: "0 auto" }}
        >

          {/* ── HEADER ── */}
          <div style={{
            position: "sticky", top: 0, zIndex: 50,
            background: `${T.nuit}ee`,
            backdropFilter: "blur(12px)",
            borderBottom: `1px solid ${T.brume}18`,
            padding: "0.85rem 1.2rem",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: "1rem",
          }}>
            {/* Gauche : retour ou home */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", minWidth: 60 }}>
              {tabHistory.length > 0 ? (
                <button onClick={goBack} style={{
                  background: "none", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "0.4rem",
                  color: T.brume, padding: "0.2rem",
                  transition: "color 0.2s",
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.brume} strokeWidth="1.2" strokeLinecap="round">
                    <path d="M19 12H5M10 6l-6 6 6 6"/>
                  </svg>
                </button>
              ) : (
                <div style={{ width: 24 }}/>
              )}
            </div>

            {/* Centre : logo ALBA */}
            <button onClick={goHome} style={{
              background: "none", border: "none", cursor: "pointer",
              fontFamily: T.serif, fontWeight: 300, fontSize: "1.35rem",
              letterSpacing: "0.28em", color: T.or, padding: 0,
            }}>ALBA</button>

            {/* Droite : onglet courant */}
            <div style={{ minWidth: 60, textAlign: "right" }}>
              <span style={{
                fontFamily: T.sans, fontWeight: 300, fontSize: "0.65rem",
                letterSpacing: "0.35em", textTransform: "uppercase", color: T.brume,
              }}>
                {TABS.find(t => t.id === tab)?.label}
              </span>
            </div>
          </div>

          {/* ── CONTENT avec transitions Framer Motion ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ padding: "0 0" }}
            >
              {tab === "compagnon" && <Accueil data={userData} onNavigate={goTab} cleActive={cleActive} progressStats={{...progressStats, allPostits: allPostitsApp}} />}
              {tab === "presence"  && <div style={{padding:"0 1.5rem"}}><Presence data={userData} onStart={() => incrementStat("conversationsTotal")} isPremium={isPremium} onShowPaywall={() => setShowPaywall(true)} /></div>}
              {tab === "ardoise"   && <Ardoise data={userData} db={db} onPostitAjoute={() => incrementStat("postitsTotal")} onBilanGenere={() => incrementStat("bilansTotal")} onPostitsChange={setAllPostitsApp} isPremium={isPremium} onShowPaywall={() => setShowPaywall(true)} />}
              {tab === "cle"       && <TerritoireCle cleActive={cleActive} progressStats={progressStats} allPostits={allPostitsApp} />}
              {tab === "ciel"      && <CielCairn userId={authUser?.id} db={db} />}
              {tab === "trouvailles" && <SalleDesTrouvailles data={userData} />}
              {tab === "lumiere"   && <LumiereDuJour />}
              {tab === "souffle"   && <div style={{padding:"0 1.5rem"}}><Souffle onComplete={() => incrementStat("souffleTotal")} /></div>}
              {tab === "profil"    && <Profil data={userData} progressStats={progressStats} onUpdateData={(d) => { setUserData(d); if (db) db.saveProfile(d); }} onSignOut={handleSignOut} isPremium={isPremium} onShowPaywall={() => setShowPaywall(true)} authUserKey={authUser?.id || localStorage.getItem("alba_user_key")} />}
            </motion.div>
          </AnimatePresence>

          {/* ── BOTTOM NAV ── */}
          <div style={{
            position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
            width: "100%", maxWidth: 560,
            background: `${T.nuit}f2`,
            backdropFilter: "blur(16px)",
            borderTop: `1px solid ${T.brume}20`,
            display: "flex", justifyContent: "space-around", alignItems: "center",
            padding: "0.6rem 0 calc(0.6rem + env(safe-area-inset-bottom))",
            zIndex: 50,
          }}>
            {TABS.map(t => (
              <motion.button
                key={t.id}
                onClick={() => goTab(t.id)}
                whileTap={{ scale: 0.88 }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem",
                  padding: "0.3rem 0.6rem",
                  opacity: tab === t.id ? 1 : 0.95,
                  position: "relative",
                }}
              >
                <NavIcon id={t.id} active={tab === t.id} />
                <span style={{
                  fontFamily: T.sans, fontWeight: tab === t.id ? 400 : 300,
                  fontSize: "0.58rem", letterSpacing: "0.3em", textTransform: "uppercase",
                  color: tab === t.id ? T.or : T.aube,
                  transition: "color 0.25s",
                }}>{t.label}</span>
                {tab === t.id && (
                  <motion.div
                    layoutId="navActiveIndicator"
                    style={{
                      position: "absolute", bottom: -2, left: "50%",
                      transform: "translateX(-50%)",
                      width: 16, height: 1,
                      background: T.or,
                      borderRadius: 1,
                    }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function Alba() {
  return (
    <AlbaErrorBoundary>
      <AlbaInner />
    </AlbaErrorBoundary>
  );
}
