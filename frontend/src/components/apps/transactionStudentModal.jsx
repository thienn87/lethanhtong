import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense, useRef } from "react";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import {
  Typography,
  Button,
  Dialog,
  DialogBody,
  DialogHeader,
  DialogFooter,
  Spinner,
  Tooltip
} from "@material-tailwind/react";
import { 
  PrinterIcon, ArrowDownTrayIcon, XMarkIcon, ArrowLeftIcon
} from "@heroicons/react/24/outline";
import { Config } from "../config";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Toast } from "../polaris/toast";
import TransactionHeader from "./transaction/TransactionHeader";
import TransactionTable from "./transaction/TransactionTable";
import ReceiptView from "./transaction/ReceiptView";

const ReceiptDownload = lazy(() => import("./receipt"));

const TransactionStudentModal = ({ open, data, onClose }) => {
  const domain = Config();
  const [totalFeeCurrentMonth, setTotalFeeCurrentMonth] = useState(0);
  const [loading, setLoading] = useState(false);
  const [feeCurrentMonth, setFeeCurrentMonth] = useState([]);
  const [feeTable, setFeeTable] = useState({});
  const [currentMonth, setCurrentMonth] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [invoice, setInvoice] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [noiDungHoaDown, setNoiDungHoaDown] = useState('');
  const [selectedMaHP, setSelectedMaHP] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const receiptRef = useRef(null);
  const [processedFees, setProcessedFees] = useState([]);

  const currentDay = format(new Date(), "dd/MM/yyyy");
  const studentName = data ? `${data.sur_name} ${data.name}` : "";

  const handleNoiDungChange = (event) => {
    setNoiDungHoaDown(event.target.value);
  };

  useEffect(() => {
    setNoiDungHoaDown(`THU ${selectedMaHP.join(", ")} THÁNG ${currentMonth}`);
  }, [selectedMaHP, currentMonth]);

  // Fetch all fee data from a single API endpoint
  const fetchFeeData = useCallback(async (mshs) => {
    if (!mshs) return null;
    
    try {
      const response = await fetch(`${domain}/api/transaction/fee-data?mshs=${encodeURIComponent(mshs)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) throw new Error("Failed to fetch fee data");
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching fee data:", error);
      return null;
    }
  }, [domain]);

  useEffect(() => {
    if (open && data?.mshs) {
      const fetchData = async () => {
        setLoading(true);
        try {
          // Get all fee data from a single API call
          const result = await fetchFeeData(data.mshs);
          
          if (result?.status === 'success' && result.data) {
            // Set the fee table data
            setFeeTable(result.data);
            
            // Set the transaction ID from the response
            if (result.data.next_transaction_id) {
              setTransactionId(result.data.next_transaction_id);
            }
            
            // Set processed fees
            if (result.data.processed_fees && result.data.processed_fees.length > 0) {
              setProcessedFees(result.data.processed_fees);
              
              // Update feeCurrentMonth with the processed data
              const updatedFeeCurrentMonth = result.data.processed_fees.map(fee => ({
                ...fee,
                isChecked: true,
                amount_paid: fee.suggested_payment
              }));
              
              setFeeCurrentMonth(updatedFeeCurrentMonth);
              
              // Set selected fee codes
              setSelectedMaHP(updatedFeeCurrentMonth.map(fee => fee.code));
            }
            
            // Set current month
            if (result.data.chi_tiet_phai_thu_thang_nay) {
              setCurrentMonth(result.data.chi_tiet_phai_thu_thang_nay.month);
            }
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [data, fetchFeeData, open]);

  const handleCheck = (tuitionIndex, status) => {
    setFeeCurrentMonth((prev) => {
      const newData = [...prev];
      newData[tuitionIndex].isChecked = status;
      return newData;
    });
    setSelectedMaHP((prev) =>
      status
        ? [...prev, feeCurrentMonth[tuitionIndex].code]
        : prev.filter((code) => code !== feeCurrentMonth[tuitionIndex].code)
    );
  };

  const getLatestPaidFee = (paidFees, code) => {
    if (!paidFees || !Array.isArray(paidFees)) {
      return null;
    }
    
    return paidFees
      .filter((fee) => fee.paid_code === code)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null;
  };

  const handleCreateInvoice = async (idList) => {
    try {
      const noiDung = noiDungHoaDown || `Thu ${selectedMaHP.join(", ")} tháng ${currentMonth}`;
      const response = await fetch(`${domain}/api/invoice/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_id: `${transactionId}/${currentMonth}`,
          transaction_id: idList,
          invoice_details: noiDung,
          mshs: data.mshs,
          transaction_data: prepareTransactionData(),
          month: currentMonth
        }),
      });
      if (!response.ok) throw new Error(`Không thể tạo invoice`);
      const invoice = await response.json();
      return invoice.data;
    } catch (error) {
      console.error("Lỗi:", error.message);
      throw error;
    }
  };

  // Prepare transaction data for the API
  const prepareTransactionData = () => {
    return feeCurrentMonth
      .filter(fee => fee.isChecked)
      .map(fee => {
        const amountPaid = fee.isAmountModified 
          ? Number(fee.amount_paid) 
          : (fee.suggested_payment || 0);
        
        return {
          code: fee.code,
          amount: amountPaid,
          note: fee.note || ""
        };
      });
  };

  const handleCreateTransaction = async (transactionData) => {
    try {
      const response = await fetch(`${domain}/api/transaction/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transactionData),
      });
      if (!response.ok) throw new Error(`Không thể tạo giao dịch`);
      return response.json();
    } catch (error) {
      console.error("Lỗi:", error.message);
      throw error;
    }
  };


  // Fetch complete invoice data with transactions
  const fetchInvoiceWithTransactions = async (invoiceId) => {
    try {
      const response = await fetch(`${domain}/api/invoice/detail/${invoiceId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) throw new Error("Failed to fetch invoice data");
      
      const result = await response.json();
      if (result.status === 'success' && result.data) {
        // Create real receipt data from the invoice
        const realReceiptData = {
          soChungTu: result.data.invoice_id,
          tenHocSinh: studentName,
          mshs: data?.mshs || "",
          lop: data ? `${data.grade}${data.class}` : "",
          dienGiai: result.data.invoice_details,
          note: result.data.invoice_details,
          soTien: result.data.total_amount || totalFeeCurrentMonth,
          ngayThu: result.data.created_at,
          student: data,
          invoice_id: result.data.invoice_id,
          student_name: studentName,
          class: data ? `${data.grade}${data.class}` : "",
          amount_paid: result.data.total_amount || totalFeeCurrentMonth,
          invoice_details: result.data.invoice_details,
          created_at: result.data.created_at,
          transactions: result.data.transactions || []
        };
        
        // Update the receipt data
        setReceiptData(realReceiptData);
        
        return result.data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching invoice data:", error);
      return null;
    }
  };

  const handleSubmitTransaction = async (studentData, totalFee) => {
    try {
      // Set isSubmitting to true at the beginning
      setIsSubmitting(true);
      
      if (!studentData) {
        setIsSubmitting(false); // Reset if no student data
        return;
      }
      
      const isChecked = totalFee.filter((fee) => fee.isChecked);
      if (!isChecked.length) {
        setToastMessage("Chọn học phí muốn thu");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        setIsSubmitting(false); // Reset if no fees selected
        return;
      }
      const transactionIdArr = [];
      let totalPaidAmount = 0;
      
      for (const fee of isChecked) {
        let amountPaid;
        if (!fee.isNewRow) {
          amountPaid = fee.isAmountModified
            ? Number(fee.amount_paid)
            : (fee.suggested_payment || 0);
        } else {
          await submitCreateTuitionGroup(fee);
          amountPaid = Number(fee.amount_paid) || 0;
        }
        
        totalPaidAmount += amountPaid;
        
        const payload = {
          mshs: studentData.mshs,
          note: fee.note || "",
          paid_code: fee.code,
          amount_paid: amountPaid,
        };
        
        const transactionInfo = await handleCreateTransaction(payload);
        if (transactionInfo?.data?.id) {
          transactionIdArr.push(transactionInfo.data.id);
        }
      }
      
      // Create invoice with transaction_data
      const invoiceData = await handleCreateInvoice(transactionIdArr.join(", "));
      setInvoice(invoiceData);
      setTotalFeeCurrentMonth(totalPaidAmount);
      
      // Fetch the complete invoice data with transactions for the receipt
      if (invoiceData && invoiceData.id) {
        await fetchInvoiceWithTransactions(invoiceData.id);
      }
      
      // Refresh data
      const result = await fetchFeeData(studentData.mshs);
      if (result?.status === 'success' && result.data) {
        setFeeTable(result.data);
        
        if (result.data.processed_fees && result.data.processed_fees.length > 0) {
          setProcessedFees(result.data.processed_fees);
          
          const updatedFeeCurrentMonth = result.data.processed_fees.map(fee => ({
            ...fee,
            isChecked: true,
            amount_paid: fee.suggested_payment
          }));
          
          setFeeCurrentMonth(updatedFeeCurrentMonth);
        }
        
        if (result.data.chi_tiet_phai_thu_thang_nay) {
          setCurrentMonth(result.data.chi_tiet_phai_thu_thang_nay.month);
        }
      }
      
      // Show receipt after successful submission
      setShowReceipt(true);
      setToastMessage("Giao dịch thành công");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("Lỗi:", error.message);
      setToastMessage("Đã xảy ra lỗi khi cập nhật giao dịch!");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      // Always reset isSubmitting in the finally block
      setIsSubmitting(false);
    }
  };

  const addNewRow = () => {
    setFeeCurrentMonth((prev) => [
      ...prev,
      {
        code: "",
        name: "",
        default_amount: 0,
        grade: feeTable.student?.grade,
        monthapply: feeTable.chi_tiet_phai_thu_thang_nay?.month,
        groupcode: "HP",
        isNewRow: true,
        isChecked: true,
      },
    ]);
  };

  const submitCreateTuitionGroup = async (data) => {
    try {
      const response = await fetch(`${domain}/api/tuitions/group/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: data.code,
          name: data.name,
          default_amount: data.default_amount,
          grade: data.grade,
          apply_months: data.monthapply,
          month_apply: data.monthapply,
          groupcode: data.groupcode,
          group: data.groupcode,
          classes: "",
        }),
      });
      if (!response.ok) throw new Error("Error sending form data");
      return response.json();
    } catch (error) {
      console.error("Error:", error.message);
      throw error;
    }
  };

  const handlePaidAmount = (tuitionIndex, amount_paid) => {
    setFeeCurrentMonth((prev) => {
      const newData = [...prev];
      newData[tuitionIndex].amount_paid = amount_paid;
      newData[tuitionIndex].isAmountModified = true;
      return newData;
    });
  };

  const handleDebt = (tuitionIndex, default_amount) => {
    setFeeCurrentMonth((prev) => {
      const newData = [...prev];
      newData[tuitionIndex].default_amount = default_amount;
      return newData;
    });
  };

  const handleNote = (tuitionIndex, note) => {
    setFeeCurrentMonth((prev) => {
      const newData = [...prev];
      newData[tuitionIndex].note = note;
      return newData;
    });
  };

  const handleFeeCode = (tuitionIndex, code) => {
    setFeeCurrentMonth((prev) => {
      const newData = [...prev];
      newData[tuitionIndex].code = code;
      return newData;
    });
  };

  const handleFeeName = (tuitionIndex, name) => {
    setFeeCurrentMonth((prev) => {
      const newData = [...prev];
      newData[tuitionIndex].name = name;
      return newData;
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "0";
    return parseFloat(amount).toLocaleString("vi-VN");
  };

  // Handle PDF download and open in new tab
  const handlePdfAction = async (openInNewTab = false) => {
    setPdfLoading(true);
    try {
      // Use the current receipt element in the DOM
      if (receiptRef.current) {
        // Generate PDF using html2canvas and jsPDF
        const element = receiptRef.current;
        const canvas = await html2canvas(element, { 
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true
        });
        
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        
        if (openInNewTab) {
          // Open PDF in new tab
          const pdfBlob = pdf.output('blob');
          const blobUrl = URL.createObjectURL(pdfBlob);
          window.open(blobUrl, '_blank');
        } else {
          // Download the PDF
          pdf.save(`bienlai-${data?.mshs}-${transactionId}.pdf`);
        }
        
        setToastMessage(openInNewTab ? "Đã mở biên lai trong tab mới" : "Đã tải xuống biên lai");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        throw new Error("Receipt element not found");
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      setToastMessage("Lỗi khi tạo PDF: " + error.message);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setPdfLoading(false);
    }
  };

  const feeDetails = useMemo(() => {
    if (!feeCurrentMonth || !feeCurrentMonth.length) return [];
    
    return feeCurrentMonth
      .filter(bill => bill.isChecked)
      .map(bill => ({
        id: uuidv4(),
        paid_code: bill.code,
        amount_paid: bill.isAmountModified ? parseFloat(bill.amount_paid) : (bill.suggested_payment || 0),
        tuition_name: bill.name,
        created_at: new Date().toISOString()
      }));
  }, [feeCurrentMonth]);

  // Update receipt data when dependencies change
  useEffect(() => {
    // Only generate default receipt data if we don't have real data from the API
    if (!receiptData || !receiptData.invoice_id) {
      const defaultReceiptData = {
        soChungTu: `${transactionId}/${currentMonth}`,
        tenHocSinh: studentName,
        mshs: data?.mshs || "",
        lop: data ? `${data.grade}${data.class}` : "",
        dienGiai: noiDungHoaDown || `Thu học phí tháng ${currentMonth}`,
        note: noiDungHoaDown || `Thu học phí tháng ${currentMonth}`,
        soTien: totalFeeCurrentMonth,
        ngayThu: new Date().toISOString(),
        student: data,
        invoice_id: `${transactionId}/${currentMonth}`,
        student_name: studentName,
        class: data ? `${data.grade}${data.class}` : "",
        amount_paid: totalFeeCurrentMonth,
        invoice_details: noiDungHoaDown || `Thu học phí tháng ${currentMonth}`,
        created_at: new Date().toISOString(),
        transactions: feeDetails
      };
      
      setReceiptData(defaultReceiptData);
    }
  }, [transactionId, currentMonth, studentName, data, noiDungHoaDown, totalFeeCurrentMonth, feeDetails, receiptData]);

  if (loading && !showReceipt) {
    return (
      <Dialog
        open={open}
        handler={onClose}
        size="md"
      >
        <DialogBody className="flex flex-col items-center justify-center p-8">
          <Spinner className="h-12 w-12 text-violet-800" />
          <p className="mt-4 text-gray-700">Đang tải dữ liệu...</p>
        </DialogBody>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog
        open={open}
        handler={onClose}
        size="xl"
        className="p-3 w-[85%] !max-w-[1200px] bg-[#f3f3f3] rounded-[1rem]"
      >
        {!showReceipt ? (
          <>
            <DialogHeader className="relative m-0 block">
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
              <TransactionHeader 
                studentName={studentName}
                studentData={data}
                transactionId={transactionId}
                currentDay={currentDay}
                currentMonth={currentMonth}
                noiDungHoaDown={noiDungHoaDown}
                onNoiDungChange={handleNoiDungChange}
              />

              <TransactionTable 
                feeCurrentMonth={feeCurrentMonth}
                feeTable={feeTable}
                handleCheck={handleCheck}
                handlePaidAmount={handlePaidAmount}
                handleDebt={handleDebt}
                handleNote={handleNote}
                handleFeeCode={handleFeeCode}
                handleFeeName={handleFeeName}
                formatCurrency={formatCurrency}
                addNewRow={addNewRow}
                processedFees={processedFees}
              />
            </DialogBody>
            <DialogFooter className="flex items-center justify-end px-6 gap-4 pt-2">
              <Button
                className="bg-gray-200 text-gray-700 hover:bg-gray-300 shadow-none"
                onClick={onClose}
              >
                Đóng
              </Button>
              <Button
                className={isSubmitting ? "bg-violet-300 text-white shadow-md" : "bg-violet-700 hover:bg-violet-800 text-white shadow-md"}
                disabled={isSubmitting}
                onClick={() => {
                  if (!isSubmitting) {
                    handleSubmitTransaction(data, feeCurrentMonth);
                  }
                }}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <Spinner className="h-4 w-4 mr-2" />
                    <span>Đang xử lý...</span>
                  </div>
                ) : (
                  "Thu Học Phí"
                )}
              </Button>
              <Button
                className={`${!isSubmitting && totalFeeCurrentMonth > 0 ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300"} text-white shadow-md`}
                disabled={isSubmitting || totalFeeCurrentMonth === 0}
                onClick={() => setShowReceipt(true)}
              >
                In biên lai
              </Button>
            </DialogFooter>
          </>
        ) : (
          <ReceiptView 
            onBack={() => setShowReceipt(false)}
            onClose={onClose}
            receiptRef={receiptRef}
            receiptData={receiptData}
            handlePdfAction={handlePdfAction}
            pdfLoading={pdfLoading}
          />
        )}
      </Dialog>
      <Toast status={showToast}>{toastMessage}</Toast>
    </>
  );
};

export default TransactionStudentModal;
