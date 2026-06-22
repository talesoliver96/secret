const express = require("express");
const multer = require("multer");
const supabase = require("../config/supabase");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/admin/upload/product-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhuma imagem enviada." });
    }

    const ext = req.file.originalname.split(".").pop();
    const fileName = `products/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    return res.json({
      url: data.publicUrl,
      path: fileName,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;