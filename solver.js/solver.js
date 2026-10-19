/**
 * NEET Practice Solver – physics question solver
 * Exports: solveQuestion(question)
 */

/**
 * Attempt to parse a number (possibly decimal) with optional SI unit suffix.
 * Returns { value, unit } or null.
 */
function parseNumberWithUnit(text) {
  const regex = /([+-]?\d+(?:\.\d+)?)\s*(?:T|m|m\/s|V|A|W|cm|Hz|Ω|kg|s|N|J|C|F|Hz|nm|kHz|MHz|GHz|rad|Ω|mT|mm|µm|µF|µC|nF|pF|dB|°C|K|Pa|atm|bar|cal|kcal|kJ|MJ|mA|µA|nA|pA|ms|µs|ns|ps|km|cm|mm|µm|nm|pm|Ω|kΩ|MΩ|GΩ|pF|nF|µF|mF|F|Hz|kHz|MHz|GHz|rad|rad\/s|rev\/min|rev\/s|l|mL|°C|°F|K|Pa|kPa|MPa|GPa|atm|bar|mbar|mmHg|inHg|cal|kcal|kJ|MJ|eV|keV|MeV|GeV|nm|µm|mm|cm|km|Å|pm|ps|ns|µs|ms|s|min|h|d|yr|AU|ly|pc)\b/gi;
  const matches = [];
  let m;
  while ((m = regex.exec(text)) !== null) {
    matches.push({ value: parseFloat(m[1]), unit: m[2].toLowerCase(), index: m.index });
  }
  return matches;
}

/**
 * Extract a single numeric value from text using regex patterns.
 */
function extractNumber(text, pattern) {
  const match = text.match(pattern);
  if (match) {
    return parseFloat(match[1]);
  }
  return null;
}

/**
 * Parse motional emf problem: emf = B * L * v
 * Look for B with units T, L with units m, v with units m/s
 */
function solveMotionalEmf(question) {
  const q = question.toLowerCase();
  
  // Check if it's about motional emf
  const emfKeywords = ['motional', 'emf', 'conductor moving', 'rod moving', 'wire moving', 'rail', 'motional emf'];
  const isMotional = emfKeywords.some(kw => q.includes(kw));
  if (!isMotional) return null;

  // Parse B (magnetic field) in Tesla
  const bMatch = question.match(/(?:B|magnetic\s*field)\s*[=:]\s*([+-]?\d+(?:\.\d+)?)\s*(?:T|tesla)?/i);
  const bValue = bMatch ? parseFloat(bMatch[1]) : null;

  // Parse L (length) in meters
  const lMatch = question.match(/(?:L|length|len|length\s*of)\s*[=:]\s*([+-]?\d+(?:\.\d+)?)\s*(?:m|meter)?/i);
  const lValue = lMatch ? parseFloat(lMatch[1]) : null;

  // Parse v (velocity) in m/s
  const vMatch = question.match(/(?:v|velocity|speed|v\s*=\s*)\s*[=:]\s*([+-]?\d+(?:\.\d+)?)\s*(?:m\/s|m\s*s\*\*-1|metres\/second)?/i);
  const vValue = vMatch ? parseFloat(vMatch[1]) : null;

  if (bValue !== null && lValue !== null && vValue !== null) {
    const emf = bValue * lValue * vValue;
    return {
      status: 'success',
      answer: `${emf} V`,
      explanation: `Motional EMF formula: emf = B × L × v = ${bValue} T × ${lValue} m × ${vValue} m/s = ${emf} V`,
      confidence: 0.95
    };
  }

  return {
    status: 'needs_context',
    answer: null,
    explanation: 'Motional emf problem detected but missing required values. Need: magnetic field B (T), length L (m), and velocity v (m/s).',
    confidence: 0.3
  };
}

/**
 * Parse Ohm's law: V = I * R
 * When two values are clearly given, compute the third.
 */
function solveOhmsLaw(question) {
  const q = question.toLowerCase();
  
  const ohmKeywords = ["ohm's law", "ohm law", "ohm's", "v=ir", "v = i r", "voltage current resistance", 'v = i * r', 'v = ir'];
  const isOhmsLaw = ohmKeywords.some(kw => q.includes(kw));
  if (!isOhmsLaw) {
    // Also check if V, I, R appear in the question in an Ohm's law context
    const hasV = /\bV\b/.test(question) || /\bvoltage\b/i.test(question);
    const hasI = /\bI\b/.test(question) || /\bcurrent\b/i.test(question);
    const hasR = /\bR\b/.test(question) || /\bresistance\b/i.test(question);
    if (hasV && hasI && hasR) {
      // All three present, might not need solving
    } else if ((hasV || hasI || hasR)) {
      // One is present, might be Ohm's law
    } else {
      return null;
    }
  }

  // Parse V (voltage) in Volts
  const vMatch = question.match(/(?:V|voltage|v\s*=?\s*)\s*[=:]\s*([+-]?\d+(?:\.\d+)?)\s*(?:V|volt)?/i);
  const vValue = vMatch ? parseFloat(vMatch[1]) : null;

  // Parse I (current) in Amperes
  const iMatch = question.match(/(?:I|current|i\s*=?\s*)\s*[=:]\s*([+-]?\d+(?:\.\d+)?)\s*(?:A|ampere)?/i);
  const iValue = iMatch ? parseFloat(iMatch[1]) : null;

  // Parse R (resistance) in Ohms
  const rMatch = question.match(/(?:R|resistance|r\s*=?\s*)\s*[=:]\s*([+-]?\d+(?:\.\d+)?)\s*(?:\u03A9|ohm)?/i);
  const rValue = rMatch ? parseFloat(rMatch[1]) : null;

  const given = [];
  if (vValue !== null) given.push({ key: 'V', value: vValue });
  if (iValue !== null) given.push({ key: 'I', value: iValue });
  if (rValue !== null) given.push({ key: 'R', value: rValue });

  if (given.length === 2) {
    const v = given.find(g => g.key === 'V');
    const i = given.find(g => g.key === 'I');
    const r = given.find(g => g.key === 'R');

    if (i && r) {
      const computedV = i.value * r.value;
      return {
        status: 'success',
        answer: `${computedV} V`,
        explanation: `Ohm's Law: V = I × R = ${i.value} A × ${r.value} Ω = ${computedV} V`,
        confidence: 0.95
      };
    }
    if (v && i) {
      const computedR = v.value / i.value;
      return {
        status: 'success',
        answer: `${computedR} Ω`,
        explanation: `Ohm's Law: R = V / I = ${v.value} V / ${i.value} A = ${computedR} Ω`,
        confidence: 0.95
      };
    }
    if (v && r) {
      const computedI = v.value / r.value;
      return {
        status: 'success',
        answer: `${computedI} A`,
        explanation: `Ohm's Law: I = V / R = ${v.value} V / ${r.value} Ω = ${computedI} A`,
        confidence: 0.95
      };
    }
  }

  if (given.length === 3) {
    return {
      status: 'needs_context',
      answer: null,
      explanation: 'All three values (V, I, R) are given. Please specify which value to compute using V = IR.',
      confidence: 0.3
    };
  }

  return {
    status: 'needs_context',
    answer: null,
    explanation: 'Ohm\'s law detected but only ' + given.length + ' value(s) found. Need exactly 2 of: Voltage (V, V), Current (I, A), Resistance (R, Ω).',
    confidence: 0.3
  };
}

/**
 * Parse Electric Power: P = V * I
 */
function solveElectricPower(question) {
  const q = question.toLowerCase();
  
  const powerKeywords = ['electric power', 'power', 'p = vi', 'p = v * i', 'p = vi', 'power vi'];
  const isPower = powerKeywords.some(kw => q.includes(kw));
  if (!isPower) return null;

  // Parse V (voltage)
  const vMatch = question.match(/(?:V|voltage|v\s*=?\s*)\s*[=:]\s*([+-]?\d+(?:\.\d+)?)\s*(?:V|volt)?/i);
  const vValue = vMatch ? parseFloat(vMatch[1]) : null;

  // Parse I (current)
  const iMatch = question.match(/(?:I|current|i\s*=?\s*)\s*[=:]\s*([+-]?\d+(?:\.\d+)?)\s*(?:A|ampere)?/i);
  const iValue = iMatch ? parseFloat(iMatch[1]) : null;

  // Parse P (power)
  const pMatch = question.match(/(?:P|power|p\s*=?\s*)\s*[=:]\s*([+-]?\d+(?:\.\d+)?)\s*(?:W|watt)?/i);
  const pValue = pMatch ? parseFloat(pMatch[1]) : null;

  const given = [];
  if (vValue !== null) given.push({ key: 'V', value: vValue });
  if (iValue !== null) given.push({ key: 'I', value: iValue });
  if (pValue !== null) given.push({ key: 'P', value: pValue });

  if (vValue !== null && iValue !== null) {
    const computedP = vValue * iValue;
    return {
      status: 'success',
      answer: `${computedP} W`,
      explanation: `Electric Power: P = V × I = ${vValue} V × ${iValue} A = ${computedP} W`,
      confidence: 0.95
    };
  }

  if (vValue !== null && pValue !== null) {
    const computedI = pValue / vValue;
    return {
      status: 'success',
      answer: `${computedI} A`,
      explanation: `Electric Power: I = P / V = ${pValue} W / ${vValue} V = ${computedI} A`,
      confidence: 0.95
    };
  }

  if (iValue !== null && pValue !== null) {
    const computedV = pValue / iValue;
    return {
      status: 'success',
      answer: `${computedV} V`,
      explanation: `Electric Power: V = P / I = ${pValue} W / ${iValue} A = ${computedV} V`,
      confidence: 0.95
    };
  }

  return {
    status: 'needs_context',
    answer: null,
    explanation: 'Electric power problem detected but missing required values. Need V and I to find P, or P and one of V/I.',
    confidence: 0.3
  };
}

/**
 * Parse Lens Formula: 1/f = 1/v - 1/u
 * Only when signs and values are explicit
 */
function solveLensFormula(question) {
  const q = question.toLowerCase();
  
  const lensKeywords = ['lens formula', 'lens formula 1/f', 'thin lens', 'lensmaker', '1/f=1/v-1/u', '1/f = 1/v - 1/u'];
  const isLens = lensKeywords.some(kw => q.includes(kw));
  if (!isLens) return null;

  // Parse f (focal length) - must have sign
  const fMatch = question.match(/(?:f|focal\s*length)\s*[=:]\s*([+-]?\d+(?:\.\d+)?)\s*(?:cm|mm|m|focal)?/i);
  const fValue = fMatch ? parseFloat(fMatch[1]) : null;

  // Parse v (image distance) - must have sign
  const vMatch = question.match(/(?:v|image\s*distance|v\s*[=:])\s*[=:]\s*([+-]?\d+(?:\.\d+)?)\s*(?:cm|mm|m|image)?/i);
  const vValue = vMatch ? parseFloat(vMatch[1]) : null;

  // Parse u (object distance) - must have sign
  const uMatch = question.match(/(?:u|object\s*distance|u\s*[=:])\s*[=:]\s*([+-]?\d+(?:\.\d+)?)\s*(?:cm|mm|m|object)?/i);
  const uValue = uMatch ? parseFloat(uMatch[1]) : null;

  const given = [];
  if (fValue !== null) given.push({ key: 'f', value: fValue });
  if (vValue !== null) given.push({ key: 'v', value: vValue });
  if (uValue !== null) given.push({ key: 'u', value: uValue });

  // Only compute when signs and values are explicit (at least 2 of 3 with signs)
  if (given.length === 2) {
    const f = given.find(g => g.key === 'f');
    const v = given.find(g => g.key === 'v');
    const u = given.find(g => g.key === 'u');

    if (v && u && !f) {
      const oneOverF = 1 / v.value - 1 / u.value;
      const computedF = 1 / oneOverF;
      return {
        status: 'success',
        answer: `${computedF}`,
        explanation: `Lens Formula: 1/f = 1/v - 1/u → 1/f = 1/${v.value} - 1/${u.value} = ${oneOverF.toFixed(6)} → f = ${computedF.toFixed(4)}`,
        confidence: 0.9
      };
    }

    if (f && u && !v) {
      const oneOverV = 1 / f.value + 1 / u.value;
      const computedV = 1 / oneOverV;
      return {
        status: 'success',
        answer: `${computedV}`,
        explanation: `Lens Formula: 1/f = 1/v - 1/u → 1/v = 1/f + 1/u = 1/${f.value} + 1/${u.value} = ${oneOverV.toFixed(6)} → v = ${computedV.toFixed(4)}`,
        confidence: 0.9
      };
    }

    if (f && v && !u) {
      const oneOverU = 1 / v.value - 1 / f.value;
      const computedU = 1 / oneOverU;
      return {
        status: 'success',
        answer: `${computedU}`,
        explanation: `Lens Formula: 1/f = 1/v - 1/u → 1/u = 1/v - 1/f = 1/${v.value} - 1/${f.value} = ${oneOverU.toFixed(6)} → u = ${computedU.toFixed(4)}`,
        confidence: 0.9
      };
    }
  }

  if (given.length === 1) {
    return {
      status: 'needs_context',
      answer: null,
      explanation: `Lens formula detected but only ${given.length} value given (${given[0].key} = ${given[0].value}). Need at least 2 of: f (focal length), v (image distance), u (object distance) with explicit signs.`,
      confidence: 0.3
    };
  }

  return {
    status: 'needs_context',
    answer: null,
    explanation: 'Lens formula detected but values/signs are not explicit enough. Need at least 2 of: f, v, u with clear signs and units.',
    confidence: 0.3
  };
}

/**
 * Hückel's rule for aromaticity: 4n+2 π-electrons
 * Return needs_context unless molecule/ring electron count is stated
 */
function solveHuckelRule(question) {
  const q = question.toLowerCase();
  
  const huckelKeywords = ['hückel', "huckel's rule", "hückel's rule", "4n+2", " Huckel", ' Huckel', 'aromatic', 'hückel rule'];
  const isHuckel = huckelKeywords.some(kw => q.includes(kw));
  if (!isHuckel) return null;

  // Check if electron count or ring size is explicitly stated
  const piElectronMatch = question.match(/(\d+)\s*(?:π|pi|pi\s*electron|pi\s*electron\s*count|electron)\s*(?:count)?/i);
  const ringMatch = question.match(/(\d+)\s*(?:member\s*(?:ring|ring\s*size)|member\s*ring|ring\s*of\s*\d+\s*atoms|n=\s*\d)/i);
  const aromaticDirect = /\b(?:is\s+)?aromatic\b/i.test(question);
  const nonAromaticDirect = /\b(?:is\s+)?non\s*-?aromatic\b/i.test(question);

  if (piElectronMatch) {
    const piCount = parseInt(piElectronMatch[1]);
    // Check if it matches 4n+2 for some integer n >= 0
    const matchesHuckel = (piCount - 2) % 4 === 0 && piCount >= 2;
    const n = matchesHuckel ? (piCount - 2) / 4 : null;

    if (matchesHuckel) {
      return {
        status: 'success',
        answer: 'Aromatic',
        explanation: `Hückel's Rule: A planar, conjugated ring with ${piCount} π-electrons is aromatic because ${piCount} = 4×${n} + 2, satisfying the 4n+2 π-electron rule.`,
        confidence: 0.9
      };
    } else {
      return {
        status: 'success',
        answer: 'Not Aromatic (Antiaromatic if planar)',
        explanation: `Hückel's Rule: A planar, conjugated ring with ${piCount} π-electrons is NOT aromatic because ${piCount} does not match 4n+2 (for integer n). It would be 4n (antiaromatic) if the molecule is planar.`,
        confidence: 0.85
      };
    }
  }

  if (ringMatch) {
    return {
      status: 'needs_context',
      answer: null,
      explanation: `Ring size mentioned (${ringMatch[1]}) but π-electron count is not stated. Hückel's rule requires the number of π-electrons in the conjugated system. Please provide the π-electron count or specify the molecule.`,
      confidence: 0.3
    };
  }

  if (question.match(/benzene|pyrrole|furan|thiophene|pyridine|naphthalene|tropylium|cyclopropenyl|cyclopentadienyl|cycloheptatrienyl/i)) {
    const molecule = question.match(/(benzene|pyrrole|furan|thiophene|pyridine|naphthalene|tropylium|cyclopropenyl|cyclopentadienyl|cycloheptatrienyl)/i);
    const molName = molecule ? molecule[1] : 'the molecule';
    return {
      status: 'success',
      answer: 'Aromatic',
      explanation: `${molName} is aromatic. It is a planar, fully conjugated cyclic system with 6 π-electrons (for benzene, pyrrole, furan, thiophene, pyridine) or 10 π-electrons (for naphthalene), satisfying Hückel's 4n+2 rule (n=1 or n=2).`,
      confidence: 0.85
    };
  }

  return {
    status: 'needs_context',
    answer: null,
    explanation: `Hückel's rule question detected but molecule/ring electron count is not stated. Hückel's 4n+2 π-electron rule requires: (1) a planar, cyclic, fully conjugated system, (2) the number of π-electrons. Please provide the molecule name or π-electron count.`,
    confidence: 0.3
  };
}

/**
 * Main solveQuestion function
 */
function solveQuestion(question) {
  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return {
      status: 'needs_context',
      answer: null,
      explanation: 'No question provided. Please enter a NEET practice question.',
      confidence: 0
    };
  }

  const trimmed = question.trim();

  // Try each solver
  let result;

  result = solveMotionalEmf(trimmed);
  if (result && result.status === 'success') return result;
  if (result && result.status === 'needs_context' && result.confidence > 0) return result;

  result = solveOhmsLaw(trimmed);
  if (result && result.status === 'success') return result;
  if (result && result.status === 'needs_context' && result.confidence > 0) return result;

  result = solveElectricPower(trimmed);
  if (result && result.status === 'success') return result;
  if (result && result.status === 'needs_context' && result.confidence > 0) return result;

  result = solveLensFormula(trimmed);
  if (result && result.status === 'success') return result;
  if (result && result.status === 'needs_context' && result.confidence > 0) return result;

  result = solveHuckelRule(trimmed);
  if (result && result.status === 'success') return result;
  if (result && result.status === 'needs_context' && result.confidence > 0) return result;

  // Unsupported or ambiguous question
  return {
    status: 'needs_context',
    answer: null,
    explanation: 'This question type is not currently supported by the solver. Supported topics: motional EMF, Ohm\'s law (V=IR), electric power (P=VI), lens formula (1/f=1/v-1/u), Hückel\'s rule. Please specify the question more clearly or try a supported topic.',
    confidence: 0
  };
}

export { solveQuestion };
