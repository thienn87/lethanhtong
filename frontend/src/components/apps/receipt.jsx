import React, { useRef, useState, useEffect, useCallback } from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { Button, Spinner } from "@material-tailwind/react";
import { v4 as uuidv4 } from "uuid";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {Config} from "../../config";
const ReceiptDownload = ({
  receiptData = {},
  feeDetails = [],
  customClass = "",
  invoice = {},
  handleClose,
}) => {
  const receiptRef = useRef(null);
  const [customNote, setCustomNote] = useState("");
  const [detailData, setDetailData] = useState([]);
  const [totalPaidAmount, setTotalPaidAmount] = useState(0);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const domain = Config(); // Assuming Config.apiUrl is the base URL for your API
  const companyInfo = {
    name: "CÔNG TY TNHH GIÁO DỤC THANH TÍN",
    address: "227 Tân Thắng, Q. Tân Phú TP.HCM",
    phone: "ĐT: 028 3810 2686",
  };

  // Initialize data when component mounts or props change
  useEffect(() => {
    // Set custom note from available sources
    const noteValue = invoice?.invoice_details || 
                      receiptData?.dienGiai || 
                      receiptData?.note || 
                      receiptData?.invoice_details || 
                      "";
    setCustomNote(noteValue);

    // Set detail data from available sources
    const details = feeDetails || receiptData?.transactions || [];
    setDetailData(details);
    // Calculate total amount if transactions are available
    if (receiptData?.transactions && receiptData.transactions.length > 0) {
      try {
        const totalAmount = receiptData.transactions.reduce(
          (sum, item) => sum + (parseFloat(item.amount_paid) || 0),
          0
        );
        setTotalPaidAmount(totalAmount);
      } catch (err) {
        console.error("Error calculating total amount:", err);
        setTotalPaidAmount(0);
      }
    } else if (receiptData?.amount_paid) {
      setTotalPaidAmount(parseFloat(receiptData.amount_paid) || 0);
    }

    // Cleanup function
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [receiptData, feeDetails, invoice]);
  // Format date for display
  const formatDateIntl = useCallback((isoString) => {
    if (!isoString) return "";
    
    try {
      return new Date(isoString)
        .toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour12: false,
        })
        .replace(",", "");
    } catch (err) {
      console.error("Error formatting date:", err);
      return isoString;
    }
  }, []);

  // Update custom note with debounce
  const updateCustomNote = useCallback(async (inputValue) => {
    if (!invoice || !invoice.id) {
      return;
    }

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    const timeout = setTimeout(async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(
          `${domain}/api/invoice/update`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: `${invoice?.id}`,
              invoice_id: invoice?.invoice_id,
              transaction_id: invoice?.transaction_id,
              invoice_details: inputValue,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Không thể cập nhật hóa đơn (${response.status})`);
        }
        
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || "Cập nhật không thành công");
        }
      } catch (error) {
        console.error("Error updating invoice:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }, 1000); // Reduced from 3000ms to 1000ms for better responsiveness
    
    setTypingTimeout(timeout);
  }, [invoice, typingTimeout]);

  // Handle note change
  const onCustomNoteChange = useCallback((inputValue) => {
    setCustomNote(inputValue);
    updateCustomNote(inputValue);
  }, [updateCustomNote]);

  // Download PDF function
  const downloadPDF = useCallback(async () => {
    if (!receiptRef.current) return;
    
    try {
      setIsLoading(true);
      const element = receiptRef.current;
      const canvas = await html2canvas(element, { 
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      
      // Generate a valid filename
      const filename = receiptData?.soChungTu || receiptData?.invoice_id || "receipt";
      pdf.save(`${filename}-receipt.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      setError("Không thể tạo PDF. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  }, [receiptData]);

  // Get student name from available sources
  const getStudentName = () => {
    return receiptData?.tenHocSinh || 
           (receiptData?.studentInfo?.full_name) || 
           (receiptData?.student && `${receiptData.student.sur_name} ${receiptData.student.name}`) || 
           "";
  };

  // Get student class from available sources
  const getStudentClass = () => {
    return receiptData?.lop || 
           (receiptData?.studentInfo && `${receiptData.studentInfo.grade}${receiptData.studentInfo.class}`) || 
           (receiptData?.student && `${receiptData.student.grade}${receiptData.student.class}`) || 
           "";
  };

  // Get student ID from available sources
  const getStudentId = () => {
    return receiptData?.maHocSinh || 
           receiptData?.mshs || 
           (receiptData?.student && receiptData.student.mshs) || 
           "";
  };

  // Get receipt number from available sources
  const getReceiptNumber = () => {
    return receiptData?.soChungTu || receiptData?.invoice_id || "";
  };

  // Get total amount from available sources
  const getTotalAmount = () => {
    if (receiptData?.soTien) {
      return parseFloat(receiptData.soTien).toLocaleString();
    } else if (receiptData?.amount_paid) {
      return parseFloat(receiptData.amount_paid).toLocaleString();
    } else {
      return totalPaidAmount.toLocaleString();
    }
  };

  // Get receipt date from available sources
  const getReceiptDate = () => {
    return receiptData?.ngayThu || 
           receiptData?.payment_date || 
           formatDateIntl(receiptData?.created_at) || 
           formatDateIntl(new Date());
  };

  // Get receipt type
  const getReceiptType = () => {
    return receiptData?.transactions ? "HÓA ĐƠN THU HỌC PHÍ" : "BIÊN LAI THU HỌC PHÍ";
  };

  return (
    <div className={`${customClass} relative`}>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}
      
      <div
        ref={receiptRef}
        className="w-full mx-auto p-6 bg-white rounded-lg font-sans"
      >
        {/* Company Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold">{companyInfo.name}</h1>
          <p className="text-gray-600">{companyInfo.address}</p>
          <p className="text-gray-600">{companyInfo.phone}</p>
        </div>

        {/* Receipt Title */}
        <h2 className="text-2xl font-bold text-center">
          {getReceiptType()}
        </h2>
        <p className="text-center mb-8">
          <strong>Ngày:</strong> {getReceiptDate()}
        </p>

        {/* Receipt Details */}
        <div className="flex justify-between gap-4 mb-6">
          <div>
            <p className="h-[34px] leading-[34px]">
              <span className="font-semibold">Tên học sinh:</span>{" "}
              {getStudentName()}
            </p>
            <p className="h-[34px] leading-[34px]">
              <span className="font-semibold">Lớp:</span>{" "}
              {getStudentClass()}
            </p>
            <p className="h-[34px] leading-[34px]">
              <span className="font-semibold">Mã số học sinh:</span>{" "}
              {getStudentId()}
            </p>
            <p>
              <span className="font-semibold">Diễn giải:</span>{" "}
              <input
                type="text"
                className="w-[400px] cursor-pointer border border-white hover:bg-slate-50 hover:border-gray-300 focus:border-gray-300 rounded px-2 py-1"
                value={customNote}
                onChange={(e) => onCustomNoteChange(e.target.value)}
                disabled={isLoading}
              />
              {isLoading && <Spinner className="h-4 w-4 ml-2 inline-block" />}
            </p>
          </div>
          <div className="text-right">
            <p className="h-[34px] leading-[34px]">
              <span className="font-semibold">Số:</span>{" "}
              {getReceiptNumber()}
            </p>
            <p className="h-[34px] leading-[34px]">
              <span className="font-semibold">Số tiền:</span>{" "}
              {getTotalAmount()} Đồng
            </p>
          </div>
        </div>

        {/* Fee Details Table */}
        <div className="w-full border-collapse border border-gray-300 mb-4">
          <div className="bg-gray-100 flex">
            <div className="border border-gray-300 px-2 py-1 text-left align-middle w-1/2 font-semibold flex items-center">
              <p>Nội dung</p>
            </div>
            <div className="border border-gray-300 px-2 py-1 text-right align-middle w-1/2 font-semibold flex items-center justify-end">
              <p>Số tiền</p>
            </div>
          </div>
          <div>
            {detailData && detailData.length > 0 ? (
              detailData.map((fee) => (
                <div key={uuidv4()} className="align-middle flex">
                  <div className="border border-gray-300 px-2 py-1 w-1/2 flex items-center">
                    <p>{fee?.noiDung || fee?.tuition_name || fee?.paid_code || "Học phí"}</p>
                  </div>
                  <div className="border border-gray-300 px-2 py-1 text-right w-1/2 flex items-center justify-end">
                    <p>
                      {fee.amount_paid.toLocaleString()}{" "}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="align-middle flex">
                <div className="border border-gray-300 px-2 py-1 w-1/2 flex items-center">
                  <p>{receiptData?.paid_code || "Học phí"}</p>
                </div>
                <div className="border border-gray-300 px-2 py-1 text-right w-1/2 flex items-center justify-end">
                  <p>
                    {receiptData?.amount_paid
                      ? parseFloat(receiptData.amount_paid).toLocaleString()
                      : "0"}{" "}
                    đồng
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Signature Section */}
        <div className="mt-4 mx-[50px] flex justify-between">
          <div className="text-center">
            <p className="font-bold">Người nộp tiền</p>
            <p>(Ký tên)</p>
            <div className="h-[100px]"></div>
          </div>
          <div className="text-center">
            <p className="font-bold">Người lập</p>
            <p>(Ký tên)</p>
            <div className="h-[100px]"></div>
          </div>
        </div>
      </div>
      
      {/* Download Button - Only show if not embedded in another component */}
      {!handleClose && (
        <div className="mt-4 flex justify-center">
          <Button
            color="blue"
            className="flex items-center gap-2"
            onClick={downloadPDF}
            disabled={isLoading}
          >
            {isLoading ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <ArrowDownTrayIcon className="h-4 w-4" />
            )}
            Tải xuống PDF
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReceiptDownload;