/**
 * NFC Types for Animal Transponder Management
 */

export interface NFCTagData {
  id: string;
  type?: string;
  techTypes?: string[];
  ndef?: {
    records: NFCRecord[];
  };
  raw?: any;
}

export interface NFCRecord {
  type: string;
  data: string;
  payload?: Uint8Array;
}

export interface NFCScanResult {
  success: boolean;
  tagId?: string;
  animalId?: string;
  data?: NFCTagData;
  error?: string;
}

export interface NFCWriteOptions {
  animalId: string;
  additionalData?: Record<string, any>;
}

export interface NFCAnimalLink {
  animal_id: string;
  nfc_tag_id: string;
  linked_at: string;
  scan_count: number;
  last_scanned_at?: string;
}
