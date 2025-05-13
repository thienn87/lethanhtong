import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { format } from "date-fns";
import { ItemList } from "./index_itemList";
import { Toast } from "../polaris/toast";
import { Popup } from "../polaris/popup";
import { Config } from "../config";

import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Typography,
  Button,
  Checkbox,
} from "@material-tailwind/react";
function Students() {
  const domain = Config();
  const [studentList, setStudentList] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null)
  const [modalTransaction, setModalTransaction] = useState(null)
  const [results, setResults] = useState(null)
  const [hasDiscount, setHasDiscount] = useState(false);
  // Use state instead of refs for better reactivity
  const [gradeValue, setGradeValue] = useState("");
  const [classValue, setClassValue] = useState("");
  const [searchValue, setSearchValue] = useState("");

  //for Classes and Grade select
  const [allClasses, setAllClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filter classes based on selected grade
  const filteredClasses = useMemo(() => {
      if (!gradeValue) return allClasses;
      return allClasses.filter(c => c.grade === gradeValue);
  }, [allClasses, gradeValue]); 
  // Reset class selection when grade changes
    useEffect(() => {
        setClassValue("");
    }, [gradeValue]);
    
  const fetchClasses = async () => {
        setClassesLoading(true);
        try {
            const response = await fetch(`${domain}/api/classes/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
            });
  
            if (response.ok) {
                const data = await response.json();
                setAllClasses(data.data || []);
            } else {
                throw new Error('Error fetching class data');
            }
        } catch (error) {
            console.error('Error:', error.message);
            setError('Không thể tải danh sách lớp. Vui lòng thử lại sau.');
        } finally {
            setClassesLoading(false);
        }
    };
  
    useEffect(() => {
        fetchClasses();
    }, []);

  const handleClearSearch = () => {
    setSearchValue("");
  };
  const fetchSuggest = useCallback(async () => {
    setLoading(true);
    try {
      // Build query parameters using the state variables
      const queryParams = new URLSearchParams();
      if (searchValue) queryParams.append("keyword", searchValue);
      // Include grade and class parameters for consistency
      if (gradeValue) queryParams.append("grade", gradeValue);
      if (classValue) queryParams.append("class", classValue);
      if (hasDiscount) queryParams.append("hasDiscount", "true");
      
      const response = await fetch(
        `${domain}/api/students/search?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.warn("suggest response", data.data);
        setResults(data.data);
      } else {
        throw new Error("Error sending form data");
      }
    } catch (error) {
      console.error("Error:", error.message);
    } finally {
      setLoading(false);
    }
  }, [domain, searchValue, gradeValue, classValue, hasDiscount]);

  // Handler for checkbox changes
  const handleDiscountChange = () => {
    setHasDiscount(prevState => !prevState);
  };
  const fetchSearch = useCallback(async () => {
    setLoading(true);
    try {
      // Build query parameters using the state variables
      const queryParams = new URLSearchParams();
      if (searchValue) queryParams.append("keyword", searchValue);
      if (gradeValue) queryParams.append("grade", gradeValue);
      if (classValue) queryParams.append("class", classValue);
      if (hasDiscount) queryParams.append("hasDiscount", "true");
      
      const response = await fetch(
        `${domain}/api/students/search?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setResults(data.data);
      } else {
        throw new Error("Error sending form data");
      }
    } catch (error) {
      console.error("Error:", error.message);
    } finally {
      setLoading(false);
    }
  }, [domain, searchValue, gradeValue, classValue, hasDiscount]);
  
  const exportStudentData = async () => {
    try {
      setLoading(true);
      
      // Build query parameters using the state variables
      const queryParams = new URLSearchParams();
      if (searchValue) queryParams.append("keyword", searchValue);
      if (gradeValue) queryParams.append("grade", gradeValue);
      if (classValue) queryParams.append("class", classValue);
      if (hasDiscount) queryParams.append("hasDiscount", "true");
  
      // Make the API request
      const response = await fetch(
        `${domain}/api/students/export/filter?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            "Accept": "application/json",
          },
        }
      );
  
      if (!response.ok) {
        throw new Error(`Export failed with status: ${response.status}`);
      }
  
      const contentType = response.headers.get("content-type");
      
      // Check if the response is JSON (contains file path)
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        
        // Check if the response contains a file URL
        if (data.filePath) {
          // Create a direct download link
          const downloadLink = document.createElement("a");
          downloadLink.href = data.filePath;
          
          // Extract filename from path or use default
          const fileName = data.filePath.split("/").pop() || "student-data.xlsx";
          downloadLink.download = fileName;
          
          // Append to body, click and remove
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          
          // Show success message
          Toast.success("Xuất file Excel thành công!");
        } else {
          throw new Error(data.message || "Không tìm thấy đường dẫn file");
        }
      } 
      // If the response is a direct file download
      else if (contentType && (
        contentType.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") || 
        contentType.includes("application/vnd.ms-excel")
      )) {
        // Get the blob from the response
        const blob = await response.blob();
        
        // Create object URL for the blob
        const url = window.URL.createObjectURL(blob);
        
        // Get filename from Content-Disposition header or use default
        let fileName = "student-data.xlsx";
        const disposition = response.headers.get("content-disposition");
        if (disposition && disposition.includes("filename=")) {
          const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
          const matches = filenameRegex.exec(disposition);
          if (matches && matches[1]) {
            fileName = matches[1].replace(/['"]/g, '');
          }
        }
        
        // Create download link
        const downloadLink = document.createElement("a");
        downloadLink.href = url;
        downloadLink.download = fileName;
        
        // Append to body, click and remove
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Clean up the URL object
        window.URL.revokeObjectURL(url);
        
        // Show success message
        Toast.success("Xuất file Excel thành công!");
      } else {
        throw new Error("Định dạng file không được hỗ trợ");
      }
    } catch (error) {
      console.error("Error exporting student data:", error.message);
      Toast.error(`Lỗi khi xuất file: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setModal({ ...modal, [name]: value });
  };

  const handleChangeTransaction = (e) => {
    const { name, value } = e.target;
    setModalTransaction({ ...modalTransaction, [name]: parseInt(value) });
  };

  const fetchStudentData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(domain + '/api/students?page=' + page, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStudentList(data.data)
      } else {
        throw new Error('Error sending form data');
      }
    } catch (error) {
      console.error('Error:', error.message);
    } finally {

    }
    setLoading(null)
  }, [page]);

  const fetchUpdateStudent = async () => {
    if (!modal) return;
    setLoading(true);
    try {
      const response = await fetch(`${domain}/api/students/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(modal),
      });

      const data = await response.json();
      setModal(null);
    } catch (error) {
      console.error('Error:', error.message);
    } finally {
      fetchStudentData();
    }
    setLoading(null);
  };
  const fetchDeleteStudent = async (mshs) => {
    setLoading(true);

    const infor = {
      mshs: mshs,
    };
    try {
      const response = await fetch(`${domain}/api/students/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(infor),
      });

      const data = await response.json();
      setModal(null)
    } catch (error) {
      console.error('Error:', error.message);
    } finally {
      fetchStudentData();
    }
    setLoading(null);
  };
  const StudentModalView = () => {
    const [showConfirmPopup, setShowConfirmPopup] = useState(false);
    
    if (modal === null) return null;
    
    return (
      <>
        <Popup status={modal !== null}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-2xl font-bold text-gray-800">Thông tin học sinh</h2>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setModal(null)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
  
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Thông tin cơ bản</h3>
                  
                  <div className="space-y-3">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-600 mb-1">MSHS</label>
                      <div className="flex">
                        <input
                          className="input flex-grow bg-white border border-gray-300 rounded-l-md px-3 py-2 text-gray-700"
                          type="text"
                          name="mshs"
                          disabled
                          value={modal.mshs}
                        />
                        <button 
                          className="bg-gray-100 hover:bg-gray-200 border border-l-0 border-gray-300 rounded-r-md px-3"
                          onClick={() => navigator.clipboard.writeText(modal.mshs)}
                          title="Copy to clipboard"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                          </svg>
                        </button>
                      </div>
                    </div>
  
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-600 mb-1">Họ</label>
                        <input
                          className="input bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-700"
                          name="sur_name"
                          type="text"
                          defaultValue={modal.sur_name}
                          onBlur={(event) => handleChange(event)}
                        />
                      </div>
  
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-600 mb-1">Tên</label>
                        <input
                          className="input bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-700"
                          type="text"
                          name="name"
                          defaultValue={modal.name}
                          onBlur={(event) => handleChange(event)}
                        />
                      </div>
                    </div>
  
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-600 mb-1">Ngày sinh</label>
                      <input
                        className="input bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-700"
                        name="day_of_birth"
                        type="text"
                        defaultValue={format(new Date(modal.day_of_birth), "dd/MM/yyyy")}
                        onBlur={(event) => handleChange(event)}
                      />
                    </div>
  
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-600 mb-1">Giới tính</label>
                      <select
                        className="input bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-700"
                        name="gender"
                        defaultValue={modal.gender}
                        onChange={(event) => handleChange(event)}
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                      </select>
                    </div>
                  </div>
                </div>
  
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Thông tin liên hệ</h3>
                  
                  <div className="space-y-3">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-600 mb-1">Địa chỉ</label>
                      <input
                        className="input bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-700"
                        name="address"
                        type="text"
                        defaultValue={modal.address}
                        onBlur={(event) => handleChange(event)}
                      />
                    </div>
  
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-600 mb-1">Phụ huynh</label>
                      <input
                        className="input bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-700"
                        name="parent_name"
                        type="text"
                        defaultValue={modal.parent_name}
                        onBlur={(event) => handleChange(event)}
                      />
                    </div>
  
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-600 mb-1">Số điện thoại</label>
                      <input
                        className="input bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-700"
                        name="phone_number"
                        type="text"
                        defaultValue={modal.phone_number}
                        onBlur={(event) => handleChange(event)}
                      />
                    </div>
                  </div>
                </div>
              </div>
  
              {/* Right column */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Thông tin học tập</h3>
                  
                  <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-600 mb-1">Khối</label>
                      <select 
                        className="input bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-700"
                        name="grade" 
                        value={modal.grade || ''}
                        onChange={(event) => {
                          // Update grade and reset class when grade changes
                          setModal({ 
                            ...modal, 
                            'grade': event.target.value,
                            'class': '' // Reset class when grade changes
                          });
                        }}
                      >
                        <option value="">-- Chọn khối --</option>
                        {[6, 7, 8, 9, 10, 11, 12, 13].map(grade => (
                          <option key={grade} value={grade.toString()}>Khối {grade}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-600 mb-1">Lớp</label>
                      <select 
                        className="input bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-700"
                        name="class"
                        value={modal.class || ''}
                        onChange={(event) => setModal({ ...modal, 'class': event.target.value })}
                        disabled={!modal.grade || classesLoading}
                      >
                        <option value="">-- Chọn lớp --</option>
                        {classesLoading ? (
                          <option disabled>Đang tải...</option>
                        ) : allClasses.length > 0 ? (
                          allClasses
                            .filter(c => c.grade === modal.grade)
                            .map((c, index) => (
                              <option key={index} value={c.name}>{c.name}</option>
                            ))
                        ) : modal.grade ? (
                          <option disabled>Không có lớp cho khối {modal.grade}</option>
                        ) : null}
                      </select>
                    </div>
                  </div>
  
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-600 mb-1">Miễn giảm học phí (%)</label>
                      <input
                        className="input bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-700"
                        name="discount"
                        type="number"
                        min="0"
                        max="100"
                        defaultValue={modal.discount}
                        onBlur={(event) => handleChange(event)}
                      />
                    </div>
  
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-600 mb-1">Ngày vào</label>
                        <input
                          className="input bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-700"
                          name="day_in"
                          type="text"
                          defaultValue={format(new Date(modal.day_in), "dd/MM/yyyy")}
                          onBlur={(event) => handleChange(event)}
                        />
                      </div>
  
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-600 mb-1">Ngày ra</label>
                        <input
                          className="input bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-700"
                          name="day_out"
                          type="text"
                          defaultValue={
                            modal.day_out && !isNaN(new Date(modal.day_out).getTime()) 
                              ? format(new Date(modal.day_out), "dd/MM/yyyy") 
                              : ""
                          }              
                          onBlur={(event) => handleChange(event)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
  
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Trạng thái</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-600">Tình trạng học tập</label>
                      <div className="relative inline-block w-48">
                        <select
                          className="input bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-700 w-full appearance-none"
                          defaultValue={modal.leave_school ? 'true' : 'false'}
                          onChange={(event) => {
                            setModal({ ...modal, 'leave_school': event.target.value === "true" });
                          }}
                        >
                          <option value="false">Đang học</option>
                          <option value="true">Đã thôi học</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
  
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-600">Nội trú</label>
                      <div className="relative inline-block w-48">
                        <select 
                          className="input bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-700 w-full appearance-none"
                          defaultValue={modal.stay_in ? 'true' : 'false'}
                          onChange={(event) => {
                            setModal({ ...modal, 'stay_in': event.target.value === "true" });
                          }}
                        >
                          <option value="true">Nội trú</option>
                          <option value="false">Không nội trú</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
  
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-600">Lưu ban</label>
                      <div className="relative inline-block w-48">
                        <select 
                          className="input bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-700 w-full appearance-none"
                          defaultValue={modal.fail_grade === true ? 'true' : 'false'}
                          onChange={(event) => {
                            setModal({ ...modal, 'fail_grade': event.target.value === "true" });
                          }}
                        >
                          <option value="false">Không lưu ban</option>
                          <option value="true">Lưu ban</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
  
            <div className="flex justify-center mt-8 gap-3">
              <button 
                className="px-6 py-2 bg-violet-800 text-white rounded-md hover:bg-violet-900 transition-colors"
                onClick={() => fetchUpdateStudent()}
              >
                Lưu lại
              </button>
              
              <button
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                onClick={() => setShowConfirmPopup(true)}
              >
                Xóa
              </button>
              
              <button 
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                onClick={() => setModal(null)}
              >
                Huỷ
              </button>
            </div>
          </div>
        </Popup>
  
        {showConfirmPopup && (
          <Popup status={showConfirmPopup}>
            <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
              <div className="text-center">
                <svg className="mx-auto mb-4 text-red-600 w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Xác nhận xóa</h3>
                <p className="text-gray-600 mb-6">
                  Bạn có chắc chắn muốn xóa thông tin học sinh <span className="font-semibold">{modal.sur_name} {modal.name}</span> không? 
                  <br />Hành động này không thể hoàn tác.
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    className="px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    onClick={() => {
                      fetchDeleteStudent(modal.mshs);
                      setShowConfirmPopup(false);
                      setModal(null);
                    }}
                  >
                    Xác nhận xóa
                  </button>
                  <button
                    className="px-5 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                    onClick={() => setShowConfirmPopup(false)}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          </Popup>
        )}
      </>
    );
  };
  useEffect(() => {
    // fetchStudentData()
  }, [page]);

  // Update the SearchForm component to include export functionality
  const SearchForm = () => {
    return (
      <div>
        <div className="card mb-10">
          <div className="card-body">
            <div className="container">
              <h3 className="my-3 font-bold mb-4">Tìm kiếm học sinh</h3>
              <div className="column-12 mb-5">
                <div className="input">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                    <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clipRule="evenodd" />
                  </svg>

                  <input
                    className="input px-0 border-none bg-transparent shadow-none ml-2.5 focus:bg-transparent"
                    name="query"
                    placeholder="MSHS, Tên Học Sinh"
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    autoFocus
                    onKeyUp={(event) => {
                      if (event.key === 'Enter') {
                        fetchSearch();
                      }
                    }}
                  />
                  <button 
                    className="cursor-pointer btn btn-sm btn-icon btn-light btn-clear shrink-0" 
                    data-modal-dismiss="true"
                    onClick={handleClearSearch}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                      <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="columns-3 mb-5 grid grid-cols-2 md:grid-cols-4 gap-10">
                <div className="w-full">
                  <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-10">
                    <label className="form-label w-1/6 ">
                      <b>Khối</b>
                    </label>
                    <select
                      className="select"
                      name="select"
                      value={gradeValue}
                      onChange={(e) => setGradeValue(e.target.value)}
                    >
                      <option value="">-- Tất cả khối --</option>
                      <option value="6">Khối 6</option>
                      <option value="7">Khối 7</option>
                      <option value="8">Khối 8</option>
                      <option value="9">Khối 9</option>
                      <option value="10">Khối 10</option>
                      <option value="11">Khối 11</option>
                      <option value="12">Khối 12</option>
                      <option value="13">Khối 13</option>
                    </select>
                  </div>
                </div>
                <div className="w-full">
                  <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                    <label className="form-label w-1/6 ">
                      <b>Lớp</b>
                    </label>
                    <select
                      className="select"
                      name="class_id"
                      value={classValue}
                      onChange={(e) => setClassValue(e.target.value)}
                      disabled={classesLoading}
                    >
                      <option value="">-- Tất cả lớp --</option>
                      {classesLoading ? (
                        <option disabled>Đang tải...</option>
                      ) : filteredClasses.length > 0 ? (
                        filteredClasses.map((c, index) => (
                          <option key={index} value={c.name}>
                            {c.name}
                          </option>
                        ))
                      ) : gradeValue ? (
                        <option disabled>Không có lớp cho khối {gradeValue}</option>
                      ) : null}
                    </select>
                  </div>
                </div>
                <div className="w-full">
                  <div className="flex mt-2 items-center gap-1">
                    <input 
                      type="checkbox" 
                      id="hasDiscount" 
                      checked={hasDiscount} 
                      onChange={handleDiscountChange}
                      className="h-4 w-4 cursor-pointer"
                    />
                    <label htmlFor="hasDiscount" className="cursor-pointer">
                      Giảm học phí
                    </label>
                  </div>
                </div>
                <div className="w-full flex gap-2">
                  <Button
                      className={`${!loading
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-gray-300 text-gray-400"
                        } `}
                      disabled={loading}
                      loading={loading}
                      onClick={() => fetchSearch()} 
                    >
                     Tìm kiếm
                  </Button>
                 
                </div>
              </div>
            </div>
          </div>
        </div>
        {results ?
          <div className="card">
            <div className="card-body">
              <div className="container">
                <div className='my-3'>
                  <ItemList 
                    items={results} 
                    buttonName="Chi Tiết"
                    click={(e) => setModal(results[e])}
                    click2={(e) => setModalTransaction(results[e])}
                    exportClick={exportStudentData}
                    loading={loading}
                    next={() => setPage(prevPage => prevPage + 1)}
                    prev={() => { setPage(prevPage => (prevPage > 1 ? prevPage - 1 : 1)); }}
                  />
                </div>
              </div>
            </div>
          </div> : null}
      </div>
    );
  };

  return (
    <>
      <SearchForm />

      {/* <div style={{ height: "30px" }}></div> */}

      {studentList.length > 0 ?
        <ItemList items={studentList} buttonName="Chi Tiết"
          click={(e) => setModal(studentList[e])}
          click2={(e) => setModalTransaction(studentList[e])}
          exportClick={exportStudentData}
          loading={loading}
          next={() => setPage(prevPage => prevPage + 1)}
          prev={() => { setPage(prevPage => (prevPage > 1 ? prevPage - 1 : 1)); }}
        /> : studentList === false ? <>
          <p className='text-center'>Không tìm thấy học sinh</p></> : null}


      <Toast status={loading}>Đang tải</Toast>
      <StudentModalView />
    </>
  )
}

export default Students
