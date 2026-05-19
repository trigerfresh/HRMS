const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let dest = 'uploads/';
    if (file.fieldname.includes('educationalDocuments')) {
      dest = 'uploads/educational_documents/';
    } else if (file.fieldname === 'cancelledChequeFile') {
      dest = 'uploads/bank_documents/';
    } else if (file.fieldname === 'excelFile') {     // especially for excel uploads
       dest = 'uploads/excels/';
    }
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf|xlsx|xls/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Error: File upload only supports the following filetypes: ' + filetypes));
  }
});

module.exports = upload;
