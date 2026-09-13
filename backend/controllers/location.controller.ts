import { Request, Response } from "express";
import { Location } from "../models/Location.js";
import {
  isDbConnected,
  memoryLocations,
  generateId,
} from "../config/memoryStore.js";

function formatLocation(loc: any) {
  const defaultZones = [
    { id: "zone_a", name: "Khu A (Tầng 1)", description: "Mặt thảm Enlio tiêu chuẩn thi đấu, gần lễ tân" },
    { id: "zone_b", name: "Khu B (Tầng 1)", description: "Không gian thoáng mát cạnh khán đài" },
    { id: "zone_vip", name: "Khu VIP (Tầng 2)", description: "Thảm Yonex cao cấp có máy lạnh riêng biệt" },
  ];
  const zones = loc.zones && loc.zones.length > 0 ? loc.zones : defaultZones;

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
    zones: zones.map((z: any) => ({
      id: z.id,
      name: z.name,
      description: z.description || "",
    })),
    courts: (loc.courts || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      type: c.type || "Standard",
      status: c.status || "active",
      regularPrice: c.regularPrice,
      peakPrice: c.peakPrice,
      zone: c.zone || "Khu A (Tầng 1)",
      position: c.position || "Sân tiêu chuẩn",
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
      { id: "court_1", name: "Sân 1", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000, zone: "Khu A (Tầng 1)", position: "Khu A - Sân 1" },
      { id: "court_2", name: "Sân 2", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000, zone: "Khu A (Tầng 1)", position: "Khu A - Sân 2" },
      { id: "court_3", name: "Sân 3", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000, zone: "Khu B (Tầng 1)", position: "Khu B - Sân 3" },
      { id: "court_4", name: "Sân 4", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000, zone: "Khu B (Tầng 1)", position: "Khu B - Sân 4" },
    ];

    const defaultZones = zones && zones.length > 0 ? zones : [
      { id: "zone_a", name: "Khu A (Tầng 1)", description: "Mặt thảm Enlio tiêu chuẩn thi đấu, gần lễ tân" },
      { id: "zone_b", name: "Khu B (Tầng 1)", description: "Không gian thoáng mát cạnh khán đài" },
      { id: "zone_vip", name: "Khu VIP (Tầng 2)", description: "Thảm Yonex cao cấp có máy lạnh riêng biệt" },
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
        zones: defaultZones,
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
      zones: defaultZones,
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
      zones,
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
      if (zones !== undefined) memoryLocations[idx].zones = zones;
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
          ...(zones !== undefined && { zones }),
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
      zone = "Khu A (Tầng 1)",
      position = "Sân tiêu chuẩn",
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
      zone: (zone || "Khu A (Tầng 1)").trim(),
      position: (position || "Sân tiêu chuẩn").trim(),
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
    const { name, type, status, regularPrice, peakPrice, zone, position } = req.body;

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
      if (zone !== undefined) court.zone = zone.trim();
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
    if (zone !== undefined) court.zone = zone.trim();
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

// =====================================================
// ZONE MANAGEMENT (CRUD Khu Vực trong Cơ sở)
// =====================================================
export async function addZone(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập tên khu vực" });
    }

    const zoneId = `zone_${Date.now().toString().slice(-6)}`;
    const newZone = {
      id: zoneId,
      name: name.trim(),
      description: description ? description.trim() : "",
    };

    if (!isDbConnected()) {
      const loc = memoryLocations.find((l) => l._id === id);
      if (!loc) {
        return res.status(404).json({ success: false, message: "Không tìm thấy cơ sở" });
      }
      if (!loc.zones) loc.zones = [];
      loc.zones.push(newZone);
      loc.updatedAt = new Date();
      return res.status(201).json({ success: true, message: "Thêm khu vực mới thành công", zone: newZone });
    }

    const loc = await Location.findById(id);
    if (!loc) {
      return res.status(404).json({ success: false, message: "Không tìm thấy cơ sở" });
    }

    if (!loc.zones) loc.zones = [];
    loc.zones.push(newZone as any);
    await loc.save();

    return res.status(201).json({ success: true, message: "Thêm khu vực mới thành công", zone: newZone });
  } catch (error) {
    console.error("Add zone error:", error);
    return res.status(500).json({ success: false, message: "Lỗi thêm khu vực" });
  }
}

export async function updateZone(req: Request, res: Response) {
  try {
    const { id, zoneId } = req.params;
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập tên khu vực" });
    }

    if (!isDbConnected()) {
      const loc = memoryLocations.find((l) => l._id === id);
      if (!loc) {
        return res.status(404).json({ success: false, message: "Không tìm thấy cơ sở" });
      }

      const zone = loc.zones?.find((z) => z.id === zoneId);
      if (!zone) {
        return res.status(404).json({ success: false, message: "Không tìm thấy khu vực" });
      }

      const oldName = zone.name;
      zone.name = name.trim();
      if (description !== undefined) zone.description = description.trim();

      // Update courts using old zone name
      if (loc.courts) {
        loc.courts.forEach((c) => {
          if (c.zone === oldName) {
            c.zone = zone.name;
          }
        });
      }
      loc.updatedAt = new Date();

      return res.json({ success: true, message: "Cập nhật khu vực thành công", zone });
    }

    const loc = await Location.findById(id);
    if (!loc) {
      return res.status(404).json({ success: false, message: "Không tìm thấy cơ sở" });
    }

    const zone = loc.zones?.find((z: any) => z.id === zoneId);
    if (!zone) {
      return res.status(404).json({ success: false, message: "Không tìm thấy khu vực" });
    }

    const oldName = zone.name;
    zone.name = name.trim();
    if (description !== undefined) zone.description = description.trim();

    if (loc.courts) {
      loc.courts.forEach((c: any) => {
        if (c.zone === oldName) {
          c.zone = zone.name;
        }
      });
    }

    await loc.save();

    return res.json({ success: true, message: "Cập nhật khu vực thành công", zone });
  } catch (error) {
    console.error("Update zone error:", error);
    return res.status(500).json({ success: false, message: "Lỗi cập nhật khu vực" });
  }
}

export async function deleteZone(req: Request, res: Response) {
  try {
    const { id, zoneId } = req.params;

    if (!isDbConnected()) {
      const loc = memoryLocations.find((l) => l._id === id);
      if (!loc) {
        return res.status(404).json({ success: false, message: "Không tìm thấy cơ sở" });
      }

      const targetZone = loc.zones?.find((z) => z.id === zoneId);
      if (!targetZone) {
        return res.status(404).json({ success: false, message: "Không tìm thấy khu vực" });
      }

      const deletedZoneName = targetZone.name;
      loc.zones = loc.zones?.filter((z) => z.id !== zoneId);

      // Reassign courts from deleted zone to remaining zone or fallback
      const fallbackZone = loc.zones?.[0]?.name || "Khu A";
      if (loc.courts) {
        loc.courts.forEach((c) => {
          if (c.zone === deletedZoneName) {
            c.zone = fallbackZone;
          }
        });
      }
      loc.updatedAt = new Date();

      return res.json({ success: true, message: `Đã xóa khu vực "${deletedZoneName}"` });
    }

    const loc = await Location.findById(id);
    if (!loc) {
      return res.status(404).json({ success: false, message: "Không tìm thấy cơ sở" });
    }

    const targetZone = loc.zones?.find((z: any) => z.id === zoneId);
    if (!targetZone) {
      return res.status(404).json({ success: false, message: "Không tìm thấy khu vực" });
    }

    const deletedZoneName = targetZone.name;
    loc.zones = loc.zones.filter((z: any) => z.id !== zoneId);

    const fallbackZone = loc.zones?.[0]?.name || "Khu A";
    if (loc.courts) {
      loc.courts.forEach((c: any) => {
        if (c.zone === deletedZoneName) {
          c.zone = fallbackZone;
        }
      });
    }

    await loc.save();

    return res.json({ success: true, message: `Đã xóa khu vực "${deletedZoneName}"` });
  } catch (error) {
    console.error("Delete zone error:", error);
    return res.status(500).json({ success: false, message: "Lỗi xóa khu vực" });
  }
}

