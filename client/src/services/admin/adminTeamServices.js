import apiClient from "../api/axiosInstance.js";
import { BASE_URL } from "../../../utils/config.js";
import { headerData } from "../../../utils/storageHandler.js";



export const importTeamAPI = async (teamData) => {
  try {
    const response = await apiClient.post(`/admin/teams`, teamData);
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const getTeamListAPI = async (tournamentId) => {
  console.log("getTeamListAPI called"); // <--- should log when triggered
try {

 const response = await apiClient.get(
      `/admin/get-teams/${tournamentId}`
    );
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
    const response = await apiClient.post(
      `/admin/create-tournament`,
      tournamentData            
                    
    );
    return response.data;
  } catch (error) {
    console.log("saveTournamentAPI error",error);
    
    throw error
  }
};

export const updateTournamentAPI = async (tournamentData) => {
  console.log("updateTournamentAPI called", tournamentData);
  console.log("headerData", headerData());

  try {
    const response = await apiClient.put(
      `/admin/update-tournament`,
      tournamentData            
                    
    );
    return response.data;
  } catch (error) {
    console.log("updateTournamentAPI error",error);
    
    throw error
  }
};

export const saveMatchesAPI = async (tournamentData) => {
  console.log("saveTournamentAPI called", tournamentData);
  console.log("headerData", headerData());

  try {
    const response = await apiClient.post(
      `/admin/create-matches`,
      tournamentData            
                    
    );
    return response.data;
  } catch (error) {
    console.log("saveMatchesAPI error",error);
    
    throw error
  }
};






export const getAdminTournamentListAPI = async () => {

  try {
      console.log("getAdminTournamentListAPI called"); // <--- should log when triggered

  const response = await apiClient.get(`/admin/get-tournaments`);
  console.log("getTournamentListAPI response:====", response); // <--- log the full response
  return response.data;
  }catch (error) {
    console.log("getAdminTournamentListAPI error",error);
    
    throw error
  }




};

export const getAdminTournamentInformationAPI = async (tournamentId) => {

  try {
    const response = await apiClient.get(
      `/admin/get-tournament-information/${tournamentId}`
    );
    console.log("getTournamentInformationAPI response:====", response.data); // <--- log the full response
    return response.data;
  } catch (error) {
   console.log("getAdminTournamentListAPI error",error);
    
    throw error
  }
};


export const getAdminTournamentDetailsAPI = async (tournamentId) => {
  console.log("getAdminTournamentDetailsAPI called with ID:", tournamentId); // <--- should log when triggered

  try {
    const response = await apiClient.get(
      `/admin/get-tournamentDetails/${tournamentId}`
    );
    console.log("getTournamentDetailsAPI response:====", response.data); // <--- log the full response
    return response.data;
  } catch (error) {
     throw error
  }
};





export const saveScoreAPI = async (scoreData) => {
  console.log("saveScoreAPI called",scoreData);
  try {
    const response = await apiClient.post(
      `/admin/save-score`,
      scoreData
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to save team data"
    );
  }
};


export const saveMultipleScoreAPI = async (scoreData) => {
  console.log("saveMultipleScoreAPI called",scoreData);
  try {
    const response = await apiClient.post(
      `/admin/save-multiple-score`,
      scoreData
    );
    return response.data;
  } catch (error) {
   console.log("saveMultipleScoreAPI error",error);
    
    throw error
  }
};
export const deleteTournamentAPI = async (tournamentId) => {
  try {
    const response = await apiClient.delete(
      `/admin/delete-tournament/${tournamentId}`
    );
    return response.data;
  } catch (error) {
     throw new Error(
      error.response?.data?.message || "Failed to delete tournament"
    );
  }
};

export const deleteTeamAPI = async (teamId) => {
  try {
    const response = await apiClient.delete(
      `/admin/delete-team/${teamId}`
    );
    return response.data;
  } catch (error) {
      throw error
  }
};

export const createKnockoutScheduleAPI = async (tournament) => {
  console.log("createKnockoutScheduleAPI called with ID:", tournament); // <--- should log when triggered

  try {
    const response = await apiClient.post(
      `/admin/create-knockout-matches`,tournament
    );
    console.log("createKnockoutScheduleAPI response:====", response.data); // <--- log the full response
    return response.data;
  } catch (error) {
      throw error
  }
};

export const saveKnockoutScoreAPI = async (scoreData) => {
  console.log("saveKnockoutScoreAPI called",scoreData);
  
  try {
    const response = await apiClient.post(
      `/admin/saveKnockoutScore/${scoreData.matchId}`,
      scoreData
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
    const response = await apiClient.get(
      `/admin/get-knockout-matches/${tournamentId}`
    );
    console.log("getKnockoutScheduleAPI response:====", response.data); // <--- log the full response
    return response.data;
  } catch (error) {
     throw error
  }
};

export const verifyUserAPI = async (data) => {
  try {
    const response = await apiClient.post(
      `/user/verify`,
      {}            // body optional
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "User verify failed");
  }
};




