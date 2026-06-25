const mongoose = require("mongoose");
const RoundRobinMember = require("../models/RoundRobinMember");
const RoundRobinPlayer = require("../models/RoundRobinPlayer");
const RoundRobinTournament = require("../models/RoundRobinTournament");
const { GRADE_DEFAULT_POINTS } = require("../constants/grades");

const RoundRobinMemberController = {
  createMember: async (req, res) => {
    try {
      const { name, grade, points, isMember, email, contact, nationalMemberId, dateOfBirth, gender } = req.body;
      if (!name || !email) {
        return res.status(400).json({ message: "name and email are required" });
      }

      const cleanEmail = email.toLowerCase().trim();
      const existing = await RoundRobinMember.findOne({ email: cleanEmail, adminId: req.userId });
      if (existing) {
        if (existing.isActive) {
          return res.status(409).json({ message: "A member with this email already exists" });
        }
        // Previously removed member — reactivate instead of blocking re-creation.
        // Points are preserved across reactivation unless explicitly provided.
        existing.isActive = true;
        existing.name = name;
        if (grade) existing.grade = grade;
        if (points !== undefined) existing.points = points;
        if (isMember !== undefined) existing.isMember = isMember;
        existing.contact = contact || "";
        if (nationalMemberId) existing.nationalMemberId = nationalMemberId;
        if (dateOfBirth) existing.dateOfBirth = dateOfBirth;
        if (gender) existing.gender = gender;
        await existing.save();
        return res.status(201).json({ message: "Member created", data: existing });
      }

      const resolvedGrade = grade || "Unrated";
      const member = await RoundRobinMember.create({
        adminId: req.userId,
        name,
        grade: resolvedGrade,
        points: points !== undefined ? points : GRADE_DEFAULT_POINTS[resolvedGrade] ?? 0,
        ...(isMember !== undefined && { isMember }),
        email: cleanEmail,
        contact: contact || "",
        ...(nationalMemberId && { nationalMemberId }),
        ...(dateOfBirth && { dateOfBirth }),
        ...(gender && { gender }),
      });

      return res.status(201).json({ message: "Member created", data: member });
    } catch (error) {
      console.log("createMember error:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },

  getMembers: async (req, res) => {
    try {
      const members = await RoundRobinMember.find({ adminId: req.userId, isActive: true }).sort({ name: 1 });
      return res.status(200).json({ message: "Members fetched", data: members });
    } catch (error) {
      console.log("getMembers error:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },

  getMemberById: async (req, res) => {
    try {
      const { memberId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(memberId)) {
        return res.status(400).json({ message: "Invalid member id" });
      }

      const member = await RoundRobinMember.findOne({ _id: memberId, adminId: req.userId, isActive: true });
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }

      return res.status(200).json({ message: "Member fetched", data: member });
    } catch (error) {
      console.log("getMemberById error:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },

  updateMember: async (req, res) => {
    try {
      const { memberId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(memberId)) {
        return res.status(400).json({ message: "Invalid member id" });
      }

      const member = await RoundRobinMember.findOne({ _id: memberId, adminId: req.userId });
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }

      const { name, grade, points, isMember, contact, nationalMemberId, dateOfBirth, gender } = req.body;
      if (name !== undefined) member.name = name;
      if (grade !== undefined) member.grade = grade;
      if (points !== undefined) member.points = points;
      if (isMember !== undefined) member.isMember = isMember;
      if (contact !== undefined) member.contact = contact;
      if (nationalMemberId !== undefined) member.nationalMemberId = nationalMemberId;
      if (dateOfBirth !== undefined) member.dateOfBirth = dateOfBirth || null;
      if (gender !== undefined) member.gender = gender;

      await member.save();
      return res.status(200).json({ message: "Member updated", data: member });
    } catch (error) {
      console.log("updateMember error:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },

  deleteMember: async (req, res) => {
    try {
      const { memberId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(memberId)) {
        return res.status(400).json({ message: "Invalid member id" });
      }

      const member = await RoundRobinMember.findOne({ _id: memberId, adminId: req.userId });
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }

      member.isActive = false;
      await member.save();

      return res.status(200).json({ message: "Member deleted" });
    } catch (error) {
      console.log("deleteMember error:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },

  bulkImportMembers: async (req, res) => {
    try {
      const { members } = req.body;
      if (!Array.isArray(members) || members.length === 0) {
        return res.status(400).json({ message: "members array is required and cannot be empty" });
      }

      const VALID_GRADES = ["A", "B", "C", "D", "E", "F", "G", "H", "Unrated"];

      /**
       * Parse a dateOfBirth string that may be DD.MM.YYYY, DD/MM/YYYY,
       * or any format natively supported by Date.parse.
       * Returns a Date object or null if unparseable.
       */
      const parseDOB = (raw) => {
        if (!raw) return null;
        const str = String(raw).trim();
        if (!str) return null;
        // Handle DD.MM.YYYY or DD/MM/YYYY
        const dmyMatch = str.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
        if (dmyMatch) {
          const [, dd, mm, yyyy] = dmyMatch;
          const d = new Date(`${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`);
          return isNaN(d.getTime()) ? null : d;
        }
        const d = new Date(str);
        return isNaN(d.getTime()) ? null : d;
      };

      /**
       * Sanitise grade — map anything not in the enum to "Unrated".
       */
      const sanitiseGrade = (raw) =>
        VALID_GRADES.includes(raw) ? raw : "Unrated";

      const results = { success: 0, updated: 0, reactivated: 0, failed: 0, errors: [] };

      for (const m of members) {
        const { name, grade, email, contact, nationalMemberId, dateOfBirth, gender } = m;
        if (!name || !email) {
          results.failed++;
          results.errors.push({ email: email || "unknown", reason: "name and email are required" });
          continue;
        }

        try {
          const cleanEmail = email.toLowerCase().trim();
          const cleanGrade = sanitiseGrade(grade);
          const cleanDOB   = parseDOB(dateOfBirth);

          const payload = {
            name,
            grade: cleanGrade,
            contact: contact || "",
            ...(nationalMemberId && { nationalMemberId }),
            ...(cleanDOB        && { dateOfBirth: cleanDOB }),
            ...(gender          && { gender }),
          };

          const existing = await RoundRobinMember.findOne({ email: cleanEmail, adminId: req.userId });
          if (existing) {
            // Update existing member instead of failing — points and
            // membership status are left untouched so match-earned points
            // and admin-set membership aren't wiped by a re-import.
            const wasInactive = !existing.isActive;
            Object.assign(existing, payload);
            existing.isActive = true; // revive soft-deleted members instead of leaving them hidden
            await existing.save();
            if (wasInactive) {
              results.reactivated++;
            } else {
              results.updated++;
            }
          } else {
            // Import files have no membership column, so new members are
            // marked non-member by default — admins flip this via Edit.
            await RoundRobinMember.create({
              adminId: req.userId,
              email: cleanEmail,
              ...payload,
              points: GRADE_DEFAULT_POINTS[cleanGrade] ?? 0,
              isMember: false,
            });
            results.success++;
          }
        } catch (err) {
          results.failed++;
          results.errors.push({ email, reason: err.message });
        }
      }

      return res.status(200).json({ message: "Bulk import complete", data: results });
    } catch (error) {
      console.log("bulkImportMembers error:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },

  addMembersToTournament: async (req, res) => {
    try {
      const { tournamentId } = req.params;
      const { memberIds } = req.body;

      if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
        return res.status(400).json({ message: "Invalid tournament id" });
      }
      if (!Array.isArray(memberIds) || memberIds.length === 0) {
        return res.status(400).json({ message: "memberIds array is required" });
      }

      const tournament = await RoundRobinTournament.findOne({ _id: tournamentId, adminId: req.userId });
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }

      const members = await RoundRobinMember.find({ _id: { $in: memberIds }, isActive: true });

      const created = [];
      const skipped = [];

      for (const member of members) {
        try {
          const player = await RoundRobinPlayer.create({
            tournamentId,
            memberId: member._id,
            name: member.name,
            email: member.email,
            contact: member.contact,
            grade: member.grade,
            isMember: member.isMember,
          });
          created.push(player);
        } catch (err) {
          if (err.code === 11000) {
            skipped.push(member.email);
          } else {
            throw err;
          }
        }
      }

      return res.status(201).json({
        message: "Members added to tournament",
        data: { created, skipped },
      });
    } catch (error) {
      console.log("addMembersToTournament error:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },

  getTournamentPlayers: async (req, res) => {
    try {
      const { tournamentId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
        return res.status(400).json({ message: "Invalid tournament id" });
      }

      const players = await RoundRobinPlayer.find({ tournamentId }).sort({ name: 1 });
      return res.status(200).json({ message: "Players fetched", data: players });
    } catch (error) {
      console.log("getTournamentPlayers error:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },

  removePlayerFromTournament: async (req, res) => {
    try {
      const { tournamentId, playerId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(tournamentId) || !mongoose.Types.ObjectId.isValid(playerId)) {
        return res.status(400).json({ message: "Invalid id" });
      }

      const player = await RoundRobinPlayer.findOneAndDelete({ _id: playerId, tournamentId });
      if (!player) {
        return res.status(404).json({ message: "Player not found in tournament" });
      }

      return res.status(200).json({ message: "Player removed from tournament" });
    } catch (error) {
      console.log("removePlayerFromTournament error:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },
};

module.exports = RoundRobinMemberController;
