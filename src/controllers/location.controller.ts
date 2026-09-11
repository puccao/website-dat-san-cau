import { Request, Response } from "express";
import { Location } from "../models/Location.js";
import {
  isDbConnected,
  memoryLocations,
  generateId,
} from "../config/memoryStore.js";

function formatLocation(location: any) {
  return {
    id: (location._id || location.id).toString(),
    name: location.name,
    address: location.address,
  };
}

// =====================================================
// GET ALL
// =====================================================

export async function getLocations(
  _req: Request,
  res: Response
) {
  try {
    if (!isDbConnected()) {
      return res.json({
        success: true,
        locations: memoryLocations.map(formatLocation),
      });
    }

    const locations = await Location.find().sort({
      createdAt: 1,
    });

    return res.json({
      success: true,
      locations: locations.map(formatLocation),
    });
  } catch (error) {
    console.error("Get locations error:", error);

    // If query failed due to DB offline, fallback gracefully
    return res.json({
      success: true,
      locations: memoryLocations.map(formatLocation),
    });
  }
}

// =====================================================
// GET ONE
// =====================================================

export async function getLocation(
  req: Request,
  res: Response
) {
  try {
    if (!isDbConnected()) {
      const loc = memoryLocations.find(
        (l) => l._id === req.params.id
      );
      if (!loc) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy địa điểm",
        });
      }
      return res.json({
        success: true,
        location: formatLocation(loc),
      });
    }

    const location = await Location.findById(
      req.params.id
    );

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy địa điểm",
      });
    }

    return res.json({
      success: true,
      location: formatLocation(location),
    });
  } catch (error) {
    console.error("Get location error:", error);

    const loc = memoryLocations.find(
      (l) => l._id === req.params.id
    );
    if (loc) {
      return res.json({
        success: true,
        location: formatLocation(loc),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Không thể lấy địa điểm",
    });
  }
}

// =====================================================
// CREATE
// =====================================================

export async function createLocation(
  req: Request,
  res: Response
) {
  try {
    const { name, address } = req.body;

    if (!name || !address) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập tên và địa chỉ",
      });
    }

    if (!isDbConnected()) {
      const existing = memoryLocations.find(
        (l) => l.name.toLowerCase() === name.trim().toLowerCase()
      );
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Địa điểm đã tồn tại",
        });
      }

      const newLoc = {
        _id: generateId(),
        name: name.trim(),
        address: address.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryLocations.push(newLoc);

      return res.status(201).json({
        success: true,
        message: "Thêm địa điểm thành công",
        location: formatLocation(newLoc),
      });
    }

    const existing = await Location.findOne({
      name: name.trim(),
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Địa điểm đã tồn tại",
      });
    }

    const location = await Location.create({
      name: name.trim(),
      address: address.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Thêm địa điểm thành công",
      location: formatLocation(location),
    });
  } catch (error) {
    console.error(
      "Create location error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Không thể thêm địa điểm",
    });
  }
}

// =====================================================
// UPDATE
// =====================================================

export async function updateLocation(
  req: Request,
  res: Response
) {
  try {
    const { name, address } = req.body;

    if (!name || !address) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập tên và địa chỉ",
      });
    }

    if (!isDbConnected()) {
      const idx = memoryLocations.findIndex(
        (l) => l._id === req.params.id
      );
      if (idx === -1) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy địa điểm",
        });
      }
      memoryLocations[idx].name = name.trim();
      memoryLocations[idx].address = address.trim();
      memoryLocations[idx].updatedAt = new Date();

      return res.json({
        success: true,
        message: "Cập nhật địa điểm thành công",
        location: formatLocation(memoryLocations[idx]),
      });
    }

    const location =
      await Location.findByIdAndUpdate(
        req.params.id,
        {
          name: name.trim(),
          address: address.trim(),
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy địa điểm",
      });
    }

    return res.json({
      success: true,
      message: "Cập nhật địa điểm thành công",
      location: formatLocation(location),
    });
  } catch (error) {
    console.error(
      "Update location error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Không thể cập nhật địa điểm",
    });
  }
}

// =====================================================
// DELETE
// =====================================================

export async function deleteLocation(
  req: Request,
  res: Response
) {
  try {
    if (!isDbConnected()) {
      const idx = memoryLocations.findIndex(
        (l) => l._id === req.params.id
      );
      if (idx === -1) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy địa điểm",
        });
      }
      memoryLocations.splice(idx, 1);
      return res.json({
        success: true,
        message: "Xóa địa điểm thành công",
      });
    }

    const location =
      await Location.findByIdAndDelete(
        req.params.id
      );

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy địa điểm",
      });
    }

    return res.json({
      success: true,
      message: "Xóa địa điểm thành công",
    });
  } catch (error) {
    console.error(
      "Delete location error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Không thể xóa địa điểm",
    });
  }
}