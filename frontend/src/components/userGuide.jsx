import React, { useState } from "react";
import {
  Accordion,
  AccordionHeader,
  AccordionBody,
  Card,
  CardHeader,
  CardBody,
  Typography,
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel,
  Breadcrumbs
} from "@material-tailwind/react";
import {
  HomeIcon,
  UserIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  ChevronRightIcon,
  ChevronDownIcon
} from "@heroicons/react/24/outline";

function UserGuide() {
  const [open, setOpen] = useState(1);
  const [activeTab, setActiveTab] = useState("dashboard");

  const handleOpen = (value) => {
    setOpen(open === value ? 0 : value);
  };

  const data = [
    {
      label: "Tổng quan",
      value: "dashboard",
      icon: HomeIcon,
      content: (
        <div className="space-y-4">
          <Typography variant="h4" color="blue-gray" className="mb-2">
            Tổng quan hệ thống
          </Typography>
          <Typography>
            Hệ thống quản lý học phí được thiết kế để giúp nhà trường quản lý hiệu quả việc thu học phí, theo dõi dư nợ và quản lý thông tin học sinh. Giao diện trực quan và dễ sử dụng giúp người dùng nhanh chóng làm quen và thao tác hiệu quả.
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Card className="shadow-sm">
              <CardBody>
                <Typography variant="h6" color="blue-gray" className="mb-2">
                  Các chức năng chính
                </Typography>
                <ul className="list-disc list-inside space-y-2">
                  <li>Quản lý thông tin học sinh</li>
                  <li>Thu học phí và in biên lai</li>
                  <li>Theo dõi dư nợ học phí</li>
                  <li>Quản lý năm học</li>
                  <li>Báo cáo thống kê</li>
                </ul>
              </CardBody>
            </Card>
            <Card className="shadow-sm">
              <CardBody>
                <Typography variant="h6" color="blue-gray" className="mb-2">
                  Lợi ích
                </Typography>
                <ul className="list-disc list-inside space-y-2">
                  <li>Tiết kiệm thời gian quản lý</li>
                  <li>Giảm thiểu sai sót trong thu học phí</li>
                  <li>Dễ dàng theo dõi tình hình tài chính</li>
                  <li>Tự động hóa các báo cáo</li>
                  <li>Dữ liệu được lưu trữ an toàn</li>
                </ul>
              </CardBody>
            </Card>
          </div>
        </div>
      )
    },
    {
      label: "Quản lý học sinh",
      value: "students",
      icon: UserIcon,
      content: (
        <div className="space-y-4">
          <Typography variant="h4" color="blue-gray" className="mb-2">
            Quản lý học sinh
          </Typography>
          <Typography>
            Mô-đun quản lý học sinh cho phép bạn thêm, sửa, xóa và tìm kiếm thông tin học sinh. Bạn có thể quản lý thông tin cá nhân, lớp học và các thông tin liên quan đến học phí của từng học sinh.
          </Typography>
          
          <Accordion open={open === 1}>
            <AccordionHeader onClick={() => handleOpen(1)} className="text-base font-medium">
              Thêm học sinh mới
            </AccordionHeader>
            <AccordionBody>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Truy cập vào mục "Quản lý học sinh" từ menu bên trái</li>
                <li>Nhấn nút "Thêm học sinh mới"</li>
                <li>Điền đầy đủ thông tin học sinh vào form</li>
                <li>Nhấn "Lưu" để hoàn tất việc thêm học sinh</li>
              </ol>
              <Typography className="mt-2 text-sm italic">
                Lưu ý: Mã số học sinh (MSHS) là duy nhất và không thể trùng lặp.
              </Typography>
            </AccordionBody>
          </Accordion>
          
          <Accordion open={open === 2}>
            <AccordionHeader onClick={() => handleOpen(2)} className="text-base font-medium">
              Tìm kiếm và lọc học sinh
            </AccordionHeader>
            <AccordionBody>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Sử dụng ô tìm kiếm ở góc trên bên phải để tìm kiếm theo tên hoặc MSHS</li>
                <li>Sử dụng bộ lọc để lọc theo lớp, khối hoặc trạng thái</li>
                <li>Kết quả tìm kiếm sẽ hiển thị ngay lập tức</li>
              </ol>
            </AccordionBody>
          </Accordion>
          
          <Accordion open={open === 3}>
            <AccordionHeader onClick={() => handleOpen(3)} className="text-base font-medium">
              Cập nhật thông tin học sinh
            </AccordionHeader>
            <AccordionBody>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Tìm học sinh cần cập nhật thông tin</li>
                <li>Nhấn vào biểu tượng "Chỉnh sửa" bên phải dòng thông tin học sinh</li>
                <li>Cập nhật thông tin cần thiết</li>
                <li>Nhấn "Lưu" để hoàn tất việc cập nhật</li>
              </ol>
            </AccordionBody>
          </Accordion>
          
          <Accordion open={open === 4}>
            <AccordionHeader onClick={() => handleOpen(4)} className="text-base font-medium">
              Xuất danh sách học sinh
            </AccordionHeader>
            <AccordionBody>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Truy cập vào mục "Quản lý học sinh"</li>
                <li>Sử dụng bộ lọc để chọn nhóm học sinh cần xuất (nếu cần)</li>
                <li>Nhấn nút "Xuất Excel" hoặc "Xuất PDF"</li>
                <li>Chọn vị trí lưu file trên máy tính</li>
              </ol>
            </AccordionBody>
          </Accordion>
        </div>
      )
    },
    {
      label: "Thu học phí",
      value: "fees",
      icon: CurrencyDollarIcon,
      content: (
        <div className="space-y-4">
          <Typography variant="h4" color="blue-gray" className="mb-2">
            Thu học phí
          </Typography>
          <Typography>
            Mô-đun thu học phí cho phép bạn thực hiện việc thu học phí cho học sinh, in biên lai và theo dõi lịch sử giao dịch. Hệ thống sẽ tự động tính toán số tiền cần thu dựa trên các khoản phí đã cấu hình.
          </Typography>
          
          <Accordion open={open === 5}>
            <AccordionHeader onClick={() => handleOpen(5)} className="text-base font-medium">
              Thu học phí cho học sinh
            </AccordionHeader>
            <AccordionBody>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Truy cập vào mục "Thu học phí" từ menu bên trái</li>
                <li>Tìm kiếm học sinh cần thu học phí bằng MSHS hoặc tên</li>
                <li>Nhấn vào nút "Thu học phí" bên phải dòng thông tin học sinh</li>
                <li>Hệ thống sẽ hiển thị các khoản phí cần thu cho tháng hiện tại</li>
                <li>Chọn các khoản phí cần thu (mặc định đã chọn tất cả)</li>
                <li>Điều chỉnh số tiền nếu cần thiết</li>
                <li>Nhấn "Thu học phí" để hoàn tất giao dịch</li>
              </ol>
            </AccordionBody>
          </Accordion>
          
          <Accordion open={open === 6}>
            <AccordionHeader onClick={() => handleOpen(6)} className="text-base font-medium">
              In biên lai
            </AccordionHeader>
            <AccordionBody>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Sau khi hoàn tất giao dịch thu học phí, hệ thống sẽ hiển thị biên lai</li>
                <li>Nhấn nút "In" để in biên lai trực tiếp</li>
                <li>Hoặc nhấn "Tải xuống" để lưu biên lai dưới dạng PDF</li>
                <li>Để in lại biên lai cũ, vào mục "Lịch sử giao dịch" và tìm giao dịch cần in lại</li>
              </ol>
            </AccordionBody>
          </Accordion>
          
          <Accordion open={open === 7}>
            <AccordionHeader onClick={() => handleOpen(7)} className="text-base font-medium">
              Xem lịch sử giao dịch
            </AccordionHeader>
            <AccordionBody>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Truy cập vào mục "Lịch sử giao dịch" từ menu bên trái</li>
                <li>Sử dụng bộ lọc để tìm kiếm theo thời gian, học sinh hoặc loại phí</li>
                <li>Hệ thống sẽ hiển thị danh sách các giao dịch theo điều kiện lọc</li>
                <li>Nhấn vào một giao dịch để xem chi tiết hoặc in lại biên lai</li>
              </ol>
            </AccordionBody>
          </Accordion>
          
          <Accordion open={open === 8}>
            <AccordionHeader onClick={() => handleOpen(8)} className="text-base font-medium">
              Thêm khoản phí mới
            </AccordionHeader>
            <AccordionBody>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Trong quá trình thu học phí, nhấn nút "Thêm dòng" ở cuối bảng</li>
                <li>Điền mã học phí, tên học phí và số tiền</li>
                <li>Khoản phí mới sẽ được thêm vào danh sách</li>
                <li>Tiếp tục quy trình thu học phí như bình thường</li>
              </ol>
              <Typography className="mt-2 text-sm italic">
                Lưu ý: Khoản phí mới sẽ được lưu lại trong hệ thống để sử dụng cho các lần sau.
              </Typography>
            </AccordionBody>
          </Accordion>
        </div>
      )
    },
    {
      label: "Quản lý dư nợ",
      value: "debt",
      icon: DocumentTextIcon,
      content: (
        <div className="space-y-4">
          <Typography variant="h4" color="blue-gray" className="mb-2">
            Quản lý dư nợ
          </Typography>
          <Typography>
            Mô-đun quản lý dư nợ giúp bạn theo dõi tình hình dư nợ học phí của học sinh, cập nhật dư nợ hàng tháng và tạo báo cáo dư nợ. Hệ thống sẽ tự động tính toán dư nợ dựa trên các khoản phí và giao dịch đã thực hiện.
          </Typography>
          
          <Accordion open={open === 9}>
            <AccordionHeader onClick={() => handleOpen(9)} className="text-base font-medium">
              Cập nhật dư nợ
            </AccordionHeader>
            <AccordionBody>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Truy cập vào mục "Quản lý dư nợ" từ menu bên trái</li>
                <li>Chọn tháng cần cập nhật dư nợ</li>
                <li>Nhấn nút "Cập nhật dư nợ"</li>
                <li>Hệ thống sẽ tự động tính toán và cập nhật dư nợ cho tất cả học sinh</li>
                <li>Theo dõi tiến trình cập nhật qua thanh tiến trình</li>
              </ol>
              <Typography className="mt-2 text-sm italic">
                Lưu ý: Việc cập nhật dư nợ thường được thực hiện vào cuối tháng.
              </Typography>
            </AccordionBody>
          </Accordion>
          
          <Accordion open={open === 10}>
            <AccordionHeader onClick={() => handleOpen(10)} className="text-base font-medium">
              Tạo năm học mới
            </AccordionHeader>
            <AccordionBody>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Truy cập vào mục "Quản lý dư nợ" từ menu bên trái</li>
                <li>Nhấn nút "Tạo năm học mới"</li>
                <li>Xác nhận việc tạo năm học mới</li>
                <li>Hệ thống sẽ thực hiện các thao tác sau:
                  <ul className="list-disc list-inside ml-4 mt-2">
                    <li>Cập nhật học sinh lên lớp kế tiếp (VD: 6→7, 7→8, 12→LT)</li>
                    <li>Tạo bản sao lưu cho dữ liệu hóa đơn và giao dịch</li>
                    <li>Tùy chọn xóa dữ liệu hóa đơn và giao dịch cũ</li>
                  </ul>
                </li>
                <li>Theo dõi tiến trình qua thanh tiến trình</li>
              </ol>
              <Typography className="mt-2 text-sm italic text-red-500 font-medium">
                Cảnh báo: Đây là thao tác quan trọng và không thể hoàn tác. Hãy đảm bảo bạn đã sao lưu dữ liệu trước khi thực hiện.
              </Typography>
            </AccordionBody>
          </Accordion>
          
          <Accordion open={open === 11}>
            <AccordionHeader onClick={() => handleOpen(11)} className="text-base font-medium">
              Xem báo cáo dư nợ
            </AccordionHeader>
            <AccordionBody>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Truy cập vào mục "Báo cáo" từ menu bên trái</li>
                <li>Chọn loại báo cáo "Dư nợ học phí"</li>
                <li>Chọn tháng và năm cần xem báo cáo</li>
                <li>Nhấn "Tạo báo cáo" để xem báo cáo dư nợ</li>
                <li>Sử dụng các tùy chọn để xuất báo cáo ra Excel hoặc PDF nếu cần</li>
              </ol>
            </AccordionBody>
          </Accordion>
        </div>
      )
    },
    {
      label: "Báo cáo",
      value: "reports",
      icon: DocumentTextIcon,
      content: (
        <div className="space-y-4">
          <Typography variant="h4" color="blue-gray" className="mb-2">
            Báo cáo thống kê
          </Typography>
          <Typography>
            Mô-đun báo cáo thống kê cung cấp các báo cáo và biểu đồ giúp bạn phân tích tình hình thu học phí, dư nợ và các số liệu tài chính khác. Các báo cáo có thể được xuất ra nhiều định dạng khác nhau để thuận tiện cho việc sử dụng.
          </Typography>
          
          <Accordion open={open === 12}>
            <AccordionHeader onClick={() => handleOpen(12)} className="text-base font-medium">
              Báo cáo thu học phí
            </AccordionHeader>
            <AccordionBody>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Truy cập vào mục "Báo cáo" từ menu bên trái</li>
                <li>Chọn loại báo cáo "Thu học phí"</li>
                <li>Chọn khoảng thời gian cần báo cáo</li>
                <li>Chọn các bộ lọc khác nếu cần (lớp, khối, loại phí)</li>
                <li>Nhấn "Tạo báo cáo" để xem báo cáo</li>
                <li>Sử dụng các tùy chọn để xuất báo cáo ra Excel hoặc PDF</li>
              </ol>
            </AccordionBody>
          </Accordion>
          
          <Accordion open={open === 13}>
            <AccordionHeader onClick={() => handleOpen(13)} className="text-base font-medium">
              Báo cáo dư nợ học phí
            </AccordionHeader>
            <AccordionBody>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Truy cập vào mục "Báo cáo" từ menu bên trái</li>
                <li>Chọn loại báo cáo "Dư nợ học phí"</li>
                <li>Chọn tháng và năm cần báo cáo</li>
                <li>Chọn các bộ lọc khác nếu cần (lớp, khối)</li>
                <li>Nhấn "Tạo báo cáo" để xem báo cáo</li>
                <li>Sử dụng các tùy chọn để xuất báo cáo ra Excel hoặc PDF</li>
              </ol>
            </AccordionBody>
          </Accordion>
          
          <Accordion open={open === 14}>
            <AccordionHeader onClick={() => handleOpen(14)} className="text-base font-medium">
              Biểu đồ thống kê
            </AccordionHeader>
            <AccordionBody>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Truy cập vào mục "Báo cáo" từ menu bên trái</li>
                <li>Chọn tab "Biểu đồ"</li>
                <li>Chọn loại biểu đồ cần xem (thu học phí theo tháng, dư nợ theo khối, v.v.)</li>
                <li>Chọn khoảng thời gian và các bộ lọc khác nếu cần</li>
                <li>Biểu đồ sẽ được hiển thị và cập nhật theo các tùy chọn đã chọn</li>
                <li>Sử dụng nút "Tải xuống" để lưu biểu đồ dưới dạng hình ảnh nếu cần</li>
              </ol>
            </AccordionBody>
          </Accordion>
        </div>
      )
    }
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Breadcrumbs>
          <a href="#" className="opacity-60 flex items-center gap-1">
            <HomeIcon className="h-4 w-4" />
            <span>Trang chủ</span>
          </a>
          <a href="#" className="flex items-center gap-1">
            <QuestionMarkCircleIcon className="h-4 w-4" />
            <span>Hướng dẫn sử dụng</span>
          </a>
        </Breadcrumbs>
      </div>

      <Card className="w-full shadow-md">
        <CardHeader floated={false} className="h-auto bg-gradient-to-r from-blue-600 to-indigo-600 py-6">
          <div className="px-6">
            <Typography variant="h3" color="white">
              Hướng dẫn sử dụng
            </Typography>
            <Typography color="white" className="mt-1 font-normal opacity-80">
              Tài liệu hướng dẫn chi tiết về cách sử dụng các chức năng của hệ thống
            </Typography>
          </div>
        </CardHeader>
        <CardBody>
          <Tabs value={activeTab}>
            <TabsHeader className="bg-gray-100">
              {data.map(({ label, value, icon: Icon }) => (
                <Tab key={value} value={value} onClick={() => setActiveTab(value)} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {label}
                </Tab>
              ))}
            </TabsHeader>
            <TabsBody>
              {data.map(({ value, content }) => (
                <TabPanel key={value} value={value} className="py-4">
                  {content}
                </TabPanel>
              ))}
            </TabsBody>
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
}

export default UserGuide;