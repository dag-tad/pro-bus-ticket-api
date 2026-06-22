import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

dayjs.tz.setDefault("Africa/Addis_Ababa");

export const formatDateTime = (
  dateString: string | Date | null | undefined,
  format?: string
): string => {
  if (!dateString) return "";
  return dayjs(dateString).tz().format(format ?? "DD MMM YYYY, h:mm A");
};

export const parseDateTime = (
  formattedString: string | Date | null | undefined,
  format = "DD MMM YYYY, h:mm A"
): Date | null => {
  if (!formattedString) return null;
  if (formattedString instanceof Date) return formattedString;

  const parsed = dayjs.tz(formattedString, format);
  if (parsed.isValid()) {
    return parsed.toDate();
  }

  const fallback = dayjs(formattedString);
  return fallback.isValid() ? fallback.toDate() : null;
};
