-- Connect to students_db and create table
-- Removed \connect metacommand - database is specified at psql invocation

CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  roll_no VARCHAR(16) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  department TEXT,
  year INT,
  subject TEXT,
  marks INT,
  dob DATE
);

CREATE INDEX idx_students_subject_marks ON students(subject, marks);

-- Seed with 200 sample rows
INSERT INTO students (roll_no, name, department, year, subject, marks, dob) VALUES
('CS001', 'Aditya Kumar', 'Computer Science', 1, 'Data Structures', 92, '2003-01-15'),
('CS002', 'Priya Singh', 'Computer Science', 1, 'Algorithms', 88, '2003-03-22'),
('CS003', 'Rajesh Patel', 'Computer Science', 1, 'Database Systems', 85, '2003-05-10'),
('CS004', 'Ananya Sharma', 'Computer Science', 2, 'Web Development', 91, '2002-07-18'),
('CS005', 'Vikram Verma', 'Computer Science', 2, 'Machine Learning', 87, '2002-09-25'),
('CS006', 'Sneha Kapoor', 'Computer Science', 2, 'Cloud Computing', 89, '2002-11-12'),
('CS007', 'Harsh Gupta', 'Computer Science', 3, 'Software Engineering', 84, '2001-02-14'),
('CS008', 'Neha Pant', 'Computer Science', 3, 'Cybersecurity', 90, '2001-04-20'),
('CS009', 'Arjun Reddy', 'Computer Science', 3, 'Data Structures', 86, '2001-06-08'),
('CS010', 'Pooja Nair', 'Computer Science', 4, 'Artificial Intelligence', 93, '2000-08-30'),
('ECE001', 'Rohan Iyer', 'Electronics', 1, 'Circuit Theory', 81, '2003-10-05'),
('ECE002', 'Divya Sharma', 'Electronics', 1, 'Signals and Systems', 79, '2003-12-11'),
('ECE003', 'Siddharth Roy', 'Electronics', 2, 'Microprocessors', 82, '2002-01-28'),
('ECE004', 'Ritika Rao', 'Electronics', 2, 'Digital Logic', 80, '2002-03-15'),
('ECE005', 'Akshay Singh', 'Electronics', 3, 'Communication Systems', 77, '2001-05-22'),
('MECH001', 'Sameer Khan', 'Mechanical', 1, 'Thermodynamics', 75, '2003-07-09'),
('MECH002', 'Shreya Desai', 'Mechanical', 1, 'Fluid Mechanics', 78, '2003-09-16'),
('MECH003', 'Nikhil Sharma', 'Mechanical', 2, 'Machine Design', 76, '2002-11-23'),
('MECH004', 'Anjali Kapoor', 'Mechanical', 2, 'Heat Transfer', 74, '2002-01-30'),
('MECH005', 'Aryan Verma', 'Mechanical', 3, 'Robotics', 79, '2001-03-08');

-- Insert 180 more rows with varied data
DO $$
DECLARE
  i INT;
  departments TEXT[] := ARRAY['Computer Science', 'Electronics', 'Mechanical', 'Civil'];
  subjects TEXT[] := ARRAY['Data Structures', 'Algorithms', 'Database Systems', 'Web Development', 'Machine Learning', 'Circuit Theory', 'Signals and Systems', 'Thermodynamics', 'Fluid Mechanics', 'Machine Design'];
  names TEXT[] := ARRAY['Amit', 'Bharti', 'Chetan', 'Deepika', 'Emile', 'Fiona', 'Gaurav', 'Harsha', 'Iris', 'Jaya', 'Karan', 'Lina', 'Mani', 'Nina', 'Omar', 'Priya', 'Quincy', 'Rajesh', 'Sneha', 'Tara'];
  surnames TEXT[] := ARRAY['Kumar', 'Singh', 'Patel', 'Sharma', 'Verma', 'Kapoor', 'Gupta', 'Nair', 'Reddy', 'Iyer', 'Rao', 'Khan', 'Desai', 'Roy', 'Pandey', 'Joshi', 'Agarwal', 'Bhat', 'Chowdhury', 'Dhillon'];
BEGIN
  FOR i IN 1..180 LOOP
    INSERT INTO students (roll_no, name, department, year, subject, marks, dob)
    VALUES (
      CONCAT(SUBSTRING(departments[((i-1) % 4) + 1], 1, 1), LPAD(i::TEXT, 4, '0')),
      names[((i-1) % 20) + 1] || ' ' || surnames[((i-1) % 20) + 1],
      departments[((i-1) % 4) + 1],
      ((i-1) % 4) + 1,
      subjects[((i-1) % 10) + 1],
      FLOOR(RANDOM() * 40 + 60)::INT,
      DATE '2003-01-01' - INTERVAL '1 day' * ((i-1) % 1825)
    );
  END LOOP;
END $$;
