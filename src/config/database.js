// src/config/database.js
import sql from "mssql";

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
  pool: {
    max: 20,
    min: 5,
    idleTimeoutMillis: 30000,
  },
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log("Conexión a SQL Server establecida");
    return pool;
  })
  .catch((err) => {
    console.error("Error en la conexión a la base de datos:", err);
    throw err;
  });

export { sql, poolPromise };
