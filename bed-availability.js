// bed-availability.js
// Bed Availability Feature for Skilled Nursing Facilities
// Works with browse-providers.html

// Initialize Firebase (make sure Firebase is loaded in your HTML)
let providersListener = null;

// Check if user is a provider (for edit permissions)
let isProviderUser = false;
let currentUserProviderId = null;

// Function to initialize bed availability feature
function initBedAvailability() {
    console.log('Initializing bed availability feature...');
    checkProviderStatus();
    loadProviders();
}

// Check if current user is a provider
async function checkProviderStatus() {
    if (auth.currentUser) {
        try {
            const providersRef = collection(db, 'providers');
            const q = query(providersRef, where('adminEmail', '==', auth.currentUser.email));
            const snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
                isProviderUser = true;
                currentUserProviderId = snapshot.docs[0].id;
                console.log('User is a provider:', currentUserProviderId);
            }
        } catch (error) {
            console.error('Error checking provider status:', error);
        }
    }
}

// Load and display providers with real-time updates
async function loadProviders(filterType = 'All') {
    const providersContainer = document.getElementById('providers-container');
    if (!providersContainer) {
        console.error('Providers container not found');
        return;
    }

    // Show loading state
    providersContainer.innerHTML = '<div class="loading">Loading providers...</div>';

    try {
        const providersRef = collection(db, 'providers');
        
        // Set up real-time listener
        if (providersListener) {
            providersListener(); // Unsubscribe from previous listener
        }

        providersListener = onSnapshot(providersRef, (snapshot) => {
            const providers = [];
            snapshot.forEach((doc) => {
                providers.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // Filter providers by type
            let filteredProviders = providers;
            if (filterType !== 'All') {
                filteredProviders = providers.filter(p => p.serviceType === filterType);
            }

            // Sort Skilled Nursing by available beds
            if (filterType === 'Skilled Nursing') {
                filteredProviders.sort((a, b) => {
                    const aAvailable = a.bedsAvailable || 0;
                    const bAvailable = b.bedsAvailable || 0;
                    return bAvailable - aAvailable;
                });
            }

            displayProviders(filteredProviders);
            updateStatsBanner(providers);
        });
    } catch (error) {
        console.error('Error loading providers:', error);
        providersContainer.innerHTML = '<div class="error">Error loading providers. Please refresh the page.</div>';
    }
}

// Display provider cards
function displayProviders(providers) {
    const container = document.getElementById('providers-container');
    
    if (providers.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <span class="no-results-icon">🔍</span>
                <h3>No providers found</h3>
                <p>Try adjusting your search or filters</p>
            </div>
        `;
        return;
    }

    container.innerHTML = providers.map(provider => createProviderCard(provider)).join('');
}

// Create a provider card HTML
function createProviderCard(provider) {
    const isSkilledNursing = provider.serviceType === 'Skilled Nursing';
    const lowAvailability = provider.bedsAvailable < (provider.totalBeds * 0.1);
    const canEdit = isProviderUser && currentUserProviderId === provider.id;

    return `
        <div class="provider-card" data-provider-id="${provider.id}">
            <!-- Turquoise header with lotus -->
            <div class="provider-header">
                <div class="lotus-circle">
                    <span class="lotus-emoji">🍀</span>
                </div>
            </div>
            
            <!-- Provider name -->
            <h2 class="provider-name">${provider.name || 'Provider Name'}</h2>
            
            <!-- Location -->
            <div class="provider-location">
                <span class="location-icon">📍</span>
                <span class="location-text">${provider.location || 'Location not specified'}</span>
            </div>
            
            <!-- Service type badge -->
            <div class="service-badge-container">
                <span class="service-badge">
                    <span class="badge-icon">${getServiceIcon(provider.serviceType)}</span>
                    ${provider.serviceType || 'Service Type'}
                </span>
            </div>
            
            <!-- Description -->
            <p class="provider-description">${provider.description || 'No description available'}</p>
            
            <!-- Contact information -->
            <div class="contact-section">
                ${provider.contact ? `
                    <div class="contact-item">
                        <span class="contact-icon">👤</span>
                        <span>Contact: ${provider.contact}</span>
                    </div>
                ` : ''}
                ${provider.email ? `
                    <div class="contact-item">
                        <span class="contact-icon">✉️</span>
                        <a href="mailto:${provider.email}">${provider.email}</a>
                    </div>
                ` : ''}
                ${provider.website ? `
                    <div class="contact-item">
                        <span class="contact-icon">🌐</span>
                        <span>${provider.website}</span>
                    </div>
                ` : ''}
            </div>
            
            <!-- Bed Availability - ONLY FOR SKILLED NURSING -->
            ${isSkilledNursing && provider.bedsAvailable !== undefined && provider.totalBeds ? `
                <div class="bed-availability ${lowAvailability ? 'low' : ''}">
                    <span class="bed-icon">🛏️</span>
                    <span class="bed-text">
                        ${provider.bedsAvailable} / ${provider.totalBeds} Beds Available
                    </span>
                    ${canEdit ? `
                        <button class="edit-beds-btn" onclick="openBedUpdater('${provider.id}')" title="Update bed availability">
                            ✏️
                        </button>
                    ` : ''}
                </div>
            ` : ''}
            
            <!-- Lotus Rating System™ -->
            ${provider.lotusRating ? `
                <div class="lotus-rating">
                    <span class="rating-label">Lotus Rating™</span>
                    <div class="lotus-flowers">
                        ${provider.lotusRating.compassionate ? '🍀' : ''}
                        ${provider.lotusRating.responsive ? '🍀' : ''}
                        ${provider.lotusRating.supportive ? '🍀' : ''}
                        ${provider.lotusRating.professional ? '🍀' : ''}
                    </div>
                </div>
            ` : ''}
            
            <!-- Action buttons -->
            <div class="action-buttons">
                <button class="btn-read-reviews" onclick="viewReviews('${provider.id}')">
                    <span class="btn-icon">📖</span>
                    Read Reviews
                </button>
                <button class="btn-leave-review" onclick="leaveReview('${provider.id}')">
                    <span class="btn-icon">✏️</span>
                    Leave a Review
                </button>
            </div>
        </div>
    `;
}

// Get service type icon
function getServiceIcon(type) {
    switch(type) {
        case 'Palliative Care': return '❤️';
        case 'Skilled Nursing': return '🏥';
        case 'Board and Care Facilities': return '🏠';
        case 'Memory Care': return '🧠';
        default: return '🏥';
    }
}

// Update statistics banner for Skilled Nursing
function updateStatsBanner(providers) {
    const statsBanner = document.getElementById('bed-stats-banner');
    if (!statsBanner) return;

    const snfProviders = providers.filter(p => p.serviceType === 'Skilled Nursing');
    const totalBeds = snfProviders.reduce((sum, p) => sum + (p.totalBeds || 0), 0);
    const availableBeds = snfProviders.reduce((sum, p) => sum + (p.bedsAvailable || 0), 0);
    const facilityCount = snfProviders.length;

    statsBanner.innerHTML = `
        <div class="stat-item">
            <span class="stat-number">${availableBeds}</span>
            <span class="stat-label">Beds Available</span>
        </div>
        <div class="stat-item">
            <span class="stat-number">${facilityCount}</span>
            <span class="stat-label">Facilities</span>
        </div>
        <div class="stat-item">
            <span class="stat-number">${totalBeds}</span>
            <span class="stat-label">Total Beds</span>
        </div>
    `;
}

// Open bed availability updater modal
function openBedUpdater(providerId) {
    if (!isProviderUser || currentUserProviderId !== providerId) {
        alert('Only providers can update their own facility bed count. Please log in with your provider account.');
        return;
    }

    // Create and show modal
    showBedUpdaterModal(providerId);
}

// Show bed updater modal
async function showBedUpdaterModal(providerId) {
    // Get provider data
    const providerDoc = await getDoc(doc(db, 'providers', providerId));
    if (!providerDoc.exists()) {
        alert('Provider not found');
        return;
    }

    const provider = providerDoc.data();
    
    // Only allow for Skilled Nursing Facilities
    if (provider.serviceType !== 'Skilled Nursing') {
        alert('Only Skilled Nursing Facilities can update bed availability');
        return;
    }

    // Create modal HTML
    const modalHTML = `
        <div id="bed-updater-overlay" class="bed-updater-overlay">
            <div class="bed-updater-modal">
                <div class="modal-header">
                    <h2>Update Bed Availability</h2>
                    <button class="close-btn" onclick="closeBedUpdater()">✕</button>
                </div>
                
                <div class="provider-info">
                    <h3>${provider.name}</h3>
                    <span class="facility-type">🏥 Skilled Nursing Facility</span>
                    ${provider.lastBedUpdate ? `
                        <p class="last-updated">
                            Last updated: ${new Date(provider.lastBedUpdate.toDate()).toLocaleDateString()}
                        </p>
                    ` : ''}
                </div>
                
                <form id="bed-update-form" onsubmit="updateBedAvailability(event, '${providerId}')">
                    <div class="form-group">
                        <label for="bedsAvailable">
                            Available Beds
                            <span class="required">*</span>
                        </label>
                        <div class="input-with-buttons">
                            <button type="button" class="quick-btn" onclick="adjustBeds(-1)">-</button>
                            <input
                                type="number"
                                id="bedsAvailable"
                                value="${provider.bedsAvailable || 0}"
                                min="0"
                                max="${provider.totalBeds || 100}"
                                required
                            />
                            <button type="button" class="quick-btn" onclick="adjustBeds(1)">+</button>
                        </div>
                        <small>Number of beds currently available for new admissions</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="totalBeds">
                            Total Bed Capacity
                            <span class="required">*</span>
                        </label>
                        <input
                            type="number"
                            id="totalBeds"
                            value="${provider.totalBeds || 0}"
                            min="1"
                            required
                        />
                        <small>Total number of beds in your facility</small>
                    </div>
                    
                    <div class="bed-visual">
                        <div class="bed-bar">
                            <div id="bed-bar-filled" class="bed-bar-filled" style="width: ${provider.totalBeds > 0 ? ((provider.totalBeds - provider.bedsAvailable) / provider.totalBeds) * 100 : 0}%"></div>
                        </div>
                        <div class="bed-stats">
                            <span>Occupied: <span id="occupied-count">${(provider.totalBeds || 0) - (provider.bedsAvailable || 0)}</span></span>
                            <span>Available: <span id="available-count">${provider.bedsAvailable || 0}</span></span>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-cancel" onclick="closeBedUpdater()">Cancel</button>
                        <button type="submit" class="btn-update">Update Availability</button>
                    </div>
                </form>
                
                <div class="update-note">
                    <p>
                        <strong>Note:</strong> Bed availability updates are synchronized in real-time 
                        across the website and mobile apps. Families will immediately see your updated availability.
                    </p>
                </div>
            </div>
        </div>
    `;

    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add event listeners for real-time preview
    document.getElementById('bedsAvailable').addEventListener('input', updateBedPreview);
    document.getElementById('totalBeds').addEventListener('input', updateBedPreview);
}

// Close bed updater modal
function closeBedUpdater() {
    const overlay = document.getElementById('bed-updater-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// Adjust bed count with quick buttons
function adjustBeds(change) {
    const input = document.getElementById('bedsAvailable');
    const current = parseInt(input.value) || 0;
    const max = parseInt(document.getElementById('totalBeds').value) || 0;
    const newValue = Math.max(0, Math.min(current + change, max));
    input.value = newValue;
    updateBedPreview();
}

// Update bed preview in modal
function updateBedPreview() {
    const available = parseInt(document.getElementById('bedsAvailable').value) || 0;
    const total = parseInt(document.getElementById('totalBeds').value) || 0;
    const occupied = total - available;
    
    document.getElementById('occupied-count').textContent = occupied;
    document.getElementById('available-count').textContent = available;
    
    const percentage = total > 0 ? (occupied / total) * 100 : 0;
    document.getElementById('bed-bar-filled').style.width = percentage + '%';
}

// Update bed availability in Firebase
async function updateBedAvailability(event, providerId) {
    event.preventDefault();
    
    const available = parseInt(document.getElementById('bedsAvailable').value);
    const total = parseInt(document.getElementById('totalBeds').value);
    
    // Validation
    if (available < 0 || total < 0) {
        alert('Bed counts cannot be negative');
        return;
    }
    
    if (available > total) {
        alert('Available beds cannot exceed total beds');
        return;
    }
    
    try {
        // Update Firebase
        await updateDoc(doc(db, 'providers', providerId), {
            bedsAvailable: available,
            totalBeds: total,
            lastBedUpdate: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        
        alert('Bed availability updated successfully!');
        closeBedUpdater();
    } catch (error) {
        console.error('Error updating bed availability:', error);
        alert('Failed to update bed availability. Please try again.');
    }
}

// Filter providers by category
function filterByCategory(category) {
    // Update active button styling
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Show/hide stats banner
    const statsBanner = document.getElementById('bed-stats-banner');
    if (statsBanner) {
        statsBanner.style.display = category === 'Skilled Nursing' ? 'grid' : 'none';
    }
    
    // Reload providers with filter
    loadProviders(category);
}

// Search providers
function searchProviders() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const cards = document.querySelectorAll('.provider-card');
    
    cards.forEach(card => {
        const name = card.querySelector('.provider-name').textContent.toLowerCase();
        const location = card.querySelector('.provider-location').textContent.toLowerCase();
        const description = card.querySelector('.provider-description').textContent.toLowerCase();
        
        if (name.includes(searchTerm) || location.includes(searchTerm) || description.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Placeholder functions for reviews (to be implemented)
function viewReviews(providerId) {
    console.log('View reviews for provider:', providerId);
    alert('Reviews feature coming soon!');
}

function leaveReview(providerId) {
    console.log('Leave review for provider:', providerId);
    alert('Leave review feature coming soon!');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait a moment for Firebase to initialize
    setTimeout(initBedAvailability, 1000);
});
