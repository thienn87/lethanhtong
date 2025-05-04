import React, { useState, useEffect } from "react";
import SearchStudent from "./apps/searchStudent";
import { Config } from "./config";
import {
  Card,
  CardBody,
  Typography,
  Button,
  Spinner
} from "@material-tailwind/react";
import {
  UserGroupIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ArrowTrendingUpIcon,
  QuestionMarkCircleIcon
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

function Homepage() {
  const domain = Config();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${domain}/api/dashboard/stats`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data.data);
        } else {
          // If API fails, use fallback data
          setStats({
            totalStudents: "...",
            totalClasses: "...",
            totalRevenue: "...",
            outstandingDebt: "...",
            recentTransactions: []
          });
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        // Use fallback data on error
        setStats({
          totalStudents: "...",
          totalClasses: "...",
          totalRevenue: "...",
          outstandingDebt: "...",
          recentTransactions: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [domain]);

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "0";
    return parseFloat(amount).toLocaleString("vi-VN");
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <Typography variant="h3" color="blue-gray" className="mb-2">
          Quản lý học sinh
        </Typography>
        <Typography color="gray" className="font-normal">
          Hệ thống quản lý học phí và thông tin học sinh
        </Typography>
      </div>

      {/* Search Section */}
      <SearchStudent navigation={true} />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 mt-10">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="h6" color="blue-gray" className="mb-1">
                  Tổng số học sinh
                </Typography>
                <Typography variant="h4" color="blue-gray">
                  {loading ? <Spinner className="h-6 w-6" /> : stats?.totalStudents || 0}
                </Typography>
              </div>
              <div className="rounded-full bg-blue-50 p-3">
                <UserGroupIcon className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <Link to="/hoc-sinh">
              <Button variant="text" className="flex items-center gap-2 p-0 mt-4">
                Xem danh sách
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"
                  />
                </svg>
              </Button>
            </Link>
          </CardBody>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="h6" color="blue-gray" className="mb-1">
                  Dư nợ học phí
                </Typography>
                <Typography variant="h4" color="blue-gray">
                  {loading ? <Spinner className="h-6 w-6" /> : formatCurrency(stats?.outstandingDebt || 0)}
                </Typography>
              </div>
              <div className="rounded-full bg-red-50 p-3">
                <DocumentTextIcon className="h-6 w-6 text-red-500" />
              </div>
            </div>
            <Link to="/thong-ke-cong-no">
              <Button variant="text" className="flex items-center gap-2 p-0 mt-4">
                Xem công nợ
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"
                  />
                </svg>
              </Button>
            </Link>
          </CardBody>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="h6" color="blue-gray" className="mb-1">
                  Tổng số lớp
                </Typography>
                <Typography variant="h4" color="blue-gray">
                  {loading ? <Spinner className="h-6 w-6" /> : stats?.totalClasses || 0}
                </Typography>
              </div>
              <div className="rounded-full bg-purple-50 p-3">
                <AcademicCapIcon className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <Link to="/lop">
              <Button variant="text" className="flex items-center gap-2 p-0 mt-4">
                Xem lớp học
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"
                  />
                </svg>
              </Button>
            </Link>
          </CardBody>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <Typography variant="h5" color="blue-gray" className="mb-4">
          Thao tác nhanh
        </Typography>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/thu-hoc-phi">
            <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-r from-blue-50 to-blue-100">
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-blue-500 p-2">
                    <CurrencyDollarIcon className="h-5 w-5 text-white" />
                  </div>
                  <Typography variant="h6" color="blue-gray">
                    Thu học phí
                  </Typography>
                </div>
              </CardBody>
            </Card>
          </Link>

          <Link to="/hoc-sinh/them-moi">
            <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-r from-green-50 to-green-100">
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-green-500 p-2">
                    <UserGroupIcon className="h-5 w-5 text-white" />
                  </div>
                  <Typography variant="h6" color="blue-gray">
                    Thêm học sinh
                  </Typography>
                </div>
              </CardBody>
            </Card>
          </Link>

          <Link to="/quan-ly-du-no">
            <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-r from-purple-50 to-purple-100">
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-purple-500 p-2">
                    <ArrowTrendingUpIcon className="h-5 w-5 text-white" />
                  </div>
                  <Typography variant="h6" color="blue-gray">
                    Quản lý dư nợ
                  </Typography>
                </div>
              </CardBody>
            </Card>
          </Link>

          <Link to="/user-guide">
            <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-r from-orange-50 to-orange-100">
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-orange-500 p-2">
                    <QuestionMarkCircleIcon className="h-5 w-5 text-white" />
                  </div>
                  <Typography variant="h6" color="blue-gray">
                    Hướng dẫn sử dụng
                  </Typography>
                </div>
              </CardBody>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Homepage;