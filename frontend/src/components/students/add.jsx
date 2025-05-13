import React, { useState, useEffect, Suspense, lazy, useMemo } from "react";
import { useForm } from 'react-hook-form';
import { Config } from "../config";

// Icons
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { ExclamationCircleIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

// Lazy load the TransactionStudentModal component
const TransactionStudentModal = lazy(() => import("../apps/transactionStudentModal"));

function CreateStudent() {
    const domain = Config();
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [allClasses, setAllClasses] = useState([]);
    const [classesLoading, setClassesLoading] = useState(false);
    
    // State for the newly created student
    const [createdStudent, setCreatedStudent] = useState(null);
    
    // State for transaction modal
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    
    // Custom date inputs state
    const [birthDateInput, setBirthDateInput] = useState('');
    const [dayInInput, setDayInInput] = useState('');
    const [dayOutInput, setDayOutInput] = useState('');
    
    const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm({
        defaultValues: {
            sur_name: '',
            name: '',
            day_of_birth: '',
            grade: '6',
            class_id: '',
            gender: 'male',
            discount: '0',
            parent_name: '',
            address: '',
            phone_number: '',
            day_in: '',
            day_out: '',
            stay_in: false,
            leave_school: false,
            fail_grade: false
        }
    });
    
    // Watch the grade field to filter classes
    const selectedGrade = watch('grade');
    
    // Filter classes based on selected grade
    const filteredClasses = useMemo(() => {
        return allClasses.filter(c => c.grade === selectedGrade);
    }, [allClasses, selectedGrade]);

    // Initialize date inputs with current date in DD/MM/YYYY format
    useEffect(() => {
        const today = new Date();
        const formattedDate = formatDateForDisplay(today);
        setBirthDateInput(formattedDate);
        setDayInInput(formattedDate);
        
        // Set the hidden form values
        setValue('day_of_birth', formatDateForInput(today));
        setValue('day_in', formatDateForInput(today));
    }, [setValue]);

    // Format date as YYYY-MM-DD for input fields (ISO format for API)
    function formatDateForInput(date) {
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d.getTime())) return ''; // Invalid date
        
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${d.getFullYear()}-${month}-${day}`;
    }

    // Format date as DD/MM/YYYY for display
    function formatDateForDisplay(date) {
        if (!date) return '';
        
        let day, month, year;
        
        if (date instanceof Date) {
            day = date.getDate().toString().padStart(2, '0');
            month = (date.getMonth() + 1).toString().padStart(2, '0');
            year = date.getFullYear();
        } else if (typeof date === 'string') {
            // Handle ISO format (YYYY-MM-DD)
            const parts = date.split('-');
            if (parts.length === 3) {
                year = parts[0];
                month = parts[1];
                day = parts[2];
            } else {
                return '';
            }
        } else {
            return '';
        }
        
        return `${day}/${month}/${year}`;
    }
    
    // Convert DD/MM/YYYY to YYYY-MM-DD
    function parseDisplayDate(displayDate) {
        if (!displayDate) return '';
        
        // Check if it matches DD/MM/YYYY format
        const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
        const match = displayDate.match(regex);
        
        if (match) {
            const day = match[1].padStart(2, '0');
            const month = match[2].padStart(2, '0');
            const year = match[3];
            
            return `${year}-${month}-${day}`;
        }
        
        return '';
    }
    
    // Apply date mask (DD/MM/YYYY)
    const applyDateMask = (value) => {
        // Remove all non-digits
        const digits = value.replace(/\D/g, '');
        
        // Apply mask based on the number of digits
        if (digits.length <= 2) {
            return digits;
        } else if (digits.length <= 4) {
            return `${digits.substring(0, 2)}/${digits.substring(2)}`;
        } else {
            return `${digits.substring(0, 2)}/${digits.substring(2, 4)}/${digits.substring(4, 8)}`;
        }
    };
    
    // Handle date input changes with masking
    const handleDateChange = (e, setDisplayFn, formField) => {
        const inputValue = e.target.value;
        
        // Apply mask
        const maskedValue = applyDateMask(inputValue);
        setDisplayFn(maskedValue);
        
        // Only update the form value if we have a complete date
        const isoDate = parseDisplayDate(maskedValue);
        if (isoDate) {
            setValue(formField, isoDate);
        } else {
            setValue(formField, '');
        }
    };
    
    // Handle date input key press to enforce numeric input
    const handleDateKeyPress = (e) => {
        // Allow only digits, backspace, delete, tab, arrows
        const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
        const isDigit = /\d/.test(e.key);
        
        if (!isDigit && !allowedKeys.includes(e.key)) {
            e.preventDefault();
        }
    };

    // Reset class selection when grade changes
    useEffect(() => {
        setValue('class_id', '');
    }, [selectedGrade, setValue]);

    const listClass = async () => {
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

    const onSubmit = async (data) => {
        // Prevent submitting if already loading
        if (loading) return;
        
        setLoading(true);
        setIsSuccess(false);
        setError(null);
        setCreatedStudent(null);
        
        // Format dates for API
        const formattedData = {
            ...data,
            day_of_birth: data.day_of_birth ? new Date(data.day_of_birth) : null,
            day_in: data.day_in ? new Date(data.day_in) : null,
            day_out: data.day_out ? new Date(data.day_out) : null,
            stay_in: data.stay_in ? 'true' : 'false',
            leave_school: data.leave_school ? 'true' : 'false',
            fail_grade: data.fail_grade ? 'true' : 'false'
        };
        
        try {
            const response = await fetch(`${domain}/api/students/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formattedData),
            });

            const responseData = await response.json();
            if (response.ok && responseData.status === "success") {
                setIsSuccess(true);
                
                // Store the created student data
                const newStudent = {
                    mshs: responseData.mshs,
                    name: `${data.sur_name} ${data.name}`,
                    grade: data.grade,
                    class: data.class_id
                };
                
                setCreatedStudent(newStudent);
                
                // Reset form after successful submission
                reset();
                
                // Reset date inputs
                const today = new Date();
                const formattedDate = formatDateForDisplay(today);
                setBirthDateInput(formattedDate);
                setDayInInput(formattedDate);
                setDayOutInput('');
                
                // Set default values again
                setValue('grade', '6');
                setValue('gender', 'male');
                setValue('discount', '0');
                setValue('day_of_birth', formatDateForInput(today));
                setValue('day_in', formatDateForInput(today));
                
                window.scrollTo(0, 0);
                
                // Don't automatically hide success message if we have a student created
                // This allows time for payment processing
            } else {
                throw new Error(responseData.message || 'Error creating student');
            }
        } catch (error) {
            console.error('Error:', error.message);
            setError('Không thể tạo học sinh. Vui lòng kiểm tra lại thông tin và thử lại.');
        } finally {
            setLoading(false);
        }
    };

    // Inside the CreateStudent component
    const handleOpenTransactionModal = () => {
        if (!createdStudent || !createdStudent.mshs) {
            console.error("No student data available");
            return;
        }
        
        // We already have the basic student data in createdStudent
        // Let's enhance it with additional fields needed by the modal
        const enhancedStudentData = {
            ...createdStudent,
            // Make sure all required fields are present
            sur_name: createdStudent.name.split(' ').slice(0, -1).join(' '), // Extract surname from full name
            full_name: createdStudent.name,
            // Use the form's watch function to get the latest values
            gender: watch('gender'),
            day_of_birth: watch('day_of_birth'),
            address: watch('address'),
            phone_number: watch('phone_number'),
            parent_name: watch('parent_name')
        };
        
        setCreatedStudent(enhancedStudentData);
        setShowTransactionModal(true);
    };

    // Handle closing the transaction modal
    const handleCloseTransactionModal = () => {
        setShowTransactionModal(false);
    };

    useEffect(() => {
        listClass();
    }, []);
    
    // Validate date input
    const isValidDate = (dateString) => {
        if (!dateString) return true; // Empty is valid (for optional dates)
        
        // Check format
        const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const match = dateString.match(regex);
        if (!match) return false;
        
        // Extract parts
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);
        
        // Check ranges
        if (month < 1 || month > 12) return false;
        if (day < 1 || day > 31) return false;
        
        // Check specific month lengths
        if (month === 2) {
            // February - check for leap year
            const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
            if (day > (isLeapYear ? 29 : 28)) return false;
        } else if ([4, 6, 9, 11].includes(month) && day > 30) {
            // April, June, September, November have 30 days
            return false;
        }
        
        return true;
    };
    
    return (
        <div className="max-w-5xl mx-auto">
            {isSuccess && (
                <div className="bg-green-50 border-l-4 border-green-500 rounded-lg mb-6 shadow-sm overflow-hidden">
                    <div className="p-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <CheckCircleIcon className="h-6 w-6 text-green-500" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-lg font-medium text-green-800">Tạo mới học sinh thành công!</h3>
                            </div>
                        </div>
                        
                        {createdStudent && (
                            <div className="mt-3 bg-white p-4 rounded-md border border-green-100">
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-600">MSHS:</span> 
                                        <span className="ml-2 font-semibold">{createdStudent.mshs}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-600">Họ tên:</span> 
                                        <span className="ml-2">{createdStudent.name}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-600">Lớp:</span> 
                                        <span className="ml-2">{createdStudent.grade}{createdStudent.class}</span>
                                    </div>
                                </div>
                                
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={handleOpenTransactionModal}
                                        className="inline-flex items-center px-4 py-2 bg-violet-700 text-white rounded-md hover:bg-violet-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transition-colors text-sm"
                                    >
                                        <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                                        Thu học phí
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center shadow-sm">
                    <ExclamationCircleIcon className="h-5 w-5 mr-2 text-red-500" />
                    <span className="font-medium">{error}</span>
                </div>
            )}
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-violet-800 to-violet-600 px-6 py-4">
                    <h2 className="text-xl font-bold text-white">Thêm Mới Học Sinh</h2>
                </div>
                
                <form onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit(onSubmit)(e);
                    }} className="p-6">
                    <div className="space-y-8">
                        {/* Thông tin cơ bản */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Thông tin cơ bản</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Họ và tên đệm <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        className={`w-full px-3 py-2 border ${errors.sur_name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-violet-500'} rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition`}
                                        {...register('sur_name', { required: 'Vui lòng nhập họ và tên đệm' })}
                                        placeholder="Nhập họ và tên đệm"
                                        type="text"
                                    />
                                    {errors.sur_name && <p className="mt-1 text-sm text-red-600">{errors.sur_name.message}</p>}
                                </div>
                                
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tên <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        className={`w-full px-3 py-2 border ${errors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-violet-500'} rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition`}
                                        {...register('name', { required: 'Vui lòng nhập tên' })}
                                        placeholder="Nhập tên"
                                        type="text"
                                    />
                                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                                </div>
                                
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ngày sinh
                                    </label>
                                    <input
                                        className={`w-full px-3 py-2 border ${!isValidDate(birthDateInput) ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-violet-500'} rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition`}
                                        value={birthDateInput}
                                        onChange={(e) => handleDateChange(e, setBirthDateInput, 'day_of_birth')}
                                        onKeyDown={handleDateKeyPress}
                                        placeholder="DD/MM/YYYY"
                                        type="text"
                                        maxLength={10}
                                    />
                                    {/* Hidden input for the actual form value */}
                                    <input type="hidden" {...register('day_of_birth')} />
                                    {!isValidDate(birthDateInput) && birthDateInput && (
                                        <p className="mt-1 text-sm text-red-600">Ngày không hợp lệ</p>
                                    )}
                                    <p className="mt-1 text-xs text-gray-500">Định dạng: DD/MM/YYYY</p>
                                </div>
                                
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Giới tính
                                    </label>
                                    <select 
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition appearance-none bg-white"
                                        {...register('gender')}
                                    >
                                        <option value="male">Nam</option>
                                        <option value="female">Nữ</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        {/* Thông tin học tập */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Thông tin học tập</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Khối
                                    </label>
                                    <select 
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition appearance-none bg-white" 
                                        {...register('grade')}
                                    >
                                        {[6, 7, 8, 9, 10, 11, 12].map(grade => (
                                            <option key={grade} value={grade.toString()}>Khối {grade}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Lớp <span className="text-red-500">*</span>
                                    </label>
                                    <select 
                                        className={`w-full px-3 py-2 border ${errors.class_id ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-violet-500'} rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition appearance-none bg-white`}
                                        {...register('class_id', { required: 'Vui lòng chọn lớp' })}
                                    >
                                        <option value="">-- Chọn lớp --</option>
                                        {classesLoading ? (
                                            <option disabled>Đang tải...</option>
                                        ) : filteredClasses.length > 0 ? (
                                            filteredClasses.map((c, index) => (
                                                <option key={index} value={c.name}>
                                                    {c.name}
                                                </option>
                                            ))
                                        ) : (
                                            <option disabled>Không có lớp cho khối {selectedGrade}</option>
                                        )}
                                    </select>
                                    {errors.class_id && <p className="mt-1 text-sm text-red-600">{errors.class_id.message}</p>}
                                </div>
                                
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Miễn giảm học phí (%)
                                    </label>
                                    <input
                                        className={`w-full px-3 py-2 border ${errors.discount ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-violet-500'} rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition`}
                                        {...register('discount', {
                                            required: 'Vui lòng nhập giảm học phí, nếu không giảm thì nhập 0',
                                            validate: value => (value >= 0 && value <= 100) || 'Giá trị phải nằm trong khoảng từ 0 đến 100'
                                        })}
                                        placeholder="Nhập % giảm học phí"
                                        type="number"
                                    />
                                    {errors.discount && <p className="mt-1 text-sm text-red-600">{errors.discount.message}</p>}
                                </div>
                                
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ngày vào trường
                                    </label>
                                    <input
                                        className={`w-full px-3 py-2 border ${!isValidDate(dayInInput) ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-violet-500'} rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition`}
                                        value={dayInInput}
                                        onChange={(e) => handleDateChange(e, setDayInInput, 'day_in')}
                                        onKeyDown={handleDateKeyPress}
                                        placeholder="DD/MM/YYYY"
                                        type="text"
                                        maxLength={10}
                                    />
                                    {/* Hidden input for the actual form value */}
                                    <input type="hidden" {...register('day_in')} />
                                    {!isValidDate(dayInInput) && dayInInput && (
                                        <p className="mt-1 text-sm text-red-600">Ngày không hợp lệ</p>
                                    )}
                                    <p className="mt-1 text-xs text-gray-500">Định dạng: DD/MM/YYYY</p>
                                </div>
                                
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ngày ra trường
                                    </label>
                                    <input
                                        className={`w-full px-3 py-2 border ${!isValidDate(dayOutInput) ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-violet-500'} rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition`}
                                        value={dayOutInput}
                                        onChange={(e) => handleDateChange(e, setDayOutInput, 'day_out')}
                                        onKeyDown={handleDateKeyPress}
                                        placeholder="DD/MM/YYYY"
                                        type="text"
                                        maxLength={10}
                                    />
                                    {/* Hidden input for the actual form value */}
                                    <input type="hidden" {...register('day_out')} />
                                    {!isValidDate(dayOutInput) && dayOutInput && (
                                        <p className="mt-1 text-sm text-red-600">Ngày không hợp lệ</p>
                                    )}
                                    <p className="mt-1 text-xs text-gray-500">Để trống nếu chưa ra trường</p>
                                </div>
                                
                                <div className="form-group flex items-center space-x-6">
                                    <div className="flex items-center">
                                        <input
                                            id="stay_in"
                                            className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                                            type="checkbox"
                                            {...register('stay_in')}
                                        />
                                        <label htmlFor="stay_in" className="ml-2 text-sm font-medium text-gray-700">
                                            Nội trú
                                        </label>
                                    </div>
                                    
                                    <div className="flex items-center">
                                        <input
                                            id="leave_school"
                                            className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                                            type="checkbox"
                                            {...register('leave_school')}
                                        />
                                        <label htmlFor="leave_school" className="ml-2 text-sm font-medium text-gray-700">
                                            Nghỉ học
                                        </label>
                                    </div>
                                    
                                    <div className="flex items-center">
                                        <input
                                            id="fail_grade"
                                            className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                                            type="checkbox"
                                            {...register('fail_grade')}
                                        />
                                        <label htmlFor="fail_grade" className="ml-2 text-sm font-medium text-gray-700">
                                            Lưu ban
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Thông tin liên hệ */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Thông tin liên hệ</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Họ tên phụ huynh <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        className={`w-full px-3 py-2 border ${errors.parent_name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-violet-500'} rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition`}
                                        {...register('parent_name', { required: 'Vui lòng nhập tên phụ huynh' })}
                                        placeholder="Nhập họ tên phụ huynh"
                                        type="text"
                                    />
                                    {errors.parent_name && <p className="mt-1 text-sm text-red-600">{errors.parent_name.message}</p>}
                                </div>
                                
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Số điện thoại <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        className={`w-full px-3 py-2 border ${errors.phone_number ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-violet-500'} rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition`}
                                        {...register('phone_number', { 
                                            required: 'Vui lòng nhập số điện thoại',
                                        })}
                                        placeholder="Nhập số điện thoại"
                                        type="tel"
                                    />
                                    {errors.phone_number && <p className="mt-1 text-sm text-red-600">{errors.phone_number.message}</p>}
                                </div>
                                
                                <div className="form-group md:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Địa chỉ <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        className={`w-full px-3 py-2 border ${errors.address ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-violet-500'} rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition`}
                                        {...register('address', { required: 'Vui lòng nhập địa chỉ' })}
                                        placeholder="Nhập địa chỉ"
                                        type="text"
                                    />
                                    {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-8 pt-5 border-t border-gray-200">
                        <div className="flex justify-end space-x-3">
                                                        <button
                                type="button"
                                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
                                onClick={() => reset()}
                            >
                                Làm mới
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-violet-700 hover:bg-violet-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 flex items-center disabled:bg-violet-300 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Đang xử lý...
                                    </>
                                ) : (
                                    'Tạo học sinh'
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
            
            {/* Transaction Modal */}
            {showTransactionModal && createdStudent && (
                <Suspense fallback={
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-700 mx-auto"></div>
                        <p className="text-center mt-4 text-gray-700">Đang tải...</p>
                    </div>
                    </div>
                }>
                    <TransactionStudentModal
                    isOpen={showTransactionModal}
                    onClose={handleCloseTransactionModal}
                    mshs={createdStudent.mshs}
                    studentName={createdStudent.name}
                    studentClass={`${createdStudent.grade}${createdStudent.class}`}
                    studentData={createdStudent}
                    size="xl"
                    />
                </Suspense>
                )}
        </div>
    );
}

export default CreateStudent;