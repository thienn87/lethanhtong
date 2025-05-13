import React, { useState, useRef, useEffect, useCallback, useMemo, Suspense, lazy } from "react";
import { Dialog, DialogHeader, DialogBody, DialogFooter, Button, Spinner } from "@material-tailwind/react";
import { format } from "date-fns";
import { Config } from "../config";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useTuitionFeeData } from "./hooks/useTuitionFeeData";
import { usePaymentDistribution } from "./hooks/usePaymentDistribution";
import { useReceiptData } from "./hooks/useReceiptData";

const TransactionHeader = lazy(() => import("./transaction/TransactionHeader"));
const TransactionTable = lazy(() => import("./transaction/TransactionTable"));
const ReceiptView = lazy(() => import("./transaction/ReceiptView"));

const MODAL_STATUS = {
  UNSUBMITTED: "unsubmitted",
  SUBMITTED: "submitted",
  VIEWING_RECEIPT: "viewing_receipt",
};

const TransactionStudentModal = ({ isOpen, onClose, mshs, studentName, studentClass, size, studentData = null }) => {
  const domain = Config();
  const [showReceipt, setShowReceipt] = useState(false);
  const [noiDungHoaDown, setNoiDungHoaDown] = useState('');
  const [selectedMaHP, setSelectedMaHP] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showTable, setShowTable] = useState(false);
  const [modalStatus, setModalStatus] = useState(MODAL_STATUS.UNSUBMITTED);
  const [pendingInvoiceId, setPendingInvoiceId] = useState(null);
  const [feesInitialized, setFeesInitialized] = useState(false);
  const [processedFees, setProcessedFees] = useState([]);
  const [isPrinting, setIsPrinting] = useState(false);

  const dataRef = useRef({
    mshs,
    name: studentName,
    grade: studentClass ? studentClass.charAt(0) : "",
    class: studentClass ? studentClass.substring(1) : "",
    sur_name: studentData?.sur_name || "",
    full_name: studentData?.full_name || studentName,
  });

  useEffect(() => {
    if (studentData) {
      dataRef.current = {
        ...dataRef.current,
        ...studentData,
        mshs: mshs || studentData.mshs,
        name: studentData.name || studentName,
        grade: studentData.grade || (studentClass ? studentClass.charAt(0) : ""),
        class: studentData.class || (studentClass ? studentClass.substring(1) : "")
      };
    }
  }, [studentData, mshs, studentName, studentClass]);

  const currentDay = useMemo(() => format(new Date(), "dd/MM/yyyy"), []);

  const {
    loading: feeDataLoading,
    feeTable,
    currentMonth,
    transactionId,
    error: feeDataError,
    fetchTuitionFeeData,
    pendingInvoice,
    totalFeeAmount,
    deletePendingInvoice
  } = useTuitionFeeData(mshs, isOpen);

  useEffect(() => {
    if (
      feeTable?.processedFees &&
      Array.isArray(feeTable.processedFees) &&
      !feesInitialized
    ) {
      const initializedFees = feeTable.processedFees
        .map(fee => ({
          ...fee,
          isChecked: true,
          amount_paid: fee.amount_paid ?? fee.suggested_payment ?? 0,
          note: fee.note ?? '',
        }))
        .sort((a, b) => {
          const aIsHP = a.code && a.code.includes('HP');
          const bIsHP = b.code && b.code.includes('HP');
          if (aIsHP && !bIsHP) return -1;
          if (!aIsHP && bIsHP) return 1;
          return 0;
        });
      setProcessedFees(initializedFees);
      setFeesInitialized(true);
      if (initializedFees.length > 0 && currentMonth) {
        const newSelectedMaHP = initializedFees.map(fee => fee.code);
        setSelectedMaHP(newSelectedMaHP);
        setNoiDungHoaDown(`THU ${newSelectedMaHP.join(", ")} THÁNG ${currentMonth}`);
      }
    }
  }, [feeTable, feesInitialized, currentMonth]);

  useEffect(() => {
    if (pendingInvoice && pendingInvoice.id) {
      setPendingInvoiceId(pendingInvoice.id);
    }
  }, [pendingInvoice]);

  const {
    totalPaymentAmount,
    setTotalPaymentAmount,
    distributePayment,
    handleTotalPaymentChange
  } = usePaymentDistribution(processedFees, setProcessedFees);

  const prepareTransactionData = useCallback(() => {
    return processedFees
      .filter(fee => fee.isChecked)
      .map(fee => {
        const amountPaid = fee.isAmountModified 
          ? Number(fee.amount_paid) 
          : (fee.suggested_payment || 0);
        if (fee.isNewRow) {
          return {
            code: fee.code,
            amount: amountPaid,
            note: fee.note || "",
            name: fee.name || fee.code,
            isNewRow: true,
            groupcode: fee.groupcode || "OTHER"
          };
        }
        return {
          code: fee.code,
          amount: amountPaid,
          note: fee.note || ""
        };
      });
  }, [processedFees]);

  const {
    receiptData,
    receiptRef,
    pdfLoading,
    isSubmitting,
    showToast: receiptShowToast,
    setShowToast: setReceiptShowToast,
    toastMessage: receiptToastMessage,
    setToastMessage: setReceiptToastMessage,
    handlePdfAction,
    generateReceiptAndSubmit
  } = useReceiptData({
    studentData: dataRef.current,
    transactionId,
    currentMonth,
    noiDungHoa: noiDungHoaDown,
    totalFeeAmount,
    processedFees,
    prepareTransactionData,
    domain,
    pendingInvoiceId,
    onSuccess: async () => {
      setPendingInvoiceId(null);
      setModalStatus(MODAL_STATUS.SUBMITTED);
      setShowReceipt(true);
    }
  });

  useEffect(() => {
    if (receiptShowToast) {
      setShowToast(true);
      setToastMessage(receiptToastMessage);
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [receiptShowToast, receiptToastMessage]);

  const handleNoiDungChange = useCallback((event) => {
    setNoiDungHoaDown(event.target.value);
  }, []);

  useEffect(() => {
    if (processedFees && processedFees.length > 0) {
      setIsInitialLoad(false);
      setShowTable(true);
    }
  }, [processedFees]);

  useEffect(() => {
    if (showReceipt) {
      setModalStatus(MODAL_STATUS.VIEWING_RECEIPT);
    } else if (modalStatus === MODAL_STATUS.VIEWING_RECEIPT) {
      setModalStatus(MODAL_STATUS.SUBMITTED);
    }
  }, [showReceipt, modalStatus]);

  const handleCheck = useCallback((code, status) => {
    setProcessedFees(prev => {
      const newData = prev.map(fee =>
        fee.code === code ? { ...fee, isChecked: status } : fee
      );
      const checkedFees = newData.filter(fee => fee.isChecked);
      const newSelectedMaHP = checkedFees.map(fee => fee.code);
      setSelectedMaHP(newSelectedMaHP);
      if (checkedFees.length > 0 && currentMonth) {
        setNoiDungHoaDown(`THU ${newSelectedMaHP.join(", ")} THÁNG ${currentMonth}`);
      } else {
        setNoiDungHoaDown('');
      }
      return newData;
    });
  }, [currentMonth]);

  const handlePaidAmount = useCallback((code, amount_paid) => {
    setProcessedFees(prev => prev.map(fee =>
      fee.code === code ? { ...fee, amount_paid, isAmountModified: true } : fee
    ));
  }, []);

  const handleDebt = useCallback((code, default_amount) => {
    setProcessedFees(prev => prev.map(fee =>
      fee.code === code ? { ...fee, default_amount } : fee
    ));
  }, []);

  const handleNote = useCallback((code, note) => {
    setProcessedFees(prev => prev.map(fee =>
      fee.code === code ? { ...fee, note } : fee
    ));
  }, []);

  const handleFeeCode = useCallback((code, newCode) => {
    setProcessedFees(prev => prev.map(fee =>
      fee.code === code ? { ...fee, code: newCode } : fee
    ));
  }, []);

  const handleFeeName = useCallback((code, name) => {
    setProcessedFees(prev => prev.map(fee =>
      fee.code === code ? { ...fee, name } : fee
    ));
  }, []);

  const addNewRow = useCallback(() => {
    setProcessedFees(prev => [
      ...prev,
      {
        code: `OT-${Date.now()}`,
        name: "",
        default_amount: 0,
        opening_debt_balance: 0,
        remaining_amount: 0,
        suggested_payment: 0,
        amount_paid: 0,
        isNewRow: true,
        isChecked: true,
        groupcode: "OTHER",
        note: "",
      },
    ]);
  }, []);

  const handlePrintPhieuNhapHoc = useCallback(async () => {
  try {
    setIsPrinting(true);
    const currentMshs = dataRef.current.mshs;
    
    if (!currentMshs) {
      setToastMessage("Không tìm thấy mã số học sinh");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      setIsPrinting(false);
      return;
    }
    
    // Fetch student data
    const response = await fetch(`${domain}/api/students/search?mshs=${currentMshs}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Accept': 'application/json'
      },
    });
    
    if (!response.ok) {
      throw new Error(`Lỗi khi lấy thông tin học sinh: ${response.statusText}`);
    }
    
    const { data } = await response.json();
    if (!data || !data.length) {
      throw new Error("Không tìm thấy thông tin học sinh");
    }
    const student = data[0];
    
    // Determine student status
    const dayIn = new Date(student.day_in);
    const now = new Date();
    const interval = (now - dayIn) / (1000 * 60 * 60 * 24);
    const isNewStudent = interval < 30;
    const studentStatus = isNewStudent ? 'Mới' : 'Cũ';
    const stayIn = student.stay_in ? 'Nội trú' : 'Bán trú';
    
    // Try to open as a window rather than a tab by specifying window features
    const windowFeatures = "width=800,height=600,menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes";
    const printWindow = window.open('', '_blank', windowFeatures);
    
    if (!printWindow) {
      throw new Error("Không thể mở cửa sổ in. Vui lòng kiểm tra cài đặt trình duyệt của bạn.");
    }
    
    // Write content directly to the window
    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Phiếu Nhập Học - ${student.mshs}</title>
          <meta charset="UTF-8">
          <style>
            /* Critical fix: Set page size and prevent overflow */
            @page {
              size: A5 landscape;
              margin: 0.5cm;
            }
            
            /* Base styles */
            html, body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              font-size: 11pt;
              background-color: white;
              width: 210mm;
              height: 140mm;
              overflow: hidden;
              box-sizing: border-box; /* Ensure padding is included */
            }
            
            /* Main container */
            .phieu-nhap-hoc {
              padding: 10mm;
              page-break-inside: avoid;
              page-break-after: avoid;
              page-break-before: avoid;
              box-sizing: border-box;
              max-height: 128mm; /* Ensure content fits within A5 height */
            }
            
            /* School info */
            .school-info {
              text-align: center;
              margin-bottom: 15px;
            }
            
            .header {
              font-weight: bold;
              text-align: center;
              font-size: 16px;
              margin-top: 10px;
            }
            
            /* Student info table */
            table {
              border-collapse: collapse;
              width: 100%;
              margin-bottom: 20px;
            }
            
            table, th, td {
              border: none;
              box-sizing: border-box;
            }
            
            td.rightCol_title {
              width: 130px;
            }
            
            th, td {
              padding: 5px;
              text-align: left;
            }
            
            .student-info td:first-child {
              font-weight: bold;
              width: 150px;               
            }
            
            .importantCol {
              font-weight: bold;
              font-size: 15px;
            }
            
            /* Footer notes */
            p {
              margin: 5px 0;
              line-height: 1.5;
              font-size: 13px;
            }
            
            /* Print-specific styles */
            @media print {
              html, body {
                width: 210mm;
                height: 140mm;
                overflow: hidden;
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
              
              .no-print {
                display: none !important;
              }
            }
            
            /* Controls */
            .controls {
              position: fixed;
              bottom: 20px;
              left: 0;
              width: 100%;
              text-align: center;
              z-index: 1000;
            }
            
            .btn {
              padding: 10px 20px;
              margin: 0 5px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-weight: bold;
              color: white;
            }
            
            .btn-print {
              background-color: #4a6cf7;
            }
            
            .btn-close {
              background-color: #6c757d;
            }
          </style>
        </head>
        <body>
          <div class="phieu-nhap-hoc">
            <div class="school-info">
              <div class="header">CÔNG TY TNHH GIÁO DỤC THANH TÍN</div>
              <div>227 Tân Thắng, Q. Tân Phú TP.HCM</div>
              <div>ĐT: 028 3810 2686</div>
            </div>
            
            <div class="header" style="margin-bottom: 30px;">PHIẾU NHẬP HỌC</div>
            
            <table class="student-info">
              <tr>
                <td>Họ và tên:</td>
                <td colspan="2" class="leftCol-content">${student.sur_name} ${student.name}</td>
                <td> </td>
                <td class="rightCol_title">Mã số học sinh:</td>
                <td colspan="4">${student.mshs}</td>
              </tr>
              <tr>
                <td>Ngày sinh:</td>
                <td colspan="2">${student.day_of_birth ? format(new Date(student.day_of_birth), 'dd/MM/yyyy') : ''}</td>
                <td> </td>
                <td class="rightCol_title">Giới tính:</td>
                <td colspan="4">${student.gender === 'male' ? 'Nam' : 'Nữ'}</td>
              </tr>
              <tr>
                <td>Lớp:</td>
                <td colspan="2" class="leftCol-content">${student.grade}${student.class}</td>
                <td> </td>
                <td colspan="4" class="importantCol">Ngày nhập học: ${student.day_in ? format(new Date(student.day_in), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')}</td>
              </tr>
              <tr>
                <td>Địa chỉ:</td>
                <td colspan="7">${student.address || ''}</td>
              </tr>
              <tr>
                <td>Phụ huynh:</td>
                <td colspan="2" class="leftCol-content">${student.parent_name || ''}</td>
                <td> </td>
                <td class="rightCol_title">Điện thoại:</td>
                <td>${student.phone_number || ''}</td>
              </tr>
              <tr>
                <td>Tình trạng HS:</td>
                <td colspan="2" class="leftCol-content">${studentStatus}</td>
                <td> </td>
                <td class="rightCol_title">Phân loại:</td>
                <td colspan="4">${stayIn}</td>
              </tr>
              <tr>
                <td colspan="3" style="margin: 20px 0 5px; padding-top: 20px">
                  <p>+ Xin vui lòng kiểm tra lại danh sách lớp trước khi vào học.</p>
                  <p>+ Học sinh nội trú phải nhập nội trú trước 1 ngày.</p></td>
                <td colspan="5" style="text-align: center; margin: 20px 0 5px; padding-top: 20px">
                  Ngày ${format(new Date(), 'dd')} tháng ${format(new Date(), 'MM')} năm ${format(new Date(), 'yyyy')}<br/>
                  <div>Người lập phiếu</div>
                </td>
              </tr>
            </table>
          
          </div>
         
          
          <script>
            // Wait for all resources to load before printing
            window.onload = function() {
              // Add a slight delay to ensure everything is rendered
              setTimeout(function() {
                window.print();
                
                // Set up event listener for after print
                window.addEventListener('afterprint', function() {
                  // Auto close after printing with a small delay
                  setTimeout(function() {
                    window.close();
                  }, 500);
                });
              }, 1000); // Increased delay for rendering
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    
    setToastMessage("Đã mở phiếu nhập học để in");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  } catch (error) {
    console.error("Error generating admission form:", error);
    setToastMessage(`Lỗi khi tạo phiếu nhập học: ${error.message}`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  } finally {
    setIsPrinting(false);
  }
}, [domain, format]);

  const handleSubmitTransaction = useCallback(async () => {
    try {
      if (!dataRef.current) {
        setToastMessage("Không có dữ liệu học sinh");
        setShowToast(true);
        return;
      }
      
      const isChecked = processedFees.filter((fee) => fee.isChecked);
      if (!isChecked.length) {
        setToastMessage("Chọn học phí muốn thu");
        setShowToast(true);
        return;
      }
      
      await generateReceiptAndSubmit();
    } catch (error) {
      console.error("Error in transaction submission:", error);
      setToastMessage(`Đã xảy ra lỗi: ${error.message}`);
      setShowToast(true);
    }
  }, [dataRef, processedFees, generateReceiptAndSubmit]);

  const formatCurrency = useCallback((amount) => {
    if (!amount && amount !== 0) return "0";
    return parseFloat(amount).toLocaleString("vi-VN");
  }, []);

  const canViewReceipt = modalStatus === MODAL_STATUS.SUBMITTED || 
                        (showTable && processedFees.some(fee => fee.isChecked));

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} 
            handler={onClose} 
            size={size || "xxl"}
            className="max-w-6xl mx-auto">
      <DialogHeader className="flex justify-between items-center p-4 border-b">
        <h3 className="font-bold text-lg">Thu học phí - {studentName} ({mshs})</h3>
        <Button
          variant="text"
          color="blue-gray"
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
        >
          <XMarkIcon className="h-6 w-6" />
        </Button>
      </DialogHeader>
      
      <DialogBody className="p-0 overflow-y-auto max-h-[70vh]">
        <div className="transition-opacity duration-300 ease-in-out">
          {!showReceipt ? (
            <div className="bg-white animate-fade-in">
              <div className="p-4 space-y-4">
                <Suspense fallback={<div className="flex justify-center py-4"><Spinner className="h-8 w-8 text-violet-800" /></div>}>
                  <TransactionHeader 
                    studentName={studentName}
                    studentData={dataRef.current}
                    transactionId={transactionId}
                    currentDay={currentDay}
                    currentMonth={currentMonth}
                    noiDungHoaDown={noiDungHoaDown}
                    onNoiDungChange={handleNoiDungChange}
                  />
                </Suspense>
                
                {(feeDataLoading && isInitialLoad) ? (
                  <div className="flex flex-col items-center justify-center p-8">
                    <Spinner className="h-12 w-12 text-violet-800" />
                    <p className="mt-4 text-gray-700">Đang tải dữ liệu...</p>
                  </div>
                ) : feeDataError ? (
                  <div className="text-red-500 text-center p-4">
                    <p className="text-xl font-bold mb-2">Lỗi khi tải dữ liệu</p>
                    <p>{feeDataError}</p>
                  </div>
                ) : (!processedFees || processedFees.length === 0) ? (
                  <p className="text-gray-700 text-center py-4">Không có dữ liệu học phí cho học sinh này.</p>
                ) : showTable ? (
                  <Suspense fallback={
                    <div className="w-full flex justify-center items-center py-8">
                      <Spinner className="h-8 w-8 text-violet-800" />
                    </div>
                  }>
                    <TransactionTable 
                      processedFees={processedFees}
                      feeTable={feeTable}
                      handleCheck={handleCheck}
                      handlePaidAmount={handlePaidAmount}
                      handleDebt={handleDebt}
                      handleNote={handleNote}
                      handleFeeCode={handleFeeCode}
                      handleFeeName={handleFeeName}
                      formatCurrency={formatCurrency}
                      addNewRow={addNewRow}
                      totalPaymentAmount={totalPaymentAmount}
                      setTotalPaymentAmount={setTotalPaymentAmount}
                      distributePayment={distributePayment}
                      handleTotalPaymentChange={handleTotalPaymentChange}
                    />
                  </Suspense>
                ) : (
                  <div className="w-full flex justify-center items-center py-8">
                    <Spinner className="h-8 w-8 text-violet-800" />
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-end p-4 gap-4 border-t bg-gray-50">
                <Button
                  className="bg-gray-200 text-gray-700 hover:bg-gray-300 shadow-none"
                  onClick={onClose}
                >
                  Đóng
                </Button>
                <Button
                  className={isSubmitting ? "bg-violet-300 text-white shadow-md" : "bg-violet-700 hover:bg-violet-800 text-white shadow-md"}
                  disabled={isSubmitting || !showTable || modalStatus === MODAL_STATUS.SUBMITTED || !processedFees.some(fee => fee.isChecked)}
                  onClick={handleSubmitTransaction}
                >
                  {modalStatus === MODAL_STATUS.SUBMITTED ? "Đã thu học phí" : "Thu Học Phí"}
                </Button>
                <Button
                  className={isPrinting ? "bg-green-300 text-white shadow-md" : "bg-green-600 hover:bg-green-700 text-white shadow-md"}
                  disabled={isPrinting}
                  onClick={handlePrintPhieuNhapHoc}
                >
                  {isPrinting ? (
                    <div className="flex items-center gap-2">
                      <Spinner className="h-4 w-4 animate-spin" />
                      Đang tải...
                    </div>
                  ) : (
                    "In phiếu nhập học"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <Suspense fallback={<div className="flex justify-center py-8"><Spinner className="h-8 w-8 text-violet-800" /></div>}>
              <div className="animate-fade-in">
                <ReceiptView 
                  onBack={() => setShowReceipt(false)}
                  onClose={onClose}
                  receiptRef={receiptRef}
                  receiptData={receiptData}
                  handlePdfAction={handlePdfAction}
                  pdfLoading={pdfLoading}
                  isSubmitting={isSubmitting}
                />
              </div>
            </Suspense>
          )}
        </div>
      </DialogBody>
   
    </Dialog>
  );
};

export default TransactionStudentModal;