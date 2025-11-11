/**
 * Build Version Display - Shows current build timestamp
 * Use this to verify you're running the latest build
 */

export function BuildVersion() {
  // This timestamp will change every time you build
  const buildTime = "2025-11-11-19:45:00";
  const nfcPluginVersion = "@exxili/capacitor-nfc v0.0.12";
  
  return (
    <div className="fixed bottom-2 right-2 bg-background/80 backdrop-blur-sm border border-border rounded-lg p-2 text-xs font-mono z-50">
      <div className="text-muted-foreground">Build: {buildTime}</div>
      <div className="text-muted-foreground">{nfcPluginVersion}</div>
    </div>
  );
}
