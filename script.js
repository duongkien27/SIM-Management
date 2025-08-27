// SIM Card Management System
class SIMManager {
    constructor() {
        this.sims = JSON.parse(localStorage.getItem('simCards')) || [];
        this.currentEditId = null;
        this.currentActionSim = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderSims();
        this.updateStats();
    }

    bindEvents() {
        // Add SIM button
        document.getElementById('addSimBtn').addEventListener('click', () => {
            this.openSimModal();
        });

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchSims(e.target.value);
        });

        // Form submissions
        document.getElementById('simForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSim();
        });

        // Modal close events
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                this.closeModal();
                this.closeActionModal();
            });
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const simModal = document.getElementById('simModal');
            const actionModal = document.getElementById('actionModal');
            if (e.target === simModal) {
                this.closeModal();
            }
            if (e.target === actionModal) {
                this.closeActionModal();
            }
        });
    }

    openSimModal(simId = null) {
        const modal = document.getElementById('simModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('simForm');
        
        if (simId) {
            const sim = this.sims.find(s => s.id === simId);
            title.textContent = 'Edit SIM Card';
            this.currentEditId = simId;
            this.populateForm(sim);
        } else {
            title.textContent = 'Add New SIM Card';
            this.currentEditId = null;
            form.reset();
        }
        
        modal.style.display = 'block';
    }

    populateForm(sim) {
        document.getElementById('simNumber').value = sim.number || '';
        document.getElementById('carrier').value = sim.carrier || '';
        document.getElementById('phoneNumber').value = sim.phoneNumber || '';
        document.getElementById('dataLimit').value = sim.dataLimit || '';
        document.getElementById('notes').value = sim.notes || '';
    }

    closeModal() {
        document.getElementById('simModal').style.display = 'none';
        this.currentEditId = null;
    }

    saveSim() {
        const formData = {
            number: document.getElementById('simNumber').value,
            carrier: document.getElementById('carrier').value,
            phoneNumber: document.getElementById('phoneNumber').value,
            dataLimit: document.getElementById('dataLimit').value,
            notes: document.getElementById('notes').value
        };

        if (this.currentEditId) {
            // Update existing SIM
            const simIndex = this.sims.findIndex(s => s.id === this.currentEditId);
            this.sims[simIndex] = { ...this.sims[simIndex], ...formData };
        } else {
            // Add new SIM
            const newSim = {
                id: this.generateId(),
                ...formData,
                status: 'available',
                createdAt: new Date().toISOString(),
                borrowHistory: []
            };
            this.sims.push(newSim);
        }

        this.saveToStorage();
        this.renderSims();
        this.updateStats();
        this.closeModal();
        this.showNotification('SIM card saved successfully!', 'success');
    }

    openActionModal(simId, action) {
        const sim = this.sims.find(s => s.id === simId);
        const modal = document.getElementById('actionModal');
        const title = document.getElementById('actionModalTitle');
        const body = document.getElementById('actionModalBody');
        const actionBtn = document.getElementById('actionBtn');

        this.currentActionSim = sim;

        if (action === 'borrow') {
            title.textContent = 'Borrow SIM Card';
            actionBtn.textContent = 'Borrow';
            actionBtn.className = 'btn btn-warning';
            actionBtn.onclick = () => this.borrowSim();
            
            // Show borrow form
            body.innerHTML = `
                <div class="sim-card-info" style="background: #f7fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h4>SIM Card: ${sim.number}</h4>
                    <p><strong>Carrier:</strong> ${sim.carrier}</p>
                    <p><strong>Phone:</strong> ${sim.phoneNumber || 'N/A'}</p>
                </div>
                <div class="form-group">
                    <label for="borrowerName">Borrower Name:</label>
                    <input type="text" id="borrowerName" required>
                </div>
                <div class="form-group">
                    <label for="borrowerEmail">Email:</label>
                    <input type="email" id="borrowerEmail">
                </div>
                <div class="form-group">
                    <label for="department">Department:</label>
                    <input type="text" id="department">
                </div>
                <div class="form-group">
                    <label for="borrowPurpose">Purpose:</label>
                    <textarea id="borrowPurpose" rows="2" placeholder="Reason for borrowing..."></textarea>
                </div>
                <div class="form-group">
                    <label for="expectedReturnDate">Expected Return Date:</label>
                    <input type="date" id="expectedReturnDate">
                </div>
            `;
        } else if (action === 'return') {
            title.textContent = 'Return SIM Card';
            actionBtn.textContent = 'Return';
            actionBtn.className = 'btn btn-success';
            actionBtn.onclick = () => this.returnSim();

            const currentBorrow = sim.currentBorrow;
            body.innerHTML = `
                <div class="sim-card-info" style="background: #f7fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h4>SIM Card: ${sim.number}</h4>
                    <p><strong>Carrier:</strong> ${sim.carrier}</p>
                    <p><strong>Phone:</strong> ${sim.phoneNumber || 'N/A'}</p>
                </div>
                <div class="borrower-info">
                    <h4>Current Borrower</h4>
                    <p><strong>Name:</strong> ${currentBorrow.borrowerName}</p>
                    <p><strong>Email:</strong> ${currentBorrow.borrowerEmail || 'N/A'}</p>
                    <p><strong>Department:</strong> ${currentBorrow.department || 'N/A'}</p>
                    <p><strong>Borrowed:</strong> ${new Date(currentBorrow.borrowDate).toLocaleDateString()}</p>
                    <p><strong>Expected Return:</strong> ${currentBorrow.expectedReturnDate ? new Date(currentBorrow.expectedReturnDate).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div class="form-group">
                    <label for="returnNotes">Return Notes (optional):</label>
                    <textarea id="returnNotes" rows="3" placeholder="Any notes about the return condition..."></textarea>
                </div>
            `;
        }

        modal.style.display = 'block';
    }

    closeActionModal() {
        document.getElementById('actionModal').style.display = 'none';
        this.currentActionSim = null;
    }

    borrowSim() {
        const borrowerName = document.getElementById('borrowerName').value;
        const borrowerEmail = document.getElementById('borrowerEmail').value;
        const department = document.getElementById('department').value;
        const borrowPurpose = document.getElementById('borrowPurpose').value;
        const expectedReturnDate = document.getElementById('expectedReturnDate').value;

        if (!borrowerName.trim()) {
            this.showNotification('Borrower name is required!', 'error');
            return;
        }

        const borrowRecord = {
            borrowerName: borrowerName.trim(),
            borrowerEmail: borrowerEmail.trim(),
            department: department.trim(),
            borrowPurpose: borrowPurpose.trim(),
            expectedReturnDate: expectedReturnDate,
            borrowDate: new Date().toISOString()
        };

        // Update SIM status
        const simIndex = this.sims.findIndex(s => s.id === this.currentActionSim.id);
        this.sims[simIndex].status = 'borrowed';
        this.sims[simIndex].currentBorrow = borrowRecord;
        this.sims[simIndex].borrowHistory.push(borrowRecord);

        this.saveToStorage();
        this.renderSims();
        this.updateStats();
        this.closeActionModal();
        this.showNotification(`SIM card borrowed by ${borrowerName}`, 'success');
    }

    returnSim() {
        const returnNotes = document.getElementById('returnNotes').value;

        const simIndex = this.sims.findIndex(s => s.id === this.currentActionSim.id);
        
        // Update the current borrow record with return info
        if (this.sims[simIndex].currentBorrow) {
            this.sims[simIndex].currentBorrow.returnDate = new Date().toISOString();
            this.sims[simIndex].currentBorrow.returnNotes = returnNotes.trim();
        }

        // Update SIM status
        this.sims[simIndex].status = 'available';
        delete this.sims[simIndex].currentBorrow;

        this.saveToStorage();
        this.renderSims();
        this.updateStats();
        this.closeActionModal();
        this.showNotification('SIM card returned successfully!', 'success');
    }

    deleteSim(simId) {
        if (confirm('Are you sure you want to delete this SIM card? This action cannot be undone.')) {
            this.sims = this.sims.filter(s => s.id !== simId);
            this.saveToStorage();
            this.renderSims();
            this.updateStats();
            this.showNotification('SIM card deleted successfully!', 'success');
        }
    }

    renderSims() {
        const container = document.getElementById('simGrid');
        
        if (this.sims.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-sim-card"></i>
                    <h3>No SIM Cards Yet</h3>
                    <p>Add your first SIM card to start managing borrowing.</p>
                    <button class="btn btn-primary" onclick="simManager.openSimModal()">
                        <i class="fas fa-plus"></i> Add SIM Card
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.sims.map(sim => this.createSimCard(sim)).join('');
    }

    createSimCard(sim) {
        const statusClass = sim.status === 'available' ? 'available' : 'borrowed';
        const statusText = sim.status === 'available' ? 'Available' : 'Borrowed';
        
        let borrowerInfo = '';
        if (sim.status === 'borrowed' && sim.currentBorrow) {
            const borrowDate = new Date(sim.currentBorrow.borrowDate).toLocaleDateString();
            const expectedReturn = sim.currentBorrow.expectedReturnDate 
                ? new Date(sim.currentBorrow.expectedReturnDate).toLocaleDateString() 
                : 'Not specified';
            
            borrowerInfo = `
                <div class="borrower-info">
                    <h4><i class="fas fa-user"></i> Current Borrower</h4>
                    <div class="borrower-detail">
                        <span class="label">Name:</span>
                        <span class="value">${sim.currentBorrow.borrowerName}</span>
                    </div>
                    <div class="borrower-detail">
                        <span class="label">Email:</span>
                        <span class="value">${sim.currentBorrow.borrowerEmail || 'N/A'}</span>
                    </div>
                    <div class="borrower-detail">
                        <span class="label">Department:</span>
                        <span class="value">${sim.currentBorrow.department || 'N/A'}</span>
                    </div>
                    <div class="borrower-detail">
                        <span class="label">Borrowed:</span>
                        <span class="value">${borrowDate}</span>
                    </div>
                    <div class="borrower-detail">
                        <span class="label">Expected Return:</span>
                        <span class="value">${expectedReturn}</span>
                    </div>
                </div>
            `;
        }

        const actionButtons = sim.status === 'available' ? `
            <button class="btn btn-warning" onclick="simManager.openActionModal('${sim.id}', 'borrow')">
                <i class="fas fa-hand-paper"></i> Borrow
            </button>
        ` : `
            <button class="btn btn-success" onclick="simManager.openActionModal('${sim.id}', 'return')">
                <i class="fas fa-undo"></i> Return
            </button>
        `;

        return `
            <div class="sim-card ${statusClass}">
                <div class="sim-header">
                    <div class="sim-info">
                        <h3>${sim.number}</h3>
                        <div class="carrier">${sim.carrier}</div>
                    </div>
                    <div class="sim-status ${statusClass}">${statusText}</div>
                </div>
                
                <div class="sim-details">
                    <div class="sim-detail">
                        <span class="label">Phone:</span>
                        <span class="value">${sim.phoneNumber || 'N/A'}</span>
                    </div>
                    <div class="sim-detail">
                        <span class="label">Data Limit:</span>
                        <span class="value">${sim.dataLimit ? sim.dataLimit + ' GB' : 'N/A'}</span>
                    </div>
                    ${sim.notes ? `
                        <div class="sim-detail">
                            <span class="label">Notes:</span>
                            <span class="value">${sim.notes}</span>
                        </div>
                    ` : ''}
                </div>

                ${borrowerInfo}

                <div class="sim-actions">
                    ${actionButtons}
                    <button class="btn btn-secondary" onclick="simManager.openSimModal('${sim.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger" onclick="simManager.deleteSim('${sim.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }

    searchSims(searchTerm) {
        const filteredSims = this.sims.filter(sim => 
            sim.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sim.carrier.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (sim.phoneNumber && sim.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (sim.currentBorrow && sim.currentBorrow.borrowerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (sim.notes && sim.notes.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        const container = document.getElementById('simGrid');
        if (filteredSims.length === 0 && searchTerm) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No Results Found</h3>
                    <p>No SIM cards match your search for "${searchTerm}".</p>
                </div>
            `;
        } else {
            container.innerHTML = filteredSims.map(sim => this.createSimCard(sim)).join('');
        }
    }

    updateStats() {
        const total = this.sims.length;
        const available = this.sims.filter(s => s.status === 'available').length;
        const borrowed = this.sims.filter(s => s.status === 'borrowed').length;

        document.getElementById('totalSims').textContent = total;
        document.getElementById('availableSims').textContent = available;
        document.getElementById('borrowedSims').textContent = borrowed;
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    saveToStorage() {
        localStorage.setItem('simCards', JSON.stringify(this.sims));
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        // Add styles if not exists
        if (!document.getElementById('notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    border-radius: 8px;
                    color: white;
                    font-weight: 500;
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                    transform: translateX(400px);
                    transition: transform 0.3s ease;
                }
                .notification.show {
                    transform: translateX(0);
                }
                .notification-success { background: #48bb78; }
                .notification-error { background: #f56565; }
                .notification-info { background: #4299e1; }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }

    // Export data
    exportData() {
        const dataStr = JSON.stringify(this.sims, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `sim-cards-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    // Import data
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (Array.isArray(importedData)) {
                    this.sims = importedData;
                    this.saveToStorage();
                    this.renderSims();
                    this.updateStats();
                    this.showNotification('Data imported successfully!', 'success');
                } else {
                    this.showNotification('Invalid file format!', 'error');
                }
            } catch (error) {
                this.showNotification('Error reading file!', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Global functions for modal management
function closeModal() {
    simManager.closeModal();
}

function closeActionModal() {
    simManager.closeActionModal();
}

// Initialize the application
const simManager = new SIMManager();

// Add some sample data for demonstration (remove this in production)
if (simManager.sims.length === 0) {
    const sampleSims = [
        {
            id: '1',
            number: '8901234567890123456',
            carrier: 'Verizon',
            phoneNumber: '+1-555-0001',
            dataLimit: 10,
            notes: 'Primary business line',
            status: 'available',
            createdAt: new Date().toISOString(),
            borrowHistory: []
        },
        {
            id: '2',
            number: '8901234567890123457',
            carrier: 'AT&T',
            phoneNumber: '+1-555-0002',
            dataLimit: 5,
            notes: 'Backup SIM',
            status: 'borrowed',
            createdAt: new Date().toISOString(),
            borrowHistory: [],
            currentBorrow: {
                borrowerName: 'John Smith',
                borrowerEmail: 'john.smith@company.com',
                department: 'Sales',
                borrowPurpose: 'Business trip to Europe',
                expectedReturnDate: '2025-09-15',
                borrowDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
            }
        }
    ];
    
    simManager.sims = sampleSims;
    simManager.saveToStorage();
    simManager.renderSims();
    simManager.updateStats();
}
