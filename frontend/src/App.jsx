import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Products from './pages/Products'
import About from './pages/About'
import Categories from './pages/Categories'
import Services from './pages/Services'
import Contact from './pages/Contact'
import RFQ from './pages/RFQ'
import RFQSuccess from './pages/RFQSuccess'
import Compare from './pages/Compare'
import CustomerDashboard from './pages/CustomerDashboard'
import CustomerRFQDetail from './pages/CustomerRFQDetail'
import AdminDashboard from './pages/AdminDashboard'
import RFQList from './pages/RFQList'
import RFQDetails from './pages/RFQDetails'
import Login from './pages/Login'
import Register from './pages/Register'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Routes>
        {/* Admin routes — no public navbar */}
        <Route path="/admin/*" element={
          <ProtectedRoute role="admin">
            <Routes>
              <Route index element={<AdminDashboard />} />
              <Route path="rfqs" element={<RFQList />} />
              <Route path="rfqs/:id" element={<RFQDetails />} />
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
                <Route path="/about" element={<About />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/services" element={<Services />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/rfq" element={<RFQ />} />
                <Route path="/rfq/success/:rfqNumber" element={<RFQSuccess />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
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
    </div>
  )
}
