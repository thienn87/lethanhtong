import React, { Suspense, lazy, useEffect, useState } from "react";
import {
  DialogHeader,
  DialogBody,
  DialogFooter,
  Button,
  Spinner,
  Tooltip
} from "@material-tailwind/react";
import {
  PrinterIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  ArrowLeftIcon
} from "@heroicons/react/24/outline";

const ReceiptDownload = lazy(() => import("../receipt"));

const ReceiptView = ({
  onBack,
  onClose,
  receiptRef,
  receiptData,
  handlePdfAction,
  pdfLoading
}) => {
  const [formattedReceiptData, setFormattedReceiptData] = useState(null);
  const [feeDetails, setFeeDetails] = useState([]);

  // Format the receipt data to match the structure expected by ReceiptDownload
  useEffect(() => {
    if (receiptData) {
      // Format transactions for fee details
      const transactions = receiptData.transactions || [];
      setFeeDetails(transactions.map(transaction => ({
        ...transaction,
        noiDung: transaction.tuition_name || transaction.paid_code || "Học phí",
        amount_paid: typeof transaction.amount_paid === 'number' 
          ? transaction.amount_paid 
          : parseFloat(transaction.amount_paid || 0)
      })));

      // Format receipt data
      setFormattedReceiptData({
        ...receiptData,
        tenHocSinh: receiptData.student_name || receiptData.tenHocSinh,
        maHocSinh: receiptData.mshs,
        lop: receiptData.class || receiptData.lop,
        soChungTu: receiptData.invoice_id || receiptData.soChungTu,
        ngayThu: receiptData.created_at || new Date().toISOString(),
        dienGiai: receiptData.invoice_details || receiptData.dienGiai || receiptData.note,
        soTien: typeof receiptData.amount_paid === 'number' 
          ? receiptData.amount_paid 
          : parseFloat(receiptData.amount_paid || 0),
        studentInfo: {
          full_name: receiptData.student_name || (receiptData.student ? `${receiptData.student.sur_name} ${receiptData.student.name}` : ""),
          grade: receiptData.student?.grade || "",
          class: receiptData.student?.class || ""
        }
      });
    }
  }, [receiptData]);

  return (
    <>
      <DialogHeader className="relative m-0 block">
        <Button
          variant="text"
          color="blue-gray"
          onClick={onBack}
          className="!absolute top-3 left-3"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </Button>
        <Button
          variant="text"
          color="blue-gray"
          onClick={onClose}
          className="!absolute top-3 right-3"
        >
          <XMarkIcon className="h-6 w-6" />
        </Button>
      </DialogHeader>
      <DialogBody className="space-y-4 px-2 flex flex-col items-center">
        <div className="w-full max-w-3xl mx-auto">
          <Suspense fallback={<div className="flex justify-center p-8"><Spinner className="h-12 w-12" /></div>}>
            <div ref={receiptRef}>
              {formattedReceiptData && (
                <ReceiptDownload 
                  receiptData={formattedReceiptData}
                  feeDetails={feeDetails}
                  customClass="receipt-container"
                  handleClose={true}
                />
              )}
            </div>
          </Suspense>
        </div>
      </DialogBody>
      <DialogFooter className="flex justify-center gap-4">
        <Tooltip content="In biên lai">
          <Button
            color="blue"
            onClick={() => handlePdfAction(true)}
            disabled={pdfLoading}
            className="flex items-center gap-2"
          >
            {pdfLoading ? <Spinner className="h-4 w-4" /> : <PrinterIcon className="h-5 w-5" />}
            <span>In biên lai</span>
          </Button>
        </Tooltip>
        <Tooltip content="Tải xuống biên lai">
          <Button
            color="green"
            onClick={() => handlePdfAction(false)}
            disabled={pdfLoading}
            className="flex items-center gap-2"
          >
            {pdfLoading ? <Spinner className="h-4 w-4" /> : <ArrowDownTrayIcon className="h-5 w-5" />}
            <span>Tải xuống</span>
          </Button>
        </Tooltip>
      </DialogFooter>
    </>
  );
};

export default ReceiptView;
