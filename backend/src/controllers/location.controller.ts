import { Request, Response } from "express";
import { Location } from "../models/Location.js";

function formatLocation(location: any) {
  return {
    id: location._id.toString(),
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
    const locations = await Location.find().sort({
      createdAt: 1,
    });

    return res.json({
      success: true,
      locations: locations.map(formatLocation),
    });
  } catch (error) {
    console.error("Get locations error:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách địa điểm",
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