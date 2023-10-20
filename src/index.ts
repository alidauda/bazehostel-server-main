import Express from 'express';
import Redis from 'ioredis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import { PrismaClient } from '@prisma/client';
import { CustomRequest, Hostel_room__allocation } from './types';
import cors from 'cors';
import router from './routes/beds';

declare module 'express-session' {
  interface SessionData {
    studentId: string;
    studentName: string;
    gender: string;
    urlId: string;
  }
}

export const prisma = new PrismaClient();

const app = Express();
const RedisStore = connectRedis(session);
const redis = new Redis();
app.use(cors());
app
  .use(
    session({
      store: new RedisStore({ client: redis }),
      secret: 'secret$%^134',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // if true only transmit cookie over https
        httpOnly: false, // if true prevent client side JS from reading the cookie
      },
    })
  )
  .use(Express.json())
  .use('/', (req, _res, next) => {
    req.session.gender = 'Male';
    req.session.studentName = 'female';
    req.session.studentId = 'BU/22C/PGS/7111';
    next();
  });

app.get('/', async (req, res) => {});

app.get('/bed', router);

app.get('/floor/:id', async (req, res) => {
  try {
    const floor = await prisma.hostel_room_bed.findMany({});
    res.status(200).send({ floor });
  } catch (e) {
    res.status(404).send('please an error has occured');
  }
});

app.get('/getBed/:id/:hostelId', async (req, res) => {
  const { id, hostelId } = req.params;

  try {
    const getBed = await prisma.hostel_room_bed.findMany({
      where: {
        RoomNo: hostelId.toString(),
        HostelID: parseInt(id),
      },
    });
    res.status(200).send({ getBed });
  } catch (e) {
    res.status(404).send({ e });
  }
});
app.post('/studentallocation', async (req, res) => {
  const {
    BedNo: bedNo,
    EntryID: entryID,
    HosteID: hosteID,
    RoomNo: roomNo,
    Status: status,
    BedID: bedId,
  } = req.body;
  const studentId = req.session.studentId;

  console.log(req.body);
  const hostel_room_allocation = await prisma.hostel_room_allocation.create({
    data: {
      StudentID: studentId!,
      InsertedBy: studentId!,
      SchoolSemester: '22c',
      BedID: parseInt(bedId),
      BedNo: bedNo,
      RoomNo: roomNo,
      HostelID: hosteID,
      Status: status,
    },
  });
  const hostel_room_bed = await prisma.hostel_room_bed.updateMany({
    data: {
      Status: 'Reserved',
      OccupantID: studentId,
    },
    where: {
      HostelID: parseInt(hosteID),
      RoomNo: roomNo,
      BedNo: bedNo,
    },
  });

  res.status(200).send({ message: 'reservation succsefully ' });
});
app.get('/hostel_room__allocation', async (req, res) => {
  const studentId = req.session.studentId;
  try {
    const hostel_room_allocation = await prisma.hostel_room_allocation.findMany(
      {
        where: {
          StudentID: studentId,
        },
      }
    );
    res.status(200).send({ hostel_room_allocation });
  } catch (e) {
    res.status(404).send({ message: 'not found' });
  }
});
app.post(
  '/delete_allocation',
  async (req: CustomRequest<Hostel_room__allocation>, res) => {
    const studentId = req.session.studentId;
    const { BedID, SchoolSemester, HostelID, Status, RoomNo } = req.body;
    try {
      const delete_allocation = await prisma.hostel_room_allocation.deleteMany({
        where: {
          StudentID: studentId,
          SchoolSemester,
          HostelID,
          RoomNo,
          BedID,
        },
      });
      const change_status = await prisma.hostel_room_bed.update({
        data: {
          OccupantID: null,
          Status: 'Available',
        },
        where: {
          EntryID: BedID,
        },
      });

      res.status(200).send({ data: 'deleted' });
    } catch {
      res
        .status(400)
        .send({ message: 'an error has occuried please try again' });
    }
  }
);
app.get('/roomName/:id', async (req, res) => {
  const gender = req.session.gender;
  const check = await prisma.hostel.findMany({
    where: {
      Gender: gender,
    },
  });

  const { id } = req.params;

  const idExists = check.some((item) => item.EntryID === parseFloat(id));
  if (!idExists) {
    res.status(404).send('nodata');
  } else {
    try {
      const disFloor = await prisma.hostel_room_bed.findMany({
        where: {
          HostelID: parseInt(id),
        },
        distinct: ['FloorName'],
        select: {
          FloorName: true,
        },
      });
      const dissFloor = await prisma.hostel_room_bed.findMany({
        where: {
          HostelID: parseInt(id),
        },
      });
      const getroomNo = await prisma.hotel_room.findMany({
        where: {
          Status: 'room',
          HostelID: parseInt(id),
        },
      });
      const floor = await prisma.hostel.findFirst({
        where: {
          EntryID: parseInt(id),
        },
      });

      res.send({ floorName: disFloor, getroomNo, floor, dissFloor });
    } catch (e) {
      res.status(404).send({ error: e });
    }
  }
});

app.get('/status', async (req, res) => {
  const userId = req.session.studentId;
  console.log(userId);
  const status = await prisma.hostel_room_allocation.findFirst({
    where: {
      StudentID: userId,
    },
  });
  console.log(status);
  if (status) {
    res.send({ status, userId: userId });
  } else {
    res.status(200).send({ status }); // or handle the case when status is falsy
  }
});
app.get('/floor/:id', async (req, res) => {
  console.log(req.session.studentId);
  const { id } = req.params;
  try {
    const disFloor = await prisma.hostel_room_bed.findMany({
      where: {
        HostelID: parseInt(id),
      },

      distinct: ['FloorName'],
      select: {
        FloorName: true,
      },
    });

    res.status(200).send({ floorName: disFloor });
  } catch {
    res.status(404).send({ floorName: [] });
  }
});
app.get('/hostel_rooms/:id', async (req, res) => {
  const { id } = req.params;
  const hostel_room = await prisma.hotel_room.findMany({
    where: {
      HostelID: parseInt(id),
      Status: 'room',
    },
  });
  const disFloor = await prisma.hostel_room_bed.findMany({
    where: {
      HostelID: parseInt(id),
    },
    distinct: ['FloorName'],
    select: {
      FloorName: true,
    },
  });
  const floor = await prisma.hostel.findFirst({
    where: {
      EntryID: parseInt(id),
    },
  });
  res.send({ rooms: hostel_room, floor: disFloor, floorManager: floor });
});
app.get('/hostel_rooms_bed/:id', async (req, res) => {
  const { id } = req.params;
  const hostel_rooms_bed = await prisma.hostel_room_bed.findMany({
    where: {
      HostelID: parseInt(id),
    },
  });

  res.send({ getBed: hostel_rooms_bed });
});

app.listen(4000, '192.168.1.142', () => {
  console.log('server is working');
});
