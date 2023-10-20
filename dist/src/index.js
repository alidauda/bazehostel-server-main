"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ioredis_1 = __importDefault(require("ioredis"));
const express_session_1 = __importDefault(require("express-session"));
const connect_redis_1 = __importDefault(require("connect-redis"));
const client_1 = require("@prisma/client");
var cors = require('cors');
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
const RedisStore = (0, connect_redis_1.default)(express_session_1.default);
const redis = new ioredis_1.default();
app.use(cors());
app
    .use((0, express_session_1.default)({
    store: new RedisStore({ client: redis }),
    secret: 'secret$%^134',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: false,
        maxAge: 1000 * 60 * 10, // session max age in miliseconds
    },
}))
    .use(express_1.default.json())
    .use('/', (req, res, next) => {
    req.session.gender = 'Male';
    req.session.studentName = 'female';
    req.session.studentId = 'BU/22C/PGS/7111';
    next();
});
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const gender = req.session.gender;
    try {
        const hostel = yield prisma.hostel.findMany({
            where: { Gender: gender },
        });
        res.send({ hostel });
    }
    catch (e) {
        res.status(404).send('not found');
    }
}));
app.get('/listofbeds/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    let availableRooms = 0;
    let availableBed = 0;
    let totalrooms = 0;
    let totalBed = 0;
    let underMaintenance = 0;
    let occupied = 0;
    let reserved = 0;
    try {
        const rooms = yield prisma.hostel_room_bed.findMany({
            where: { HostelID: parseInt(id) },
            distinct: ['RoomNo'],
        });
        for (let i of rooms) {
            if (i.Status === 'Available') {
                availableRooms++;
                availableBed += parseInt(i.BedNo);
            }
            if (i.Status === `Under Maintenance`)
                underMaintenance++;
            if (i.Status === 'Occupied')
                occupied++;
            if (i.Status === 'Reserved')
                reserved++;
            totalBed += parseInt(i.BedNo);
            totalrooms++;
        }
        res
            .send({
            availableRooms,
            availableBed,
            totalrooms,
            totalBed,
            underMaintenance,
            occupied,
            reserved,
        })
            .sendStatus(200);
    }
    catch (e) { }
}));
app.get('/floor/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const floor = yield prisma.hostel_room_bed.findMany({});
        res.status(200).send({ floor });
    }
    catch (e) {
        res.status(404).send('please an error has occured');
    }
}));
app.get('/getBed/:id/:hostelId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, hostelId } = req.params;
    try {
        const getBed = yield prisma.hostel_room_bed.findMany({
            where: {
                RoomNo: hostelId.toString(),
                HostelID: parseInt(id),
            },
        });
        res.status(200).send({ getBed });
    }
    catch (e) {
        res.status(404).send({ e });
    }
}));
app.post('/studentallocation', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { BedNo: bedNo, EntryID: entryID, HosteID: hosteID, RoomNo: roomNo, Status: status, BedID: bedId, } = req.body;
    const studentId = req.session.studentId;
    console.log(req.body);
    const hostel_room_allocation = yield prisma.hostel_room_allocation.create({
        data: {
            StudentID: studentId,
            InsertedBy: studentId,
            SchoolSemester: '22c',
            BedID: parseInt(bedId),
            BedNo: bedNo,
            RoomNo: roomNo,
            HostelID: hosteID,
            Status: status,
        },
    });
    const hostel_room_bed = yield prisma.hostel_room_bed.updateMany({
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
}));
app.get('/hostel_room__allocation', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const studentId = req.session.studentId;
    try {
        const hostel_room_allocation = yield prisma.hostel_room_allocation.findMany({
            where: {
                StudentID: studentId,
            },
        });
        res.status(200).send({ hostel_room_allocation });
    }
    catch (e) {
        res.status(404).send({ message: 'not found' });
    }
}));
app.post('/delete_allocation', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const studentId = req.session.studentId;
    const { BedID, SchoolSemester, HostelID, Status, RoomNo } = req.body;
    try {
        const delete_allocation = yield prisma.hostel_room_allocation.deleteMany({
            where: {
                StudentID: studentId,
                SchoolSemester,
                HostelID,
                RoomNo,
                BedID,
            },
        });
        const change_status = yield prisma.hostel_room_bed.update({
            data: {
                OccupantID: null,
                Status: 'Available',
            },
            where: {
                EntryID: BedID,
            },
        });
        res.status(200).send({ data: 'deleted' });
    }
    catch (_a) {
        res
            .status(400)
            .send({ message: 'an error has occuried please try again' });
    }
}));
app.get('/roomName/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const gender = req.session.gender;
    const check = yield prisma.hostel.findMany({
        where: {
            Gender: gender,
        },
    });
    const { id } = req.params;
    const idExists = check.some((item) => item.EntryID === parseFloat(id));
    if (!idExists) {
        res.status(404).send('nodata');
    }
    else {
        try {
            const disFloor = yield prisma.hostel_room_bed.findMany({
                where: {
                    HostelID: parseInt(id),
                },
                distinct: ['FloorName'],
                select: {
                    FloorName: true,
                },
            });
            const dissFloor = yield prisma.hostel_room_bed.findMany({
                where: {
                    HostelID: parseInt(id),
                },
            });
            const getroomNo = yield prisma.hotel_room.findMany({
                where: {
                    Status: 'room',
                    HostelID: parseInt(id),
                },
            });
            const floor = yield prisma.hostel.findFirst({
                where: {
                    EntryID: parseInt(id),
                },
            });
            res.send({ floorName: disFloor, getroomNo, floor, dissFloor });
        }
        catch (e) {
            res.status(404).send({ error: e });
        }
    }
}));
app.get('/status', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.session.studentId;
    console.log(userId);
    const status = yield prisma.hostel_room_allocation.findFirst({
        where: {
            StudentID: userId,
        },
    });
    console.log(status);
    if (status) {
        res.send({ status, userId: userId });
    }
    else {
        res.status(200).send({ status }); // or handle the case when status is falsy
    }
}));
app.get('/floor/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.session.studentId);
    const { id } = req.params;
    try {
        const disFloor = yield prisma.hostel_room_bed.findMany({
            where: {
                HostelID: parseInt(id),
            },
            distinct: ['FloorName'],
            select: {
                FloorName: true,
            },
        });
        res.status(200).send({ floorName: disFloor });
    }
    catch (_b) {
        res.status(404).send({ floorName: [] });
    }
}));
app.get('/hostel_rooms/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const hostel_room = yield prisma.hotel_room.findMany({
        where: {
            HostelID: parseInt(id),
            Status: 'room',
        },
    });
    const disFloor = yield prisma.hostel_room_bed.findMany({
        where: {
            HostelID: parseInt(id),
        },
        distinct: ['FloorName'],
        select: {
            FloorName: true,
        },
    });
    const floor = yield prisma.hostel.findFirst({
        where: {
            EntryID: parseInt(id),
        },
    });
    res.send({ rooms: hostel_room, floor: disFloor, floorManager: floor });
}));
app.get('/hostel_rooms_bed/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const hostel_rooms_bed = yield prisma.hostel_room_bed.findMany({
        where: {
            HostelID: parseInt(id),
        },
    });
    res.send({ getBed: hostel_rooms_bed });
}));
app.listen(4000, '192.168.1.142', () => {
    console.log('server is working');
});
