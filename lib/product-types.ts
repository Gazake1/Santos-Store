/* ================================================
   Product Types & Spec Templates
   Based on Mercado Livre spec structure
   ================================================ */

export interface SpecField {
  label: string;
  type: "text" | "select";
  options?: string[];
  placeholder?: string;
}

export interface SpecGroup {
  title: string;
  fields: SpecField[];
}

export interface ProductTypeConfig {
  label: string;
  icon: string;
  groups: SpecGroup[];
}

/* Saved spec format (stored as JSON in DB) */
export interface SpecGroupData {
  group: string;
  specs: { label: string; value: string }[];
}

export const PRODUCT_TYPES: Record<string, ProductTypeConfig> = {
  mousepad: {
    label: "Mousepad",
    icon: "🖱️",
    groups: [
      {
        title: "Características principais",
        fields: [
          { label: "Marca", type: "text", placeholder: "Ex: Fallen, HyperX, Logitech" },
          { label: "Linha", type: "text", placeholder: "Ex: Ace, Fury" },
          { label: "Modelo", type: "text", placeholder: "Ex: SPEED++ GRANDE" },
          { label: "Cor", type: "text", placeholder: "Ex: Preto, Estampado" },
          { label: "Tamanho de mouse pad", type: "select", options: ["Pequeno", "Médio", "Grande", "Extra Grande"] },
          { label: "Desenho impresso", type: "text", placeholder: "Ex: Kawaii Ace" },
        ],
      },
      {
        title: "Dimensões",
        fields: [
          { label: "Comprimento x Largura", type: "text", placeholder: "Ex: 45 cm x 45 cm" },
          { label: "Espessura", type: "text", placeholder: "Ex: 5 mm" },
        ],
      },
      {
        title: "Outros",
        fields: [
          { label: "Modelo detalhado", type: "text", placeholder: "Ex: Ace Speed++ Grande" },
          { label: "Materiais", type: "text", placeholder: "Ex: Borracha, Tecido" },
          { label: "É antiderrapante", type: "select", options: ["Sim", "Não"] },
          { label: "Com apoio de pulso", type: "select", options: ["Sim", "Não"] },
          { label: "Com carga sem fio de dispositivos", type: "select", options: ["Sim", "Não"] },
          { label: "Com luz LED", type: "select", options: ["Sim", "Não"] },
          { label: "É gamer", type: "select", options: ["Sim", "Não"] },
        ],
      },
    ],
  },

  mouse: {
    label: "Mouse",
    icon: "🖱️",
    groups: [
      {
        title: "Características principais",
        fields: [
          { label: "Marca", type: "text", placeholder: "Ex: Logitech, Razer, Fallen" },
          { label: "Linha", type: "text", placeholder: "Ex: G Pro, DeathAdder" },
          { label: "Modelo", type: "text", placeholder: "Ex: G502 Hero" },
          { label: "Cor", type: "text", placeholder: "Ex: Preto" },
          { label: "Tipo de sensor", type: "select", options: ["Óptico", "Laser", "Infravermelho"] },
          { label: "Formato", type: "select", options: ["Ergonômico", "Ambidestro", "Simétrico"] },
        ],
      },
      {
        title: "Especificações técnicas",
        fields: [
          { label: "DPI máximo", type: "text", placeholder: "Ex: 25600 DPI" },
          { label: "Polling Rate", type: "text", placeholder: "Ex: 1000 Hz" },
          { label: "Número de botões", type: "text", placeholder: "Ex: 6" },
          { label: "Tipo de switch", type: "text", placeholder: "Ex: Omron, Optical" },
          { label: "Peso", type: "text", placeholder: "Ex: 85g" },
        ],
      },
      {
        title: "Conectividade",
        fields: [
          { label: "Tipo de conexão", type: "select", options: ["Com fio (USB)", "Sem fio (Wireless)", "Bluetooth", "Sem fio + Bluetooth", "Com fio + Sem fio"] },
          { label: "Comprimento do cabo", type: "text", placeholder: "Ex: 1.8m" },
          { label: "Tipo de cabo", type: "text", placeholder: "Ex: Paracord, Borracha, Trançado" },
        ],
      },
      {
        title: "Outros",
        fields: [
          { label: "Com luz LED/RGB", type: "select", options: ["Sim", "Não"] },
          { label: "Software dedicado", type: "select", options: ["Sim", "Não"] },
          { label: "É gamer", type: "select", options: ["Sim", "Não"] },
          { label: "Compatibilidade", type: "text", placeholder: "Ex: Windows, Mac, Linux" },
        ],
      },
    ],
  },

  teclado: {
    label: "Teclado",
    icon: "⌨️",
    groups: [
      {
        title: "Características principais",
        fields: [
          { label: "Marca", type: "text", placeholder: "Ex: HyperX, Redragon, Razer" },
          { label: "Linha", type: "text", placeholder: "Ex: Alloy Origins" },
          { label: "Modelo", type: "text", placeholder: "Ex: HX-KB6RDX-BR" },
          { label: "Cor", type: "text", placeholder: "Ex: Preto" },
          { label: "Layout", type: "select", options: ["ABNT2", "US Internacional", "US ANSI"] },
          { label: "Formato", type: "select", options: ["Full-size (100%)", "TKL (80%)", "75%", "65%", "60%"] },
        ],
      },
      {
        title: "Especificações técnicas",
        fields: [
          { label: "Tipo de switch", type: "text", placeholder: "Ex: Outemu Red, Cherry MX Blue" },
          { label: "Cor do switch", type: "select", options: ["Red (Linear)", "Blue (Clicky)", "Brown (Tátil)", "Black (Linear pesado)", "Outro"] },
          { label: "Material das keycaps", type: "select", options: ["ABS", "PBT", "Double-shot PBT"] },
          { label: "Anti-ghosting", type: "select", options: ["Sim", "Não"] },
          { label: "N-Key Rollover", type: "select", options: ["Sim", "Não"] },
          { label: "Hot-swappable", type: "select", options: ["Sim", "Não"] },
        ],
      },
      {
        title: "Conectividade",
        fields: [
          { label: "Tipo de conexão", type: "select", options: ["Com fio (USB)", "Sem fio (Wireless)", "Bluetooth", "Sem fio + Bluetooth", "Com fio + Sem fio"] },
          { label: "Tipo de conector", type: "select", options: ["USB-A", "USB-C", "USB-C destacável"] },
        ],
      },
      {
        title: "Outros",
        fields: [
          { label: "Com luz LED/RGB", type: "select", options: ["Sim", "Não"] },
          { label: "Com apoio de pulso", type: "select", options: ["Sim", "Não"] },
          { label: "Teclas multimídia", type: "select", options: ["Sim", "Não"] },
          { label: "É gamer", type: "select", options: ["Sim", "Não"] },
          { label: "É mecânico", type: "select", options: ["Sim", "Não"] },
        ],
      },
    ],
  },

  headset: {
    label: "Headset",
    icon: "🎧",
    groups: [
      {
        title: "Características principais",
        fields: [
          { label: "Marca", type: "text", placeholder: "Ex: HyperX, JBL, Razer" },
          { label: "Linha", type: "text", placeholder: "Ex: Cloud II" },
          { label: "Modelo", type: "text", placeholder: "Ex: KHX-HSCP-GM" },
          { label: "Cor", type: "text", placeholder: "Ex: Preto/Vermelho" },
          { label: "Tipo", type: "select", options: ["Over-ear (circumaural)", "On-ear (supra-aural)", "In-ear"] },
          { label: "Com microfone", type: "select", options: ["Sim", "Não"] },
        ],
      },
      {
        title: "Especificações técnicas",
        fields: [
          { label: "Driver", type: "text", placeholder: "Ex: 53mm" },
          { label: "Resposta de frequência", type: "text", placeholder: "Ex: 15Hz - 25kHz" },
          { label: "Impedância", type: "text", placeholder: "Ex: 60Ω" },
          { label: "Sensibilidade", type: "text", placeholder: "Ex: 98 dB" },
          { label: "Surround", type: "select", options: ["Estéreo", "7.1 Virtual", "7.1 Real"] },
          { label: "Cancelamento de ruído", type: "select", options: ["Sim (Ativo - ANC)", "Sim (Passivo)", "Não"] },
        ],
      },
      {
        title: "Conectividade",
        fields: [
          { label: "Tipo de conexão", type: "select", options: ["P2 (3.5mm)", "USB", "Sem fio (Wireless)", "Bluetooth", "USB + P2", "Sem fio + Bluetooth"] },
          { label: "Comprimento do cabo", type: "text", placeholder: "Ex: 1.3m + extensor 2m" },
        ],
      },
      {
        title: "Outros",
        fields: [
          { label: "Microfone removível", type: "select", options: ["Sim", "Não"] },
          { label: "Com luz LED/RGB", type: "select", options: ["Sim", "Não"] },
          { label: "Dobrável", type: "select", options: ["Sim", "Não"] },
          { label: "Peso", type: "text", placeholder: "Ex: 300g" },
          { label: "É gamer", type: "select", options: ["Sim", "Não"] },
        ],
      },
    ],
  },

  microfone: {
    label: "Microfone",
    icon: "🎙️",
    groups: [
      {
        title: "Características principais",
        fields: [
          { label: "Marca", type: "text", placeholder: "Ex: HyperX, Blue, Fifine" },
          { label: "Modelo", type: "text", placeholder: "Ex: QuadCast S" },
          { label: "Cor", type: "text", placeholder: "Ex: Preto" },
          { label: "Tipo de microfone", type: "select", options: ["Condensador", "Dinâmico", "Fita (Ribbon)"] },
          { label: "Padrão polar", type: "select", options: ["Cardióide", "Omnidirecional", "Bidirecional", "Estéreo", "Multipolar"] },
        ],
      },
      {
        title: "Especificações técnicas",
        fields: [
          { label: "Resposta de frequência", type: "text", placeholder: "Ex: 20Hz - 20kHz" },
          { label: "Sensibilidade", type: "text", placeholder: "Ex: -36 dB" },
          { label: "Taxa de amostragem", type: "text", placeholder: "Ex: 48kHz / 16-bit" },
          { label: "Relação sinal-ruído", type: "text", placeholder: "Ex: 78 dB" },
        ],
      },
      {
        title: "Conectividade",
        fields: [
          { label: "Tipo de conexão", type: "select", options: ["USB", "XLR", "P2 (3.5mm)", "USB + XLR", "Bluetooth"] },
          { label: "Comprimento do cabo", type: "text", placeholder: "Ex: 3m" },
        ],
      },
      {
        title: "Outros",
        fields: [
          { label: "Com filtro anti-pop", type: "select", options: ["Sim — Integrado", "Não"] },
          { label: "Com suporte/tripé", type: "select", options: ["Sim", "Não"] },
          { label: "Saída para fone", type: "select", options: ["Sim", "Não"] },
          { label: "Monitoramento em tempo real", type: "select", options: ["Sim", "Não"] },
          { label: "Com luz LED/RGB", type: "select", options: ["Sim", "Não"] },
          { label: "Botão de mute", type: "select", options: ["Sim — Toque", "Sim — Botão", "Não"] },
          { label: "Controle de ganho", type: "select", options: ["Sim", "Não"] },
        ],
      },
    ],
  },

  monitor: {
    label: "Monitor",
    icon: "🖥️",
    groups: [
      {
        title: "Características principais",
        fields: [
          { label: "Marca", type: "text", placeholder: "Ex: Samsung, LG, AOC" },
          { label: "Modelo", type: "text", placeholder: "Ex: Odyssey G5" },
          { label: "Cor", type: "text", placeholder: "Ex: Preto" },
          { label: "Tamanho da tela", type: "text", placeholder: "Ex: 27 polegadas" },
          { label: "Tipo de painel", type: "select", options: ["IPS", "VA", "TN", "OLED", "Mini-LED"] },
          { label: "Curvatura", type: "select", options: ["Plano", "1000R", "1500R", "1800R"] },
        ],
      },
      {
        title: "Especificações técnicas",
        fields: [
          { label: "Resolução", type: "select", options: ["Full HD (1920x1080)", "QHD (2560x1440)", "4K UHD (3840x2160)", "Ultrawide (2560x1080)", "Ultrawide QHD (3440x1440)"] },
          { label: "Taxa de atualização", type: "text", placeholder: "Ex: 165Hz" },
          { label: "Tempo de resposta", type: "text", placeholder: "Ex: 1ms (GtG)" },
          { label: "Brilho", type: "text", placeholder: "Ex: 350 nits" },
          { label: "Contraste", type: "text", placeholder: "Ex: 3000:1" },
          { label: "HDR", type: "select", options: ["Não", "HDR10", "DisplayHDR 400", "DisplayHDR 600", "DisplayHDR 1000"] },
          { label: "FreeSync / G-Sync", type: "select", options: ["FreeSync", "G-Sync", "FreeSync + G-Sync Compatible", "Nenhum"] },
        ],
      },
      {
        title: "Conexões",
        fields: [
          { label: "Entradas", type: "text", placeholder: "Ex: 2x HDMI, 1x DisplayPort" },
          { label: "Saída de áudio", type: "select", options: ["Sim", "Não"] },
          { label: "USB Hub", type: "select", options: ["Sim", "Não"] },
          { label: "Alto-falantes integrados", type: "select", options: ["Sim", "Não"] },
        ],
      },
      {
        title: "Outros",
        fields: [
          { label: "Ajuste de altura", type: "select", options: ["Sim", "Não"] },
          { label: "Rotação (pivot)", type: "select", options: ["Sim", "Não"] },
          { label: "Montagem VESA", type: "select", options: ["Sim (75x75)", "Sim (100x100)", "Não"] },
          { label: "É gamer", type: "select", options: ["Sim", "Não"] },
        ],
      },
    ],
  },

  gabinete: {
    label: "Gabinete",
    icon: "🖥️",
    groups: [
      {
        title: "Características principais",
        fields: [
          { label: "Marca", type: "text", placeholder: "Ex: NZXT, Corsair, Redragon" },
          { label: "Modelo", type: "text", placeholder: "Ex: H510 Elite" },
          { label: "Cor", type: "text", placeholder: "Ex: Preto" },
          { label: "Formato", type: "select", options: ["ATX Full Tower", "ATX Mid Tower", "Micro ATX", "Mini ITX"] },
          { label: "Material", type: "text", placeholder: "Ex: Aço, Vidro temperado" },
        ],
      },
      {
        title: "Especificações técnicas",
        fields: [
          { label: "Slots de expansão", type: "text", placeholder: "Ex: 7" },
          { label: "Baias 3.5\"", type: "text", placeholder: "Ex: 2" },
          { label: "Baias 2.5\"", type: "text", placeholder: "Ex: 4" },
          { label: "Placa de vídeo máxima", type: "text", placeholder: "Ex: 381mm" },
          { label: "Cooler CPU máximo", type: "text", placeholder: "Ex: 165mm" },
          { label: "Ventoinhas inclusas", type: "text", placeholder: "Ex: 3x 120mm (frontal) + 1x 120mm (traseira)" },
          { label: "Suporte a radiador", type: "text", placeholder: "Ex: Frontal 360mm, Topo 240mm" },
        ],
      },
      {
        title: "Outros",
        fields: [
          { label: "Painel de vidro temperado", type: "select", options: ["Sim", "Não"] },
          { label: "Filtro de poeira", type: "select", options: ["Sim", "Não"] },
          { label: "Painel frontal USB-C", type: "select", options: ["Sim", "Não"] },
          { label: "Com luz LED/RGB", type: "select", options: ["Sim", "Não"] },
          { label: "Dimensões", type: "text", placeholder: "Ex: 460 x 210 x 428 mm" },
          { label: "Peso", type: "text", placeholder: "Ex: 6.7 kg" },
        ],
      },
    ],
  },

  cadeira: {
    label: "Cadeira Gamer",
    icon: "🪑",
    groups: [
      {
        title: "Características principais",
        fields: [
          { label: "Marca", type: "text", placeholder: "Ex: ThunderX3, DT3, Pichau" },
          { label: "Modelo", type: "text", placeholder: "Ex: EC3 Black" },
          { label: "Cor", type: "text", placeholder: "Ex: Preto/Vermelho" },
          { label: "Material do revestimento", type: "select", options: ["Couro sintético (PU)", "Tecido mesh", "Couro real", "Veludo"] },
        ],
      },
      {
        title: "Especificações técnicas",
        fields: [
          { label: "Peso suportado", type: "text", placeholder: "Ex: 150 kg" },
          { label: "Altura recomendada", type: "text", placeholder: "Ex: 1.60m - 1.85m" },
          { label: "Ajuste de altura", type: "select", options: ["Sim (pistão a gás)", "Não"] },
          { label: "Reclinável", type: "text", placeholder: "Ex: Sim, até 180°" },
          { label: "Apoio de braço", type: "select", options: ["Fixo", "1D (altura)", "2D (altura + lateral)", "3D (altura + lateral + profundidade)", "4D (altura + lateral + profundidade + rotação)"] },
        ],
      },
      {
        title: "Outros",
        fields: [
          { label: "Almofada lombar", type: "select", options: ["Sim", "Não"] },
          { label: "Almofada cervical", type: "select", options: ["Sim", "Não"] },
          { label: "Base", type: "select", options: ["Nylon", "Metal", "Alumínio"] },
          { label: "Rodízios", type: "select", options: ["Nylon", "Silicone (anti-risco)", "Borracha"] },
          { label: "Dimensões", type: "text", placeholder: "Ex: 70 x 70 x 130 cm" },
          { label: "Peso da cadeira", type: "text", placeholder: "Ex: 22 kg" },
          { label: "É gamer", type: "select", options: ["Sim", "Não"] },
        ],
      },
    ],
  },

  webcam: {
    label: "Webcam",
    icon: "📷",
    groups: [
      {
        title: "Características principais",
        fields: [
          { label: "Marca", type: "text", placeholder: "Ex: Logitech, Razer, Elgato" },
          { label: "Modelo", type: "text", placeholder: "Ex: C920 HD Pro" },
          { label: "Cor", type: "text", placeholder: "Ex: Preto" },
          { label: "Resolução máxima", type: "select", options: ["HD (720p)", "Full HD (1080p)", "2K (1440p)", "4K (2160p)"] },
          { label: "Taxa de quadros", type: "text", placeholder: "Ex: 60 fps" },
        ],
      },
      {
        title: "Especificações técnicas",
        fields: [
          { label: "Autofoco", type: "select", options: ["Sim", "Não"] },
          { label: "Campo de visão", type: "text", placeholder: "Ex: 78°" },
          { label: "Microfone integrado", type: "select", options: ["Sim — Estéreo", "Sim — Mono", "Não"] },
          { label: "Correção de luz", type: "select", options: ["Sim", "Não"] },
        ],
      },
      {
        title: "Conectividade",
        fields: [
          { label: "Tipo de conexão", type: "select", options: ["USB-A", "USB-C", "Wireless"] },
          { label: "Comprimento do cabo", type: "text", placeholder: "Ex: 1.5m" },
          { label: "Montagem", type: "select", options: ["Clip de monitor", "Tripé", "Clip + Tripé"] },
        ],
      },
    ],
  },

  caixa_de_som: {
    label: "Caixa de Som",
    icon: "🔊",
    groups: [
      {
        title: "Características principais",
        fields: [
          { label: "Marca", type: "text", placeholder: "Ex: JBL, Edifier, Redragon" },
          { label: "Modelo", type: "text", placeholder: "Ex: Flip 6" },
          { label: "Cor", type: "text", placeholder: "Ex: Preto" },
          { label: "Tipo", type: "select", options: ["Portátil Bluetooth", "Desktop 2.0", "Desktop 2.1", "Soundbar"] },
          { label: "Potência", type: "text", placeholder: "Ex: 30W RMS" },
        ],
      },
      {
        title: "Especificações técnicas",
        fields: [
          { label: "Resposta de frequência", type: "text", placeholder: "Ex: 65Hz - 20kHz" },
          { label: "Bateria (portátil)", type: "text", placeholder: "Ex: 12 horas" },
          { label: "Proteção contra água", type: "select", options: ["Não", "IPX5", "IPX7", "IP67", "IP68"] },
        ],
      },
      {
        title: "Conectividade",
        fields: [
          { label: "Bluetooth", type: "select", options: ["Sim", "Não"] },
          { label: "P2 (3.5mm)", type: "select", options: ["Sim", "Não"] },
          { label: "USB", type: "select", options: ["Sim", "Não"] },
        ],
      },
    ],
  },

  outro: {
    label: "Outro",
    icon: "📦",
    groups: [
      {
        title: "Características principais",
        fields: [
          { label: "Marca", type: "text", placeholder: "Ex: Brand" },
          { label: "Modelo", type: "text", placeholder: "Ex: Model" },
          { label: "Cor", type: "text", placeholder: "Ex: Preto" },
        ],
      },
      {
        title: "Outros",
        fields: [
          { label: "Material", type: "text", placeholder: "Ex: Plástico, Metal" },
          { label: "Dimensões", type: "text", placeholder: "Ex: 10 x 5 x 3 cm" },
          { label: "Peso", type: "text", placeholder: "Ex: 200g" },
        ],
      },
    ],
  },
};

/**
 * Build empty spec data from a product type (for form initialization)
 */
export function buildEmptySpecs(productType: string): SpecGroupData[] {
  const config = PRODUCT_TYPES[productType];
  if (!config) return [];
  return config.groups.map(g => ({
    group: g.title,
    specs: g.fields.map(f => ({ label: f.label, value: "" })),
  }));
}

/**
 * Get the flat list of all type keys for easy iteration
 */
export function getProductTypeKeys(): string[] {
  return Object.keys(PRODUCT_TYPES);
}
