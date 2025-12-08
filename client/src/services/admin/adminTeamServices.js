import axios from "axios";
import { BASE_URL } from "../../../utils/config.js";
import { headerData } from "../../../utils/storageHandler.js";


export const getTeamListAPI = async () => {
  console.log("getTeamListAPI called"); // <--- should log when triggered
try {
  const response = await axios.get(`${BASE_URL}/admin/get-teams`,headerData());
  console.log("getTeamListAPI response:====", response.data); // <--- log the full response
  return response.data;
   }catch (error) {
    throw error;
  }
};



export const saveTournamentAPI = async (tournamentData) => {
  console.log("saveTournamentAPI called", tournamentData);
  console.log("headerData", headerData());

  try {
    const response = await axios.post(
      `${BASE_URL}/admin/create-tournament`,
      tournamentData, { headers: headerData().headers }            
                    
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to save team data"
    );
  }
};

export const getAdminTournamentListAPI = async () => {

  try {
      console.log("getTournamentListAPI called"); // <--- should log when triggered

  const response = await axios.get(`${BASE_URL}/admin/get-tournaments`,headerData());
  console.log("getTournamentListAPI response:====", response); // <--- log the full response
  return response.data;
  }catch (error) {
    console.log("getAdminTournamentListAPI error",error);
    
    throw error
  }




};

export const getAdminTournamentDetailsAPI = async (tournamentId) => {
  console.log("getTournamentDetailsAPI called with ID:", tournamentId); // <--- should log when triggered

  try {
    const response = await axios.get(
      `${BASE_URL}/admin/get-tournamentDetails/${tournamentId}`,headerData() 
    );
    console.log("getTournamentDetailsAPI response:====", response.data); // <--- log the full response
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch tournament details"
    );
  }
};

export const saveScoreAPI = async (scoreData) => {
  console.log("saveScoreAPI called",scoreData);
  try {
    const response = await axios.post(
      `${BASE_URL}/admin/save-score`,
      scoreData,headerData()
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to save team data"
    );
  }
};
export const deleteTournamentAPI = async (tournamentId) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/admin/delete-tournament/${tournamentId}`,headerData()
    );
    return response.data;
  } catch (error) {
     throw new Error(
      error.response?.data?.message || "Failed to delete tournament"
    );
  }
};

export const createKnockoutScheduleAPI = async (tournament) => {
  console.log("createKnockoutScheduleAPI called with ID:", tournament); // <--- should log when triggered

  try {
    const response = await axios.post(
      `${BASE_URL}/admin/create-knockout-matches`,tournament,headerData()
    );
    console.log("createKnockoutScheduleAPI response:====", response.data); // <--- log the full response
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch tournament details"
    );
  }
};

export const saveKnockoutScoreAPI = async (scoreData) => {
  console.log("saveKnockoutScoreAPI called",scoreData);
  
  try {
    const response = await axios.post(
      `${BASE_URL}/admin/saveKnockoutScore/${scoreData.matchId}`,
      scoreData,headerData()
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to save team data"
    );
  }
};

export const getAdminKnockoutScheduleAPI = async (tournamentId) => {
  console.log("getTournamentDetailsAPI called with ID:", tournamentId); // <--- should log when triggered

  try {
    const response = await axios.get(
      `${BASE_URL}/admin/get-knockout-matches/${tournamentId}`,headerData()
    );
    console.log("getKnockoutScheduleAPI response:====", response.data); // <--- log the full response
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch tournament details"
    );
  }
};



