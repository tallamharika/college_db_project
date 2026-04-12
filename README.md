# College DB Project

## Features
- Admin login
- Add student
- Edit student
- Delete student
- Upload student photo
- Export data
- Session-based authentication

## Tech Stack
- Node.js
- Express
- MySQL
- EJS
- Multer
- bcrypt

## How to Run

1. npm install
2. Create MySQL database
3. Update DB credentials
4. node index.js
5. Open localhost:3000
## Database Table

Create a table named `students`:

id INT PRIMARY KEY AUTO_INCREMENT
name VARCHAR(100)
age INT
branch VARCHAR(50)
cgpa DECIMAL(3,2)
photo VARCHAR(255)
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
