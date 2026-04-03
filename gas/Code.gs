/**
 * Cobrador App - Google Apps Script (API + Banco de dados)
 *
 * Deploy: Web App → Execute as me → Anyone can access
 * Planilha funciona como banco de dados, cada aba = usuario_tipo
 *
 * POST { usuario, tipo, dados } → salva dados na aba
 * GET  ?usuario=X&tipo=Y        → retorna dados da aba
 */

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var usuario = (payload.usuario || '').toString().trim().toLowerCase();
    var tipo = (payload.tipo || '').toString().trim().toLowerCase();
    var dados = payload.dados;

    if (!usuario || !tipo) {
      return jsonResponse({ ok: false, erro: 'usuario e tipo são obrigatórios' });
    }

    var tabName = usuario + '_' + tipo;
    var sheet = getOrCreateSheet(tabName);

    sheet.clear();
    sheet.getRange('A1').setValue(JSON.stringify(dados));
    sheet.getRange('B1').setValue(new Date().toISOString());

    return jsonResponse({ ok: true, timestamp: new Date().toISOString() });
  } catch (err) {
    return jsonResponse({ ok: false, erro: err.message });
  }
}

function doGet(e) {
  try {
    var usuario = (e.parameter.usuario || '').toString().trim().toLowerCase();
    var tipo = (e.parameter.tipo || '').toString().trim().toLowerCase();

    if (!usuario || !tipo) {
      return jsonResponse({ ok: false, erro: 'usuario e tipo são obrigatórios' });
    }

    var tabName = usuario + '_' + tipo;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(tabName);

    if (!sheet) {
      return jsonResponse({ ok: true, dados: null, ultimoSync: null });
    }

    var jsonStr = sheet.getRange('A1').getValue();
    var ultimoSync = sheet.getRange('B1').getValue();
    var dados = null;

    if (jsonStr) {
      try {
        dados = JSON.parse(jsonStr);
      } catch (parseErr) {
        dados = null;
      }
    }

    return jsonResponse({
      ok: true,
      dados: dados,
      ultimoSync: ultimoSync ? new Date(ultimoSync).toISOString() : null
    });
  } catch (err) {
    return jsonResponse({ ok: false, erro: err.message });
  }
}

function getOrCreateSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
