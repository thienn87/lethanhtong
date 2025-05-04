<?php

namespace App\Repositories;

use App\Models\Student;

class StudentRepository
{
    public function updateStudent($data)
    {
        $student = Student::where('mshs', $data['mshs'])->first();

        if (!$student) {
            return false;
        }

        $personalData = [
            'sur_name' => $data['sur_name'] ?? $student->sur_name,
            'name' => $data['name'] ?? $student->name,
            'day_of_birth' => $data['day_of_birth'] ?? $student->day_of_birth,
            'grade' => $data['grade'] ?? $student->grade,
            'class' => $data['class'] ?? $student->class,
            'gender' => $data['gender'] ?? $student->gender,
            'parent_name' => $data['parent_name'] ?? $student->parent_name,
            'address' => $data['address'] ?? $student->address,
            'phone_number' => $data['phone_number'] ?? $student->phone_number,
            'day_in' => $data['day_in'] ?? $student->day_in,
            'day_out' => $data['day_out'] ?? $student->day_out,
            'stay_in' => $data['stay_in'] ?? $student->stay_in,
            'leave_school' => $data['leave_school'] ?? $student->leave_school,
            'fail_grade' => $data['fail_grade'] ?? $student->fail_grade,
            'extra_fee' => $data['extra_fee'] ?? $student->extra_fee,
            'extra_fee_note' => $data['extra_fee_note'] ?? $student->extra_fee_note,
            'discount' => $data['discount'] ?? $student->discount,
        ];

        $student->update($personalData);

        return true;
    }
    public function deleteStudent($data){
        $student = Student::where('mshs', $data['mshs'])->first();

        if (!$student) {
            return false;
        }

        $student->delete();

        return true; 
    }
}
