const express = require("express");
const router = express.Router();

const supabase = require("../config/supabase");

router.get("/test-db", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*");

    if (error) {
      return res.status(500).json(error);
    }

    return res.json(data);
  } catch (err) {
    return res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;