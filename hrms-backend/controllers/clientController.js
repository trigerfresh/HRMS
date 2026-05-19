const Client = require("../models/Client");
const User = require("../models/User");
const SiteDetail = require("../models/SiteDetail");
const ChargesByRank = require("../models/ChargesByRank");
const OtherCharges = require("../models/OtherCharges");
const mongoose = require("mongoose");
const xlsx = require("xlsx");
const WORateChart = require("../models/WORateChart");
const Employee = require("../models/Employee");

// @desc    Create a new client
// @route   POST /api/clients

exports.createClient = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const createdBy = req.user.id;
    const {
      companyName,
      contactPersonName,
      contactNo,
      emailId,
      address,
      city,
      state,
      pincode,
      gstStateCode,
      gstNo,
      sacCode,
      billingCompany,
      companyBankName,
      otherInfo,
      termsAndConditions,
      bankName,
      accountNo,
      ifscCode,
      micrCode,
      branch,
      bankCity,
      // bankDetails = [],
      sites = [],
    } = req.body;

    // console.log(bankDetails, req.)

    // 🔍 Check duplicates
    const [clientExist, emailExist] = await Promise.all([
      Client.findOne({ companyName }),
      Client.findOne({ emailId }),
    ]);

    if (clientExist)
      return res.status(400).json({ message: "Company name already exists" });
    if (emailExist)
      return res.status(400).json({ message: "Email ID already exists" });

    // 🔹 Generate site-level code (unique per site)
    const siteCount = await SiteDetail.countDocuments();
    let currentSiteNumber = siteCount; // track for multiple sites in same request

    const clientBankDetails = {
      bankName: bankName || "",
      accountNo: accountNo || "",
      ifscCode: ifscCode || "",
      branch: branch || "",
      city: bankCity || "",
      micrCode: micrCode || "",
    };

    const normalizedBillingCompany =
      billingCompany && billingCompany.trim() !== ""
        ? billingCompany
        : undefined;

    const normalizedCompanyBankName =
      companyBankName && String(companyBankName).trim() !== ""
        ? companyBankName
        : undefined;

    // 🔹 Create Client
    const newClient = await Client.create(
      [
        {
          companyName,
          contactPersonName,
          contactNo,
          emailId,
          address,
          city,
          state,
          pincode,
          gstStateCode,
          gstNo,
          sacCode,
          billingCompany: normalizedBillingCompany,
          companyBankName: normalizedCompanyBankName,
          otherInfo,
          termsAndConditions,
          bankDetails: clientBankDetails,
          created_by: createdBy,
        },
      ],
      { session }
    );

    const client = newClient[0];

    // 🔹 Save each site, then rates & other details linked to it
    for (const s of sites) {
      currentSiteNumber += 1;
      const clientCode = `C${String(currentSiteNumber).padStart(3, "0")}`;

      const siteDoc = await SiteDetail.create(
        [
          {
            clientId: client._id,
            siteName: s.siteName,
            workOrderNo: s.workOrderNo,
            clientCode: clientCode,
            contactPersonName: s.contactPersonName,
            contactNo: s.contactNo,
            emailId: s.emailId,
            address: s.address,
            billingAddress: s.billingAddress,
            city: s.city,
            state: s.state,
            country: s.country,
            locationName: s.locationName,
            locationStartDate: s.locationStartDate
              ? new Date(s.locationStartDate)
              : null,
            salesPersonName: s.salesPersonName,
            salesPersonEmailId: s.salesPersonEmailId,
            salesPersonContactNo: s.salesPersonContactNo,
            billCycleDate: s.billCycleDate,
            status: s.status,
            cgst: parseFloat(s.cgst) || 0,
            sgst: parseFloat(s.sgst) || 0,
            igst: parseFloat(s.igst) || 0,
            expectedBillingAmount: parseFloat(s.expectedBillingAmount) || 0,
            daysForBilling: parseInt(s.daysForBilling) || 0,
            viewOTHours: !!s.viewOTHours,
            attachWagesSHeet: !!s.attachWagesSHeet,
            roundOffAmount: !!s.roundOffAmount,
            billWithoutRank: !!s.billWithoutRank,
            created_by: createdBy,
          },
        ],
        { session }
      );

      const site = siteDoc[0];

      // 🔹 Insert ChargesByRank (Rates)
      if (Array.isArray(s.rates) && s.rates.length > 0) {
        const rateDocs = s.rates.map((r) => ({
          clientId: client._id,
          siteId: site._id,
          empType: r.empType,
          hours: Number(r.hours) || 0,
          nos: Number(r.nos) || 0,
          basic: Number(r.basic) || 0,
          hra: Number(r.hra) || 0,
          da: Number(r.da) || 0,
          specialAllowance: Number(r.specialAllowance) || 0,
          otherAllowance: Number(r.otherAllowance) || 0,
          lww: Number(r.lww) || 0,
          bonus: Number(r.bonus) || 0,
          costPerHeadGross: Number(r.costPerHeadGross) || 0,
          serviceChargesType: r.serviceChargesType,
          serviceCharges: Number(r.serviceCharges) || 0,
          perDayRate: Number(r.perDayRate) || 0,
          otRate: Number(r.otRate) || 0,
          leaveWages: Number(r.leaveWages) || 0,
          uniformWashing: Number(r.uniformWashing) || 0,
          anyOther: Number(r.anyOther) || 0,
          created_by: createdBy,
        }));
        await ChargesByRank.insertMany(rateDocs, { session });
      }

      // 🔹 Insert OtherCharges (Other Details)
      if (Array.isArray(s.otherDetails) && s.otherDetails.length > 0) {
        const otherDocs = s.otherDetails.map((d) => ({
          clientId: client._id,
          siteId: site._id,
          typeOfServ: d.typeOfServ,
          chargesType: d.chargesType,
          charges: Number(d.charges) || 0,
          calcOn: d.calcOn,
          calcOperation: d.calcOperation,
          amountToCompare: d.amountToCompare,
          created_by: createdBy,
        }));
        await OtherCharges.insertMany(otherDocs, { session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Client and related data created successfully",
      data: client,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("CREATE CLIENT FAILED:", error);
    res.status(500).json({
      success: false,
      message: "Error creating client with sites and rates",
      error: error.message,
    });
  }
};

exports.addClientSite = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { clientId } = req.params;
    const userId = req.user.id; // from auth middleware
    const siteData = req.body[0];

    // 1️⃣ Validate client existence
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    // 2️⃣ Generate new clientCode for this site
    const siteCount = await SiteDetail.countDocuments();
    const clientCode = `C${String(siteCount + 1).padStart(3, "0")}`;

    // 3️⃣ Create the new site
    const newSite = await SiteDetail.create(
      [
        {
          clientId,
          siteName: siteData.siteName,
          workOrderNo: siteData.workOrderNo,
          clientCode,
          contactPersonName: siteData.contactPersonName,
          address: siteData.address,
          billingAddress: siteData.billingAddress,
          contactNo: siteData.contactNo,
          emailId: siteData.emailId,
          city: siteData.city,
          state: siteData.state,
          country: siteData.country,
          locationName: siteData.locationName,
          locationStartDate: siteData.locationStartDate
            ? new Date(siteData.locationStartDate)
            : null,
          salesPersonName: siteData.salesPersonName,
          salesPersonEmailId: siteData.salesPersonEmailId,
          salesPersonContactNo: siteData.salesPersonContactNo,
          billCycleDate: siteData.billCycleDate,
          status: siteData.status || "Active",
          cgst: parseFloat(siteData.cgst) || 0,
          sgst: parseFloat(siteData.sgst) || 0,
          igst: parseFloat(siteData.igst) || 0,
          expectedBillingAmount:
            parseFloat(siteData.expectedBillingAmount) || 0,
          daysForBilling: parseInt(siteData.daysForBilling) || 0,
          viewOTHours: !!siteData.viewOTHours,
          attachWagesSHeet: !!siteData.attachWagesSHeet,
          roundOffAmount: !!siteData.roundOffAmount,
          billWithoutRank: !!siteData.billWithoutRank,
          created_by: userId,
        },
      ],
      { session }
    );

    const site = newSite[0];

    // 4️⃣ Create otherDetails if provided
    let createdOtherDetails = [];
    if (
      Array.isArray(siteData.otherDetails) &&
      siteData.otherDetails.length > 0
    ) {
      const mappedOtherDetails = siteData.otherDetails.map((d) => ({
        clientId,
        siteId: site._id,
        typeOfServ: d.typeOfServ,
        chargesType: d.chargesType,
        charges: Number(d.charges) || 0,
        calcOn: d.calcOn,
        calcOperation: d.calcOperation,
        amountToCompare: d.amountToCompare,
        created_by: userId,
      }));

      createdOtherDetails = await OtherCharges.insertMany(mappedOtherDetails, {
        session,
      });
    }

    // 5️⃣ Create chargesByRank (rates) if provided
    let createdRates = [];
    if (Array.isArray(siteData.rates) && siteData.rates.length > 0) {
      const mappedRates = siteData.rates.map((r) => ({
        clientId,
        siteId: site._id,
        empType: r.empType,
        hours: Number(r.hours) || 0,
        nos: Number(r.nos) || 0,
        basic: Number(r.basic) || 0,
        hra: Number(r.hra) || 0,
        da: Number(r.da) || 0,
        specialAllowance: Number(r.specialAllowance) || 0,
        otherAllowance: Number(r.otherAllowance) || 0,
        lww: Number(r.lww) || 0,
        bonus: Number(r.bonus) || 0,
        costPerHeadGross: Number(r.costPerHeadGross) || 0,
        serviceChargesType: r.serviceChargesType,
        serviceCharges: Number(r.serviceCharges) || 0,
        perDayRate: Number(r.perDayRate) || 0,
        otRate: Number(r.otRate) || 0,
        leaveWages: Number(r.leaveWages) || 0,
        uniformWashing: Number(r.uniformWashing) || 0,
        anyOther: Number(r.anyOther) || 0,
        created_by: userId,
      }));

      createdRates = await ChargesByRank.insertMany(mappedRates, { session });
    }

    await session.commitTransaction();
    session.endSession();

    // Return everything
    res.status(201).json({
      success: true,
      message: "Site and related details added successfully",
      data: {
        site: newSite,
        otherDetails: createdOtherDetails,
        rates: createdRates,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("ADD CLIENT SITE FAILED:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding new site",
      error: error.message,
    });
  }
};

// @desc    Get all clients with search and filter
// @route   GET /api/clients

exports.getAllClients = async (req, res) => {
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

    const clients = await Client.find(query)
      .populate({
        path: "billingCompany",
        select: "companyName", // show billing company name
      })
      .populate({
        path: "companyBankName",
        select: "companyName bankDetails.bankName", // show bank info
      })
      .populate("created_by", "name")
      .sort({ created_on: -1 })
      .lean(); // plain JS objects

    const siteCounts = await SiteDetail.aggregate([
      { $match: { active: 0 } },
      { $group: { _id: "$clientId", count: { $sum: 1 } } },
    ]);

    const siteCountMap = siteCounts.reduce((acc, s) => {
      acc[s._id.toString()] = s.count;
      return acc;
    }, {});

    const employeeCounts = await Employee.aggregate([
      { $match: { active: 0 } },
      { $group: { _id: "$client", count: { $sum: 1 } } },
    ]);

    const employeeCountMap = employeeCounts.reduce((acc, s) => {
      acc[s._id.toString()] = s.count;
      return acc;
    }, {});

    const formatted = clients.map((client) => ({
      _id: client._id,
      companyName: client.companyName,
      contactPersonName: client.contactPersonName,
      contactNo: client.contactNo,
      emailId: client.emailId,
      billingCompany: client.billingCompany?.companyName || "",
      companyBankName:
        client.companyBankName?.companyName ||
        client.companyBankName?.bankDetails?.[0]?.bankName ||
        "",
      city: client.city,
      state: client.state,
      gstNo: client.gstNo || "—",
      totalSites: siteCountMap[client._id.toString()] || 0,
      totalEmployees: employeeCountMap[client._id.toString()] || 0,
      created_by: client.created_by?.name || "",
      created_on: client.created_on,
    }));

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("GET CLIENTS FAILED:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching clients",
      error: error.message,
    });
  }
};

// @desc    Get a single client by its ID
// @route   GET /api/clients/:id
exports.getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findById(id)
      .populate("created_by", "name")
      .populate("billingCompany", "companyName bankDetails")
      .populate(
        "companyBankName",
        "companyName bankDetails.bankName bankDetails.ifsc"
      )
      .lean();

    if (!client)
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });

    // console.log(id);
    const sites = await SiteDetail.find({ clientId: id, active: 0 })
      .lean()
      .populate("clientId", "companyName")
      .sort({ created_on: -1 });

    for (const site of sites) {
      site.rates = await ChargesByRank.find({
        siteId: site._id,
        active: 0,
      }).lean();
      site.otherDetails = await OtherCharges.find({
        siteId: site._id,
        active: 0,
      }).lean();
    }

    // console.log(client, sites);
    res.status(200).json({
      success: true,
      data: { ...client, sites },
    });
  } catch (error) {
    console.error("GET CLIENT BY ID FAILED:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching client details",
      error: error.message,
    });
  }
};

exports.getSitesByClientId = async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({ message: "clientId is required" });
    }

    // ✅ Convert to ObjectId safely
    const clientObjectId = new mongoose.Types.ObjectId(clientId);

    // ✅ Fetch all active sites for this client
    const sites = await SiteDetail.find({
      clientId: clientObjectId,
      active: 0, // Only active sites
    });

    if (!sites || sites.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No active sites found for this client",
      });
    }

    res.status(200).json({
      success: true,
      message: "Sites fetched successfully",
      data: sites,
    });
  } catch (error) {
    console.error("FETCH SITES BY CLIENT ID FAILED:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching sites for client",
      error: error.message,
    });
  }
};

exports.getSitesByClientIds = async (req, res) => {
  try {
    const { clientIds } = req.body;
    // console.log(req.body);
    if (!clientIds || !Array.isArray(clientIds)) {
      return res.status(400).json({ message: "clientIds must be an array" });
    }

    // ✅ Properly convert to ObjectId
    const ids = clientIds.map(
      (idObj) => new mongoose.Types.ObjectId(idObj.$oid || idObj)
    );

    const sites = await SiteDetail.find({
      clientId: { $in: ids },
      active: 0, // Only active sites
    });

    res.status(200).json({ success: true, data: sites });
  } catch (error) {
    console.error("FETCH SITES BY CLIENT IDS FAILED:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching sites by client IDs",
      error: error.message,
    });
  }
};

// @desc    Update an existing client by its ID
// @route   PUT /api/clients/:id

exports.updateClientDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const {
      companyName,
      contactPersonName,
      contactNo,
      emailId,
      address,
      city,
      state,
      pincode,
      gstStateCode,
      gstNo,
      sacCode,
      billingCompany,
      companyBankName,
      otherInfo,
      termsAndConditions,
    } = req.body;

    const normalizedBillingCompany =
      billingCompany && billingCompany !== "" ? billingCompany : undefined;
    const normalizedCompanyBankName =
      companyBankName && companyBankName !== "" ? companyBankName : undefined;

    // 🔍 Check duplicates
    const [clientExist, emailExist] = await Promise.all([
      Client.findOne({ companyName, _id: { $ne: req.params.id } }),
      Client.findOne({ emailId, _id: { $ne: req.params.id } }),
    ]);

    if (clientExist)
      return res.status(400).json({ message: "Company name already exists" });
    if (emailExist)
      return res.status(400).json({ message: "Email ID already exists" });

    const updatedClient = await Client.findByIdAndUpdate(
      id,
      {
        companyName,
        contactPersonName,
        contactNo,
        emailId,
        address,
        city,
        state,
        pincode,
        gstStateCode,
        gstNo,
        sacCode,
        billingCompany: normalizedBillingCompany,
        companyBankName: normalizedCompanyBankName,
        otherInfo,
        termsAndConditions,
        modified_by: userId,
        modified_on: new Date(),
      },
      { new: true }
    ).populate("billingCompany", "companyName");

    if (!updatedClient) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });
    }

    res.status(200).json({
      success: true,
      message: "Client details updated successfully",
      data: updatedClient,
    });
  } catch (error) {
    console.error("UPDATE CLIENT DETAILS FAILED:", error);
    res.status(500).json({
      success: false,
      message: "Error updating client details",
      error: error.message,
    });
  }
};

exports.updateClientBankDetails = async (req, res) => {
  try {
    console.log(req.params, "Params");
    const { id } = req.params;
    const userId = req.userid;

    const bank = req.body;

    const bankDetails = {
      bankName: bank.bankName || "",
      accountNo: bank.accountNo || "",
      ifscCode: bank.ifscCode || "",
      branch: bank.branch || "",
      city: bank.bankCity || bank.city || "",
      micrCode: bank.micrCode || "",
    };

    const updatedClient = await Client.findByIdAndUpdate(
      id,
      {
        bankDetails,
        modified_by: userId,
        modified_on: new Date(),
      },
      { new: true }
    );

    if (!updatedClient) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });
    }

    res.status(200).json({
      success: true,
      message: "Bank details updated successfully",
      data: updatedClient.bankDetails,
    });
  } catch (error) {
    console.error("UPDATE BANK DETAILS FAILED:", error);
    res.status(500).json({
      success: false,
      message: "Error updating bank details",
      error: error.message,
    });
  }
};

exports.updateClientSiteDetails = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { clientId, siteId } = req.params;
    const userId = req.user.id;
    const siteData = req.body;

    // ===== Update Site Info =====
    const updatedSite = await SiteDetail.findByIdAndUpdate(
      siteId,
      {
        ...siteData,
        locationStartDate: siteData.locationStartDate
          ? new Date(siteData.locationStartDate)
          : null,
        cgst: parseFloat(siteData.cgst) || 0,
        sgst: parseFloat(siteData.sgst) || 0,
        igst: parseFloat(siteData.igst) || 0,
        expectedBillingAmount: parseFloat(siteData.expectedBillingAmount) || 0,
        daysForBilling: parseInt(siteData.daysForBilling) || 0,
        modified_by: userId,
        modified_on: new Date(),
      },
      { new: true, session }
    );

    if (!updatedSite) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({ success: false, message: "Site not found" });
    }

    if (Array.isArray(siteData.rates)) {
      const rates = siteData.rates;
      const existingRates = await ChargesByRank.find({ siteId }).session(
        session
      );
      const existingRateIds = existingRates.map((r) => r._id.toString());
      const incomingRateIds = rates.filter((r) => r._id).map((r) => r._id);
      const bulkOps = [];

      for (const rate of rates) {
        if (rate._id && existingRateIds.includes(rate._id)) {
          // Update existing
          bulkOps.push({
            updateOne: {
              filter: { _id: rate._id },
              update: {
                $set: {
                  ...rate,
                  hours: Number(rate.hours) || 0,
                  nos: Number(rate.nos) || 0,
                  basic: Number(rate.basic) || 0,
                  hra: Number(rate.hra) || 0,
                  da: Number(rate.da) || 0,
                  specialAllowance: Number(rate.specialAllowance) || 0,
                  otherAllowance: Number(rate.otherAllowance) || 0,
                  lww: Number(rate.lww) || 0,
                  bonus: Number(rate.bonus) || 0,
                  costPerHeadGross: Number(rate.costPerHeadGross) || 0,
                  serviceChargesType: rate.serviceChargesType,
                  serviceCharges: Number(rate.serviceCharges) || 0,
                  perDayRate: Number(rate.perDayRate) || 0,
                  otRate: Number(rate.otRate) || 0,
                  leaveWages: Number(rate.leaveWages) || 0,
                  uniformWashing: Number(rate.uniformWashing) || 0,
                  anyOther: Number(rate.anyOther) || 0,
                  modified_by: userId,
                  modified_on: new Date(),
                  active: 0,
                },
              },
            },
          });
        } else {
          // Insert new
          bulkOps.push({
            insertOne: {
              document: {
                ...rate,
                hours: Number(rate.hours) || 0,
                nos: Number(rate.nos) || 0,
                basic: Number(rate.basic) || 0,
                hra: Number(rate.hra) || 0,
                da: Number(rate.da) || 0,
                specialAllowance: Number(rate.specialAllowance) || 0,
                otherAllowance: Number(rate.otherAllowance) || 0,
                lww: Number(rate.lww) || 0,
                bonus: Number(rate.bonus) || 0,
                costPerHeadGross: Number(rate.costPerHeadGross) || 0,
                serviceChargesType: rate.serviceChargesType,
                serviceCharges: Number(rate.serviceCharges) || 0,
                perDayRate: Number(rate.perDayRate) || 0,
                otRate: Number(rate.otRate) || 0,
                leaveWages: Number(rate.leaveWages) || 0,
                uniformWashing: Number(rate.uniformWashing) || 0,
                anyOther: Number(rate.anyOther) || 0,
                clientId,
                siteId,
                created_by: userId,
                active: 0,
              },
            },
          });
        }
      }

      // Soft delete removed ones
      const ratesToDeactivate = existingRateIds.filter(
        (id) => !incomingRateIds.includes(id)
      );
      if (ratesToDeactivate.length) {
        bulkOps.push({
          updateMany: {
            filter: { _id: { $in: ratesToDeactivate } },
            update: {
              $set: {
                active: 1,
                modified_by: userId,
                modified_on: new Date(),
              },
            },
          },
        });
      }

      if (bulkOps.length) await ChargesByRank.bulkWrite(bulkOps, { session });
    }

    // ============================
    // HANDLE OTHER CHARGES
    // ============================
    if (Array.isArray(siteData.otherDetails)) {
      const details = siteData.otherDetails;
      const existingDetails = await OtherCharges.find({ siteId }).session(
        session
      );
      const existingDetailIds = existingDetails.map((d) => d._id.toString());
      const incomingDetailIds = details.filter((d) => d._id).map((d) => d._id);
      const bulkOps = [];

      for (const detail of details) {
        if (detail._id && existingDetailIds.includes(detail._id)) {
          // Update existing
          bulkOps.push({
            updateOne: {
              filter: { _id: detail._id },
              update: {
                $set: {
                  ...detail,
                  charges: Number(detail.charges) || 0,
                  modified_by: userId,
                  modified_on: new Date(),
                  active: 0,
                },
              },
            },
          });
        } else {
          // Insert new
          bulkOps.push({
            insertOne: {
              document: {
                ...detail,
                charges: Number(detail.charges) || 0,
                clientId,
                siteId,
                created_by: userId,
                active: 0,
              },
            },
          });
        }
      }

      // Soft delete removed ones
      const detailsToDeactivate = existingDetailIds.filter(
        (id) => !incomingDetailIds.includes(id)
      );
      if (detailsToDeactivate.length) {
        bulkOps.push({
          updateMany: {
            filter: { _id: { $in: detailsToDeactivate } },
            update: {
              $set: {
                active: 1,
                modified_by: userId,
                modified_on: new Date(),
              },
            },
          },
        });
      }

      if (bulkOps.length) await OtherCharges.bulkWrite(bulkOps, { session });
    }

    // ===== Commit =====
    await session.commitTransaction();
    session.endSession();

    // Re-fetch updated data for response
    const updatedRates = await ChargesByRank.find({ siteId });
    const updatedOtherDetails = await OtherCharges.find({ siteId });

    res.status(200).json({
      success: true,
      message: "Site details updated successfully",
      site: updatedSite,
      rates: updatedRates,
      otherDetails: updatedOtherDetails,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("UPDATE SITE DETAILS FAILED:", error);
    res.status(500).json({
      success: false,
      message: "Error updating site details",
      error: error.message,
    });
  }
};

// @desc    Delete a client by its ID
// @route   DELETE /api/clients/:id
exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(
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

    if (!client) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Client deleted successfully" });
  } catch (error) {
    console.error("DELETE CLIENT FAILED:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting client.",
      error: error.message,
    });
  }
};

exports.deleteClientSite = async (req, res) => {
  // console.log(req.params);
  try {
    const site = await SiteDetail.findByIdAndUpdate(
      req.params.siteId,
      {
        $set: {
          active: 1,
          disabled_on: new Date(),
          disabled_by: req.user.id,
        },
      },
      { new: true }
    );

    if (!site) {
      return res
        .status(404)
        .json({ success: false, message: "Site not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Client deleted successfully" });
  } catch (error) {
    console.error("DELETE CLIENT FAILED:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting client.",
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

exports.exportClientsToExcel = async (req, res) => {
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

    // 1. FETCH CLIENTS
    const clients = await Client.find(query)
      .populate({
        path: "billingCompany",
        select: "companyName",
      })
      .populate({
        path: "companyBankName",
        select: "companyName bankDetails.bankName",
      })
      .lean();

    // 2. FETCH SITES GROUPED BY CLIENT ID
    const sites = await SiteDetail.find({ active: 0 })
      .sort({ created_on: -1 })
      .lean();

    // Map sites by clientId
    const siteMap = {};
    sites.forEach((s) => {
      if (!siteMap[s.clientId]) siteMap[s.clientId] = [];
      siteMap[s.clientId].push(s);
    });

    // 3. HEADERS
    const headers = [
      "Client Name",
      "Client Code",
      "Client Contact Person",
      "Client Contact No",
      "Client GST No",
      "Site Name",
      "Site Contact Person",
      "Site Address",
      "Site Contact No",
      "Site Email ID",
      "Created On",
    ];

    // 4. PREPARE ROWS
    const excelRows = [];

    clients.forEach((client) => {
      const clientSites = siteMap[client._id] || [];
      clientSites.forEach((site) => {
        excelRows.push([
          client.companyName || "",
          site.clientCode || "",
          client.contactPersonName || "",
          client.contactNo || "",
          client.gstNo || "",
          site.siteName || "",
          site.contactPersonName || "",
          site.address || "",
          site.contactNo || "",
          site.emailId || "",
          formatDateForExcel(client.created_on),
        ]);
      });
    });

    // 5. BUILD EXCEL DATA
    const sheetData = [headers, ...excelRows];

    const worksheet = xlsx.utils.aoa_to_sheet(sheetData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Client Sites");

    // 6. RANDOM 10-DIGIT NUMBER IN FILENAME
    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);
    const fileName = `ClientSites_${randomNumber}.xlsx`;

    const excelBuffer = xlsx.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // 7. SEND FILE
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    return res.send(excelBuffer);
  } catch (error) {
    console.error("EXPORT CLIENT-SITE ERR:", error);
    return res
      .status(500)
      .json({ message: "Failed to generate client-site report" });
  }
};

exports.getWORates = async (req, res) => {
  try {
    // console.log(req.params);
    let query = { active: 0 };
    query.siteId = req.params.siteId;
    const woRates = await WORateChart.find(query).sort({ created_on: 1 });

    // console.log(woRates);
    res.status(200).json(woRates);
  } catch (e) {
    console.error("GET WO RATES FAILED:", e);
    res.status(500).json({
      success: false,
      message: "Server error fetching WO Rates",
      error: e.message,
    });
  }
};

exports.addWORates = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const clientId = req.params.clientId;
    const siteId = req.params.siteId;
    // console.log(req.body, clientId, siteId);

    const woRates = req.body;
    if (Array.isArray(woRates)) {
      const existingOrder = await WORateChart.find({
        clientId,
        siteId,
      }).session(session);

      const existingOrderIds = existingOrder.map((o) => o._id.toString());
      const incomingIds = woRates
        .filter((o) => o._id)
        .map((o) => o._id.toString());

      const bulkOps = [];

      for (const o of woRates) {
        if (o._id && existingOrderIds.includes(o._id.toString())) {
          bulkOps.push({
            updateOne: {
              filter: { _id: o._id },
              update: {
                $set: {
                  woType: o.woType || "",
                  size: o.size || "",
                  fromWt: o.fromWt || "",
                  toWt: o.toWt || "",
                  type: o.type || "",
                  equipmentType: o.equipmentType || "",
                  examPer: o.examPer || "",
                  rate: o.rate || "",
                  modified_by: req.user.id,
                  modified_on: new Date(),
                },
              },
            },
          });
        } else {
          bulkOps.push({
            insertOne: {
              document: {
                clientId,
                siteId,
                woType: o.woType || "",
                size: o.size || "",
                fromWt: o.fromWt || "",
                toWt: o.toWt || "",
                type: o.type || "",
                equipmentType: o.equipmentType || "",
                examPer: o.examPer || "",
                rate: o.rate || "",
                created_by: req.user.id,
                active: 0,
              },
            },
          });
        }
      }

      const woRatesToDelete = existingOrderIds.filter(
        (id) => !incomingIds.includes(id)
      );

      if (woRatesToDelete.length > 0) {
        bulkOps.push({
          updateMany: {
            filter: {
              _id: { $in: woRatesToDelete },
            },
            update: {
              $set: {
                active: 1,
                disabled_by: req.user.id,
                disabled_on: new Date(),
              },
            },
          },
        });
      }

      // console.log(JSON.stringify(bulkOps, null, 2));
      if (bulkOps.length) await WORateChart.bulkWrite(bulkOps, { session });
    }
    await session.commitTransaction();
    session.endSession();
    return res.status(200).json({
      success: true,
      message: "Work order rates added successfully!",
    });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    console.error("WO Rate Chart Error: ", e);
    res
      .status(500)
      .json({ message: "Error adding WO Rates", error: e.message });
  }
};

exports.getSiteBySiteId = async (req, res) => {
  try {
    // console.log(req.params);
    const { id } = req.params;
    const site = await SiteDetail.findById(id)
      .populate("created_by", "name")
      .populate("clientId", "companyName");

    if (!site)
      return res
        .status(404)
        .json({ success: false, message: "Site not found" });

    res.status(200).json({ data: site });
  } catch (e) {
    console.error("GET SITE BY ID FAILED:", e);
    res.status(500).json({
      success: false,
      message: "Server error fetching site details",
      error: e.message,
    });
  }
};

exports.updateWagesSettings = async (req, res) => {
  try {
    const { clientId, siteId } = req.params;
    const {
      multiplyOTHours,
      calculateUniformDays,
      calculateEarnedGrossWithoutOT,
      pfWagesCalculatedOn,
      ESICWagesCalculatedOn,
      CTCCalculate,
      wagesSettings,
    } = req.body;

    // Validate input
    if (!clientId || !siteId) {
      return res
        .status(400)
        .json({ message: "Client ID and Site ID are required" });
    }

    const site = await SiteDetail.findOne({ _id: siteId, clientId });
    if (!site) {
      return res.status(404).json({ message: "Site not found" });
    }

    // Update fields
    site.multiplyOTHours = multiplyOTHours ?? site.multiplyOTHours;
    site.calculateUniformDays =
      calculateUniformDays ?? site.calculateUniformDays;
    site.calculateEarnedGrossWithoutOT =
      calculateEarnedGrossWithoutOT ?? site.calculateEarnedGrossWithoutOT;
    site.pfWagesCalculatedOn = pfWagesCalculatedOn ?? site.pfWagesCalculatedOn;
    site.ESICWagesCalculatedOn =
      ESICWagesCalculatedOn ?? site.ESICWagesCalculatedOn;
    site.CTCCalculate = CTCCalculate ?? site.CTCCalculate;
    site.wagesSettings = wagesSettings ?? site.wagesSettings;
    site.modified_by = req.user.id; // Assuming you have middleware to set req.user
    site.modified_on = new Date();

    await site.save();
    // console.log(site);

    return res
      .status(200)
      .json({ message: "Wages settings updated successfully", site });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
