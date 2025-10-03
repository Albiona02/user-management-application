
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";


export const fetchUsers = createAsyncThunk("users/fetchUsers", async () => {
  const res = await fetch("https://jsonplaceholder.typicode.com/users");
  return await res.json();
});

const usersSlice = createSlice({
  name: "users",
  initialState: { list: [], status: "idle" },
  reducers: {
    addUser: (state, action) => {
      state.list.unshift(action.payload);
    },
    updateUser: (state, action) => {
      const index = state.list.findIndex((u) => u.id === action.payload.id);
      if (index >= 0) state.list[index] = action.payload;
    },
    deleteUser: (state, action) => {
      state.list = state.list.filter((u) => u.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchUsers.fulfilled, (state, action) => {
      state.list = action.payload;
      state.status = "success";
    });
  },
});

export const { addUser, updateUser, deleteUser } = usersSlice.actions;
export default usersSlice.reducer;
