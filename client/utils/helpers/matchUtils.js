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