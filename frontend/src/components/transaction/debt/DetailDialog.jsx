import React from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Typography,
  Button,
} from "@material-tailwind/react";

const DetailDialog = ({ open, onClose, month, grades }) => {
  return (
    <div className="h-screen w-screen flex justify-center items-center fixed bg-opacity-60 backdrop-blur-sm z-50">
      <Dialog
        open={open}
        handler={onClose}
        size="xl"
        className="p-4 w-[85%] max-w-4xl"
        animate={{
          mount: { scale: 1, y: 0 },
          unmount: { scale: 0.9, y: -100 },
        }}
      >
        <DialogHeader className="relative m-0 block border-b pb-4">
          <Typography variant="h4" color="blue-gray" className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Chi tiết tháng {month}
          </Typography>
          <Typography variant="small" color="gray" className="mt-1">
            Thông tin chi tiết theo khối
          </Typography>
        </DialogHeader>
        <DialogBody className="space-y-4 px-2 py-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max table-auto text-center">
              <thead>
                <tr>
                  {[
                    {
                      title: "Khối",
                    },
                    {
                      title: "Tổng doanh thu",
                    },
                    {
                      title: "Tổng đã thu",
                    },
                    {
                      title: "Tổng dư nợ",
                    },
                  ].map(({ title }) => (
                    <th
                      key={uuidv4()}
                      className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4"
                    >
                      <Typography
                        variant="small"
                        color="black"
                        className="font-bold leading-none opacity-70"
                      >
                        {title}
                      </Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grades && grades.length > 0 ? (
                  grades.map(({ grade, revenue, outstandingDebt }, index) => {
                    const isLast = index === grades.length - 1;
                    const classes = isLast
                      ? "p-4"
                      : "p-4 border-b border-blue-gray-50";
                    const gradePaid = revenue - outstandingDebt;
                    
                    return (
                      <tr key={uuidv4()} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className={classes}>
                          <div className="flex items-center justify-center gap-3">
                            <Typography
                              variant="small"
                              color="blue-gray"
                              className="font-medium"
                            >
                              {grade}
                            </Typography>
                          </div>
                        </td>
                        <td className={classes}>
                          <div className="flex items-center justify-center gap-3">
                            <Typography
                              variant="small"
                              color="green"
                              className="font-medium"
                            >
                              {revenue.toLocaleString()} vnd
                            </Typography>
                          </div>
                        </td>
                        <td className={classes}>
                          <div className="flex items-center justify-center gap-3">
                            <Typography
                              variant="small"
                              color="green"
                              className="font-medium"
                            >
                              {(gradePaid < 0 ? 0 : gradePaid).toLocaleString()}{" "}
                              vnd
                            </Typography>
                          </div>
                        </td>
                        <td className={classes}>
                          <div className="flex items-center justify-center gap-3">
                            <Typography
                              variant="small"
                              color={
                                outstandingDebt === 0 ? "blue-gray" : "red"
                              }
                              className="font-medium"
                            >
                              {outstandingDebt.toLocaleString()} vnd
                            </Typography>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center">
                      <Typography color="blue-gray">Không có dữ liệu chi tiết</Typography>
                    </td>
                  </tr>
                )}
              </tbody>
              {grades && grades.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-50">
                    <td className="p-4 font-medium">
                      <Typography variant="small" color="blue-gray" className="font-bold">
                        Tổng cộng
                      </Typography>
                    </td>
                    <td className="p-4">
                      <Typography variant="small" color="green" className="font-bold">
                        {grades.reduce((sum, grade) => sum + grade.revenue, 0).toLocaleString()} vnd
                      </Typography>
                    </td>
                    <td className="p-4">
                      <Typography variant="small" color="green" className="font-bold">
                        {grades.reduce((sum, grade) => {
                          const paid = grade.revenue - grade.outstandingDebt;
                          return sum + (paid < 0 ? 0 : paid);
                        }, 0).toLocaleString()} vnd
                      </Typography>
                    </td>
                    <td className="p-4">
                      <Typography variant="small" color="red" className="font-bold">
                        {grades.reduce((sum, grade) => sum + grade.outstandingDebt, 0).toLocaleString()} vnd
                      </Typography>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </DialogBody>
        <DialogFooter className="pt-2 border-t">
          <Button 
            variant="gradient" 
            color="blue" 
            onClick={onClose}
            className="flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            Đóng
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default DetailDialog;