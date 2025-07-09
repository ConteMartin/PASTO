import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { 
  User, MapPin, Star, Camera, Bell, Settings, Home, Calendar, Clock, DollarSign, 
  CheckCircle, XCircle, AlertCircle, Phone, Mail, Tool, Briefcase, Award, 
  Navigation, MessageCircle, Plus, Filter, Search, RefreshCw, Send, ArrowLeft, 
  ChevronRight, ChevronDown, ImageIcon, X, Check, Eye, EyeOff, Lock, 
  Scissors, TreePine, Sparkles, Leaf, Shield, Smartphone, Menu, Star as StarIcon
} from 'lucide-react';
import './App.css';

// Configuración de axios
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
axios.defaults.baseURL = API_BASE_URL;

// Interceptor para tokens
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Componentes reutilizables optimizados
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  };

  return (
    <div className={`fixed top-4 right-4 ${styles[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50`}>
      <div className="flex items-center space-x-2">
        {type === 'success' && <CheckCircle className="w-5 h-5" />}
        {type === 'error' && <XCircle className="w-5 h-5" />}
        {type === 'info' && <AlertCircle className="w-5 h-5" />}
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-70">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const Loading = ({ size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';
  return (
    <div className={`animate-spin rounded-full border-2 border-green-200 border-t-green-600 ${sizeClass}`}></div>
  );
};

const Rating = ({ rating, onRating, readonly = false, size = 'md' }) => {
  const [hovered, setHovered] = useState(0);
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';

  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onRating && onRating(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform duration-200`}
        >
          <Star
            className={`${sizeClass} ${
              star <= (hovered || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

// Componente de login simplificado
const AuthForm = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'client'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await axios.post(endpoint, payload);
      
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user_data', JSON.stringify(response.data.user));
      
      onLogin(response.data.user);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error en la autenticación');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const payload = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
      
      // Completar con Google OAuth (simplificado)
      const response = await axios.post('/api/auth/google/complete', {
        code: payload.sub,
        role: 'client'
      });

      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user_data', JSON.stringify(response.data.user));
      
      onLogin(response.data.user);
    } catch (error) {
      setError('Error procesando autenticación con Google');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🌱</div>
          <h1 className="text-4xl font-bold text-green-600 mb-2">PASTO!</h1>
          <p className="text-gray-600 text-lg">Servicios de jardinería al instante</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-green-100">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          <div className="mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Error en autenticación con Google')}
              useOneTap={false}
              theme="outline"
              size="large"
              width="100%"
              text={isLogin ? "signin_with" : "signup_with"}
              locale="es"
            />
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">o continúa con email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Nombre completo"
                  />
                </div>
                <div>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="client">🏠 Soy Cliente</option>
                    <option value="gardener">🌿 Soy Jardinero</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Email"
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Contraseña"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-xl hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-200 disabled:opacity-50 transition-all duration-200 font-medium text-lg flex items-center justify-center"
            >
              {loading ? <Loading size="sm" /> : (isLogin ? 'Iniciar sesión' : 'Registrarse')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-green-600 hover:text-green-700 font-medium transition-colors"
            >
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente principal optimizado
const Dashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState(user.role === 'client' ? 'request' : 'available');
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get('/api/notifications');
        setNotifications(response.data);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    fetchNotifications();
    // Polling cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Navegación simplificada
  const tabs = user.role === 'client' ? [
    { id: 'request', label: 'Solicitar', icon: Plus },
    { id: 'history', label: 'Historial', icon: Clock },
    { id: 'profile', label: 'Perfil', icon: User },
  ] : [
    { id: 'available', label: 'Trabajos', icon: Briefcase },
    { id: 'my-jobs', label: 'Mis Trabajos', icon: Tool },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🌱</div>
              <div>
                <h1 className="text-xl font-bold text-green-600">PASTO!</h1>
                <p className="text-sm text-gray-500">Hola, {user.full_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 rounded-lg hover:bg-gray-100 relative">
                <Bell className="w-6 h-6 text-gray-600" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  </div>
                )}
              </button>
              <button onClick={onLogout} className="p-2 rounded-lg hover:bg-gray-100">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="pb-20">
        {user.role === 'client' ? (
          <ClientDashboard 
            user={user} 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
            showToast={showToast}
            notifications={notifications}
          />
        ) : (
          <GardenerDashboard 
            user={user} 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
            showToast={showToast}
            notifications={notifications}
          />
        )}
      </main>

      {/* Navegación inferior */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-2 flex flex-col items-center justify-center transition-colors ${
                  isActive 
                    ? 'text-green-600 bg-green-50' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-green-600' : 'text-gray-500'}`} />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
    </div>
  );
};

// Dashboard para clientes simplificado
const ClientDashboard = ({ user, activeTab, onTabChange, showToast, notifications }) => {
  const [serviceForm, setServiceForm] = useState({
    service_type: 'grass_cutting',
    address: '',
    terrain_width: 10,
    terrain_length: 10,
    notes: ''
  });
  const [estimation, setEstimation] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const serviceTypes = {
    grass_cutting: { label: 'Corte de césped', icon: Scissors, color: 'text-green-600' },
    pruning: { label: 'Poda', icon: TreePine, color: 'text-blue-600' },
    cleaning: { label: 'Limpieza', icon: Sparkles, color: 'text-purple-600' },
    maintenance: { label: 'Mantenimiento', icon: Tool, color: 'text-orange-600' }
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-blue-100 text-blue-800',
    on_way: 'bg-purple-100 text-purple-800',
    in_progress: 'bg-green-100 text-green-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchMyRequests();
    }
  }, [activeTab]);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/services/my-requests');
      setMyRequests(response.data);
    } catch (err) {
      showToast('Error al cargar solicitudes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEstimateAndRequest = async () => {
    if (!serviceForm.address.trim()) {
      showToast('Por favor ingresa una dirección', 'error');
      return;
    }

    setLoading(true);
    try {
      // Estimar precio
      const params = new URLSearchParams({
        service_type: serviceForm.service_type,
        terrain_width: serviceForm.terrain_width,
        terrain_length: serviceForm.terrain_length,
      });

      const estimationResponse = await axios.post(`/api/services/estimate?${params}`);
      setEstimation(estimationResponse.data);

      // Crear solicitud directamente
      const requestData = {
        ...serviceForm,
        client_id: user.user_id,
        latitude: -34.6037,
        longitude: -58.3816,
        is_immediate: true,
        images: []
      };
      
      await axios.post('/api/services/request', requestData);
      showToast('¡Solicitud enviada! Un jardinero la tomará pronto.', 'success');
      
      // Reset form
      setServiceForm({
        service_type: 'grass_cutting',
        address: '',
        terrain_width: 10,
        terrain_length: 10,
        notes: ''
      });
      setEstimation(null);
      
      onTabChange('history');
    } catch (err) {
      showToast('Error al enviar la solicitud', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'request':
        return (
          <div className="p-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Plus className="w-6 h-6 mr-2 text-green-600" />
                Solicitar servicio
              </h2>
              
              <div className="space-y-4">
                {/* Tipo de servicio */}
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(serviceTypes).map(([key, service]) => {
                    const Icon = service.icon;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setServiceForm({...serviceForm, service_type: key})}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center space-y-2 ${
                          serviceForm.service_type === key
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`w-6 h-6 ${serviceForm.service_type === key ? 'text-green-600' : 'text-gray-400'}`} />
                        <span className={`text-sm font-medium ${serviceForm.service_type === key ? 'text-green-600' : 'text-gray-600'}`}>
                          {service.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Dirección */}
                <input
                  type="text"
                  value={serviceForm.address}
                  onChange={(e) => setServiceForm({...serviceForm, address: e.target.value})}
                  placeholder="📍 Dirección del servicio"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />

                {/* Medidas */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Ancho (metros)</label>
                    <input
                      type="number"
                      value={serviceForm.terrain_width}
                      onChange={(e) => setServiceForm({...serviceForm, terrain_width: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                      min="1"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Largo (metros)</label>
                    <input
                      type="number"
                      value={serviceForm.terrain_length}
                      onChange={(e) => setServiceForm({...serviceForm, terrain_length: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                      min="1"
                      step="0.1"
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-500 text-center">
                  Área total: {(serviceForm.terrain_width * serviceForm.terrain_length).toFixed(1)} m²
                </div>

                {/* Notas */}
                <textarea
                  value={serviceForm.notes}
                  onChange={(e) => setServiceForm({...serviceForm, notes: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="💬 Notas adicionales (opcional)"
                />

                {/* Estimación */}
                {estimation && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          ${estimation.estimated_price}
                        </div>
                        <div className="text-sm text-gray-600">Precio estimado</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {estimation.estimated_duration} min
                        </div>
                        <div className="text-sm text-gray-600">Duración estimada</div>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleEstimateAndRequest}
                  disabled={loading || !serviceForm.address}
                  className="w-full bg-green-600 text-white py-4 px-6 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center font-medium text-lg"
                >
                  {loading ? <Loading size="sm" /> : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Solicitar servicio
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Mis solicitudes</h2>
              <button
                onClick={fetchMyRequests}
                disabled={loading}
                className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <Loading size="lg" />
              </div>
            ) : myRequests.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <div className="text-6xl mb-4">🌱</div>
                <p className="text-gray-500 mb-4">No tienes solicitudes aún</p>
                <button
                  onClick={() => onTabChange('request')}
                  className="bg-green-600 text-white py-2 px-4 rounded-xl hover:bg-green-700"
                >
                  Solicitar primer servicio
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myRequests.map((request) => {
                  const serviceType = serviceTypes[request.service_type];
                  const ServiceIcon = serviceType.icon;
                  
                  return (
                    <div key={request.service_id} className="bg-white rounded-2xl shadow-sm p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <ServiceIcon className={`w-6 h-6 ${serviceType.color}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{serviceType.label}</h3>
                            <p className="text-sm text-gray-500">{request.address}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[request.status]}`}>
                          {request.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Precio:</span>
                          <span className="ml-2 font-medium text-green-600">${request.estimated_price}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Área:</span>
                          <span className="ml-2 font-medium">{request.terrain_width}x{request.terrain_length}m</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Fecha:</span>
                          <span className="ml-2 font-medium">{new Date(request.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {request.gardener_name && (
                        <div className="mt-4 bg-blue-50 rounded-xl p-3">
                          <p className="text-sm text-blue-800">
                            🧑‍🌾 Jardinero: <span className="font-medium">{request.gardener_name}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'profile':
        return (
          <div className="p-4">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <User className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{user.full_name}</h2>
                <p className="text-gray-500">{user.email}</p>
                <div className="flex items-center justify-center mt-2">
                  <Rating rating={user.rating} readonly size="sm" />
                  <span className="text-sm text-gray-500 ml-2">({user.total_ratings} calificaciones)</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600">📧 Email</span>
                  <span className="text-gray-900">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-gray-600">📱 Teléfono</span>
                    <span className="text-gray-900">{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-600">📅 Miembro desde</span>
                  <span className="text-gray-900">{new Date(user.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return renderContent();
};

// Dashboard para jardineros simplificado
const GardenerDashboard = ({ user, activeTab, onTabChange, showToast, notifications }) => {
  const [availableServices, setAvailableServices] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  const serviceTypes = {
    grass_cutting: { label: 'Corte de césped', icon: Scissors, color: 'text-green-600' },
    pruning: { label: 'Poda', icon: TreePine, color: 'text-blue-600' },
    cleaning: { label: 'Limpieza', icon: Sparkles, color: 'text-purple-600' },
    maintenance: { label: 'Mantenimiento', icon: Tool, color: 'text-orange-600' }
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-blue-100 text-blue-800',
    on_way: 'bg-purple-100 text-purple-800',
    in_progress: 'bg-green-100 text-green-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  useEffect(() => {
    if (activeTab === 'available') {
      fetchAvailableServices();
    } else if (activeTab === 'my-jobs') {
      fetchMyJobs();
    }
  }, [activeTab]);

  const fetchAvailableServices = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/services/available');
      setAvailableServices(response.data);
    } catch (err) {
      showToast('Error al cargar trabajos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyJobs = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/services/my-jobs');
      setMyJobs(response.data);
    } catch (err) {
      showToast('Error al cargar trabajos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptService = async (serviceId) => {
    try {
      await axios.post(`/api/services/${serviceId}/accept`);
      showToast('¡Servicio aceptado!', 'success');
      fetchAvailableServices();
      onTabChange('my-jobs');
    } catch (err) {
      showToast('Error al aceptar servicio', 'error');
    }
  };

  const handleUpdateStatus = async (serviceId, status) => {
    try {
      await axios.post(`/api/services/${serviceId}/update-status`, { status });
      showToast('Estado actualizado', 'success');
      fetchMyJobs();
    } catch (err) {
      showToast('Error al actualizar estado', 'error');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'available':
        return (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Trabajos disponibles</h2>
              <button
                onClick={fetchAvailableServices}
                disabled={loading}
                className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <Loading size="lg" />
              </div>
            ) : availableServices.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <div className="text-6xl mb-4">🌿</div>
                <p className="text-gray-500">No hay trabajos disponibles</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableServices.map((service) => {
                  const serviceType = serviceTypes[service.service_type];
                  const ServiceIcon = serviceType.icon;
                  
                  return (
                    <div key={service.service_id} className="bg-white rounded-2xl shadow-sm p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <ServiceIcon className={`w-6 h-6 ${serviceType.color}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{serviceType.label}</h3>
                            <p className="text-sm text-gray-500">{service.address}</p>
                            <p className="text-sm text-gray-500">Cliente: {service.client_name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            ${service.estimated_price}
                          </div>
                          <div className="text-sm text-gray-500">
                            {service.estimated_duration} min
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-gray-500">Área:</span>
                          <span className="ml-2 font-medium">{service.terrain_width}x{service.terrain_length}m</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Fecha:</span>
                          <span className="ml-2 font-medium">{new Date(service.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {service.notes && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                            💬 {service.notes}
                          </p>
                        </div>
                      )}

                      <button
                        onClick={() => handleAcceptService(service.service_id)}
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 transition-colors font-medium"
                      >
                        <CheckCircle className="w-5 h-5 mr-2 inline" />
                        Aceptar trabajo
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'my-jobs':
        return (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Mis trabajos</h2>
              <button
                onClick={fetchMyJobs}
                disabled={loading}
                className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <Loading size="lg" />
              </div>
            ) : myJobs.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <div className="text-6xl mb-4">🛠️</div>
                <p className="text-gray-500 mb-4">No tienes trabajos aceptados</p>
                <button
                  onClick={() => onTabChange('available')}
                  className="bg-green-600 text-white py-2 px-4 rounded-xl hover:bg-green-700"
                >
                  Ver trabajos disponibles
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myJobs.map((job) => {
                  const serviceType = serviceTypes[job.service_type];
                  const ServiceIcon = serviceType.icon;
                  
                  return (
                    <div key={job.service_id} className="bg-white rounded-2xl shadow-sm p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <ServiceIcon className={`w-6 h-6 ${serviceType.color}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{serviceType.label}</h3>
                            <p className="text-sm text-gray-500">{job.address}</p>
                            <p className="text-sm text-gray-500">Cliente: {job.client_name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[job.status]}`}>
                            {job.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-gray-500">Precio:</span>
                          <span className="ml-2 font-medium text-green-600">${job.estimated_price}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Área:</span>
                          <span className="ml-2 font-medium">{job.terrain_width}x{job.terrain_length}m</span>
                        </div>
                      </div>

                      {/* Botones de acción según el estado */}
                      {job.status === 'accepted' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUpdateStatus(job.service_id, 'on_way')}
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-xl hover:bg-blue-700 text-sm"
                          >
                            🚗 En camino
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(job.service_id, 'in_progress')}
                            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-xl hover:bg-green-700 text-sm"
                          >
                            🛠️ Comenzar
                          </button>
                        </div>
                      )}

                      {job.status === 'on_way' && (
                        <button
                          onClick={() => handleUpdateStatus(job.service_id, 'in_progress')}
                          className="w-full bg-green-600 text-white py-2 px-4 rounded-xl hover:bg-green-700 text-sm"
                        >
                          🛠️ Comenzar trabajo
                        </button>
                      )}

                      {job.status === 'in_progress' && (
                        <button
                          onClick={() => handleUpdateStatus(job.service_id, 'completed')}
                          className="w-full bg-green-600 text-white py-2 px-4 rounded-xl hover:bg-green-700 text-sm"
                        >
                          ✅ Completar trabajo
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'profile':
        return (
          <div className="p-4">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <User className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{user.full_name}</h2>
                <p className="text-gray-500">{user.email}</p>
                <div className="flex items-center justify-center mt-2">
                  <Rating rating={user.rating} readonly size="sm" />
                  <span className="text-sm text-gray-500 ml-2">({user.total_ratings} calificaciones)</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600">📧 Email</span>
                  <span className="text-gray-900">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-gray-600">📱 Teléfono</span>
                    <span className="text-gray-900">{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-600">📅 Miembro desde</span>
                  <span className="text-gray-900">{new Date(user.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return renderContent();
};

// Componente principal de la aplicación
const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un usuario autenticado
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
      }
    }
    
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <div className="App">
        {user ? (
          <Dashboard user={user} onLogout={handleLogout} />
        ) : (
          <AuthForm onLogin={handleLogin} />
        )}
      </div>
    </GoogleOAuthProvider>
  );
};

export default App;