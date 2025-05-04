import { Outlet } from "react-router-dom";
import Sidebar from './Sidebar.jsx';
import Footer from './Footer.jsx';
import Header from './Header.jsx';
const Layout = () => {
  return (
    <>
      <div className="flex grow">
        <Sidebar />
        <div className="wrapper flex grow flex-col" style={{maxHeight:"100vh",overflow:"scroll"}}>
          <Header />
          <main className="grow content pt-5" id="content" role="content">
            <div className="container-fixed" id="content_container">
            </div>
            <div className="container-fixed pb-5">
              <Outlet />
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </>
  )
};

export default Layout;