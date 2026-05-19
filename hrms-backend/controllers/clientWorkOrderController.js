const ClientWorkOrder = require("../models/ClientWorkOrder");
const ClientWorkOrderItem = require("../models/ClientWorkOrderItem");
const mongoose = require("mongoose");

const cleanNumberArray = (arr = []) => {
  return arr
    .filter(
      (x) =>
        x &&
        x.value !== "" &&
        x.value !== null &&
        x.value !== undefined &&
        !isNaN(x.value),
    )
    .map((x) => ({
      value: Number(x.value),
    }));
};

const getStatusMeta = (status, userId) => {
  const meta = {};

  if (status === "Approved") {
    meta.approved_by = userId;
    meta.approved_on = new Date();
    meta.rejected_by = undefined;
    meta.rejected_on = undefined;
  }

  if (status === "Rejected") {
    meta.rejected_by = userId;
    meta.rejected_on = new Date();
    meta.approved_by = undefined;
    meta.approved_on = undefined;
  }

  return meta;
};

exports.createClientWorkOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const newOrderData = { ...req.body };
    newOrderData.created_by = req.user.id;

    const parsedItems = Array.isArray(req.body.formattedOrderItems)
      ? req.body.formattedOrderItems
      : JSON.parse(req.body.formattedOrderItems || "[]");

    const [clientworkorder] = await ClientWorkOrder.create([newOrderData], {
      session,
    });

    const workOrderId = clientworkorder._id;

    // const itemsWithMeta = parsedItems.map((item) => ({
    //   ...item,
    //   cliWorkOrderId: workOrderId,
    //   created_by: req.user.id,
    // }));

    const itemsWithMeta = parsedItems.map((o) => ({
      cliWorkOrderId: workOrderId,
      created_by: req.user.id,
      active: 0,

      itemNo: o.itemNo || "",
      containerNo: o.containerNo || "",
      size: o.size || "",
      invoiceNo: o.invoiceNo || "",
      vehichleNo: o.vehichleNo || "",
      destuffPkgs: o.destuffPkgs || "",
      destuffWgt: o.destuffWgt || "",
      exam: o.exam || "",
      remarks: o.remarks || "",
      hours: o.hours || "",
      cbm: o.cbm || "",
      sealNo: o.sealNo || "",
      arrivalDate: o.arrivalDate || "",
      allowPkg: o.allowPkg || "",
      allowWgt: o.allowWgt || "",
      exporterName: o.exporterName || "",
      status: o.status || "",

      ...getStatusMeta(o.status, req.user.id),
      totalCargoPkg: cleanNumberArray(o.totalCargoPkg),
      totalCargoWgt: cleanNumberArray(o.totalCargoWgt),

      equipmentType: (o.equipmentType || []).map((e) => ({
        value: e.value,
        label: e.label,
      })),

      gang: (o.gang || []).map((g) => ({
        value: g.value,
        label: g.label,
      })),

      totalCargoPkgSum: o.totalCargoPkgSum || 0,
      totalCargoWgtSum: o.totalCargoWgtSum || 0,
    }));

    if (itemsWithMeta.length > 0) {
      await ClientWorkOrderItem.insertMany(itemsWithMeta, { session });
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: "Client Work Order created successfully",
      data: workOrderId,
    });
  } catch (error) {
    console.error("CREATE WORK ORDER FAILED:", error);
    return res.status(500).json({
      message: "Error creating work order",
      error: error.message,
    });
  }
};

// exports.getAllClientWorkOrders = async (req, res) => {
//   try {
//     const { searchFields, fromDate, toDate, status } = req.query;

//     let matchStage = { active: 0 };

//     if (fromDate && toDate) {
//       const from = new Date(fromDate);
//       const to = new Date(toDate);
//       to.setHours(23, 59, 59, 999);

//       matchStage.created_on = { $gte: from, $lte: to };
//     }

//     let clientNameFilter = null;

//     if (searchFields) {
//       const fields = JSON.parse(searchFields);

//       fields.forEach((item) => {
//         if (item.field === "clientName" && item.keyword) {
//           clientNameFilter = new RegExp(item.keyword, "i");
//         }
//       });
//     }
//     // 👉 base pipeline (WITHOUT status filter for counts)
//     const basePipeline = [{ $match: matchStage }];

//     // 👉 counts for tabs
//     const statusCounts = await ClientWorkOrderItem.aggregate([
//       ...basePipeline,
//       {
//         $group: {
//           _id: "$status",
//           count: { $sum: 1 },
//         },
//       },
//     ]);

//     const counts = {
//       Approved: 0,
//       Pending: 0,
//       Rejected: 0,
//       JobQueue: 0,
//     };

//     statusCounts.forEach((s) => {
//       counts[s._id] = s.count;
//     });

//     if (status) {
//       matchStage.status = status;
//     }
//     const data = await ClientWorkOrderItem.aggregate([
//       { $match: matchStage },

//       {
//         $lookup: {
//           from: "clientworkorders",
//           localField: "cliWorkOrderId",
//           foreignField: "_id",
//           as: "cliWorkOrderId",
//         },
//       },
//       { $unwind: "$cliWorkOrderId" },

//       {
//         $lookup: {
//           from: "users",
//           localField: "created_by",
//           foreignField: "_id",
//           as: "created_by",
//         },
//       },
//       { $unwind: { path: "$created_by", preserveNullAndEmptyArrays: true } },
//       {
//         $lookup: {
//           from: "users",
//           localField: "approved_by",
//           foreignField: "_id",
//           as: "approved_by",
//         },
//       },
//       { $unwind: { path: "$approved_by", preserveNullAndEmptyArrays: true } },
//       {
//         $lookup: {
//           from: "users",
//           localField: "modified_by",
//           foreignField: "_id",
//           as: "modified_by",
//         },
//       },
//       { $unwind: { path: "$modified_by", preserveNullAndEmptyArrays: true } },
//       {
//         $lookup: {
//           from: "users",
//           localField: "rejected_by",
//           foreignField: "_id",
//           as: "rejected_by",
//         },
//       },
//       { $unwind: { path: "$rejected_by", preserveNullAndEmptyArrays: true } },

//       {
//         $lookup: {
//           from: "clients",
//           localField: "cliWorkOrderId.clientId",
//           foreignField: "_id",
//           as: "client",
//         },
//       },
//       { $unwind: "$client" },

//       ...(clientNameFilter
//         ? [
//             {
//               $match: {
//                 "client.companyName": clientNameFilter,
//               },
//             },
//           ]
//         : []),

//       {
//         $lookup: {
//           from: "workordertypes",
//           localField: "cliWorkOrderId.workOrderType",
//           foreignField: "_id",
//           as: "workOrderType",
//         },
//       },
//       { $unwind: "$workOrderType" },

//       { $sort: { created_on: -1 } },
//     ]);

//     res.status(200).json({ data, counts });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: "Error fetching work orders",
//       error: error.message,
//     });
//   }
// };
exports.getAllClientWorkOrders = async (req, res) => {
  try {
    const { searchFields, fromDate, toDate, status } = req.query;

    let matchStage = { active: 0 };

    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);

      matchStage.created_on = { $gte: from, $lte: to };
    }

    let clientNameFilter = null;

    let postLookupMatch = [];

    if (searchFields) {
      const fields = JSON.parse(searchFields);

      fields.forEach((item) => {
        if (!item.keyword) return;

        const regex = new RegExp(item.keyword, "i");

        switch (item.field) {
          case "clientName":
            postLookupMatch.push({ "client.companyName": regex });
            break;

          case "clientCode":
            postLookupMatch.push({
              siteDetails: { $elemMatch: { clientCode: regex } },
            });
            break;

          case "workOrderNo":
            postLookupMatch.push({ "cliWorkOrderId.workOrderNo": regex });
            break;

          case "workOrderType":
            postLookupMatch.push({ "workOrderType.name": regex });
            break;

          case "containerNo":
            postLookupMatch.push({ containerNo: regex });
            break;

          case "vehichleNo":
            postLookupMatch.push({ vehichleNo: regex });
            break;

          case "gangName":
            postLookupMatch.push({ "gang.label": regex });
            break;
        }
      });
    }
    // 👉 base pipeline (WITHOUT status filter for counts)
    const basePipeline = [{ $match: matchStage }];

    // 👉 counts for tabs
    const statusCounts = await ClientWorkOrderItem.aggregate([
      ...basePipeline,
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = {
      Approved: 0,
      Pending: 0,
      Rejected: 0,
      JobQueue: 0,
    };

    statusCounts.forEach((s) => {
      counts[s._id] = s.count;
    });

    if (status) {
      matchStage.status = status;
    }
    const data = await ClientWorkOrderItem.aggregate([
      { $match: matchStage },

      {
        $lookup: {
          from: "clientworkorders",
          localField: "cliWorkOrderId",
          foreignField: "_id",
          as: "cliWorkOrderId",
        },
      },
      { $unwind: "$cliWorkOrderId" },

      {
        $lookup: {
          from: "users",
          localField: "created_by",
          foreignField: "_id",
          as: "created_by",
        },
      },
      { $unwind: { path: "$created_by", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "approved_by",
          foreignField: "_id",
          as: "approved_by",
        },
      },
      { $unwind: { path: "$approved_by", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "modified_by",
          foreignField: "_id",
          as: "modified_by",
        },
      },
      { $unwind: { path: "$modified_by", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "rejected_by",
          foreignField: "_id",
          as: "rejected_by",
        },
      },
      { $unwind: { path: "$rejected_by", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "clients",
          localField: "cliWorkOrderId.clientId",
          foreignField: "_id",
          as: "client",
        },
      },
      { $unwind: "$client" },

      {
        $lookup: {
          from: "sitedetails",
          localField: "client._id",
          foreignField: "clientId",
          as: "siteDetails",
        },
      },
      // { $unwind: { path: "$siteDetails", preserveNullAndEmptyArrays: true } },

      ...(clientNameFilter
        ? [
            {
              $match: {
                "client.companyName": clientNameFilter,
              },
            },
          ]
        : []),

      {
        $lookup: {
          from: "workordertypes",
          localField: "cliWorkOrderId.workOrderType",
          foreignField: "_id",
          as: "workOrderType",
        },
      },
      { $unwind: "$workOrderType" },
      ...(postLookupMatch.length
        ? [{ $match: { $and: postLookupMatch } }]
        : []),

      { $sort: { created_on: -1 } },
    ]);

    res.status(200).json({ data, counts });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching work orders",
      error: error.message,
    });
  }
};

exports.getSingleClientWorkOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await ClientWorkOrderItem.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
          active: 0,
        },
      },

      {
        $lookup: {
          from: "clientworkorders",
          localField: "cliWorkOrderId",
          foreignField: "_id",
          as: "cliWorkOrderId",
        },
      },
      { $unwind: "$cliWorkOrderId" },

      {
        $lookup: {
          from: "users",
          localField: "created_by",
          foreignField: "_id",
          as: "created_by",
        },
      },
      { $unwind: { path: "$created_by", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "users",
          localField: "approved_by",
          foreignField: "_id",
          as: "approved_by",
        },
      },
      { $unwind: { path: "$approved_by", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "users",
          localField: "rejected_by",
          foreignField: "_id",
          as: "rejected_by",
        },
      },
      { $unwind: { path: "$rejected_by", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "clients",
          localField: "cliWorkOrderId.clientId",
          foreignField: "_id",
          as: "client",
        },
      },
      { $unwind: "$client" },

      {
        $lookup: {
          from: "workordertypes",
          localField: "cliWorkOrderId.workOrderType",
          foreignField: "_id",
          as: "workOrderType",
        },
      },
      { $unwind: "$workOrderType" },
    ]);

    if (!data.length) {
      return res.status(404).json({ message: "Work order not found" });
    }

    res.status(200).json(data[0]);
  } catch (error) {
    console.error("GET SINGLE WORK ORDER FAILED:", error);
    res.status(500).json({
      message: "Error fetching work order",
      error: error.message,
    });
  }
};

exports.getAllWorkOrdersByClientId = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { searchFields, fromDate, toDate } = req.query;

    let orderMatch = {
      active: 0,
      clientId: new mongoose.Types.ObjectId(clientId),
    };

    let clientMatch = {};
    let itemMatch = {}; // ✅ for orderItems search

    // ✅ SEARCH FILTERS
    if (searchFields) {
      const fields = JSON.parse(searchFields);

      fields.forEach((item) => {
        if (!item?.field || !item?.keyword) return;

        const regex = new RegExp(item.keyword, "i");

        switch (item.field) {
          case "clientName":
            clientMatch["client.companyName"] = regex;
            break;

          case "workOrderNo":
            orderMatch.workOrderNo = regex;
            break;

          case "workOrderType":
            orderMatch.workOrderType = regex;
            break;

          case "igmNo":
            orderMatch.igmNo = regex;
            break;

          // ✅ MOVED TO orderItems search
          case "containerNo":
            itemMatch.containerNo = regex;
            break;

          case "vehichleNo":
            itemMatch.vehichleNo = regex; // spelling per your schema
            break;

          default:
            break;
        }
      });
    }

    // ✅ DATE FILTER
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      orderMatch.created_on = { $gte: from, $lte: to };
    }

    const pipeline = [
      { $match: orderMatch },

      // ✅ CLIENT LOOKUP
      {
        $lookup: {
          from: "clients",
          let: { cid: "$clientId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$cid"] } } },
            { $project: { companyName: 1 } },
          ],
          as: "client",
        },
      },
      { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },

      ...(Object.keys(clientMatch).length ? [{ $match: clientMatch }] : []),

      // ✅ CREATED BY
      {
        $lookup: {
          from: "users",
          localField: "created_by",
          foreignField: "_id",
          as: "created_by",
        },
      },
      { $unwind: { path: "$created_by", preserveNullAndEmptyArrays: true } },

      // ✅ ORDER ITEMS LOOKUP
      {
        $lookup: {
          from: "clientworkorderitems",
          let: { woId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$cliWorkOrderId", "$$woId"] },
                active: 0,
              },
            },
            {
              $project: {
                itemNo: 1,
                containerNo: 1,
                size: 1,
                cliWorkOrderId: 1,
                vehichleNo: 1,
                exam: 1,
                remarks: 1,
                hours: 1,
                cbm: 1,
                totalCargoPkg: 1,
                totalCargoWgt: 1,
                equipmentType: 1,
                gang: 1,
                created_on: 1,
              },
            },
          ],
          as: "orderItems",
        },
      },

      ...(Object.keys(itemMatch).length
        ? [
            {
              $match: {
                orderItems: {
                  $elemMatch: itemMatch,
                },
              },
            },
          ]
        : []),

      { $sort: { created_on: -1 } },
    ];

    const workOrders = await ClientWorkOrder.aggregate(pipeline);

    res.status(200).json(workOrders);
  } catch (error) {
    console.error("FETCH FAILED:", error);
    res.status(500).json({
      message: "Error fetching client work orders",
      error: error.message,
    });
  }
};

exports.updateClientWorkOrderStatus = async (req, res) => {
  try {
    console.log(req.body);
    const workOrderItemId = req.params.id;
    const { status } = req.body;
    const username = req.user.id;
    console.log(status);

    const updatedItem = await ClientWorkOrderItem.findByIdAndUpdate(
      workOrderItemId,
      {
        status,
        modified_by: username,
        modified_on: new Date(),
        ...getStatusMeta(status, username),
      },
    );
    // console.log(updatedItem);

    if (!updatedItem) {
      return res
        .status(404)
        .json({ success: false, message: "Client Work Order Item not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Work Order Status updated successfully!",
    });
  } catch (error) {
    console.error("UPDATE WORK ORDER FAILED:", error);
    return res.status(500).json({
      message: "Error updating work order",
      error: error.message,
    });
  }
};

exports.updateClientWorkOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const updatedData = { ...req.body };
    const username = req.user.id;
    const orders = updatedData.formattedOrderItems;
    console.log(orders);

    const updatedOrder = await ClientWorkOrder.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...updatedData,
          workOrderDate: updatedData.workOrderDate,
          modified_on: new Date(),
          modified_by: username,
        },
      },
      { new: true, session },
    );

    if (!updatedOrder) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({ success: false, message: "Client Work Order not found" });
    }

    if (Array.isArray(orders)) {
      const existingOrder = await ClientWorkOrderItem.find({
        cliWorkOrderId: updatedOrder._id,
        active: 0,
      }).session(session);

      const existingOrderIds = existingOrder.map((o) => o._id.toString());
      const incomingIds = orders
        .filter((o) => o._id)
        .map((o) => o._id.toString());

      const bulkOps = [];

      for (const o of orders) {
        const payload = {
          itemNo: o.itemNo || "",
          containerNo: o.containerNo || "",
          size: o.size || "",
          vehichleNo: o.vehichleNo || "",
          exam: o.exam || "",
          remarks: o.remarks || "",
          hours: o.hours || "",
          cbm: o.cbm || "",

          // totalCargoPkg: (o.totalCargoPkg || []).map((p) => ({
          //   value: Number(p.value || 0),
          // })),
          // totalCargoWgt: (o.totalCargoWgt || []).map((w) => ({
          //   value: Number(w.value || 0),
          // })),

          ...getStatusMeta(o.status, req.user.id),
          totalCargoPkg: cleanNumberArray(o.totalCargoPkg),
          totalCargoWgt: cleanNumberArray(o.totalCargoWgt),
          equipmentType: (o.equipmentType || []).map((e) => ({
            value: e.value,
            label: e.label,
          })),

          gang: (o.gang || []).map((g) => ({
            value: g.value,
            label: g.label,
          })),
          totalCargoPkgSum: o.totalCargoPkgSum || 0,
          totalCargoWgtSum: o.totalCargoWgtSum || 0,
        };

        if (o._id && existingOrderIds.includes(o._id.toString())) {
          bulkOps.push({
            updateOne: {
              filter: { _id: o._id },
              update: {
                $set: {
                  ...payload,
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
                cliWorkOrderId: updatedOrder._id,
                ...payload,
                created_by: req.user.id,
                active: 0,
              },
            },
          });
        }
      }

      const ordersToDelete = existingOrderIds.filter(
        (id) => !incomingIds.includes(id),
      );

      if (ordersToDelete.length > 0) {
        bulkOps.push({
          updateMany: {
            filter: {
              _id: { $in: ordersToDelete },
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

      console.log(JSON.stringify(bulkOps, null, 2));
      if (bulkOps.length)
        await ClientWorkOrderItem.bulkWrite(bulkOps, { session });
    }

    await session.commitTransaction();
    session.endSession();
    return res.status(200).json({
      success: true,
      message: "Work Order updated successfully!",
    });
  } catch (error) {
    console.error("UPDATE WORK ORDER FAILED:", error);
    return res.status(500).json({
      message: "Error updating work order",
      error: error.message,
    });
  }
};

exports.updateSingleClientWorkOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.id;

    const {
      clientId,
      workOrderType,
      workOrderNo,
      workOrderDate,
      igmNo,
      importerName,
      chaName,
      vendor,
      orderItems,
    } = req.body;

    if (!orderItems?._id || !orderItems?.cliWorkOrderId) {
      throw new Error("Order item ID or cliWorkOrderId not found");
    }

    // ✅ 1. UPDATE CLIENT WORK ORDER
    const updatedOrder = await ClientWorkOrder.findByIdAndUpdate(
      orderItems.cliWorkOrderId,
      {
        clientId,
        workOrderType,
        workOrderNo,
        workOrderDate: workOrderDate ? new Date(workOrderDate) : null,
        igmNo,
        importerName,
        chaName,
        vendor,
        totalCargoPkg: orderItems.totalCargoPkgSum,
        totalCargoWgt: orderItems.totalCargoWgtSum,
        modified_by: userId,
        modified_on: new Date(),
      },
      { session },
    );

    if (!updatedOrder) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({ success: false, message: "Client Work Order not found" });
    }

    // ✅ 2. PREPARE ORDER ITEM PAYLOAD
    const payload = {
      itemNo: orderItems.itemNo || "",
      containerNo: orderItems.containerNo || "",
      size: orderItems.size || "",
      invoiceNo: orderItems.invoiceNo || "",
      vehichleNo: orderItems.vehichleNo || "",
      destuffPkgs: orderItems.destuffPkgs || "",
      destuffWgt: orderItems.destuffWgt || "",
      exam: orderItems.exam || "",
      remarks: orderItems.remarks || "",
      hours: orderItems.hours || "",
      cbm: orderItems.cbm || "",
      sealNo: orderItems.sealNo || "",
      arrivalDate: orderItems.arrivalDate
        ? new Date(orderItems.arrivalDate)
        : null,
      allowPkg: orderItems.allowPkg || "",
      allowWgt: orderItems.allowWgt || "",
      exporterName: orderItems.exporterName || "",
      status: orderItems.status || "Pending",

      totalCargoPkgSum: orderItems.totalCargoPkgSum || 0,
      totalCargoWgtSum: orderItems.totalCargoWgtSum || 0,

      equipmentType: (orderItems.equipmentType || []).map((e) => ({
        value: e.value,
        label: e.label,
      })),

      gang: (orderItems.gang || []).map((e) => ({
        value: e.value,
        label: e.label,
      })),

      modified_by: userId,
      modified_on: new Date(),
    };

    // ✅ 3. STATUS AUDIT
    if (orderItems.status === "Approved") {
      payload.approved_by = userId;
      payload.approved_on = new Date();
      payload.rejected_by = null;
      payload.rejected_on = null;
    }

    if (orderItems.status === "Rejected") {
      payload.rejected_by = userId;
      payload.rejected_on = new Date();
      payload.approved_by = null;
      payload.approved_on = null;
    }

    // ✅ 4. UPDATE ORDER ITEM
    const updatedItem = await ClientWorkOrderItem.findByIdAndUpdate(
      orderItems._id,
      payload,
      { new: true, session },
    );
    // console.log(updatedItem);

    if (!updatedItem) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({ success: false, message: "Client Work Order Item not found" });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Work order updated successfully",
      data: updatedItem,
    });
  } catch (err) {
    console.error("UPDATE FAILED:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteWorkOrderItem = async (req, res) => {
  try {
    const updatedOrderItem = await ClientWorkOrderItem.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          active: 1,
          disabled_on: new Date(),
          disabled_by: req.user.id,
        },
      },
      { new: true },
    );

    if (!updatedOrderItem) {
      return res.status(404).json({ message: "Work Order not found" });
    }

    res.status(200).json({
      message: "Work Order deactivated successfully",
    });
  } catch (error) {
    console.error("DEACTIVATE WORK ORDER FAILED:", error);
    res.status(500).json({
      message: "Deleting work order failed!",
      error: error.message,
    });
  }
};

exports.deleteWorkOrder = async (req, res) => {
  try {
    const updatedOrder = await ClientWorkOrder.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          active: 1,
          disabled_on: new Date(),
          disabled_by: req.user.id,
        },
      },
      { new: true },
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Work Order not found" });
    }

    res.status(200).json({
      message: "Work Order deactivated successfully",
    });
  } catch (error) {
    console.error("DEACTIVATE WORK ORDER FAILED:", error);
    res.status(500).json({
      message: "Deleting work order failed!",
      error: error.message,
    });
  }
};
