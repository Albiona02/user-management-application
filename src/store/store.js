import { configureStore } from "@reduxjs/toolkit";
import usersReducer from "./usersSlice.js"; // adjust path if needed

export const store = configureStore({
  reducer: {
    users: usersReducer,
  },
});
