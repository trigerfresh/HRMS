const mongoose = require("mongoose");
const dotenv = require("dotenv");

const Role = require("./models/Role");
const Module = require("./models/Module");
const Permission = require("./models/Permission");

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected...");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

const fixAdminPermissions = async () => {
  try {
    console.log("Starting the permission fixing process...");

    const adminRole = await Role.findOne({ name: "Admin" });
    if (!adminRole) throw new Error("'Admin' role not found.");
    console.log(`Step 1: Found 'Admin' role with ID: ${adminRole._id}`);

    const allModules = await Module.find({});
    if (allModules.length === 0) throw new Error("No modules found.");
    console.log(`Step 2: Found ${allModules.length} modules.`);

    // Safety sathi adhi permissions delete karu
    await Permission.deleteMany({ roleId: adminRole._id });
    console.log(`Step 3: Cleared old permissions for the Admin role.`);

    // ==========================================================
    // == ITHE 'canAccess: true' ADD HOTE (HA MAHATVACHA BHAG AHE) ==
    // ==========================================================
    const permissionsToCreate = allModules.map(module => ({
      roleId: adminRole._id,
      moduleId: module._id,
      submodules: module.submodules.map(sm => ({
        submoduleName: sm.name,
        canAccess: true, // <-- HI LINE TUMCHA PROBLEM SOLVE KAREL
      })),
    }));

    await Permission.insertMany(permissionsToCreate);
    
    console.log("\n\x1b[32m%s\x1b[0m", `✅ Success! ${permissionsToCreate.length} permissions created with 'canAccess: true' field.`);
    process.exit();

  } catch (error) {
    console.error("\n❌ An error occurred:", error.message);
    process.exit(1);
  }
};

connectDB().then(() => {
    fixAdminPermissions();
});