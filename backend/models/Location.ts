import mongoose, { Schema, Document } from "mongoose";

export interface IZone {
  id: string;
  name: string;
  description?: string;
}

export interface ICourt {
  id: string;
  name: string;
  type: string;
  status: "active" | "maintenance";
  regularPrice: number;
  peakPrice: number;
  zone?: string; // Khu vực của sân (ví dụ: Khu A, Khu B, Khu VIP...)
  position?: string; // Vị trí sân trong khuôn viên (ví dụ: Khu A - Sân 1, Sân trung tâm 1, v.v.)
}

export interface ILocation extends Document {
  name: string;
  address: string;
  district?: string;
  city?: string;
  phone?: string;
  openTime: string;
  closeTime: string;
  mapUrl?: string;
  latitude?: number;
  longitude?: number;
  directions?: string; // Hướng dẫn vị trí, lối vào, bãi đỗ xe
  zones?: IZone[]; // Danh sách các khu vực trong cơ sở (Khu A, Khu B, Khu VIP...)
  courts: ICourt[];
  createdAt: Date;
  updatedAt: Date;
}

const ZoneSchema = new Schema<IZone>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const CourtSchema = new Schema<ICourt>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, default: "Standard" },
    status: { type: String, enum: ["active", "maintenance"], default: "active" },
    regularPrice: { type: Number, default: 80000 },
    peakPrice: { type: Number, default: 120000 },
    zone: { type: String, default: "Khu A" },
    position: { type: String, default: "Sân tiêu chuẩn" },
  },
  { _id: false }
);

const LocationSchema = new Schema<ILocation>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    district: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      default: "Hà Nội",
    },
    phone: {
      type: String,
      trim: true,
      default: "0900 000 000",
    },
    openTime: {
      type: String,
      default: "06:00",
    },
    closeTime: {
      type: String,
      default: "22:00",
    },
    mapUrl: {
      type: String,
      trim: true,
      default: "",
    },
    latitude: {
      type: Number,
      default: 0,
    },
    longitude: {
      type: Number,
      default: 0,
    },
    directions: {
      type: String,
      trim: true,
      default: "",
    },
    zones: {
      type: [ZoneSchema],
      default: [
        { id: "zone_a", name: "Khu A (Tầng 1)", description: "Mặt thảm Enlio tiêu chuẩn thi đấu, gần lễ tân" },
        { id: "zone_b", name: "Khu B (Tầng 1)", description: "Không gian thoáng mát cạnh khán đài" },
        { id: "zone_vip", name: "Khu VIP (Tầng 2)", description: "Thảm Yonex cao cấp có máy lạnh" },
      ],
    },
    courts: {
      type: [CourtSchema],
      default: [
        { id: "court_1", name: "Sân 1", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000, zone: "Khu A (Tầng 1)", position: "Sân số 1" },
        { id: "court_2", name: "Sân 2", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000, zone: "Khu A (Tầng 1)", position: "Sân số 2" },
        { id: "court_3", name: "Sân 3", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000, zone: "Khu B (Tầng 1)", position: "Sân số 3" },
        { id: "court_4", name: "Sân 4", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000, zone: "Khu B (Tầng 1)", position: "Sân số 4" },
      ],
    },
  },
  {
    timestamps: true,
  }
);

export const Location =
  mongoose.models.Location || mongoose.model<ILocation>("Location", LocationSchema);
