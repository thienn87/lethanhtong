import { Spinner } from "../polaris/spinner";
import { format } from "date-fns";
import { Card, Typography, Button } from "@material-tailwind/react";

export function ItemList({items,click,click2,next,prev, exportClick, loading}) {
  if (!items) {
    return <div style={{width:"20px",margin:"auto"}}><Spinner/></div>
  } else {
    // console.warn('Debug index_itemList.jsx ',items)
  }
  const handlePopupDetail = (value) => {
    click(value)
  }
  const handleTransactionDetail = (value) => {
    click2(value)
  }
  
  const TABLE_HEAD = ["MSHS", "Họ", "Tên", "Ngày sinh", "Lớp", "Giảm HP (%)", "Sửa"];
  const TABLE_ROWS = items;
  return (
    <>
      <div className="flex justify-end items-center">
        <Button
          className={`${!loading
            ? "bg-blue-500 text-white hover:bg-blue-600"
            : "bg-gray-300 text-gray-400"
            } `}
          disabled={loading}
          loading={loading}
          onClick={exportClick}
        >
          Xuất dữ liệu
        </Button>
      </div>
      <div className="grid">
        <h3 className="my-3 font-bold">Danh sách học sinh</h3>
      </div>
      <Card className="h-full w-full overflow-hidden">
          <table className="w-full min-w-max table-auto text-left">
            <thead>
              <tr>
                {TABLE_HEAD.map((head) => (
                  <th
                    key={head}
                    className="border-b border-gray-900 bg-gray-50 p-4"
                  >
                    <Typography
                      variant="small"
                      color="gray"
                      className=" text-gray-800 font-bold"
                    >
                      {head}
                    </Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TABLE_ROWS.map((item,index) => {
                const isLast = index === TABLE_ROWS.length - 1;
                const classes = isLast ? "p-4" : "p-4 border-b border-blue-gray-300";
                return (
                  <tr key={item.mshs}   className="even:bg-gray-100">
                    <td className={classes}>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal"
                      >
                        {item.mshs}
                      </Typography>
                    </td>
                    <td className={classes}>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal"
                      >
                        {item.sur_name}
                      </Typography>
                    </td>
                    <td className={classes}>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal"
                      >
                      {item.name}
                      </Typography>
                    </td>
                    <td className={classes}>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal"
                      >
                      {format(new Date(item.day_of_birth), "dd/MM/yyyy")}
                      </Typography>
                    </td>
                    <td className={classes}>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal"
                      >
                        {item.grade}{item.class}
                      </Typography>
                    </td>
                    <td className={classes}>
                      <Typography
                        variant="small"
                        color={item.discount > 0 ? "green" : "blue-gray"}
                        className={item.discount > 0 ? "font-bold" : "font-normal"}
                      >
                        {item.discount > 0 ? item.discount : "-"}
                      </Typography>
                    </td>
                    <td className={classes}>
                      <span className="btn btn-sm btn-icon btn-clear btn-light">
                        <div className="btn btn-sm btn-icon btn-clear btn-light" onClick={ async () => handlePopupDetail(index)}>
                        <svg className="w-[18px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fillRule="evenodd" d="M15.655 4.344a2.695 2.695 0 0 0-3.81 0l-.599.599-.009-.009-1.06 1.06.008.01-5.88 5.88a2.75 2.75 0 0 0-.805 1.944v1.922a.75.75 0 0 0 .75.75h1.922a2.75 2.75 0 0 0 1.944-.806l7.54-7.539a2.695 2.695 0 0 0 0-3.81Zm-4.409 2.72-5.88 5.88a1.25 1.25 0 0 0-.366.884v1.172h1.172c.331 0 .65-.132.883-.366l5.88-5.88-1.689-1.69Zm2.75.629.599-.599a1.195 1.195 0 1 0-1.69-1.689l-.598.599 1.69 1.689Z"/></svg>
                      </div>
                      </span>
                    </td>
                    {/* <td className={classes}>
                      <a className="btn btn-sm btn-icon btn-clear btn-light" href="#">
                          <div className="btn btn-sm btn-icon btn-clear btn-light" onClick={ async () => handleTransactionDetail(index)}>
                          <svg className="w-[18px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M8.575 4.649c.707-.734 1.682-1.149 2.7-1.149h1.975c1.795 0 3.25 1.455 3.25 3.25v1.5c0 .414-.336.75-.75.75s-.75-.336-.75-.75v-1.5c0-.966-.784-1.75-1.75-1.75h-1.974c-.611 0-1.197.249-1.62.69l-4.254 4.417c-.473.49-.466 1.269.016 1.75l2.898 2.898c.385.386 1.008.392 1.4.014l.451-.434c.299-.288.773-.279 1.06.02.288.298.28.773-.02 1.06l-.45.434c-.981.945-2.538.93-3.502-.033l-2.898-2.898c-1.06-1.06-1.075-2.772-.036-3.852l4.254-4.417Z"/><path d="M14 7c0 .552-.448 1-1 1s-1-.448-1-1 .448-1 1-1 1 .448 1 1Z"/><path d="M13.25 10.857c-.728.257-1.25.952-1.25 1.768 0 1.036.84 1.875 1.875 1.875h.75c.207 0 .375.168.375.375s-.168.375-.375.375h-1.875c-.414 0-.75.336-.75.75s.336.75.75.75h.5v.25c0 .414.336.75.75.75s.75-.336.75-.75v-.254c.977-.064 1.75-.877 1.75-1.871 0-1.036-.84-1.875-1.875-1.875h-.75c-.207 0-.375-.168-.375-.375s.168-.375.375-.375h1.875c.414 0 .75-.336.75-.75s-.336-.75-.75-.75h-1v-.25c0-.414-.336-.75-.75-.75s-.75.336-.75.75v.357Z"/></svg>
                        </div>
                      </a>
                    </td> */}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

    </>
    );
}