import React from 'react';
import { Menu } from 'antd';
import { 
  DashboardOutlined, 
  UserOutlined, 
  BookOutlined, 
  ScheduleOutlined, 
  DollarOutlined 
} from '@ant-design/icons';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      path: '/'
    },
    {
      key: 'hoc-vien',
      icon: <UserOutlined />,
      label: 'Học viên',
      children: [
        {
          key: 'danh-sach-hoc-vien',
          label: 'Danh sách học viên',
          path: '/hoc-vien'
        },
        {
          key: 'them-hoc-vien',
          label: 'Thêm học viên',
          path: '/hoc-vien/them'
        }
      ]
    },
    {
      key: 'lop-hoc',
      icon: <BookOutlined />,
      label: 'Lớp học',
      children: [
        {
          key: 'danh-sach-lop',
          label: 'Danh sách lớp',
          path: '/lop-hoc'
        },
        {
          key: 'them-lop',
          label: 'Thêm lớp mới',
          path: '/lop-hoc/them'
        }
      ]
    },
    {
      key: 'lich-hoc',
      icon: <ScheduleOutlined />,
      label: 'Lịch học',
      path: '/lich-hoc'
    },
    {
      key: 'hoc-phi',
      icon: <DollarOutlined />,
      label: 'Học phí',
      children: [
        {
          key: 'danh-sach-hoc-phi',
          label: 'Danh sách học phí',
          path: '/hoc-phi'
        },
        {
          key: 'thu-phi',
          label: 'Thu học phí',
          path: '/thu-phi'
        },
        {
          key: 'cong-no',
          label: 'Công nợ',
          path: '/cong-no'
        }
      ]
    }
  ];

  const renderMenuItems = (items) => {
    return items.map(item => {
      if (item.children) {
        return (
          <Menu.SubMenu key={item.key} icon={item.icon} title={item.label}>
            {renderMenuItems(item.children)}
          </Menu.SubMenu>
        );
      }
      return (
        <Menu.Item key={item.key} icon={item.icon}>
          <Link to={item.path}>{item.label}</Link>
        </Menu.Item>
      );
    });
  };

  return (
    <div className="sidebar">
      <div className="logo">
        <h2>Quản lý học viên</h2>
      </div>
      <Menu
        mode="inline"
        defaultSelectedKeys={['dashboard']}
        defaultOpenKeys={['hoc-vien']}
        style={{ height: '100%', borderRight: 0 }}
      >
        {renderMenuItems(menuItems)}
      </Menu>
    </div>
  );
};

export default Sidebar;
