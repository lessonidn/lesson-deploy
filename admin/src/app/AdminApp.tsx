import { useRoutes } from 'react-router-dom'
import { adminRoutes } from './router'

export default function AdminApp() {
  return useRoutes(adminRoutes)
}
