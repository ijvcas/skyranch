export interface ParsedPedigree {
  generation1: { father: string; mother: string };
  generation2: {
    paternalGrandfather: string;
    paternalGrandmother: string;
    maternalGrandfather: string;
    maternalGrandmother: string;
  };
  generation3: string[]; // 8 great-grandparents
  generation4: {
    paternalLine: string[]; // 8 names
    maternalLine: string[]; // 8 names
  };
  generation5: {
    paternalLine: string[]; // 16 names
    maternalLine: string[]; // 16 names
  };
}

export interface PedigreeFieldMapping {
  [key: string]: string;
}

const cleanName = (name: string): string => {
  return name
    .trim()
    .replace(/^[-•*]\s*/, '') // Remove bullet points
    .replace(/^\d+\.\s*/, '') // Remove numbering
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
};

const detectGenerationMarkers = (line: string): number | null => {
  const lowerLine = line.toLowerCase();
  const patterns = [
    /gen(?:eration)?\s*1/i,
    /gen(?:eration)?\s*2/i,
    /gen(?:eration)?\s*3/i,
    /gen(?:eration)?\s*4/i,
    /gen(?:eration)?\s*5/i,
    /generación\s*1/i,
    /generación\s*2/i,
    /generación\s*3/i,
    /generación\s*4/i,
    /generación\s*5/i,
    /primera\s*generación/i,
    /segunda\s*generación/i,
    /tercera\s*generación/i,
    /cuarta\s*generación/i,
    /quinta\s*generación/i,
  ];

  for (let i = 0; i < patterns.length; i++) {
    if (patterns[i].test(lowerLine)) {
      return (i % 5) + 1;
    }
  }

  // Check for simple number patterns
  const match = lowerLine.match(/^(\d+)/);
  if (match) {
    const num = parseInt(match[1]);
    if (num >= 1 && num <= 5) return num;
  }

  return null;
};

const parseStructuredFormat = (text: string): ParsedPedigree | null => {
  const lines = text.split('\n').filter(line => line.trim());
  const result: any = {
    generation1: { father: '', mother: '' },
    generation2: {
      paternalGrandfather: '',
      paternalGrandmother: '',
      maternalGrandfather: '',
      maternalGrandmother: '',
    },
    generation3: [],
    generation4: { paternalLine: [], maternalLine: [] },
    generation5: { paternalLine: [], maternalLine: [] },
  };

  let currentGen = 0;
  const gen3Names: string[] = [];
  const gen4Names: string[] = [];
  const gen5Names: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const genMarker = detectGenerationMarkers(line);

    if (genMarker) {
      currentGen = genMarker;
      continue;
    }

    const lowerLine = line.toLowerCase();

    // Generation 1
    if (currentGen === 1) {
      if (lowerLine.includes('padre') || lowerLine.includes('father') || lowerLine.includes('sire')) {
        const name = cleanName(line.split(':')[1] || line.replace(/padre|father|sire/gi, ''));
        if (name) result.generation1.father = name;
      } else if (lowerLine.includes('madre') || lowerLine.includes('mother') || lowerLine.includes('dam')) {
        const name = cleanName(line.split(':')[1] || line.replace(/madre|mother|dam/gi, ''));
        if (name) result.generation1.mother = name;
      }
    }

    // Generation 2
    if (currentGen === 2) {
      if (lowerLine.includes('abuelo paterno') || lowerLine.includes('paternal grandfather')) {
        const name = cleanName(line.split(':')[1] || '');
        if (name) result.generation2.paternalGrandfather = name;
      } else if (lowerLine.includes('abuela paterna') || lowerLine.includes('paternal grandmother')) {
        const name = cleanName(line.split(':')[1] || '');
        if (name) result.generation2.paternalGrandmother = name;
      } else if (lowerLine.includes('abuelo materno') || lowerLine.includes('maternal grandfather')) {
        const name = cleanName(line.split(':')[1] || '');
        if (name) result.generation2.maternalGrandfather = name;
      } else if (lowerLine.includes('abuela materna') || lowerLine.includes('maternal grandmother')) {
        const name = cleanName(line.split(':')[1] || '');
        if (name) result.generation2.maternalGrandmother = name;
      }
    }

    // Generation 3
    if (currentGen === 3) {
      const name = cleanName(line.split(':').pop() || line);
      if (name && name.length > 1) {
        gen3Names.push(name);
      }
    }

    // Generation 4
    if (currentGen === 4) {
      const name = cleanName(line.split(':').pop() || line);
      if (name && name.length > 1) {
        gen4Names.push(name);
      }
    }

    // Generation 5
    if (currentGen === 5) {
      const name = cleanName(line.split(':').pop() || line);
      if (name && name.length > 1) {
        gen5Names.push(name);
      }
    }
  }

  // Assign generation 3 (8 names)
  result.generation3 = gen3Names.slice(0, 8);
  while (result.generation3.length < 8) {
    result.generation3.push('');
  }

  // Assign generation 4 (16 names split into paternal/maternal)
  result.generation4.paternalLine = gen4Names.slice(0, 8);
  result.generation4.maternalLine = gen4Names.slice(8, 16);
  while (result.generation4.paternalLine.length < 8) {
    result.generation4.paternalLine.push('');
  }
  while (result.generation4.maternalLine.length < 8) {
    result.generation4.maternalLine.push('');
  }

  // Assign generation 5 (32 names split into paternal/maternal)
  result.generation5.paternalLine = gen5Names.slice(0, 16);
  result.generation5.maternalLine = gen5Names.slice(16, 32);
  while (result.generation5.paternalLine.length < 16) {
    result.generation5.paternalLine.push('');
  }
  while (result.generation5.maternalLine.length < 16) {
    result.generation5.maternalLine.push('');
  }

  return result as ParsedPedigree;
};

export const parsePedigreeText = (text: string): ParsedPedigree | null => {
  if (!text || text.trim().length === 0) {
    return null;
  }

  return parseStructuredFormat(text);
};

export const mapPedigreeToFields = (parsed: ParsedPedigree): PedigreeFieldMapping => {
  const mapping: PedigreeFieldMapping = {};

  // Generation 1
  if (parsed.generation1.father) mapping['father_id'] = parsed.generation1.father;
  if (parsed.generation1.mother) mapping['mother_id'] = parsed.generation1.mother;

  // Generation 2
  if (parsed.generation2.paternalGrandfather) mapping['paternal_grandfather_id'] = parsed.generation2.paternalGrandfather;
  if (parsed.generation2.paternalGrandmother) mapping['paternal_grandmother_id'] = parsed.generation2.paternalGrandmother;
  if (parsed.generation2.maternalGrandfather) mapping['maternal_grandfather_id'] = parsed.generation2.maternalGrandfather;
  if (parsed.generation2.maternalGrandmother) mapping['maternal_grandmother_id'] = parsed.generation2.maternalGrandmother;

  // Generation 3 - Great-grandparents
  const gen3Fields = [
    'paternal_great_grandfather_paternal_id',
    'paternal_great_grandmother_paternal_id',
    'paternal_great_grandfather_maternal_id',
    'paternal_great_grandmother_maternal_id',
    'maternal_great_grandfather_paternal_id',
    'maternal_great_grandmother_paternal_id',
    'maternal_great_grandfather_maternal_id',
    'maternal_great_grandmother_maternal_id',
  ];
  parsed.generation3.forEach((name, index) => {
    if (name && gen3Fields[index]) {
      mapping[gen3Fields[index]] = name;
    }
  });

  // Generation 4 - Paternal line
  const gen4PaternalFields = [
    'gen4_paternal_ggggf_p',
    'gen4_paternal_ggggm_p',
    'gen4_paternal_gggmf_p',
    'gen4_paternal_gggmm_p',
    'gen4_paternal_ggfgf_p',
    'gen4_paternal_ggfgm_p',
    'gen4_paternal_ggmgf_p',
    'gen4_paternal_ggmgm_p',
  ];
  parsed.generation4.paternalLine.forEach((name, index) => {
    if (name && gen4PaternalFields[index]) {
      mapping[gen4PaternalFields[index]] = name;
    }
  });

  // Generation 4 - Maternal line
  const gen4MaternalFields = [
    'gen4_maternal_ggggf_m',
    'gen4_maternal_ggggm_m',
    'gen4_maternal_gggmf_m',
    'gen4_maternal_gggmm_m',
    'gen4_maternal_ggfgf_m',
    'gen4_maternal_ggfgm_m',
    'gen4_maternal_ggmgf_m',
    'gen4_maternal_ggmgm_m',
  ];
  parsed.generation4.maternalLine.forEach((name, index) => {
    if (name && gen4MaternalFields[index]) {
      mapping[gen4MaternalFields[index]] = name;
    }
  });

  // Generation 5 - Paternal line
  for (let i = 0; i < 16; i++) {
    const name = parsed.generation5.paternalLine[i];
    if (name) {
      mapping[`gen5_paternal_${i + 1}`] = name;
    }
  }

  // Generation 5 - Maternal line
  for (let i = 0; i < 16; i++) {
    const name = parsed.generation5.maternalLine[i];
    if (name) {
      mapping[`gen5_maternal_${i + 1}`] = name;
    }
  }

  return mapping;
};
