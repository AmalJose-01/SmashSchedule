const PDFDocument = require("pdfkit");

/**
 * Build a printable match-schedule PDF for a round-robin tournament.
 * One compact block per match (court, players, blank score-entry line for
 * each set) so it can be printed and filled in courtside, then used to
 * re-enter scores into the app afterward.
 *
 * @param {Object} params
 * @param {Object} params.tournament - RoundRobinTournament doc (tournamentName, numberOfSets, matchType)
 * @param {Array}  params.groups - RoundRobinGroup docs ({ _id, groupName })
 * @param {Array}  params.matches - populated RoundRobinMatch docs
 * @returns {PDFDocument} an un-ended pdfkit document — caller pipes it and calls .end()
 */
const generateMatchSchedulePdf = ({ tournament, groups, matches }) => {
  const doc = new PDFDocument({ margin: 40, size: "A4" });

  const groupNameById = {};
  groups.forEach((g) => {
    groupNameById[String(g._id)] = g.groupName;
  });

  const isDoubles = tournament.matchType === "Doubles";
  const numberOfSets = tournament.numberOfSets || 3;

  const teamName = (m, side) => {
    const playerId = side === "home" ? m.player1Id : m.player2Id;
    const partnerId = side === "home" ? m.player1PartnerId : m.player2PartnerId;
    const name = playerId?.name ?? "—";
    return partnerId?.name ? `${name} / ${partnerId.name}` : name;
  };

  // Group matches the same way the admin UI does: by fixture (doubles) or
  // by group document (singles).
  const byGroup = {};
  matches.forEach((m) => {
    let key;
    if (isDoubles) {
      const parts = m.matchName.split(" - Match ");
      key = parts.length > 1 ? parts[0] : (groupNameById[String(m.groupId?._id ?? m.groupId)] ?? "Doubles Matches");
    } else {
      key = groupNameById[String(m.groupId?._id ?? m.groupId)] ?? "Ungrouped";
    }
    if (!byGroup[key]) byGroup[key] = [];
    byGroup[key].push(m);
  });

  // ── Title ──────────────────────────────────────────────────────────────
  doc.fontSize(20).fillColor("#000").text(tournament.tournamentName, { align: "center" });
  doc.fontSize(12).fillColor("#666").text("Match Schedule", { align: "center" });
  doc
    .fontSize(9)
    .fillColor("#999")
    .text(`Best of ${numberOfSets} · generated ${new Date().toLocaleDateString()}`, { align: "center" });
  doc.fillColor("#000");
  doc.moveDown(1);

  const pageBottom = doc.page.height - doc.page.margins.bottom;
  const leftMargin = doc.page.margins.left;
  const rightEdge = doc.page.width - doc.page.margins.right;

  Object.entries(byGroup).forEach(([groupName, groupMatches]) => {
    if (doc.y > pageBottom - 80) doc.addPage();

    doc.fontSize(14).fillColor("#0d9488").text(groupName, { underline: true });
    doc.fillColor("#000");
    doc.moveDown(0.4);

    groupMatches.forEach((m) => {
      const blockHeight = 70;
      if (doc.y > pageBottom - blockHeight) doc.addPage();

      doc.fontSize(9).fillColor("#999").text(m.matchName);
      doc.fillColor("#000");
      doc.fontSize(12).text(`${teamName(m, "home")}   vs   ${teamName(m, "away")}`);
      doc.fontSize(9).fillColor("#666").text(`Court: ${m.court || "-"}`);
      doc.fillColor("#000");

      let setLine = "";
      for (let i = 1; i <= numberOfSets; i++) {
        setLine += `Set ${i}: ____ - ____    `;
      }
      doc.fontSize(10).text(setLine);

      doc.moveDown(0.3);
      const lineY = doc.y;
      doc.moveTo(leftMargin, lineY).lineTo(rightEdge, lineY).strokeColor("#e5e7eb").stroke();
      doc.strokeColor("#000");
      doc.moveDown(0.5);
    });

    doc.moveDown(0.6);
  });

  return doc;
};

module.exports = { generateMatchSchedulePdf };
