import React from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Button,
  IconButton,
  Spinner
} from "@material-tailwind/react";
import { DocumentMagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

const TransactionTable = ({ 
  displayData, 
  TABLE_HEAD, 
  handleOpenDialog, 
  currentYear, 
  loading, 
  progress, 
  downloadRecordsList,
  open
}) => {
  return (
    <Card aria-hidden={open} className="h-full w-full shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader floated={false} shadow={false} className="rounded-none px-4 py-5 bg-white border-b">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <Typography variant="h5" color="blue-gray" className="font-bold">
              Bảng kê giao dịch năm {currentYear}
            </Typography>
            <Typography color="gray" className="mt-1 font-normal">
              Danh sách các giao dịch theo tháng
            </Typography>
          </div>
          <div className="flex w-full shrink-0 gap-2 md:w-max">
            <Button
              disabled={loading}
              className={`${
                progress === 0 || progress === 100
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-black text-white"
              } flex items-center gap-3 shadow-md hover:shadow-lg transition-all duration-300`}
              size="sm"
              onClick={downloadRecordsList}
            >
              {(progress === 0 || progress === 100) ? (
                <>
                  <ArrowDownTrayIcon strokeWidth={2} className="h-5 w-5" />
                  Tải Xuống
                </>
              ) : (
                <>
                  <Spinner className="h-4 w-4 mr-2" />
                  Đang tải... {progress}%
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardBody className="overflow-auto px-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max table-auto text-center">
            <thead>
              <tr>
                {TABLE_HEAD.map((head, index) => (
                  <th
                    key={`${index}-${uuidv4()}`}
                    className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4"
                  >
                    <Typography
                      variant="small"
                      color="black"
                      className="font-bold leading-none opacity-70"
                    >
                      {head}
                    </Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData && displayData.length > 0 ? (
                displayData.map((item, index) => {
                  const isLast = index === displayData.length - 1;
                  const classes = isLast
                    ? "p-4"
                    : "p-4 border-b border-blue-gray-50";
                  const totalPaid =
                    item.totalRevenue - item.totalOutstandingDebt;

                  return (
                    <tr key={uuidv4()} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className={classes}>
                        <div className="flex items-center justify-center gap-3">
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="font-medium"
                          >
                            {item.month}
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
                            {item.totalRevenue.toLocaleString()} vnd
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
                            {(totalPaid < 0 ? 0 : totalPaid).toLocaleString()}{" "}
                            vnd
                          </Typography>
                        </div>
                      </td>
                      <td className={classes}>
                        <div className="flex items-center justify-center gap-3">
                          <Typography
                            variant="small"
                            color={
                              item.totalOutstandingDebt === 0
                                ? "blue-gray"
                                : "red"
                            }
                            className="font-medium"
                          >
                            {item.totalOutstandingDebt.toLocaleString()} vnd
                          </Typography>
                        </div>
                      </td>

                      <td className={classes}>
                        <IconButton
                          variant="text"
                          color="blue"
                          className="hover:bg-blue-50"
                          onClick={() => handleOpenDialog(item)}
                        >
                          <DocumentMagnifyingGlassIcon className="h-5 w-5" />
                        </IconButton>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center">
                        <Spinner className="h-8 w-8 text-blue-500 mb-2" />
                        <Typography color="blue-gray">Đang tải dữ liệu...</Typography>
                      </div>
                    ) : (
                      <Typography color="blue-gray">Không có dữ liệu giao dịch</Typography>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
};

export default TransactionTable;