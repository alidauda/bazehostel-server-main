import csv from 'csv-parser';
import fs from 'fs';

fs.createReadStream('hostel.csv')
  .pipe(csv())
  .on('data', (data) => console.log(data));
