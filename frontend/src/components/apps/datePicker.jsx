import React, { useState, useEffect } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  startOfDay,
  endOfDay,
  subDays,
  startOfToday,
  endOfToday,
  subMonths as subMonthsFn,
} from "date-fns";

export default function DateRangeFilter({ onSendDateRange }) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [nextMonth, setNextMonth] = useState(addMonths(new Date(), 1));
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [tempStartDate, setTempStartDate] = useState(null);
  const [tempEndDate, setTempEndDate] = useState(null);
  const [selecting, setSelecting] = useState(false);
  const [selectedQuickFilter, setSelectedQuickFilter] = useState("Tùy Chỉnh");

  const handleQuickFilterSelect = (filter) => {
    setSelectedQuickFilter(filter);
    const today = new Date();

    switch (filter) {
      case "Hôm Nay":
        setTempStartDate(startOfToday());
        setTempEndDate(endOfToday());
        break;
      case "Ngày Hôm Qua":
        const yesterday = subDays(today, 1);
        setTempStartDate(startOfDay(yesterday));
        setTempEndDate(endOfDay(yesterday));
        break;
      case "7 Ngày Qua":
        setTempStartDate(startOfDay(subDays(today, 6)));
        setTempEndDate(endOfToday());
        break;
      case "30 Ngày Qua":
        setTempStartDate(startOfDay(subDays(today, 29)));
        setTempEndDate(endOfToday());
        break;
      case "Tháng Này":
        setTempStartDate(startOfMonth(today));
        setTempEndDate(endOfMonth(today));
        break;
      case "Tháng Trước":
        const lastMonth = subMonthsFn(today, 1);
        setTempStartDate(startOfMonth(lastMonth));
        setTempEndDate(endOfMonth(lastMonth));
        break;
      default:
        break;
    }
  };

  const applyDateRange = () => {
    if (tempStartDate && tempEndDate) {
      setStartDate(tempStartDate);
      setEndDate(tempEndDate);
    }
    setShowCalendar(false);
    onSendDateRange(
      format(tempStartDate, "yyyy-MM-dd"),
      format(tempEndDate, "yyyy-MM-dd")
    );
  };

  useEffect(() => {
    if (showCalendar) {
      setTempStartDate(startDate);
      setTempEndDate(endDate);
    }
  }, [showCalendar]);

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
    setNextMonth(subMonths(nextMonth, 1));
  };

  const nextMonthHandler = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
    setNextMonth(addMonths(nextMonth, 1));
  };

  const handleDateSelect = (date) => {
    if (!selecting) {
      setTempStartDate(startOfDay(date));
      setTempEndDate(endOfDay(date));
      setSelecting(true);
      setSelectedQuickFilter("Custom Range");
    } else {
      if (date < tempStartDate) {
        setTempStartDate(startOfDay(date));
        setTempEndDate(endOfDay(tempStartDate));
      } else {
        setTempEndDate(endOfDay(date));
      }
      setSelecting(false);
    }
  };

  const isDateInRange = (date) => {
    if (!tempStartDate || !tempEndDate) return false;
    return isWithinInterval(date, { start: tempStartDate, end: tempEndDate });
  };

  const isRangeEndpoint = (date) => {
    if (!tempStartDate || !tempEndDate) return false;
    return isSameDay(date, tempStartDate) || isSameDay(date, tempEndDate);
  };

  const generateCalendarCells = (month) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return days.map((day, i) => {
      const isCurrentMonth = isSameMonth(day, month);
      const isSelected = isDateInRange(day);
      const isEndpoint = isRangeEndpoint(day);

      return (
        <div
          key={i}
          onClick={() => isCurrentMonth && handleDateSelect(day)}
          className={`text-center cursor-pointer p-1 rounded ${
            !isCurrentMonth ? "text-gray-300" : isSelected ? "bg-blue-100" : ""
          } ${isEndpoint ? "bg-blue-500 text-white" : ""}`}
        >
          {format(day, "d")}
        </div>
      );
    });
  };

  const renderCalendarMonth = (month) => {
    return (
      <div className="w-1/2 p-2">
        <div className="font-bold text-center mb-2">
          {format(month, "MMM yyyy")}
        </div>
        <div className="grid grid-cols-7 gap-1 text-sm">
          <div className="text-center font-medium">Su</div>
          <div className="text-center font-medium">Mo</div>
          <div className="text-center font-medium">Tu</div>
          <div className="text-center font-medium">We</div>
          <div className="text-center font-medium">Th</div>
          <div className="text-center font-medium">Fr</div>
          <div className="text-center font-medium">Sa</div>
          {generateCalendarCells(month)}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="dropdown">
            <button
              className=" flex items-center space-x-2 border py-1.5 px-2 rounded cursor-pointer"
              onClick={() => setShowCalendar(!showCalendar)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-[18px]"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 2.994v2.25m10.5-2.25v2.25m-14.252 13.5V7.491a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v11.251m-18 0a2.25 2.25 0 0 0 2.25 2.25h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5m-6.75-6h2.25m-9 2.25h4.5m.002-2.25h.005v.006H12v-.006Zm-.001 4.5h.006v.006h-.006v-.005Zm-2.25.001h.005v.006H9.75v-.006Zm-2.25 0h.005v.005h-.006v-.005Zm6.75-2.247h.005v.005h-.005v-.005Zm0 2.247h.006v.006h-.006v-.006Zm2.25-2.248h.006V15H16.5v-.005Z"
                />
              </svg>
              <span>
                {format(startDate, "d/MM/yyyy")} -{" "}
                {format(endDate, "dd/MM/yyyy")}
              </span>
            </button>

            {showCalendar && (
              <div className="mt-1 w-full md:w-auto md:min-w-[600px] border rounded-xl shadow-lg p-4 bg-white z-40 top-16 right-16 absolute">
                <div className="flex">
                  <div className="w-48 border-r pr-2">
                    <div className="font-bold mb-2">Quick Filters</div>
                    <ul>
                      {[
                        "Hôm Nay",
                        "Ngày Hôm Qua",
                        "7 Ngày Qua",
                        "30 Ngày Qua",
                        "Tháng Này",
                        "Tháng Trước",
                        "Tùy Chỉnh",
                      ].map((filter) => (
                        <li
                          key={filter}
                          className={`p-2 cursor-pointer rounded ${
                            selectedQuickFilter === filter
                              ? "bg-blue-500 text-white"
                              : "hover:bg-gray-100"
                          }`}
                          onClick={() => handleQuickFilterSelect(filter)}
                        >
                          {filter}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex-1 pl-4">
                    <div className="flex justify-between items-center mb-4">
                      <button
                        onClick={prevMonth}
                        className="p-1 rounded hover:bg-gray-100"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-[18px]"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 19.5 8.25 12l7.5-7.5"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={nextMonthHandler}
                        className="p-1 rounded hover:bg-gray-100"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-[18px]"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m8.25 4.5 7.5 7.5-7.5 7.5"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="flex">
                      {renderCalendarMonth(currentMonth)}
                      {renderCalendarMonth(nextMonth)}
                    </div>

                    <div className="mt-4 flex justify-end space-x-2">
                      <button
                        className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        onClick={applyDateRange}
                      >
                        Áp Dụng
                      </button>
                      <button
                        className="px-4 py-1 bg-gray-200 rounded hover:bg-gray-300"
                        onClick={() => setShowCalendar(false)}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
