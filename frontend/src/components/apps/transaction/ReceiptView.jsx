import React, { useMemo } from "react";
import { DialogHeader, DialogBody, DialogFooter, Button, Spinner } from "@material-tailwind/react";
import { XMarkIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";

const companyInfo = {
  name: "CÔNG TY TNHH GIÁO DỤC THANH TÍN",
  address: "227 Tân Thắng, Q. Tân Phú TP.HCM",
  phone: "ĐT: 028 3810 2686",
};

const ReceiptView = ({
  onBack,
  onClose,
  receiptRef,
  receiptData,
  handlePdfAction,
  pdfLoading
}) => {
  // Format date with memoization
  const formatDate = useMemo(() => (dateString) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy");
    } catch (error) {
      return dateString || "N/A";
    }
  }, []);

  // Format currency with memoization
  const formatCurrency = useMemo(() => (amount) => {
    if (!amount && amount !== 0) return "0";
    return parseFloat(amount).toLocaleString("vi-VN");
  }, []);

  if (!receiptData || !receiptData.soChungTu) {
    return (
      <div className="animate-fade-in">
        <DialogHeader className="relative m-0 block">
          <Button
            variant="text"
            color="white"
            onClick={onClose}
            className="!absolute top-3 right-3 rounded-full p-2 hover:bg-gray-200 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </Button>
        </DialogHeader>
        <DialogBody className="flex flex-col items-center justify-center p-8">
          <Spinner className="h-12 w-12 text-violet-800 animate-spin" />
          <p className="mt-4 text-gray-700">Đang tải dữ liệu biên lai...</p>
        </DialogBody>
      </div>
    );
  }

  const hasTransactions = receiptData.transactions && receiptData.transactions.length > 0;

  return (
    <div className="animate-fade-in">
      <DialogHeader className="relative mb-6 block">
        <Button
          variant="filled"
          color="white"
          onClick={onBack}
          className="!absolute top-3 left-3 rounded-full p-3 hover:bg-violet-100 transition-colors"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </Button>
        <Button
          variant="filled"
          color="white"
          onClick={onClose}
          className="!absolute top-3 right-3 rounded-full p-3 hover:bg-violet-100 transition-colors"
        >
          <XMarkIcon className="h-6 w-6" />
        </Button>
      </DialogHeader>
      <DialogBody className="p-4">
        <div ref={receiptRef} className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold">{companyInfo.name}</h1>
            <p className="text-gray-600">{companyInfo.address}</p>
            <p className="text-gray-600">{companyInfo.phone}</p>
          </div>
          
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">BIÊN LAI THU HỌC PHÍ</h2>
            <p className="text-gray-600">Số chứng từ: {receiptData.soChungTu}</p>
            <p className="text-gray-600">Ngày: {formatDate(receiptData.ngayThu)}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p><span className="font-semibold">Học sinh:</span> {receiptData.tenHocSinh || "N/A"}</p>
              <p><span className="font-semibold">MSHS:</span> {receiptData.mshs || "N/A"}</p>
              <p><span className="font-semibold">Lớp:</span> {receiptData.lop || "N/A"}</p>
            </div>
            <div>
              <p><span className="font-semibold">Diễn giải:</span> {receiptData.dienGiai || "N/A"}</p>
              <p><span className="font-semibold">Số tiền:</span> {formatCurrency(receiptData.soTien)} VNĐ</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Chi tiết</h3>
            {hasTransactions ? (
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">STT</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Mã HP</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Tên HP</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Số tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptData.transactions.map((transaction, index) => (
                    <tr key={transaction.id || `txn-${index}`} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                      <td className="border border-gray-300 px-4 py-2">{transaction.paid_code || "N/A"}</td>
                      <td className="border border-gray-300 px-4 py-2">{transaction.tuition_name || "N/A"}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(transaction.amount_paid)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 font-semibold">
                    <td className="border border-gray-300 px-4 py-2" colSpan={3}>Tổng cộng</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(receiptData.soTien)}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p className="text-gray-600 text-center py-4">Không có giao dịch nào được ghi nhận.</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 text-center mt-8">
            <div>
              <p className="font-semibold">Người nộp tiền</p>
              <p className="text-gray-500 italic">(Ký, họ tên)</p>
            </div>
            <div>
              <p className="font-semibold">Người thu tiền</p>
              <p className="text-gray-500 italic">(Ký, họ tên)</p>
            </div>
          </div>
        </div>
      </DialogBody>
      <DialogFooter className="flex justify-end space-x-4">
        <Button
          className={pdfLoading ? "bg-gray-300 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600 transition-colors"}
          disabled={pdfLoading}
          onClick={() => handlePdfAction(false)}
        >
          {pdfLoading ? (
            <div className="flex items-center justify-center">
              <Spinner className="h-4 w-4 mr-2 animate-spin" />
              <span>Đang tạo PDF...</span>
            </div>
          ) : (
            "Tải xuống PDF"
          )}
        </Button>
        <Button
          className={pdfLoading ? "bg-gray-300 cursor-not-allowed" : "bg-green-500 hover:bg-green-600 transition-colors"}
          disabled={pdfLoading}
          onClick={() => handlePdfAction(true)}
        >
          {pdfLoading ? (
            <div className="flex items-center justify-center">
              <Spinner className="h-4 w-4 mr-2 animate-spin" />
              <span>Đang tạo PDF...</span>
            </div>
          ) : (
            "Mở trong tab mới"
          )}
        </Button>
      </DialogFooter>
    </div>
  );
};

export default React.memo(ReceiptView);