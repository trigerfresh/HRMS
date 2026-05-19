// controllers/salaryTemplateController.js
const SalaryTemplate = require('../models/SalaryTemplate');

// @desc    Create a new salary template
// @route   POST /api/salary-templates
exports.createTemplate = async (req, res) => {
  try {
    const template = new SalaryTemplate(req.body);
    await template.save();
    res.status(201).json({
      success: true,
      message: "Salary template created successfully",
      data: template
    });
  } catch (error) {
    console.error("❌ CREATE TEMPLATE FAILED:", error);
    res.status(400).json({
      success: false,
      message: "Error creating salary template",
      error: error.message
    });
  }
};

// @desc    Get all salary templates with search and filter
// @route   GET /api/salary-templates
exports.getTemplates = async (req, res) => {
  try {
    const { searchFields, fromDate, toDate } = req.query;
    let query = {};

    // Keyword based search on multiple fields
    if (searchFields) {
      try {
        const fields = JSON.parse(searchFields);
        const orConditions = fields.map(field => {
          if (field.field && field.keyword) {
            return { [field.field]: new RegExp(field.keyword, 'i') };
          }
        }).filter(Boolean);

        if (orConditions.length > 0) {
          query.$or = orConditions;
        }
      } catch (e) {
        console.error("Invalid searchFields format:", e);
      }
    }

    // Date range filter
    if (fromDate && toDate) {
      query.createdAt = {
        $gte: new Date(fromDate),
        $lte: new Date(new Date(toDate).setHours(23, 59, 59, 999))
      };
    }

    const templates = await SalaryTemplate.find(query).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: templates.length,
      data: templates
    });
  } catch (error) {
    console.error("❌ GET TEMPLATES FAILED:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching salary templates",
      error: error.message
    });
  }
};

// @desc    Get a single salary template by ID
// @route   GET /api/salary-templates/:id
exports.getTemplate = async (req, res) => {
  try {
    const template = await SalaryTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Salary template not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error("❌ GET TEMPLATE FAILED:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching salary template",
      error: error.message
    });
  }
};

// @desc    Update a salary template
// @route   PUT /api/salary-templates/:id
exports.updateTemplate = async (req, res) => {
  try {
    const template = await SalaryTemplate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Salary template not found'
      });
    }

    res.status(200).json({
      success: true,
      message: "Salary template updated successfully",
      data: template
    });
  } catch (error) {
    console.error("❌ UPDATE TEMPLATE FAILED:", error);
    res.status(400).json({
      success: false,
      message: "Error updating salary template",
      error: error.message
    });
  }
};

// @desc    Delete a salary template
// @route   DELETE /api/salary-templates/:id
exports.deleteTemplate = async (req, res) => {
  try {
    const template = await SalaryTemplate.findByIdAndDelete(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Salary template not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Salary template deleted successfully'
    });
  } catch (error) {
    console.error("❌ DELETE TEMPLATE FAILED:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting salary template",
      error: error.message
    });
  }
};

// @desc    Export salary templates to Excel
// @route   GET /api/salary-templates/export
exports.exportTemplates = async (req, res) => {
  try {
    const templates = await SalaryTemplate.find({});
    // Here you would typically use a library like exceljs to create the Excel file
    // For now, we'll just return the data
    res.status(200).json({
      success: true,
      data: templates,
      message: "Export functionality would be implemented here"
    });
  } catch (error) {
    console.error("❌ EXPORT TEMPLATES FAILED:", error);
    res.status(500).json({
      success: false,
      message: "Server error while exporting salary templates",
      error: error.message
    });
  }
};