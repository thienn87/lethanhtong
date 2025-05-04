import { Button } from "../polaris/button";
import { Spinner } from "../polaris/spinner";
import { Card, Typography } from "@material-tailwind/react";

export function ItemList({ items, click, buttonName, next, prev }) {
  if (!items) {
    return (
      <div className="flex justify-center items-center h-20">
        <Spinner />
      </div>
    );
  } else {
    console.warn("Data type ItemList: ", items);
  }

  const TABLE_HEAD = ["Khối", "Tên lớp"];
  const TABLE_ROWS = items;

  return (
    <>
      <Card className="h-full w-full overflow-hidden shadow-lg rounded-lg">
        <table className="w-full min-w-max table-auto text-left border-collapse">
          <thead className="bg-blue-100">
            <tr>
              {TABLE_HEAD.map((head) => (
                <th
                  key={head}
                  className="border-b border-blue-gray-200 p-4 text-blue-gray-700 font-semibold text-sm"
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TABLE_ROWS.map((item, index) => {
              const isLast = index === TABLE_ROWS.length - 1;
              const classes = isLast
                ? "p-4"
                : "p-4 border-b border-blue-gray-100";
              return (
                <tr
                  key={item.mshs}
                  className={`hover:bg-blue-50 ${
                    index % 2 === 0 ? "bg-white" : "bg-blue-gray-50/50"
                  }`}
                >
                  <td className={classes}>
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-medium"
                    >
                      {item.grade}
                    </Typography>
                  </td>
                  <td className={classes}>
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-medium"
                    >
                      {item.name}
                    </Typography>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Pagination Controls */}
      {/* <div className="flex justify-between items-center mt-4">
        <Button
          onClick={prev}
          className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-lg"
          disabled={!prev}
        >
          Previous
        </Button>
        <Button
          onClick={next}
          className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-lg"
          disabled={!next}
        >
          Next
        </Button>
      </div> */}
    </>
  );
}