<?php

namespace App\Repositories;

use App\Models\TuitionGroup;

use App\Models\Classes;

class TuitionRepository
{
    public function updateTuition($data)
    {   
        $tuitionGroup = TuitionGroup::where('code', $data['code'])->first();

        if (!$tuitionGroup) {
            return false;
        }

        if ($tuitionGroup) {

            $tuitionGroup->update([
                'name' => $data['name'],
                'group' => $data['groupcode'],
                'default_amount' => $data['default_amount'],
                'grade' => $data['grade'],
                'month_apply' => $data['month_apply']
            ]);
        }
        return true;
    }

    public function deleteTuition($data){
        $tuitionGroup = TuitionGroup::where('code', $data['code'])->first();

        if (!$tuitionGroup) {
            return false;
        }

        $tuitionGroup->delete();

        return true; 
    }
}
