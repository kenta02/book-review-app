import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { ProfilePage } from "./pages/ProfilePage";
import { ReviewPage } from "./pages/ReviewPage";

export default function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Profile</Link> | <Link to="/reviews">Reviews</Link>
      </nav>
      <Routes>
        <Route path="/" element={<ProfilePage />} />
        <Route path="/reviews" element={<ReviewPage />} />
      </Routes>
    </BrowserRouter>
  );
}
