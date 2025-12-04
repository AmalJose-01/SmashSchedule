export const getTournamentDetail = () => {
try {
    const tournamentData = localStorage.getItem("tournamentDetail");
    if (!tournamentData) return null;
    return JSON.parse(tournamentData);
    
} catch (error) {
     console.error("Error parsing user data:", error);
    return null;
}
};

export const getUser = () => {
  try {
    const storedUser = localStorage.getItem("user");
    if (!storedUser || storedUser === "undefined") {
      return null;
    }
    return JSON.parse(storedUser);
  } catch (error) {
    console.error("Error parsing user data:", error);
    return null;
  }
};
