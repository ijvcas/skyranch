/**
 * Build Version Display - Shows current build timestamp
 * Use this to verify you're running the latest build
 */

export function BuildVersion() {
  // This timestamp will change every time you build
  const buildTime = "2025-11-11-20:15:00";
  const nfcPluginVersion = "@exxili/capacitor-nfc v0.0.12";
  
  return (
    <div className="fixed bottom-2 right-2 bg-primary text-primary-foreground border-2 border-primary rounded-lg p-3 text-sm font-bold z-[9999] shadow-lg">
      <div className="mb-1">✅ NEW BUILD</div>
      <div>Build: {buildTime}</div>
      <div className="text-xs mt-1">{nfcPluginVersion}</div>
    </div>
  );
}
