import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { 
  User, 
  MapPin, 
  Star, 
  Camera, 
  Bell, 
  Settings, 
  Home,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  Tool,
  Briefcase,
  Award,
  Navigation,
  MessageCircle,
  StarIcon,
  Plus,
  Filter,
  Search,
  RefreshCw,
  Send,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  X,
  Check,
  Heart,
  Share2,
  MoreVertical,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Zap,
  Leaf,
  Scissors,
  Sparkles,
  TreePine,
  Flower,
  Shield,
  Smartphone
} from 'lucide-react';
import './App.css';

// Configuración de axios
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
axios.defaults.baseURL = API_BASE_URL;

// Configurar interceptor para incluir token en todas las peticiones
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Componente Toast para notificaciones
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-down`}>
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

// Componente Loading
const Loading = ({ size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';
  return (
    <div className={`animate-spin rounded-full border-2 border-green-200 border-t-green-600 ${sizeClass}`}></div>
  );
};

// Componente para verificación de teléfono
const PhoneVerification = ({ onVerified, onSkip, required = false }) => {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatPhoneNumber = (value) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Add + prefix if not present
    if (digits.length > 0 && !value.startsWith('+')) {
      return '+' + digits;
    }
    
    return value;
  };

  const handleSendCode = async () => {
    if (!phone || phone.length < 10) {
      setError('Por favor ingresa un número de teléfono válido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post('/api/auth/phone/send-verification', {
        phone_number: phone
      });
      
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error enviando código de verificación');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length < 4) {
      setError('Por favor ingresa el código de verificación');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/phone/verify', {
        phone_number: phone,
        code: code
      });

      if (response.data.verified) {
        onVerified(phone);
      } else {
        setError('Código inválido o expirado');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error verificando código');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 border border-green-100">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <Smartphone className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verificar Teléfono</h2>
        <p className="text-gray-600">
          {step === 1 
            ? 'Ingresa tu número de teléfono para verificar tu identidad'
            : 'Ingresa el código enviado a tu teléfono'
          }
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <div className="form-group">
            <label className="form-label">
              <Phone className="w-4 h-4 inline mr-2" />
              Número de teléfono
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
              className="form-input"
              placeholder="+54 11 1234-5678"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Incluye el código de país (ej: +54 para Argentina)
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSendCode}
              disabled={loading || !phone}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-xl hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-200 disabled:opacity-50 transition-all duration-200 font-medium flex items-center justify-center"
            >
              {loading ? (
                <Loading size="sm" />
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Enviar código
                </>
              )}
            </button>

            {!required && (
              <button
                onClick={onSkip}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
              >
                Omitir por ahora
              </button>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="form-group">
            <label className="form-label">
              <Shield className="w-4 h-4 inline mr-2" />
              Código de verificación
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="form-input text-center text-2xl tracking-widest"
              placeholder="000000"
              maxLength="6"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Código enviado a {phone}
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleVerifyCode}
              disabled={loading || !code}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-xl hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-200 disabled:opacity-50 transition-all duration-200 font-medium flex items-center justify-center"
            >
              {loading ? (
                <Loading size="sm" />
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Verificar código
                </>
              )}
            </button>

            <button
              onClick={() => setStep(1)}
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
            >
              <ArrowLeft className="w-5 h-5 inline mr-2" />
              Cambiar número
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para selección de rol después de Google OAuth
const RoleSelection = ({ onRoleSelected, userInfo }) => {
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleSubmit = async () => {
    if (!selectedRole) {
      alert('Por favor selecciona un rol');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/auth/google/complete', {
        code: userInfo.sub,
        role: selectedRole
      });

      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user_data', JSON.stringify(response.data.user));
      
      onRoleSelected(response.data.user);
    } catch (err) {
      alert('Error completando registro: ' + (err.response?.data?.detail || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-green-100">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <img 
                src={userInfo.picture} 
                alt={userInfo.name}
                className="w-12 h-12 rounded-full"
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Bienvenido!</h2>
            <p className="text-gray-600">Hola {userInfo.name}, selecciona tu rol en PASTO!</p>
          </div>

          <div className="space-y-4 mb-6">
            <button
              onClick={() => setSelectedRole('client')}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-center space-x-3 ${
                selectedRole === 'client'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="p-2 bg-blue-100 rounded-lg">
                <Home className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Cliente</h3>
                <p className="text-sm text-gray-600">Solicito servicios de jardinería</p>
              </div>
            </button>

            <button
              onClick={() => setSelectedRole('gardener')}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-center space-x-3 ${
                selectedRole === 'gardener'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="p-2 bg-green-100 rounded-lg">
                <Leaf className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Jardinero</h3>
                <p className="text-sm text-gray-600">Ofrezco servicios de jardinería</p>
              </div>
            </button>
          </div>

          <button
            onClick={handleRoleSubmit}
            disabled={loading || !selectedRole}
            className="w-full bg-green-600 text-white py-4 px-6 rounded-xl hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-200 disabled:opacity-50 transition-all duration-200 font-medium text-lg flex items-center justify-center"
          >
            {loading ? (
              <Loading size="sm" />
            ) : (
              <>
                Continuar
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
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

// Componente para subir imágenes
const ImageUploader = ({ images, onImagesChange, maxImages = 4 }) => {
  const [previews, setPreviews] = useState([]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > maxImages) {
      alert(`Solo puedes subir un máximo de ${maxImages} imágenes`);
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage = {
          id: Date.now() + Math.random(),
          file,
          preview: e.target.result,
          uploaded: false
        };
        onImagesChange([...images, newImage]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id) => {
    onImagesChange(images.filter(img => img.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {images.map((image) => (
          <div key={image.id} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={image.preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => removeImage(image.id)}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        
        {images.length < maxImages && (
          <label className="aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 hover:border-green-500 cursor-pointer flex flex-col items-center justify-center transition-colors">
            <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Agregar foto</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        )}
      </div>
      
      <p className="text-sm text-gray-500 text-center">
        {images.length}/{maxImages} imágenes subidas
      </p>
    </div>
  );
};

// Componente de navegación inferior móvil
const BottomNavigation = ({ activeTab, onTabChange, userRole }) => {
  const clientTabs = [
    { id: 'request', label: 'Solicitar', icon: Plus },
    { id: 'history', label: 'Historial', icon: Clock },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  const gardenerTabs = [
    { id: 'available', label: 'Trabajos', icon: Briefcase },
    { id: 'my-jobs', label: 'Mis Trabajos', icon: Tool },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  const tabs = userRole === 'client' ? clientTabs : gardenerTabs;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom">
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
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
    </div>
  );
};

// Componente de Login/Registro mejorado con Google OAuth
const AuthForm = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [googleUserInfo, setGoogleUserInfo] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'client',
    phone: ''
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
      
      // Si es registro y no es login, mostrar verificación de teléfono
      if (!isLogin) {
        setCurrentUser(response.data.user);
        setShowPhoneVerification(true);
      } else {
        onLogin(response.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error en la autenticación');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      // Decodificar el JWT token de Google
      const payload = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
      
      setGoogleUserInfo(payload);
      setShowRoleSelection(true);
    } catch (error) {
      setError('Error procesando autenticación con Google');
    }
  };

  const handleGoogleError = () => {
    setError('Error en autenticación con Google');
  };

  const handleRoleSelected = (user) => {
    setCurrentUser(user);
    setShowPhoneVerification(true);
  };

  const handlePhoneVerified = (phone) => {
    // Actualizar el usuario con el teléfono verificado
    const updatedUser = { ...currentUser, phone, phone_verified: true };
    localStorage.setItem('user_data', JSON.stringify(updatedUser));
    onLogin(updatedUser);
  };

  const handleSkipPhoneVerification = () => {
    onLogin(currentUser);
  };

  // Mostrar selección de rol después de Google OAuth
  if (showRoleSelection) {
    return <RoleSelection onRoleSelected={handleRoleSelected} userInfo={googleUserInfo} />;
  }

  // Mostrar verificación de teléfono
  if (showPhoneVerification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <PhoneVerification 
            onVerified={handlePhoneVerified}
            onSkip={handleSkipPhoneVerification}
            required={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-bounce">🌱</div>
          <h1 className="text-4xl font-bold text-green-600 mb-2">PASTO!</h1>
          <p className="text-gray-600 text-lg">
            {isLogin ? 'Bienvenido de vuelta' : 'Únete a nuestra comunidad'}
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-green-100">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          {/* Botón de Google OAuth */}
          <div className="mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
              theme="outline"
              size="large"
              width="100%"
              text={isLogin ? "signin_with" : "signup_with"}
              locale="es"
            />
          </div>

          {/* Separador */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">o continúa con email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <>
                <div className="form-group">
                  <label className="form-label">
                    <User className="w-4 h-4 inline mr-2" />
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="form-input"
                    placeholder="Juan Pérez"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Briefcase className="w-4 h-4 inline mr-2" />
                    Tipo de usuario
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="form-select"
                  >
                    <option value="client">🏠 Cliente</option>
                    <option value="gardener">🌿 Jardinero</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Teléfono (opcional)
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="form-input"
                    placeholder="+54 11 1234-5678"
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="form-input"
                placeholder="juan@ejemplo.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Lock className="w-4 h-4 inline mr-2" />
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="form-input pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-4 px-6 rounded-xl hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-200 disabled:opacity-50 transition-all duration-200 font-medium text-lg flex items-center justify-center"
            >
              {loading ? (
                <Loading size="sm" />
              ) : (
                <>
                  {isLogin ? 'Iniciar sesión' : 'Registrarse'}
                  <ChevronRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
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

// Componente Dashboard para Clientes
const ClientDashboard = ({ user, activeTab, onTabChange, showToast, notifications, onNotificationRead, onLogout }) => {
  const [serviceForm, setServiceForm] = useState({
    service_type: 'grass_cutting',
    address: '',
    latitude: -34.6037,
    longitude: -58.3816,
    terrain_width: 10,
    terrain_length: 10,
    images: [],
    pruning_difficulty: 'medium',
    scheduled_date: '',
    is_immediate: true,
    notes: ''
  });
  const [estimation, setEstimation] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const serviceTypes = {
    grass_cutting: { label: 'Corte de césped', icon: Scissors, color: 'text-green-600' },
    pruning: { label: 'Poda', icon: TreePine, color: 'text-blue-600' },
    cleaning: { label: 'Limpieza', icon: Sparkles, color: 'text-purple-600' },
    maintenance: { label: 'Mantenimiento', icon: Tool, color: 'text-orange-600' }
  };

  const statusTranslations = {
    pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    accepted: { label: 'Aceptado', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
    on_way: { label: 'En camino', color: 'bg-purple-100 text-purple-800', icon: Navigation },
    in_progress: { label: 'En progreso', color: 'bg-green-100 text-green-800', icon: Tool },
    completed: { label: 'Completado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle }
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
      console.error('Error fetching requests:', err);
      showToast('Error al cargar solicitudes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEstimatePrice = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        service_type: serviceForm.service_type,
        terrain_width: serviceForm.terrain_width,
        terrain_length: serviceForm.terrain_length,
      });
      
      if (serviceForm.service_type === 'pruning') {
        params.append('pruning_difficulty', serviceForm.pruning_difficulty);
      }

      const response = await axios.post(`/api/services/estimate?${params}`);
      setEstimation(response.data);
    } catch (err) {
      console.error('Error estimating price:', err);
      showToast('Error al estimar precio', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestService = async () => {
    if (!serviceForm.address.trim()) {
      showToast('Por favor ingresa una dirección', 'error');
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        ...serviceForm,
        client_id: user.user_id,
        images: serviceForm.images.map(img => img.preview) // Convertir a base64
      };
      
      await axios.post('/api/services/request', requestData);
      showToast('¡Solicitud enviada exitosamente!', 'success');
      
      // Resetear formulario
      setServiceForm({
        service_type: 'grass_cutting',
        address: '',
        latitude: -34.6037,
        longitude: -58.3816,
        terrain_width: 10,
        terrain_length: 10,
        images: [],
        pruning_difficulty: 'medium',
        scheduled_date: '',
        is_immediate: true,
        notes: ''
      });
      setEstimation(null);
      
      // Cambiar a historial
      onTabChange('history');
    } catch (err) {
      console.error('Error creating request:', err);
      showToast('Error al enviar la solicitud', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRateService = async (serviceId, rating, review) => {
    try {
      await axios.post(`/api/services/${serviceId}/rate`, { rating, review });
      showToast('¡Calificación enviada!', 'success');
      fetchMyRequests();
    } catch (err) {
      console.error('Error rating service:', err);
      showToast('Error al enviar calificación', 'error');
    }
  };

  // Renderizar contenido según tab activo
  const renderContent = () => {
    switch (activeTab) {
      case 'request':
        return (
          <div className="p-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Plus className="w-6 h-6 mr-2 text-green-600" />
                Solicitar servicio
              </h2>
              
              <div className="space-y-6">
                {/* Tipo de servicio */}
                <div className="form-group">
                  <label className="form-label">Tipo de servicio</label>
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
                          <Icon className={`w-8 h-8 ${serviceForm.service_type === key ? 'text-green-600' : 'text-gray-400'}`} />
                          <span className={`text-sm font-medium ${serviceForm.service_type === key ? 'text-green-600' : 'text-gray-600'}`}>
                            {service.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dirección */}
                <div className="form-group">
                  <label className="form-label">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Dirección del servicio
                  </label>
                  <input
                    type="text"
                    value={serviceForm.address}
                    onChange={(e) => setServiceForm({...serviceForm, address: e.target.value})}
                    placeholder="Av. Corrientes 1234, CABA"
                    className="form-input"
                  />
                </div>

                {/* Medidas del terreno */}
                <div className="form-group">
                  <label className="form-label">Medidas del terreno</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Ancho (metros)</label>
                      <input
                        type="number"
                        value={serviceForm.terrain_width}
                        onChange={(e) => setServiceForm({...serviceForm, terrain_width: parseFloat(e.target.value) || 0})}
                        className="form-input"
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
                        className="form-input"
                        min="1"
                        step="0.1"
                      />
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Área total: {(serviceForm.terrain_width * serviceForm.terrain_length).toFixed(1)} m²
                  </div>
                </div>

                {/* Dificultad de poda */}
                {serviceForm.service_type === 'pruning' && (
                  <div className="form-group">
                    <label className="form-label">Dificultad de poda</label>
                    <select
                      value={serviceForm.pruning_difficulty}
                      onChange={(e) => setServiceForm({...serviceForm, pruning_difficulty: e.target.value})}
                      className="form-select"
                    >
                      <option value="easy">🟢 Fácil</option>
                      <option value="medium">🟡 Media</option>
                      <option value="hard">🔴 Difícil</option>
                    </select>
                  </div>
                )}

                {/* Subir imágenes */}
                <div className="form-group">
                  <label className="form-label">
                    <Camera className="w-4 h-4 inline mr-2" />
                    Fotos del jardín (opcional)
                  </label>
                  <ImageUploader
                    images={serviceForm.images}
                    onImagesChange={(images) => setServiceForm({...serviceForm, images})}
                  />
                </div>

                {/* Notas */}
                <div className="form-group">
                  <label className="form-label">
                    <MessageCircle className="w-4 h-4 inline mr-2" />
                    Notas adicionales
                  </label>
                  <textarea
                    value={serviceForm.notes}
                    onChange={(e) => setServiceForm({...serviceForm, notes: e.target.value})}
                    rows={3}
                    className="form-textarea"
                    placeholder="Información adicional sobre el servicio..."
                  />
                </div>

                {/* Botón estimar precio */}
                <button
                  onClick={handleEstimatePrice}
                  disabled={loading || !serviceForm.address}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center font-medium"
                >
                  {loading ? <Loading size="sm" /> : (
                    <>
                      <DollarSign className="w-5 h-5 mr-2" />
                      Estimar precio
                    </>
                  )}
                </button>

                {/* Estimación */}
                {estimation && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6 space-y-4">
                    <h3 className="font-semibold text-green-800 flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Estimación del servicio
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          ${estimation.estimated_price}
                        </div>
                        <div className="text-sm text-gray-600">Precio estimado</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {estimation.estimated_duration} min
                        </div>
                        <div className="text-sm text-gray-600">Duración estimada</div>
                      </div>
                    </div>
                    <button
                      onClick={handleRequestService}
                      disabled={loading || !serviceForm.address}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center font-medium"
                    >
                      {loading ? <Loading size="sm" /> : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Confirmar solicitud
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center">
                <Clock className="w-6 h-6 mr-2 text-green-600" />
                Mis solicitudes
              </h2>
              <button
                onClick={fetchMyRequests}
                disabled={loading}
                className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
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
                  className="bg-green-600 text-white py-2 px-4 rounded-xl hover:bg-green-700 transition-colors"
                >
                  Solicitar primer servicio
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myRequests.map((request) => {
                  const serviceType = serviceTypes[request.service_type];
                  const status = statusTranslations[request.status];
                  const ServiceIcon = serviceType.icon;
                  const StatusIcon = status.icon;
                  
                  return (
                    <div key={request.service_id} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <ServiceIcon className={`w-6 h-6 ${serviceType.color}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{serviceType.label}</h3>
                            <p className="text-sm text-gray-500 flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {request.address}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color} flex items-center`}>
                          <StatusIcon className="w-4 h-4 mr-1" />
                          {status.label}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-sm">
                          <span className="text-gray-500">Área:</span>
                          <span className="ml-2 font-medium">{request.terrain_width} x {request.terrain_length} m</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Precio:</span>
                          <span className="ml-2 font-medium text-green-600">${request.estimated_price}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Duración:</span>
                          <span className="ml-2 font-medium">{request.estimated_duration} min</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Fecha:</span>
                          <span className="ml-2 font-medium">{new Date(request.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {request.gardener_name && (
                        <div className="bg-blue-50 rounded-xl p-3 mb-4">
                          <p className="text-sm text-blue-800">
                            <User className="w-4 h-4 inline mr-1" />
                            Jardinero asignado: <span className="font-medium">{request.gardener_name}</span>
                          </p>
                        </div>
                      )}

                      {request.status === 'completed' && !request.gardener_rating && (
                        <div className="border-t pt-4">
                          <RatingModal
                            serviceId={request.service_id}
                            onRate={handleRateService}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'notifications':
        return (
          <div className="p-4 space-y-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Bell className="w-6 h-6 mr-2 text-green-600" />
              Notificaciones
            </h2>
            
            {notifications.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No tienes notificaciones</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.notification_id}
                    className={`bg-white rounded-xl p-4 border ${
                      notification.read ? 'border-gray-200' : 'border-green-200 bg-green-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{notification.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'profile':
        return (
          <div className="p-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
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
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">Email</span>
                  </div>
                  <span className="text-gray-900">{user.email}</span>
                </div>

                {user.phone && (
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">Teléfono</span>
                    </div>
                    <span className="text-gray-900">{user.phone}</span>
                  </div>
                )}

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">Miembro desde</span>
                  </div>
                  <span className="text-gray-900">{new Date(user.created_at).toLocaleDateString()}</span>
                </div>

                <button
                  onClick={onLogout}
                  className="w-full bg-red-600 text-white py-3 px-4 rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center font-medium"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return <div className="min-h-screen bg-gray-50">{renderContent()}</div>;
};

// Componente Modal para Calificar
const RatingModal = ({ serviceId, onRate }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) {
      alert('Por favor selecciona una calificación');
      return;
    }
    
    onRate(serviceId, rating, review);
    setIsOpen(false);
    setRating(0);
    setReview('');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center"
      >
        <Star className="w-4 h-4 mr-2" />
        Calificar servicio
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Calificar servicio</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calificación
              </label>
              <div className="flex justify-center">
                <Rating rating={rating} onRating={setRating} size="lg" />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentario (opcional)
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Comparte tu experiencia..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Componente Dashboard para Jardineros
const GardenerDashboard = ({ user, activeTab, onTabChange, showToast, notifications, onNotificationRead, onLogout }) => {
  const [availableServices, setAvailableServices] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gardenerProfile, setGardenerProfile] = useState(null);

  const serviceTypes = {
    grass_cutting: { label: 'Corte de césped', icon: Scissors, color: 'text-green-600' },
    pruning: { label: 'Poda', icon: TreePine, color: 'text-blue-600' },
    cleaning: { label: 'Limpieza', icon: Sparkles, color: 'text-purple-600' },
    maintenance: { label: 'Mantenimiento', icon: Tool, color: 'text-orange-600' }
  };

  const statusTranslations = {
    pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    accepted: { label: 'Aceptado', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
    on_way: { label: 'En camino', color: 'bg-purple-100 text-purple-800', icon: Navigation },
    in_progress: { label: 'En progreso', color: 'bg-green-100 text-green-800', icon: Tool },
    completed: { label: 'Completado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle }
  };

  useEffect(() => {
    if (activeTab === 'available') {
      fetchAvailableServices();
    } else if (activeTab === 'my-jobs') {
      fetchMyJobs();
    } else if (activeTab === 'profile') {
      fetchGardenerProfile();
    }
  }, [activeTab]);

  const fetchAvailableServices = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/services/available');
      setAvailableServices(response.data);
    } catch (err) {
      console.error('Error fetching available services:', err);
      showToast('Error al cargar trabajos disponibles', 'error');
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
      console.error('Error fetching my jobs:', err);
      showToast('Error al cargar mis trabajos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchGardenerProfile = async () => {
    try {
      const response = await axios.get('/api/gardener/profile');
      setGardenerProfile(response.data);
    } catch (err) {
      console.error('Error fetching gardener profile:', err);
    }
  };

  const handleAcceptService = async (serviceId) => {
    try {
      await axios.post(`/api/services/${serviceId}/accept`);
      showToast('¡Servicio aceptado exitosamente!', 'success');
      fetchAvailableServices();
      onTabChange('my-jobs');
    } catch (err) {
      console.error('Error accepting service:', err);
      showToast('Error al aceptar el servicio', 'error');
    }
  };

  const handleUpdateStatus = async (serviceId, status, notes = '') => {
    try {
      await axios.post(`/api/services/${serviceId}/update-status`, { status, notes });
      showToast('Estado actualizado correctamente', 'success');
      fetchMyJobs();
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('Error al actualizar estado', 'error');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'available':
        return (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center">
                <Briefcase className="w-6 h-6 mr-2 text-green-600" />
                Trabajos disponibles
              </h2>
              <button
                onClick={fetchAvailableServices}
                disabled={loading}
                className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
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
                <p className="text-gray-500 mb-2">No hay trabajos disponibles</p>
                <p className="text-sm text-gray-400">Los nuevos trabajos aparecerán aquí</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableServices.map((service) => {
                  const serviceType = serviceTypes[service.service_type];
                  const ServiceIcon = serviceType.icon;
                  
                  return (
                    <div key={service.service_id} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <ServiceIcon className={`w-6 h-6 ${serviceType.color}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{serviceType.label}</h3>
                            <p className="text-sm text-gray-500 flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {service.address}
                            </p>
                            <p className="text-sm text-gray-500 flex items-center mt-1">
                              <User className="w-4 h-4 mr-1" />
                              {service.client_name}
                            </p>
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
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-sm">
                          <span className="text-gray-500">Área:</span>
                          <span className="ml-2 font-medium">{service.terrain_width} x {service.terrain_length} m</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Tipo:</span>
                          <span className="ml-2 font-medium">{service.is_immediate ? 'Inmediato' : 'Programado'}</span>
                        </div>
                        {service.pruning_difficulty && (
                          <div className="text-sm">
                            <span className="text-gray-500">Dificultad:</span>
                            <span className="ml-2 font-medium capitalize">{service.pruning_difficulty}</span>
                          </div>
                        )}
                        <div className="text-sm">
                          <span className="text-gray-500">Creado:</span>
                          <span className="ml-2 font-medium">{new Date(service.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {service.notes && (
                        <div className="mb-4">
                          <span className="text-gray-500 text-sm">Notas:</span>
                          <p className="text-sm mt-1 p-3 bg-gray-50 rounded-lg">{service.notes}</p>
                        </div>
                      )}

                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleAcceptService(service.service_id)}
                          className="flex-1 bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center font-medium"
                        >
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Aceptar trabajo
                        </button>
                        <button className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center font-medium">
                          <Eye className="w-5 h-5 mr-2" />
                          Ver detalles
                        </button>
                      </div>
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
              <h2 className="text-xl font-semibold flex items-center">
                <Tool className="w-6 h-6 mr-2 text-green-600" />
                Mis trabajos
              </h2>
              <button
                onClick={fetchMyJobs}
                disabled={loading}
                className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
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
                <p className="text-gray-500 mb-2">No tienes trabajos aceptados</p>
                <p className="text-sm text-gray-400">Acepta trabajos para verlos aquí</p>
                <button
                  onClick={() => onTabChange('available')}
                  className="mt-4 bg-green-600 text-white py-2 px-4 rounded-xl hover:bg-green-700 transition-colors"
                >
                  Ver trabajos disponibles
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myJobs.map((job) => {
                  const serviceType = serviceTypes[job.service_type];
                  const status = statusTranslations[job.status];
                  const ServiceIcon = serviceType.icon;
                  const StatusIcon = status.icon;
                  
                  return (
                    <div key={job.service_id} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <ServiceIcon className={`w-6 h-6 ${serviceType.color}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{serviceType.label}</h3>
                            <p className="text-sm text-gray-500 flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {job.address}
                            </p>
                            <p className="text-sm text-gray-500 flex items-center mt-1">
                              <User className="w-4 h-4 mr-1" />
                              {job.client_name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color} flex items-center`}>
                            <StatusIcon className="w-4 h-4 mr-1" />
                            {status.label}
                          </span>
                          <div className="text-lg font-bold text-green-600 mt-2">
                            ${job.estimated_price}
                          </div>
                        </div>
                      </div>
                      
                      {/* Botones de acción según el estado */}
                      {job.status === 'accepted' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUpdateStatus(job.service_id, 'on_way')}
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                          >
                            <Navigation className="w-4 h-4 mr-2" />
                            Estoy en camino
                          </button>
                        </div>
                      )}
                      
                      {job.status === 'on_way' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUpdateStatus(job.service_id, 'in_progress')}
                            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                          >
                            <Tool className="w-4 h-4 mr-2" />
                            Comenzar trabajo
                          </button>
                        </div>
                      )}
                      
                      {job.status === 'in_progress' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUpdateStatus(job.service_id, 'completed')}
                            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Completar trabajo
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'notifications':
        return (
          <div className="p-4 space-y-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Bell className="w-6 h-6 mr-2 text-green-600" />
              Notificaciones
            </h2>
            
            {notifications.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No tienes notificaciones</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.notification_id}
                    className={`bg-white rounded-xl p-4 border ${
                      notification.read ? 'border-gray-200' : 'border-green-200 bg-green-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{notification.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'profile':
        return (
          <div className="p-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <User className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{user.full_name}</h2>
                <p className="text-gray-500">Jardinero Profesional</p>
                <div className="flex items-center justify-center mt-2">
                  <Rating rating={user.rating} readonly size="sm" />
                  <span className="text-sm text-gray-500 ml-2">({user.total_ratings} calificaciones)</span>
                </div>
              </div>

              {gardenerProfile && (
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h3 className="font-semibold text-blue-800 mb-2">Estadísticas</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{gardenerProfile.completed_jobs}</div>
                        <div className="text-sm text-gray-600">Trabajos completados</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{gardenerProfile.years_experience}</div>
                        <div className="text-sm text-gray-600">Años de experiencia</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">Email</span>
                  </div>
                  <span className="text-gray-900">{user.email}</span>
                </div>

                {user.phone && (
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">Teléfono</span>
                    </div>
                    <span className="text-gray-900">{user.phone}</span>
                  </div>
                )}

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">Miembro desde</span>
                  </div>
                  <span className="text-gray-900">{new Date(user.created_at).toLocaleDateString()}</span>
                </div>

                <button
                  onClick={onLogout}
                  className="w-full bg-red-600 text-white py-3 px-4 rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center font-medium"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return <div className="min-h-screen bg-gray-50">{renderContent()}</div>;
};
const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('request');
  const [toast, setToast] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Función para mostrar toast
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // Función para cerrar toast
  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  // Cargar notificaciones
  const loadNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await axios.get('/api/notifications');
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, [user]);

  useEffect(() => {
    // Verificar si hay un token guardado
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setActiveTab(parsedUser.role === 'client' ? 'request' : 'available');
      } catch (err) {
        console.error('Error parsing user data:', err);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
      }
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    loadNotifications();
    
    // Cargar notificaciones cada 30 segundos
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const handleLogin = (userData) => {
    setUser(userData);
    setActiveTab(userData.role === 'client' ? 'request' : 'available');
    showToast('¡Bienvenido a PASTO!', 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    setUser(null);
    setActiveTab('request');
    showToast('Sesión cerrada', 'info');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🌱</div>
          <h1 className="text-2xl font-bold text-green-600 mb-4">PASTO!</h1>
          <Loading size="lg" />
          <p className="text-gray-600 mt-4">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || "your_google_client_id_here"}>
        <AuthForm onLogin={handleLogin} />
      </GoogleOAuthProvider>
    );
  }

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || "your_google_client_id_here"}>
      <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 safe-top">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">🌱</div>
                <div>
                  <h1 className="text-lg font-bold text-green-600">PASTO!</h1>
                  <p className="text-xs text-gray-500">
                    {user.role === 'client' ? 'Cliente' : 'Jardinero'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
                  >
                    <Bell className="w-5 h-5 text-gray-600" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                    <div className="flex items-center">
                      <Rating rating={user.rating} readonly size="sm" />
                      <span className="text-xs text-gray-500 ml-1">
                        ({user.total_ratings})
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center"
                  >
                    <User className="w-4 h-4 text-green-600" />
                  </button>
                </div>
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
              onNotificationRead={loadNotifications}
              onLogout={handleLogout}
            />
          ) : (
            <GardenerDashboard 
              user={user} 
              activeTab={activeTab} 
              onTabChange={setActiveTab}
              showToast={showToast}
              notifications={notifications}
              onNotificationRead={loadNotifications}
              onLogout={handleLogout}
            />
          )}
        </main>

        {/* Navegación inferior */}
        <BottomNavigation 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          userRole={user.role}
        />

        {/* Toast */}
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type}
            onClose={closeToast}
          />
        )}
      </div>
    </Router>
  );
};

export default App;