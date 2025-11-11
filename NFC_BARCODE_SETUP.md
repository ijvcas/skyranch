# NFC & Universal Barcode System Setup Guide

## ✅ What's Implemented

### 1. Universal Barcode System
- ✅ **Database tables created:**
  - `barcode_registry` - Universal registry mapping barcodes to any entity type
  - `barcode_scan_history` - Analytics tracking for all scans
  - Added `barcode` column to `animals` table
  - Added NFC fields (`nfc_tag_id`, `nfc_last_scanned_at`, `nfc_scan_count`) to `animals` table

- ✅ **Barcode Service (`src/services/barcodeService.ts`):**
  - `lookupBarcode()` - Universal lookup across all entity types
  - `registerBarcode()` - Register new barcodes
  - `recordScan()` - Track scan history for analytics
  - `generateBarcode()` - Generate EAN-13 compatible barcodes
  - `fetchEntity()` - Retrieve entity details by type and ID

- ✅ **Enhanced Barcode Scanner (`src/hooks/useBarcodeScanner.ts`):**
  - Now returns `BarcodeEntity` with type, name, and details
  - Automatically looks up in universal registry
  - Records scan history for analytics
  - Supports: animals, inventory, equipment, lots, users

### 2. NFC Scanner (Ready for Plugin Installation)
- ✅ **NFC Hook (`src/hooks/useNFCScanner.ts`):**
  - Runtime plugin detection (no build errors if plugin not installed)
  - `scanNFC()` - Read NFC tags
  - `writeNFC()` - Write data to NFC tags
  - `checkAvailability()` - Verify NFC support
  - Auto-shows setup instructions if plugin missing

---

## 🔧 NFC Plugin Installation (iOS)

### Step 1: Install the NFC Plugin

```bash
npm install @capawesome-team/capacitor-nfc@latest
npx cap sync ios
```

### Step 2: Update iOS Configuration

#### A. Update `ios/App/App/Info.plist`

Add these keys:

```xml
<!-- NFC Permissions -->
<key>NFCReaderUsageDescription</key>
<string>FARMIKA necesita acceso a NFC para escanear etiquetas de animales e inventario</string>

<key>com.apple.developer.nfc.readersession.formats</key>
<array>
    <string>NDEF</string>
    <string>TAG</string>
</array>
```

#### B. Update `ios/App/Podfile`

Uncomment or add this line:

```ruby
pod 'CapawesomeCapacitorNfc', :path => '../../node_modules/@capawesome-team/capacitor-nfc'
```

Then run:

```bash
cd ios/App
pod install
cd ../..
```

#### C. Enable NFC Capability in Xcode

1. Open `ios/App/App.xcworkspace` in Xcode
2. Select the "App" target
3. Go to "Signing & Capabilities" tab
4. Click "+ Capability"
5. Add "Near Field Communication Tag Reading"
6. This adds the entitlement: `com.apple.developer.nfc.readersession.tag-reading`

### Step 3: Sync and Build

```bash
npm run build
npx cap sync ios
npx cap open ios
```

Build and run from Xcode on a physical device (NFC doesn't work in simulator).

---

## 📱 Usage Examples

### Universal Barcode Scanning

```typescript
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';

const { scanBarcode, isScanning } = useBarcodeScanner();

const handleScan = async () => {
  const entity = await scanBarcode();
  
  if (entity) {
    console.log('Found:', entity.type, entity.name);
    // entity = {
    //   id: 'uuid',
    //   type: 'animal' | 'inventory' | 'equipment' | 'lot' | 'user',
    //   name: 'Animal Name',
    //   details: { ...full entity data }
    // }
  }
};
```

### Register a Barcode

```typescript
import { BarcodeService } from '@/services/barcodeService';

// Register animal barcode
await BarcodeService.registerBarcode(
  '2001234567890', // barcode
  'animal',        // entity type
  animalId,        // entity UUID
  'Generated on 2025-01-11' // optional notes
);

// Generate new EAN-13 barcode
const newBarcode = BarcodeService.generateBarcode('200'); // prefix
console.log(newBarcode); // e.g., "2001234567893"
```

### NFC Scanning (Once Plugin Installed)

```typescript
import { useNFCScanner } from '@/hooks/useNFCScanner';

const { scanNFC, writeNFC, isScanning, checkAvailability } = useNFCScanner();

// Check if NFC is available
const available = await checkAvailability();

// Read NFC tag
const tagData = await scanNFC();
if (tagData) {
  console.log('NFC Data:', tagData);
}

// Write to NFC tag
const success = await writeNFC('ANIMAL-12345');
```

---

## 🗄️ Database Schema

### `barcode_registry` Table
```sql
id UUID PRIMARY KEY
barcode TEXT UNIQUE NOT NULL
entity_type TEXT NOT NULL  -- 'animal', 'inventory', 'equipment', 'lot', 'user'
entity_id UUID NOT NULL
created_at TIMESTAMP
created_by UUID
notes TEXT
is_active BOOLEAN DEFAULT true
```

### `barcode_scan_history` Table
```sql
id UUID PRIMARY KEY
barcode TEXT NOT NULL
entity_type TEXT
entity_id UUID
scanned_by UUID
scanned_at TIMESTAMP DEFAULT now()
scan_location JSONB  -- { coordinates: { latitude, longitude } }
scan_context TEXT
device_info JSONB
```

### Updated `animals` Table
```sql
-- New columns added:
barcode TEXT UNIQUE           -- Optical barcode
nfc_tag_id TEXT UNIQUE        -- NFC tag identifier
nfc_last_scanned_at TIMESTAMP -- Last NFC scan time
nfc_scan_count INTEGER        -- Total NFC scans
```

---

## 🔍 Supported Barcode Formats

- **EAN-13** - European Article Number (most common)
- **EAN-8** - Short version of EAN
- **UPC-A** - Universal Product Code (USA)
- **UPC-E** - Compressed UPC
- **Code 128** - High-density barcode
- **Code 39** - Alphanumeric barcode
- **QR Code** - 2D matrix barcode

---

## 🚀 Next Steps & Enhancements

### Recommended Next Features:

1. **Barcode Generation UI**
   - Generate printable barcode labels for animals
   - Export as PDF for thermal printers
   - QR code generation for easy scanning

2. **Bulk Scanning Mode**
   - Rapid scan multiple items
   - Batch inventory counting
   - Livestock movement tracking

3. **Scan Analytics Dashboard**
   - Most scanned items
   - Scan frequency charts
   - Location heatmaps
   - Export scan history reports

4. **Offline Barcode Database**
   - Cache registry for offline use
   - Sync when connection available
   - Local-first architecture

5. **NFC Writing Interface**
   - Write animal IDs to NFC tags
   - Batch NFC tag programming
   - Tag validation and testing

6. **Multi-Tag Support**
   - Animals with both barcode + NFC
   - Fallback scanning options
   - Cross-reference validation

---

## 🐛 Troubleshooting

### NFC Not Working

1. **Check device support:** NFC only works on iPhone 7 and later
2. **Physical device only:** NFC doesn't work in iOS Simulator
3. **Check capabilities:** Ensure "Near Field Communication Tag Reading" is enabled in Xcode
4. **Info.plist keys:** Verify NFCReaderUsageDescription is set
5. **Plugin installation:** Confirm @capawesome-team/capacitor-nfc is installed

### Barcode Scanner Issues

1. **Camera permission:** App needs camera access
2. **Lighting:** Ensure good lighting conditions
3. **Distance:** Hold barcode 10-30cm from camera
4. **Focus:** Keep device steady for auto-focus
5. **Barcode quality:** Ensure barcode is not damaged

### Database Issues

1. **Check RLS policies:** Ensure user is authenticated and active
2. **Unique constraints:** Barcodes must be unique across system
3. **Entity exists:** Verify entity_id exists before registering barcode

---

## 📊 Analytics Queries

```sql
-- Most scanned items (last 30 days)
SELECT 
  entity_type,
  entity_id,
  COUNT(*) as scan_count
FROM barcode_scan_history
WHERE scanned_at > now() - interval '30 days'
GROUP BY entity_type, entity_id
ORDER BY scan_count DESC
LIMIT 20;

-- Scan activity by hour
SELECT 
  DATE_TRUNC('hour', scanned_at) as hour,
  COUNT(*) as scans
FROM barcode_scan_history
WHERE scanned_at > now() - interval '7 days'
GROUP BY hour
ORDER BY hour DESC;

-- User scan statistics
SELECT 
  scanned_by,
  COUNT(*) as total_scans,
  COUNT(DISTINCT barcode) as unique_items
FROM barcode_scan_history
GROUP BY scanned_by
ORDER BY total_scans DESC;
```

---

## 🔐 Security Notes

- ✅ RLS policies enabled on all new tables
- ✅ Only authenticated active users can scan/register
- ✅ Admins can manage registry entries
- ✅ Scan history tracks all scanning activity
- ✅ Audit trail for barcode assignments

---

## 📝 Development Notes

### Capacitor 7 Compatibility

- Using `@capacitor-mlkit/barcode-scanning` v7.3.0 ✅
- Using `@capacitor/core` v7.4.4 ✅
- NFC plugin `@capawesome-team/capacitor-nfc` v6.x is Capacitor 7 compatible ✅

### TypeScript Types

All services and hooks are fully typed:
- `BarcodeEntity` - Unified entity response
- `BarcodeRegistryEntry` - Registry table type
- NFC plugin types defined in hook

### Performance

- Barcode lookups use indexed columns
- Registry checks before legacy table scans
- Scan history recorded asynchronously
- Efficient SQL queries with proper indexes

---

## 📧 Support

For issues or questions:
1. Check console logs for detailed error messages
2. Verify all setup steps completed
3. Ensure device compatibility
4. Check Supabase connection status

---

**Status:** ✅ Universal Barcode System fully implemented and ready to use.
**Status:** ⏳ NFC Scanner ready - requires plugin installation following steps above.
