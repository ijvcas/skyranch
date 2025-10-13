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

// Enhanced parsing with paternal/maternal line detection
const detectLineType = (line: string): 'paternal' | 'maternal' | 'section_marker' | 'name' => {
  const lowerLine = line.toLowerCase().trim();
  
  // Detect section markers
  if (
    lowerLine.includes('ligne paternelle') ||
    lowerLine.includes('paternal line') ||
    lowerLine.includes('línea paterna') ||
    lowerLine.includes('lado paterno') ||
    lowerLine.includes('father\'s side') ||
    /^===.*paternal/i.test(lowerLine) ||
    /^paternal/i.test(lowerLine)
  ) {
    return 'section_marker';
  }
  
  if (
    lowerLine.includes('ligne maternelle') ||
    lowerLine.includes('maternal line') ||
    lowerLine.includes('línea materna') ||
    lowerLine.includes('lado materno') ||
    lowerLine.includes('mother\'s side') ||
    /^===.*maternal/i.test(lowerLine) ||
    /^maternal/i.test(lowerLine)
  ) {
    return 'section_marker';
  }
  
  return 'name';
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
  let currentSide: 'paternal' | 'maternal' | 'auto' = 'auto'; // Track which side we're on
  
  const gen3Names: string[] = [];
  const gen4PaternalNames: string[] = [];
  const gen4MaternalNames: string[] = [];
  const gen5PaternalNames: string[] = [];
  const gen5MaternalNames: string[] = [];

  console.log('🔍 [Pedigree Parser] Starting parse...');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const genMarker = detectGenerationMarkers(line);

    if (genMarker) {
      currentGen = genMarker;
      currentSide = 'auto'; // Reset side detection when entering new generation
      console.log(`📊 [Pedigree Parser] Entered Generation ${currentGen}`);
      continue;
    }

    const lineType = detectLineType(line);
    
    // Detect section markers for paternal/maternal split
    if (lineType === 'section_marker') {
      const lowerLine = line.toLowerCase();
      if (
        lowerLine.includes('paternal') ||
        lowerLine.includes('patern') ||
        lowerLine.includes('father') ||
        lowerLine.includes('padre')
      ) {
        currentSide = 'paternal';
        console.log(`🔵 [Pedigree Parser] Switched to PATERNAL side in Gen ${currentGen}`);
      } else {
        currentSide = 'maternal';
        console.log(`🔴 [Pedigree Parser] Switched to MATERNAL side in Gen ${currentGen}`);
      }
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
        console.log(`  ✅ Gen 3: "${name}"`);
      }
    }

    // Generation 4 - with paternal/maternal detection
    if (currentGen === 4) {
      const name = cleanName(line.split(':').pop() || line);
      if (name && name.length > 1) {
        if (currentSide === 'paternal') {
          gen4PaternalNames.push(name);
          console.log(`  🔵 Gen 4 PATERNAL: "${name}"`);
        } else if (currentSide === 'maternal') {
          gen4MaternalNames.push(name);
          console.log(`  🔴 Gen 4 MATERNAL: "${name}"`);
        } else {
          // Auto mode: first 8 go to paternal, next 8 to maternal
          if (gen4PaternalNames.length < 8) {
            gen4PaternalNames.push(name);
            console.log(`  🔵 Gen 4 PATERNAL (auto): "${name}"`);
          } else {
            gen4MaternalNames.push(name);
            console.log(`  🔴 Gen 4 MATERNAL (auto): "${name}"`);
          }
        }
      }
    }

    // Generation 5 - with paternal/maternal detection
    if (currentGen === 5) {
      const name = cleanName(line.split(':').pop() || line);
      if (name && name.length > 1) {
        if (currentSide === 'paternal') {
          gen5PaternalNames.push(name);
          console.log(`  🔵 Gen 5 PATERNAL: "${name}"`);
        } else if (currentSide === 'maternal') {
          gen5MaternalNames.push(name);
          console.log(`  🔴 Gen 5 MATERNAL: "${name}"`);
        } else {
          // Auto mode: first 16 go to paternal, next 16 to maternal
          if (gen5PaternalNames.length < 16) {
            gen5PaternalNames.push(name);
            console.log(`  🔵 Gen 5 PATERNAL (auto): "${name}"`);
          } else {
            gen5MaternalNames.push(name);
            console.log(`  🔴 Gen 5 MATERNAL (auto): "${name}"`);
          }
        }
      }
    }
  }

  // Validation warnings
  console.log('\n📋 [Pedigree Parser] Validation:');
  console.log(`  Gen 3: ${gen3Names.length} names (expected: 8)`);
  console.log(`  Gen 4 Paternal: ${gen4PaternalNames.length} names (expected: 8)`);
  console.log(`  Gen 4 Maternal: ${gen4MaternalNames.length} names (expected: 8)`);
  console.log(`  Gen 5 Paternal: ${gen5PaternalNames.length} names (expected: 16)`);
  console.log(`  Gen 5 Maternal: ${gen5MaternalNames.length} names (expected: 16)`);
  
  if (gen4PaternalNames.length + gen4MaternalNames.length !== 16) {
    console.warn(`⚠️ [Pedigree Parser] Gen 4 total: ${gen4PaternalNames.length + gen4MaternalNames.length} (expected: 16)`);
  }
  if (gen5PaternalNames.length + gen5MaternalNames.length !== 32) {
    console.warn(`⚠️ [Pedigree Parser] Gen 5 total: ${gen5PaternalNames.length + gen5MaternalNames.length} (expected: 32)`);
  }

  // Assign generation 3 (8 names)
  result.generation3 = gen3Names.slice(0, 8);
  while (result.generation3.length < 8) {
    result.generation3.push('');
  }

  // Assign generation 4 - use the split arrays
  result.generation4.paternalLine = gen4PaternalNames.slice(0, 8);
  result.generation4.maternalLine = gen4MaternalNames.slice(0, 8);
  while (result.generation4.paternalLine.length < 8) {
    result.generation4.paternalLine.push('');
  }
  while (result.generation4.maternalLine.length < 8) {
    result.generation4.maternalLine.push('');
  }

  // Assign generation 5 - use the split arrays
  result.generation5.paternalLine = gen5PaternalNames.slice(0, 16);
  result.generation5.maternalLine = gen5MaternalNames.slice(0, 16);
  while (result.generation5.paternalLine.length < 16) {
    result.generation5.paternalLine.push('');
  }
  while (result.generation5.maternalLine.length < 16) {
    result.generation5.maternalLine.push('');
  }

  console.log('✅ [Pedigree Parser] Parsing complete\n');

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
