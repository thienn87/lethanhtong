import { useState, useEffect, useCallback } from 'react';
import "react-datepicker/dist/react-datepicker.css";
import { Toast } from "../polaris/toast";
import { Config } from "../config";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Typography,
  Button,
  IconButton,
  Input,
  Spinner,
  Badge,
  Chip
} from "@material-tailwind/react";
import { 
  MagnifyingGlassIcon, 
  ArrowLeftIcon, 
  ArrowRightIcon,
  CalendarIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";

function TransactionList() {
  const domain = Config();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePrev = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNext = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
    setRefreshKey(prev => prev + 1); // Force refresh
  };

  const handlePerPageChange = (e) => {
    setPerPage(parseInt(e.target.value));
    setPage(1); // Reset to first page when changing items per page
  };

  const refreshData = () => {
    setRefreshKey(prev => prev + 1);
  };

  const getTransactionData = useCallback(async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: page,
        per_page: perPage
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      if (dateFilter) {
        params.append('date', dateFilter);
      }

      const response = await fetch(`${domain}/api/transaction?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transaction data');
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        setTransactions(data.data);
        setTotalPages(data.pagination.last_page);
        setTotalItems(data.pagination.total);
      } else {
        throw new Error(data.message || 'Error fetching transactions');
      }
    } catch (error) {
      console.error('Error:', error.message);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, searchTerm, dateFilter, refreshKey, domain]);

  useEffect(() => {
    getTransactionData();
  }, [getTransactionData]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    // If it's just a month number, return "Tháng X"
    if (!isNaN(dateString) && dateString.length <= 2) {
      return `Tháng ${dateString}`;
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Return original if invalid
      }
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(date);
    } catch (e) {
      return dateString; // Return original on error
    }
  };

  // Get transaction status color
  const getStatusColor = (amount) => {
    if (amount > 0) return "green";
    if (amount < 0) return "red";
    return "blue-gray";
  };

  return (
    <div className="container mx-auto px-4 py-4">
      <Card className="w-full shadow-md mb-6">
        <CardHeader floated={false} shadow={false} className="rounded-none px-4 py-5 bg-white border-b">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <Typography variant="h5" color="blue-gray" className="font-bold">
                Danh sách giao dịch
              </Typography>
              <Typography color="gray" className="mt-1 font-normal">
                Xem và tìm kiếm các giao dịch
              </Typography>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <div className="relative flex w-full max-w-[24rem]">
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm học sinh, mã số..."
                    className="pr-20"
                    containerProps={{
                      className: "min-w-0",
                    }}
                  />
                  <Button
                    size="sm"
                    type="submit"
                    className="!absolute right-1 top-1 rounded"
                  >
                    <MagnifyingGlassIcon className="h-4 w-4" />
                  </Button>
                </div>
              </form>
              <div className="relative">
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="!border !border-gray-300 bg-white text-gray-900 shadow-lg shadow-gray-900/5 ring-4 ring-transparent placeholder:text-gray-500 focus:!border-gray-900 focus:!border-t-gray-900 focus:ring-gray-900/10"
                  labelProps={{
                    className: "hidden",
                  }}
                  containerProps={{ className: "min-w-[100px]" }}
                />
                <CalendarIcon className="!absolute right-3 top-2.5 h-5 w-5 text-gray-500" />
              </div>
              <Button 
                className="flex items-center gap-2 bg-indigo-500"
                onClick={refreshData}
              >
                <ArrowPathIcon strokeWidth={2} className="h-4 w-4" />
                Làm mới
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody className="overflow-auto px-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max table-auto text-left">
              <thead>
                <tr>
                  <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-bold leading-none opacity-70"
                    >
                      Trạng thái
                    </Typography>
                  </th>
                  <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-bold leading-none opacity-70"
                    >
                      Học sinh
                    </Typography>
                  </th>
                  <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-bold leading-none opacity-70"
                    >
                      Mã số
                    </Typography>
                  </th>
                  <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-bold leading-none opacity-70"
                    >
                      Ngày giao dịch
                    </Typography>
                  </th>
                  <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-bold leading-none opacity-70"
                    >
                      Ghi chú
                    </Typography>
                  </th>
                  <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-bold leading-none opacity-70"
                    >
                      Giá trị giao dịch
                    </Typography>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center">
                      <div className="flex justify-center items-center py-6">
                        <Spinner className="h-8 w-8 text-indigo-500" />
                      </div>
                    </td>
                  </tr>
                ) : transactions && transactions.length > 0 ? (
                  transactions.map((item, index) => {
                    const isLast = index === transactions.length - 1;
                    const classes = isLast ? "p-4" : "p-4 border-b border-blue-gray-50";
                    const statusColor = getStatusColor(item.amount_paid);

                    return (
                      <tr key={item.id} className="hover:bg-blue-gray-50/30 transition-colors">
                        <td className={classes}>
                          <div className="flex items-center justify-center">
                            <Badge color={statusColor} />
                          </div>
                        </td>
                        <td className={classes}>
                          <Typography variant="small" color="blue-gray" className="font-medium">
                            {item.student_name}
                          </Typography>
                        </td>
                        <td className={classes}>
                          <Typography variant="small" color="blue-gray" className="font-medium">
                            {item.mshs}
                          </Typography>
                        </td>
                        <td className={classes}>
                          <Typography variant="small" color="blue-gray" className="font-medium">
                            {formatDate(item.created_at)}
                          </Typography>
                        </td>
                        <td className={classes}>
                          <Typography variant="small" color="blue-gray" className="font-medium">
                            {item.note || "--"}
                          </Typography>
                        </td>
                        <td className={classes}>
                          <Chip
                            value={formatCurrency(item.amount_paid)}
                            color={statusColor}
                            variant="ghost"
                            size="sm"
                            className="font-medium"
                          />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-4 text-center">
                      <Typography color="blue-gray">Không có dữ liệu giao dịch</Typography>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
        <CardFooter className="flex items-center justify-between border-t border-blue-gray-50 p-4">
          <div className="flex items-center gap-3">
            <Typography variant="small" color="blue-gray" className="font-normal">
              Hiển thị
            </Typography>
            <select
              className="border border-blue-gray-200 rounded-md px-2 py-1 focus:outline-none focus:border-indigo-500"
              value={perPage}
              onChange={handlePerPageChange}
            >
              {[5, 10, 20, 50].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <Typography variant="small" color="blue-gray" className="font-normal">
              trên tổng số {totalItems} giao dịch
            </Typography>
          </div>
          <div className="flex items-center gap-2">
            <IconButton
              variant="outlined"
              color="blue-gray"
              size="sm"
              onClick={handlePrev}
              disabled={page === 1}
            >
              <ArrowLeftIcon strokeWidth={2} className="h-4 w-4" />
            </IconButton>
            <Typography color="blue-gray" className="font-normal">
              Trang <strong className="text-blue-gray-900">{page}</strong> trên{" "}
              <strong className="text-blue-gray-900">{totalPages}</strong>
            </Typography>
            <IconButton
              variant="outlined"
              color="blue-gray"
              size="sm"
              onClick={handleNext}
              disabled={page === totalPages}
            >
              <ArrowRightIcon strokeWidth={2} className="h-4 w-4" />
            </IconButton>
          </div>
        </CardFooter>
      </Card>
      <Toast status={loading}>Đang tải dữ liệu</Toast>
    </div>
  );
}

export default TransactionList;