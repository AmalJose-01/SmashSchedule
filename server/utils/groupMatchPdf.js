const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

module.exports.generateGroupMatchPDF = async ({
  tournamentName,
  tournamentGroup,
  tournamentMatches,
}) => {
  const uploadDir = path.join(__dirname, "../uploads");

  // Ensure uploads directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const safeName = tournamentName.replace(/\s+/g, "_");
  const fileName = `${safeName}_Match_Sheets.pdf`;
  const filePath = path.join(uploadDir, fileName);

  const doc = new PDFDocument({ margin: 40, size: "A4" });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // -----------------------------------------
  // Group Map for fast lookup
  // -----------------------------------------
  const groupMap = {};
  tournamentGroup.forEach((group, index) => {
    groupMap[group._id.toString()] = {
      name: group.groupName || `Group ${String.fromCharCode(65 + index)}`,
    };
  });

  // -----------------------------------------
  // TITLE PAGE
  // -----------------------------------------
  doc.fontSize(22).text(tournamentName, { align: "center" });
  doc.moveDown(1);
  doc.fontSize(14).text("Match Score Sheets", { align: "center" });
  doc.addPage();

  // -----------------------------------------
  // ONE MATCH = ONE PAGE
  // -----------------------------------------
  tournamentMatches.forEach((match, index) => {
    if (index !== 0) doc.addPage();

    const groupName =
      groupMap[match.group?.toString()]?.name || "Group";

    // HEADER
    doc.fontSize(18).text(groupName, { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(14).text(`Match: ${match.matchName}`);
    doc.moveDown(0.5);

    doc.fontSize(12).text(`Court: ${match.court || "-"}`);
    doc.text(`Status: ${"-----------"}`);
    doc.moveDown(1);

   // -----------------------------------------
// SCORE TABLE (FIXED ALIGNMENT)
// -----------------------------------------
doc.fontSize(14).text("Score Entry", { underline: true });
doc.moveDown(0.5);

// Table layout
const tableTop = doc.y;
const startX = 50;

const colSet = 80;
const colTeam = 200;
const colScore = 100;
const rowHeight = 28;

// Extract team names
let homeTeam = "Home Team";
let awayTeam = "Away Team";

if (match.matchName?.includes("-vs-")) {
  const parts = match.matchName.split("-vs-");
  homeTeam = parts[0].trim();
  awayTeam = parts[1].trim();
}

// ---- Header Row ----
doc
  .fontSize(12)
  .text("Set", startX + 5, tableTop + 8, { width: colSet })
  .text(homeTeam, startX + colSet + 5, tableTop + 8, { width: colTeam })
  .text(awayTeam, startX + colSet + colTeam + 5, tableTop + 8, {
    width: colTeam,
  });

// Header border
doc.rect(startX, tableTop, colSet + colTeam * 2, rowHeight).stroke();

// ---- Data Rows ----
let y = tableTop + rowHeight;

for (let i = 1; i <= 3; i++) {
  doc
    .text(`Set ${i}`, startX + 5, y + 8, { width: colSet })
    .text("__________", startX + colSet + 5, y + 8, {
      width: colTeam,
      align: "center",
    })
    .text("__________", startX + colSet + colTeam + 5, y + 8, {
      width: colTeam,
      align: "center",
    });

  // Row border
  doc.rect(startX, y, colSet + colTeam * 2, rowHeight).stroke();
  y += rowHeight;
}


    // -----------------------------------------
    // SIGNATURES
    // -----------------------------------------
    doc.moveDown(2);
    doc.text("Referee Signature: ________________________");
    doc.moveDown(1);
    doc.text("Date: __________   Time: __________");
  });

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("finish", () => resolve(`/uploads/${fileName}`));
    stream.on("error", reject);
  });
};
