export const isMatchDecided = (sets) => {
  let homeWins = 0;
  let awayWins = 0;

  sets.forEach((set) => {
    const home = Number(set.home);
    const away = Number(set.away);

    // Ignore incomplete sets (typing stage)
    const isIncomplete =
      (home >= 21 && away === 0) || (away >= 21 && home === 0);

    if (isIncomplete) return; // DON'T count this set yet

    // Valid win: 21+ AND at least 1-point difference
    if (home >= 21 && home > away && home - away >= 1) homeWins++;
    if (away >= 21 && away > home && away - home >= 1) awayWins++;
  });

  return homeWins === 2 || awayWins === 2;
};

// Who won a single set: "home", "away" or null (not finished yet).
// A set is won by reaching 21+ with more points than the other side.
export const getSetWinner = (set) => {
  const home = Number(set?.home) || 0;
  const away = Number(set?.away) || 0;
  if (home >= 21 && home > away) return "home";
  if (away >= 21 && away > home) return "away";
  return null;
};

// Set 3 is only played when sets 1 and 2 are both finished and split 1–1.
export const isThirdSetNeeded = (sets = []) => {
  const w1 = getSetWinner(sets[0]);
  const w2 = getSetWinner(sets[1]);
  return !!w1 && !!w2 && w1 !== w2;
};

// After a score change: if set 3 isn't needed (anymore), clear it so a stale
// set-3 score can't be saved.
export const clearUnneededThirdSet = (sets = []) =>
  sets.length > 2 && !isThirdSetNeeded(sets)
    ? sets.map((s, i) => (i === 2 ? { ...s, home: 0, away: 0 } : s))
    : sets;
