# ShopNest

ShopNest is a MERN e-commerce application with a React storefront, an Express API, and MongoDB persistence.

## Features

- Browse and search the product catalog, view product details, and manage a shopping cart.
- Register, sign in, and view a profile with order history.
- Create orders through the Razorpay checkout flow.
- Admin screens for products, users, orders, order status, and sales analytics.
- Upload product images through Cloudinary when Cloudinary is configured.

Razorpay is configured for **Test Mode**. Use Razorpay Test Mode credentials for the backend Key ID and secret, and for the frontend Key ID. Registration does not include OTP verification.

## Technology

- Frontend: React 18, Create React App (`react-scripts`), React Router, Redux Toolkit.
- Backend: Node.js, Express, Mongoose, MongoDB.
- Integrations: Razorpay Test Mode, Cloudinary, and optional Gmail-based email delivery.

## Local development

Install Node.js and run MongoDB locally, or prepare a MongoDB connection string.

### Backend

Create `backend/.env` using the variable names below. Replace every `your_...` placeholder with your own values and keep the file out of source control.

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/shopnest
JWT_SECRET=your_long_random_jwt_secret
FRONTEND_URL=http://localhost:3000
RAZORPAY_KEY_ID=your_razorpay_test_key_id
RAZORPAY_KEY_SECRET=your_razorpay_test_key_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
GMAIL_USER=your_sender_address
GMAIL_PASS=your_gmail_app_password
```

Cloudinary variables are needed for product image uploads. Gmail variables are optional and are used for application email delivery. Create a unique random value for `JWT_SECRET`. Use Razorpay test credentials for both backend Razorpay variables and the frontend key ID.

In a terminal:

```sh
cd backend
npm install
npm run dev
```

The API starts on port 5000 by default. `npm start` starts the backend without the development watcher.

### Frontend

Create `frontend/.env` with the public Razorpay Test Mode key ID:

```env
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_test_key_id
```

This key ID is included in the browser build; never put a Razorpay secret or other private credential in a `REACT_APP_` variable.

In a second terminal:

```sh
cd frontend
npm install
npm start
```

The frontend development server runs at `http://localhost:3000` and proxies API requests to `http://127.0.0.1:5000`. Start the backend first. To create a frontend production build, run `npm run build` from `frontend/`.

## Postman

Import `ShopNest_Postman_Collection.json`. Set `endpoint` to the backend base URL and set `token` to the JWT returned by the login request. Replace sample product and order IDs with IDs from your database where needed.
