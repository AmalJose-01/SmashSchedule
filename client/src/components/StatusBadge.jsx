// components/StatusBadge.jsx
import React from "react";
import { Flame, CheckCircle, Clock } from "lucide-react";

const StatusBadge = ({ status }) => {
  switch (status?.toLowerCase()) {
    case "finished":
      return (
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> Finished
        </span>
      );

    case "ongoing":
      return (
        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-1">
          <Flame className="w-3 h-3" /> Live
        </span>
      );

    case "scheduled":
    default:
      return (
        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs flex items-center gap-1">
          <Clock className="w-3 h-3" /> Scheduled
        </span>
      );
  }
};

export default StatusBadge;
