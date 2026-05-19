// hrms-backend/controllers/vendorsController.js (Full Updated Code)
const xlsx = require("xlsx");
const VendorsMaster = require("../models/VendorsMaster");

// 1. Create Vendors
exports.createVendor = async (req, res) => {
  try {
    // console.log(req.body, req.user);
    const newVendor = { ...req.body };
    newVendor.created_by = req.user.id;

    const vendorsEmailExist = await VendorsMaster.findOne({
      emailId: newVendor.emailId,
    });
    // console.log(vendorsEmailExist);
    if (vendorsEmailExist) {
      return res.status(400).json({ message: "Email ID already exists" });
    }
    const vendors = new VendorsMaster(newVendor);
    await vendors.save();
    res
      .status(201)
      .json({ message: "Vendors created successfully", vendors: vendors });
  } catch (error) {
    console.error("CREATE VENDORS FAILED:", error);
    res
      .status(500)
      .json({ message: "Error creating vendors", error: error.message });
  }
};

// 2. Get All Vendors (with Search & Population)
exports.getVendors = async (req, res) => {
  try {
    const { searchFields, fromDate, toDate } = req.query;
    let query = { active: 0 };

    if (searchFields) {
      const fields = JSON.parse(searchFields);
      fields.forEach((field) => {
        if (
          field.field &&
          field.keyword !== undefined &&
          field.keyword !== null
        ) {
          const value = String(field.keyword).trim();

          if (field.field === "contactNo") {
            query.$expr = {
              $regexMatch: {
                input: { $toString: `$${field.field}` },
                regex: value,
                options: "i",
              },
            };
          } else {
            query[field.field] = { $regex: value, $options: "i" };
          }
        }
      });
    }

    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);

      if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
        query.created_on = { $gte: from, $lte: to };
      }
    }

    const vendors = await VendorsMaster.find(query)
      .populate("created_by", "name")
      .sort({ created_on: -1 });

    res.status(200).json(vendors);
  } catch (error) {
    console.error("FETCHING VENDORS FAILED:", error);

    res
      .status(500)
      .json({ message: "Error fetching vendors", error: error.message });
  }
};

exports.searchVendors = async (req, res) => {
  try {
    let { keyword } = req.query;

    const vendors = await VendorsMaster.find({
      vendorName: { $regex: keyword, $options: "i" },
      active: 0
    })
      .limit(10)
      .select("vendorName address gstNo state stateCode");

    res.json(vendors);
  } catch (err) {
    console.error("SEARCH VENDOR FAILED:", err);
    res.status(500).json({ message: "Vendor search failed" });
  }
};

// 3. Update Vendors
exports.updateVendors = async (req, res) => {
  try {
    // console.log(req.body);
    const updatedData = { ...req.body, created_by: req.body.created_by._id };

    // Handle companyId array when sent as JSON string (from FormData)
    if (req.body.companyId) {
      try {
        if (typeof req.body.companyId === "string") {
          updatedData.companyId = JSON.parse(req.body.companyId);
        }
      } catch (parseError) {
        console.error("Invalid companyId JSON:", parseError);
        return res.status(400).json({ message: "Invalid companyId format" });
      }
    }

    if (req.user?.id) {
      updatedData.modified_by = req.user.id;
    }
    updatedData.modified_on = new Date();
    // console.log(updatedData);
    const vendorsEmailExist = await VendorsMaster.findOne({
      emailId: updatedData.emailId,
      _id: { $ne: req.params.id },
    });
    if (vendorsEmailExist) {
      return res.status(400).json({ message: "Email ID already exists" });
    }

    // console.log(updatedData);
    const updatedVendors = await VendorsMaster.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    if (!updatedVendors) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.status(200).json({
      message: "Vendors updated successfully",
      vendors: updatedVendors,
    });
  } catch (error) {
    console.error("UPDATE VENDOR FAILED:", error);
    res.status(500).json({
      message: "Error updating vendors",
      error: error.message,
    });
  }
};

// 4. Delete Vendors
exports.deleteVendors = async (req, res) => {
  try {
    const updatedVendors = await VendorsMaster.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          active: 1,
          disabled_on: new Date(),
          disabled_by: req.user.id,
        },
      },
      { new: true }
    );
    // console.log(req.params, updatedVendors);

    if (!updatedVendors) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.status(200).json({
      message: "Vendor deactivated successfully",
      vendors: updatedVendors,
    });
  } catch (error) {
    console.error("DELETE VENDOR FAILED:", error);
    res.status(500).json({
      message: "Error deactivating vendors",
      error: error.message,
    });
  }
};

function formatDateForExcel(val) {
  if (!val && val !== 0) return "";
  if (val instanceof Date && !isNaN(val.getTime())) {
    const d = val;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }
  // If it's a string, return as-is
  return String(val);
}

// 5. Export to Excel
exports.exportVendorsToExcel = async (req, res) => {
  try {
    const { searchFields, fromDate, toDate } = req.query;

    let query = { active: 0 };

    if (searchFields) {
      const fields = JSON.parse(searchFields);
      fields.forEach((field) => {
        if (field.field && field.keyword) {
          query[field.field] = new RegExp(field.keyword, "i");
        }
      });
    }

    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      query.created_on = { $gte: from, $lte: to };
    }

    const vendors = await VendorsMaster.find(query)
      .populate("created_by", "name")
      .sort({ created_on: -1 });

    // DEFINE HEADERS
    const headers = [
      "Vendor/Company Name",
      "Email ID",
      "Contact No",
      "Address",
      "State",
      "State Code",
      "Contactable Person Name",
      "Contactable Person Pancard No",
      "GST No",
      "Account No",
      "Bank Name",
      "IFSC Code",
      "Branch Name",
      "Created On",
    ];

    // PREPARE ROWS
    const excelRows = vendors.map((v) => [
      v.vendorName || "",
      v.emailId || "",
      v.contactNo || "",
      v.address || "",
      v.state || "",
      v.stateCode || "",
      v.contactablePersonName || "",
      v.contactablePersonPanNo || "",
      v.gstNo || "",
      v.accountNo || "",
      v.bankName || "",
      v.ifscCode || "",
      v.branchName || "",
      v.created_on ? formatDateForExcel(v.created_on) : "",
    ]);

    // Final sheet data (headers + rows)
    const finalSheetData = [headers, ...excelRows];

    // CREATE WORKBOOK
    const worksheet = xlsx.utils.aoa_to_sheet(finalSheetData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Vendors");

    // Random 10-digit number
    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);
    const fileName = `Vendors_${randomNumber}.xlsx`;

    // Write to buffer
    const excelBuffer = xlsx.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(excelBuffer);
  } catch (error) {
    console.error("DOWNLOAD VENDORS EXCEL ERROR:", error);
    res.status(500).json({ message: "Failed to download Excel" });
  }
};
