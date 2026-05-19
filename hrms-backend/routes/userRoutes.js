const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const multer = require("multer");
const authMiddleware = require("../middleware/authMiddleware");

// Multer setup for profile image uploads
const storage = multer.diskStorage({
  // The destination function now checks if the directory exists
  destination: (req, file, cb) => {
    const uploadPath = "uploads/profiles/";
    // This is a good practice, though manual creation is the main fix
    require("fs").mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `user-${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage: storage });

// Define User routes
router.get("/", userController.getUsers);
router.post(
  "/",
  authMiddleware,
  upload.single("profileImage"),
  userController.createUser
);
router.delete("/:id", authMiddleware, userController.deleteUser);
router.put(
  "/:id",
  authMiddleware,
  upload.single("profileImage"),
  userController.updateUser
);

// Helper routes
router.get("/roles", userController.getRoles);
router.get("/export", userController.exportUsersToExcel);

module.exports = router;
