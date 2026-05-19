const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware"); // Surakshe sathi middleware import kara

// clientController madhun sarva functions import kara
const {
  createClient,
  getAllClients,
  getClientById,
  deleteClient,
  updateClientDetails,
  updateClientBankDetails,
  updateClientSiteDetails,
  addClientSite,
  deleteClientSite,
  getSitesByClientIds,
  getSitesByClientId,
  exportClientsToExcel,
  addWORates,
  getWORates,
  updateWagesSettings,
  getSiteBySiteId,
} = require("../controllers/clientController");

// --- Routes Definition ---

// He 'authMiddleware' ya route var aani tyachya nantar yenarya sarva routes var lagu hoil.
// Yane he sunishchit hote ki fakt logged-in user ch client data access karu shakto.
router.use(authMiddleware);

// Route for '/' (GET for fetching all, POST for creating one)
router
  .route("/")
  .get(getAllClients) // Path: GET /api/clients
  .post(createClient); // Path: POST /api/clients

router.get("/export", exportClientsToExcel);

// Route for '/:id' (GET for one, PUT for update, DELETE for one)
router
  .route("/:id")
  .get(getClientById) // Path: GET /api/clients/123
  .delete(deleteClient); // Path: DELETE /api/clients/123

router.route("/:clientId/site").post(addClientSite);

router.route("/updateClient/:id").put(updateClientDetails);
router.route("/updateClientBank/:id").put(updateClientBankDetails);
router
  .route("/updateClientSite/:clientId/:siteId")
  .put(updateClientSiteDetails);
router.route("/getWagesSettings/:id").get(getSiteBySiteId);
router.route("/updateWagesSettings/:clientId/:siteId").put(updateWagesSettings);
router.route("/getWORates/:siteId").get(getWORates);
router.route("/addWORates/:clientId/:siteId").put(addWORates);
router.route("/deleteClientSite/:siteId").delete(deleteClientSite);

// Route for Sites of Clients in User Form
router.route("/sites/by-client-ids").post(getSitesByClientIds);

//Route for Site in Employee Form
router.get("/client/:clientId", getSitesByClientId);
module.exports = router;
