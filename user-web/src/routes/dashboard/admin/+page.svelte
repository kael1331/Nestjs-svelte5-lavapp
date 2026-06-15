<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/features/auth/services/auth-store.svelte';
  import { navStore } from '$lib/components/layout/nav-store.svelte';
  import { apiConfig } from '$lib/services/api-config.svelte';

  let carWash = $state<any>(null);
  let platformSettings = $state<any>(null);
  let subscriptions = $state<any[]>([]);
  let loadingWash = $state<boolean>(true);
  let loadingSubscriptions = $state<boolean>(false);
  
  // Membership validation files
  let uploading = $state<boolean>(false);
  let uploadError = $state<string>('');
  let uploadSuccess = $state<string>('');
  let fileInput = $state<HTMLInputElement>();

  // Wash Settings states
  let washName = $state('');
  let washAddress = $state('');
  let washPaymentAlias = $state('');
  let washBaysCount = $state(1);
  let washLat = $state<number>(-26.82414);
  let washLng = $state<number>(-65.22260);
  let savingWashSettings = $state(false);
  let saveSettingsSuccess = $state('');
  let saveSettingsError = $state('');

  // Image preview modal states
  let showPhotoModal = $state(false);
  let selectedPhotoUrl = $state('');

  // Editing vehicle states
  let editingVehicleId = $state<string | null>(null);
  let editingVehicleName = $state('');

  // Map and Geocoding states
  let searchAddress = $state('');
  let geocodingResults = $state<any[]>([]);
  let searchingGeocode = $state(false);
  let mapElement = $state<HTMLDivElement | null>(null);
  let gettingLocation = $state(false);
  let map: any = null;
  let marker: any = null;
  let L: any = null;

  function openPhotoModal(url: string) {
    selectedPhotoUrl = url;
    showPhotoModal = true;
  }

  // Wash Photos Gallery states
  let photosFileInput = $state<HTMLInputElement>();
  let uploadingPhotos = $state(false);
  let uploadPhotosError = $state('');

  // Custom Vehicles states
  let vehiclesList = $state<any[]>([]);
  let loadingVehicles = $state(false);
  let newVehicleName = $state('');
  let addingVehicle = $state(false);
  let vehicleError = $state('');

  // Services states
  let servicesList = $state<any[]>([]);
  let loadingServices = $state(false);
  let showServiceModal = $state(false);
  let editingServiceId = $state<string | null>(null);
  let serviceForm = $state({
    name: '',
    description: '',
    vehicleType: '',
    durationMinutes: 30,
    price: 1000
  });
  let savingService = $state(false);
  let serviceError = $state('');

  // Schedules and Exceptions state for computing live status
  let schedulesList = $state<any[]>([]);
  let exceptionsList = $state<any[]>([]);

  async function fetchSchedules() {
    try {
      const res = await fetch(`${apiConfig.baseUrl}/schedules`, {
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      });
      if (res.ok) {
        schedulesList = await res.json();
      }
    } catch (e) {
      console.error('Error fetching schedules:', e);
    }
  }

  async function fetchExceptions() {
    try {
      const res = await fetch(`${apiConfig.baseUrl}/schedules/exceptions`, {
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      });
      if (res.ok) {
        exceptionsList = await res.json();
      }
    } catch (e) {
      console.error('Error fetching exceptions:', e);
    }
  }

  function isCurrentlyWorkingTime(): boolean {
    if (schedulesList.length === 0) return false;
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const localDateStr = `${yyyy}-${mm}-${dd}`;

    const hasException = exceptionsList.some(exc => exc.date === localDateStr);
    if (hasException) return false;

    const dayOfWeek = now.getDay();
    const daySchedules = schedulesList.filter(s => s.dayOfWeek === dayOfWeek);
    if (daySchedules.length === 0) return false;

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    for (const sched of daySchedules) {
      const startParts = sched.startTime.split(':');
      const startMins = parseInt(startParts[0], 10) * 60 + parseInt(startParts[1], 10);
      const endParts = sched.endTime.split(':');
      const endMins = parseInt(endParts[0], 10) * 60 + parseInt(endParts[1], 10);
      if (currentMinutes >= startMins && currentMinutes <= endMins) {
        return true;
      }
    }
    return false;
  }

  function computedIsOpen(): boolean {
    if (!carWash) return false;
    return carWash.isManuallyOpen;
  }

  async function handleToggleOpeningMode(mode: string) {
    if (!carWash) return;
    try {
      const res = await fetch(`${apiConfig.baseUrl}/car-washes/my-wash`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify({ openingMode: mode })
      });
      if (res.ok) {
        carWash.openingMode = mode;
        await fetchWashStatus();
      }
    } catch (e) {
      console.error('Error updating opening mode:', e);
    }
  }

  async function fetchWashStatus() {
    try {
      loadingWash = true;
      const res = await fetch(`${apiConfig.baseUrl}/car-washes/my-wash`, {
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      });
      if (res.ok) {
        carWash = await res.json();
        // Populate edit settings
        washName = carWash.name || '';
        washAddress = carWash.address || '';
        washPaymentAlias = carWash.clientPaymentAlias || '';
        washBaysCount = carWash.baysCount || 1;
        washLat = carWash.latitude ? parseFloat(carWash.latitude) : -26.82414;
        washLng = carWash.longitude ? parseFloat(carWash.longitude) : -65.22260;
      }
    } catch (e) {
      console.error('Error fetching wash:', e);
    } finally {
      loadingWash = false;
    }
  }

  async function fetchPlatformSettings() {
    try {
      const res = await fetch(`${apiConfig.baseUrl}/platform-settings`, {
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      });
      if (res.ok) {
        platformSettings = await res.json();
      }
    } catch (e) {
      console.error('Error fetching platform settings:', e);
    }
  }

  async function fetchSubscriptions() {
    try {
      loadingSubscriptions = true;
      const res = await fetch(`${apiConfig.baseUrl}/car-washes/subscriptions`, {
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      });
      if (res.ok) {
        subscriptions = await res.json();
      }
    } catch (e) {
      console.error('Error fetching subscriptions:', e);
    } finally {
      loadingSubscriptions = false;
    }
  }

  // Vehicles fetch
  async function fetchVehicles() {
    try {
      loadingVehicles = true;
      const res = await fetch(`${apiConfig.baseUrl}/admin-vehicles`, {
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      });
      if (res.ok) {
        vehiclesList = await res.json();
      }
    } catch (e) {
      console.error('Error fetching vehicles:', e);
    } finally {
      loadingVehicles = false;
    }
  }

  // Services fetch
  async function fetchServices() {
    try {
      loadingServices = true;
      const res = await fetch(`${apiConfig.baseUrl}/services`, {
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      });
      if (res.ok) {
        servicesList = await res.json();
      }
    } catch (e) {
      console.error('Error fetching services:', e);
    } finally {
      loadingServices = false;
    }
  }

  onMount(async () => {
    navStore.reset('home');
    await fetchWashStatus();
    await fetchPlatformSettings();
    await fetchSubscriptions();
    await fetchVehicles();
    await fetchServices();
    if (carWash && carWash.isServiceActive) {
      await fetchSchedules();
      await fetchExceptions();
    }
  });

  $effect(() => {
    if (carWash?.isServiceActive && schedulesList.length === 0) {
      fetchSchedules();
      fetchExceptions();
    }
  });

  const latestSub = $derived(
    subscriptions.length > 0 ? subscriptions[0] : null
  );

  const activeVehicles = $derived(
    vehiclesList.filter(v => v.isActive)
  );

  // Clear success/error messages on tab change
  $effect(() => {
    const tab = navStore.activeTab;
    saveSettingsSuccess = '';
    saveSettingsError = '';
    uploadError = '';
    uploadSuccess = '';
    uploadPhotosError = '';
    vehicleError = '';
    serviceError = '';
  });

  // Trigger leaflet loading on Map Element mount
  $effect(() => {
    if (mapElement && carWash && typeof window !== 'undefined') {
      if (map) {
        try {
          map.remove();
        } catch (e) {
          console.error('Error removing map:', e);
        }
        map = null;
        marker = null;
      }

      (async () => {
        if (!L) {
          L = await import('leaflet');
        }
        if (!mapElement) return;

        const initialLat = washLat;
        const initialLng = washLng;

        map = L.map(mapElement).setView([initialLat, initialLng], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          washLat = pos.lat;
          washLng = pos.lng;
          fetchAddressFromCoords(pos.lat, pos.lng);
        });

        if (!washAddress) {
          fetchAddressFromCoords(initialLat, initialLng);
        }
      })();

      return () => {
        if (map) {
          try {
            map.remove();
          } catch (e) {
            console.error('Error removing map on cleanup:', e);
          }
          map = null;
          marker = null;
        }
      };
    }
  });

  // Toggle Manual Open
  async function handleToggleManualOpen() {
    if (!carWash) return;
    const newStatus = !carWash.isManuallyOpen;
    try {
      const res = await fetch(`${apiConfig.baseUrl}/car-washes/my-wash`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify({ isManuallyOpen: newStatus })
      });
      if (res.ok) {
        carWash.isManuallyOpen = newStatus;
      }
    } catch (e) {
      console.error('Error toggling open status:', e);
    }
  }

  // Save general settings
  async function saveWashSettings() {
    savingWashSettings = true;
    saveSettingsSuccess = '';
    saveSettingsError = '';
    try {
      const res = await fetch(`${apiConfig.baseUrl}/car-washes/my-wash`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify({
          name: washName,
          address: washAddress,
          clientPaymentAlias: washPaymentAlias,
          baysCount: washBaysCount,
          latitude: washLat,
          longitude: washLng
        })
      });
      if (res.ok) {
        saveSettingsSuccess = 'Configuración y ubicación guardadas con éxito.';
        await fetchWashStatus();
      } else {
        const err = await res.json();
        saveSettingsError = err.message || 'Error al actualizar la configuración.';
      }
    } catch (e) {
      saveSettingsError = 'Error al conectar con el servidor.';
    } finally {
      savingWashSettings = false;
    }
  }

  async function fetchAddressFromCoords(lat: number, lng: number) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      if (res.ok) {
        const data = await res.json();
        washAddress = data.display_name || '';
      }
    } catch (e) {
      console.error('Error reverse geocoding:', e);
    }
  }

  async function syncAutomaticState() {
    if (!carWash) return;
    const isWorkingNow = isCurrentlyWorkingTime();
    try {
      const res = await fetch(`${apiConfig.baseUrl}/car-washes/my-wash`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify({ isManuallyOpen: isWorkingNow })
      });
      if (res.ok) {
        carWash.isManuallyOpen = isWorkingNow;
      }
    } catch (e) {
      console.error('Error syncing status:', e);
    }
  }

  // Address Geocoding
  async function handleGeocodeSearch() {
    if (!searchAddress.trim()) return;
    searchingGeocode = true;
    geocodingResults = [];
    try {
      // Constrained to San Miguel de Tucumán, Argentina
      const fullQuery = encodeURIComponent(searchAddress.trim() + ', San Miguel de Tucumán, Tucumán, Argentina');
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${fullQuery}&limit=5`);
      if (res.ok) {
        geocodingResults = await res.json();
        if (geocodingResults.length > 0) {
          // Auto select the first result to automatically locate the pin
          selectGeocodeResult(geocodingResults[0]);
        }
      }
    } catch (e) {
      console.error('Geocoding error:', e);
    } finally {
      searchingGeocode = false;
    }
  }

  // Get current position using browser geolocation API
  function handleGetCurrentLocation() {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      gettingLocation = true;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          washLat = lat;
          washLng = lng;
          if (map && marker) {
            map.setView([lat, lng], 16);
            marker.setLatLng([lat, lng]);
          }
          fetchAddressFromCoords(lat, lng);
          gettingLocation = false;
        },
        (error) => {
          console.error('Error getting geolocation:', error);
          saveSettingsError = 'No se pudo obtener la ubicación actual. Permiso denegado o error de geolocalización.';
          gettingLocation = false;
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      saveSettingsError = 'La geolocalización no está soportada por este navegador.';
    }
  }

  function selectGeocodeResult(res: any) {
    const lat = parseFloat(res.lat);
    const lon = parseFloat(res.lon);
    washLat = lat;
    washLng = lon;
    geocodingResults = [];
    searchAddress = res.display_name;
    washAddress = res.display_name;

    if (map && marker) {
      map.setView([lat, lon], 16);
      marker.setLatLng([lat, lon]);
    }
  }

  // Multi-photo upload
  async function handleUploadWashPhotos() {
    if (!photosFileInput || !photosFileInput.files || photosFileInput.files.length === 0) {
      return;
    }
    uploadingPhotos = true;
    uploadPhotosError = '';
    try {
      for (let i = 0; i < photosFileInput.files.length; i++) {
        const file = photosFileInput.files[i];
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`${apiConfig.baseUrl}/car-washes/my-wash/photos`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authStore.token}`
          },
          body: formData
        });

        if (!res.ok) {
          const err = await res.json();
          uploadPhotosError = err.message || 'Ocurrió un error al subir alguna foto.';
        }
      }
      photosFileInput.value = '';
      await fetchWashStatus();
    } catch (e) {
      uploadPhotosError = 'Error de conexión al subir fotos.';
    } finally {
      uploadingPhotos = false;
    }
  }

  async function handleDeletePhoto(id: string) {
    if (!confirm('¿Seguro que deseas eliminar esta foto de tu local?')) return;
    try {
      const res = await fetch(`${apiConfig.baseUrl}/car-washes/my-wash/photos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        }
      });
      if (res.ok) {
        await fetchWashStatus();
      }
    } catch (e) {
      console.error('Error deleting photo:', e);
    }
  }

  // Custom Vehicle Catalogue functions
  async function handleAddVehicle() {
    if (!newVehicleName.trim()) return;
    addingVehicle = true;
    vehicleError = '';
    try {
      const res = await fetch(`${apiConfig.baseUrl}/admin-vehicles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify({ name: newVehicleName.trim() })
      });
      if (res.ok) {
        newVehicleName = '';
        await fetchVehicles();
      } else {
        const err = await res.json();
        vehicleError = err.message || 'Error al agregar el vehículo.';
      }
    } catch (e) {
      vehicleError = 'Error de conexión con el servidor.';
    } finally {
      addingVehicle = false;
    }
  }

  async function toggleVehicleActive(id: string, currentStatus: boolean) {
    try {
      const res = await fetch(`${apiConfig.baseUrl}/admin-vehicles/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      if (res.ok) {
        await fetchVehicles();
      }
    } catch (e) {
      console.error('Error toggling vehicle status:', e);
    }
  }

  async function handleDeleteVehicle(id: string) {
    if (!confirm('¿Seguro que deseas eliminar este vehículo de tu catálogo?')) return;
    try {
      const res = await fetch(`${apiConfig.baseUrl}/admin-vehicles/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        }
      });
      if (res.ok) {
        await fetchVehicles();
      }
    } catch (e) {
      console.error('Error deleting vehicle:', e);
    }
  }

  async function handleUpdateVehicleName(id: string) {
    if (!editingVehicleName.trim()) return;
    try {
      const res = await fetch(`${apiConfig.baseUrl}/admin-vehicles/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify({ name: editingVehicleName.trim() })
      });
      if (res.ok) {
        editingVehicleId = null;
        editingVehicleName = '';
        await fetchVehicles();
      }
    } catch (e) {
      console.error('Error updating vehicle name:', e);
    }
  }

  function startEditingVehicle(vehicle: any) {
    editingVehicleId = vehicle.id;
    editingVehicleName = vehicle.name;
  }

  function cancelEditingVehicle() {
    editingVehicleId = null;
    editingVehicleName = '';
  }

  // Service CRUD functions
  function openAddServiceModal() {
    editingServiceId = null;
    serviceForm = {
      name: '',
      description: '',
      vehicleType: activeVehicles.length > 0 ? activeVehicles[0].name : '',
      durationMinutes: 30,
      price: 1500
    };
    serviceError = '';
    showServiceModal = true;
  }

  function openEditServiceModal(serv: any) {
    editingServiceId = serv.id;
    serviceForm = {
      name: serv.name,
      description: serv.description || '',
      vehicleType: serv.vehicleType,
      durationMinutes: serv.durationMinutes,
      price: serv.price
    };
    serviceError = '';
    showServiceModal = true;
  }

  async function saveService() {
    if (!serviceForm.name.trim() || !serviceForm.vehicleType) {
      serviceError = 'El nombre y el tipo de vehículo son obligatorios.';
      return;
    }
    savingService = true;
    serviceError = '';

    const url = editingServiceId
      ? `${apiConfig.baseUrl}/services/${editingServiceId}`
      : `${apiConfig.baseUrl}/services`;
    const method = editingServiceId ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify(serviceForm)
      });
      if (res.ok) {
        showServiceModal = false;
        await fetchServices();
      } else {
        const err = await res.json();
        serviceError = err.message || 'Error al guardar el servicio.';
      }
    } catch (e) {
      serviceError = 'Error al conectar con el servidor.';
    } finally {
      savingService = false;
    }
  }

  async function handleDeleteService(id: string) {
    if (!confirm('¿Seguro que deseas eliminar este servicio?')) return;
    try {
      const res = await fetch(`${apiConfig.baseUrl}/services/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        }
      });
      if (res.ok) {
        await fetchServices();
      }
    } catch (e) {
      console.error('Error al eliminar el servicio:', e);
    }
  }

  // Upload membership receipt
  async function handleUploadReceipt() {
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      uploadError = 'Por favor selecciona la imagen de tu comprobante.';
      return;
    }
    uploading = true;
    uploadError = '';
    uploadSuccess = '';

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    try {
      const res = await fetch(`${apiConfig.baseUrl}/car-washes/my-wash/subscribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        },
        body: formData
      });
      if (res.ok) {
        uploadSuccess = '¡Comprobante enviado con éxito! Tu pago está en revisión.';
        if (fileInput) fileInput.value = '';
        await fetchWashStatus();
        await fetchSubscriptions();
      } else {
        const errData = await res.json();
        uploadError = errData.message || 'Error al subir el comprobante.';
      }
    } catch (e) {
      uploadError = 'Error de conexión con el servidor.';
    } finally {
      uploading = false;
    }
  }
</script>

<svelte:head>
  <title>Dashboard Administrador - LavaApp</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
</svelte:head>

{#if loadingWash}
  <div class="loading-container">
    <div class="spinner"></div>
    <p>Cargando información del lavadero...</p>
  </div>
{:else}
  <div class="dashboard-card">
    <div class="tab-content">
      
      <!-- 1. HOME TAB -->
      {#if navStore.activeTab === 'home'}
        <div class="content-panel animate-fade">
          <h3 class="panel-subtitle">Resumen del Establecimiento</h3>
          <p class="welcome-text font-outfit">Gestión y control de operaciones del lavadero.</p>

          {#if carWash && !carWash.isServiceActive}
            <div class="alert-box-inline">
              <span class="warning-icon">⚠️</span>
              <div>
                <h4 class="alert-title">Suscripción Inactiva</h4>
                <p class="alert-description">
                  Tu lavadero se encuentra desactivado y no figura públicamente en las búsquedas de los clientes.
                  Realiza la transferencia y carga tu comprobante de pago en la pestaña <strong>Membresía</strong> para activarlo.
                </p>
              </div>
            </div>
          {/if}

          <div class="grid-stats">
            <div class="stat-card">
              <span class="stat-label">Estado del Lavadero</span>
              <span class="stat-value" class:text-active={computedIsOpen()} class:text-inactive={!computedIsOpen()}>
                {computedIsOpen() ? 'Abierto' : 'Cerrado'}
              </span>
              <span class="stat-desc">
                {carWash?.openingMode === 'automatic' ? '⏱️ Automático' : '🎮 Manual'} -
                {computedIsOpen() ? 'Disponible para reservas' : 'Cerrado temporalmente'}
              </span>
            </div>
            
            <div class="stat-card">
              <span class="stat-label">Visibilidad Pública</span>
              <span class="stat-value" class:text-active={carWash?.isServiceActive} class:text-inactive={!carWash?.isServiceActive}>
                {carWash?.isServiceActive ? 'Activo' : 'Inactivo'}
              </span>
              <span class="stat-desc">Estado de la Membresía</span>
            </div>

            <div class="stat-card">
              <span class="stat-label">Servicios Activos</span>
              <span class="stat-value highlight-green font-outfit">{servicesList.length}</span>
              <span class="stat-desc">Servicios listados al cliente</span>
            </div>

            <div class="stat-card">
              <span class="stat-label">Bahías Disponibles</span>
              <span class="stat-value highlight font-outfit">{carWash?.baysCount || 1}</span>
              <span class="stat-desc">Espacios de lavado físico</span>
            </div>
          </div>
        </div>

      <!-- 2. OPERATIONS TAB -->
      {:else if navStore.activeTab === 'operations'}
        <div class="content-panel animate-fade">
          <h3 class="panel-subtitle">Operations</h3>
          
          {#if carWash && !carWash.isServiceActive}
            <div class="alert-box">
              <span class="warning-icon">⚠️</span>
              <div>
                <h4 class="alert-title">Acceso Restringido</h4>
                <p class="alert-description">Esta sección requiere que tu membresía esté activa. Por favor, ve a la pestaña <strong>Membresía</strong> para habilitar el servicio y gestionar las operaciones en tiempo real.</p>
              </div>
            </div>
          {:else}
            <p class="section-desc">Gestiona el estado operativo diario de tu establecimiento y atiende los pedidos.</p>

            <div class="card-status-toggle">
              <div class="status-toggle-info">
                <h4 class="status-toggle-title">Configuración de Estado en Tiempo Real</h4>
                <p class="status-toggle-desc">
                  Define cómo se calcula si tu local figura Abierto o Cerrado en este instante. Esto sirve como indicación visual en tiempo real para los clientes, <strong>pero nunca bloqueará la solicitud de turnos a futuro</strong>, las cuales se rigen únicamente por tus horarios laborales, días laborales y excepciones.
                </p>

                <!-- Selector de Modo de Apertura -->
                <div class="opening-mode-selector" style="margin-top: 18px; display: flex; flex-wrap: wrap; gap: 16px;">
                  <label class="radio-label">
                    <input 
                      type="radio" 
                      name="openingMode" 
                      value="automatic" 
                      checked={carWash?.openingMode === 'automatic'} 
                      onchange={() => handleToggleOpeningMode('automatic')} 
                    />
                    <span style="font-size: 13px; font-weight: 500; color: #e2e8f0; cursor: pointer;">⏱️ Modo Automático (según horario laboral)</span>
                  </label>
                  <label class="radio-label">
                    <input 
                      type="radio" 
                      name="openingMode" 
                      value="manual" 
                      checked={carWash?.openingMode === 'manual'} 
                      onchange={() => handleToggleOpeningMode('manual')} 
                    />
                    <span style="font-size: 13px; font-weight: 500; color: #e2e8f0; cursor: pointer;">🎮 Modo Manual (por interruptor)</span>
                  </label>
                </div>

                <div class="state-badge-container" style="margin-top: 20px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                  <span class="badge-operation" class:open={computedIsOpen()}>
                    {computedIsOpen() ? 'ESTADO ACTUAL: ABIERTO' : 'ESTADO ACTUAL: CERRADO'}
                  </span>
                  
                  {#if carWash?.openingMode === 'automatic'}
                    <span style="font-size: 12px; color: #94a3b8; font-weight: 500;">
                      {isCurrentlyWorkingTime() 
                        ? '🟢 Dentro del horario de atención laboral' 
                        : '🔴 Fuera del horario de atención laboral'}
                      {(!carWash.isManuallyOpen && isCurrentlyWorkingTime()) ? ' (Forzado a Cerrado)' : ''}
                      {(carWash.isManuallyOpen && !isCurrentlyWorkingTime()) ? ' (Forzado a Abierto)' : ''}
                    </span>
                  {/if}
                </div>
              </div>

              <div class="status-toggle-action" style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
                <label class="switch-container">
                  <input type="checkbox" checked={carWash?.isManuallyOpen} onchange={handleToggleManualOpen} />
                  <span class="switch-slider"></span>
                </label>
                <span style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">Interruptor Manual</span>
              </div>
            </div>

            {#if carWash?.openingMode === 'automatic' && carWash?.isManuallyOpen !== isCurrentlyWorkingTime()}
              <div class="alert-box-warning" style="margin-top: 16px; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 12px; padding: 12px 16px; font-size: 13px; color: #f59e0b; display: flex; align-items: center; justify-content: space-between; max-width: 800px;">
                <span>⚠️ Se aplicó una sobreescritura manual. Tu horario de atención laboral indica que el local debería figurar <strong>{isCurrentlyWorkingTime() ? 'Abierto' : 'Cerrado'}</strong>.</span>
                <button onclick={syncAutomaticState} class="btn-secondary" style="padding: 4px 12px; font-size: 11px; margin-top: 0; margin-left: 12px; border-color: rgba(245, 158, 11, 0.3); color: #f59e0b; background: transparent;">
                  Sincronizar
                </button>
              </div>
            {/if}

            <div class="admin-actions-placeholder" style="margin-top: 24px;">
              <h5 class="info-label" style="color: #f1f5f9; font-weight: 600; margin-bottom: 8px;">Próxima Fase: Pedidos y Turnos</h5>
              <p>Aquí se listarán las reservas del día asignadas a cada una de tus {carWash?.baysCount || 1} bahías físicas de lavado, permitiéndote cambiar estados y dar aviso al cliente cuando su vehículo esté listo.</p>
            </div>
          {/if}
        </div>

      <!-- 3. VEHICLES TAB -->
      {:else if navStore.activeTab === 'vehicles'}
        <div class="content-panel animate-fade">
          <h3 class="panel-subtitle">Vehículo</h3>
          <p class="section-desc">Configura los tipos de vehículos que tu lavadero admite. Los servicios que ofrezcas deberán asociarse a alguno de los vehículos activos en esta lista.</p>

          <div class="catalog-grid">
            <div class="catalog-card">
              <h4 class="payment-title">Catálogo de Vehículos Admitidos</h4>
              
              {#if loadingVehicles}
                <div class="loading-box-inline">
                  <div class="spinner-small"></div>
                  <p>Cargando catálogo...</p>
                </div>
              {:else if vehiclesList.length === 0}
                <p class="empty-history">No tienes vehículos configurados.</p>
              {:else}
                <div class="table-container">
                  <table class="vehicles-table">
                    <thead>
                      <tr>
                        <th>Vehículo</th>
                        <th>Estado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each vehiclesList as vehicle}
                        <tr>
                          <td>
                            {#if editingVehicleId === vehicle.id}
                              <input 
                                type="text" 
                                bind:value={editingVehicleName} 
                                class="file-input" 
                                style="padding: 4px 8px; font-size: 13px; max-width: 150px; display: inline-block;" 
                                onkeydown={(e) => e.key === 'Enter' && handleUpdateVehicleName(vehicle.id)}
                              />
                            {:else}
                              <span class="font-outfit" style="font-weight: 600; color: #f1f5f9;">{vehicle.name}</span>
                            {/if}
                          </td>
                          <td>
                            <button 
                              onclick={() => toggleVehicleActive(vehicle.id, vehicle.isActive)} 
                              class="badge-status-btn"
                              class:active={vehicle.isActive}
                            >
                              {vehicle.isActive ? 'Activo' : 'Inactivo'}
                            </button>
                          </td>
                          <td>
                            <div style="display: flex; align-items: center; gap: 8px;">
                              {#if editingVehicleId === vehicle.id}
                                <button onclick={() => handleUpdateVehicleName(vehicle.id)} class="btn-action-edit" style="color: #34d399; border-color: rgba(52, 211, 153, 0.2); font-weight: bold;" aria-label="Guardar">
                                  ✓
                                </button>
                                <button onclick={cancelEditingVehicle} class="btn-action-edit" style="color: #f87171; border-color: rgba(248, 113, 113, 0.2); font-weight: bold;" aria-label="Cancelar">
                                  ✕
                                </button>
                              {:else}
                                <button onclick={() => startEditingVehicle(vehicle)} class="btn-action-edit" aria-label="Editar Nombre">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                </button>
                                <button onclick={() => handleDeleteVehicle(vehicle.id)} class="btn-action-danger" aria-label="Eliminar">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                              {/if}
                            </div>
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              {/if}
            </div>

            <!-- Form Agregar Vehículo -->
            <div class="catalog-card">
              <h4 class="payment-title">Agregar Vehículo Personalizado</h4>
              <p class="payment-subtitle">Crea un tipo de vehículo a la medida de tu negocio (ejemplo: "Cuatriciclo", "Colectivo", "Bicicleta").</p>

              <div class="form-group">
                <label for="new-veh-name" class="file-label">Nombre del Vehículo:</label>
                <input 
                  type="text" 
                  id="new-veh-name" 
                  placeholder="Ej: Acoplado" 
                  bind:value={newVehicleName} 
                  class="file-input" 
                />
                {#if vehicleError}
                  <p class="error-msg">{vehicleError}</p>
                {/if}
                <button 
                  onclick={handleAddVehicle} 
                  disabled={addingVehicle || !newVehicleName.trim()} 
                  class="btn-primary"
                  style="margin-top: 16px;"
                >
                  {addingVehicle ? 'Agregando...' : 'Agregar al Catálogo'}
                </button>
              </div>
            </div>
          </div>
        </div>

      <!-- 4. SERVICES TAB -->
      {:else if navStore.activeTab === 'services'}
        <div class="content-panel animate-fade">
          <div class="header-actions">
            <h3 class="panel-subtitle">Servicio</h3>
            {#if carWash?.isServiceActive}
              <button onclick={openAddServiceModal} class="btn-add">
                + Crear Servicio
              </button>
            {/if}
          </div>

          {#if carWash && !carWash.isServiceActive}
            <div class="alert-box">
              <span class="warning-icon">⚠️</span>
              <div>
                <h4 class="alert-title">Acceso Restringido</h4>
                <p class="alert-description">Esta sección requiere que tu membresía esté activa. Por favor, ve a la pestaña <strong>Membresía</strong> para habilitar el servicio y definir tus precios y servicios.</p>
              </div>
            </div>
          {:else}
            <p class="section-desc">Configura los precios, tipos de lavado y tiempos estimados según la categoría de vehículo admitida.</p>

            {#if loadingServices}
              <div class="loading-box-inline">
                <div class="spinner-small"></div>
                <p>Cargando servicios...</p>
              </div>
            {:else if servicesList.length === 0}
              <div class="empty-state-box">
                <p>Aún no has creado ningún servicio para tu lavadero.</p>
                <button onclick={openAddServiceModal} class="btn-primary" style="max-width: 200px; margin: 12px auto 0;">Crear mi primer servicio</button>
              </div>
            {:else}
              <div class="services-grid">
                {#each servicesList as service}
                  <div class="service-card">
                    <div class="service-card-header">
                      <span class="badge-veh">{service.vehicleType}</span>
                      <span class="service-price font-outfit">${service.price} ARS</span>
                    </div>
                    <h4 class="service-name font-outfit">{service.name}</h4>
                    <p class="service-desc">{service.description || 'Sin descripción'}</p>
                    <div class="service-card-footer">
                      <span class="service-duration">⏱️ {service.durationMinutes} min</span>
                      <div class="service-actions">
                        <button onclick={() => openEditServiceModal(service)} class="btn-action-edit" aria-label="Editar">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        </button>
                        <button onclick={() => handleDeleteService(service.id)} class="btn-action-danger" aria-label="Eliminar">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          {/if}
        </div>

      <!-- 5. MEMBERSHIP TAB (Settings) -->
      {:else if navStore.activeTab === 'membership'}
        <div class="content-panel animate-fade">
          <h3 class="panel-subtitle">Membresía</h3>
          <p class="section-desc">Consulta los datos para tu membresía mensual, sube comprobantes de transferencia o revisa tu historial de pagos.</p>

          <div class="membership-layout">
            <!-- Panel de Pago -->
            <div class="payment-card-static">
              <h4 class="payment-title">Renovar / Activar Suscripción</h4>
              <p class="payment-subtitle">Realiza una transferencia bancaria con los siguientes datos y sube tu comprobante. Puedes realizar renovaciones anticipadas y los 30 días se acumularán al final de tu período actual.</p>

              <div class="transfer-details">
                <div class="detail-item">
                  <span class="detail-label">Monto de la Membresía:</span>
                  <span class="detail-value font-outfit">${platformSettings?.subscriptionPrice ?? '1500'} ARS</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Alias de Transferencia:</span>
                  <span class="detail-value highlight font-outfit">{platformSettings?.superadminAlias ?? 'plataforma.lavados.alias'}</span>
                </div>
              </div>

              {#if latestSub && latestSub.status === 'pending'}
                <div class="status-box pending">
                  <div class="spinner-small"></div>
                  <div>
                    <h5 class="status-title">Comprobante en Revisión</h5>
                    <p class="status-desc">Subido el {new Date(latestSub.createdAt).toLocaleDateString()} a las {new Date(latestSub.createdAt).toLocaleTimeString()}. Nuestro equipo de soporte validará la transferencia a la brevedad.</p>
                  </div>
                </div>
              {:else}
                {#if latestSub && latestSub.status === 'rejected'}
                  <div class="status-box rejected">
                    <span class="status-icon">❌</span>
                    <div>
                      <h5 class="status-title">Pago Rechazado</h5>
                      <p class="status-desc">El comprobante anterior fue rechazado. Por favor, verifica el monto transferido y vuelve a subir una captura del comprobante válido.</p>
                    </div>
                  </div>
                {/if}

                <div class="upload-section">
                  <label for="receipt-file" class="file-label">Sube la captura de tu comprobante:</label>
                  <input type="file" id="receipt-file" accept="image/*" bind:this={fileInput} class="file-input" />
                  
                  {#if uploadError}
                    <p class="error-msg">{uploadError}</p>
                  {/if}
                  {#if uploadSuccess}
                    <p class="success-msg">{uploadSuccess}</p>
                  {/if}

                  <button onclick={handleUploadReceipt} disabled={uploading} class="btn-primary">
                    {uploading ? 'Enviando comprobante...' : 'Enviar Comprobante'}
                  </button>
                </div>
              {/if}
            </div>

            <!-- Historial de Pagos -->
            <div class="history-card">
              <h4 class="payment-title">Historial de Pagos</h4>
              
              {#if loadingSubscriptions}
                <div class="loading-box-inline">
                  <div class="spinner-small"></div>
                  <p>Cargando historial...</p>
                </div>
              {:else if subscriptions.length === 0}
                <p class="empty-history">No se registran pagos previos en la plataforma.</p>
              {:else}
                <div class="history-list">
                  {#each subscriptions as sub}
                    <div class="history-item">
                      <div class="history-info">
                        <span class="history-date">{new Date(sub.createdAt).toLocaleDateString()} - {new Date(sub.createdAt).toLocaleTimeString()}</span>
                        <span class="history-amount">Monto: ${sub.amountPaid} ARS</span>
                      </div>
                      <span class="status-badge badge-{sub.status}">
                        {sub.status === 'pending' ? 'Pendiente' : sub.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                      </span>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </div>

          <!-- Datos Administrativos moved here -->
          <div class="user-info-box" style="margin-top: 32px; max-width: 100%;">
            <h4 class="section-title">Datos Administrativos de Membresía</h4>
            <div class="info-row">
              <span class="info-label">Nombre del Establecimiento:</span>
              <span class="info-value">{carWash?.name || 'Establecimiento sin nombre'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Dueño / Encargado:</span>
              <span class="info-value">{authStore.user?.name || 'Administrador'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email de contacto:</span>
              <span class="info-value">{authStore.user?.email || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Membresía Vence:</span>
              <span class="info-value highlight-green font-outfit">
                {carWash?.subscriptionExpiresAt ? new Date(carWash.subscriptionExpiresAt).toLocaleDateString() : 'Sin membresía activa'}
              </span>
            </div>
          </div>
        </div>

      <!-- 6. WASH-SETTINGS TAB -->
      {:else if navStore.activeTab === 'wash-settings'}
        <div class="content-panel animate-fade">
          <h3 class="panel-subtitle">Configuración</h3>
          <p class="section-desc">Configura los datos comerciales del local, gestiona la galería de fotos y ubica con precisión tu local en el mapa para que lo vean los clientes.</p>

          <div class="settings-container">
            <div class="settings-form-card">
              <h4 class="payment-title">Datos Comerciales</h4>
              
              <div class="form-group">
                <label for="wash-name-input" class="file-label">Nombre Comercial del Lavadero:</label>
                <input 
                  type="text" 
                  id="wash-name-input" 
                  placeholder="Ej: CarWash Tucumán" 
                  bind:value={washName} 
                  class="file-input" 
                />
              </div>

              <div class="form-group">
                <label for="wash-address-input" class="file-label">Dirección física del lavadero (calculada o ingresada):</label>
                <textarea 
                  id="wash-address-input" 
                  rows="2"
                  placeholder="Ej: Av. Mate de Luna 2030, San Miguel de Tucumán" 
                  bind:value={washAddress} 
                  class="file-input" 
                  style="resize: vertical;"
                ></textarea>
              </div>

              <div class="form-group">
                <label for="wash-alias-input" class="file-label">CBU / CVU o Alias de cobro para clientes:</label>
                <input 
                  type="text" 
                  id="wash-alias-input" 
                  placeholder="Ej: lavadero.cobros" 
                  bind:value={washPaymentAlias} 
                  class="file-input" 
                />
              </div>

              <div class="form-group">
                <label for="wash-bays-input" class="file-label">Cantidad de Bahías de Lavado Simultáneas:</label>
                <input 
                  type="number" 
                  id="wash-bays-input" 
                  min="1" 
                  max="20" 
                  bind:value={washBaysCount} 
                  class="file-input" 
                />
              </div>

              <h4 class="payment-title" style="margin-top: 24px;">Ubicación en Mapa</h4>
              <p class="payment-subtitle">Escribe tu dirección para buscar en el mapa, o arrastra el marcador hasta la ubicación exacta de tu establecimiento.</p>

              <div class="search-address-row">
                <input 
                  type="text" 
                  placeholder="Ej: Av. Mate de Luna 2000" 
                  bind:value={searchAddress} 
                  class="file-input" 
                  onkeydown={(e) => e.key === 'Enter' && handleGeocodeSearch()}
                />
                <button onclick={handleGeocodeSearch} disabled={searchingGeocode} class="btn-search">
                  {searchingGeocode ? 'Buscando...' : 'Buscar'}
                </button>
              </div>

              {#if geocodingResults.length > 0}
                <div class="search-results-box">
                  {#each geocodingResults as result}
                    <button onclick={() => selectGeocodeResult(result)} class="search-result-item">
                      📍 {result.display_name}
                    </button>
                  {/each}
                </div>
              {/if}

              <div class="map-coordinates font-outfit">
                <span>Latitud: {washLat.toFixed(6)}</span> | <span>Longitud: {washLng.toFixed(6)}</span>
              </div>

              <div style="margin-top: 12px; margin-bottom: 12px;">
                <button type="button" onclick={handleGetCurrentLocation} disabled={gettingLocation} class="btn-secondary" style="margin-top: 0; padding: 8px 14px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px;">
                  {#if gettingLocation}
                    <div class="spinner-small" style="width: 12px; height: 12px; border-width: 2px;"></div>
                  {/if}
                  📍 {gettingLocation ? 'Obteniendo...' : 'Usar mi ubicación actual'}
                </button>
              </div>

              <div bind:this={mapElement} id="map" class="map-container"></div>

              {#if saveSettingsError}
                <p class="error-msg">{saveSettingsError}</p>
              {/if}
              {#if saveSettingsSuccess}
                <p class="success-msg">{saveSettingsSuccess}</p>
              {/if}

              <button 
                onclick={saveWashSettings} 
                disabled={savingWashSettings} 
                class="btn-primary"
                style="margin-top: 24px;"
              >
                {savingWashSettings ? 'Guardando...' : 'Guardar Información de Perfil'}
              </button>
            </div>

            <!-- Galería de Fotos del Local -->
            <div class="settings-form-card">
              <h4 class="payment-title">Galería de Fotos del Local</h4>
              <p class="payment-subtitle font-outfit">Sube varias fotos de tus instalaciones para captar la atención de tus clientes.</p>

              <div class="upload-photos-box">
                <label for="photos-upload-input" class="file-label">Subir fotos (selecciona una o más):</label>
                <input 
                  type="file" 
                  id="photos-upload-input" 
                  accept="image/*" 
                  multiple 
                  bind:this={photosFileInput} 
                  onchange={handleUploadWashPhotos}
                  class="file-input" 
                />
                {#if uploadingPhotos}
                  <div class="loading-box-inline" style="margin-top: 10px;">
                    <div class="spinner-small"></div>
                    <p>Subiendo fotos...</p>
                  </div>
                {/if}
                {#if uploadPhotosError}
                  <p class="error-msg">{uploadPhotosError}</p>
                {/if}
              </div>

              <h5 class="gallery-title font-outfit">Fotos cargadas</h5>
              {#if !carWash?.photos || carWash.photos.length === 0}
                <p class="empty-history" style="text-align: center; margin: 32px 0;">No tienes fotos subidas.</p>
              {:else}
                <div class="photos-list" style="display: flex; flex-direction: column; gap: 10px; margin-top: 12px;">
                  {#each carWash.photos as photo, idx}
                    <div class="photo-list-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: rgba(15, 23, 42, 0.25); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px;">
                      <span class="photo-name font-outfit" style="font-size: 13px; font-weight: 500; color: #cbd5e1;">📷 Foto {idx + 1}</span>
                      <div class="photo-item-actions" style="display: flex; gap: 8px; align-items: center;">
                        <button onclick={() => openPhotoModal(photo.url)} class="btn-secondary" style="padding: 4px 10px; font-size: 12px; margin-top:0;" aria-label="Ver Foto">
                          👁️ Ver
                        </button>
                        <button onclick={() => handleDeletePhoto(photo.id)} class="btn-action-danger" style="padding: 6px;" aria-label="Eliminar Foto">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </div>

        </div>
      {/if}

    </div>
  </div>
{/if}

<!-- MODAL CREAR / EDITAR SERVICIO -->
{#if showServiceModal}
  <div class="modal-overlay">
    <div class="modal-content animate-fade">
      <div class="modal-header">
        <h4 class="payment-title" style="margin: 0;">{editingServiceId ? 'Editar Servicio' : 'Crear Nuevo Servicio'}</h4>
        <button onclick={() => showServiceModal = false} class="close-modal-btn">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label for="srv-name" class="file-label">Nombre del Servicio:</label>
          <input type="text" id="srv-name" placeholder="Ej: Lavado Premium" bind:value={serviceForm.name} class="file-input" />
        </div>
        <div class="form-group">
          <label for="srv-desc" class="file-label">Descripción del Servicio:</label>
          <textarea id="srv-desc" rows="3" placeholder="Ej: Lavado de carrocería, aspirado completo y perfumado" bind:value={serviceForm.description} class="file-input" style="resize: vertical;"></textarea>
        </div>
        
        <div class="form-group">
          <label for="srv-veh" class="file-label">Tipo de Vehículo Asociado:</label>
          <select id="srv-veh" bind:value={serviceForm.vehicleType} class="file-input" style="background-color: #0f172a;">
            {#if activeVehicles.length === 0}
              <option value="">No hay vehículos activos. Habilita uno en la pestaña Vehículo.</option>
            {:else}
              {#each activeVehicles as v}
                <option value={v.name}>{v.name}</option>
              {/each}
            {/if}
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="srv-dur" class="file-label">Duración (minutos):</label>
            <input type="number" id="srv-dur" min="5" max="300" bind:value={serviceForm.durationMinutes} class="file-input" />
          </div>
          <div class="form-group">
            <label for="srv-price" class="file-label">Precio ($ ARS):</label>
            <input type="number" id="srv-price" min="0" bind:value={serviceForm.price} class="file-input" />
          </div>
        </div>

        {#if serviceError}
          <p class="error-msg">{serviceError}</p>
        {/if}
      </div>
      <div class="modal-footer">
        <button onclick={() => showServiceModal = false} class="btn-secondary">Cancelar</button>
        <button onclick={saveService} disabled={savingService || activeVehicles.length === 0} class="btn-primary" style="margin-top:0; width:auto;">
          {savingService ? 'Guardando...' : 'Guardar Servicio'}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- MODAL VISUALIZAR FOTO -->
{#if showPhotoModal}
  <div class="modal-overlay" onclick={() => showPhotoModal = false} style="z-index: 2000;">
    <div class="modal-content animate-fade" style="max-width: 650px; background: #0f172a; border: 1px solid rgba(255, 255, 255, 0.1);" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header" style="border-bottom: 1px solid rgba(255, 255, 255, 0.05); padding-bottom: 12px; display: flex; justify-content: space-between; align-items: center; width: 100%; box-sizing: border-box;">
        <h4 class="payment-title" style="margin: 0; color: #f1f5f9; font-family: 'Outfit', sans-serif;">Vista Previa de la Foto</h4>
        <button onclick={() => showPhotoModal = false} class="close-modal-btn" style="background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer; padding: 4px;">✕</button>
      </div>
      <div class="modal-body" style="text-align: center; display: flex; justify-content: center; align-items: center; padding: 24px 16px; background: #0b0f19;">
        <img 
          src={selectedPhotoUrl.startsWith('http') ? selectedPhotoUrl : `${apiConfig.baseUrl}${selectedPhotoUrl}`} 
          alt="Foto del Establecimiento" 
          style="max-width: 100%; max-height: 65vh; border-radius: 8px; object-fit: contain; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);" 
        />
      </div>
      <div class="modal-footer" style="border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 12px; display: flex; justify-content: flex-end; width: 100%; box-sizing: border-box;">
        <button onclick={() => showPhotoModal = false} class="btn-secondary" style="margin-top: 0;">Cerrar</button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* --- BASE Y GENERALES --- */
  .animate-fade {
    animation: fadeIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px 0;
    color: #94a3b8;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(59, 130, 246, 0.1);
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  .spinner-small {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(59, 130, 246, 0.1);
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .alert-box {
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.25);
    border-radius: 12px;
    padding: 16px 20px;
    display: flex;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 20px;
  }

  .alert-box-inline {
    background: rgba(245, 158, 11, 0.06);
    border: 1px solid rgba(245, 158, 11, 0.25);
    border-radius: 12px;
    padding: 16px 20px;
    display: flex;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 24px;
  }

  .warning-icon {
    font-size: 24px;
    line-height: 1;
  }

  .alert-title {
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 700;
    color: #f87171;
  }

  .alert-description {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    color: #cbd5e1;
  }

  .dashboard-card {
    box-sizing: border-box;
    font-family: 'Inter', sans-serif;
    padding: 0;
  }

  .content-panel {
    padding: 16px 0;
    line-height: 1.6;
    color: #cbd5e1;
  }

  .panel-subtitle {
    margin: 0 0 8px 0;
    font-size: 26px;
    color: #f1f5f9;
    font-family: 'Outfit', sans-serif;
    font-weight: 800;
    letter-spacing: -0.5px;
  }

  .welcome-text {
    font-size: 16px;
    color: #94a3b8;
    margin-bottom: 24px;
  }

  .section-desc {
    font-size: 14px;
    color: #94a3b8;
    margin-bottom: 24px;
    max-width: 800px;
  }

  .section-title {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 700;
    color: #f1f5f9;
    font-family: 'Outfit', sans-serif;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    padding-bottom: 8px;
  }

  /* --- HOME STATS GRID --- */
  .grid-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 32px;
  }

  .stat-card {
    background: rgba(30, 41, 59, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    backdrop-filter: blur(8px);
  }

  .stat-label {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #64748b;
    font-weight: 700;
  }

  .stat-value {
    font-size: 28px;
    font-weight: 800;
    color: #f1f5f9;
  }

  .stat-desc {
    font-size: 11px;
    color: #64748b;
  }

  .user-info-box {
    background: rgba(15, 23, 42, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 600px;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.02);
    padding-bottom: 8px;
  }

  .info-label {
    color: #94a3b8;
  }

  .info-value {
    color: #f1f5f9;
    font-weight: 500;
  }

  .text-active {
    color: #10b981;
    font-weight: 700;
  }

  .text-inactive {
    color: #ef4444;
    font-weight: 700;
  }

  .highlight-green {
    color: #34d399;
    font-weight: 700;
  }

  .highlight {
    color: #60a5fa;
    font-weight: 700;
  }

  /* --- OPERATIONS MANAGE CARD --- */
  .card-status-toggle {
    background: rgba(30, 41, 59, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 20px;
    padding: 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 24px;
    max-width: 800px;
    backdrop-filter: blur(10px);
  }

  .status-toggle-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .status-toggle-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #f1f5f9;
    font-family: 'Outfit', sans-serif;
  }

  .status-toggle-desc {
    margin: 0;
    font-size: 13px;
    color: #94a3b8;
    line-height: 1.6;
  }

  .state-badge-container {
    margin-top: 8px;
  }

  .badge-operation {
    font-size: 11px;
    font-weight: 800;
    padding: 4px 12px;
    border-radius: 20px;
    letter-spacing: 0.5px;
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.25);
  }

  .badge-operation.open {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.25);
  }

  /* SWITCH TOGGLE STYLES */
  .switch-container {
    position: relative;
    display: inline-block;
    width: 68px;
    height: 36px;
    flex-shrink: 0;
  }

  .switch-container input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .switch-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #334155;
    transition: .4s;
    border-radius: 36px;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .switch-slider:before {
    position: absolute;
    content: "";
    height: 28px;
    width: 28px;
    left: 3px;
    bottom: 3px;
    background-color: #94a3b8;
    transition: .4s;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }

  .switch-container input:checked + .switch-slider {
    background-color: #2563eb;
  }

  .switch-container input:checked + .switch-slider:before {
    transform: translateX(32px);
    background-color: #ffffff;
  }

  .admin-actions-placeholder {
    font-size: 13px;
    color: #94a3b8;
    line-height: 1.6;
    border-left: 3px solid #3b82f6;
    padding-left: 16px;
    max-width: 800px;
  }

  /* --- VEHICLES & CATALOGUE --- */
  .catalog-grid {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: 32px;
    align-items: start;
  }

  .catalog-card {
    background: rgba(30, 41, 59, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 20px;
    padding: 24px;
    backdrop-filter: blur(10px);
  }

  .table-container {
    overflow-x: auto;
    margin-top: 16px;
  }

  .vehicles-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 13px;
  }

  .vehicles-table th {
    color: #64748b;
    font-weight: 700;
    padding: 12px 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .vehicles-table td {
    padding: 14px 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    vertical-align: middle;
  }

  .badge-status-btn {
    font-size: 11px;
    font-weight: 700;
    border: none;
    border-radius: 6px;
    padding: 3px 8px;
    cursor: pointer;
    background: rgba(148, 163, 184, 0.15);
    color: #94a3b8;
    transition: all 0.2s ease;
  }

  .badge-status-btn.active {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
  }

  .btn-action-danger {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 6px;
    padding: 6px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .btn-action-danger:hover {
    background: #ef4444;
    color: #ffffff;
  }

  .text-muted {
    color: #64748b;
  }

  /* --- SERVICES TAB --- */
  .header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .btn-add {
    background: linear-gradient(90deg, #2563eb, #1d4ed8);
    border: none;
    border-radius: 8px;
    color: #ffffff;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    padding: 10px 20px;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
    transition: all 0.2s ease;
  }

  .btn-add:hover {
    background: linear-gradient(90deg, #3b82f6, #2563eb);
    transform: translateY(-1px);
  }

  .services-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
  }

  .service-card {
    background: rgba(30, 41, 59, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    position: relative;
    backdrop-filter: blur(8px);
    transition: transform 0.2s ease, border-color 0.2s ease;
  }

  .service-card:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .service-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .badge-veh {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    background: rgba(59, 130, 246, 0.1);
    color: #60a5fa;
    border: 1px solid rgba(59, 130, 246, 0.2);
    padding: 2px 8px;
    border-radius: 6px;
  }

  .service-price {
    font-size: 16px;
    font-weight: 800;
    color: #34d399;
  }

  .service-name {
    margin: 0;
    font-size: 17px;
    font-weight: 700;
    color: #f1f5f9;
  }

  .service-desc {
    margin: 0;
    font-size: 13px;
    color: #94a3b8;
    line-height: 1.5;
    flex-grow: 1;
  }

  .service-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid rgba(255, 255, 255, 0.03);
    padding-top: 12px;
    margin-top: 4px;
  }

  .service-duration {
    font-size: 12px;
    color: #64748b;
    font-weight: 600;
  }

  .service-actions {
    display: flex;
    gap: 8px;
  }

  .btn-action-edit {
    background: rgba(255, 255, 255, 0.05);
    color: #cbd5e1;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 6px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .btn-action-edit:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #f1f5f9;
  }

  .empty-state-box {
    text-align: center;
    padding: 48px;
    background: rgba(30, 41, 59, 0.1);
    border: 1px dashed rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    color: #64748b;
  }

  /* --- WASH SETTINGS TAB --- */
  .settings-container {
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: 32px;
    align-items: start;
  }

  .settings-form-card {
    background: rgba(30, 41, 59, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 20px;
    padding: 28px;
    backdrop-filter: blur(10px);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 18px;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .search-address-row {
    display: flex;
    gap: 10px;
    margin-bottom: 8px;
  }

  .btn-search {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #cbd5e1;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    padding: 0 16px;
    transition: all 0.2s ease;
  }

  .btn-search:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #f1f5f9;
  }

  .search-results-box {
    background: #0f172a;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    max-height: 180px;
    overflow-y: auto;
    margin-bottom: 14px;
  }

  .search-result-item {
    width: 100%;
    text-align: left;
    background: transparent;
    border: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    padding: 10px 14px;
    color: #94a3b8;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .search-result-item:hover {
    background: rgba(255, 255, 255, 0.03);
    color: #f1f5f9;
  }

  .map-coordinates {
    font-size: 12px;
    color: #64748b;
    margin-bottom: 12px;
  }

  .map-container {
    height: 320px;
    width: 100%;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    margin-top: 12px;
    overflow: hidden;
    z-index: 10;
  }

  .upload-photos-box {
    background: rgba(15, 23, 42, 0.25);
    border: 1px dashed rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
  }

  .gallery-title {
    margin: 0 0 16px 0;
    font-size: 15px;
    font-weight: 700;
    color: #f1f5f9;
  }

  .photos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 16px;
  }

  .photo-card {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    aspect-ratio: 4/3;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .photo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .btn-delete-photo {
    position: absolute;
    top: 6px;
    right: 6px;
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
    border-radius: 50%;
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    backdrop-filter: blur(4px);
    transition: all 0.2s ease;
  }

  .btn-delete-photo:hover {
    background: #ef4444;
    color: #ffffff;
    transform: scale(1.1);
  }

  /* --- MEMBERSHIP PANEL (Settings) --- */
  .membership-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    align-items: start;
    margin-top: 16px;
  }

  .payment-card-static {
    background: rgba(30, 41, 59, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 24px;
  }

  .payment-title {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 700;
    color: #f1f5f9;
    font-family: 'Outfit', sans-serif;
  }

  .payment-subtitle {
    margin: 0 0 20px 0;
    font-size: 13px;
    color: #94a3b8;
    line-height: 1.5;
  }

  .transfer-details {
    background: rgba(15, 23, 42, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
  }

  .detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
  }

  .detail-label {
    color: #94a3b8;
  }

  .detail-value {
    color: #f1f5f9;
    font-weight: 700;
  }

  .detail-value.highlight {
    color: #60a5fa;
  }

  .font-outfit {
    font-family: 'Outfit', sans-serif;
  }

  .status-box {
    border-radius: 12px;
    padding: 16px 20px;
    display: flex;
    gap: 16px;
    align-items: center;
  }

  .status-box.pending {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.2);
    color: #93c5fd;
  }

  .status-box.rejected {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #fca5a5;
  }

  .status-title {
    margin: 0 0 4px 0;
    font-size: 15px;
    font-weight: 700;
  }

  .status-desc {
    margin: 0;
    font-size: 13px;
    line-height: 1.4;
  }

  .status-icon {
    font-size: 20px;
    flex-shrink: 0;
  }

  .upload-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .file-label {
    font-size: 13px;
    font-weight: 600;
    color: #cbd5e1;
  }

  .file-input {
    background: rgba(15, 23, 42, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 10px;
    color: #cbd5e1;
    font-size: 13px;
    width: 100%;
    box-sizing: border-box;
    cursor: pointer;
  }

  .error-msg {
    color: #f87171;
    font-size: 13px;
    margin: 4px 0 0 0;
  }

  .success-msg {
    color: #4ade80;
    font-size: 13px;
    margin: 4px 0 0 0;
  }

  .btn-primary {
    background: linear-gradient(90deg, #2563eb, #1d4ed8);
    border: none;
    border-radius: 8px;
    color: #ffffff;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    padding: 12px 24px;
    transition: all 0.2s ease;
    width: 100%;
    margin-top: 8px;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
  }

  .btn-primary:hover:not(:disabled) {
    background: linear-gradient(90deg, #3b82f6, #2563eb);
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
    transform: translateY(-1px);
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: none;
  }

  .history-card {
    background: rgba(30, 41, 59, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 24px;
    display: flex;
    flex-direction: column;
  }

  .empty-history {
    color: #64748b;
    font-size: 13px;
    font-style: italic;
    margin: 16px 0;
  }

  .loading-box-inline {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #94a3b8;
    padding: 16px 0;
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 400px;
    overflow-y: auto;
    padding-right: 8px;
  }

  .history-item {
    background: rgba(15, 23, 42, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .history-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .history-date {
    font-size: 12px;
    color: #94a3b8;
  }

  .history-amount {
    font-size: 13px;
    font-weight: 600;
    color: #f1f5f9;
  }

  .status-badge {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 10px;
    text-transform: uppercase;
  }

  .badge-pending {
    background: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
    border: 1px solid rgba(245, 158, 11, 0.3);
  }

  .badge-approved {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .badge-rejected {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  /* --- MODAL DIALOGS --- */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3000;
    padding: 16px;
  }

  .modal-content {
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    width: 100%;
    max-width: 520px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    overflow: hidden;
  }

  .modal-header {
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .close-modal-btn {
    background: transparent;
    border: none;
    color: #64748b;
    font-size: 20px;
    cursor: pointer;
    transition: color 0.15s ease;
  }

  .close-modal-btn:hover {
    color: #f1f5f9;
  }

  .modal-body {
    padding: 24px;
    overflow-y: auto;
    max-height: 70vh;
  }

  .modal-footer {
    padding: 16px 24px;
    background: rgba(15, 23, 42, 0.2);
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  .btn-secondary {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #cbd5e1;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    padding: 10px 20px;
    transition: all 0.2s ease;
  }

  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #f1f5f9;
  }

  /* --- RESPONSIVE MEDIA --- */
  @media (max-width: 900px) {
    .membership-layout, .catalog-grid, .settings-container {
      grid-template-columns: 1fr;
      gap: 24px;
    }

    .card-status-toggle {
      flex-direction: column;
      align-items: flex-start;
      padding: 20px;
    }

    .switch-container {
      align-self: flex-end;
    }
  }

  .radio-label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }

  .radio-label input[type="radio"] {
    accent-color: #3b82f6;
    cursor: pointer;
    width: 16px;
    height: 16px;
  }
</style>
