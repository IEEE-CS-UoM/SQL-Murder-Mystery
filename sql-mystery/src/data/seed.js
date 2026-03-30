export const SEED_SQL = `
CREATE TABLE crime_scene_report (
  date INTEGER,
  type TEXT,
  description TEXT,
  city TEXT
);

CREATE TABLE person (
  id INTEGER PRIMARY KEY,
  name TEXT,
  license_id INTEGER,
  address_number INTEGER,
  address_street_name TEXT,
  ssn INTEGER
);

CREATE TABLE drivers_license (
  id INTEGER PRIMARY KEY,
  age INTEGER,
  height INTEGER,
  eye_color TEXT,
  hair_color TEXT,
  gender TEXT,
  plate_number TEXT,
  car_make TEXT,
  car_model TEXT
);

CREATE TABLE interview (
  person_id INTEGER,
  transcript TEXT
);

CREATE TABLE get_fit_now_member (
  id TEXT PRIMARY KEY,
  person_id INTEGER,
  name TEXT,
  membership_start_date INTEGER,
  membership_status TEXT
);

CREATE TABLE get_fit_now_check_in (
  membership_id TEXT,
  check_in_date INTEGER,
  check_in_time INTEGER,
  check_out_time INTEGER
);

CREATE TABLE facebook_event_checkin (
  person_id INTEGER,
  event_id INTEGER,
  event_name TEXT,
  date INTEGER
);

CREATE TABLE income (
  ssn INTEGER PRIMARY KEY,
  annual_income INTEGER
);

INSERT INTO crime_scene_report VALUES
  (20180115,'murder','Security footage shows 2 witnesses. The first witness lives at the last house on Northwestern Dr. The second witness lives on Franklin Ave.','SQL City'),
  (20180115,'robbery','A theft occurred at the downtown mall.','SQL City'),
  (20180110,'assault','Bar fight on Elm St.','Databerg');

INSERT INTO person VALUES
  (10000,'Joe Germuska',  100001, 111, 'Northwestern Dr',    111111111),
  (10001,'Morty Schapiro',100002, 4,   'Northwestern Dr',    222222222),
  (10002,'Annabel Miller',100003, 103, 'Franklin Ave',        333333333),
  (10003,'Jeremy Bowers', 100004, 530, 'Washington Pl Apt 3A',444444444),
  (10004,'Stephanie Davis',100005,202, 'Maple Ave',           555555555),
  (10005,'Roger Rossa',   100006, 78,  'Elm St',              666666666),
  (10006,'Miranda Priestly',100010,1111,'Lake Ave',           777777777),
  (10007,'Bryan Pardo',   100007, 320, 'Oak Ave',             888888888),
  (10008,'Liz Friendman', 100008, 88,  'Franklin Ave',        999999999),
  (10009,'Tanya Engles',  100009, 999, 'Cedar Blvd',          101010101),
  (10010,'Max Russo',     100011, 12,  'Pine St',             121212121),
  (10011,'Diana Douglas', 100012, 450, 'Birch Rd',            131313131);

INSERT INTO drivers_license VALUES
  (100001,21,167,'brown','black','female','4H42WR','Tesla','Model S'),
  (100002,34,175,'blue','blonde','male','AB12CD','Toyota','Camry'),
  (100003,45,180,'green','red','male','XY99ZZ','BMW','3 Series'),
  (100004,29,162,'hazel','brunette','male','H42W0X','Nissan','Altima'),
  (100005,52,185,'brown','grey','male','00XJ27','Ford','F-150'),
  (100006,38,170,'blue','blonde','female','500XYZ','Honda','Civic'),
  (100007,27,158,'green','black','female','22AX5P','Mazda','3'),
  (100008,33,178,'brown','brunette','male','13GW59','Chevrolet','Malibu'),
  (100009,40,165,'blue','blonde','female','48Z55K','Mercedes','C-Class'),
  (100010,55,169,'grey','white','female','09IM63','Mercedes','C-Class'),
  (100011,31,169,'green','red','female','T1Z3UX','Audi','A4'),
  (100012,28,174,'blue','blonde','male','94FH3T','Toyota','Corolla');

INSERT INTO interview VALUES
  (10001,'I heard a gunshot then saw a man run out. He had a Get Fit Now Gym bag. The membership number started with "48Z". He got into a car with a plate that included "H42W".'),
  (10002,'I saw the same man. He was at the gym on January the 9th. He is a gold member.'),
  (10003,'I was hired by a woman with a lot of money. She drives a Mercedes. Grey eyes. She attended the SQL Symphony Concert exactly 3 times in December 2017.'),
  (10006,'You found me. But I did not act alone. Someone hired me. She attended the SQL Symphony Concert 3 times in December 2017, drives a Mercedes, and has grey eyes. Find her.');

INSERT INTO get_fit_now_member VALUES
  ('48Z7A',10003,'Jeremy Bowers', 20160101,'gold'),
  ('48Z55',10004,'Stephanie Davis',20170615,'silver'),
  ('90081',10005,'Roger Rossa',   20150301,'gold'),
  ('48Z22',10007,'Bryan Pardo',   20180101,'gold'),
  ('XTE42',10009,'Tanya Engles',  20171010,'silver');

INSERT INTO get_fit_now_check_in VALUES
  ('48Z7A',20180109,1600,1700),
  ('48Z7A',20180112,900, 1000),
  ('90081',20180109,1530,1700),
  ('48Z22',20180115,1400,1600),
  ('XTE42',20180201,800, 900),
  ('48Z55',20180201,1000,1100);

INSERT INTO facebook_event_checkin VALUES
  (10006,1143,'SQL Symphony Concert',20171206),
  (10006,1143,'SQL Symphony Concert',20171212),
  (10006,1143,'SQL Symphony Concert',20171229),
  (10003,1143,'SQL Symphony Concert',20171220),
  (10004,2244,'DataFest Mixer',      20180115),
  (10009,3311,'Lambda Lunch',        20180201);

INSERT INTO income VALUES
  (111111111,35000),(222222222,42000),(333333333,61000),
  (444444444,55000),(555555555,48000),(666666666,39000),
  (777777777,310000),
  (888888888,52000),(999999999,44000),(101010101,67000),
  (121212121,31000),(131313131,50000);
`;
