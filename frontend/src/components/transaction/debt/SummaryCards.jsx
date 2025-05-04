import React from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Card,
  CardBody,
  Typography,
} from "@material-tailwind/react";

const SummaryCards = ({ totalYearlyRevenue, totalYearlyPaid, totalYearlyOutstandingDebt, open }) => {
  const summaryData = [
    {
      title: "Tổng Doanh Thu",
      value: totalYearlyRevenue,
      color: "bg-gradient-to-r from-violet-600 to-violet-800",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 opacity-80" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      title: "Tổng Đã Thu",
      value: totalYearlyPaid,
      color: "bg-gradient-to-r from-green-600 to-green-800",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 opacity-80" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 013 3v1a1 1 0 102 0v-1a5 5 0 00-5-5H8.414l1.293-1.293z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      title: "Tổng Dư Nợ",
      value: totalYearlyOutstandingDebt,
      color: "bg-gradient-to-r from-red-500 to-red-700",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 opacity-80" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
      )
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {summaryData.map(({ title, value, color, icon }) => (
        <Card key={uuidv4()} className={`${color} rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300`}>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="h5" color="white" className="mb-2 font-bold">
                  {title}
                </Typography>
                <Typography color="white" variant="h4" className="text-2xl font-bold">
                  {value.toLocaleString()} <span className="text-sm font-normal">vnd</span>
                </Typography>
              </div>
              <div className="rounded-full bg-white bg-opacity-20 p-3">
                {icon}
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
};

export default SummaryCards;