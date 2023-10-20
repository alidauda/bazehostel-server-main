import { Request, Response } from 'express';
import { prisma } from '../index';

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
export const getAllHostels = async (req: Request, res: Response) => {
  const gender = req.session.gender;

  try {
    const hostel = await prisma.hostel.findMany({
      where: { Gender: gender },
    });

    res.send({ data: hostel });
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      res.status(404).send({ error: e.message, data: null });
    }
  }
};

export const getHostelInfo = async (req: Request, res: Response) => {
  const { id } = req.params;
  let availableRooms = 0;
  let availableBed = 0;
  let totalrooms = 0;
  let totalBed = 0;
  let underMaintenance = 0;
  let occupied = 0;
  let reserved = 0;

  try {
    const rooms = await prisma.hostel_room_bed.findMany({
      where: { HostelID: parseInt(id) },
      distinct: ['RoomNo'],
    });
    for (let i of rooms) {
      if (i.Status === 'Available') {
        availableRooms++;
        availableBed += parseInt(i.BedNo);
      }
      if (i.Status === `Under Maintenance`) underMaintenance++;
      if (i.Status === 'Occupied') occupied++;
      if (i.Status === 'Reserved') reserved++;

      totalBed += parseInt(i.BedNo);
      totalrooms++;
    }

    res
      .send({
        data: {
          availableRooms,
          availableBed,
          totalrooms,
          totalBed,
          underMaintenance,
          occupied,
          reserved,
        },
      })
      .sendStatus(200);
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      res.status(404).send({ error: e.message, data: null });
    }
  }
};
