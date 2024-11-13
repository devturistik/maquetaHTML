// src/utils/helpers.js
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

// Generar un código único para la orden de compra
export function generateCodigoOrden() {
  const date = dayjs().format("YYYYMMDD");
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `OC-${date}-${randomNum}`;
}

// Calcular la fecha de vencimiento basada en el plazo de pago en días
export function calculateFechaVencimiento(plazoDias) {
  return dayjs()
    .tz("America/Santiago")
    .add(plazoDias, "day")
    .format("YYYY-MM-DD");
}
