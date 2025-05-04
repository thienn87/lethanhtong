import React from "react";
import { Typography } from "@material-tailwind/react";

const ProcessingLog = ({ logs }) => {
  // Function to format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  // Function to get appropriate color based on log type
  const getLogColor = (type) => {
    switch (type) {
      case "error":
        return "text-red-500";
      case "warning":
        return "text-amber-500";
      case "success":
        return "text-green-500";
      default:
        return "text-blue-gray-700";
    }
  };

  // Function to get appropriate icon based on log type
  const getLogIcon = (type) => {
    switch (type) {
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "success":
        return "✅";
      default:
        return "ℹ️";
    }
  };

  return (
    <div className="mt-4 border rounded-lg overflow-hidden">
      <div className="bg-gray-100 p-2 border-b">
        <Typography variant="small" className="font-medium">
          Nhật ký xử lý
        </Typography>
      </div>
      <div className="max-h-60 overflow-y-auto p-2 bg-gray-50">
        {logs.length === 0 ? (
          <Typography variant="small" className="text-gray-500 italic">
            Không có nhật ký
          </Typography>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1 py-1 border-b border-gray-100 last:border-0">
              <Typography variant="small" className={`${getLogColor(log.type)} flex items-start`}>
                <span className="mr-2 flex-shrink-0">{getLogIcon(log.type)}</span>
                <span className="flex-grow">{log.message}</span>
                <span className="ml-2 text-xs text-gray-500 flex-shrink-0">
                  {formatTime(log.timestamp)}
                </span>
              </Typography>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProcessingLog;