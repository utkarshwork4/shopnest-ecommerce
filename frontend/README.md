# ShopNest frontend

The ShopNest frontend is a React single-page application built with Create React App and `react-scripts`. It uses React Router for navigation and Redux Toolkit for cart state.

## Run locally

Start the backend first. From the `frontend/` directory:

```sh
npm install
npm start
```

The development server runs at `http://localhost:3000` and proxies API requests to `http://127.0.0.1:5000`. The backend must be running on that address.

Set `REACT_APP_RAZORPAY_KEY_ID` in `frontend/.env` to a Razorpay **Test Mode** Key ID. The key ID is public and is embedded in the browser build; do not put private credentials in frontend environment variables.

Create a production build with:

```sh
npm run build
```

See the root `README.md` for backend setup, environment variables, and the application feature overview. Registration does not include OTP verification.
