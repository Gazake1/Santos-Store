"use client";

import "@/styles/servicos.css";
import { useState, useMemo } from "react";
import { useToast } from "@/lib/toast-context";

const WA_NUMBER = "5516992070533";

const TIERS = [
  { key: "basica", icon: "🌀", name: "Básica", items: ["Limpeza externa com compressor", "Remoção de poeira geral", "Verificação visual"] },
  { key: "intermediaria", icon: "✨", name: "Intermediária", badge: "Popular", items: ["Tudo da Básica", "Desmontagem parcial", "Troca de pasta térmica", "Limpeza dos coolers"] },
  { key: "avancada", icon: "🔥", name: "Avançada", items: ["Tudo da Intermediária", "Desmontagem completa", "Organização de cabos", "Limpeza individual de cada peça", "Lubrificação de fans"] },
];

const EXTRAS = [
  "Troca de pasta térmica premium (Thermal Grizzly / Arctic MX)",
  "Troca de cooler (preciso comprar peça)",
  "Organização completa de cabos",
  "Lubrificação de fans",
  "Troca de pad térmico (notebook)",
  "Teste de temperaturas (antes/depois)",
];

export default function LimpezaPage() {
  const { showToast } = useToast();

  const [device, setDevice] = useState("PC Desktop");
  const [tier, setTier] = useState("");
  const [extras, setExtras] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [model, setModel] = useState("");

  const toggleExtra = (v: string) => setExtras(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);

  const summary = useMemo(() => {
    const items: string[] = [];
    items.push(`Dispositivo: ${device}`);
    if (tier) items.push(`Limpeza: ${tier}`);
    extras.forEach(e => items.push(`Extra: ${e}`));
    if (name) items.push(`Nome: ${name}`);
    if (model) items.push(`Modelo: ${model}`);
    return items;
  }, [device, tier, extras, name, model]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tier) { showToast("Selecione o tipo de limpeza", "error"); return; }
    if (!name.trim()) { showToast("Informe seu nome", "error"); return; }

    const lines = [
      "🧹 *Limpeza — Santos Store*",
      "",
      `📱 *Dispositivo:* ${device}`,
      `🧹 *Tipo:* ${tier}`,
    ];
    if (extras.length) { lines.push(""); lines.push("*Extras:*"); extras.forEach(e => lines.push(`  ✅ ${e}`)); }
    lines.push("", `👤 *Nome:* ${name.trim()}`);
    if (model.trim()) lines.push(`📝 *Modelo:* ${model.trim()}`);

    const msg = encodeURIComponent(lines.join("\n"));
    window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, "_blank");
    showToast("Redirecionando para o WhatsApp...", "success");
  };

  return (
    <>
      <section className="svc-hero">
        <div className="container">
          <span className="svc-hero__icon">🧹</span>
          <h1 className="svc-hero__title">Limpeza profissional</h1>
          <p className="svc-hero__desc">Escolha o tipo de limpeza, adicione serviços extras e envie seu orçamento direto para o WhatsApp.</p>
        </div>
      </section>

      <section className="svc-form-section">
        <div className="container">
          <form className="svc-form" onSubmit={handleSubmit} noValidate>
            {/* Device */}
            <div className="svc-form__title">📱 Tipo de dispositivo</div>
            <p className="svc-form__subtitle">Selecione se é um PC ou notebook.</p>

            <div className="svc-device">
              {[{ value: "PC Desktop", icon: "🖥️" }, { value: "Notebook", icon: "💻" }].map(d => (
                <label className={`svc-device__option${device === d.value ? " is-selected" : ""}`} key={d.value}>
                  <input type="radio" name="device" value={d.value} checked={device === d.value} onChange={() => setDevice(d.value)} />
                  <span className="svc-device__icon">{d.icon}</span>
                  {d.value}
                </label>
              ))}
            </div>

            <hr className="svc-divider" />

            {/* Tiers */}
            <div className="svc-form__title">🧹 Escolha o tipo de limpeza</div>
            <p className="svc-form__subtitle">Cada nível inclui tudo do anterior + recursos extras.</p>

            <div className="svc-tiers">
              {TIERS.map(t => (
                <label className={`svc-tier${tier === t.name ? " is-selected" : ""}`} key={t.key} data-tier={t.key}>
                  {t.badge && <span className="svc-tier__badge">{t.badge}</span>}
                  <input className="svc-tier__radio" type="radio" name="tier" value={t.name} checked={tier === t.name} onChange={() => setTier(t.name)} />
                  <span className="svc-tier__icon">{t.icon}</span>
                  <div className="svc-tier__name">{t.name}</div>
                  <div className="svc-tier__price">Consultar <small>preço</small></div>
                  <ul className="svc-tier__list">{t.items.map(i => <li key={i}>{i}</li>)}</ul>
                </label>
              ))}
            </div>

            <hr className="svc-divider" />

            {/* Extras */}
            <div className="svc-extras">
              <div className="svc-extras__title">Serviços extras (opcional)</div>
              <div className="svc-extras__grid">
                {EXTRAS.map(ex => (
                  <label className="svc-check" key={ex}>
                    <input type="checkbox" checked={extras.includes(ex)} onChange={() => toggleExtra(ex)} /> {ex}
                  </label>
                ))}
              </div>
            </div>

            <hr className="svc-divider" />

            {/* Name */}
            <div className="svc-form__title">👤 Seus dados</div>
            <p className="svc-form__subtitle">Precisamos do seu nome para enviarmos o orçamento.</p>

            <div className="svc-grid">
              <label className="field"><span className="field__label">Seu nome</span><input type="text" placeholder="Ex.: João" value={name} onChange={e => setName(e.target.value)} required /></label>
              <label className="field"><span className="field__label">Modelo do equipamento (opcional)</span><input type="text" placeholder="Ex.: Dell G15, Gabinete NZXT H510..." value={model} onChange={e => setModel(e.target.value)} /></label>
            </div>

            {summary.length > 0 && (
              <div className="svc-summary">
                <div className="svc-summary__title">📋 Resumo do pedido</div>
                <ul className="svc-summary__list">{summary.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
            )}

            <div className="svc-info">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              <span>Ao enviar, você será redirecionado para o <strong>WhatsApp</strong> com todas as informações preenchidas. Sem compromisso!</span>
            </div>

            <button className="btn btn--solid btn--full btn--lg" type="submit">
              Enviar orçamento via WhatsApp
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
