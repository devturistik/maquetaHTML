// src/utils/helpers.js
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

export function calculateFechaVencimiento(plazoDias) {
  return dayjs().tz("America/Santiago").add(plazoDias, "day").toDate();
}
