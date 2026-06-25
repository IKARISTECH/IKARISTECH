const express  = require('express');
const router   = express.Router();
const { authMiddleware } = require('../middleware/auth');
const supabase = require('../config/supabase');
const multer   = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'), false);
  },
});

// PUT /api/perfil/avatar
router.put('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    const { id: usuarioId, empresaId } = req.usuario;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se recibió ninguna imagen' });
    }

    const ext      = req.file.mimetype.split('/')[1];
    const fileName = `${empresaId}/${usuarioId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage error:', uploadError);
      return res.status(500).json({ success: false, message: 'Error al subir imagen' });
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: dbError } = await supabase
      .from('usuarios')
      .update({ avatar_url: avatarUrl })
      .eq('id', usuarioId);

    if (dbError) {
      console.error('DB error:', dbError);
      return res.status(500).json({ success: false, message: 'Error al actualizar perfil' });
    }

    return res.json({ success: true, data: { avatar_url: avatarUrl } });
  } catch (err) {
    console.error('Avatar upload error:', err);
    return res.status(500).json({ success: false, message: 'Error interno' });
  }
});

module.exports = router;