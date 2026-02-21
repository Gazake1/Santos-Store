"use client";

import "@/styles/servicos.css";
import { useState, useMemo } from "react";
import { useToast } from "@/lib/toast-context";

const WA_NUMBER = "5516992070533";

const EXTRAS = [
  "Water Cooler (refrigeração líquida)",
  "Cabos customizados (sleeved)",
  "Wi-Fi integrado na placa-mãe",
  "Bluetooth integrado",
  "Gabinete com vidro temperado",
  "Fonte modular 80 Plus",
];

export default function MonteSeuPcPage() {
  const { showToast } = useToast();

  const [goal, setGoal] = useState("");
  const [budget, setBudget] = useState("");
  const [cpuPlatform, setCpuPlatform] = useState("");
  const [cpuTier, setCpuTier] = useState("");
  const [ram, setRam] = useState("");
  const [storage, setStorage] = useState("");
  const [gpu, setGpu] = useState("");
  const [pref, setPref] = useState("");
  const [extras, setExtras] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [obs, setObs] = useState("");

  const toggleExtra = (v: string) => setExtras(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);

  const summary = useMemo(() => {
    const items: string[] = [];
    if (goal) items.push(`Objetivo: ${goal}`);
    if (budget) items.push(`Orçamento: R$ ${budget}`);
    if (cpuPlatform) items.push(`Plataforma: ${cpuPlatform}`);
    if (cpuTier) items.push(`Nível CPU: ${cpuTier}`);
    if (ram) items.push(`RAM: ${ram}`);
    if (storage) items.push(`Armazenamento: ${storage}`);
    if (gpu) items.push(`GPU: ${gpu}`);
    if (pref) items.push(`Preferência: ${pref}`);
    extras.forEach(e => items.push(`Extra: ${e}`));
    if (name) items.push(`Nome: ${name}`);
    if (obs) items.push(`Obs: ${obs}`);
    return items;
  }, [goal, budget, cpuPlatform, cpuTier, ram, storage, gpu, pref, extras, name, obs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal) { showToast("Selecione o objetivo principal", "error"); return; }
    if (!budget) { showToast("Informe o orçamento aproximado", "error"); return; }
    if (!name.trim()) { showToast("Informe seu nome", "error"); return; }

    const lines = [
      "🖥️ *Monte seu PC — Santos Store*",
      "",
      `🎯 *Objetivo:* ${goal}`,
      `💰 *Orçamento:* R$ ${budget}`,
    ];
    if (cpuPlatform) lines.push(`🔧 *Plataforma CPU:* ${cpuPlatform}`);
    if (cpuTier) lines.push(`🔧 *Nível CPU:* ${cpuTier}`);
    if (ram) lines.push(`🔧 *RAM:* ${ram}`);
    if (storage) lines.push(`🔧 *Armazenamento:* ${storage}`);
    if (gpu) lines.push(`🔧 *GPU:* ${gpu}`);
    if (pref) lines.push(`🔧 *Preferência:* ${pref}`);
    if (extras.length) { lines.push(""); lines.push("*Extras:*"); extras.forEach(e => lines.push(`  ✅ ${e}`)); }
    lines.push("", `👤 *Nome:* ${name.trim()}`);
    if (obs.trim()) lines.push(`📝 *Obs:* ${obs.trim()}`);

    const msg = encodeURIComponent(lines.join("\n"));
    window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, "_blank");
    showToast("Redirecionando para o WhatsApp...", "success");
  };

  return (
    <>
      {/* Hero */}
      <section className="svc-hero">
        <div className="container">
          <span className="svc-hero__icon">🖥️</span>
          <h1 className="svc-hero__title">Monte seu PC sob medida</h1>
          <p className="svc-hero__desc">Preencha suas preferências de configuração e a gente monta a melhor máquina pro seu objetivo e orçamento.</p>
        </div>
      </section>

      {/* Form */}
      <section className="svc-form-section">
        <div className="container">
          <div className="svc-steps">
            <div className="svc-step is-active" data-step="1"><span className="svc-step__num">1</span><span>Objetivo</span></div>
            <div className="svc-steps__line" />
            <div className="svc-step" data-step="2"><span className="svc-step__num">2</span><span>Configurações</span></div>
            <div className="svc-steps__line" />
            <div className="svc-step" data-step="3"><span className="svc-step__num">3</span><span>Enviar</span></div>
          </div>

          <form className="svc-form" onSubmit={handleSubmit} noValidate>
            <div className="svc-form__title">🎯 Objetivo e orçamento</div>
            <p className="svc-form__subtitle">Nos conte como você pretende usar o PC.</p>

            <div className="svc-grid">
              <label className="field">
                <span className="field__label">Objetivo principal</span>
                <select value={goal} onChange={e => setGoal(e.target.value)} required>
                  <option value="" disabled>Escolha...</option>
                  <option>Competitivo (FPS alto)</option>
                  <option>Jogar + Stream</option>
                  <option>Criação de conteúdo (3D/edição)</option>
                  <option>Custo-benefício (jogos leves)</option>
                  <option>Trabalho + Jogos casuais</option>
                </select>
              </label>
              <label className="field">
                <span className="field__label">Orçamento aproximado (R$)</span>
                <input type="number" inputMode="numeric" min={1500} step={100} placeholder="Ex.: 4500" value={budget} onChange={e => setBudget(e.target.value)} required />
              </label>
            </div>

            <hr className="svc-divider" />
            <div className="svc-form__title">⚙️ Preferências de configuração</div>
            <p className="svc-form__subtitle">Marque o que achar importante — não precisa preencher tudo.</p>

            <div className="svc-grid">
              <label className="field"><span className="field__label">Plataforma do processador</span>
                <select value={cpuPlatform} onChange={e => setCpuPlatform(e.target.value)}>
                  <option value="" disabled>Escolha...</option>
                  <option>Intel</option><option>AMD</option><option>Sem preferência</option>
                </select>
              </label>
              <label className="field"><span className="field__label">Nível do processador</span>
                <select value={cpuTier} onChange={e => setCpuTier(e.target.value)}>
                  <option value="" disabled>Escolha...</option>
                  <option>Entrada (i3 / Ryzen 3)</option><option>Intermediário (i5 / Ryzen 5)</option>
                  <option>Avançado (i7 / Ryzen 7)</option><option>Extremo (i9 / Ryzen 9)</option><option>Sem preferência</option>
                </select>
              </label>
              <label className="field"><span className="field__label">Memória RAM</span>
                <select value={ram} onChange={e => setRam(e.target.value)}>
                  <option value="" disabled>Escolha...</option>
                  <option>8 GB</option><option>16 GB</option><option>32 GB</option><option>64 GB</option><option>Sem preferência</option>
                </select>
              </label>
              <label className="field"><span className="field__label">Armazenamento</span>
                <select value={storage} onChange={e => setStorage(e.target.value)}>
                  <option value="" disabled>Escolha...</option>
                  <option>SSD 240 GB</option><option>SSD 480 GB</option><option>SSD 1 TB</option>
                  <option>NVMe 500 GB</option><option>NVMe 1 TB</option><option>NVMe 2 TB</option><option>Sem preferência</option>
                </select>
              </label>
              <label className="field"><span className="field__label">Placa de vídeo (GPU)</span>
                <select value={gpu} onChange={e => setGpu(e.target.value)}>
                  <option value="" disabled>Escolha...</option>
                  <option>Integrada (sem GPU dedicada)</option>
                  <option>Entrada (GTX 1650 / RX 6500)</option>
                  <option>Intermediária (RTX 4060 / RX 7600)</option>
                  <option>Avançada (RTX 4070 / RX 7800)</option>
                  <option>Topo (RTX 4080/4090)</option>
                  <option>Sem preferência</option>
                </select>
              </label>
              <label className="field"><span className="field__label">Preferência geral</span>
                <select value={pref} onChange={e => setPref(e.target.value)}>
                  <option value="" disabled>Escolha...</option>
                  <option>Mais silencioso</option><option>Mais RGB / estética</option><option>Equilibrado</option>
                </select>
              </label>
            </div>

            <div className="svc-extras">
              <div className="svc-extras__title">Extras (opcional)</div>
              <div className="svc-extras__grid">
                {EXTRAS.map(ex => (
                  <label className="svc-check" key={ex}>
                    <input type="checkbox" checked={extras.includes(ex)} onChange={() => toggleExtra(ex)} /> {ex}
                  </label>
                ))}
              </div>
            </div>

            <hr className="svc-divider" />
            <div className="svc-form__title">👤 Seus dados</div>
            <p className="svc-form__subtitle">Precisamos do seu nome para o orçamento via WhatsApp.</p>

            <div className="svc-grid">
              <label className="field"><span className="field__label">Seu nome</span><input type="text" placeholder="Ex.: João" value={name} onChange={e => setName(e.target.value)} required /></label>
              <label className="field"><span className="field__label">Observações (opcional)</span><input type="text" placeholder="Ex.: Já tenho um gabinete NZXT" value={obs} onChange={e => setObs(e.target.value)} /></label>
            </div>

            {summary.length > 0 && (
              <div className="svc-summary">
                <div className="svc-summary__title">📋 Resumo do seu pedido</div>
                <ul className="svc-summary__list">{summary.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
            )}

            <div className="svc-info">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              <span>Ao enviar, você será redirecionado para o <strong>WhatsApp</strong> com todas as informações preenchidas. Sem compromisso!</span>
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
