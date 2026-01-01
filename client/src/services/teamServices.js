import axios from "axios";
import { BASE_URL } from "../../utils/config.js";

export const saveTeamAPI = async (teamData) => {
  try {
    const response = await axios.post(`${BASE_URL}/tournament/teams`, teamData);
    return response.data;
  } catch (error) {
      throw error;
  }
};




export const getTournamentListAPI = async () => {
  console.log("getTournamentListAPI called"); // <--- should log when triggered

  const response = await axios.get(`${BASE_URL}/tournament/get-tournaments`);
  console.log("getTournamentListAPI response:====", response.data); // <--- log the full response
  return response.data;
};

export const getTournamentDetailsAPI = async (tournamentId) => {
  console.log("getTournamentDetailsAPI called with ID:", tournamentId); // <--- should log when triggered

  try {
    const response = await axios.get(
      `${BASE_URL}/tournament/get-tournamentDetails/${tournamentId}`
    );
    console.log("getTournamentDetailsAPI response:====", response.data); // <--- log the full response
    return response.data;
  } catch (error) {
     throw error
  }
};












export const getKnockoutScheduleAPI = async (tournamentId) => {
  console.log("getTournamentDetailsAPI called with ID:", tournamentId); // <--- should log when triggered

  try {
    const response = await axios.get(
      `${BASE_URL}/knockout/get-knockout-matches/${tournamentId}`
    );
    console.log("getKnockoutScheduleAPI response:====", response.data); // <--- log the full response
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch tournament details"
    );
  }
};


export const getTournamentInformationAPI = async (tournamentId) => {

  try {
    console.log(`${BASE_URL}/tournament/get-tournament-information/${tournamentId}`);
    
    const response = await axios.get(
      `${BASE_URL}/tournament/get-tournament-information/${tournamentId}`
    );
    console.log("getTournamentInformationAPI response:====", response.data); // <--- log the full response
    return response.data;
  } catch (error) {
   console.log("getAdminTournamentListAPI error",error);
    
    throw error
  }
};







