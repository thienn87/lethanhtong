import React, { useState, useEffect, useCallback, useRef } from "react";
import ReactDOM from "react-dom";
import { 
  ArrowDownTrayIcon, 
  MagnifyingGlassIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  EyeIcon,
  XMarkIcon,
  PrinterIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  CurrencyDollarIcon
} from "@heroicons/react/24/outline";
import {
  Card,
  CardHeader,
  Typography,
  Button,
  CardBody,
  CardFooter,
  IconButton,
  Dialog,
  DialogBody,
  Spinner,
  Tooltip,
  Chip,
  Avatar,
  Badge
} from "@material-tailwind/react";

import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { debounce } from "lodash";
import * as XLSX from "xlsx";
import { Toast } from "../polaris/toast";
import { v4 as uuidv4 } from "uuid";
import { Config } from "../config";
import ReceiptDownload from "../apps/receipt";
import DateRangeFilter from "../apps/datePicker";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const ITEMS_PER_PAGE = 100;

function Records() {
  const domain = Config();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const receiptRef = useRef(null);
  
  // Fetch data from API
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      });

      if (searchTerm) {
        queryParams.append("search", searchTerm);
      }

      if (dateRange.startDate) {
        queryParams.append("start_date", format(dateRange.startDate, "yyyy-MM-dd"));
      }
      if (dateRange.endDate) {
        queryParams.append("end_date", format(dateRange.endDate, "yyyy-MM-dd"));
      }

      const response = await fetch(
        `${domain}/api/invoice/search?${queryParams.toString()}`
      );
      const result = await response.json();

      if (result.status === "success") {
        // Group transactions by invoice_id
        const invoiceMap = {};
        
        // Process each transaction and group by invoice_id
        result.data.forEach(transaction => {
          const invoiceId = transaction.invoice_id;
         
          if (!invoiceMap[invoiceId]) {
            // Initialize the invoice entry
            invoiceMap[invoiceId] = {
              id: transaction.id,
              invoice_id: invoiceId,
              mshs: transaction.mshs,
              student_name: transaction.student_name,
              class: transaction.class,
              created_at: transaction.created_at,
              invoice_details: transaction.invoice_details,
              amount_paid: parseFloat(transaction.amount_paid || 0),
              transactions: transaction.transaction_details
            };
          } else {
            // Update existing invoice entry
            invoiceMap[invoiceId].amount_paid += parseFloat(transaction.amount_paid || 0);
            invoiceMap[invoiceId].transactions.push(transaction);
            
            // Keep the most recent transaction's created_at date
            const currentDate = new Date(invoiceMap[invoiceId].created_at);
            const newDate = new Date(transaction.created_at);
            if (newDate > currentDate) {
              invoiceMap[invoiceId].created_at = transaction.created_at;
            }
          }
        });
        
        // Convert the map to an array and sort by created_at (newest first)
        const processedData = Object.values(invoiceMap).sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        
        setData(processedData);
        setTotalItems(processedData.length);
        setTotalPages(Math.ceil(processedData.length / ITEMS_PER_PAGE));
      } else {
        console.error("Error fetching data:", result.message);
        setData([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, dateRange, domain]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle search input change with debounce
  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchTerm(value);
      setCurrentPage(1); // Reset to first page on new search
    }, 500),
    []
  );

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

  // Handle date range change
  const handleDateRangeChange = (startDate, endDate) => {
    if (startDate && endDate) {
      setDateRange({
        startDate: parseISO(startDate),
        endDate: parseISO(endDate)
      });
      setCurrentPage(1); // Reset to first page on new date range
    }
  };

  // Handle pagination
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
 
  // Handle invoice view
  const handleViewInvoice = (invoice) => {
    // Format the data to match what ReceiptDownload expects
    const formattedData = {
      ...invoice,
      soChungTu: invoice.invoice_id,
      tenHocSinh: invoice.student_name,
      mshs: invoice.mshs,
      dienGiai: invoice.invoice_details,
      note: invoice.invoice_details,
      soTien: invoice.amount_paid,
      ngayThu: formatDate(invoice.created_at),
      // Use the student data we have
      student: {
        mshs: invoice.mshs,
        name: invoice.student_name.split(' ').pop(),
        sur_name: invoice.student_name.split(' ').slice(0, -1).join(' '),
        grade: invoice.class ? invoice.class.substring(0, 2) : '',
        class: invoice.class ? invoice.class.substring(2) : ''
      }
    };
    
    setSelectedInvoice(formattedData);
    setShowInvoiceDialog(true);
  };
 
  // Handle export to Excel
  const handleExportExcel = async () => {
    setExportLoading(true);
    setToastMessage("Đang tạo file Excel...");
    setShowToast(true);

    try {
      // Build query parameters for export
      const queryParams = new URLSearchParams();

      if (searchTerm) {
        queryParams.append("search", searchTerm);
      }

      if (dateRange.startDate) {
        queryParams.append("start_date", format(dateRange.startDate, "yyyy-MM-dd"));
      }
      if (dateRange.endDate) {
        queryParams.append("end_date", format(dateRange.endDate, "yyyy-MM-dd"));
      }

      // Call the backend API for Excel export
      const response = await fetch(
        `${domain}/api/invoice/export-excel?${queryParams.toString()}`
      );
      
      const result = await response.json();

      if (result.status === "success") {
        // Show success message
        setToastMessage(`Đã xuất ${result.exported_records} bản ghi thành công`);
        
        // Create a download link and trigger download
        const link = document.createElement("a");
        link.href = result.file_path;
        link.download = result.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setToastMessage(`Lỗi: ${result.message}`);
      }
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      setToastMessage("Lỗi khi xuất file Excel");
    } finally {
      setExportLoading(false);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy HH:mm", { locale: vi });
    } catch (error) {
      return dateString;
    }
  };

  // Format amount for display
  const formatAmount = (amount) => {
    if (!amount) return "0";
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  // Handle PDF download and open in new tab
  const handlePdfAction = async (invoice, openInNewTab = false) => {
    setPdfLoading(true);
    try {
      // Use the invoice data we already have
      let invoiceData = invoice;
      
      // Use the current receipt element in the DOM
      if (receiptRef.current) {
        // Generate PDF using html2canvas and jsPDF
        const element = receiptRef.current;
        const canvas = await html2canvas(element, { scale: 2 });
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
          pdf.save(`${invoiceData.invoice_id || 'receipt'}-receipt.pdf`);
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

  // Table headers
  const TABLE_HEAD = [
    "Mã số giao dịch",
    "MSHS",
    "Tên học sinh",
    "Lớp",
    "Số tiền",
    "Ngày tạo",
    "Thao tác",
  ];

  // Render transaction details table
  const renderTransactionDetails = (transactions) => {
    if (!transactions || transactions.length === 0) {
      return (
        <div className="text-center py-4">
          <Typography variant="small" color="blue-gray">
            Không có dữ liệu giao dịch
          </Typography>
        </div>
      );
    }
    
    return (
      <div className="mt-4 border rounded-lg overflow-hidden shadow-sm">
        <table className="w-full min-w-max table-auto text-left">
          <thead>
            <tr>
              <th className="border-b border-blue-gray-100 bg-blue-gray-50/80 p-4">
                <Typography variant="small" color="blue-gray" className="font-bold">
                  Mã giao dịch
                </Typography>
              </th>
              <th className="border-b border-blue-gray-100 bg-blue-gray-50/80 p-4">
                <Typography variant="small" color="blue-gray" className="font-bold">
                  Loại phí
                </Typography>
              </th>
              <th className="border-b border-blue-gray-100 bg-blue-gray-50/80 p-4">
                <Typography variant="small" color="blue-gray" className="font-bold">
                  Số tiền
                </Typography>
              </th>
              <th className="border-b border-blue-gray-100 bg-blue-gray-50/80 p-4">
                <Typography variant="small" color="blue-gray" className="font-bold">
                  Ngày thanh toán
                </Typography>
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction, index) => (
              <tr key={transaction.id || index} className={index % 2 === 0 ? "bg-blue-gray-50/30" : ""}>
                <td className="p-4">
                  <Typography variant="small" color="blue-gray">
                    {transaction.id}
                  </Typography>
                </td>
                <td className="p-4">
                  <Chip 
                    value={transaction.paid_code} 
                    variant="outlined" 
                    size="sm"
                    className="rounded-full"
                  />
                </td>
                <td className="p-4">
                  <Typography variant="small" color="green" className="font-medium">
                    {formatAmount(transaction.amount_paid)} VND
                  </Typography>
                </td>
                <td className="p-4">
                  <Typography variant="small" color="blue-gray">
                    {formatDate(transaction.payment_date || transaction.created_at)}
                  </Typography>
                </td>
              </tr>
            ))}
            <tr className="bg-blue-gray-50/80">
              <td colSpan={2} className="p-4 text-right">
                <Typography variant="small" color="blue-gray" className="font-bold">
                  Tổng cộng:
                </Typography>
              </td>
              <td className="p-4">
                <Typography variant="small" color="green" className="font-bold">
                  {formatAmount(
                    transactions.reduce((sum, t) => sum + (parseFloat(t.amount_paid) || 0), 0)
                  )} VND
                </Typography>
              </td>
              <td className="p-4"></td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Render invoice summary
  const renderInvoiceSummary = (invoice) => {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-blue-50">
              <DocumentTextIcon className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <Typography variant="small" color="blue-gray" className="font-normal">
                Mã hóa đơn
              </Typography>
              <Typography color="blue-gray" className="font-medium">
                {invoice.invoice_id}
              </Typography>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-green-50">
              <UserIcon className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <Typography variant="small" color="blue-gray" className="font-normal">
                Học sinh
              </Typography>
              <Typography color="blue-gray" className="font-medium">
                {invoice.student_name} ({invoice.mshs})
              </Typography>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-orange-50">
              <CalendarIcon className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <Typography variant="small" color="blue-gray" className="font-normal">
                Ngày tạo
              </Typography>
              <Typography color="blue-gray" className="font-medium">
                {formatDate(invoice.created_at)}
              </Typography>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center">
            <div>
              <Typography variant="small" color="blue-gray" className="font-normal">
                Nội dung
              </Typography>
              <Typography color="blue-gray" className="font-medium">
                {invoice.invoice_details || "Thanh toán học phí"}
              </Typography>
            </div>
            <div className="text-right">
              <Typography variant="small" color="blue-gray" className="font-normal">
                Tổng tiền
              </Typography>
              <Typography color="green" className="font-bold text-xl">
                {formatAmount(invoice.amount_paid)} VND
              </Typography>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto">
      <Card className="h-full w-full">
        <CardHeader floated={false} shadow={false} className="rounded-none overflow-visible">
          <div className="mb-4 flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div>
              <Typography variant="h5" color="blue-gray">
                Danh sách hóa đơn
              </Typography>
              <Typography color="gray" className="mt-1 font-normal">
                Tổng số: {totalItems} hóa đơn
              </Typography>
            </div>
            <div className="flex w-full shrink-0 gap-2 md:w-max">
              {/* HTML input for search */}
              <div className="w-full md:w-72 relative">
                <div className="relative flex items-center">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo MSHS, tên học sinh..."
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              {/* Date range filter with z-index to prevent overlay issues */}
              <div className="relative z-50">
                <DateRangeFilter onSendDateRange={handleDateRangeChange} />
              </div>
              
              <Button
                className="flex items-center gap-3"
                color="blue"
                size="sm"
                onClick={handleExportExcel}
                disabled={exportLoading}
              >
                {exportLoading ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <ArrowDownTrayIcon strokeWidth={2} className="h-4 w-4" />
                )}
                Xuất Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody className="overflow-hidden px-0">
          <table className="w-full min-w-max table-auto text-left">
            <thead>
              <tr>
                {TABLE_HEAD.map((head) => (
                  <th
                    key={head}
                    className="border-b border-blue-gray-100 bg-blue-gray-50/50 p-4"
                  >
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-bold leading-none opacity-70"
                    >
                      {head}
                    </Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center">
                    <Spinner className="mx-auto" />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center">
                    <Typography variant="small" color="blue-gray">
                      Không có dữ liệu
                    </Typography>
                  </td>
                </tr>
              ) : (
                data.map((invoice, index) => {
                  const isLast = index === data.length - 1;
                  const classes = isLast
                    ? "p-4"
                    : "p-4 border-b border-blue-gray-50";

                  return (
                    <tr key={invoice.id} className="hover:bg-blue-gray-50/30 transition-colors">
                      <td className={classes}>
                        <Typography variant="small" color="blue-gray" className="font-medium">
                          {invoice.invoice_id}
                        </Typography>
                      </td>
                      <td className={classes}>
                        <Typography variant="small" color="blue-gray">
                          {invoice.mshs}
                        </Typography>
                      </td>
                      <td className={classes}>
                        <div className="flex items-center gap-3">
                          <Typography variant="small" color="blue-gray">
                            {invoice.student_name}
                          </Typography>
                        </div>
                      </td>
                      <td className={classes}>
                        <Chip
                          value={invoice.class}
                          size="sm"
                          variant="ghost"
                          color="blue-gray"
                          className="rounded-full text-xs"
                        />
                      </td>
                      <td className={classes}>
                        <Typography variant="small" color="green" className="font-semibold">
                          {formatAmount(invoice.amount_paid)} VND
                        </Typography>
                      </td>
                      <td className={classes}>
                        <Typography variant="small" color="blue-gray">
                          {formatDate(invoice.created_at)}
                        </Typography>
                      </td>
                      <td className={classes}>
                        <Tooltip content="Xem chi tiết">
                          <IconButton
                            variant="text"
                            color="blue"
                            onClick={() => handleViewInvoice(invoice)}
                          >
                            <EyeIcon className="h-5 w-5" />
                          </IconButton>
                        </Tooltip>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardBody>
        <CardFooter className="flex items-center justify-between border-t border-blue-gray-50 p-4">
          <Typography variant="small" color="blue-gray" className="font-normal">
            Trang {currentPage} / {totalPages}
          </Typography>
          <div className="flex gap-2">
            <Button
              variant="outlined"
              color="blue-gray"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 1 || loading}
            >
              <ChevronLeftIcon strokeWidth={2} className="h-4 w-4" />
            </Button>
            <Button
              variant="outlined"
              color="blue-gray"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages || loading}
            >
              <ChevronRightIcon strokeWidth={2} className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Invoice Detail Dialog with ReceiptDownload component */}
      {showInvoiceDialog && selectedInvoice && (
        <Dialog
          open={showInvoiceDialog}
          handler={() => setShowInvoiceDialog(false)}
          size="xl"
          className="p-3 w-[85%] !max-w-[1200px] bg-[#f8f9fa] rounded-[1rem] relative"
        >
          <Button
            variant="text"
            color="blue-gray"
            className="!absolute top-3 right-3 z-10"
            onClick={() => setShowInvoiceDialog(false)}
          >
            <XMarkIcon className="h-6 w-6" />
          </Button>
          
          <DialogBody className="space-y-4 px-2 flex flex-col items-center relative">
            {/* Receipt */}
            <div ref={receiptRef} className="space-y-4 py-4 px-5 bg-white rounded-[1rem] w-[90%] max-w-[950px] min-w-[800px] relative shadow-md">
              <ReceiptDownload
                customClass="h-full w-full"
                receiptData={selectedInvoice}
                feeDetails={selectedInvoice.transactions}
                invoice={selectedInvoice}
                handleClose={() => setShowInvoiceDialog(false)}
              />
            </div>
            {/* PDF Action Buttons */}
            <div className="flex gap-4 mt-6">
              <Button
                color="blue"
                className="flex items-center gap-2"
                onClick={() => handlePdfAction(selectedInvoice)}
                disabled={pdfLoading}
              >
                {pdfLoading ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <ArrowDownTrayIcon className="h-4 w-4" />
                )}
                Tải xuống PDF
              </Button>
              
              <Button
                color="green"
                className="flex items-center gap-2"
                onClick={() => handlePdfAction(selectedInvoice, true)}
                disabled={pdfLoading}
              >
                {pdfLoading ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <PrinterIcon className="h-4 w-4" />
                )}
                In biên lai
              </Button>
            </div>
          </DialogBody>
        </Dialog>
      )}

      {/* Toast for notifications */}
      <Toast status={showToast || loading}>
        {loading ? "Đang tải" : toastMessage || " "}
      </Toast>
    </div>
  );
}

export default Records;