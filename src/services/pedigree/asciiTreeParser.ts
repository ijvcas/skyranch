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

interface TreeNode {
  name: string;
  level: number;
  index: number;
}

const cleanAncestorName = (rawLine: string): string => {
  return rawLine
    .replace(/[┌│└─├┤┬┴┼╭╮╯╰]/g, '') // Remove box-drawing characters
    .replace(/^\s*[-•*>]+\s*/, '') // Remove bullets and arrows
    .trim()
    .replace(/\s+/g, ' '); // Normalize spaces
};

const getIndentationLevel = (line: string): number => {
  const match = line.match(/^(\s*)/);
  return match ? match[1].length : 0;
};

const isSubjectLine = (line: string): boolean => {
  const cleaned = cleanAncestorName(line);
  // The subject animal is typically the longest line or has specific markers
  // For now, we'll identify it as a line that's not heavily indented
  return cleaned.length > 0 && getIndentationLevel(line) < 4;
};

export const parseASCIITreePedigree = (text: string): ParsedPedigree | null => {
  if (!text || text.trim().length === 0) {
    return null;
  }

  const lines = text.split('\n');
  const nodes: TreeNode[] = [];
  let subjectIndex = -1;
  let minIndent = Infinity;

  console.log('🌳 [ASCII Tree Parser] Starting parse...');

  // First pass: identify all nodes and their indentation levels
  lines.forEach((line, idx) => {
    const cleaned = cleanAncestorName(line);
    
    if (!cleaned || cleaned.length < 2) return;
    
    // Skip common header lines
    const lower = cleaned.toLowerCase();
    if (
      lower.includes('pedigree') ||
      lower.includes('généalogie') ||
      lower.includes('árbol genealógico') ||
      lower.includes('ueln:') ||
      lower === 'père' ||
      lower === 'mère' ||
      lower === 'father' ||
      lower === 'mother'
    ) {
      return;
    }

    const indent = getIndentationLevel(line);
    minIndent = Math.min(minIndent, indent);

    nodes.push({
      name: cleaned,
      level: indent,
      index: idx,
    });
  });

  if (nodes.length === 0) {
    console.error('❌ [ASCII Tree Parser] No valid nodes found');
    return null;
  }

  console.log(`📊 [ASCII Tree Parser] Found ${nodes.length} nodes`);

  // Normalize indentation levels to generations
  // The subject is the least indented or the middle node
  const levelCounts = new Map<number, number>();
  nodes.forEach(node => {
    levelCounts.set(node.level, (levelCounts.get(node.level) || 0) + 1);
  });

  // Find the subject (typically the line with minimum indentation or specific pattern)
  // In ASCII tree format, the subject is usually in the middle or has minimal indent
  const middleIdx = Math.floor(nodes.length / 2);
  subjectIndex = nodes.findIndex(n => n.level === minIndent) || middleIdx;

  console.log(`🎯 [ASCII Tree Parser] Subject identified at index ${subjectIndex}: "${nodes[subjectIndex]?.name}"`);

  // Split nodes into paternal (before subject) and maternal (after subject)
  const paternalNodes = nodes.slice(0, subjectIndex);
  const maternalNodes = nodes.slice(subjectIndex + 1);

  console.log(`🔵 Paternal nodes: ${paternalNodes.length}`);
  console.log(`🔴 Maternal nodes: ${maternalNodes.length}`);

  const result: ParsedPedigree = {
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

  // Generation 1: Direct parents
  // Father is the last paternal node (closest to subject)
  // Mother is the first maternal node (closest to subject)
  if (paternalNodes.length > 0) {
    result.generation1.father = paternalNodes[paternalNodes.length - 1].name;
    console.log(`✅ Gen 1 Father: "${result.generation1.father}"`);
  }
  
  if (maternalNodes.length > 0) {
    result.generation1.mother = maternalNodes[0].name;
    console.log(`✅ Gen 1 Mother: "${result.generation1.mother}"`);
  }

  // For a proper 5-generation pedigree tree:
  // Gen 1: 2 ancestors (1 paternal + 1 maternal)
  // Gen 2: 4 ancestors (2 paternal + 2 maternal)
  // Gen 3: 8 ancestors (4 paternal + 4 maternal)
  // Gen 4: 16 ancestors (8 paternal + 8 maternal)
  // Gen 5: 32 ancestors (16 paternal + 16 maternal)

  // Total paternal side: 1 + 2 + 4 + 8 + 16 = 31
  // Total maternal side: 1 + 2 + 4 + 8 + 16 = 31

  // Extract generations from paternal side (excluding Gen 1 father)
  const paternalAncestors = paternalNodes.slice(0, -1); // Remove the father (last node)
  
  // Extract generations from maternal side (excluding Gen 1 mother)
  const maternalAncestors = maternalNodes.slice(1); // Remove the mother (first node)

  // Generation 2: Grandparents (2 from each side)
  // Paternal grandparents are the last 2 of paternal ancestors
  const paternalGen2 = paternalAncestors.slice(-2);
  if (paternalGen2.length >= 1) result.generation2.paternalGrandfather = paternalGen2[paternalGen2.length - 1].name;
  if (paternalGen2.length >= 2) result.generation2.paternalGrandmother = paternalGen2[paternalGen2.length - 2].name;
  
  // Maternal grandparents are the first 2 of maternal ancestors
  const maternalGen2 = maternalAncestors.slice(0, 2);
  if (maternalGen2.length >= 1) result.generation2.maternalGrandfather = maternalGen2[0].name;
  if (maternalGen2.length >= 2) result.generation2.maternalGrandmother = maternalGen2[1].name;

  console.log(`✅ Gen 2 Complete: P.GF="${result.generation2.paternalGrandfather}", P.GM="${result.generation2.paternalGrandmother}", M.GF="${result.generation2.maternalGrandfather}", M.GM="${result.generation2.maternalGrandmother}"`);

  // Generation 3: Great-grandparents (4 from each side)
  const paternalGen3 = paternalAncestors.slice(-6, -2); // 4 ancestors before Gen 2
  const maternalGen3 = maternalAncestors.slice(2, 6); // 4 ancestors after Gen 2
  
  result.generation3 = [
    ...paternalGen3.map(n => n.name),
    ...maternalGen3.map(n => n.name),
  ];
  
  while (result.generation3.length < 8) result.generation3.push('');
  result.generation3 = result.generation3.slice(0, 8);

  console.log(`✅ Gen 3: ${result.generation3.filter(n => n).length}/8 names`);

  // Generation 4: Great-great-grandparents (8 from each side)
  const paternalGen4 = paternalAncestors.slice(-14, -6); // 8 ancestors before Gen 3
  const maternalGen4 = maternalAncestors.slice(6, 14); // 8 ancestors after Gen 3

  result.generation4.paternalLine = paternalGen4.map(n => n.name);
  result.generation4.maternalLine = maternalGen4.map(n => n.name);
  
  while (result.generation4.paternalLine.length < 8) result.generation4.paternalLine.push('');
  while (result.generation4.maternalLine.length < 8) result.generation4.maternalLine.push('');
  
  result.generation4.paternalLine = result.generation4.paternalLine.slice(0, 8);
  result.generation4.maternalLine = result.generation4.maternalLine.slice(0, 8);

  console.log(`✅ Gen 4: ${result.generation4.paternalLine.filter(n => n).length}/8 paternal, ${result.generation4.maternalLine.filter(n => n).length}/8 maternal`);

  // Generation 5: Great-great-great-grandparents (16 from each side)
  const paternalGen5 = paternalAncestors.slice(0, -14); // Remaining paternal ancestors
  const maternalGen5 = maternalAncestors.slice(14); // Remaining maternal ancestors

  result.generation5.paternalLine = paternalGen5.map(n => n.name);
  result.generation5.maternalLine = maternalGen5.map(n => n.name);
  
  while (result.generation5.paternalLine.length < 16) result.generation5.paternalLine.push('');
  while (result.generation5.maternalLine.length < 16) result.generation5.maternalLine.push('');
  
  result.generation5.paternalLine = result.generation5.paternalLine.slice(0, 16);
  result.generation5.maternalLine = result.generation5.maternalLine.slice(0, 16);

  console.log(`✅ Gen 5: ${result.generation5.paternalLine.filter(n => n).length}/16 paternal, ${result.generation5.maternalLine.filter(n => n).length}/16 maternal`);

  console.log('✅ [ASCII Tree Parser] Parsing complete\n');

  return result;
};

export const mapPedigreeToFields = (parsed: ParsedPedigree): Record<string, string> => {
  const mapping: Record<string, string> = {};

  // Generation 1
  if (parsed.generation1.father) mapping['father_id'] = parsed.generation1.father;
  if (parsed.generation1.mother) mapping['mother_id'] = parsed.generation1.mother;

  // Generation 2
  if (parsed.generation2.paternalGrandfather) mapping['paternal_grandfather_id'] = parsed.generation2.paternalGrandfather;
  if (parsed.generation2.paternalGrandmother) mapping['paternal_grandmother_id'] = parsed.generation2.paternalGrandmother;
  if (parsed.generation2.maternalGrandfather) mapping['maternal_grandfather_id'] = parsed.generation2.maternalGrandfather;
  if (parsed.generation2.maternalGrandmother) mapping['maternal_grandmother_id'] = parsed.generation2.maternalGrandmother;

  // Generation 3
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

  // Generation 4 - Paternal
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

  // Generation 4 - Maternal
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

  // Generation 5 - Paternal
  for (let i = 0; i < 16; i++) {
    const name = parsed.generation5.paternalLine[i];
    if (name) {
      mapping[`gen5_paternal_${i + 1}`] = name;
    }
  }

  // Generation 5 - Maternal
  for (let i = 0; i < 16; i++) {
    const name = parsed.generation5.maternalLine[i];
    if (name) {
      mapping[`gen5_maternal_${i + 1}`] = name;
    }
  }

  return mapping;
};
