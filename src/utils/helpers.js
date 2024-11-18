// src/utils/helpers.js
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

export function generateCodigoOrden(id_orden) {
  const date = dayjs().format("DDMMYYYY");
  return `OC-${id_orden}_${date}`;
}

export function calculateFechaVencimiento(plazoDias) {
  return dayjs().tz("America/Santiago").add(plazoDias, "day").toDate();
}
