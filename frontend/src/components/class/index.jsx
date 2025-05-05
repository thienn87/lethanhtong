
import { useState } from "react";
import { Spinner } from "../polaris/spinner";
import { Config } from "../config";

export default function ClassListByGradeAccordion() {
  const apiDomain = Config();
  // Predefined grades from 6 to 12
  const predefinedGrades = [
    { grade: "6", name: "Khối 6" },
    { grade: "7", name: "Khối 7" },
    { grade: "8", name: "Khối 8" },
    { grade: "9", name: "Khối 9" },
    { grade: "10", name: "Khối 10" },
    { grade: "11", name: "Khối 11" },
    { grade: "12", name: "Khối 12" }
  ];
  
  const [expandedGrade, setExpandedGrade] = useState(null);
  const [classesByGrade, setClassesByGrade] = useState({});
  const [loadingClasses, setLoadingClasses] = useState({});
  const [toast, setToast] = useState({ status: null, message: "", type: "success" });
  
  // Fetch classes for a grade
  const handleAccordionToggle = async (grade) => {
    if (expandedGrade === grade) {
      setExpandedGrade(null);
      return;
    }
    setExpandedGrade(grade);
    if (!classesByGrade[grade]) {
      setLoadingClasses((prev) => ({ ...prev, [grade]: true }));
      try {
        const res = await fetch(`${apiDomain}/api/classes/by-grade/${grade}`);
        const data = await res.json();
        if (data && data.data) {
          setClassesByGrade((prev) => ({ ...prev, [grade]: data.data }));
        } else {
          setClassesByGrade((prev) => ({ ...prev, [grade]: [] }));
        }
      } catch (e) {
        setToast({ status: true, message: `Không thể tải lớp cho khối ${grade}.`, type: "error" });
      } finally {
        setLoadingClasses((prev) => ({ ...prev, [grade]: false }));
      }
    }
  };

    // Delete class handler (updated to use GET /classes/delete?id=...)
    const handleDeleteClass = async (classItem, gradeValue) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa lớp này?")) return;
    
        try {
        const res = await fetch(`${apiDomain}/api/classes/delete?id=${classItem.id}`, {
            method: "GET",
        });
        const data = await res.json();
        if (res.ok && (data.status || data.success)) {
            setToast({ status: true, message: "Xóa lớp thành công!", type: "success" });
            // Remove from UI
            setClassesByGrade((prev) => ({
            ...prev,
            [gradeValue]: prev[gradeValue].filter((cls) => cls.id !== classItem.id),
            }));
        } else {
            setToast({ status: true, message: data.message || "Xóa lớp thất bại.", type: "error" });
        }
        } catch (e) {
        setToast({ status: true, message: "Lỗi khi xóa lớp.", type: "error" });
        }
    };

  // Get background color for grade
  const getGradeColor = (grade) => {
    const colors = {
      "6": { bg: "bg-indigo-100", text: "text-indigo-800", hover: "hover:bg-indigo-200", border: "border-indigo-300" },
      "7": { bg: "bg-blue-100", text: "text-blue-800", hover: "hover:bg-blue-200", border: "border-blue-300" },
      "8": { bg: "bg-cyan-100", text: "text-cyan-800", hover: "hover:bg-cyan-200", border: "border-cyan-300" },
      "9": { bg: "bg-teal-100", text: "text-teal-800", hover: "hover:bg-teal-200", border: "border-teal-300" },
      "10": { bg: "bg-green-100", text: "text-green-800", hover: "hover:bg-green-200", border: "border-green-300" },
      "11": { bg: "bg-amber-100", text: "text-amber-800", hover: "hover:bg-amber-200", border: "border-amber-300" },
      "12": { bg: "bg-orange-100", text: "text-orange-800", hover: "hover:bg-orange-200", border: "border-orange-300" }
    };
    return colors[grade] || { bg: "bg-gray-100", text: "text-gray-800", hover: "hover:bg-gray-200", border: "border-gray-300" };
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        Danh sách lớp
      </h2>
      
      <div className="space-y-6">
        {predefinedGrades.map((gradeObj) => {
          const colorScheme = getGradeColor(gradeObj.grade);
          return (
            <div key={gradeObj.grade} className="rounded-xl shadow-md overflow-hidden border border-gray-200">
              <button
                className={`w-full flex justify-between items-center px-6 py-4 ${colorScheme.bg} ${colorScheme.hover} transition-colors duration-200 focus:outline-none`}
                onClick={() => handleAccordionToggle(gradeObj.grade)}
              >
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorScheme.text} bg-white shadow-sm mr-3`}>
                    {gradeObj.grade}
                  </div>
                  <span className={`font-bold ${colorScheme.text} text-lg`}>{gradeObj.name}</span>
                </div>
                <div className={`${colorScheme.text} transition-transform duration-200 ${expandedGrade === gradeObj.grade ? "rotate-180" : ""}`}>
                  ▼
                </div>
              </button>
              
              {expandedGrade === gradeObj.grade && (
                <div className="bg-white">
                  {loadingClasses[gradeObj.grade] ? (
                    <div className="flex justify-center items-center h-24">
                      <Spinner />
                    </div>
                  ) : classesByGrade[gradeObj.grade]?.length > 0 ? (
                    <div className="p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {classesByGrade[gradeObj.grade].map((classItem) => (
                          <div 
                            key={classItem.id} 
                            className={`rounded-lg border ${colorScheme.border} bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-200`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold text-gray-800">{classItem.name}</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                  Khối {classItem.grade}
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClass(classItem, gradeObj.grade);
                                }}
                                className="text-gray-400 hover:text-red-500 transition-colors duration-200 p-1"
                                title="Xóa lớp"
                              >
                                🗑️
                              </button>
                            </div>
                            
                            {classItem.teacher && (
                              <div className="mt-3 flex items-center text-sm text-gray-600">
                                <span className="mr-1">👨‍🏫</span>
                                <span>{classItem.teacher}</span>
                              </div>
                            )}
                            
                            {classItem.student_count !== undefined && (
                              <div className="mt-2 flex items-center text-sm text-gray-600">
                                <span className="mr-1">👥</span>
                                <span>{classItem.student_count} học sinh</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-gray-500">
                      <span className="text-3xl mb-2">ℹ️</span>
                      <p>Không có lớp nào trong khối này.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
