import { useRoutes } from 'react-router-dom'
import { userRoutes } from './router'

export default function App() {
  return useRoutes(userRoutes)
}
