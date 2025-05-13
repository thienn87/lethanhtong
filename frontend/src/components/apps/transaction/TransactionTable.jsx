import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Typography, Button } from "@material-tailwind/react";
import debounce from "lodash/debounce";

const FeeRow = React.memo(({ 
  bill, 
  index, 
  classes, 
  formatCurrency, 
  handleCheck, 
  handlePaidAmount, 
  handleNote, 
  handleFeeCode, 
  handleFeeName,
  handleDebt,
  feeTable
}) => {
  const openingDebtBalance = bill.opening_debt_balance ?? (feeTable?.tong_du_cuoi_chi_tiet?.[bill.code] || 0);
  const totalPaidAmount = bill.total_paid_amount ?? 0;
  const remainingAmount = bill.remaining_amount ?? 0;
  const suggestedPayment = bill.suggested_payment ?? (remainingAmount < 0 ? Math.abs(remainingAmount) : 0);
  const formattedAmountPaid = formatCurrency(bill.amount_paid ?? suggestedPayment);
  const [formattedAmount, setFormattedAmount] = useState(formattedAmountPaid);
  const [formattedDefaultAmount, setFormattedDefaultAmount] = useState(formatCurrency(bill.default_amount || 0));

  useEffect(() => {
    setFormattedAmount(formattedAmountPaid);
  }, [formattedAmountPaid]);

  const debouncedHandleAmountChange = useCallback(
    debounce((rawValue, code) => {
      const numericValue = parseInt(rawValue.replace(/[^\d]/g, ''), 10);
      setFormattedAmount(isNaN(numericValue) ? "" : formatCurrency(numericValue));
      handlePaidAmount(code, isNaN(numericValue) ? "" : numericValue);
    }, 50),
    [formatCurrency, handlePaidAmount]
  );

  const debouncedHandleDefaultAmountChange = useCallback(
    debounce((rawValue, code) => {
      const numericValue = parseInt(rawValue.replace(/[^\d]/g, ''), 10);
      setFormattedDefaultAmount(isNaN(numericValue) ? "" : formatCurrency(numericValue));
      setFormattedAmount(isNaN(numericValue) ? "" : formatCurrency(numericValue));
      handleDebt(code, isNaN(numericValue) ? 0 : numericValue);
      handlePaidAmount(code, isNaN(numericValue) ? 0 : numericValue);
    }, 50),
    [formatCurrency, handleDebt, handlePaidAmount]
  );

  const handleAmountChange = (e) => {
    debouncedHandleAmountChange(e.target.value, bill.code);
  };

  const handleDefaultAmountChange = (e) => {
    debouncedHandleDefaultAmountChange(e.target.value, bill.code);
  };

  return (
    <tr>
      <td className={classes}>
        <Typography variant="small" color="blue-gray" className="font-normal text-center">
          {index + 1}
        </Typography>
      </td>
      <td className={classes}>
        {bill.isNewRow ? (
          <>
            <input
              placeholder="Mã HP"
              value={bill.code || "OT"}
              onChange={(e) => handleFeeCode(bill.code, e.target.value)}
              type="text"
              disabled
              className="font-normal w-8 text-center text-[14px] text-black border bg-white border-transparent py-2 px-1 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 rounded-md"
            />
            <input
              placeholder="Tên HP"
              value="OT"
              onChange={(e) => handleFeeName(bill.code, e.target.value)}
              type="hidden"
              className="font-normal w-0 text-center text-[14px] text-black border border-gray-300 py-2 px-1 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 rounded-md"
            />
          </>
        ) : (
          <Typography variant="small" color="blue-gray" className="font-normal text-center">
            {bill.code}
          </Typography>
        )}
      </td>
      {!bill.isNewRow && (
        <td className={classes}>
          <Typography variant="small" color="blue-gray" className="font-normal text-center">
            {bill.name}
          </Typography>
        </td>
      )}
      {!bill.isNewRow && (
        <td className={classes}>
          <Typography variant="small" color="blue-gray" className="font-normal text-center">
            {formatCurrency(openingDebtBalance)}
          </Typography>
        </td>
      )}
      {bill.isNewRow ? (
        <td className={classes} colSpan={2}>
          <input
            placeholder="Phải thu"
            onChange={handleDefaultAmountChange}
            type="text"
            value={formattedDefaultAmount}
            className="font-normal w-10/12 text-center text-[14px] text-black border border-gray-300 py-2 px-1 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 rounded-md"
          />
        </td>
      ) : (
        <td className={classes}>
          <Typography variant="small" color="blue-gray" className="font-normal text-center">
            {formatCurrency(bill.default_amount || 0)}
          </Typography>
        </td>
      )}
      {!bill.isNewRow && (
        <td className={classes}>
          <Typography variant="small" color="blue-gray" className="font-normal text-center">
            {formatCurrency(totalPaidAmount)}
          </Typography>
        </td>
      )}
      {!bill.isNewRow && (
        <td className={classes}>
          <Typography variant="small" color="blue-gray" className="font-normal text-center">
            {formatCurrency(remainingAmount)}
          </Typography>
        </td>
      )}
      {bill.isNewRow ? (
        <td className={classes} colSpan={2}>
          <input
            placeholder="Số tiền"
            value={formattedAmount}
            onChange={handleAmountChange}
            type="text"
            disabled={bill.isNewRow}
            className={`font-normal w-2/3 text-center text-[14px] text-black border border-gray-300 py-2 px-1 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 rounded-md ${bill.isNewRow ? 'bg-gray-100' : ''}`}
          />
        </td>
      ) : (
        <td className={classes}>
          <input
            placeholder="Số tiền"
            value={formattedAmount}
            onChange={handleAmountChange}
            type="text"
            disabled={bill.isNewRow}
            className={`font-normal w-full text-center text-[14px] text-black border border-gray-300 py-2 px-1 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 rounded-md ${bill.isNewRow ? 'bg-gray-100' : ''}`}
          />
        </td>
      )}
      <td className={classes} colSpan={bill.isNewRow ? 3 : undefined}>
        <input
          placeholder={bill.isNewRow ? "Nhập nội dung chi tiết" : "Ghi chú"}
          defaultValue={bill.note || bill.latest_note || ""}
          onChange={(e) => handleNote(bill.code, e.target.value)}
          type="text"
          required={bill.isNewRow}
          className="font-normal w-full text-center text-[14px] text-black border border-gray-300 py-2 px-1 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 rounded-md"
        />
      </td>
      <td className={classes}>
        <input
          type="checkbox"
          checked={bill.isChecked ?? false}
          onChange={(e) => handleCheck(bill.code, e.target.checked)}
          className="w-4 h-4 text-violet-600 bg-gray-100 border-gray-300 rounded focus:ring-violet-500 focus:ring-2"
        />
      </td>
    </tr>
  );
});

const TransactionTable = ({
  feeTable,
  handleCheck,
  handlePaidAmount,
  handleDebt,
  handleNote,
  handleFeeCode,
  handleFeeName,
  formatCurrency,
  addNewRow,
  processedFees = [],
  totalPaymentAmount,
  setTotalPaymentAmount,
  distributePayment,
  handleTotalPaymentChange
}) => {
  const [localTotalPayment, setLocalTotalPayment] = useState("");
  const [formattedTotalPayment, setFormattedTotalPayment] = useState("");

  useEffect(() => {
    if (totalPaymentAmount) {
      setLocalTotalPayment(totalPaymentAmount.toString());
      setFormattedTotalPayment(formatCurrency(totalPaymentAmount));
    }
  }, [totalPaymentAmount, formatCurrency]);

  const debouncedHandleTotalPaymentChange = useCallback(
    debounce((rawValue) => {
      const numericValue = parseInt(rawValue.replace(/[^\d]/g, ''), 10);
      setLocalTotalPayment(isNaN(numericValue) ? "" : numericValue.toString());
      setFormattedTotalPayment(isNaN(numericValue) ? "" : formatCurrency(numericValue));
      if (!isNaN(numericValue) && numericValue > 0) {
        setTotalPaymentAmount(numericValue);
        distributePayment(numericValue);
      }
    }, 50),
    [formatCurrency, setTotalPaymentAmount, distributePayment]
  );

  const handleLocalTotalPaymentChange = (e) => {
    debouncedHandleTotalPaymentChange(e.target.value);
  };

  const totalSuggestedPayment = useMemo(() => {
    return processedFees
      .filter(bill => bill.isChecked === true)
      .reduce((sum, bill) => {
        const suggestedPayment = bill.suggested_payment ?? (bill.remaining_amount < 0 ? Math.abs(bill.remaining_amount) : 0);
        return sum + parseFloat(suggestedPayment || 0);
      }, 0);
  }, [processedFees]);

  const classes = "p-4 border-b border-blue-gray-50";

  return (
    <div className="w-full bg-white rounded-[1rem] shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <Typography variant="h6" color="blue-gray" className="font-bold">
              Tổng số tiền nộp:
            </Typography>
            <input
              type="text"
              value={formattedTotalPayment}
              onChange={handleLocalTotalPaymentChange}
              placeholder="Nhập tổng số tiền"
              className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Typography variant="h6" color="blue-gray" className="font-bold">
              Tổng phải thu:
            </Typography>
            <Typography variant="h6" color="green" className="font-bold">
              {formatCurrency(totalSuggestedPayment)}
            </Typography>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-max table-auto text-left">
          <thead>
            <tr>
              <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4 w-12">STT</th>
              <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4 w-20">Mã HP</th>
              <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4 w-40">Tên HP</th>
              <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4 w-24">Dư nợ</th>
              <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4 w-24">Phải thu</th>
              <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4 w-24">Đã thu</th>
              <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4 w-24">Dư cuối</th>
              <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4 w-28">Số tiền</th>
              <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4 w-40">Ghi chú</th>
              <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4 w-16">Chọn</th>
            </tr>
          </thead>
          <tbody>
            {processedFees.map((bill, index) => (
              <FeeRow
                key={bill.code}
                bill={bill}
                index={index}
                classes={classes}
                formatCurrency={formatCurrency}
                handleCheck={handleCheck}
                handlePaidAmount={handlePaidAmount}
                handleNote={handleNote}
                handleFeeCode={handleFeeCode}
                handleFeeName={handleFeeName}
                handleDebt={handleDebt}
                feeTable={feeTable}
              />
            ))}
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

export default React.memo(TransactionTable);