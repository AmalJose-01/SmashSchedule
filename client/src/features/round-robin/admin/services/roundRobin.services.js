import apiClient from "../../../../services/api/axiosInstance.js";

const BASE = "/admin/round-robin";

// ── Tournaments ──────────────────────────────────────────────────────────────
export const getRoundRobinTournamentsAPI = () =>
  apiClient.get(`${BASE}/tournaments`).then((r) => r.data);

export const getRoundRobinTournamentByIdAPI = (id) =>
  apiClient.get(`${BASE}/tournaments/${id}`).then((r) => r.data);

export const createRoundRobinTournamentAPI = (data) =>
  apiClient.post(`${BASE}/tournaments`, data).then((r) => r.data);

export const updateRoundRobinTournamentAPI = ({ id, data }) =>
  apiClient.put(`${BASE}/tournaments/${id}`, data).then((r) => r.data);

export const deleteRoundRobinTournamentAPI = (id) =>
  apiClient.delete(`${BASE}/tournaments/${id}`).then((r) => r.data);

export const finalizeRoundRobinTournamentAPI = (id) =>
  apiClient.post(`${BASE}/tournaments/${id}/finalize`).then((r) => r.data);

// ── Members ──────────────────────────────────────────────────────────────────
export const getRoundRobinMembersAPI = () =>
  apiClient.get(`${BASE}/members`).then((r) => r.data);

export const getRoundRobinMemberByIdAPI = (memberId) =>
  apiClient.get(`${BASE}/members/${memberId}`).then((r) => r.data);

export const createRoundRobinMemberAPI = (data) =>
  apiClient.post(`${BASE}/members`, data).then((r) => r.data);

export const updateRoundRobinMemberAPI = ({ memberId, data }) =>
  apiClient.put(`${BASE}/members/${memberId}`, data).then((r) => r.data);

export const deleteRoundRobinMemberAPI = (memberId) =>
  apiClient.delete(`${BASE}/members/${memberId}`).then((r) => r.data);

export const bulkImportRoundRobinMembersAPI = (members) =>
  apiClient.post(`${BASE}/members/bulk-import`, { members }).then((r) => r.data);

// ── Tournament Players ────────────────────────────────────────────────────────
export const addMembersToTournamentAPI = ({ tournamentId, memberIds }) =>
  apiClient
    .post(`${BASE}/tournaments/${tournamentId}/add-members`, { memberIds })
    .then((r) => r.data);

export const getTournamentPlayersAPI = (tournamentId) =>
  apiClient.get(`${BASE}/tournaments/${tournamentId}/players`).then((r) => r.data);

export const removePlayerFromTournamentAPI = ({ tournamentId, playerId }) =>
  apiClient
    .delete(`${BASE}/tournaments/${tournamentId}/players/${playerId}`)
    .then((r) => r.data);

// ── Groups ────────────────────────────────────────────────────────────────────
export const generateGroupsAPI = (tournamentId) =>
  apiClient
    .post(`${BASE}/tournaments/${tournamentId}/generate-groups`)
    .then((r) => r.data);

export const saveGroupsAPI = ({ tournamentId, groups }) =>
  apiClient
    .post(`${BASE}/tournaments/${tournamentId}/save-groups`, { groups })
    .then((r) => r.data);

export const getGroupsAPI = (tournamentId) =>
  apiClient.get(`${BASE}/tournaments/${tournamentId}/groups`).then((r) => r.data);

// ── Matches & Standings ───────────────────────────────────────────────────────
export const getMatchesAPI = (tournamentId) =>
  apiClient.get(`${BASE}/tournaments/${tournamentId}/matches`).then((r) => r.data);

export const getStandingsAPI = (tournamentId) =>
  apiClient.get(`${BASE}/tournaments/${tournamentId}/standings`).then((r) => r.data);

export const recordMatchScoreAPI = ({ matchId, sets }) =>
  apiClient.post(`${BASE}/matches/${matchId}/score`, { sets }).then((r) => r.data);

export const updateMatchAPI = ({ matchId, data }) =>
  apiClient.put(`${BASE}/matches/${matchId}`, data).then((r) => r.data);

export const resetMatchScoreAPI = (matchId) =>
  apiClient.post(`${BASE}/matches/${matchId}/reset`).then((r) => r.data);

// ── Square Payments ───────────────────────────────────────────────────────────
const SQUARE_BASE = "/admin/square";

export const saveSquareCredentialsAPI = (data) =>
  apiClient.post(`${SQUARE_BASE}/credentials`, data).then((r) => r.data);

export const getSquareConnectUrlAPI = () =>
  apiClient.get(`${SQUARE_BASE}/connect`).then((r) => r.data);

export const getSquareStatusAPI = () =>
  apiClient.get(`${SQUARE_BASE}/status`).then((r) => r.data);

export const disconnectSquareAPI = () =>
  apiClient.post(`${SQUARE_BASE}/disconnect`).then((r) => r.data);

export const getSquareLocationsAPI = () =>
  apiClient.get(`${SQUARE_BASE}/locations`).then((r) => r.data);

export const createSquareDeviceCodeAPI = ({ locationId, name }) =>
  apiClient.post(`${SQUARE_BASE}/device-code`, { locationId, name }).then((r) => r.data);

export const getSquareDeviceCodeStatusAPI = (id) =>
  apiClient.get(`${SQUARE_BASE}/device-code/${id}`).then((r) => r.data);

export const saveSquareSettingsAPI = (data) =>
  apiClient.post(`${SQUARE_BASE}/settings`, data).then((r) => r.data);

export const collectPaymentAPI = ({ tournamentId, playerId }) =>
  apiClient
    .post(`${BASE}/tournaments/${tournamentId}/players/${playerId}/collect-payment`)
    .then((r) => r.data);

export const getPaymentStatusAPI = (paymentId) =>
  apiClient.get(`${BASE}/payments/${paymentId}/status`).then((r) => r.data);

export const getTournamentPaymentsAPI = (tournamentId) =>
  apiClient.get(`${BASE}/tournaments/${tournamentId}/payments`).then((r) => r.data);
