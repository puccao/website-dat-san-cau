import mongoose, { Schema, Document } from "mongoose";

export interface ILocation extends Document {
  name: string;
  address: string;
}

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
  },
  {
    timestamps: true,
  }
);

export const Location =
  mongoose.models.Location ||
  mongoose.model<ILocation>(
    "Location",
    LocationSchema
  );