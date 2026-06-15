FoodTracker

Food delivery order tracker with restaurant and customer views.
Stack: Next.js + Express + MySQL + WebSocket

Setup

bash: 
git clone <repo-url>
cd FoodTracker

Backend

bash:
cd backend
npm install

Create .env file:

PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=foodtracker
DB_USER=root
DB_PASSWORD=yourpassword
JWT_SECRET=anysecretkey
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
NODE_ENV=development

Create database:

bash:
mysql -u root -p -e "CREATE DATABASE foodtracker;"

Migrate and seed:

bash:
node src/config/migrate.js
node src/config/seed.js

Run:

bash:
npm run dev

Frontend

bash:
cd frontend
npm install

Create .env.local file:

NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000

Run:

bash:
npm run dev

Test Logins

Restaurant: restaurant@demo.com / password123

Customer: customer@demo.com / password123

How to Test


Open two browser windows
Login as restaurant in one, customer in other
Place order as customer
Update status as restaurant
See live update on customer side
