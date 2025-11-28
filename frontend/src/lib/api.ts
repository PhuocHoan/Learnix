import axios from "axios";
import { config } from "./config";

export const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important: Send cookies with cross-origin requests
});
