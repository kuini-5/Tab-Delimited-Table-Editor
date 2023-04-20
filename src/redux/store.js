import { configureStore } from '@reduxjs/toolkit'
import layoutSlice from './slice'

export default configureStore({
  reducer: {
    layout: layoutSlice,
  },
  middleware: [],
})