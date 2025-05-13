import React, { useState, useCallback, useMemo, useEffect, memo, useRef, Suspense, lazy } from "react";
import { format } from "date-fns";
import { Card, Typography, Button, Spinner } from "@material-tailwind/react";
import { Config } from "../config";

// Lazy load the transaction components to improve initial load time
const TransactionContent = lazy(() => import("./transactionContent"));

// Global cache for students data
// This will be shared across component instances but cleared on navigation
let globalStudentsCache = null;

// Memoized table header component to prevent unnecessary re-renders
const TableHeader = memo(() => (
  <tr>
    {[
      { title: "MSHS" },
      { title: "Họ" },
      { title: "Tên" },
      { title: "Ngày sinh" },
      { title: "Lớp" },
      { title: "Giảm HP (%)" },
    ].map(({ title }) => (
      <th
        key={title}
        className="border-b border-gray-900 bg-gray-50 p-4 sticky top-0 z-10"
      >
        <Typography
          variant="small"
          className="text-gray-800 font-bold"
        >
          {title}
        </Typography>
      </th>
    ))}
  </tr>
));

// Memoized table row component to prevent unnecessary re-renders
const StudentRow = memo(({ 
  item, 
  isLast, 
  isExpanded, 
  onToggleExpand,
  activeStudentMshs
}) => {
  const classes = isLast ? "p-4" : "p-4 border-b border-blue-gray-300";
  const isActive = activeStudentMshs === item.mshs;
  
  // Format date once with improved error handling
  const formattedDate = useMemo(() => {
    try {
      // Check if day_of_birth exists and is valid
      if (!item.day_of_birth) return "N/A";
      // Try to parse the date - handle both string formats and Date objects
      const dateObj = new Date(item.day_of_birth);
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) return "Invalid date";
      
      // Format the date
      return format(dateObj, "dd/MM/yyyy");
    } catch (error) {
      console.error("Error formatting date:", error, item.day_of_birth);
      return "Invalid date";
    }
  }, [item.day_of_birth]);

  return (
    <>
      <tr 
        id={`student-row-${item.mshs}`}
        className={`
          ${isActive ? "bg-violet-200" : "even:bg-gray-100"} 
          hover:bg-violet-200 transition-colors duration-150 cursor-pointer
          ${isActive ? "border-l-4 border-violet-900" : ""}
        `}
        onClick={() => onToggleExpand(item)}
      >
        <td className={classes}>
          <Typography variant="small" color="blue-gray" className="font-normal">
            {item.mshs}
          </Typography>
        </td>
        <td className={classes}>
          <Typography variant="small" color="blue-gray" className="font-normal">
            {item.sur_name}
          </Typography>
        </td>
        <td className={classes}>
          <Typography variant="small" color="blue-gray" className="font-normal">
            {item.name}
          </Typography>
        </td>
        <td className={classes}>
          <Typography variant="small" color="blue-gray" className="font-normal">
            {formattedDate}
          </Typography>
        </td>
        <td className={classes}>
          <Typography variant="small" color="blue-gray" className="font-normal">
            {item.grade}
            {item.class}
          </Typography>
        </td>
        <td className={classes}>
          <div className="flex items-center justify-between">
            <Typography
              variant="small"
              color={item.discount > 0 ? "green" : "blue-gray"}
              className={item.discount > 0 ? "font-bold" : "font-normal"}
            >
              {item.discount > 0 ? item.discount : "-"}
            </Typography>
            
            {/* Expand/collapse indicator */}
            <div className="ml-2 text-gray-500">
              {isActive ? (
                <svg
                  className="w-5 h-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M5.25 12.75a.75.75 0 0 1 .75-.75h8a.75.75 0 0 1 0 1.5H6a.75.75 0 0 1-.75-.75Z" />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                </svg>
              )}
            </div>
          </div>
        </td>
      </tr>
      {isActive && (
        <tr>
          <td colSpan={6} className="p-0 border-b border-blue-gray-300">
            <div className="bg-violet-900 p-4 transition-all duration-300 ease-in-out">
              <Suspense fallback={
                <div className="flex justify-center items-center py-8">
                  <Spinner className="h-8 w-8 text-white" />
                </div>
              }>
                <TransactionContent 
                  data={item} 
                  onClose={() => onToggleExpand(null)} 
                />
              </Suspense>
            </div>
          </td>
        </tr>
      )}
    </>
  );
});

// Empty state component
const EmptyState = memo(({ message }) => (
  <tr>
    <td colSpan={6} className="p-4 text-center">
      {message}
    </td>
  </tr>
));

// Loading state component
const LoadingState = memo(() => (
  <tr>
    <td colSpan={6} className="p-4 text-center">
      <Spinner className="h-8 w-8 mx-auto" />
    </td>
  </tr>
));

const SearchStudent = ({ navigation }) => {
  const domain = Config();
  const abortControllerRef = useRef(null);
  const initialLoadRef = useRef(true);
  const cacheTimestampRef = useRef(null);
  const tableRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [allStudents, setAllStudents] = useState(null);
  const [displayedResults, setDisplayedResults] = useState(null);
  const [activeStudentMshs, setActiveStudentMshs] = useState(null);
  const [hasDiscount, setHasDiscount] = useState(false);
  
  // Use state for form values
  const [gradeValue, setGradeValue] = useState("");
  const [classValue, setClassValue] = useState("");
  const [searchValue, setSearchValue] = useState("");

  // For Classes and Grade select
  const [allClasses, setAllClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Clear cache on unmount or navigation
  useEffect(() => {
    return () => {
      // Clear the global cache when component unmounts
      globalStudentsCache = null;
    };
  }, []);

  // Filter classes based on selected grade
  const filteredClasses = useMemo(() => {
    if (!gradeValue) return allClasses;
    return allClasses.filter(c => c.grade === gradeValue);
  }, [allClasses, gradeValue]);
  
  // Reset class selection when grade changes
  useEffect(() => {
    setClassValue("");
  }, [gradeValue]);

  // Fetch classes data
  const fetchClasses = useCallback(async () => {
    if (allClasses.length > 0) return; // Only fetch once
    
    setClassesLoading(true);
    try {
      // Use AbortController for cancellable fetch
      const controller = new AbortController();
      const signal = controller.signal;
      
      const response = await fetch(`${domain}/api/classes/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal
      });

      if (response.ok) {
        const data = await response.json();
        setAllClasses(data.data || []);
      } else {
        throw new Error('Error fetching class data');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error:', error.message);
        setError('Không thể tải danh sách lớp. Vui lòng thử lại sau.');
      }
    } finally {
      setClassesLoading(false);
    }
  }, [domain, allClasses.length]);

  // Fetch all students data for local cache
  const fetchAllStudents = useCallback(async (forceRefresh = false) => {
    // If we already have cached data and it's not a forced refresh, use it
    if (globalStudentsCache && !forceRefresh) {
      setAllStudents(globalStudentsCache.data);
      cacheTimestampRef.current = globalStudentsCache.timestamp;
      return;
    }
    
    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setInitialLoading(true);
    
    try {
      // Create new AbortController for this request
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      
      const response = await fetch(
        `${domain}/api/students/all`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          signal
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        
        // Update state with results
        const students = data.data || [];
        setAllStudents(students);
        
        // Update global cache
        const timestamp = Date.now();
        globalStudentsCache = {
          data: students,
          timestamp: timestamp
        };
        cacheTimestampRef.current = timestamp;
      } else {
        throw new Error("Error fetching students data");
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Error:", error.message);
        setError("Không thể tải dữ liệu học sinh. Vui lòng thử lại sau.");
      }
    } finally {
      setInitialLoading(false);
    }
  }, [domain]);

  // Load initial data
  useEffect(() => {
    fetchClasses();
    fetchAllStudents();
  }, [fetchClasses, fetchAllStudents]);

  // Check if cache is stale (older than 15 minutes)
  const isCacheStale = useCallback(() => {
    if (!cacheTimestampRef.current) return true;
    
    // Cache is stale if it's older than 15 minutes
    return Date.now() - cacheTimestampRef.current > 15 * 60 * 1000;
  }, []);

  // Perform client-side search
  const performSearch = useCallback(() => {
    if (!allStudents) return;
    
    setLoading(true);
    
    // Use setTimeout to allow UI to update with loading state
    setTimeout(() => {
      try {
        let results = [...allStudents];
        
        // Filter by search value (MSHS or name)
        if (searchValue) {
          const searchLower = searchValue.toLowerCase();
          results = results.filter(student => 
            (student.mshs && student.mshs.toLowerCase().includes(searchLower)) ||
            (student.name && student.name.toLowerCase().includes(searchLower)) ||
            (student.sur_name && student.sur_name.toLowerCase().includes(searchLower))
          );
        }
        
        // Filter by grade
        if (gradeValue) {
          results = results.filter(student => 
            student.grade && student.grade.toString() === gradeValue
          );
        }
        
        // Filter by class
        if (classValue) {
          results = results.filter(student => 
            student.class && student.class === classValue
          );
        }
        
        // Filter by discount
        if (hasDiscount) {
          results = results.filter(student => 
            student.discount && student.discount > 0
          );
        }
        
        setDisplayedResults(results);
        
        // Close any expanded row when search results change
        setActiveStudentMshs(null);
      } catch (error) {
        console.error("Error during client-side search:", error);
        setError("Lỗi khi tìm kiếm. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    }, 0);
  }, [allStudents, searchValue, gradeValue, classValue, hasDiscount]);

  // Handle search button click
  const handleSearch = useCallback(async (forceRefresh = false) => {
    // If cache is stale or force refresh is requested, fetch fresh data
    if (forceRefresh || isCacheStale()) {
      await fetchAllStudents(true);
    }
    
    performSearch();
  }, [fetchAllStudents, performSearch, isCacheStale]);

  // Auto-search when filter criteria change
  useEffect(() => {
    // Skip the initial render
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    
    // Only search if we have students data
    if (allStudents) {
      performSearch();
    }
  }, [searchValue, gradeValue, classValue, hasDiscount, performSearch, allStudents]);

  // Toggle expanded row
  const handleToggleExpand = useCallback((student) => {
    setActiveStudentMshs(prevMshs => {
      // If clicking on the same student, close the expanded row
      if (prevMshs === student?.mshs) {
        return null;
      }
      // Otherwise, expand the clicked student
      return student?.mshs || null;
    });
    
    // Scroll to the expanded row after a short delay to allow rendering
    if (student) {
      setTimeout(() => {
        const activeRow = document.getElementById(`student-row-${student.mshs}`);
        if (activeRow && tableRef.current) {
          tableRef.current.scrollTo({
            top: activeRow.offsetTop - 100,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, []);

  const handleDiscountChange = useCallback(() => {
    setHasDiscount(prevState => !prevState);
  }, []);

  const handleSearchInputChange = useCallback((event) => {
    setSearchValue(event.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchValue("");
  }, []);

  const handleGradeChange = useCallback((e) => {
    setGradeValue(e.target.value);
  }, []);

  const handleClassChange = useCallback((e) => {
    setClassValue(e.target.value);
  }, []);

  // Memoize grade options to prevent re-renders
  const gradeOptions = useMemo(() => {
    return [6, 7, 8, 9, 10, 11, 12].map(g => (
      <option key={g} value={g.toString()}>Khối {g}</option>
    ));
  }, []);

  // Memoize class options to prevent re-renders
  const classOptions = useMemo(() => {
    if (classesLoading) {
      return <option disabled>Đang tải...</option>;
    } 
    
    if (filteredClasses.length > 0) {
      return filteredClasses.map((c, index) => (
        <option key={index} value={c.name}>
          {c.name}
        </option>
      ));
    }
    
    if (gradeValue) {
      return <option disabled>Không có lớp cho khối {gradeValue}</option>;
    }
    
    return null;
  }, [classesLoading, filteredClasses, gradeValue]);

  // Determine if we should show the results section
  const showResults = displayedResults !== null || loading;

  // Determine what to show in the table body
  const renderTableBody = () => {
    if (initialLoading) {
      return <EmptyState message={
        <div className="flex flex-col items-center">
          <Spinner className="h-8 w-8 mb-2" />
          <span>Đang tải dữ liệu học sinh...</span>
        </div>
      } />;
    }
    
    if (loading) {
      return <LoadingState />;
    }
    
    if (!displayedResults || displayedResults.length === 0) {
      return <EmptyState message="Không tìm thấy học sinh nào" />;
    }
    
    return displayedResults.map((item, index) => (
      <StudentRow
        key={item.mshs || index}
        item={item}
        isLast={index === displayedResults.length - 1}
        isExpanded={activeStudentMshs === item.mshs}
        onToggleExpand={handleToggleExpand}
        activeStudentMshs={activeStudentMshs}
      />
    ));
  };

  // Get cache status for display
  const cacheStatus = useMemo(() => {
    if (!cacheTimestampRef.current) return "Chưa có cache";
    const cacheTime = new Date(cacheTimestampRef.current);
    const timeString = cacheTime.toLocaleTimeString();
    const isStale = isCacheStale();
    
    return `Cache: ${timeString} ${isStale ? "(cũ)" : "(mới)"}`;
  }, [isCacheStale]);

  return (
    <>
      <div className="card">
        <div className="card-body">
          <div className="container">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Tìm kiếm học sinh</h3>
              <div className="text-xs text-gray-500">{cacheStatus}</div>
            </div>
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
                  placeholder="MSHS/Tên Học Sinh"
                  type="text"
                  value={searchValue}
                  onChange={handleSearchInputChange}
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
                    <option value="">-- Tất cả khối --</option>
                    {gradeOptions}
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
                    onChange={handleClassChange}
                    disabled={classesLoading}
                  >
                    <option value="">-- Tất cả lớp --</option>
                    {classOptions}
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
              <div className="w-full flex gap-2">
                <Button
                  className={`${
                    !loading && !initialLoading
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "bg-gray-300 text-gray-400"
                  } flex-1`}
                  disabled={loading || initialLoading}
                  onClick={() => handleSearch(false)}
                >
                  {loading || initialLoading ? (
                    <div className="flex items-center justify-center">
                      <Spinner className="h-4 w-4 mr-2" />
                      <span>Đang tìm...</span>
                    </div>
                  ) : (
                    "Tìm kiếm"
                  )}
                </Button>
                <Button
                  className="bg-green-500 hover:bg-green-600 text-white"
                  disabled={loading || initialLoading}
                  onClick={() => handleSearch(true)}
                  title="Làm mới dữ liệu cache"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Always render the results container with fixed height to prevent layout shifts */}
      <div className="card mt-5" style={{ display: showResults ? 'block' : 'none' }}>
        <div className="card-body">
          <div className="container">
            <div className="my-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">
                  Danh sách học sinh {displayedResults ? `(${displayedResults.length})` : ''}
                </h3>
                {allStudents && (
                  <div className="text-xs text-gray-500">
                    Tổng số học sinh: {allStudents.length}
                  </div>
                )}
              </div>
              
              {/* Danh sách học sinh */}
              <Card className="h-full w-full overflow-hidden">
                <div 
                  className="overflow-auto max-h-[calc(100vh-300px)]" 
                  ref={tableRef}
                >
                  <table className="w-full min-w-max table-auto text-left">
                    <thead>
                      <TableHeader />
                    </thead>
                    <tbody>
                      {renderTableBody()}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(SearchStudent);