import QRCode from 'qrcode';

export interface PrintAnimalData {
  id: string;
  name: string;
  species: string;
  breed?: string;
  tag_number?: string;
  birth_date?: string;
  sex?: string;
  weight?: number;
  health_status?: string;
  vaccinations?: Array<{ name: string; date: string }>;
  treatments?: Array<{ description: string; date: string }>;
}

export interface PrintInventoryData {
  items: Array<{
    name: string;
    category: string;
    current_quantity: number;
    unit: string;
    min_quantity?: number;
    expiry_date?: string;
    supplier?: string;
    storage_location?: string;
  }>;
  title: string;
  date: string;
}

class PrintService {
  private async generateQRCode(data: string): Promise<string> {
    try {
      return await QRCode.toDataURL(data, { width: 200 });
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  }

  async printAnimalRecord(animal: PrintAnimalData) {
    const qrCodeUrl = await this.generateQRCode(`farmika://animal/${animal.id}`);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Animal Record - ${animal.name}</title>
          <style>
            @media print {
              @page { margin: 1cm; }
              body { margin: 0; }
              .no-print { display: none; }
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              color: #333;
            }
            .qr-section {
              text-align: center;
              margin: 20px 0;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin: 20px 0;
            }
            .info-item {
              padding: 10px;
              border: 1px solid #ddd;
              border-radius: 4px;
            }
            .info-label {
              font-weight: bold;
              color: #666;
              font-size: 12px;
              text-transform: uppercase;
            }
            .info-value {
              margin-top: 5px;
              font-size: 16px;
              color: #333;
            }
            .section {
              margin: 30px 0;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #333;
              border-bottom: 1px solid #ddd;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .record-item {
              padding: 10px;
              border-left: 3px solid #4CAF50;
              margin-bottom: 10px;
              background: #f9f9f9;
            }
            .print-button {
              background: #4CAF50;
              color: white;
              border: none;
              padding: 10px 20px;
              font-size: 16px;
              cursor: pointer;
              border-radius: 4px;
              margin: 20px 0;
            }
            .print-button:hover {
              background: #45a049;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Animal Record</h1>
            <p>Generated: ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="qr-section">
            ${qrCodeUrl ? `<img src="${qrCodeUrl}" alt="QR Code" />` : ''}
            <p style="font-size: 12px; color: #666;">Scan to view full record</p>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Name</div>
              <div class="info-value">${animal.name}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Tag Number</div>
              <div class="info-value">${animal.tag_number || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Species</div>
              <div class="info-value">${animal.species}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Breed</div>
              <div class="info-value">${animal.breed || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Sex</div>
              <div class="info-value">${animal.sex || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Birth Date</div>
              <div class="info-value">${animal.birth_date ? new Date(animal.birth_date).toLocaleDateString() : 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Weight</div>
              <div class="info-value">${animal.weight ? `${animal.weight} kg` : 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Health Status</div>
              <div class="info-value">${animal.health_status || 'N/A'}</div>
            </div>
          </div>

          ${animal.vaccinations && animal.vaccinations.length > 0 ? `
            <div class="section">
              <div class="section-title">Vaccination History</div>
              ${animal.vaccinations.map(v => `
                <div class="record-item">
                  <strong>${v.name}</strong><br>
                  <small>Date: ${new Date(v.date).toLocaleDateString()}</small>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${animal.treatments && animal.treatments.length > 0 ? `
            <div class="section">
              <div class="section-title">Treatment History</div>
              ${animal.treatments.map(t => `
                <div class="record-item">
                  <strong>${t.description}</strong><br>
                  <small>Date: ${new Date(t.date).toLocaleDateString()}</small>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <button class="print-button no-print" onclick="window.print()">Print Record</button>
        </body>
      </html>
    `);

    printWindow.document.close();
  }

  async printInventoryReport(data: PrintInventoryData) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const totalValue = data.items.reduce((sum, item) => sum + item.current_quantity, 0);
    const lowStockItems = data.items.filter(item => 
      item.min_quantity && item.current_quantity <= item.min_quantity
    );

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${data.title}</title>
          <style>
            @media print {
              @page { margin: 1cm; }
              body { margin: 0; }
              .no-print { display: none; }
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              color: #333;
            }
            .summary {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              margin: 20px 0;
            }
            .summary-card {
              padding: 15px;
              border: 1px solid #ddd;
              border-radius: 4px;
              text-align: center;
            }
            .summary-label {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
            }
            .summary-value {
              font-size: 24px;
              font-weight: bold;
              color: #333;
              margin-top: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
              color: #333;
            }
            tr:hover {
              background-color: #f9f9f9;
            }
            .low-stock {
              color: #f44336;
              font-weight: bold;
            }
            .expired {
              color: #ff9800;
              font-weight: bold;
            }
            .print-button {
              background: #4CAF50;
              color: white;
              border: none;
              padding: 10px 20px;
              font-size: 16px;
              cursor: pointer;
              border-radius: 4px;
              margin: 20px 0;
            }
            .print-button:hover {
              background: #45a049;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${data.title}</h1>
            <p>Generated: ${data.date}</p>
          </div>

          <div class="summary">
            <div class="summary-card">
              <div class="summary-label">Total Items</div>
              <div class="summary-value">${data.items.length}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Low Stock Items</div>
              <div class="summary-value" style="color: ${lowStockItems.length > 0 ? '#f44336' : '#4CAF50'}">
                ${lowStockItems.length}
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Categories</div>
              <div class="summary-value">${new Set(data.items.map(i => i.category)).size}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Min Stock</th>
                <th>Expiry Date</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map(item => {
                const isLowStock = item.min_quantity && item.current_quantity <= item.min_quantity;
                const isExpired = item.expiry_date && new Date(item.expiry_date) < new Date();
                
                return `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.category}</td>
                    <td class="${isLowStock ? 'low-stock' : ''}">${item.current_quantity} ${item.unit}</td>
                    <td>${item.unit}</td>
                    <td>${item.min_quantity || '-'}</td>
                    <td class="${isExpired ? 'expired' : ''}">${item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '-'}</td>
                    <td>${item.storage_location || '-'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <button class="print-button no-print" onclick="window.print()">Print Report</button>
        </body>
      </html>
    `);

    printWindow.document.close();
  }
}

export const printService = new PrintService();
