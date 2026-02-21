"use client";

import "@/styles/servicos.css";
import { useState, useMemo } from "react";
import { useToast } from "@/lib/toast-context";

const WA_NUMBER = "5516992070533";

const UPGRADE_OPTIONS = [
  "Trocar / adicionar memória RAM",
  "Trocar HD por SSD",
  "Adicionar SSD / NVMe",
  "Troca de pasta térmica + limpeza",
  "Trocar / upgrade de placa de vídeo",
  "Trocar / upgrade de processador",
  "Trocar fonte de alimentação",
  "Trocar cooler / sistema de refrigeração",
  "Otimização de software e BIOS",
  "Formatação + instalação de drivers",
];

export default function UpgradePage() {
  const { showToast } = useToast();

  const [device, setDevice] = useState("PC Desktop");
  const [upgrades, setUpgrades] = useState<string[]>([]);
  const [model, setModel] = useState("");
  const [budget, setBudget] = useState("");
  const [desc, setDesc] = useState("");
  const [name, setName] = useState("");

  const toggleUpgrade = (v: string) => setUpgrades(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);

  const summary = useMemo(() => {
    const items: string[] = [];
    items.push(`Dispositivo: ${device}`);
    upgrades.forEach(u => items.push(`Upgrade: ${u}`));
    if (model) items.push(`Modelo: ${model}`);
    if (budget) items.push(`Orçamento: R$ ${budget}`);
    if (desc) items.push(`Descrição: ${desc}`);
    if (name) items.push(`Nome: ${name}`);
    return items;
  }, [device, upgrades, model, budget, desc, name]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (upgrades.length === 0) { showToast("Selecione pelo menos um upgrade", "error"); return; }
    if (!name.trim()) { showToast("Informe seu nome", "error"); return; }

    const lines = [
      "🚀 *Upgrade + Otimização — Santos Store*",
      "",
      `📱 *Dispositivo:* ${device}`,
    ];
    lines.push(""); lines.push("*Upgrades selecionados:*");
    upgrades.forEach(u => lines.push(`  ✅ ${u}`));
    if (model.trim()) lines.push(`\n📝 *Modelo:* ${model.trim()}`);
    if (budget) lines.push(`💰 *Orçamento:* R$ ${budget}`);
    if (desc.trim()) lines.push(`📝 *Descrição:* ${desc.trim()}`);
    lines.push("", `👤 *Nome:* ${name.trim()}`);

    const msg = encodeURIComponent(lines.join("\n"));
    window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, "_blank");
    showToast("Redirecionando para o WhatsApp...", "success");
  };

  return (
    <>
      <section className="svc-hero">
        <div className="container">
          <span className="svc-hero__icon">🚀</span>
          <h1 className="svc-hero__title">Upgrade + Otimização</h1>
          <p className="svc-hero__desc">Escolha o que quer melhorar no seu PC ou notebook e a gente cuida de tudo — peças e mão de obra.</p>
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

            {/* Upgrades */}
            <div className="svc-form__title">⚙️ O que deseja melhorar?</div>
            <p className="svc-form__subtitle">Marque tudo que quiser incluir no upgrade.</p>

            <div className="svc-extras">
              <div className="svc-extras__grid">
                {UPGRADE_OPTIONS.map(u => (
                  <label className="svc-check" key={u}>
                    <input type="checkbox" checked={upgrades.includes(u)} onChange={() => toggleUpgrade(u)} /> {u}
                  </label>
                ))}
              </div>
            </div>

            <hr className="svc-divider" />

            {/* Details */}
            <div className="svc-form__title">📝 Detalhes do equipamento</div>
            <p className="svc-form__subtitle">Quanto mais info, melhor o orçamento.</p>

            <div className="svc-grid">
              <label className="field"><span className="field__label">Modelo do equipamento</span><input type="text" placeholder="Ex.: i5-10400 / GTX 1650 / 8GB RAM" value={model} onChange={e => setModel(e.target.value)} /></label>
              <label className="field"><span className="field__label">Orçamento aproximado (R$)</span><input type="number" inputMode="numeric" min={100} step={50} placeholder="Ex.: 800" value={budget} onChange={e => setBudget(e.target.value)} /></label>
            </div>

            <div className="svc-grid svc-grid--1">
              <label className="field field--full">
                <span className="field__label">Descreva o problema ou objetivo (opcional)</span>
                <textarea rows={3} placeholder="Ex.: Quero mais FPS no Valorant, PC está esquentando muito, quero colocar 16GB de RAM..." value={desc} onChange={e => setDesc(e.target.value)} />
              </label>
            </div>

            <hr className="svc-divider" />

            {/* Name */}
            <div className="svc-form__title">👤 Seus dados</div>
            <p className="svc-form__subtitle">Precisamos do seu nome para enviarmos o orçamento.</p>

            <div className="svc-grid svc-grid--1">
              <label className="field"><span className="field__label">Seu nome</span><input type="text" placeholder="Ex.: João" value={name} onChange={e => setName(e.target.value)} required /></label>
            </div>

            {summary.length > 0 && (
              <div className="svc-summary">
                <div className="svc-summary__title">📋 Resumo do pedido</div>
                <ul className="svc-summary__list">{summary.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
            )}

            <div className="svc-info">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              <span>Ao enviar, você será redirecionado para o <strong>WhatsApp</strong> com todas as informações. Sem compromisso!</span>
            </div>

            <button className="btn btn--solid btn--full btn--lg" type="submit">
              Enviar pedido via WhatsApp
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
