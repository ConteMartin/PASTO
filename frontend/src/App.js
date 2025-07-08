import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
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

// Componente de Login/Registro
const AuthForm = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'client',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-600 mb-2">🌱 PASTO!</h1>
          <p className="text-gray-600">
            {isLogin ? 'Inicia sesión' : 'Crea tu cuenta'}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de usuario
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="client">Cliente</option>
                  <option value="gardener">Jardinero</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono (opcional)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            {loading ? 'Procesando...' : (isLogin ? 'Iniciar sesión' : 'Registrarse')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-green-600 hover:text-green-700"
          >
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente Dashboard para Clientes
const ClientDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('request');
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

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      const response = await axios.get('/api/services/my-requests');
      setMyRequests(response.data);
    } catch (err) {
      console.error('Error fetching requests:', err);
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
    } finally {
      setLoading(false);
    }
  };

  const handleRequestService = async () => {
    setLoading(true);
    try {
      const requestData = {
        ...serviceForm,
        client_id: user.user_id
      };
      
      await axios.post('/api/services/request', requestData);
      alert('¡Solicitud enviada exitosamente!');
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
      fetchMyRequests();
    } catch (err) {
      alert('Error al enviar la solicitud: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const serviceTypes = {
    grass_cutting: 'Corte de césped',
    pruning: 'Poda',
    cleaning: 'Limpieza',
    maintenance: 'Mantenimiento'
  };

  const statusTranslations = {
    pending: 'Pendiente',
    accepted: 'Aceptado',
    in_progress: 'En progreso',
    completed: 'Completado',
    cancelled: 'Cancelado'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-600 text-white p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">🌱 PASTO! - Cliente</h1>
          <div className="flex items-center space-x-4">
            <span>Hola, {user.full_name}</span>
            <button
              onClick={onLogout}
              className="bg-green-700 px-3 py-1 rounded hover:bg-green-800"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="flex">
          <button
            onClick={() => setActiveTab('request')}
            className={`flex-1 py-3 px-4 text-center ${
              activeTab === 'request'
                ? 'bg-green-100 text-green-700 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Solicitar servicio
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 px-4 text-center ${
              activeTab === 'history'
                ? 'bg-green-100 text-green-700 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Mis solicitudes
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="p-4">
        {activeTab === 'request' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Solicitar servicio de jardinería</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de servicio
                  </label>
                  <select
                    value={serviceForm.service_type}
                    onChange={(e) => setServiceForm({...serviceForm, service_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {Object.entries(serviceTypes).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={serviceForm.address}
                    onChange={(e) => setServiceForm({...serviceForm, address: e.target.value})}
                    placeholder="Ingresa la dirección del servicio"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ancho del terreno (m)
                    </label>
                    <input
                      type="number"
                      value={serviceForm.terrain_width}
                      onChange={(e) => setServiceForm({...serviceForm, terrain_width: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Largo del terreno (m)
                    </label>
                    <input
                      type="number"
                      value={serviceForm.terrain_length}
                      onChange={(e) => setServiceForm({...serviceForm, terrain_length: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {serviceForm.service_type === 'pruning' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dificultad de poda
                    </label>
                    <select
                      value={serviceForm.pruning_difficulty}
                      onChange={(e) => setServiceForm({...serviceForm, pruning_difficulty: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="easy">Fácil</option>
                      <option value="medium">Media</option>
                      <option value="hard">Difícil</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas adicionales
                  </label>
                  <textarea
                    value={serviceForm.notes}
                    onChange={(e) => setServiceForm({...serviceForm, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Información adicional sobre el servicio..."
                  />
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={handleEstimatePrice}
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Calculando...' : 'Estimar precio'}
                  </button>
                </div>

                {estimation && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-2">Estimación del servicio</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Área:</span>
                        <span className="font-medium ml-2">{estimation.terrain_area} m²</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Duración:</span>
                        <span className="font-medium ml-2">{estimation.estimated_duration} min</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">Precio estimado:</span>
                        <span className="font-bold text-green-600 ml-2 text-lg">
                          ${estimation.estimated_price} {estimation.currency}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleRequestService}
                      disabled={loading || !serviceForm.address}
                      className="w-full mt-4 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {loading ? 'Enviando...' : 'Confirmar solicitud'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">Mis solicitudes de servicio</h2>
            
            {myRequests.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-500">No tienes solicitudes de servicio aún.</p>
                <button
                  onClick={() => setActiveTab('request')}
                  className="mt-4 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
                >
                  Solicitar primer servicio
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myRequests.map((request) => (
                  <div key={request.service_id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {serviceTypes[request.service_type]}
                        </h3>
                        <p className="text-gray-600">{request.address}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                        request.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                        request.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {statusTranslations[request.status]}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Área:</span>
                        <span className="ml-2">{request.terrain_width} x {request.terrain_length} m</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Duración estimada:</span>
                        <span className="ml-2">{request.estimated_duration} min</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Precio:</span>
                        <span className="ml-2 font-medium">${request.estimated_price} ARS</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Creado:</span>
                        <span className="ml-2">{new Date(request.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

// Componente Dashboard para Jardineros
const GardenerDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('available');
  const [availableServices, setAvailableServices] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAvailableServices();
  }, []);

  const fetchAvailableServices = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/services/available');
      setAvailableServices(response.data);
    } catch (err) {
      console.error('Error fetching available services:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptService = async (serviceId) => {
    try {
      await axios.post(`/api/services/${serviceId}/accept`);
      alert('¡Servicio aceptado exitosamente!');
      fetchAvailableServices();
    } catch (err) {
      alert('Error al aceptar el servicio: ' + (err.response?.data?.detail || err.message));
    }
  };

  const serviceTypes = {
    grass_cutting: 'Corte de césped',
    pruning: 'Poda',
    cleaning: 'Limpieza',
    maintenance: 'Mantenimiento'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-600 text-white p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">🌱 PASTO! - Jardinero</h1>
          <div className="flex items-center space-x-4">
            <span>Hola, {user.full_name}</span>
            <button
              onClick={onLogout}
              className="bg-green-700 px-3 py-1 rounded hover:bg-green-800"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="flex">
          <button
            onClick={() => setActiveTab('available')}
            className={`flex-1 py-3 px-4 text-center ${
              activeTab === 'available'
                ? 'bg-green-100 text-green-700 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Trabajos disponibles
          </button>
          <button
            onClick={() => setActiveTab('my-jobs')}
            className={`flex-1 py-3 px-4 text-center ${
              activeTab === 'my-jobs'
                ? 'bg-green-100 text-green-700 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Mis trabajos
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="p-4">
        {activeTab === 'available' && (
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Trabajos disponibles</h2>
              <button
                onClick={fetchAvailableServices}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Cargando...' : 'Actualizar'}
              </button>
            </div>
            
            {availableServices.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-500">No hay trabajos disponibles en este momento.</p>
                <p className="text-sm text-gray-400 mt-2">
                  Los nuevos trabajos aparecerán aquí automáticamente.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableServices.map((service) => (
                  <div key={service.service_id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {serviceTypes[service.service_type]}
                        </h3>
                        <p className="text-gray-600">{service.address}</p>
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
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-gray-600">Área:</span>
                        <span className="ml-2">{service.terrain_width} x {service.terrain_length} m</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Tipo:</span>
                        <span className="ml-2">{service.is_immediate ? 'Inmediato' : 'Programado'}</span>
                      </div>
                      {service.pruning_difficulty && (
                        <div>
                          <span className="text-gray-600">Dificultad:</span>
                          <span className="ml-2 capitalize">{service.pruning_difficulty}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-600">Creado:</span>
                        <span className="ml-2">{new Date(service.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {service.notes && (
                      <div className="mb-4">
                        <span className="text-gray-600 text-sm">Notas:</span>
                        <p className="text-sm mt-1 p-2 bg-gray-50 rounded">{service.notes}</p>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAcceptService(service.service_id)}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
                      >
                        Aceptar trabajo
                      </button>
                      <button className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400">
                        Ver detalles
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'my-jobs' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">Mis trabajos aceptados</h2>
            
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">Funcionalidad en desarrollo.</p>
              <p className="text-sm text-gray-400 mt-2">
                Aquí podrás ver y gestionar tus trabajos aceptados.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Componente principal de la aplicación
const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un token guardado
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (err) {
        console.error('Error parsing user data:', err);
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando PASTO!...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            user.role === 'client' ? (
              <ClientDashboard user={user} onLogout={handleLogout} />
            ) : (
              <GardenerDashboard user={user} onLogout={handleLogout} />
            )
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;