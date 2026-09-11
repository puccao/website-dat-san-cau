import mongoose, { Schema, Document } from "mongoose";

export interface ICourt {
  id: string;
  name: string;
  type: string;
  status: "active" | "maintenance";
  regularPrice: number;
  peakPrice: number;
}

export interface ILocation extends Document {
  name: string;
  address: string;
  phone?: string;
  openTime: string;
  closeTime: string;
  courts: ICourt[];
  createdAt: Date;
  updatedAt: Date;
}

const CourtSchema = new Schema<ICourt>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, default: "Standard" },
    status: { type: String, enum: ["active", "maintenance"], default: "active" },
    regularPrice: { type: Number, default: 80000 },
    peakPrice: { type: Number, default: 120000 },
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
    courts: {
      type: [CourtSchema],
      default: [
        { id: "court_1", name: "Sân 1", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000 },
        { id: "court_2", name: "Sân 2", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000 },
        { id: "court_3", name: "Sân 3", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000 },
        { id: "court_4", name: "Sân 4", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000 },
      ],
    },
  },
  {
    timestamps: true,
  }
);

export const Location =
  mongoose.models.Location || mongoose.model<ILocation>("Location", LocationSchema);
