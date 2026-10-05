function xmlNota(opcoes = {}) {
  const chave = '35261000000000000100550010000001231123456780';
  const inf = `<infNFe Id="NFe${chave}" versao="4.00"><ide><mod>55</mod><tpNF>1</tpNF><tpAmb>1</tpAmb><nNF>123</nNF><serie>1</serie><dhEmi>2026-10-05T09:00:00-03:00</dhEmi></ide>
  <emit><CNPJ>00000000000100</CNPJ><xNome>Empresa Fictícia</xNome><enderEmit><xLgr>Rua Exemplo</xLgr><nro>10</nro><xBairro>Centro</xBairro><xMun>Cidade Exemplo</xMun><UF>SP</UF><CEP>00000000</CEP></enderEmit></emit>
  <dest><xNome>Cliente Fictício</xNome><enderDest><xLgr>Rua Destino</xLgr><nro>20</nro><xBairro>Bairro</xBairro><xMun>Cidade Destino</xMun><UF>SP</UF><CEP>00000000</CEP></enderDest></dest>
  ${opcoes.entrega || ''}<det nItem="1"><prod><xProd>Item &amp; Exemplo</xProd></prod></det><transp>${opcoes.volumes ?? '<vol><qVol>2</qVol></vol><vol><qVol>3</qVol></vol>'}</transp></infNFe>`;
  const nfe = `<NFe xmlns="http://www.portalfiscal.inf.br/nfe">${inf}</NFe>`;
  return opcoes.semProtocolo ? nfe : `<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">${nfe}<protNFe><infProt><tpAmb>1</tpAmb><chNFe>${chave}</chNFe><cStat>${opcoes.status || '100'}</cStat></infProt></protNFe></nfeProc>`;
}
module.exports = { xmlNota };
