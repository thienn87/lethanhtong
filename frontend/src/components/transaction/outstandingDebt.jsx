import React, { useState, useEffect, useRef } from "react";
import { Toast } from "../polaris/toast";
import { Config } from "../config";
import DebtUpdateSection from "./debt/DebtUpdateSection";
import { Button, Dialog, DialogHeader, DialogBody, DialogFooter, Spinner, Checkbox, Card, CardHeader, CardBody, Typography } from "@material-tailwind/react";
import { AcademicCapIcon, ArrowUpTrayIcon, DocumentTextIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import * as XLSX from 'xlsx';
import axios from 'axios';

function OutstandingDebt() {
  const domain = Config();
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState('');
  const [importErrors, setImportErrors] = useState([]);

  // Debt update section states
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  
  // New school year dialog states
  const [newSchoolYearDialogOpen, setNewSchoolYearDialogOpen] = useState(false);
  const [isProcessingNewYear, setIsProcessingNewYear] = useState(false);
  const [clearTransactions, setClearTransactions] = useState(false);
  const [newYearProgress, setNewYearProgress] = useState(0);
  const [newYearStatus, setNewYearStatus] = useState('');
  
  // EventSource reference for SSE
  const eventSourceRef = useRef(null);
  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  useEffect(() => {
    // Clean up any existing EventSource when component unmounts
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleMonthChange = (value) => {
    setSelectedMonth(parseInt(value));
  };

  // Function to open the new school year dialog
  const openNewSchoolYearDialog = () => {
    setNewSchoolYearDialogOpen(true);
    setClearTransactions(false);
    setNewYearProgress(0);
    setNewYearStatus('');
  };

  // Function to close the new school year dialog
  const closeNewSchoolYearDialog = () => {
    if (isProcessingNewYear) return; // Prevent closing while processing
    setNewSchoolYearDialogOpen(false);
  };

  // Function to open import invoice dialog
  const openImportDialog = () => {
    setImportDialogOpen(true);
    setImportResult(null);
    setImportProgress(0);
    setImportStatus('');
    setImportErrors([]);
  };

  // Function to close import invoice dialog
  const closeImportDialog = () => {
    if (importing) return; // Prevent closing while processing
    setImportDialogOpen(false);
  };

  const handleImportInvoice = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);
    setImportProgress(10);
    setImportStatus('Đang đọc file Excel...');
    setImportErrors([]);

    try {
      // Read Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      setImportProgress(30);
      setImportStatus('Đang gửi dữ liệu đến máy chủ...');

      // Send to backend for processing
      const response = await axios.post(`${domain}/api/import-invoices`, { rows }, {
        headers: { 'Content-Type': 'application/json' }
      });

      setImportProgress(100);
      setImportStatus('Hoàn thành nhập liệu');
      setImportResult(response.data);
      
      if (response.data.errors && response.data.errors.length > 0) {
        setImportErrors(response.data.errors);
      }
      
      showToastMessage(`Đã nhập ${response.data.successCount} hóa đơn thành công.`);
    } catch (err) {
      setImportProgress(0);
      setImportStatus('Nhập liệu thất bại');
      setImportResult({ error: err.response?.data?.error || err.message || 'Import failed' });
      showToastMessage(`Lỗi khi nhập hóa đơn: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  // Function to download sample Excel template
  const downloadSampleTemplate = () => {
    // Create sample data
    const sampleData = [
      {
        ngayct: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
        sct: '12345',
        mahs: 'HS001',
        khoi: '10',
        lop: '10A1',
        ghichu: 'Học phí tháng 9',
        HP: 1000000,
        BT: 200000,
        NT: 150000,
        LPNT: 50000
      },
      {
        ngayct: new Date().toISOString().split('T')[0],
        sct: '12346',
        mahs: 'HS002',
        khoi: '11',
        lop: '11A2',
        ghichu: 'Học phí tháng 9',
        HP: 1100000,
        BT: 220000,
        NT: 0,
        LPNT: 50000
      }
    ];

    // Create a new workbook and add the data
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(sampleData);

    // Add column widths for better readability
    const columnWidths = [
      { wch: 12 }, // ngayct
      { wch: 8 },  // sct
      { wch: 8 },  // mahs
      { wch: 6 },  // khoi
      { wch: 6 },  // lop
      { wch: 25 }, // ghichu
      { wch: 10 }, // HP
      { wch: 10 }, // BT
      { wch: 10 }, // NT
      { wch: 10 }  // LPNT
    ];
    worksheet['!cols'] = columnWidths;

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Mẫu nhập hóa đơn");

    // Generate the Excel file and trigger download
    XLSX.writeFile(workbook, "mau_nhap_hoa_don.xlsx");
    
    showToastMessage("Đã tải xuống file mẫu Excel");
  };

  // Function to create a new school year
  const createNewSchoolYear = async () => {
    if (isProcessingNewYear) return;

    if (!window.confirm("Bạn có chắc chắn muốn tạo năm học mới? Học sinh sẽ được chuyển lên lớp kế tiếp.")) {
      return;
    }

    setIsProcessingNewYear(true);
    setNewYearProgress(0);
    setNewYearStatus('Đang bắt đầu quá trình...');

    try {
      // Close existing EventSource if any
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Create new SSE connection
      const eventSource = new EventSource(`${domain}/api/school-year/create-new?clearTransactions=${clearTransactions}`);
      eventSourceRef.current = eventSource;

      // Handle the start event
      eventSource.addEventListener('start', (event) => {
        const data = JSON.parse(event.data);
        setNewYearStatus(data.message);
        setNewYearProgress(5);
      });

      // Handle progress updates
      eventSource.addEventListener('progress', (event) => {
        const data = JSON.parse(event.data);
        setNewYearStatus(data.message);
        setNewYearProgress(data.progress);
      });

      // Handle backup progress
      eventSource.addEventListener('backup', (event) => {
        const data = JSON.parse(event.data);
        setNewYearStatus(`Đang sao lưu dữ liệu: ${data.message}`);
        setNewYearProgress(data.progress);
      });

      // Handle student promotion progress
      eventSource.addEventListener('promotion', (event) => {
        const data = JSON.parse(event.data);
        setNewYearStatus(`Đang cập nhật học sinh: ${data.message}`);
        setNewYearProgress(data.progress);
      });

      // Handle clear transactions progress (if selected)
      eventSource.addEventListener('clear', (event) => {
        const data = JSON.parse(event.data);
        setNewYearStatus(`Đang xóa dữ liệu giao dịch: ${data.message}`);
        setNewYearProgress(data.progress);
      });

      // Handle completion
      eventSource.addEventListener('complete', (event) => {
        const data = JSON.parse(event.data);
        setNewYearStatus(data.message);
        setNewYearProgress(100);
        
        // Close the EventSource
        eventSource.close();
        eventSourceRef.current = null;
        
        // Set processing to false after a delay to show the completion message
        setTimeout(() => {
          setIsProcessingNewYear(false);
        }, 2000);
        
        showToastMessage("Tạo năm học mới thành công!");
      });

      // Handle errors
      eventSource.onerror = (error) => {
        console.error('SSE Error:', error);
        setNewYearStatus(`Lỗi kết nối với máy chủ. Vui lòng thử lại.`);
        
        // Close the EventSource
        eventSource.close();
        eventSourceRef.current = null;
        
        setIsProcessingNewYear(false);
        showToastMessage("Đã xảy ra lỗi khi tạo năm học mới.");
      };
    } catch (error) {
      console.error("Error creating new school year:", error);
      setNewYearStatus(`Lỗi: ${error.message}`);
      setIsProcessingNewYear(false);
      showToastMessage(`Lỗi khi tạo năm học mới: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-4">
      {/* Outstanding Debt Update Section */}
      <DebtUpdateSection 
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        handleMonthChange={handleMonthChange}
      />

      {/* Invoice Import Section */}
      <Card className="w-full mb-6 shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader floated={false} shadow={false} className="rounded-none bg-gradient-to-r from-blue-500 to-cyan-600">
          <div className="mb-2 px-4 py-3">
            <Typography variant="h5" color="white">
              Nhập hóa đơn
            </Typography>
            <Typography color="white" className="mt-1 font-normal opacity-80">
              Nhập hóa đơn từ file Excel để cập nhật giao dịch và dư nợ học sinh
            </Typography>
          </div>
        </CardHeader>
        <CardBody className="px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Button
              color="blue"
              className="flex items-center gap-2 bg-blue-600 px-6 py-3"
              onClick={openImportDialog}
            >
              <ArrowUpTrayIcon className="h-5 w-5" />
              Import hóa đơn
            </Button>
            <Button
              color="light-blue"
              variant="outlined"
              className="flex items-center gap-2 px-6 py-3"
              onClick={downloadSampleTemplate}
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Tải file mẫu Excel
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* New School Year Button */}
      <div className="w-full mb-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
        <div className="px-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-t-lg">
          <h2 className="text-xl font-bold text-white">Quản lý năm học</h2>
          <p className="text-white opacity-80">Tạo năm học mới và cập nhật học sinh lên lớp</p>
        </div>
        <div className="p-6 flex justify-center">
          <Button
            color="indigo"
            className="flex items-center gap-2 bg-indigo-600 px-6 py-3"
            onClick={openNewSchoolYearDialog}
          >
            <AcademicCapIcon className="h-5 w-5" />
            Tạo năm học mới
          </Button>
        </div>
      </div>

      {/* Import Invoice Dialog */}
      <Dialog
        open={importDialogOpen}
        handler={closeImportDialog}
        size="md"
      >
        <DialogHeader className="text-xl font-bold text-gray-800">
          Import hóa đơn từ Excel
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Cấu trúc file Excel cần có các cột sau:
                </p>
                <ul className="mt-2 text-sm text-blue-700 list-disc list-inside">
                  <li>ngayct: Ngày chứng từ</li>
                  <li>sct: Số chứng từ</li>
                  <li>mahs: Mã học sinh</li>
                  <li>khoi: Khối</li>
                  <li>lop: Lớp</li>
                  <li>ghichu: Ghi chú</li>
                  <li>HP, BT, NT, LPNT: Các khoản phí</li>
                </ul>
                <div className="mt-2 flex justify-end">
                  <Button
                    size="sm"
                    variant="text"
                    color="blue"
                    className="flex items-center gap-1 p-0"
                    onClick={downloadSampleTemplate}
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    Tải file mẫu
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <ArrowUpTrayIcon className="h-12 w-12 text-gray-400 mb-3" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Nhấn để chọn file</span> hoặc kéo thả file vào đây
            </p>
            <p className="text-xs text-gray-500">
              Chỉ chấp nhận file Excel (.xlsx, .xls)
            </p>
            <Button
              color="blue"
              className="mt-4"
              onClick={() => fileInputRef.current.click()}
              disabled={importing}
            >
              {importing ? (
                <div className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  Đang xử lý...
                </div>
              ) : (
                "Chọn file Excel"
              )}
            </Button>
            <input
              type="file"
              accept=".xlsx,.xls"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleImportInvoice}
              disabled={importing}
            />
          </div>

          {importing && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{importStatus}</span>
                <span className="text-sm font-medium text-gray-700">{importProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${importProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {importResult && !importing && (
            <div className="mt-4">
              {importResult.error ? (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">
                        {importResult.error}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border-l-4 border-green-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">
                        Đã nhập {importResult.successCount} hóa đơn thành công.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {importErrors.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Lỗi ({importErrors.length}):</p>
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                <ul className="divide-y divide-gray-200">
                  {importErrors.map((error, index) => (
                    <li key={index} className="px-4 py-2 text-sm text-red-600">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </DialogBody>
        <DialogFooter className="space-x-2">
          <Button 
            color="red" 
            onClick={closeImportDialog}
            disabled={importing}
          >
            Đóng
          </Button>
        </DialogFooter>
      </Dialog>
      
      {/* New School Year Dialog */}
      <Dialog
        open={newSchoolYearDialogOpen}
        handler={closeNewSchoolYearDialog}
        size="xs"
      >
        <DialogHeader className="text-xl font-bold text-gray-800">
          Tạo năm học mới
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Thao tác này sẽ:
                </p>
                <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                  <li>Cập nhật học sinh lên 1 lớp (VD: 6→7, 7→8, 12→LT)</li>
                  <li>Tạo bản sao lưu cho dữ liệu hóa đơn và giao dịch</li>
                  <li>Tùy chọn xóa dữ liệu hóa đơn và giao dịch cũ</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="clearTransactions" 
              checked={clearTransactions} 
              onChange={() => setClearTransactions(!clearTransactions)}
              disabled={isProcessingNewYear}
            />
            <label htmlFor="clearTransactions" className="text-gray-700 font-medium">
              Xóa dữ liệu hóa đơn và giao dịch cũ
            </label>
          </div>

          {isProcessingNewYear && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{newYearStatus}</span>
                <span className="text-sm font-medium text-gray-700">{newYearProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${newYearProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </DialogBody>
        <DialogFooter className="space-x-2">
          <Button 
            color="red" 
            onClick={closeNewSchoolYearDialog}
            disabled={isProcessingNewYear}
          >
            Hủy
          </Button>
          <Button 
            color="indigo" 
            onClick={createNewSchoolYear}
            disabled={isProcessingNewYear}
            className="flex items-center gap-2"
          >
            {isProcessingNewYear ? (
              <>
                <Spinner className="h-4 w-4" />
                Đang xử lý...
              </>
            ) : (
              <>
                <AcademicCapIcon className="h-4 w-4" />
                Tạo năm học mới
              </>
            )}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Toast Notification - Fixed to only show when there's a message */}
      {showToast && <Toast status={showToast}>{toastMessage}</Toast>}
    </div>
  );
}

export default OutstandingDebt;