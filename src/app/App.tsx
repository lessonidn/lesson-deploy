import { useRoutes } from 'react-router-dom'
import { userRoutes } from './router'
import { adminRoutes } from '../admin/src/app/router'

export default function App() {
  return useRoutes([
    ...userRoutes,
    ...adminRoutes,
  ])
}
