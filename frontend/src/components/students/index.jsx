import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [classes, setClasses] = useState([])
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null)
  const [modalTransaction, setModalTransaction] = useState(null)
  const [results, setResults] = useState(null)
  const [hasDiscount, setHasDiscount] = useState(false);
  const grade = useRef('')
  const className = useRef('')
  const search = useRef("")
  
  const fetchSuggest = useCallback(async () => {
  setLoading(true);
  try {
    // Build query parameters consistently
    const queryParams = new URLSearchParams();
    if (search.current) queryParams.append("keyword", search.current);
    // Include grade and class parameters for consistency
    if (grade.current) queryParams.append("grade", grade.current);
    if (className.current) queryParams.append("class", className.current);
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
    setLoading(false); // Changed from null to false for consistency
  }
}, [domain, hasDiscount]);

  // Handler for checkbox changes
  const handleDiscountChange = () => {
    setHasDiscount(prevState => !prevState);
  };
  const fetchSearch = useCallback(async () => {
    setLoading(true);
    try {
      // Build query parameters consistently
      const queryParams = new URLSearchParams();
      if (search.current) queryParams.append("keyword", search.current);
      if (grade.current) queryParams.append("grade", grade.current);
      if (className.current) queryParams.append("class", className.current);
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
      setLoading(false); // Changed from null to false for consistency
    }
  }, [domain, hasDiscount]);
  
  const exportStudentData = async () => {
    try {
      // Build query parameters dynamically
      const queryParams = new URLSearchParams();
      if (search.current) queryParams.append("keyword", search.current);
      if (grade.current) queryParams.append("grade", grade.current);
      if (className.current) queryParams.append("class", className.current);
      if (hasDiscount) queryParams.append("hasDiscount", "true");
  
      // Make the API request
      const response = await fetch(
        `${domain}/api/students/export/filter?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
  
      if (response.ok) {
        const data = await response.json();
  
        // Check if the response contains a file path
        if (data.filePath) {
          // Open the file in a new tab
          window.open(data.filePath, "_blank");
          console.log("File link opened in a new tab");
        } else {
          console.warn(data.message || "No file path provided in the response");
        }
      } else {
        throw new Error("Failed to export student data");
      }
    } catch (error) {
      console.error("Error exporting student data:", error.message);
    }
  };

  // Update the listClass function to use the new API endpoint
  const listClass = async (selectedGrade) => {
    setLoading(true);
    try {
      // If no grade is selected, fetch all classes as before
      if (!selectedGrade) {
        const response = await fetch(`${domain}/api/classes/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          // Filter unique classes
          const uniqueClasses = data.data.filter((item, index, self) =>
            index === self.findIndex((t) => t.name === item.name)
          );

          setClasses(uniqueClasses);
        } else {
          throw new Error('Error fetching classes');
        }
      } 
      // If grade is selected, use the new API endpoint
      else {
        const response = await fetch(`${domain}/api/classes/by-grade/${selectedGrade}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.success && Array.isArray(data.data)) {
            // The API returns objects with name property, which matches what the component expects
            // No need to transform the data structure
            setClasses(data.data);
          } else {
            console.error("Failed to fetch classes:", data.message);
            setClasses([]);
          }
        } else {
          throw new Error('Error fetching classes by grade');
        }
      }
    } catch (error) {
      console.error('Error:', error.message);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    listClass()
  }, []);

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

  const fetchClassData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${domain}/api/classes/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        const filtered = data.data.map(({ name }) => ({
          name
        }));
        setClasses(filtered);
      } else {
        throw new Error('Error sending form data');
      }
    } catch (error) {
      console.error('Error:', error.message);
    } finally {

    }
    setLoading(null)
  }, []);

  const fetchGradeData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${domain}/api/grades`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        const filtered = data.data.map(({ grade }) => ({
          grade
        }));
        setGrades(filtered);
      } else {
        throw new Error('Error sending form data');
      }
    } catch (error) {
      console.error('Error:', error.message);
    } finally {

    }
    setLoading(null)
  }, []);

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

  const fetchUpdateTransaction = async () => {
    if (!modalTransaction) return;
    setLoading(true);
    try {
      const response = await fetch(`${domain}/api/transaction/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(modalTransaction),
      });

      const data = await response.json();
      // console.log(data)
      setModalTransaction(null);
    } catch (error) {
      console.error('Error:', error.message);
    } finally {
      fetchStudentData();
    }
    setLoading(null);
  };
  const thuTungLoai = (e) => {
    var soThuInputs = document.getElementsByClassName('soThu');
    for (var i = 0; i < soThuInputs.length; i++) {
      soThuInputs[i].disabled = false;
    }
    console.log('aa');
  }
  const addNewRowToTable = (e) => {

    // Find the table by class name 'bangKeTable'
    const table = document.querySelector('.bangKeTable');

    // Check if the table exists
    if (table) {
      // Find the tbody within the table
      const tbody = table.querySelector('tbody');

      // Create a new tr element
      const newRow = document.createElement('tr');
      newRow.classList.add('even:bg-gray-100')

      const lastRow = tbody.querySelector('tr:last-child');
      const lastNumber = lastRow ? parseInt(lastRow.querySelector('td:first-child').textContent) : 0;

      // Create new td elements (cells) and append them to the new row
      const newCell1 = document.createElement('td');
      const newCell2 = document.createElement('td');
      const newCell3 = document.createElement('td');
      const newCell4 = document.createElement('td');
      const newCell5 = document.createElement('td');
      const newCell6 = document.createElement('td');
      const newCell7 = document.createElement('td');
      const newCell8 = document.createElement('td');



      newCell1.textContent = lastNumber + 1;
      newCell1.classList.add('p-4');
      newRow.appendChild(newCell1);

      newCell2.innerHTML = '<div class="w-full max-w-sm min-w-[40px]"><div class="relative"><select class="w-full bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-200 rounded pl-3 pr-8 py-2 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-400 shadow-sm focus:shadow-md appearance-none cursor-pointer"><option value=""></option><option value="Tin học lớp 6">TH06</option><option value="Tin học lớp 7">TH07</option><option value="Tin học lớp 8">TH08</option><option value="Tin học lớp 9">TH09</option></select><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="currentColor" class="h-5 w-5 ml-1 absolute top-2.5 right-2.5 text-slate-700"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"/></svg></div></div>';
      newRow.appendChild(newCell2);

      newCell3.innerHTML = '<p class="block antialiased font-sans text-sm leading-normal text-blue-gray-900 font-normal">0</p>';
      newRow.appendChild(newCell3);
      newCell4.innerHTML = '<p class="block antialiased font-sans text-sm leading-normal text-blue-gray-900 font-normal">0</p>';
      newRow.appendChild(newCell4);
      newCell5.innerHTML = '<p class="block antialiased font-sans text-sm leading-normal text-blue-gray-900 font-normal">0</p>';
      newRow.appendChild(newCell5);
      newCell6.innerHTML = '<p class="block antialiased font-sans text-sm leading-normal text-blue-gray-900 font-normal">0</p>';
      newRow.appendChild(newCell6);
      newCell7.innerHTML = '<p class="block antialiased font-sans text-sm leading-normal text-blue-gray-900 font-normal">0</p>';
      newRow.appendChild(newCell7);
      newCell8.innerHTML = '<p class="block antialiased font-sans text-sm leading-normal text-blue-gray-900 font-normal">0</p>';
      newRow.appendChild(newCell8);
      // Append the new row to the tbody
      tbody.appendChild(newRow);
    }
  };

  const getTuition = useCallback(async (MSHS) => {
    const baseUrl = `${domain}/transaction/outstanding-debt/single`;
    const url = `${baseUrl}?mshs=${encodeURIComponent(MSHS)}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const result = await response.json();
      console.log("Response:", result);
      return result;
    } catch (error) {
      console.error("Error:", error);
    }
  }, []);

  const TransactionModalView = () => {
    const [tableRows, setTableRows] = useState([]);
    const [totalTuition, setTotalTuition] = useState("");
    const [listTuition, setListTuition] = useState("");

    useEffect(() => {
      if (modalTransaction?.mshs) {
        const fetchData = async () => {
          const result = await getTuition(modalTransaction.mshs);
          setTableRows(result.data);
          setTotalTuition(result.data.chi_tiet_phai_thu_thang_nay.debt);

          const tuitionList = result.data.chi_tiet_phai_thu_thang_nay.tuition_apply
            .map((item) => item.code)
            .join(" + ");
          setListTuition(tuitionList);

          console.log(result);
        };

        fetchData();
      }
    }, [modalTransaction?.mshs]);

    const renderTableRows = () => {
      if (!tableRows || !tableRows.chi_tiet_phai_thu_thang_nay) return null;

      return tableRows.chi_tiet_phai_thu_thang_nay.tuition_apply.map((item, index) => {
        const soDuDauKy = tableRows.so_du_dau_ki.find(soDuDauKy => soDuDauKy.debt_code === item.code) || {};
        const daThu = tableRows.da_thu.find(daThu => daThu.paid_code === item.code) || {};
        const amountPaidDaThu = daThu?.amount_paid || 0;
        const isLast = index === tableRows.length - 1;
        const classes = isLast ? "p-4" : "p-4 border-b border-blue-gray-50";
        return (
          <tr key={index} className="even:bg-gray-100">
            <td className={classes}>
              <Typography
                variant="small"
                color="blue-gray"
                className="font-normal"
              >
                {index + 1}
              </Typography>
            </td>
            <td className={classes}>
              <Typography
                variant="small"
                color="blue-gray"
                className="font-normal"
              >
                {item.code}
              </Typography>
            </td>
            <td className={classes}>
              <Typography
                variant="small"
                color="blue-gray"
                className="font-normal" A
              >
                {item.name}
              </Typography>
            </td>
            <td className={classes}>
              <Typography
                variant="small"
                color="blue-gray"
                className="font-normal"
              >
                {soDuDauKy.remaining_amount_current_month?.toLocaleString() || 0}
              </Typography>
            </td>
            <td className={classes}>
              <Typography
                variant="small"
                color="blue-gray"
                className="font-normal"
              >
                {item.default_amount?.toLocaleString()}
              </Typography>
            </td>
            <td className={classes}>
              <Typography
                variant="small"
                color="blue-gray"
                className="font-normal"
              >
                {amountPaidDaThu.toLocaleString() || 0}
              </Typography>
            </td>
            <td className={classes}>
              <Typography
                variant="small"
                color="blue-gray"
                className="font-normal"
              >
                {daThu.note || ""}
              </Typography>
            </td>
          </tr>
        );
      });
    };
    if (modalTransaction === null) return
    const currentMonth = new Date().getMonth() + 1
    const currentDay = format(new Date(), "dd/MM/yyyy")
    const studentName = modalTransaction.sur_name + " " + modalTransaction.name
    const TABLE_HEAD = ["Stt", "Mã Hp", "Tên HP", "Số dư đầu kỳ", "Phải thu", "Đã Thu", "Ghi Chú"];

    return <>
      <Popup style={{ padding: "0 0" }}>
        <div className="text-center text-gray-700 p-5 ">
          <Card className="full-width">
            <CardHeader color="blue-gray" className="relative">
              <Typography variant="h3" color="gray" className="mt-5">
                THU HOC PHI
              </Typography>
            </CardHeader>
            <CardBody>
              <div className="flex mb-3">
                <div className="flex-none text-left w-[36%]">
                  {/*Số chứng từ tự động tăng theo số chứng từ cuối cùng trong database */}
                  <span className='font-medium text-base'>Số chứng từ: </span> <input type='text' value='02014' className='font-bold text-base w-16' disabled />
                </div>
                <div className="flex-none text-left w-1/3">
                  <span className='font-medium text-base'>Ngày: </span> <input type='text' value={currentDay} className='font-bold text-base w-28' disabled />
                </div>
                <div className="flex-none text-left w-1/3">
                  <span className='font-bold text-lg'>Học phí tháng </span><input type='text' value={currentMonth} className='font-bold text-lg w-28' disabled />
                </div>
              </div>
              <div className="flex mb-3">
                <div className='flex-none text-left w-[36%]'>
                  <span className='font-medium text-base'>Mã học sinh: </span><input type='text' value={modalTransaction.mshs} className='font-bold text-base w-28' disabled /><br />
                  <span className='font-medium text-base'>Tên học sinh: </span> <input type='text' value={studentName} className='font-bold text-base w-max' disabled />
                </div>
                <div className="flex-none text-left w-1/3">
                  <span className='font-medium text-base'>Khối: </span><input type='text' value={modalTransaction.grade} className='font-bold text-base w-28' disabled />
                </div>
                <div className="flex-none text-left w-1/3">
                  <span className='font-medium text-base'>Lớp: </span><input type='text' value={modalTransaction.class} className='font-bold text-base w-28' disabled />
                </div>
              </div>
              <div className="flex">
                <div className='flex-none text-left w-full'>
                  <span className='font-medium text-base'>Nội dung: </span>
                  {listTuition ?
                    <input type='text' value={`Thu ${listTuition} tháng ${currentMonth}`} className='font-bold text-base w-max' disabled />
                    : ""}
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="full-width mt-10">
            <CardHeader color="blue-gray" className="relative">
              <Typography variant="h4" color="gray" className="mt-5">
                Bảng kê chi tiết
              </Typography>
            </CardHeader>
            <CardBody>
              <table className="w-full min-w-max table-auto text-left bangKeTable">
                <thead>
                  <tr>
                    {TABLE_HEAD.map((head, index) => (
                      <th
                        key={head}
                        className="border-b border-blue-gray-100 bg-blue-gray-50 p-4"
                      >
                        <Typography
                          variant="small"
                          color="gray"
                          className="font-normal leading-none"
                        >
                          {head}
                        </Typography>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {renderTableRows()}
                </tbody>
                <tfoot>
                  <tr >
                    <td colspan="4" className='text-right text-lg font-bold'></td>
                    <td className='text-lg font-bold'>Tổng thu</td>
                    <td colspan="3" className='text-left text-lg font-bold pl-4'>{totalTuition.toLocaleString()}</td>
                  </tr>
                  <tr >
                    <td colspan="2" className='text-right text-lg font-bold'></td>
                    <td colspan="6" className='text-right text-lg font-bold pl-4 pt-4'>
                      <button className="btn btn-primary"
                        onClick={() => {
                          console.log(modalTransaction);
                          fetchUpdateTransaction()
                        }}
                      >Thu Học Phí</button>
                      <button className="btn btn-primary ml-2 " onClick={() => thuTungLoai()}>Thu từng loại</button>
                      <button className="btn btn-primary ml-2 " onClick={() => addNewRowToTable()}>Thêm Học Phí</button>
                      <button className="btn btn-primary ml-2 " onClick={() => setModalTransaction(null)}>Hủy</button>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </CardBody>
          </Card>
          <div className="grid grid-cols-1 w-full">
            <div>
              {/* <table className="table table-border" data-datatable-table="true">
                      <thead>
                        <tr>
                          <th className="w-14">
                            <input className="checkbox checkbox-sm" data-datatable-check="true" type="checkbox" />
                          </th>
                          <th className="min-w-[200px]">
                            <span className="sort">
                              <span className="sort-label text-gray-700 font-normal">{modalTransaction.sur_name} {modalTransaction.name}</span>
                              <span className="sort-icon"></span>
                            </span>
                          </th>
                          <th className="w-[170px]">
                            <span className="sort">
                              <span className="sort-label text-gray-700 font-normal">Tình trạng</span>
                              <span className="sort-icon"></span>
                            </span>
                          </th>
                          <th className="w-[170px]">
                            <span className="sort">
                              <span className="sort-label text-gray-700 font-normal">Tổng cộng</span>
                              <span className="sort-icon"></span>
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <input className="checkbox checkbox-sm" data-datatable-row-check="true" type="checkbox" value="1" />
                          </td>
                          <td className="text-gray-800 font-normal">
                              <a className={`btn btn-sm text-gray-600 hover:text-primary tab-active:bg-primary-light tab-active:text-primary ${
                                  currentMonth === 1 ? 'active' : ''
                              }`} 
                              data-tab-toggle="#activity_2024" href="#">
                              Học phí tháng 1
                              </a>
                          </td>
                          <td>
                            <div className={`badge badge-sm badge-outline ${
                              currentMonth === 1 ? "badge-warning" : modalTransaction.revenue_01 ? "badge-success" : "badge-danger" }`}>
                              {currentMonth === 1 ? "Đang thu" : modalTransaction.revenue_01 ? "Đã thanh toán" : "Chưa thanh toán"}
                            </div>
                          </td>
                          <td className="text-gray-800 font-normal">
                              <label className="input">
                                  <input 
                                  placeholder="" 
                                  type="text" 
                                  name="revenue_01" 
                                  defaultValue={modalTransaction.revenue_01} 
                                  onBlur={(event) => {
                                      handleChangeTransaction(event)
                                  }}
                                  />
                              </label>
                          </td>
                          
                        </tr>
                        <tr>
                          <td>
                            <input className="checkbox checkbox-sm" data-datatable-row-check="true" type="checkbox" value="2" />
                          </td>
                          <td className="text-gray-800 font-normal">
                              <a className={`btn btn-sm text-gray-600 hover:text-primary tab-active:bg-primary-light tab-active:text-primary ${
                                      currentMonth === 2 ? 'active' : ''
                                  }`} data-tab-toggle="#activity_2023" href="#">
                                  Học phí tháng 2
                                  </a>
                          </td>
                          <td>
                              <div className={`badge badge-sm badge-outline ${
                              currentMonth === 2 ? "badge-warning" : modalTransaction.revenue_02 ? "badge-success" : "badge-danger" }`}>
                              {currentMonth === 2 ? "Đang thu" : modalTransaction.revenue_02 ? "Đã thanh toán" : "Chưa thanh toán"}
                            </div>
                          </td>
                          <td className="text-gray-800 font-normal">
                              <label className="input">
                                  <input 
                                  placeholder="" 
                                  type="text" 
                                  name="revenue_02" 
                                  defaultValue={modalTransaction.revenue_02} 
                                  onBlur={(event) => handleChangeTransaction(event)}
                                  />
                              </label>
                          </td>
                          
                        </tr>
                        <tr>
                          <td>
                            <input className="checkbox checkbox-sm" data-datatable-row-check="true" type="checkbox" value="3" />
                          </td>
                          <td className="text-gray-800 font-normal">
                              <a className={`btn btn-sm text-gray-600 hover:text-primary tab-active:bg-primary-light tab-active:text-primary ${
                                      currentMonth === 3 ? 'active' : ''
                                  }`} data-tab-toggle="#activity_2022" href="#">
                                  Học phí tháng 3
                                  </a>
                          </td>
                          <td>
                              <div className={`badge badge-sm badge-outline ${
                              currentMonth === 3 ? "badge-warning" : modalTransaction.revenue_03 ? "badge-success" : "badge-danger" }`}>
                              {currentMonth === 3 ? "Đang thu" : modalTransaction.revenue_03 ? "Đã thanh toán" : "Chưa thanh toán"}
                            </div>
                          </td>
                          <td className="text-gray-800 font-normal">
                              <label className="input">
                                  <input 
                                  placeholder="" 
                                  type="text" 
                                  name="revenue_03" 
                                  defaultValue={modalTransaction.revenue_03} 
                                  onBlur={(event) => handleChangeTransaction(event)}
                                  />
                              </label>
                          </td>
                          
                        </tr>
                        <tr>
                          <td>
                            <input className="checkbox checkbox-sm" data-datatable-row-check="true" type="checkbox" value="4" />
                          </td>
                          <td className="text-gray-800 font-normal">
                          <a className={`btn btn-sm text-gray-600 hover:text-primary tab-active:bg-primary-light tab-active:text-primary ${
                                      currentMonth === 4 ? 'active' : ''
                                  }`} data-tab-toggle="#activity_2022" href="#">
                                  Học phí tháng 4
                                  </a>
                          </td>
                          <td>
                              <div className={`badge badge-sm badge-outline ${
                              currentMonth === 4 ? "badge-warning" : modalTransaction.revenue_04 ? "badge-success" : "badge-danger" }`}>
                              {currentMonth === 4 ? "Đang thu" : modalTransaction.revenue_04 ? "Đã thanh toán" : "Chưa thanh toán"}
                            </div>
                          </td>
                          <td className="text-gray-800 font-normal">
                              <label className="input">
                                  <input 
                                  placeholder="" 
                                  type="text" 
                                  name="revenue_04" 
                                  defaultValue={modalTransaction.revenue_04} 
                                  onBlur={(event) => handleChangeTransaction(event)}
                                  />
                              </label>
                          </td>
                          
                        </tr>
                        <tr>
                          <td>
                            <input className="checkbox checkbox-sm" data-datatable-row-check="true" type="checkbox" value="5" />
                          </td>
                          <td className="text-gray-800 font-normal">
                              <a className={`btn btn-sm text-gray-600 hover:text-primary tab-active:bg-primary-light tab-active:text-primary ${
                                      currentMonth === 5 ? 'active' : ''
                                  }`} data-tab-toggle="#activity_2022" href="#">
                                  Học phí tháng 5
                                  </a>
                          </td>
                          <td>
                              <div className={`badge badge-sm badge-outline ${
                              currentMonth === 5 ? "badge-warning" : modalTransaction.revenue_05 ? "badge-success" : "badge-danger" }`}>
                              {currentMonth === 5 ? "Đang thu" : modalTransaction.revenue_05 ? "Đã thanh toán" : "Chưa thanh toán"}
                            </div>
                          </td>
                          <td className="text-gray-800 font-normal">
                              <label className="input">
                                  <input 
                                  placeholder="" 
                                  type="text" 
                                  name="revenue_05" 
                                  defaultValue={modalTransaction.revenue_05} 
                                  onBlur={(event) => handleChangeTransaction(event)}
                                  />
                              </label>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <input className="checkbox checkbox-sm" data-datatable-row-check="true" type="checkbox" value="5" />
                          </td>
                          <td className="text-gray-800 font-normal">
                              <a className={`btn btn-sm text-gray-600 hover:text-primary tab-active:bg-primary-light tab-active:text-primary ${
                                      currentMonth === 6 ? 'active' : ''
                                  }`} data-tab-toggle="#activity_2022" href="#">
                                  Học phí tháng 6
                                  </a>
                          </td>
                          <td>
                              <div className={`badge badge-sm badge-outline ${
                              currentMonth === 6 ? "badge-warning" : modalTransaction.revenue_06 ? "badge-success" : "badge-danger" }`}>
                              {currentMonth === 6 ? "Đang thu" : modalTransaction.revenue_06 ? "Đã thanh toán" : "Chưa thanh toán"}
                            </div>
                          </td>
                          <td className="text-gray-800 font-normal">
                              <label className="input">
                                  <input 
                                  placeholder="" 
                                  type="text" 
                                  name="revenue_06" 
                                  defaultValue={modalTransaction.revenue_06} 
                                  onBlur={(event) => handleChangeTransaction(event)}
                                  />
                              </label>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <input className="checkbox checkbox-sm" data-datatable-row-check="true" type="checkbox" value="5" />
                          </td>
                          <td className="text-gray-800 font-normal">
                              <a className={`btn btn-sm text-gray-600 hover:text-primary tab-active:bg-primary-light tab-active:text-primary ${
                                      currentMonth === 7 ? 'active' : ''
                                  }`} data-tab-toggle="#activity_2022" href="#">
                                  Học phí tháng 7
                                  </a>
                          </td>
                          <td>
                              <div className={`badge badge-sm badge-outline ${
                              currentMonth === 7 ? "badge-warning" : modalTransaction.revenue_07 ? "badge-success" : "badge-danger" }`}>
                              {currentMonth === 7 ? "Đang thu" : modalTransaction.revenue_07 ? "Đã thanh toán" : "Chưa thanh toán"}
                            </div>
                          </td>
                          <td className="text-gray-800 font-normal">
                              <label className="input">
                                  <input 
                                  placeholder="" 
                                  type="text" 
                                  name="revenue_07" 
                                  defaultValue={modalTransaction.revenue_07} 
                                  onBlur={(event) => handleChangeTransaction(event)}
                                  />
                              </label>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <input className="checkbox checkbox-sm" data-datatable-row-check="true" type="checkbox" value="5" />
                          </td>
                          <td className="text-gray-800 font-normal">
                              <a className={`btn btn-sm text-gray-600 hover:text-primary tab-active:bg-primary-light tab-active:text-primary ${
                                      currentMonth === 8 ? 'active' : ''
                                  }`} data-tab-toggle="#activity_2022" href="#">
                                  Học phí tháng 8
                                  </a>
                          </td>
                          <td>
                          <div className={`badge badge-sm badge-outline ${
                              currentMonth === 8 ? "badge-warning" : modalTransaction.revenue_08 ? "badge-success" : "badge-danger" }`}>
                              {currentMonth === 8 ? "Đang thu" : modalTransaction.revenue_08 ? "Đã thanh toán" : "Chưa thanh toán"}
                            </div>
                          </td>
                          <td className="text-gray-800 font-normal">
                              <label className="input">
                                  <input 
                                  placeholder="" 
                                  type="text" 
                                  name="revenue_08" 
                                  defaultValue={modalTransaction.revenue_08} 
                                  onBlur={(event) => handleChangeTransaction(event)}
                                  />
                              </label>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <input className="checkbox checkbox-sm" data-datatable-row-check="true" type="checkbox" value="5" />
                          </td>
                          <td className="text-gray-800 font-normal">
                              <a className={`btn btn-sm text-gray-600 hover:text-primary tab-active:bg-primary-light tab-active:text-primary ${
                                      currentMonth === 9 ? 'active' : ''
                                  }`} data-tab-toggle="#activity_2022" href="#">
                                  Học phí tháng 9
                                  </a>
                          </td>
                          <td>
                          <div className={`badge badge-sm badge-outline ${
                              currentMonth === 9 ? "badge-warning" : modalTransaction.revenue_09 ? "badge-success" : "badge-danger" }`}>
                              {currentMonth === 9 ? "Đang thu" : modalTransaction.revenue_09 ? "Đã thanh toán" : "Chưa thanh toán"}
                            </div>
                          </td>
                          <td className="text-gray-800 font-normal">
                              <label className="input">
                                  <input 
                                  placeholder="" 
                                  type="text" 
                                  name="revenue_09" 
                                  defaultValue={modalTransaction.revenue_09} 
                                  onBlur={(event) => handleChangeTransaction(event)}
                                  />
                              </label>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <input className="checkbox checkbox-sm" data-datatable-row-check="true" type="checkbox" value="5" />
                          </td>
                          <td className="text-gray-800 font-normal">
                              <a className={`btn btn-sm text-gray-600 hover:text-primary tab-active:bg-primary-light tab-active:text-primary ${
                                      currentMonth === 10 ? 'active' : ''
                                  }`} data-tab-toggle="#activity_2022" href="#">
                                  Học phí tháng 10
                                  </a>
                          </td>
                          <td>
                          <div className={`badge badge-sm badge-outline ${
                              currentMonth === 10 ? "badge-warning" : modalTransaction.revenue_10 ? "badge-success" : "badge-danger" }`}>
                              {currentMonth === 10 ? "Đang thu" : modalTransaction.revenue_10 ? "Đã thanh toán" : "Chưa thanh toán"}
                            </div>
                          </td>
                          <td className="text-gray-800 font-normal">
                              <label className="input">
                                  <input 
                                  placeholder="" 
                                  type="text" 
                                  name="revenue_10" 
                                  defaultValue={modalTransaction.revenue_10} 
                                  onBlur={(event) => handleChangeTransaction(event)}
                                  />
                              </label>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <input className="checkbox checkbox-sm" data-datatable-row-check="true" type="checkbox" value="5" />
                          </td>
                          <td className="text-gray-800 font-normal">
                              <a className={`btn btn-sm text-gray-600 hover:text-primary tab-active:bg-primary-light tab-active:text-primary ${
                                      currentMonth === 11 ? 'active' : ''
                                  }`} data-tab-toggle="#activity_2022" href="#">
                                  Học phí tháng 11
                                  </a>
                          </td>
                          <td>
                              <div className={`badge badge-sm badge-outline ${
                              currentMonth === 11 ? "badge-warning" : modalTransaction.revenue_11 ? "badge-success" : "badge-danger" }`}>
                              {currentMonth === 11 ? "Đang thu" : modalTransaction.revenue_11 ? "Đã thanh toán" : "Chưa thanh toán"}
                            </div>
                          </td>
                          <td className="text-gray-800 font-normal">
                              <label className="input">
                                  <input 
                                  placeholder="" 
                                  type="text" 
                                  name="revenue_11" 
                                  defaultValue={modalTransaction.revenue_11} 
                                  onBlur={(event) => handleChangeTransaction(event)}
                                  />
                              </label>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <input className="checkbox checkbox-sm" data-datatable-row-check="true" type="checkbox" value="5" />
                          </td>
                          <td className="text-gray-800 font-normal">
                              <a className={`btn btn-sm text-gray-600 hover:text-primary tab-active:bg-primary-light tab-active:text-primary ${
                                  currentMonth === 12 ? 'active' : ''
                              }`} data-tab-toggle="#activity_2022" href="#">
                              Học phí tháng 12
                              </a>
                          </td>
                          <td>
                              <div className={`badge badge-sm badge-outline ${
                              currentMonth === 12 ? "badge-warning" : modalTransaction.revenue_12 ? "badge-success" : "badge-danger" }`}>
                              {currentMonth === 12 ? "Đang thu" : modalTransaction.revenue_12 ? "Đã thanh toán" : "Chưa thanh toán"}
                            </div>
                          </td>
                          <td className="text-gray-800 font-normal">
                              <label className="input">
                                  <input 
                                  placeholder="" 
                                  type="text" 
                                  name="revenue_12" 
                                  defaultValue={modalTransaction.revenue_12} 
                                  onBlur={(event) => handleChangeTransaction(event)}
                                  />
                              </label>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <input className="checkbox checkbox-sm" data-datatable-row-check="true" type="checkbox" value="5" />
                          </td>
                          <td className="text-gray-800 font-normal">
                              <a className="btn btn-sm text-gray-600 hover:text-primary tab-active:bg-primary-light tab-active:text-primary" data-tab-toggle="#activity_2022" href="#">
                              Thu thêm
                              </a>
                          </td>
                          <td>
                              <label className="input">
                                  <input 
                                  placeholder="" 
                                  type="text" 
                                  name="extra_fee" 
                                  defaultValue={modalTransaction.extra_fee} 
                                  onBlur={(event) => handleChangeTransaction(event)}
                                  />
                              </label>
                          </td>
                          <td className="text-gray-800 font-normal">
                              <label className="input">
                                  <input 
                                  placeholder="" 
                                  type="text" 
                                  name="extra_fee_note" 
                                  defaultValue={modalTransaction.extra_fee_note} 
                                  onBlur={(event) => handleChangeTransaction(event)}
                                  />
                              </label>
                          </td>
                        </tr>
                      </tbody>
                    </table> */}

            </div>
          </div>
        </div>
      </Popup>
    </>
  }

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
                          defaultValue={modal.grade} 
                          onChange={(event) => setModal({ ...modal, 'grade': event.target.value })}
                        >
                          {grades.length > 0 ? grades.map((g, index) => (
                            <option key={index} value={g.grade}>{g.grade}</option>
                          )) : null}
                        </select>
                      </div>
  
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-600 mb-1">Lớp</label>
                        <select 
                          className="input bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-700"
                          name="class"
                          defaultValue={modal.class}
                          onChange={(event) => setModal({ ...modal, 'class': event.target.value })}
                        >
                          {classes.length > 0 ? classes.map((c, index) => (
                            <option key={index} value={c.name}>{c.name}</option>
                          )) : null}
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

  useEffect(() => {
    fetchClassData()
    fetchGradeData()
  }, []);



  // Update the SearchForm component to call listClass when grade changes
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
                    defaultValue={search.current}
                    autoFocus
                    onKeyUp={(event) => {
                      const key = event.key;
                      search.current = event.target.value;
                      if (key === 'Enter') {
                        fetchSuggest();
                      }
                    }}
                  />
                  <button className="cursor-pointer btn btn-sm btn-icon btn-light btn-clear shrink-0" data-modal-dismiss="true">
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
                      defaultValue={grade.current}
                      onChange={(event) => {
                        grade.current = event.target.value;
                        // Reset class selection when grade changes
                        className.current = "";
                        // Fetch classes for the selected grade
                        listClass(event.target.value);
                      }}
                    >
                      <option value="">Chọn khối</option>
                      <option value="6">6</option>
                      <option value="7">7</option>
                      <option value="8">8</option>
                      <option value="9">9</option>
                      <option value="10">10</option>
                      <option value="11">11</option>
                      <option value="12">12</option>
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
                      defaultValue={className.current || ""}
                      onChange={(event) => {
                        className.current = event.target.value;
                        console.log("Selected class:", className.current); // Debug log to verify
                      }}
                      disabled={loading}
                    >
                      <option value="">
                        {loading ? "Đang tải..." : !grade.current ? "Chọn khối trước" : "Chọn lớp"}
                      </option>
                      {classes && classes.map((c, index) => (
                        <option key={index} value={c.name}>
                          Lớp {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="w-full">
                  <div className="flex items-center gap-2">
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
                <div className="w-full">
                  <button 
                    onClick={() => fetchSearch()} 
                    className="btn btn-primary self-center text-center"
                    disabled={loading}
                  >
                    {loading ? "Đang tải..." : "Tìm kiếm"}
                  </button>
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
                  <ItemList items={results} buttonName="Chi Tiết"
                    click={(e) => setModal(results[e])}
                    click2={(e) => setModalTransaction(results[e])}
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

      <TransactionModalView />

      <StudentModalView />
    </>
  )
}

export default Students
