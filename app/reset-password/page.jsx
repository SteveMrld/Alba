"use client";
import { useState, useEffect } from "react";

const SUPABASE_URL = "https://yuwqokjkpooozgtsvfkc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1d3Fva2prcG9vb3pndHN2ZmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5Njk4MjIsImV4cCI6MjA4ODU0NTgyMn0.5IHYvE6lnwl-PTAhcpT9c2lkhlxSu6w9rGksfCEfCPc";

const T = {
  nuit: "#131110", or: "#C8A96E", orPale: "#E8D5B0",
  brume: "#B0A59A", aube: "#F5EFE6",
  serif: "'Cormorant Garamond', Georgia, serif",
  sans: "'Jost', sans-serif",
};

export default function ResetPassword() {
  const [token, setToken]       = useState(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState(null);
  const [done, setDone]         = useState(false);
  const [showPwd, setShowPwd]   = useState(false);

  useEffect(() => {
    // Supabase envoie le token dans le hash : #access_token=xxx&type=recovery
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace("#", ""));
    const t = params.get("access_token");
    const type = params.get("type");
    if (t && type === "recovery") setToken(t);
    else setErr("Lien invalide ou expiré. Demande un nouveau lien depuis ALBA.");
  }, []);

  const handleReset = async () => {
    setErr(null);
    if (password.length < 6) { setErr("Le mot de passe doit faire au moins 6 caractères."); return; }
    if (password !== confirm) { setErr("Les mots de passe ne correspondent pas."); return; }
    setLoading(true);
    try {
      const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: "PUT",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });
      if (r.ok) setDone(true);
      else {
        const d = await r.json();
        setErr(d.msg || d.error_description || "Une erreur est survenue.");
      }
    } catch { setErr("Une erreur est survenue."); }
    setLoading(false);
  };

  const inputStyle = {
    background: "#1E1A16", border: `1px solid ${T.brume}33`,
    borderRadius: "6px", padding: "0.85rem 1.1rem",
    fontFamily: T.sans, fontSize: "0.95rem", color: T.aube,
    outline: "none", width: "100%", boxSizing: "border-box",
  };

  return (
    <div style={{
      minHeight: "100vh", background: T.nuit,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "2rem", fontFamily: T.serif,
    }}>
      {/* Halo */}
      <div style={{
        position: "fixed", top: "20%", left: "50%",
        transform: "translateX(-50%)",
        width: 300, height: 300,
        background: `radial-gradient(circle, ${T.or}18 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      <div style={{ width: "100%", maxWidth: 340, position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ fontFamily: T.serif, fontWeight: 300, fontSize: "2rem", letterSpacing: "0.3em", color: T.or }}>
            ALBA
          </div>
          <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.85rem", color: T.brume, marginTop: "0.3rem" }}>
            L'aube en toi
          </div>
        </div>

        {done ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "1rem", color: T.or }}>✦</div>
            <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "1rem", color: T.orPale, lineHeight: 1.8, marginBottom: "1.5rem" }}>
              Ton mot de passe a été mis à jour.
            </p>
            <button onClick={() => { window.location.href = "https://alba-gamma.vercel.app"; }} style={{
              display: "block", width: "100%", background: T.or, borderRadius: "6px",
              padding: "0.95rem", textAlign: "center", textDecoration: "none",
              fontFamily: T.sans, fontWeight: 200, fontSize: "0.6rem",
              letterSpacing: "0.4em", textTransform: "uppercase", color: T.nuit,
              border: "none", cursor: "pointer",
            }}>
              Retourner dans ALBA
            </button>
          </div>
        ) : err && !token ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.9rem", color: "#D4856A", lineHeight: 1.8 }}>
              {err}
            </p>
            <a href="https://alba-gamma.vercel.app" style={{
              display: "inline-block", marginTop: "1.5rem",
              fontFamily: T.serif, fontStyle: "italic",
              fontSize: "0.85rem", color: T.brume, textDecoration: "none",
            }}>
              ← Retourner dans ALBA
            </a>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.9rem", color: T.brume, textAlign: "center", lineHeight: 1.7, marginBottom: "0.5rem" }}>
              Choisis ton nouveau mot de passe.
            </div>

            <div style={{ position: "relative" }}>
              <input
                type={showPwd ? "text" : "password"}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Nouveau mot de passe"
                style={{ ...inputStyle, paddingRight: "3.5rem" }}
              />
              <button onClick={() => setShowPwd(v => !v)} style={{
                position: "absolute", right: "0.8rem", top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: T.brume, fontSize: "0.75rem",
              }}>{showPwd ? "Cacher" : "Voir"}</button>
            </div>

            <input
              type={showPwd ? "text" : "password"}
              value={confirm} onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleReset()}
              placeholder="Confirmer le mot de passe"
              style={inputStyle}
            />

            {err && (
              <div style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: "0.85rem", color: "#D4856A", textAlign: "center" }}>
                {err}
              </div>
            )}

            <button onClick={handleReset} disabled={loading || !token} style={{
              background: loading ? `${T.or}55` : T.or,
              border: "none", borderRadius: "6px", padding: "0.95rem",
              cursor: loading ? "default" : "pointer",
              fontFamily: T.sans, fontWeight: 200, fontSize: "0.6rem",
              letterSpacing: "0.4em", textTransform: "uppercase",
              color: T.nuit, marginTop: "0.2rem",
            }}>
              {loading ? "…" : "Valider le nouveau mot de passe"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
