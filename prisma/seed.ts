import { PrismaClient } from '@prisma/client';
import csv from 'csv-parser';
import fs from 'fs';
const results: any = [];
fs.createReadStream('hostel.csv')
  .pipe(csv())
  .on('data', async (data) => results.push(data))
  .on('end', async () => {
    await prisma.hostel.createMany({
      data: results.map((data: any) => ({
        ...data,
      })),
    });
  });
const prisma = new PrismaClient();
