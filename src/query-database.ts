import { Database } from 'sqlite3';

const db = new Database('database.sqlite');

db.serialize(() => {
  db.each("SELECT * FROM provider", (err, row) => {
    if (err) {
      console.error(err.message);
    }
    console.log(row);
  });

  db.each("SELECT * FROM client", (err, row) => {
    if (err) {
      console.error(err.message);
    }
    console.log(row);
  });

  db.each("SELECT * FROM reservation", (err, row) => {
    if (err) {
      console.error(err.message);
    }
    console.log(row);
  });
  
});

db.close();
