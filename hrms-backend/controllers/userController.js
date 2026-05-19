// hrms-backend/controllers/userController.js (New File)
const User = require("../models/User");
const Role = require("../models/Role"); // We need this to populate roles dropdown
const xlsx = require("xlsx"); // <-- ADD THIS LINE FOR EXPORT TO WORK

exports.getUsers = async (req, res) => {
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
      to.setHours(23, 59, 59, 999); // include the entire end day

      if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
        query.created_on = { $gte: from, $lte: to };
      }
    }

    const users = await User.find(query)
      .populate("company", "companyName")
      .populate("created_by", "name")
      .populate("branch", "branchName")
      .populate("roleId", "name")
      .populate("selectedClients", "companyName")
      .sort({ created_on: -1 });
    res.status(200).json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
};

// 2. Create a New User
exports.createUser = async (req, res) => {
  try {
    // console.log(req.body, req.user);
    const userData = { ...req.body };

    if (req.file) {
      userData.profileImage = req.file.path;
    }
    userData.created_by = req.user.id;

    // Parse selectedClients if it's a string
    if (typeof userData.selectedClients === "string") {
      userData.selectedClients = JSON.parse(userData.selectedClients);
    }

    const emailExist = await User.findOne({
      email: userData.email,
    });
    if (emailExist) {
      return res.status(400).json({ message: "Email ID already exists" });
    }

    const newUser = new User(userData);
    // console.log(newUser);
    await newUser.save();
    res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (error) {
    console.error("CREATE USER FAILED:", error);
    res
      .status(500)
      .json({ message: "Error creating user", error: error.message });
  }
};

// 3. Update a User
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = { ...req.body, created_by: req.body.created_by._id };

    // 1. Handle profile image update
    if (req.file) {
      updateData.profileImage = req.file.path;
    }
    // 1. Handle profile image update
    if (req.file) {
      updateData.profileImage = req.file.path;
    }

    // 1.5: Ensure profileImage is a string (not array)
    if (Array.isArray(updateData.profileImage)) {
      updateData.profileImage = updateData.profileImage[0];
    }

    // 2. Prevent password from being overwritten with an empty value
    if (
      updateData.password === "" ||
      updateData.password === null ||
      updateData.password === undefined
    ) {
      delete updateData.password;
    } else {
      // Hash new password
      const bcrypt = require("bcryptjs");
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    // 3. Handle selectedClients array update
    if (typeof updateData.selectedClients === "string") {
      updateData.selectedClients = JSON.parse(updateData.selectedClients);
    }

    // 4. Add modified info
    updateData.modified_on = new Date();
    updateData.modified_by = req.user.id;

    const emailExist = await User.findOne({
      email: updateData.email,
      _id: { $ne: req.params.id },
    });
    if (emailExist) {
      return res.status(400).json({ message: "Email ID already exists" });
    }
    // 5. Find the user by ID and update it
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res
      .status(200)
      .json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.error("UPDATE USER FAILED:", error);
    res
      .status(500)
      .json({ message: "Error updating user", error: error.message });
  }
};

// ... (other functions like deleteUser, getRoles, etc.)

// 4. Delete a User
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const username = req.user?.id; // user performing the delete

    const deletedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          active: 1,
          disabled_on: new Date(),
          disabled_by: username,
        },
      },
      { new: true } // return the updated document
    );

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res
      .status(200)
      .json({ message: "User deleted successfully", user: deletedUser });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
};

// Helper function to get all roles for the form dropdown
exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find({});
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: "Error fetching roles" });
  }
};

// 5. EXPORT Users to Excel (NEW FUNCTION)
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

exports.exportUsersToExcel = async (req, res) => {
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

    const users = await User.find(query)
      .populate("company", "companyName")
      .populate("created_by", "name")
      .populate("branch", "branchName")
      .populate("roleId", "name")
      .populate("selectedClients", "companyName")
      .sort({ created_on: -1 });

    // DEFINE HEADERS
    const headers = [
      "Name",
      "Email ID",
      "Contact No",
      "Address",
      "City",
      "Pincode",
      "Role",
      "Company",
      "Branch",
      "Clients",
      "Created On",
    ];

    // PREPARE ROWS
    const excelRows = users.map((u) => [
      u.name || "",
      u.email || "",
      u.contactNo || "",
      u.address || "",
      u.city || "",
      u.pincode || "",
      u.roleId?.name || "",
      u.company?.companyName || "",
      u.branch?.branchName || "",
      u.selectedClients.map((c) => c.companyName).join(", "),
      u.created_on ? formatDateForExcel(u.created_on) : "",
    ]);

    // Final sheet data (headers + rows)
    const finalSheetData = [headers, ...excelRows];

    // CREATE WORKBOOK
    const worksheet = xlsx.utils.aoa_to_sheet(finalSheetData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Users");

    // Random 10-digit number
    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);
    const fileName = `Users_${randomNumber}.xlsx`;

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
    console.error("DOWNLOAD USERS EXCEL ERROR:", error);
    res.status(500).json({ message: "Failed to download Excel" });
  }
};
