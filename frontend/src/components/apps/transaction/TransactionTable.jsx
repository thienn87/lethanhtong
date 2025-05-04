import React from "react";
import { Typography, Button } from "@material-tailwind/react";

const TransactionTable = ({
  feeCurrentMonth,
  feeTable,
  handleCheck,
  handlePaidAmount,
  handleDebt,
  handleNote,
  handleFeeCode,
  handleFeeName,
  formatCurrency,
  addNewRow,
  processedFees = []
}) => {
  return (
    <div className="w-full bg-white rounded-[1rem] shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-max table-auto text-left">
          <thead>
            <tr>
              <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-bold leading-none opacity-70 text-center"
                >
                  STT
                </Typography>
              </th>
              <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-bold leading-none opacity-70 text-center"
                >
                  Mã HP
                </Typography>
              </th>
              <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-bold leading-none opacity-70 text-center"
                >
                  Tên HP
                </Typography>
              </th>
              <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-bold leading-none opacity-70 text-center"
                >
                  Dư nợ
                </Typography>
              </th>
              <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-bold leading-none opacity-70 text-center"
                >
                  Phải thu
                </Typography>
              </th>
              <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-bold leading-none opacity-70 text-center"
                >
                  Đã thu
                </Typography>
              </th>
              <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-bold leading-none opacity-70 text-center"
                >
                  Dư cuối
                </Typography>
              </th>
              <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-bold leading-none opacity-70 text-center"
                >
                  Số tiền
                </Typography>
              </th>
              <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-bold leading-none opacity-70 text-center"
                >
                  Ghi chú
                </Typography>
              </th>
              <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-bold leading-none opacity-70 text-center"
                >
                  Chọn
                </Typography>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Use processedFees if available, otherwise fall back to feeCurrentMonth */}
            {(processedFees.length > 0 ? processedFees : feeCurrentMonth).map((bill, index) => {
              const classes = "p-4 border-b border-blue-gray-50";
              
              // For backward compatibility
              const openingDebtBalance = bill.opening_debt_balance !== undefined 
                ? bill.opening_debt_balance 
                : (feeTable?.tong_du_cuoi_chi_tiet && typeof feeTable.tong_du_cuoi_chi_tiet === 'object'
                  ? Number(feeTable.tong_du_cuoi_chi_tiet[bill.code] || 0)
                  : 0);
              
              const totalPaidAmount = bill.total_paid_amount !== undefined
                ? bill.total_paid_amount
                : 0;
              
              const remainingAmount = bill.remaining_amount !== undefined
                ? bill.remaining_amount
                : ((openingDebtBalance + totalPaidAmount) - (Number(bill.default_amount) || 0));
              
              const suggestedPayment = bill.suggested_payment !== undefined
                ? bill.suggested_payment
                : (remainingAmount < 0 ? Math.abs(remainingAmount) : 0);
              
              return (
                <tr key={index}>
                  <td className={classes}>
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal text-center"
                    >
                      {index + 1}
                    </Typography>
                  </td>
                  <td className={classes}>
                    {bill.isNewRow ? (
                      <input
                        placeholder="Mã HP"
                        value={bill.code || ""}
                        onChange={(e) => handleFeeCode(index, e.target.value)}
                        type="text"
                        className="font-normal w-full text-center text-[14px] text-black border border-gray-300 py-2 px-1 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 rounded-md"
                      />
                    ) : (
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal text-center"
                      >
                        {bill.code}
                      </Typography>
                    )}
                  </td>
                  <td className={classes}>
                    {bill.isNewRow ? (
                      <input
                        placeholder="Tên HP"
                        value={bill.name || ""}
                        onChange={(e) => handleFeeName(index, e.target.value)}
                        type="text"
                        className="font-normal w-full text-center text-[14px] text-black border border-gray-300 py-2 px-1 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 rounded-md"
                      />
                    ) : (
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal text-center"
                      >
                        {bill.name}
                      </Typography>
                    )}
                  </td>
                  <td className={classes}>
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal text-center"
                    >
                      {formatCurrency(openingDebtBalance)}
                    </Typography>
                  </td>
                  <td className={classes}>
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal text-center"
                    >
                      {formatCurrency(bill.default_amount || 0)}
                    </Typography>
                  </td>
                  <td className={classes}>
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal text-center"
                    >
                      {formatCurrency(totalPaidAmount)}
                    </Typography>
                  </td>
                  <td className={classes}>
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal text-center"
                    >
                      {formatCurrency(Math.abs(remainingAmount))}
                    </Typography>
                  </td>
                  <td className={classes}>
                    <input
                      placeholder="Số tiền"
                      defaultValue={suggestedPayment}
                      onChange={(e) => handlePaidAmount(index, e.target.value)}
                      type="number"
                      className="font-normal w-full text-center text-[14px] text-black border border-gray-300 py-2 px-1 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 rounded-md"
                    />
                  </td>
                  <td className={classes}>
                    <input
                      placeholder="Ghi chú"
                      defaultValue={bill.note || bill.latest_note || ""}
                      onChange={(e) => handleNote(index, e.target.value)}
                      type="text"
                      className="font-normal w-full text-center text-[14px] text-black border border-gray-300 py-2 px-1 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 rounded-md"
                    />
                  </td>
                  <td className={classes}>
                    <input
                      type="checkbox"
                      checked={bill.isChecked !== undefined ? bill.isChecked : true}
                      onChange={(e) => handleCheck(index, e.target.checked)}
                      className="w-4 h-4 text-violet-600 bg-gray-100 border-gray-300 rounded focus:ring-violet-500 focus:ring-2"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end px-4 py-3">
        <Button
          onClick={addNewRow}
          variant="outlined"
          color="blue"
          className="flex items-center gap-2"
        >
          <span>+ Thêm dòng</span>
        </Button>
      </div>
    </div>
  );
};

export default TransactionTable;