/**
 * Pedigree Parser - Supports both Table Format (PDF) and ASCII Tree
 * Table Format: Horizontal rows with | separators, 5 columns (Gen5|Gen4|Gen3|Gen2|Gen1)
 * ASCII Tree: Indented tree structure with subject in middle
 */

export interface ParsedPedigree {
  generation1: {
    father: string;
    mother: string;
  };
  generation2: {
    paternalGrandfather: string;
    paternalGrandmother: string;
    maternalGrandfather: string;
    maternalGrandmother: string;
  };
  generation3: {
    paternalGreatGrandfatherFather: string;
    paternalGreatGrandmotherFather: string;
    paternalGreatGrandfatherMother: string;
    paternalGreatGrandmotherMother: string;
    maternalGreatGrandfatherFather: string;
    maternalGreatGrandmotherFather: string;
    maternalGreatGrandfatherMother: string;
    maternalGreatGrandmotherMother: string;
  };
  generation4: {
    paternalLine: string[];
    maternalLine: string[];
  };
  generation5: {
    paternalLine: string[];
    maternalLine: string[];
  };
}

interface TreeNode {
  name: string;
  lineIndex: number;
  indentLevel: number;
}

const cleanAncestorName = (text: string): string => {
  // Remove box-drawing characters
  let cleaned = text.replace(/[┌│└├─┤┬┴┼╭╮╯╰]/g, '').trim();
  
  // Remove UELN identifier and everything after it
  cleaned = cleaned.replace(/UELN:\s*\S+.*$/g, '').trim();
  
  // Remove breed codes and years: "NAME BDP, YEAR" → "NAME"
  cleaned = cleaned.replace(/\s+BDP,?\s*\d{4}?/g, '').trim();
  
  // Remove just year: "NAME, YEAR" → "NAME"
  cleaned = cleaned.replace(/,\s*\d{4}$/g, '').trim();
  
  // Remove just BDP at end
  cleaned = cleaned.replace(/\s+BDP$/g, '').trim();
  
  return cleaned.replace(/\s+/g, ' ').trim();
};

const detectFormat = (text: string): 'table' | 'tree' => {
  const lines = text.split('\n').filter(l => l.trim());
  
  // Count lines with multiple | separators (table format indicator)
  const pipeLines = lines.filter(l => (l.match(/\|/g) || []).length >= 3).length;
  
  // If more than 50% of lines have pipes, it's a table
  if (pipeLines > lines.length * 0.3) {
    console.log('🔍 Detected: TABLE format');
    return 'table';
  }
  
  console.log('🔍 Detected: TREE format');
  return 'tree';
};

const getIndentLevel = (line: string): number => {
  const match = line.match(/^(\s*)/);
  return match ? match[1].length : 0;
};

const isSubjectLine = (line: string): boolean => {
  // Subject line contains breed info in parentheses
  return /\([^)]*(?:Baudet|Cheval|Âne|Poney|Horse|Mâle|Male|Hembra|Female)[^)]*\)/i.test(line);
};

/**
 * Parse TABLE format pedigree (from PDF)
 * Each row has 5 columns: Gen5 | Gen4 | Gen3 | Gen2 | Gen1
 * Subject row contains breed info, 8 rows above = paternal, 8 rows below = maternal
 */
const parseTablePedigree = (text: string): ParsedPedigree | null => {
  try {
    const lines = text.split('\n').filter(l => l.trim());
    console.log('📊 TABLE Parser - Total lines:', lines.length);
    
    // Find subject line (contains breed info like "Baudet Du Poitou, Male")
    let subjectIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (isSubjectLine(lines[i])) {
        subjectIdx = i;
        console.log('🎯 Subject at line:', i + 1);
        break;
      }
    }
    
    if (subjectIdx === -1) {
      console.error('❌ No subject line found');
      return null;
    }
    
    // Get 8 rows above (paternal) and 8 rows below (maternal)
    const paternalRows = lines.slice(Math.max(0, subjectIdx - 8), subjectIdx);
    const maternalRows = lines.slice(subjectIdx + 1, subjectIdx + 9);
    
    console.log('📊 Rows - Paternal:', paternalRows.length, 'Maternal:', maternalRows.length);
    
    const result: ParsedPedigree = {
      generation1: { father: '', mother: '' },
      generation2: {
        paternalGrandfather: '',
        paternalGrandmother: '',
        maternalGrandfather: '',
        maternalGrandmother: ''
      },
      generation3: {
        paternalGreatGrandfatherFather: '',
        paternalGreatGrandmotherFather: '',
        paternalGreatGrandfatherMother: '',
        paternalGreatGrandmotherMother: '',
        maternalGreatGrandfatherFather: '',
        maternalGreatGrandmotherFather: '',
        maternalGreatGrandfatherMother: '',
        maternalGreatGrandmotherMother: ''
      },
      generation4: { paternalLine: [], maternalLine: [] },
      generation5: { paternalLine: [], maternalLine: [] }
    };
    
    // Parse each paternal row: Gen5 | Gen4 | Gen3 | Gen2 | Gen1
    paternalRows.forEach((row, idx) => {
      const cells = row.split('|').map(c => cleanAncestorName(c)).filter(c => c.length > 1);
      console.log(`  P-Row ${idx}:`, cells.length, 'cells');
      
      if (cells.length >= 5) {
        const gen5 = cells[0];
        const gen4 = cells[1];
        const gen3 = cells[2];
        const gen2 = cells[3];
        const gen1 = cells[4];
        
        // Gen 1: Only first row has father
        if (idx === 0 && gen1) result.generation1.father = gen1;
        
        // Gen 2: First 2 rows
        if (idx === 0 && gen2) result.generation2.paternalGrandfather = gen2;
        if (idx === 1 && gen2) result.generation2.paternalGrandmother = gen2;
        
        // Gen 3: First 4 rows
        if (idx === 0 && gen3) result.generation3.paternalGreatGrandfatherFather = gen3;
        if (idx === 1 && gen3) result.generation3.paternalGreatGrandmotherFather = gen3;
        if (idx === 2 && gen3) result.generation3.paternalGreatGrandfatherMother = gen3;
        if (idx === 3 && gen3) result.generation3.paternalGreatGrandmotherMother = gen3;
        
        // Gen 4: All 8 rows
        if (gen4) result.generation4.paternalLine.push(gen4);
        
        // Gen 5: All 8 rows
        if (gen5) result.generation5.paternalLine.push(gen5);
      }
    });
    
    // Parse each maternal row
    maternalRows.forEach((row, idx) => {
      const cells = row.split('|').map(c => cleanAncestorName(c)).filter(c => c.length > 1);
      console.log(`  M-Row ${idx}:`, cells.length, 'cells');
      
      if (cells.length >= 5) {
        const gen5 = cells[0];
        const gen4 = cells[1];
        const gen3 = cells[2];
        const gen2 = cells[3];
        const gen1 = cells[4];
        
        // Gen 1: Only first row has mother
        if (idx === 0 && gen1) result.generation1.mother = gen1;
        
        // Gen 2: First 2 rows
        if (idx === 0 && gen2) result.generation2.maternalGrandfather = gen2;
        if (idx === 1 && gen2) result.generation2.maternalGrandmother = gen2;
        
        // Gen 3: First 4 rows
        if (idx === 0 && gen3) result.generation3.maternalGreatGrandfatherFather = gen3;
        if (idx === 1 && gen3) result.generation3.maternalGreatGrandmotherFather = gen3;
        if (idx === 2 && gen3) result.generation3.maternalGreatGrandfatherMother = gen3;
        if (idx === 3 && gen3) result.generation3.maternalGreatGrandmotherMother = gen3;
        
        // Gen 4: All 8 rows
        if (gen4) result.generation4.maternalLine.push(gen4);
        
        // Gen 5: All 8 rows
        if (gen5) result.generation5.maternalLine.push(gen5);
      }
    });
    
    const totalFound = 
      (result.generation1.father ? 1 : 0) + 
      (result.generation1.mother ? 1 : 0) + 
      Object.values(result.generation2).filter(Boolean).length +
      Object.values(result.generation3).filter(Boolean).length +
      result.generation4.paternalLine.length +
      result.generation4.maternalLine.length +
      result.generation5.paternalLine.length +
      result.generation5.maternalLine.length;
    
    console.log('✅ TABLE Parse complete - Total ancestors:', totalFound);
    console.log('   Gen 1:', result.generation1.father ? '✓' : '✗', result.generation1.mother ? '✓' : '✗');
    console.log('   Gen 2:', Object.values(result.generation2).filter(Boolean).length, '/ 4');
    console.log('   Gen 3:', Object.values(result.generation3).filter(Boolean).length, '/ 8');
    console.log('   Gen 4:', result.generation4.paternalLine.length, '+', result.generation4.maternalLine.length, '/ 16');
    console.log('   Gen 5:', result.generation5.paternalLine.length, '+', result.generation5.maternalLine.length, '/ 32');
    
    return result;
  } catch (error) {
    console.error('❌ TABLE Parser error:', error);
    return null;
  }
};

/**
 * Parse ASCII tree pedigree
 * Strategy: Find subject, split paternal/maternal, group by indent level
 */
const parseTreePedigree = (text: string): ParsedPedigree | null => {
  try {
    const lines = text.split('\n');
    console.log('📄 Total lines:', lines.length);
    
    // Find subject line
    let subjectIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (isSubjectLine(lines[i])) {
        subjectIdx = i;
        console.log('🎯 Subject at line:', i + 1, ':', lines[i].substring(0, 50));
        break;
      }
    }
    
    if (subjectIdx === -1) {
      console.error('❌ No subject line found (looking for breed info in parentheses)');
      return null;
    }
    
    // Split paternal (above) and maternal (below)
    const paternalLines = lines.slice(0, subjectIdx);
    const maternalLines = lines.slice(subjectIdx + 1);
    
    console.log('📊 Lines - Paternal:', paternalLines.length, 'Maternal:', maternalLines.length);
    
    // Extract nodes with indent levels
    const extractNodes = (lineArray: string[]): TreeNode[] => {
      const nodes: TreeNode[] = [];
      lineArray.forEach((line, idx) => {
        const cleaned = cleanAncestorName(line);
        if (cleaned && cleaned.length > 2 && !line.includes('UELN:')) {
          nodes.push({
            name: cleaned,
            lineIndex: idx,
            indentLevel: getIndentLevel(line)
          });
        }
      });
      return nodes;
    };
    
    let paternalNodes = extractNodes(paternalLines);
    let maternalNodes = extractNodes(maternalLines);
    
    console.log('👥 Nodes - Paternal:', paternalNodes.length, 'Maternal:', maternalNodes.length);
    
    // Sort by indent level (descending - highest indent first = Gen 1)
    paternalNodes.sort((a, b) => b.indentLevel - a.indentLevel);
    maternalNodes.sort((a, b) => b.indentLevel - a.indentLevel);
    
    // Group by unique indent levels
    const groupByIndent = (nodes: TreeNode[]): Map<number, TreeNode[]> => {
      const map = new Map<number, TreeNode[]>();
      nodes.forEach(node => {
        if (!map.has(node.indentLevel)) {
          map.set(node.indentLevel, []);
        }
        map.get(node.indentLevel)!.push(node);
      });
      return map;
    };
    
    const paternalGroups = groupByIndent(paternalNodes);
    const maternalGroups = groupByIndent(maternalNodes);
    
    // Get indent levels sorted descending (highest first)
    const paternalLevels = Array.from(paternalGroups.keys()).sort((a, b) => b - a);
    const maternalLevels = Array.from(maternalGroups.keys()).sort((a, b) => b - a);
    
    console.log('📈 Paternal indent levels:', paternalLevels, 'counts:', paternalLevels.map(l => paternalGroups.get(l)?.length));
    console.log('📈 Maternal indent levels:', maternalLevels, 'counts:', maternalLevels.map(l => maternalGroups.get(l)?.length));
    
    const result: ParsedPedigree = {
      generation1: { father: '', mother: '' },
      generation2: {
        paternalGrandfather: '',
        paternalGrandmother: '',
        maternalGrandfather: '',
        maternalGrandmother: ''
      },
      generation3: {
        paternalGreatGrandfatherFather: '',
        paternalGreatGrandmotherFather: '',
        paternalGreatGrandfatherMother: '',
        paternalGreatGrandmotherMother: '',
        maternalGreatGrandfatherFather: '',
        maternalGreatGrandmotherFather: '',
        maternalGreatGrandfatherMother: '',
        maternalGreatGrandmotherMother: ''
      },
      generation4: { paternalLine: [], maternalLine: [] },
      generation5: { paternalLine: [], maternalLine: [] }
    };
    
    // Assign paternal generations (highest indent = Gen 1, lowest = Gen 5)
    if (paternalLevels[0]) {
      const gen1 = paternalGroups.get(paternalLevels[0]) || [];
      if (gen1.length > 0) result.generation1.father = gen1[0].name;
    }
    
    if (paternalLevels[1]) {
      const gen2 = paternalGroups.get(paternalLevels[1]) || [];
      if (gen2.length >= 1) result.generation2.paternalGrandfather = gen2[0].name;
      if (gen2.length >= 2) result.generation2.paternalGrandmother = gen2[1].name;
    }
    
    if (paternalLevels[2]) {
      const gen3 = paternalGroups.get(paternalLevels[2]) || [];
      if (gen3.length >= 1) result.generation3.paternalGreatGrandfatherFather = gen3[0].name;
      if (gen3.length >= 2) result.generation3.paternalGreatGrandmotherFather = gen3[1].name;
      if (gen3.length >= 3) result.generation3.paternalGreatGrandfatherMother = gen3[2].name;
      if (gen3.length >= 4) result.generation3.paternalGreatGrandmotherMother = gen3[3].name;
    }
    
    if (paternalLevels[3]) {
      const gen4 = paternalGroups.get(paternalLevels[3]) || [];
      result.generation4.paternalLine = gen4.slice(0, 8).map(n => n.name);
    }
    
    if (paternalLevels[4]) {
      const gen5 = paternalGroups.get(paternalLevels[4]) || [];
      result.generation5.paternalLine = gen5.slice(0, 16).map(n => n.name);
    }
    
    // Assign maternal generations (highest indent = Gen 1, lowest = Gen 5)
    if (maternalLevels[0]) {
      const gen1 = maternalGroups.get(maternalLevels[0]) || [];
      if (gen1.length > 0) result.generation1.mother = gen1[0].name;
    }
    
    if (maternalLevels[1]) {
      const gen2 = maternalGroups.get(maternalLevels[1]) || [];
      if (gen2.length >= 1) result.generation2.maternalGrandfather = gen2[0].name;
      if (gen2.length >= 2) result.generation2.maternalGrandmother = gen2[1].name;
    }
    
    if (maternalLevels[2]) {
      const gen3 = maternalGroups.get(maternalLevels[2]) || [];
      if (gen3.length >= 1) result.generation3.maternalGreatGrandfatherFather = gen3[0].name;
      if (gen3.length >= 2) result.generation3.maternalGreatGrandmotherFather = gen3[1].name;
      if (gen3.length >= 3) result.generation3.maternalGreatGrandfatherMother = gen3[2].name;
      if (gen3.length >= 4) result.generation3.maternalGreatGrandmotherMother = gen3[3].name;
    }
    
    if (maternalLevels[3]) {
      const gen4 = maternalGroups.get(maternalLevels[3]) || [];
      result.generation4.maternalLine = gen4.slice(0, 8).map(n => n.name);
    }
    
    if (maternalLevels[4]) {
      const gen5 = maternalGroups.get(maternalLevels[4]) || [];
      result.generation5.maternalLine = gen5.slice(0, 16).map(n => n.name);
    }
    
    const totalFound = 
      (result.generation1.father ? 1 : 0) + 
      (result.generation1.mother ? 1 : 0) + 
      Object.values(result.generation2).filter(Boolean).length +
      Object.values(result.generation3).filter(Boolean).length +
      result.generation4.paternalLine.filter(Boolean).length +
      result.generation4.maternalLine.filter(Boolean).length +
      result.generation5.paternalLine.filter(Boolean).length +
      result.generation5.maternalLine.filter(Boolean).length;
    
    console.log('✅ TREE Parse complete - Total ancestors found:', totalFound);
    console.log('   Gen 1:', result.generation1.father ? 'Father ✓' : '', result.generation1.mother ? 'Mother ✓' : '');
    console.log('   Gen 2:', Object.values(result.generation2).filter(Boolean).length, '/ 4');
    console.log('   Gen 3:', Object.values(result.generation3).filter(Boolean).length, '/ 8');
    console.log('   Gen 4:', result.generation4.paternalLine.filter(Boolean).length, '+', result.generation4.maternalLine.filter(Boolean).length, '/ 16');
    console.log('   Gen 5:', result.generation5.paternalLine.filter(Boolean).length, '+', result.generation5.maternalLine.filter(Boolean).length, '/ 32');
    
    return result;
  } catch (error) {
    console.error('❌ TREE Parser error:', error);
    return null;
  }
};

/**
 * Main parser - Auto-detects format and routes to appropriate parser
 */
export const parseASCIITreePedigree = (text: string): ParsedPedigree | null => {
  const format = detectFormat(text);
  
  if (format === 'table') {
    return parseTablePedigree(text);
  } else {
    return parseTreePedigree(text);
  }
};

export const mapPedigreeToFields = (parsed: ParsedPedigree): Record<string, string> => {
  const fields: Record<string, string> = {};
  
  if (parsed.generation1.father) fields['father_id'] = parsed.generation1.father;
  if (parsed.generation1.mother) fields['mother_id'] = parsed.generation1.mother;
  
  if (parsed.generation2.paternalGrandfather) fields['paternal_grandfather_id'] = parsed.generation2.paternalGrandfather;
  if (parsed.generation2.paternalGrandmother) fields['paternal_grandmother_id'] = parsed.generation2.paternalGrandmother;
  if (parsed.generation2.maternalGrandfather) fields['maternal_grandfather_id'] = parsed.generation2.maternalGrandfather;
  if (parsed.generation2.maternalGrandmother) fields['maternal_grandmother_id'] = parsed.generation2.maternalGrandmother;
  
  if (parsed.generation3.paternalGreatGrandfatherFather) fields['paternal_great_grandfather_paternal_id'] = parsed.generation3.paternalGreatGrandfatherFather;
  if (parsed.generation3.paternalGreatGrandmotherFather) fields['paternal_great_grandmother_paternal_id'] = parsed.generation3.paternalGreatGrandmotherFather;
  if (parsed.generation3.paternalGreatGrandfatherMother) fields['paternal_great_grandfather_maternal_id'] = parsed.generation3.paternalGreatGrandfatherMother;
  if (parsed.generation3.paternalGreatGrandmotherMother) fields['paternal_great_grandmother_maternal_id'] = parsed.generation3.paternalGreatGrandmotherMother;
  if (parsed.generation3.maternalGreatGrandfatherFather) fields['maternal_great_grandfather_paternal_id'] = parsed.generation3.maternalGreatGrandfatherFather;
  if (parsed.generation3.maternalGreatGrandmotherFather) fields['maternal_great_grandmother_paternal_id'] = parsed.generation3.maternalGreatGrandmotherFather;
  if (parsed.generation3.maternalGreatGrandfatherMother) fields['maternal_great_grandfather_maternal_id'] = parsed.generation3.maternalGreatGrandfatherMother;
  if (parsed.generation3.maternalGreatGrandmotherMother) fields['maternal_great_grandmother_maternal_id'] = parsed.generation3.maternalGreatGrandmotherMother;
  
  // Gen 4 mapping - use proper field names matching database schema
  const gen4Fields = [
    'ggggf_p', 'ggggm_p', 'gggmf_p', 'gggmm_p',
    'ggfgf_p', 'ggfgm_p', 'ggmgf_p', 'ggmgm_p'
  ];
  parsed.generation4.paternalLine.forEach((name, idx) => { 
    if (name && gen4Fields[idx]) fields[`gen4_paternal_${gen4Fields[idx]}`] = name; 
  });
  
  const gen4MaternalFields = [
    'ggggf_m', 'ggggm_m', 'gggmf_m', 'gggmm_m',
    'ggfgf_m', 'ggfgm_m', 'ggmgf_m', 'ggmgm_m'
  ];
  parsed.generation4.maternalLine.forEach((name, idx) => { 
    if (name && gen4MaternalFields[idx]) fields[`gen4_maternal_${gen4MaternalFields[idx]}`] = name; 
  });
  parsed.generation5.paternalLine.forEach((name, idx) => { 
    if (name) fields[`gen5_paternal_${idx + 1}`] = name; 
  });
  parsed.generation5.maternalLine.forEach((name, idx) => { 
    if (name) fields[`gen5_maternal_${idx + 1}`] = name; 
  });
  
  return fields;
};
