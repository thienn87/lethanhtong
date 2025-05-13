import React from "react";
import { Typography, Input } from "@material-tailwind/react";

const TransactionHeader = ({
  studentName,
  studentData,
  transactionId,
  currentDay,
  currentMonth,
  noiDungHoaDown,
  onNoiDungChange
}) => {
  return (
      <div className="space-y-4 py-4 px-5 bg-white rounded-[1rem] w-[70%] shadow-sm mt-3">
        <Typography variant="h4" color="blue-gray" className="w-full text-center font-bold">
          THU HỌC PHÍ
        </Typography>
        <div className="flex mb-3 gap-6">
          <div className="flex flex-col text-left w-2/3 gap-1">
            <Typography variant="paragraph" color="blue-gray" className="text-base">
              <span className="font-medium">Tên học sinh: </span> 
              <span className="font-bold">{studentName}</span>
            </Typography>
            <Typography variant="paragraph" color="blue-gray" className="text-base">
              <span className="font-medium">Mã học sinh: </span> 
              <span className="font-bold">{studentData?.mshs}</span>
            </Typography>
            <Typography variant="paragraph" color="blue-gray" className="text-base">
              <span className="font-medium">Khối: </span> 
              <span className="font-bold">{studentData?.grade}</span>
              <span className="font-medium ml-6">Lớp: </span> 
              <span className="font-bold">{studentData?.class}</span>
            </Typography>
            <div className="flex items-center mt-1">
              <span className="font-medium text-base mr-2">Nội dung: </span>
              <input
                name="noidunghoadon"
                type="text"
                value={noiDungHoaDown}
                onChange={onNoiDungChange}
                className="border border-gray-300 rounded-md px-2 py-1 flex-1 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
          </div>
          <div className="flex-none text-left w-1/3 gap-1">
            <Typography variant="paragraph" color="blue-gray" className="text-base">
              <span className="font-medium">Số chứng từ: </span> 
              <span className="font-bold">{transactionId}</span>
            </Typography>
            <Typography variant="paragraph" color="blue-gray" className="text-base">
              <span className="font-medium">Ngày: </span> 
              <span className="font-bold">{currentDay}</span>
            </Typography>
            <Typography variant="paragraph" color="blue-gray" className="text-base">
              <span className="font-medium">Học phí tháng: </span>
              <span className="font-bold">{currentMonth}</span>
            </Typography>
          </div>
        </div>
      </div>
    );
};

export default React.memo(TransactionHeader);