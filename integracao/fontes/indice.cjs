'use strict';
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {DatabaseSync} = require('node:sqlite');
const {DOMParser} = require('@xmldom/xmldom');
const {lerXML,LIMITE_XML} = require('../../assets/js/nfe.js');
const VERSAO = 1;
const dentro = (raiz,alvo) => {const r=path.relative(raiz,alvo);return r===''||(!r.startsWith('..'+path.sep)&&r!=='..'&&!path.isAbsolute(r));};
const assinatura = s => [s.size,s.mtimeMs,s.ctimeMs,s.ino].join(':');
async function lerSeguro(raiz,arquivo,cnpj='') {
  const real=await fs.realpath(arquivo);
  if(!dentro(raiz,real)||(await fs.lstat(arquivo)).isSymbolicLink())throw Error('Arquivo fora da pasta permitida.');
  const antes=await fs.stat(real);
  if(!antes.isFile()||antes.size>LIMITE_XML)throw Error('Arquivo excede 2 MB ou não é regular.');
  const buffer=await fs.readFile(real), depois=await fs.stat(real);
  if(buffer.length>LIMITE_XML||assinatura(antes)!==assinatura(depois))throw Error('Arquivo em gravação; tente novamente.');
  const nota=lerXML(new TextDecoder('utf-8',{fatal:true}).decode(buffer),DOMParser);
  return cnpj&&nota.emitente.cnpj!==cnpj?null:nota;
}
function criarIndice(config,diretorio) {
  if (!Array.isArray(config.pastas)||!config.pastas.length||config.pastas.some(p=>!path.isAbsolute(p))) throw Error('Configure pastas absolutas.');
  if(config.cnpjEmitente&&!/^\d{14}$/.test(String(config.cnpjEmitente).replace(/\D/g,'')))throw Error('CNPJ inválido.');
  const parserVersao=createHash('sha256').update(fsSync.readFileSync(path.join(__dirname,'../../assets/js/nfe.js'))).digest('hex');
  const fingerprint=createHash('sha256').update(JSON.stringify([VERSAO,parserVersao,config.id,config.pastas,config.recursivo!==false,config.cnpjEmitente||''])).digest('hex');
  fsSync.mkdirSync(diretorio,{recursive:true});
  const db=new DatabaseSync(path.join(diretorio,fingerprint+'.sqlite'));
  db.exec("PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL; CREATE TABLE IF NOT EXISTS arquivos(id TEXT PRIMARY KEY,caminho TEXT,raiz TEXT,assinatura TEXT,nota TEXT,erro TEXT,busca TEXT,data TEXT,nf TEXT,chave TEXT,geracao TEXT); CREATE TABLE IF NOT EXISTS meta(chave TEXT PRIMARY KEY,valor TEXT); CREATE INDEX IF NOT EXISTS data_notas ON arquivos(data);");
  let ultimo=db.prepare("SELECT valor FROM meta WHERE chave='atualizado'").get()?.valor||null;
  let pendente,timer,encerrado=false;
  const estado={fase:'aguardando',total:null,processados:0,pronto:Boolean(ultimo),atualizadoEm:ultimo,desatualizado:true,erros:[],notas:0};
  const cnpj=String(config.cnpjEmitente||'').replace(/\D/g,'');
  const existentes=db.prepare('SELECT assinatura,erro FROM arquivos WHERE id=?');
  const apagar=db.prepare('DELETE FROM arquivos WHERE id=?');
  const salvar=db.prepare('INSERT OR REPLACE INTO arquivos VALUES(?,?,?,?,?,?,?,?,?,?,?)');
  const limite=Math.min(10000,Math.max(1,Number(config.limiteEntradas)||10000));
  const contar=()=>Number(db.prepare('SELECT count(*) AS n FROM arquivos WHERE nota IS NOT NULL').get().n);
  estado.notas=contar();
  async function atualizar() {
    if(pendente)return pendente;
    if(encerrado)return;
    pendente=(async()=>{
      estado.fase='levantando';estado.total=null;estado.processados=0;estado.erros=[];estado.desatualizado=true;
      const inventario=[],raizes=[],incompletas=new Set();let limitado=false;
      const avisar=(arquivo,motivo)=>{if(estado.erros.length<50)estado.erros.push({arquivo,motivo});};
      for(const pasta of config.pastas){
        let raiz;
        try{raiz=await fs.realpath(pasta)}catch{avisar('Pasta configurada','Pasta indisponível. Verifique acesso no servidor.');continue;}
        raizes.push(raiz);let visitados=0;
        async function visitar(dir,prof=0){
          if(prof>20||visitados>=limite){limitado=true;incompletas.add(raiz);return;}
          let entradas;
          try{entradas=await fs.readdir(dir,{withFileTypes:true})}catch{incompletas.add(raiz);avisar(path.basename(dir),'Sem acesso à pasta.');return;}
          for(const e of entradas){
            if(++visitados>limite){limitado=true;incompletas.add(raiz);break;}
            if(e.isSymbolicLink())continue;
            const arquivo=path.join(dir,e.name);
            if(e.isDirectory()&&config.recursivo!==false){
              try{const real=await fs.realpath(arquivo);if(dentro(raiz,real))await visitar(real,prof+1)}catch{incompletas.add(raiz);avisar(e.name,'Pasta indisponível.');}
            }else if(e.isFile()&&/\.xml$/i.test(e.name))inventario.push({raiz,arquivo,nome:e.name});
          }
        }
        await visitar(raiz);
      }
      estado.total=inventario.length;estado.fase='verificando';
      const geracao=String(Date.now())+'-'+Math.random(); const vistos=new Set();
      async function processar(item){
        const {raiz,arquivo,nome}=item,id=createHash('sha256').update(config.id+'\0'+arquivo).digest('hex');
        vistos.add(id); let sig;
        try{
          // O inventário já validou as pastas; só consultar metadados sem seguir links.
          // Antes de reler um XML alterado, lerSeguro revalida o caminho real e os limites.
          const stat=await fs.lstat(arquivo);
          if(stat.isSymbolicLink())throw Error('Arquivo fora da pasta permitida.');
          sig=assinatura(stat);
          if(!stat.isFile()||stat.size>LIMITE_XML)throw Error('Arquivo excede 2 MB ou não é regular.');
          const anterior=existentes.get(id);
          if(anterior?.assinatura===sig){if(anterior.erro)avisar(nome,anterior.erro);return;}
          const nota=await lerSeguro(raiz,arquivo,cnpj);
          // Não guardar cópia do XML; somente os dados normalizados usados na busca.
          const resumo=nota?{nf:nota.nf,serie:nota.serie,data:nota.data,destinatario:nota.destinatario,emitente:{nome:nota.emitente.nome},chave:nota.chave,volumes:nota.volumes,id,arquivo:nome,fonte:config.id}:null;
          salvar.run(id,arquivo,raiz,sig,resumo?JSON.stringify(resumo):null,null,nota?[nota.destinatario,nota.emitente.nome].join(' ').toLocaleLowerCase('pt-BR'):'',nota?.data||'',nota?.nf||'',nota?.chave||'',geracao);
        }catch(e){
          const erro=e.message.startsWith('E')||e.code?'Não foi possível ler o XML.':e.message;
          avisar(nome,erro);
          // Erros de acesso/gravação serão tentados novamente; erros de conteúdo reaproveitam a assinatura.
          const persistir=sig&&!e.code&&!/gravação|fora da pasta/.test(e.message)?sig:'';
          salvar.run(id,arquivo,raiz,persistir,null,erro,'','','','',geracao);
        }finally{estado.processados++;}
      }
      for(let i=0;i<inventario.length&&!encerrado;i+=4){
        await Promise.all(inventario.slice(i,i+4).map(processar));
        await new Promise(resolve=>setImmediate(resolve));
      }
      if(encerrado)return;
      for(const raiz of raizes)if(!incompletas.has(raiz))for(const row of db.prepare('SELECT id FROM arquivos WHERE raiz=?').all(raiz))if(!vistos.has(row.id))apagar.run(row.id);
      estado.notas=contar();estado.pronto=true;estado.limitado=limitado;
      estado.desatualizado=raizes.length!==config.pastas.length||incompletas.size>0;
      ultimo=new Date().toISOString();estado.atualizadoEm=ultimo;
      db.prepare("INSERT OR REPLACE INTO meta VALUES('atualizado',?)").run(ultimo);
      estado.fase=estado.desatualizado?'indisponivel':'pronto';
    })().catch(()=>{estado.fase='erro';estado.desatualizado=true;estado.erros=[{arquivo:'Índice local',motivo:'Não foi possível atualizar o índice. Tente novamente pelo aplicativo.'}];}).finally(()=>{pendente=null;});
    return pendente;
  }
  return {
    id:config.id,nome:config.nome||config.id,tipo:'pastas',
    iniciarIndice(){void atualizar();timer=setInterval(()=>void atualizar(),60000);timer.unref();},
    atualizar,
    progresso(){return {...estado,erros:undefined};},
    async pesquisar({busca='',inicio='',fim=''}={}){
      const clauses=['nota IS NOT NULL'],params=[];
      if(inicio){clauses.push('data>=?');params.push(inicio)}
      if(fim){clauses.push('data<=?');params.push(fim)}
      if(busca){
        if(/^\d+$/.test(busca)){clauses.push(busca.length===44?'chave=?':'instr(nf,?)>0');params.push(busca)}
        else{clauses.push('instr(busca,?)>0');params.push(busca.toLocaleLowerCase('pt-BR'))}
      }
      const where=clauses.join(' AND ');
      const total=Number(db.prepare('SELECT count(*) AS n FROM arquivos WHERE '+where).get(...params).n);
      const notas=db.prepare('SELECT nota FROM arquivos WHERE '+where+' ORDER BY data DESC,nf DESC LIMIT 100').all(...params).map(r=>{const n=JSON.parse(r.nota);return {...n,emitente:n.emitente.nome}});
      return {notas,total,erros:estado.erros,limitado:estado.limitado||total>100,indice:this.progresso(),preparando:!estado.pronto,atualizadoEm:ultimo};
    },
    async obter(id){
      const r=db.prepare('SELECT caminho,raiz FROM arquivos WHERE id=? AND nota IS NOT NULL').get(id);
      if(!r)return null;
      const raizes=await Promise.all(config.pastas.map(p=>fs.realpath(p).catch(()=>null)));
      if(!raizes.includes(r.raiz))return null;
      try{const nota=await lerSeguro(r.raiz,r.caminho,cnpj);return nota?{...nota,id,fonte:config.id,arquivo:path.basename(r.caminho)}:null}catch{return null}
    },
    async fechar(){encerrado=true;clearInterval(timer);await pendente;db.close();}
  };
}
module.exports={criarIndice};