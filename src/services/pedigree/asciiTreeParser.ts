/**
 * ASCII Tree Pedigree Parser - Complete Rewrite
 * Handles format where subject is in the middle, father's lineage above, mother's below
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

const cleanAncestorName = (line: string): string => {
  return line
    .replace(/[┌│└├─┤┬┴┼╭╮╯╰]/g, '')
    .replace(/^\s*[•►\-]+\s*/, '')
    .trim()
    .replace(/\s+/g, ' ');
};

const getIndentLevel = (line: string): number => {
  const match = line.match(/^(\s*)/);
  return match ? match[1].length : 0;
};

export const parseASCIITreePedigree = (text: string): ParsedPedigree | null => {
  try {
    const lines = text.split('\n');
    
    // Find subject line (contains breed info in parentheses)
    const subjectIdx = lines.findIndex(line => 
      line.includes('(') && line.includes(')') && 
      (line.toLowerCase().includes('baudet') || line.toLowerCase().includes('mâle') || 
       line.toLowerCase().includes('male') || line.toLowerCase().includes('hembra'))
    );
    
    if (subjectIdx === -1) {
      console.error('❌ Could not find subject line');
      return null;
    }
    
    console.log('✅ Subject at line', subjectIdx);
    
    // Extract father's lineage (above subject) and mother's (below)
    const fatherLines = lines.slice(0, subjectIdx).map(cleanAncestorName).filter(n => n && !n.includes('UELN:'));
    const motherLines = lines.slice(subjectIdx + 2).map(cleanAncestorName).filter(n => n && !n.includes('UELN:'));
    
    console.log('📊 Father nodes:', fatherLines.length, '| Mother nodes:', motherLines.length);
    
    const parsed: ParsedPedigree = {
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
      generation4: { paternalLine: Array(16).fill(''), maternalLine: Array(16).fill('') },
      generation5: { paternalLine: Array(32).fill(''), maternalLine: Array(32).fill('') }
    };
    
    // Gen 1: Father is last of father lines, Mother is first of mother lines
    if (fatherLines.length > 0) parsed.generation1.father = fatherLines[fatherLines.length - 1];
    if (motherLines.length > 0) parsed.generation1.mother = motherLines[0];
    
    // Gen 2: Grandparents (2 from each side, closest to Gen 1)
    if (fatherLines.length >= 3) {
      parsed.generation2.paternalGrandfather = fatherLines[fatherLines.length - 2];
      parsed.generation2.paternalGrandmother = fatherLines[fatherLines.length - 3];
    }
    if (motherLines.length >= 3) {
      parsed.generation2.maternalGrandfather = motherLines[1];
      parsed.generation2.maternalGrandmother = motherLines[2];
    }
    
    // Gen 3: Great-grandparents (4 from each side)
    const fatherGen3Start = Math.max(0, fatherLines.length - 7);
    const fatherGen3 = fatherLines.slice(fatherGen3Start, fatherLines.length - 3);
    if (fatherGen3.length >= 4) {
      parsed.generation3.paternalGreatGrandfatherFather = fatherGen3[fatherGen3.length - 4];
      parsed.generation3.paternalGreatGrandmotherFather = fatherGen3[fatherGen3.length - 3];
      parsed.generation3.paternalGreatGrandfatherMother = fatherGen3[fatherGen3.length - 2];
      parsed.generation3.paternalGreatGrandmotherMother = fatherGen3[fatherGen3.length - 1];
    }
    
    const motherGen3 = motherLines.slice(3, 7);
    if (motherGen3.length >= 4) {
      parsed.generation3.maternalGreatGrandfatherFather = motherGen3[0];
      parsed.generation3.maternalGreatGrandmotherFather = motherGen3[1];
      parsed.generation3.maternalGreatGrandfatherMother = motherGen3[2];
      parsed.generation3.maternalGreatGrandmotherMother = motherGen3[3];
    }
    
    // Gen 4 & 5: Remaining ancestors
    const fatherRemaining = fatherLines.slice(0, fatherGen3Start);
    const motherRemaining = motherLines.slice(7);
    
    parsed.generation4.paternalLine = fatherRemaining.slice(-8);
    parsed.generation4.maternalLine = motherRemaining.slice(0, 8);
    
    parsed.generation5.paternalLine = fatherRemaining.slice(0, -8);
    parsed.generation5.maternalLine = motherRemaining.slice(8, 24);
    
    console.log('✅ Parse complete - Total:', 
      [parsed.generation1.father, parsed.generation1.mother].filter(Boolean).length + 
      Object.values(parsed.generation2).filter(Boolean).length +
      Object.values(parsed.generation3).filter(Boolean).length +
      parsed.generation4.paternalLine.filter(Boolean).length +
      parsed.generation4.maternalLine.filter(Boolean).length +
      parsed.generation5.paternalLine.filter(Boolean).length +
      parsed.generation5.maternalLine.filter(Boolean).length
    );
    
    return parsed;
  } catch (error) {
    console.error('❌ Parser error:', error);
    return null;
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
  
  if (parsed.generation3.paternalGreatGrandfatherFather) fields['paternal_great_grandfather_father_id'] = parsed.generation3.paternalGreatGrandfatherFather;
  if (parsed.generation3.paternalGreatGrandmotherFather) fields['paternal_great_grandmother_father_id'] = parsed.generation3.paternalGreatGrandmotherFather;
  if (parsed.generation3.paternalGreatGrandfatherMother) fields['paternal_great_grandfather_mother_id'] = parsed.generation3.paternalGreatGrandfatherMother;
  if (parsed.generation3.paternalGreatGrandmotherMother) fields['paternal_great_grandmother_mother_id'] = parsed.generation3.paternalGreatGrandmotherMother;
  if (parsed.generation3.maternalGreatGrandfatherFather) fields['maternal_great_grandfather_father_id'] = parsed.generation3.maternalGreatGrandfatherFather;
  if (parsed.generation3.maternalGreatGrandmotherFather) fields['maternal_great_grandmother_father_id'] = parsed.generation3.maternalGreatGrandmotherFather;
  if (parsed.generation3.maternalGreatGrandfatherMother) fields['maternal_great_grandfather_mother_id'] = parsed.generation3.maternalGreatGrandfatherMother;
  if (parsed.generation3.maternalGreatGrandmotherMother) fields['maternal_great_grandmother_mother_id'] = parsed.generation3.maternalGreatGrandmotherMother;
  
  parsed.generation4.paternalLine.forEach((name, idx) => { if (name) fields[`chozno_${idx + 1}_paternal`] = name; });
  parsed.generation4.maternalLine.forEach((name, idx) => { if (name) fields[`chozno_${idx + 1}_maternal`] = name; });
  parsed.generation5.paternalLine.forEach((name, idx) => { if (name) fields[`atchozno_${idx + 1}_paternal`] = name; });
  parsed.generation5.maternalLine.forEach((name, idx) => { if (name) fields[`atchozno_${idx + 1}_maternal`] = name; });
  
  return fields;
};
