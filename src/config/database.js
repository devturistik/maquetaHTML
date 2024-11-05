// src/config/database.js
//import dotenv from 'dotenv';
// dotenv.config();

const config = {
  user: process.env.DB_USER || "carriagada",
  password: process.env.DB_PASSWORD || "Turistik.2024.*",
  server: process.env.DB_SERVER || "devturistik.database.windows.net",
  database: process.env.DB_DATABASE || "Sistemas",
  options: {
    encrypt: process.env.DB_ENCRYPT === "true" || true,
    trustServerCertificate:
      process.env.DB_TRUST_SERVER_CERTIFICATE === "true" || true,
  },
};

export default config;