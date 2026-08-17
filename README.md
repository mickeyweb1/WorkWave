# 🌊 WorkWave - Multi-Branch Business Management SaaS

**WorkWave** is a comprehensive, secure, and scalable ERP/SaaS solution designed for retail and distribution businesses. It allows business owners to manage multi-branch inventory, track daily sales and expenses, monitor worker activity, and visualize profitability in real-time. 

Built from the ground up with a focus on **Multi-Tenant Data Isolation** and **Role-Based Access Control (RBAC)**, WorkWave ensures that sensitive financial data remains strictly compartmentalized and secure.

---

## 🚀 Key Features

### 🏢 For the Business Owner (Admin)
* **Business Command Center:** A real-time dashboard featuring interactive pie charts and bar graphs (via Recharts) showing Top Selling Products, Most Profitable Branches, and Critical Low-Stock Alerts.
* **Master Inventory System:** Create a global product catalog and assign branch-specific pricing, stock levels, and categories.
* **Financial Control:** View all sales and expenses with built-in **CSV Export** for easy accounting.
* **Activity & Security Logs:** A permanent, uneditable timeline tracking every login, sale, voided transaction, and system change.
* **Worker Onboarding:** Generate secure, one-time invite links to onboard branch staff without sharing passwords.
* **Real-Time Notifications:** Instant alerts for low stock, voided sales, and system anomalies.

### 📱 For the Branch Staff (Worker)
* **Mobile-First Portal:** A fully responsive, tablet-friendly interface designed for fast-paced shop environments.
* **Quick Sales & Restocking:** Record sales (with automatic inventory deduction) and log new delivery truck arrivals in seconds.
* **Camera Receipt Uploads:** Snap photos of physical receipts directly from a mobile device, securely uploaded to the cloud for Admin verification.
* **Branch Isolation:** Workers can only see data, stock, and prices for the specific branch they are assigned to.

### 🛡️ Enterprise-Grade Security
* **Multi-Tenant Architecture:** Strict backend filtering ensures Admin A can *never* access the branches, workers, or financial data of Admin B.
* **JWT Authentication:** Secure, token-based session management.
* **Password Hashing:** All user passwords are encrypted using `bcryptjs`.
* **Cloud Asset Management:** Receipt images are securely stored and served via Cloudinary.

---

## 🛠️ Tech Stack

| Category | Technologies |
| :--- | :--- |
| **Frontend** | React.js, Vite, React Router DOM, Recharts (Data Visualization), Lucide Icons |
| **Backend** | Node.js, Express.js, REST API Architecture |
| **Database** | MongoDB, Mongoose (ODM) |
| **Security** | JWT (JSON Web Tokens), Bcrypt, CORS, Multi-tenant Query Filtering |
| **Cloud/Storage** | Cloudinary (Image/Receipt Uploads) |
| **Deployment** | Vercel (Frontend), Render (Backend), MongoDB Atlas (Database) |

---

## ⚙️ Local Installation & Setup

If you want to run WorkWave locally on your machine, follow these steps:

### Prerequisites
* Node.js (v16 or higher)
* MongoDB (Local or Atlas URI)
* Cloudinary Account (for image uploads)

### 1. Clone the Repository
```bash
git clone https://github.com/mickeyweb1/workwave.git
cd workwave

2. Backend Setup
  cd server
  npm install 

Create a .env file in the server folder and add your variables:
  PORT=5000
  MONGODB_URI=your_mongodb_connection_string
  JWT_SECRET=your_super_secret_jwt_key
  CLOUDINARY_CLOUD_NAME=your_cloud_name
  CLOUDINARY_API_KEY=your_api_key
  CLOUDINARY_API_SECRET=your_api_secret

Start the backend server:
  npm run dev

3. Frontend Setup
Open a new terminal window:
  cd client
  npm install

Create a .env file in the client folder:
  VITE_API_URL=http://localhost:5000

Start the frontend development server:
  npm run dev

📈 Future Roadmap
  Integration with SMS gateways for customer receipts.
  Advanced predictive analytics for inventory restocking.
  Native mobile applications (React Native) for iOS and Android.
  Payroll management and worker commission tracking.
👨‍💻 Author
  Mickeyweb
  Lead Developer & Architect
  Built with 💙 to solve real-world business logistics and financial tracking challenges.