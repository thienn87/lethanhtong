import { BrowserRouter, Routes, Route } from "react-router-dom";

import CreateStudent from "./components/students/add.jsx";

import Layout from "./components/Layout.jsx";

import Students from "./components/students/index.jsx";
import ImportStudents from "./components/students/import";

import Tuition from "./components/tuition/index.jsx";
import UpdateTuition from "./components/tuition/update.jsx";

import ChargeTuition from "./components/tuition-group/charge.jsx";
import ListGroupTuition from "./components/tuition-group/index.jsx";
import AddListGroupTuition from "./components/tuition-group/add.jsx";

import ListGrade from "./components/grade/index.jsx";
import AddGrade from "./components/grade/add.jsx";

import ListClass from "./components/class/index.jsx";
import AddClass from "./components/class/add.jsx";

import TransactionList from "./components/transaction/list.jsx";
import OutstandingDebt from "./components/transaction/outstandingDebt.jsx";
import Debt from "./components/transaction/debt.jsx";
import Records from "./components/transaction/records.jsx";

import Homepage from "./components/index.jsx";
import UserGuide from "./components/userGuide";

import "./css/metronic.css";
import "./css/tailwind.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Homepage />} />

          <Route path="hoc-sinh" element={<Students />} />
          <Route path="hoc-sinh/them-moi" element={<CreateStudent />} />
          <Route path="hoc-sinh/nhap-excel" element={<ImportStudents />} />
          {/* 
          <Route path="giao-vien" element={<Students />} />
          <Route path="giao-vien/them-moi" element={<Students />} /> */}

          <Route path="khoi" element={<ListGrade />} />
          <Route path="khoi/them-moi" element={<AddGrade />} />

          <Route path="lop" element={<ListClass />} />
          <Route path="lop/them-moi" element={<AddClass />} />

          <Route path="thu-hoc-phi" element={<ChargeTuition />} />
          <Route path="nhom-hoc-phi" element={<ListGroupTuition />} />
          <Route
            path="nhom-hoc-phi/them-moi"
            element={<AddListGroupTuition />}
          />

          <Route path="hoc-phi" element={<ListGroupTuition />} />
          <Route path="hoc-phi/cap-nhat" element={<UpdateTuition />} />

          <Route path="quan-ly-du-no" element={<OutstandingDebt />} />
          {/* <Route path="quan-ly-du-no/giao-dich" element={<OutstandingDebt />} /> */}
          <Route path="quan-ly-du-no/giao-dich" element={<TransactionList />} />
          <Route path="thong-ke-cong-no" element={<Debt />} />
          {/* <Route path="thong-ke-cong-no" element={<Debt />} />
          <Route path="thong-ke-cong-no/phai-thu" element={<Debt />} /> */}
          <Route path="lich-su-giao-dich" element={<Records />} />
          <Route path="user-guide" element={<UserGuide />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
