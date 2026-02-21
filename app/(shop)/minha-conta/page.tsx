"use client";

import "@/styles/minha-conta.css";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useToast } from "@/lib/toast-context";

const UF_OPTIONS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export default function MinhaContaPage() {
  const { user, token, logout, updateUser } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();

  const [tab, setTab] = useState("dados");

  /* Profile form */
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [birth, setBirth] = useState("");
  const [gender, setGender] = useState("");
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  /* Security forms */
  const [newEmail, setNewEmail] = useState("");
  const [emailPass, setEmailPass] = useState("");
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmNewPass, setConfirmNewPass] = useState("");

  /* Orders */
  const [purchases, setPurchases] = useState<{ date: string; items: string; total: string }[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* Redirect if not logged in */
  useEffect(() => {
    if (!user && typeof window !== "undefined") {
      const timer = setTimeout(() => {
        if (!localStorage.getItem("sg_token")) router.replace("/login");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, router]);

  /* Load profile */
  useEffect(() => {
    if (!user) return;
    setName(user.name || "");
    try {
      const p = JSON.parse(localStorage.getItem("sg_profile") || "{}");
      setNickname(p.nickname || "");
      setCpf(p.cpf || "");
      setPhone(p.phone || "");
      setBirth(p.birth || "");
      setGender(p.gender || "");
      setCep(p.cep || "");
      setStreet(p.street || "");
      setStreetNumber(p.street_number || "");
      setComplement(p.complement || "");
      setNeighborhood(p.neighborhood || "");
      setCity(p.city || "");
      setState(p.state || "");
    } catch { /* empty */ }

    // Load purchase history
    try {
      const hist = JSON.parse(localStorage.getItem("sg_purchases") || "[]");
      setPurchases(hist);
    } catch { /* empty */ }
  }, [user]);

  const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` });

  /* ── Profile save ── */
  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!name || name.length < 3) { setError("Nome deve ter pelo menos 3 caracteres"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/profile", { method: "PUT", headers: headers(), body: JSON.stringify({ name, nickname, cpf, phone, birth, gender, cep, street, street_number: streetNumber, complement, neighborhood, city, state }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erro ao salvar"); setLoading(false); return; }
      updateUser({ ...user!, name });
      // Update profile in localStorage
      const prev = JSON.parse(localStorage.getItem("sg_profile") || "{}");
      localStorage.setItem("sg_profile", JSON.stringify({ ...prev, nickname, cpf, phone, birth, gender, cep, street, street_number: streetNumber, complement, neighborhood, city, state }));
      setSuccess("Dados atualizados com sucesso!");
      showToast("Dados salvos!", "success");
    } catch { setError("Erro de conexão"); }
    setLoading(false);
  };

  /* ── Change email ── */
  const changeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!newEmail || !emailPass) { setError("Preencha todos os campos"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/profile/email", { method: "PUT", headers: headers(), body: JSON.stringify({ new_email: newEmail, password: emailPass }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erro ao alterar e-mail"); setLoading(false); return; }
      updateUser({ ...user!, email: newEmail });
      setSuccess("E-mail alterado com sucesso!");
      showToast("E-mail atualizado!", "success");
      setNewEmail(""); setEmailPass("");
    } catch { setError("Erro de conexão"); }
    setLoading(false);
  };

  /* ── Change password ── */
  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!currentPass || !newPass || !confirmNewPass) { setError("Preencha todos os campos"); return; }
    if (newPass.length < 6) { setError("Nova senha deve ter pelo menos 6 caracteres"); return; }
    if (newPass !== confirmNewPass) { setError("As senhas não coincidem"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/profile/password", { method: "PUT", headers: headers(), body: JSON.stringify({ current_password: currentPass, new_password: newPass }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erro ao alterar senha"); setLoading(false); return; }
      setSuccess("Senha alterada com sucesso!");
      showToast("Senha atualizada!", "success");
      setCurrentPass(""); setNewPass(""); setConfirmNewPass("");
    } catch { setError("Erro de conexão"); }
    setLoading(false);
  };

  /* ── Delete account ── */
  const deleteAccount = async () => {
    if (!confirm("Tem certeza que deseja excluir sua conta? Esta ação é IRREVERSÍVEL.")) return;
    if (!confirm("ÚLTIMA CHANCE: Todos os seus dados serão apagados permanentemente. Deseja continuar?")) return;
    try {
      const res = await fetch("/api/profile/delete", { method: "DELETE", headers: headers() });
      if (!res.ok) { showToast("Erro ao excluir conta", "error"); return; }
      logout();
      showToast("Conta excluída com sucesso.", "success");
      router.push("/");
    } catch { showToast("Erro de conexão", "error"); }
  };

  /* ── Logout ── */
  const handleLogout = () => {
    logout();
    showToast("Você saiu da sua conta.", "success");
    router.push("/");
  };

  if (!user) return null;

  const firstName = user.name?.split(" ")[0] || "Conta";

  return (
    <>
      <nav className="breadcrumb" aria-label="Navegação">
        <div className="container">
          <ol className="breadcrumb__list">
            <li><Link href="/">Início</Link></li>
            <li aria-current="page">Minha Conta</li>
          </ol>
        </div>
      </nav>

      <section className="account">
        <div className="container account__layout">
          {/* Sidebar */}
          <aside className="account__sidebar">
            <div className="account__profile-card">
              <div className="account__avatar-wrap">
                <div className="account__avatar-placeholder">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
              </div>
              <h2 className="account__username">{user.name || "—"}</h2>
              <p className="account__email">{user.email || "—"}</p>
            </div>

            <nav className="account__nav" aria-label="Menu da conta">
              {[
                { key: "dados", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, label: "Dados pessoais" },
                { key: "seguranca", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, label: "Segurança" },
                { key: "pedidos", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>, label: "Meus pedidos" },
                { key: "preferencias", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/></svg>, label: "Preferências" },
              ].map(t => (
                <button key={t.key} className={`account__nav-item${tab === t.key ? " is-active" : ""}`} type="button" onClick={() => { setTab(t.key); setError(""); setSuccess(""); }}>
                  {t.icon} {t.label}
                </button>
              ))}
              <hr className="account__nav-divider" />
              <button className="account__nav-item account__nav-item--danger" type="button" onClick={handleLogout}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sair da conta
              </button>
            </nav>
          </aside>

          {/* Content */}
          <div className="account__content">
            {/* Dados Pessoais */}
            {tab === "dados" && (
              <div className="account__panel is-active">
                <div className="account__panel-head">
                  <h2>Dados pessoais</h2>
                  <p>Gerencie suas informações pessoais. Estas informações são privadas e não serão exibidas para outros usuários.</p>
                </div>
                <form className="account__form" onSubmit={saveProfile} noValidate>
                  <div className="account__form-row">
                    <div className="account__field"><label>Nome completo</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome completo" required minLength={3} /></div>
                    <div className="account__field"><label>Apelido</label><input type="text" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Como quer ser chamado" /></div>
                  </div>
                  <div className="account__form-row">
                    <div className="account__field"><label>CPF</label><input type="text" value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" maxLength={14} /></div>
                    <div className="account__field"><label>Telefone</label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" maxLength={15} /></div>
                  </div>
                  <div className="account__form-row">
                    <div className="account__field"><label>Data de nascimento</label><input type="date" value={birth} onChange={e => setBirth(e.target.value)} /></div>
                    <div className="account__field"><label>Gênero</label>
                      <select value={gender} onChange={e => setGender(e.target.value)}>
                        <option value="">Prefiro não informar</option>
                        <option value="masculino">Masculino</option>
                        <option value="feminino">Feminino</option>
                        <option value="nao-binario">Não-binário</option>
                        <option value="prefiro-nao-dizer">Prefiro não dizer</option>
                      </select>
                    </div>
                  </div>
                  <div className="account__divider" />
                  <h3 className="account__section-title">Endereço</h3>
                  <div className="account__form-row">
                    <div className="account__field account__field--sm"><label>CEP</label><input type="text" value={cep} onChange={e => setCep(e.target.value)} placeholder="00000-000" maxLength={9} /></div>
                    <div className="account__field"><label>Rua / Avenida</label><input type="text" value={street} onChange={e => setStreet(e.target.value)} placeholder="Rua das Flores" /></div>
                  </div>
                  <div className="account__form-row">
                    <div className="account__field account__field--xs"><label>Número</label><input type="text" value={streetNumber} onChange={e => setStreetNumber(e.target.value)} placeholder="123" /></div>
                    <div className="account__field"><label>Complemento</label><input type="text" value={complement} onChange={e => setComplement(e.target.value)} placeholder="Apto 4B" /></div>
                    <div className="account__field"><label>Bairro</label><input type="text" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="Centro" /></div>
                  </div>
                  <div className="account__form-row">
                    <div className="account__field"><label>Cidade</label><input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="Ribeirão Preto" /></div>
                    <div className="account__field account__field--sm"><label>Estado</label>
                      <select value={state} onChange={e => setState(e.target.value)}>
                        <option value="">UF</option>
                        {UF_OPTIONS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                      </select>
                    </div>
                  </div>
                  {error && <div className="account__error" role="alert">{error}</div>}
                  {success && <div className="account__success" role="status">{success}</div>}
                  <div className="account__form-actions">
                    <button className="btn btn--solid" type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar alterações"}</button>
                  </div>
                </form>
              </div>
            )}

            {/* Segurança */}
            {tab === "seguranca" && (
              <div className="account__panel is-active">
                <div className="account__panel-head">
                  <h2>Segurança</h2>
                  <p>Atualize seu e-mail e senha. Mantenha suas credenciais seguras.</p>
                </div>
                <div className="account__card">
                  <h3 className="account__card-title">Alterar e-mail</h3>
                  <form className="account__form" onSubmit={changeEmail} noValidate>
                    <div className="account__field"><label>E-mail atual</label><input type="email" value={user.email} disabled /></div>
                    <div className="account__field"><label>Novo e-mail</label><input type="email" placeholder="novoemail@exemplo.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} required /></div>
                    <div className="account__field"><label>Senha atual (confirmação)</label><input type="password" placeholder="Sua senha atual" value={emailPass} onChange={e => setEmailPass(e.target.value)} required /></div>
                    {error && tab === "seguranca" && <div className="account__error" role="alert">{error}</div>}
                    {success && tab === "seguranca" && <div className="account__success" role="status">{success}</div>}
                    <button className="btn btn--solid" type="submit" disabled={loading}>Alterar e-mail</button>
                  </form>
                </div>
                <div className="account__card">
                  <h3 className="account__card-title">Alterar senha</h3>
                  <form className="account__form" onSubmit={changePassword} noValidate>
                    <div className="account__field"><label>Senha atual</label><input type="password" placeholder="Sua senha atual" value={currentPass} onChange={e => setCurrentPass(e.target.value)} required /></div>
                    <div className="account__field"><label>Nova senha</label><input type="password" placeholder="Mínimo 6 caracteres" value={newPass} onChange={e => setNewPass(e.target.value)} required minLength={6} /></div>
                    <div className="account__field"><label>Confirmar nova senha</label><input type="password" placeholder="Repita a nova senha" value={confirmNewPass} onChange={e => setConfirmNewPass(e.target.value)} required minLength={6} /></div>
                    <button className="btn btn--solid" type="submit" disabled={loading}>Alterar senha</button>
                  </form>
                </div>
              </div>
            )}

            {/* Pedidos */}
            {tab === "pedidos" && (
              <div className="account__panel is-active">
                <div className="account__panel-head">
                  <h2>Meus pedidos</h2>
                  <p>Acompanhe seus pedidos e compras anteriores.</p>
                </div>
                <div className="account__card">
                  {purchases.length === 0 ? (
                    <div className="account__orders-empty">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                      <h3>Nenhum pedido ainda</h3>
                      <p>Quando você finalizar uma compra, seus pedidos aparecerão aqui.</p>
                      <Link className="btn btn--solid" href="/vitrine">Explorar produtos</Link>
                    </div>
                  ) : (
                    <div className="account__orders-list">
                      {purchases.map((p, i) => (
                        <div key={i} className="account__order-item">
                          <div className="account__order-date">{p.date}</div>
                          <div className="account__order-items">{p.items}</div>
                          <div className="account__order-total">{p.total}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Preferências */}
            {tab === "preferencias" && (
              <div className="account__panel is-active">
                <div className="account__panel-head">
                  <h2>Preferências</h2>
                  <p>Personalize sua experiência na Santos Store.</p>
                </div>
                <div className="account__card">
                  <h3 className="account__card-title">Tema da loja</h3>
                  <div className="account__pref-row">
                    <div className="account__pref-info">
                      <strong>Modo escuro</strong>
                      <span>Alterne entre o tema claro e escuro. Sua preferência é salva automaticamente.</span>
                    </div>
                    <label className="switch">
                      <input type="checkbox" checked={theme === "dark"} onChange={toggleTheme} />
                      <span className="switch__slider" />
                    </label>
                  </div>
                </div>

                <div className="account__card">
                  <h3 className="account__card-title">Dados locais</h3>
                  <p className="account__pref-desc">Limpe os dados salvos localmente no seu navegador.</p>
                  <div className="account__pref-actions">
                    <button className="btn btn--outline" type="button" onClick={() => { localStorage.removeItem("sg_cart"); showToast("Carrinho limpo!", "success"); }}>Limpar carrinho salvo</button>
                    <button className="btn btn--outline account__btn--danger" type="button" onClick={() => { localStorage.removeItem("sg_cart"); localStorage.removeItem("sg_purchases"); showToast("Dados locais limpos!", "success"); }}>Limpar todos os dados locais</button>
                  </div>
                </div>

                <div className="account__card account__card--danger">
                  <h3 className="account__card-title">Excluir conta</h3>
                  <p className="account__pref-desc">Esta ação é irreversível. Todos os seus dados serão apagados permanentemente.</p>
                  <button className="btn btn--solid account__btn--danger" type="button" onClick={deleteAccount}>Excluir minha conta</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
