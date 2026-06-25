import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/apiClient';

const MONEDAS = [
  { code:'MXN', symbol:'$',  label:'Peso MXN' },
  { code:'USD', symbol:'$',  label:'Dólar USD' },
  { code:'EUR', symbol:'€',  label:'Euro EUR' },
];

const UNIDADES = [
  'piezas','kg','g','lb','oz','lt','ml','m','cm','mm','ft','in','m²','m³','cajas','paquetes','pares','rollos','hrs','días',
];

// ── Campo individual ───────────────────────────────────────────────────────
export function CampoResponder({ campo, valor, onChange, todosLosValores = {}, todosCampos = [], formulario }) {
  const dark = useThemeStore((s) => s.isDark);
  const [moneda,   setMoneda]   = useState('MXN');
  const [showPass, setShowPass] = useState(false);
  const sigCanvas = useRef(null);
  const dibujando = useRef(false);
  const [firmando, setFirmando] = useState(false);

  const base = {
    width:'100%', padding:'11px 14px', fontSize:14, borderRadius:10,
    background: dark?'rgba(255,255,255,0.06)':'#f9fafb',
    border:`1.5px solid ${dark?'rgba(255,255,255,0.12)':'#e5e7eb'}`,
    color: dark?'#f3f4f6':'#111827', outline:'none',
    fontFamily:'Inter,sans-serif', boxSizing:'border-box',
    transition:'border-color 0.15s, box-shadow 0.15s',
  };
  const onFocus = (e) => { e.target.style.borderColor='#7c3aed'; e.target.style.boxShadow='0 0 0 3px rgba(124,58,237,0.1)'; };
  const onBlur  = (e) => { e.target.style.borderColor=dark?'rgba(255,255,255,0.12)':'#e5e7eb'; e.target.style.boxShadow='none'; };

  switch (campo.type) {

    // ── Texto corto ──────────────────────────────────────────────────────
    case 'texto_corto':
      return <input value={valor||''} onChange={e=>onChange(e.target.value)}
        placeholder={campo.placeholder||'Escribe aquí...'} style={base} onFocus={onFocus} onBlur={onBlur} />;

    // ── Texto largo ──────────────────────────────────────────────────────
    case 'texto_largo':
      return <textarea value={valor||''} onChange={e=>onChange(e.target.value)}
        placeholder={campo.placeholder||'Escribe aquí...'} rows={4}
        style={{...base,resize:'vertical'}} onFocus={onFocus} onBlur={onBlur} />;

    // ── Correo — partes separadas ────────────────────────────────────────
    case 'email': {
      const parts  = (valor||'').split('@');
      const user   = parts[0] || '';
      const domain = parts[1] || '';
      return (
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <input value={user} onChange={e => onChange(`${e.target.value}@${domain}`)}
            placeholder="nombre" style={{...base, flex:1}} onFocus={onFocus} onBlur={onBlur} />
          <span style={{ fontSize:18, fontWeight:700, color:'#9ca3af', flexShrink:0 }}>@</span>
          <input value={domain} onChange={e => onChange(`${user}@${e.target.value}`)}
            placeholder="dominio.com" style={{...base, flex:1}} onFocus={onFocus} onBlur={onBlur} />
        </div>
      );
    }

    // ── Teléfono — solo números ──────────────────────────────────────────
    case 'telefono':
      return <input value={valor||''} onChange={e => onChange(e.target.value.replace(/\D/g,''))}
        placeholder="+52 668 000 0000" maxLength={15} inputMode="tel"
        style={base} onFocus={onFocus} onBlur={onBlur} />;

    // ── URL — con botón de ir + copiar ───────────────────────────────────
    case 'url': {
      const [copiado, setCopiado] = useState(false);
      const copiar = () => {
        navigator.clipboard.writeText(valor||'');
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      };
      return (
        <div style={{ display:'flex', gap:6 }}>
          <input value={valor||''} onChange={e=>onChange(e.target.value)}
            placeholder="https://ejemplo.com" type="url"
            style={{...base,flex:1}} onFocus={onFocus} onBlur={onBlur} />
          {valor && (
            <>
              <a href={valor} target="_blank" rel="noreferrer"
                style={{ display:'flex',alignItems:'center',justifyContent:'center',width:40,height:42,borderRadius:10,background:'#7c3aed',color:'white',textDecoration:'none',flexShrink:0 }}
                title="Abrir URL">
                <svg viewBox="0 0 24 24" style={{width:16,height:16}} fill="none" stroke="white" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                  <polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
              <button onClick={copiar}
                style={{ display:'flex',alignItems:'center',justifyContent:'center',width:40,height:42,borderRadius:10,border:`1.5px solid ${dark?'rgba(255,255,255,0.12)':'#e5e7eb'}`,background:copiado?'#dcfce7':'transparent',color:copiado?'#16a34a':'#9ca3af',cursor:'pointer',flexShrink:0,transition:'all 0.2s' }}
                title="Copiar URL">
                {copiado
                  ? <svg viewBox="0 0 24 24" style={{width:15,height:15}} fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>
                  : <svg viewBox="0 0 24 24" style={{width:15,height:15}} fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                }
              </button>
            </>
          )}
        </div>
      );
    }

    // ── Número — solo dígitos ────────────────────────────────────────────
    case 'numero':
      return <input type="number" value={valor||''} onChange={e=>onChange(e.target.value)}
        placeholder={campo.placeholder||'0'} inputMode="numeric"
        style={base} onFocus={onFocus} onBlur={onBlur}
        onKeyDown={e => { if(['-','e','E','+'].includes(e.key)) e.preventDefault(); }} />;

    // ── Moneda — símbolo + monto + selector tipo ─────────────────────────
    case 'moneda': {
      const mon = MONEDAS.find(m=>m.code===moneda) || MONEDAS[0];
      return (
        <div style={{ display:'flex', gap:6 }}>
          <div style={{ position:'relative', flex:1 }}>
            <span style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',fontSize:15,fontWeight:700,color:'#9ca3af',pointerEvents:'none' }}>{mon.symbol}</span>
            <input type="number" value={valor||''} onChange={e=>onChange(e.target.value)}
              placeholder="0.00" inputMode="decimal"
              style={{...base,paddingLeft:28}} onFocus={onFocus} onBlur={onBlur}
              onKeyDown={e => { if(['-','e','E','+'].includes(e.key)) e.preventDefault(); }} />
          </div>
          <select value={moneda} onChange={e=>setMoneda(e.target.value)}
            style={{...base, width:120, flex:'none', padding:'11px 8px', cursor:'pointer'}}>
            {MONEDAS.map(m=><option key={m.code} value={m.code}>{m.label}</option>)}
          </select>
        </div>
      );
    }

    // ── Porcentaje — input + barra de progreso animada ───────────────────
    case 'porcentaje': {
      const pct = Math.min(100, Math.max(0, parseFloat(valor)||0));
      return (
        <div>
          <div style={{ position:'relative', marginBottom:10 }}>
            <input type="number" value={valor||''} onChange={e=>onChange(e.target.value)}
              placeholder="0" min={0} max={100} inputMode="numeric"
              style={{...base,paddingRight:32}}
              onFocus={onFocus} onBlur={onBlur}
              onKeyDown={e => { if(['-','e','E','+'].includes(e.key)) e.preventDefault(); }} />
            <span style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',fontSize:14,fontWeight:700,color:'#9ca3af',pointerEvents:'none' }}>%</span>
          </div>
          {/* Barra animada */}
          <div style={{ height:10, borderRadius:99, background:dark?'rgba(255,255,255,0.08)':'#e5e7eb', overflow:'hidden', position:'relative' }}>
            <motion.div
              initial={{ width:0 }}
              animate={{ width:`${pct}%` }}
              transition={{ duration:0.5, ease:'easeOut' }}
              style={{ height:'100%', borderRadius:99,
                background: pct>=80?'linear-gradient(90deg,#7c3aed,#ec4899)':pct>=50?'linear-gradient(90deg,#7c3aed,#6d28d9)':'linear-gradient(90deg,#a78bfa,#7c3aed)',
              }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
            <span style={{ fontSize:10, color:'#9ca3af' }}>0%</span>
            <span style={{ fontSize:11, fontWeight:700, color:'#7c3aed' }}>{pct}%</span>
            <span style={{ fontSize:10, color:'#9ca3af' }}>100%</span>
          </div>
        </div>
      );
    }

    // ── Fecha ────────────────────────────────────────────────────────────
    case 'fecha':
      return (
        <div style={{ position:'relative' }}>
          <input type="date" value={valor||''} onChange={e=>onChange(e.target.value)}
            style={{...base, paddingRight:40, colorScheme: dark?'dark':'light'}} onFocus={onFocus} onBlur={onBlur} />
          <svg viewBox="0 0 24 24" style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',width:17,height:17,pointerEvents:'none',color:'#9ca3af' }} fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
      );

    // ── Hora ─────────────────────────────────────────────────────────────
    case 'hora':
      return (
        <div style={{ position:'relative' }}>
          <input type="time" value={valor||''} onChange={e=>onChange(e.target.value)}
            style={{...base, paddingRight:40, colorScheme: dark?'dark':'light'}} onFocus={onFocus} onBlur={onBlur} />
          <svg viewBox="0 0 24 24" style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',width:17,height:17,pointerEvents:'none',color:'#9ca3af' }} fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
          </svg>
        </div>
      );

    // ── Fecha y hora ─────────────────────────────────────────────────────
    case 'fecha_hora':
      return (
        <div style={{ position:'relative' }}>
          <input type="datetime-local" value={valor||''} onChange={e=>onChange(e.target.value)}
            style={{...base, paddingRight:40, colorScheme: dark?'dark':'light'}} onFocus={onFocus} onBlur={onBlur} />
          <svg viewBox="0 0 24 24" style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',width:17,height:17,pointerEvents:'none',color:'#9ca3af' }} fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="12,14 12,16.5 14,16.5"/>
          </svg>
        </div>
      );

    // ── Selector ─────────────────────────────────────────────────────────
    case 'selector':
      return (
        <select value={valor||''} onChange={e=>onChange(e.target.value)}
          style={{...base,cursor:'pointer',colorScheme:dark?'dark':'light'}} onFocus={onFocus} onBlur={onBlur}>
          <option value="">{campo.placeholder||'Seleccionar...'}</option>
          {(campo.opciones||[]).map((op,i)=><option key={i} value={op}>{op}</option>)}
        </select>
      );

    // ── Opción única (radio visual) ───────────────────────────────────────
    case 'radio':
      return (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {(campo.opciones||[]).map((op,i)=>{
            const sel = valor===op;
            return (
              <button key={i} onClick={()=>onChange(op)} type="button"
                style={{ display:'flex',alignItems:'center',gap:12,padding:'11px 14px',borderRadius:10,border:`1.5px solid ${sel?'#7c3aed':(dark?'rgba(255,255,255,0.1)':'#e5e7eb')}`,background:sel?(dark?'rgba(124,58,237,0.15)':'#f5f3ff'):'transparent',cursor:'pointer',textAlign:'left',transition:'all 0.15s' }}>
                <div style={{ width:20,height:20,borderRadius:'50%',border:`2px solid ${sel?'#7c3aed':'#d1d5db'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,background:sel?'#7c3aed':'transparent',transition:'all 0.15s' }}>
                  {sel&&<div style={{ width:7,height:7,borderRadius:'50%',background:'white' }}/>}
                </div>
                <span style={{ fontSize:13,fontWeight:sel?600:400,color:sel?'#7c3aed':(dark?'#f3f4f6':'#374151') }}>{op}</span>
              </button>
            );
          })}
        </div>
      );

    // ── Casilla — múltiples checks ────────────────────────────────────────
    case 'checkbox': {
      const selArr = Array.isArray(valor) ? valor : [];
      return (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {(campo.opciones||['Sí','No']).map((op,i)=>{
            const sel = selArr.includes(op);
            return (
              <button key={i} onClick={()=>{ const n=sel?selArr.filter(x=>x!==op):[...selArr,op]; onChange(n); }} type="button"
                style={{ display:'flex',alignItems:'center',gap:12,padding:'11px 14px',borderRadius:10,border:`1.5px solid ${sel?'#7c3aed':(dark?'rgba(255,255,255,0.1)':'#e5e7eb')}`,background:sel?(dark?'rgba(124,58,237,0.15)':'#f5f3ff'):'transparent',cursor:'pointer',textAlign:'left',transition:'all 0.15s' }}>
                <div style={{ width:20,height:20,borderRadius:6,border:`2px solid ${sel?'#7c3aed':'#d1d5db'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,background:sel?'#7c3aed':'transparent',transition:'all 0.15s' }}>
                  {sel&&<svg viewBox="0 0 24 24" style={{width:11,height:11}} fill="none" stroke="white" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>}
                </div>
                <span style={{ fontSize:13,fontWeight:sel?600:400,color:sel?'#7c3aed':(dark?'#f3f4f6':'#374151') }}>{op}</span>
              </button>
            );
          })}
        </div>
      );
    }

    // ── Selección múltiple (visual distinta a checkbox) ───────────────────
    case 'multiple': {
      const selArr = Array.isArray(valor) ? valor : [];
      return (
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {(campo.opciones||[]).map((op,i)=>{
            const sel = selArr.includes(op);
            return (
              <button key={i} onClick={()=>{ const n=sel?selArr.filter(x=>x!==op):[...selArr,op]; onChange(n); }} type="button"
                style={{ padding:'8px 16px',borderRadius:20,border:`1.5px solid ${sel?'#7c3aed':(dark?'rgba(255,255,255,0.12)':'#e5e7eb')}`,background:sel?'#7c3aed':'transparent',color:sel?'white':(dark?'#d1d5db':'#374151'),fontSize:13,fontWeight:sel?600:400,cursor:'pointer',transition:'all 0.15s',display:'flex',alignItems:'center',gap:6 }}>
                {sel&&<svg viewBox="0 0 24 24" style={{width:12,height:12}} fill="none" stroke="white" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>}
                {op}
              </button>
            );
          })}
        </div>
      );
    }

    // ── Archivo — dropzone ────────────────────────────────────────────────
    case 'archivo': {
      const [dragging, setDragging] = useState(false);
      const fileRef = useRef(null);
      const archivos = Array.isArray(valor) ? valor : [];

      const fileToDataUrl = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const procesar = async (files) => {
        const nuevos = [...archivos];

        for (const f of Array.from(files)) {
          if (f.type.startsWith('video/')) continue;

          const formData = new FormData();
          formData.append('archivo', f);

          const { data } = await api.post(
            `/formularios/${formulario.id}/respuestas/archivo`,
            formData,
            {
              headers: { 'Content-Type': 'multipart/form-data' },
              timeout: 60000,
            }
          );

          if (!data?.success) {
            throw new Error(data?.message || 'No se pudo subir el archivo');
          }

          nuevos.push(data.data);
        }

        onChange(nuevos);
      };

      return (
        <div>
          <div
            onClick={()=>fileRef.current?.click()}
            onDragOver={e=>{e.preventDefault();setDragging(true);}}
            onDragLeave={()=>setDragging(false)}
            onDrop={e=>{e.preventDefault();setDragging(false);procesar(e.dataTransfer.files);}}
            style={{ border:`2px dashed ${dragging?'#7c3aed':(dark?'rgba(255,255,255,0.15)':'#d1d5db')}`,borderRadius:12,padding:'28px 20px',textAlign:'center',cursor:'pointer',background:dragging?(dark?'rgba(124,58,237,0.1)':'#f5f3ff'):'transparent',transition:'all 0.2s' }}>
            <div style={{ width:44,height:44,borderRadius:12,background:dark?'rgba(124,58,237,0.15)':'#ede9fe',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 10px' }}>
              <svg viewBox="0 0 24 24" style={{width:22,height:22}} fill="none" stroke="#7c3aed" strokeWidth="1.8">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <p style={{ fontSize:13,fontWeight:600,color:dark?'#d1d5db':'#374151',margin:0 }}>Arrastra archivos aquí o haz clic</p>
            <p style={{ fontSize:11,color:'#9ca3af',marginTop:4 }}>PDF, imágenes, documentos (sin videos)</p>
            <input ref={fileRef} type="file" multiple style={{ display:'none' }}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
              onChange={e=>procesar(e.target.files)} />
          </div>
          {archivos.length>0 && (
            <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:6 }}>
              {archivos.map((a,i)=>(
                <div key={i} style={{ display:'flex',alignItems:'center',gap:8,padding:'8px 12px',borderRadius:9,background:dark?'rgba(255,255,255,0.04)':'#f9fafb',border:`1px solid ${dark?'rgba(255,255,255,0.08)':'#e5e7eb'}` }}>
                  <svg viewBox="0 0 24 24" style={{width:14,height:14,flexShrink:0}} fill="none" stroke="#7c3aed" strokeWidth="1.8">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/>
                  </svg>
                  <span style={{ fontSize:12,color:dark?'#d1d5db':'#374151',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{a.nombre}</span>
                  <span style={{ fontSize:10,color:'#9ca3af',flexShrink:0 }}>{a.size?(a.size/1024).toFixed(1)+' KB':''}</span>
                  <button onClick={()=>onChange(archivos.filter((_,j)=>j!==i))} type="button"
                    style={{ width:18,height:18,borderRadius:5,border:'none',background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#9ca3af' }}>
                    <svg viewBox="0 0 24 24" style={{width:11,height:11}} fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // ── Firma digital — canvas táctil ─────────────────────────────────────
    case 'firma': {
      const limpiar = () => {
        const ctx = sigCanvas.current?.getContext('2d');
        if (ctx) { ctx.clearRect(0,0,sigCanvas.current.width,sigCanvas.current.height); }
        onChange(null);
      };
      const guardarFirma = () => {
        if (sigCanvas.current) onChange(sigCanvas.current.toDataURL());
      };

      const getPos = (e) => {
        const canvas = sigCanvas.current;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches?.[0];

        const clientX = touch?.clientX ?? e.clientX;
        const clientY = touch?.clientY ?? e.clientY;

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
          x: (clientX - rect.left) * scaleX,
          y: (clientY - rect.top) * scaleY,
        };
      };

      const startDraw = (e) => {
        e.preventDefault();
        dibujando.current = true;

        const ctx = sigCanvas.current.getContext('2d');
        const pos = getPos(e);

        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      };

      const draw = (e) => {
        e.preventDefault();
        if (!dibujando.current) return;

        const ctx = sigCanvas.current.getContext('2d');
        const pos = getPos(e);

        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#7c3aed';

        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      };

      const endDraw = (e) => {
        e.preventDefault();
        dibujando.current = false;
        guardarFirma();
      };

      return (
        <div>
          <div style={{ position:'relative', borderRadius:12, overflow:'hidden', border:`1.5px solid ${dark?'rgba(255,255,255,0.12)':'#e5e7eb'}`, background:dark?'rgba(255,255,255,0.03)':'#fafafa' }}>
            <canvas
              ref={sigCanvas} width={500} height={180}
              style={{ display:'block', width:'100%', height:180, cursor:'crosshair', touchAction:'none' }}
              onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
              onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
            />
            {!valor && (
              <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none' }}>
                <p style={{ fontSize:13,color:'#9ca3af',userSelect:'none' }}>Dibuja tu firma aquí</p>
              </div>
            )}
          </div>
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            <button onClick={limpiar} type="button"
              style={{ flex:1,padding:'8px',borderRadius:9,border:`1px solid ${dark?'rgba(255,255,255,0.1)':'#e5e7eb'}`,background:'transparent',color:dark?'#d1d5db':'#374151',fontSize:12,cursor:'pointer' }}>
              Limpiar firma
            </button>
            {valor && (
              <div style={{ flex:1,padding:'8px',borderRadius:9,background:dark?'rgba(34,197,94,0.12)':'#dcfce7',border:'1px solid #86efac',display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
                <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>
                <span style={{ fontSize:12,color:'#16a34a',fontWeight:600 }}>Firma guardada</span>
              </div>
            )}
          </div>
        </div>
      );
    }

// ── Tabla de compras ──────────────────────────────────────────────────
    case 'tabla': {
      const COLS_COMPRA = [
        { key:'articulo',   label:'Artículo',         tipo:'texto',  placeholder:'Nombre del artículo' },
        { key:'descripcion',label:'Descripción',       tipo:'texto',  placeholder:'Descripción opcional' },
        { key:'unidad',     label:'Unidad',            tipo:'unidad'  },
        { key:'url',        label:'URL / Referencia',  tipo:'texto',  placeholder:'https://...' },
        { key:'cantidad',   label:'Cantidad',          tipo:'numero', placeholder:'1' },
        { key:'costo',      label:'Costo unitario',    tipo:'numero', placeholder:'0.00' },
        { key:'total',      label:'Total',             tipo:'total'   },
      ];

      const filaVacia = () => Object.fromEntries(
        COLS_COMPRA.map(c => [c.key, c.key === 'unidad' ? 'piezas' : c.key === 'cantidad' ? '1' : ''])
      );

      const filas = Array.isArray(valor) && valor.length > 0 ? valor : [filaVacia()];

      const calcTotal = (fila) => {
        const cant  = parseFloat(fila.cantidad || 0);
        const costo = parseFloat(fila.costo    || 0);
        return isNaN(cant) || isNaN(costo) ? 0 : cant * costo;
      };

      const actualizarFila = (fi, key, val) => {
        const nuevas = filas.map((f, i) => {
          if (i !== fi) return f;
          const nf = { ...f, [key]: val };
          nf.total = calcTotal(nf).toFixed(2);
          return nf;
        });
        onChange(nuevas);
      };

      const agregarFila = () => onChange([...filas, filaVacia()]);
      const eliminarFila = (fi) => onChange(filas.filter((_, i) => i !== fi));

      const totalGeneral = filas.reduce((sum, f) => sum + (parseFloat(f.total || 0)), 0);

      const inputTablaStyle = {
        width:'100%', padding:'7px 8px', fontSize:12, borderRadius:7,
        background:dark?'rgba(255,255,255,0.06)':'#f9fafb',
        border:`1px solid ${dark?'rgba(255,255,255,0.1)':'#e5e7eb'}`,
        color:dark?'#f3f4f6':'#111827', outline:'none', boxSizing:'border-box',
      };

      return (
        <div style={{ borderRadius:12, border:`1px solid ${dark?'rgba(255,255,255,0.08)':'#e5e7eb'}`, overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:760 }}>
              <thead>
                <tr style={{ background:dark?'rgba(124,58,237,0.15)':'#f5f3ff' }}>
                  {COLS_COMPRA.map(c => (
                    <th key={c.key} style={{ padding:'10px 10px', textAlign:'left', fontSize:10, fontWeight:700, color:'#7c3aed', textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap', borderBottom:`1px solid ${dark?'rgba(255,255,255,0.08)':'#e5e7eb'}` }}>
                      {c.label}
                    </th>
                  ))}
                  <th style={{ width:36, borderBottom:`1px solid ${dark?'rgba(255,255,255,0.08)':'#e5e7eb'}` }} />
                </tr>
              </thead>
              <tbody>
                {filas.map((fila, fi) => (
                  <tr key={fi} style={{ borderBottom:`1px solid ${dark?'rgba(255,255,255,0.05)':'#f3f4f6'}` }}>
                    {COLS_COMPRA.map(col => (
                      <td key={col.key} style={{ padding:'4px 5px', verticalAlign:'middle' }}>
                        {col.tipo === 'unidad' ? (
                          <select value={fila.unidad || 'piezas'} onChange={e => actualizarFila(fi, 'unidad', e.target.value)}
                            style={{ ...inputTablaStyle, minWidth:90 }}>
                            {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        ) : col.tipo === 'total' ? (
                          <div style={{ padding:'7px 10px', fontSize:13, fontWeight:800, color:'#7c3aed', background:dark?'rgba(124,58,237,0.1)':'#f5f3ff', borderRadius:7, textAlign:'right', minWidth:80, whiteSpace:'nowrap' }}>
                            ${parseFloat(fila.total || 0).toLocaleString('es-MX', { minimumFractionDigits:2 })}
                          </div>
                        ) : col.tipo === 'numero' ? (
                          <input type="number" value={fila[col.key] || ''} onChange={e => actualizarFila(fi, col.key, e.target.value)}
                            placeholder={col.placeholder} min={0}
                            style={{ ...inputTablaStyle, minWidth:80 }}
                            onKeyDown={e => { if (['-','e','E','+'].includes(e.key)) e.preventDefault(); }} />
                        ) : (
                          <input type="text" value={fila[col.key] || ''} onChange={e => actualizarFila(fi, col.key, e.target.value)}
                            placeholder={col.placeholder}
                            style={{ ...inputTablaStyle, minWidth: col.key === 'url' ? 140 : col.key === 'descripcion' ? 160 : 120 }} />
                        )}
                      </td>
                    ))}
                    <td style={{ padding:'4px 5px', textAlign:'center' }}>
                      <button onClick={() => eliminarFila(fi)} type="button" disabled={filas.length <= 1}
                        style={{ width:26, height:26, borderRadius:7, border:'none', background:filas.length<=1?'transparent':(dark?'rgba(239,68,68,0.12)':'#fee2e2'), cursor:filas.length<=1?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center', opacity:filas.length<=1?0.3:1 }}>
                        <svg viewBox="0 0 24 24" style={{width:11,height:11}} fill="none" stroke="#ef4444" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background:dark?'rgba(255,255,255,0.03)':'#fafafa' }}>
                  <td colSpan={5} style={{ padding:'10px 12px', fontSize:12, fontWeight:700, color:dark?'#9ca3af':'#6b7280', textAlign:'right' }}>
                    TOTAL GENERAL
                  </td>
                  <td colSpan={2} style={{ padding:'10px 12px', fontSize:16, fontWeight:900, color:'#7c3aed', textAlign:'right' }}>
                    ${totalGeneral.toLocaleString('es-MX', { minimumFractionDigits:2 })}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
          <button onClick={agregarFila} type="button"
            style={{ width:'100%', padding:'10px', background:'transparent', border:'none', borderTop:`1px solid ${dark?'rgba(255,255,255,0.06)':'#e5e7eb'}`, color:'#7c3aed', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
            onMouseEnter={e => e.currentTarget.style.background = dark?'rgba(124,58,237,0.08)':'#f5f3ff'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <svg viewBox="0 0 24 24" style={{width:14,height:14}} fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Agregar artículo
          </button>
        </div>
      );
    }

// ── Campo calculado tipo Excel ─────────────────────────────────────────
    case 'formula':
    case 'calculado': {
      const cfg = campo.configuracion || {};
      const formula = cfg.formula || '';
      const celdas = Array.isArray(cfg.celdas) && cfg.celdas.length > 0
        ? cfg.celdas
        : [{ id: 'A1', nombre: 'Campo A' }];

      const valorObj = valor && typeof valor === 'object' && !Array.isArray(valor)
        ? valor
        : {};

      const valoresCeldas = valorObj.celdas || {};

      let expresion = formula;
      celdas.forEach((celda) => {
        const raw = valoresCeldas[celda.id];
        const num = parseFloat(raw || 0);
        const safeNum = Number.isFinite(num) ? num : 0;

        expresion = expresion.replace(
          new RegExp(`\\b${celda.id}\\b`, 'gi'),
          safeNum.toString()
        );
      });

      let resultado = '—';
      let error = false;

      try {
        if (formula && formula.trim() !== '') {
          const limpia = expresion.replace(/[^0-9+\-*/().,\s]/g, '');

          // eslint-disable-next-line no-new-func
          const res = Function(`"use strict"; return (${limpia})`)();

          resultado = Number.isFinite(res)
            ? Number(res.toFixed(4)).toString()
            : 'Error';
        }
      } catch {
        resultado = 'Error';
        error = true;
      }

      const actualizarCelda = (celdaId, nuevoValor) => {
        const nuevoObjeto = {
          celdas: {
            ...valoresCeldas,
            [celdaId]: nuevoValor,
          },
          formula,
          resultado: resultado === 'Error' ? '' : resultado,
        };

        let expresionNueva = formula;

        celdas.forEach((celda) => {
          const raw = celda.id === celdaId ? nuevoValor : nuevoObjeto.celdas[celda.id];
          const num = parseFloat(raw || 0);
          const safeNum = Number.isFinite(num) ? num : 0;

          expresionNueva = expresionNueva.replace(
            new RegExp(`\\b${celda.id}\\b`, 'gi'),
            safeNum.toString()
          );
        });

        try {
          if (formula && formula.trim() !== '') {
            const limpia = expresionNueva.replace(/[^0-9+\-*/().,\s]/g, '');
            // eslint-disable-next-line no-new-func
            const res = Function(`"use strict"; return (${limpia})`)();

            nuevoObjeto.resultado = Number.isFinite(res)
              ? Number(res.toFixed(4)).toString()
              : '';
          }
        } catch {
          nuevoObjeto.resultado = '';
        }

        onChange(nuevoObjeto);
      };

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 10,
            }}
          >
            {celdas.map((celda) => (
              <div key={celda.id}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 5,
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  <span style={{ color: '#7c3aed', fontFamily: 'monospace' }}>
                    {celda.id}
                  </span>
                  {celda.nombre || 'Celda'}
                </label>

                <input
                  type="number"
                  value={valoresCeldas[celda.id] || ''}
                  onChange={(e) => actualizarCelda(celda.id, e.target.value)}
                  placeholder="0"
                  inputMode="decimal"
                  style={base}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  onKeyDown={(e) => {
                    if (['e', 'E', '+'].includes(e.key)) e.preventDefault();
                  }}
                />
              </div>
            ))}
          </div>

          <div
            style={{
              padding: '14px 16px',
              borderRadius: 10,
              background: dark ? 'rgba(124,58,237,0.1)' : '#f5f3ff',
              border: `1.5px solid ${error ? '#ef4444' : dark ? 'rgba(124,58,237,0.3)' : '#c4b5fd'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: 10, color: dark ? '#6b7280' : '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                Fórmula
              </p>

              <span style={{ fontSize: 12, color: dark ? '#9ca3af' : '#6b7280', fontFamily: 'monospace' }}>
                {formula || 'Sin fórmula'}
              </span>
            </div>

            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: 10, color: dark ? '#6b7280' : '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                Resultado
              </p>

              <span style={{ fontSize: 22, fontWeight: 900, color: error ? '#ef4444' : '#7c3aed', fontFamily: 'monospace' }}>
                {resultado}
              </span>
            </div>
          </div>
        </div>
      );
    }

    case 'dependiente':
    case 'folio':
      return null;

    default:
      return null;
  }
}

export default function FormularioResponder({ formulario, respuestaInicial, onSubmit, onCancel, modoPreview = false }) {
  const dark    = useThemeStore((s) => s.isDark);
  const usuario = useAuthStore((s) => s.usuario);

  const [valores,  setValores]  = useState(respuestaInicial?.respuestas || {});
  const [enviando, setEnviando] = useState(false);
  const [errors,   setErrors]   = useState({});

  const ahora = new Date();
const tiposPermitidos = [
    'texto_corto',
    'texto_largo',
    'email',
    'telefono',
    'url',
    'numero',
    'moneda',
    'porcentaje',
    'calculado',
    'fecha',
    'hora',
    'fecha_hora',
    'selector',
    'radio',
    'multiple',
    'archivo',
    'firma',
    'tabla',
  ];

  const camposVisibles = (formulario.campos || []).filter((c) => {
    if (
      !c ||
      !c.id ||
      !c.type ||
      !c.label ||
      c.label.toString().trim() === '' ||
      !tiposPermitidos.includes(c.type)
    ) {
      return false;
    }

    if (['selector', 'radio', 'multiple'].includes(c.type)) {
      return Array.isArray(c.opciones) && c.opciones.some((op) => op && op.toString().trim() !== '');
    }

    return true;
  });

  const setValor = (id, val) => setValores((v) => ({ ...v, [id]: val }));

  const validar = () => {
    const errs = {};

    camposVisibles.forEach((c) => {
      if (c.requerido) {
        const v = valores[c.id];

        if (
          v === undefined ||
          v === null ||
          v === '' ||
          (Array.isArray(v) && !v.length)
        ) {
          errs[c.id] = 'Este campo es requerido';
        }
      }
    });

    setErrors(errs);
    return !Object.keys(errs).length;
  };

const limpiarValorParaBD = (valor) => {
    if (Array.isArray(valor)) {
      return valor.map((item) => {
        if (item && typeof item === 'object') {
          const { _file, ...resto } = item;
          // Para filas de tabla, convertir valores numéricos guardados como string
          return resto;
        }
        return item;
      });
    }

    // Campo calculado — guardar solo el resultado como string limpio
    if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
      if ('resultado' in valor || 'formula' in valor) {
        // Es un campo calculado: guardar el objeto completo sin _file
        const { _file, ...resto } = valor;
        return resto;
      }
      const { _file, ...resto } = valor;
      return resto;
    }

    return valor;
  };
  const handleSubmit = async () => {
    if (!validar()) return;

    try {
      setEnviando(true);

      const respuestasLimpias = Object.fromEntries(
        Object.entries(valores).map(([key, value]) => [
          key,
          limpiarValorParaBD(value),
        ])
      );

      await onSubmit?.(respuestasLimpias);
    } catch (err) {
      console.error('Error enviando respuesta:', err);
    } finally {
      setEnviando(false);
    }
  };

  const esCampoGrande = (campo) => {
    return ['texto_largo', 'archivo', 'firma', 'tabla', 'calculado', 'formula', 'multiple', 'radio'].includes(campo.type);
  };

  const filasCampos = [];
  let filaTemporal = [];

  camposVisibles.forEach((campo) => {
    if (esCampoGrande(campo)) {
      if (filaTemporal.length) {
        filasCampos.push({
          tipo: 'normal',
          campos: filaTemporal,
        });
        filaTemporal = [];
      }

      filasCampos.push({
        tipo: 'grande',
        campos: [campo],
      });

      return;
    }

    filaTemporal.push(campo);

    if (filaTemporal.length === 2) {
      filasCampos.push({
        tipo: 'normal',
        campos: filaTemporal,
      });
      filaTemporal = [];
    }
  });

  if (filaTemporal.length) {
    filasCampos.push({
      tipo: 'normal',
      campos: filaTemporal,
    });
  }

  const bg        = dark ? '#18181f' : 'white';
  const border    = dark ? 'rgba(255,255,255,0.10)' : '#d8c7b0';
  const text      = dark ? '#f9fafb' : '#3b2618';
  const textM     = dark ? '#9ca3af' : '#8a5c3b';
  const sectionBg = dark ? 'rgba(255,255,255,0.025)' : '#fff8dc';

  const nombreUsuario = `${usuario?.nombre || ''} ${usuario?.apellido || ''}`.trim() || usuario?.correo || 'Usuario';
  const inicial = nombreUsuario?.[0]?.toUpperCase() || 'U';

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: 24 }}>
      <div
        style={{
          background: bg,
          borderRadius: 18,
          border: `1px solid ${border}`,
          overflow: 'hidden',
          boxShadow: dark ? '0 20px 60px rgba(0,0,0,0.35)' : '0 18px 50px rgba(92,55,20,0.12)',
        }}
      >
        <div
          style={{
            padding: '22px 28px',
            background: dark ? 'linear-gradient(135deg,#1f1b2e,#18181f)' : 'linear-gradient(135deg,#a7633d,#7a4329)',
            color: 'white',
            display: 'grid',
            gridTemplateColumns: '1fr 280px',
            gap: 18,
            alignItems: 'center',
          }}
        >
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: '-0.03em' }}>
              {formulario.titulo}
            </h2>

            {formulario.descripcion && (
              <p style={{ fontSize: 13, margin: '8px 0 0', opacity: 0.85, lineHeight: 1.5 }}>
                {formulario.descripcion}
              </p>
            )}
          </div>

          <div
            style={{
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.35)',
              padding: 14,
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              minHeight: 96,
              background: 'rgba(255,255,255,0.06)',
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 16,
                overflow: 'hidden',
                background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {usuario?.avatar_url ? (
                <img
                  src={usuario.avatar_url}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>{inicial}</span>
              )}
            </div>

            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {nombreUsuario}
              </p>

              <p style={{ margin: '3px 0 0', fontSize: 11, opacity: 0.8 }}>
                Departamento: {usuario?.departamento_nombre || usuario?.departamento || 'Sin departamento'}
              </p>

              <p style={{ margin: '3px 0 0', fontSize: 11, opacity: 0.8 }}>
                Puesto: {usuario?.puesto || usuario?.rol || 'Sin puesto'}
              </p>

              <p style={{ margin: '6px 0 0', fontSize: 11, fontWeight: 700, opacity: 0.9 }}>
                {ahora.toLocaleDateString('es-MX')} · {ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        <div style={{ padding: 22 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filasCampos.map((fila, filaIndex) => (
              <div
                key={filaIndex}
                style={{
                  display: 'grid',
                  gridTemplateColumns: fila.tipo === 'grande' || fila.campos.length === 1
                    ? '1fr'
                    : 'repeat(2, minmax(0, 1fr))',
                  gap: 14,
                  alignItems: 'stretch',
                }}
              >
                {fila.campos.map((campo) => (
                  <div
                    key={campo.id}
                    style={{
                      background: sectionBg,
                      border: `1px solid ${border}`,
                      borderRadius: 14,
                      padding: 14,
                      minWidth: 0,
                      height: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    {campo.type !== 'checkbox' && (
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                        <label
                          style={{
                            fontSize: 12,
                            fontWeight: 800,
                            color: text,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {campo.label || 'Campo sin título'}
                        </label>

                        {campo.requerido && (
                          <span style={{ color: '#ef4444', fontSize: 13, fontWeight: 800 }}>*</span>
                        )}
                      </div>
                    )}

                    {campo.placeholder && campo.type !== 'checkbox' && (
                      <p style={{ fontSize: 11, color: textM, margin: '0 0 8px', lineHeight: 1.4 }}>
                        {campo.placeholder}
                      </p>
                    )}

<CampoResponder
  campo={campo}
  valor={valores[campo.id]}
  onChange={(v) => setValor(campo.id, v)}
  todosLosValores={valores}
  todosCampos={camposVisibles}
  formulario={formulario}
/>

                    {errors[campo.id] && (
                      <p style={{ fontSize: 11, color: '#ef4444', marginTop: 6, fontWeight: 600 }}>
                        {errors[campo.id]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {!modoPreview && (
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              {onCancel && (
                <button
                  onClick={onCancel}
                  type="button"
                  style={{
                    flex: 1,
                    padding: '13px',
                    borderRadius: 12,
                    border: `1px solid ${border}`,
                    background: 'transparent',
                    color: dark ? '#d1d5db' : '#5c3b26',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
              )}

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={enviando}
                type="button"
                style={{
                  flex: 2,
                  padding: '13px',
                  borderRadius: 12,
                  border: 'none',
                  background: enviando ? '#8b5cf6' : '#7c3aed',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: enviando ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
                }}
              >
                {enviando ? 'Enviando...' : respuestaInicial ? 'Guardar cambios' : 'Enviar respuesta'}
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}