/**
 * Elo · Cadastro de usuários — Apps Script
 * Recebe os envios da página de cadastro e grava na planilha, uma aba por sala.
 *
 * Como usar: veja o LEIA-ME. Em resumo:
 *  1. Na planilha: Extensões > Apps Script, cole este código e salve.
 *  2. Ajuste CODIGO_ACESSO abaixo.
 *  3. Implantar > Nova implantação > App da Web
 *     (Executar como: Eu · Quem pode acessar: Qualquer pessoa).
 *  4. Copie a URL /exec e cole em SCRIPT_URL no index.html.
 */

// ===== CONFIGURAÇÃO =====
// Código que a equipe interna digita na página. Troque antes de publicar.
// Para usar um código diferente por sala, preencha CODIGOS_POR_SALA (opcional).
const CODIGO_ACESSO = 'ELO2026';
const CODIGOS_POR_SALA = {
  // 'Sala Muro Alto': 'MURO-7421',
};
// E-mail que recebe um aviso a cada envio (deixe '' para não avisar).
const EMAIL_AVISO = '';
// =========================

const CABECALHO = [
  'Data/hora', 'Protocolo', 'Tipo de cadastro', 'Região', 'Sala',
  'Nome do voucher (TSE)', 'Tipo de parceiro', 'Nome completo', 'CPF', 'E-mail', 'WhatsApp',
  'Função', 'Endereço / ponto', 'Recebimento', 'Observações',
  'Enviado por', 'E-mail de quem enviou', 'Função de quem enviou',
  'Status', 'Usuário criado em', 'Responsável Elo'
];

function doGet() {
  return json_({ ok: true, servico: 'Elo · Cadastro de usuários', hora: new Date().toISOString() });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const d = JSON.parse(e.postData.contents || '{}');
    const id = d.ident || {};
    const sala = limpa_(id.sala, 80);
    const regiao = limpa_(id.regiao, 80);

    // 1) Código de acesso
    const codigoCerto = CODIGOS_POR_SALA[sala] || CODIGO_ACESSO;
    if (!codigoCerto || String(d.codigo || '').trim() !== codigoCerto) {
      return json_({ ok: false, erro: 'Código de acesso inválido. Confirme o código com a equipe Elo.' });
    }
    // 2) Validações básicas
    if (!sala || !regiao) return json_({ ok: false, erro: 'Região e sala são obrigatórias.' });
    const parceiros = Array.isArray(d.parceiros) ? d.parceiros.slice(0, 200) : [];
    const equipe = Array.isArray(d.equipe) ? d.equipe.slice(0, 200) : [];
    if (!parceiros.length && !equipe.length) return json_({ ok: false, erro: 'Nenhum cadastro recebido.' });

    // 3) Aba da sala
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const aba = abaDaSala_(ss, sala);
    const cpfsExistentes = new Set(
      aba.getLastRow() > 1
        ? aba.getRange(2, 9, aba.getLastRow() - 1, 1).getValues().map(r => soDigitos_(r[0]))
        : []
    );

    const agora = new Date();
    const protocolo = 'ELO-' + Utilities.formatDate(agora, 'America/Sao_Paulo', 'yyMMdd-HHmmss') + '-' + Math.floor(Math.random() * 900 + 100);
    const quem = [limpa_(id.nome, 120), limpa_(id.email, 120), limpa_(id.funcao, 60)];
    const duplicados = [];
    const linhas = [];

    const status = cpf => {
      const c = soDigitos_(cpf);
      if (cpfsExistentes.has(c)) { duplicados.push(formataCpf_(c)); return 'Conferir: CPF já cadastrado'; }
      cpfsExistentes.add(c);
      return 'Pendente';
    };

    parceiros.forEach(p => {
      linhas.push([agora, protocolo, 'Parceiro', regiao, sala,
        limpa_(p.voucher, 120), limpa_(p.tipo, 60), limpa_(p.nome, 120), formataCpf_(p.cpf), limpa_(p.email, 120), limpa_(p.whats, 30),
        'Gestor do parceiro', limpa_(p.local, 200), limpa_(p.receb, 60), limpa_(p.obs, 500)]
        .concat(quem, [status(p.cpf), '', '']));
    });
    equipe.forEach(p => {
      linhas.push([agora, protocolo, 'Equipe da sala', regiao, sala,
        '', '', limpa_(p.nome, 120), formataCpf_(p.cpf), limpa_(p.email, 120), limpa_(p.whats, 30),
        limpa_(p.funcao, 60), '', '', limpa_(p.obs, 500)]
        .concat(quem, [status(p.cpf), '', '']));
    });

    aba.getRange(aba.getLastRow() + 1, 1, linhas.length, CABECALHO.length).setValues(linhas);
    resumo_(ss);

    if (EMAIL_AVISO) {
      MailApp.sendEmail(EMAIL_AVISO, `[Elo] ${linhas.length} cadastro(s) · ${sala}`,
        `Protocolo ${protocolo}\nSala: ${sala}\nParceiros: ${parceiros.length}\nEquipe: ${equipe.length}\nEnviado por: ${quem[0]} (${quem[1]})\n\n${ss.getUrl()}`);
    }
    return json_({ ok: true, protocolo, gravados: linhas.length, duplicados });
  } catch (err) {
    return json_({ ok: false, erro: 'Erro ao gravar: ' + err.message });
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

// ---------- apoio ----------
function abaDaSala_(ss, sala) {
  const nome = sala.replace(/[\[\]\*\?\/\\:]/g, '-').slice(0, 90);
  let aba = ss.getSheetByName(nome);
  if (!aba) {
    aba = ss.insertSheet(nome);
    aba.getRange(1, 1, 1, CABECALHO.length).setValues([CABECALHO])
      .setFontWeight('bold').setFontColor('#FFFFFF').setBackground('#0E2F6B');
    aba.setFrozenRows(1);
    aba.getRange('A:A').setNumberFormat('dd/MM/yyyy HH:mm');
    aba.getRange('I:I').setNumberFormat('@');
    aba.getRange('S2:S').setDataValidation(SpreadsheetApp.newDataValidation()
      .requireValueInList(['Pendente', 'Conferir: CPF já cadastrado', 'Usuário criado', 'Recusado'], true).build());
    aba.setColumnWidths(1, CABECALHO.length, 150);
  }
  return aba;
}

function resumo_(ss) {
  let r = ss.getSheetByName('Resumo');
  if (!r) { r = ss.insertSheet('Resumo', 0); }
  const dados = [['Sala', 'Parceiros', 'Equipe', 'Pendentes', 'Usuários criados', 'Último envio']];
  ss.getSheets().forEach(sh => {
    if (sh.getName() === 'Resumo' || sh.getLastRow() < 2) return;
    if (sh.getRange(1, 1).getValue() !== CABECALHO[0]) return;
    const v = sh.getRange(2, 1, sh.getLastRow() - 1, CABECALHO.length).getValues();
    dados.push([sh.getName(),
      v.filter(x => x[2] === 'Parceiro').length,
      v.filter(x => x[2] === 'Equipe da sala').length,
      v.filter(x => String(x[18]).indexOf('Usuário criado') === -1 && x[18] !== 'Recusado').length,
      v.filter(x => x[18] === 'Usuário criado').length,
      v.reduce((m, x) => (x[0] > m ? x[0] : m), '')]);
  });
  r.clear();
  r.getRange(1, 1, dados.length, dados[0].length).setValues(dados);
  r.getRange(1, 1, 1, dados[0].length).setFontWeight('bold').setFontColor('#FFFFFF').setBackground('#6A0BB5');
  r.getRange('F:F').setNumberFormat('dd/MM/yyyy HH:mm');
  r.setFrozenRows(1);
}

function limpa_(v, max) {
  let s = String(v == null ? '' : v).trim().slice(0, max || 200);
  if (/^[=+\-@]/.test(s)) s = "'" + s; // evita fórmulas injetadas na planilha
  return s;
}
function soDigitos_(v) { return String(v || '').replace(/\D/g, ''); }
function formataCpf_(v) {
  const d = soDigitos_(v);
  return d.length === 11 ? d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : limpa_(v, 20);
}
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
