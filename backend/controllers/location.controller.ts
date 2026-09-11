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
    district: loc.district || "",
    city: loc.city || "Hà Nội",
    phone: loc.phone || "0900 000 000",
    openTime: loc.openTime || "06:00",
    closeTime: loc.closeTime || "22:00",
    mapUrl: loc.mapUrl || "",
    latitude: loc.latitude || 0,
    longitude: loc.longitude || 0,
    directions: loc.directions || "",
    courts: (loc.courts || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      type: c.type || "Standard",
      status: c.status || "active",
      regularPrice: c.regularPrice,
      peakPrice: c.peakPrice,
      position: c.position || "Khu trung tâm",
    })),
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
    const {
      name,
      address,
      district,
      city,
      phone,
      openTime,
      closeTime,
      mapUrl,
      latitude,
      longitude,
      directions,
      courts,
    } = req.body;

    if (!name || !address) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp tên và địa chỉ cơ sở",
      });
    }

    const defaultCourts = courts || [
      { id: "court_1", name: "Sân 1", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000, position: "Khu A - Sân 1" },
      { id: "court_2", name: "Sân 2", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000, position: "Khu A - Sân 2" },
      { id: "court_3", name: "Sân 3", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000, position: "Khu B - Sân 3" },
      { id: "court_4", name: "Sân 4", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000, position: "Khu B - Sân 4" },
    ];

    if (!isDbConnected()) {
      const newLoc = {
        _id: generateId(),
        name: name.trim(),
        address: address.trim(),
        district: district ? district.trim() : "",
        city: city ? city.trim() : "Hà Nội",
        phone: phone ? phone.trim() : "0900 000 000",
        openTime: openTime || "06:00",
        closeTime: closeTime || "22:00",
        mapUrl: mapUrl ? mapUrl.trim() : "",
        latitude: latitude !== undefined ? Number(latitude) : 0,
        longitude: longitude !== undefined ? Number(longitude) : 0,
        directions: directions ? directions.trim() : "",
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
      district: district ? district.trim() : "",
      city: city ? city.trim() : "Hà Nội",
      phone: phone ? phone.trim() : "0900 000 000",
      openTime: openTime || "06:00",
      closeTime: closeTime || "22:00",
      mapUrl: mapUrl ? mapUrl.trim() : "",
      latitude: latitude !== undefined ? Number(latitude) : 0,
      longitude: longitude !== undefined ? Number(longitude) : 0,
      directions: directions ? directions.trim() : "",
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
    const {
      name,
      address,
      district,
      city,
      phone,
      openTime,
      closeTime,
      mapUrl,
      latitude,
      longitude,
      directions,
      courts,
    } = req.body;

    if (!isDbConnected()) {
      const idx = memoryLocations.findIndex((l) => l._id === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: "Không tìm thấy cơ sở" });
      }

      if (name !== undefined) memoryLocations[idx].name = name.trim();
      if (address !== undefined) memoryLocations[idx].address = address.trim();
      if (district !== undefined) memoryLocations[idx].district = district.trim();
      if (city !== undefined) memoryLocations[idx].city = city.trim();
      if (phone !== undefined) memoryLocations[idx].phone = phone.trim();
      if (openTime !== undefined) memoryLocations[idx].openTime = openTime;
      if (closeTime !== undefined) memoryLocations[idx].closeTime = closeTime;
      if (mapUrl !== undefined) memoryLocations[idx].mapUrl = mapUrl.trim();
      if (latitude !== undefined) memoryLocations[idx].latitude = Number(latitude);
      if (longitude !== undefined) memoryLocations[idx].longitude = Number(longitude);
      if (directions !== undefined) memoryLocations[idx].directions = directions.trim();
      if (courts !== undefined) memoryLocations[idx].courts = courts;
      memoryLocations[idx].updatedAt = new Date();

      return res.json({
        success: true,
        message: "Cập nhật cơ sở thành công",
        location: formatLocation(memoryLocations[idx]),
      });
    }

    const updated = await Location.findByIdAndUpdate(
      id,
      {
        $set: {
          ...(name !== undefined && { name: name.trim() }),
          ...(address !== undefined && { address: address.trim() }),
          ...(district !== undefined && { district: district.trim() }),
          ...(city !== undefined && { city: city.trim() }),
          ...(phone !== undefined && { phone: phone.trim() }),
          ...(openTime !== undefined && { openTime }),
          ...(closeTime !== undefined && { closeTime }),
          ...(mapUrl !== undefined && { mapUrl: mapUrl.trim() }),
          ...(latitude !== undefined && { latitude: Number(latitude) }),
          ...(longitude !== undefined && { longitude: Number(longitude) }),
          ...(directions !== undefined && { directions: directions.trim() }),
          ...(courts !== undefined && { courts }),
        },
      },
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

// =====================================================
// COURT MANAGEMENT (Within Location)
// =====================================================
export async function addCourt(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      name,
      type = "Standard",
      regularPrice = 80000,
      peakPrice = 120000,
      position = "Khu trung tâm",
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập tên sân" });
    }

    const courtId = `court_${Date.now().toString().slice(-6)}`;
    const newCourt = {
      id: courtId,
      name: name.trim(),
      type: type || "Standard",
      status: "active" as const,
      regularPrice: Number(regularPrice) || 80000,
      peakPrice: Number(peakPrice) || 120000,
      position: (position || "Khu trung tâm").trim(),
    };

    if (!isDbConnected()) {
      const loc = memoryLocations.find((l) => l._id === id);
      if (!loc) {
        return res.status(404).json({ success: false, message: "Không tìm thấy cơ sở" });
      }
      if (!loc.courts) loc.courts = [];
      loc.courts.push(newCourt);
      loc.updatedAt = new Date();
      return res.status(201).json({ success: true, message: "Thêm sân mới thành công", court: newCourt });
    }

    const loc = await Location.findById(id);
    if (!loc) {
      return res.status(404).json({ success: false, message: "Không tìm thấy cơ sở" });
    }

    loc.courts.push(newCourt as any);
    await loc.save();

    return res.status(201).json({ success: true, message: "Thêm sân mới thành công", court: newCourt });
  } catch (error) {
    console.error("Add court error:", error);
    return res.status(500).json({ success: false, message: "Lỗi thêm sân mới" });
  }
}

export async function updateCourt(req: Request, res: Response) {
  try {
    const { id, courtId } = req.params;
    const { name, type, status, regularPrice, peakPrice, position } = req.body;

    if (!isDbConnected()) {
      const loc = memoryLocations.find((l) => l._id === id);
      if (!loc) {
        return res.status(404).json({ success: false, message: "Không tìm thấy cơ sở" });
      }

      const court = loc.courts?.find((c) => c.id === courtId);
      if (!court) {
        return res.status(404).json({ success: false, message: "Không tìm thấy sân" });
      }

      if (name) court.name = name.trim();
      if (type) court.type = type;
      if (status) court.status = status;
      if (regularPrice !== undefined) court.regularPrice = Number(regularPrice);
      if (peakPrice !== undefined) court.peakPrice = Number(peakPrice);
      if (position !== undefined) court.position = position.trim();
      loc.updatedAt = new Date();

      return res.json({ success: true, message: "Cập nhật sân thành công", court });
    }

    const loc = await Location.findById(id);
    if (!loc) {
      return res.status(404).json({ success: false, message: "Không tìm thấy cơ sở" });
    }

    const court = loc.courts.find((c: any) => c.id === courtId);
    if (!court) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sân" });
    }

    if (name) court.name = name.trim();
    if (type) court.type = type;
    if (status) court.status = status;
    if (regularPrice !== undefined) court.regularPrice = Number(regularPrice);
    if (peakPrice !== undefined) court.peakPrice = Number(peakPrice);
    if (position !== undefined) court.position = position.trim();

    await loc.save();

    return res.json({ success: true, message: "Cập nhật sân thành công", court });
  } catch (error) {
    console.error("Update court error:", error);
    return res.status(500).json({ success: false, message: "Lỗi cập nhật sân" });
  }
}

export async function deleteCourt(req: Request, res: Response) {
  try {
    const { id, courtId } = req.params;

    if (!isDbConnected()) {
      const loc = memoryLocations.find((l) => l._id === id);
      if (!loc) {
        return res.status(404).json({ success: false, message: "Không tìm thấy cơ sở" });
      }

      const idx = loc.courts?.findIndex((c) => c.id === courtId);
      if (idx === -1 || idx === undefined) {
        return res.status(404).json({ success: false, message: "Không tìm thấy sân" });
      }

      loc.courts.splice(idx, 1);
      loc.updatedAt = new Date();
      return res.json({ success: true, message: "Đã xóa sân thành công" });
    }

    const loc = await Location.findById(id);
    if (!loc) {
      return res.status(404).json({ success: false, message: "Không tìm thấy cơ sở" });
    }

    loc.courts = loc.courts.filter((c: any) => c.id !== courtId);
    await loc.save();

    return res.json({ success: true, message: "Đã xóa sân thành công" });
  } catch (error) {
    console.error("Delete court error:", error);
    return res.status(500).json({ success: false, message: "Lỗi xóa sân" });
  }
}

