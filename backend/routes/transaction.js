// Add this new endpoint to your transaction routes file

/**
 * @route GET /api/transaction/outstanding-debt/search
 * @desc Search outstanding debt records with filters
 * @access Private
 */
router.get('/outstanding-debt/search', async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month, grade, keyword } = req.query;
    
    // Build the query based on provided filters
    const query = { year: parseInt(year) };
    
    if (month) {
      query.month = parseInt(month);
    }
    
    // Fetch data with filters
    let data = await OutstandingDebt.find(query).sort({ month: -1 });
    
    // If grade filter is provided, filter the grades array within each record
    if (grade) {
      data = data.map(record => {
        return {
          ...record._doc,
          grades: record.grades.filter(g => g.grade === grade)
        };
      }).filter(record => record.grades.length > 0);
    }
    
    // If keyword is provided, search across relevant fields
    // This would depend on your data structure, but could include student names, IDs, etc.
    if (keyword) {
      // This is a simplified example - you would need to adapt this to your actual data structure
      // You might need to use aggregation pipeline for more complex searches
      data = data.filter(record => {
        // Search in relevant fields
        return record.grades.some(g => 
          g.studentDetails && g.studentDetails.some(student => 
            student.name.toLowerCase().includes(keyword.toLowerCase()) ||
            student.id.toString().includes(keyword)
          )
        );
      });
    }
    
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error searching outstanding debt records:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /api/transaction/student-debts/search
 * @desc Search student debts with pagination and filters
 * @access Private
 */
router.get('/student-debts/search', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      keyword = '', 
      grade = '', 
      class: className = '',
      year = new Date().getFullYear(),
      month = new Date().getMonth() + 1 // Default to current month
    } = req.query;
    
    // Convert page and limit to numbers
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Build the base query for students
    let studentQuery = {};
    
    // Add filters if provided
    if (grade) {
      studentQuery.grade = grade;
    }
    
    if (className) {
      studentQuery.class = className;
    }
    
    // Add keyword search if provided
    if (keyword) {
      // Search in multiple fields
      studentQuery.$or = [
        { mshs: { $regex: keyword, $options: 'i' } },
        { name: { $regex: keyword, $options: 'i' } },
        { sur_name: { $regex: keyword, $options: 'i' } }
      ];
    }
    
    // First, get total count for pagination
    const totalCount = await Student.countDocuments(studentQuery);
    
    // Then fetch the students for the current page
    const students = await Student.find(studentQuery)
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    // Build query for outstanding debt
    const debtQuery = { 
      year: parseInt(year),
      month: month ? parseInt(month) : { $exists: true }
    };
    
    // Fetch all relevant debt records at once to reduce database queries
    const allDebtRecords = await OutstandingDebt.find(debtQuery).lean();
    
    // Create a map for quick lookup of debt records by student MSHS
    const debtRecordsByMshs = {};
    
    // Process all debt records to organize by student MSHS
    allDebtRecords.forEach(record => {
      if (record.studentDetails && Array.isArray(record.studentDetails)) {
        record.studentDetails.forEach(student => {
          if (student.mshs) {
            // If this is the first record for this student or it's more recent, store it
            if (!debtRecordsByMshs[student.mshs] || 
                (record.month > debtRecordsByMshs[student.mshs].month && record.year >= debtRecordsByMshs[student.mshs].year)) {
              debtRecordsByMshs[student.mshs] = {
                ...record,
                studentDetail: student // Store the specific student detail
              };
            }
          }
        });
      }
    });
    
    // Map student data with their debt information
    const studentDebts = students.map(student => {
      const mshs = student.mshs;
      const debtRecord = debtRecordsByMshs[mshs];
      
      // Calculate dathu sum if it exists
      let dathuSum = 0;
      if (debtRecord?.dathu) {
        if (Array.isArray(debtRecord.dathu)) {
          // If dathu is an array of payments
          dathuSum = debtRecord.dathu.reduce((sum, item) => sum + (item.amount_paid || 0), 0);
        } else if (typeof debtRecord.dathu === 'number') {
          // If dathu is a direct number
          dathuSum = debtRecord.dathu;
        }
      }
      
      // Get student-specific debt details
      const studentDetail = debtRecord?.studentDetail || {};
      
      return {
        mshs,
        ten: student.sur_name + " " + student.name,
        khoi: student.grade,
        lop: student.class,
        du_cuoi_thang_nay: studentDetail.du_cuoi_thang_nay || debtRecord?.du_cuoi_thang_nay?.total || null,
        du_cuoi_thang_truoc: studentDetail.du_cuoi_thang_truoc || debtRecord?.du_cuoi_thang_truoc?.total || null,
        tong_du_cuoi: studentDetail.tong_du_cuoi || debtRecord?.tong_du_cuoi || null,
        dathu: dathuSum,
        year: debtQuery.year,
        month: typeof debtQuery.month === 'object' ? null : debtQuery.month
      };
    });
    
    return res.status(200).json({
      success: true,
      data: studentDebts,
      totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum)
    });
    
  } catch (error) {
    console.error('Error searching student debts:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});
