// Registration confirmation email sent to each player. Everything comes from
// the database: tournament name / date / time / venue / access code from the
// tournament, and the club name from the club profile (see mailContext.js).

const escapeHtml = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const formatDate = (d) => {
  if (!d) return "";
  const date = new Date(`${String(d).slice(0, 10)}T00:00:00`);
  if (isNaN(date)) return String(d);
  return date.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
};

const formatTime = (t) => {
  if (!t) return "";
  const m = String(t).match(/^(\d{1,2}):(\d{2})/);
  if (!m) return String(t);
  const h = Number(m[1]);
  return `${h % 12 || 12}:${m[2]} ${h >= 12 ? "PM" : "AM"}`;
};

const buildPlayerMailBody = ({ teamName, playerName, playerOneName, tournamentDetail = {}, clubName }) => {
  const name = playerName || playerOneName || "there";
  const club = clubName || "The Rallix Team";
  const when = [formatDate(tournamentDetail.date), formatTime(tournamentDetail.time)].filter(Boolean).join(" at ");
  const siteUrl = process.env.CLIENT_URL || "https://rallix.com.au";

  const rows = [
    teamName && ["Team", teamName],
    tournamentDetail.tournamentName && ["Tournament", tournamentDetail.tournamentName],
    when && ["Date & time", when],
    tournamentDetail.location && ["Venue", tournamentDetail.location],
    tournamentDetail.uniqueKey && ["Viewing access code", tournamentDetail.uniqueKey],
  ].filter(Boolean);

  return `
    <h2>🏸 Team Registration Confirmed</h2>

    <p>Hi <strong>${escapeHtml(name)}</strong>,</p>

    <p>
      Thanks for registering${tournamentDetail.tournamentName ? ` for <strong>${escapeHtml(tournamentDetail.tournamentName)}</strong>` : ""}.
      Your team is confirmed. Here are the details:
    </p>

    <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;">
      ${rows
        .map(([k, v]) => `<tr><td style="color:#555;">${escapeHtml(k)}</td><td><strong>${escapeHtml(v)}</strong></td></tr>`)
        .join("")}
    </table>

    <p>
      Fixtures, live scores and standings will be on
      <a href="${escapeHtml(siteUrl)}" target="_blank" rel="noopener noreferrer">Rallix</a>${
        tournamentDetail.uniqueKey ? " — use the viewing access code above to follow the tournament" : ""
      }.
    </p>

    <p>If you have any questions, feel free to reply to this email.</p>

    <p style="margin-top:30px;">
      Kind regards,<br />
      <strong>${escapeHtml(club)}</strong>
    </p>
  `;
};

module.exports = buildPlayerMailBody;
