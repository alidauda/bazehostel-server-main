import express from 'express';
import { getAllHostels, getHostelInfo } from '../handlers/hostels';
const router = express.Router();

router.get('/hostels', getAllHostels);
router.get('/hostelInfo', getHostelInfo);

export default router;
