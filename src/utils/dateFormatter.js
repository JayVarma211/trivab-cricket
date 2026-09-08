/**
 * Safely parses any date-like value (ISO string, JS Date, or Firestore Timestamp) into a JS Date object.
 * Returns a fallback Date (default to current Date or epoch) if parsing fails, preventing crashes.
 */
export const safeParseDate = (val, fallback = new Date(0)) => {
  if (!val) return fallback;
  
  // Handle Firestore Timestamp object
  if (typeof val.toDate === 'function') {
    try {
      return val.toDate();
    } catch (e) {
      console.error("Error calling toDate on Timestamp:", e);
    }
  }

  // Handle seconds/seconds-nanoseconds objects if not parsed fully
  if (val && typeof val === 'object' && 'seconds' in val) {
    try {
      return new Date(val.seconds * 1000);
    } catch (e) {
      console.error("Error parsing seconds-based timestamp:", e);
    }
  }

  // Handle standard JS Date, string, or number
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? fallback : d;
  } catch (e) {
    return fallback;
  }
};

/**
 * Formats a date safely, returning a fallback string if invalid instead of throwing a RangeError.
 */
export const safeFormatDate = (val, options = { day: 'numeric', month: 'short', year: 'numeric' }, locale = 'en-IN') => {
  const d = safeParseDate(val, null);
  if (!d) return '—';
  try {
    return d.toLocaleDateString(locale, options);
  } catch (e) {
    return '—';
  }
};

/**
 * Formats a datetime safely.
 */
export const safeFormatDateTime = (val, locale = 'en-IN') => {
  const d = safeParseDate(val, null);
  if (!d) return '—';
  try {
    return d.toLocaleString(locale);
  } catch (e) {
    return '—';
  }
};
