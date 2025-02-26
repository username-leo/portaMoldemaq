function doGet() {
  return HtmlService.createHtmlOutputFromFile('telaPrincipal')
    .setTitle('Tela Principal')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function abrirFormulario() {
  return HtmlService.createHtmlOutputFromFile('formulario').getContent();
}

function salvarDados(nomeRevenda, nome, email, telefone, tipoProduto, modeloTransportador, versao, flags, notaFiscal, numeroSerie, cpf, dataEntregaTecnica, dataFaturamento, cep, rua, numero, bairro, cidade, estado, usuarioEmail, entregaFeitaPor) {
  try {
    var planilhaDestino = SpreadsheetApp.openById('1Sl7dSQ8_yJPhF4D27b7n67onJERdtWgmW8Pi96rVdVQ');
    var sheet = planilhaDestino.getSheetByName('Dados');

    // Validação para evitar duplicações
    var produtoJaRegistrado = validarRegistroExistente(sheet, tipoProduto, modeloTransportador, numeroSerie);
    if (produtoJaRegistrado) {
      return "Erro: Esse produto já foi registrado na tabela de Produtos. Verifique os dados e tente novamente";
    }

    // Captura o email do usuário se não estiver presente no formulário
    if (!usuarioEmail) {
      usuarioEmail = Session.getActiveUser().getEmail();
    }

    var usuarioNome = usuarioEmail.split('@')[0]; 

    // Formatação das datas
    let dataEntregaFormatada = "";
    if (dataEntregaTecnica) {
      let partesData = dataEntregaTecnica.split("-");
      let dataObj = new Date(partesData[0], partesData[1] - 1, partesData[2]);
      dataEntregaFormatada = Utilities.formatDate(dataObj, Session.getScriptTimeZone(), "dd/MM/yyyy");
    }

    let dataFaturamentoFormatada = "";
    if (dataFaturamento) {
      let partesData = dataFaturamento.split("-");
      let dataObj = new Date(partesData[0], partesData[1] - 1, partesData[2]);
      dataFaturamentoFormatada = Utilities.formatDate(dataObj, Session.getScriptTimeZone(), "dd/MM/yyyy");
    }

    // Captura o ID da linha atual
    var ultimaLinha = sheet.getLastRow();
    var id = ultimaLinha + 1;

    // Adiciona os dados na planilha
    sheet.appendRow([id, nomeRevenda, nome, email, telefone, tipoProduto, modeloTransportador, versao, flags, notaFiscal, numeroSerie, cpf, dataEntregaFormatada, dataFaturamentoFormatada, cep, rua, numero, bairro, cidade, estado, new Date(), usuarioNome, usuarioEmail, entregaFeitaPor]);

    // Gera o PDF
    var pdfBase64 = gerarDocumento(nomeRevenda, nome, email, telefone, tipoProduto, modeloTransportador, versao, flags, notaFiscal, numeroSerie, cpf, dataEntregaFormatada, dataFaturamentoFormatada, cep, rua, numero, bairro, cidade, estado, entregaFeitaPor);
    
    return pdfBase64;
  } catch (e) {
    throw new Error("Erro ao salvar os dados na planilha: " + e.message);
  }
}

function gerarDocumento(nomeRevenda, nome, email, telefone, tipoProduto, modeloTransportador, versao, flags, notaFiscal, numeroSerie, cpf, dataEntregaTecnica, dataFaturamento, cep, rua, numero, bairro, cidade, estado, entregaFeitaPor) {
  
  // Mapeamento dos modelos de documento por tipo de produto e modeloTransportador específico
  const modelos = {
    "Transportador_TAM1400": "12qa5fb6pGaa_lOY0H3CEh3kZ2WsfNGK3ZML9mqCT3Ys", // Caso específico
    "Transportador": "1cigbSivnvxpCZl-pGfEvuInLbaRlnsl2_Smwz0TEADM", // Padrão para Transportador
    "Implemento Micro Trator": "12qa5fb6pGaa_lOY0H3CEh3kZ2WsfNGK3ZML9mqCT3Ys",
    "Implemento Quadriciclo": "1hI4wjoIC2ZQz8W1fF5HR9QOtPhQI5XUVwANKtVFv7sM",
    "Implemento Transportador": "1Eio4Q3Pb2EFCx2Vky-IqhsDMMguJOicNFSr5whzBTCw"
  };

  // Determinar o modelo correto baseado no tipoProduto e modeloTransportador
  let modeloId;
  if (tipoProduto === "Transportador" && modeloTransportador === "TAM1400") {
    modeloId = modelos["Transportador_TAM1400"];
  } else if (tipoProduto === "Transportador") {
    modeloId = modelos["Transportador"];
  } else {
    modeloId = modelos[tipoProduto] || "1JIu57LZfTrhrzSi4zjWfJu6cQSziWjvnRTDKwQRe-cc"; // Padrão caso não encontre
  }

  try {
    const copiaDoc = DriveApp.getFileById(modeloId).makeCopy(`Certificado_${nome}`, DriveApp.getRootFolder());
    const docCopia = DocumentApp.openById(copiaDoc.getId());
    const body = docCopia.getBody();

    function verificarValor(valor) {
      return valor !== undefined && valor !== null ? valor : "";
    }

    // Substituição de placeholders no documento
    body.replaceText('{{nomeRevenda}}', verificarValor(nomeRevenda));
    body.replaceText('{{nome}}', verificarValor(nome));
    body.replaceText('{{email}}', verificarValor(email));
    body.replaceText('{{telefone}}', verificarValor(telefone));
    body.replaceText('{{tipoProduto}}', verificarValor(tipoProduto));
    body.replaceText('{{modeloTransportador}}', verificarValor(modeloTransportador));
    body.replaceText('{{versao}}', verificarValor(versao));
    body.replaceText('{{flags}}', verificarValor(flags));
    body.replaceText('{{notaFiscal}}', verificarValor(notaFiscal));
    body.replaceText('{{numeroSerie}}', verificarValor(numeroSerie));
    body.replaceText('{{cpf}}', verificarValor(cpf));
    body.replaceText('{{data}}', verificarValor(dataEntregaTecnica));
    body.replaceText('{{dataF}}', verificarValor(dataFaturamento));
    body.replaceText('{{cep}}', verificarValor(cep));
    body.replaceText('{{rua}}', verificarValor(rua));
    body.replaceText('{{numero}}', verificarValor(numero));
    body.replaceText('{{bairro}}', verificarValor(bairro));
    body.replaceText('{{cidade}}', verificarValor(cidade));
    body.replaceText('{{estado}}', verificarValor(estado));
    body.replaceText('{{entregaFeitaPor}}', verificarValor(entregaFeitaPor));

    docCopia.saveAndClose();

    const pdfBlob = copiaDoc.getAs('application/pdf');
    const pdfBase64 = Utilities.base64Encode(pdfBlob.getBytes());

    copiaDoc.setTrashed(true);

    return pdfBase64;
  } catch (e) {
    throw new Error("Erro ao gerar o documento PDF: " + e.message);
  }
}

function validarRegistroExistente(sheet, tipoProduto, modeloTransportador, numeroSerie) {
  try {
    var dados = sheet.getDataRange().getValues();

    tipoProduto = tipoProduto ? tipoProduto.toString().trim().toLowerCase() : "";
    modeloTransportador = modeloTransportador ? modeloTransportador.toString().trim().toLowerCase() : "";
    numeroSerie = numeroSerie ? numeroSerie.toString().trim() : "";

    for (var i = 1; i < dados.length; i++) {
      var tipoProdutoExistente = dados[i][5] ? dados[i][5].toString().trim().toLowerCase() : ""; 
      var modeloExistente = dados[i][6] ? dados[i][6].toString().trim().toLowerCase() : "";
      var numeroSerieExistente = dados[i][10] ? dados[i][10].toString().trim() : "";

      if (tipoProdutoExistente === tipoProduto && modeloExistente === modeloTransportador && numeroSerieExistente === numeroSerie) {
        return true;
      }
    }
    return false;
  } catch (e) {
    throw new Error("Erro ao validar os registros existentes: " + e.message);
  }
}

function getActiveUserEmail() {
  return Session.getActiveUser().getEmail();
}
