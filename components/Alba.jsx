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
  rituel_matin:        3,  // Rituel du matin accompli
  fragment:            2,  // Fragment posé dans l'Ardoise
  miroir:              4,  // Session Miroir complète
  souffle:             3,  // Exercice de souffle
  bilan:               5,  // Bilan crépuscule rempli
  tempete_nommee:      4,  // Tempête nommée
  tempete_traversee:   8,  // Tempête traversée
  jour_actif:          2,  // Chaque nouveau jour de présence
  invitation_1:        1,  // Invitation 1 éclat complétée
  invitation_3:        3,  // Invitation 3 éclats complétée
  invitation_5:        5,  // Invitation 5 éclats complétée
  invitation_echec:    3,  // Invitation tentée honnêtement mais pas réussie
};

// 12 Portes — seuils d'éclats
const SEUILS_PORTES = [0, 10, 25, 50, 80, 120, 170, 230, 300, 400, 550, 800];

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

  // Vérifier le code OTP
  async verifyOtp(email, token) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, type: "email" }),
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
    return { user: null, error: "Code invalide ou expiré." };
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
    @keyframes star-twinkle-1 {
      0%,100% { opacity: 0.12; transform: scale(1); }
      33%     { opacity: 0.55; transform: scale(1.4); }
      66%     { opacity: 0.2;  transform: scale(0.9); }
    }
    @keyframes star-twinkle-2 {
      0%,100% { opacity: 0.25; transform: scale(1); }
      50%     { opacity: 0.08; transform: scale(0.7); }
    }
    @keyframes star-twinkle-3 {
      0%,100% { opacity: 0.18; transform: scale(1); }
      25%     { opacity: 0.6;  transform: scale(1.5); }
      75%     { opacity: 0.1;  transform: scale(0.85); }
    }
    @keyframes nebula-drift {
      0%,100% { transform: scale(1) translateX(0px) translateY(0px); opacity: 0.6; }
      33%     { transform: scale(1.05) translateX(8px) translateY(-5px); opacity: 0.8; }
      66%     { transform: scale(0.97) translateX(-6px) translateY(8px); opacity: 0.5; }
    }
    @keyframes shooting-star-lr {
      0%   { transform: translateX(0) translateY(0); opacity: 0.9; }
      15%  { opacity: 1; }
      100% { transform: translateX(160px) translateY(60px); opacity: 0; }
    }
    @keyframes shooting-star-rl {
      0%   { transform: translateX(0) translateY(0); opacity: 0.9; }
      15%  { opacity: 1; }
      100% { transform: translateX(-160px) translateY(70px); opacity: 0; }
    }
    @keyframes shooting-star-diag {
      0%   { transform: translateX(0) translateY(0); opacity: 0.9; }
      15%  { opacity: 1; }
      100% { transform: translateX(120px) translateY(-80px); opacity: 0; }
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

// ─── QUESTION DU JOUR ────────────────────────────────────────────────────────
const QUESTIONS_DU_JOUR = [
  "Qu'est-ce que tu continues à porter alors que personne ne te le demande ?",
  "Si quelqu'un t'observait aujourd'hui, qu'est-ce qu'il comprendrait de ce que tu traverses ?",
  "Quelle émotion as-tu évitée cette semaine ?",
  "Qu'est-ce que tu as fait aujourd'hui qui ressemblait à la personne que tu veux être ?",
  "À qui as-tu pensé aujourd'hui que tu n'as pas appelé ?",
  "Qu'est-ce que tu repoussais depuis longtemps et que tu pourrais commencer demain ?",
  "Si ton corps pouvait parler, que dirait-il ce soir ?",
  "Quelle version de toi a disparu que tu regrettes parfois ?",
  "Qu'est-ce que tu ferais différemment si tu savais que personne ne te jugerait ?",
  "Qu'est-ce qui te pèse en ce moment sans que tu saches vraiment pourquoi ?",
  "Qu'est-ce que tu as reçu cette semaine que tu n'as pas reconnu comme un cadeau ?",
  "De quoi as-tu besoin que tu n'as pas demandé ?",
  "À quoi ressemble ta vie dans 5 ans si tu continues comme maintenant ?",
  "Qu'est-ce que tu dirais à la personne que tu étais il y a 10 ans ?",
  "Quelle conversation as-tu besoin d'avoir et que tu repousses ?",
  "Qu'est-ce que tu as fait par habitude aujourd'hui plutôt que par choix ?",
  "Qu'est-ce qui te manque que tu n'oses pas nommer ?",
  "À quoi ressemble ton silence intérieur en ce moment ?",
  "Qu'est-ce que tu aurais aimé entendre aujourd'hui ?",
  "Quelle part de toi cherche à exister et n'y arrive pas encore ?",
  "Qu'est-ce que tu portes pour quelqu'un d'autre sans qu'on te l'ait demandé ?",
  "Qu'est-ce qui te fait encore croire en quelque chose ?",
  "Si tu devais décrire où tu en es en un seul mot, lequel serait-il ?",
  "Qu'est-ce que tu t'es interdit cette semaine ?",
  "Quelle émotion as-tu du mal à montrer aux autres ?",
  "Qu'est-ce que tu aurais voulu faire autrement cette semaine ?",
  "À quel moment as-tu été vraiment toi-même aujourd'hui ?",
  "Qu'est-ce qui te donne encore de l'élan quand tout semble lourd ?",
  // Nouvelles — thèmes enrichis
  "Qu'est-ce que tu as appris sur toi en observant comment tu réagis quand ça va mal ?",
  "Est-ce que tu te traites avec la même bienveillance que tu offrirais à quelqu'un que tu aimes ?",
  "Qu'est-ce que tu n'as jamais dit à voix haute et qui existe pourtant ?",
  "Quelle décision tu sais que tu dois prendre et que tu repousses encore ?",
  "Qu'est-ce que le travail t'a pris cette semaine que tu ne lui avais pas donné ?",
  "Si tu pouvais changer une seule chose dans ta façon de te parler à toi-même, ce serait laquelle ?",
  "Qu'est-ce que tu fais encore par peur de décevoir quelqu'un ?",
  "À quel moment as-tu senti que tu n'étais pas à ta place — et qu'est-ce que ça dit ?",
  "Qu'est-ce que tu as honte d'avoir envie ?",
  "Qu'est-ce que tu transmets en ce moment sans le choisir ?",
  "Où est passée la curiosité que tu avais enfant ?",
  "Qu'est-ce que tu ferais si tu savais que tu ne pouvais pas échouer ?",
  "Quelle relation dans ta vie mérite plus d'attention que tu ne lui en donnes ?",
  "Qu'est-ce qui te définissait il y a cinq ans et qui ne te définit plus ?",
  "Qu'est-ce que ton argent dit de tes vraies priorités ?",
  "Quand as-tu fait quelque chose uniquement pour toi, sans justification ?",
  "Qu'est-ce que la fatigue que tu portes essaie de te dire ?",
  "Si tu te regardais avec les yeux de quelqu'un qui t'aime, que verrais-tu ?",
  "Qu'est-ce que tu attends de la vie en ce moment — et à qui tu ne l'as pas dit ?",
  "Quelle part de toi n'a pas encore eu le droit de s'exprimer ?",
  "Qu'est-ce que tu garderais de ta vie actuelle si tu devais tout recommencer ?",
];

// Questions contextuelles selon la situation de vie
const QUESTIONS_SITUATION = {
  "séparé": [
    "Qu'est-ce que cette séparation t'a appris sur ce dont tu as vraiment besoin ?",
    "Qu'est-ce que tu portes encore de cette relation que tu pourrais poser ?",
    "Comment tu prends soin de toi en ce moment, honnêtement ?",
    "Qu'est-ce que cette période t'apprend sur la personne que tu veux devenir ?",
    "Qu'est-ce qui t'a surpris dans ta façon de traverser cette séparation ?",
    "Y a-t-il quelque chose que tu regrettes de ne pas avoir dit avant la fin ?",
  ],
  "parent": [
    "Qu'est-ce que tu voudrais que tes enfants retiennent de toi cette semaine ?",
    "À quel moment as-tu vraiment été présent pour eux aujourd'hui ?",
    "Qu'est-ce que tu ne leur dis pas et qui compte ?",
    "Est-ce que tu es en train de leur transmettre ce que tu voulais leur transmettre ?",
    "Qu'est-ce que ton enfant t'apprend sur toi-même en ce moment ?",
  ],
  "parent-séparé": [
    "Comment tu protèges tes enfants de ce que tu traverses, sans les en couper complètement ?",
    "Qu'est-ce que tu veux absolument que tes enfants sachent de ton amour pour eux malgré tout ?",
    "À quel moment as-tu été présent pour eux cette semaine, vraiment présent ?",
    "Qu'est-ce que tu portes en tant que parent séparé que tu n'oses pas dire ?",
  ],
  "couple": [
    "Qu'est-ce que tu n'arrives pas à dire à ton partenaire en ce moment ?",
    "Qu'est-ce que vous avez arrêté de faire ensemble que vous faisiez au début ?",
    "À quel moment as-tu senti une vraie connexion avec ton partenaire cette semaine ?",
    "Qu'est-ce que tu attends de cette relation que tu n'as pas demandé ?",
  ],
  "transition": [
    "Qu'est-ce que tu laisses derrière toi dans cette transition ?",
    "De quoi as-tu besoin pour avancer que tu n'as pas encore ?",
    "Qu'est-ce que cette période t'apprend sur toi ?",
    "À quoi ressemble la personne que tu es en train de devenir ?",
  ],
};

const getPhraseduJour = (cleActive = 0) => {
  const jour = new Date().getDay();
  if (jour % 4 === 0) return PHRASES_MATIN.cle[cleActive] || PHRASES_MATIN.default[0];
  const idx = (new Date().getDate() + cleActive) % PHRASES_MATIN.default.length;
  return PHRASES_MATIN.default[idx];
};

const getQuestionDuJour = (data = null) => {
  const today = new Date();
  const seed = today.getFullYear() * 1000 + today.getMonth() * 31 + today.getDate();

  // Contextuel selon situation de vie (1 fois sur 3)
  if (data && seed % 3 === 0) {
    const situation = (data.situation || "").toLowerCase();
    const estParent = data.estParent === "oui" || data.estParent === true;
    const estSepare = situation.includes("sép") || situation.includes("sépar");
    const estCouple = situation.includes("couple");
    const estTransition = situation.includes("transition");

    if (estSepare && estParent && QUESTIONS_SITUATION["parent-séparé"]) {
      return QUESTIONS_SITUATION["parent-séparé"][seed % QUESTIONS_SITUATION["parent-séparé"].length];
    }
    if (estSepare && QUESTIONS_SITUATION["séparé"]) {
      return QUESTIONS_SITUATION["séparé"][seed % QUESTIONS_SITUATION["séparé"].length];
    }
    if (estParent && QUESTIONS_SITUATION["parent"]) {
      return QUESTIONS_SITUATION["parent"][seed % QUESTIONS_SITUATION["parent"].length];
    }
    if (estCouple && QUESTIONS_SITUATION["couple"]) {
      return QUESTIONS_SITUATION["couple"][seed % QUESTIONS_SITUATION["couple"].length];
    }
    if (estTransition && QUESTIONS_SITUATION["transition"]) {
      return QUESTIONS_SITUATION["transition"][seed % QUESTIONS_SITUATION["transition"].length];
    }
  }

  return QUESTIONS_DU_JOUR[seed % QUESTIONS_DU_JOUR.length];
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
                { icon: "🌿", label: "Lettre mensuelle", desc: "Une lettre par mois. Longue. Intime." },
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
                "Quelqu'un pense à toi."
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
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode]         = useState("login"); // login | signup | reset | magic
  const [loading, setLoading]   = useState(false);
  const [errMsg, setErrMsg]     = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  const handleSubmit = async () => {
    setErrMsg("");
    if (!email.includes("@")) { setErrMsg("Adresse email invalide."); return; }

    // Magic link
    if (mode === "magic") {
      setLoading(true);
      const ok = await sbAuth.sendMagicLink(email.trim().toLowerCase());
      setLoading(false);
      if (ok) setMagicSent(true);
      else setErrMsg("Une erreur est survenue. Réessaie.");
      return;
    }

    if (mode !== "reset" && password.length < 6) { setErrMsg("Mot de passe trop court (6 caractères min)."); return; }
    setLoading(true);
    if (mode === "login") {
      const { user, error } = await sbAuth.signIn(email.trim().toLowerCase(), password);
      setLoading(false);
      if (user) onAuth(user);
      else setErrMsg(error || "Email ou mot de passe incorrect.");
    } else if (mode === "signup") {
      const { user, error } = await sbAuth.signUp(email.trim().toLowerCase(), password);
      setLoading(false);
      if (user) onAuth(user);
      else setErrMsg(error || "Erreur lors de la création du compte.");
    } else if (mode === "reset") {
      const ok = await sbAuth.resetPassword(email.trim().toLowerCase());
      setLoading(false);
      if (ok) setResetSent(true);
      else setErrMsg("Une erreur est survenue. Réessaie.");
    }
  };

  const inputStyle = {
    background: "#1E1A16", border: `1px solid ${T.brume}33`,
    borderRadius: "6px", padding: "0.95rem 1.1rem",
    fontFamily: T.sans, fontSize: "0.95rem", color: T.aube,
    outline: "none", width: "100%", boxSizing: "border-box",
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: T.nuit, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ position: "absolute", top: "15%", left: "50%", transform: "translateX(-50%)", width: 300, height: 300, background: `radial-gradient(ellipse, ${T.or}15 0%, transparent 70%)`, pointerEvents: "none" }}/>

      <div style={{ fontFamily: T.serif, fontSize: "2.2rem", letterSpacing: "0.28em", color: T.or, marginBottom: "0.3rem" }}>ALBA</div>
      <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.95rem", color: T.brume, marginBottom: "2.8rem" }}>L'aube en toi</div>

      <div style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: "0.9rem" }}>

        {/* ── MOT DE PASSE OUBLIÉ ENVOYÉ ── */}
        {mode === "magic" && magicSent ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.6rem", color: T.or, marginBottom: "1rem" }}>✦</div>
            <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.95rem", color: T.orPale, lineHeight: 1.8 }}>
              Un lien de connexion a été envoyé à<br/>
              <span style={{ fontSize: "0.8rem", color: T.brume }}>{email}</span><br/><br/>
              Clique sur le lien dans l'email pour entrer dans ALBA.
            </p>
            <button onClick={() => { setMode("login"); setMagicSent(false); }} style={{ marginTop: "1.5rem", background: "none", border: "none", cursor: "pointer", fontFamily: T.serif, fontStyle: "italic", fontSize: "0.8rem", color: `${T.brume}88` }}>
              Retour à la connexion
            </button>
          </div>
        ) : mode === "reset" && resetSent ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.6rem", color: T.or, marginBottom: "1rem" }}>✦</div>
            <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.95rem", color: T.orPale, lineHeight: 1.8 }}>
              Un lien de réinitialisation a été envoyé à<br/>
              <span style={{ fontSize: "0.8rem", color: T.brume }}>{email}</span>
            </p>
            <button onClick={() => { setMode("login"); setResetSent(false); }} style={{ marginTop: "1.5rem", background: "none", border: "none", cursor: "pointer", fontFamily: T.serif, fontStyle: "italic", fontSize: "0.8rem", color: `${T.brume}88` }}>
              Retour à la connexion
            </button>
          </div>
        ) : (
          <>
            {/* Google */}
            <button onClick={() => sbAuth.signInWithGoogle()} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", width: "100%", padding: "0.85rem 1rem", background: "#1E1A16", border: `1px solid ${T.brume}33`, borderRadius: "6px", cursor: "pointer", fontFamily: T.sans, fontWeight: 300, fontSize: "0.75rem", letterSpacing: "0.08em", color: T.aube, WebkitTapHighlightColor: "transparent" }}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuer avec Google
            </button>

            {/* Magic link */}
            <button onClick={() => setMode(mode === "magic" ? "login" : "magic")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", width: "100%", padding: "0.85rem 1rem", background: mode === "magic" ? `${T.or}12` : "#1E1A16", border: `1px solid ${mode === "magic" ? T.or + "55" : T.brume + "33"}`, borderRadius: "6px", cursor: "pointer", fontFamily: T.sans, fontWeight: 300, fontSize: "0.75rem", letterSpacing: "0.08em", color: mode === "magic" ? T.or : T.aube, WebkitTapHighlightColor: "transparent", transition: "all 0.2s" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              Connexion par email magique
            </button>

            {/* Séparateur */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
              <div style={{ flex: 1, height: 1, background: `${T.brume}22` }} />
              <span style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.72rem", color: `${T.brume}55` }}>ou</span>
              <div style={{ flex: 1, height: 1, background: `${T.brume}22` }} />
            </div>

            {/* Titre mode */}
            <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.85rem", color: T.brume, textAlign: "center", margin: "0" }}>
              {mode === "login" ? "Connexion" : mode === "signup" ? "Créer mon compte" : mode === "magic" ? "Connexion sans mot de passe" : "Mot de passe oublié"}
            </p>

            {/* Email */}
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="ton@email.com" style={inputStyle}
              onFocus={e => e.target.style.borderColor = `${T.or}55`} onBlur={e => e.target.style.borderColor = `${T.brume}33`} />

            {/* Mot de passe */}
            {mode !== "reset" && mode !== "magic" && (
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="Mot de passe" style={inputStyle}
                onFocus={e => e.target.style.borderColor = `${T.or}55`} onBlur={e => e.target.style.borderColor = `${T.brume}33`} />
            )}

            {errMsg && <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.82rem", color: "#D4856A", textAlign: "center" }}>{errMsg}</div>}

            {/* Bouton principal */}
            <button onClick={handleSubmit} disabled={loading} style={{ background: loading ? `${T.or}55` : T.or, border: "none", borderRadius: "4px", padding: "1rem", cursor: loading ? "default" : "pointer", fontFamily: T.sans, fontWeight: 300, fontSize: "0.6rem", letterSpacing: "0.45em", textTransform: "uppercase", color: T.nuit, WebkitTapHighlightColor: "transparent" }}>
              {loading ? "…" : mode === "login" ? "Se connecter" : mode === "signup" ? "Créer mon compte" : mode === "magic" ? "Envoyer le lien magique" : "Envoyer le lien"}
            </button>

            {/* Liens secondaires */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", marginTop: "0.3rem" }}>
              {mode === "login" && (
                <>
                  <button onClick={() => { setMode("signup"); setErrMsg(""); }} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: T.serif, fontStyle: "italic", fontSize: "0.78rem", color: `${T.or}99` }}>
                    Pas encore de compte ? Créer le mien
                  </button>
                  <button onClick={() => { setMode("reset"); setErrMsg(""); }} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: T.serif, fontStyle: "italic", fontSize: "0.72rem", color: `${T.brume}66` }}>
                    Mot de passe oublié ?
                  </button>
                </>
              )}
              {(mode === "signup" || mode === "reset") && (
                <button onClick={() => { setMode("login"); setErrMsg(""); }} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: T.serif, fontStyle: "italic", fontSize: "0.75rem", color: `${T.brume}77` }}>
                  Déjà un compte ? Se connecter
                </button>
              )}
            </div>
          </>
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

// ─── DISCOVERY TOUR ──────────────────────────────────────────────────────────
const TOUR_CARDS = [
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#C8A96E" strokeWidth="1.2" strokeLinecap="round">
        <circle cx="24" cy="24" r="20" strokeOpacity="0.3"/>
        <path d="M24 14 Q18 19 18 24 Q18 30 24 34 Q30 30 30 24 Q30 19 24 14Z" strokeOpacity="0.8" fill="#C8A96E" fillOpacity="0.08"/>
        <line x1="24" y1="34" x2="24" y2="40" strokeOpacity="0.5"/>
        <line x1="20" y1="40" x2="28" y2="40" strokeOpacity="0.3"/>
      </svg>
    ),
    titre: "Un espace à toi, chaque jour",
    texte: "Ce n'est pas une application à consulter. C'est un espace dans lequel tu reviens — le matin, le soir, quand quelque chose traverse. Un endroit qui te connaît et qui s'adapte.",
    accent: "#C8A96E",
  },
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#9EC8B4" strokeWidth="1.2" strokeLinecap="round">
        <rect x="8" y="10" width="32" height="28" rx="3" strokeOpacity="0.4"/>
        <line x1="8" y1="20" x2="40" y2="20" strokeOpacity="0.3"/>
        <rect x="13" y="25" width="8" height="8" rx="1.5" strokeOpacity="0.7" fill="#9EC8B4" fillOpacity="0.1"/>
        <rect x="27" y="25" width="8" height="8" rx="1.5" strokeOpacity="0.4"/>
        <line x1="13" y1="14" x2="18" y2="14" strokeOpacity="0.5"/>
        <line x1="30" y1="14" x2="35" y2="14" strokeOpacity="0.5"/>
      </svg>
    ),
    titre: "Cinq espaces t'attendent",
    texte: (
      <span>
        <span style={{ color: "#7B9EA8" }}>Miroir</span> pour te voir. <span style={{ color: "#C8A96E" }}>Ardoise</span> pour poser ce qui traverse. <span style={{ color: "#9EC8B4" }}>Évasion</span> pour souffler. <span style={{ color: "#A89060" }}>Sagesses</span> pour nourrir ta pensée. Et chaque matin, un <span style={{ color: "#D4856A" }}>Rituel</span> en trois minutes.
      </span>
    ),
    accent: "#9EC8B4",
  },
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#A87BC8" strokeWidth="1.2" strokeLinecap="round">
        <path d="M24 8 L24 40" strokeOpacity="0.2"/>
        <circle cx="24" cy="14" r="4" strokeOpacity="0.9" fill="#A87BC8" fillOpacity="0.15"/>
        <circle cx="24" cy="26" r="4" strokeOpacity="0.5"/>
        <circle cx="24" cy="38" r="4" strokeOpacity="0.25"/>
        <path d="M28 14 Q36 14 36 20 Q36 26 28 26" strokeOpacity="0.3"/>
      </svg>
    ),
    titre: "Un chemin : les six Clés",
    texte: "Six étapes intérieures — Reconnaître, Comprendre, Ressentir, Lâcher, Recevoir, Devenir. Tu n'avances pas vite. Tu avances juste. Chaque Porte s'ouvre quand tu es prêt(e).",
    accent: "#A87BC8",
  },
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#C8A96E" strokeWidth="1.2" strokeLinecap="round">
        <circle cx="24" cy="24" r="18" strokeOpacity="0.25"/>
        <path d="M24 10 A14 14 0 0 1 38 24" strokeOpacity="0.9"/>
        <path d="M38 24 A14 14 0 0 1 24 38" strokeOpacity="0.5"/>
        <path d="M24 38 A14 14 0 0 1 10 24" strokeOpacity="0.25"/>
        <circle cx="24" cy="10" r="2.5" fill="#C8A96E" fillOpacity="0.7" stroke="none"/>
        <line x1="24" y1="24" x2="33" y2="18" strokeOpacity="0.7"/>
        <circle cx="24" cy="24" r="2" fill="#C8A96E" fillOpacity="0.5" stroke="none"/>
      </svg>
    ),
    titre: "Reviens demain",
    texte: "Quelque chose se construit dans la durée. Pas besoin de tout faire en une fois. Chaque retour laisse une trace. Chaque trace devient un chemin.",
    accent: "#C8A96E",
  },
];

const DiscoveryTour = ({ onContinue }) => {
  const [idx, setIdx] = useState(0);
  const [animDir, setAnimDir] = useState(1);
  const [visible, setVisible] = useState(true);
  const touchStart = useRef(null);

  const goTo = (next, dir) => {
    setVisible(false);
    setAnimDir(dir);
    setTimeout(() => { setIdx(next); setVisible(true); }, 220);
  };

  const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (!touchStart.current) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 45) {
      if (diff > 0 && idx < TOUR_CARDS.length - 1) goTo(idx + 1, 1);
      else if (diff < 0 && idx > 0) goTo(idx - 1, -1);
    }
    touchStart.current = null;
  };

  const card = TOUR_CARDS[idx];
  const isLast = idx === TOUR_CARDS.length - 1;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: "fixed", inset: 0, background: T.nuit,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        zIndex: 100, padding: "2rem",
        overflow: "hidden",
      }}
    >
      {/* Halo d'ambiance */}
      <div style={{
        position: "absolute", width: 280, height: 280, borderRadius: "50%",
        background: `radial-gradient(circle, ${card.accent}0A 0%, transparent 70%)`,
        transition: "background 0.8s ease",
        pointerEvents: "none",
      }}/>

      <style>{`
        @keyframes tourIn  { from { opacity:0; transform: translateX(${animDir > 0 ? "24px" : "-24px"}) } to { opacity:1; transform:translateX(0) } }
        @keyframes tourOut { from { opacity:1 } to { opacity:0 } }
      `}</style>

      <div style={{
        position: "relative", zIndex: 2,
        width: "100%", maxWidth: 340,
        animation: visible ? "tourIn 0.35s ease forwards" : "tourOut 0.2s ease forwards",
        textAlign: "center",
      }}>
        {/* Icône */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
          {card.icon}
        </div>

        {/* Titre */}
        <h2 style={{
          fontFamily: T.serif, fontWeight: 300,
          fontSize: "clamp(1.3rem, 5vw, 1.7rem)",
          color: T.orPale, letterSpacing: "0.03em",
          lineHeight: 1.3, margin: "0 0 1.2rem",
        }}>
          {card.titre}
        </h2>

        {/* Texte */}
        <p style={{
          fontFamily: T.serif, fontStyle: "italic",
          fontSize: "clamp(0.9rem, 3vw, 1.05rem)",
          color: T.brume, lineHeight: 1.85,
          margin: "0 0 2.5rem",
        }}>
          {card.texte}
        </p>

        {/* Dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginBottom: "2.5rem" }}>
          {TOUR_CARDS.map((_, i) => (
            <div key={i} onClick={() => goTo(i, i > idx ? 1 : -1)} style={{
              width: i === idx ? 22 : 6, height: 6, borderRadius: 3,
              background: i === idx ? card.accent : `${T.brume}33`,
              transition: "all 0.35s ease", cursor: "pointer",
            }}/>
          ))}
        </div>

        {/* Bouton */}
        {isLast ? (
          <button onClick={onContinue} style={{
            background: "transparent", border: `1px solid ${T.or}66`,
            borderRadius: "3px", padding: "0.9rem 2.6rem",
            color: T.orPale, fontFamily: T.serif, fontStyle: "italic",
            fontSize: "1rem", letterSpacing: "0.05em", cursor: "pointer",
            transition: "border-color 0.3s",
            WebkitTapHighlightColor: "transparent",
          }}>
            Je commence
          </button>
        ) : (
          <button onClick={() => goTo(idx + 1, 1)} style={{
            background: "transparent", border: `1px solid ${T.brume}44`,
            borderRadius: "3px", padding: "0.75rem 2rem",
            color: T.brume, fontFamily: T.sans, fontWeight: 300,
            fontSize: "0.75rem", letterSpacing: "0.3em", textTransform: "uppercase",
            cursor: "pointer", transition: "border-color 0.3s",
            WebkitTapHighlightColor: "transparent",
          }}>
            Suivant
          </button>
        )}

        {/* Skip */}
        {!isLast && (
          <div onClick={onContinue} style={{
            marginTop: "1.2rem", fontFamily: T.sans, fontWeight: 300,
            fontSize: "0.55rem", letterSpacing: "0.35em", textTransform: "uppercase",
            color: `${T.brume}44`, cursor: "pointer",
          }}>
            Passer
          </div>
        )}
      </div>
    </div>
  );
};

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
      <BreadcrumbDots current={num - 1} total={8} />
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
  const [showTour, setShowTour] = useState(false);

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
  const [situation, setSituation] = useState("");
  const [estParent, setEstParent] = useState("");

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
    <Step num={1} label="Comment t'appelles-tu ?" onNext={() => { setStep(1); }} canNext={prenom.length > 1}>
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
    <AhaMoment prenom={prenom} onContinue={() => { setShowAha(false); setShowTour(true); }} />
  );

  // ── DISCOVERY TOUR ──────────────────────────────────────────────────────────
  if (showTour) return (
    <DiscoveryTour onContinue={() => { setShowTour(false); setStep(1); }} />
  );

  // ── ÉTAPE 1 — Sensibilité ─────────────────────────────────────────────────
  if (step === 1) return (
    <Screen centered>
      <div style={{ width: "100%", maxWidth: 480, animation: "fadeUp 0.8s ease forwards" }}>
        <BreadcrumbDots current={1} total={8} />
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
        <BreadcrumbDots current={3} total={8} />

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
        <BreadcrumbDots current={4} total={8} />
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
          <Btn onClick={() => setStep(6)} canNext={!!signe} disabled={!signe} style={{ opacity: signe ? 1 : 0.4 }}>Continuer</Btn>
          <Btn secondary small onClick={() => setStep(3)}>Revenir</Btn>
        </div>
      </div>
    </Screen>
  );

  // ── ÉTAPE 5 — Couleur de prédilection ────────────────────────────────────
  // ── ÉTAPE 6 — Situation de vie ───────────────────────────────────────────
  if (step === 6) return (
    <Screen centered>
      <div style={{ width: "100%", maxWidth: 480, animation: "fadeUp 0.8s ease forwards" }}>
        <BreadcrumbDots current={6} total={8} />
        <div style={{ fontFamily: T.serif, fontWeight: 300, fontSize: "clamp(1.2rem, 4vw, 1.6rem)", color: T.orPale, textAlign: "center", marginBottom: "0.5rem", lineHeight: 1.3 }}>
          Ta vie en ce moment, {prenom} ?
        </div>
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.9rem", color: T.brume, textAlign: "center", marginBottom: "2rem" }}>
          Pour qu'ALBA t'accompagne selon ce que tu traverses vraiment.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginBottom: "2rem" }}>
          {[
            { id: "couple", label: "En couple" },
            { id: "séparé récemment", label: "Séparé(e) récemment" },
            { id: "célibataire", label: "Célibataire" },
            { id: "famille recomposée", label: "En famille recomposée" },
            { id: "transition", label: "En transition, je cherche" },
          ].map(opt => (
            <button key={opt.id} onClick={() => setSituation(opt.id)} style={{
              background: situation === opt.id ? `${T.or}18` : "transparent",
              border: `1px solid ${situation === opt.id ? T.or + "88" : T.brume + "22"}`,
              borderRadius: "8px", padding: "0.9rem 1.2rem",
              fontFamily: T.serif, fontStyle: "italic",
              fontSize: "1rem", color: situation === opt.id ? T.orPale : T.brume,
              cursor: "pointer", textAlign: "left", transition: "all 0.3s",
            }}>
              {opt.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          {situation && <Btn onClick={() => setStep(7)}>Continuer</Btn>}
          <Btn secondary small onClick={() => setStep(4)}>Revenir</Btn>
        </div>
      </div>
    </Screen>
  );

  // ── ÉTAPE 7 — Parentalité ────────────────────────────────────────────────
  if (step === 7) return (
    <Screen centered>
      <div style={{ width: "100%", maxWidth: 480, animation: "fadeUp 0.8s ease forwards" }}>
        <BreadcrumbDots current={7} total={8} />
        <div style={{ fontFamily: T.serif, fontWeight: 300, fontSize: "clamp(1.2rem, 4vw, 1.6rem)", color: T.orPale, textAlign: "center", marginBottom: "0.5rem", lineHeight: 1.3 }}>
          Es-tu parent ?
        </div>
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.9rem", color: T.brume, textAlign: "center", marginBottom: "2rem" }}>
          Cette réponse restera entre nous.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginBottom: "2rem" }}>
          {[
            { id: "oui", label: "Oui" },
            { id: "non", label: "Non" },
            { id: "beau-parent", label: "Beau-parent" },
            { id: "en attente", label: "J'attends un enfant" },
          ].map(opt => (
            <button key={opt.id} onClick={() => setEstParent(opt.id)} style={{
              background: estParent === opt.id ? `${T.or}18` : "transparent",
              border: `1px solid ${estParent === opt.id ? T.or + "88" : T.brume + "22"}`,
              borderRadius: "8px", padding: "0.9rem 1.2rem",
              fontFamily: T.serif, fontStyle: "italic",
              fontSize: "1rem", color: estParent === opt.id ? T.orPale : T.brume,
              cursor: "pointer", textAlign: "left", transition: "all 0.3s",
            }}>
              {opt.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          {estParent && <Btn onClick={() => setStep(5)}>Continuer</Btn>}
          <Btn secondary small onClick={() => setStep(6)}>Revenir</Btn>
        </div>
      </div>
    </Screen>
  );

  // ── ÉTAPE 5 — Couleur ─────────────────────────────────────────────────────
  if (step === 5) return (
    <Screen centered>
      <div style={{ width: "100%", maxWidth: 480, animation: "fadeUp 0.8s ease forwards" }}>
        <BreadcrumbDots current={5} total={8} />
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
              situation: situation || "",
              estParent: estParent || "non",
            });
          }}>Entrer dans l'aube</Btn>}
          <Btn secondary small onClick={() => setStep(7)}>Revenir</Btn>
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
          <div style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: small ? 14 : 18, color: "#F0E2BC", opacity: 0.95, marginBottom: 4 }}>
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
  // ── Phases cinématiques ──────────────────────────────────────────────────
  const [phase, setPhase] = useState(0);

  // Hooks AVANT tout return conditionnel
  const cdv = data ? cheminDeVie(data.naissance) : 0;
  const chemin = CHEMINS[cdv] || CHEMINS[9];
  const { blessure } = data ? getContextProfil(data) : { blessure: { nom: "Abandon" } };
  const livre     = LIVRES[blessure.nom] || LIVRES["Abandon"];
  const citation  = CITATIONS[cdv % CITATIONS.length];
  const cle       = CLES[0];
  const sens      = data?.sensibilite || "intuitif";
  const isRationnel = sens === "rationnel";
  const labelChemin  = isRationnel ? "Profil psychologique" : "Chemin de vie";
  const labelBlessure = isRationnel ? "Zone de vulnérabilité" : "Blessure à traverser";

  if (!data) return null;

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
            Un instant.
          </p>
          <p style={{
            fontFamily: T.serif, fontStyle: "italic",
            fontSize: "clamp(1.1rem, 4vw, 1.4rem)",
            color: T.brume, marginTop: "0.3rem",
            ...fade(phase >= 0, 0.6),
          }}>
            Quelque chose se tisse.
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
    ((stats.joursActifs        || 0) * ECLATS_PAR_ACTE.jour_actif) +
    ((stats.postitsTotal       || 0) * ECLATS_PAR_ACTE.fragment) +
    ((stats.conversationsTotal || 0) * ECLATS_PAR_ACTE.miroir) +
    ((stats.souffleTotal       || 0) * ECLATS_PAR_ACTE.souffle) +
    ((stats.bilansTotal        || 0) * ECLATS_PAR_ACTE.bilan) +
    ((stats.tempetesNommees    || 0) * ECLATS_PAR_ACTE.tempete_nommee) +
    ((stats.tempetesTraversees || 0) * ECLATS_PAR_ACTE.tempete_traversee) +
    ((stats.invitations1       || 0) * ECLATS_PAR_ACTE.invitation_1) +
    ((stats.invitations3       || 0) * ECLATS_PAR_ACTE.invitation_3) +
    ((stats.invitations5       || 0) * ECLATS_PAR_ACTE.invitation_5) +
    ((stats.invitationsEchec   || 0) * ECLATS_PAR_ACTE.invitation_echec)
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
    [ // Clé VII
      { label: "30 sessions Miroir",             done: conversationsTotal >= 30, val: Math.min(conversationsTotal,30), max: 30 },
      { label: "30 jours actifs",                done: joursActifs >= 30, val: Math.min(joursActifs,30), max: 30 },
    ],
    [ // Clé VIII
      { label: "40 sessions Miroir",             done: conversationsTotal >= 40, val: Math.min(conversationsTotal,40), max: 40 },
      { label: "45 jours actifs",                done: joursActifs >= 45, val: Math.min(joursActifs,45), max: 45 },
    ],
    [ // Clé IX
      { label: "55 sessions Miroir",             done: conversationsTotal >= 55, val: Math.min(conversationsTotal,55), max: 55 },
      { label: "60 jours actifs",                done: joursActifs >= 60, val: Math.min(joursActifs,60), max: 60 },
    ],
    [ // Clé X
      { label: "75 sessions Miroir",             done: conversationsTotal >= 75, val: Math.min(conversationsTotal,75), max: 75 },
      { label: "90 jours actifs",                done: joursActifs >= 90, val: Math.min(joursActifs,90), max: 90 },
    ],
    [ // Clé XI
      { label: "100 sessions Miroir",            done: conversationsTotal >= 100, val: Math.min(conversationsTotal,100), max: 100 },
      { label: "120 jours actifs",               done: joursActifs >= 120, val: Math.min(joursActifs,120), max: 120 },
    ],
    [ // Clé XII
      { label: "150 sessions Miroir",            done: conversationsTotal >= 150, val: Math.min(conversationsTotal,150), max: 150 },
      { label: "365 jours depuis l'inscription", done: joursActifs >= 200, val: Math.min(joursActifs,200), max: 200 },
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
              <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.6rem", letterSpacing: "0.35em", textTransform: "uppercase", color: `${etat.couleur}AA` }}>
                aujourd'hui · {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </div>
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

// ─── ANNEAUX DU JOUR ────────────────────────────────────────────────────────
const AnneauxJour = ({ compact = false }) => {
  const todayKey = new Date().toISOString().split("T")[0];

  const actes = (() => {
    try {
      const rituel    = localStorage.getItem("alba_rituel_" + todayKey) === "1";
      const postits   = JSON.parse(localStorage.getItem("alba_postits") || "{}");
      const ardoise   = (postits[todayKey] || []).filter(p => p.type !== "bilan").length > 0;
      const bilans    = (postits[todayKey] || []).filter(p => p.type === "bilan").length > 0;
      const souffle   = parseInt(localStorage.getItem("alba_souffle_" + todayKey) || "0") > 0;
      const barometre = !!localStorage.getItem("alba_barometre_" + todayKey);
      return [
        { label: "Rituel",    fait: rituel,    couleur: "#C8A96E" },
        { label: "Ardoise",   fait: ardoise,   couleur: "#A89060" },
        { label: "Baromètre", fait: barometre, couleur: "#7B9EA8" },
        { label: "Souffle",   fait: souffle,   couleur: "#D4856A" },
        { label: "Bilan",     fait: bilans,    couleur: "#8A7BA8" },
      ];
    } catch { return []; }
  })();

  const faits = actes.filter(a => a.fait).length;
  const total = actes.length;
  const size = compact ? 36 : 52;
  const stroke = compact ? 3 : 4;

  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 120); return () => clearTimeout(t); }, []);

  if (compact) return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", padding: "0.85rem 1.5rem 0" }}>
      <div style={{ display: "flex", gap: "0.35rem" }}>
        {actes.map((a, i) => {
          const r = (size / 2) - stroke;
          const circ = 2 * Math.PI * r;
          return (
            <svg key={i} width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
              <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`${a.couleur}18`} strokeWidth={stroke}/>
              <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={a.fait ? a.couleur : `${a.couleur}00`}
                strokeWidth={stroke} strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={mounted && a.fait ? 0 : circ}
                style={{ transition: `stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1) ${i * 0.13}s` }}
              />
            </svg>
          );
        })}
      </div>
      <div>
        <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.4rem", letterSpacing: "0.4em", textTransform: "uppercase", color: `${T.brume}88` }}>
          Aujourd'hui
        </div>
        <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.8rem", color: faits === total ? T.or : T.aube, marginTop: "0.15rem" }}>
          {faits === 0 ? "La journée commence." :
           faits === total ? "Journée complète ✦" :
           `${faits} acte${faits > 1 ? "s" : ""} accompli${faits > 1 ? "s" : ""}`}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ margin: "2rem 1.5rem 0", animation: "fadeUp 0.7s ease forwards 0.15s", opacity: 0 }}>
      <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.48rem", letterSpacing: "0.5em", textTransform: "uppercase", color: T.brume, marginBottom: "1.2rem" }}>
        Aujourd'hui
      </div>
      <div style={{ background: `${T.nuit2}CC`, border: `1px solid ${T.brume}15`, borderRadius: "10px", padding: "1.4rem" }}>
        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", marginBottom: "1rem" }}>
          {actes.map((a, i) => {
            const r = (size / 2) - stroke;
            const circ = 2 * Math.PI * r;
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}>
                <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
                  <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`${a.couleur}15`} strokeWidth={stroke}/>
                  <circle cx={size/2} cy={size/2} r={r} fill="none"
                    stroke={a.fait ? a.couleur : `${a.couleur}00`}
                    strokeWidth={stroke} strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={mounted && a.fait ? 0 : circ}
                    style={{ transition: `stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1) ${i * 0.18}s` }}
                  />
                </svg>
                <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.37rem", letterSpacing: "0.15em", textTransform: "uppercase", color: a.fait ? `${a.couleur}CC` : `${T.brume}38` }}>
                  {a.label}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ borderTop: `1px solid ${T.brume}12`, paddingTop: "0.9rem", textAlign: "center" }}>
          <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.85rem", color: faits === total ? T.or : `${T.brume}BB`, margin: 0, lineHeight: 1.6 }}>
            {faits === 0 && "La journée est devant toi."}
            {faits === 1 && "Un premier pas. C'est déjà quelque chose."}
            {faits === 2 && "Tu construis quelque chose, doucement."}
            {faits === 3 && "La régularité est une forme de soin."}
            {faits === 4 && "Presque là. Une chose encore."}
            {faits === 5 && "Journée pleine. ✦"}
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── ACCUEIL ─────────────────────────────────────────────────────────────────
// ─── INVITATIONS DU JOUR ─────────────────────────────────────────────────────
// ── PARCOURS THÉMATIQUES ──────────────────────────────────────────────────────
// ── FICHES THÈMES ─────────────────────────────────────────────────────────────
const FICHES_THEMES = [
  {
    id: "pardon",
    theme: "Pardon",
    couleur: "#C89878",
    intro: "Le pardon est l'une des expériences les plus mal comprises. On le confond souvent avec l'oubli, avec l'absolution, avec la réconciliation. Mais pardonner, ce n'est pas dire que ce qui s'est passé était acceptable. Ce n'est pas reprendre contact. Ce n'est pas effacer. Le pardon est un acte intérieur — il se fait pour soi, pas pour l'autre. C'est choisir de ne plus laisser une douleur ancienne occuper le centre de sa vie. C'est reprendre la place que la rancœur avait prise. Certains pardons prennent des années. D'autres se font en une fraction de seconde. Il n'y a pas de bonne durée.",
    dansLeFlux: "Quand le pardon est présent en toi, tu penses à certaines personnes ou à certaines situations sans que ça te consume. Il peut rester une trace — une cicatrice — mais elle ne dicte plus tes décisions. Tu n'as plus besoin que l'autre reconnaisse ce qu'il a fait pour aller de l'avant. Tu peux parler de ce qui s'est passé sans que la colère reprenne tout l'espace.",
    quandCaResiste: "Quand le pardon est bloqué, la rancœur agit comme un fond sonore permanent. Tu repenses à des situations passées avec la même intensité qu'au premier jour. Tu construis des arguments, tu imagines des confrontations, tu attends une reconnaissance qui ne vient pas. La personne a peut-être disparu de ta vie — mais elle occupe encore beaucoup de place dans ta tête.",
    pratiques: [
      { titre: "Distinguer pardon et réconciliation", texte: "Pardonner ne signifie pas reprendre contact, redonner confiance, ou agir comme si rien ne s'était passé. Ces deux choses sont séparables. Tu peux pardonner intérieurement à quelqu'un avec qui tu n'auras plus jamais de lien. Écris une phrase qui distingue ce que tu pardones de ce que tu ne réinstaureras pas." },
      { titre: "La lettre non envoyée", texte: "Écris une lettre à la personne qui t'a blessé — en disant tout ce que tu n'as jamais pu dire. Sans filtre, sans politesse. Laisse sortir la colère, la tristesse, le regret. Puis, à la fin, écris une seule phrase : ce que tu décides de ne plus porter. Tu ne l'enverras pas. L'acte d'écrire suffit." },
      { titre: "Se pardonner soi-même", texte: "Le pardon le plus difficile est souvent celui qu'on s'accorde à soi-même. Pour des décisions passées, des erreurs commises, des choses qu'on n'a pas faites. Écris quelque chose pour lequel tu te juges encore. Puis demande-toi : est-ce que j'aurais accepté que quelqu'un d'autre se condamne autant pour la même chose ?" },
    ],
  },
  {
    id: "relations",
    theme: "Relations",
    couleur: "#C87898",
    intro: "Les relations sont le miroir le plus précis de qui nous sommes. Ce n'est pas dans la solitude qu'on se découvre le mieux — c'est dans le contact avec l'autre. Les relations révèlent nos peurs, nos besoins, nos limites, notre capacité à aimer et à recevoir. Elles peuvent être source de joie intense ou de douleur profonde — souvent les deux, parfois en même temps. Ce qu'on cherche dans les relations dit beaucoup sur ce qu'on n'a pas encore trouvé en soi. Ce qu'on ne supporte pas chez l'autre dit souvent quelque chose sur ce qu'on refuse de voir en soi.",
    dansLeFlux: "Quand tes relations sont saines, tu te sens nourri(e) par les gens que tu fréquentes — pas épuisé(e). Tu peux être toi-même sans te censurer entièrement. Tu poses des limites sans culpabilité excessive. Tu accueilles les différences sans te sentir menacé(e). Il y a un équilibre entre ce que tu donnes et ce que tu reçois.",
    quandCaResiste: "Quand les relations dysfonctionnent, tu peux te retrouver à te perdre dans les autres — à t'oublier pour maintenir la paix. Ou au contraire, à rester à distance pour ne pas être blessé(e). Tu peux chercher dans les relations quelque chose qu'elles ne peuvent pas donner — une validation, une sécurité, une complétude. Les mêmes dynamiques se répètent avec des visages différents.",
    pratiques: [
      { titre: "Identifier ses patterns relationnels", texte: "Pense aux relations qui t'ont le plus marqué(e) — amoureuses, amicales, familiales. Y a-t-il des points communs ? Des dynamiques qui se répètent ? Le même type de personne, le même type de conflit, le même dénouement ? Écrire ces patterns sans se juger est un premier pas pour ne plus les répéter inconsciemment." },
      { titre: "La relation à soi d'abord", texte: "La relation que tu as avec toi-même se reproduit dans tes relations aux autres. Comment tu te parles à toi-même en privé ? Avec bienveillance ou dureté ? Est-ce que tu t'accordes le même soin que tu accordes aux gens que tu aimes ? Écris une façon dont tu pourrais être plus doux/douce avec toi-même aujourd'hui." },
      { titre: "Dire une vérité douce", texte: "Y a-t-il quelque chose que tu n'as jamais dit à quelqu'un de proche — une gratitude, une limite, un besoin — parce que tu ne savais pas comment le formuler ? Aujourd'hui, trouve une façon de le dire. Pas pour provoquer. Pour que la relation puisse exister dans plus de vérité." },
    ],
  },
  {
    id: "deuil",
    theme: "Deuil & Perte",
    couleur: "#9898C8",
    intro: "Le deuil ne concerne pas seulement la mort. On fait le deuil d'une relation, d'une version de soi, d'un rêve non réalisé, d'une vie qu'on aurait pu avoir. Le deuil est le processus par lequel on apprend à continuer de vivre avec une absence. Il ne suit pas de calendrier. Il ne se fait pas dans l'ordre. Il arrive souvent en vagues — on croit être sorti(e) de quelque chose et ça revient, différemment. La société nous demande souvent de faire le deuil vite, de rebondir, d'aller de l'avant. Mais le deuil a besoin de temps et d'espace.",
    dansLeFlux: "Quand le deuil est traversé — jamais complètement, mais suffisamment — on peut penser à ce qu'on a perdu avec une forme de paix mêlée de tristesse. La douleur est là mais elle ne paralyse plus. On arrive à tenir les deux — la perte et la vie qui continue. On intègre l'absence dans sa vie plutôt que de lutter contre elle.",
    quandCaResiste: "Quand le deuil est bloqué, la perte reste un trou béant. On peut l'éviter — ne jamais en parler, ne pas regarder certaines photos, changer de sujet. Ou on peut s'y perdre — rester dans la douleur comme si en sortir signifiait trahir. Il peut y avoir de la culpabilité d'aller mieux, ou au contraire une anesthésie émotionnelle.",
    pratiques: [
      { titre: "Nommer ce qui a été perdu", texte: "Parfois on porte un deuil sans l'avoir nommé. Pas juste une personne ou une relation — mais ce qu'elle représentait. La sécurité. L'avenir imaginé. La version de soi qu'on était avec elle. Écris précisément ce que tu as perdu — au-delà de la surface." },
      { titre: "Laisser de la place à la tristesse", texte: "On essaie souvent de remplacer la tristesse par quelque chose — l'activité, la distraction, la colère. Aujourd'hui, permets-toi d'être triste, sans rien faire de cette tristesse. Dix minutes. Juste la laisser exister sans la combattre ni la nourrir." },
      { titre: "Ce que tu gardes", texte: "Faire le deuil ne signifie pas effacer. Certaines choses de ce qu'on a perdu peuvent rester — un enseignement, une façon d'aimer, une valeur transmise. Qu'est-ce que tu gardes de ce que tu as perdu ? Pas pour minimiser la perte — pour honorer ce qui a existé." },
    ],
  },
  {
    id: "identite",
    theme: "Identité & Soi",
    couleur: "#98C898",
    intro: "L'identité est moins fixe qu'on ne le croit. On se construit en permanence — à travers les expériences, les rencontres, les crises, les transformations. Ce qu'on appelle 'soi' est un ensemble de récits qu'on se raconte et qu'on raconte aux autres. Certains de ces récits sont vrais. D'autres sont hérités — de la famille, de la culture, de blessures anciennes. La question 'qui suis-je vraiment ?' n'a pas de réponse définitive. Mais se la poser honnêtement est l'un des actes les plus courageux qu'on puisse faire.",
    dansLeFlux: "Quand tu es en accord avec toi-même, tu n'as pas besoin de beaucoup d'approbation extérieure pour te sentir réel(le). Tu peux changer d'avis sans te sentir incohérent(e). Tu peux admettre tes contradictions sans en faire une crise. Tu sais ce qui compte pour toi — même si tu ne sais pas toujours comment le vivre.",
    quandCaResiste: "Quand l'identité est fragile, le regard des autres prend trop de place. Tu changes de version de toi-même selon les contextes et tu t'y perds. Tu peux te sentir étranger(e) à toi-même — comme si ta vie était jouée par quelqu'un d'autre. Il y a souvent un décalage entre qui tu prétends être et ce que tu ressens vraiment.",
    pratiques: [
      { titre: "Les identités que je joue", texte: "Liste les rôles que tu joues dans ta vie — professionnel(le), parent, conjoint(e), enfant, ami(e). Pour chacun, demande-toi : est-ce que ce rôle me ressemble ? Ou est-ce que je le joue pour correspondre à ce qu'on attend de moi ?" },
      { titre: "Ce qui reste quand on enlève tout", texte: "Si tu n'avais plus ton titre, ton travail, tes relations, tes possessions — qui serais-tu ? Pas pour créer une peur — pour toucher ce qui est toi indépendamment des circonstances. Écris trois choses qui te définissent sans aucun contexte extérieur." },
      { titre: "Une croyance sur moi à revisiter", texte: "Quelle est une chose que tu crois fermement sur toi-même — une limite, un défaut, une incapacité — depuis très longtemps ? D'où vient cette croyance ? Est-ce que tu as des preuves récentes qu'elle est encore vraie ?" },
    ],
  },
  {
    id: "emotions",
    theme: "Colère & Émotions",
    couleur: "#C87848",
    intro: "Les émotions ne sont pas des ennemies. Ce sont des informations. La colère dit qu'une limite a été franchie, ou qu'une injustice a eu lieu. La tristesse dit qu'une perte mérite d'être reconnue. La peur dit qu'un danger — réel ou perçu — est présent. Quand on apprend à écouter les émotions au lieu de les combattre ou de les subir, elles deviennent des guides. Le problème n'est pas d'avoir des émotions intenses — c'est de ne pas savoir quoi en faire. Ce qu'on n'exprime pas s'accumule. Ce qu'on n'exprime pas finit toujours par trouver une sortie — souvent au mauvais moment.",
    dansLeFlux: "Quand tu es en bonne relation avec tes émotions, tu les ressens sans être submergé(e). Tu peux nommer ce que tu vis — 'je suis triste', 'je suis en colère' — sans t'y fondre entièrement. Tu laisses passer ce qui doit passer. Tu exprimes ce qui doit être dit, au bon moment et de façon adaptée.",
    quandCaResiste: "Quand le rapport aux émotions est difficile, deux extrêmes sont possibles. Soit tout sort de façon incontrôlée — des réactions disproportionnées qui laissent des dégâts. Soit rien ne sort — une anesthésie, une façade de calme qui cache une tension permanente. Les deux sont épuisants.",
    pratiques: [
      { titre: "Nommer l'émotion précisément", texte: "Au lieu de 'je ne vais pas bien', essaie d'être plus précis(e). Est-ce de la tristesse, de la déception, de la honte, de l'anxiété, de la colère ? Plus on nomme avec précision, moins l'émotion est envahissante. Aujourd'hui, quand une émotion se présente, prends le temps de la nommer." },
      { titre: "La colère comme information", texte: "La prochaine fois que tu ressens de la colère, avant d'agir, pose-toi cette question : qu'est-ce que cette colère protège ? Une valeur ? Une limite ? Un besoin non reconnu ? La colère pointe toujours vers quelque chose d'important. L'écouter avant de la décharger change tout." },
      { titre: "Libérer par le corps", texte: "Certaines émotions ne se pensent pas — elles se bougent. Une marche rapide, un cri dans un endroit isolé, écrire vite sans réfléchir, pleurer sans retenue. Trouve une façon physique de laisser sortir ce qui est comprimé. Le corps est souvent plus efficace que la tête pour traiter les émotions." },
    ],
  },
  {
    id: "ambition",
    theme: "Ambition & Chemin",
    couleur: "#C8A840",
    intro: "L'ambition a mauvaise réputation. On l'associe à l'orgueil, à l'arrivisme, à l'oubli des autres. Mais il y a une ambition saine — celle qui vient du désir de se dépasser, de contribuer, de construire quelque chose qui a du sens. Cette ambition-là n'écrase pas les autres. Elle pousse vers l'avant. La difficulté, c'est de distinguer l'ambition qui vient de soi — de ce qu'on veut vraiment — de celle qui vient du regard des autres, de la peur d'être insuffisant(e), de la compétition pour des standards qu'on n'a pas choisis.",
    dansLeFlux: "Quand l'ambition est saine, tu travailles avec énergie sans te perdre dans le résultat. Tu prends des risques. Tu acceptes les échecs comme des informations. Tu n'as pas besoin que les autres valident ton chemin pour continuer à avancer. Il y a un alignement entre ce que tu construis et ce que tu es.",
    quandCaResiste: "Quand l'ambition est mal orientée, elle épuise sans nourrir. Tu cours sans savoir vers quoi exactement. Tu atteins des objectifs et tu ne te sens pas mieux. Ou au contraire, tu as peur de vouloir trop — d'être jugé(e) arrogant(e), de décevoir si tu essaies. L'ambition se transforme en procrastination ou en perfectionnisme paralysant.",
    pratiques: [
      { titre: "Distinguer 'je veux' et 'je dois'", texte: "Liste trois choses que tu veux accomplir. Pour chacune, demande-toi honnêtement : est-ce que c'est ce que je veux, moi — ou ce que je crois devoir vouloir pour être reconnu(e), aimé(e), légitime ? La différence change tout à la qualité de l'effort." },
      { titre: "L'ambition à petite échelle", texte: "L'ambition ne concerne pas que les grands projets. Elle s'applique aussi à devenir plus patient(e), plus présent(e), plus honnête. Quelle est une qualité que tu veux cultiver — pas pour les autres, pour toi ? Qu'est-ce que tu pourrais faire aujourd'hui pour avancer d'un centimètre dans cette direction ?" },
      { titre: "Ce que tu construis vraiment", texte: "Dans dix ans, qu'est-ce que tu veux avoir construit — pas en termes de carrière ou de biens, mais en termes de personne ? Qui veux-tu être devenu(e) ? Écrire cette vision aide à recalibrer les choix quotidiens." },
    ],
  },
  {
    id: "corps",
    theme: "Corps & Présence",
    couleur: "#78A878",
    intro: "On vit souvent dans sa tête en oubliant qu'on a un corps. Le corps n'est pas un véhicule pour transporter le cerveau — il est une intelligence en lui-même. Il stocke les émotions, garde la mémoire des expériences, envoie des signaux permanents qu'on ignore souvent. Revenir au corps, c'est revenir au présent. Les pensées nous projettent dans le passé ou dans le futur. Le corps, lui, est toujours ici, maintenant. La présence — ce mot qu'on utilise tellement — commence par habiter son corps.",
    dansLeFlux: "Quand tu habites ton corps, tu remarques ses signaux — la fatigue avant l'épuisement, la tension avant la douleur, le malaise avant la rupture. Tu manges quand tu as faim et tu t'arrêtes quand tu es rassasié(e). Tu dors parce que tu ressens le besoin de dormir. Il y a une écoute naturelle qui s'est établie.",
    quandCaResiste: "Quand le lien avec le corps est coupé, on peut se surprendre à ne pas avoir mangé depuis des heures sans s'en être rendu compte. À ne pas ressentir la fatigue jusqu'à l'effondrement. À ignorer des douleurs chroniques parce qu'on est 'trop occupé(e)'. Le corps finit toujours par se rappeler à notre bon souvenir — souvent avec fracas.",
    pratiques: [
      { titre: "Trois respirations conscientes maintenant", texte: "Pose ce que tu fais. Prends trois respirations longues et lentes. Sur chaque expiration, relâche un peu les épaules, la mâchoire, les mains. C'est tout. Ce simple geste, répété plusieurs fois par jour, recalibre le système nerveux." },
      { titre: "Scanner son corps", texte: "Ferme les yeux. Parcours ton corps de la tête aux pieds, lentement. Où y a-t-il de la tension ? De la douleur ? De la légèreté ? Sans chercher à changer quoi que ce soit — juste observer. Le corps a souvent beaucoup à dire quand on lui prête enfin attention." },
      { titre: "Un geste de soin pour son corps aujourd'hui", texte: "Fais quelque chose aujourd'hui uniquement pour ton corps — pas pour perdre du poids, pas pour performer, pas pour l'apparence. Un bain chaud, une marche lente, un repas préparé avec soin, une sieste. Quelque chose qui dit à ton corps : je t'entends et je prends soin de toi." },
    ],
  },
  {
    id: "gratitude",
    theme: "Gratitude & Joie",
    couleur: "#C8C840",
    intro: "La gratitude n'est pas de l'optimisme forcé ou du déni de la difficulté. C'est une faculté d'attention — la capacité à remarquer ce qui est là, maintenant, qui a de la valeur. Notre cerveau est câblé pour le négatif — il enregistre les problèmes avec plus d'intensité que les bonnes choses. La gratitude est une pratique qui rééquilibre cette asymétrie. Ce n'est pas ignorer ce qui ne va pas — c'est refuser que ça soit la seule chose qu'on voit. La joie, elle, est différente du bonheur. Le bonheur dépend des circonstances. La joie est plus profonde — elle peut coexister avec la douleur.",
    dansLeFlux: "Quand la gratitude est cultivée, les petites choses retrouvent leur poids. Un café le matin, une conversation qui fait du bien, la lumière à une heure particulière. Il y a une richesse ordinaire qu'on arrête de prendre pour acquise. La joie devient accessible — pas permanente, mais accessible.",
    quandCaResiste: "Quand la gratitude est absente, tout semble insuffisant. On atteint quelque chose et on regarde déjà vers la prochaine étape. On compare — toujours avec ceux qui ont plus, jamais avec ceux qui ont moins. Il y a un fond d'insatisfaction chronique que rien ne comble vraiment.",
    pratiques: [
      { titre: "Trois choses précises aujourd'hui", texte: "Ce soir, note trois choses précises pour lesquelles tu es reconnaissant(e) aujourd'hui. Pas génériques — précises. Pas 'ma santé' mais 'ce moment ce matin où je me suis senti(e) bien dans mon corps'. La précision active vraiment la gratitude. La généralité l'endort." },
      { titre: "Ce qu'on prendrait pour acquis", texte: "Pense à quelque chose dans ta vie que tu tiens pour acquis — une relation, une capacité, un confort. Imagine un moment que tu ne l'avais plus. Comment est-ce que ça change ta façon de le regarder maintenant ?" },
      { titre: "Dire merci vraiment", texte: "Y a-t-il quelqu'un dans ta vie à qui tu n'as jamais dit — vraiment dit — à quel point sa présence ou ses actes ont compté pour toi ? Aujourd'hui, dis-le. Un message, un appel, une conversation. Pas pour que ce soit parfait — pour que ce soit dit." },
    ],
  },
  {
    id: "solitude",
    theme: "Solitude & Intériorité",
    couleur: "#7898B8",
    intro: "La solitude a deux visages. Il y a la solitude subie — celle qui fait mal, celle de l'isolement, du sentiment de ne pas être vu. Et il y a la solitude choisie — celle du retrait volontaire, du silence habité, de la présence à soi. La deuxième est une ressource rare. Dans un monde qui valorise la connectivité permanente, savoir être seul(e) sans se fuir est presque un art. L'intériorité, c'est la capacité à avoir une vie intérieure riche — des pensées qui ne dépendent pas d'une stimulation externe, un espace en soi qu'on habite avec plaisir.",
    dansLeFlux: "Quand tu es à l'aise avec la solitude, le silence ne t'angoisse pas. Tu peux passer une soirée seul(e) sans avoir besoin de te distraire en permanence. Tu trouves dans ce temps avec toi-même une ressource — des idées, du repos, une forme de clarté. Tu n'attends pas des autres qu'ils remplissent un vide que tu peux habiter toi-même.",
    quandCaResiste: "Quand la solitude est difficile, le silence devient angoissant. On remplit compulsivement — les écrans, le bruit, les activités, les relations. On peut avoir peur de ce qu'on trouverait si on restait vraiment seul(e) avec soi-même. Ou au contraire, se replier dans une solitude défensive pour ne pas risquer d'être blessé(e).",
    pratiques: [
      { titre: "Vingt minutes sans écran", texte: "Aujourd'hui, passe vingt minutes seul(e) sans aucun écran et sans rien faire d'utile. Pas de méditation guidée — juste toi. Observe ce qui se passe — les pensées qui arrivent, l'inconfort éventuel, ce qui se détend petit à petit." },
      { titre: "Cultiver une pratique solitaire", texte: "Quelle est une chose que tu pourrais faire régulièrement, seul(e), juste pour le plaisir ? Marcher, dessiner, lire, cuisiner sans but particulier. Quelque chose qui n'a pas besoin d'audience, pas besoin d'être partagé. Juste pour toi." },
      { titre: "Ce que la solitude me dit", texte: "La prochaine fois que tu te retrouves seul(e) et que quelque chose d'inconfortable émerge — une pensée, une émotion, une inquiétude — plutôt que de la fuir, reste avec elle quelques minutes. Qu'est-ce qu'elle a à dire ?" },
    ],
  },
  {
    id: "liberte",
    theme: "Liberté & Choix",
    couleur: "#78B8C8",
    intro: "La liberté est moins une question de circonstances que d'orientation intérieure. On peut être objectivement très libre et se sentir prisonnier de ses peurs, de ses habitudes, du regard des autres. Et on peut traverser des contraintes réelles tout en gardant une liberté intérieure profonde. Les choix qu'on fait — même les petits — construisent qui on est. Ce qu'on ne choisit pas finit souvent par nous choisir. La difficulté, c'est que la liberté fait peur. Choisir vraiment, c'est renoncer à d'autres possibles. C'est prendre la responsabilité de sa vie.",
    dansLeFlux: "Quand tu vis librement, tu fais des choix qui correspondent à ce que tu es — même quand ils sont difficiles, même quand ils déçoivent certains. Tu assumes la responsabilité de tes décisions sans chercher à blâmer les circonstances. Tu peux changer de direction sans te justifier à l'infini.",
    quandCaResiste: "Quand la liberté est bridée — souvent par soi-même — tu attends la permission des autres pour agir. Tu remets les décisions importantes à plus tard. Tu te retrouves à vivre une vie qui n'est pas tout à fait la tienne, construite par défaut plutôt que par choix. Il y a un sentiment diffus de passer à côté de quelque chose.",
    pratiques: [
      { titre: "Un choix que je remets", texte: "Y a-t-il une décision importante que tu reportes depuis trop longtemps ? Pas parce que tu n'as pas l'information — mais parce que choisir t'effraie. Nomme-la. Qu'est-ce que tu perdrais en choisissant chaque option ? Qu'est-ce que tu perds à ne pas choisir ?" },
      { titre: "Ce que j'aurais fait si ce n'était pas pour les autres", texte: "Pense à une décision récente — professionnelle, personnelle, relationnelle. Est-ce que tu l'as prise pour toi, ou pour éviter la désapprobation de quelqu'un ? Il n'y a pas de bonne réponse. Juste voir honnêtement." },
      { titre: "Un petit acte de liberté aujourd'hui", texte: "Fais aujourd'hui une chose petite que tu veux faire — pas que tu dois faire, pas pour être productif(ve) ou approuvé(e). Juste parce que tu en as envie. C'est ça, entraîner la liberté." },
    ],
  },
  {
    id: "transmission",
    theme: "Transmission & Héritage",
    couleur: "#A8C878",
    intro: "Tout le monde transmet quelque chose — qu'on le veuille ou non. Des valeurs, des façons d'aimer, des peurs, des forces. La question n'est pas si on transmet, mais quoi. Ce qu'on a reçu de nos parents et grands-parents — leur sagesse, leurs blessures, leurs silences — vit en nous, souvent à notre insu. Prendre conscience de cet héritage permet de choisir ce qu'on garde et ce qu'on pose. La transmission consciente, c'est décider délibérément de ce qu'on veut laisser derrière soi — dans ses enfants, ses élèves, ses proches, son œuvre.",
    dansLeFlux: "Quand tu vis en lien conscient avec la transmission, tu reconnais ce que tu as reçu — le bon et le moins bon — sans idéaliser ni condamner. Tu fais des choix dans tes relations qui correspondent à ce que tu veux transmettre. Il y a un sens de la continuité, d'appartenir à quelque chose qui te précède et te survivra.",
    quandCaResiste: "Quand le rapport à la transmission est difficile, on peut répéter des patterns familiaux sans s'en rendre compte — la même distance émotionnelle, la même façon de gérer les conflits, les mêmes silences. Ou au contraire, on peut rejeter tout ce qui vient de sa famille — et se retrouver sans ancrage.",
    pratiques: [
      { titre: "Ce que j'ai reçu de ma famille", texte: "Fais deux colonnes. Dans la première, écris ce que tu as reçu de positif de ta famille — des valeurs, des façons d'être, des forces. Dans la deuxième, ce qui t'a été transmis et que tu veux transformer. Sans jugement — juste voir ce qui a été hérité et ce qui peut évoluer." },
      { titre: "Ce que je veux transmettre", texte: "Si tu pouvais transmettre une seule chose à ceux qui viennent après toi — enfants, neveux, élèves, futurs lecteurs — qu'est-ce que ce serait ? Une valeur, une leçon, une façon d'être. Écris-la comme si tu l'adressais à quelqu'un de précis." },
      { titre: "Briser un cycle", texte: "Y a-t-il quelque chose dans ta famille que tu as décidé de ne pas reproduire ? Une façon de communiquer, une relation à l'argent, une gestion de la colère ? Comment tu fais — concrètement — pour ne pas le répéter ?" },
    ],
  },
  {
    id: "argent",
    theme: "Argent & Rapport au manque",
    couleur: "#C8B040",
    intro: "L'argent est rarement juste une question d'argent. Il est chargé de tout ce qu'on lui projette — la sécurité, la valeur personnelle, la liberté, le pouvoir, la honte. Ce qu'on pense de l'argent vient souvent de l'enfance — de ce qu'on a vu, entendu, vécu dans sa famille. Le manque réel ou le manque perçu, l'abondance culpabilisée ou l'aisance tenue pour acquise. Notre rapport à l'argent est un révélateur fidèle de nos croyances les plus profondes sur ce qu'on mérite, ce qu'on vaut, ce qui est possible pour nous.",
    dansLeFlux: "Quand le rapport à l'argent est sain, il est un outil — ni une obsession ni une source de honte. Tu peux parler d'argent sans te sentir sale ou vulnérable. Tu fais des choix financiers alignés avec tes valeurs. Tu n'attends pas l'abondance pour commencer à vivre.",
    quandCaResiste: "Quand le rapport à l'argent est difficile, il prend une place disproportionnée. Soit la peur du manque est permanente — même quand la situation objective ne le justifie pas. Soit il y a une relation conflictuelle à la richesse — une culpabilité d'avoir, ou une rage de ne pas avoir assez. Soit les décisions financières sont régies par l'impulsion ou l'évitement.",
    pratiques: [
      { titre: "Mes croyances héritées sur l'argent", texte: "Quelles phrases entendais-tu sur l'argent dans ta famille ? 'L'argent ne fait pas le bonheur', 'les riches sont malhonnêtes', 'on n'est pas fait pour ça', 'l'argent c'est sale'. Lesquelles guident encore tes décisions aujourd'hui, à ton insu ?" },
      { titre: "Ce que l'argent représente pour moi", texte: "Complète cette phrase honnêtement : 'Pour moi, avoir de l'argent signifie...' Puis : 'Ne pas en avoir assez signifie...' Les réponses révèlent souvent ce que l'argent protège ou menace dans notre image de nous-même." },
      { titre: "Un geste d'abondance", texte: "L'abondance n'est pas réservée aux riches. Elle est une posture. Fais aujourd'hui un geste généreux — avec ton temps, ton argent, ton attention. Sans attendre le bon moment, sans que ce soit parfait. Observer ce que ça fait en toi." },
    ],
  },
  {
    id: "spiritualite",
    theme: "Spiritualité & Foi",
    couleur: "#B8A8C8",
    intro: "La spiritualité ne se réduit pas à la religion, même si elles se croisent souvent. C'est le rapport qu'on entretient avec ce qui dépasse soi — une force, un sens, une transcendance, peu importe le nom qu'on lui donne. Même les personnes qui se disent athées ont souvent une forme de spiritualité — dans leur rapport à la nature, à l'art, à l'amour, à ce qui les dépasse. La foi est différente de la certitude. On peut avoir une foi profonde et douter. Les deux coexistent souvent dans les gens les plus honnêtes.",
    dansLeFlux: "Quand la vie spirituelle est nourrie, il y a une paix qui ne dépend pas des circonstances. Une capacité à tenir l'incertitude sans s'effondrer. Un sens qui traverse les épreuves. Pas une explication à tout — mais une confiance dans quelque chose de plus grand.",
    quandCaResiste: "Quand la dimension spirituelle est négligée ou blessée — par une religion vécue comme traumatisme, par une perte de foi, par un deuil qui a tout remis en question — il peut y avoir un vide difficile à nommer. Un manque de sens, une sécheresse intérieure, un sentiment de marcher sans direction.",
    pratiques: [
      { titre: "Ce en quoi je crois vraiment", texte: "Au-delà des étiquettes, qu'est-ce que tu crois vraiment sur la vie, sur ce qui existe au-delà de ce qu'on voit, sur ce qui compte ? Écris-le sans te censurer, sans chercher à être cohérent(e) avec quoi que ce soit. Juste ta vérité du moment." },
      { titre: "Un acte de transcendance ordinaire", texte: "La spiritualité vit dans les petits gestes autant que dans les grands. Aujourd'hui, fais quelque chose avec une qualité d'attention totale — marcher, préparer un repas, écouter quelqu'un. Laisse ce moment avoir une qualité sacrée, même ordinaire." },
      { titre: "Ce qui a mis ma foi à l'épreuve", texte: "Y a-t-il eu un moment dans ta vie qui a profondément ébranlé ta façon de voir le monde — une perte, une injustice, une désilllusion ? Qu'est-ce que tu as reconstruit à partir de là ? Qu'est-ce que cette épreuve t'a appris sur ce qui tient vraiment ?" },
    ],
  },
  {
    id: "confiance",
    theme: "Confiance & Trahison",
    couleur: "#C8A098",
    intro: "La confiance est fragile et précieuse. Elle se construit lentement, se brise vite. Et une fois brisée, elle laisse des traces qui vont bien au-delà de la relation concernée — elle peut contaminer la façon dont on regarde toutes les relations qui suivent. La trahison fait mal parce qu'elle touche à quelque chose de fondamental : le sentiment qu'on peut compter sur les autres, que le monde est globalement sûr. Reconstruire la confiance — en l'autre, en soi, dans la vie — est un travail long et délicat.",
    dansLeFlux: "Quand la confiance est présente, tu peux être vulnérable sans te sentir en danger. Tu donnes ta confiance progressivement, en observant les actes plutôt qu'en espérant. Tu peux faire confiance à ta propre perception — tu sais quand quelqu'un est digne de confiance et quand il ne l'est pas.",
    quandCaResiste: "Quand la confiance est blessée, deux postures sont possibles. Soit on devient hyper-vigilant(e) — on cherche les signes de trahison partout, on se protège avant même que la menace existe. Soit on continue à faire confiance aveuglément, en niant les signaux d'alarme parce que la désillusion fait trop mal.",
    pratiques: [
      { titre: "Ce que la trahison a changé", texte: "Pense à une trahison importante dans ta vie. Qu'est-ce qu'elle a changé dans ta façon de te rapporter aux autres ? Est-ce que cette protection que tu as construite est encore adaptée aujourd'hui, ou est-ce qu'elle t'empêche de quelque chose ?" },
      { titre: "Faire confiance à sa propre perception", texte: "Il y a des gens qui ont perdu confiance en leur propre jugement après une trahison. Ils se demandent : comment j'ai pu ne pas voir ? Mais la perception n'est pas un échec — c'est l'autre qui a trahi. Écris trois fois où ton instinct avait raison sur quelqu'un ou quelque chose." },
      { titre: "Un pas vers la confiance", texte: "Y a-t-il quelqu'un dans ta vie qui mérite plus de confiance que tu ne lui en accordes — à cause d'une blessure passée qui ne lui appartient pas ? Quel serait un petit geste pour lui ouvrir un peu plus de place ?" },
    ],
  },
  {
    id: "desir",
    theme: "Désir & Vitalité",
    couleur: "#C87860",
    intro: "Le désir est le signal de la vie. Quand on ne désire plus rien, c'est souvent le signe qu'on s'est éteint quelque part. Les désirs ont mauvaise réputation — on les associe à l'excès, à l'insatisfaction, à la faiblesse. Mais le désir n'est pas seulement une pulsion à satisfaire. C'est aussi une direction — il dit quelque chose sur ce qu'on est, sur ce qui compte, sur ce qui nous fait nous sentir vivant(e). La vitalité, elle, c'est cette énergie de fond qui permet d'être pleinement là — dans le corps, dans les relations, dans ce qu'on crée.",
    dansLeFlux: "Quand le désir et la vitalité sont présents, tu te lèves avec quelque chose qui t'attend. Pas nécessairement de l'excitation — parfois juste un mouvement vers. Tu ressens du plaisir dans ce que tu fais. Tu as de l'énergie pour les choses qui comptent. Il y a une appétence pour la vie.",
    quandCaResiste: "Quand le désir s'éteint, tout devient effort. Rien ne semble valoir vraiment la peine. La fatigue est profonde — pas physique mais existentielle. Il peut y avoir un sentiment de vide, d'ennui chronique, d'une vie qui se passe sans vraiment y participer.",
    pratiques: [
      { titre: "Ce qui me fait me sentir vivant(e)", texte: "Fais la liste de cinq choses — activités, moments, personnes, lieux — qui te font te sentir vraiment vivant(e). Pas ce qui est sage ou raisonnable. Ce qui allume quelque chose. Observe si ces choses sont présentes dans ta vie en ce moment." },
      { titre: "Un désir que j'ai mis de côté", texte: "Y a-t-il quelque chose que tu désirais — faire, être, vivre — et que tu as mis de côté il y a longtemps, pour des raisons qui semblaient valables ? Est-ce qu'il en reste quelque chose ? Est-ce qu'il y a une façon de le nourrir différemment aujourd'hui ?" },
      { titre: "Nourrir la vitalité concrètement", texte: "La vitalité ne tombe pas du ciel. Elle se nourrit — par le sommeil, par le mouvement, par ce qu'on mange, par ce qu'on regarde et lit, par les gens qu'on fréquente. Identifie une chose qui te vide systématiquement et une chose qui te recharge. Qu'est-ce que tu pourrais ajuster ?" },
    ],
  },
  {
    id: "racines",
    theme: "Racines & Origines",
    couleur: "#A89878",
    intro: "Les racines ne sont pas un destin — elles sont un point de départ. Ce qu'on a reçu de sa culture, de sa terre, de sa famille, de son histoire collective forge une partie de qui on est, même quand on cherche à s'en éloigner. Comprendre ses origines — sans les idéaliser ni les renier — permet de se situer. De savoir d'où on vient pour mieux choisir où on va. Parfois les racines sont une source de fierté et de force. Parfois elles sont une blessure à traverser. Souvent les deux.",
    dansLeFlux: "Quand tu es en paix avec tes origines, tu peux en parler sans te justifier ni te défendre. Tu reconnais ce qu'elles t'ont donné sans en être prisonnier(e). Il y a une forme d'ancrage — tu sais d'où tu viens, ce qui te fonde, même si tu as beaucoup évolué.",
    quandCaResiste: "Quand les origines sont difficiles, il peut y avoir de la honte — sociale, culturelle, familiale. Ou une rupture totale, un rejet de tout ce qui vient 'd'avant'. Ou au contraire une identité trop rigide, figée dans ses origines, qui empêche d'évoluer.",
    pratiques: [
      { titre: "Ce que mes origines m'ont donné", texte: "Écris trois choses que ta culture, ta famille, ta terre d'origine t'ont données — une valeur, une façon d'être, une force. Pas ce qu'on t'a dit devoir valoriser. Ce que tu reconnais vraiment comme une richesse." },
      { titre: "Ce que j'ai choisi de garder", texte: "Parmi tout ce que tu as reçu de tes origines, qu'est-ce que tu as consciemment choisi de garder dans ta façon de vivre ? Et qu'est-ce que tu as choisi de transformer ou de laisser ?" },
      { titre: "Une histoire que tu portes", texte: "Y a-t-il une histoire dans ta famille ou dans ton histoire collective — une migration, une perte, un silence — qui t'a marqué(e) même si tu n'en as pas été directement témoin ? Comment cette histoire vit-elle en toi ?" },
    ],
  },
  {
    id: "vocation",
    theme: "Travail & Vocation",
    couleur: "#98B8C8",
    intro: "On confond souvent travail et vocation. Le travail est ce qu'on fait pour vivre. La vocation est ce pour quoi on semble fait(e) — une façon d'être dans le monde qui correspond profondément à ce qu'on est. On peut avoir un travail qui n'est pas une vocation et trouver sa vocation ailleurs. On peut avoir la chance que les deux se rejoignent. Le problème, c'est qu'on confond souvent 'ce pour quoi je suis bon(ne)' avec 'ce qui me nourrit vraiment'. Les deux ne sont pas toujours identiques.",
    dansLeFlux: "Quand tu es en lien avec ta vocation, le travail ne semble pas toujours un travail. Il y a une énergie différente — pas l'absence d'effort, mais une qualité de présence. Tu te retrouves dans un état de flux où le temps passe autrement. Ce que tu fais a du sens — pas seulement de l'utilité.",
    quandCaResiste: "Quand le travail est déconnecté de la vocation, il y a une fatigue particulière — pas physique mais existentielle. On peut être performant(e) et vide. On peut réussir et se demander 'pour quoi'. Ou on peut avoir une intuition forte sur sa vocation mais ne pas savoir comment y accéder.",
    pratiques: [
      { titre: "Ce que je ferais gratuitement", texte: "Qu'est-ce que tu ferais si tu n'avais pas besoin d'argent — pas des vacances, mais une activité qui a du sens pour toi ? La réponse n'est pas toujours évidente, mais elle pointe souvent vers quelque chose d'important." },
      { titre: "La différence entre compétence et vocation", texte: "Être bon(ne) à quelque chose ne signifie pas que c'est ce pour quoi on est fait(e). Est-ce qu'il y a des compétences que tu as développées mais qui ne te nourrissent pas vraiment ? Et des choses pour lesquelles tu n'es pas encore expert(e) mais qui t'allument profondément ?" },
      { titre: "Un pas vers l'alignement", texte: "Tu n'as peut-être pas le luxe de tout changer maintenant. Mais y a-t-il un geste — même petit — pour que ta vie professionnelle soit un peu plus en accord avec ce qui compte pour toi ? Une conversation, un projet annexe, une formation, un changement de rôle." },
    ],
  },
  {
    id: "temps",
    theme: "Temps & Vieillissement",
    couleur: "#A8A898",
    intro: "Le temps est la seule ressource qu'on ne peut pas regagner. On le sait — mais rarement on le vit vraiment. On agit comme si on avait tout le temps, jusqu'au moment où on réalise qu'on n'en a pas autant qu'on pensait. Le vieillissement — qu'on commence à percevoir dès la trentaine — est souvent vécu comme une perte. Mais il peut aussi être un gain : de clarté, de discernement, de capacité à choisir ce qui compte vraiment. Ce qu'on appelle la sagesse n'est souvent que ça — savoir utiliser le temps qu'il reste.",
    dansLeFlux: "Quand tu vis bien ton rapport au temps, tu fais des choix qui correspondent à ce qui compte vraiment — pas à ce qui est urgent, pas à ce qui est demandé. Tu peux être présent(e) dans le moment sans constamment te projeter. Tu n'attends pas que 'les conditions soient parfaites' pour commencer à vivre.",
    quandCaResiste: "Quand le rapport au temps est difficile, il y a souvent de la procrastination sur les choses importantes, et de l'agitation sur les choses superficielles. Ou une nostalgie paralysante — toujours regarder en arrière. Ou une anxiété face au futur — une peur de ce qui vient qui empêche d'être là maintenant.",
    pratiques: [
      { titre: "Ce que je mettrais en premier si j'avais moins de temps", texte: "Si tu apprenais que tu avais beaucoup moins de temps devant toi, qu'est-ce que tu mettrais en priorité ? Pas dans ta vie entière — juste cette semaine. Qu'est-ce que ça dit sur ce qui compte vraiment, et sur la façon dont tu organises ton temps en ce moment ?" },
      { titre: "Une lettre à soi dans dix ans", texte: "Écris une lettre à la version de toi dans dix ans. Qu'est-ce que tu voudrais lui dire ? Quelles décisions aimerais-tu avoir prises ? Quelle personne aimerais-tu être devenu(e) ? Cette lettre peut servir de boussole." },
      { titre: "Ce qui durera", texte: "Parmi ce que tu fais en ce moment — travail, relations, projets, habitudes — qu'est-ce qui aura encore du sens dans vingt ans ? Qu'est-ce qui sera oublié ? Cette perspective aide à distinguer ce qui est urgent de ce qui est important." },
    ],
  },
  {
    id: "parentalite",
    theme: "Parentalité",
    couleur: "#A8C8A8",
    intro: "La parentalité est l'une des expériences les plus transformatrices qu'on puisse vivre — qu'on soit parent biologique, beau-parent, ou dans toute forme d'accompagnement d'un enfant. Elle confronte à ses propres blessures d'enfance avec une brutalité parfois inattendue. Elle révèle des ressources insoupçonnées et des limites qu'on n'avait jamais touchées. Être parent, c'est souvent apprendre à donner ce qu'on n'a pas reçu — et parfois, apprendre à recevoir ce qu'on n'a jamais su demander.",
    dansLeFlux: "Quand la parentalité est bien vécue, tu peux être présent(e) pour tes enfants sans te perdre complètement. Tu fais des erreurs sans t'effondrer. Tu poses des limites avec fermeté et bienveillance. Tu vois tes enfants comme ils sont — pas comme des extensions de toi ou des projets à accomplir.",
    quandCaResiste: "Quand la parentalité est difficile, la culpabilité prend souvent toute la place. On se demande si on fait bien, si on fait assez, si on ne fait pas trop. On peut reproduire des schémas de sa propre enfance sans s'en rendre compte. Ou au contraire, réagir si fort contre ces schémas qu'on perd l'équilibre dans l'autre sens.",
    pratiques: [
      { titre: "Ce que je transmets sans le vouloir", texte: "Observe pendant une journée comment tu réagis face à tes enfants ou aux enfants proches de toi. Quelles émotions tu exprimes facilement ? Lesquelles tu caches ? Qu'est-ce que ton comportement leur enseigne — au-delà de ce que tu leur dis ?" },
      { titre: "L'enfant que j'étais", texte: "Qu'est-ce que l'enfant que tu étais aurait eu besoin d'entendre — et qu'on ne lui a pas dit ? Est-ce que tu peux le dire aujourd'hui à un enfant dans ta vie ? Et peut-être aussi te le dire à toi-même ?" },
      { titre: "Prendre soin de soi pour prendre soin des autres", texte: "On ne peut pas donner ce qu'on n'a pas. Qu'est-ce que tu négligences en toi en ce moment — du repos, de la joie, de la présence à toi-même — qui finit par appauvrir ta présence aux autres ? Un geste aujourd'hui pour te nourrir toi." },
    ],
  },
  {
    id: "couple",
    theme: "Couple & Intimité",
    couleur: "#C88898",
    intro: "L'intimité est l'un des territoires les plus exigeants de l'existence humaine. Être vraiment vu(e) par quelqu'un — et choisir de le voir vraiment — demande un courage particulier. Le couple révèle tout : les blessures d'attachement, les peurs de l'abandon ou de l'engloutissement, les besoins qu'on n'a pas appris à formuler. L'amour romantique commence souvent comme une projection — on tombe amoureux d'une image. La vraie intimité commence quand les images s'effacent et qu'on reste quand même.",
    dansLeFlux: "Quand l'intimité est saine, tu peux être vulnérable sans te sentir en danger. Tu exprimes tes besoins sans peur de l'abandon. Tu laisses de la place à l'autre sans te perdre. Les conflits existent mais ils ne menacent pas le lien. Il y a une sécurité qui permet à chacun de grandir.",
    quandCaResiste: "Quand l'intimité est difficile, la distance s'installe — soit physique, soit émotionnelle. On peut être dans la même pièce et complètement séparé(e). Les non-dits s'accumulent. Les ressentiments aussi. Ou au contraire, la fusion est trop grande — on perd ses contours dans la relation.",
    pratiques: [
      { titre: "Ce que je n'ai jamais dit", texte: "Y a-t-il quelque chose que tu n'as jamais dit à ton partenaire — un besoin, une peur, une gratitude profonde, une limite — parce que tu ne savais pas comment le formuler ou parce que tu avais peur de la réaction ? Aujourd'hui, trouve une façon de le dire." },
      { titre: "Mon style d'attachement", texte: "Observe ta façon de réagir quand tu te sens proche de quelqu'un. As-tu tendance à t'approcher ou à fuir quand l'intimité grandit ? À chercher plus de proximité ou à t'étouffer dans la relation ? Ces réflexes viennent de loin. Les reconnaître permet de les choisir plutôt que de les subir." },
      { titre: "Un acte d'intimité aujourd'hui", texte: "L'intimité ne se résume pas à la sexualité. Elle se construit dans les petits gestes — une conversation sans téléphone, une question sincère sur comment l'autre va vraiment, un moment partagé en silence. Fais un geste d'intimité aujourd'hui." },
    ],
  },
  {
    id: "intention",
    theme: "Intention",
    couleur: "#C8A870",
    intro: "L'intention précède l'acte. Pas toujours consciemment — mais toujours. Ce qui motive ce qu'on fait — la peur, l'amour, le besoin de reconnaissance, la conviction — détermine la qualité de l'acte bien plus que l'acte lui-même. Dans la tradition islamique, la niyyah — l'intention — est au cœur de toute action. Un geste identique peut valoir beaucoup ou rien selon l'intention qui le porte. Développer le rapport à l'intention, c'est apprendre à agir depuis un endroit plus authentique — moins réactif, plus choisi.",
    dansLeFlux: "Quand tu vis intentionnellement, tes actes sont cohérents avec ce que tu es. Tu sais pourquoi tu fais ce que tu fais. Tu n'attends pas les circonstances parfaites — tu poses une direction et tu avances. Il y a une qualité de présence dans ce que tu fais, même les choses ordinaires.",
    quandCaResiste: "Quand l'intention est absente ou confuse, on agit par habitude, par peur, pour plaire. On fait des choses et on se retrouve à se demander pourquoi on les a faites. Il peut y avoir un décalage chronique entre ce qu'on dit vouloir et ce qu'on fait réellement.",
    pratiques: [
      { titre: "L'intention derrière un acte répété", texte: "Choisis quelque chose que tu fais régulièrement — travailler dur, être serviable, éviter les conflits. Demande-toi honnêtement : quelle est l'intention derrière cet acte ? Est-ce que cette intention est encore vraie pour toi ?" },
      { titre: "Poser une intention pour la journée", texte: "Avant de commencer ta journée, pose une intention — pas une liste de tâches. Une façon d'être. 'Aujourd'hui je veux être pleinement présent(e).' 'Aujourd'hui je veux agir depuis la générosité plutôt que depuis la peur.' Observe comment ça change l'expérience de la journée." },
      { titre: "Aligner intention et action", texte: "Y a-t-il un domaine de ta vie où tes intentions déclarées et tes actions réelles divergent fortement ? Qu'est-ce qui cause cet écart ? Pas pour te juger — pour voir." },
    ],
  },
  {
    id: "intuition",
    theme: "Intuition",
    couleur: "#9888C8",
    intro: "L'intuition est souvent incomprise. On la confond avec l'irrationnel, avec la superstition, avec l'impulsion. Mais l'intuition est une forme de traitement de l'information — rapide, non consciente, fondée sur l'expérience accumulée. Elle perçoit des patterns que l'analyse consciente n'a pas encore traités. Elle n'est pas infaillible. Mais elle mérite d'être écoutée — surtout quand elle est régulièrement ignorée. La difficulté, c'est qu'on vit dans une culture qui valorise le rationnel et qui traite l'intuition avec méfiance.",
    dansLeFlux: "Quand tu écoutes ton intuition, tu remarques les signaux faibles — un malaise avant que le problème soit visible, un élan vers quelque chose sans savoir pourquoi. Tu fais confiance à ce que tu perçois sans avoir besoin de tout justifier. Tu prends de meilleures décisions — pas toujours, mais souvent.",
    quandCaResiste: "Quand l'intuition est ignorée, tu te retrouves souvent dans des situations où tu te dis 'je savais bien'. Tu te laisses convaincre par des arguments logiques qui vont à l'encontre de ce que tu ressentais. La tête l'emporte toujours sur les autres formes de connaissance.",
    pratiques: [
      { titre: "Le journal de l'intuition", texte: "Pendant une semaine, note chaque fois que tu ressens quelque chose avant de pouvoir l'expliquer — une résistance, un élan, un malaise. Note aussi ce qui se passe ensuite. L'intuition se renforce quand on lui prête attention." },
      { titre: "La décision au premier souffle", texte: "Pour une décision peu importante, décide en dix secondes — avec ton premier ressenti, sans délibérer. Observe comment tu te sens après. Était-ce juste ? L'intuition s'entraîne comme un muscle." },
      { titre: "Distinguer intuition et peur", texte: "L'intuition et la peur peuvent se ressembler — toutes deux créent un signal d'alarme. La différence : la peur parle en termes de 'et si ça se passe mal', l'intuition pointe vers quelque chose de précis sans catastrophisme. La prochaine fois que tu ressens un signal fort, demande-toi : est-ce une information ou une anxiété ?" },
    ],
  },
  {
    id: "instinct",
    theme: "Instinct",
    couleur: "#C89068",
    intro: "L'instinct est encore plus fondamental que l'intuition. C'est la réponse du corps — immédiate, pré-consciente, ancrée dans la survie. Il se manifeste dans la tension musculaire avant le danger, dans l'élan vers quelqu'un dès la première rencontre, dans le recul viscéral face à une situation. Les sociétés modernes ont appris à ignorer l'instinct — à le domestiquer, à lui préférer le calcul. Mais le corps garde une sagesse que l'esprit ne possède pas.",
    dansLeFlux: "Quand tu es en lien avec tes instincts, ton corps est un allié — il t'informe, te protège, te guide. Tu remarques quand une situation crée de la tension avant même de comprendre pourquoi. Tu fais confiance aux réactions premières sans les systématiquement analyser.",
    quandCaResiste: "Quand l'instinct est coupé, on se retrouve dans des situations dangereuses ou inconfortables qu'on aurait pu éviter — le corps avait signalé, mais on n'écoutait pas. Il peut y avoir une dissociation — ne pas ressentir les signaux d'alarme physiques, agir contre son propre bien-être sans le réaliser.",
    pratiques: [
      { titre: "Ce que mon corps a su avant moi", texte: "Rappelle-toi une situation où ton corps a réagi — tension, malaise, élan, recul — avant que ta tête comprenne quoi que ce soit. Qu'est-ce qu'il signalait ? Est-ce qu'il avait raison ?" },
      { titre: "Scanner les tensions avant une décision", texte: "Avant une décision importante, ferme les yeux et imagine chaque option. Observe ce que ton corps fait — où apparaît la tension, où vient la légèreté. Ce n'est pas la seule information à prendre en compte, mais c'en est une précieuse." },
      { titre: "Respecter un non corporel", texte: "Y a-t-il quelque chose dans ta vie que ton corps rejette — une situation, une relation, une habitude — et que tu continues malgré tout parce que ta tête trouve de bonnes raisons ? Qu'est-ce que ça coûte d'ignorer ce signal ?" },
    ],
  },
  {
    id: "courage",
    theme: "Courage",
    couleur: "#C87850",
    intro: "Le courage n'est pas l'absence de peur. C'est ce qu'on fait en présence de la peur. Les personnes courageuses ont peur — elles agissent quand même. Le courage ordinaire est souvent invisibilisé : dire la vérité dans une conversation difficile, poser une limite, commencer quelque chose sans garantie de succès, demander de l'aide. Ces actes ne font pas les premières pages. Mais ils construisent une vie. La peur n'est pas un obstacle à contourner — c'est un signal à interroger.",
    dansLeFlux: "Quand le courage est présent, tu agis malgré l'incertitude. Tu dis ce que tu penses sans avoir besoin que tout le monde soit d'accord. Tu commences des choses sans attendre d'être prêt(e). Tu assumes les conséquences de tes choix. Il y a une dignité dans la façon dont tu te tiens.",
    quandCaResiste: "Quand le courage manque, la procrastination s'installe sur les choses importantes. On attend le bon moment qui ne vient jamais. On reporte les conversations difficiles jusqu'à ce qu'elles deviennent des crises. On s'adapte aux attentes des autres pour éviter le conflit — et on perd peu à peu sa propre direction.",
    pratiques: [
      { titre: "La chose que je reporte par peur", texte: "Nomme une chose que tu sais que tu dois faire ou dire — et que tu reportes. Pas parce que tu ne sais pas comment. Parce que ça fait peur. Qu'est-ce qui se passerait vraiment si tu le faisais ? Et qu'est-ce qui se passe si tu continues à ne pas le faire ?" },
      { titre: "Un courage ordinaire non reconnu", texte: "Pense à un moment récent où tu as fait quelque chose de difficile — tenu une promesse difficile, dit non, demandé pardon, continué malgré la fatigue. Reconnaît ce moment. Le courage ordinaire mérite d'être vu." },
      { titre: "La peur comme information", texte: "La prochaine fois que tu ressens de la peur face à quelque chose d'important, demande-toi : est-ce une peur qui protège quelque chose de précieux, ou une peur qui empêche de vivre ? Les deux existent. La distinguer change l'action qui suit." },
    ],
  },
  {
    id: "feminite",
    theme: "Féminité",
    couleur: "#C878A8",
    intro: "La féminité — et son pendant, la masculinité — ne sont pas des essences figées. Ce sont des constructions culturelles qui varient selon les époques et les sociétés, et des dimensions intérieures que chacun porte en soi à des degrés divers. Le rapport qu'on entretient avec sa féminité ou sa masculinité est souvent traversé par des injonctions reçues dès l'enfance — ce qu'un homme doit être, ce qu'une femme ne doit pas faire. Revisiter ces injonctions ne signifie pas les rejeter toutes — mais choisir consciemment ce qui est vraiment soi.",
    dansLeFlux: "Quand on est en paix avec sa féminité ou sa masculinité, on ne dépense pas d'énergie à prouver quelque chose. On peut être doux(ce) et fort(e), vulnérable et solide, ambitieux(se) et tendre — sans contradiction. Il y a une intégration qui permet d'être pleinement soi.",
    quandCaResiste: "Quand ce rapport est difficile, il peut y avoir de la honte autour de certaines façons d'être — trop sensible pour un homme, trop ambitieuse pour une femme, trop différent(e) de ce qu'on attendait. Ou une rigidité — jouer le rôle attendu au point de ne plus savoir ce qui est authentique.",
    pratiques: [
      { titre: "Les injonctions reçues", texte: "Qu'est-ce qu'on t'a dit — directement ou non — que tu devais être en tant que garçon ou fille, homme ou femme ? Quelles de ces injonctions portes-tu encore ? Lesquelles as-tu questionnées ? Lesquelles correspondent à qui tu es vraiment ?" },
      { titre: "Ce que je trouve beau en moi sans condition", texte: "Nomme quelque chose en toi — une qualité, une façon d'être, une dimension de ton identité — que tu trouves beau(belle) indépendamment de ce que les autres en pensent. Pas une performance. Quelque chose qui existe simplement." },
      { titre: "Intégrer les contraires", texte: "Y a-t-il en toi des dimensions que tu as du mal à tenir ensemble — la douceur et la fermeté, la vulnérabilité et la force, l'ambition et la présence ? Qu'est-ce qui te fait croire qu'elles sont incompatibles ?" },
    ],
  },
  {
    id: "protection",
    theme: "Protection",
    couleur: "#78A8C8",
    intro: "La protection intérieure est une compétence, pas une forteresse. Elle consiste à savoir ce qui te nourrit et ce qui te vide, à poser des limites claires sans se couper du monde, à choisir ce qu'on laisse entrer dans son espace intérieur. Une bonne protection n'isole pas — elle sélectionne. Elle permet d'être pleinement présent(e) dans les relations tout en gardant son centre. Les protections rigides, construites dans la peur, coûtent souvent plus qu'elles ne protègent.",
    dansLeFlux: "Quand ta protection est saine, tu peux te sentir vulnérable sans être submergé(e). Tu sais dire non sans culpabilité excessive. Tu remarques quand une situation ou une personne te prend de l'énergie et tu peux agir en conséquence. Il y a une paix intérieure qui ne dépend pas de l'approbation des autres.",
    quandCaResiste: "Quand la protection fait défaut, on se retrouve épuisé(e) par les autres — à tout absorber, à ne pas savoir dire non, à se sentir envahi(e) sans pouvoir nommer pourquoi. Ou au contraire, les murs sont si épais qu'aucune vraie connexion n'est possible.",
    pratiques: [
      { titre: "Ce qui me vide systématiquement", texte: "Identifie deux ou trois situations, personnes ou habitudes qui te laissent systématiquement plus vide qu'avant. Pas pour les fuir toutes — mais pour en être conscient(e) et décider de comment tu veux t'y engager." },
      { titre: "Poser une limite claire aujourd'hui", texte: "Y a-t-il quelque chose à quoi tu dis oui par défaut et que tu voudrais pouvoir refuser ? Aujourd'hui, dis non à une chose — même petite. Observe ce qui se passe en toi et autour de toi." },
      { titre: "Nettoyer son espace intérieur", texte: "Qu'est-ce que tu consommes mentalement — informations, réseaux, conversations — qui te pèse ? Cette semaine, retire une source d'inputs négatifs. Observe la différence sur ton niveau d'énergie." },
    ],
  },
  {
    id: "meditation",
    theme: "Méditation",
    couleur: "#88A8B8",
    intro: "La méditation n'est pas vider son esprit. C'est apprendre à observer ses pensées sans les suivre, à ne pas être emporté(e) par chaque vague mentale. C'est une pratique d'entraînement de l'attention — l'une des facultés les plus précieuses et les plus négligées. Elle ne demande pas de croire à quoi que ce soit. Elle ne réclame pas de silence parfait ni de posture particulière. Elle demande de la régularité et une forme de courage : rester avec soi-même quelques minutes sans fuir.",
    dansLeFlux: "Quand la méditation est présente dans ta vie, tu remarques tes pensées avant d'y réagir. Tu as un peu plus d'espace entre le stimulus et la réponse. Tu peux être dans une situation stressante sans être complètement submergé(e). La présence devient plus naturelle.",
    quandCaResiste: "Quand on ne médite pas ou qu'on n'a pas d'espace intérieur, le mental tourne souvent en boucle. Les pensées commencent les unes les autres sans fin. Le stress s'accumule sans qu'on puisse y accéder vraiment. Il peut y avoir un sentiment d'être constamment 'sous eau'.",
    pratiques: [
      { titre: "Cinq minutes, rien de plus", texte: "Pas besoin de quarante minutes. Commence par cinq. Assieds-toi confortablement, ferme les yeux. Compte tes respirations de un à dix, puis recommence. Quand une pensée arrive, remarque-la et reviens au comptage. C'est tout. Cinq minutes." },
      { titre: "La méditation dans l'action", texte: "La méditation n'est pas réservée au coussin. Elle peut se pratiquer en marchant, en mangeant, en écoutant. Choisis une activité quotidienne ordinaire et fais-la avec une attention totale — sans penser à autre chose, sans téléphone. Juste être là." },
      { titre: "Observer sans juger une pensée difficile", texte: "La prochaine fois qu'une pensée difficile arrive — une inquiétude, un regret, une critique de soi — essaie de ne pas la combattre ni de la suivre. Juste l'observer, comme un nuage qui passe. Nomme-la : 'voilà de l'inquiétude'. Observe ce qui se passe ensuite." },
    ],
  },
  {
    id: "memoire-transgen",
    theme: "Mémoire transgénérationnelle",
    couleur: "#A898B8",
    intro: "On hérite de bien plus que des gènes. Les recherches en épigénétique et en psychologie familiale montrent que les traumatismes non résolus se transmettent — dans les comportements, dans les peurs, dans les silences. Nos parents, grands-parents, arrière-grands-parents ont traversé des guerres, des migrations, des deuils, des injustices. Ce qu'ils n'ont pas pu digérer se retrouve souvent dans nos propres réactions — des peurs qui semblent disproportionnées, des attachements inexpliqués, des schémas qui se répètent sans raison apparente.",
    dansLeFlux: "Quand on est conscient de sa mémoire transgénérationnelle, on peut distinguer ce qui est 'soi' de ce qui a été hérité. On peut rendre à l'histoire familiale ce qui lui appartient. Il y a une clarté nouvelle sur certains patterns — et avec elle, la possibilité de choisir autrement.",
    quandCaResiste: "Quand la mémoire transgénérationnelle est ignorée, on répète des patterns sans comprendre pourquoi. On peut ressentir des peurs, des douleurs, des limitations qui semblent venir de nulle part — parce qu'elles viennent d'avant. Les silences familiaux ont souvent un poids disproportionné.",
    pratiques: [
      { titre: "L'arbre des blessures", texte: "Pense à tes parents et à leurs parents. Y a-t-il des événements difficiles dans ton histoire familiale — migrations, guerres, deuils, trahisons, silences ? Comment ces événements ont-ils pu façonner les personnes qu'ils étaient ? Et comment ces personnes t'ont-elles façonné(e) ?" },
      { titre: "Ce qui vient d'avant", texte: "Y a-t-il en toi une peur ou un pattern dont tu ne comprends pas vraiment l'origine ? Quelque chose qui semble disproportionné par rapport à ta propre expérience ? C'est peut-être hérité. Le reconnaître ne le supprime pas — mais ça permet de le tenir autrement." },
      { titre: "Briser le silence", texte: "Y a-t-il une histoire dans ta famille dont on ne parle jamais ? Un deuil non fait, une injustice non reconnue, un secret gardé ? Parfois, juste reconnaître l'existence de ce silence est un acte libérateur." },
    ],
  },
  {
    id: "corps-emotionnel",
    theme: "Corps émotionnel",
    couleur: "#C89878",
    intro: "Le corps émotionnel est le corps ressenti — celui des sensations intérieures, des tensions qui portent des histoires, des douleurs qui disent des vérités que la tête préfère ignorer. La somatothérapie — thérapie par le corps — part du principe que les traumatismes et les émotions non traitées s'inscrivent dans le corps sous forme de tensions, de douleurs chroniques, de postures figées. Accéder au corps émotionnel, c'est accéder à une mémoire plus profonde que celle de la tête.",
    dansLeFlux: "Quand le corps émotionnel est écouté, il y a une fluidité dans l'expérience des émotions. Elles traversent sans s'installer. Le corps est souple — pas seulement physiquement. Tu remarques tes réactions corporelles et tu les comprends comme des messages.",
    quandCaResiste: "Quand le corps émotionnel est ignoré, les émotions s'accumulent sous forme de tensions physiques — nuque raide, dos douloureux, ventre noué, poitrine comprimée. Ces tensions peuvent devenir chroniques et sembler 'sans raison médicale'. Le corps dit ce que les mots ne disent pas.",
    pratiques: [
      { titre: "Localiser l'émotion dans le corps", texte: "Quand une émotion forte se présente, ferme les yeux et demande-toi : où est-ce que je la sens dans mon corps ? Gorge, poitrine, ventre, nuque ? Quel est le poids, la texture, la température de cette sensation ? Rester avec la sensation — pas avec l'histoire — quelques minutes." },
      { titre: "Libérer par le mouvement", texte: "Certaines émotions ne se pensent pas — elles se bougent. Marche rapide, danse seul(e), secouer les bras et les jambes vigoureusement. Le but n'est pas d'expliquer l'émotion mais de lui donner un mouvement physique. Observer ce qui se transforme." },
      { titre: "Le dialogue avec la douleur", texte: "Si tu as une douleur physique récurrente — dos, tête, ventre, gorge — demande-lui : si tu pouvais parler, qu'est-ce que tu dirais ? Écris la réponse sans censure. Ce n'est pas de la magie — c'est de la psychosomatique. Le corps et le psyché sont un." },
    ],
  },
  {
    id: "noeud-interieur",
    theme: "Nœud intérieur",
    couleur: "#B898A8",
    intro: "Un nœud intérieur est quelque chose qui reste bloqué — une décision non prise depuis trop longtemps, une relation non réglée, une vérité non dite, un deuil non fait. Il ne se résout pas par la volonté seule. Il demande d'être regardé — ce qui est souvent ce qu'on évite le plus. Les nœuds intérieurs consomment de l'énergie en silence. Ils ne font pas de bruit — mais ils occupent une place. Souvent, se donner la permission de les regarder suffit à les desserrer partiellement.",
    dansLeFlux: "Quand les nœuds se dénouent, il y a une légèreté qu'on n'avait pas remarqué avoir perdue. L'énergie qui allait à maintenir le blocage devient disponible pour autre chose. Des décisions qui semblaient impossibles se clarifient. Des relations se transforment.",
    quandCaResiste: "Quand les nœuds restent serrés, on tourne autour d'eux sans les voir vraiment. Il peut y avoir une fatigue inexplicable — le coût de maintenir quelque chose en place qu'on refuse de regarder. Ou des symptômes détournés — de la procrastination, de l'irritabilité, une tristesse sans objet.",
    pratiques: [
      { titre: "Nommer le nœud", texte: "Qu'est-ce qui est bloqué en toi en ce moment ? Pas besoin de savoir comment le résoudre — juste le nommer. Une décision, une relation, une vérité, un sentiment. L'écrire le rend réel. Et ce qui est réel peut être travaillé." },
      { titre: "Ce qui retient le nœud", texte: "Qu'est-ce qui t'empêche de défaire ce nœud ? La peur de quoi exactement ? La peur de la réaction des autres, de la perte, de l'inconnu, de ta propre puissance ? Nommer la peur derrière le blocage change souvent sa nature." },
      { titre: "Un millimètre de mouvement", texte: "On n'a pas besoin de tout résoudre en une fois. Quel serait un tout petit geste — une conversation, une décision mineure, une heure dédiée à regarder ce qui est là — qui ferait bouger le nœud d'un millimètre ? Un millimètre suffit pour aujourd'hui." },
    ],
  },
  {
    id: "espace-de-vie",
    theme: "Espace de vie",
    couleur: "#98B8A8",
    intro: "L'espace qu'on habite nous habite en retour. Ce n'est pas superficiel — c'est profond. Notre environnement immédiat reflète et renforce notre état intérieur. Un espace encombré peut perpétuer un esprit encombré. Un espace soigné peut soutenir une vie soignée. Prendre soin de son espace de vie, c'est une forme de soin de soi souvent négligée. Et au-delà du physique, l'espace de vie inclut aussi l'espace mental — ce qu'on laisse entrer dans sa tête, ce qu'on choisit de ne plus y laisser.",
    dansLeFlux: "Quand l'espace de vie est sain, tu te sens bien dans l'endroit où tu vis et travailles. Il y a une cohérence entre l'espace et qui tu es. Tu peux te ressourcer chez toi. Il y a de l'ordre sans rigidité — une organisation qui sert ta vie plutôt que de la contraindre.",
    quandCaResiste: "Quand l'espace de vie est difficile, rentrer chez soi peut être pesant plutôt que ressourçant. Il peut y avoir du chaos accumulé qui reflète un chaos intérieur. Ou un espace stérile qui dit une forme d'abandon de soi. L'espace qu'on habite dit beaucoup sur la relation qu'on entretient avec soi-même.",
    pratiques: [
      { titre: "Un espace, un geste", texte: "Choisis un endroit dans ton espace de vie qui te pèse — une pièce, un coin, une pile de choses. Fais un seul geste pour l'améliorer aujourd'hui. Pas tout ranger — juste un geste. Observer comment ça se répercute sur ton état intérieur." },
      { titre: "Ce que mon espace dit de moi", texte: "Si un inconnu visitait ton espace de vie, qu'est-ce qu'il en déduirait sur toi ? Est-ce que cette image te ressemble ? Est-ce qu'il y a un écart entre qui tu veux être et l'espace qui t'entoure ?" },
      { titre: "Nettoyer son espace mental", texte: "L'espace mental — ce qu'on consomme, ce à quoi on pense, ce dont on se souvient — est aussi un espace à entretenir. Qu'est-ce que tu laisses entrer dans ton esprit qui l'encombre ? Nouvelles, réseaux, conversations toxiques. Un seul changement cette semaine." },
    ],
  },
  {
    id: "vitalite",
    theme: "Vitalité",
    couleur: "#A8C870",
    intro: "La vitalité est plus que l'énergie physique — c'est l'élan de vie. Ce sentiment d'être pleinement là, d'avoir envie de quelque chose, de ressentir du plaisir dans ce qu'on fait. Elle se nourrit — par le corps, par le sens, par les relations, par ce qu'on crée. Et elle s'épuise — par l'accumulation du stress, par les compromis sur ce qui compte, par les relations qui prennent sans donner. Connaître ses sources de vitalité et les protéger est l'une des formes les plus concrètes du soin de soi.",
    dansLeFlux: "Quand la vitalité est présente, il y a une appétence pour la vie — une envie de faire, de créer, d'être avec les autres. Le corps est énergique sans être agité. Tu te lèves avec quelque chose qui t'attend. Il y a une joie de fond, pas toujours de l'excitation — mais une énergie de base qui soutient.",
    quandCaResiste: "Quand la vitalité s'épuise, tout devient effort. Le matin est lourd. Rien ne semble valoir vraiment la peine. Il peut y avoir une fatigue chronique qui ne part pas avec le repos — parce qu'elle n'est pas seulement physique. Elle est le signe que quelque chose de plus profond est à rééquilibrer.",
    pratiques: [
      { titre: "Cartographier ses sources d'énergie", texte: "Fais deux listes. La première : ce qui te donne de l'énergie — activités, personnes, états, moments. La deuxième : ce qui t'en prend. Ce n'est pas pour supprimer tout ce qui fatigue — certaines choses difficiles nourrissent quand même. C'est pour voir clairement l'équilibre." },
      { titre: "Un acte de soin pour la vitalité", texte: "Choisis une chose concrète — dormir une heure de plus, bouger ton corps, manger quelque chose qui te fait du bien, voir quelqu'un qui te ressource. Un seul geste aujourd'hui. La vitalité se reconstruit geste par geste." },
      { titre: "Ce qui allume quelque chose", texte: "Pense à la dernière fois où tu t'es senti(e) vraiment vivant(e) — pas euphorique, juste vraiment là et présent(e). Qu'est-ce qui se passait ? Comment reproduire ce contexte, même partiellement, dans ta vie ordinaire ?" },
    ],
  },
];

const ThemesScreen = ({ onBack, isPremium = false, onShowPaywall }) => {
  const [vue, setVue] = useState("liste");
  const [themeChoisi, setThemeChoisi] = useState(null);
  const [recherche, setRecherche] = useState("");

  const themesFiltres = FICHES_THEMES.filter(t =>
    t.theme.toLowerCase().includes(recherche.toLowerCase())
  );

  if (vue === "fiche" && themeChoisi) {
    const t = themeChoisi;
    const idx = FICHES_THEMES.findIndex(x => x.id === t.id);
    return (
      <div style={{ minHeight: "calc(100vh - 120px)", padding: "2rem 1.5rem 6rem", maxWidth: 520, margin: "0 auto" }}>
        <button onClick={() => setVue("liste")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: T.sans, fontSize: "0.55rem", letterSpacing: "0.3em", color: `${T.brume}66`, marginBottom: "2rem", padding: 0, textTransform: "uppercase" }}>← Retour</button>

        {/* En-tête */}
        <div style={{ borderLeft: `3px solid ${t.couleur}88`, paddingLeft: "1.2rem", marginBottom: "2rem" }}>
          <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "clamp(1.2rem,4vw,1.4rem)", color: T.orPale }}>{t.theme}</div>
        </div>

        {/* Ce que c'est */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.45rem", letterSpacing: "0.4em", textTransform: "uppercase", color: `${t.couleur}99`, marginBottom: "0.8rem" }}>Ce thème</div>
          <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.88rem", color: `${T.brume}cc`, lineHeight: 2, margin: 0 }}>{t.intro}</p>
        </div>

        <div style={{ width: "100%", height: 1, background: `linear-gradient(to right, transparent, ${t.couleur}33, transparent)`, margin: "1.5rem 0" }} />

        {/* Dans le flux */}
        <div style={{ marginBottom: "1.5rem", background: `${t.couleur}08`, border: `1px solid ${t.couleur}22`, borderRadius: "6px", padding: "1.2rem 1.4rem" }}>
          <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.45rem", letterSpacing: "0.4em", textTransform: "uppercase", color: t.couleur, marginBottom: "0.7rem" }}>Dans le flux</div>
          <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.85rem", color: `${T.brume}cc`, lineHeight: 1.9, margin: 0 }}>{t.dansLeFlux}</p>
        </div>

        {/* Quand ça résiste */}
        <div style={{ marginBottom: "2rem", background: `${T.brume}08`, border: `1px solid ${T.brume}18`, borderRadius: "6px", padding: "1.2rem 1.4rem" }}>
          <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.45rem", letterSpacing: "0.4em", textTransform: "uppercase", color: `${T.brume}77`, marginBottom: "0.7rem" }}>Quand ça résiste</div>
          <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.85rem", color: `${T.brume}99`, lineHeight: 1.9, margin: 0 }}>{t.quandCaResiste}</p>
        </div>

        <div style={{ width: "100%", height: 1, background: `linear-gradient(to right, transparent, ${t.couleur}33, transparent)`, margin: "0 0 2rem" }} />

        {/* Pratiques — premium gate */}
        {isPremium ? (
          <>
            <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.45rem", letterSpacing: "0.4em", textTransform: "uppercase", color: `${t.couleur}99`, marginBottom: "1.2rem" }}>Ce que tu peux faire</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {t.pratiques.map((p, i) => (
                <div key={i} style={{ background: `${T.nuit2}cc`, border: `1px solid ${t.couleur}22`, borderRadius: "6px", padding: "1.2rem 1.4rem" }}>
                  <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.9rem", color: t.couleur, marginBottom: "0.6rem" }}>{p.titre}</div>
                  <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.82rem", color: `${T.brume}cc`, lineHeight: 1.9, margin: 0 }}>{p.texte}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ background: `${T.nuit2}cc`, border: `1px solid ${T.or}33`, borderRadius: "8px", padding: "1.6rem 1.5rem", textAlign: "center" }}>
            <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.45rem", letterSpacing: "0.4em", textTransform: "uppercase", color: `${T.or}88`, marginBottom: "1rem" }}>Ce que tu peux faire</div>
            <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.82rem", color: `${T.brume}88`, lineHeight: 1.9, marginBottom: "1.2rem" }}>
              {t.pratiques.length} pratiques concrètes pour ce thème.<br />
              <span style={{ fontSize: "0.75rem", color: `${T.brume}55` }}>Réservées aux abonnés ALBA.</span>
            </div>
            {/* Aperçu flou du titre de la première pratique */}
            <div style={{ background: `${T.brume}08`, border: `1px solid ${T.brume}15`, borderRadius: "6px", padding: "0.9rem 1.1rem", marginBottom: "1.2rem", filter: "blur(3px)", userSelect: "none", pointerEvents: "none" }}>
              <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.9rem", color: t.couleur }}>{t.pratiques[0].titre}</div>
            </div>
            <button onClick={onShowPaywall} style={{ background: `${T.or}22`, border: `1px solid ${T.or}55`, borderRadius: "6px", padding: "0.75rem 2rem", cursor: "pointer", fontFamily: T.sans, fontWeight: 300, fontSize: "0.55rem", letterSpacing: "0.4em", textTransform: "uppercase", color: T.or }}>
              Accéder aux pratiques
            </button>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "3rem" }}>
          <button onClick={() => idx > 0 && setThemeChoisi(FICHES_THEMES[idx - 1])} disabled={idx === 0}
            style={{ background: "none", border: `1px solid ${idx === 0 ? T.brume + "22" : t.couleur + "44"}`, borderRadius: "6px", padding: "0.6rem 1.2rem", cursor: idx === 0 ? "default" : "pointer", fontFamily: T.sans, fontSize: "0.55rem", letterSpacing: "0.3em", color: idx === 0 ? `${T.brume}33` : t.couleur }}>← Précédent</button>
          <button onClick={() => idx < FICHES_THEMES.length - 1 && setThemeChoisi(FICHES_THEMES[idx + 1])} disabled={idx === FICHES_THEMES.length - 1}
            style={{ background: "none", border: `1px solid ${idx === FICHES_THEMES.length - 1 ? T.brume + "22" : t.couleur + "44"}`, borderRadius: "6px", padding: "0.6rem 1.2rem", cursor: idx === FICHES_THEMES.length - 1 ? "default" : "pointer", fontFamily: T.sans, fontSize: "0.55rem", letterSpacing: "0.3em", color: idx === FICHES_THEMES.length - 1 ? `${T.brume}33` : t.couleur }}>Suivant →</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "calc(100vh - 120px)", padding: "2rem 1.5rem 6rem", maxWidth: 520, margin: "0 auto" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: T.sans, fontSize: "0.55rem", letterSpacing: "0.3em", color: `${T.brume}66`, marginBottom: "2rem", padding: 0, textTransform: "uppercase" }}>← Retour</button>
      <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.48rem", letterSpacing: "0.55em", textTransform: "uppercase", color: `${T.or}66`, marginBottom: "0.5rem" }}>Thèmes intérieurs</div>
      <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.82rem", color: `${T.brume}88`, marginBottom: "1.5rem", lineHeight: 1.7 }}>
        {FICHES_THEMES.length} thèmes — chacun avec une description, deux états, et des pratiques concrètes.
      </p>

      {/* Recherche */}
      <input
        type="text"
        value={recherche}
        onChange={e => setRecherche(e.target.value)}
        placeholder="Rechercher un thème…"
        style={{ width: "100%", background: `${T.nuit2}cc`, border: `1px solid ${T.brume}22`, borderRadius: "6px", padding: "0.7rem 1rem", fontFamily: T.serif, fontStyle: "italic", fontSize: "0.85rem", color: T.aube, outline: "none", marginBottom: "1.5rem", boxSizing: "border-box" }}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {themesFiltres.map((t, i) => (
          <div key={t.id} onClick={() => { setThemeChoisi(t); setVue("fiche"); }}
            style={{ background: `${T.nuit2}cc`, border: `1px solid ${t.couleur}33`, borderLeft: `3px solid ${t.couleur}66`, borderRadius: "6px", padding: "0.9rem 1.1rem", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", animation: `fadeUp 0.4s ease forwards ${0.03 + i * 0.03}s`, opacity: 0 }}>
            <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.95rem", color: T.orPale }}>{t.theme}</div>
            <div style={{ fontFamily: T.sans, fontSize: "0.7rem", color: `${T.brume}44` }}>→</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PARCOURS = [
  {
    id: "silence-apres",
    titre: "Le Silence après",
    sousTitre: "Traverser une fin",
    duree: 7,
    couleur: "#8898C8",
    description: "Quelque chose s'est arrêté. Le silence qui suit est immense. Ce parcours est pour traverser ça.",
    jours: [
      { jour: 1, invitation: "Aujourd'hui, ne cherche pas à comprendre. Assieds-toi avec ce qui est là, sans lui donner de nom.", note: "Le premier jour, la seule tâche c'est d'exister." },
      { jour: 2, invitation: "Écris trois choses que tu as perdues. Pas des personnes — des versions de toi-même.", note: "Ce qu'on perd, c'est souvent qui on était avec l'autre." },
      { jour: 3, invitation: "Trouve un objet qui te rappelle ce que tu traverses. Tiens-le dans tes mains quelques secondes, puis pose-le.", note: "Le corps comprend ce que les mots ne peuvent pas dire." },
      { jour: 4, invitation: "Permets-toi d'être en colère. Pas de l'exprimer — juste de reconnaître qu'elle est là.", note: "La colère est souvent de la douleur qui ne sait pas comment exister." },
      { jour: 5, invitation: "Écris une phrase qui commence par : 'Ce que j'aurais voulu...'", note: "Le regret, regardé en face, perd une partie de son pouvoir." },
      { jour: 6, invitation: "Fais quelque chose de petit que tu faisais avant, seul(e). Un café, une marche, un livre.", note: "Tu existes en dehors de ce qui s'est passé." },
      { jour: 7, invitation: "Écris une lettre à la personne que tu seras dans un an. Dis-lui que tu es en chemin.", note: "Seven jours ne guérissent pas. Ils commencent." },
    ],
  },
  {
    id: "revenir-au-corps",
    titre: "Revenir au corps",
    sousTitre: "Retrouver l'ancrage",
    duree: 5,
    couleur: "#7BA87B",
    description: "Tu ne sais plus ce que tu ressens. Ton corps est là mais tu n'y es plus vraiment. Ce parcours te ramène.",
    jours: [
      { jour: 1, invitation: "Pendant deux minutes, sens tes pieds sur le sol. C'est tout. Rien d'autre.", note: "Le sol est toujours là. Même quand tout le reste vacille." },
      { jour: 2, invitation: "Mange un repas sans écran, sans musique. Juste toi et ce que tu manges.", note: "La présence commence par les sens les plus simples." },
      { jour: 3, invitation: "Note trois sensations physiques que tu ressens en ce moment. Pas des émotions — des sensations.", note: "Chaud, froid, tension, légèreté. Le corps parle une langue directe." },
      { jour: 4, invitation: "Bouge ton corps d'une façon qui ne soit pas utile. Danse seul(e), étire-toi par plaisir, marche sans destination.", note: "Le corps n'a pas besoin de raison pour exister." },
      { jour: 5, invitation: "Pose une main sur ta poitrine et dis à voix haute ou en silence : 'Je suis là.'", note: "Revenir à soi, c'est souvent juste ça." },
    ],
  },
  {
    id: "ce-que-je-porte",
    titre: "Ce que je porte",
    sousTitre: "Nommer l'invisible",
    duree: 10,
    couleur: "#C8A040",
    description: "Il y a quelque chose que tu portes depuis longtemps. Tu ne sais pas toujours le nommer. Ce parcours aide à le regarder.",
    jours: [
      { jour: 1, invitation: "Qu'est-ce que tu portes en ce moment que personne ne voit ?", note: "Il n'est pas nécessaire de répondre complètement. Commencer suffit." },
      { jour: 2, invitation: "Pense à une chose que tu répètes dans ta vie — une situation, une dynamique. Écris-la sans te juger.", note: "Les patterns se répètent jusqu'à ce qu'on les regarde." },
      { jour: 3, invitation: "Qu'est-ce que tu t'interdis de ressentir ? Nomme-le.", note: "Interdire une émotion ne la fait pas disparaître." },
      { jour: 4, invitation: "De qui as-tu hérité ce poids ? Un parent, une histoire familiale, une blessure transmise ?", note: "Ce qu'on porte n'est pas toujours le nôtre." },
      { jour: 5, invitation: "Écris une phrase qui commence par : 'Depuis que je suis enfant, je crois que...'", note: "Les croyances les plus profondes ont une enfance." },
      { jour: 6, invitation: "Aujourd'hui, observe une fois où tu t'es mis(e) de côté pour les autres. Juste observer.", note: "Voir est déjà une forme d'action." },
      { jour: 7, invitation: "Qu'est-ce que tu aurais besoin qu'on te dise, et que tu n'as jamais entendu ?", note: "On peut se dire à soi-même ce dont on a besoin." },
      { jour: 8, invitation: "Imagine que ce poids avait une forme, une couleur, un poids réel. Décris-le.", note: "Rendre concret ce qui est abstrait permet de le tenir autrement." },
      { jour: 9, invitation: "Y a-t-il quelque chose que tu peux poser aujourd'hui, même temporairement ?", note: "On n'a pas à tout résoudre. Juste un peu plus léger." },
      { jour: 10, invitation: "Écris ce que tu veux garder de ce que tu as traversé. Pas tout — juste ce qui vaut quelque chose.", note: "Certains poids contiennent quelque chose de précieux." },
    ],
  },
  {
    id: "recommencer",
    titre: "Recommencer",
    sousTitre: "Une nouvelle page",
    duree: 7,
    couleur: "#B87050",
    description: "Une page vient de se tourner. Tu ne sais pas encore quoi écrire sur la suivante. Ce parcours commence là.",
    jours: [
      { jour: 1, invitation: "Qu'est-ce qui se termine vraiment ? Nomme-le avec précision.", note: "Commencer demande d'abord de finir." },
      { jour: 2, invitation: "Qu'est-ce que tu ne veux plus emmener dans cette nouvelle étape ? Écris-le.", note: "Recommencer c'est choisir ce qu'on laisse derrière." },
      { jour: 3, invitation: "Qu'est-ce que tu as appris sur toi-même dans ce qui vient de se passer ?", note: "Les fins sont souvent les meilleurs professeurs." },
      { jour: 4, invitation: "Imagine la personne que tu veux devenir. Décris une seule de ses habitudes.", note: "On ne devient pas quelqu'un d'un coup. On commence par un geste." },
      { jour: 5, invitation: "Fais une chose aujourd'hui que cette nouvelle version de toi ferait.", note: "L'identité se construit dans les actes, pas dans les intentions." },
      { jour: 6, invitation: "Qu'est-ce que tu es prêt(e) à ne pas encore savoir ?", note: "Recommencer demande de tenir l'incertitude sans la fuir." },
      { jour: 7, invitation: "Écris la première ligne de cette nouvelle page. Une seule phrase. La tienne.", note: "Tu n'as pas à savoir la suite. Juste la première ligne." },
    ],
  },
];

const ParcoursDuJour = ({ data, isPremium, onShowPaywall }) => {
  const [vue, setVue] = useState("liste"); // liste | detail | actif
  const [parcoursChoisi, setParcoursChoisi] = useState(null);
  const [faitAujd, setFaitAujd] = useState(false);

  const getEtatParcours = (parcoursId) => {
    try {
      return JSON.parse(localStorage.getItem(`alba_parcours_${parcoursId}`) || "null");
    } catch { return null; }
  };

  const demarrerParcours = (parcours) => {
    if (!isPremium) { onShowPaywall?.(); return; }
    const etat = getEtatParcours(parcours.id);
    if (!etat) {
      const nouvelEtat = { debut: new Date().toDateString(), jourActuel: 1, completes: [] };
      localStorage.setItem(`alba_parcours_${parcours.id}`, JSON.stringify(nouvelEtat));
    }
    setParcoursChoisi(parcours);
    setVue("actif");
  };

  const getJourActuel = (parcoursId) => {
    const etat = getEtatParcours(parcoursId);
    if (!etat) return null;
    const debut = new Date(etat.debut);
    const aujourdhui = new Date();
    const diffJours = Math.floor((aujourdhui - debut) / (1000 * 60 * 60 * 24));
    return Math.min(diffJours + 1, PARCOURS.find(p => p.id === parcoursId)?.duree || 1);
  };

  const marquerComplete = (parcoursId, jour) => {
    try {
      const etat = JSON.parse(localStorage.getItem(`alba_parcours_${parcoursId}`) || "{}");
      if (!etat.completes) etat.completes = [];
      if (!etat.completes.includes(jour)) etat.completes.push(jour);
      localStorage.setItem(`alba_parcours_${parcoursId}`, JSON.stringify(etat));
    } catch {}
  };

  const estComplete = (parcoursId, jour) => {
    const etat = getEtatParcours(parcoursId);
    return etat?.completes?.includes(jour) || false;
  };

  // ── VUE LISTE ──
  if (vue === "liste") return (
    <div style={{ marginTop: "0.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.48rem", letterSpacing: "0.5em", textTransform: "uppercase", color: `${T.or}77` }}>
          Parcours
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {PARCOURS.map((p, i) => {
          const etat = getEtatParcours(p.id);
          const jourActuel = etat ? getJourActuel(p.id) : null;
          const progres = etat ? Math.round(((etat.completes?.length || 0) / p.duree) * 100) : 0;
          return (
            <div key={p.id} onClick={() => { setParcoursChoisi(p); setVue("detail"); }}
              style={{ background: `${T.nuit2}cc`, border: `1px solid ${etat ? p.couleur + "44" : T.brume + "22"}`, borderRadius: "8px", padding: "1.1rem 1.2rem", cursor: "pointer", animation: `fadeUp 0.5s ease forwards ${0.1 + i * 0.08}s`, opacity: 0, position: "relative", overflow: "hidden" }}>
              {etat && <div style={{ position: "absolute", bottom: 0, left: 0, width: `${progres}%`, height: "2px", background: `linear-gradient(to right, ${p.couleur}88, ${p.couleur})` }} />}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "1rem", color: T.orPale, marginBottom: "0.25rem" }}>{p.titre}</div>
                  <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.48rem", letterSpacing: "0.3em", textTransform: "uppercase", color: p.couleur }}>{p.sousTitre}</div>
                </div>
                <div style={{ fontFamily: T.sans, fontSize: "0.6rem", color: `${T.brume}66`, whiteSpace: "nowrap", paddingLeft: "0.5rem" }}>
                  {etat ? `Jour ${jourActuel}/${p.duree}` : `${p.duree} jours`}
                </div>
              </div>
              {!etat && <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.78rem", color: `${T.brume}88`, lineHeight: 1.6, marginTop: "0.6rem", marginBottom: 0 }}>{p.description}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── VUE DETAIL ──
  if (vue === "detail" && parcoursChoisi) {
    const etat = getEtatParcours(parcoursChoisi.id);
    const jourActuel = etat ? getJourActuel(parcoursChoisi.id) : null;
    return (
      <div style={{ animation: "fadeUp 0.5s ease forwards" }}>
        <button onClick={() => setVue("liste")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: T.sans, fontSize: "0.55rem", letterSpacing: "0.3em", color: `${T.brume}66`, marginBottom: "1.5rem", padding: 0, textTransform: "uppercase" }}>← Retour</button>
        <div style={{ borderLeft: `2px solid ${parcoursChoisi.couleur}55`, paddingLeft: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "1.2rem", color: T.orPale, marginBottom: "0.3rem" }}>{parcoursChoisi.titre}</div>
          <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.48rem", letterSpacing: "0.35em", textTransform: "uppercase", color: parcoursChoisi.couleur }}>{parcoursChoisi.sousTitre} · {parcoursChoisi.duree} jours</div>
        </div>
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.88rem", color: `${T.brume}cc`, lineHeight: 1.8, marginBottom: "1.5rem" }}>{parcoursChoisi.description}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {parcoursChoisi.jours.map(j => {
            const fait = estComplete(parcoursChoisi.id, j.jour);
            const locked = jourActuel && j.jour > jourActuel;
            return (
              <div key={j.jour} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", opacity: locked ? 0.3 : 1 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", border: `1px solid ${fait ? parcoursChoisi.couleur : T.brume + "44"}`, background: fait ? parcoursChoisi.couleur + "33" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "0.15rem" }}>
                  {fait
                    ? <span style={{ color: parcoursChoisi.couleur, fontSize: "0.5rem" }}>✓</span>
                    : <span style={{ color: `${T.brume}55`, fontSize: "0.38rem", fontFamily: T.sans }}>{j.jour}</span>
                  }
                </div>
                <div>
                  <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.42rem", letterSpacing: "0.3em", textTransform: "uppercase", color: `${parcoursChoisi.couleur}77`, marginBottom: "0.2rem" }}>Jour {j.jour}</div>
                  <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.82rem", color: fait ? `${T.brume}88` : `${T.brume}cc`, lineHeight: 1.6 }}>{j.invitation}</div>
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={() => demarrerParcours(parcoursChoisi)}
          style={{ width: "100%", padding: "0.9rem", background: etat ? `${parcoursChoisi.couleur}22` : parcoursChoisi.couleur + "33", border: `1px solid ${parcoursChoisi.couleur}55`, borderRadius: "6px", cursor: "pointer", fontFamily: T.sans, fontWeight: 300, fontSize: "0.6rem", letterSpacing: "0.4em", textTransform: "uppercase", color: parcoursChoisi.couleur }}>
          {etat ? `Continuer — Jour ${jourActuel}` : isPremium ? "Commencer ce parcours" : "✦ Accès Premium"}
        </button>
      </div>
    );
  }

  // ── VUE ACTIF ──
  if (vue === "actif" && parcoursChoisi) {
    const etat = getEtatParcours(parcoursChoisi.id);
    const jourActuel = getJourActuel(parcoursChoisi.id);
    const jourData = parcoursChoisi.jours.find(j => j.jour === jourActuel);
    const dejaFait = estComplete(parcoursChoisi.id, jourActuel);
    const fait = faitAujd || dejaFait;

    if (!jourData) return null;
    return (
      <div style={{ animation: "fadeUp 0.6s ease forwards" }}>
        <button onClick={() => setVue("detail")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: T.sans, fontSize: "0.55rem", letterSpacing: "0.3em", color: `${T.brume}66`, marginBottom: "2rem", padding: 0, textTransform: "uppercase" }}>← {parcoursChoisi.titre}</button>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.48rem", letterSpacing: "0.5em", textTransform: "uppercase", color: parcoursChoisi.couleur, marginBottom: "0.5rem" }}>
            Jour {jourActuel} · {parcoursChoisi.duree}
          </div>
          <div style={{ width: "100%", height: 1, background: `linear-gradient(to right, transparent, ${parcoursChoisi.couleur}44, transparent)`, margin: "0.75rem 0" }} />
        </div>
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "clamp(1rem,3.5vw,1.15rem)", color: T.orPale, lineHeight: 2.1, textAlign: "center", marginBottom: "2rem", animation: "albaDev 1.2s ease forwards", opacity: 0 }}>
          {jourData.invitation}
        </p>
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.78rem", color: `${T.brume}66`, textAlign: "center", lineHeight: 1.7, marginBottom: "2rem" }}>{jourData.note}</p>
        {!fait ? (
          <button onClick={() => { marquerComplete(parcoursChoisi.id, jourActuel); setFaitAujd(true); }}
            style={{ width: "100%", padding: "0.9rem", background: "none", border: `1px solid ${parcoursChoisi.couleur}55`, borderRadius: "6px", cursor: "pointer", fontFamily: T.sans, fontWeight: 300, fontSize: "0.58rem", letterSpacing: "0.4em", textTransform: "uppercase", color: parcoursChoisi.couleur }}>
            ✓ J'ai fait ça aujourd'hui
          </button>
        ) : (
          <div style={{ textAlign: "center", padding: "1rem", fontFamily: T.serif, fontStyle: "italic", fontSize: "0.88rem", color: parcoursChoisi.couleur }}>
            Reviens demain pour le jour {Math.min(jourActuel + 1, parcoursChoisi.duree)}.
          </div>
        )}
      </div>
    );
  }

  return null;
};

const INVITATIONS_ALBA = [
  { id:"P01", theme:"Pardon", eclats:5, titre:"La lettre non envoyée", invitation:"Écris une lettre à la personne qui t'a blessé. Une seule condition : tu ne l'enverras pas. Écris ce que tu n'as jamais pu dire.", retour:"Comment tu te sens après avoir écrit cette lettre ?", note:"L'acte d'écrire suffit. Ce qui compte, c'est que les mots ont existé.", declencheur:["séparation","trahison","rupture","conflit"] },
  { id:"P02", theme:"Pardon", eclats:3, titre:"Ce que cette personne m'a appris", invitation:"Pense à quelqu'un qui t'a fait du mal. Demande-toi : qu'est-ce que cette douleur m'a appris sur moi-même ? Écris une phrase. Une seule.", retour:"Qu'est-ce que tu as trouvé ?", note:"Pardonner ne signifie pas que c'était acceptable.", declencheur:["colère","rancœur"] },
  { id:"P03", theme:"Pardon", eclats:5, titre:"La lettre à toi-même", invitation:"Écris une lettre à la personne que tu étais au moment où tu as fait quelque chose dont tu n'es pas fier. Pas pour t'excuser. Pour lui expliquer ce que tu comprends aujourd'hui.", retour:"Qu'est-ce que tu lui as dit ?", note:"Se pardonner à soi-même est souvent plus difficile que pardonner aux autres.", declencheur:["culpabilité","regret","honte"] },
  { id:"R01", theme:"Relations", eclats:3, titre:"Le coup de fil que tu repousses", invitation:"Il y a quelqu'un à qui tu penses parfois mais à qui tu n'as pas parlé depuis longtemps. Cette semaine, appelle-le ou envoie-lui un message. Juste : 'Je pensais à toi.'", retour:"Tu l'as fait ? Comment ça s'est passé ?", note:"Les relations ne meurent pas d'un seul acte. Elles meurent du silence accumulé.", declencheur:["solitude","isolement"] },
  { id:"R04", theme:"Relations", eclats:1, titre:"Dire ce qu'on ne dit pas", invitation:"Pense à quelqu'un dans ta vie à qui tu n'as jamais dit clairement à quel point il compte pour toi. Cette semaine, dis-le lui.", retour:"Tu l'as fait ?", note:"On remet souvent à plus tard les mots les plus simples.", declencheur:["gratitude","amitié"] },
  { id:"I01", theme:"Identité", eclats:3, titre:"Trois choses que tu sais sur toi", invitation:"Écris trois choses que tu sais être vraies sur toi-même. Pas ce que les autres disent. Ce que toi tu sais.", retour:"Qu'est-ce que tu as écrit ?", note:"Se connaître, c'est aussi savoir ce qu'on ne peut pas nier de soi-même.", declencheur:["doute","confusion"] },
  { id:"C01", theme:"Émotions", eclats:3, titre:"Sous la colère, qu'est-ce qu'il y a ?", invitation:"La prochaine fois que tu sens la colère monter, pause. Avant de réagir, demande-toi : sous cette colère, est-ce qu'il y a de la peur ? De la tristesse ? Un besoin non exprimé ?", retour:"Qu'est-ce que tu as trouvé sous la colère ?", note:"La colère est souvent la première émotion. Rarement la seule.", declencheur:["colère","frustration"] },
  { id:"C02", theme:"Émotions", eclats:1, titre:"Laisser la tristesse exister", invitation:"Accorde-toi 10 minutes pour être triste — vraiment. Juste assis avec ce que tu ressens. Sans essayer de le résoudre.", retour:"Comment tu te sens après ces 10 minutes ?", note:"La tristesse qu'on laisse exister dure moins longtemps que celle qu'on refoule.", declencheur:["tristesse","mélancolie"] },
  { id:"A01", theme:"Ambition", eclats:3, titre:"Le projet que tu repousses", invitation:"Il y a quelque chose que tu veux faire depuis longtemps mais que tu n'as pas commencé. Cette semaine, fais juste la première étape — la plus petite possible.", retour:"Quelle était cette première étape ? Tu l'as faite ?", note:"Le début est la seule partie qui dépend entièrement de toi.", declencheur:["rêve","projet"] },
  { id:"B01", theme:"Corps", eclats:1, titre:"5 minutes pour ton corps", invitation:"Accorde à ton corps 5 minutes d'attention complète — marcher pieds nus, s'étirer, respirer lentement. Pas d'écran.", retour:"Comment ton corps a répondu ?", note:"Le corps garde la mémoire de tout ce que la tête essaie d'oublier.", declencheur:["stress","tension"] },
  { id:"G01", theme:"Gratitude", eclats:1, titre:"La chose que tu tiens pour acquise", invitation:"Pense à quelque chose dans ta vie que tu tiens pour acquise et qui serait dévastateur de perdre. Prends un moment pour en être vraiment conscient.", retour:"À quoi as-tu pensé ?", note:"On voit souvent mieux ce qu'on a quand on imagine ce qu'on pourrait perdre.", declencheur:["reconnaissance"] },
  { id:"S01", theme:"Solitude", eclats:3, titre:"Une heure avec toi-même", invitation:"Offre-toi une heure de solitude volontaire — sans chercher à la remplir. Juste pour être avec toi-même et voir ce qui remonte.", retour:"Qu'est-ce qui est remonté ?", note:"Être seul et se sentir seul sont deux choses très différentes.", declencheur:["solitude","silence"] },
  { id:"L01", theme:"Liberté", eclats:5, titre:"Ce que je fais par peur, pas par choix", invitation:"Identifie une chose dans ta vie que tu fais par peur du jugement ou de la déception des autres. Écris-la. Tu n'as pas à changer quoi que ce soit aujourd'hui. Juste la voir.", retour:"Tu l'as identifiée ?", note:"Voir la prison est la première étape pour décider si tu veux en sortir.", declencheur:["contrainte","obligation"] },
  { id:"PA01", theme:"Parentalité", eclats:3, titre:"Ce que je voudrais faire autrement", invitation:"Pense à un moment avec ton enfant où tu n'as pas été la version de toi que tu voulais être. Qu'est-ce que tu ferais différemment aujourd'hui ?", retour:"Qu'est-ce que tu ferais autrement ?", note:"Reconnaître ses erreurs devant soi-même est le premier pas.", declencheur:["culpabilité parentale"] },
  { id:"CO01", theme:"Couple", eclats:3, titre:"Ce que j'ai arrêté de faire", invitation:"Dans ton couple, identifie quelque chose que tu faisais au début et que tu as arrêté — pas par manque d'amour, mais par habitude.", retour:"Qu'est-ce que tu as identifié ?", note:"Les couples ne meurent pas de grandes crises. Ils meurent des petits abandons quotidiens.", declencheur:["routine","distance"] },
  { id:"AR01", theme:"Argent", eclats:3, titre:"Ce que l'argent représente vraiment", invitation:"Qu'est-ce qu'on t'a appris sur l'argent quand tu étais enfant ? Est-ce que tu crois encore ça ?", retour:"Quelle était cette croyance ?", note:"L'argent est neutre. Ce qu'on lui fait représenter ne l'est pas.", declencheur:["argent","honte financière"] },
  { id:"TE03", theme:"Temps", eclats:3, titre:"Si je n'avais qu'un an", invitation:"Si tu apprenais que tu n'avais qu'un an à vivre, qu'est-ce que tu ferais différemment cette semaine ? Pas dans ta vie entière — juste cette semaine.", retour:"Qu'est-ce que tu ferais différemment ?", note:"On n'a pas besoin de n'avoir qu'un an pour commencer à vivre comme ça compte.", declencheur:["temps","urgence"] },
  { id:"SP01", theme:"Spiritualité", eclats:3, titre:"Ce en quoi je crois vraiment", invitation:"Au-delà des étiquettes, qu'est-ce que tu crois vraiment — sur la vie, sur ce qui existe au-delà de ce qu'on voit ? Écris-le sans te censurer.", retour:"Qu'est-ce que tu as écrit ?", note:"La foi n'est pas forcément religieuse.", declencheur:["sens","croyance"] },
  { id:"W02", theme:"Vocation", eclats:5, titre:"Ce pour quoi j'aurais pu tout laisser", invitation:"Il y a peut-être quelque chose que tu aurais voulu faire de ta vie — une vocation, un appel — que tu n'as pas suivi. Est-ce qu'il en reste quelque chose à nourrir autrement ?", retour:"Il en reste quelque chose ?", note:"Une vocation non suivie peut quand même être honorée, autrement.", declencheur:["sens","mission"] },
  { id:"RA01", theme:"Racines", eclats:3, titre:"Ce que mes origines m'ont donné", invitation:"Qu'est-ce que ta culture, ton pays, ta terre d'origine t'a donné que tu portes en toi — une façon d'être, une valeur, une force particulière ?", retour:"Qu'est-ce que tu as trouvé ?", note:"Les origines ne sont pas un destin. Elles sont une fondation.", declencheur:["identité","origines"] },

  // ── NOUVEAUX THÈMES ──────────────────────────────────────────────────────────

  // Intention
  { id:"IN01", theme:"Intention", eclats:3, titre:"Ce que je veux vraiment", invitation:"Avant d'agir aujourd'hui, pose-toi cette question : est-ce que je sais vraiment pourquoi je fais ce que je fais ? Écris l'intention derrière une chose importante.", retour:"Quelle était cette intention ?", note:"L'acte et l'intention sont deux choses différentes. L'un se voit. L'autre se choisit.", declencheur:["action","choix","décision"] },
  { id:"IN02", theme:"Intention", eclats:5, titre:"Poser une intention pour demain", invitation:"Ce soir, avant de t'endormir, pose une intention pour demain. Pas un objectif — une intention. Une façon d'être, pas une chose à faire.", retour:"Quelle intention as-tu posée ?", note:"Une intention n'est pas un plan. C'est une direction intérieure.", declencheur:["demain","changement"] },
  { id:"IN03", theme:"Intention", eclats:3, titre:"Quand mes actes et mes intentions divergent", invitation:"Pense à quelque chose que tu fais régulièrement. Est-ce que l'intention derrière cet acte est encore vraie ? Ou est-ce que tu continues par habitude ?", retour:"Qu'est-ce que tu as trouvé ?", note:"L'habitude n'est pas toujours une trahison. Mais elle mérite d'être regardée.", declencheur:["habitude","routine"] },

  // Intuition
  { id:"IU01", theme:"Intuition", eclats:3, titre:"Ce que tu savais déjà", invitation:"Pense à une situation où tu savais — avant même de réfléchir — ce qui était juste. Mais tu ne t'es pas écouté(e). Qu'est-ce qui t'en a empêché ?", retour:"Qu'est-ce qui t'a empêché de t'écouter ?", note:"L'intuition ne crie pas. Elle murmure. Et elle a souvent raison.", declencheur:["doute","hésitation","décision"] },
  { id:"IU02", theme:"Intuition", eclats:3, titre:"Le signal faible", invitation:"Aujourd'hui, observe un signal faible en toi — une légère résistance, un malaise discret, une petite voix. Ne l'analyse pas. Juste note-le.", retour:"Quel signal as-tu remarqué ?", note:"Ce qu'on ignore aujourd'hui revient souvent plus fort demain.", declencheur:["écoute","présence"] },

  // Instinct
  { id:"IS01", theme:"Instinct", eclats:3, titre:"Ce que mon corps savait", invitation:"Rappelle-toi une situation où ton corps a réagi avant ta tête — tension, malaise, élan soudain. Qu'est-ce qu'il essayait de te dire ?", retour:"Qu'est-ce que ton corps te disait ?", note:"Le corps garde la mémoire de ce que l'esprit préfère oublier.", declencheur:["corps","sensation","peur"] },
  { id:"IS02", theme:"Instinct", eclats:3, titre:"Quand j'ai ignoré mon instinct", invitation:"Y a-t-il une situation où tu as ignoré un sentiment instinctif fort et tu l'as regretté ? Qu'est-ce que tu en gardes ?", retour:"Qu'est-ce que ça t'a appris ?", note:"L'instinct n'est pas de la superstition. C'est de l'information.", declencheur:["regret","apprentissage"] },

  // Courage
  { id:"CO01", theme:"Courage", eclats:5, titre:"La chose que je reporte", invitation:"Il y a quelque chose que tu sais que tu dois faire — ou dire — et que tu reportes. Pas parce que tu ne sais pas comment. Parce que tu as peur. Nomme-le.", retour:"Tu l'as nommé ?", note:"Nommer sa peur est déjà un acte de courage.", declencheur:["peur","procrastination","évitement"] },
  { id:"CO02", theme:"Courage", eclats:3, titre:"Un courage ordinaire", invitation:"Pense à un moment récent où tu as fait quelque chose de difficile sans te plaindre, sans en parler. Reconnais-le aujourd'hui.", retour:"Quel était ce moment ?", note:"Le courage ordinaire est le plus réel. Personne ne l'applaudit.", declencheur:["force","résilience"] },
  { id:"CO03", theme:"Courage", eclats:5, titre:"Ce que je ferais si je n'avais pas peur", invitation:"Qu'est-ce que tu ferais si tu n'avais pas peur ? Pas dans dix ans — maintenant. Écris une réponse honnête.", retour:"Qu'est-ce que tu as écrit ?", note:"La peur n'a pas toujours tort. Mais elle n'a pas toujours raison non plus.", declencheur:["peur","liberté","choix"] },

  // Féminité
  { id:"FE01", theme:"Féminité", eclats:3, titre:"Ce qu'on m'a appris à cacher", invitation:"Qu'est-ce qu'on t'a dit — explicitement ou non — que tu ne devais pas montrer en tant que femme ? Ou en tant qu'homme ? Qu'est-ce que tu en penses aujourd'hui ?", retour:"Qu'est-ce qu'on t'a appris à cacher ?", note:"Les injonctions sur le genre ne disparaissent pas. Elles se revisitent.", declencheur:["genre","identité","honte"] },
  { id:"FE02", theme:"Féminité", eclats:3, titre:"Ce que je trouve beau en moi", invitation:"Nomme quelque chose que tu trouves beau en toi — pas une performance, pas une utilité. Quelque chose qui existe simplement.", retour:"Qu'est-ce que tu as trouvé ?", note:"Se voir avec bienveillance n'est pas de la vanité. C'est de la santé.", declencheur:["estime","corps","identité"] },

  // Protection
  { id:"PR01", theme:"Protection", eclats:3, titre:"Ce qui me protège vraiment", invitation:"Qu'est-ce qui te protège dans ta vie — une habitude, une valeur, une limite que tu t'es fixée ? Est-ce que cette protection est encore juste pour toi ?", retour:"Qu'est-ce qui te protège ?", note:"Certaines protections ont été construites dans la peur. D'autres dans la sagesse.", declencheur:["limites","sécurité"] },
  { id:"PR02", theme:"Protection", eclats:5, titre:"Poser une limite aujourd'hui", invitation:"Y a-t-il quelque chose — une situation, une personne, une habitude — qui te prend de l'énergie sans rien te donner ? Aujourd'hui, pose une limite. Même petite.", retour:"Quelle limite as-tu posée ?", note:"Poser une limite n'est pas rejeter l'autre. C'est se respecter.", declencheur:["énergie","épuisement","relations"] },
  { id:"PR03", theme:"Protection", eclats:3, titre:"Ce que je laisse entrer", invitation:"Qu'est-ce que tu laisses entrer dans ton espace intérieur — nouvelles, personnes, conversations — qui te diminue ? Qu'est-ce que tu pourrais filtrer davantage ?", retour:"Qu'est-ce que tu as identifié ?", note:"Ce qu'on consomme mentalement nous nourrit ou nous appauvrit.", declencheur:["énergie","espace","limites"] },

  // Méditation & présence
  { id:"ME01", theme:"Méditation", eclats:3, titre:"Trois respirations conscientes", invitation:"Maintenant. Pose ce que tu fais. Trois respirations longues, conscientes. Sens ton corps. Sens l'espace autour de toi. C'est tout.", retour:"Comment tu te sens après ?", note:"Trois respirations suffisent. Le reste est bonus.", declencheur:["stress","agitation","présence"] },
  { id:"ME02", theme:"Méditation", eclats:3, titre:"Observer sans juger", invitation:"Pendant cinq minutes aujourd'hui, observe tes pensées comme si tu regardais des nuages passer. Sans les suivre, sans les juger. Juste observer.", retour:"Comment c'était ?", note:"Méditer n'est pas vider le mental. C'est arrêter de lui obéir.", declencheur:["mental","pensées","rumination"] },
  { id:"ME03", theme:"Méditation", eclats:5, titre:"Un moment de silence complet", invitation:"Trouve dix minutes aujourd'hui où tu ne fais rien. Pas de musique, pas d'écran, pas de lecture. Juste toi et le silence.", retour:"Qu'est-ce qui s'est passé dans ce silence ?", note:"Le silence fait peur parce qu'il nous ramène à nous-mêmes.", declencheur:["agitation","solitude","intériorité"] },

  // Mémoires transgénérationnelles
  { id:"MT01", theme:"Mémoire transgénérationnelle", eclats:5, titre:"Ce que j'ai hérité sans le choisir", invitation:"Pense à une peur, une croyance, une façon de réagir que tu as — et que tu reconnais aussi chez un de tes parents ou grands-parents. Est-ce encore la tienne ?", retour:"Qu'est-ce que tu as reconnu ?", note:"On hérite de bien plus que des gènes. On hérite des peurs, des silences, des histoires non dites.", declencheur:["famille","héritage","patterns"] },
  { id:"MT02", theme:"Mémoire transgénérationnelle", eclats:5, titre:"Le silence familial", invitation:"Dans ta famille, de quoi ne parle-t-on jamais ? Quelle histoire est restée enfouie ? Tu n'as pas à la trouver — juste à reconnaître qu'elle existe peut-être.", retour:"Qu'est-ce que tu as reconnu ?", note:"Les silences familiaux parlent souvent plus fort que les mots.", declencheur:["famille","secret","origines"] },
  { id:"MT03", theme:"Mémoire transgénérationnelle", eclats:3, titre:"Ce que je veux transmettre", invitation:"Qu'est-ce que tu veux transmettre aux personnes qui viennent après toi — enfants, proches, élèves — que tu n'as peut-être pas reçu ?", retour:"Qu'est-ce que tu veux transmettre ?", note:"Briser un cycle commence par en prendre conscience.", declencheur:["transmission","famille","enfants"] },

  // Corps émotionnel et somatothérapie
  { id:"CE01", theme:"Corps émotionnel", eclats:3, titre:"Où est l'émotion dans mon corps ?", invitation:"Pense à quelque chose qui te pèse en ce moment. Maintenant ferme les yeux. Où est-ce que tu le sens dans ton corps ? Gorge, poitrine, ventre, nuque ?", retour:"Où l'as-tu senti ?", note:"Le corps ne ment pas. Il stocke ce que l'esprit préfère ignorer.", declencheur:["stress","émotion","corps"] },
  { id:"CE02", theme:"Corps émotionnel", eclats:3, titre:"Le message de la douleur", invitation:"Si tu as une tension physique récurrente — dos, tête, ventre, gorge — demande-toi : si cette douleur pouvait parler, qu'est-ce qu'elle dirait ?", retour:"Qu'est-ce qu'elle dirait ?", note:"Ce n'est pas de la magie. C'est de la psychosomatique.", declencheur:["douleur","corps","stress"] },
  { id:"CE03", theme:"Corps émotionnel", eclats:5, titre:"Libérer par le mouvement", invitation:"Aujourd'hui, bouge ton corps d'une façon qui libère — marche rapide, danse seul(e), secouement. Pas pour perdre du poids. Pour laisser sortir quelque chose.", retour:"Comment tu t'es senti(e) après ?", note:"Certaines émotions ne se parlent pas. Elles se bougent.", declencheur:["colère","tension","émotion"] },

  // Nœud intérieur
  { id:"NI01", theme:"Nœud intérieur", eclats:5, titre:"Ce qui est noué", invitation:"Il y a peut-être quelque chose en toi qui est bloqué depuis longtemps — une décision non prise, une relation non réglée, une vérité non dite. Tu n'as pas à le résoudre. Juste à le regarder.", retour:"Qu'est-ce que tu as regardé ?", note:"Parfois regarder un nœud suffit à le desserrer légèrement.", declencheur:["blocage","résistance","décision"] },
  { id:"NI02", theme:"Nœud intérieur", eclats:3, titre:"Ce que je n'arrive pas à lâcher", invitation:"Qu'est-ce que tu n'arrives pas à lâcher — une pensée, une personne, une situation — même quand tu sais que ce serait mieux de le faire ?", retour:"Qu'est-ce que tu n'arrives pas à lâcher ?", note:"S'accrocher n'est pas toujours de la faiblesse. Parfois c'est de l'amour qui ne sait pas encore comment finir.", declencheur:["attachement","lâcher prise","deuil"] },

  // Espace de vie
  { id:"EV01", theme:"Espace de vie", eclats:3, titre:"Mon environnement me ressemble-t-il ?", invitation:"Regarde l'espace dans lequel tu vis ou travailles. Est-ce qu'il te ressemble ? Est-ce qu'il te fait du bien ? S'il pouvait parler, que dirait-il sur toi ?", retour:"Qu'est-ce qu'il dirait ?", note:"L'espace qu'on habite nous habite en retour.", declencheur:["environnement","espace","maison"] },
  { id:"EV02", theme:"Espace de vie", eclats:3, titre:"Un geste pour mon espace", invitation:"Fais un geste aujourd'hui pour rendre ton espace un peu plus juste — ranger une chose, ajouter une plante, ouvrir une fenêtre. Quelque chose de concret.", retour:"Quel geste as-tu fait ?", note:"Prendre soin de son espace, c'est prendre soin de soi.", declencheur:["espace","soin","présence"] },

  // Vitalité
  { id:"VI01", theme:"Vitalité", eclats:3, titre:"Ce qui me donne de l'énergie", invitation:"Fais la liste de trois choses qui te donnent vraiment de l'énergie — pas ce que tu penses devoir faire, mais ce qui te recharge vraiment.", retour:"Quelles sont ces trois choses ?", note:"Connaître ses sources d'énergie permet de les protéger.", declencheur:["énergie","épuisement","soin"] },
  { id:"VI02", theme:"Vitalité", eclats:3, titre:"Ce qui me vide", invitation:"Fais maintenant la liste de ce qui te vide — situations, personnes, habitudes. Sans jugement. Juste l'inventaire.", retour:"Qu'est-ce qui te vide ?", note:"On ne peut pas tout changer d'un coup. Mais on peut commencer à voir.", declencheur:["énergie","épuisement","limites"] },
  { id:"VI03", theme:"Vitalité", eclats:5, titre:"Un acte de soin pour moi", invitation:"Aujourd'hui, fais une chose uniquement pour toi — pas pour être productif(ve), pas pour les autres. Une chose qui te nourrit.", retour:"Quelle chose as-tu faite pour toi ?", note:"Le soin de soi n'est pas de l'égoïsme. C'est une condition pour tout le reste.", declencheur:["soin","énergie","bienveillance"] },
];

const getInvitationDuJour = (data) => {
  const seed = new Date().getFullYear() * 1000 + new Date().getMonth() * 31 + new Date().getDate();
  // 1 fois sur 3 : contextuel selon intention
  if (data && seed % 3 !== 0) {
    const intention = (data.intention || "").toLowerCase();
    const situation = (data.situation || "").toLowerCase();
    const estParent = data.estParent === "oui" || data.estParent === "beau-parent";
    const estSepare = situation.includes("sép");
    if (estSepare && estParent) {
      const inv = INVITATIONS_ALBA.find(i => i.id === "PA01");
      if (inv) return inv;
    }
    if (intention.includes("pardon") || intention.includes("rupture")) {
      const candidates = INVITATIONS_ALBA.filter(i => i.theme === "Pardon");
      if (candidates.length) return candidates[seed % candidates.length];
    }
  }
  return INVITATIONS_ALBA[seed % INVITATIONS_ALBA.length];
};

const InvitationDuJour = ({ data, onComplete, onEchec }) => {
  const inv = getInvitationDuJour(data);
  const storageKey = `alba_invitation_${new Date().toDateString()}`;
  const [statut, setStatut] = React.useState(() => {
    try { return localStorage.getItem(storageKey) || "pending"; } catch { return "pending"; }
  });
  const [showRetour, setShowRetour] = React.useState(false);
  const [reponse, setReponse] = React.useState("");

  if (statut === "done") return (
    <div style={{ textAlign:"center", padding:"1.5rem", background:`${T.or}08`, borderRadius:8, border:`1px solid ${T.or}18` }}>
      <p style={{ fontFamily:T.sans, fontSize:"0.45rem", letterSpacing:"0.4em", textTransform:"uppercase", color:`${T.or}88`, marginBottom:"0.5rem" }}>INVITATION DU JOUR — ACCOMPLIE</p>
      <p style={{ fontFamily:T.serif, fontStyle:"italic", fontSize:"0.85rem", color:`${T.brume}77` }}>{inv.note}</p>
    </div>
  );

  if (showRetour) return (
    <div style={{ padding:"1.5rem", background:`${T.or}06`, borderRadius:8, border:`1px solid ${T.or}15` }}>
      <p style={{ fontFamily:T.serif, fontStyle:"italic", fontSize:"0.9rem", color:T.brume, marginBottom:"1rem" }}>{inv.retour}</p>
      <textarea value={reponse} onChange={e => setReponse(e.target.value)} placeholder="Tu peux répondre ici…" rows={3}
        style={{ width:"100%", background:"transparent", border:`1px solid ${T.or}22`, borderRadius:6, color:T.aube, fontFamily:T.serif, fontStyle:"italic", fontSize:"0.9rem", padding:"0.6rem", resize:"none", outline:"none" }} />
      <div style={{ display:"flex", gap:"0.8rem", marginTop:"1rem", justifyContent:"center" }}>
        <button onClick={() => {
          try { localStorage.setItem(storageKey, "done"); } catch {}
          setStatut("done");
          if (onComplete) onComplete(inv.eclats);
        }} style={{ background:`${T.or}22`, border:`1px solid ${T.or}66`, borderRadius:24, padding:"0.5rem 1.3rem", fontFamily:T.serif, fontStyle:"italic", fontSize:"0.85rem", color:T.or, cursor:"pointer" }}>
          {"✦".repeat(inv.eclats)} J'ai fait ça
        </button>
        <button onClick={() => {
          try { localStorage.setItem(storageKey, "done"); } catch {}
          setStatut("done");
          if (onEchec) onEchec();
        }} style={{ background:"transparent", border:`1px solid ${T.brume}22`, borderRadius:24, padding:"0.5rem 1.3rem", fontFamily:T.serif, fontStyle:"italic", fontSize:"0.85rem", color:`${T.brume}66`, cursor:"pointer" }}>
          Je n'ai pas réussi
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ padding:"1.5rem", background:`${T.or}06`, borderRadius:8, border:`1px solid ${T.or}15` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.8rem" }}>
        <p style={{ fontFamily:T.sans, fontSize:"0.42rem", letterSpacing:"0.4em", textTransform:"uppercase", color:`${T.or}77`, margin:0 }}>INVITATION DU JOUR</p>
        <p style={{ fontFamily:T.sans, fontSize:"0.42rem", letterSpacing:"0.3em", textTransform:"uppercase", color:`${T.brume}44`, margin:0 }}>{"✦".repeat(inv.eclats)} {inv.eclats} éclat{inv.eclats > 1 ? "s" : ""}</p>
      </div>
      <p style={{ fontFamily:T.serif, fontWeight:300, fontSize:"clamp(1rem,3.5vw,1.1rem)", color:T.orPale, lineHeight:1.8, marginBottom:"0.6rem" }}>{inv.titre}</p>
      <p style={{ fontFamily:T.serif, fontStyle:"italic", fontSize:"0.9rem", color:`${T.brume}88`, lineHeight:1.7, marginBottom:"1.2rem" }}>{inv.invitation}</p>
      <button onClick={() => setShowRetour(true)} style={{ background:"transparent", border:`1px solid ${T.or}44`, borderRadius:24, padding:"0.55rem 1.4rem", fontFamily:T.serif, fontStyle:"italic", fontSize:"0.9rem", color:T.or, cursor:"pointer" }}>
        J'accepte cette invitation
      </button>
    </div>
  );
};

const Accueil = ({ data, onNavigate, cleActive = 0, progressStats, onInvitationComplete, onInvitationEchec, isPremium, onShowPaywall }) => {
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
  const phraseDuJour = getQuestionDuJour(data);

  // ── Rythme circadien ─────────────────────────────────────────────────────
  const CIRCADIEN = heure >= 5 && heure < 11 ? {
    id: "matin",
    img: "/v2/matin.jpg",
    energie: "haute",
    accent: "#C8A048",
    invite: "Le cortisol est à son pic. C'est le bon moment pour faire ce qui compte.",
    action: "Qu'est-ce que tu veux accomplir ce matin ?",
    suggestion: "ardoise",
  } : heure >= 11 && heure < 16 ? {
    id: "midi",
    img: "/v2/midi.jpg",
    energie: "moyenne",
    accent: "#7BA88A",
    invite: "La clarté du milieu de journée. Bon moment pour ancrer, pas pour forcer.",
    action: "Prends un instant pour toi.",
    suggestion: "evasion",
  } : heure >= 16 && heure < 21 ? {
    id: "soir",
    img: "/v2/soir.jpg",
    energie: "douce",
    accent: "#C87048",
    invite: "Le cortisol descend. Ton corps commence à déposer.",
    action: "Qu'est-ce que tu gardes de cette journée ?",
    suggestion: "ardoise",
  } : {
    id: "nuit",
    img: "/v2/nuit.jpg",
    energie: "basse",
    accent: "#7898C8",
    invite: "L'heure du silence. Rien ne presse. Tu peux laisser aller.",
    action: "Repose-toi.",
    suggestion: "presence",
  };

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

      if (joursAbsence >= 14) return "Tu reviens après un long moment. Quelque chose t'attendait.";
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
    { id: "evasion",      label: "Évasion",       desc: "Un espace de beauté",       couleur: "#9EC8B4" },
    { id: "souffle",      label: "Souffle",       desc: "Respirer",                  couleur: "#D4856A" },
    { id: "sagesses",     label: "Sagesses",      desc: "Les sagesses du monde",     couleur: "#A89060" },
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
      </div>

      {/* ── RYTHME CIRCADIEN ── */}
      <div style={{
        margin: "1.2rem 1.5rem 0",
        borderRadius: "12px", overflow: "hidden",
        position: "relative", minHeight: 130,
        animation: "fadeUp 0.7s ease forwards 0.15s", opacity: 0,
      }}>
        {/* Photo de fond */}
        <img src={CIRCADIEN.img} alt="" style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "center",
        }}/>
        {/* Overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg, rgba(10,8,6,0.88) 45%, rgba(10,8,6,0.35) 100%)",
        }}/>
        {/* Bande couleur gauche */}
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
          background: `linear-gradient(to bottom, ${CIRCADIEN.accent}, ${CIRCADIEN.accent}44)`,
        }}/>
        {/* Contenu */}
        <div style={{ position: "relative", zIndex: 1, padding: "1.3rem 1.5rem" }}>
          <div style={{
            fontFamily: T.sans, fontWeight: 300, fontSize: "0.42rem",
            letterSpacing: "0.45em", textTransform: "uppercase",
            color: CIRCADIEN.accent, marginBottom: "0.6rem",
          }}>
            {CIRCADIEN.id === "matin" ? "● Pic de cortisol" : CIRCADIEN.id === "midi" ? "● Milieu de journée" : CIRCADIEN.id === "soir" ? "● Descente du soir" : "● Heure du silence"}
          </div>
          <div style={{
            fontFamily: T.serif, fontStyle: "italic",
            fontSize: "clamp(0.88rem, 3vw, 0.98rem)",
            color: T.orPale, lineHeight: 1.7, marginBottom: "0.5rem",
          }}>{CIRCADIEN.invite}</div>
          <div style={{
            fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem",
            letterSpacing: "0.15em", color: `${T.brume}99`,
            cursor: "pointer",
          }} onClick={() => onNavigate?.(CIRCADIEN.suggestion)}>
            {CIRCADIEN.action} →
          </div>
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

      {/* ── INVITATION DU JOUR ── */}
      <div style={{ margin: "1rem 1.5rem 0", animation: "fadeUp 0.7s ease forwards 0.4s", opacity: 0 }}>
        <InvitationDuJour data={data} onComplete={onInvitationComplete} onEchec={onInvitationEchec} />
      </div>

      {/* ── PARCOURS THÉMATIQUES ── */}
      <div style={{ margin: "1.5rem 1.5rem 0", animation: "fadeUp 0.7s ease forwards 0.5s", opacity: 0 }}>
        <ParcoursDuJour data={data} isPremium={isPremium} onShowPaywall={onShowPaywall} />
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

      {/* ── ANNEAUX DU JOUR ── */}
      <AnneauxJour compact={true} />

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
              // Centre le 5e bouton (Souffle) s'il est seul sur sa ligne
              gridColumn: i === ENTREES.length - 1 && ENTREES.length % 2 !== 0 ? "1 / -1" : undefined,
              maxWidth: i === ENTREES.length - 1 && ENTREES.length % 2 !== 0 ? "50%" : undefined,
              margin: i === ENTREES.length - 1 && ENTREES.length % 2 !== 0 ? "0 auto" : undefined,
              width: i === ENTREES.length - 1 && ENTREES.length % 2 !== 0 ? "100%" : undefined,
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

        // Croise avec le baromètre nerveux du jour
        const todayKey = new Date().toISOString().split("T")[0];
        const etatNerveux = (() => { try { return localStorage.getItem("alba_barometre_" + todayKey); } catch { return null; } })();
        if (etatNerveux === "effondre" || etatNerveux === "fige") {
          etatsDetectes.unshift("burn-out"); // priorité aux ressources apaisantes
        } else if (etatNerveux === "mobilise") {
          etatsDetectes.unshift("anxiete");
        } else if (etatNerveux === "securite") {
          etatsDetectes.push("croissance"); // opportunité d'explorer
        }

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
// ─── LE CIEL — Offrandes ────────────────────────────────────────────────────────

// ─── LE CIEL — Offrandes ──────────────────────────────────────────────────────

const ICONES_CIEL = {
  livre:        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="13" y2="11"/></svg>,
  conversation: <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  pratique:     <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>,
  decouverte:   <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  phrase:       <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
  moment:       <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  autre:        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>,
};

const CATEGORIES_CIEL = [
  { id: "livre",        label: "Un livre",          couleur: "#C8A96E" },
  { id: "conversation", label: "Une conversation",  couleur: "#7898C8" },
  { id: "pratique",     label: "Une pratique",       couleur: "#78A878" },
  { id: "decouverte",   label: "Une découverte",     couleur: "#9878C8" },
  { id: "phrase",       label: "Une phrase",         couleur: "#C8A040" },
  { id: "moment",       label: "Un moment",          couleur: "#C87878" },
  { id: "autre",        label: "Autre chose",        couleur: "#A8A898" },
];

const genererEtoilesCiel = (offrandes) => {
  const rng = (seed) => { let x = Math.sin(seed) * 10000; return x - Math.floor(x); };
  const points = [];
  for (let i = 0; i < 180; i++) {
    const cat = CATEGORIES_CIEL[Math.floor(rng(i * 7.3) * CATEGORIES_CIEL.length)];
    const twinkleIdx = Math.floor(rng(i * 8.3) * 3);
    const twinkleDur = 4 + rng(i * 11.7) * 12;
    const twinkleDelay = rng(i * 6.1) * 8;
    points.push({
      id: `bg_${i}`, x: rng(i * 3.7) * 100, y: rng(i * 5.1) * 100,
      couleur: cat.couleur, taille: 1 + rng(i * 2.3) * 1.5,
      opacite: 0.08 + rng(i * 4.1) * 0.22, isReal: false, data: null,
      twinkleAnim: `star-twinkle-${twinkleIdx + 1} ${twinkleDur}s ${twinkleDelay}s ease-in-out infinite`,
    });
  }
  offrandes.forEach((o, i) => {
    const cat = CATEGORIES_CIEL.find(c => c.id === o.categorie) || CATEGORIES_CIEL[6];
    points.push({
      id: `real_${o.id || i}`,
      x: 5 + rng((o.created_at || i) * 9.1 + 1) * 90,
      y: 5 + rng((o.created_at || i) * 6.7 + 2) * 85,
      couleur: cat.couleur, taille: 3 + rng(i * 1.7) * 2,
      opacite: 0.6 + rng(i * 3.3) * 0.35, isReal: true,
      data: o,
      twinkleAnim: `alba-breathe ${6 + rng(i * 5.1) * 8}s ${rng(i * 2.3) * 4}s ease-in-out infinite`,
    });
  });
  return points;
};

const CielCairn = ({ userId, db }) => {
  const [introVue, setIntroVue] = useState(() => {
    try { return localStorage.getItem("alba_ciel_intro_vue") === "1"; } catch { return false; }
  });
  const [etape, setEtape] = useState(0); // 0=ciel 1=categorie 2=texte 3=transformation 4=geo 5=geste 6=envol 7=retour
  const [categorie, setCategorie] = useState(null);
  const [texte, setTexte] = useState("");
  const [textePoetique, setTextePoetique] = useState("");
  const [ville, setVille] = useState("");
  const [geoAccepted, setGeoAccepted] = useState(null);
  const [offrandes, setOffrandes] = useState([]);
  const [nouvelleOffrande, setNouvelleOffrande] = useState(null);
  const [dejaFaitAujd, setDejaFaitAujd] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [particules, setParticules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [etoileSelectionnee, setEtoileSelectionnee] = useState(null);
  const [shootingStarActive, setShootingStarActive] = useState(null);
  const holdIntervalRef = useRef(null);
  const today = new Date().toISOString().split("T")[0];

  // Charger les offrandes
  useEffect(() => {
    const charger = async () => {
      try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/alba_ciel_offrandes?select=id,categorie,texte_poetique,couleur,ville,pays,created_at&order=created_at.desc&limit=400`, {
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
        });
        if (r.ok) { const d = await r.json(); setOffrandes(d); }
      } catch {}
      try {
        const fait = localStorage.getItem(`alba_cairn_${today}`);
        if (fait) setDejaFaitAujd(true);
      } catch {}
    };
    charger();
  }, []);

  // Étoile filante
  useEffect(() => {
    const DIRECTIONS = ["lr", "rl", "diag"];
    const lancer = () => {
      const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      setShootingStarActive({ id: Date.now(), x: 10 + Math.random() * 70, y: 5 + Math.random() * 40, dir });
      setTimeout(() => setShootingStarActive(null), 1400);
      setTimeout(lancer, 12000 + Math.random() * 10000);
    };
    const t = setTimeout(lancer, 5000);
    return () => clearTimeout(t);
  }, []);

  // Envol étape 6
  useEffect(() => {
    if (etape !== 6) return;
    sauvegarderOffrande();
    const t = setTimeout(() => setEtape(7), 3000);
    return () => clearTimeout(t);
  }, [etape]);

  const etoiles = useMemo(() => genererEtoilesCiel(offrandes), [offrandes]);

  // Transformation poétique via ALBA
  const transformer = async () => {
    if (!texte.trim()) return;
    setLoading(true);
    setEtape(3);
    try {
      const catLabel = categorie?.label || "quelque chose";
      const prompt = `Quelqu'un dépose dans un ciel partagé : "${texte.trim()}" (catégorie : ${catLabel}).

Transforme ceci en une phrase poétique, sobre, universelle — qui pourrait toucher quelqu'un qui n'a pas vécu exactement la même chose mais qui pourrait la reconnaître. Entre 10 et 22 mots. Pas de guillemets. Pas de signature. Juste la phrase.`;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          max_tokens: 80,
          system: "Tu es une présence poétique sobre. Tu distilles des expériences humaines en phrases universelles.",
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const d = await res.json();
      const poetique = d.content?.[0]?.text?.trim() || texte.trim();
      setTextePoetique(poetique);
    } catch {
      setTextePoetique(texte.trim());
    }
    setLoading(false);
  };

  // Géolocalisation
  const demanderGeo = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
            const d = await r.json();
            setVille(d.address?.city || d.address?.town || d.address?.village || "");
          } catch { setVille(""); }
        },
        () => setVille("")
      );
    }
  };

  // Sauvegarder
  const sauvegarderOffrande = async () => {
    const offrande = {
      categorie: categorie?.id || "autre",
      texte_brut: texte.trim(),
      texte_poetique: textePoetique,
      couleur: categorie?.couleur || "#C8A96E",
      ville: ville || null,
      pays: null,
      user_token: userId || "anon",
      created_at: new Date().toISOString(),
    };
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/alba_ciel_offrandes`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(offrande),
      });
      localStorage.setItem(`alba_cairn_${today}`, "1");
      setDejaFaitAujd(true);
    } catch {}
    setNouvelleOffrande({ x: 10 + Math.random() * 80, y: 10 + Math.random() * 30, couleur: categorie?.couleur || "#C8A96E" });
    setOffrandes(prev => [...prev, { ...offrande, id: Date.now() }]);
  };

  // Geste maintien
  const startHold = () => {
    setIsHolding(true);
    let progress = 0;
    holdIntervalRef.current = setInterval(() => {
      progress += 2;
      setHoldProgress(progress);
      if (progress % 10 === 0) {
        setParticules(prev => [...prev, {
          id: Date.now() + Math.random(),
          angle: Math.random() * 360,
          distance: 40 + Math.random() * 30,
          size: 2 + Math.random() * 3,
          couleur: categorie?.couleur || "#C8A96E",
        }]);
      }
      if (progress >= 100) {
        clearInterval(holdIntervalRef.current);
        setIsHolding(false);
        setHoldProgress(100);
        try { const a = new Audio("/sons/cairn.mp3"); a.volume = 0.2; a.play().catch(()=>{}); } catch {}
        setTimeout(() => setEtape(6), 300);
      }
    }, 30);
  };
  const stopHold = () => {
    clearInterval(holdIntervalRef.current);
    setIsHolding(false);
    if (holdProgress < 100) setHoldProgress(0);
  };
  useEffect(() => () => clearInterval(holdIntervalRef.current), []);

  // ── CIEL ─────────────────────────────────────────────────────────────────
  const CielView = ({ showNouvelleEtoile }) => (
    <div style={{ position: "relative", width: "100%", height: "calc(100vh - 3.2rem - 4.8rem)", background: "#030205", overflow: "hidden", zIndex: 1 }}>
      {/* Nébuleuses animées */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% 40%, #1A0F2A55 0%, transparent 70%)", animation: "nebula-drift 20s ease-in-out infinite", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 50% 40% at 30% 60%, #0F1A2A33 0%, transparent 60%)", animation: "nebula-drift 28s ease-in-out infinite reverse", pointerEvents: "none" }} />

      {/* Étoile filante */}
      {shootingStarActive && (
        <div key={shootingStarActive.id} style={{
          position: "absolute", left: `${shootingStarActive.x}%`, top: `${shootingStarActive.y}%`,
          width: 65, height: 1.5,
          background: shootingStarActive.dir === "rl"
            ? `linear-gradient(to left, transparent, ${T.orPale}dd, ${T.orPale}44)`
            : `linear-gradient(to right, transparent, ${T.orPale}dd, ${T.orPale}44)`,
          borderRadius: 2, boxShadow: `0 0 4px ${T.orPale}88`,
          animation: `shooting-star-${shootingStarActive.dir} 1.2s ease-out forwards`, zIndex: 5,
        }} />
      )}

      {/* Étoiles ✦ */}
      {etoiles.map(e => (
        <div key={e.id}
          onClick={() => e.isReal && e.data && setEtoileSelectionnee(e.data)}
          style={{
            position: "absolute",
            left: `${e.x}%`, top: `${e.y}%`,
            transform: "translate(-50%, -50%)",
            fontSize: e.isReal ? `${e.taille * 3.5}px` : `${e.taille * 2.5}px`,
            color: e.couleur,
            opacity: e.opacite,
            lineHeight: 1,
            textShadow: e.isReal ? `0 0 ${e.taille * 4}px ${e.couleur}88, 0 0 ${e.taille * 8}px ${e.couleur}44` : "none",
            animation: e.twinkleAnim || "none",
            cursor: e.isReal && e.data ? "pointer" : "default",
            transition: "transform 0.2s, font-size 0.2s",
            zIndex: e.isReal ? 10 : 1,
            userSelect: "none",
            pointerEvents: e.isReal && e.data ? "auto" : "none",
            padding: e.isReal && e.data ? "8px" : "0",
            margin: e.isReal && e.data ? "-8px" : "0",
          }}
          onMouseEnter={ev => { if (e.isReal) ev.currentTarget.style.transform = "translate(-50%, -50%) scale(2)"; }}
          onMouseLeave={ev => { ev.currentTarget.style.transform = "translate(-50%, -50%) scale(1)"; }}
        >✦</div>
      ))}

      {/* Nouvelle étoile ✦ */}
      {showNouvelleEtoile && nouvelleOffrande && (
        <div style={{
          position: "absolute", left: `${nouvelleOffrande.x}%`, top: `${nouvelleOffrande.y}%`,
          transform: "translate(-50%, -50%)",
          fontSize: "18px", color: nouvelleOffrande.couleur,
          textShadow: `0 0 12px ${nouvelleOffrande.couleur}, 0 0 30px ${nouvelleOffrande.couleur}88, 0 0 60px ${nouvelleOffrande.couleur}44`,
          animation: "alba-breathe 2s ease-in-out infinite",
          zIndex: 10, lineHeight: 1, userSelect: "none",
        }}>✦</div>
      )}

      {/* Popup étoile sélectionnée */}
      {etoileSelectionnee && (
        <div onClick={() => setEtoileSelectionnee(null)} style={{
          position: "fixed", inset: 0, background: "#030205cc", zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem",
          backdropFilter: "blur(4px)",
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#0D0A12", border: `1px solid ${(CATEGORIES_CIEL.find(c => c.id === etoileSelectionnee.categorie) || CATEGORIES_CIEL[6]).couleur}44`,
            borderRadius: "12px", padding: "2rem 1.8rem", maxWidth: 320, textAlign: "center",
            animation: "fadeUp 0.4s ease forwards",
          }}>
            <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.42rem", letterSpacing: "0.5em", textTransform: "uppercase", color: `${(CATEGORIES_CIEL.find(c => c.id === etoileSelectionnee.categorie) || CATEGORIES_CIEL[6]).couleur}99`, marginBottom: "1.2rem" }}>
              {(CATEGORIES_CIEL.find(c => c.id === etoileSelectionnee.categorie) || CATEGORIES_CIEL[6]).icon}&nbsp;
              {(CATEGORIES_CIEL.find(c => c.id === etoileSelectionnee.categorie) || CATEGORIES_CIEL[6]).label}
            </div>
            <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "1.05rem", color: T.orPale, lineHeight: 1.9, margin: "0 0 1.4rem" }}>
              "{etoileSelectionnee.texte_poetique}"
            </p>
            {(etoileSelectionnee.ville || etoileSelectionnee.pays) && (
              <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.42rem", letterSpacing: "0.4em", textTransform: "uppercase", color: `${T.brume}55` }}>
                {etoileSelectionnee.ville}{etoileSelectionnee.ville && etoileSelectionnee.pays ? " · " : ""}{etoileSelectionnee.pays}
                {etoileSelectionnee.created_at && ` · ${new Date(etoileSelectionnee.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`}
              </div>
            )}
            <button onClick={() => setEtoileSelectionnee(null)} style={{ marginTop: "1.5rem", background: "none", border: `1px solid ${T.brume}22`, borderRadius: "20px", padding: "0.5rem 1.5rem", color: `${T.brume}66`, fontFamily: T.sans, fontSize: "0.5rem", letterSpacing: "0.3em", cursor: "pointer" }}>Fermer</button>
          </div>
        </div>
      )}

      {/* Compteur + bouton */}
      <div style={{ position: "absolute", bottom: "3.8rem", left: 0, right: 0, textAlign: "center", zIndex: 20 }}>
        <p style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.42rem", letterSpacing: "0.5em", textTransform: "uppercase", color: `${T.brume}44` }}>
          {offrandes.length + 200} lumières dans ce ciel ce soir
        </p>
      </div>
      <div style={{ position: "absolute", bottom: "0.8rem", left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 20 }}>
        {etape === 7 ? (
          <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.95rem", color: `${nouvelleOffrande?.couleur || T.or}cc` }}>
            Ta lumière est là-haut. Quelqu'un la verra.
          </p>
        ) : (
          <button onClick={() => dejaFaitAujd ? setEtape("deja") : setEtape(1)} style={{
            background: "transparent", border: `1px solid ${T.or}33`,
            borderRadius: "30px", padding: "0.9rem 2.2rem",
            fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem",
            letterSpacing: "0.5em", textTransform: "uppercase",
            color: `${T.or}EE`, cursor: "pointer", transition: "all 0.4s ease",
          }}>
            Déposer une offrande
          </button>
        )}
      </div>
    </div>
  );

  // ── INTRO ────────────────────────────────────────────────────────────────
  if (!introVue) return (
    <div style={{ minHeight: "100vh", background: "#060408", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2.5rem", animation: "fadeIn 1s ease forwards" }}>
      {[...Array(40)].map((_, i) => (
        <div key={i} style={{ position: "absolute", left: `${Math.random()*100}%`, top: `${Math.random()*100}%`, width: Math.random()*2+1, height: Math.random()*2+1, borderRadius: "50%", background: `rgba(${180+Math.floor(Math.random()*60)},${160+Math.floor(Math.random()*60)},${100+Math.floor(Math.random()*80)},${0.3+Math.random()*0.5})`, pointerEvents: "none" }}/>
      ))}
      <div style={{ textAlign: "center", maxWidth: 320, position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: "1.8rem", marginBottom: "2rem", filter: "drop-shadow(0 0 12px rgba(200,169,110,0.6))" }}>✦</div>
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontWeight: 300, fontSize: "clamp(1.1rem, 4vw, 1.3rem)", color: T.orPale, lineHeight: 1.9, marginBottom: "1rem", animation: "fadeUp 0.8s ease forwards 0.3s", opacity: 0 }}>
          Ce que tu as traversé<br/>peut éclairer quelqu'un d'autre.
        </p>
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontWeight: 300, fontSize: "clamp(0.9rem, 3vw, 1rem)", color: `${T.brume}99`, lineHeight: 1.9, marginBottom: "2.5rem", animation: "fadeUp 0.8s ease forwards 0.8s", opacity: 0 }}>
          Chaque offrande déposée ici<br/>devient une étoile dans le ciel partagé.
        </p>
        <button onClick={() => { try { localStorage.setItem("alba_ciel_intro_vue", "1"); } catch {} setIntroVue(true); }}
          style={{ background: "none", border: "1px solid rgba(200,169,110,0.35)", borderRadius: "6px", padding: "0.85rem 2.5rem", fontFamily: T.sans, fontWeight: 300, fontSize: "0.68rem", letterSpacing: "0.5em", textTransform: "uppercase", color: "#C8A96E", cursor: "pointer", animation: "fadeUp 0.8s ease forwards 1.4s", opacity: 0, transition: "all 0.2s" }}>
          Entrer
        </button>
      </div>
    </div>
  );

  if (etape === 0 || etape === 7) return <CielView showNouvelleEtoile={etape === 7} />;

  // ── DÉJÀ FAIT AUJOURD'HUI ────────────────────────────────────────────────
  if (etape === "deja") return (
    <div style={{ minHeight: "100vh", background: "#060408", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
      <div style={{ fontSize: "1.4rem", color: T.or, marginBottom: "2rem", animation: "alba-breathe 4s ease-in-out infinite" }}>✦</div>
      <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "clamp(1rem,4vw,1.2rem)", color: T.orPale, lineHeight: 1.9, marginBottom: "0.8rem" }}>
        Ton offrande brille déjà là-haut.
      </p>
      <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.85rem", color: `${T.brume}77`, lineHeight: 1.8, marginBottom: "2.5rem" }}>
        Une lumière par jour suffit.<br/>Reviens demain pour en déposer une autre.
      </p>
      <button onClick={() => setEtape(0)} style={{ background: "transparent", border: `1px solid ${T.or}33`, borderRadius: "30px", padding: "0.8rem 2rem", fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem", letterSpacing: "0.45em", textTransform: "uppercase", color: `${T.or}99`, cursor: "pointer" }}>
        Contempler le ciel
      </button>
    </div>
  );

  // ── ÉTAPE 1 : Catégorie ──────────────────────────────────────────────────
  if (etape === 1) return (
    <div style={{ minHeight: "100vh", background: "#060408", display: "flex", flexDirection: "column", justifyContent: "center", padding: "2rem 1.5rem", overflowY: "auto" }}>
      <button onClick={() => setEtape(0)} style={{ position: "absolute", top: "1.5rem", left: "1.5rem", background: "none", border: "none", color: `${T.brume}55`, fontFamily: T.sans, fontSize: "0.5rem", letterSpacing: "0.3em", cursor: "pointer" }}>← Retour</button>
      <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "clamp(1rem,4vw,1.25rem)", color: T.orPale, textAlign: "center", lineHeight: 1.9, marginBottom: "0.8rem", animation: "fadeUp 0.7s ease forwards" }}>
        Qu'est-ce que tu veux offrir<br/>à ceux qui traversent la même chose ?
      </p>
      <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.8rem", color: `${T.brume}55`, textAlign: "center", marginBottom: "2rem", lineHeight: 1.7 }}>Un livre, une pratique, une phrase qui t'a aidé…</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", maxWidth: 360, width: "100%", margin: "0 auto" }}>
        {CATEGORIES_CIEL.map((c, i) => (
          <button key={c.id} onClick={() => { setCategorie(c); setEtape(2); }}
            style={{ background: "transparent", border: `1px solid ${c.couleur}25`, borderLeft: `3px solid ${c.couleur}66`, borderRadius: "8px", padding: "0.9rem 1.2rem", fontFamily: T.serif, fontStyle: "italic", fontSize: "1rem", color: T.aube, cursor: "pointer", textAlign: "left", animation: `fadeUp 0.4s ease forwards ${i * 0.05}s`, opacity: 0, display: "flex", alignItems: "center", gap: "0.8rem" }}
            onMouseEnter={e => e.currentTarget.style.background = `${c.couleur}12`}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <span style={{ color: c.couleur, display: "flex", alignItems: "center" }}>{ICONES_CIEL[c.id]}</span>
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );

  // ── ÉTAPE 2 : Texte ──────────────────────────────────────────────────────
  if (etape === 2) return (
    <div style={{ minHeight: "100vh", background: "#060408", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <button onClick={() => setEtape(1)} style={{ position: "absolute", top: "1.5rem", left: "1.5rem", background: "none", border: "none", color: `${T.brume}55`, fontFamily: T.sans, fontSize: "0.5rem", letterSpacing: "0.3em", cursor: "pointer" }}>← Retour</button>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 40%, ${categorie.couleur}08 0%, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ width: "100%", maxWidth: 360, position: "relative", zIndex: 1 }}>
        <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.45rem", letterSpacing: "0.5em", textTransform: "uppercase", color: `${categorie.couleur}88`, marginBottom: "0.8rem", textAlign: "center" }}>
          {categorie.icon} {categorie.label}
        </div>
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "clamp(1rem,4vw,1.2rem)", color: T.orPale, textAlign: "center", lineHeight: 1.9, marginBottom: "2rem", animation: "fadeUp 0.7s ease forwards" }}>
          C'était quoi, exactement ?
        </p>
        <textarea value={texte} onChange={e => setTexte(e.target.value)}
          placeholder="En une ou deux phrases — le titre d'un livre, le nom d'une pratique, une phrase qui t'a changé…"
          rows={4} autoFocus
          style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${texte ? categorie.couleur + "55" : T.brume + "22"}`, color: T.aube, fontFamily: T.serif, fontStyle: "italic", fontSize: "1rem", padding: "0.5rem 0", outline: "none", resize: "none", boxSizing: "border-box", lineHeight: 1.7, transition: "border-color 0.3s" }} />
        <button onClick={transformer} disabled={!texte.trim() || loading}
          style={{ marginTop: "2rem", background: texte.trim() ? `${categorie.couleur}22` : "transparent", border: `1px solid ${texte.trim() ? categorie.couleur + "55" : T.brume + "22"}`, borderRadius: "30px", padding: "0.8rem 2rem", fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem", letterSpacing: "0.45em", textTransform: "uppercase", color: texte.trim() ? categorie.couleur : `${T.brume}44`, cursor: texte.trim() ? "pointer" : "default", display: "block", margin: "2rem auto 0", transition: "all 0.3s" }}>
          {loading ? "Un instant…" : "Continuer →"}
        </button>
      </div>
    </div>
  );

  // ── ÉTAPE 3 : Transformation ─────────────────────────────────────────────
  if (etape === 3) return (
    <div style={{ minHeight: "100vh", background: "#060408", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      {loading ? (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.4rem", color: categorie.couleur, animation: "starSpin 3s linear infinite", display: "inline-block", marginBottom: "1.5rem" }}>✦</div>
          <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.9rem", color: `${T.brume}88` }}>Ce que tu offres prend forme…</p>
        </div>
      ) : (
        <div style={{ width: "100%", maxWidth: 360, textAlign: "center", animation: "fadeUp 0.7s ease forwards" }}>
          <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.42rem", letterSpacing: "0.5em", textTransform: "uppercase", color: `${categorie.couleur}77`, marginBottom: "1.5rem" }}>Ton offrande</div>
          <div style={{ background: `${T.nuit2}cc`, border: `1px solid ${categorie.couleur}33`, borderRadius: "10px", padding: "1.8rem 1.6rem", marginBottom: "2rem" }}>
            <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "1.1rem", color: T.orPale, lineHeight: 1.9, margin: 0 }}>
              "{textePoetique}"
            </p>
          </div>
          <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.75rem", color: `${T.brume}55`, marginBottom: "2rem", lineHeight: 1.7 }}>
            C'est ainsi qu'elle brillera pour les autres.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <button onClick={() => { setTextePoetique(""); transformer(); }}
              style={{ background: "none", border: `1px solid ${T.brume}33`, borderRadius: "20px", padding: "0.6rem 1.2rem", fontFamily: T.sans, fontSize: "0.48rem", letterSpacing: "0.3em", color: `${T.brume}77`, cursor: "pointer" }}>
              Reformuler
            </button>
            <button onClick={() => setEtape(4)}
              style={{ background: `${categorie.couleur}22`, border: `1px solid ${categorie.couleur}55`, borderRadius: "20px", padding: "0.6rem 1.5rem", fontFamily: T.sans, fontSize: "0.48rem", letterSpacing: "0.3em", color: categorie.couleur, cursor: "pointer" }}>
              C'est juste →
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ── ÉTAPE 4 : Géolocalisation ────────────────────────────────────────────
  if (etape === 4) return (
    <div style={{ minHeight: "100vh", background: "#060408", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: 340, textAlign: "center", animation: "fadeUp 0.7s ease forwards" }}>
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "clamp(1rem,4vw,1.15rem)", color: T.orPale, lineHeight: 1.9, marginBottom: "0.8rem" }}>
          Veux-tu qu'on sache<br/>d'où vient cette lumière ?
        </p>
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.75rem", color: `${T.brume}55`, marginBottom: "2.5rem", lineHeight: 1.7 }}>
          Juste la ville — rien d'autre.<br/>Complètement facultatif.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
          <button onClick={() => { setGeoAccepted(true); demanderGeo(); setEtape(5); }}
            style={{ background: `${categorie.couleur}18`, border: `1px solid ${categorie.couleur}44`, borderRadius: "8px", padding: "0.9rem", fontFamily: T.serif, fontStyle: "italic", fontSize: "0.95rem", color: T.aube, cursor: "pointer" }}>
            Oui, partager ma ville
          </button>
          <button onClick={() => { setGeoAccepted(false); setEtape(5); }}
            style={{ background: "transparent", border: `1px solid ${T.brume}22`, borderRadius: "8px", padding: "0.9rem", fontFamily: T.serif, fontStyle: "italic", fontSize: "0.95rem", color: `${T.brume}77`, cursor: "pointer" }}>
            Non, rester anonyme
          </button>
        </div>
      </div>
    </div>
  );

  // ── ÉTAPE 5 : Geste maintien ─────────────────────────────────────────────
  if (etape === 5) return (
    <div style={{ minHeight: "100vh", background: "#060408", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", overflow: "hidden", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `radial-gradient(ellipse at center, ${categorie.couleur}${Math.floor(holdProgress * 0.18).toString(16).padStart(2,"0")} 0%, transparent 70%)`, transition: "background 0.3s ease" }} />
      <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "1rem", color: `${categorie.couleur}cc`, textAlign: "center", lineHeight: 1.85, maxWidth: 280, marginBottom: "3rem", animation: "fadeUp 0.8s ease forwards", position: "relative", zIndex: 1 }}>
        "{textePoetique}"
      </p>
      <div style={{ position: "relative", zIndex: 2 }}>
        {particules.map(p => (
          <div key={p.id} style={{ position: "absolute", left: `calc(50% + ${Math.cos(p.angle * Math.PI / 180) * p.distance}px)`, top: `calc(50% + ${Math.sin(p.angle * Math.PI / 180) * p.distance}px)`, width: p.size, height: p.size, borderRadius: "50%", background: p.couleur, opacity: 0.6, transform: "translate(-50%, -50%)", animation: "fadeIn 0.3s ease forwards" }} />
        ))}
        <svg width={120} height={120} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-90deg)" }}>
          <circle cx={60} cy={60} r={54} fill="none" stroke={`${categorie.couleur}22`} strokeWidth={2} />
          <circle cx={60} cy={60} r={54} fill="none" stroke={categorie.couleur} strokeWidth={2} strokeDasharray={`${2 * Math.PI * 54}`} strokeDashoffset={`${2 * Math.PI * 54 * (1 - holdProgress / 100)}`} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.1s linear" }} />
        </svg>
        <div onMouseDown={startHold} onMouseUp={stopHold} onMouseLeave={stopHold} onTouchStart={startHold} onTouchEnd={stopHold}
          style={{ width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle, ${categorie.couleur}55 0%, ${categorie.couleur}22 60%, transparent 100%)`, border: `1px solid ${categorie.couleur}66`, cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", justifyContent: "center", transform: isHolding ? "scale(1.08)" : "scale(1)", transition: "transform 0.2s ease", boxShadow: isHolding ? `0 0 30px ${categorie.couleur}44` : `0 0 15px ${categorie.couleur}22` }} />
      </div>
      <p style={{ marginTop: "2.5rem", fontFamily: T.sans, fontWeight: 300, fontSize: "0.44rem", letterSpacing: "0.5em", textTransform: "uppercase", color: `${T.brume}55`, animation: "fadeUp 1s ease forwards 0.5s", opacity: 0, position: "relative", zIndex: 1 }}>
        {holdProgress < 100 ? "Maintiens pour envoyer" : "…"}
      </p>
    </div>
  );

  // ── ÉTAPE 6 : Envol ──────────────────────────────────────────────────────
  if (etape === 6) return (
    <div style={{ minHeight: "100vh", background: "#060408", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 70%, ${categorie.couleur}18 0%, transparent 60%)`, animation: "fadeIn 1s ease forwards", pointerEvents: "none" }} />
      <div style={{
        fontSize: "28px", color: categorie.couleur, lineHeight: 1, userSelect: "none",
        textShadow: `0 0 15px ${categorie.couleur}, 0 0 35px ${categorie.couleur}88, 0 0 70px ${categorie.couleur}44`,
        animation: "etoileEnvol 2.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards",
      }}>✦</div>
      <style>{`
        @keyframes etoileEnvol {
          0%   { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
          30%  { transform: translateY(-20vh) scale(1.4) rotate(45deg); opacity: 1; }
          60%  { transform: translateY(-50vh) scale(1.1) rotate(90deg); opacity: 0.8; }
          100% { transform: translateY(-90vh) scale(0.3) rotate(180deg); opacity: 0; }
        }
      `}</style>
      <p style={{ position: "absolute", bottom: "30%", fontFamily: T.serif, fontStyle: "italic", fontSize: "1rem", color: `${T.brume}CC`, animation: "fadeIn 1s ease forwards 0.5s", opacity: 0, textAlign: "center", padding: "0 2rem" }}>
        Elle est partie.<br/>Quelqu'un en avait besoin.
      </p>
    </div>
  );

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

    const prompt = `Tu es une présence qui accompagne ${data.prenom} sans jamais te nommer.
Profil : Chemin ${cdv} — ${chemin.titre}. Sensibilité : ${sens}.
Contexte : ${texteContexte}
${hasDual ? `Note : ${data.prenom} traverse quelque chose de difficile ET cherche à grandir simultanément. Honore les deux — la blessure sans la nier, le mouvement sans le forcer.` : ""}

Ce que ${data.prenom} a posé cette semaine :
${fragments.map((f,i) => `${i+1}. "${f}"`).join("\n")}

Écris une lettre. Pas un résumé. Pas une liste. Intime, sobre. Tu nommes ce que tu entends entre les lignes — pas ce qui est dit, ce qui est là.
Prose uniquement. Entre 150 et 220 mots.
Commence par "${data.prenom}," — rien d'autre.
Un ou deux fils. Laisse de l'espace. Termine par une phrase courte qui tient — pas un conseil, pas un encouragement. Une phrase vraie.
Pas de formule de clôture. Signe : ALBA`;

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
            {generation ? "En train d'écrire…" : isPremium ? "Recevoir la lettre de la semaine" : "✦ Débloquer les Lettres — 9€/mois"}
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
  { src: "/videos/miroir-passage.mp4",  legende: "La savane sait attendre. Toi aussi.",                         label: "Savane" },
  { src: "/videos/miroir-gel.mp4",      legende: "L'eau qui tombe ne demande pas la permission.",               label: "Chute d'eau" },
  { src: "/videos/miroir-fond.mp4",     legende: "Tout passe. C'est la seule promesse que la vie tient.",       label: "Nuages" },
  { src: "/videos/miroir-surchauffe.mp4", legende: "Laisse venir ce qui vient. Laisse partir ce qui part.",    label: "Océan" },
  { src: "/videos/etoiles.mp4",         legende: "Certaines nuits, le monde entier se tait pour toi.",          label: "Étoiles" },
  { src: "/videos/foret.mp4",           legende: "La forêt n'explique pas sa lumière.",                         label: "Forêt" },
  { src: "/videos/vagues.mp4",          legende: "L'océan reçoit tout, retient rien.",                          label: "Vagues" },
  { src: "/videos/montagne-neige.mp4",  legende: "Le silence des cimes dit ce que les mots n'atteignent pas.",  label: "Montagne" },
  { src: "/videos/aurore-boreale.mp4",  legende: "Certaines beautés n'existent que pour être contemplées.",     label: "Aurore boréale" },
  { src: "/videos/lac-montagne.mp4",    legende: "L'eau calme reflète tout. Le mental agité ne voit rien.",     label: "Lac de montagne" },
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
    ambiance: { bg: "#0A1018", accent: "#E8D5B0", texte: "Il y a un enfant en toi qui n'a jamais eu besoin de devenir quelqu'un. Il était déjà là." },
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

// ─── CHEMIN DES 12 PORTES ─────────────────────────────────────────────────────
const NOMS_PORTES = [
  null,
  "L'Entrée", "Le Premier Mot", "Le Retour", "Les Patterns",
  "La Résistance", "Le Lâcher", "Le Miroir Profond", "L'Autre",
  "La Blessure Nommée", "La Transmutation", "L'Horizon", "La Lumière Propre",
];
const DELAIS_PORTES = [0, 0, 5, 14, 21, 30, 45, 60, 75, 90, 120, 180, 365];

const CheminDesPortes = ({ progressStats = {}, cleActive = 0, onSelectPorte }) => {
  const eclats = calcEclats(progressStats);
  const jours = progressStats.joursActifs || 0;
  const porteActuelle = SEUILS_PORTES.reduce((acc, seuil, i) => eclats >= seuil ? i : acc, 0);
  const cycle = Math.floor(porteActuelle / 12) + 1;

  return (
    <div style={{ padding: "1.5rem 1.5rem 0" }}>
      {/* En-tête */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.2rem" }}>
        <div>
          <div style={{ fontFamily: T.sans, fontSize: "0.42rem", letterSpacing: "0.5em", textTransform: "uppercase", color: `${T.or}88`, marginBottom: "0.3rem" }}>
            TON CHEMIN
          </div>
          <div style={{ fontFamily: T.serif, fontSize: "1.1rem", color: T.orPale }}>
            {cycle > 1 ? `Cycle ${cycle} · ` : ""}Porte {Math.min(porteActuelle + 1, 12)} sur 12
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: T.sans, fontSize: "0.42rem", letterSpacing: "0.4em", textTransform: "uppercase", color: `${T.brume}66`, marginBottom: "0.2rem" }}>ÉCLATS</div>
          <div style={{ fontFamily: T.serif, fontSize: "1.2rem", color: T.or }}>✦ {eclats}</div>
        </div>
      </div>

      {/* Barre de progression globale */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ height: 3, background: `${T.brume}18`, borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 2,
            background: `linear-gradient(to right, ${T.or}88, ${T.or})`,
            width: `${Math.min(100, (porteActuelle / 12) * 100)}%`,
            transition: "width 1s ease",
          }} />
        </div>
      </div>

      {/* Grille des 12 portes */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.6rem", marginBottom: "1rem" }}>
        {TERRITOIRES_CLES.map((t, i) => {
          const debloquee = eclats >= SEUILS_PORTES[i];
          const active = i === Math.max(0, porteActuelle - 1) || (porteActuelle === 0 && i === 0);
          const prochaine = i === porteActuelle;
          const eclatsSuivant = SEUILS_PORTES[i] || 0;
          const manque = Math.max(0, eclatsSuivant - eclats);
          return (
            <button key={t.index} onClick={() => debloquee && onSelectPorte && onSelectPorte(i)}
              style={{
                background: active ? `${t.couleur}22` : debloquee ? `${t.couleur}10` : `${T.brume}08`,
                border: `1px solid ${active ? t.couleur + "88" : debloquee ? t.couleur + "33" : T.brume + "18"}`,
                borderRadius: 8, padding: "0.7rem 0.4rem",
                cursor: debloquee ? "pointer" : "default",
                transition: "all 0.3s",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem",
              }}>
              {/* Numéro */}
              <div style={{
                fontFamily: T.sans, fontSize: "0.38rem", letterSpacing: "0.3em",
                color: active ? t.couleur : debloquee ? `${t.couleur}99` : `${T.brume}44`,
              }}>
                {debloquee ? (active ? "●" : "✓") : (prochaine ? "○" : "·")}
              </div>
              {/* Nom */}
              <div style={{
                fontFamily: T.serif, fontStyle: "italic",
                fontSize: "0.58rem",
                color: active ? t.couleur : debloquee ? `${T.aube}99` : `${T.brume}44`,
                lineHeight: 1.3, textAlign: "center",
              }}>
                {NOMS_PORTES[t.index] || t.nom}
              </div>
              {/* Éclats manquants si verrouillée */}
              {!debloquee && prochaine && (
                <div style={{ fontFamily: T.sans, fontSize: "0.38rem", color: `${T.or}55`, letterSpacing: "0.1em" }}>
                  ✦ {manque} restants
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Phrase sur la porte actuelle */}
      {TERRITOIRES_CLES[Math.max(0, porteActuelle - 1)] && (
        <div style={{
          padding: "1rem 1.2rem", marginBottom: "0.5rem",
          background: `${T.or}06`, border: `1px solid ${T.or}15`, borderRadius: 8,
        }}>
          <div style={{ fontFamily: T.sans, fontSize: "0.4rem", letterSpacing: "0.4em", textTransform: "uppercase", color: `${T.or}77`, marginBottom: "0.4rem" }}>
            TU ES ICI — PORTE {Math.max(1, porteActuelle)}
          </div>
          <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.88rem", color: `${T.brume}CC`, lineHeight: 1.7, margin: 0 }}>
            {TERRITOIRES_CLES[Math.max(0, porteActuelle - 1)].ambiance.texte}
          </p>
        </div>
      )}
    </div>
  );
};

const TerritoireCle = ({ cleActive = 0, progressStats = {}, allPostits = {}, isPremium = false, onShowPaywall }) => {
  const [section, setSection] = useState("pratique");
  const [vue, setVue] = useState("chemin"); // "chemin" | "porte"
  const [niveauPratique, setNiveauPratique] = useState(0);
  const [exerciceFait, setExerciceFait] = useState({});
  const [signal, setSignal] = useState(null);
  const [exercicesMis, setExercicesMis] = useState([]);
  const [porteIdx, setPorteIdx] = useState(Math.max(0, cleActive - 1));
  const [flashEclat, setFlashEclat] = useState(false); // micro-animation éclat

  const [showThemesCle, setShowThemesCle] = useState(false);
  const DESCRIPTIONS_PORTES = {
    1:  { demande: "Mettre des mots sur ce qui fait mal.", ouvre: "La capacité de voir sans se perdre dans ce qu'on voit." },
    2:  { demande: "Comprendre d'où viennent tes schémas.", ouvre: "La liberté de ne plus répéter ce qu'on n'a pas choisi." },
    3:  { demande: "Accepter ce que tu ressens sans le fuir.", ouvre: "Un rapport à toi-même sans jugement ni honte." },
    4:  { demande: "Poser ce que tu portes pour les autres.", ouvre: "Une légèreté que tu n'avais pas remarqué avoir perdue." },
    5:  { demande: "Apprendre à recevoir — amour, aide, présence.", ouvre: "Des liens plus vrais, moins épuisants." },
    6:  { demande: "Habiter qui tu deviens, pas qui tu étais.", ouvre: "Une vie construite sur ce que tu es, pas sur ce qu'on attendait." },
    7:  { demande: "Laisser naître ce qui cherche à exister en toi.", ouvre: "Une énergie créatrice que tu avais mise en veille." },
    8:  { demande: "Ouvrir aux autres sans te perdre dans eux.", ouvre: "Des relations qui te nourrissent au lieu de t'épuiser." },
    9:  { demande: "Protéger ce qui est sacré en toi.", ouvre: "Des limites posées avec clarté, sans culpabilité." },
    10: { demande: "Donner sens à ce que tu as traversé.", ouvre: "La possibilité de transmettre ce que la douleur t'a appris." },
    11: { demande: "Être pleinement là où tu es.", ouvre: "Une présence à toi-même qui ne cherche plus à fuir." },
    12: { demande: "N'avoir plus rien à prouver, à soi ou aux autres.", ouvre: "Le commencement de toi-même — enfin." },
  };

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
    const wasUnchecked = !exerciceFait[idx];
    const updated = { ...exerciceFait, [idx]: !exerciceFait[idx] };
    setExerciceFait(updated);
    try { localStorage.setItem(`alba_exercices_cle${porteIdx}`, JSON.stringify(updated)); } catch {}
    // Micro-animation éclat quand on coche
    if (wasUnchecked) {
      setFlashEclat(true);
      setTimeout(() => setFlashEclat(false), 1800);
    }
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

    <div style={{ position: "relative", zIndex: 1, padding: "0 0 8rem", maxWidth: 540, margin: "0 auto" }}>
      <style>{`@keyframes fadeUpCle { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }`}</style>

      {/* ── Toggle vue d'ensemble / porte ── */}
      <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", padding: "1.2rem 1.5rem 0" }}>
        {[{ id: "chemin", label: "Vue d'ensemble" }, { id: "porte", label: "Porte active" }].map(v => (
          <button key={v.id} onClick={() => setVue(v.id)} style={{
            background: vue === v.id ? `${T.or}18` : "transparent",
            border: `1px solid ${vue === v.id ? T.or + "66" : T.brume + "22"}`,
            borderRadius: 20, padding: "0.35rem 1rem",
            fontFamily: T.serif, fontStyle: "italic",
            fontSize: "0.82rem", color: vue === v.id ? T.or : `${T.brume}88`,
            cursor: "pointer", transition: "all 0.2s",
          }}>{v.label}</button>
        ))}
      </div>

      {/* ── VUE D'ENSEMBLE ── */}
      {vue === "chemin" && (
        <CheminDesPortes
          progressStats={progressStats}
          cleActive={cleActive}
          onSelectPorte={(i) => { setPorteIdx(i); setVue("porte"); setSection("pratique"); }}
        />
      )}

      {/* ── VUE PORTE ACTIVE ── */}
      {vue === "porte" && (
      <div style={{ padding: "1.5rem 1.5rem 0" }}>

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

      {/* ── DESCRIPTION DE LA PORTE ── */}
      {DESCRIPTIONS_PORTES[territoire.index] && (
        <div style={{
          margin: "0 0 1.8rem",
          padding: "1.1rem 1.4rem",
          background: `${territoire.couleur}08`,
          border: `1px solid ${territoire.couleur}22`,
          borderLeft: `3px solid ${territoire.couleur}66`,
          borderRadius: "4px",
          animation: "fadeUpCle 0.5s ease forwards 0.1s", opacity: 0,
        }}>
          <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.42rem", letterSpacing: "0.4em", textTransform: "uppercase", color: `${territoire.couleur}88`, marginBottom: "0.6rem" }}>
            Cette Porte te demande
          </div>
          <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.88rem", color: T.aube, lineHeight: 1.7, margin: "0 0 0.8rem" }}>
            {DESCRIPTIONS_PORTES[territoire.index].demande}
          </p>
          <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.42rem", letterSpacing: "0.4em", textTransform: "uppercase", color: `${territoire.couleur}66`, marginBottom: "0.5rem" }}>
            Ce qu'elle ouvre
          </div>
          <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.85rem", color: `${T.brume}CC`, lineHeight: 1.7, margin: 0 }}>
            {DESCRIPTIONS_PORTES[territoire.index].ouvre}
          </p>
        </div>
      )}

      {/* ── BARRE DE PROGRESSION ÉCLATS ── */}
      {(() => {
        const seuils = [...SEUILS_PORTES, 999];
        const seuilActuel = seuils[porteIdx] || 0;
        const seuilSuivant = seuils[porteIdx + 1] || seuilActuel + 50;
        const reste = Math.max(0, seuilSuivant - eclats);
        const pct = Math.min(1, (eclats - seuilActuel) / (seuilSuivant - seuilActuel));
        const porteOuverte = eclats >= seuilSuivant;
        const estDernierePorte = porteIdx >= TERRITOIRES_CLES.length - 1;
        if (estDernierePorte) return null;
        return (
          <div style={{
            margin: "0 0 2rem",
            padding: "1rem 1.2rem",
            background: `${T.nuit2}`,
            border: `1px solid ${territoire.couleur}22`,
            borderRadius: "6px",
            animation: "fadeUpCle 0.5s ease forwards 0.2s", opacity: 0,
            position: "relative", overflow: "hidden",
          }}>
            {/* Flash éclat */}
            <style>{`
              @keyframes eclatMonte { 0%{opacity:0;transform:translateY(0) scale(0.8)} 30%{opacity:1;transform:translateY(-18px) scale(1.2)} 100%{opacity:0;transform:translateY(-40px) scale(0.9)} }
              @keyframes fadeUpCle { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
            `}</style>
            {flashEclat && (
              <div style={{
                position: "absolute", right: "1.2rem", top: "0.5rem",
                fontFamily: T.serif, fontSize: "0.85rem", color: T.or,
                pointerEvents: "none",
                animation: "eclatMonte 1.6s ease forwards",
              }}>✦ +1 éclat</div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.6rem" }}>
              <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.42rem", letterSpacing: "0.4em", textTransform: "uppercase", color: `${territoire.couleur}88` }}>
                {porteOuverte ? "Prochaine porte débloquée ✦" : `Il te reste ${reste} éclat${reste > 1 ? "s" : ""} pour ouvrir la porte suivante`}
              </div>
              <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.7rem", color: `${territoire.couleur}BB` }}>
                {eclats} / {seuilSuivant}
              </div>
            </div>
            {/* Jauge */}
            <div style={{ height: 4, background: `${territoire.couleur}18`, borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2,
                background: `linear-gradient(90deg, ${territoire.couleur}88, ${territoire.couleur})`,
                width: `${pct * 100}%`,
                transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
                boxShadow: pct > 0 ? `0 0 8px ${territoire.couleur}66` : "none",
              }}/>
            </div>
            {/* Explication mécanique — une fois, discrète */}
            <div style={{ marginTop: "0.6rem", fontFamily: T.sans, fontWeight: 300, fontSize: "0.56rem", color: `${T.brume}55`, letterSpacing: "0.05em", lineHeight: 1.5 }}>
              Chaque exercice accompli, chaque jour revenu, chaque souffle pris — tout génère des Éclats. Les Éclats ouvrent les Portes.
            </div>
          </div>
        );
      })()}

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
        {[["pratique", "Pratiques"], ["questions", "Questions"], ["themes", "Thèmes"]].map(([id, label]) => (
          <button key={id} onClick={() => { if (id === "themes") { setShowThemesCle(true); } else setSection(id); }} style={{
            flex: 1, padding: "0.7rem",
            background: section === id ? `${territoire.couleur}22` : "transparent",
            border: "none", cursor: "pointer",
            fontFamily: T.sans, fontWeight: 300, fontSize: "0.65rem",
            letterSpacing: "0.3em", textTransform: "uppercase",
            color: section === id ? territoire.couleur : T.brume,
            borderRight: id !== "themes" ? `1px solid ${territoire.couleur}33` : "none",
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

          <div style={{ height: "1.5rem" }} />
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
      )} {/* fin vue porte */}
    </div>
    </div>
  );
};

// ── LES 7 LATÂ'IF SOUFIS ─────────────────────────────────────────────────────
const LATAIF = [
  {
    id: "qalb",
    nom: "Qalb",
    traduction: "Le Cœur",
    couleur: "#C87878",
    position: "Centre de la poitrine",
    intro: "Dans la tradition soufie, le Qalb est le centre de tout. Non pas le cœur organique, mais le cœur spirituel — le lieu en toi où se décident les orientations profondes, où naît l'amour vrai, où réside la conscience de soi. Les maîtres soufis disent : si le cœur est pur, tout l'être est pur. Si le cœur est voilé, même les actes nobles perdent leur lumière. Le Qalb est le siège de la foi, de l'amour et de la présence. C'est là que tu ressens ce qui est juste — avant même de le comprendre.",
    dansLeFlux: "Quand le Qalb est ouvert, tu aimes sans calcul. Tu reçois les autres sans les juger. Tu ressens une forme de paix intérieure qui ne dépend pas des circonstances. Tu es capable de pardonner — non pas parce que l'autre le mérite, mais parce que tu ne veux plus porter ce poids. Tu es présent(e) à toi-même.",
    quandCaResiste: "Quand le Qalb est voilé, tu ressens une sécheresse intérieure. Les émotions arrivent mais ne touchent pas vraiment. Tu peux fonctionner, accomplir, produire — mais tu ne ressens plus grand-chose. Ou au contraire, les émotions débordent sans direction. Tu aimes de façon conditionnelle, tu attends en retour, tu te refermes à la première blessure.",
    pratiques: [
      { titre: "L'inventaire du cœur", texte: "Assieds-toi en silence quelques minutes. Pose une main sur ta poitrine. Demande-toi honnêtement : est-ce qu'il y a quelqu'un ou quelque chose envers qui je nourris de la rancœur ? Ne juge pas la réponse. Juste la regarder est déjà un premier acte d'ouverture." },
      { titre: "Un acte d'amour sans raison", texte: "Aujourd'hui, fais quelque chose de gentil pour quelqu'un — sans qu'il le sache, sans en attendre quoi que ce soit. Pas pour être bon(ne). Juste pour entraîner le cœur à donner librement." },
      { titre: "Le pardon à petites doses", texte: "Le pardon complet peut prendre du temps. Mais on peut commencer par une intention : décider qu'on ne veut plus être prisonnier(e) de cette histoire. Pas effacer — mais desserrer. Écris une phrase qui commence par : 'Je choisis de ne plus laisser cela occuper autant de place en moi.'" },
    ],
  },
  {
    id: "ruh",
    nom: "Rûh",
    traduction: "L'Esprit",
    couleur: "#9878C8",
    position: "Côté droit de la poitrine",
    intro: "Le Rûh est le souffle divin insufflé dans l'être humain — ce qui te distingue de la matière pure. Dans la tradition soufie, le Rûh est plus subtil que l'âme ordinaire. Il est le lien entre toi et ce qui te dépasse. Les maîtres soufis décrivent le Rûh comme une lumière que rien ne peut éteindre — même sous les couches de distraction, de douleur ou d'oubli. Prendre soin du Rûh, c'est entretenir cette connexion avec quelque chose de plus grand que soi, quelle que soit la forme que prend cette transcendance pour toi.",
    dansLeFlux: "Quand le Rûh est vivant, tu ressens une forme de sens dans ce que tu fais — pas nécessairement de la joie, mais quelque chose de juste. Tu n'as pas besoin que tout soit expliqué. Tu supportes l'incertitude parce que tu fais confiance à une direction plus profonde. Il y a en toi une légèreté, même dans les moments difficiles.",
    quandCaResiste: "Quand le Rûh est étouffé, la vie perd sa saveur. Tu accomplis les choses, tu coches les cases, mais il manque quelque chose d'essentiel. Un vide que rien ne comble vraiment — ni les distractions, ni les succès, ni les relations. Tu peux ressentir une fatigue profonde, pas physique — une fatigue de l'âme.",
    pratiques: [
      { titre: "Reconnaître les moments de présence", texte: "Pense à un moment récent où tu t'es senti(e) pleinement vivant(e) — même une seconde. Pas nécessairement heureux(se). Juste présent(e), juste. Écris ce moment. Qu'est-ce qui était différent ?" },
      { titre: "Nourrir l'esprit délibérément", texte: "Le Rûh se nourrit de ce qui élève — la beauté, la prière, la nature, la musique qui touche, la lecture qui transforme. Fais aujourd'hui une chose uniquement pour nourrir cette partie de toi. Pas pour être productif(ve). Juste pour être vivant(e)." },
      { titre: "La question du sens", texte: "Pose-toi cette question sans chercher une réponse définitive : qu'est-ce qui donne du sens à ma vie en ce moment ? Pas ce qui devrait. Ce qui, concrètement, te fait sentir que tu es là pour quelque chose." },
    ],
  },
  {
    id: "sirr",
    nom: "Sirr",
    traduction: "Le Secret",
    couleur: "#7898C8",
    position: "Centre gauche de la poitrine",
    intro: "Le Sirr est le centre le plus intime — celui que les maîtres soufis appellent 'le secret'. C'est la partie de toi qui n'a jamais été blessée, jamais compromise, jamais diminuée par l'histoire de ta vie. C'est ton essence la plus profonde. Le Sirr ne peut pas être vu par les autres — et souvent, à peine par toi-même. Il se laisse entrevoir dans les moments de grande sincérité, dans le silence total, dans ces instants où tu sais exactement qui tu es sans avoir besoin de l'expliquer.",
    dansLeFlux: "Quand le Sirr est accessible, tu n'as pas besoin de te justifier. Tu sais qui tu es — pas parfaitement, mais suffisamment. Tu peux être seul(e) sans te sentir vide. Tu ne cherches pas l'approbation des autres pour te sentir réel(le). Il y a en toi quelque chose de stable que les circonstances ne peuvent pas atteindre.",
    quandCaResiste: "Quand le Sirr est inaccessible, tu te perds dans les rôles que tu joues pour les autres. Tu ne sais plus ce que tu veux vraiment — ce que tu veux toi, pas ce que les autres attendent. Tu peux te sentir étrange à toi-même, comme si tu regardais ta vie de l'extérieur sans vraiment l'habiter.",
    pratiques: [
      { titre: "Ce que personne ne sait de toi", texte: "Écris quelque chose de vrai sur toi que tu n'as jamais dit à personne — une peur, un désir, une conviction. Pas pour le partager. Juste pour te rappeler que cette vérité existe et qu'elle t'appartient." },
      { titre: "Cinq minutes sans rôle", texte: "Aujourd'hui, trouve un moment où tu n'es ni parent, ni conjoint(e), ni collègue, ni ami(e). Juste toi. Assieds-toi. Respire. Ne fais rien d'utile. Observe ce qui reste quand tu enlèves tous les rôles." },
      { titre: "La question de l'authenticité", texte: "Y a-t-il quelque chose que tu fais régulièrement qui ne te ressemble pas vraiment ? Pas parce que c'est mal — juste parce que ce n'est pas toi. Nomme-le sans te juger." },
    ],
  },
  {
    id: "khafi",
    nom: "Khafî",
    traduction: "Le Caché",
    couleur: "#78A8A8",
    position: "Côté droit du front",
    intro: "Khafî signifie 'le caché' ou 'le subtil'. Dans la tradition soufie, c'est le centre de la perception intérieure — la capacité à sentir ce qui est là sans que ce soit visible. C'est le siège de l'intuition profonde, de la lecture fine des situations, de cette connaissance qui vient avant les mots. Développer Khafî, c'est apprendre à faire confiance à ce que tu perçois au-delà de ce que tu peux prouver. Non pas la superstition — mais l'écoute affinée.",
    dansLeFlux: "Quand Khafî est actif, tu lis les situations avec justesse. Tu sens quand quelque chose ne va pas avant que les faits le confirment. Tu fais confiance à ta perception sans avoir besoin de tout vérifier. Tu sais quand parler et quand te taire. Tu choisis les bonnes personnes — pas celles qui semblent bonnes, celles qui le sont vraiment.",
    quandCaResiste: "Quand Khafî est voilé, tu ignores régulièrement ce que tu sens pour écouter ce que tu penses devoir faire. Tu te laisses convaincre par des arguments logiques qui vont contre ce que tu ressentais. Tu te retrouves souvent dans des situations où tu te dis 'je savais bien'.",
    pratiques: [
      { titre: "Le journal des signaux faibles", texte: "Pendant trois jours, note chaque fois que tu ressens quelque chose — une légère résistance, un malaise discret, un élan inexpliqué — avant de pouvoir l'expliquer. Ne l'analyse pas. Juste le noter. Observe les patterns." },
      { titre: "La décision sans délibération", texte: "La prochaine fois que tu dois faire un choix peu important, décide en moins de dix secondes. Sans peser le pour et le contre. Juste ce qui vient en premier. Observe comment tu te sens ensuite." },
      { titre: "L'écoute du corps avant la tête", texte: "Face à une décision qui t'occupe, ferme les yeux et imagine chaque option. Observe ce que ton corps fait — tension, détente, serrement, légèreté. Le corps perçoit souvent avant la tête." },
    ],
  },
  {
    id: "akhfa",
    nom: "Akhfâ",
    traduction: "Le Très Caché",
    couleur: "#A878C8",
    position: "Centre du front",
    intro: "Akhfâ est le plus subtil des centres — celui que les maîtres soufis décrivent comme presque impossible à saisir directement. C'est le lieu de la connexion avec le divin, du dépassement de l'ego, de l'expérience mystique. C'est là que réside la conscience pure — avant que les pensées, les émotions et les identités ne la colorent. Les soufis parlent d'Akhfâ comme du lieu où l'être humain touche à ce qui est éternel en lui. Ce n'est pas un état qu'on atteint une fois pour toutes — c'est un espace qu'on visite dans les moments de plus grande clarté.",
    dansLeFlux: "Quand Akhfâ est touché, il y a une paix qui n'a pas d'explication. Une clarté soudaine sur ce qui compte vraiment. Une dissolution temporaire des petites préoccupations. Ces moments sont rares mais marquants — tu sais quand ils arrivent. Ils laissent une trace.",
    quandCaResiste: "Quand Akhfâ est inaccessible — et c'est son état le plus courant — l'ego prend toute la place. Tu t'identifies complètement à tes pensées, tes peurs, tes désirs, tes statuts. Il n'y a pas d'espace entre toi et ce que tu vis. Tout est urgent, tout est personnel, tout est une menace ou une promesse.",
    pratiques: [
      { titre: "La pratique du désidentification", texte: "Quand une émotion forte arrive — colère, peur, tristesse — essaie de dire mentalement : 'Il y a de la colère en moi' plutôt que 'Je suis en colère'. Cette petite différence crée un espace. Tu observes l'émotion au lieu d'être l'émotion." },
      { titre: "Le silence comme pratique", texte: "Consacre dix minutes aujourd'hui à un silence intentionnel. Pas de méditation guidée, pas de musique. Juste le silence. Laisse les pensées passer sans les suivre. Si tu arrives à trente secondes de vraie quietude intérieure, c'est déjà quelque chose." },
      { titre: "La question de l'impermanence", texte: "Pense à quelque chose qui te préoccupe fortement en ce moment. Demande-toi honnêtement : est-ce que ça existera encore dans dix ans ? Pas pour minimiser — pour recalibrer. Ce qui est urgent n'est pas toujours important." },
    ],
  },
  {
    id: "nafs",
    nom: "Nafs",
    traduction: "L'Âme",
    couleur: "#C8A040",
    position: "Bas-ventre",
    intro: "La Nafs est l'âme dans son sens le plus humain — celle qui désire, qui résiste, qui lutte, qui grandit. Dans la tradition soufie, la Nafs traverse plusieurs stades d'évolution : de l'âme qui commande (al-nafs al-ammara) — celle qui suit les pulsions sans réfléchir — à l'âme apaisée (al-nafs al-mutma'inna) — celle qui est en paix avec elle-même et avec ce qui la dépasse. Travailler sur la Nafs, c'est le cœur du travail intérieur soufi. Ce n'est pas la mortifier ou la nier — c'est l'éduquer, la raffiner, la conduire vers plus de conscience.",
    dansLeFlux: "Quand la Nafs est équilibrée, tu connais tes désirs sans en être l'esclave. Tu peux dire non quand c'est juste. Tu n'agis pas sous l'impulsion de la peur ou de la colère. Tu es en mesure de différer une satisfaction immédiate pour quelque chose de plus profond. Il y a une forme de cohérence entre ce que tu veux et ce que tu fais.",
    quandCaResiste: "Quand la Nafs prend le dessus, tu réagis plus que tu n'agis. Tu fais des choses que tu regretteras. Tu cherches des satisfactions immédiates pour calmer une anxiété qui revient toujours. Tu te juges beaucoup — ou au contraire, tu te justifies tout. Il peut y avoir un sentiment diffus de honte ou d'insatisfaction chronique.",
    pratiques: [
      { titre: "Observer avant d'agir", texte: "La prochaine fois que tu ressens une impulsion forte — répondre sèchement, manger par stress, éviter quelque chose — prends trente secondes avant d'agir. Juste observer l'impulsion sans la suivre immédiatement. Tu n'as pas à la supprimer. Juste à créer un espace." },
      { titre: "L'inventaire honnête", texte: "Qu'est-ce que tu fais régulièrement que tu sais ne pas être bon pour toi — et que tu continues quand même ? Pas pour te juger. Pour regarder honnêtement. La conscience est le début du changement." },
      { titre: "Un acte en accord avec tes valeurs", texte: "Aujourd'hui, fais une chose qui soit parfaitement en accord avec ce que tu prétends être — même si c'est difficile, même si personne ne le verra. La Nafs se raffine dans les actes, pas dans les intentions." },
    ],
  },
  {
    id: "sultan",
    nom: "Sultan al-Adhkâr",
    traduction: "Le Centre de la Présence",
    couleur: "#7BA87B",
    position: "Sommet de la tête",
    intro: "Le septième centre n'a pas de nom unique dans toutes les traditions soufies, mais il est souvent désigné comme le lieu de la présence totale — là où le dhikr (la remémoration de Dieu) devient naturel, où la conscience est à la fois pleinement incarnée et pleinement ouverte. C'est le centre de l'intégration — celui qui unifie tous les autres. Quand les six autres centres sont en travail, celui-ci commence à s'éveiller. Il ne s'agit pas de perfection mais d'unité intérieure — être le même en public et en privé, en action et en silence, dans la joie et dans l'épreuve.",
    dansLeFlux: "Quand ce centre est actif, il y a une cohérence dans ta vie que tu n'as pas besoin d'expliquer. Tu es reconnaissable — pour les autres et pour toi-même. Tes actes, tes paroles et tes valeurs s'alignent naturellement. Tu n'es pas parfait(e) mais tu es entier(e). Il y a une sérénité qui vient non pas de l'absence de problèmes, mais de l'accord profond avec qui tu es.",
    quandCaResiste: "Quand ce centre est endormi, tu vis en fragments. Le toi du travail ne connaît pas le toi intime. Ce que tu dis ne correspond pas à ce que tu fais. Tu cherches à être plusieurs personnes pour plusieurs publics et tu t'y perds. Il peut y avoir un sentiment de dispersion, de manque d'ancrage, de ne pas savoir vraiment qui tu es.",
    pratiques: [
      { titre: "L'audit de cohérence", texte: "Est-ce que la personne que tu es en public est la même que celle que tu es seul(e) ? Pas en termes de performance — en termes de valeurs, d'intentions, de façon d'être. Où y a-t-il un écart ? Pas pour te condamner — pour voir." },
      { titre: "Une journée d'alignement", texte: "Choisis une valeur qui te tient à cœur — l'honnêteté, la bienveillance, la simplicité. Essaie de laisser cette valeur guider chaque décision de la journée, même les petites. Observe comment ça change l'expérience de ta journée." },
      { titre: "La question de l'intégrité", texte: "Y a-t-il quelque chose dans ta vie que tu continues à faire alors que ça contredit ce que tu crois être ? Une relation, une habitude, un compromis. Pas besoin de tout résoudre d'un coup. Juste de regarder en face." },
    ],
  },
];

const LataifScreen = ({ onBack }) => {
  const [vue, setVue] = useState("intro"); // intro | liste | fiche
  const [lataifChoisi, setLataifChoisi] = useState(null);

  // ── INTRO ──
  if (vue === "intro") return (
    <div style={{ minHeight: "calc(100vh - 120px)", padding: "2rem 1.5rem 6rem", maxWidth: 520, margin: "0 auto" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: T.sans, fontSize: "0.55rem", letterSpacing: "0.3em", color: `${T.brume}66`, marginBottom: "2rem", padding: 0, textTransform: "uppercase" }}>← Retour</button>
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.48rem", letterSpacing: "0.55em", textTransform: "uppercase", color: `${T.or}66`, marginBottom: "1rem" }}>Les Latâ'if</div>
        <div style={{ width: 1, height: 40, background: `linear-gradient(to bottom, transparent, ${T.or}44, transparent)`, margin: "0 auto 1.5rem" }} />
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "clamp(1rem, 3vw, 1.15rem)", color: T.orPale, lineHeight: 2, marginBottom: "1.5rem" }}>
          Les centres subtils de la conscience
        </p>
      </div>
      <div style={{ background: `${T.nuit2}cc`, border: `1px solid ${T.or}22`, borderLeft: `3px solid ${T.or}44`, borderRadius: "4px", padding: "1.4rem 1.6rem", marginBottom: "2rem" }}>
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.88rem", color: `${T.brume}cc`, lineHeight: 1.9, margin: 0 }}>
          Dans la tradition soufie, les maîtres de l'intériorité ont cartographié l'être humain à travers les Latâ'if — des centres subtils de conscience, chacun correspondant à une dimension de la vie intérieure. On retrouve une cartographie similaire dans d'autres traditions : les hindous les appellent chakras, d'autres mystiques ont leurs propres noms. La forme change. La réalité intérieure qu'elle décrit est universelle.
        </p>
      </div>
      <div style={{ background: `${T.nuit2}88`, border: `1px solid ${T.brume}18`, borderRadius: "4px", padding: "1.2rem 1.4rem", marginBottom: "2.5rem" }}>
        <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.82rem", color: `${T.brume}99`, lineHeight: 1.9, margin: 0 }}>
          Ces sept centres ne sont pas des organes physiques. Ce sont des espaces de conscience — des dimensions de ton être intérieur. Certains sont actifs en toi, d'autres attendent d'être touchés. Explorer les Latâ'if, c'est se donner une carte pour comprendre ce qui se passe en soi.
        </p>
      </div>
      <button onClick={() => setVue("liste")} style={{ width: "100%", padding: "1rem", background: `${T.or}22`, border: `1px solid ${T.or}55`, borderRadius: "6px", cursor: "pointer", fontFamily: T.sans, fontWeight: 300, fontSize: "0.6rem", letterSpacing: "0.45em", textTransform: "uppercase", color: T.or }}>
        Explorer les 7 centres
      </button>
    </div>
  );

  // ── LISTE ──
  if (vue === "liste") return (
    <div style={{ minHeight: "calc(100vh - 120px)", padding: "2rem 1.5rem 6rem", maxWidth: 520, margin: "0 auto" }}>
      <button onClick={() => setVue("intro")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: T.sans, fontSize: "0.55rem", letterSpacing: "0.3em", color: `${T.brume}66`, marginBottom: "2rem", padding: 0, textTransform: "uppercase" }}>← Retour</button>
      <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.48rem", letterSpacing: "0.55em", textTransform: "uppercase", color: `${T.or}66`, marginBottom: "1.5rem" }}>Les 7 Latâ'if</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {LATAIF.map((l, i) => (
          <div key={l.id} onClick={() => { setLataifChoisi(l); setVue("fiche"); }}
            style={{ background: `${T.nuit2}cc`, border: `1px solid ${l.couleur}33`, borderLeft: `3px solid ${l.couleur}66`, borderRadius: "6px", padding: "1.1rem 1.2rem", cursor: "pointer", animation: `fadeUp 0.5s ease forwards ${0.05 + i * 0.07}s`, opacity: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "1rem", color: T.orPale, marginBottom: "0.2rem" }}>{l.nom} — {l.traduction}</div>
                <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.45rem", letterSpacing: "0.3em", textTransform: "uppercase", color: l.couleur }}>{l.position}</div>
              </div>
              <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.75rem", color: `${T.brume}55` }}>{i + 1}/7</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── FICHE ──
  if (vue === "fiche" && lataifChoisi) {
    const l = lataifChoisi;
    const idx = LATAIF.findIndex(x => x.id === l.id);
    return (
      <div style={{ minHeight: "calc(100vh - 120px)", padding: "2rem 1.5rem 6rem", maxWidth: 520, margin: "0 auto" }}>
        <button onClick={() => setVue("liste")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: T.sans, fontSize: "0.55rem", letterSpacing: "0.3em", color: `${T.brume}66`, marginBottom: "2rem", padding: 0, textTransform: "uppercase" }}>← Les 7 centres</button>

        {/* En-tête */}
        <div style={{ borderLeft: `3px solid ${l.couleur}88`, paddingLeft: "1.2rem", marginBottom: "2rem" }}>
          <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.45rem", letterSpacing: "0.4em", textTransform: "uppercase", color: l.couleur, marginBottom: "0.4rem" }}>{idx + 1} · {l.position}</div>
          <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "clamp(1.2rem,4vw,1.4rem)", color: T.orPale, marginBottom: "0.2rem" }}>{l.nom}</div>
          <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.9rem", color: `${T.brume}99` }}>{l.traduction}</div>
        </div>

        {/* Ce que c'est */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.45rem", letterSpacing: "0.4em", textTransform: "uppercase", color: `${l.couleur}99`, marginBottom: "0.8rem" }}>Ce centre</div>
          <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.88rem", color: `${T.brume}cc`, lineHeight: 2, margin: 0 }}>{l.intro}</p>
        </div>

        <div style={{ width: "100%", height: 1, background: `linear-gradient(to right, transparent, ${l.couleur}33, transparent)`, margin: "1.5rem 0" }} />

        {/* Dans le flux */}
        <div style={{ marginBottom: "1.5rem", background: `${l.couleur}08`, border: `1px solid ${l.couleur}22`, borderRadius: "6px", padding: "1.2rem 1.4rem" }}>
          <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.45rem", letterSpacing: "0.4em", textTransform: "uppercase", color: l.couleur, marginBottom: "0.7rem" }}>Dans le flux</div>
          <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.85rem", color: `${T.brume}cc`, lineHeight: 1.9, margin: 0 }}>{l.dansLeFlux}</p>
        </div>

        {/* Quand ça résiste */}
        <div style={{ marginBottom: "2rem", background: `${T.brume}08`, border: `1px solid ${T.brume}18`, borderRadius: "6px", padding: "1.2rem 1.4rem" }}>
          <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.45rem", letterSpacing: "0.4em", textTransform: "uppercase", color: `${T.brume}77`, marginBottom: "0.7rem" }}>Quand ça résiste</div>
          <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.85rem", color: `${T.brume}99`, lineHeight: 1.9, margin: 0 }}>{l.quandCaResiste}</p>
        </div>

        <div style={{ width: "100%", height: 1, background: `linear-gradient(to right, transparent, ${l.couleur}33, transparent)`, margin: "0 0 2rem" }} />

        {/* Pratiques */}
        <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.45rem", letterSpacing: "0.4em", textTransform: "uppercase", color: `${l.couleur}99`, marginBottom: "1.2rem" }}>Ce que tu peux faire</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {l.pratiques.map((p, i) => (
            <div key={i} style={{ background: `${T.nuit2}cc`, border: `1px solid ${l.couleur}22`, borderRadius: "6px", padding: "1.2rem 1.4rem" }}>
              <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.9rem", color: l.couleur, marginBottom: "0.6rem" }}>{p.titre}</div>
              <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.82rem", color: `${T.brume}cc`, lineHeight: 1.9, margin: 0 }}>{p.texte}</p>
            </div>
          ))}
        </div>

        {/* Navigation entre Lataif */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "3rem" }}>
          <button onClick={() => idx > 0 && setLataifChoisi(LATAIF[idx - 1])} disabled={idx === 0}
            style={{ background: "none", border: `1px solid ${idx === 0 ? T.brume + "22" : l.couleur + "44"}`, borderRadius: "6px", padding: "0.6rem 1.2rem", cursor: idx === 0 ? "default" : "pointer", fontFamily: T.sans, fontSize: "0.55rem", letterSpacing: "0.3em", color: idx === 0 ? `${T.brume}33` : l.couleur }}>← Précédent</button>
          <button onClick={() => idx < LATAIF.length - 1 && setLataifChoisi(LATAIF[idx + 1])} disabled={idx === LATAIF.length - 1}
            style={{ background: "none", border: `1px solid ${idx === LATAIF.length - 1 ? T.brume + "22" : l.couleur + "44"}`, borderRadius: "6px", padding: "0.6rem 1.2rem", cursor: idx === LATAIF.length - 1 ? "default" : "pointer", fontFamily: T.sans, fontSize: "0.55rem", letterSpacing: "0.3em", color: idx === LATAIF.length - 1 ? `${T.brume}33` : l.couleur }}>Suivant →</button>
        </div>
      </div>
    );
  }

  return null;
};

const Evasion = ({ data, isPremium = false, onShowPaywall }) => {
  const [showLataif, setShowLataif] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [actif, setActif] = useState(0);
  const touchStart = useRef(null);
  const videoRef = useRef(null);

  if (showLataif) return <LataifScreen onBack={() => setShowLataif(false)} />;
  if (showThemes) return <ThemesScreen onBack={() => setShowThemes(false)} isPremium={isPremium} onShowPaywall={onShowPaywall} />;
  const item = VIDEOS[actif] || VIDEOS[0];

  // Passe automatiquement à la suivante quand la vidéo se termine
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onEnded = () => setActif(a => (a + 1) % VIDEOS.length);
    v.addEventListener("ended", onEnded);
    return () => v.removeEventListener("ended", onEnded);
  }, [actif]);

  const navigate = (dir) => {
    setActif(a => (a + dir + VIDEOS.length) % VIDEOS.length);
  };

  const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (!touchStart.current) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) navigate(diff > 0 ? 1 : -1);
    touchStart.current = null;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: "fixed", inset: 0,
        background: T.nuit,
        zIndex: 10,
        overflow: "hidden",
      }}
    >
      {/* Bouton Spotify */}
      <div style={{ position: "absolute", bottom: 218, left: "50%", transform: "translateX(-50%)", zIndex: 20 }}>
        <a
          href="https://open.spotify.com/playlist/37i9dQZF1DX3rxVfibe1L0"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", gap: "0.6rem",
            background: "rgba(10,8,6,0.75)",
            border: "1px solid rgba(30,215,96,0.35)",
            borderRadius: "30px",
            padding: "0.55rem 1.3rem",
            backdropFilter: "blur(12px)",
            textDecoration: "none",
            transition: "all 0.3s",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {/* Logo Spotify SVG */}
          <svg width={14} height={14} viewBox="0 0 24 24" fill="#1ED760">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          <span style={{ fontFamily: "Jost, sans-serif", fontWeight: 300, fontSize: "0.48rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(30,215,96,0.9)" }}>
            Playlist ALBA
          </span>
        </a>
      </div>

      {/* Boutons accès Latâ'if et Thèmes */}
      <div style={{ position: "absolute", bottom: 100, left: "50%", transform: "translateX(-50%)", zIndex: 20, display: "flex", gap: "0.75rem" }}>
        <button onClick={() => setShowLataif(true)} style={{ background: `${T.nuit}cc`, border: `1px solid ${T.or}44`, borderRadius: "20px", padding: "0.5rem 1.2rem", fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem", letterSpacing: "0.35em", textTransform: "uppercase", color: T.or, cursor: "pointer", backdropFilter: "blur(8px)", WebkitTapHighlightColor: "transparent" }}>✦ Latâ'if</button>
        <button onClick={() => setShowThemes(true)} style={{ background: `${T.nuit}cc`, border: `1px solid ${T.or}33`, borderRadius: "20px", padding: "0.5rem 1.2rem", fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem", letterSpacing: "0.35em", textTransform: "uppercase", color: `${T.or}cc`, cursor: "pointer", backdropFilter: "blur(8px)", WebkitTapHighlightColor: "transparent" }}>✦ Thèmes</button>
      </div>

      {/* Vidéo plein écran — pas de loop, enchaînement automatique */}
      <video
        key={item.src}
        ref={videoRef}
        autoPlay muted playsInline
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
        }}
      >
        <source src={item.src} type="video/mp4"/>
      </video>

      {/* Overlay dégradé bas */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to top, rgba(8,6,5,0.92) 0%, rgba(8,6,5,0.3) 40%, transparent 70%)",
        pointerEvents: "none",
      }}/>

      {/* Overlay haut léger */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 120,
        background: "linear-gradient(to bottom, rgba(8,6,5,0.5) 0%, transparent 100%)",
        pointerEvents: "none",
      }}/>

      {/* Label haut */}
      <div style={{
        position: "absolute", top: "env(safe-area-inset-top, 20px)",
        left: 0, right: 0,
        padding: "1.2rem 1.5rem",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{
          fontFamily: T.sans, fontWeight: 300, fontSize: "0.42rem",
          letterSpacing: "0.5em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.5)",
        }}>Évasion</div>
        <div style={{
          fontFamily: T.sans, fontWeight: 300, fontSize: "0.42rem",
          letterSpacing: "0.3em", color: "rgba(255,255,255,0.4)",
        }}>{actif + 1} / {VIDEOS.length}</div>
      </div>

      {/* Légende bas */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "0 1.8rem calc(env(safe-area-inset-bottom, 0px) + 100px)",
      }}>
        {/* Nom de l'ambiance */}
        <div style={{
          fontFamily: T.sans, fontWeight: 300, fontSize: "0.42rem",
          letterSpacing: "0.5em", textTransform: "uppercase",
          color: `${T.or}99`, marginBottom: "0.8rem",
        }}>{item.label}</div>

        {/* Légende poétique */}
        <p style={{
          fontFamily: T.serif, fontStyle: "italic",
          fontSize: "clamp(1.1rem, 4vw, 1.35rem)",
          color: T.orPale, lineHeight: 1.6,
          fontWeight: 300,
          textShadow: "0 2px 12px rgba(0,0,0,0.8)",
          marginBottom: "2rem",
        }}>« {item.legende} »</p>

        {/* Points de navigation */}
        <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginBottom: "0.5rem" }}>
          {VIDEOS.map((_, i) => (
            <div key={i} onClick={() => setActif(i)} style={{
              width: i === actif ? 20 : 6,
              height: 6, borderRadius: 3,
              background: i === actif ? T.or : "rgba(255,255,255,0.3)",
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}/>
          ))}
        </div>
      </div>

      {/* Flèches latérales discrètes */}
      <button onClick={() => navigate(-1)} style={{
        position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
        background: "transparent", border: "none",
        padding: "1.5rem 1rem", cursor: "pointer",
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <button onClick={() => navigate(1)} style={{
        position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)",
        background: "transparent", border: "none",
        padding: "1.5rem 1rem", cursor: "pointer",
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>
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
                // Marquer souffle fait aujourd'hui
                try {
                  const dk = new Date().toISOString().split("T")[0];
                  localStorage.setItem("alba_souffle_" + dk, "1");
                } catch {}
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
  { id: "miroir",    label: "Miroir",    couleur: "#8898B8", papier: "#0E1018", bord: "#8898B8" },
  { id: "bilan",     label: "Bilan",     couleur: "#A8986E", papier: "#181510", bord: "#A8986E" },
  { id: "matin",     label: "Matin",     couleur: "#C8A06E", papier: "#1A1408", bord: "#C8A06E" },
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
  const [synthesePoetique, setSynthesePoetique] = useState(null);
  const [syntheseLoading, setSyntheseLoading]   = useState(false);
  const [syntheseGeneree, setSyntheseGeneree]   = useState(false);
  const typeActif = POSTIT_TYPES.find(t => t.id === type) || POSTIT_TYPES[0];
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
    const prompt = `Tu es une présence qui accompagne ${data.prenom} sans jamais te nommer.
Profil : Chemin ${cdv} — ${chemin.titre}. Contexte : ${texteContexte}
Ce que ${data.prenom} a posé aujourd'hui :
${resume}
Écris 4 à 6 phrases. Pas un résumé — une présence. Tu nommes ce que tu entends entre les lignes, pas ce qui est dit. Sobre, juste, sans chaleur artificielle. Chaque mot pèse. Termine par une phrase courte qui reste. Signe "ALBA".`;
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

  // ── Synthèse poétique ──

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
      const prompt = `Tu lis ce que ${data.prenom} a posé cette semaine (Chemin ${cdv} — ${chemin.titre}).

${extrait}

Une seule phrase. Pas analytique, pas thérapeutique, pas poétique pour faire beau. Une phrase qui nomme quelque chose de vrai — précis, sobre, ancré dans ce qui a été écrit. Entre 12 et 25 mots. Pas de signature. Pas de guillemets. Juste la phrase.`;

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

  // ── THEMES SCREEN ──
  if (showThemesCle) return (
    <div style={{ minHeight: "calc(100vh - 120px)", padding: "1.5rem 1.5rem 6rem" }}>
      <ThemesScreen onBack={() => setShowThemesCle(false)} isPremium={isPremium} onShowPaywall={onShowPaywall} />
    </div>
  );

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
            const t = POSTIT_TYPES.find(t => t.id === p.type) || POSTIT_TYPES[0];
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

const TROUVAILLES_ALBA = [
  // Livres
  { id:"a1", source:"ALBA", categorie:"livre", titre:"L'art de la joie", auteur:"Goliarda Sapienza", pourquoi:"Un roman qui refuse la résignation. Modesta construit sa liberté pièce par pièce, dans une Sicile du XXe siècle qui ne lui fait aucun cadeau. L'un des livres les plus vivants qui soient." },
  { id:"a2", source:"ALBA", categorie:"livre", titre:"Pensées pour moi-même", auteur:"Marc Aurèle", pourquoi:"Écrit par un empereur pour lui-même, jamais pour être publié. C'est ce qui le rend si honnête. Une leçon quotidienne sur ce qu'on peut contrôler — et ce qu'on ne peut pas." },
  { id:"a3", source:"ALBA", categorie:"livre", titre:"Le Prophète", auteur:"Kahlil Gibran", pourquoi:"26 méditations sur l'amour, la douleur, la liberté, la mort. Chaque page est une porte. On y revient différemment selon les années de sa vie." },
  { id:"a4", source:"ALBA", categorie:"livre", titre:"Les Buddenbrook", auteur:"Thomas Mann", pourquoi:"Une fresque sur ce que le temps fait aux familles, aux ambitions, aux illusions. Et sur la beauté étrange de ce qui se défait." },
  { id:"a5", source:"ALBA", categorie:"livre", titre:"La Consolation de la Philosophie", auteur:"Boèce", pourquoi:"Écrit en prison, en attendant l'exécution. L'un des textes les plus lucides jamais écrits sur ce que signifie tenir debout." },
  { id:"a6", source:"ALBA", categorie:"livre", titre:"Voyage au bout de la nuit", auteur:"Louis-Ferdinand Céline", pourquoi:"Une traversée de la nuit humaine. Bardamu voit tout ce que les autres font semblant de ne pas voir. Pas consolant — mais profondément libérateur." },
  { id:"a7", source:"ALBA", categorie:"livre", titre:"Siddhartha", auteur:"Hermann Hesse", pourquoi:"Un homme cherche. Cherche encore. Se trompe. Apprend. Un récit initiatique qui parle à tous ceux qui ont l'impression de faire fausse route." },
  { id:"a8", source:"ALBA", categorie:"livre", titre:"La Nuit", auteur:"Elie Wiesel", pourquoi:"Un témoignage d'une précision déchirante. Ce qu'on survit. Ce qu'on ne peut pas oublier. Ce que la mémoire nous demande de porter." },

  // Podcasts
  { id:"a9", source:"ALBA", categorie:"podcast", titre:"On Being", auteur:"Krista Tippett", pourquoi:"Des conversations sur ce qui compte vraiment — la foi, la perte, la grâce, la science. Krista Tippett écoute comme personne d'autre. On se sent moins seul après chaque épisode." },
  { id:"a10", source:"ALBA", categorie:"podcast", titre:"Huberman Lab", auteur:"Andrew Huberman", pourquoi:"De la neurologie appliquée à la vie réelle. Sommeil, stress, lumière, dopamine. Comprendre son corps pour mieux l'habiter." },
  { id:"a11", source:"ALBA", categorie:"podcast", titre:"Feel Better, Live More", auteur:"Dr Rangan Chatterjee", pourquoi:"Des conversations sur la santé au sens large — corps, esprit, relations. Sans jargon, avec de la chaleur." },
  { id:"a12", source:"ALBA", categorie:"podcast", titre:"The Tim Ferriss Show", auteur:"Tim Ferriss", pourquoi:"Des entretiens longs avec des gens qui ont appris des choses difficiles. Les meilleurs épisodes parlent d'échec, de reconstruction, de rituel." },
  { id:"a13", source:"ALBA", categorie:"podcast", titre:"Présence", auteur:"Anne-Laure Buffet", pourquoi:"Un podcast francophone sur la pleine conscience, la lenteur, l'attention. Pour ceux qui cherchent une voix douce dans le bruit." },

  // Films
  { id:"a14", source:"ALBA", categorie:"film", titre:"Paterson", auteur:"Jim Jarmusch", pourquoi:"Un film sur la beauté du quotidien. Un conducteur de bus écrit de la poésie dans un carnet. La vie ordinaire peut être un poème." },
  { id:"a15", source:"ALBA", categorie:"film", titre:"The Tree of Life", auteur:"Terrence Malick", pourquoi:"Une méditation sur l'enfance, la grâce et la nature. On ne regarde pas ce film — on le traverse." },
  { id:"a16", source:"ALBA", categorie:"film", titre:"Into the Wild", auteur:"Sean Penn", pourquoi:"Un homme abandonne tout pour aller au bout de lui-même. L'histoire vraie de Christopher McCandless. Bouleversante et nécessaire." },

  // Musique
  { id:"a17", source:"ALBA", categorie:"musique", titre:"Nuvole Bianche", auteur:"Ludovico Einaudi", pourquoi:"Quand les mots ne viennent plus, cette musique parle à leur place. Un piano, une fenêtre, du temps qui ralentit." },
  { id:"a18", source:"ALBA", categorie:"musique", titre:"Comptine d'un autre été", auteur:"Yann Tiersen", pourquoi:"La mélodie d'Amélie Poulain. Elle contient quelque chose de la mélancolie joyeuse qu'on ressent parfois en regardant par une fenêtre." },

  // Séries
  { id:"a21", source:"ALBA", categorie:"serie", titre:"The OA", auteur:"Brit Marling & Zal Batmanglij", pourquoi:"Une des séries les plus mystérieuses et spirituellement intenses jamais faites. Des expériences de mort imminente, des dimensions parallèles, la foi comme force physique. Culte, émouvante, inclassable." },
  { id:"a22", source:"ALBA", categorie:"serie", titre:"Si je ne t'avais pas rencontré", auteur:"Pau Freixas", pourquoi:"Un homme perd sa famille et découvre des univers parallèles où leurs vies ont pris d'autres chemins. Le deuil, l'amour impossible, les réalités alternatives. Très touchant émotionnellement." },
  { id:"a23", source:"ALBA", categorie:"serie", titre:"Dark", auteur:"Baran bo Odar & Jantje Friese", pourquoi:"Une série allemande d'une densité rare sur le temps, les cycles du destin et les liens familiaux. Brillante, exigeante, qui demande qu'on lui fasse confiance jusqu'au bout." },
  { id:"a24", source:"ALBA", categorie:"serie", titre:"Tales from the Loop", auteur:"Nathaniel Halpern", pourquoi:"Une série contemplative et poétique, presque méditante. Elle parle de mémoire, de temps, d'amour et de perte dans un monde où la physique quantique fait partie du quotidien. Une ambiance rare." },
  { id:"a25", source:"ALBA", categorie:"serie", titre:"Devs", auteur:"Alex Garland", pourquoi:"Une mini-série hypnotique sur le déterminisme, le libre arbitre et la perte. Est-ce qu'on choisit vraiment, ou tout est-il déjà écrit ? Philosophique et visuellement envoûtante." },
  { id:"a26", source:"ALBA", categorie:"serie", titre:"Undone", auteur:"Raphael Bob-Waksberg", pourquoi:"Après un accident, une femme découvre qu'elle peut traverser le temps. Animation artistique unique, introspection profonde, exploration du trauma et de la mémoire. Une série qui ne ressemble à rien." },
  { id:"a27", source:"ALBA", categorie:"serie", titre:"Station Eleven", auteur:"Patrick Somerville", pourquoi:"Après une pandémie, des humains reconstituent ce qui valait la peine d'être sauvé. Une série sensible sur les liens, la mémoire, la beauté qui survit. Certains épisodes sont bouleversants." },

  // Pratiques
  { id:"a19", source:"ALBA", categorie:"pratique", titre:"La cohérence cardiaque", auteur:"David O'Hare", pourquoi:"5 minutes. Trois fois par jour. 5 secondes d'inspiration, 5 secondes d'expiration. Le système nerveux se régule. Ça marche." },
  { id:"a20", source:"ALBA", categorie:"pratique", titre:"Pages du matin", auteur:"Julia Cameron", pourquoi:"Trois pages manuscrites, chaque matin, avant de penser. Pas un journal — un déversoir. La pratique qui libère tout le reste." },
];

const VISUELS_TROUVAILLES = {
  livre: { bg: ["#1A1208","#2D1F0A"], accent: "#C8A96E",
    svg: `<rect x="14" y="8" width="20" height="32" rx="2" fill="none" stroke="currentColor" strokeWidth="1.2"/>
          <rect x="12" y="10" width="20" height="32" rx="2" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.4"/>
          <line x1="19" y1="16" x2="29" y2="16" stroke="currentColor" strokeWidth="0.8"/>
          <line x1="19" y1="20" x2="29" y2="20" stroke="currentColor" strokeWidth="0.8"/>
          <line x1="19" y1="24" x2="25" y2="24" stroke="currentColor" strokeWidth="0.8"/>` },
  podcast: { bg: ["#0D1218","#1A2030"], accent: "#8BA8C8",
    svg: `<circle cx="24" cy="20" r="8" fill="none" stroke="currentColor" strokeWidth="1.2"/>
          <line x1="24" y1="28" x2="24" y2="34" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M18 26 Q18 34 24 34 Q30 34 30 26" fill="none" stroke="currentColor" strokeWidth="1"/>
          <line x1="20" y1="38" x2="28" y2="38" stroke="currentColor" strokeWidth="0.8"/>` },
  film: { bg: ["#120A18","#1F1028"], accent: "#A88BC8",
    svg: `<rect x="10" y="14" width="28" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1.2"/>
          <polygon points="20,18 20,30 31,24" fill="none" stroke="currentColor" strokeWidth="1"/>
          <line x1="10" y1="18" x2="38" y2="18" stroke="currentColor" strokeWidth="0.5" opacity="0.4"/>
          <line x1="10" y1="30" x2="38" y2="30" stroke="currentColor" strokeWidth="0.5" opacity="0.4"/>` },
  musique: { bg: ["#0A120A","#102018"], accent: "#8BC88B",
    svg: `<path d="M18 30 Q18 22 26 20 L34 16 L34 24 Q34 22 26 24 L26 32 Q26 36 22 36 Q18 36 18 32Z" fill="none" stroke="currentColor" strokeWidth="1.2"/>
          <circle cx="22" cy="33" r="3" fill="none" stroke="currentColor" strokeWidth="0.8"/>` },
  pratique: { bg: ["#0A1410","#102018"], accent: "#8BC8A8",
    svg: `<path d="M24 10 Q28 16 28 22 Q28 30 24 34 Q20 30 20 22 Q20 16 24 10Z" fill="none" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M24 34 L24 40" stroke="currentColor" strokeWidth="1"/>
          <path d="M20 40 L28 40" stroke="currentColor" strokeWidth="0.8"/>
          <path d="M16 22 Q20 20 24 22" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.5"/>` },
  citation: { bg: ["#120E08","#201808"], accent: "#C8B88B",
    svg: `<text x="12" y="28" fontFamily="Georgia,serif" fontSize="28" fill="currentColor" opacity="0.9">"</text>
          <text x="26" y="38" fontFamily="Georgia,serif" fontSize="28" fill="currentColor" opacity="0.5">"</text>` },
  default: { bg: ["#141210","#211E1A"], accent: "#C8A96E",
    svg: `<path d="M24 12 L27 20 L36 20 L29 25 L31 34 L24 29 L17 34 L19 25 L12 20 L21 20 Z" fill="none" stroke="currentColor" strokeWidth="1"/>` },
};

const getCatVisuel = (categorieId) => {
  if (["livre"].includes(categorieId)) return VISUELS_TROUVAILLES.livre;
  if (["podcast"].includes(categorieId)) return VISUELS_TROUVAILLES.podcast;
  if (["film","serie"].includes(categorieId)) return VISUELS_TROUVAILLES.film;
  if (["musique","album"].includes(categorieId)) return VISUELS_TROUVAILLES.musique;
  if (["pratique","meditation","respiration","rituel","mouvement","sport"].includes(categorieId)) return VISUELS_TROUVAILLES.pratique;
  if (["citation","poeme","philosophie","priere"].includes(categorieId)) return VISUELS_TROUVAILLES.citation;
  return VISUELS_TROUVAILLES.default;
};

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
        // Merge : ALBA en premier, puis dépôts utilisateurs
        const userTrouvailles = d.trouvailles || [];
        setTrouvailles([...TROUVAILLES_ALBA, ...userTrouvailles]);
      } catch {
        setTrouvailles(TROUVAILLES_ALBA);
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

        {/* Visuel catégorie */}
        {(() => { const v = getCatVisuel(selected.categorie); return (
          <div style={{
            width: 80, height: 80, borderRadius: "50%", marginBottom: "1.5rem",
            background: `radial-gradient(circle, ${v.bg[1]}, ${v.bg[0]})`,
            border: `1px solid ${v.accent}33`,
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}>
            <svg viewBox="0 0 48 48" style={{ width: 44, height: 44, color: v.accent, opacity: 0.9 }}
              dangerouslySetInnerHTML={{ __html: v.svg }} />
          </div>
        ); })()}

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
          marginBottom: selected.auteur ? "0.4rem" : "2rem", maxWidth: 380,
        }}>{selected.titre}</div>

        {/* Auteur si ALBA */}
        {selected.auteur && (
          <div style={{
            fontFamily: T.sans, fontWeight: 300, fontSize: "0.58rem",
            letterSpacing: "0.3em", textTransform: "uppercase",
            color: `${T.brume}99`, marginBottom: "2rem",
          }}>{selected.auteur}</div>
        )}

        {/* Séparateur */}
        <div style={{ width: 40, height: 1, background: `${T.or}44`, marginBottom: "2rem" }}/>

        {/* Label source */}
        <div style={{
          fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem",
          letterSpacing: "0.3em", textTransform: "uppercase",
          color: T.brume, marginBottom: "1rem",
        }}>{selected.source === "ALBA" ? "ALBA recommande…" : "Quelqu'un a écrit…"}</div>

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

      {/* Cartes temple */}
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
      <div style={{ padding: "0 1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {filtered.map(t => {
          const c = getCat(t.categorie);
          const v = getCatVisuel(t.categorie);
          return (
            <div key={t.id} onClick={() => setSelected(t)} style={{
              background: `linear-gradient(135deg, ${v.bg[0]} 0%, ${v.bg[1]} 100%)`,
              border: `1px solid ${v.accent}30`,
              borderRadius: "12px",
              cursor: "pointer",
              position: "relative", overflow: "hidden",
              minHeight: 140,
              display: "flex", alignItems: "stretch",
            }}>
              {/* Bande colorée gauche */}
              <div style={{
                width: 4, flexShrink: 0,
                background: `linear-gradient(to bottom, ${v.accent}BB, ${v.accent}33)`,
              }}/>

              {/* Icône latérale */}
              <div style={{
                width: 72, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "1.2rem 0",
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: `radial-gradient(circle, ${v.accent}20, transparent 70%)`,
                  border: `1px solid ${v.accent}33`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg viewBox="0 0 48 48" style={{ width: 28, height: 28, color: v.accent, opacity: 0.85 }}
                    dangerouslySetInnerHTML={{ __html: v.svg }} />
                </div>
              </div>

              {/* Contenu */}
              <div style={{ flex: 1, padding: "1.2rem 1rem 1.2rem 0.2rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  {/* Catégorie */}
                  <div style={{
                    fontFamily: T.sans, fontWeight: 300, fontSize: "0.45rem",
                    letterSpacing: "0.45em", textTransform: "uppercase",
                    color: v.accent, marginBottom: "0.5rem", opacity: 0.9,
                  }}>{c.label}</div>
                  {/* Titre */}
                  <div style={{
                    fontFamily: T.serif, fontStyle: "italic",
                    fontSize: "clamp(1rem, 3.5vw, 1.15rem)",
                    color: T.orPale, fontWeight: 300, lineHeight: 1.35,
                    marginBottom: "0.3rem",
                  }}>{t.titre}</div>
                  {/* Auteur */}
                  {t.auteur && (
                    <div style={{
                      fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem",
                      letterSpacing: "0.15em", color: `${T.brume}99`,
                    }}>{t.auteur}</div>
                  )}
                </div>
                {/* Extrait */}
                <div style={{
                  fontFamily: T.serif, fontStyle: "italic",
                  fontSize: "clamp(0.75rem, 2.5vw, 0.82rem)",
                  color: `${T.brume}BB`, lineHeight: 1.6, marginTop: "0.8rem",
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}>{t.pourquoi}</div>

                {/* Pied */}
                <div style={{
                  marginTop: "0.8rem",
                  fontFamily: T.sans, fontWeight: 300, fontSize: "0.42rem",
                  letterSpacing: "0.25em", color: `${v.accent}66`,
                  textTransform: "uppercase",
                }}>{t.source === "ALBA" ? "✦ Sélection ALBA" : t.jours ? `Partagé il y a ${t.jours}j` : "Communauté"}</div>
              </div>

              {/* Halo droit */}
              <div style={{
                position: "absolute", right: -20, top: "50%", transform: "translateY(-50%)",
                width: 120, height: 120, borderRadius: "50%",
                background: `radial-gradient(circle, ${v.accent}10 0%, transparent 70%)`,
                pointerEvents: "none",
              }}/>
            </div>
          );
        })}
      </div>
      )} {/* fin conditionnel grille */}

      {/* Bouton déposer */}
      <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
        <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.85rem", color: T.brume, marginBottom: "1rem", lineHeight: 1.8 }}>
          Tu as quelque chose à laisser ici ?
        </div>
        <Btn onClick={() => setShowForm(true)}>Déposer une trouvaille</Btn>
      </div>
    </div>
  );
};

// ─── BIBLIOTHÈQUE DES SAGESSES ───────────────────────────────────────────────
// porteMin : nombre de portes traversées minimum pour débloquer (0 = toujours libre)
const SAGESSES = [
  { id: "ikigai", gravure: `<circle cx="20" cy="20" r="11" fill="none" stroke-width="0.8"/><circle cx="28" cy="20" r="11" fill="none" stroke-width="0.8"/><circle cx="20" cy="28" r="11" fill="none" stroke-width="0.8"/><circle cx="28" cy="28" r="11" fill="none" stroke-width="0.8"/>`, nom: "Ikigai", origine: "Japonais", porteMin: 0, fichier: "ikigai", texte: "Dans les villages d'Okinawa — l'une des régions du monde où l'on vit le plus longtemps — les habitants n'ont pas de mot pour \"retraite\". Pas parce qu'ils travaillent jusqu'à la mort, mais parce qu'ils ne comprennent pas l'idée de s'arrêter de vivre ce pour quoi on est là. L'Ikigai, c'est cette raison de se lever le matin. Pas une ambition spectaculaire — parfois juste cultiver son jardin, enseigner un enfant, préparer le repas de ses proches avec soin.\n\nLa sagesse de l'Ikigai est qu'il se trouve à l'intersection de quatre questions : qu'est-ce qui me passionne ? Qu'est-ce que je sais faire vraiment bien ? Ce que je fais est-il utile au monde ? Puis-je en vivre ? Beaucoup s'acharnent sur la dernière et oublient les trois premières. D'autres restent dans la passion sans jamais la traduire en quelque chose d'utile. L'Ikigai demande les quatre en même temps — et ce n'est pas un exercice de carrière. C'est une boussole de vie.\n\nIl ne se trouve pas en cherchant frénétiquement. Il se révèle quand on arrête de fuir ce qu'on est.\n\n→ Si tu n'avais plus à justifier tes choix devant personne — ni financièrement, ni socialement — comment passerais-tu tes journées ?" },
  { id: "kintsugi", gravure: `<path d="M18 10 Q14 14 16 20 Q18 26 14 32 Q12 36 16 40 Q20 42 24 40" stroke-width="0.9" fill="none"/><path d="M30 10 Q34 14 32 20 Q30 26 34 32 Q36 36 32 40 Q28 42 24 40" stroke-width="0.9" fill="none"/><path d="M18 10 Q24 8 30 10" stroke-width="0.8" fill="none"/><path d="M22 22 Q26 19 30 22" stroke-width="1.2" stroke="#C8A96E" fill="none"/><path d="M19 32 Q24 29 29 32" stroke-width="1.2" stroke="#C8A96E" fill="none"/>`, nom: "Kintsugi", origine: "Japonais", porteMin: 1, fichier: "kintsugi", texte: "L'histoire raconte que le Kintsugi est né d'un accident. Un shōgun japonais du XVe siècle brisa un bol à thé qu'il aimait et l'envoya en Chine pour réparation. Il revint avec des agrafes métalliques — fonctionnel, mais laid. Des artisans japonais eurent alors une autre idée : combler les fractures avec de la laque mêlée de poudre d'or. Le bol revint transformé. Plus beau qu'avant. Parce que ses cicatrices étaient devenues sa signature.\n\nLe Kintsugi n'est pas une métaphore consolatrice. C'est une philosophie esthétique profonde : la perfection sans histoire est froide. Ce qui a été brisé et réparé porte en lui quelque chose que l'intact ne peut pas avoir — la preuve qu'il a survécu. Nos fractures personnelles fonctionnent de la même façon. Ce qu'on a traversé, perdu, cassé en nous — ce n'est pas ce qu'il faut cacher. C'est ce qui nous rend irremplaçables.\n\nLa question n'est pas : comment effacer les traces ? La question est : comment les porter à la lumière ?\n\n→ Quelle partie de toi as-tu longtemps essayé de cacher — et qui pourrait être, vue autrement, la partie la plus précieuse ?" },
  { id: "hygge", gravure: `<line x1="24" y1="38" x2="24" y2="22" stroke-width="0.9"/><rect x="20" y="38" width="8" height="4" rx="1.5" stroke-width="0.7" fill="none"/><path d="M24 20 Q21 15 24 10 Q27 15 24 20" stroke-width="0.8" fill="none"/><path d="M16 36 Q24 32 32 36" stroke-width="0.6" fill="none"/><path d="M12 40 Q24 36 36 40" stroke-width="0.5" fill="none"/><circle cx="24" cy="10" r="2" fill="none" stroke-width="0.6" stroke-opacity="0.5"/>`, nom: "Hygge", origine: "Danois", porteMin: 2, fichier: "hygge", texte: "Le Danemark est régulièrement classé parmi les pays les plus heureux du monde. Ses hivers sont longs, sombres, froids. Ce paradoxe apparent a une réponse simple : les Danois ne combattent pas l'hiver. Ils créent le Hygge.\n\nLe mot est intraduisible en français. Ce n'est pas le confort — même si la bougie et le plaid en font partie. Ce n'est pas la fête — on peut être seul et vivre le Hygge. C'est une qualité de présence, un accord tacite entre des personnes ou entre soi et l'instant : ici, maintenant, rien n'est urgent. Aucune performance n'est demandée. On est juste là, ensemble ou seul, dans une lumière douce, avec du temps devant soi. Le Hygge enseigne que le bonheur ne se trouve pas dans les grandes choses. Il se construit dans les petites, répétées, protégées.\n\nDans une culture qui glorifie la productivité et l'intensité, s'autoriser le Hygge est presque un acte de résistance.\n\n→ Quel est le dernier moment où tu t'es senti pleinement là, sans avoir nulle part à être sinon là ?" },
  { id: "sabr", gravure: `<rect x="19" y="8" width="10" height="32" rx="2" stroke-width="0.9" fill="none"/><line x1="19" y1="16" x2="29" y2="16" stroke-width="0.5"/><line x1="19" y1="24" x2="29" y2="24" stroke-width="0.5"/><line x1="19" y1="32" x2="29" y2="32" stroke-width="0.5"/><path d="M14 40 Q24 44 34 40" stroke-width="0.7" fill="none"/>`, nom: "Sabr", origine: "Arabe", porteMin: 3, fichier: "sabr", texte: "Le mot arabe Sabr est souvent traduit par \"patience\". Mais la traduction trahit. La patience peut être passive, épuisée, résignée — l'attente silencieuse de quelqu'un qui a abandonné. Le Sabr est son contraire.\n\nDans la tradition islamique et soufie, le Sabr est une des vertus les plus hautes. C'est tenir debout au milieu de la tempête — non pas parce qu'on ne souffre pas, mais parce qu'on sait que la tempête a une durée. C'est continuer à agir avec intégrité quand tout s'effondre. C'est refuser de laisser la douleur dicter les actes. Les mystiques soufis distinguaient trois niveaux de Sabr : s'abstenir de ce qui est interdit même quand on le désire, accomplir ce qui est juste même quand c'est difficile, et accepter ce qu'on ne peut pas changer sans y perdre sa dignité.\n\nCe que le Sabr n'est pas : de la passivité, de la résignation, du déni. C'est une force active. Une colonne vertébrale intérieure que rien ne peut plier.\n\n→ Face à ce que tu traverses en ce moment, qu'est-ce qui serait différent si tu le traversais avec Sabr plutôt qu'avec impatience ou résistance ?" },
  { id: "wabi-sabi", gravure: `<path d="M14 18 Q12 26 16 34 Q20 40 28 40 Q36 40 38 32 Q40 24 34 18" stroke-width="0.9" fill="none"/><path d="M14 18 Q24 14 34 18" stroke-width="0.8" fill="none"/><path d="M20 38 Q22 42 26 44" stroke-width="0.6" fill="none"/><line x1="18" y1="26" x2="22" y2="25" stroke-width="0.5" stroke-opacity="0.6"/><line x1="30" y1="26" x2="34" y2="27" stroke-width="0.5" stroke-opacity="0.6"/>`, nom: "Wabi-Sabi", origine: "Japonais", porteMin: 4, fichier: "wabi-sabi", texte: "Dans les cérémonies du thé japonaises, les maîtres choisissaient délibérément des bols asymétriques, des tasses ébréchées, des ustensiles portant les marques du temps. Pas par manque de moyens. Par philosophie. Ce qu'ils cherchaient à transmettre s'appelle le Wabi-Sabi.\n\nWabi désigne la beauté simple, dépouillée, trouvée dans la solitude et l'humilité. Sabi désigne la beauté qui naît du passage du temps — la rouille, la patine, le vieilli. Ensemble, ils forment une esthétique qui refuse la perfection comme idéal. Rien n'est permanent. Rien n'est achevé. Rien n'est parfait. Et c'est précisément pour cette raison que chaque chose, chaque moment, chaque être est unique et précieux. Une fleur de cerisier est belle parce qu'elle tombe dans la semaine. Un visage qui a vieilli est beau parce qu'il a vécu.\n\nLe Wabi-Sabi est une réponse directe à notre obsession moderne pour la perfection, le contrôle, l'optimisation. Il dit : arrête de te battre contre ce qui est. La beauté est là, dans l'imparfait.\n\n→ Qu'est-ce que tu essaies de rendre parfait dans ta vie en ce moment — au lieu de le laisser exister tel qu'il est ?" },
  { id: "tawakkul", gravure: `<ellipse cx="24" cy="30" rx="12" ry="8" stroke-width="0.8" fill="none"/><path d="M12 30 Q10 24 14 20 Q18 16 24 18 Q30 16 34 20 Q38 24 36 30" stroke-width="0.7" fill="none"/><path d="M36 30 Q42 28 44 24" stroke-width="0.8" fill="none"/><circle cx="44" cy="24" r="2" fill="none" stroke-width="0.7"/><path d="M34 38 Q36 42 40 42" stroke-width="0.6" fill="none"/>`, nom: "Tawakkul", origine: "Arabe", porteMin: 5, fichier: "tawakkul", texte: "Il existe un hadith célèbre dans la tradition islamique. Un homme arrive à la mosquée et veut attacher son chameau. Un sage lui dit : \"Fais confiance à Dieu.\" L'homme laisse son chameau sans l'attacher. Le lendemain, le chameau a disparu. Il retourne voir le sage qui lui répond : \"Attache ton chameau — puis fais confiance à Dieu.\"\n\nC'est l'essence du Tawakkul : ce n'est pas l'abandon de l'effort. C'est la paix qui vient après l'effort complet. Faire sa part — entièrement, honnêtement, sans retenue — et ensuite lâcher ce qui ne dépend plus de soi. Cette frontière est l'une des plus difficiles que l'être humain ait à tracer. D'un côté, le contrôle obsessionnel qui épuise et qui prétend que tout dépend de toi. De l'autre, la passivité qui se déguise en foi. Le Tawakkul est le chemin du milieu : la responsabilité totale sur ce qu'on peut changer, la paix totale sur ce qu'on ne peut pas.\n\nCe n'est pas une résignation. C'est une libération.\n\n→ Dans quoi est-ce que tu continues de t'épuiser à contrôler quelque chose qui ne dépend plus de toi ?" },
  { id: "ubuntu", gravure: `<circle cx="24" cy="16" r="4" fill="none" stroke-width="0.8"/><circle cx="12" cy="30" r="4" fill="none" stroke-width="0.8"/><circle cx="36" cy="30" r="4" fill="none" stroke-width="0.8"/><path d="M20 18 Q16 22 14 26" stroke-width="0.7" fill="none"/><path d="M28 18 Q32 22 34 26" stroke-width="0.7" fill="none"/><path d="M16 32 Q20 38 24 40 Q28 38 32 32" stroke-width="0.7" fill="none"/><circle cx="24" cy="8" r="1.5" fill="none" stroke-width="0.6" stroke-opacity="0.5"/>`, nom: "Ubuntu", origine: "Bantou", porteMin: 6, fichier: "ubuntu", texte: "Un chercheur américain proposa un jour un jeu à des enfants d'un village d'Afrique australe. Il plaça un panier de fruits sous un arbre et annonça : le premier arrivé gagne tout. Il s'attendait à voir les enfants se disperser en courant. Ils se prirent par la main et coururent ensemble. Arrivés, ils partagèrent le panier. Quand il leur demanda pourquoi, ils répondirent en riant, comme si la question ne se posait pas : Ubuntu. Comment l'un d'entre nous pourrait-il être heureux si les autres ne le sont pas ?\n\nUbuntu est une philosophie bantoue dont la traduction la plus juste serait : \"Je suis parce que nous sommes.\" Elle repose sur l'idée que l'identité humaine n'est pas individuelle — elle est relationnelle. Tu n'existes pas seul. Tu existes dans tes liens. Tes ancêtres, ta communauté, ceux qui viendront après toi. Souffrir seul est une anomalie. Se réjouir seul, également. L'Ubuntu s'oppose radicalement à l'individualisme occidental — non pas pour l'annuler, mais pour lui rappeler ce qu'il oublie : l'humain ne se réalise pas contre les autres, mais avec eux.\n\n→ Dans quelle situation est-ce que tu portes quelque chose seul alors qu'un lien — une parole, une demande, un partage — pourrait t'alléger ?" },
  { id: "yugen", gravure: `<path d="M8 36 Q16 28 24 30 Q32 32 40 24" stroke-width="0.8" fill="none"/><path d="M8 40 Q16 34 24 36 Q32 38 40 30" stroke-width="0.6" fill="none" stroke-opacity="0.5"/><path d="M24 30 L24 12" stroke-width="0.7" fill="none"/><circle cx="24" cy="10" r="2.5" fill="none" stroke-width="0.8"/><path d="M20 14 Q24 8 28 14" stroke-width="0.6" fill="none" stroke-opacity="0.6"/>`, nom: "Yūgen", origine: "Japonais", porteMin: 6, fichier: "yugen", texte: "Le poète japonais Zeami, au XIVe siècle, tentait de décrire ce qu'il cherchait dans l'art du théâtre Nô. Il écrivit : \"Regarder le soleil se coucher derrière une colline couverte de fleurs. Errer dans une grande forêt sans penser au retour. Se tenir sur le bord de l'immense mer au crépuscule d'automne.\" Aucun de ces moments n'est objectivement extraordinaire. Mais chacun déclenche quelque chose d'indescriptible — une émotion qui n'a pas de nom.\n\nC'est le Yūgen. La conscience soudaine et vertigineuse que l'univers est infiniment plus vaste que soi — et que cette immensité, au lieu d'écraser, libère. Ce n'est pas de la mélancolie ni de la joie. C'est quelque chose d'antérieur aux deux. Une vibration particulière du réel qui traverse le corps comme une onde et laisse quelque chose de changé. Les Japonais le cherchaient dans l'art, dans la nature, dans les silences. Ils savaient que le cultiver rendait la vie plus haute.\n\nLe Yūgen ne se provoque pas. Il se reçoit. Il demande juste d'être suffisamment présent pour le remarquer.\n\n→ Quel est le dernier moment où quelque chose de grand t'a traversé sans que tu puisses l'expliquer — et est-ce que tu t'es arrêté pour le laisser passer ?" },
  { id: "fitra", gravure: `<path d="M24 40 L24 24" stroke-width="0.9"/><path d="M24 24 Q18 18 12 20" stroke-width="0.8" fill="none"/><path d="M24 24 Q30 18 36 20" stroke-width="0.8" fill="none"/><path d="M24 28 Q20 24 16 26" stroke-width="0.6" fill="none"/><path d="M24 28 Q28 24 32 26" stroke-width="0.6" fill="none"/><circle cx="24" cy="12" r="4" fill="none" stroke-width="0.8"/><path d="M21 10 Q24 6 27 10" stroke-width="0.7" fill="none"/>`, nom: "Fitra", origine: "Arabe", porteMin: 7, fichier: "fitra", texte: "Dans la tradition islamique, il existe une idée fondamentale : chaque être humain naît avec la Fitra, une disposition naturelle, pure, orientée vers la lumière et vers le bien. Avant que la vie ne l'imprègne de peur, de conditionnement, d'identité construite — il y a quelque chose d'intact. Quelque chose qui sait déjà.\n\nLa Fitra n'est pas une naïveté. C'est une nature originelle. Et tout le chemin spirituel, dans cette perspective, n'est pas une progression vers quelque chose de nouveau. C'est un retour. Un lent désapprentissage. Désapprendre les masques qu'on a construits pour survivre. Désapprendre les croyances héritées qui ne nous appartiennent pas. Désapprendre la peur de ce qu'on est vraiment. Ce que tu cherches, tu ne le trouveras pas en dehors. Tu l'as eu avant même de savoir que tu le cherchais.\n\nCette idée traverse aussi d'autres traditions — le concept de \"nature de Bouddha\" dans le bouddhisme, ou l'étincelle divine dans les mystiques chrétiens. Quelque chose en toi est intact. Il n'a jamais été abîmé. Il attend juste qu'on le retrouve.\n\n→ Si tu enlevais tout ce que tu as appris à être pour les autres, qu'est-ce qui resterait au fond — ce truc que tu as toujours été, même quand tu l'as nié ?" },
  { id: "baraka", gravure: `<path d="M16 20 L16 32 Q16 38 24 40 Q32 38 32 32 L32 20" stroke-width="0.9" fill="none"/><path d="M12 20 Q16 16 20 18" stroke-width="0.8" fill="none"/><path d="M28 18 Q32 16 36 20" stroke-width="0.8" fill="none"/><path d="M16 22 Q24 18 32 22" stroke-width="0.6" fill="none" stroke-opacity="0.5"/><circle cx="24" cy="12" r="3" fill="none" stroke-width="0.7"/><line x1="24" y1="9" x2="24" y2="4" stroke-width="0.6" stroke-opacity="0.5"/>`, nom: "Baraka", origine: "Arabe", porteMin: 7, fichier: "baraka", texte: "Il y a des endroits où quelque chose change dès qu'on y entre. Des vieilles mosquées, des forêts anciennes, des maisons qui ont vu des générations aimer et mourir. Il y a des personnes dont la présence apaise sans qu'elles aient dit un mot. Il y a des gestes — une main tendue, un repas partagé, une prière sincère — qui semblent porter plus que leur propre poids.\n\nDans les traditions arabes, nord-africaines et sahéliennes, tout cela a un nom : la Baraka. Une bénédiction qui n'est pas réservée aux saints ni aux élus. Elle circule. Elle se transmet. Elle se reçoit et se donne. Elle passe par les actes justes, les intentions pures, le don sans attente de retour. Certains saints soufis étaient réputés pour leur Baraka — on venait de loin toucher leur manteau, boire de l'eau bénite par leur contact. Mais la sagesse profonde est que la Baraka n'est pas leur propriété. Elle circule à travers eux parce qu'ils ne font pas obstacle.\n\nLa Baraka enseigne que certaines dimensions de la réalité échappent au visible — et que s'y ouvrir n'est pas de la superstition. C'est de l'humilité.\n\n→ Y a-t-il quelqu'un dans ta vie dont la présence seule te fait du bien — et as-tu pris le temps de le lui dire ?" },
  { id: "ataraxia", gravure: `<line x1="8" y1="28" x2="40" y2="28" stroke-width="0.8"/><path d="M8 32 Q16 30 24 32 Q32 34 40 32" stroke-width="0.5" fill="none" stroke-opacity="0.5"/><path d="M8 24 Q16 22 24 24 Q32 26 40 24" stroke-width="0.5" fill="none" stroke-opacity="0.4"/><circle cx="24" cy="18" r="5" fill="none" stroke-width="0.8"/><line x1="24" y1="13" x2="24" y2="8" stroke-width="0.6"/><path d="M21 10 L24 6 L27 10" stroke-width="0.5" fill="none"/>`, nom: "Ataraxia", origine: "Grec", porteMin: 8, fichier: "ataraxia", texte: "Les philosophes grecs se disputaient sur beaucoup de choses. Mais sur un point, épicuriens et stoïciens s'accordaient : le but de la vie philosophique était l'Ataraxia — la tranquillité de l'âme. Non pas l'euphorie des grands moments, qui s'effondre toujours. Non pas l'absence de sensation, qui est une forme de mort. Mais un état stable, une paix intérieure qui ne dépend pas de ce qui arrive dehors.\n\nÉpicure l'atteignait par la simplicité : peu de désirs, des plaisirs modestes mais réels, des amitiés profondes, le retrait du bruit. Les stoïciens l'atteignaient par le travail de la pensée : distinguer ce qui dépend de soi de ce qui n'en dépend pas, et investir toute son énergie dans le premier. Les deux chemins différents mènent au même endroit — un être qui ne peut plus être vraiment dépossédé, parce que ce qui compte le plus en lui ne dépend de rien d'extérieur.\n\nDans un monde qui nous vend l'excitation comme idéal, l'Ataraxia est presque subversive. Elle dit : la vraie richesse, c'est ne plus avoir besoin d'être perturbé.\n\n→ Qu'est-ce qui perturbe ta paix le plus régulièrement — et est-ce que ça dépend vraiment de toi, ou est-ce que tu t'agites sur quelque chose hors de ta portée ?" },
  { id: "kaizen", gravure: `<line x1="10" y1="40" x2="38" y2="40" stroke-width="0.8"/><rect x="10" y="34" width="6" height="6" rx="1" stroke-width="0.7" fill="none"/><rect x="18" y="28" width="6" height="12" rx="1" stroke-width="0.7" fill="none"/><rect x="26" y="20" width="6" height="20" rx="1" stroke-width="0.7" fill="none"/><path d="M12 32 L16 28 L20 24 L24 18 L28 14" stroke-width="0.8" fill="none" stroke-opacity="0.7"/><circle cx="28" cy="14" r="2" fill="none" stroke-width="0.7"/>`, nom: "Kaizen", origine: "Japonais", porteMin: 8, fichier: "kaizen", texte: "En 1945, le Japon était en ruine. Deux bombes atomiques, une capitulation totale, une économie dévastée. Ce qui allait suivre est l'une des reconstructions les plus extraordinaires de l'histoire moderne. Mais elle ne s'est pas faite à coups de révolutions spectaculaires. Elle s'est faite par millions de petits gestes quotidiens d'amélioration. Les Japonais appellent ça le Kaizen : kai, changer — zen, pour le mieux.\n\nL'idée est d'une simplicité radicale : chaque jour, améliore quelque chose d'un pour cent. Pas de grand soir, pas de transformation radicale, pas de décision héroïque. Juste la discipline douce et constante du \"un peu mieux qu'hier\". Toyota en a fait un principe de production. Des athlètes l'appliquent à leur entraînement. Des chirurgiens à leurs protocoles. Mais le Kaizen s'applique aussi à la vie intérieure — comment on parle à soi-même, comment on gère ses émotions, comment on habite ses journées.\n\nLa constance est plus puissante que l'intensité. Ce qu'on fait chaque jour est infiniment plus important que ce qu'on fait parfois.\n\n→ Si tu améliorais une seule chose d'un pour cent chaque jour pendant un an — une seule — laquelle choisirais-tu ?" },
  { id: "lagom", gravure: `<line x1="24" y1="8" x2="24" y2="22" stroke-width="0.9"/><line x1="10" y1="22" x2="38" y2="22" stroke-width="0.8"/><path d="M10 22 L14 32 Q14 36 20 36 Q24 36 24 32" stroke-width="0.8" fill="none"/><path d="M38 22 L34 32 Q34 36 28 36 Q24 36 24 32" stroke-width="0.8" fill="none"/><circle cx="10" cy="22" r="2" fill="none" stroke-width="0.7"/><circle cx="38" cy="22" r="2" fill="none" stroke-width="0.7"/>`, nom: "Lagom", origine: "Suédois", porteMin: 9, fichier: "lagom", texte: "La légende veut que Lagom vienne des Vikings. Quand ils passaient un bol de bière à la ronde autour du feu — laget om, pour le groupe — chacun buvait sa juste part. Ni trop, pour que les autres n'en manquent pas. Ni trop peu, par refus de participer. Juste assez. Juste ce qui est juste.\n\nAujourd'hui, Lagom est l'art suédois de l'équilibre — dans l'alimentation, le travail, la décoration, la vie sociale. Ce n'est pas la médiocrité ou le compromis mou. C'est la sagesse de celui qui a compris que l'excès dans un sens crée toujours un manque dans l'autre. Trop travailler crée un manque de présence. Trop donner crée un manque de soi. Trop posséder crée un manque de liberté. Le Lagom enseigne qu'il existe un point juste pour chaque chose — et que le trouver demande bien plus de conscience que de simplement \"vouloir plus\".\n\nDans une culture qui glorifie le toujours-plus, le Lagom est une forme douce de rébellion.\n\n→ Dans quelle area de ta vie est-ce que tu en fais trop — au point où ça crée un manque ailleurs ?" },
  { id: "sisu", gravure: `<line x1="24" y1="40" x2="24" y2="10" stroke-width="0.9"/><path d="M24 20 Q30 14 36 16" stroke-width="0.8" fill="none"/><path d="M24 26 Q18 20 12 22" stroke-width="0.8" fill="none"/><path d="M24 32 Q30 26 36 28" stroke-width="0.7" fill="none"/><path d="M18 38 Q24 42 30 38" stroke-width="0.7" fill="none"/><path d="M36 16 Q40 12 38 8 Q34 10 36 16" stroke-width="0.6" fill="none" stroke-opacity="0.6"/>`, nom: "Sisu", origine: "Finnois", porteMin: 9, fichier: "sisu", texte: "La Finlande a une histoire de guerres défensives contre des voisins infiniment plus puissants, d'hivers qui durent six mois dans l'obscurité, de conditions que la plupart des peuples n'auraient pas survécues. Et pourtant. Les Finlandais ont un mot pour ce qui les a maintenus debout — et ce mot n'a pas d'équivalent dans les autres langues : le Sisu.\n\nCe n'est pas de l'optimisme. L'optimiste croit que ça va bien se passer. Celui qui a le Sisu n'en est pas sûr — mais il continue quand même. C'est une réserve intérieure qu'on ne voit pas dans les moments faciles. Elle n'apparaît que quand tout le reste est épuisé : l'énergie, l'espoir, les ressources. Et là, au fond, quelque chose reste. Une détermination silencieuse, sans spectacle ni discours. Pas de la témérité — de la ténacité. La décision tranquille de ne pas s'arrêter là.\n\nLe Sisu ne promet rien. Il ne dit pas que ça va aller. Il dit juste : pas ici. Pas maintenant. Pas encore.\n\n→ Pense à un moment où tu as continué quand tu pensais ne plus pouvoir — qu'est-ce qui t'a maintenu debout, et est-ce que tu le reconnais comme une force ?" },
  { id: "sankofa", gravure: `<path d="M24 32 Q16 28 16 20 Q16 12 24 10 Q32 12 32 20 Q32 28 24 32" stroke-width="0.8" fill="none"/><path d="M24 10 Q26 4 30 6" stroke-width="0.7" fill="none"/><ellipse cx="24" cy="38" rx="4" ry="2" stroke-width="0.7" fill="none"/><path d="M20 38 Q16 42 14 40" stroke-width="0.7" fill="none"/><path d="M28 38 Q32 42 34 40" stroke-width="0.7" fill="none"/><path d="M28 14 Q32 10 30 6" stroke-width="0.7" fill="none"/>`, nom: "Sankofa", origine: "Akan", porteMin: 10, fichier: "sankofa", texte: "Dans la tradition Akan du Ghana, il existe un symbole : un oiseau en plein vol vers l'avant, la tête retournée vers l'arrière, tenant dans son bec un œuf. L'œuf, c'est l'avenir. La tête retournée, c'est le regard vers l'origine. L'ensemble s'appelle le Sankofa, et son message tient en une phrase : il n'est jamais trop tard pour retourner chercher ce qu'on a oublié.\n\nLe Sankofa enseigne que le passé n'est pas un fardeau à fuir ni un refuge dans lequel s'enfermer. C'est un réservoir de ressources. Les erreurs ne sont pas des preuves d'échec — ce sont des données. Les blessures ne sont pas des faiblesses — ce sont des enseignements gravés dans le corps. Les ancêtres ne sont pas des fantômes — ce sont des racines. Et les racines ne retiennent pas. Elles nourrissent. Pour avancer vraiment — pas fuir, mais avancer — il faut savoir d'où on vient.\n\nCe retour vers l'arrière n'est pas une régression. C'est ce qui rend le vol possible.\n\n→ Qu'est-ce que tu as laissé derrière toi — une valeur, une partie de toi, une relation — dont il serait peut-être temps d'aller chercher ce qu'elle t'a vraiment appris ?" },
  { id: "qalb", gravure: `<path d="M24 36 Q10 26 10 18 Q10 10 17 10 Q21 10 24 15 Q27 10 31 10 Q38 10 38 18 Q38 26 24 36Z" stroke-width="0.9" fill="none"/><path d="M24 15 Q22 20 24 24 Q26 20 24 15" stroke-width="0.6" fill="none" stroke-opacity="0.5"/><line x1="24" y1="36" x2="24" y2="42" stroke-width="0.6" stroke-opacity="0.5"/><circle cx="24" cy="43" r="1.5" fill="none" stroke-width="0.6" stroke-opacity="0.4"/>`, nom: "Qalb", origine: "Arabe", porteMin: 10, fichier: "qalb", texte: "En arabe, le mot Qalb désigne le cœur. Mais l'étymologie dit bien plus que ça : Qalb vient d'une racine qui signifie \"se retourner\", \"osciller\", \"changer de côté\". Le cœur, dans cette langue, n'est pas une forteresse stable — c'est quelque chose de vivant, de mobile, d'instable par nature.\n\nDans la spiritualité soufie, le Qalb est le siège de la conscience et le lieu de toutes les transformations réelles. C'est là que se joue ce qui compte vraiment — pas dans le mental, pas dans la volonté, mais dans ce centre profond qui résiste à la raison. Les soufis comparent le Qalb à un miroir. Quand il est poli par l'attention sincère, la prière, le dhikr — le souvenir constant de Dieu — il reflète la lumière. Quand il est encombré par l'ego, les attachements, les rancoeurs, il ne voit plus rien de juste.\n\nTravailler son Qalb, c'est le travail de toute une vie. Pas le dompter — le polir. Pas l'éteindre — le rendre transparent.\n\n→ Est-ce qu'il y a quelque chose qui encombre ton cœur en ce moment — une rancœur, une peur, une tristesse non dite — qui l'empêche de voir clairement ?" },
  { id: "eudaimonia", gravure: `<circle cx="24" cy="16" r="5" fill="none" stroke-width="0.8"/><line x1="24" y1="21" x2="24" y2="32" stroke-width="0.9"/><path d="M14 26 L24 30 L34 26" stroke-width="0.8" fill="none"/><path d="M24 32 L18 40" stroke-width="0.8" fill="none"/><path d="M24 32 L30 40" stroke-width="0.8" fill="none"/><path d="M16 14 Q20 8 24 10" stroke-width="0.7" fill="none" stroke-opacity="0.5"/><path d="M32 14 Q28 8 24 10" stroke-width="0.7" fill="none" stroke-opacity="0.5"/>`, nom: "Eudaimonia", origine: "Grec", porteMin: 11, fichier: "eudaimonia", texte: "Aristote posait une question qui n'a pas vieilli : qu'est-ce que bien vivre ? Sa réponse a choqué ses contemporains autant qu'elle dérange encore. Ce n'est pas le plaisir — le plaisir s'évapore. Ce n'est pas la richesse — la richesse est un moyen, pas une fin. Ce n'est pas même la vertu en tant que règle — on peut suivre des règles et passer à côté de sa vie.\n\nL'Eudaimonia — souvent traduit approximativement par \"bonheur\", mais qui signifie littéralement \"avoir un bon démon intérieur, un bon génie\" — c'est l'épanouissement. La vie qui se déploie selon ce qu'on est profondément. Ce n'est pas un état qu'on atteint et qu'on garde. C'est une direction, une activité, un exercice quotidien. Chaque jour, on choisit — ou non — d'être ce qu'on est vraiment. De vivre selon ses valeurs les plus hautes, pas par conformisme ni par peur, mais parce que c'est la seule manière d'être pleinement vivant.\n\nAristote croyait que tout être a une fonction propre — comme l'œil est fait pour voir, l'humain est fait pour exercer sa faculté la plus haute : la raison, la créativité, l'amour. L'Eudaimonia, c'est y habiter.\n\n→ Dans ta vie actuelle, qu'est-ce qui t'empêche d'être pleinement ce que tu es — et est-ce que c'est une contrainte réelle ou une histoire que tu te racontes ?" },
  { id: "arete", gravure: `<path d="M14 38 L28 10" stroke-width="0.9"/><path d="M28 10 L34 16" stroke-width="0.9"/><path d="M34 16 L20 44" stroke-width="0.9"/><path d="M28 10 Q36 8 36 14 Q36 18 34 16" stroke-width="0.7" fill="none"/><line x1="16" y1="34" x2="22" y2="34" stroke-width="0.5" stroke-opacity="0.5"/><line x1="18" y1="30" x2="24" y2="30" stroke-width="0.5" stroke-opacity="0.5"/>`, nom: "Areté", origine: "Grec", porteMin: 11, fichier: "arete", texte: "Pour les Grecs anciens, l'Areté n'était pas réservée aux héros ni aux guerriers. Un couteau bien aiguisé a son Areté — il coupe parfaitement. Un cheval qui court avec grâce a son Areté. Un musicien qui joue avec précision et âme a le sien. L'Areté est l'excellence propre à chaque chose — la manière d'être pleinement ce qu'on est censé être.\n\nL'Areté humaine, c'est donner le meilleur de soi. Non pas pour être admiré — pour les Grecs, agir pour l'approbation extérieure était une forme de corruption. Mais parce que c'est la seule manière juste d'habiter sa vie. Phidias, le sculpteur qui travailla sur le Parthénon, soignait le dos des statues que personne ne verrait jamais — placées trop haut, trop dans l'ombre. Quand on lui demanda pourquoi, il répondit : les dieux voient. Mais surtout — lui savait.\n\nL'Areté est l'exigence qu'on se pose à soi-même, indépendamment du regard des autres. Elle enseigne que la médiocrité n'est jamais une question de capacité — c'est toujours une question de choix.\n\n→ Dans quelle partie de ta vie est-ce que tu te permets de faire \"assez bien\" alors que tu pourrais faire vraiment bien — et pourquoi ?" },
  { id: "maktub", gravure: `<rect x="12" y="8" width="24" height="32" rx="2" stroke-width="0.8" fill="none"/><line x1="16" y1="16" x2="32" y2="16" stroke-width="0.6"/><line x1="16" y1="20" x2="32" y2="20" stroke-width="0.6"/><line x1="16" y1="24" x2="28" y2="24" stroke-width="0.6"/><line x1="16" y1="28" x2="30" y2="28" stroke-width="0.6"/><line x1="16" y1="32" x2="26" y2="32" stroke-width="0.6"/><circle cx="30" cy="32" r="3" fill="none" stroke-width="0.7"/><path d="M28 34 Q30 38 32 36" stroke-width="0.7" fill="none"/>`, nom: "Maktub", origine: "Arabe", porteMin: 12, fichier: "maktub", texte: "Avant que Paulo Coelho ne le rende célèbre dans L'Alchimiste, le mot Maktub existait dans les souks de Marrakech, dans les mosquées du Caire, dans les lettres entre marchands et voyageurs. C'est écrit. Deux syllabes qui portent toute une vision du monde.\n\nMaktub n'est pas de la fatalité au sens occidental — cette idée lourde et écrasante que tout est joué d'avance et qu'on ne peut rien. Dans la tradition islamique, le sens est plus subtil : ce qui devait arriver est arrivé. Pas parce que tu n'avais pas le choix — mais parce que tes choix eux-mêmes faisaient partie d'une trame plus grande. Les séparations, les pertes, les rencontres inattendues — rien n'est parfaitement arbitraire. Ce qu'on a perdu avait peut-être à partir pour que quelque chose d'autre puisse entrer. Ce qui semble une erreur peut être exactement là où il fallait passer.\n\nMaktub ne demande pas d'être passif. Il demande de faire confiance — même quand on ne comprend pas encore.\n\n→ Y a-t-il quelque chose que tu vis en ce moment comme une erreur ou une perte — et si tu regardais ça comme Maktub, comme faisant partie d'une trame, qu'est-ce que tu verrais différemment ?" },
  { id: "meraki", gravure: `<path d="M16 36 Q12 28 14 20 Q16 12 24 10 Q32 12 34 20 Q36 28 32 36" stroke-width="0.8" fill="none"/><path d="M16 36 Q20 42 24 40 Q28 42 32 36" stroke-width="0.7" fill="none"/><path d="M20 20 Q24 16 28 20" stroke-width="0.7" fill="none"/><path d="M18 26 Q24 22 30 26" stroke-width="0.6" fill="none"/><path d="M18 31 Q24 28 30 31" stroke-width="0.5" fill="none" stroke-opacity="0.6"/>`, nom: "Meraki", origine: "Grec", porteMin: 12, fichier: "meraki", texte: "Il y a une cuisinière grecque qui prépare chaque repas pour sa famille comme si c'était le dernier. Pas par dramatisme — par amour. Elle met quelque chose d'elle-même dans chaque geste, chaque ingrédient, chaque dosage. Cette qualité de présence totale dans l'acte, les Grecs modernes l'appellent le Meraki : \"y mettre son âme\".\n\nLe Meraki n'est pas réservé aux artistes ni aux génies. Il s'applique à n'importe quel acte — réparer une voiture, écrire un mail, préparer un repas, parler à quelqu'un. La différence entre quelqu'un qui fait et quelqu'un qui fait avec Meraki est immédiatement perceptible, même si on ne sait pas la nommer. On sent la présence ou l'absence de l'autre dans ce qu'il a créé. Un texte écrit avec indifférence se lit différemment d'un texte dans lequel quelqu'un s'est vraiment mis. Une maison construite avec soin se sent. Le Meraki, c'est quand l'acte et la personne ne font plus qu'un. Quand on n'est plus en train de faire quelque chose — on est ce qu'on fait.\n\nC'est aussi l'antidote à l'automatisme. À faire les choses sans y être.\n\n→ La dernière fois que tu as fait quelque chose avec vraiment tout ce que tu es — qu'est-ce que c'était, et qu'est-ce que tu as ressenti après ?" },
  { id: "maat", gravure: `<line x1="24" y1="8" x2="24" y2="16" stroke-width="0.9"/><line x1="12" y1="16" x2="36" y2="16" stroke-width="0.8"/><path d="M12 16 Q12 26 18 28 Q24 30 24 24" stroke-width="0.8" fill="none"/><path d="M36 16 Q36 26 30 28 Q24 30 24 24" stroke-width="0.8" fill="none"/><path d="M20 8 Q24 4 28 8" stroke-width="0.7" fill="none"/><line x1="18" y1="40" x2="30" y2="40" stroke-width="0.7"/><line x1="24" y1="30" x2="24" y2="40" stroke-width="0.7"/>`, nom: "Ma'at", origine: "Égyptien", porteMin: 12, fichier: "maat", texte: "Dans l'Égypte ancienne, Ma'at n'était pas seulement une déesse à plumes et à balance. Elle était le principe même qui maintenait l'univers en ordre — l'harmonie cosmique qui empêchait le chaos de tout engloutir. Les pharaons régnaient en son nom. Les juges rendaient des verdicts selon ses lois. Et chaque citoyen ordinaire était censé y contribuer par la façon dont il vivait.\n\nLe rituel le plus célèbre de la tradition égyptienne est la Pesée du cœur : après la mort, le cœur du défunt était placé sur une balance, face à la plume de Ma'at. Un cœur alourdi par le mensonge, l'injustice, la cruauté, le manque d'intégrité — il penchait. Un cœur léger parce que vécu avec droiture et vérité — il s'équilibrait. Ce qui était jugé, ce n'était pas la richesse ni la réputation. C'était la qualité morale de chaque acte posé au cours d'une vie.\n\nMa'at enseigne que la justice n'est pas un système extérieur. C'est une façon d'être. Pas innocent — juste.\n\n→ Si ton cœur était pesé ce soir, y a-t-il quelque chose qui l'alourdit — quelque chose que tu sais ne pas être en accord avec ce que tu veux vraiment être ?" },
  { id: "satori", gravure: `<circle cx="24" cy="24" r="14" fill="none" stroke-width="0.7"/><circle cx="24" cy="24" r="8" fill="none" stroke-width="0.8"/><circle cx="24" cy="24" r="2" fill="none" stroke-width="0.9"/><line x1="24" y1="6" x2="24" y2="10" stroke-width="0.6" stroke-opacity="0.5"/><line x1="24" y1="38" x2="24" y2="42" stroke-width="0.6" stroke-opacity="0.5"/><line x1="6" y1="24" x2="10" y2="24" stroke-width="0.6" stroke-opacity="0.5"/><line x1="38" y1="24" x2="42" y2="24" stroke-width="0.6" stroke-opacity="0.5"/>`, nom: "Satori", origine: "Japonais", porteMin: 12, fichier: "satori", texte: "Les maîtres Zen le savent : le Satori ne s'obtient pas. On ne peut pas le mériter à force d'efforts, le planifier comme un objectif, l'acheter comme une expérience. C'est un éveil soudain — un instant de lucidité totale dans lequel la réalité se voit telle qu'elle est, nue, sans les filtres habituels du mental et de l'ego.\n\nLes koans — ces énigmes apparemment absurdes que les maîtres posent aux élèves — ne cherchent pas une réponse logique. Ils cherchent à épuiser le mental jusqu'à ce qu'il lâche. \"Quel est le son d'une seule main qui frappe ?\" Pas de réponse correcte. Juste un espace où le mental tourne en rond jusqu'à s'effondrer. Et dans cet effondrement, parfois, quelque chose s'ouvre. Le Satori arrive comme la lumière entre les nuages — bref, total, transformateur. Ceux qui l'ont vécu décrivent une clarté qui ne s'oublie pas. Une évidence. Pas une connaissance nouvelle — une reconnaissance. Comme si on savait depuis toujours et qu'on venait de s'en souvenir.\n\nOn ne peut pas viser le Satori. On peut juste créer les conditions — méditation, présence, silence — et rester disponible.\n\n→ Y a-t-il un moment dans ta vie où quelque chose a basculé dans ta façon de voir — un instant de clarté soudaine dont tu ne t'es jamais vraiment remis ?" },
];

const BibliothequeSagesses = ({ cleActive = 0 }) => {
  const [selected, setSelected] = useState(null);
  const [lockedTap, setLockedTap] = useState(null);

  const estDebloquee = (s) => cleActive >= s.porteMin;
  const debloquees = SAGESSES.filter(s => estDebloquee(s)).length;

  const handleLocked = (s) => {
    setLockedTap(s.id === lockedTap ? null : s.id);
    setTimeout(() => setLockedTap(null), 3000);
  };

  return (
    <div style={{ padding: "0 1rem 4rem" }}>

      {/* ── Explication mécanisme ── */}
      <div style={{
        background: `linear-gradient(135deg, ${T.or}12, ${T.or}06)`,
        border: `1px solid ${T.or}30`,
        borderRadius: "10px",
        padding: "1.2rem 1.4rem",
        marginBottom: "2rem",
      }}>
        <p style={{
          fontFamily: T.serif, fontStyle: "italic",
          fontSize: "0.88rem", color: T.orPale,
          lineHeight: 1.8, margin: 0,
        }}>
          Chaque action dans ALBA — écrire, souffler, traverser — génère des <strong style={{ fontStyle: "normal", color: T.or }}>Éclats d'aube</strong>. Ces éclats ouvrent les Portes. Chaque Porte déverrouille de nouvelles sagesses du monde.
        </p>
        <p style={{
          fontFamily: T.sans, fontWeight: 300,
          fontSize: "0.65rem", letterSpacing: "0.2em",
          textTransform: "uppercase", color: `${T.or}70`,
          margin: "0.8rem 0 0",
        }}>
          {debloquees} / {SAGESSES.length} sagesses déverrouillées
        </p>
      </div>

      {/* ── Grille des sagesses ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
        {SAGESSES.map((s) => {
          const libre = estDebloquee(s);
          const isSelected = selected === s.id;
          const isLocked = lockedTap === s.id;
          return (
            <div key={s.id}>
              <div
                onClick={() => libre ? setSelected(isSelected ? null : s.id) : handleLocked(s)}
                style={{
                  background: libre
                    ? (isSelected ? `${T.or}18` : `${T.nuit2}CC`)
                    : `${T.nuit}88`,
                  border: `1px solid ${libre ? (isSelected ? T.or + "60" : T.or + "22") : T.brume + "18"}`,
                  borderRadius: "8px",
                  padding: "0.85rem 1.2rem",
                  cursor: "pointer",
                  transition: "all 0.25s",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "0.9rem",
                }}
              >
                {/* Pastille image */}
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  flexShrink: 0, overflow: "hidden",
                  border: `1px solid ${libre ? T.or + "33" : T.brume + "18"}`,
                  background: `${T.nuit}`,
                  opacity: libre ? 1 : 0.35,
                }}>
                  <img
                    src={`/sagesses/${s.fichier}.jpg`}
                    alt={s.nom}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    onError={e => { e.target.style.display = "none"; }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: T.serif,
                    fontSize: "1rem",
                    color: libre ? T.orPale : `${T.brume}60`,
                    fontWeight: 300,
                  }}>{s.nom}</div>
                  <div style={{
                    fontFamily: T.sans, fontWeight: 300,
                    fontSize: "0.6rem", letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    color: libre ? `${T.brume}80` : `${T.brume}35`,
                    marginTop: "0.2rem",
                  }}>{s.origine}</div>
                </div>
                <div style={{ fontSize: "0.85rem", opacity: libre ? 0.7 : 0.3 }}>
                  {libre ? (isSelected ? "▲" : "▼") : "✦"}
                </div>
              </div>

              {/* Tooltip verrouillé */}
              {isLocked && (
                <div style={{
                  background: `${T.nuit2}EE`,
                  border: `1px solid ${T.brume}25`,
                  borderRadius: "6px",
                  padding: "0.7rem 1rem",
                  marginTop: "0.3rem",
                  fontFamily: T.serif,
                  fontStyle: "italic",
                  fontSize: "0.82rem",
                  color: T.brume,
                  lineHeight: 1.6,
                }}>
                  S'ouvre à la Porte {s.porteMin} · Continue d'écrire, de souffler, de traverser.
                </div>
              )}

              {/* Texte déplié */}
              {isSelected && libre && (
                <div style={{
                  background: `${T.nuit2}AA`,
                  border: `1px solid ${T.or}18`,
                  borderTop: "none",
                  borderRadius: "0 0 8px 8px",
                  padding: "1.8rem 1.4rem 1.4rem",
                }}>
                  {/* Gravure SVG */}
                  {s.gravure && (
                    <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 1.8rem" }}>
                      {/* Nom en filigrane */}
                      <div style={{
                        position: "absolute", inset: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 52, lineHeight: 1,
                        color: `${T.or}09`,
                        fontFamily: T.serif,
                        pointerEvents: "none", userSelect: "none",
                        letterSpacing: "-0.05em",
                      }}>
                        {s.nom.charAt(0)}
                      </div>
                      <svg width={80} height={80} viewBox="0 0 48 48" fill="none"
                        stroke={T.or} strokeLinecap="round" strokeLinejoin="round"
                        style={{ position: "relative", zIndex: 1, opacity: 0.75 }}
                        dangerouslySetInnerHTML={{ __html: s.gravure }}
                      />
                    </div>
                  )}
                  {/* Séparateur */}
                  <div style={{ width: 40, height: 1, background: `linear-gradient(to right, transparent, ${T.or}44, transparent)`, margin: "0 auto 1.6rem" }} />
                  <p style={{
                    fontFamily: T.serif,
                    fontStyle: "italic",
                    fontSize: "0.88rem",
                    color: T.aube,
                    lineHeight: 2,
                    margin: 0,
                    whiteSpace: "pre-line",
                  }}>{s.texte}</p>
                </div>
              )}
            </div>
          );
        })}
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
      // Passer par la route API Vercel (clé Anthropic côté serveur)
      const res = await fetch(`/api/lettre-mensuelle?user_key=${encodeURIComponent(uk)}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Erreur serveur");

      // Récupérer la lettre générée
      const getRes = await fetch(`/api/lettre-mensuelle?user_key=${encodeURIComponent(uk)}&mois=${mois}`);
      const data = await getRes.json();
      const contenu = data?.lettre?.contenu;
      if (!contenu) throw new Error("vide");
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

  const estPremium = isPremium || premiumLocal;

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
      En train d'écrire…
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
        {typeof lettre === "string" ? lettre : lettre?.contenu}
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

const Profil = ({ data, onUpdateData, progressStats, onSignOut, isPremium, onShowPaywall, authUserKey, cleActive = 0, onShowCGU }) => {
  const cdv = cheminDeVie(data.naissance);
  const chemin = CHEMINS[cdv] || CHEMINS[9];
  const { blessure, hasDual, hasCroissance } = getContextProfil(data);
  const isRationnel = data.sensibilite === "rationnel";
  const carte = CARTE_DATA[cdv] || CARTE_DATA[9];
  const [c1] = carte.palette;

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

  const eclats = calcEclats(progressStats);

  return (
    <div style={{ paddingBottom: "6rem" }}>

      {/* ── HERO — carte d'âme centrée, fondue ── */}
      <div style={{
        position: "relative", width: "100%",
        minHeight: "70vh", overflow: "hidden",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "flex-end",
        paddingBottom: "2.5rem",
        background: T.nuit,
      }}>
        {/* Halo radial derrière la carte */}
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse 70% 60% at 50% 40%, ${c1}12 0%, transparent 70%)`,
          pointerEvents: "none",
        }}/>
        {/* Carte — contenue, visible en entier */}
        <div style={{
          position: "absolute",
          top: "3%", left: "50%",
          transform: "translateX(-50%)",
          width: "min(72vw, 300px)",
        }}>
          {CARTE_IMAGES[cdv] ? (
            <img src={CARTE_IMAGES[cdv]} alt="" style={{
              width: "100%", height: "auto",
              display: "block",
              borderRadius: "10px",
              boxShadow: `0 24px 80px rgba(0,0,0,0.7), 0 0 40px ${c1}18`,
            }}/>
          ) : (
            <CarteAme data={data} />
          )}
        </div>
        {/* Gradient bas — fondu vers le fond */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "45%",
          background: `linear-gradient(to top, ${T.nuit} 0%, ${T.nuit}CC 40%, transparent 100%)`,
          pointerEvents: "none",
        }}/>
        {/* Texte hero */}
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "0 1.5rem" }}>
          <h1 style={{
            fontFamily: T.serif, fontWeight: 300,
            fontSize: "clamp(2.2rem, 8vw, 3rem)",
            color: T.orPale, letterSpacing: "0.05em",
            marginBottom: "0.4rem",
          }}>{data.prenom}</h1>
          <div style={{
            fontFamily: T.sans, fontWeight: 300, fontSize: "0.48rem",
            letterSpacing: "0.6em", textTransform: "uppercase",
            color: `${T.brume}99`,
          }}>Chemin {cdv} · {chemin.titre}</div>
        </div>
      </div>

      {/* ── ESSENCE DU CHEMIN ── */}
      {!isRationnel && chemin.essence && (
        <div style={{
          padding: "1.8rem 1.8rem 0",
          animation: "fadeUp 0.7s ease forwards 0.1s", opacity: 0,
        }}>
          <p style={{
            fontFamily: T.serif, fontStyle: "italic",
            fontSize: "clamp(1rem, 3vw, 1.1rem)",
            color: `${T.brume}CC`, lineHeight: 2,
            textAlign: "center",
          }}>« {chemin.essence} »</p>
        </div>
      )}

      {/* ── ANNEAUX DU JOUR ── */}
      <AnneauxJour compact={false} />

      {/* ── SESSIONS MIROIR ── trace des conversations récentes ── */}
      {(() => {
        try {
          const sessions = JSON.parse(localStorage.getItem("alba_miroir_sessions") || "{}");
          const toutes = Object.entries(sessions)
            .sort(([a], [b]) => b.localeCompare(a))
            .flatMap(([date, sess]) => sess.map(s => ({ ...s, date })))
            .slice(0, 5);
          if (!toutes.length) return null;
          const total = Object.values(sessions).reduce((n, arr) => n + arr.length, 0);
          return (
            <div style={{ margin: "1.5rem 1.5rem 0", animation: "fadeUp 0.7s ease forwards 0.25s", opacity: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.9rem" }}>
                <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.48rem", letterSpacing: "0.5em", textTransform: "uppercase", color: T.brume }}>
                  Sessions Miroir
                </div>
                <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.75rem", color: `${T.or}99` }}>
                  {total} au total
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {toutes.map((s, i) => (
                  <div key={s.id || i} style={{
                    padding: "0.85rem 1.1rem",
                    background: `${T.nuit2}CC`,
                    border: `1px solid ${T.brume}12`,
                    borderLeft: `2px solid ${T.or}33`,
                    borderRadius: "4px",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                      <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.42rem", letterSpacing: "0.3em", textTransform: "uppercase", color: `${T.brume}66` }}>
                        {new Date(s.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} · {s.heure}
                      </div>
                      <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.4rem", letterSpacing: "0.2em", color: `${T.or}66` }}>
                        {s.echanges} échange{s.echanges > 1 ? "s" : ""}
                      </div>
                    </div>
                    <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.82rem", color: `${T.brume}BB`, lineHeight: 1.6, margin: 0 }}>
                      « {s.extrait}{s.extrait?.length >= 80 ? "…" : ""} »
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        } catch { return null; }
      })()}

      {/* ── PRÉSENCE ── stats fondues, pas de grille ── */}
      <div style={{ padding: "2rem 1.8rem 0", animation: "fadeUp 0.7s ease forwards 0.2s", opacity: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center", borderTop: `1px solid ${T.brume}15`, borderBottom: `1px solid ${T.brume}15`, padding: "1.5rem 0" }}>
          {[
            { val: nbJours, label: "jours" },
            { val: tempetes.length, label: "tempêtes" },
            { val: eclats, label: "éclats" },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "1.8rem", color: T.orPale, fontWeight: 300 }}>{s.val}</div>
              <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.42rem", letterSpacing: "0.4em", textTransform: "uppercase", color: T.brume, marginTop: "0.3rem" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── INTENTION ── */}
      <div style={{
        margin: "1.5rem 1.5rem 0",
        padding: "1.3rem 1.5rem",
        background: `${blessure.couleur}08`,
        border: `1px solid ${blessure.couleur}20`,
        borderLeft: `3px solid ${blessure.couleur}60`,
        borderRadius: "0 8px 8px 0",
        animation: "fadeUp 0.7s ease forwards 0.3s", opacity: 0,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
          <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.44rem", letterSpacing: "0.4em", textTransform: "uppercase", color: blessure.couleur }}>
            Ce que tu traverses
          </div>
          <button onClick={() => setEditIntention(true)} style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: T.sans, fontWeight: 300, fontSize: "0.44rem",
            letterSpacing: "0.3em", textTransform: "uppercase", color: T.brume,
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

      {/* ── TABLEAU DE BORD ── */}
      <div style={{ margin: "2rem 0 0", padding: "0 1.5rem", animation: "fadeUp 0.7s ease forwards 0.28s", opacity: 0 }}>

        {/* Titre section */}
        <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.48rem", letterSpacing: "0.5em", textTransform: "uppercase", color: T.brume, marginBottom: "1.2rem" }}>
          Tableau de bord
        </div>

        {/* ── Portes & Clés ── */}
        <div style={{
          background: `${T.nuit2}CC`,
          border: `1px solid ${T.brume}15`,
          borderRadius: "10px",
          padding: "1.3rem 1.4rem",
          marginBottom: "1rem",
        }}>
          <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.42rem", letterSpacing: "0.4em", textTransform: "uppercase", color: `${T.brume}88`, marginBottom: "1rem" }}>
            Les 6 Clés · Chemin parcouru
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {CLES.map((cle, i) => {
              const franchie = i <= cleActive;
              const active = i === cleActive;
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem" }}>
                  <div style={{
                    width: "100%", aspectRatio: "1",
                    borderRadius: "50%",
                    background: franchie ? `${cle.couleur}22` : `${T.brume}08`,
                    border: `1px solid ${franchie ? cle.couleur + "55" : T.brume + "18"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: active ? `0 0 10px ${cle.couleur}40` : "none",
                    transition: "all 0.4s",
                  }}>
                    <span style={{
                      fontFamily: T.serif, fontStyle: "italic",
                      fontSize: "clamp(0.55rem, 2.2vw, 0.75rem)",
                      color: franchie ? cle.couleur : `${T.brume}30`,
                      fontWeight: 300,
                    }}>{cle.num}</span>
                  </div>
                  <div style={{
                    fontFamily: T.sans, fontWeight: 300,
                    fontSize: "clamp(0.35rem, 1.2vw, 0.44rem)",
                    letterSpacing: "0.05em", textTransform: "uppercase",
                    color: franchie ? `${cle.couleur}CC` : `${T.brume}28`,
                    textAlign: "center", lineHeight: 1.2,
                  }}>{cle.nom}</div>
                </div>
              );
            })}
          </div>
          {/* Barre de progression éclats vers prochaine porte */}
          {cleActive < CLES.length - 1 && (() => {
            const prochainSeuil = SEUILS_PORTES[cleActive + 1];
            const seuilActuel  = SEUILS_PORTES[cleActive];
            const pct = Math.min(100, Math.round(((eclats - seuilActuel) / (prochainSeuil - seuilActuel)) * 100));
            return (
              <div style={{ marginTop: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                  <span style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.4rem", letterSpacing: "0.3em", color: `${T.brume}66` }}>
                    {eclats} éclats
                  </span>
                  <span style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.4rem", letterSpacing: "0.3em", color: `${T.brume}44` }}>
                    Porte {cleActive + 1} → {prochainSeuil - eclats} restants
                  </span>
                </div>
                <div style={{ height: 2, background: `${T.brume}18`, borderRadius: 1, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(to right, ${CLES[cleActive].couleur}88, ${CLES[cleActive].couleur})`, borderRadius: 1, transition: "width 1.2s ease" }}/>
                </div>
              </div>
            );
          })()}
        </div>

        {/* ── Sagesses acquises ── */}
        <div style={{
          background: `${T.nuit2}CC`,
          border: `1px solid ${T.brume}15`,
          borderRadius: "10px",
          padding: "1.3rem 1.4rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.42rem", letterSpacing: "0.4em", textTransform: "uppercase", color: `${T.brume}88` }}>
              Sagesses acquises
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem" }}>
              <span style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "1.1rem", color: T.orPale }}>{SAGESSES.filter(s => cleActive >= s.porteMin).length}</span>
              <span style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.44rem", color: `${T.brume}55` }}>/ {SAGESSES.length}</span>
            </div>
          </div>

          {/* Grille pastilles — débloquées en couleur, verrouillées en fantôme */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
            {SAGESSES.map(s => {
              const libre = cleActive >= s.porteMin;
              return (
                <div key={s.id} title={libre ? s.nom : `Porte ${s.porteMin}`} style={{
                  width: 42, height: 42, borderRadius: "50%",
                  overflow: "hidden",
                  border: `1px solid ${libre ? T.or + "44" : T.brume + "12"}`,
                  background: T.nuit,
                  opacity: libre ? 1 : 0.22,
                  flexShrink: 0,
                  position: "relative",
                }}>
                  <img
                    src={`/sagesses/${s.fichier}.jpg`}
                    alt={s.nom}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    onError={e => { e.target.style.display = "none"; }}
                  />
                  {!libre && (
                    <div style={{
                      position: "absolute", inset: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.55rem", color: `${T.brume}55`,
                    }}>✦</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Ce qui manque */}
          {SAGESSES.filter(s => cleActive < s.porteMin).length > 0 && (
            <div style={{ marginTop: "1rem", fontFamily: T.serif, fontStyle: "italic", fontSize: "0.78rem", color: `${T.brume}55`, lineHeight: 1.7 }}>
              {SAGESSES.filter(s => cleActive < s.porteMin).length} sagesse{SAGESSES.filter(s => cleActive < s.porteMin).length > 1 ? "s" : ""} encore à découvrir — continue d'écrire, de souffler, de traverser.
            </div>
          )}
        </div>

      </div>

      {/* ── LETTRE MENSUELLE ── */}
      <div style={{ margin: "2rem 0 0", padding: "0 1.5rem", animation: "fadeUp 0.7s ease forwards 0.4s", opacity: 0 }}>
        <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.48rem", letterSpacing: "0.5em", textTransform: "uppercase", color: T.brume, marginBottom: "1rem" }}>
          La lettre du mois
        </div>
        <LettreMensuelle userKey={authUserKey} isPremium={isPremium} onShowPaywall={onShowPaywall} />
      </div>

      {/* ── MOT SECRET ── */}
      <div style={{ padding: "0 1.5rem" }}>
        <MotSecret data={data} progressStats={progressStats} />
      </div>

      {/* ── TEMPÊTES ARCHIVÉES ── */}
      {tempetes.length > 0 && (
        <div style={{ margin: "2rem 0 0", padding: "0 1.5rem", animation: "fadeUp 0.7s ease forwards 0.45s", opacity: 0 }}>
          <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.48rem", letterSpacing: "0.5em", textTransform: "uppercase", color: T.brume, marginBottom: "1rem" }}>
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

      {/* ── SOUFFLE ── */}
      <div style={{ margin: "2rem 1.5rem 0", animation: "fadeUp 0.7s ease forwards 0.5s", opacity: 0 }}>
        <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.48rem", letterSpacing: "0.5em", textTransform: "uppercase", color: T.brume, marginBottom: "1rem" }}>
          Prendre un moment
        </div>
        <SouffleInline />
      </div>

      {/* ── DÉCONNEXION / RESET ── */}
      <div style={{ marginTop: "3rem", textAlign: "center", padding: "0 1.5rem" }}>
        {onSignOut && (
          <button onClick={onSignOut} style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: T.sans, fontWeight: 300, fontSize: "0.55rem",
            letterSpacing: "0.4em", textTransform: "uppercase",
            color: `${T.brume}44`, display: "block", margin: "0 auto 1rem",
          }}>Se déconnecter</button>
        )}
        {!resetConfirm ? (
          <button onClick={() => setResetConfirm(true)} style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: T.sans, fontWeight: 300, fontSize: "0.55rem",
            letterSpacing: "0.4em", textTransform: "uppercase",
            color: `${T.brume}28`,
          }}>Recommencer depuis le début</button>
        ) : (
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <button onClick={() => setResetConfirm(false)} style={{
              background: "none", border: `1px solid ${T.brume}22`,
              borderRadius: "20px", padding: "0.5rem 1rem",
              fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem",
              letterSpacing: "0.3em", color: T.brume, cursor: "pointer",
            }}>Annuler</button>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{
              background: "none", border: `1px solid #A87B7B44`,
              borderRadius: "20px", padding: "0.5rem 1rem",
              fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem",
              letterSpacing: "0.3em", color: "#A87B7B", cursor: "pointer",
            }}>Oui, tout effacer</button>
          </div>
        )}
      </div>

      {/* ── LIENS LÉGAUX ── */}
      <div style={{ textAlign: "center", padding: "1.5rem 1.5rem 0", display: "flex", gap: "1.5rem", justifyContent: "center" }}>
        {[
          { label: "CGU", action: () => onShowCGU?.() },
          { label: "Données & vie privée", action: () => onShowCGU?.() },
          { label: "Mentions légales", action: () => onShowCGU?.() },
        ].map((l, i) => (
          <button key={i} onClick={l.action} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: T.sans, fontWeight: 300, fontSize: "0.42rem", letterSpacing: "0.2em", textTransform: "uppercase", color: `${T.brume}28`, textDecoration: "underline", textDecorationColor: `${T.brume}15` }}>
            {l.label}
          </button>
        ))}
      </div>

      {/* ── PANNEAU CHANGEMENT D'INTENTION ── */}
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
            <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.44rem", letterSpacing: "0.4em", textTransform: "uppercase", color: T.brume, marginBottom: "0.6rem" }}>Je traverse quelque chose</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1rem" }}>
              {INTENTIONS_TEMPETE.map(intent => {
                const sel = data.intention === intent;
                return (
                  <button key={intent} onClick={() => { if (onUpdateData) onUpdateData({ ...data, intention: sel ? "" : intent }); }} style={{
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
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", margin: "0.5rem 0 1rem" }}>
              <div style={{ flex: 1, height: "1px", background: `${T.brume}22` }} />
              <span style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.7rem", color: T.brume }}>et / ou</span>
              <div style={{ flex: 1, height: "1px", background: `${T.brume}22` }} />
            </div>
            <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.44rem", letterSpacing: "0.4em", textTransform: "uppercase", color: T.brume, marginBottom: "0.6rem" }}>Je cherche un espace pour grandir</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {INTENTIONS_LUMIERE.map(intent => {
                const sel = data.intentionSecondaire === intent || (!data.intentionSecondaire && data.intention === intent);
                return (
                  <button key={intent} onClick={() => {
                    if (!data.intention) { if (onUpdateData) onUpdateData({ ...data, intention: sel ? "" : intent, intentionSecondaire: "" }); }
                    else { if (onUpdateData) onUpdateData({ ...data, intentionSecondaire: sel ? "" : intent }); }
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
const Presence = ({ data, onStart, onSessionComplete, onSaveToArdoise, isPremium, onShowPaywall }) => {
  const [phase, setPhase]     = useState("intro");
  const [texte, setTexte]     = useState("");
  const [reflet, setReflet]   = useState("");
  const [question, setQuestion] = useState("");
  const [suite, setSuite]     = useState("");
  const [conv, setConv]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [profondeur, setProfondeur] = useState(0);
  const [invitationPost, setInvitationPost] = useState(null); // invitation contextuelle fin de session

  // ── Limite 2 sessions/jour ──
  const getSessionsAujourdHui = () => {
    try {
      const data = JSON.parse(localStorage.getItem("alba_miroir_quota") || "{}");
      const today = new Date().toDateString();
      return data.date === today ? (data.count || 0) : 0;
    } catch { return 0; }
  };
  const incrementerSession = () => {
    try {
      const today = new Date().toDateString();
      const count = getSessionsAujourdHui() + 1;
      localStorage.setItem("alba_miroir_quota", JSON.stringify({ date: today, count }));
    } catch {}
  };
  const sessionsRestantes = 2 - getSessionsAujourdHui();
  const quotaAtteint = sessionsRestantes <= 0;

  const prenom = (data && data.prenom) ? data.prenom : "toi";

  const SYSTEM = `Tu es ALBA. Tu n'es pas un assistant. Tu n'es pas un thérapeute.
Tu es un miroir — le seul outil qui montre ce qu'on ne voit pas soi-même.

Quand quelqu'un te parle, tu fais une chose : tu repères le mot ou la phrase qui porte le plus de poids dans ce qu'il a écrit. Pas le mot le plus dramatique. Le mot le plus vrai. Et tu le retournes — avec un léger décalage qui permet de voir plus clair.

INTERDITS ABSOLUS :
— Ne commence jamais par le prénom
— Ne dis jamais "je comprends", "c'est normal", "tu n'es pas seul(e)"
— Ne fais pas de liste, ne structure pas
— Ne pose pas deux questions en même temps
— N'utilise pas de métaphores génériques (chemin, lumière, voyage, ancre)
— Ne complimente pas ce que la personne a partagé
— Ne reformule pas simplement ce qu'elle a dit avec d'autres mots
— Tu n'es pas Claude. Tu es ALBA.

TON : Sobre. Dense. Chaque mot pèse. Pas de chaleur artificielle. Une vraie attention. Une phrase peut suffire. Deux maximum.`;

  const appeler = async (messages, maxTok, systemExtra) => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        max_tokens: maxTok || 120,
        system: SYSTEM + (systemExtra || ""),
        messages,
      }),
    });
    const d = await res.json();
    return d.content?.[0]?.text?.trim() || "";
  };

  const ecouter = async () => {
    if (!texte.trim() || loading) return;
    if (!isPremium) { if (onShowPaywall) onShowPaywall(); return; }
    setLoading(true);
    setPhase("latence");
    if (onStart) onStart();
    incrementerSession();
    await new Promise(r => setTimeout(r, 2000));
    try {
      const phrase = await appeler([{ role: "user", content: texte.trim() }], 130);
      const q = await appeler(
        [{ role: "user", content: texte.trim() }, { role: "assistant", content: phrase }, { role: "user", content: "Question" }],
        60,
        "\n\nTu as posé un reflet. Maintenant pose UNE question. Pas une question ouverte générique. Une question qui pointe vers quelque chose de précis dans ce que la personne vient de dire — un mot, une tension, un silence. Courte. Directe. Elle ne doit pas être confortable."
      );
      setReflet(phrase);
      setQuestion(q);
      setConv([{ qui: "moi", texte: texte.trim() }, { qui: "alba", texte: phrase }]);
      setPhase("dialogue");
    } catch(e) {
      setReflet("Je garde tes mots.");
      setPhase("dialogue");
    }
    setLoading(false);
  };

  const continuer = async () => {
    if (!suite.trim() || loading) return;
    setLoading(true);
    const msg = suite.trim();
    setSuite("");
    setQuestion("");
    const newConv = [...conv, { qui: "moi", texte: msg }];
    setConv(newConv);
    const estDernier = profondeur >= 2;
    const promptProfondeur = estDernier
      ? "\n\nC'est le dernier échange de cette session. Ne pose pas de question. Ne résume pas. Dis une chose — une seule — qui restera après que la session soit fermée. Quelque chose de vrai, de précis, ancré dans ce qui a été dit. Pas d'espoir générique. Pas de formule de clôture. Juste une phrase qui tient."
      : "\n\nL'échange s'approfondit. La personne a répondu. Tu peux maintenant aller un peu plus loin — vers ce qui n'a pas encore été nommé. Pas ce qu'elle dit. Ce qu'elle ne dit pas encore mais qui est là, dans l'espace entre les mots. Reste sobre. Une à deux phrases. Pas de conclusion.";
    try {
      const rep = await appeler(
        newConv.map(m => ({ role: m.qui === "moi" ? "user" : "assistant", content: m.texte })),
        130,
        promptProfondeur
      );
      const finalConv = [...newConv, { qui: "alba", texte: rep }];
      setConv(finalConv);
      setProfondeur(p => p + 1);
      if (!estDernier) {
        const q = await appeler(
          [...finalConv.map(m => ({ role: m.qui === "moi" ? "user" : "assistant", content: m.texte })), { role: "user", content: "Question" }],
          60,
          "\n\nTu as posé un reflet. Maintenant pose UNE question. Pas une question ouverte générique. Une question qui pointe vers quelque chose de précis dans ce que la personne vient de dire — un mot, une tension, un silence. Courte. Directe. Elle ne doit pas être confortable."
        );
        setQuestion(q);
      }
      if (onSessionComplete && finalConv.length >= 4) onSessionComplete();
      // Générer invitation contextuelle si c'est la fin
      if (estDernier) {
        try {
          const convResume = finalConv.map(m => `${m.qui === "moi" ? data.prenom || "Moi" : "ALBA"}: ${m.texte}`).join("\n");
          const inv = await appeler(
            [{ role: "user", content: convResume }],
            80,
            `\n\nTu as accompagné cette session. Tu as lu tout l'échange. Propose UNE invitation pour les prochaines 24h. Concrète, ancrée dans ce qui a été dit — pas générique. Une action simple, faisable aujourd'hui. Commence directement par l'invitation, sans préambule. Pas "je te propose". Pas "tu pourrais". Une phrase. Directe. Qui prolonge ce qui a été posé ici.`
          );
          setInvitationPost(inv.trim());
          setPhase("invitation");
        } catch { setPhase("dialogue"); }
      }
    } catch(e) {}
    setLoading(false);
  };

  const recommencer = () => {
    setPhase("intro"); setTexte(""); setReflet(""); setQuestion("");
    setSuite(""); setConv([]); setLoading(false); setProfondeur(0);
    setInvitationPost(null);
  };

  const css = `
    @keyframes albaMonte { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
    @keyframes albaOnde { 0% { transform:translate(-50%,-50%) scale(0.1); opacity:0.6; } 100% { transform:translate(-50%,-50%) scale(4); opacity:0; } }
    @keyframes albaDev { 0% { opacity:0; filter:blur(8px); } 100% { opacity:1; filter:blur(0); } }
  `;

  const fond = {
    minHeight: "calc(100vh - 120px)",
    background: "#060504",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: "2rem 1.5rem",
  };

  // ── INTRO ──
  if (phase === "intro") return (
    <div style={fond}>
      <style>{css}</style>
      <div style={{ width:"100%", maxWidth:400, textAlign:"center" }}>
        <div style={{ marginBottom:"2.5rem", animation:"albaMonte 1s ease forwards" }}>
          <div style={{ width:1, height:48, background:`linear-gradient(to bottom, transparent, ${T.or}44, transparent)`, margin:"0 auto 2rem" }} />
          <p style={{ fontFamily:T.sans, fontWeight:300, fontSize:"0.5rem", letterSpacing:"0.5em", textTransform:"uppercase", color:`${T.or}66`, marginBottom:"0.5rem" }}>LE MIROIR</p>
        </div>
        <p style={{ fontFamily:T.serif, fontStyle:"italic", fontSize:"clamp(1.05rem,3.5vw,1.2rem)", color:T.orPale, lineHeight:2.1, marginBottom:"1.5rem", animation:"albaMonte 1s ease forwards 0.3s", opacity:0 }}>
          Pose ce que tu portes. Une phrase, un mot, ce qui est là maintenant.
        </p>
        <p style={{ fontFamily:T.serif, fontStyle:"italic", fontSize:"clamp(0.9rem,3vw,1rem)", color:`${T.brume}77`, lineHeight:2, marginBottom:"0.8rem", animation:"albaMonte 1s ease forwards 0.6s", opacity:0 }}>
          ALBA ne répond pas. Elle reflète. Tu verras tes propres mots sous un autre angle — ce que tu n'arrivais pas à voir seul.
        </p>
        <p style={{ fontFamily:T.serif, fontStyle:"italic", fontSize:"clamp(0.9rem,3vw,1rem)", color:`${T.brume}77`, lineHeight:2, marginBottom:"2.5rem", animation:"albaMonte 1s ease forwards 0.8s", opacity:0 }}>
          Ce que tu poses ici sera gardé dans ton Ardoise, pour y revenir.
        </p>
        {quotaAtteint ? (
          <div style={{ animation:"albaMonte 1s ease forwards 1s", opacity:0 }}>
            <div style={{ width:28, height:1, background:`linear-gradient(to right,transparent,${T.or}33,transparent)`, margin:"0 auto 1.5rem" }} />
            <p style={{ fontFamily:T.serif, fontStyle:"italic", fontSize:"0.9rem", color:`${T.brume}55`, lineHeight:1.9 }}>
              Tu as utilisé tes deux sessions d'aujourd'hui.
            </p>
            <p style={{ fontFamily:T.serif, fontStyle:"italic", fontSize:"0.85rem", color:`${T.brume}40`, marginTop:"0.5rem" }}>
              Reviens ce soir — ou demain matin.
            </p>
          </div>
        ) : (
          <div style={{ animation:"albaMonte 1s ease forwards 1s", opacity:0 }}>
            <p style={{ fontFamily:T.sans, fontWeight:300, fontSize:"0.45rem", letterSpacing:"0.35em", textTransform:"uppercase", color:`${T.brume}44`, marginBottom:"1.5rem" }}>
              {sessionsRestantes === 2 ? "2 sessions disponibles aujourd'hui" : "1 session restante aujourd'hui"}
            </p>
            {!isPremium ? (
              <button onClick={onShowPaywall} style={{ background:"transparent", border:`1px solid ${T.or}44`, borderRadius:"30px", padding:"0.85rem 2.6rem", fontFamily:T.serif, fontStyle:"italic", fontSize:"1rem", color:T.or, cursor:"pointer" }}>
                ✦ Débloquer le Miroir
              </button>
            ) : (
              <button onClick={() => setPhase("ecriture")} style={{ background:"transparent", border:`1px solid ${T.or}44`, borderRadius:"30px", padding:"0.85rem 2.6rem", fontFamily:T.serif, fontStyle:"italic", fontSize:"1rem", color:T.or, cursor:"pointer" }}>
                Entrer dans le Miroir
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // ── ÉCRITURE ──
  if (phase === "ecriture") return (
    <div style={fond}>
      <style>{css}</style>
      <div style={{ width: "100%", maxWidth: 440, textAlign: "center" }}>
        <div style={{ width:48, height:48, borderRadius:"50%", border:`1px solid ${T.or}22`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 2.5rem", animation:"albaMonte 1s ease forwards" }}>
          <span style={{ color:`${T.or}55`, fontSize:"1rem" }}>✦</span>
        </div>
        <p style={{ fontFamily:T.serif, fontStyle:"italic", fontSize:"clamp(1rem,3.5vw,1.2rem)", color:`${T.brume}99`, lineHeight:2, marginBottom:"0.5rem", animation:"albaMonte 1s ease forwards 0.3s", opacity:0 }}>
          Pose ici ce qui est là.
        </p>
        <p style={{ fontFamily:T.sans, fontWeight:300, fontSize:"0.55rem", letterSpacing:"0.06em", color:`${T.brume}44`, marginBottom:"2.5rem", animation:"albaMonte 1s ease forwards 0.5s", opacity:0 }}>
          Un mot. Une phrase. Ce que tu portes.
        </p>
        <textarea
          value={texte}
          onChange={e => setTexte(e.target.value)}
          onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey && texte.trim()) { e.preventDefault(); ecouter(); }}}
          placeholder="…"
          rows={3}
          autoFocus
          style={{ width:"100%", background:"transparent", border:"none", borderBottom:`1px solid ${texte ? T.or+"55" : T.or+"18"}`, color:T.aube, fontFamily:T.serif, fontStyle:"italic", fontSize:"clamp(1.1rem,4vw,1.3rem)", padding:"0.5rem 0", resize:"none", lineHeight:1.9, textAlign:"center", outline:"none", transition:"border-color 0.5s", animation:"albaMonte 1s ease forwards 0.7s", opacity:0 }}
        />
        {texte.trim().length > 2 && (
          <button onClick={ecouter} style={{ marginTop:"3rem", background:"transparent", border:`1px solid ${T.or}44`, borderRadius:"30px", padding:"0.85rem 2.6rem", fontFamily:T.serif, fontStyle:"italic", fontSize:"1.05rem", color:T.or, cursor:"pointer", animation:"albaMonte 0.5s ease forwards" }}>
            {isPremium ? "Laisser venir" : "✦ Débloquer le Miroir"}
          </button>
        )}
      </div>
    </div>
  );

  // ── LATENCE ──
  if (phase === "latence") return (
    <div style={fond}>
      <style>{css}</style>
      <p style={{ fontFamily:T.serif, fontStyle:"italic", fontSize:"clamp(0.95rem,3vw,1.1rem)", color:`${T.brume}44`, textAlign:"center", marginBottom:"5rem", maxWidth:380, padding:"0 1rem" }}>
        {texte.trim()}
      </p>
      <div style={{ position:"relative", width:6, height:6 }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{ position:"absolute", top:"50%", left:"50%", width:70, height:70, borderRadius:"50%", border:`1px solid ${T.or}88`, animation:`albaOnde 3s ease-out infinite`, animationDelay:`${i*0.6}s` }} />
        ))}
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:4, height:4, borderRadius:"50%", background:T.or, opacity:0.6 }} />
      </div>
    </div>
  );

  // ── INVITATION POST-SESSION ──
  if (phase === "invitation") return (
    <div style={{ ...fond }}>
      <style>{css}</style>
      <div style={{ width:"100%", maxWidth:400, textAlign:"center" }}>
        <div style={{ width:1, height:40, background:`linear-gradient(to bottom, transparent, ${T.or}33, transparent)`, margin:"0 auto 2.5rem", animation:"albaMonte 1s ease forwards" }} />
        <p style={{ fontFamily:T.sans, fontWeight:300, fontSize:"0.48rem", letterSpacing:"0.55em", textTransform:"uppercase", color:`${T.or}55`, marginBottom:"2rem", animation:"albaMonte 1s ease forwards 0.2s", opacity:0 }}>
          Une invitation
        </p>
        <p style={{ fontFamily:T.serif, fontStyle:"italic", fontSize:"clamp(1.05rem,3.5vw,1.25rem)", color:T.orPale, lineHeight:2.1, marginBottom:"3rem", animation:"albaDev 1.5s ease forwards 0.4s", opacity:0 }}>
          {invitationPost}
        </p>
        <div style={{ width:28, height:1, background:`linear-gradient(to right,transparent,${T.or}33,transparent)`, margin:"0 auto 2.5rem" }} />
        <p style={{ fontFamily:T.serif, fontStyle:"italic", fontSize:"0.82rem", color:`${T.brume}88`, lineHeight:1.8, marginBottom:"2.5rem", animation:"albaMonte 1s ease forwards 0.8s", opacity:0 }}>
          Pour les prochaines 24h, si tu le veux.
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem", alignItems:"center", animation:"albaMonte 1s ease forwards 1s", opacity:0 }}>
          <button onClick={recommencer} style={{ background:"none", border:`1px solid ${T.or}44`, borderRadius:"20px", padding:"0.6rem 1.8rem", fontFamily:T.sans, fontWeight:300, fontSize:"0.55rem", letterSpacing:"0.4em", textTransform:"uppercase", color:T.or, cursor:"pointer" }}>
            Une nouvelle session
          </button>
          <button onClick={() => setPhase("dialogue")} style={{ background:"none", border:"none", fontFamily:T.serif, fontStyle:"italic", fontSize:"0.82rem", color:`${T.brume}55`, cursor:"pointer", marginTop:"0.3rem" }}>
            Revenir à l'échange
          </button>
        </div>
      </div>
    </div>
  );

  // ── DIALOGUE ──
  return (
    <div style={{ ...fond, justifyContent:"flex-start", overflowY:"auto", paddingTop:"4rem", paddingBottom:"6rem" }}>
      <style>{css}</style>
      <div style={{ width:"100%", maxWidth:460, margin:"0 auto" }}>

        {/* Reflet principal */}
        <div style={{ textAlign:"center", marginBottom:"3rem" }}>
          <div style={{ width:28, height:1, background:`linear-gradient(to right,transparent,${T.or}55,transparent)`, margin:"0 auto 2rem" }} />
          <p style={{ fontFamily:T.serif, fontStyle:"italic", fontSize:"clamp(1.2rem,5vw,1.45rem)", color:T.orPale, lineHeight:2, animation:"albaDev 2s ease forwards", opacity:0, margin:"0 auto", maxWidth:400 }}>
            {reflet}
          </p>
          <p style={{ marginTop:"0.8rem", fontFamily:T.sans, fontWeight:300, fontSize:"0.42rem", letterSpacing:"0.55em", textTransform:"uppercase", color:`${T.brume}33` }}>ALBA</p>
        </div>

        {/* Échanges suivants */}
        {conv.slice(2).map((msg, i) => (
          <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:msg.qui==="moi"?"flex-end":"center", marginBottom:"2rem", animation:`albaMonte 0.6s ease forwards`, opacity:0, animationDelay:`${i*0.1}s` }}>
            {msg.qui === "moi" ? (
              <p style={{ fontFamily:T.serif, fontStyle:"italic", fontSize:"0.8rem", color:`${T.brume}55`, lineHeight:1.7, maxWidth:"72%", textAlign:"right", margin:0 }}>{msg.texte}</p>
            ) : (
              <div style={{ textAlign:"center", maxWidth:400 }}>
                <p style={{ fontFamily:T.serif, fontStyle:"italic", fontSize:"clamp(1rem,3.5vw,1.15rem)", color:T.aube, lineHeight:1.9, margin:"0 auto", animation:"albaDev 1.8s ease forwards", opacity:0 }}>{msg.texte}</p>
                <p style={{ marginTop:"0.5rem", fontFamily:T.sans, fontWeight:300, fontSize:"0.4rem", letterSpacing:"0.5em", textTransform:"uppercase", color:`${T.brume}28` }}>ALBA</p>
              </div>
            )}
          </div>
        ))}

        {/* Question */}
        {question && !loading && (
          <div style={{ textAlign:"center", marginBottom:"1.5rem", animation:"albaMonte 1s ease forwards 0.5s", opacity:0 }}>
            <p style={{ fontFamily:T.serif, fontStyle:"italic", fontSize:"0.95rem", color:`${T.brume}77`, lineHeight:1.8, margin:0 }}>{question}</p>
          </div>
        )}

        {loading && (
          <div style={{ textAlign:"center", marginBottom:"1.5rem" }}>
            {[0,1,2].map(i => <span key={i} style={{ display:"inline-block", width:4, height:4, borderRadius:"50%", background:`${T.or}55`, margin:"0 3px", animation:`albaOnde 1.4s ease-in-out infinite`, animationDelay:`${i*0.2}s` }} />)}
          </div>
        )}

        {/* Zone de réponse ou fin */}
        {profondeur < 3 ? (
          <div style={{ borderTop:`1px solid ${T.brume}12`, paddingTop:"1.5rem" }}>
            <textarea
              value={suite}
              onChange={e => setSuite(e.target.value)}
              onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); continuer(); }}}
              placeholder="Continue ici…"
              rows={2}
              style={{ width:"100%", background:"transparent", border:"none", borderBottom:`1px solid ${suite ? T.or+"44" : T.brume+"18"}`, color:T.aube, fontFamily:T.serif, fontStyle:"italic", fontSize:"1rem", padding:"0.4rem 0", resize:"none", lineHeight:1.7, textAlign:"center", outline:"none" }}
            />
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"1rem" }}>
              <button onClick={recommencer} style={{ background:"none", border:"none", fontFamily:T.sans, fontWeight:300, fontSize:"0.44rem", letterSpacing:"0.35em", textTransform:"uppercase", color:`${T.brume}40`, cursor:"pointer" }}>
                Nouvelle session
              </button>
              {suite.trim().length > 0 && (
                <button onClick={continuer} style={{ background:"transparent", border:`1px solid ${T.or}44`, borderRadius:"24px", padding:"0.5rem 1.3rem", fontFamily:T.serif, fontStyle:"italic", fontSize:"0.9rem", color:T.or, cursor:"pointer" }}>→</button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ textAlign:"center", marginTop:"2.5rem", animation:"albaMonte 1.2s ease forwards", opacity:0 }}>
            <div style={{ width:28, height:1, background:`linear-gradient(to right,transparent,${T.or}33,transparent)`, margin:"0 auto 2rem" }} />
            <p style={{ fontFamily:T.serif, fontStyle:"italic", fontSize:"clamp(0.9rem,3vw,1rem)", color:`${T.brume}66`, lineHeight:2, maxWidth:360, margin:"0 auto 0.8rem" }}>
              Ce que tu viens de poser est maintenant dans ton Ardoise. Tu peux y revenir à tout moment — c'est une trace, pas une conclusion.
            </p>
            <p style={{ fontFamily:T.serif, fontStyle:"italic", fontSize:"0.85rem", color:`${T.brume}44`, lineHeight:1.9, marginBottom:"2rem" }}>
              {sessionsRestantes > 0
                ? `Tu peux ouvrir une nouvelle session ${sessionsRestantes === 2 ? "ce matin ou ce soir" : "ce soir"}.`
                : "Tu reviens demain. Le Miroir t'attend."}
            </p>
            {onSaveToArdoise && (
              <button onClick={() => onSaveToArdoise(`Miroir — ${new Date().toLocaleDateString("fr-FR")}\n\n« ${conv[0]?.texte || ""} »\n\n${reflet}`)} style={{ background:"none", border:"none", fontFamily:T.sans, fontWeight:300, fontSize:"0.44rem", letterSpacing:"0.3em", textTransform:"uppercase", color:`${T.or}55`, cursor:"pointer", marginBottom:"1.5rem", display:"block", margin:"0 auto 1.5rem" }}>
                ✦ Garder dans l'Ardoise
              </button>
            )}
            {sessionsRestantes > 0 && (
              <button onClick={recommencer} style={{ background:"none", border:`1px solid ${T.brume}22`, borderRadius:"24px", padding:"0.6rem 1.6rem", fontFamily:T.serif, fontStyle:"italic", fontSize:"0.85rem", color:`${T.brume}55`, cursor:"pointer" }}>
                Nouvelle session
              </button>
            )}
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

// ─── TUTO STORIES ────────────────────────────────────────────────────────────

const TUTO_SLIDES = [
  {
    id: "miroir",
    titre: "Le Miroir",
    sousTitre: "Pas un assistant. Un reflet.",
    texte: "Tu parles. ALBA écoute et te renvoie ce que tu ne vois pas seul. Une question, pas deux. Une phrase qui reste.",
    symbol: "○",
    couleur: "#7898C8",
    bg: "radial-gradient(ellipse 70% 50% at 50% 40%, #0F1A2A 0%, #0D0A12 100%)",
  },
  {
    id: "ardoise",
    titre: "L'Ardoise",
    sousTitre: "Poser ce qui traverse.",
    texte: "Des fragments quotidiens — une pensée, une émotion, une image. À la fin de la semaine, ALBA les tisse en une lettre qui te parle de toi.",
    symbol: "□",
    couleur: "#C8A96E",
    bg: "radial-gradient(ellipse 70% 50% at 50% 40%, #2A1F0F 0%, #0D0A12 100%)",
  },
  {
    id: "portes",
    titre: "Les 12 Portes",
    sousTitre: "Un chemin intérieur.",
    texte: "Chaque action génère des Éclats d'aube. Les Éclats ouvrent les Portes. Chaque Porte déverrouille une nouvelle dimension — des sagesses, des pratiques, une lettre unique.",
    symbol: "✦",
    couleur: "#C8A040",
    bg: "radial-gradient(ellipse 70% 50% at 50% 40%, #2A200A 0%, #0D0A12 100%)",
  },
  {
    id: "sagesses",
    titre: "Les Sagesses",
    sousTitre: "22 traditions du monde.",
    texte: "Ikigai, Kintsugi, Ubuntu, Satori… Chaque sagesse s'ouvre avec une nouvelle Porte. Une gravure. Un texte. Une question pour ce soir.",
    symbol: "◇",
    couleur: "#A89060",
    bg: "radial-gradient(ellipse 70% 50% at 50% 40%, #1A180A 0%, #0D0A12 100%)",
  },
  {
    id: "ciel",
    titre: "Le Ciel",
    sousTitre: "Un espace partagé.",
    texte: "Chaque offrande que tu déposes — une phrase, un livre, une pratique — est transformée et devient une étoile. D'autres la verront. Quelqu'un en avait besoin.",
    symbol: "✦",
    couleur: "#9878C8",
    bg: "radial-gradient(ellipse 70% 50% at 50% 40%, #150F2A 0%, #0D0A12 100%)",
  },
  {
    id: "evasion",
    titre: "L'Évasion & le Souffle",
    sousTitre: "Deux pauses.",
    texte: "L'Évasion : du cinéma contemplatif pour respirer autrement. Le Souffle : un exercice guidé de 3 minutes. Rien à faire sinon être là.",
    symbol: "~",
    couleur: "#78A878",
    bg: "radial-gradient(ellipse 70% 50% at 50% 40%, #0F1A0F 0%, #0D0A12 100%)",
  },
  {
    id: "debut",
    titre: "Par où commencer ?",
    sousTitre: "Par ici.",
    texte: "Le Miroir, chaque soir. L'Ardoise, quand quelque chose traverse. Le reste vient seul, à mesure que les Portes s'ouvrent.",
    symbol: "→",
    couleur: "#C8A96E",
    bg: "radial-gradient(ellipse 70% 50% at 50% 40%, #1A1510 0%, #0D0A12 100%)",
    isFinal: true,
  },
];

const TutoStories = ({ onClose }) => {
  const [idx, setIdx] = useState(0);
  const [animDir, setAnimDir] = useState(1);
  const [touchStart, setTouchStart] = useState(null);
  const slide = TUTO_SLIDES[idx];
  const isLast = idx === TUTO_SLIDES.length - 1;

  const goTo = (newIdx, dir = 1) => {
    if (newIdx < 0 || newIdx >= TUTO_SLIDES.length) return;
    setAnimDir(dir);
    setIdx(newIdx);
  };

  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) goTo(diff > 0 ? idx + 1 : idx - 1, diff > 0 ? 1 : -1);
    setTouchStart(null);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "#0D0A12" }}
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
    >
      <style>{`
        @keyframes tutoSlideIn { from { opacity:0; transform:translateX(30px); } to { opacity:1; transform:translateX(0); } }
        @keyframes tutoSlideInLeft { from { opacity:0; transform:translateX(-30px); } to { opacity:1; transform:translateX(0); } }
        .tuto-slide { animation: tutoSlideIn 0.4s ease forwards; }
      `}</style>

      {/* Barre de progression */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", gap: 3, padding: "env(safe-area-inset-top, 1rem) 1rem 0", zIndex: 10 }}>
        {TUTO_SLIDES.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 2, borderRadius: 2, background: i <= idx ? slide.couleur : `${T.brume}25`, transition: "background 0.3s" }} />
        ))}
      </div>

      {/* Bouton fermer */}
      <button onClick={onClose} style={{ position: "absolute", top: "calc(env(safe-area-inset-top, 1rem) + 1.2rem)", right: "1rem", background: "none", border: "none", color: `${T.brume}88`, fontFamily: T.sans, fontSize: "0.55rem", letterSpacing: "0.3em", textTransform: "uppercase", cursor: "pointer", zIndex: 10 }}>
        Passer
      </button>

      {/* Contenu slide */}
      <div key={idx} className="tuto-slide" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "5rem 2.5rem 6rem", background: slide.bg }}>

        {/* Symbole central animé */}
        <div style={{
          fontSize: slide.id === "debut" ? "2rem" : "3.5rem",
          color: slide.couleur,
          marginBottom: "2.5rem",
          animation: "alba-breathe 4s ease-in-out infinite",
          textShadow: `0 0 40px ${slide.couleur}44`,
          lineHeight: 1,
        }}>
          {slide.symbol}
        </div>

        {/* Texte */}
        <div style={{ textAlign: "center", maxWidth: 320 }}>
          <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.45rem", letterSpacing: "0.5em", textTransform: "uppercase", color: `${slide.couleur}99`, marginBottom: "0.8rem" }}>
            {slide.sousTitre}
          </div>
          <h2 style={{ fontFamily: T.serif, fontWeight: 300, fontSize: "clamp(1.8rem, 7vw, 2.5rem)", color: T.orPale, letterSpacing: "0.05em", margin: "0 0 1.5rem" }}>
            {slide.titre}
          </h2>
          <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "clamp(0.88rem, 3.5vw, 1rem)", color: `${T.brume}CC`, lineHeight: 1.9, margin: 0 }}>
            {slide.texte}
          </p>
        </div>
      </div>

      {/* Navigation bas */}
      <div style={{ position: "absolute", bottom: "calc(env(safe-area-inset-bottom, 1rem) + 1.5rem)", left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: "1.5rem", zIndex: 10 }}>
        {idx > 0 && (
          <button onClick={() => goTo(idx - 1, -1)} style={{ background: "none", border: `1px solid ${T.brume}25`, borderRadius: "50%", width: 40, height: 40, cursor: "pointer", color: `${T.brume}66`, fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ←
          </button>
        )}
        {isLast ? (
          <button onClick={onClose} style={{
            background: `${slide.couleur}22`, border: `1px solid ${slide.couleur}55`,
            borderRadius: "30px", padding: "0.85rem 2.5rem",
            fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem",
            letterSpacing: "0.45em", textTransform: "uppercase",
            color: slide.couleur, cursor: "pointer", transition: "all 0.3s",
          }}>
            C'est parti
          </button>
        ) : (
          <button onClick={() => goTo(idx + 1)} style={{
            background: `${slide.couleur}22`, border: `1px solid ${slide.couleur}44`,
            borderRadius: "30px", padding: "0.75rem 2rem",
            fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem",
            letterSpacing: "0.45em", textTransform: "uppercase",
            color: slide.couleur, cursor: "pointer",
          }}>
            Suivant →
          </button>
        )}
      </div>
    </div>
  );
};

// ─── AIDE ALBA ────────────────────────────────────────────────────────────────

const AIDE_FAQ = [
  { q: "C'est quoi les Éclats d'aube ?", r: "Chaque action dans ALBA — écrire, souffler, traverser — génère des Éclats. Ils s'accumulent et ouvrent les Portes." },
  { q: "Comment fonctionne le Miroir ?", r: "Tu parles. ALBA repère ce qui pèse le plus dans ce que tu dis — pas le plus dramatique, le plus vrai. Elle pose une question. Une seule." },
  { q: "C'est quoi les 12 Portes ?", r: "Un chemin en 12 étapes intérieures. Chaque Porte déverrouille de nouvelles fonctionnalités, sagesses et pratiques. Tu les franchis naturellement en utilisant l'app." },
  { q: "Mes données sont-elles privées ?", r: "Tout ce que tu écris sur l'Ardoise reste sur ton appareil. Les sessions du Miroir ne sont pas stockées. Aucune donnée n'est vendue." },
  { q: "Comment marchent les Parcours ?", r: "Un parcours dure 5 à 10 jours. Chaque jour, une invitation concrète. Tu valides quand tu l'as faite. Un seul jour à la fois." },
  { q: "C'est quoi le Ciel partagé ?", r: "Un espace où chaque utilisateur dépose quelque chose — une phrase, un livre, une pratique — qui a changé quelque chose pour lui. Ça devient une étoile pour quelqu'un d'autre." },
  { q: "Comment relancer le tutoriel ?", r: null }, // Action spéciale
];

const AideAlba = ({ onClose, onTuto, tab }) => {
  const [question, setQuestion] = useState("");
  const [reponse, setReponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [faqOpen, setFaqOpen] = useState(null);

  const poser = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setReponse(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          max_tokens: 120,
          system: `Tu es l'aide d'ALBA — une app de bien-être intérieur. Tu réponds aux questions sur l'application de façon sobre et directe, en 2-3 phrases maximum. Onglet actif: ${tab}. Fonctionnalités: Miroir (conversation intérieure), Ardoise (notes quotidiennes), Éclats d'aube (points qui ouvrent les Portes), 12 Portes (chemin intérieur), Sagesses (22 traditions mondiales), Le Ciel (offrandes partagées), Évasion (vidéos contemplatives), Souffle (respiration guidée), Trouvailles (bibliothèque), Parcours thématiques. Ne parle pas en dehors de l'application.`,
          messages: [{ role: "user", content: question.trim() }],
        }),
      });
      const d = await res.json();
      setReponse(d.content?.[0]?.text?.trim() || "Je n'ai pas pu répondre à ça.");
    } catch {
      setReponse("Une erreur s'est produite. Réessaie.");
    }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-end" }}
      onClick={onClose}
    >
      {/* Fond sombre */}
      <div style={{ position: "absolute", inset: 0, background: "#0D0A12cc", backdropFilter: "blur(4px)" }} />

      {/* Panel */}
      <div onClick={e => e.stopPropagation()} style={{
        position: "relative", width: "100%", maxWidth: 560, margin: "0 auto",
        background: T.nuit2, borderRadius: "16px 16px 0 0",
        border: `1px solid ${T.brume}15`, borderBottom: "none",
        padding: "1.5rem 1.5rem calc(1.5rem + env(safe-area-inset-bottom))",
        maxHeight: "82vh", overflowY: "auto",
        animation: "fadeUp 0.3s ease forwards",
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 3, background: `${T.brume}33`, borderRadius: 2, margin: "0 auto 1.5rem" }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div style={{ fontFamily: T.serif, fontWeight: 300, fontSize: "1rem", color: T.orPale }}>Aide</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: `${T.brume}55`, cursor: "pointer", fontSize: "1.1rem" }}>×</button>
        </div>

        {/* Question libre */}
        <div style={{ marginBottom: "1.8rem" }}>
          <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.42rem", letterSpacing: "0.4em", textTransform: "uppercase", color: `${T.brume}55`, marginBottom: "0.8rem" }}>
            Pose ta question
          </div>
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === "Enter" && poser()}
              placeholder="Comment fonctionne le Miroir ?"
              style={{ flex: 1, background: `${T.nuit}`, border: `1px solid ${T.brume}18`, borderRadius: "6px", padding: "0.65rem 0.9rem", color: T.aube, fontFamily: T.serif, fontStyle: "italic", fontSize: "0.88rem", outline: "none" }}
            />
            <button onClick={poser} disabled={!question.trim() || loading} style={{ background: `${T.or}22`, border: `1px solid ${T.or}44`, borderRadius: "6px", padding: "0 0.9rem", color: T.or, cursor: "pointer", fontSize: "0.8rem", flexShrink: 0 }}>
              {loading ? "…" : "→"}
            </button>
          </div>

          {reponse && (
            <div style={{ marginTop: "1rem", background: `${T.or}08`, border: `1px solid ${T.or}18`, borderRadius: "6px", padding: "1rem 1.1rem" }}>
              <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.88rem", color: T.orPale, lineHeight: 1.8, margin: 0 }}>
                {reponse}
              </p>
            </div>
          )}
        </div>

        {/* FAQ */}
        <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.42rem", letterSpacing: "0.4em", textTransform: "uppercase", color: `${T.brume}55`, marginBottom: "0.8rem" }}>
          Questions fréquentes
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
          {AIDE_FAQ.map((item, i) => (
            <div key={i}>
              <button onClick={() => {
                if (item.r === null) { onTuto(); return; }
                setFaqOpen(faqOpen === i ? null : i);
              }} style={{
                width: "100%", background: faqOpen === i ? `${T.or}0A` : "transparent",
                border: `1px solid ${T.brume}12`,
                borderRadius: faqOpen === i ? "6px 6px 0 0" : "6px",
                padding: "0.8rem 1rem", cursor: "pointer",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                textAlign: "left",
              }}>
                <span style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.85rem", color: `${T.brume}CC` }}>{item.q}</span>
                <span style={{ color: `${T.or}66`, fontSize: "0.65rem", flexShrink: 0, marginLeft: "0.5rem" }}>
                  {item.r === null ? "▶" : faqOpen === i ? "▲" : "▼"}
                </span>
              </button>
              {faqOpen === i && item.r && (
                <div style={{ background: `${T.or}06`, border: `1px solid ${T.brume}12`, borderTop: "none", borderRadius: "0 0 6px 6px", padding: "0.8rem 1rem" }}>
                  <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.82rem", color: `${T.brume}99`, lineHeight: 1.8, margin: 0 }}>{item.r}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


// ─── CGU & MENTIONS LÉGALES ───────────────────────────────────────────────────

const CGUScreen = ({ onRetour }) => {
  const [section, setSection] = useState("cgu"); // cgu | mentions | confidentialite

  const SECTIONS = [
    { id: "cgu",              label: "CGU" },
    { id: "confidentialite",  label: "Données" },
    { id: "mentions",         label: "Mentions" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: T.nuit, zIndex: 200, overflowY: "auto" }}>

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, background: `${T.nuit}ee`,
        backdropFilter: "blur(12px)", borderBottom: `1px solid ${T.brume}15`,
        padding: "0.9rem 1.2rem", display: "flex", alignItems: "center", gap: "1rem", zIndex: 10,
      }}>
        <button onClick={onRetour} style={{ background: "none", border: "none", color: `${T.brume}66`, cursor: "pointer", padding: 0 }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={`${T.brume}88`} strokeWidth="1.3" strokeLinecap="round">
            <path d="M19 12H5M10 6l-6 6 6 6"/>
          </svg>
        </button>
        <div style={{ fontFamily: T.serif, fontWeight: 300, fontSize: "0.95rem", letterSpacing: "0.1em", color: T.orPale }}>
          Mentions & CGU
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: "flex", gap: "1px", padding: "1rem 1.2rem 0", borderBottom: `1px solid ${T.brume}10`, marginBottom: "0" }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: T.sans, fontWeight: 300, fontSize: "0.48rem",
            letterSpacing: "0.35em", textTransform: "uppercase",
            color: section === s.id ? T.or : `${T.brume}55`,
            padding: "0 1rem 0.8rem",
            borderBottom: `2px solid ${section === s.id ? T.or : "transparent"}`,
            transition: "all 0.2s",
          }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div style={{ padding: "2rem 1.5rem 6rem", maxWidth: 560, margin: "0 auto" }}>

        {section === "cgu" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <CGUBloc titre="Objet" texte={`ALBA est une application de bien-être intérieur proposée par Jabrilia Éditions. Elle offre un espace privé d'introspection, de présence quotidienne et d'accompagnement personnel.\n\nL'utilisation d'ALBA est soumise aux présentes Conditions Générales d'Utilisation. En accédant à l'application, l'utilisateur reconnaît les avoir lues et acceptées.`} />
            <CGUBloc titre="Accès et compte" texte={`L'accès à ALBA nécessite la création d'un compte via une adresse email. L'utilisateur est responsable de la confidentialité de ses identifiants.\n\nUn accès gratuit est disponible avec des fonctionnalités limitées. L'accès complet est disponible via abonnement mensuel (9€/mois) ou annuel (79€/an), résiliable à tout moment.`} />
            <CGUBloc titre="Utilisation" texte={`ALBA est un outil de bien-être personnel. Il ne constitue pas un dispositif médical, thérapeutique ou psychiatrique.\n\nL'utilisateur s'engage à utiliser l'application de manière personnelle et non commerciale. Toute tentative de copie, extraction ou détournement du contenu est interdite.`} />
            <CGUBloc titre="Résiliation et remboursement" texte={`L'abonnement peut être résilié à tout moment depuis les paramètres de l'application ou en contactant l'équipe.\n\nConformément à la législation européenne, un droit de rétractation de 14 jours s'applique à compter de la souscription, sauf si l'accès aux contenus a déjà été utilisé. Aucun remboursement n'est accordé au-delà de ce délai.`} />
            <CGUBloc titre="Responsabilité" texte={`Jabrilia Éditions s'efforce d'assurer la continuité du service mais ne peut garantir une disponibilité permanente. ALBA n'est pas responsable des décisions prises par l'utilisateur à la suite de l'utilisation de l'application.\n\nEn cas de détresse psychologique sévère, l'utilisateur est invité à consulter un professionnel de santé qualifié.`} />
            <CGUBloc titre="Propriété intellectuelle" texte={`L'ensemble des contenus de l'application — textes, gravures, prompts, design, parcours — est la propriété exclusive de Jabrilia Éditions et protégé par le droit d'auteur.\n\nLes sagesses citées appartiennent au patrimoine culturel mondial et sont présentées à des fins éducatives et non commerciales.`} />
            <CGUBloc titre="Droit applicable" texte={`Les présentes CGU sont soumises au droit français. Tout litige sera soumis aux tribunaux compétents de Paris.\n\nDernière mise à jour : mars 2026.`} />
          </div>
        )}

        {section === "confidentialite" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <CGUBloc titre="Données collectées" texte={`ALBA collecte uniquement les données nécessaires au fonctionnement de l'application :\n\n— Adresse email (authentification)\n— Données de profil renseignées lors de l'onboarding (prénom, date de naissance, intention)\n— Données d'usage anonymisées (progression, éclats, portes)\n\nLes notes de l'Ardoise sont stockées localement sur votre appareil et ne sont pas transmises à nos serveurs.`} />
            <CGUBloc titre="Utilisation des données" texte={`Vos données sont utilisées exclusivement pour :\n\n— Personnaliser votre expérience dans l'application\n— Générer vos lettres hebdomadaires et votre portrait d'âme\n— Assurer la continuité de votre progression\n\nVos données ne sont jamais vendues, louées ou partagées avec des tiers à des fins publicitaires.`} />
            <CGUBloc titre="Le Miroir et l'API Claude" texte={`Les sessions du Miroir sont traitées via l'API d'Anthropic (Claude). Les échanges sont transmis de façon sécurisée pour générer les réponses, puis ne sont pas conservés dans nos systèmes.\n\nAnthropic applique sa propre politique de confidentialité pour le traitement des données transitant par son API. Aucune session n'est stockée côté ALBA.`} />
            <CGUBloc titre="Le Ciel partagé" texte={`Les offrandes déposées dans Le Ciel sont stockées dans notre base de données et visibles par tous les utilisateurs de l'application. Elles sont anonymes — aucun nom ou identifiant n'est associé.\n\nLa géolocalisation (ville uniquement) est optionnelle et ne peut être activée qu'avec votre accord explicite.`} />
            <CGUBloc titre="Vos droits" texte={`Conformément au RGPD, vous disposez des droits suivants :\n\n— Droit d'accès à vos données\n— Droit de rectification\n— Droit à l'effacement (bouton "Recommencer depuis le début" dans le Profil)\n— Droit à la portabilité\n— Droit d'opposition\n\nPour exercer ces droits : contact@jabrilia.com`} />
            <CGUBloc titre="Cookies" texte={`ALBA n'utilise pas de cookies publicitaires. Les données de session sont stockées localement via localStorage pour maintenir votre connexion et votre progression.\n\nAucun tracker tiers n'est présent dans l'application.`} />
          </div>
        )}

        {section === "mentions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <CGUBloc titre="Éditeur" texte={`Jabrilia Éditions\nMaison d'édition indépendante\n\nDirecteur de publication : Steve Moradel\nEmail : contact@jabrilia.com`} />
            <CGUBloc titre="Hébergement" texte={`Application hébergée par :\nVercel Inc.\n440 N Barranca Ave #4133\nCovina, CA 91723, États-Unis\nhttps://vercel.com\n\nBase de données :\nSupabase Inc.\nhttps://supabase.com`} />
            <CGUBloc titre="Intelligence artificielle" texte={`Les fonctionnalités d'ALBA utilisant l'intelligence artificielle (Miroir, Lettres, Transformations poétiques) sont alimentées par l'API Claude d'Anthropic.\n\nAnthropic, PBC\nSan Francisco, Californie, États-Unis\nhttps://anthropic.com`} />
            <CGUBloc titre="Paiement" texte={`Les paiements sont traités par :\nStripe, Inc.\n354 Oyster Point Blvd\nSouth San Francisco, CA 94080, États-Unis\nhttps://stripe.com\n\nJabrilia Éditions ne stocke aucune donnée bancaire.`} />
            <CGUBloc titre="Propriété intellectuelle" texte={`© 2025–2026 Jabrilia Éditions. Tous droits réservés.\n\nLe contenu éditorial, les gravures SVG, les textes des Sagesses, les Parcours thématiques et l'ensemble du design de l'application sont la propriété exclusive de Jabrilia Éditions.\n\nToute reproduction, même partielle, est interdite sans autorisation écrite.`} />
            <CGUBloc titre="Contact" texte={`Pour toute question :\ncontact@jabrilia.com\n\nPour les offres entreprises :\nentreprises@jabrilia.com`} />
          </div>
        )}
      </div>
    </div>
  );
};

const CGUBloc = ({ titre, texte }) => (
  <div>
    <div style={{
      fontFamily: T.sans, fontWeight: 300, fontSize: "0.45rem",
      letterSpacing: "0.4em", textTransform: "uppercase",
      color: `${T.or}77`, marginBottom: "0.7rem",
    }}>
      {titre}
    </div>
    <p style={{
      fontFamily: T.serif, fontStyle: "italic",
      fontSize: "0.85rem", color: `${T.brume}AA`,
      lineHeight: 1.9, margin: 0, whiteSpace: "pre-line",
    }}>
      {texte}
    </p>
  </div>
);


// ─── PAGE B2B ENTREPRISES ─────────────────────────────────────────────────────

const PricingB2B = ({ onRetour }) => {
  const [quantite, setQuantite] = useState(50);
  const [contact, setContact] = useState({ nom: "", entreprise: "", email: "", message: "" });
  const [envoye, setEnvoye] = useState(false);
  const [loading, setLoading] = useState(false);

  const prixUnitaire = quantite >= 200 ? 5.5 : quantite >= 100 ? 6.5 : quantite >= 50 ? 7.5 : 9;
  const total = (quantite * prixUnitaire).toFixed(0);

  const PALIERS = [
    { min: 10,  max: 49,  prix: "9€",   label: "Découverte" },
    { min: 50,  max: 99,  prix: "7,50€", label: "Équipe" },
    { min: 100, max: 199, prix: "6,50€", label: "Structure" },
    { min: 200, max: null, prix: "5,50€", label: "Entreprise" },
  ];

  const envoyer = async () => {
    if (!contact.email || !contact.entreprise) return;
    setLoading(true);
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          max_tokens: 10,
          system: "Réponds juste: ok",
          messages: [{ role: "user", content: `Contact B2B: ${JSON.stringify({ ...contact, quantite, total })}` }],
        }),
      });
    } catch {}
    setEnvoye(true);
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: T.nuit, overflowY: "auto", zIndex: 100 }}>
      <style>{`
        @keyframes b2bFade { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .b2b-1 { animation: b2bFade 0.6s ease forwards; }
        .b2b-2 { animation: b2bFade 0.6s ease 0.15s forwards; opacity:0; }
        .b2b-3 { animation: b2bFade 0.6s ease 0.3s forwards; opacity:0; }
        .b2b-4 { animation: b2bFade 0.6s ease 0.45s forwards; opacity:0; }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 1.5rem 6rem" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.2rem 0", borderBottom: `1px solid ${T.brume}15` }}>
          <button onClick={onRetour} style={{ background: "none", border: "none", color: `${T.brume}66`, fontFamily: T.sans, fontSize: "0.55rem", letterSpacing: "0.3em", cursor: "pointer", textTransform: "uppercase" }}>← Retour</button>
          <div style={{ fontFamily: T.serif, fontWeight: 300, fontSize: "1.2rem", letterSpacing: "0.25em", color: T.or }}>ALBA</div>
          <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.5rem", letterSpacing: "0.3em", color: `${T.brume}44`, textTransform: "uppercase" }}>Entreprises</div>
        </div>

        {/* Accroche */}
        <div className="b2b-1" style={{ textAlign: "center", padding: "3rem 0 2rem" }}>
          <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.48rem", letterSpacing: "0.5em", textTransform: "uppercase", color: `${T.or}66`, marginBottom: "1.2rem" }}>Pour les équipes</div>
          <h1 style={{ fontFamily: T.serif, fontWeight: 300, fontStyle: "italic", fontSize: "clamp(1.5rem, 6vw, 2rem)", color: T.orPale, lineHeight: 1.6, margin: "0 0 1.2rem" }}>
            Offrir un espace intérieur<br/>à vos collaborateurs.
          </h1>
          <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.88rem", color: `${T.brume}99`, lineHeight: 1.9, margin: 0 }}>
            Prévention burn-out, qualité de vie au travail, présence. ALBA accompagne chaque personne dans sa propre durée — sans collecte de données, sans algorithme.
          </p>
        </div>

        {/* Pourquoi ALBA en entreprise */}
        <div className="b2b-2" style={{ display: "flex", flexDirection: "column", gap: "1px", marginBottom: "3rem" }}>
          {[
            { titre: "Anonyme et confidentiel", desc: "Aucune donnée transmise à l'employeur. Chaque collaborateur a son espace privé.", sym: "○" },
            { titre: "Sans obligation, sans suivi", desc: "Un outil qu'on utilise parce qu'on en a besoin, pas parce qu'on nous l'impose.", sym: "◇" },
            { titre: "Un investissement durable", desc: "Pas une formation one-shot. Un espace auquel on revient dans les moments difficiles.", sym: "✦" },
          ].map((p, i) => (
            <div key={i} style={{ background: `${T.nuit2}88`, border: `1px solid ${T.brume}12`, borderRadius: i === 0 ? "8px 8px 0 0" : i === 2 ? "0 0 8px 8px" : 0, padding: "1.2rem 1.4rem", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <div style={{ color: `${T.or}66`, fontSize: "0.9rem", flexShrink: 0, width: 20, textAlign: "center", marginTop: "0.1rem" }}>{p.sym}</div>
              <div>
                <div style={{ fontFamily: T.serif, fontSize: "0.95rem", color: T.orPale, marginBottom: "0.3rem" }}>{p.titre}</div>
                <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.82rem", color: `${T.brume}88`, lineHeight: 1.7 }}>{p.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tarifs par palier */}
        <div className="b2b-3">
          <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.48rem", letterSpacing: "0.5em", textTransform: "uppercase", color: `${T.brume}55`, marginBottom: "1.2rem", textAlign: "center" }}>Tarifs dégressifs — par an par personne</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", marginBottom: "2.5rem" }}>
            {PALIERS.map((p, i) => (
              <div key={i} style={{
                background: quantite >= p.min && (p.max === null || quantite <= p.max) ? `${T.or}18` : `${T.nuit2}88`,
                border: `1px solid ${quantite >= p.min && (p.max === null || quantite <= p.max) ? T.or + "44" : T.brume + "12"}`,
                borderRadius: i === 0 ? "8px 0 0 0" : i === 1 ? "0 8px 0 0" : i === 2 ? "0 0 0 8px" : "0 0 8px 0",
                padding: "1rem", textAlign: "center",
              }}>
                <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.42rem", letterSpacing: "0.3em", textTransform: "uppercase", color: `${T.brume}55`, marginBottom: "0.4rem" }}>{p.label}</div>
                <div style={{ fontFamily: T.serif, fontSize: "1.3rem", color: quantite >= p.min && (p.max === null || quantite <= p.max) ? T.or : `${T.brume}66`, marginBottom: "0.3rem" }}>{p.prix}</div>
                <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.42rem", letterSpacing: "0.2em", color: `${T.brume}44` }}>
                  {p.max ? `${p.min}–${p.max} accès` : `${p.min}+ accès`}
                </div>
              </div>
            ))}
          </div>

          {/* Simulateur */}
          <div style={{ background: `linear-gradient(135deg, ${T.or}0D, ${T.nuit2}AA)`, border: `1px solid ${T.or}22`, borderRadius: "10px", padding: "1.6rem", marginBottom: "3rem" }}>
            <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.48rem", letterSpacing: "0.4em", textTransform: "uppercase", color: `${T.or}77`, marginBottom: "1.2rem", textAlign: "center" }}>Simulateur</div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
              <label style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.85rem", color: `${T.brume}99`, flexShrink: 0 }}>Nombre d'accès</label>
              <input
                type="number" min={10} max={500} value={quantite}
                onChange={e => setQuantite(Math.max(10, parseInt(e.target.value) || 10))}
                style={{ flex: 1, background: `${T.nuit}`, border: `1px solid ${T.brume}22`, borderRadius: "4px", padding: "0.5rem 0.8rem", color: T.orPale, fontFamily: T.serif, fontSize: "1rem", textAlign: "center", outline: "none" }}
              />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: T.serif, fontSize: "2rem", color: T.orPale, marginBottom: "0.2rem" }}>{total}€</div>
              <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.48rem", letterSpacing: "0.2em", color: `${T.brume}55` }}>
                {prixUnitaire}€ / personne / an · {quantite} accès
              </div>
            </div>
          </div>

          {/* Cartes ALBA */}
          <div style={{ marginBottom: "3rem" }}>
            <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.48rem", letterSpacing: "0.5em", textTransform: "uppercase", color: `${T.brume}44`, marginBottom: "1.2rem", textAlign: "center" }}>Les Cartes ALBA</div>
            <div style={{ background: `${T.nuit2}88`, border: `1px solid ${T.brume}15`, borderRadius: "10px", padding: "1.4rem", display: "flex", gap: "1.2rem", alignItems: "center" }}>
              {/* Aperçu carte */}
              <div style={{
                width: 80, height: 50, flexShrink: 0, borderRadius: "6px",
                background: `linear-gradient(135deg, #1A1510, #2A2018)`,
                border: `1px solid ${T.or}33`,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: "2px",
              }}>
                <div style={{ fontFamily: T.serif, fontSize: "0.55rem", letterSpacing: "0.2em", color: T.or }}>ALBA</div>
                <div style={{ fontFamily: T.sans, fontSize: "0.25rem", letterSpacing: "0.15em", color: `${T.brume}55` }}>✦ ✦ ✦ ✦</div>
                <div style={{ fontFamily: "monospace", fontSize: "0.3rem", color: `${T.brume}44`, letterSpacing: "0.1em" }}>ALBA-XXXX-XXXX</div>
              </div>
              <div>
                <div style={{ fontFamily: T.serif, fontSize: "0.9rem", color: T.orPale, marginBottom: "0.4rem" }}>Code d'accès physique</div>
                <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.78rem", color: `${T.brume}77`, lineHeight: 1.7 }}>
                  Chaque accès peut être livré sous forme de carte imprimable — à glisser dans une enveloppe, un kit d'accueil, ou un cadeau d'équipe.
                </div>
              </div>
            </div>
          </div>

          {/* Formulaire contact */}
          <div style={{ border: `1px solid ${T.or}22`, borderRadius: "10px", padding: "1.6rem", marginBottom: "2rem" }}>
            <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.48rem", letterSpacing: "0.5em", textTransform: "uppercase", color: `${T.or}66`, marginBottom: "1.4rem", textAlign: "center" }}>
              Demander un devis
            </div>

            {envoye ? (
              <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                <div style={{ fontSize: "1.2rem", color: T.or, marginBottom: "1rem" }}>✦</div>
                <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.95rem", color: T.orPale, lineHeight: 1.8 }}>
                  Votre demande a été reçue.<br/>Nous vous répondons sous 24h.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                {[
                  { key: "nom",        placeholder: "Votre nom",          type: "text" },
                  { key: "entreprise", placeholder: "Entreprise / organisation", type: "text" },
                  { key: "email",      placeholder: "Email professionnel", type: "email" },
                ].map(f => (
                  <input key={f.key} type={f.type} placeholder={f.placeholder}
                    value={contact[f.key]}
                    onChange={e => setContact(c => ({ ...c, [f.key]: e.target.value }))}
                    style={{ background: `${T.nuit}`, border: `1px solid ${T.brume}18`, borderRadius: "4px", padding: "0.75rem 1rem", color: T.aube, fontFamily: T.serif, fontStyle: "italic", fontSize: "0.88rem", outline: "none", width: "100%", boxSizing: "border-box" }}
                  />
                ))}
                <textarea placeholder="Votre besoin — nombre de collaborateurs, contexte…"
                  value={contact.message}
                  onChange={e => setContact(c => ({ ...c, message: e.target.value }))}
                  rows={3}
                  style={{ background: `${T.nuit}`, border: `1px solid ${T.brume}18`, borderRadius: "4px", padding: "0.75rem 1rem", color: T.aube, fontFamily: T.serif, fontStyle: "italic", fontSize: "0.88rem", outline: "none", resize: "none", width: "100%", boxSizing: "border-box" }}
                />
                <button onClick={envoyer} disabled={loading || !contact.email || !contact.entreprise}
                  style={{ padding: "0.9rem", background: contact.email && contact.entreprise ? `${T.or}22` : "transparent", border: `1px solid ${contact.email && contact.entreprise ? T.or + "55" : T.brume + "18"}`, borderRadius: "6px", color: contact.email && contact.entreprise ? T.or : `${T.brume}44`, fontFamily: T.sans, fontWeight: 300, fontSize: "0.55rem", letterSpacing: "0.4em", textTransform: "uppercase", cursor: contact.email && contact.entreprise ? "pointer" : "default", transition: "all 0.3s" }}>
                  {loading ? "Envoi…" : "Envoyer la demande"}
                </button>
              </div>
            )}
          </div>

          <div style={{ textAlign: "center", fontFamily: T.sans, fontWeight: 300, fontSize: "0.42rem", letterSpacing: "0.15em", color: `${T.brume}33`, lineHeight: 1.8 }}>
            Sans publicité · Sans données transmises à l'employeur · Résiliable
          </div>
        </div>
      </div>
    </div>
  );
};


// ─── PAGE PRICING ────────────────────────────────────────────────────────────

const PricingPage = ({ onCommencer, onRetour, onConnexion, onB2B }) => {
  const [plan, setPlan] = useState("annual");
  const [section, setSection] = useState(0); // pour scroll reveal

  const FONCTIONNALITES_FREE = [
    "Le Miroir — conversations illimitées",
    "L'Ardoise — notes quotidiennes",
    "La Question du jour",
    "Le Rituel du matin",
    "Le Souffle guidé",
    "2 sagesses du monde",
    "Le Ciel — offrandes partagées",
  ];

  const FONCTIONNALITES_PREMIUM = [
    "Tout ce qui est gratuit",
    "Les 22 Sagesses du monde, progressives",
    "La Lettre de la semaine — écrite pour toi",
    "Les Parcours thématiques (7 à 10 jours)",
    "Les Latâ'if soufis — centres subtils",
    "Les 28 Thèmes intérieurs avec pratiques",
    "Ma Clé — les 12 Portes intérieures",
    "L'Évasion — cinéma contemplatif",
    "Les Trouvailles — bibliothèque vivante",
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, background: T.nuit,
      overflowY: "auto", zIndex: 100,
    }}>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pricing-appear { animation: fadeSlideUp 0.7s ease forwards; }
        .pricing-appear-2 { animation: fadeSlideUp 0.7s ease 0.15s forwards; opacity: 0; }
        .pricing-appear-3 { animation: fadeSlideUp 0.7s ease 0.3s forwards; opacity: 0; }
        .pricing-appear-4 { animation: fadeSlideUp 0.7s ease 0.45s forwards; opacity: 0; }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 1.5rem 6rem" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.2rem 0", borderBottom: `1px solid ${T.brume}15` }}>
          <button onClick={onRetour} style={{ background: "none", border: "none", color: `${T.brume}66`, fontFamily: T.sans, fontSize: "0.55rem", letterSpacing: "0.3em", cursor: "pointer", textTransform: "uppercase" }}>
            ← Retour
          </button>
          <div style={{ fontFamily: T.serif, fontWeight: 300, fontSize: "1.2rem", letterSpacing: "0.25em", color: T.or }}>ALBA</div>
          <button onClick={onConnexion} style={{ background: "none", border: "none", color: `${T.brume}66`, fontFamily: T.sans, fontSize: "0.55rem", letterSpacing: "0.3em", cursor: "pointer", textTransform: "uppercase" }}>
            Connexion
          </button>
        </div>

        {/* Accroche */}
        <div className="pricing-appear" style={{ textAlign: "center", padding: "3rem 0 2rem" }}>
          <div style={{ fontSize: "1.2rem", color: T.or, marginBottom: "1.5rem", display: "inline-block" }}>✦</div>
          <h1 style={{ fontFamily: T.serif, fontWeight: 300, fontStyle: "italic", fontSize: "clamp(1.6rem, 6vw, 2.2rem)", color: T.orPale, lineHeight: 1.5, margin: "0 0 1rem" }}>
            Un espace intérieur.<br/>Pas une application.
          </h1>
          <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.95rem", color: `${T.brume}BB`, lineHeight: 1.9, margin: 0 }}>
            ALBA t'accompagne dans la durée — le matin, le soir, quand quelque chose traverse. Un miroir. Des mots calibrés. Un espace qui te connaît.
          </p>
        </div>

        {/* Ce qu'est ALBA — 3 piliers */}
        <div className="pricing-appear-2" style={{ display: "flex", flexDirection: "column", gap: "1px", marginBottom: "3rem" }}>
          {[
            { titre: "Un miroir", desc: "Pas un thérapeute. Pas un coach. Une présence qui réfléchit ce que tu ne vois pas seul.", symbol: "○" },
            { titre: "Une pratique", desc: "Chaque jour, quelque chose à poser, à traverser, à respirer. Rien de spectaculaire. Juste du réel.", symbol: "◇" },
            { titre: "Un ciel commun", desc: "Chaque offrande déposée devient une étoile. Le ciel appartient à tous ceux qui ont traversé.", symbol: "✦" },
          ].map((p, i) => (
            <div key={i} style={{ background: `${T.nuit2}88`, border: `1px solid ${T.brume}12`, borderRadius: i === 0 ? "8px 8px 0 0" : i === 2 ? "0 0 8px 8px" : 0, padding: "1.2rem 1.4rem", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <div style={{ color: `${T.or}77`, fontSize: "1rem", marginTop: "0.1rem", flexShrink: 0, width: 20, textAlign: "center" }}>{p.symbol}</div>
              <div>
                <div style={{ fontFamily: T.serif, fontSize: "0.95rem", color: T.orPale, marginBottom: "0.3rem" }}>{p.titre}</div>
                <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.82rem", color: `${T.brume}99`, lineHeight: 1.7 }}>{p.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Séparateur */}
        <div style={{ width: "100%", height: 1, background: `linear-gradient(to right, transparent, ${T.or}33, transparent)`, marginBottom: "3rem" }} />

        {/* Toggle plan */}
        <div className="pricing-appear-3">
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.55rem", letterSpacing: "0.5em", textTransform: "uppercase", color: `${T.brume}66`, marginBottom: "1.2rem" }}>Choisir un accès</div>
            <div style={{ display: "inline-flex", background: `${T.nuit2}`, border: `1px solid ${T.brume}20`, borderRadius: "30px", padding: "3px" }}>
              {[
                { id: "monthly", label: "Mensuel", price: "9€/mois" },
                { id: "annual",  label: "Annuel",  price: "79€/an" },
              ].map(p => (
                <button key={p.id} onClick={() => setPlan(p.id)} style={{
                  background: plan === p.id ? `${T.or}22` : "transparent",
                  border: plan === p.id ? `1px solid ${T.or}44` : "1px solid transparent",
                  borderRadius: "24px", padding: "0.5rem 1.4rem",
                  fontFamily: T.sans, fontWeight: 300, fontSize: "0.55rem",
                  letterSpacing: "0.2em", textTransform: "uppercase",
                  color: plan === p.id ? T.or : `${T.brume}66`, cursor: "pointer",
                  transition: "all 0.3s",
                }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prix mis en avant */}
          <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontFamily: T.serif, fontSize: "clamp(2.5rem, 10vw, 3.5rem)", color: T.orPale, fontWeight: 300 }}>
              {plan === "annual" ? "79€" : "9€"}
            </span>
            <span style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.65rem", letterSpacing: "0.2em", color: `${T.brume}77`, marginLeft: "0.5rem" }}>
              {plan === "annual" ? "/ an" : "/ mois"}
            </span>
          </div>
          {plan === "annual" && (
            <div style={{ textAlign: "center", fontFamily: T.serif, fontStyle: "italic", fontSize: "0.78rem", color: `${T.or}88`, marginBottom: "2rem" }}>
              Soit 6,60€/mois · 2 mois offerts
            </div>
          )}

          {/* CTA principal */}
          <button onClick={onCommencer} style={{
            width: "100%", padding: "1rem",
            background: `linear-gradient(135deg, ${T.or}33, ${T.or}18)`,
            border: `1px solid ${T.or}66`, borderRadius: "6px",
            color: T.orPale, fontFamily: T.serif, fontStyle: "italic",
            fontSize: "1.05rem", letterSpacing: "0.04em", cursor: "pointer",
            transition: "all 0.3s", marginBottom: "0.8rem",
          }}
            onMouseOver={e => e.currentTarget.style.background = `linear-gradient(135deg, ${T.or}44, ${T.or}28)`}
            onMouseOut={e => e.currentTarget.style.background = `linear-gradient(135deg, ${T.or}33, ${T.or}18)`}
          >
            Commencer — {plan === "annual" ? "79€ / an" : "9€ / mois"}
          </button>
          <p style={{ textAlign: "center", fontFamily: T.sans, fontWeight: 300, fontSize: "0.48rem", letterSpacing: "0.2em", color: `${T.brume}44`, marginBottom: "2.5rem" }}>
            Résiliable à tout moment · Paiement sécurisé
          </p>

          {/* Accès gratuit */}
          <div style={{ background: `${T.nuit2}66`, border: `1px solid ${T.brume}15`, borderRadius: "6px", padding: "1.2rem 1.4rem", marginBottom: "3rem" }}>
            <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.48rem", letterSpacing: "0.4em", textTransform: "uppercase", color: `${T.brume}55`, marginBottom: "0.8rem" }}>Accès gratuit inclus</div>
            {FONCTIONNALITES_FREE.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: "0.7rem", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                <span style={{ color: `${T.brume}55`, fontSize: "0.7rem", marginTop: "0.05rem", flexShrink: 0 }}>·</span>
                <span style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.82rem", color: `${T.brume}88`, lineHeight: 1.6 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ce que débloque l'abonnement */}
        <div className="pricing-appear-4">
          <div style={{ background: `linear-gradient(135deg, ${T.or}0D, ${T.nuit2}AA)`, border: `1px solid ${T.or}25`, borderRadius: "8px", padding: "1.6rem 1.4rem", marginBottom: "3rem" }}>
            <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.48rem", letterSpacing: "0.4em", textTransform: "uppercase", color: `${T.or}77`, marginBottom: "1rem" }}>
              ✦ Accès complet
            </div>
            {FONCTIONNALITES_PREMIUM.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: "0.7rem", alignItems: "flex-start", marginBottom: "0.6rem" }}>
                <span style={{ color: `${T.or}88`, fontSize: "0.65rem", marginTop: "0.1rem", flexShrink: 0 }}>✓</span>
                <span style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.85rem", color: `${T.brume}CC`, lineHeight: 1.6 }}>{f}</span>
              </div>
            ))}
          </div>

          {/* Cadeau */}
          <div style={{ textAlign: "center", padding: "1.5rem", background: `${T.nuit2}55`, border: `1px solid ${T.brume}10`, borderRadius: "8px", marginBottom: "3rem" }}>
            <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.48rem", letterSpacing: "0.4em", textTransform: "uppercase", color: `${T.brume}44`, marginBottom: "0.8rem" }}>Offrir ALBA</div>
            <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.88rem", color: `${T.brume}77`, lineHeight: 1.8, marginBottom: "1rem" }}>
              Un mois (9€) ou un an (79€).<br/>Pour quelqu'un qui traverse quelque chose.
            </div>
            <button onClick={onCommencer} style={{ background: "none", border: `1px solid ${T.brume}25`, borderRadius: "20px", padding: "0.6rem 1.5rem", fontFamily: T.sans, fontWeight: 300, fontSize: "0.48rem", letterSpacing: "0.3em", textTransform: "uppercase", color: `${T.brume}66`, cursor: "pointer" }}>
              Offrir un accès
            </button>
          </div>

          {/* Footer discret */}
          <div style={{ textAlign: "center", borderTop: `1px solid ${T.brume}10`, paddingTop: "1.5rem" }}>
            <button onClick={onConnexion} style={{ background: "none", border: "none", fontFamily: T.sans, fontWeight: 300, fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: `${T.brume}44`, cursor: "pointer", marginBottom: "1rem", display: "block", width: "100%", textAlign: "center" }}>
              J'ai déjà un compte
            </button>
            {/* Lien B2B */}
            <button onClick={onB2B} style={{ background: "none", border: `1px solid ${T.brume}15`, borderRadius: "6px", padding: "0.9rem", width: "100%", fontFamily: T.serif, fontStyle: "italic", fontSize: "0.85rem", color: `${T.brume}66`, cursor: "pointer", marginBottom: "1.2rem", textAlign: "center", transition: "all 0.3s" }}
              onMouseOver={e => { e.currentTarget.style.borderColor = `${T.or}33`; e.currentTarget.style.color = `${T.brume}BB`; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = `${T.brume}15`; e.currentTarget.style.color = `${T.brume}66`; }}
            >
              Vous êtes une entreprise ? <span style={{ color: `${T.or}88` }}>Voir les offres équipe →</span>
            </button>
            <div style={{ fontFamily: T.sans, fontWeight: 300, fontSize: "0.42rem", letterSpacing: "0.15em", color: `${T.brume}33`, lineHeight: 1.8 }}>
              Sans publicité · Sans données vendues · Sans algorithme
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};


// ─── APP ──────────────────────────────────────────────────────────────────────
function AlbaInner() {
  const [view, setView] = useState("splash");
  const [showPricing, setShowPricing] = useState(false);
  const [showB2B, setShowB2B] = useState(false);
  const [showCGU, setShowCGU] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showTuto, setShowTuto] = useState(false);
  const [showAide, setShowAide] = useState(false);
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
          const _uk = localStorage.getItem("alba_user_key") || existingUser.id || "local";
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

      {/* ── CGU ── */}
      {showCGU && <CGUScreen onRetour={() => setShowCGU(false)} />}

      {/* ── TUTO ── */}
      {showTuto && <TutoStories onClose={() => setShowTuto(false)} />}

      {/* ── AIDE ALBA ── */}
      {showAide && <AideAlba onClose={() => setShowAide(false)} onTuto={() => { setShowAide(false); setShowTuto(true); }} tab={tab} />}

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

      {view === "welcome" && !showPricing && (
        <WelcomeSilencieux
          onCommencer={() => setShowPricing(true)}
          onConnexion={() => setView("auth")}
        />
      )}
      {view === "welcome" && showPricing && !showB2B && (
        <PricingPage
          onCommencer={() => setView("auth")}
          onRetour={() => setShowPricing(false)}
          onConnexion={() => setView("auth")}
          onB2B={() => setShowB2B(true)}
        />
      )}
      {view === "welcome" && showB2B && (
        <PricingB2B
          onRetour={() => setShowB2B(false)}
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
      {view === "portrait" && <Portrait data={userData} onContinue={() => { setView("app"); setTimeout(() => setShowTuto(true), 800); }} />}

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

            {/* Droite : onglet courant + aide */}
            <div style={{ minWidth: 60, textAlign: "right", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.8rem" }}>
              <span style={{
                fontFamily: T.sans, fontWeight: 300, fontSize: "0.65rem",
                letterSpacing: "0.35em", textTransform: "uppercase", color: T.brume,
              }}>
                {TABS.find(t => t.id === tab)?.label}
              </span>
              <button onClick={() => setShowAide(true)} style={{
                background: "none", border: `1px solid ${T.brume}25`, borderRadius: "50%",
                width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: `${T.brume}77`, fontFamily: T.sans,
                fontSize: "0.55rem", fontStyle: "italic", transition: "all 0.2s", padding: 0,
                flexShrink: 0,
              }}
                onMouseOver={e => { e.currentTarget.style.borderColor = `${T.or}55`; e.currentTarget.style.color = T.or; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = `${T.brume}25`; e.currentTarget.style.color = `${T.brume}77`; }}
              >?</button>
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
              {tab === "compagnon" && <Accueil data={userData} onNavigate={goTab} cleActive={cleActive} progressStats={{...progressStats, allPostits: allPostitsApp}} onInvitationComplete={(niveau) => incrementStat(niveau === 5 ? "invitations5" : niveau === 3 ? "invitations3" : "invitations1")} onInvitationEchec={() => incrementStat("invitationsEchec")} isPremium={isPremium} onShowPaywall={() => setShowPaywall(true)} />}
              {tab === "presence"  && <div style={{padding:"0 1.5rem"}}><Presence data={userData} onStart={() => incrementStat("conversationsTotal")} onSessionComplete={() => incrementStat("conversationsTotal")} onSaveToArdoise={(txt) => {
                  try {
                    const todayKey = new Date().toISOString().split("T")[0];
                    const saved = JSON.parse(localStorage.getItem("alba_postits") || "{}");
                    const nouveau = { id: Date.now(), texte: txt, type: "miroir", heure: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) };
                    saved[todayKey] = [nouveau, ...(saved[todayKey] || [])];
                    localStorage.setItem("alba_postits", JSON.stringify(saved));
                    incrementStat("postitsTotal");
                    goTab("ardoise");
                  } catch {}
                }} isPremium={isPremium} onShowPaywall={() => setShowPaywall(true)} /></div>}
              {tab === "ardoise"   && <Ardoise data={userData} db={db} onPostitAjoute={() => incrementStat("postitsTotal")} onBilanGenere={() => incrementStat("bilansTotal")} onPostitsChange={setAllPostitsApp} isPremium={isPremium} onShowPaywall={() => setShowPaywall(true)} />}
              {tab === "evasion"   && <Evasion data={userData} isPremium={isPremium} onShowPaywall={() => setShowPaywall(true)} />}

              {tab === "sagesses"  && <BibliothequeSagesses cleActive={cleActive} />}
              {tab === "cle"       && <TerritoireCle cleActive={cleActive} progressStats={progressStats} allPostits={allPostitsApp} isPremium={isPremium} onShowPaywall={() => setShowPaywall(true)} />}
              {tab === "ciel"      && <CielCairn userId={authUser?.id} db={db} />}
              {tab === "trouvailles" && <SalleDesTrouvailles data={userData} />}
              {tab === "lumiere"   && <LumiereDuJour />}
              {tab === "souffle"   && <div style={{padding:"0 1.5rem"}}><Souffle onComplete={() => incrementStat("souffleTotal")} /></div>}
              {tab === "profil"    && <Profil data={userData} progressStats={progressStats} onUpdateData={(d) => { setUserData(d); if (db) db.saveProfile(d); }} onSignOut={handleSignOut} isPremium={isPremium} onShowPaywall={() => setShowPaywall(true)} authUserKey={localStorage.getItem("alba_user_key") || authUser?.id} cleActive={cleActive} onShowCGU={() => setShowCGU(true)} />}
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
