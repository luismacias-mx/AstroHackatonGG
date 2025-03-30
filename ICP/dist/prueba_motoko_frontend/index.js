/******/ (() => { // webpackBootstrap
/*!*************************************************!*\
  !*** ./src/prueba_motoko_frontend/src/index.js ***!
  \*************************************************/
// Configuración inicial
let map;
let markers = [];
let authClient;
let actor;

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    await initAuth();
    initMap();
    setupEventListeners();
});

// Inicializar autenticación con Internet Identity
async function initAuth() {
    authClient = await window.iiAuth.IiAuth.create();
    
    if (await authClient.isAuthenticated()) {
        await loadActor();
        updateUI();
        loadBusinesses();
    } else {
        document.getElementById('authSection').innerHTML = `
            <button id="loginBtn" class="btn btn-success">Iniciar Sesión</button>
        `;
    }
}

// Cargar el actor para interactuar con el canister
async function loadActor() {
    const identity = authClient.getIdentity();
    const agent = new window.ic.HttpAgent({ identity });
    
    if (true) {
        await agent.fetchRootKey();
    }
    
    const canisterId = await getCanisterId();
    actor = window.ic.Actor.createActor(RewardSystemIDL, {
        agent,
        canisterId
    });
}

// Obtener el ID del canister
async function getCanisterId() {
    const canisterIds = await fetch('canister_ids.json').then(res => res.json());
    return canisterIds.RewardSystem.local;
}

// Inicializar el mapa Leaflet
function initMap() {
    map = L.map('map').setView([19.4326, -99.1332], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}

// Configurar event listeners
function setupEventListeners() {
    document.addEventListener('click', async (e) => {
        if (e.target.id === 'loginBtn') {
            await authClient.login();
            await loadActor();
            updateUI();
            loadBusinesses();
        }
        
        if (e.target.id === 'logoutBtn') {
            await authClient.logout();
            location.reload();
        }
    });

    document.getElementById('purchaseForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await recordPurchase();
    });
}

// Actualizar la UI según el estado de autenticación
async function updateUI() {
    if (await authClient.isAuthenticated()) {
        const principal = authClient.getIdentity().getPrincipal().toString();
        const profile = await actor.getUserProfile(principal);
        
        document.getElementById('authSection').innerHTML = `
            <span class="text-light me-3">${principal.slice(0, 10)}...</span>
            <button id="logoutBtn" class="btn btn-danger">Cerrar Sesión</button>
        `;
        
        document.getElementById('userInfo').innerHTML = `
            <p><strong>Puntos:</strong> ${profile.totalPoints}</p>
            <p><strong>Negocios visitados:</strong> ${profile.visitedBusinesses.length}</p>
        `;
    }
}

// Cargar negocios en el mapa y selector
async function loadBusinesses() {
    const businesses = await actor.getNearbyBusinesses(19.4326, -99.1332, 0.1);
    const select = document.getElementById('businessSelect');
    
    // Limpiar marcadores anteriores
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    // Limpiar y poblar el selector
    select.innerHTML = '';
    businesses.forEach(business => {
        // Añadir al selector
        const option = document.createElement('option');
        option.value = business.id;
        option.textContent = `${business.name} (${business.category})`;
        select.appendChild(option);
        
        // Añadir marcador al mapa
        const marker = L.marker([business.location.lat, business.location.lng])
            .addTo(map)
            .bindPopup(`
                <h6>${business.name}</h6>
                <p>${business.description}</p>
                <p><strong>Puntos:</strong> ${business.pointsRate * 100} por $100</p>
            `);
        
        markers.push(marker);
    });
}

// Registrar una compra
async function recordPurchase() {
    const businessId = document.getElementById('businessSelect').value;
    const amount = parseFloat(document.getElementById('purchaseAmount').value);
    
    if (!businessId || isNaN(amount)) {
        document.getElementById('purchaseResult').innerHTML = `
            <div class="alert alert-danger">Datos inválidos</div>
        `;
        return;
    }
    
    try {
        const pointsEarned = await actor.recordPurchase(businessId, amount);
        document.getElementById('purchaseResult').innerHTML = `
            <div class="alert alert-success">
                ¡Compra registrada! Ganaste ${pointsEarned} puntos.
            </div>
        `;
        
        // Actualizar UI
        updateUI();
        document.getElementById('purchaseAmount').value = '';
    } catch (error) {
        document.getElementById('purchaseResult').innerHTML = `
            <div class="alert alert-danger">Error: ${error}</div>
        `;
    }
}

// IDL generado por dfx (deberás reemplazarlo con el tuyo)
const RewardSystemIDL = [
    // Aquí va la interfaz IDL generada por dfx
];

/******/ })()
;
//# sourceMappingURL=index.js.map