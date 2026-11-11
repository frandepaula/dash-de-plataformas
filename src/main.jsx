import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Papa from 'papaparse';
import { Search, Upload, Download, Sparkles, SlidersHorizontal, ChevronDown, Check, X, Plus, FileSpreadsheet, LayoutDashboard, BrainCircuit, BarChart3, GitCompareArrows, Menu, ArrowUpDown, Info, RefreshCw } from 'lucide-react';
import './style.css';

const FILES = [
  { name: 'Adobe Journey Optimizer', file: '/data/Comparativo de plataformas  - AJO.csv', short: 'AJO', color: '#e65b45' },
  { name: 'Salesforce Marketing Cloud', file: '/data/Comparativo de plataformas  - Salesforce MC.csv', short: 'Salesforce MC', color: '#2797d5' }
];
const FIELD_NAMES = ['Categoria','Funcionalidade / Módulo','Como Funciona','Dificuldade de Implementação','Detalhamento de Uso','Modelo de Custo / Licenciamento','Requisitos / Observações Técnicas','Modelo de Dados e Integração','Capacidade MCP & IA Agêntica','Documentação Oficial','Treinamento / Certificação'];
const FIELD_KEYS = ['category','feature','how','complexity','usage','cost','requirements','data','ai','docs','training'];
const normalize = s => (s || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
function parseSheet(text, fallbackName) {
  const parsed = Papa.parse(text, { skipEmptyLines: false }).data;
  const title = (parsed[0] || []).filter(Boolean).join(' ').replace(/\s+/g,' ').trim();
  const headerIndex = parsed.findIndex(r => r.some(c => normalize(c).includes('funcionalidade / modulo')));
  const rows = parsed.slice(headerIndex + 1);
  let category = '';
  const items = rows.map(r => {
    if (r.slice(1).every(v => !String(v ?? '').trim())) return null;
    if (String(r[1] ?? '').trim()) category = String(r[1]).trim();
    const vals = r.slice(1,12);
    if (!String(vals[1] ?? '').trim()) return null;
    const item = {};
    FIELD_KEYS.forEach((k,i) => item[k] = String(vals[i] ?? '').trim());
    item.category = item.category || category;
    return item;
  }).filter(Boolean);
  let platform = fallbackName;
  const t = normalize(title);
  if (t.includes('adobe') || t.includes('ajo')) platform = 'Adobe Journey Optimizer';
  if (t.includes('salesforce')) platform = 'Salesforce Marketing Cloud';
  return { id: crypto.randomUUID(), name: platform, short: platform === 'Adobe Journey Optimizer' ? 'AJO' : platform === 'Salesforce Marketing Cloud' ? 'Salesforce MC' : platform, items, color: platform.includes('Adobe') ? '#e65b45' : platform.includes('Salesforce') ? '#2797d5' : '#8b78e6' };
}
function App() {
  const [platforms,setPlatforms] = useState([]);
  const [selected,setSelected] = useState([]);
  const [query,setQuery] = useState('');
  const [category,setCategory] = useState('Todas');
  const [mode,setMode] = useState('all');
  const [complexity,setComplexity] = useState('Todas');
  const [activeTab,setActiveTab] = useState('compare');
  const [showFields,setShowFields] = useState(['ai','how','complexity','data']);
  const [notice,setNotice] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    Promise.all(FILES.map(async f => {
      const res = await fetch(f.file); const text = await res.text(); return parseSheet(text,f.name);
    })).then(data => { setPlatforms(data); setSelected(data.map(p=>p.id)); }).catch(()=>setNotice('Não foi possível carregar as planilhas iniciais.'));
  },[]);
  const current = platforms.filter(p=>selected.includes(p.id));
  const categories = useMemo(()=>['Todas',...new Set(current.flatMap(p=>p.items.map(i=>i.category)).filter(Boolean))],[current]);
  const filtered = useMemo(()=>{
    const all = current.flatMap(p=>p.items.map(i=>({...i,platformId:p.id,platform:p.name})));
    const q=normalize(query);
    return all.filter(i=>{
      const hay=normalize([i.category,i.feature,i.how,i.usage,i.ai,i.data,i.requirements].join(' '));
      const ai=normalize([i.ai,i.feature,i.category].join(' '));
      return (!q||hay.includes(q)) && (category==='Todas'||i.category===category) &&
        (complexity==='Todas'||normalize(i.complexity)===normalize(complexity)) &&
        (mode==='all'||(mode==='ai' && (ai.includes('ia')||ai.includes('mcp')||ai.includes('agent')||ai.includes('copilot')||ai.includes('genai'))) ||
         (mode==='reports' && normalize(i.category).includes('relatorio')));
    });
  },[current,query,category,complexity,mode]);
  const featureGroups = useMemo(()=>{
    const map=new Map();
    filtered.forEach(item=>{
      const key=normalize(item.feature);
      if(!map.has(key)) map.set(key,{feature:item.feature,category:item.category,entries:{}});
      map.get(key).entries[item.platformId]=item;
    });
    return [...map.values()];
  },[filtered]);
  const togglePlatform=id=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
  const upload=async e=>{
    const files=[...e.target.files||[]];
    for(const file of files){
      const text=await file.text();
      const fallback=file.name.replace(/\.csv$/i,'').replace(/Comparativo de plataformas\s*-\s*/i,'');
      const p=parseSheet(text,fallback);
      if(p.items.length){setPlatforms(old=>[...old,p]);setSelected(old=>[...old,p.id]);}
      else setNotice(`Não encontrei dados no arquivo ${file.name}. Confira se ele segue o modelo das planilhas.`);
    }
    e.target.value='';
  };
  const exportCsv=()=>{
    const rows=[];
    featureGroups.forEach(g=>{
      const row={Categoria:g.category,Funcionalidade:g.feature};
      current.forEach(p=>{const v=g.entries[p.id];row[p.name]=v?(showFields.map(k=>`${FIELD_NAMES[FIELD_KEYS.indexOf(k)]}: ${v[k]}`).join(' | ')):'Não localizado na planilha';});
      rows.push(row);
    });
    const csv=Papa.unparse(rows);
    const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='comparativo-plataformas.csv';a.click();URL.revokeObjectURL(url);
  };
  const total= current.reduce((n,p)=>n+p.items.length,0);
  const aiCount=current.reduce((n,p)=>n+p.items.filter(i=>/\b(ia|mcp|agent|copilot|genai|intelig.ncia artificial)\b/i.test(i.ai+' '+i.feature)).length,0);
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon"><GitCompareArrows size={20}/></div><div><b>PlatformLens</b><small>INTELLIGENCE HUB</small></div></div>
      <div className="side-label">WORKSPACE</div>
      <button className={`nav-item ${activeTab==='compare'?'active':''}`} onClick={()=>setActiveTab('compare')}><LayoutDashboard size={17}/> Comparador</button>
      <button className={`nav-item ${activeTab==='ai'?'active':''}`} onClick={()=>{setActiveTab('compare');setMode('ai')}}><BrainCircuit size={17}/> Recursos de IA</button>
      <button className={`nav-item ${activeTab==='reports'?'active':''}`} onClick={()=>{setActiveTab('compare');setMode('reports')}}><BarChart3 size={17}/> Relatórios</button>
      <div className="side-divider"/>
      <div className="side-label">PLATAFORMAS</div>
      {platforms.map(p=><label className="platform-option" key={p.id}><input type="checkbox" checked={selected.includes(p.id)} onChange={()=>togglePlatform(p.id)}/><i style={{background:p.color}}/><span>{p.short}</span><small>{p.items.length}</small></label>)}
      <button className="add-platform" onClick={()=>fileRef.current?.click()}><Plus size={15}/> Adicionar planilha</button>
      <div className="sidebar-bottom"><div className="status-dot"/> Dados carregados localmente <small>CSV • privado</small></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <b>Comparador de plataformas</b></div><div className="top-actions"><span className="live"><i/> Dados locais</span><button className="icon-btn" title="Recarregar dados" onClick={()=>location.reload()}><RefreshCw size={16}/></button></div></header>
      <section className="content">
        <div className="heading-row"><div><div className="eyebrow">PLATFORM INTELLIGENCE</div><h1>Comparativo de plataformas</h1><p className="subtitle">Encontre diferenças, capacidades e oportunidades entre suas ferramentas.</p></div><div className="heading-buttons"><button className="btn secondary" onClick={()=>fileRef.current?.click()}><Upload size={16}/> Importar CSV</button><button className="btn primary" onClick={exportCsv} disabled={!featureGroups.length}><Download size={16}/> Exportar comparação</button></div></div>
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-icon purple"><FileSpreadsheet size={18}/></div><div><span>Plataformas selecionadas</span><strong>{current.length}</strong><small>de {platforms.length} disponíveis</small></div></div>
          <div className="stat-card"><div className="stat-icon blue"><GitCompareArrows size={18}/></div><div><span>Funcionalidades carregadas</span><strong>{total}</strong><small>somatório das plataformas</small></div></div>
          <div className="stat-card"><div className="stat-icon orange"><Sparkles size={18}/></div><div><span>Itens relacionados à IA</span><strong>{aiCount}</strong><small>menções identificadas nas matrizes</small></div></div>
          <div className="stat-card"><div className="stat-icon green"><BarChart3 size={18}/></div><div><span>Resultados na comparação</span><strong>{featureGroups.length}</strong><small>funcionalidades após filtros</small></div></div>
        </div>
        <div className="workspace-card">
          <div className="toolbar-top"><div><h2><GitCompareArrows size={19}/> Explorar funcionalidades</h2><p>Escolha um tema ou pesquise uma capacidade específica.</p></div><div className="view-toggle"><button className={mode==='all'?'selected':''} onClick={()=>setMode('all')}>Tudo</button><button className={mode==='ai'?'selected':''} onClick={()=>setMode('ai')}><Sparkles size={14}/> IA</button><button className={mode==='reports'?'selected':''} onClick={()=>setMode('reports')}>Relatórios</button></div></div>
          <div className="filters">
            <div className="search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar por funcionalidade, IA, MCP, analytics..."/>{query&&<button onClick={()=>setQuery('')}><X size={15}/></button>}<kbd>⌘ K</kbd></div>
            <div className="select-wrap"><SlidersHorizontal size={15}/><select value={category} onChange={e=>setCategory(e.target.value)}><option value="Todas">Todas as categorias</option>{categories.filter(c=>c!=='Todas').map(c=><option key={c}>{c}</option>)}</select><ChevronDown size={14}/></div>
            <div className="select-wrap"><select value={complexity} onChange={e=>setComplexity(e.target.value)}><option>Todas</option><option>Baixa</option><option>Média</option><option>Alta</option><option>Muito Alta</option></select><ChevronDown size={14}/></div>
          </div>
          {notice&&<div className="notice">{notice}<button onClick={()=>setNotice('')}><X size={14}/></button></div>}
          <div className="results-meta"><span><b>{featureGroups.length}</b> funcionalidades encontradas</span><span>{current.length} plataformas comparadas</span></div>
          {current.length===0?<div className="empty"><GitCompareArrows size={30}/><b>Selecione ao menos uma plataforma</b><span>Marque as plataformas na barra lateral para começar.</span></div>:
          featureGroups.length===0?<div className="empty"><Search size={30}/><b>Nenhum resultado encontrado</b><span>Tente ajustar os filtros ou o termo pesquisado.</span><button className="btn secondary" onClick={()=>{setQuery('');setCategory('Todas');setComplexity('Todas');setMode('all')}}>Limpar filtros</button></div>:
          <div className="table-scroll"><table><thead><tr><th className="feature-col">FUNCIONALIDADE / CATEGORIA</th>{current.map(p=><th key={p.id}><span className="platform-head"><i style={{background:p.color}}/>{p.short}</span></th>)}</tr></thead><tbody>
          {featureGroups.map((g,idx)=><tr key={idx}><td className="feature-cell"><span className="category-tag">{g.category}</span><b>{g.feature}</b></td>{current.map(p=>{const item=g.entries[p.id];return <td key={p.id}>{item?<div className="cell-content">{showFields.includes('ai')&&item.ai&&<div className="ai-snippet"><Sparkles size={13}/><span>{item.ai}</span></div>}<div className="complexity"><span className={`level ${normalize(item.complexity).replace(' ','-')}`}>{item.complexity||'Não informado'}</span></div>{showFields.filter(k=>k!=='ai'&&k!=='complexity').map(k=>item[k]&&<div className="detail" key={k}><b>{FIELD_NAMES[FIELD_KEYS.indexOf(k)]}</b><p>{item[k]}</p></div>)}</div>:<div className="missing"><span>—</span>Não identificado na planilha</div>}</td>})}</tr>)}
          </tbody></table></div>}
          <div className="table-footer"><span>Os dados refletem o conteúdo das planilhas importadas.</span><span><Info size={13}/> Ausência de registro não significa ausência do recurso na plataforma.</span></div>
        </div>
        <div className="bottom-note"><Sparkles size={16}/><div><b>Dica: compare recursos de IA</b><span>Selecione a visão “IA” para filtrar menções a inteligência artificial, MCP, copilots e agentes nas matrizes.</span></div><button onClick={()=>setMode('ai')}>Explorar IA <span>→</span></button></div>
        <footer>PlatformLens <span>•</span> Comparação baseada nas matrizes técnicas fornecidas <span>•</span> v1.0</footer>
      </section>
    </main>
    <input ref={fileRef} type="file" accept=".csv,text/csv" multiple hidden onChange={upload}/>
  </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
