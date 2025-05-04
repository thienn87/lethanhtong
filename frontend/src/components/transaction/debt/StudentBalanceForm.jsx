import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Input,
  Button,
  IconButton,
  Spinner,
  Tooltip,
} from "@material-tailwind/react";
import { PlusIcon, TrashIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { Config } from "../../config";

const StudentBalanceForm = ({ student, onClose, onSuccess }) => {
  const domain = Config();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    mshs: student?.mshs || "",
    balance: student?.balance || 0,
    detail: student?.detail || [],
    advance_payment_info: student?.advance_payment_info || null,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (student) {
      setFormData({
        mshs: student.mshs,
        balance: student.balance,
        detail: student.detail || [],
        advance_payment_info: student.advance_payment_info || null,
      });
    }
  }, [student]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "balance" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleDetailChange = (index, field, value) => {
    const updatedDetail = [...formData.detail];
    updatedDetail[index] = {
      ...updatedDetail[index],
      [field]: field === "amount" ? parseFloat(value) || 0 : value,
    };
    
    // Recalculate total balance
    const totalBalance = updatedDetail.reduce((sum, item) => sum + item.amount, 0);
    
    setFormData((prev) => ({
      ...prev,
      detail: updatedDetail,
      balance: totalBalance,
    }));
  };

  const addDetailItem = () => {
    setFormData((prev) => ({
      ...prev,
      detail: [
        ...prev.detail,
        {
          code: "",
          name: "",
          amount: 0,
        },
      ],
    }));
  };

  const removeDetailItem = (index) => {
    const updatedDetail = [...formData.detail];
    updatedDetail.splice(index, 1);
    
    // Recalculate total balance
    const totalBalance = updatedDetail.reduce((sum, item) => sum + item.amount, 0);
    
    setFormData((prev) => ({
      ...prev,
      detail: updatedDetail,
      balance: totalBalance,
    }));
  };

  const handleAdvanceInfoChange = (field, value) => {
    const updatedAdvanceInfo = {
      ...(formData.advance_payment_info || {}),
      [field]: field === "advance_months" || field === "monthly_fees" || field === "remaining_balance" 
        ? parseFloat(value) || 0 
        : value,
    };
    
    setFormData((prev) => ({
      ...prev,
      advance_payment_info: updatedAdvanceInfo,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${domain}/api/transaction/update-student-balance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess("Student balance updated successfully");
        if (onSuccess) {
          onSuccess(result.data);
        }
        setTimeout(() => {
          if (onClose) {
            onClose();
          }
        }, 2000);
      } else {
        setError(result.message || "Failed to update student balance");
      }
    } catch (err) {
      setError("An error occurred while updating student balance");
      console.error("Error updating student balance:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalFromDetail = () => {
    return formData.detail.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader
        color="blue"
        className="mb-4 grid h-20 place-items-center bg-gradient-to-r from-blue-600 to-indigo-600"
      >
        <Typography variant="h4" color="white">
          {student ? "Update Student Balance" : "Add Student Balance"}
        </Typography>
      </CardHeader>
      <CardBody className="flex flex-col gap-4 p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
                Student ID (MSHS)
              </Typography>
              <Input
                type="text"
                name="mshs"
                value={formData.mshs}
                onChange={handleInputChange}
                disabled={!!student}
                required
              />
            </div>
            <div>
              <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
                Total Balance
              </Typography>
              <Input
                type="number"
                name="balance"
                value={formData.balance}
                onChange={handleInputChange}
                disabled={formData.detail.length > 0}
                required
              />
              {formData.detail.length > 0 && (
                <Typography variant="small" color="gray" className="mt-1">
                  Balance is calculated from detail items
                </Typography>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-4">
              <Typography variant="h6" color="blue-gray">
                Balance Detail
              </Typography>
              <Button
                size="sm"
                color="blue"
                variant="text"
                className="flex items-center gap-2"
                onClick={addDetailItem}
              >
                <PlusIcon className="h-4 w-4" /> Add Item
              </Button>
            </div>

            {formData.detail.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No detail items. Add items to break down the balance.
              </div>
            ) : (
              <div className="space-y-4">
                {formData.detail.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-3">
                      <Input
                        type="text"
                        placeholder="Code"
                        value={item.code}
                        onChange={(e) => handleDetailChange(index, "code", e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-5">
                      <Input
                        type="text"
                        placeholder="Name"
                        value={item.name}
                        onChange={(e) => handleDetailChange(index, "name", e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={item.amount}
                        onChange={(e) => handleDetailChange(index, "amount", e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <IconButton
                        variant="text"
                        color="red"
                        onClick={() => removeDetailItem(index)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </div>
                ))}

                <div className="flex justify-end mt-2">
                  <Typography variant="small" className="font-medium">
                    Total: {calculateTotalFromDetail().toLocaleString()} VND
                  </Typography>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-4">
              <Typography variant="h6" color="blue-gray" className="flex items-center gap-2">
                Advance Payment Info
                <Tooltip content="Used to track prepaid months">
                  <InformationCircleIcon className="h-4 w-4 text-blue-500" />
                </Tooltip>
              </Typography>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
                  Advance Months
                </Typography>
                <Input
                  type="number"
                  value={formData.advance_payment_info?.advance_months || 0}
                  onChange={(e) => handleAdvanceInfoChange("advance_months", e.target.value)}
                />
              </div>
              <div>
                <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
                  Monthly Fees
                </Typography>
                <Input
                  type="number"
                  value={formData.advance_payment_info?.monthly_fees || 0}
                  onChange={(e) => handleAdvanceInfoChange("monthly_fees", e.target.value)}
                />
              </div>
              <div>
                <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
                  Remaining Balance
                </Typography>
                <Input
                  type="number"
                  value={formData.advance_payment_info?.remaining_balance || 0}
                  onChange={(e) => handleAdvanceInfoChange("remaining_balance", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button variant="outlined" color="blue-gray" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" color="blue" disabled={loading}>
              {loading ? <Spinner className="h-4 w-4 mr-2" /> : null}
              Save Changes
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
};

export default StudentBalanceForm;