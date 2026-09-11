import { Request, Response } from "express";
import { Location } from "../models/Location.js";
import {
  isDbConnected,
  memoryLocations,
  generateId,
} from "../config/memoryStore.js";

function formatLocation(loc: any) {
  return {
    id: (loc._id || loc.id).toString(),
    name: loc.name,
    address: loc.address,
    phone: loc.phone || "0900 000 000",
    openTime: loc.openTime || "06:00",
    closeTime: loc.closeTime || "22:00",
    courts: loc.courts || [
      { id: "court_1", name: "Sân 1", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000 },
      { id: "court_2", name: "Sân 2", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000 },
      { id: "court_3", name: "Sân 3", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000 },
      { id: "court_4", name: "Sân 4", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000 },
    ],
  };
}

export async function getLocations(_req: Request, res: Response) {
  try {
    if (!isDbConnected()) {
      return res.json({
        success: true,
        locations: memoryLocations.map(formatLocation),
      });
    }

    const locations = await Location.find().sort({ createdAt: 1 });
    return res.json({
      success: true,
      locations: locations.map(formatLocation),
    });
  } catch (error) {
    console.error("Get locations error:", error);
    return res.json({
      success: true,
      locations: memoryLocations.map(formatLocation),
    });
  }
}

export async function getLocation(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!isDbConnected()) {
      const loc = memoryLocations.find((l) => l._id === id);
      if (!loc) {
        return res.status(404).json({ success: false, message: "Không tìm thấy cơ sở sân" });
      }
      return res.json({ success: true, location: formatLocation(loc) });
    }

    const loc = await Location.findById(id);
    if (!loc) {
      return res.status(404).json({ success: false, message: "Không tìm thấy cơ sở sân" });
    }

    return res.json({ success: true, location: formatLocation(loc) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi truy vấn cơ sở" });
  }
}

export async function createLocation(req: Request, res: Response) {
  try {
    const { name, address, phone, openTime, closeTime, courts } = req.body;

    if (!name || !address) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp tên và địa chỉ cơ sở",
      });
    }

    const defaultCourts = courts || [
      { id: "court_1", name: "Sân 1", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000 },
      { id: "court_2", name: "Sân 2", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000 },
      { id: "court_3", name: "Sân 3", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000 },
      { id: "court_4", name: "Sân 4", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000 },
    ];

    if (!isDbConnected()) {
      const newLoc = {
        _id: generateId(),
        name: name.trim(),
        address: address.trim(),
        phone: phone || "0900 000 000",
        openTime: openTime || "06:00",
        closeTime: closeTime || "22:00",
        courts: defaultCourts,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryLocations.push(newLoc);
      return res.status(201).json({
        success: true,
        message: "Tạo cơ sở mới thành công",
        location: formatLocation(newLoc),
      });
    }

    const location = await Location.create({
      name: name.trim(),
      address: address.trim(),
      phone: phone || "0900 000 000",
      openTime: openTime || "06:00",
      closeTime: closeTime || "22:00",
      courts: defaultCourts,
    });

    return res.status(201).json({
      success: true,
      message: "Tạo cơ sở mới thành công",
      location: formatLocation(location),
    });
  } catch (error) {
    console.error("Create location error:", error);
    return res.status(500).json({ success: false, message: "Không thể thêm cơ sở" });
  }
}

export async function updateLocation(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, address, phone, openTime, closeTime, courts } = req.body;

    if (!isDbConnected()) {
      const idx = memoryLocations.findIndex((l) => l._id === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: "Không tìm thấy cơ sở" });
      }

      if (name) memoryLocations[idx].name = name.trim();
      if (address) memoryLocations[idx].address = address.trim();
      if (phone) memoryLocations[idx].phone = phone.trim();
      if (openTime) memoryLocations[idx].openTime = openTime;
      if (closeTime) memoryLocations[idx].closeTime = closeTime;
      if (courts) memoryLocations[idx].courts = courts;
      memoryLocations[idx].updatedAt = new Date();

      return res.json({
        success: true,
        message: "Cập nhật cơ sở thành công",
        location: formatLocation(memoryLocations[idx]),
      });
    }

    const updated = await Location.findByIdAndUpdate(
      id,
      { $set: { name, address, phone, openTime, closeTime, courts } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Không tìm thấy cơ sở" });
    }

    return res.json({
      success: true,
      message: "Cập nhật cơ sở thành công",
      location: formatLocation(updated),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Không thể cập nhật cơ sở" });
  }
}

export async function deleteLocation(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!isDbConnected()) {
      const idx = memoryLocations.findIndex((l) => l._id === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: "Không tìm thấy cơ sở" });
      }
      memoryLocations.splice(idx, 1);
      return res.json({ success: true, message: "Xóa cơ sở thành công" });
    }

    const deleted = await Location.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Không tìm thấy cơ sở" });
    }

    return res.json({ success: true, message: "Xóa cơ sở thành công" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Không thể xóa cơ sở" });
  }
}
