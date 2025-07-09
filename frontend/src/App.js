import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated } from 'react-spring';
import { Transition } from '@headlessui/react';
import axios from 'axios';
import { 
  User, MapPin, Star, Camera, Bell, Settings, Search, Filter, 
  LogOut, Plus, Check, Clock, Car, Wrench, Scissors, Broom, 
  Leaf, DollarSign, Home, Briefcase, UserCheck, CheckCircle,
  AlertCircle, XCircle, Eye, EyeOff, Mail, Phone, Calendar,
  ChevronRight, ChevronDown, Menu, X, Heart, Shield, Zap,
  ArrowRight, ArrowLeft, RefreshCw, Download, Upload, Share2,
  MessageCircle, ThumbsUp, Award, Target, Truck, Clock3,
  PlayCircle, PauseCircle, StopCircle, RotateCcw, Send,
  Edit, Trash2, Copy, ExternalLink, Info, HelpCircle
} from 'lucide-react';

// Configuración de axios con la URL del backend
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Configurar axios
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a las peticiones
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores de autenticación
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Animaciones
const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 }
};

const staggerContainer = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};

// Componentes modernos
const ModernButton = ({ children, variant = 'primary', size = 'md', loading = false, icon: Icon, ...props }) => {
  const baseClasses = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95";
  
  const variants = {
    primary: "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl",
    secondary: "bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-gray-300 shadow-md hover:shadow-lg",
    outline: "bg-transparent hover:bg-green-50 text-green-600 border-2 border-green-600 hover:border-green-700",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-700",
    danger: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl"
  };
  
  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]}`}
      disabled={loading}
      {...props}
    >
      {loading && (
        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
      )}
      {Icon && !loading && (
        <Icon className="w-4 h-4 mr-2" />
      )}
      {children}
    </motion.button>
  );
};

const ModernCard = ({ children, className = "", hover = true, ...props }) => {
  return (
    <motion.div
      whileHover={hover ? { y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" } : {}}
      className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

const ModernInput = ({ label, error, icon: Icon, ...props }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        )}
        <input
          className={`w-full ${Icon ? 'pl-12' : 'pl-4'} pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${error ? 'border-red-500' : ''}`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

const ModernSelect = ({ label, error, options, ...props }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}
      <select
        className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${error ? 'border-red-500' : ''}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

const ModernTextarea = ({ label, error, ...props }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none ${error ? 'border-red-500' : ''}`}
        rows="4"
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

const StatusBadge = ({ status, className = "" }) => {
  const statusConfig = {
    pending: { 
      color: "bg-yellow-100 text-yellow-800 border-yellow-200", 
      icon: Clock, 
      text: "Pendiente" 
    },
    accepted: { 
      color: "bg-blue-100 text-blue-800 border-blue-200", 
      icon: CheckCircle, 
      text: "Aceptado" 
    },
    on_way: { 
      color: "bg-purple-100 text-purple-800 border-purple-200", 
      icon: Car, 
      text: "En camino" 
    },
    in_progress: { 
      color: "bg-orange-100 text-orange-800 border-orange-200", 
      icon: Wrench, 
      text: "En progreso" 
    },
    completed: { 
      color: "bg-green-100 text-green-800 border-green-200", 
      icon: Check, 
      text: "Completado" 
    },
    cancelled: { 
      color: "bg-red-100 text-red-800 border-red-200", 
      icon: XCircle, 
      text: "Cancelado" 
    }
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color} ${className}`}>
      <Icon className="w-4 h-4 mr-1" />
      {config.text}
    </span>
  );
};

const Rating = ({ rating, readonly = false, size = 'md', onChange }) => {
  const [hover, setHover] = useState(0);
  const [currentRating, setCurrentRating] = useState(rating);

  const sizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  const handleClick = (value) => {
    if (!readonly) {
      setCurrentRating(value);
      onChange && onChange(value);
    }
  };

  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((value) => (
        <motion.button
          key={value}
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleClick(value)}
          onMouseEnter={() => setHover(value)}
          onMouseLeave={() => setHover(0)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer'} transition-colors duration-200`}
        >
          <Star
            className={`${sizes[size]} ${
              value <= (hover || currentRating) 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        </motion.button>
      ))}
    </div>
  );
};

const Loading = ({ size = 'md' }) => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };

  return (
    <div className="flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={`${sizes[size]} border-2 border-green-500 border-t-transparent rounded-full`}
      />
    </div>
  );
};

const Toast = ({ message, type = 'info', visible, onClose }) => {
  const typeConfig = {
    success: { color: 'bg-green-500', icon: CheckCircle },
    error: { color: 'bg-red-500', icon: XCircle },
    warning: { color: 'bg-yellow-500', icon: AlertCircle },
    info: { color: 'bg-blue-500', icon: Info }
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: '100%' }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -50, x: '100%' }}
          className={`fixed top-4 right-4 z-50 ${config.color} text-white px-6 py-4 rounded-xl shadow-lg flex items-center space-x-3 max-w-sm`}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          <p className="flex-1">{message}</p>
          <button
            onClick={onClose}
            className="ml-2 hover:bg-white/20 rounded-full p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook para notificaciones
const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const hideToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { showToast, toasts, hideToast };
};

// Componente de autenticación
const AuthForm = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'client'
  });
  const [errors, setErrors] = useState({});
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await axiosInstance.post(endpoint, formData);
      
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user_data', JSON.stringify(response.data.user));
      
      showToast(isLogin ? '¡Bienvenido!' : '¡Registro exitoso!', 'success');
      onLogin(response.data.user);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Error en la autenticación';
      showToast(errorMessage, 'error');
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <ModernCard className="p-8">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center"
            >
              <Leaf className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">PASTO!</h1>
            <p className="text-gray-600">
              {isLogin ? 'Inicia sesión en tu cuenta' : 'Crea tu cuenta nueva'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <ModernInput
                label="Nombre completo"
                name="full_name"
                type="text"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Tu nombre completo"
                icon={User}
                required
              />
            )}

            <ModernInput
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              icon={Mail}
              required
            />

            <ModernInput
              label="Contraseña"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Tu contraseña"
              icon={Shield}
              required
            />

            {!isLogin && (
              <>
                <ModernInput
                  label="Teléfono (opcional)"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+57 123 456 7890"
                  icon={Phone}
                />

                <ModernSelect
                  label="Tipo de cuenta"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  options={[
                    { value: 'client', label: 'Cliente - Solicitar servicios' },
                    { value: 'gardener', label: 'Jardinero - Ofrecer servicios' }
                  ]}
                />
              </>
            )}

            {errors.general && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
              >
                {errors.general}
              </motion.div>
            )}

            <ModernButton
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </ModernButton>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-1 text-green-600 hover:text-green-700 font-semibold"
              >
                {isLogin ? 'Regístrate' : 'Inicia sesión'}
              </button>
            </p>
          </div>
        </ModernCard>
      </motion.div>
    </div>
  );
};

// Componente principal del Dashboard
const Dashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const { showToast, toasts, hideToast } = useToast();

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Cargar notificaciones
      const notifResponse = await axiosInstance.get('/api/notifications');
      setNotifications(notifResponse.data);

      // Cargar datos según el rol del usuario
      if (user.role === 'client') {
        const requestsResponse = await axiosInstance.get('/api/services/my-requests');
        setMyRequests(requestsResponse.data);
      } else if (user.role === 'gardener') {
        const [availableResponse, jobsResponse] = await Promise.all([
          axiosInstance.get('/api/services/available'),
          axiosInstance.get('/api/services/my-jobs')
        ]);
        setAvailableServices(availableResponse.data);
        setMyJobs(jobsResponse.data);
      }
    } catch (error) {
      showToast('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Tipos de servicios
  const serviceTypes = {
    grass_cutting: { label: 'Corte de césped', icon: Scissors, color: 'text-green-600' },
    pruning: { label: 'Poda', icon: Leaf, color: 'text-blue-600' },
    cleaning: { label: 'Limpieza', icon: Broom, color: 'text-purple-600' },
    maintenance: { label: 'Mantenimiento', icon: Wrench, color: 'text-orange-600' }
  };

  // Navegación inferior
  const navigation = [
    { id: 'home', label: 'Inicio', icon: Home },
    user.role === 'client' && { id: 'request', label: 'Solicitar', icon: Plus },
    user.role === 'client' && { id: 'my-requests', label: 'Mis Solicitudes', icon: Briefcase },
    user.role === 'gardener' && { id: 'available', label: 'Disponibles', icon: Search },
    user.role === 'gardener' && { id: 'my-jobs', label: 'Mis Trabajos', icon: Briefcase },
    { id: 'profile', label: 'Perfil', icon: User }
  ].filter(Boolean);

  const TabButton = ({ tab, isActive, onClick }) => {
    const Icon = tab.icon;
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all duration-200 ${
          isActive 
            ? 'bg-green-600 text-white shadow-lg' 
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }`}
      >
        <Icon className="w-5 h-5 mb-1" />
        <span className="text-xs font-medium">{tab.label}</span>
      </motion.button>
    );
  };

  // Componente de Solicitar Servicio
  const RequestService = () => {
    const [formData, setFormData] = useState({
      service_type: 'grass_cutting',
      address: '',
      latitude: -4.6097,
      longitude: -74.0817,
      terrain_width: '',
      terrain_length: '',
      pruning_difficulty: 'medium',
      notes: '',
      is_immediate: true
    });
    const [estimation, setEstimation] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleEstimate = async () => {
      if (!formData.terrain_width || !formData.terrain_length) {
        showToast('Por favor ingresa las dimensiones del terreno', 'warning');
        return;
      }

      setLoading(true);
      try {
        const response = await axiosInstance.post('/api/services/estimate', {
          service_type: formData.service_type,
          terrain_width: parseFloat(formData.terrain_width),
          terrain_length: parseFloat(formData.terrain_length),
          pruning_difficulty: formData.pruning_difficulty
        });
        setEstimation(response.data);
      } catch (error) {
        showToast('Error al calcular estimación', 'error');
      } finally {
        setLoading(false);
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);

      try {
        const response = await axiosInstance.post('/api/services/request', {
          ...formData,
          terrain_width: parseFloat(formData.terrain_width),
          terrain_length: parseFloat(formData.terrain_length)
        });
        
        showToast('¡Solicitud enviada exitosamente!', 'success');
        setFormData({
          service_type: 'grass_cutting',
          address: '',
          latitude: -4.6097,
          longitude: -74.0817,
          terrain_width: '',
          terrain_length: '',
          pruning_difficulty: 'medium',
          notes: '',
          is_immediate: true
        });
        setEstimation(null);
        loadInitialData();
      } catch (error) {
        showToast('Error al enviar solicitud', 'error');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 space-y-6"
      >
        <ModernCard className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Solicitar Servicio</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <ModernSelect
              label="Tipo de servicio"
              name="service_type"
              value={formData.service_type}
              onChange={(e) => setFormData({...formData, service_type: e.target.value})}
              options={Object.entries(serviceTypes).map(([key, value]) => ({
                value: key,
                label: value.label
              }))}
            />

            <ModernInput
              label="Dirección"
              name="address"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="Calle 123 #45-67, Bogotá"
              icon={MapPin}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <ModernInput
                label="Ancho (metros)"
                name="terrain_width"
                type="number"
                value={formData.terrain_width}
                onChange={(e) => setFormData({...formData, terrain_width: e.target.value})}
                placeholder="10"
                step="0.1"
                min="0.1"
                required
              />
              <ModernInput
                label="Largo (metros)"
                name="terrain_length"
                type="number"
                value={formData.terrain_length}
                onChange={(e) => setFormData({...formData, terrain_length: e.target.value})}
                placeholder="15"
                step="0.1"
                min="0.1"
                required
              />
            </div>

            {formData.service_type === 'pruning' && (
              <ModernSelect
                label="Dificultad de poda"
                name="pruning_difficulty"
                value={formData.pruning_difficulty}
                onChange={(e) => setFormData({...formData, pruning_difficulty: e.target.value})}
                options={[
                  { value: 'easy', label: 'Fácil' },
                  { value: 'medium', label: 'Medio' },
                  { value: 'hard', label: 'Difícil' }
                ]}
              />
            )}

            <ModernTextarea
              label="Notas adicionales (opcional)"
              name="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Cualquier información adicional sobre el trabajo..."
            />

            <div className="flex space-x-4">
              <ModernButton
                type="button"
                variant="outline"
                onClick={handleEstimate}
                loading={loading}
                icon={Calculator}
                className="flex-1"
              >
                Calcular Precio
              </ModernButton>
              <ModernButton
                type="submit"
                loading={submitting}
                icon={Send}
                className="flex-1"
              >
                Enviar Solicitud
              </ModernButton>
            </div>
          </form>

          {estimation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl"
            >
              <h3 className="font-semibold text-green-800 mb-2">Estimación de Precio</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Área:</span>
                  <span className="ml-2 font-medium">{estimation.terrain_area} m²</span>
                </div>
                <div>
                  <span className="text-gray-600">Duración:</span>
                  <span className="ml-2 font-medium">{estimation.estimated_duration} min</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Precio estimado:</span>
                  <span className="ml-2 text-lg font-bold text-green-600">
                    ${estimation.estimated_price} {estimation.currency}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </ModernCard>
      </motion.div>
    );
  };

  // Renderizar contenido según la pestaña activa
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 space-y-6"
          >
            {/* Header de bienvenida */}
            <ModernCard className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">¡Hola, {user.full_name}! 👋</h1>
                  <p className="text-green-100 mt-1">
                    {user.role === 'client' ? 'Solicita servicios de jardinería' : 'Encuentra trabajos disponibles'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="font-semibold">{user.rating}</span>
                    </div>
                    <span className="text-xs text-green-100">({user.total_ratings} calificaciones)</span>
                  </div>
                </div>
              </div>
            </ModernCard>

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-2 gap-4">
              <ModernCard className="p-4 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {user.role === 'client' ? myRequests.length : myJobs.length}
                </div>
                <div className="text-sm text-gray-600">
                  {user.role === 'client' ? 'Mis Solicitudes' : 'Mis Trabajos'}
                </div>
              </ModernCard>

              <ModernCard className="p-4 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {user.role === 'client' 
                    ? myRequests.filter(r => r.status === 'completed').length
                    : myJobs.filter(j => j.status === 'completed').length
                  }
                </div>
                <div className="text-sm text-gray-600">Completados</div>
              </ModernCard>
            </div>

            {/* Notificaciones recientes */}
            {notifications.length > 0 && (
              <ModernCard className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Notificaciones Recientes
                </h3>
                <div className="space-y-3">
                  {notifications.slice(0, 3).map((notification) => (
                    <motion.div
                      key={notification.notification_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{notification.title}</h4>
                        <p className="text-sm text-gray-600">{notification.message}</p>
                        <span className="text-xs text-gray-500">
                          {new Date(notification.created_at).toLocaleString()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ModernCard>
            )}

            {/* Acciones rápidas */}
            <div className="grid grid-cols-1 gap-4">
              {user.role === 'client' && (
                <ModernButton
                  onClick={() => setActiveTab('request')}
                  icon={Plus}
                  size="lg"
                  className="w-full"
                >
                  Solicitar Servicio
                </ModernButton>
              )}
              {user.role === 'gardener' && (
                <ModernButton
                  onClick={() => setActiveTab('available')}
                  icon={Search}
                  size="lg"
                  className="w-full"
                >
                  Ver Servicios Disponibles
                </ModernButton>
              )}
            </div>
          </motion.div>
        );

      case 'request':
        return user.role === 'client' ? <RequestService /> : null;

      case 'my-requests':
        return user.role === 'client' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Mis Solicitudes</h2>
            {myRequests.length === 0 ? (
              <ModernCard className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No tienes solicitudes</h3>
                <p className="text-gray-600 mb-6">¡Solicita tu primer servicio ahora!</p>
                <ModernButton
                  onClick={() => setActiveTab('request')}
                  icon={Plus}
                >
                  Solicitar Servicio
                </ModernButton>
              </ModernCard>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="space-y-4"
              >
                {myRequests.map((request) => {
                  const serviceType = serviceTypes[request.service_type];
                  const ServiceIcon = serviceType.icon;
                  
                  return (
                    <motion.div
                      key={request.service_id}
                      variants={staggerItem}
                    >
                      <ModernCard className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-3 bg-gray-50 rounded-xl">
                              <ServiceIcon className={`w-6 h-6 ${serviceType.color}`} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{serviceType.label}</h3>
                              <p className="text-sm text-gray-500">{request.address}</p>
                              {request.gardener_name && (
                                <p className="text-sm text-gray-500">Jardinero: {request.gardener_name}</p>
                              )}
                            </div>
                          </div>
                          <StatusBadge status={request.status} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                          <div>
                            <span className="text-gray-500">Precio:</span>
                            <span className="ml-2 font-medium text-green-600">${request.estimated_price}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Área:</span>
                            <span className="ml-2 font-medium">{request.terrain_width}x{request.terrain_length}m</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Creado:</span>
                            <span className="ml-2 font-medium">{new Date(request.created_at).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Duración:</span>
                            <span className="ml-2 font-medium">{request.estimated_duration} min</span>
                          </div>
                        </div>

                        {request.notes && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">{request.notes}</p>
                          </div>
                        )}

                        {request.status === 'completed' && !request.client_rating && (
                          <div className="border-t pt-4">
                            <h4 className="font-medium text-gray-900 mb-2">Califica este servicio</h4>
                            <Rating
                              rating={0}
                              onChange={(rating) => {
                                // Aquí iría la lógica para calificar
                                console.log('Rating:', rating);
                              }}
                            />
                          </div>
                        )}
                      </ModernCard>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </motion.div>
        ) : null;

      case 'available':
        return user.role === 'gardener' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Servicios Disponibles</h2>
            {availableServices.length === 0 ? (
              <ModernCard className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay servicios disponibles</h3>
                <p className="text-gray-600">Revisa más tarde para encontrar nuevos trabajos</p>
              </ModernCard>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="space-y-4"
              >
                {availableServices.map((service) => {
                  const serviceType = serviceTypes[service.service_type];
                  const ServiceIcon = serviceType.icon;
                  
                  return (
                    <motion.div
                      key={service.service_id}
                      variants={staggerItem}
                    >
                      <ModernCard className="p-6">
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
                          <StatusBadge status={service.status} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                          <div>
                            <span className="text-gray-500">Precio:</span>
                            <span className="ml-2 font-medium text-green-600">${service.estimated_price}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Área:</span>
                            <span className="ml-2 font-medium">{service.terrain_width}x{service.terrain_length}m</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Duración:</span>
                            <span className="ml-2 font-medium">{service.estimated_duration} min</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Creado:</span>
                            <span className="ml-2 font-medium">{new Date(service.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {service.notes && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">{service.notes}</p>
                          </div>
                        )}

                        <ModernButton
                          onClick={async () => {
                            try {
                              await axiosInstance.post(`/api/services/${service.service_id}/accept`);
                              showToast('¡Servicio aceptado!', 'success');
                              loadInitialData();
                            } catch (error) {
                              showToast('Error al aceptar servicio', 'error');
                            }
                          }}
                          className="w-full"
                          icon={Check}
                        >
                          Aceptar Trabajo
                        </ModernButton>
                      </ModernCard>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </motion.div>
        ) : null;

      case 'my-jobs':
        return user.role === 'gardener' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Mis Trabajos</h2>
            {myJobs.length === 0 ? (
              <ModernCard className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No tienes trabajos</h3>
                <p className="text-gray-600 mb-6">Acepta trabajos disponibles para empezar</p>
                <ModernButton
                  onClick={() => setActiveTab('available')}
                  icon={Search}
                >
                  Ver Trabajos Disponibles
                </ModernButton>
              </ModernCard>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="space-y-4"
              >
                {myJobs.map((job) => {
                  const serviceType = serviceTypes[job.service_type];
                  const ServiceIcon = serviceType.icon;
                  
                  const updateStatus = async (newStatus) => {
                    try {
                      await axiosInstance.post(`/api/services/${job.service_id}/update-status`, {
                        status: newStatus
                      });
                      showToast('Estado actualizado', 'success');
                      loadInitialData();
                    } catch (error) {
                      showToast('Error al actualizar estado', 'error');
                    }
                  };
                  
                  return (
                    <motion.div
                      key={job.service_id}
                      variants={staggerItem}
                    >
                      <ModernCard className="p-6">
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
                          <StatusBadge status={job.status} />
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
                        <div className="flex space-x-2">
                          {job.status === 'accepted' && (
                            <>
                              <ModernButton
                                onClick={() => updateStatus('on_way')}
                                variant="outline"
                                className="flex-1"
                                icon={Car}
                              >
                                En camino
                              </ModernButton>
                              <ModernButton
                                onClick={() => updateStatus('in_progress')}
                                className="flex-1"
                                icon={PlayCircle}
                              >
                                Comenzar
                              </ModernButton>
                            </>
                          )}

                          {job.status === 'on_way' && (
                            <ModernButton
                              onClick={() => updateStatus('in_progress')}
                              className="w-full"
                              icon={PlayCircle}
                            >
                              Comenzar trabajo
                            </ModernButton>
                          )}

                          {job.status === 'in_progress' && (
                            <ModernButton
                              onClick={() => updateStatus('completed')}
                              className="w-full"
                              icon={CheckCircle}
                            >
                              Completar trabajo
                            </ModernButton>
                          )}
                        </div>
                      </ModernCard>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </motion.div>
        ) : null;

      case 'profile':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4"
          >
            <ModernCard className="p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
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
                  <span className="text-gray-600 flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </span>
                  <span className="text-gray-900">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-gray-600 flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      Teléfono
                    </span>
                    <span className="text-gray-900">{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Miembro desde
                  </span>
                  <span className="text-gray-900">{new Date(user.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-600 flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    Tipo de cuenta
                  </span>
                  <span className="text-gray-900 capitalize">{user.role}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <ModernButton
                  onClick={onLogout}
                  variant="danger"
                  className="w-full"
                  icon={LogOut}
                >
                  Cerrar Sesión
                </ModernButton>
              </div>
            </ModernCard>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">PASTO!</h1>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
              </button>
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="pb-20">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </div>

      {/* Navegación inferior */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="grid grid-cols-4 gap-1 p-2">
          {navigation.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>
      </div>

      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            visible={true}
            onClose={() => hideToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
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