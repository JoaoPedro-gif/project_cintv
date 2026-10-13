import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth';
import Layout from './Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Setup2fa from './pages/Setup2fa';

function Protected() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  if (loading) return <p className="p-8 text-sm">Carregando…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustSetup2fa && pathname !== '/2fa') return <Navigate to="/2fa" replace />;
  return <Layout />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<Protected />}>
        <Route path="/" element={<Home />} />
        <Route path="/2fa" element={<Setup2fa />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
