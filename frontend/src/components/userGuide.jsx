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
  Breadcrumbs,
  Button
} from "@material-tailwind/react";
import {
  HomeIcon,
  UserIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  BookOpenIcon,
  ArrowTopRightOnSquareIcon
} from "@heroicons/react/24/outline";

function UserGuide() {
  const [open, setOpen] = useState(1);
  const [activeTab, setActiveTab] = useState("dashboard");

  const handleOpen = (value) => {
    setOpen(open === value ? 0 : value);
  };

  // Custom accordion icon for better visual feedback
  const CustomAccordionIcon = ({ id }) => (
    <ChevronDownIcon
      className={`h-5 w-5 ml-2 transition-transform duration-300 ${
        open === id ? "rotate-180 text-blue-600" : "text-blue-gray-400"
      }`}
    />
  );

  const SectionCard = ({ icon, title, description, color }) => (
    <div className="flex items-center gap-4 bg-gradient-to-r from-white to-gray-50 border border-blue-gray-50 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className={`rounded-full p-3 bg-${color}-50`}>
        {icon}
      </div>
      <div>
        <Typography variant="h6" color={color} className="mb-1">
          {title}
        </Typography>
        <Typography className="text-gray-700">{description}</Typography>
      </div>
    </div>
  );

  const data = [
    {
      label: "Tổng quan",
      value: "dashboard",
      icon: HomeIcon,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
            <Typography variant="h4" color="blue" className="mb-3 flex items-center gap-2">
              <BookOpenIcon className="h-6 w-6" />
              Tổng quan hệ thống
            </Typography>
            <Typography className="text-gray-700">
              Hệ thống quản lý học phí được thiết kế để giúp nhà trường quản lý hiệu quả việc thu học phí, theo dõi dư nợ và quản lý thông tin học sinh. Giao diện trực quan và dễ sử dụng giúp người dùng nhanh chóng làm quen và thao tác hiệu quả.
            </Typography>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <SectionCard
              icon={<CurrencyDollarIcon className="h-7 w-7 text-blue-500" />}
              title="Các chức năng chính"
              description="Quản lý thông tin học sinh, thu học phí, theo dõi dư nợ, quản lý năm học, báo cáo thống kê."
              color="blue"
            />
            <SectionCard
              icon={<AcademicCapIcon className="h-7 w-7 text-indigo-500" />}
              title="Lợi ích"
              description="Tiết kiệm thời gian, giảm sai sót, dễ theo dõi tài chính, tự động hóa báo cáo, dữ liệu an toàn."
              color="indigo"
            />
          </div>
          <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg mt-6">
            <div className="flex items-start gap-3">
              <QuestionMarkCircleIcon className="h-6 w-6 text-yellow-600 flex-shrink-0" />
              <div>
                <Typography variant="h6" color="blue-gray" className="mb-1">
                  Cần hỗ trợ thêm?
                </Typography>
                <Typography className="text-gray-700">
                  Nếu bạn cần hỗ trợ thêm, vui lòng liên hệ với bộ phận kỹ thuật qua email: t.nguyen@winwinsolutions.vn hoặc hotline: 0902681192
                </Typography>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      label: "Quản lý học sinh",
      value: "students",
      icon: UserIcon,
      content: (
        <div className="space-y-6">
          <SectionCard
            icon={<UserIcon className="h-7 w-7 text-blue-500" />}
            title="Quản lý học sinh"
            description="Thêm, sửa, xóa, tìm kiếm và xuất danh sách học sinh. Quản lý thông tin cá nhân, lớp học và học phí."
            color="blue"
          />
          {[1, 2, 3, 4].map((id, idx) => {
            const titles = [
              "Thêm học sinh mới",
              "Tìm kiếm và lọc học sinh",
              "Cập nhật thông tin học sinh",
              "Xuất danh sách học sinh"
            ];
            const steps = [
              [
                "Truy cập vào mục \"Quản lý học sinh\" từ menu bên trái",
                "Nhấn nút \"Thêm học sinh mới\"",
                "Điền đầy đủ thông tin học sinh vào form",
                "Nhấn \"Lưu\" để hoàn tất việc thêm học sinh"
              ],
              [
                "Sử dụng ô tìm kiếm ở góc trên bên phải để tìm kiếm theo tên hoặc MSHS",
                "Sử dụng bộ lọc để lọc theo lớp, khối hoặc trạng thái",
                "Kết quả tìm kiếm sẽ hiển thị ngay lập tức"
              ],
              [
                "Tìm học sinh cần cập nhật thông tin",
                "Nhấn vào biểu tượng \"Chỉnh sửa\" bên phải dòng thông tin học sinh",
                "Cập nhật thông tin cần thiết",
                "Nhấn \"Lưu\" để hoàn tất việc cập nhật"
              ],
              [
                "Truy cập vào mục \"Quản lý học sinh\"",
                "Sử dụng bộ lọc để chọn nhóm học sinh cần xuất (nếu cần)",
                "Nhấn nút \"Xuất Excel\" hoặc \"Xuất PDF\"",
                "Chọn vị trí lưu file trên máy tính"
              ]
            ];
            return (
              <Accordion key={id} open={open === id} icon={<CustomAccordionIcon id={id} />}>
                <AccordionHeader onClick={() => handleOpen(id)} className="text-base font-medium border-b-0 transition-colors hover:text-blue-600">
                  {titles[idx]}
                </AccordionHeader>
                <AccordionBody>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    {steps[idx].map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                  {id === 1 && (
                    <Typography className="mt-2 text-sm italic text-blue-700">
                      Lưu ý: Mã số học sinh (MSHS) là duy nhất và không thể trùng lặp.
                    </Typography>
                  )}
                </AccordionBody>
              </Accordion>
            );
          })}
        </div>
      )
    },
    {
      label: "Thu học phí",
      value: "fees",
      icon: CurrencyDollarIcon,
      content: (
        <div className="space-y-6">
          <SectionCard
            icon={<CurrencyDollarIcon className="h-7 w-7 text-green-500" />}
            title="Thu học phí"
            description="Thực hiện thu học phí, in biên lai, theo dõi lịch sử giao dịch và thêm khoản phí mới."
            color="green"
          />
          {[5, 6, 7, 8].map((id, idx) => {
            const titles = [
              "Thu học phí cho học sinh",
              "In biên lai",
              "Xem lịch sử giao dịch",
              "Thêm khoản phí mới"
            ];
            const steps = [
              [
                "Truy cập vào mục \"Thu học phí\" từ menu bên trái",
                "Tìm kiếm học sinh cần thu học phí bằng MSHS hoặc tên",
                "Nhấn vào nút \"Thu học phí\" bên phải dòng thông tin học sinh",
                "Hệ thống sẽ hiển thị các khoản phí cần thu cho tháng hiện tại",
                "Chọn các khoản phí cần thu (mặc định đã chọn tất cả)",
                "Điều chỉnh số tiền nếu cần thiết",
                "Nhấn \"Thu học phí\" để hoàn tất giao dịch"
              ],
              [
                "Sau khi hoàn tất giao dịch thu học phí, hệ thống sẽ hiển thị biên lai",
                "Nhấn nút \"In\" để in biên lai trực tiếp",
                "Hoặc nhấn \"Tải xuống\" để lưu biên lai dưới dạng PDF",
                "Để in lại biên lai cũ, vào mục \"Lịch sử giao dịch\" và tìm giao dịch cần in lại"
              ],
              [
                "Truy cập vào mục \"Lịch sử giao dịch\" từ menu bên trái",
                "Sử dụng bộ lọc để tìm kiếm theo thời gian, học sinh hoặc loại phí",
                "Hệ thống sẽ hiển thị danh sách các giao dịch theo điều kiện lọc",
                "Nhấn vào một giao dịch để xem chi tiết hoặc in lại biên lai"
              ],
              [
                "Trong quá trình thu học phí, nhấn nút \"Thêm dòng\" ở cuối bảng",
                "Điền mã học phí, tên học phí và số tiền",
                "Khoản phí mới sẽ được thêm vào danh sách",
                "Tiếp tục quy trình thu học phí như bình thường"
              ]
            ];
            return (
              <Accordion key={id} open={open === id} icon={<CustomAccordionIcon id={id} />}>
                <AccordionHeader onClick={() => handleOpen(id)} className="text-base font-medium border-b-0 transition-colors hover:text-green-600">
                  {titles[idx]}
                </AccordionHeader>
                <AccordionBody>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    {steps[idx].map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                  {id === 8 && (
                    <Typography className="mt-2 text-sm italic text-green-700">
                      Lưu ý: Khoản phí mới sẽ được lưu lại trong hệ thống để sử dụng cho các lần sau.
                    </Typography>
                  )}
                </AccordionBody>
              </Accordion>
            );
          })}
        </div>
      )
    },
    {
      label: "Quản lý dư nợ",
      value: "debt",
      icon: DocumentTextIcon,
      content: (
        <div className="space-y-6">
          <SectionCard
            icon={<DocumentTextIcon className="h-7 w-7 text-purple-500" />}
            title="Quản lý dư nợ"
            description="Theo dõi dư nợ học phí, cập nhật dư nợ hàng tháng, tạo năm học mới và xuất báo cáo dư nợ."
            color="purple"
          />
          <Accordion open={open === 9} icon={<CustomAccordionIcon id={9} />}>
            <AccordionHeader onClick={() => handleOpen(9)} className="text-base font-medium border-b-0 transition-colors hover:text-purple-600">
              Cập nhật dư nợ
            </AccordionHeader>
            <AccordionBody>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Truy cập vào mục "Quản lý dư nợ" từ menu bên trái</li>
                <li>Chọn tháng cần cập nhật dư nợ</li>
                <li>Nhấn nút "Cập nhật dư nợ"</li>
                <li>
                  Hệ thống sẽ tự động tính toán và cập nhật dư nợ cho tất cả học sinh
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500">Tiến trình cập nhật:</span>
                      <span className="text-xs font-semibold text-amber-700">60%</span>
                    </div>
                    <div className="w-full bg-amber-100 rounded-full h-2.5" aria-label="Tiến trình cập nhật dư nợ">
                      <div className="bg-amber-400 h-2.5 rounded-full transition-all duration-500" style={{ width: "60%" }} />
                    </div>
                  </div>
                </li>
                <li>Sau khi hoàn tất, hệ thống sẽ thông báo cập nhật thành công</li>
              </ol>
              <Typography className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm italic text-blue-800 flex items-center gap-2">
                <QuestionMarkCircleIcon className="h-4 w-4" />
                Lưu ý: Bạn nên cập nhật dư nợ vào cuối mỗi tháng để đảm bảo số liệu chính xác.
              </Typography>
            </AccordionBody>
          </Accordion>
          <Accordion open={open === 10} icon={<CustomAccordionIcon id={10} />}>
            <AccordionHeader onClick={() => handleOpen(10)} className="text-base font-medium border-b-0 transition-colors hover:text-purple-600">
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
          <Accordion open={open === 11} icon={<CustomAccordionIcon id={11} />}>
            <AccordionHeader onClick={() => handleOpen(11)} className="text-base font-medium border-b-0 transition-colors hover:text-purple-600">
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
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Breadcrumbs className="mb-4">
        <a href="/" className="opacity-60 flex items-center gap-1">
          <HomeIcon className="h-4 w-4" />
          <span>Trang chủ</span>
        </a>
        <span className="flex items-center gap-1">
          <QuestionMarkCircleIcon className="h-4 w-4" />
          <span>Hướng dẫn sử dụng</span>
        </span>
      </Breadcrumbs>
      <Card className="w-full shadow-lg">
        <CardHeader floated={false} className="h-auto bg-gradient-to-r from-blue-600 to-indigo-600 py-6">
          <div className="px-6">
            <Typography variant="h3" color="white" className="flex items-center gap-2">
              <BookOpenIcon className="h-8 w-8" />
              Hướng dẫn sử dụng
            </Typography>
            <Typography color="white" className="mt-1 font-normal opacity-80">
              Tài liệu hướng dẫn chi tiết về cách sử dụng các chức năng của hệ thống
            </Typography>
          </div>
        </CardHeader>
        <CardBody>
          <Tabs value={activeTab}>
            <TabsHeader className="bg-gray-100 rounded-lg">
              {data.map(({ label, value, icon: Icon }) => (
                <Tab
                  key={value}
                  value={value}
                  onClick={() => setActiveTab(value)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Tab>
              ))}
            </TabsHeader>
            <TabsBody>
              {data.map(({ value, content }) => (
                <TabPanel key={value} value={value} className="py-6">
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
