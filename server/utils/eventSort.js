// Ordering for a club's events as players see them:
//   1. Latest day first (by start date).
//   2. Same day → the one with the later end first.
//   3. Otherwise (no date, or a full tie) → alphabetical by name.
// Events with no start date go after all dated ones.

const toTime = (v) => {
  if (!v) return null;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? null : t;
};

const dayKey = (t) => {
  if (t == null) return null;
  const d = new Date(t);
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
};

const byName = (a, b) =>
  String(a.name || "").localeCompare(String(b.name || ""), undefined, { sensitivity: "base", numeric: true });

/**
 * @param {Array} items
 * @param {(item) => {start: any, end: any, name: string}} pick
 */
const sortEvents = (items, pick) =>
  items
    .map((item) => {
      const { start, end, name } = pick(item);
      const s = toTime(start);
      return { item, name, start: s, day: dayKey(s), end: toTime(end) ?? s };
    })
    .sort((a, b) => {
      if (a.day == null && b.day == null) return byName(a, b);
      if (a.day == null) return 1;
      if (b.day == null) return -1;
      if (a.day !== b.day) return b.day - a.day; // latest day on top
      if ((a.end ?? 0) !== (b.end ?? 0)) return (b.end ?? 0) - (a.end ?? 0); // same day: later end on top
      return byName(a, b);
    })
    .map((x) => x.item);

// Knockout tournaments store date/time as strings ("2026-10-05", "18:30").
const tournamentDate = (t) => {
  if (!t.date) return null;
  const withTime = t.time ? `${t.date} ${t.time}` : t.date;
  return toTime(withTime) != null ? withTime : t.date;
};

module.exports = { sortEvents, tournamentDate };
