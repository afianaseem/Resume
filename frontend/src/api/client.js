import axios from "axios";

const client = axios.create({
  baseURL: "/api",

  headers: {
    "Content-Type": "application/json",
  },

  // Prevent a dead Vercel/Supabase connection from
  // making the UI spin for 30-40 seconds.
  timeout: 8000,
});


client.interceptors.request.use((config) => {

  const token = localStorage.getItem("token");

  if (token) {

    config.headers = config.headers || {};

    config.headers.Authorization =
      `Bearer ${token}`;
  }

  return config;
});


export default client;
