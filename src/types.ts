import { Request, Response } from "express";
export interface Hostel_room__allocation {
  EntryID: number;
  StudentID: string;
  SchoolSemester: string;
  HostelID: string;
  BedID: number;
  RoomNo: string;
  BedNo: string;
  Status: string;
  InsertedDate: string;
  InsertedBy: string;
}

export interface CustomRequest<T> extends Request {
  body: T;
}
