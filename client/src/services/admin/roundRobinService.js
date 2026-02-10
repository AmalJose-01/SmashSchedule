import axios from "axios";
import { BASE_URL } from "../../../utils/config";
import { headerData } from "../../../utils/storageHandler";

export const getMembersAPI = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/admin/round-robin/get-members`, headerData());
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const createMemberAPI = async (memberData) => {
    try {
        const response = await axios.post(`${BASE_URL}/admin/round-robin/create-member`, memberData, headerData());
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const updateMemberAPI = async (id, memberData) => {
    try {
        const response = await axios.put(`${BASE_URL}/admin/round-robin/update-member/${id}`, memberData, headerData());
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const deleteMemberAPI = async (id) => {
    try {
        const response = await axios.delete(`${BASE_URL}/admin/round-robin/delete-member/${id}`, headerData());
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const addMembersToTournamentAPI = async (payload) => {
    try {
        const response = await axios.post(`${BASE_URL}/admin/round-robin/add-to-tournament`, payload, headerData());
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const bulkImportMembersAPI = async (payload) => {
    try {
        const response = await axios.post(`${BASE_URL}/admin/round-robin/bulk-import`, payload, headerData());
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const saveGroupsAPI = async (payload) => {
    try {
        const response = await axios.post(`${BASE_URL}/admin/round-robin/save-groups`, payload, headerData());
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getGroupsAPI = async (tournamentId) => {
    try {
        const response = await axios.get(`${BASE_URL}/admin/round-robin/groups/${tournamentId}`, headerData());
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const autoGroupAPI = async (payload) => {
    try {
        const response = await axios.post(`${BASE_URL}/admin/round-robin/generate-groups`, payload, headerData());
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getTournamentPlayersAPI = async (tournamentId) => {
    try {
        const response = await axios.get(`${BASE_URL}/admin/round-robin/get-tournament-players/${tournamentId}`, headerData());
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const removePlayerFromTournamentAPI = async (tournamentId, playerId) => {
    try {
        const response = await axios.delete(`${BASE_URL}/admin/round-robin/remove-player/${tournamentId}/${playerId}`, headerData());
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const bulkAddPlayersToTournamentAPI = async (payload) => {
    try {
        const response = await axios.post(`${BASE_URL}/admin/round-robin/bulk-add-to-tournament`, payload, headerData());
        return response.data;
    } catch (error) {
        throw error;
    }
};
