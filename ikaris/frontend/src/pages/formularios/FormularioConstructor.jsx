import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useThemeStore } from '../../store/themeStore';
import { CampoResponder } from './FormularioResponder';

const TIPO_ICONS = {
  texto_corto: <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke="#7c3aed" strokeWidth="2"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>,
  texto_largo: <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke="#7c3aed" strokeWidth="2"><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>,
  email:       <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  telefono:    <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
  url:         <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
  numero:      <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke="#7c3aed" strokeWidth="2"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>,
  moneda:      <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke="#7c3aed" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  porcentaje:  <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke="#7c3aed" strokeWidth="2"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>,
  calculado:   <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke="#7c3aed" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="18" x2="12" y2="18"/></svg>,
  fecha:       <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke="#7c3aed" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  hora:        <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke="#7c3aed" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>,
  fecha_hora:  <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke="#7c3aed" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="8,14 8,14.01"/><polyline points="12,14 12,14.01"/></svg>,
  selector:    <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>,
  radio:       <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke="#7c3aed" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>,
  checkbox:    <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke="#7c3aed" strokeWidth="2"><polyline points="9,11 12,14 22,4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  multiple:    <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke="#7c3aed" strokeWidth="2"><polyline points="9,11 12,14 22,4"/><polyline points="9,17 12,20 22,14"/></svg>,
  archivo:     <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  firma:       <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M20 19.5c-1 .5-2 .5-3 0s-2-.5-3 0-2 .5-3 0-2-.5-3 0"/><path d="M3 12c3-4 6 4 9 0s6-4 9 0"/></svg>,
  tabla:       <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke="#7c3aed" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>,
  dependiente: <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke="#7c3aed" strokeWidth="2"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 01-9 9"/></svg>,
  folio:       <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
};

const TIPOS_CAMPO = [
  { grupo:'Texto', items:[
    { type:'texto_corto', label:'Texto corto' },
    { type:'texto_largo', label:'Texto largo' },
    { type:'email',       label:'Correo' },
    { type:'telefono',    label:'Teléfono' },
    { type:'url',         label:'URL' },
  ]},
  { grupo:'Números', items:[
    { type:'numero',     label:'Número' },
    { type:'moneda',     label:'Moneda' },
    { type:'porcentaje', label:'Porcentaje' },
    { type:'calculado',  label:'Campo calculado' },
  ]},
  { grupo:'Fecha/Hora', items:[
    { type:'fecha',      label:'Fecha' },
    { type:'hora',       label:'Hora' },
    { type:'fecha_hora', label:'Fecha y hora' },
  ]},
  { grupo:'Selección', items:[
    { type:'selector',  label:'Selector' },
    { type:'radio',     label:'Opción única' },
    { type:'multiple',  label:'Selección múltiple' },
  ]},
  { grupo:'Especiales', items:[
    { type:'archivo',     label:'Archivo' },
    { type:'firma',       label:'Firma digital' },
    { type:'tabla',       label:'Tabla dinámica' },
  ]},
];

const CAMPO_DEFAULT = (type, orden) => ({
  id:           `campo_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
  type,
  label:        '',
  placeholder:  '',
  requerido:    false,
  orden,
  opciones:     ['selector','radio','multiple'].includes(type) ? ['Opción 1'] : [],
  configuracion:{},
});
// ── Editor de fórmulas estilo Excel ───────────────────────────────────────
function FormulaEditor({ campo, onUpdate, dark, inputS }) {
  const cfg    = campo.configuracion || {};
  const celdas = cfg.celdas || [{ id:'A1', nombre:'Campo A', valor:'' }];
  const formula = cfg.formula || '';
  const formulaRef = React.useRef(null);

  const FORMULAS_PRE = [
    { label:'Suma',          expr:(cs) => cs.map(c=>c.id).join(' + '),           icon:'+' },
    { label:'Resta',         expr:(cs) => cs.map(c=>c.id).join(' - '),           icon:'−' },
    { label:'Multiplicación',expr:(cs) => cs.map(c=>c.id).join(' * '),           icon:'×' },
    { label:'División',      expr:(cs) => `${cs[0]?.id||'A1'} / ${cs[1]?.id||'B1'}`, icon:'÷' },
    { label:'Promedio',      expr:(cs) => `(${cs.map(c=>c.id).join(' + ')}) / ${cs.length}`, icon:'x̄' },
    { label:'IVA (16%)',     expr:(cs) => `${cs[0]?.id||'A1'} * 1.16`,          icon:'%' },
    { label:'IVA solo',      expr:(cs) => `${cs[0]?.id||'A1'} * 0.16`,          icon:'τ' },
    { label:'Porcentaje',    expr:(cs) => `${cs[0]?.id||'A1'} * ${cs[1]?.id||'B1'} / 100`, icon:'%' },
    { label:'Potencia',      expr:(cs) => `Math.pow(${cs[0]?.id||'A1'}, ${cs[1]?.id||'B1'})`, icon:'xⁿ' },
    { label:'Raíz cuadrada', expr:(cs) => `Math.sqrt(${cs[0]?.id||'A1'})`,      icon:'√' },
    { label:'Máximo',        expr:(cs) => `Math.max(${cs.map(c=>c.id).join(', ')})`, icon:'↑' },
    { label:'Mínimo',        expr:(cs) => `Math.min(${cs.map(c=>c.id).join(', ')})`, icon:'↓' },
  ];

  const SIMBOLOS = [
    { s:'(', label:'(' }, { s:')', label:')' },
    { s:' + ', label:'+' }, { s:' - ', label:'−' },
    { s:' * ', label:'×' }, { s:' / ', label:'÷' },
    { s:' ** ', label:'xⁿ' }, { s:'Math.sqrt(', label:'√' },
    { s:'Math.round(', label:'⌀' }, { s:'Math.abs(', label:'|x|' },
    { s:'.', label:'.' }, { s:' % ', label:'%' },
  ];

  const updateCfg = (key, val) => onUpdate({ ...campo, configuracion:{ ...cfg, [key]:val } });

  const agregarCelda = () => {
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const id = letras[celdas.length % 26] + (Math.floor(celdas.length / 26) + 1);
    updateCfg('celdas', [...celdas, { id, nombre:`Campo ${id}`, valor:'' }]);
  };

  const editarCelda = (i, key, val) => {
    const nuevas = celdas.map((c,idx) => idx===i ? {...c,[key]:val} : c);
    updateCfg('celdas', nuevas);
  };

  const quitarCelda = (i) => {
    updateCfg('celdas', celdas.filter((_,idx) => idx!==i));
  };

  const insertarEnFormula = (texto) => {
    const el  = formulaRef.current;
    if (!el) { updateCfg('formula', formula + texto); return; }
    const ini = el.selectionStart;
    const fin = el.selectionEnd;
    const nueva = formula.slice(0,ini) + texto + formula.slice(fin);
    updateCfg('formula', nueva);
    setTimeout(() => { el.focus(); el.setSelectionRange(ini+texto.length, ini+texto.length); }, 0);
  };

  const aplicarPreset = (preset) => updateCfg('formula', preset.expr(celdas));

  const evaluarPreview = () => {
    try {
      const contexto = Object.fromEntries(celdas.map(c => [c.id, parseFloat(c.valor)||0]));
      let expr = formula;
      Object.entries(contexto).forEach(([k,v]) => { expr = expr.replaceAll(k, v); });
      // eslint-disable-next-line no-new-func
      const resultado = new Function(`return ${expr}`)();
      return isNaN(resultado) ? '—' : Number(resultado.toFixed(4)).toLocaleString('es-MX');
    } catch { return '—'; }
  };

  const preview = evaluarPreview();

  const secLabel = { fontSize:10, fontWeight:700, color:'#9ca3af', display:'block', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.08em' };
  const borderC  = dark ? 'rgba(255,255,255,0.08)' : '#e5e7eb';
  const bgCard   = dark ? 'rgba(255,255,255,0.03)' : '#f9fafb';

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

      {/* ── Tabla de celdas ── */}
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <label style={secLabel}>Celdas / Variables</label>
          <button onClick={agregarCelda}
            style={{ fontSize:11, color:'#7c3aed', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>
            + Agregar celda
          </button>
        </div>

        {/* Header tabla */}
        <div style={{ display:'grid', gridTemplateColumns:'48px 1fr 120px 32px', gap:6, marginBottom:4 }}>
          {['ID','Nombre del campo','Valor prueba',''].map(h => (
            <div key={h} style={{ fontSize:9, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em', padding:'0 4px' }}>{h}</div>
          ))}
        </div>

        {/* Filas */}
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          {celdas.map((c, i) => (
            <div key={c.id} style={{ display:'grid', gridTemplateColumns:'48px 1fr 120px 32px', gap:6, alignItems:'center' }}>
              {/* ID de celda */}
              <div style={{ background:dark?'rgba(124,58,237,0.15)':'#ede9fe', borderRadius:7, padding:'7px 8px', textAlign:'center', fontSize:12, fontWeight:800, color:'#7c3aed', fontFamily:'monospace', cursor:'pointer' }}
                onClick={() => insertarEnFormula(c.id)}
                title="Clic para insertar en fórmula">
                {c.id}
              </div>
              {/* Nombre */}
              <input value={c.nombre} onChange={e => editarCelda(i,'nombre',e.target.value)}
                placeholder="Nombre del campo" style={{...inputS, fontSize:12}} />
              {/* Valor prueba */}
              <input type="number" value={c.valor} onChange={e => editarCelda(i,'valor',e.target.value)}
                placeholder="0" style={{...inputS, fontSize:12}} />
              {/* Borrar */}
              <button onClick={() => quitarCelda(i)} disabled={celdas.length<=1}
                style={{ width:28,height:28,borderRadius:7,border:'none',background:celdas.length<=1?'transparent':(dark?'rgba(239,68,68,0.12)':'#fee2e2'),cursor:celdas.length<=1?'default':'pointer',display:'flex',alignItems:'center',justifyContent:'center',opacity:celdas.length<=1?0.3:1 }}>
                <svg viewBox="0 0 24 24" style={{width:11,height:11}} fill="none" stroke="#ef4444" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Fórmulas preestablecidas ── */}
      <div>
        <label style={secLabel}>Fórmulas preestablecidas</label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
          {FORMULAS_PRE.map(p => (
            <button key={p.label} onClick={() => aplicarPreset(p)}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:8, border:`1px solid ${dark?'rgba(255,255,255,0.1)':'#e5e7eb'}`, background:bgCard, cursor:'pointer', fontSize:11, fontWeight:500, color:dark?'#d1d5db':'#374151', transition:'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background=dark?'rgba(124,58,237,0.15)':'#ede9fe'; e.currentTarget.style.color='#7c3aed'; e.currentTarget.style.borderColor='#7c3aed'; }}
              onMouseLeave={e => { e.currentTarget.style.background=bgCard; e.currentTarget.style.color=dark?'#d1d5db':'#374151'; e.currentTarget.style.borderColor=dark?'rgba(255,255,255,0.1)':'#e5e7eb'; }}
            >
              <span style={{ fontSize:13, fontWeight:700, color:'#7c3aed', minWidth:16, textAlign:'center' }}>{p.icon}</span>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Constructor de fórmula libre ── */}
      <div>
        <label style={secLabel}>Fórmula personalizada</label>

        {/* Celdas disponibles como chips clicables */}
        <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:8 }}>
          {celdas.map(c => (
            <button key={c.id} onClick={() => insertarEnFormula(c.id)}
              style={{ padding:'4px 10px', borderRadius:7, border:`1px solid ${dark?'rgba(124,58,237,0.3)':'#c4b5fd'}`, background:dark?'rgba(124,58,237,0.12)':'#f5f3ff', color:'#7c3aed', fontSize:11, fontWeight:700, fontFamily:'monospace', cursor:'pointer' }}
              title={`Insertar ${c.id} (${c.nombre})`}>
              {c.id} <span style={{ fontFamily:'Inter,sans-serif', fontWeight:400, color:dark?'#9ca3af':'#6b7280', marginLeft:4 }}>{c.nombre}</span>
            </button>
          ))}
        </div>

        {/* Teclado de símbolos */}
        <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:8 }}>
          {SIMBOLOS.map(({ s, label }) => (
            <button key={s} onClick={() => insertarEnFormula(s)}
              style={{ width:36, height:32, borderRadius:7, border:`1px solid ${dark?'rgba(255,255,255,0.1)':'#e5e7eb'}`, background:bgCard, color:dark?'#f3f4f6':'#111827', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'monospace', transition:'all 0.12s' }}
              onMouseEnter={e => { e.currentTarget.style.background='#7c3aed'; e.currentTarget.style.color='white'; e.currentTarget.style.borderColor='#7c3aed'; }}
              onMouseLeave={e => { e.currentTarget.style.background=bgCard; e.currentTarget.style.color=dark?'#f3f4f6':'#111827'; e.currentTarget.style.borderColor=dark?'rgba(255,255,255,0.1)':'#e5e7eb'; }}
            >
              {label}
            </button>
          ))}
          {/* Borrar último caracter */}
          <button onClick={() => updateCfg('formula', formula.slice(0,-1))}
            style={{ width:36, height:32, borderRadius:7, border:`1px solid ${dark?'rgba(239,68,68,0.3)':'#fecaca'}`, background:dark?'rgba(239,68,68,0.1)':'#fef2f2', color:'#ef4444', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.12s' }}>
            ⌫
          </button>
          {/* Limpiar todo */}
          <button onClick={() => updateCfg('formula', '')}
            style={{ padding:'0 10px', height:32, borderRadius:7, border:`1px solid ${dark?'rgba(239,68,68,0.3)':'#fecaca'}`, background:dark?'rgba(239,68,68,0.1)':'#fef2f2', color:'#ef4444', fontSize:10, fontWeight:600, cursor:'pointer', transition:'all 0.12s' }}>
            Limpiar
          </button>
        </div>

        {/* Input de fórmula */}
        <div style={{ position:'relative' }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:14, fontWeight:700, color:'#7c3aed', fontFamily:'monospace', pointerEvents:'none' }}>=</span>
          <input
            ref={formulaRef}
            value={formula}
            onChange={e => updateCfg('formula', e.target.value)}
            placeholder="A1 + B1 * 0.16"
            style={{ ...inputS, paddingLeft:26, fontFamily:'monospace', fontSize:13, letterSpacing:'0.02em' }}
          />
        </div>
      </div>

      {/* ── Preview del resultado ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderRadius:10, background:dark?'rgba(124,58,237,0.1)':'#f5f3ff', border:`1px solid ${dark?'rgba(124,58,237,0.25)':'#c4b5fd'}` }}>
        <div>
          <p style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em', margin:0 }}>Vista previa del resultado</p>
          <p style={{ fontSize:11, color:dark?'#9ca3af':'#6b7280', margin:'2px 0 0', fontFamily:'monospace' }}>
            {formula || '—'} {formula && celdas.some(c=>c.valor) ? `= ${preview}` : ''}
          </p>
        </div>
        <div style={{ textAlign:'right' }}>
          <p style={{ fontSize:22, fontWeight:800, color:'#7c3aed', margin:0, fontFamily:'monospace' }}>{preview}</p>
          <p style={{ fontSize:10, color:'#9ca3af', margin:0 }}>con valores de prueba</p>
        </div>
      </div>
    </div>
  );
}
// ── Tabs Configurar / Vista previa por campo ──────────────────────────────
function TabsCampo({ campo, onUpdate, dark, inputS, agregarOpcion, editarOpcion, quitarOpcion }) {
  const [tab, setTab] = useState('config');
  const [previewVal, setPreviewVal] = useState(null);

  const borderColor = dark ? 'rgba(255,255,255,0.06)' : '#f3f4f6';

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display:'flex', borderBottom:`1px solid ${dark?'rgba(255,255,255,0.08)':'#e5e7eb'}`, padding:'0 16px' }}>
        {[{key:'config',label:'Configurar'},{key:'preview',label:'Vista previa'}].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding:'8px 14px', border:'none', background:'transparent', cursor:'pointer', fontSize:11, fontWeight:tab===t.key?700:400, color:tab===t.key?'#7c3aed':(dark?'#6b7280':'#9ca3af'), borderBottom:tab===t.key?'2px solid #7c3aed':'2px solid transparent', textTransform:'uppercase', letterSpacing:'0.06em', transition:'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Panel configuración */}
      {tab === 'config' && (
        <div style={{ padding:'4px 16px 16px', display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:10, alignItems:'end', marginTop:8 }}>
            <div>
              <label style={{ fontSize:10, fontWeight:700, color:'#9ca3af', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.08em' }}>Etiqueta del campo</label>
              <input value={campo.label} onChange={e => onUpdate({...campo, label:e.target.value})}
                placeholder="¿Qué quieres preguntar?" style={inputS} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
              <label style={{ fontSize:9, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em' }}>Req.</label>
              <button onClick={() => onUpdate({...campo, requerido:!campo.requerido})}
                style={{ width:42, height:23, borderRadius:12, border:'none', cursor:'pointer', position:'relative', background:campo.requerido?'#7c3aed':'#e5e7eb', transition:'background 0.2s', flexShrink:0 }}>
                <div style={{ width:17, height:17, borderRadius:'50%', background:'white', position:'absolute', top:3, left:campo.requerido?21:3, transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize:10, fontWeight:700, color:'#9ca3af', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.08em' }}>Placeholder</label>
            <input value={campo.placeholder} onChange={e => onUpdate({...campo,placeholder:e.target.value})}
              placeholder="Texto de ayuda..." style={inputS} />
          </div>

          {/* Opciones */}
          {['selector','radio','multiple'].includes(campo.type) && (
            <div>
              <label style={{ fontSize:10, fontWeight:700, color:'#9ca3af', display:'block', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.08em' }}>Opciones</label>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {(campo.opciones||[]).map((op,i) => (
                  <div key={i} style={{ display:'flex', gap:6, alignItems:'center' }}>
                    <div style={{ width:16, height:16, borderRadius:campo.type==='radio'?'50%':'4px', border:`2px solid ${dark?'rgba(255,255,255,0.3)':'#d1d5db'}`, flexShrink:0 }} />
                    <input value={op} onChange={e => editarOpcion(i,e.target.value)} style={{...inputS,flex:1}} placeholder={`Opción ${i+1}`} />
                    <button onClick={() => quitarOpcion(i)}
                      style={{ width:26,height:26,borderRadius:6,border:'none',background:'transparent',cursor:'pointer',color:'#9ca3af',display:'flex',alignItems:'center',justifyContent:'center' }}>
                      <svg viewBox="0 0 24 24" style={{width:12,height:12}} fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ))}
                <button onClick={agregarOpcion}
                  style={{ display:'flex',alignItems:'center',gap:6,padding:'6px 10px',borderRadius:8,border:`1px dashed ${dark?'rgba(255,255,255,0.2)':'#d1d5db'}`,background:'transparent',color:'#9ca3af',fontSize:12,cursor:'pointer' }}>
                  + Agregar opción
                </button>
              </div>
            </div>
          )}

          {/* Tabla — info fija */}
          {campo.type === 'tabla' && (
            <div style={{ padding:'10px 12px', borderRadius:10, background:dark?'rgba(124,58,237,0.08)':'#f5f3ff', border:`1px solid ${dark?'rgba(124,58,237,0.2)':'#c4b5fd'}` }}>
              <p style={{ fontSize:11, color:'#7c3aed', margin:0, fontWeight:600 }}>Tabla de compras — columnas fijas</p>
              <p style={{ fontSize:10, color:dark?'#9ca3af':'#6b7280', margin:'4px 0 0', lineHeight:1.5 }}>
                Artículo · Descripción · Unidad · URL · Cantidad · Costo unitario · Total (auto)
              </p>
            </div>
          )}

          {/* Dependiente */}
          {campo.type === 'dependiente' && (
            <div>
              <label style={{ fontSize:10, fontWeight:700, color:'#9ca3af', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.08em' }}>Niveles (uno por línea)</label>
              <textarea value={(campo.configuracion?.niveles||[]).join('\n')}
                onChange={e => onUpdate({...campo,configuracion:{...campo.configuracion,niveles:e.target.value.split('\n')}})}
                rows={3} placeholder="Estado&#10;Municipio&#10;Colonia"
                style={{...inputS,resize:'none'}} />
            </div>
          )}

          {/* Campo calculado */}
          {campo.type === 'calculado' && (
            <FormulaEditor campo={campo} onUpdate={onUpdate} dark={dark} inputS={inputS} />
          )}
        </div>
      )}

      {/* Panel vista previa */}
      {tab === 'preview' && (
        <div style={{ padding:'16px' }}>
          {campo.label && (
            <p style={{ fontSize:11, fontWeight:700, color:dark?'#9ca3af':'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>
              {campo.label}{campo.requerido && <span style={{ color:'#ef4444', marginLeft:3 }}>*</span>}
            </p>
          )}
          {campo.placeholder && !['checkbox'].includes(campo.type) && (
            <p style={{ fontSize:11, color:dark?'#6b7280':'#9ca3af', marginBottom:8, fontStyle:'italic' }}>{campo.placeholder}</p>
          )}
          <CampoResponder
            campo={campo}
            valor={previewVal}
            onChange={setPreviewVal}
            todosLosValores={{}}
            todosCampos={[campo]}
          />
          {previewVal !== null && previewVal !== undefined && previewVal !== '' && (
            <p style={{ fontSize:10, color:'#7c3aed', marginTop:8, fontFamily:'monospace' }}>
              Valor: {typeof previewVal === 'object' ? JSON.stringify(previewVal) : String(previewVal)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Editor de un campo individual ─────────────────────────────────────────
function CampoEditor({
  campo,
  onUpdate,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDrop,
  dark,
  expandido,
  onToggle,
  isDragging,
}) {

  const inputS = {
    width:'100%', padding:'8px 12px', fontSize:13, borderRadius:8,
    background: dark ? 'rgba(255,255,255,0.06)' : '#f9fafb',
    border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : '#e5e7eb'}`,
    color: dark ? '#f3f4f6' : '#111827',
    outline:'none', fontFamily:'Inter,sans-serif', boxSizing:'border-box',
  };

  const agregarOpcion = () => onUpdate({ ...campo, opciones:[...(campo.opciones||[]), `Opción ${(campo.opciones||[]).length+1}`] });
  const editarOpcion  = (i,v) => { const ops=[...(campo.opciones||[])]; ops[i]=v; onUpdate({...campo,opciones:ops}); };
  const quitarOpcion  = (i)   => { const ops=[...(campo.opciones||[])]; ops.splice(i,1); onUpdate({...campo,opciones:ops}); };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{
        background: dark ? '#1e1e28' : 'white',
        borderRadius: 14,
        border: `2px solid ${expandido ? '#7c3aed' : (dark ? 'rgba(255,255,255,0.08)' : '#e5e7eb')}`,
        overflow: 'hidden',
        flexShrink: 0,
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease, transform 0.2s ease',
        boxShadow: expandido ? '0 4px 20px rgba(124,58,237,0.12)' : 'none',
        opacity: isDragging ? 0.45 : 1,
        cursor: 'grab',
      }}
    >
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', cursor:'pointer', userSelect:'none' }}
        onClick={onToggle}>
        <div style={{ width:34, height:34, borderRadius:9, background: dark?'rgba(124,58,237,0.2)':'#ede9fe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          {TIPO_ICONS[campo.type] || <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke="#7c3aed" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontSize:13, fontWeight:700, color: campo.label ? (dark?'#f3f4f6':'#111827') : '#9ca3af', margin:0, fontStyle: campo.label?'normal':'italic', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {campo.label || 'Sin título'}
          </p>
          <p style={{ fontSize:11, color:'#9ca3af', margin:0 }}>
            {TIPOS_CAMPO.flatMap(g=>g.items).find(t=>t.type===campo.type)?.label || campo.type}
          </p>
        </div>
        <div style={{ display:'flex', gap:4 }} onClick={e => e.stopPropagation()}>
          <button onClick={onMoveUp}
            title="Subir campo"
            style={{ width:30, height:30, borderRadius:8, border:'none', background:dark?'rgba(255,255,255,0.06)':'#f3f4f6', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke={dark?'#9ca3af':'#6b7280'} strokeWidth="2.4">
              <polyline points="18,15 12,9 6,15"/>
            </svg>
          </button>

          <button onClick={onMoveDown}
            title="Bajar campo"
            style={{ width:30, height:30, borderRadius:8, border:'none', background:dark?'rgba(255,255,255,0.06)':'#f3f4f6', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke={dark?'#9ca3af':'#6b7280'} strokeWidth="2.4">
              <polyline points="6,9 12,15 18,9"/>
            </svg>
          </button>

          <button onClick={() => onDuplicate(campo)}
            style={{ width:30, height:30, borderRadius:8, border:'none', background:dark?'rgba(255,255,255,0.06)':'#f3f4f6', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke={dark?'#9ca3af':'#6b7280'} strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
          </button>
          <button onClick={() => onDelete(campo.id)}
            style={{ width:30, height:30, borderRadius:8, border:'none', background:dark?'rgba(239,68,68,0.15)':'#fee2e2', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke="#ef4444" strokeWidth="2">
              <polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14H6L5,6"/><path d="M10,11v6M14,11v6"/>
            </svg>
          </button>
        </div>
        <svg viewBox="0 0 24 24" style={{ width:16, height:16, color:'#9ca3af', flexShrink:0, transform: expandido?'rotate(180deg)':'none', transition:'transform 0.2s' }} fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6,9 12,15 18,9"/>
        </svg>
      </div>

{/* Body expandible */}
      <div style={{
        display: 'grid',
        gridTemplateRows: expandido ? '1fr' : '0fr',
        transition: 'grid-template-rows 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{
            borderTop: expandido ? `1px solid ${dark?'rgba(255,255,255,0.06)':'#f3f4f6'}` : 'none',
            opacity: expandido ? 1 : 0,
            transition: 'opacity 0.2s ease',
          }}>
            {/* Tabs Configurar / Vista previa */}
            <TabsCampo campo={campo} onUpdate={onUpdate} dark={dark} inputS={inputS}
              agregarOpcion={agregarOpcion} editarOpcion={editarOpcion} quitarOpcion={quitarOpcion} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Constructor principal ──────────────────────────────────────────────────
export default function FormularioConstructor({ camposIniciales = [], onChange }) {
  const dark = useThemeStore((s) => s.isDark);

  const normalizarCampos = (entrada) => {
    if (Array.isArray(entrada)) return entrada;

    if (typeof entrada === 'string') {
      try {
        const parsed = JSON.parse(entrada);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    return [];
  };

  // ── Estados ──
  const [campos,      setCampos]      = useState(() => normalizarCampos(camposIniciales));
  const [expandidoId, setExpandidoId] = useState(null);
  const [draggingId,  setDraggingId]  = useState(null);

  // Sincronizar cuando entran campos del formulario en modo edición
  React.useEffect(() => {
    const normalizados = normalizarCampos(camposIniciales);
    setCampos(normalizados);
  }, [camposIniciales]);

  const notify = (nuevos) => {
    setCampos(nuevos);
    onChange?.(nuevos); // solo manda el array de campos
  };

  const agregarCampo = (type) => {
    const nuevo  = CAMPO_DEFAULT(type, campos.length);
    const nuevos = [...campos, nuevo];
    setExpandidoId(nuevo.id);
    notify(nuevos);
  };

  const actualizarCampo = (campo) => {
    notify(campos.map(c => c.id === campo.id ? campo : c));
  };

  const eliminarCampo = (id) => {
    setExpandidoId(null);
    notify(campos.filter(c => c.id !== id));
  };

  const duplicarCampo = (campo) => {
    const nuevo  = { ...campo, id:`campo_${Date.now()}`, label:campo.label+' (copia)' };
    const idx    = campos.findIndex(c => c.id === campo.id);
    notify([...campos.slice(0,idx+1), nuevo, ...campos.slice(idx+1)]);
  };

  const reordenarCampos = (lista) => {
    return lista.map((campo, index) => ({
      ...campo,
      orden: index,
    }));
  };

  const moverCampo = (id, direccion) => {
    const index = campos.findIndex(c => c.id === id);
    if (index === -1) return;

    const nuevoIndex = index + direccion;
    if (nuevoIndex < 0 || nuevoIndex >= campos.length) return;

    const copia = [...campos];
    const [movido] = copia.splice(index, 1);
    copia.splice(nuevoIndex, 0, movido);

    notify(reordenarCampos(copia));
  };

  const handleDragStart = (id) => {
    setDraggingId(id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (targetId) => {
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      return;
    }

    const origenIndex = campos.findIndex(c => c.id === draggingId);
    const destinoIndex = campos.findIndex(c => c.id === targetId);

    if (origenIndex === -1 || destinoIndex === -1) {
      setDraggingId(null);
      return;
    }

    const copia = [...campos];
    const [movido] = copia.splice(origenIndex, 1);
    copia.splice(destinoIndex, 0, movido);

    notify(reordenarCampos(copia));
    setDraggingId(null);
  };
  const cardBg = dark ? '#18181f' : 'white';
  const border = dark ? 'rgba(255,255,255,0.08)' : '#e5e7eb';
  const text   = dark ? '#f9fafb' : '#111827';
  const textM  = dark ? '#9ca3af' : '#6b7280';

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 256px', gap:16, height:'100%' }}>

      {/* ── Canvas de campos con scroll propio ── */}
      <div style={{
        overflowY: 'auto',
        overflowX: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        paddingRight: 4,
        paddingBottom: 24,
      }}>
        {campos.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, background:cardBg, borderRadius:16, border:`2px dashed ${border}`, minHeight:300 }}>
            <div style={{ width:52,height:52,borderRadius:14,background:dark?'rgba(124,58,237,0.15)':'#ede9fe',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:14 }}>
              <svg viewBox="0 0 24 24" style={{width:24,height:24}} fill="none" stroke="#7c3aed" strokeWidth="1.8"><path d="M12 5v14M5 12h14"/></svg>
            </div>
            <p style={{ fontSize:14, fontWeight:600, color:textM, margin:0 }}>Agrega campos desde el panel derecho</p>
            <p style={{ fontSize:12, color:dark?'#4b5563':'#9ca3af', marginTop:6 }}>Haz clic en cualquier tipo para comenzar</p>
          </div>
        ) : (
            
            campos.map((c) => (
              <CampoEditor
                key={c.id}
                campo={c}
                dark={dark}
                expandido={expandidoId === c.id}
                isDragging={draggingId === c.id}
                onToggle={() => setExpandidoId(expandidoId === c.id ? null : c.id)}
                onUpdate={actualizarCampo}
                onDelete={(id) => { eliminarCampo(id); setExpandidoId(null); }}
                onDuplicate={(campo) => { duplicarCampo(campo); setExpandidoId(null); }}
                onMoveUp={() => moverCampo(c.id, -1)}
                onMoveDown={() => moverCampo(c.id, 1)}
                onDragStart={() => handleDragStart(c.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(c.id)}
              />
            ))
        )}
      </div>

      {/* ── Panel lateral de tipos ── */}
      <div style={{
        background: cardBg,
        borderRadius: 14,
        border: `1px solid ${border}`,
        padding: 14,
        overflowY: 'auto',
        height: '100%',
      }}>
        <p style={{ fontSize:10, fontWeight:700, color:textM, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>
          Tipos de campo
        </p>
        {TIPOS_CAMPO.map(({ grupo, items }) => (
          <div key={grupo} style={{ marginBottom:14 }}>
            <p style={{ fontSize:9, fontWeight:700, color:dark?'#4b5563':'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>{grupo}</p>
            <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
              {items.map(({ type, label }) => (
                <button key={type} onClick={() => agregarCampo(type)}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:9, border:'none', background:'transparent', cursor:'pointer', width:'100%', textAlign:'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = dark?'rgba(124,58,237,0.12)':'#f5f3ff'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width:26,height:26,borderRadius:7,background:dark?'rgba(124,58,237,0.15)':'#ede9fe',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    {TIPO_ICONS[type]}
                  </div>
                  <span style={{ fontSize:12, fontWeight:500, color:text }}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}