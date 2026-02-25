import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardPage } from "./pages/DashBoard";
import { ProfilePage } from "./pages/ProfilePage";
import { ReviewPage } from "./pages/ReviewPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/reviews" element={<ReviewPage />} />
        <Route path="/" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}
