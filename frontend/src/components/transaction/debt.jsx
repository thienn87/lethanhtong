import { useState, useEffect, useCallback, useMemo } from 'react';
import "react-datepicker/dist/react-datepicker.css";
import { Toast } from "../polaris/toast";
import { Config } from "../config";
import * as XLSX from "xlsx";

// Define formatCurrency function locally if import fails
const formatCurrency = (value, showSymbol = true) => {
  // Handle null, undefined or empty string
  if (value === null || value === undefined || value === '') {
    return '0';
  }
  
  // Convert to number if it's a string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Format with thousand separators
  try {
    // Use Intl.NumberFormat but without the currency style to avoid the đ symbol
    return new Intl.NumberFormat('vi-VN', {
      style: 'decimal', // Use decimal instead of currency
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue);
  } catch (error) {
    // Fallback formatting if Intl.NumberFormat fails
    return numValue.toLocaleString();
  }
};

const TABLE_HEAD = [
  "MSHS", 
  "Họ và tên", 
  "Khối", 
  "Lớp", 
  "Dư cuối tháng trước", 
  "Đã thu", 
  "Dư cuối tháng này", 
  "Tổng dư cuối"
];

export default function Debt() {
  // Fix: Use a default API base URL if Config.domain is undefined
  const domain = Config();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  
  // Search parameters
  const [keyword, setKeyword] = useState("");
  const [grade, setGrade] = useState("");
  const [className, setClassName] = useState("");
  
  // Date filters
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Data
  const [students, setStudents] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  
  // Add the missing summary state
  const [summaryData, setSummary] = useState({
    totalPreviousBalance: 0,
    totalPaid: 0,
    totalCurrentBalance: 0,
    totalBalance: 0
  });
  
  // Options for dropdowns
  const gradeOptions = ["6", "7", "8", "9", "10", "11", "12"];
  
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const options = [];
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      options.push(i);
    }
    return options;
  }, []);
  
  const monthOptions = useMemo(() => {
    const options = [];
    for (let i = 1; i <= 12; i++) {
      options.push(i);
    }
    return options;
  }, []);
  
  // Fetch class options when grade changes
  useEffect(() => {
    const fetchClassOptions = async () => {
      if (!grade) {
        setClassOptions([]);
        setClassName("");
        return;
      }
      
      setIsLoadingClasses(true);
      
      try {
        const response = await fetch(`${domain}/api/classes/by-grade/${grade}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
        });
        
        const result = await response.json();
        
        if (result.success && Array.isArray(result.data)) {
          // Sort classes numerically
          const sortedClasses = result.data.sort((a, b) => {
            return parseInt(a.name) - parseInt(b.name);
          });
          
          setClassOptions(sortedClasses.map(c => c.name));
        } else {
          console.error("Failed to fetch class options:", result.message);
          // Fallback to default class options if API fails
          const fallbackOptions = [];
          for (let i = 1; i <= 15; i++) {
            fallbackOptions.push(i.toString());
          }
          setClassOptions(fallbackOptions);
        }
      } catch (error) {
        console.error("Error fetching class options:", error);
        // Fallback to default class options if API fails
        const fallbackOptions = [];
        for (let i = 1; i <= 15; i++) {
          fallbackOptions.push(i.toString());
        }
        setClassOptions(fallbackOptions);
      } finally {
        setIsLoadingClasses(false);
      }
    };
    
    fetchClassOptions();
  }, [grade, domain]);
  
  // Handle grade change
  const handleGradeChange = (e) => {
    const newGrade = e.target.value;
    setGrade(newGrade);
    setClassName(""); // Reset class selection when grade changes
  };
  
  // Fetch data with debounce
  // Update the fetchData function in debt.jsx
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (keyword) queryParams.append("keyword", keyword);
      if (grade) queryParams.append("grade", grade);
      if (className) queryParams.append("class", className);
      queryParams.append("year", year);
      queryParams.append("month", month);
      queryParams.append("page", page);
      queryParams.append("limit", limit);
      
      // Fix: Ensure we have a proper API URL
      const apiUrl = `${domain}/api/transaction/student-debts/search?${queryParams.toString()}`;
      console.log("Fetching from:", apiUrl); // Debug log
      
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        setStudents(result.data || []);
        setTotalCount(result.totalCount || 0);
        setTotalPages(result.totalPages || 1);
        
        // Set summary data from the API response
        setSummary({
          totalPreviousBalance: result.totals?.du_cuoi_thang_truoc || 0,
          totalPaid: result.totals?.dathu || 0,
          totalCurrentBalance: result.totals?.du_cuoi_thang_nay || 0,
          totalBalance: result.totals?.tong_du_cuoi || 0
        });
      } else {
        setError(result.message || "Failed to fetch data");
        showToastMessage(result.message || "Failed to fetch data");
      }
    } catch (error) {
      console.error("Error fetching student debts:", error);
      setError("Network error. Please try again.");
      showToastMessage("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [domain, keyword, grade, className, year, month, page, limit]);
  
  // Initial data load and when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Handle search button click
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
    fetchData();
  };
  
  // Handle pagination
  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };
  
  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };
  
  // Toast message helper - updated to match Toast component API
  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };
  
  // Update the exportToExcel function to use the API endpoint
  const exportToExcel = () => {
    try {
      if (students.length === 0) {
        showToastMessage("No data to export");
        return;
      }
      
      // Create query parameters for export
      const queryParams = new URLSearchParams();
      if (keyword) queryParams.append("keyword", keyword);
      if (grade) queryParams.append("grade", grade);
      if (className) queryParams.append("class", className);
      queryParams.append("year", year);
      queryParams.append("month", month);
      queryParams.append("export", true); // Add export flag
      
      // Create the export URL
      const exportUrl = `${domain}/api/transaction/student-debts/search?${queryParams.toString()}`;
      
      // Create a temporary link element to trigger the download
      const link = document.createElement('a');
      link.href = exportUrl;
      link.setAttribute('download', `student_debts_${month}_${year}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToastMessage("Export initiated");
    } catch (error) {
      console.error("Export error:", error);
      showToastMessage("Export failed");
    }
  };
  
  return (
    <div className="container mx-auto py-4 px-4">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Công nợ học sinh</h2>
        
        {/* Search filters */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div className="form-group">
              <label htmlFor="keyword" className="block text-sm font-medium mb-1">Tìm kiếm (MSHS, Tên)</label>
              <div className="relative">
                <input
                  type="text"
                  id="keyword"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="MSHS/Tên hs"
                />
                <span className="absolute right-3 top-2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="grade" className="block text-sm font-medium mb-1">Khối</label>
              <select
                id="grade"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={grade}
                onChange={handleGradeChange}
              >
                <option value="">Tất cả</option>
                {gradeOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="class" className="block text-sm font-medium mb-1">Lớp</label>
              <select
                id="class"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                disabled={isLoadingClasses || !grade}
              >
                <option value="">Tất cả</option>
                {isLoadingClasses ? (
                  <option value="" disabled>Loading...</option>
                ) : (
                  classOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))
                )}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="year" className="block text-sm font-medium mb-1">Năm</label>
              <select
                id="year"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={year.toString()}
                onChange={(e) => setYear(parseInt(e.target.value))}
              >
                {yearOptions.map((option) => (
                  <option key={option} value={option.toString()}>{option}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="month" className="block text-sm font-medium mb-1">Tháng</label>
              <select
                id="month"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={month.toString()}
                onChange={(e) => setMonth(parseInt(e.target.value))}
              >
                {monthOptions.map((option) => (
                  <option key={option} value={option.toString()}>{option}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex justify-between">
            <button 
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="inline-block mr-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              ) : (
                <span className="inline-block mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
              )}
              Tìm kiếm
            </button>
            
            <button 
              type="button"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center"
              onClick={exportToExcel}
              disabled={isLoading || students.length === 0}
            >
              <span className="inline-block mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </span>
              Xuất Excel
            </button>
          </div>
        </form>
        
        {/* Results summary */}
        {students.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Tổng kết ({totalCount} học sinh)</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Tổng dư tháng trước:</p>
                <p className="font-semibold">{formatCurrency(summaryData.totalPreviousBalance)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tổng đã thu:</p>
                <p className="font-semibold text-green-600">{formatCurrency(summaryData.totalPaid)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tổng dư tháng này:</p>
                <p className="font-semibold">{formatCurrency(summaryData.totalCurrentBalance)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tổng dư cuối:</p>
                <p className="font-semibold text-blue-600">{formatCurrency(summaryData.totalBalance)}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {/* Results table */}
        {!isLoading && students.length > 0 && (
          <div className="overflow-x-auto shadow-md rounded-lg">
            <table className="w-full border-collapse bg-white">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                    MSHS
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-48">
                    Họ và tên
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-16">
                    Khối
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-16">
                    Lớp
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-36">
                    Dư cuối tháng trước
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-36">
                    Đã thu
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-36">
                    Dư cuối tháng này
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-36">
                    Tổng dư cuối
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student, index) => (
                  <tr 
                    key={student.mshs} 
                    className={`hover:bg-gray-50 transition-colors duration-150 ease-in-out ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.mshs}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{student.ten}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">{student.khoi}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">{student.lop}</td>
                    <td className={`px-4 py-3 text-sm font-medium text-right ${parseFloat(student.du_cuoi_thang_truoc) < 0 ? 'text-red-600' : parseFloat(student.du_cuoi_thang_truoc) > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                      {formatCurrency(student.du_cuoi_thang_truoc)}
                    </td>
                    <td className={`px-4 py-3 text-sm font-medium text-right ${parseFloat(student.dathu) < 0 ? 'text-red-600' : parseFloat(student.dathu) > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                      {formatCurrency(student.dathu)}
                    </td>
                    <td className={`px-4 py-3 text-sm font-medium text-right ${parseFloat(student.du_cuoi_thang_nay) < 0 ? 'text-red-600' : parseFloat(student.du_cuoi_thang_nay) > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                      {formatCurrency(student.du_cuoi_thang_nay)}
                    </td>
                    <td className={`px-4 py-3 text-sm font-semibold text-right ${parseFloat(student.tong_du_cuoi) < 0 ? 'text-red-600' : parseFloat(student.tong_du_cuoi) > 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                      {formatCurrency(student.tong_du_cuoi)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* No results message */}
        {!isLoading && students.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">Không tìm thấy kết quả nào.</p>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 mt-6 pt-4">
            <p className="text-sm text-gray-700">
              Trang {page} / {totalPages} ({totalCount} kết quả)
            </p>
            
            <div className="flex space-x-2">
              <button 
                type="button"
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
                onClick={handlePrevPage}
                disabled={page === 1}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button 
                type="button"
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
                onClick={handleNextPage}
                disabled={page === totalPages}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        {/* Toast notification */}
        {showToast && <Toast message={toastMessage} onClose={() => setShowToast(false)} />}
      </div>
    </div>
  );
}