// AdminApp.tsx
import { useRoutes } from "react-router-dom";
import { adminRoutes } from "./router";

export default function AdminApp() {
  const element = useRoutes(adminRoutes);
  return element;
}