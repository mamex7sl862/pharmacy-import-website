import { Routes, Route } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Products from './pages/Products'
import Categories from './pages/Categories'
import About from './pages/About'
import Services from './pages/Services'
import Contact from './pages/Contact'
import RFQ from './pages/RFQ'
import RFQSuccess from './pages/RFQSuccess'
import TrackRFQ from './pages/TrackRFQ'
import Compare from './pages/Compare'
import CustomerDashboard from './pages/CustomerDashboard'
import CustomerRFQDetail from './pages/CustomerRFQDetail'
import AdminDashboard from './pages/AdminDashboard'
import AdminProducts from './pages/AdminProducts'
import AdminContent from './pages/AdminContent'
import AdminChat from './pages/AdminChat'
import AdminContactMessages from './pages/AdminContactMessages'
import AdminSettings from './pages/AdminSettings'
import RFQList from './pages/RFQList'
import RFQDetails from './pages/RFQDetails'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import ProtectedRoute from './components/ProtectedRoute'
import LiveChat from './components/LiveChat'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <ScrollToTop />
      <Routes>
        {/* Admin routes — no public navbar */}
        <Route path="/admin/*" element={
          <ProtectedRoute role="admin">
            <Routes>
              <Route index element={<AdminDashboard />} />
              <Route path="rfqs" element={<RFQList />} />
              <Route path="rfqs/:id" element={<RFQDetails />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="products/new" element={<AdminProducts />} />
              <Route path="content" element={<AdminContent />} />
              <Route path="chat" element={<AdminChat />} />
              <Route path="messages" element={<AdminContactMessages />} />
              <Route path="settings" element={<AdminSettings />} />
            </Routes>
          </ProtectedRoute>
        } />

        {/* Public + customer routes */}
        <Route path="*" element={
          <>
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/about" element={<About />} />
                <Route path="/services" element={<Services />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/rfq" element={<RFQ />} />
                <Route path="/rfq/success/:rfqNumber" element={<RFQSuccess />} />
                <Route path="/track" element={<TrackRFQ />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/portal/*" element={
                  <ProtectedRoute role="customer">
                    <Routes>
                      <Route index element={<CustomerDashboard />} />
                      <Route path="rfqs/:id" element={<CustomerRFQDetail />} />
                    </Routes>
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
            <Footer />
          </>
        } />
      </Routes>
      <LiveChat />
    </div>
  )
}
