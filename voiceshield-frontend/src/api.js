import axios from "axios";

export const API_BASE_URL =
  process.env.REACT_APP_API_URL?.replace(/\/$/, "") ||
  "https://voice-shield-qfmp.onrender.com";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getErrorMessage = (error, fallback) =>
  error.response?.data?.message ||
  error.response?.data?.msg ||
  error.response?.data?.error ||
  fallback;
