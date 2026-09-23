const PDFDocument = require("pdfkit");

/**
 * Build a printable match PDF for a round-robin tournament, organized for
 * courtside use:
 *   - Page 1: cover page only (tournament name / "Match Schedule" / best-of
 *     info). No group or pool information is listed anywhere in this
 *     document — matches are organized purely by court.
 *   - Page 2+: one section per court ("Court 1", "Court 2", ...), each match
 *     rendered as a fillable scoresheet block — the two team names bracket a
 *     small grid of blank boxes (one column per set, top box for the home
 *     team's score, bottom box for the away team's score) that can be
 *     printed and filled in by hand, then used to re-enter scores into the
 *     app afterward. BYE matches (no real opponent/court) are omitted.
 *
 * @param {Object} params
 * @param {Object} params.tournament - RoundRobinTournament doc (tournamentName, numberOfSets, matchType, numberOfCourts)
 * @param {Array}  params.groups - RoundRobinGroup docs (unused for layout — kept for call-site compatibility)
 * @param {Array}  params.matches - populated RoundRobinMatch docs
 * @returns {PDFDocument} an un-ended pdfkit document — caller pipes it and calls .end()
 */
const generateMatchSchedulePdf = ({ tournament, matches }) => {
  const doc = new PDFDocument({ margin: 40, size: "A4" });

  const numberOfSets = tournament.numberOfSets || 3;

  const teamName = (m, side) => {
    const playerId = side === "home" ? m.player1Id : m.player2Id;
    const partnerId = side === "home" ? m.player1PartnerId : m.player2PartnerId;
    const name = playerId?.name ?? "—";
    return partnerId?.name ? `${name} / ${partnerId.name}` : name;
  };

  // Real, playable matches only — BYE matches have no opponent and no real
  // court assignment, so they don't belong on a printed court scoresheet.
  const playableMatches = matches.filter((m) => !m.isBye && m.court && m.court !== "BYE");

  // Group by court label (e.g. "Court 1"), sorted numerically so "Court 2"
  // sorts before "Court 10".
  const courtNumber = (label) => {
    const match = /(\d+)/.exec(String(label));
    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
  };
  const byCourt = {};
  playableMatches.forEach((m) => {
    const key = m.court;
    if (!byCourt[key]) byCourt[key] = [];
    byCourt[key].push(m);
  });
  const courtLabels = Object.keys(byCourt).sort((a, b) => courtNumber(a) - courtNumber(b));

  const pageBottom = () => doc.page.height - doc.page.margins.bottom;
  const leftMargin = doc.page.margins.left;
  const rightEdge = () => doc.page.width - doc.page.margins.right;

  // ── Page 1: title + a flat list of every match and its court ──────────
  doc.fontSize(20).fillColor("#000").text(tournament.tournamentName, { align: "center" });
  doc.fontSize(12).fillColor("#666").text("Match Schedule", { align: "center" });
  doc
    .fontSize(9)
    .fillColor("#999")
    .text(`Best of ${numberOfSets} · generated ${new Date().toLocaleDateString()}`, { align: "center" });
  doc.fillColor("#000");
  doc.moveDown(1.2);

  if (playableMatches.length > 0) {
    const availableWidth = rightEdge() - leftMargin;
    const numColWidth = 30;
    const courtColWidth = 80;
    const teamsColWidth = availableWidth - numColWidth - courtColWidth;

    const headerY = doc.y;
    doc.fontSize(10).fillColor("#666");
    doc.text("#", leftMargin, headerY, { width: numColWidth });
    doc.text("Match", leftMargin + numColWidth, headerY, { width: teamsColWidth });
    doc.text("Court", leftMargin + numColWidth + teamsColWidth, headerY, { width: courtColWidth, align: "right" });
    doc.fillColor("#000");
    doc.moveDown(0.5);
    const ruleY = doc.y;
    doc.moveTo(leftMargin, ruleY).lineTo(rightEdge(), ruleY).strokeColor("#cbd5e1").stroke();
    doc.strokeColor("#000");
    doc.moveDown(0.4);

    playableMatches.forEach((m, idx) => {
      const rowHeight = 20;
      if (doc.y + rowHeight > pageBottom()) {
        doc.addPage();
      }
      const rowY = doc.y;
      doc.fontSize(10).fillColor("#000");
      doc.text(String(idx + 1), leftMargin, rowY, { width: numColWidth });
      doc.text(`${teamName(m, "home")}  vs  ${teamName(m, "away")}`, leftMargin + numColWidth, rowY, {
        width: teamsColWidth,
      });
      doc.text(m.court, leftMargin + numColWidth + teamsColWidth, rowY, { width: courtColWidth, align: "right" });
      doc.moveDown(0.6);
    });
  }

  // ── One fillable scoresheet block per match ────────────────────────────
  // Layout: [ Home team name ] [ Set 1 ] [ Set 2 ] ... [ Away team name ]
  // The two team-name cells span both rows; each "Set N" column has a blank
  // box in the top row (home score) and bottom row (away score).
  const drawScoreSheetBlock = (m, topY) => {
    const availableWidth = rightEdge() - leftMargin;
    const nameColWidth = Math.min(160, availableWidth * 0.28);
    const setColsWidth = availableWidth - nameColWidth * 2;
    const setColWidth = setColsWidth / numberOfSets;
    const rowHeight = 38;
    const blockHeight = rowHeight * 2;

    // Outer border
    doc.rect(leftMargin, topY, availableWidth, blockHeight).strokeColor("#000").stroke();

    // Vertical separators: after home-name column, between each set column,
    // before away-name column.
    let x = leftMargin + nameColWidth;
    doc.moveTo(x, topY).lineTo(x, topY + blockHeight).stroke();
    for (let i = 1; i < numberOfSets; i++) {
      x += setColWidth;
      doc.moveTo(x, topY).lineTo(x, topY + blockHeight).stroke();
    }
    x = rightEdge() - nameColWidth;
    doc.moveTo(x, topY).lineTo(x, topY + blockHeight).stroke();

    // Horizontal middle divider — only across the score-box columns, since
    // the team-name cells span the full block height.
    const scoreAreaStart = leftMargin + nameColWidth;
    const scoreAreaEnd = rightEdge() - nameColWidth;
    doc
      .moveTo(scoreAreaStart, topY + rowHeight)
      .lineTo(scoreAreaEnd, topY + rowHeight)
      .stroke();

    // Team names, vertically centered across the full block height.
    const nameY = topY + blockHeight / 2 - 6;
    doc
      .fontSize(11)
      .fillColor("#000")
      .text(teamName(m, "home"), leftMargin + 4, nameY, { width: nameColWidth - 8, align: "center" });
    doc
      .fontSize(11)
      .fillColor("#000")
      .text(teamName(m, "away"), rightEdge() - nameColWidth + 4, nameY, { width: nameColWidth - 8, align: "center" });

    return topY + blockHeight;
  };

  courtLabels.forEach((courtLabel) => {
    doc.addPage();
    doc.fontSize(16).fillColor("#0d9488").text(courtLabel, { align: "center" });
    doc.fillColor("#000");
    doc.moveDown(1);

    byCourt[courtLabel].forEach((m) => {
      const blockHeight = 38 * 2;
      const gap = 20;
      if (doc.y + blockHeight > pageBottom()) {
        doc.addPage();
        doc.fontSize(16).fillColor("#0d9488").text(`${courtLabel} (cont.)`, { align: "center" });
        doc.fillColor("#000");
        doc.moveDown(1);
      }
      const bottomY = drawScoreSheetBlock(m, doc.y);
      doc.y = bottomY + gap;
    });
  });

  return doc;
};

module.exports = { generateMatchSchedulePdf };
