'use strict';
const result = (status, answer, explanation, confidence = 0) => ({ status, answer, explanation, confidence });
const fmt = n => Number(n.toPrecision(8)).toString();
function value(text, labels, units = '') {
  for (const label of labels) {
    const re = new RegExp('(?:^|[^a-z])' + label + '\\s*(?:=|:)?\\s*(-?\\d+(?:\\.\\d+)?)\\s*' + units, 'i');
    const m = text.match(re);
    if (m) return Number(m[1]);
  }
  return null;
}
function solveQuestion(question) {
  const q = question.toLowerCase();
  if (/motional emf|induced emf|emf.*(?:rod|conductor)|(?:rod|conductor).*emf/.test(q)) {
    const b = value(q, ['magnetic field b', 'b'], '(?:tesla|t)?');
    const l = value(q, ['length l', 'length', 'l'], '(?:m|metre|meter)?');
    const v = value(q, ['speed v', 'velocity', 'speed', 'v'], '(?:m\\/s)?');
    if (b !== null && l !== null && v !== null && b >= 0 && l >= 0 && v >= 0) {
      const answer = b * l * v;
      return result('success', fmt(answer) + ' V', 'For perpendicular motion, motional emf ε = B × L × v. Substitution: ' + fmt(b) + ' × ' + fmt(l) + ' × ' + fmt(v) + ' = ' + fmt(answer) + ' V. Confirm that the inputs use SI units and the conductor moves perpendicular to the field.', 0.78);
    }
    return result('needs_context', null, 'Use ε = B L v for perpendicular motion. State B in tesla, L in metres, and v in m/s explicitly.', 0);
  }
  if (/h[uü]ckel|aromatic/.test(q)) {
    return result('needs_context', null, 'Hückel’s rule requires a planar, cyclic, fully conjugated system with (4n + 2) π electrons. Provide the molecule or its π-electron count before deciding aromaticity.', 0);
  }
  if (/ohm.?s law/.test(q)) {
    const voltage = value(q, ['voltage', 'potential difference', 'v'], '(?:volt|volts|v)?');
    const current = value(q, ['current', 'i'], '(?:amp|amps|a)?');
    const resistance = value(q, ['resistance', 'r'], '(?:ohm|ohms|Ω)?');
    if (voltage !== null && current !== null && /resistance|find r|calculate r/.test(q) && current !== 0) return result('success', fmt(voltage/current) + ' Ω', 'Ohm’s law: R = V / I.', 0.7);
    if (voltage !== null && resistance !== null && /current|find i|calculate i/.test(q) && resistance !== 0) return result('success', fmt(voltage/resistance) + ' A', 'Ohm’s law: I = V / R.', 0.7);
    if (current !== null && resistance !== null && /voltage|potential difference|find v|calculate v/.test(q)) return result('success', fmt(current*resistance) + ' V', 'Ohm’s law: V = I × R.', 0.7);
  }
  return result('needs_context', null, 'This question is outside the solver’s verified rule set or lacks explicit information. Include the full text, units, assumptions, and options if relevant. No answer is guessed.', 0);
}
module.exports = { solveQuestion };
