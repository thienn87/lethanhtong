import React from "react";
import { useState, useCallback } from "react";

import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { Card, Typography, IconButton, Button } from "@material-tailwind/react";
import { Config } from "../config";
import TransactionStudentModal from "./transactionStudentModal";

const SearchStudent = ({ navigation }) => {
  const domain = Config();

  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [modal, setModal] = useState(false);
  const [results, setResults] = useState(null);
  const [studentDetail, setStudentDetail] = useState([]);
  const [classes, setClasses] = useState([]);
  const [hasDiscount, setHasDiscount] = useState(false);
  
  // Use state instead of refs for better reactivity
  const [gradeValue, setGradeValue] = useState("");
  const [classValue, setClassValue] = useState("");
  const [searchValue, setSearchValue] = useState("");

  // Fetch classes based on selected grade
  const fetchClassesByGrade = async (selectedGrade) => {
    if (!selectedGrade) {
      setClasses([]);
      setClassValue("");
      return;
    }
    
    setLoadingClasses(true);
    try {
      const response = await fetch(`${domain}/api/classes/by-grade/${selectedGrade}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          // Sort classes numerically
          const sortedClasses = data.data.sort((a, b) => {
            return parseInt(a.name) - parseInt(b.name);
          });
          
          setClasses(sortedClasses);
        } else {
          console.error("Failed to fetch classes:", data.message);
          setClasses([]);
        }
      } else {
        throw new Error("Error fetching classes");
      }
    } catch (error) {
      console.error("Error:", error.message);
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  // Handle grade change
  const handleGradeChange = (event) => {
    const newGrade = event.target.value;
    setGradeValue(newGrade);
    setClassValue(""); // Reset class selection when grade changes
    fetchClassesByGrade(newGrade);
  };

  const fetchSearch = useCallback(async () => {
    setLoading(true);
    try {
      // Build query parameters consistently
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

  const fetchSuggest = useCallback(async () => {
    setLoading(true);
    try {
      // Build query parameters consistently
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
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (searchValue) queryParams.append("keyword", searchValue);
      if (gradeValue) queryParams.append("grade", gradeValue);
      if (classValue) queryParams.append("class", classValue);
      if (hasDiscount) queryParams.append("hasDiscount", "true");
      
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
  
        // Kiểm tra nếu phản hồi chứa `filePath`
        if (data.filePath) {
          // Mở liên kết trong tab mới
          window.open(data.filePath, "_blank");
          console.log("File link opened in a new tab");
        } else {
          console.log(data.message || "No file path provided in response");
        }
      } else {
        throw new Error("Error exporting student data");
      }
    } catch (error) {
      console.error("Error:", error.message);
    }
  };

  const handleOpenModal = (data) => {
    setModal(true);
    setStudentDetail(data);
  };

  const handleCloseModal = () => {
    setModal(false);
  };

  const handleDiscountChange = () => {
    setHasDiscount(prevState => !prevState);
  };

  const handleSearchInputChange = (event) => {
    setSearchValue(event.target.value);
  };

  const handleSearchKeyUp = (event) => {
    if (event.key === "Enter") {
      fetchSuggest();
    }
  };

  const handleClearSearch = () => {
    setSearchValue("");
  };

  return (
    <>
      <div className="card">
        <div className="card-body">
          <div className="container">
            <h3 className="my-3 font-bold mb-4">Tìm kiếm học sinh</h3>
            <div className="column-12 mb-5">
              <div className="input">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z"
                    clipRule="evenodd"
                  />
                </svg>

                <input
                  className="input px-0 border-none bg-transparent shadow-none ml-2.5 focus:bg-transparent"
                  name="query"
                  placeholder="Tên Học Sinh"
                  type="text"
                  value={searchValue}
                  onChange={handleSearchInputChange}
                  onKeyUp={handleSearchKeyUp}
                  autoFocus
                />
                {searchValue && (
                  <button
                    className="cursor-pointer btn btn-sm btn-icon btn-light btn-clear shrink-0"
                    onClick={handleClearSearch}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="size-6"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
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
                    onChange={handleGradeChange}
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
                    value={classValue}
                    onChange={(e) => setClassValue(e.target.value)}
                    disabled={!gradeValue || loadingClasses}
                  >
                    <option value="">
                      {loadingClasses 
                        ? "Đang tải..." 
                        : !gradeValue 
                          ? "Chọn khối trước" 
                          : classes.length === 0 
                            ? "Không có lớp" 
                            : "Chọn lớp"}
                    </option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.name}>
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
                  <label htmlFor="hasDiscount" className="cursor-pointer ">
                    <b>Giảm học phí</b>
                  </label>
                </div>
              </div>
              <div className="w-full">
                <Button
                  className={`${
                    !loading
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "bg-gray-300 text-gray-400"
                  } `}
                  disabled={loading}
                  onClick={fetchSearch}
                >
                  {loading ? "Đang tìm..." : "Tìm kiếm"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {results && (
        <>
          <div className="flex justify-end items-center mt-5">
            <Button
              className={`${
                !loading
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-300 text-gray-400"
              } `}
              disabled={loading}
              onClick={exportStudentData}
            >
              Xuất dữ liệu
            </Button>
          </div>

          <div className="card mt-5">
            <div className="card-body">
              <div className="container">
                <div className="my-3">
                  <div className="flex justify-between items-center">
                    <h3 className="my-3 font-bold">Danh sách học sinh ({results.length})</h3>
                  </div>
                  <Card className="h-full w-full overflow-hidden">
                    <table className="w-full min-w-max table-auto text-left">
                      <thead>
                        <tr>
                          {[
                            {
                              title: "MSHS",
                            },
                            {
                              title: "Họ",
                            },
                            {
                              title: "Tên",
                            },
                            {
                              title: "Ngày sinh",
                            },
                            {
                              title: "Lớp",
                            },
                            {
                              title: "Giảm HP (%)",
                            },
                            {
                              title: "Thu HP",
                            },
                          ].map(({ title }) => (
                            <th
                              key={uuidv4()}
                              className="border-b border-gray-900 bg-gray-50 p-4"
                            >
                              <Typography
                                variant="small"
                                className=" text-gray-800 font-bold"
                              >
                                {title}
                              </Typography>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((item, index) => {
                          const isLast = index === results.length - 1;
                          const classes = isLast
                            ? "p-4"
                            : "p-4 border-b border-blue-gray-300";
                          return (
                            <tr
                              key={`${uuidv4()}-${index}`}
                              className="even:bg-gray-100"
                            >
                              <td className={classes}>
                                <Typography
                                  variant="small"
                                  color="blue-gray"
                                  className="font-normal"
                                >
                                  {item.mshs}
                                </Typography>
                              </td>
                              <td className={classes}>
                                <Typography
                                  variant="small"
                                  color="blue-gray"
                                  className="font-normal"
                                >
                                  {item.sur_name}
                                </Typography>
                              </td>
                              <td className={classes}>
                                <Typography
                                  variant="small"
                                  color="blue-gray"
                                  className="font-normal"
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
                                  {format(
                                    new Date(item.day_of_birth),
                                    "dd/MM/yyyy"
                                  )}
                                </Typography>
                              </td>
                              <td className={classes}>
                                <Typography
                                  variant="small"
                                  color="blue-gray"
                                  className="font-normal"
                                >
                                  {item.grade}
                                  {item.class}
                                </Typography>
                              </td>
                              <td className={classes}>
                                <Typography
                                  variant="small"
                                  color={item.discount > 0 ? "green" : "blue-gray"}
                                  className={item.discount > 0 ? "font-bold" : "font-normal"}
                                >
                                  {item.discount > 0 ? item.discount : "-"}
                                </Typography>
                              </td>
                              <td className={classes}>
                                <IconButton
                                  className="btn btn-sm btn-icon btn-clear btn-light"
                                  onClick={() => handleOpenModal(item)}
                                >
                                  <svg
                                    className="w-[18px]"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M8.575 4.649c.707-.734 1.682-1.149 2.7-1.149h1.975c1.795 0 3.25 1.455 3.25 3.25v1.5c0 .414-.336.75-.75.75s-.75-.336-.75-.75v-1.5c0-.966-.784-1.75-1.75-1.75h-1.974c-.611 0-1.197.249-1.62.69l-4.254 4.417c-.473.49-.466 1.269.016 1.75l2.898 2.898c.385.386 1.008.392 1.4.014l.451-.434c.299-.288.773-.279 1.06.02.288.298.28.773-.02 1.06l-.45.434c-.981.945-2.538.93-3.502-.033l-2.898-2.898c-1.06-1.06-1.075-2.772-.036-3.852l4.254-4.417Z" />
                                    <path d="M14 7c0 .552-.448 1-1 1s-1-.448-1-1 .448-1 1-1 1 .448 1 1Z" />
                                    <path d="M13.25 10.857c-.728.257-1.25.952-1.25 1.768 0 1.036.84 1.875 1.875 1.875h.75c.207 0 .375.168.375.375s-.168.375-.375.375h-1.875c-.414 0-.75.336-.75.75s.336.75.75.75h.5v.25c0 .414.336.75.75.75s.75-.336.75-.75v-.254c.977-.064 1.75-.877 1.75-1.871 0-1.036-.84-1.875-1.875-1.875h-.75c-.207 0-.375-.168-.375-.375s.168-.375.375-.375h1.875c.414 0 .75-.336.75-.75s-.336-.75-.75-.75h-1v-.25c0-.414-.336-.75-.75-.75s-.75.336-.75.75v.357Z" />
                                  </svg>
                                </IconButton>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </Card>

                  {modal && (
                    <TransactionStudentModal
                      open={modal}
                      onClose={handleCloseModal}
                      data={studentDetail}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default SearchStudent;