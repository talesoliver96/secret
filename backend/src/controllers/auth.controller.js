const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (
    email !== process.env.ADMIN_EMAIL ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({
      error: "E-mail ou senha inválidos.",
    });
  }

  const token = jwt.sign(
    {
      email,
      role: "admin",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  return res.json({
    token,
    user: {
      email,
      role: "admin",
    },
  });
};