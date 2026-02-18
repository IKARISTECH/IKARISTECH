import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import Cropper from "react-easy-crop";
import Swal from "sweetalert2";
import "../styles/avatarPicker.modal.css";


function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

async function imageSrcFromFile(file){
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function loadImg(src){
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}

async function getCroppedBlob(imageSrc, cropPixels, outSize = 512){
  const img = await loadImg(imageSrc);

  const canvas = document.createElement("canvas");
  canvas.width = outSize;
  canvas.height = outSize;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas ctx");

  // ✅ pinta con alta calidad
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const sx = cropPixels.x;
  const sy = cropPixels.y;
  const sw = cropPixels.width;
  const sh = cropPixels.height;

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outSize, outSize);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
  });
}

export default function AvatarPickerModal({
  open,
  onClose,
  onConfirm, // async (file) => void
  maxMb = 5
}){
  const inputRef = useRef(null);
  const dropRef = useRef(null);

  // ✅ Portal root seguro (evita "Target container is not a DOM element")
  const [portalEl, setPortalEl] = useState(null);

  useEffect(() => {
    // si no hay document (por SSR/hydration raro) no hacemos nada
    if (typeof document === "undefined") return;

    let el = document.getElementById("ik-portal-root");
    if (!el) {
      el = document.createElement("div");
      el.id = "ik-portal-root";
      document.body.appendChild(el);
    }
    setPortalEl(el);

    return () => {
      // no lo removemos para reuso (evita parpadeos)
    };
  }, []);


  const [src, setSrc] = useState("");
  const [fileName, setFileName] = useState("avatar.jpg");

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState(null);
  const [saving, setSaving] = useState(false);

  const canEdit = !!src;

  useEffect(() => {
    if (!open) {
      setSrc("");
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setCroppedPixels(null);
      setSaving(false);
    }
  }, [open]);

  const onPick = async (file) => {
    try{
      if (!file) return;

      const isImg = /^image\//.test(file.type);
      if (!isImg){
        await Swal.fire({ icon: "error", title: "Archivo no válido", text: "Solo imágenes." });
        return;
      }
      if (file.size > maxMb * 1024 * 1024){
        await Swal.fire({ icon: "error", title: "Muy pesada", text: `Máximo ${maxMb}MB.` });
        return;
      }

      const dataUrl = await imageSrcFromFile(file);
      setSrc(dataUrl);
      setFileName(file.name || "avatar.jpg");
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    }catch(e){
      console.warn("[AvatarPickerModal] pick error:", e);
      await Swal.fire({ icon: "error", title: "Error", text: "No se pudo leer la imagen." });
    }finally{
      try{ if (inputRef.current) inputRef.current.value = ""; } catch {}
    }
  };

  const onDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer?.files?.[0];
    await onPick(f);
    dropRef.current?.classList.remove("dragover");
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropRef.current?.classList.add("dragover");
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropRef.current?.classList.remove("dragover");
  };

  const onCropComplete = (_, pixels) => setCroppedPixels(pixels);

  const doConfirm = async () => {
    try{
      if (!src || !croppedPixels) return;

      setSaving(true);

      // ✅ recorta a 512x512 (pro)
      const blob = await getCroppedBlob(src, croppedPixels, 512);
      if (!blob) throw new Error("No blob");

      const safeName = (fileName || "avatar.jpg").toLowerCase();
      const file = new File([blob], safeName.endsWith(".png") ? safeName : "avatar.jpg", { type: "image/jpeg" });

      await onConfirm(file);

      onClose?.();
    }catch(e){
      console.warn("[AvatarPickerModal] confirm error:", e);
      await Swal.fire({ icon: "error", title: "Error", text: "No se pudo guardar el recorte." });
    }finally{
      setSaving(false);
    }
  };

  if (!open) return null;

  // ✅ si aún no existe el contenedor, no intentamos portal
  if (!portalEl) return null;

  return createPortal(
    <div className="ik-apm" role="dialog" aria-modal="true">
      <div className="ik-apm__panel">
        <div className="ik-apm__head">
          <div className="ik-apm__title">Elegir foto de perfil</div>
          <button className="ik-apm__x" type="button" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <div className="ik-apm__body">
          {/* PREVIEW GRANDE = DROPZONE CUANDO NO HAY IMG */}
          <div className="ik-apm__previewBig">
            <div
              ref={dropRef}
              className={`ik-apm__cropWrap ${canEdit ? "hasImg" : "isDrop"}`}
              onClick={() => {
                if (!canEdit) inputRef.current?.click();
              }}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              role={!canEdit ? "button" : undefined}
              tabIndex={!canEdit ? 0 : undefined}
              onKeyDown={(e) => {
                if (!canEdit && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  inputRef.current?.click();
                }
              }}
              title={!canEdit ? "Subir foto" : undefined}
            >
              {/* ✅ X solo cuando ya hay imagen */}
              {canEdit ? (
                <button
                  type="button"
                  className="ik-apm__clear"
                  aria-label="Quitar imagen"
                  title="Quitar imagen"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSrc("");
                    setZoom(1);
                    setCrop({ x: 0, y: 0 });
                    setCroppedPixels(null);
                    try { if (inputRef.current) inputRef.current.value = ""; } catch {}
                  }}
                >
                  ×
                </button>
              ) : null}

              {src ? (
                <Cropper
                  image={src}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={(z) => setZoom(clamp(z, 1, 3))}
                  onCropComplete={onCropComplete}
                />
              ) : (
                <div className="ik-apm__dropHint">
                  <div className="ik-apm__dropHintTitle">Arrastra tu foto aquí o haz click para subir</div>
 
                </div>
              )}

              {/* input hidden */}
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => onPick(e.target.files?.[0])}
              />
            </div>

            {/* hint abajo del cuadro (solo cuando NO hay imagen) */}
            {!canEdit ? (
              <div className="ik-apm__hint">

              </div>
            ) : null}
          </div>

          {/* ZOOM SIN CONTENEDOR */}
          <div className="ik-apm__zoomBare">
            <div className="ik-apm__zoomLabel">ZOOM</div>
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              disabled={!canEdit}
            />
          </div>

          {/* BOTONES (se quedan igual) */}
          <div className="ik-apm__actions">
            <button className="ik-apm__ghost" type="button" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button className="ik-apm__primary" type="button" onClick={doConfirm} disabled={!canEdit || saving}>
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>



      </div>
    </div>,
    portalEl
  );
}

