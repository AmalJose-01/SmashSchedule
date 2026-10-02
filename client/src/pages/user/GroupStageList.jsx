import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useTournamentDetail } from "../../hooks/useTournamentDetail";

import { useParams } from "react-router-dom";
import ButtonWithIcon from "../../components/ButtonWithIcon";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Award,
  Calendar,
  ChevronDown,
  Table,
  Target,
  Trophy,
  BarChart2,
  MapPin,
  Flame,
} from "lucide-react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { div } from "framer-motion/client";
import StatusBadge from "../../components/StatusBadge";

const GroupStageList = () => {
  const location = useLocation();
  const state = location.state || {};
  const [groups, setGroups] = useState(null);
  const [matches, setMatches] = useState({});
  const [selectedGroup, setSelectedGroup] = useState("all"); // "all" = show all groups
  const { tournamentId } = useParams();
  const navigate = useNavigate();

  const [expandedGroupId, setExpandedGroupId] = useState(null);

  // const [isExpanded, setIsExpanded] = useState(false);
  // const toggleExpand = () => setIsExpanded((prev) => !prev);


const toggleExpand = (groupId) => {
  if (expandedGroupId === groupId) {
    setExpandedGroupId(null); // collapse if clicked again
  } else {
    setExpandedGroupId(groupId); // expand this group only
  }
};


  const { handleTournamentDetail, isLoading: isTournamentDetailLoading } =
    useTournamentDetail(tournamentId, "User");

  const tournamentDetail = handleTournamentDetail();

  useEffect(() => {
    if (tournamentDetail?.groups && tournamentDetail?.matches) {
      setGroups(tournamentDetail.groups); // now groups = { A: [...], B: [...], ... }

      setMatches(tournamentDetail.matches); // now matches = { A: [...], B: [...], ... }
    }
  }, [tournamentDetail]);

  const handleGotoKnockout = async () => {
    // Navigate to knockout page with top teams
    // You can use react-router's useNavigate for navigation
    try {
      const allFinished = groups.every((gp) => gp.status === "finished");

      // if (!allFinished) {
      //   toast.error("All groups must be finished before creating knockout stage.");
      //   return;
      // }

      navigate("/knockoutResult", { state: { teams: topTeams, tournamentId } });
    } catch (error) {
      console.log("Navigation error:", error);
    }
  };

  // Top teams for knockout
  const topTeams = groups
    ? Object.keys(groups).map((key) => groups[key][0])
    : [];

  const getStatusBadge = (status) => {
    switch (status) {
      case "finished":
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">
            Finished
          </span>
        );
      case "ongoing":
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-1">
            <Flame className="w-3 h-3" /> Live
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
            Scheduled
          </span>
        );
    }
  };

  if (!groups) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 text-lg">Loading tournament data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white ">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4  shadow-lg sticky top-0">
        <div className="flex items-center gap-4">
          <Table
            className="w-8 h-8 text-blue-600"
            onClick={() => navigate("/")}
          />

          <h2 className="text-xl font-semibold text-blue-800">Group Stage</h2>
        </div>

        <ButtonWithIcon
          title="Go to Knockout"
          icon="go"
          buttonBGColor="bg-green-600"
          textColor="text-white"
          onClick={handleGotoKnockout}
        />
      </div>

      <div className="p-4">
        {/* Group Filter */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-4 flex items-center gap-4 m-4">
          <label className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            <span>Filter by Group:</span>
          </label>
          <div className="relative">
            <select
              className="appearance-none px-4 py-2 pr-10 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white cursor-pointer "
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
            >
              <option value="all">All Groups</option>
              {groups.map((gp) => (
                <option key={gp._id} value={gp.groupName}>
                  {gp.groupName}
                </option>
              ))}
            </select>
            <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Group Stage */}
        {groups.length > 0 ? (
          <div
            className={`grid grid-cols-1  ${
              groups.length > 1 && selectedGroup === "all"
                ? "md:grid-cols-2"
                : "md:grid-cols-1"
            }    gap-6 ml-4 mr-4 mb-6`}
          >
            {groups
              .filter(
                (gp) =>
                  selectedGroup === "all" || selectedGroup === gp.groupName
              )
              .map((gp) => {
                const groupMatches = matches.filter((m) => m.group === gp._id);

                return (
                   <div key={gp._id} className="flex flex-col">
                  <div
                    key={gp._id}
                    className="bg-white rounded-3xl shadow-lg   overflow-x-auto"
                  >
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
                      <h2 className="text-2xl text-white flex items-center gap-2">
                        <Trophy className="w-6 h-6" />
                        {gp.groupName}
                      </h2>
                    </div>

                    {/* Matches */}
                    <h3 className="mb-4 flex items-center gap-2 text-gray-700 m-4">
                      <Calendar className="w-5 h-5" />
                      Matches
                    </h3>

                    {/* Schedule And court */}
                    <div
                      className={`mb-6 grid grid-cols-1  ${
                        groups.length > 1 ? "lg:grid-cols-2" : "lg:grid-cols-3"
                      }   ${
                        groups.length > 1 ? "md:grid-cols-2" : "md:grid-cols-2"
                      }   gap-4 m-4`}
                    >
                      {groupMatches.map((m) => (
                        <div
                          key={m._id}
                          className="card p-4 border border-gray-200 rounded-xl bg-blue-50 hover:bg-blue-100 transition flex flex-col items-center justify-center"
                        >
                          <div className="font-semibold text-sm text-gray-800 text-center">
                            {m.matchName}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {m.court}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Points Table */}

                    <div>
                      <h3 className="mb-3 flex items-center gap-2 text-gray-700 m-4">
                        <Award className="w-5 h-5" />
                        Standings
                      </h3>

                      <div className="overflow-x-auto rounded-lg border-2 border-gray-200 m-4">
                        <table className="w-full">
                          <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                            <tr>
                              <th className="p-3 text-left text-sm">#</th>
                              <th className="p-3 text-sm">Team</th>
                              <th className="p-3 text-sm">M</th>
                              <th className="p-3 text-sm">W</th>
                              <th className="p-3 text-sm">L</th>
                              <th className="p-3 text-sm">PF</th>
                              <th className="p-3 text-sm">PA</th>
                              <th className="p-3 text-sm">PD</th>
                              <th className="p-3  text-sm  text-green-600">
                                Pts
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {gp.standings
                              .slice()
                              .sort((a, b) => {
                                // Sort by totalPoints descending
                                if (b.totalPoints !== a.totalPoints) {
                                  return b.totalPoints - a.totalPoints;
                                }
                                // If totalPoints are equal, sort by points difference descending
                                const diffA = a.pointsFor - a.pointsAgainst;
                                const diffB = b.pointsFor - b.pointsAgainst;
                                return diffB - diffA;
                              })

                              .map((t, idx) => {
                                // Find the team object that matches the teamId
                                const teamObj = gp.teams.find(
                                  (team) => team.teamId === t.teamId
                                );
                                const isQualified = idx < 2;

                                return (
                                  <tr
                                    key={idx}
                                    className={`border-b hover:bg-blue-50 transition-colors ${
                                      isQualified ? "bg-green-50" : ""
                                    }`}
                                  >
                                    <td className="p-3">
                                      <span
                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                          isQualified
                                            ? "bg-green-600 text-white"
                                            : "bg-gray-200 text-gray-600"
                                        }`}
                                      >
                                        {idx + 1}
                                      </span>
                                    </td>

                                    <td className="p-2 text-sm">
                                      {teamObj?.name || t.teamId}
                                    </td>
                                    <td className="p-2 text-center text-sm">
                                      {t.matchesPlayed}
                                    </td>
                                    <td className="p-2 text-center text-sm">
                                      {t.wins}
                                    </td>
                                    <td className="p-2 text-center text-sm">
                                      {t.losses}
                                    </td>
                                    <td className="p-2 text-center text-sm">
                                      {t.pointsFor}
                                    </td>
                                    <td className="p-2 text-center text-sm">
                                      {t.pointsAgainst}
                                    </td>

                                    <td className="p-3 text-center text-sm">
                                      <span
                                        className={
                                          t.pointsFor - t.pointsAgainst >= 0
                                            ? "text-green-600"
                                            : "text-red-600"
                                        }
                                      >
                                        {t.pointsFor - t.pointsAgainst > 0
                                          ? "+"
                                          : ""}
                                        {t.pointsFor - t.pointsAgainst}
                                      </span>
                                    </td>

                                    <td className="p-3 text-center text-sm">
                                      <span className="px-2 py-1 bg-blue-600 text-white rounded">
                                        {t.totalPoints}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                      {gp.standings.length > 0 && (
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1 m-4">
                          <Trophy className="w-3 h-3 text-green-600" />
                          Top 2 teams qualify for knockout stage
                        </p>
                      )}
                    </div>

                    {/* Schedule And court */}
                    <div
                      className="flex justify-between items-center cursor-pointer m-4"
                      // onClick={toggleExpand}
                      onClick={() => toggleExpand(gp._id)}
                    >
                      <div className="flex gap-2">
                        <BarChart2 className="w-5 h-5" />

                        <h2 className="text-md font-semibold mb-4">
                          {/* {isExpanded ? "Hide Score" : "View Score"} */}
                            {expandedGroupId === gp._id ? "Hide Score" : "View Score"}

                        </h2>
                      </div>

                      {groupMatches.length > 0 && (
                        <span className="text-gray-600">
                          {expandedGroupId === gp._id ? <FaChevronUp /> : <FaChevronDown />}
                        </span>
                      )}
                    </div>

                    {expandedGroupId === gp._id  && (
                      <div>
                        {/* Matches */}
                        <h3 className="mb-4 flex items-center gap-2 text-gray-700 m-4">
                          <Calendar className="w-5 h-5" />
                          Matches
                        </h3>

                        <div
                          className={`mb-6 grid grid-cols-1  ${
                            groups.length > 1
                              ? "lg:grid-cols-2"
                              : "lg:grid-cols-3"
                          }   ${
                            groups.length > 1
                              ? "md:grid-cols-2"
                              : "md:grid-cols-2"
                          }   gap-4 m-4`}
                        >
                          {groupMatches.map((m) => (
                            <div
                              key={m._id}
                              className="card  bg-blue-50 p-4 rounded-xl border-2 border-blue-100 hover:shadow-lg transition-all"
                            >
                              <div className="w-full flex items-center justify-between mb-3">
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-800">
                                    {m.matchName}
                                  </div>
                                  <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                    <MapPin className="w-4 h-4" />
                                    {m.court === "" ? "Court" : m.court}
                                  </div>
                                </div>
                                {/* {getStatusBadge(m.status)} */}
                                                        <StatusBadge status={m.status} />

                              </div>

                              <div className="mt-2 space-y-1 items-center justify-center">
                                {m.scores[0].sets.map((set, idx) => {
                                  const isSameScore =
                                    set.home === set.away &&
                                    set.home > 0 &&
                                    set.away > 0; // check if scores are equal

                                  const disableHome = true;
                                  const disableAway = true;

                                  return (
                                    <div
                                      key={set._id}
                                      className="flex space-x-2 items-center justify-center"
                                    >
                                      <div className="flex flex-row">
                                        <input
                                          type="number"
                                          min={0}
                                          max={21} // maximum score allowed
                                          className={`w-full p-1 border rounded text-center mr-2 ${
                                            isSameScore
                                              ? "border-red-500"
                                              : "border-gray-500"
                                          } `}
                                          value={set.home === 0 ? "" : set.home}
                                          disabled={disableHome}
                                        />
                                        <span>:</span>
                                        <input
                                          type="number"
                                          min={0}
                                          max={21}
                                          className={`w-max-full p-1 border rounded text-center ml-2 ${
                                            isSameScore
                                              ? "border-red-500"
                                              : "border-gray-500"
                                          } `}
                                          value={set.away === 0 ? "" : set.away}
                                          disabled={disableAway}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                   </div>
                );
              })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-lg p-6 max-h-96 overflow-y-auto mt-4 ml-4 mr-4">
            <h2 className="text-xl font-semibold mb-4">No groups available.</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupStageList;
