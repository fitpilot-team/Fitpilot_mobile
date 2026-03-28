const { Client } = require('pg');
const c = new Client('postgresql://admin:secretpass@localhost:5433/fitpilot_db');
c.connect()
  .then(() => c.query("SELECT f.id, f.name, su.unit_name, su.gram_equivalent, su.is_exchange_unit FROM nutrition.foods f LEFT JOIN nutrition.serving_units su ON f.id = su.food_id WHERE f.name ILIKE '%stevia%'"))
  .then(r => console.log(r.rows))
  .catch(console.error)
  .finally(() => c.end());
