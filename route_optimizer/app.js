// State Management
let selectedDate = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD local
let stops = [];

let map = null;
let markersGroup = null;
let routeLine = null;
const DEFAULT_COORDS = [40.7128, -74.0060]; // New York default center

// Fetch stops from database
async function fetchStops(date) {
    try {
        const response = await fetch(`/api/stops?date=${date}`);
        if (response.ok) {
            stops = await response.json();
        } else {
            console.error("Failed to fetch stops for date:", date);
            stops = [];
        }
    } catch (err) {
        console.error("Error fetching stops:", err);
        stops = [];
    }
}

// Save stops to database
async function saveStopsToBackend() {
    try {
        const response = await fetch(`/api/stops?date=${selectedDate}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(stops)
        });
        if (!response.ok) {
            console.error("Failed to save stops to database");
        }
    } catch (err) {
        console.error("Error saving stops to database:", err);
    }
}

// Initialize Application
document.addEventListener("DOMContentLoaded", async () => {
    initMap();
    setupEventListeners();
    setupCalendar();
    renderWeekRibbon(selectedDate);
    
    // Show loading state
    const listContainer = document.getElementById("stops-list");
    if (listContainer) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">⏳</span>
                <p>Loading stops from database...</p>
            </div>
        `;
    }
    
    await fetchStops(selectedDate);
    updateUI();
});

// 1. Initialize Leaflet Map
function initMap() {
    map = L.map("map", {
        zoomControl: false // Disable default zoom control to place custom top-right zoom later
    }).setView(DEFAULT_COORDS, 12);
    
    // Add custom zoom control in top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Load OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Group for holding all job pins
    markersGroup = L.layerGroup().addTo(map);
}

// 2. Setup DOM Event Listeners
function setupEventListeners() {
    const form = document.getElementById("job-form");
    const optimizeBtn = document.getElementById("optimize-btn");
    const clearBtn = document.getElementById("clear-btn");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const clientName = document.getElementById("client-name").value.trim();
        const address = document.getElementById("address").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const task = document.getElementById("task-details").value.trim();

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = "Geocoding Address...";

        try {
            const coords = await geocodeAddress(address);
            if (coords) {
                await addStop({
                    id: Date.now().toString(),
                    name: clientName,
                    address: address,
                    phone: phone,
                    task: task,
                    lat: coords.lat,
                    lng: coords.lng
                });
                form.reset();
                document.getElementById("client-name").focus();
            } else {
                alert("Address could not be found. Please check spelling or try a broader search.");
            }
        } catch (error) {
            console.error("Geocoding error:", error);
            alert("Error locating address. Please check your network connection.");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Add Stop to List";
        }
    });

    optimizeBtn.addEventListener("click", async () => {
        if (stops.length < 2) {
            alert("You need at least 2 stops to optimize a route.");
            return;
        }
        await optimizeRoute();
    });

    clearBtn.addEventListener("click", async () => {
        if (confirm("Are you sure you want to clear all stops?")) {
            await clearAllStops();
        }
    });

    const startTimeInput = document.getElementById("start-time");
    if (startTimeInput) {
        startTimeInput.addEventListener("change", () => {
            calculateETAs();
        });
    }
}

// saveStopsToStorage has been replaced by saveStopsToBackend

// Setup standard date picker
function setupCalendar() {
    const picker = document.getElementById("calendar-picker");
    const trigger = document.getElementById("calendar-trigger-btn");
    
    if (picker) {
        picker.value = selectedDate;
        picker.addEventListener("change", (e) => {
            const chosenDate = e.target.value;
            if (chosenDate) {
                selectDate(chosenDate);
            }
        });
    }
    
    if (trigger && picker) {
        trigger.addEventListener("click", () => {
            try {
                // Use standard showPicker() API if supported by the browser
                if (typeof picker.showPicker === "function") {
                    picker.showPicker();
                } else {
                    picker.click(); // Fallback for older browsers
                }
            } catch (err) {
                console.error("showPicker failed, trying click fallback:", err);
                picker.click();
            }
        });
    }
}

// Render weekly date picker ribbon
function renderWeekRibbon(centerDate) {
    const ribbon = document.getElementById("week-ribbon");
    if (!ribbon) return;
    ribbon.innerHTML = "";
    
    // Find the Monday of the week for centerDate
    const current = new Date(centerDate + "T00:00:00");
    const dayOfWeek = current.getDay(); // 0 is Sunday, 1 is Monday...
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const monday = new Date(current);
    monday.setDate(current.getDate() + distanceToMonday);
    
    const daysOfWeekNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dStr = d.toLocaleDateString("en-CA");
        
        const dayNum = d.getDate();
        const dayName = daysOfWeekNames[i];
        const isActive = dStr === selectedDate;
        
        const dayItem = document.createElement("div");
        dayItem.className = `day-item ${isActive ? 'active' : ''}`;
        dayItem.innerHTML = `
            <span class="day-lbl">${dayName}</span>
            <span class="day-num">${dayNum}</span>
        `;
        
        dayItem.addEventListener("click", () => {
            selectDate(dStr);
        });
        
        ribbon.appendChild(dayItem);
    }
    
    // Update date display header
    const dateDisplay = document.getElementById("current-date-display");
    if (dateDisplay) {
        const options = { weekday: 'long', month: 'short', day: 'numeric' };
        dateDisplay.textContent = new Date(centerDate + "T00:00:00").toLocaleDateString("en-US", options);
    }
}

// Select a new date and load its stops
async function selectDate(dateString) {
    // Switch to new date
    selectedDate = dateString;
    
    // Sync picker input
    const picker = document.getElementById("calendar-picker");
    if (picker) {
        picker.value = selectedDate;
    }
    
    // Render ribbon & refresh view
    renderWeekRibbon(selectedDate);
    
    // Show loading state in list container
    const listContainer = document.getElementById("stops-list");
    if (listContainer) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">⏳</span>
                <p>Loading stops from database...</p>
            </div>
        `;
    }
    
    await fetchStops(selectedDate);
    
    if (routeLine) {
        map.removeLayer(routeLine);
        routeLine = null;
    }
    updateUI();
    fitMapBounds();
}

// 3. Geocode Address using Nominatim OpenStreetMap API
async function geocodeAddress(address) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    
    const response = await fetch(url, {
        headers: {
            "User-Agent": "RouteOptimizerBot/1.0 (contact: support@alphasignal.digital)"
        }
    });
    
    if (!response.ok) return null;
    const data = await response.json();
    
    if (data && data.length > 0) {
        return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
        };
    }
    return null;
}

// 4. Add Stop to State
async function addStop(stop) {
    stops.push(stop);
    await saveStopsToBackend();
    updateUI();
    
    // Fit map bounds to show new stop
    fitMapBounds();
}

// 5. Delete Stop from State
async function deleteStop(id) {
    stops = stops.filter(s => s.id !== id);
    // Remove route line if any
    if (routeLine) {
        map.removeLayer(routeLine);
        routeLine = null;
    }
    await saveStopsToBackend();
    updateUI();
    fitMapBounds();
}

// 6. Clear All Stops
async function clearAllStops() {
    stops = [];
    markersGroup.clearLayers();
    if (routeLine) {
        map.removeLayer(routeLine);
        routeLine = null;
    }
    await saveStopsToBackend();
    updateUI();
    map.setView(DEFAULT_COORDS, 12);
}

// 7. Update UI Panels & Markers
function updateUI() {
    // Calculate initial ETAs based on straight line fallback before rendering
    calculateETAs();

    const listContainer = document.getElementById("stops-list");
    const statsPanel = document.getElementById("stats-panel");
    
    // Clear list view
    listContainer.innerHTML = "";
    
    // Update Markers on Map
    markersGroup.clearLayers();
    
    if (stops.length === 0) {
        statsPanel.style.display = "none";
        listContainer.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📍</span>
                <p>No stops added yet. Add your jobs to generate an optimized route.</p>
            </div>
        `;
        return;
    }

    // Show stats card once we have stops
    statsPanel.style.display = "block";
    updateStatsDisplay();

    // Render Stops in list & map
    stops.forEach((stop, index) => {
        const isFirst = index === 0;
        
        // Custom marker icon color
        // Active/Starting stop is neon green, others are cyan
        const markerColor = isFirst ? "#10b981" : "#06b6d4";
        
        // Add Marker
        const markerHtml = `
            <div style="
                background: ${markerColor};
                width: 24px;
                height: 24px;
                border-radius: 12px;
                border: 2px solid white;
                color: white;
                font-size: 11px;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            ">
                ${index + 1}
            </div>
        `;
        
        const customIcon = L.divIcon({
            html: markerHtml,
            className: "custom-marker-icon",
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

        const marker = L.marker([stop.lat, stop.lng], { icon: customIcon })
            .bindPopup(`
                <strong>Stop ${index + 1}: ${stop.name}</strong><br>
                <span style="font-size:11px; color:#10b981; font-weight:bold;">ETA: ${stop.eta || 'N/A'}</span><br>
                ${stop.address}<br>
                <span style="color: #06b6d4; font-size:12px;">${stop.task}</span>
            `);
            
        markersGroup.addLayer(marker);

        // Render Stop Card in list
        const card = document.createElement("div");
        card.className = `stop-card ${isFirst ? 'active' : ''}`;
        card.setAttribute("draggable", "true");
        card.setAttribute("data-id", stop.id);
        card.innerHTML = `
            <div class="stop-header">
                <div class="stop-number">${index + 1}</div>
                <div class="stop-info">
                    <div class="client-name">${stop.name} <span class="card-eta" id="eta-${stop.id}">${stop.eta || 'N/A'}</span></div>
                    <div class="task-tag">${stop.task}</div>
                </div>
            </div>
            <div class="stop-address">${stop.address}</div>
            <div class="stop-actions">
                <button class="stop-btn stop-btn-whatsapp" onclick="sendWhatsAppNotification('${stop.id}')">
                    <span>💬</span> Notify
                </button>
                <button class="stop-btn stop-btn-delete" onclick="deleteStop('${stop.id}')">
                    <span>🗑️</span>
                </button>
            </div>
        `;

        // Drag and Drop Event Listeners
        card.addEventListener("dragstart", (e) => {
            card.classList.add("dragging");
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", stop.id);
        });

        card.addEventListener("dragend", async () => {
            card.classList.remove("dragging");
            
            // Re-order the stops state array based on final DOM list order
            const reorderedStops = [];
            const renderedCards = Array.from(listContainer.querySelectorAll(".stop-card"));
            renderedCards.forEach(c => {
                const id = c.getAttribute("data-id");
                const matchingStop = stops.find(s => s.id === id);
                if (matchingStop) {
                    reorderedStops.push(matchingStop);
                }
            });
            stops = reorderedStops;
            await saveStopsToBackend();
            
            // Re-render UI to update markers, numbering, lines, and stats
            updateUI();
        });

        card.addEventListener("dragover", (e) => {
            e.preventDefault(); // Necessary to allow dropping
            const draggingCard = listContainer.querySelector(".stop-card.dragging");
            if (draggingCard && draggingCard !== card) {
                const bounding = card.getBoundingClientRect();
                const offset = e.clientY - bounding.top - bounding.height / 2;
                if (offset > 0) {
                    listContainer.insertBefore(draggingCard, card.nextSibling);
                } else {
                    listContainer.insertBefore(draggingCard, card);
                }
            }
        });

        listContainer.appendChild(card);
    });

    // Redraw polyline if we have an optimized sequence
    drawRouteLine();
}

// 8. Auto-fit Map to display all active pins
function fitMapBounds() {
    if (stops.length === 0) return;
    const bounds = L.latLngBounds(stops.map(s => [s.lat, s.lng]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
}

// 9. Haversine Formula: Great Circle Distance between Coordinates (in Miles)
function haversineDistance(c1, c2) {
    const R = 3958.8; // Radius of Earth in Miles
    const lat1 = c1.lat * Math.PI / 180;
    const lat2 = c2.lat * Math.PI / 180;
    const lon1 = c1.lng * Math.PI / 180;
    const lon2 = c2.lng * Math.PI / 180;
    
    const dlat = lat2 - lat1;
    const dlon = lon2 - lon1;
    
    const a = Math.sin(dlat / 2) * Math.sin(dlat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dlon / 2) * Math.sin(dlon / 2);
              
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// 10. Solve TSP: Nearest Neighbor with 2-Opt Local Search
async function optimizeRoute() {
    // Keep stop[0] as starting stop (Home/Depot)
    let optimized = [stops[0]];
    let unvisited = stops.slice(1);
    let current = stops[0];

    // Phase 1: Nearest Neighbor Construction
    while (unvisited.length > 0) {
        let nearestIdx = 0;
        let minDist = haversineDistance(current, unvisited[0]);
        
        for (let i = 1; i < unvisited.length; i++) {
            let dist = haversineDistance(current, unvisited[i]);
            if (dist < minDist) {
                minDist = dist;
                nearestIdx = i;
            }
        }
        
        current = unvisited[nearestIdx];
        optimized.push(current);
        unvisited.splice(nearestIdx, 1);
    }

    // Phase 2: 2-Opt Local Refinement
    let improved = true;
    const maxIterations = 200;
    let iteration = 0;
    
    while (improved && iteration < maxIterations) {
        improved = false;
        iteration++;
        
        for (let i = 1; i < optimized.length - 1; i++) {
            for (let j = i + 1; j < optimized.length; j++) {
                // Calculate current path distances
                const d_current = haversineDistance(optimized[i-1], optimized[i]) + 
                                  (j + 1 < optimized.length ? haversineDistance(optimized[j], optimized[j+1]) : 0);
                                  
                // Calculate swapped segment distances
                const d_swap = haversineDistance(optimized[i-1], optimized[j]) + 
                               (j + 1 < optimized.length ? haversineDistance(optimized[i], optimized[j+1]) : 0);
                               
                if (d_swap < d_current - 0.0001) { // 0.1m tolerance to prevent floating point loops
                    reverseSubsegment(optimized, i, j);
                    improved = true;
                }
            }
        }
    }

    // Apply optimized sequence
    stops = optimized;
    await saveStopsToBackend();
    
    // Animate badge
    const badgeText = document.getElementById("savings-text");
    badgeText.textContent = "Route Optimized Successfully!";
    badgeText.parentNode.style.background = "rgba(16, 185, 129, 0.25)";
    
    setTimeout(() => {
        badgeText.textContent = "Route Optimized! Saved fuel & time.";
        badgeText.parentNode.style.background = "rgba(16, 185, 129, 0.15)";
    }, 4000);

    updateUI();
}

// 2-Opt Swap helper
function reverseSubsegment(arr, i, j) {
    while (i < j) {
        let temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
        i++;
        j--;
    }
}

// 11. Calculate Total Distance of Active Path
function calculateTotalDistance() {
    if (stops.length < 2) return 0;
    let total = 0;
    for (let i = 0; i < stops.length - 1; i++) {
        total += haversineDistance(stops[i], stops[i+1]);
    }
    return total;
}

// 12. Update Stats Text (Distance, Estimated driving time)
function updateStatsDisplay(customDistance = null, customMinutes = null) {
    let totalDistance, totalMinutes;
    
    if (customDistance !== null && customMinutes !== null) {
        totalDistance = customDistance;
        totalMinutes = customMinutes;
    } else {
        totalDistance = calculateTotalDistance();
        const speedMph = 35; // Average urban/suburban driving speed including traffic delay
        const totalHours = totalDistance / speedMph;
        totalMinutes = Math.round(totalHours * 60);
    }

    document.getElementById("stat-distance").textContent = `${totalDistance.toFixed(1)} mi`;
    
    if (totalMinutes < 60) {
        document.getElementById("stat-time").textContent = `${totalMinutes} mins`;
    } else {
        const hrs = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        document.getElementById("stat-time").textContent = `${hrs}h ${mins}m`;
    }
}

// 13. Draw Polyline Route on map (follows actual road network via OSRM API)
async function drawRouteLine() {
    if (routeLine) {
        map.removeLayer(routeLine);
        routeLine = null;
    }
    
    if (stops.length < 2) return;
    
    const coordinatesQuery = stops.map(s => `${s.lng},${s.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordinatesQuery}?overview=full&geometries=geojson`;
    
    try {
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            if (data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                const latlngs = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
                
                // Glowing cyan road-following polyline
                routeLine = L.polyline(latlngs, {
                    color: "#06b6d4",
                    weight: 4,
                    opacity: 0.85,
                    lineJoin: 'round'
                }).addTo(map);
                
                // Update stats displays with actual road distances & durations
                const roadDistanceMiles = route.distance / 1609.344;
                const roadDurationMinutes = Math.round(route.duration / 60);
                updateStatsDisplay(roadDistanceMiles, roadDurationMinutes);
                
                // Recalculate ETAs using actual road leg durations
                const legDurations = route.legs.map(leg => Math.round(leg.duration / 60));
                calculateETAs(legDurations);
                return;
            }
        }
    } catch (err) {
        console.error("OSRM road routing failed, falling back to straight lines:", err);
    }
    
    // Fallback: draw straight dashed lines between markers if OSRM is offline
    drawStraightFallbackLines();
}

function drawStraightFallbackLines() {
    const latlngs = stops.map(s => [s.lat, s.lng]);
    routeLine = L.polyline(latlngs, {
        color: "#06b6d4",
        weight: 4,
        opacity: 0.85,
        lineJoin: 'round',
        dashArray: "5, 10"
    }).addTo(map);
    
    // Fallback stats
    updateStatsDisplay();
}

// 14. WhatsApp Link Notification Generator
function sendWhatsAppNotification(id) {
    const stop = stops.find(s => s.id === id);
    if (!stop) return;
    
    // Clean up phone number: remove non-digits, keep leading '+' if present
    let cleanPhone = stop.phone.replace(/[^\d+]/g, "");
    if (!cleanPhone.startsWith("+")) {
        // Assume default code or let user input handle it
        cleanPhone = cleanPhone.replace(/^0+/, ""); // remove leading zeros
    }

    // Find stop index for itinerary detail
    const index = stops.indexOf(stop) + 1;
    
    // Construct friendly text including computed ETA
    const message = `Hi ${stop.name}, this is your dispatch technician. I am on the way to your location at ${stop.address} for the requested task: "${stop.task}". My estimated time of arrival (ETA) is ${stop.eta}. You can track my arrival here: https://alphasignal.digital`;
    
    // Generate WhatsApp Web link
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    
    // Open in new window
    window.open(waUrl, "_blank");
}

// 15. Calculate Estimated Time of Arrival for each stop (1h job duration per stop)
function calculateETAs(legDurationsFromOSRM = null) {
    if (stops.length === 0) return;
    
    // Get start time from input or default to 08:00
    const startTimeInput = document.getElementById("start-time");
    const startTimeVal = startTimeInput ? startTimeInput.value : "08:00";
    
    const [startHrs, startMins] = startTimeVal.split(":").map(Number);
    let currentMinutes = startHrs * 60 + startMins;
    
    stops.forEach((stop, index) => {
        stop.eta = formatMinutesToTime(currentMinutes);
        
        // Update DOM badge directly if rendered
        const domBadge = document.getElementById(`eta-${stop.id}`);
        if (domBadge) {
            domBadge.textContent = stop.eta;
        }
        
        // Add 60 minutes for task duration
        currentMinutes += 60;
        
        // Add driving time to next stop
        if (index < stops.length - 1) {
            let travelMins = 0;
            if (legDurationsFromOSRM && legDurationsFromOSRM[index] !== undefined) {
                travelMins = legDurationsFromOSRM[index];
            } else {
                const dist = haversineDistance(stops[index], stops[index+1]);
                travelMins = Math.round((dist / 35) * 60); // Assuming 35mph average fallback speed
            }
            currentMinutes += travelMins;
        }
    });
}

// Format minutes since midnight into 12-hour AM/PM format
function formatMinutesToTime(totalMins) {
    const hours24 = Math.floor(totalMins / 60) % 24;
    const minutes = totalMins % 60;
    const ampm = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    const minsStr = minutes < 10 ? "0" + minutes : minutes;
    return `${hours12}:${minsStr} ${ampm}`;
}
