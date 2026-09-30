/* ==========================================================================
   PULSE — Fitness Web App
   script.js — Gesamte Anwendungslogik (Fragebogen, Berechnungen,
   Trainingsplan-Generator, Übungsdatenbank, Rangsystem, KI-Trainer,
   Dashboard, Navigation, localStorage)
========================================================================== */

/* --------------------------------------------------------------------
   1. GLOBALER STATE
   Der gesamte Anwendungszustand wird hier gehalten und bei jeder
   Änderung in localStorage gesichert (siehe saveState()).
-------------------------------------------------------------------- */

const STORAGE_KEY = 'pulse_app_state_v1';

const defaultState = {
  onboardingComplete: false,
  profile: {
    firstName: '', age: null, gender: '', email: '',
    height: null, weight: null,
    goal: '', targetWeight: null, targetDate: '',
    level: '', daysPerWeek: 3, duration: 45,
    location: '', equipment: []
  },
  customPlans: [],           // vom Nutzer selbst erstellte Trainingspläne
  weightHistory: [],         // [{date, weight}]
  completedWorkouts: [],     // [{date, dayName}]
  personalRecords: {},       // { liegestuetze: 32, klimmzuege: 8, ... }
  chatHistory: [],           // [{role: 'user'|'ai', text}]
  beforeAfterStartDate: null
};

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    // Tiefes Merge, damit neue Felder in Updates nicht fehlen
    const parsed = JSON.parse(raw);
    return { ...structuredClone(defaultState), ...parsed, profile: { ...defaultState.profile, ...parsed.profile } };
  } catch (e) {
    console.warn('Konnte gespeicherten Zustand nicht laden, starte neu.', e);
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* --------------------------------------------------------------------
   2. ÜBUNGSDATENBANK
   Jede Übung: id, name, category (Muskelgruppe), difficulty,
   equipment (benötigtes Equipment-Array), description.
   'none' bedeutet: keine Geräte nötig (immer verfügbar).
-------------------------------------------------------------------- */

const EXERCISES = [
  // Brust
  { id: 'pushup', name: 'Liegestütze', category: 'Brust', difficulty: 'beginner', equipment: ['none'], description: 'Klassische Übung für Brust, Schultern und Trizeps aus dem Unterarmstütz.' },
  { id: 'benchpress', name: 'Bankdrücken', category: 'Brust', difficulty: 'advanced', equipment: ['barbell'], description: 'Grundübung für die Brustmuskulatur mit der Langhantel auf der Flachbank.' },
  { id: 'dips', name: 'Dips', category: 'Brust', difficulty: 'advanced', equipment: ['pullupbar'], description: 'Stützübung an Barren oder Klimmzugstange für Brust und Trizeps.' },
  { id: 'inclinepress', name: 'Schrägbankdrücken', category: 'Brust', difficulty: 'expert', equipment: ['dumbbells'], description: 'Schrägbank-Variante für die obere Brustmuskulatur mit Kurzhanteln.' },
  { id: 'butterfly', name: 'Butterfly', category: 'Brust', difficulty: 'advanced', equipment: ['machines'], description: 'Isolationsübung für die Brust an der Butterfly-Maschine.' },
  // Rücken
  { id: 'pullup', name: 'Klimmzüge', category: 'Rücken', difficulty: 'expert', equipment: ['pullupbar'], description: 'Königsübung für den Rücken — Körper an der Stange nach oben ziehen.' },
  { id: 'dbrow', name: 'Rudern mit Kurzhanteln', category: 'Rücken', difficulty: 'beginner', equipment: ['dumbbells'], description: 'Einarmiges Rudern im Ausfallschritt oder mit Bankabstützung.' },
  { id: 'latpulldown', name: 'Latzug', category: 'Rücken', difficulty: 'advanced', equipment: ['cable', 'machines'], description: 'Ziehen der Stange von oben zur Brust — kräftigt den breiten Rückenmuskel.' },
  { id: 'bandrow', name: 'Rudern mit Widerstandsband', category: 'Rücken', difficulty: 'beginner', equipment: ['bands'], description: 'Band am Fixpunkt befestigen und zum Körper ziehen, Schulterblätter zusammenziehen.' },
  { id: 'superman', name: 'Superman', category: 'Rücken', difficulty: 'beginner', equipment: ['none'], description: 'Bauchlage, Arme und Beine gleichzeitig anheben — stärkt die untere Rückenmuskulatur.' },
  // Beine
  { id: 'squat', name: 'Kniebeugen', category: 'Beine', difficulty: 'beginner', equipment: ['none'], description: 'Grundübung für die gesamte Beinmuskulatur und den Po.' },
  { id: 'lunge', name: 'Ausfallschritte', category: 'Beine', difficulty: 'beginner', equipment: ['none'], description: 'Abwechselnd große Schritte nach vorn, Knie in Richtung Boden absenken.' },
  { id: 'bulgarian', name: 'Bulgarian Split Squats', category: 'Beine', difficulty: 'advanced', equipment: ['dumbbells'], description: 'Einbeinige Kniebeuge mit erhöhtem hinteren Fuß — intensiv für Quadrizeps und Po.' },
  { id: 'deadlift', name: 'Kreuzheben', category: 'Beine', difficulty: 'expert', equipment: ['barbell'], description: 'Ganzkörperübung mit Fokus auf hintere Kette — Technik ist entscheidend.' },
  { id: 'legpress', name: 'Beinpresse', category: 'Beine', difficulty: 'advanced', equipment: ['machines'], description: 'Beinstreckung gegen Widerstand an der Beinpresse-Maschine.' },
  { id: 'calfraise', name: 'Wadenheben', category: 'Beine', difficulty: 'beginner', equipment: ['none'], description: 'Auf die Zehenspitzen heben — kräftigt die Wadenmuskulatur.' },
  // Schultern
  { id: 'shoulderpress', name: 'Schulterdrücken', category: 'Schultern', difficulty: 'advanced', equipment: ['dumbbells'], description: 'Kurzhanteln über Kopf drücken — Grundübung für die Schultern.' },
  { id: 'lateralraise', name: 'Seitheben', category: 'Schultern', difficulty: 'advanced', equipment: ['dumbbells'], description: 'Arme seitlich bis Schulterhöhe anheben — formt den seitlichen Deltamuskel.' },
  { id: 'frontraise', name: 'Frontheben', category: 'Schultern', difficulty: 'advanced', equipment: ['dumbbells'], description: 'Kurzhanteln nach vorn bis Schulterhöhe heben — vordere Schulter.' },
  { id: 'pikepushup', name: 'Pike Push-ups', category: 'Schultern', difficulty: 'advanced', equipment: ['none'], description: 'Liegestütze in umgekehrter V-Position — belastet vor allem die Schultern.' },
  // Bauch
  { id: 'plank', name: 'Plank', category: 'Bauch', difficulty: 'beginner', equipment: ['none'], description: 'Unterarmstütz halten — kräftigt die gesamte Rumpfmuskulatur.' },
  { id: 'situp', name: 'Sit-ups', category: 'Bauch', difficulty: 'beginner', equipment: ['none'], description: 'Rumpf aus der Rückenlage aufrichten — klassische Bauchübung.' },
  { id: 'legraise', name: 'Leg Raises', category: 'Bauch', difficulty: 'advanced', equipment: ['none'], description: 'Beine aus der Rückenlage gestreckt anheben — fordert die untere Bauchmuskulatur.' },
  { id: 'sideplank', name: 'Side Plank', category: 'Bauch', difficulty: 'beginner', equipment: ['none'], description: 'Seitlicher Unterarmstütz — kräftigt die schrägen Bauchmuskeln.' },
  { id: 'russiantwist', name: 'Russian Twists', category: 'Bauch', difficulty: 'beginner', equipment: ['none'], description: 'Im Sitzen den Oberkörper rotieren lassen — trainiert die schräge Bauchmuskulatur.' },
  // Arme
  { id: 'bicepcurl', name: 'Bizepscurls', category: 'Arme', difficulty: 'beginner', equipment: ['dumbbells'], description: 'Kurzhanteln zur Schulter beugen — klassische Bizepsübung.' },
  { id: 'tricepspress', name: 'Trizepsdrücken', category: 'Arme', difficulty: 'advanced', equipment: ['cable'], description: 'Seil am Kabelzug nach unten drücken — isoliert den Trizeps.' },
  { id: 'tricepsdips', name: 'Trizeps Dips', category: 'Arme', difficulty: 'beginner', equipment: ['none'], description: 'Dips an einer Bank oder Stufe — beansprucht gezielt den Trizeps.' },
  { id: 'hammercurl', name: 'Hammer Curls', category: 'Arme', difficulty: 'beginner', equipment: ['dumbbells'], description: 'Curls mit neutralem Griff — beansprucht Bizeps und Unterarm.' }
];

const DIFFICULTY_LABEL = { beginner: 'Anfänger', advanced: 'Fortgeschritten', expert: 'Erfahren' };
const EQUIPMENT_LABEL = {
  none: 'Keine Geräte', dumbbells: 'Kurzhanteln', barbell: 'Langhantel', pullupbar: 'Klimmzugstange',
  bands: 'Widerstandsbänder', cable: 'Kabelzug', machines: 'Maschinen', kettlebell: 'Kettlebell', other: 'Sonstiges'
};
const GOAL_LABEL = {
  lose_weight: 'Abnehmen', gain_weight: 'Zunehmen', muscle: 'Muskelaufbau', fat_loss: 'Körperfett reduzieren',
  general: 'Allgemeine Fitness verbessern', strength: 'Kraft steigern', endurance: 'Ausdauer verbessern'
};
const LOCATION_LABEL = { home: 'Zuhause', gym: 'Fitnessstudio', outdoor: 'Draußen', home_gym: 'Zuhause + Fitnessstudio' };
const LEVEL_LABEL = { beginner: 'Anfänger', advanced: 'Fortgeschritten', expert: 'Erfahren' };

/* --------------------------------------------------------------------
   3. BERECHNUNGEN: BMI, BMR, TDEE, KALORIEN, MAKROS
-------------------------------------------------------------------- */

function calcBMI(weightKg, heightCm) {
  const h = heightCm / 100;
  return weightKg / (h * h);
}

// Grundumsatz nach Mifflin-St-Jeor-Formel (gängigste, gut validierte Schätzformel)
function calcBMR({ weight, height, age, gender }) {
  const base = 10 * weight + 6.25 * height - 5 * age;
  if (gender === 'male') return base + 5;
  if (gender === 'female') return base - 161;
  return base - 78; // Mittelwert für 'divers', da keine geschlechtsspezifische Formel existiert
}

// Aktivitätsfaktor grob geschätzt aus Trainingstagen/Woche (PAL-Näherung)
function activityFactorFromDays(daysPerWeek) {
  if (daysPerWeek <= 1) return 1.3;
  if (daysPerWeek <= 3) return 1.45;
  if (daysPerWeek <= 5) return 1.6;
  return 1.75;
}

function calcTDEE(bmr, daysPerWeek) {
  return bmr * activityFactorFromDays(daysPerWeek);
}

// Kalorienziel je nach Fitnessziel (moderates Defizit/Überschuss, keine Extremwerte)
function calcCalorieGoal(tdee, goal) {
  switch (goal) {
    case 'lose_weight':
    case 'fat_loss': return tdee - 450;      // ca. 0,4–0,5 kg/Woche
    case 'gain_weight': return tdee + 400;
    case 'muscle': return tdee + 250;
    case 'strength': return tdee + 150;
    case 'endurance': return tdee + 100;
    default: return tdee;                    // Allgemeine Fitness: Erhaltung
  }
}

// Makronährstoffverteilung: Protein primär nach Körpergewicht, Rest über Kalorien verteilt
function calcMacros(calorieGoal, weight, goal) {
  let proteinPerKg = 1.8;
  if (goal === 'muscle' || goal === 'strength') proteinPerKg = 2.1;
  if (goal === 'fat_loss' || goal === 'lose_weight') proteinPerKg = 2.0;

  const protein = weight * proteinPerKg;
  const proteinKcal = protein * 4;

  let fatPercent = 0.28;
  const fatKcal = calorieGoal * fatPercent;
  const fat = fatKcal / 9;

  const remainingKcal = Math.max(calorieGoal - proteinKcal - fatKcal, 0);
  const carbs = remainingKcal / 4;

  return {
    calories: Math.round(calorieGoal),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat)
  };
}

function getFullNutrition(profile) {
  const bmi = calcBMI(profile.weight, profile.height);
  const bmr = calcBMR(profile);
  const tdee = calcTDEE(bmr, profile.daysPerWeek);
  const calorieGoal = calcCalorieGoal(tdee, profile.goal);
  const macros = calcMacros(calorieGoal, profile.weight, profile.goal);
  // Wasserbedarf: grobe Faustregel 35 ml pro kg Körpergewicht
  const water = Math.round((profile.weight * 0.035) * 10) / 10;
  return { bmi: Math.round(bmi * 10) / 10, bmr: Math.round(bmr), tdee: Math.round(tdee), water, ...macros };
}

/* --------------------------------------------------------------------
   4. TRAININGSPLAN-GENERATOR
   Wählt passende Übungen aus der Datenbank basierend auf Ziel, Level,
   Trainingstagen, Ort und verfügbarem Equipment.
-------------------------------------------------------------------- */

// Bestimmt, welche Übungen mit dem verfügbaren Equipment/Ort nutzbar sind
function isExerciseAvailable(exercise, profile) {
  const equip = profile.equipment && profile.equipment.length ? profile.equipment : ['none'];
  if (profile.location === 'outdoor') {
    return exercise.equipment.includes('none');
  }
  return exercise.equipment.some(e => e === 'none' || equip.includes(e));
}

// Rep-/Satz-Schema je nach Ziel
function schemeForGoal(goal) {
  switch (goal) {
    case 'strength': return { sets: 5, reps: '4-6', rest: '120s' };
    case 'muscle': return { sets: 4, reps: '8-12', rest: '75s' };
    case 'gain_weight': return { sets: 4, reps: '8-12', rest: '75s' };
    case 'endurance': return { sets: 3, reps: '15-20', rest: '40s' };
    case 'fat_loss':
    case 'lose_weight': return { sets: 3, reps: '12-15', rest: '45s' };
    default: return { sets: 3, reps: '10-14', rest: '60s' };
  }
}

// Splits je nach Trainingstagen/Woche: welche Muskelgruppen an welchem Tag
function splitForDays(days) {
  if (days <= 2) return [['Ganzkörper'], ['Ganzkörper']].slice(0, days);
  if (days === 3) return [['Brust', 'Arme'], ['Rücken', 'Bauch'], ['Beine', 'Schultern']];
  if (days === 4) return [['Brust', 'Schultern'], ['Rücken', 'Arme'], ['Beine'], ['Bauch', 'Ganzkörper']];
  if (days === 5) return [['Brust'], ['Rücken'], ['Beine'], ['Schultern', 'Arme'], ['Bauch', 'Ganzkörper']];
  return [['Brust'], ['Rücken'], ['Beine'], ['Schultern'], ['Arme'], ['Bauch']];
}

const WEEKDAY_NAMES = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

// Verteilt Trainingstage gleichmäßig über die Woche
function pickWeekdays(count) {
  const spacing = Math.floor(7 / count);
  const result = [];
  for (let i = 0; i < count; i++) result.push(WEEKDAY_NAMES[(i * spacing) % 7]);
  return result;
}

function exercisesForFocus(focus, profile, excludeIds) {
  let pool = EXERCISES.filter(e => isExerciseAvailable(e, profile) && !excludeIds.includes(e.id));
  if (focus === 'Ganzkörper') {
    // Für Ganzkörper: aus jeder Hauptmuskelgruppe eine Übung
    const groups = ['Beine', 'Brust', 'Rücken', 'Bauch', 'Schultern'];
    const picks = [];
    groups.forEach(g => {
      const options = pool.filter(e => e.category === g);
      if (options.length) picks.push(options[Math.floor(Math.random() * options.length)]);
    });
    return picks;
  }
  return pool.filter(e => e.category === focus);
}

// Wählt max n Übungen, bevorzugt passend zum Level (Anfänger -> leichtere Übungen zuerst)
function pickExercises(candidates, n, level) {
  const levelOrder = level === 'beginner' ? ['beginner', 'advanced', 'expert']
    : level === 'advanced' ? ['advanced', 'beginner', 'expert']
    : ['expert', 'advanced', 'beginner'];

  const sorted = [...candidates].sort((a, b) => levelOrder.indexOf(a.difficulty) - levelOrder.indexOf(b.difficulty));
  // Duplikate nach id entfernen
  const seen = new Set();
  const unique = sorted.filter(e => (seen.has(e.id) ? false : (seen.add(e.id), true)));
  return unique.slice(0, n);
}

// Hauptfunktion: erstellt den vollständigen Wochen-Trainingsplan
function generateTrainingPlan(profile) {
  const days = Math.min(Math.max(profile.daysPerWeek || 3, 1), 6);
  const split = splitForDays(days);
  const weekdays = pickWeekdays(days);
  const scheme = schemeForGoal(profile.goal);
  const exercisesPerDay = profile.duration >= 60 ? 6 : profile.duration >= 45 ? 5 : 4;

  const usedThisWeek = [];

  return split.map((focusGroups, i) => {
    let dayExercises = [];
    focusGroups.forEach(focus => {
      const candidates = exercisesForFocus(focus, profile, []);
      const picked = pickExercises(candidates, Math.ceil(exercisesPerDay / focusGroups.length), profile.level);
      dayExercises = dayExercises.concat(picked);
    });

    // Fallback, falls durch Equipment-Einschränkungen zu wenige Übungen gefunden wurden
    if (dayExercises.length < 3) {
      const bodyweightFallback = EXERCISES.filter(e => e.equipment.includes('none') && !dayExercises.find(d => d.id === e.id));
      dayExercises = dayExercises.concat(bodyweightFallback.slice(0, 4 - dayExercises.length));
    }

    dayExercises = dayExercises.slice(0, exercisesPerDay);
    usedThisWeek.push(...dayExercises.map(e => e.id));

    return {
      day: weekdays[i],
      focus: focusGroups.join(' & '),
      exercises: dayExercises.map(e => ({
        ...e,
        sets: scheme.sets,
        reps: e.category === 'Bauch' && (e.id === 'plank' || e.id === 'sideplank') ? '30-60s' : scheme.reps,
        rest: scheme.rest
      }))
    };
  });
}

/* --------------------------------------------------------------------
   5. RANGSYSTEM
   Für jede trackbare Übung individuelle Schwellenwerte.
-------------------------------------------------------------------- */

const RANK_NAMES = ['Bronze', 'Silber', 'Gold', 'Platin', 'Diamant', 'Elite'];
const RANK_ICONS = { Bronze: '🥉', Silber: '🥈', Gold: '🥇', Platin: '💠', Diamant: '💎', Elite: '👑' };

// Schwellenwerte: [min für Bronze, Silber, Gold, Platin, Diamant, Elite]
const RANK_TRACKS = {
  liegestuetze: { label: 'Liegestütze', unit: 'Wdh.', thresholds: [0, 10, 20, 35, 50, 75] },
  klimmzuege: { label: 'Klimmzüge', unit: 'Wdh.', thresholds: [0, 3, 6, 10, 15, 20] },
  kniebeugen: { label: 'Kniebeugen', unit: 'Wdh.', thresholds: [0, 15, 30, 50, 70, 100] },
  plank: { label: 'Plank', unit: 'Sek.', thresholds: [0, 30, 60, 120, 180, 300] },
  dips: { label: 'Dips', unit: 'Wdh.', thresholds: [0, 5, 10, 18, 28, 40] },
  situps: { label: 'Sit-ups', unit: 'Wdh.', thresholds: [0, 15, 30, 45, 60, 80] }
};

/* --------------------------------------------------------------------
   5b. RANG-CHARAKTER
   Zeichnet einen kleinen SVG-Athleten, der sich mit steigendem Rang
   sichtbar weiterentwickelt: breitere Schultern, mehr Muskeln,
   zusätzliche Ausrüstung (Hanteln, Cape, Krone) und ein Farbwechsel.
   stage 0 = Bronze ... stage 5 = Elite
-------------------------------------------------------------------- */

// Körperproportionen pro Rangstufe.
// shoulder = halbe Schulterbreite, waist = halbe Taillenbreite (V-Form),
// arm/leg = Gliedmaßendicke, armDrop = wie weit die Arme abgespreizt sind.
const CHARACTER_STAGES = [
  { shoulder: 9,  waist: 7.5, arm: 3.2, leg: 4.2, armDrop: 2,  label: 'Einsteiger' },
  { shoulder: 12, waist: 7.5, arm: 4.2, leg: 5.0, armDrop: 4,  label: 'Solide Basis' },
  { shoulder: 15, waist: 7.0, arm: 5.2, leg: 5.8, armDrop: 6,  label: 'Sichtbare Form' },
  { shoulder: 18, waist: 7.0, arm: 6.2, leg: 6.6, armDrop: 8,  label: 'Athletisch' },
  { shoulder: 21, waist: 6.5, arm: 7.2, leg: 7.4, armDrop: 10, label: 'Stark' },
  { shoulder: 24, waist: 6.5, arm: 8.4, leg: 8.2, armDrop: 12, label: 'Elite-Physis' }
];

// Erzeugt das SVG des Charakters passend zur Rangstufe
function buildRankCharacter(rankName) {
  const stage = Math.max(0, RANK_NAMES.indexOf(rankName));
  const s = CHARACTER_STAGES[stage];
  const cx = 50;

  // Ausrüstung schaltet sich mit steigendem Rang frei
  const hasWeights = stage >= 2;   // ab Gold: Kurzhanteln
  const hasAura    = stage >= 3;   // ab Platin: Energie-Ring
  const hasCape    = stage >= 4;   // ab Diamant: Cape
  const hasCrown   = stage === 5;  // Elite: Krone

  const shoulderY = 42;
  const hipY = 68;
  // Hände sitzen außerhalb der Schultern und hängen je nach Stufe tiefer/weiter
  const handX = s.shoulder + s.armDrop;
  const handY = shoulderY + 16;

  return `
  <svg class="rank-character rank-character--stage${stage}" viewBox="0 0 100 100" aria-hidden="true">
    ${hasAura ? `<circle class="rc-aura" cx="${cx}" cy="54" r="33"/>` : ''}
    ${hasCape ? `
      <path class="rc-cape" d="M${cx - s.shoulder} ${shoulderY} Q${cx - s.shoulder - 12} 66 ${cx - s.shoulder - 6} 86 L${cx} 72 L${cx + s.shoulder + 6} 86 Q${cx + s.shoulder + 12} 66 ${cx + s.shoulder} ${shoulderY} Z"/>
    ` : ''}

    <!-- Beine -->
    <line class="rc-limb" x1="${cx - 5}" y1="${hipY}" x2="${cx - 8}" y2="90" stroke-width="${s.leg}"/>
    <line class="rc-limb" x1="${cx + 5}" y1="${hipY}" x2="${cx + 8}" y2="90" stroke-width="${s.leg}"/>

    <!-- Torso: breite Schultern, schmale Taille -> je höher der Rang, desto stärker die V-Form -->
    <path class="rc-torso" d="
      M${cx - s.shoulder} ${shoulderY}
      Q${cx - s.shoulder - 2} ${shoulderY + 9} ${cx - s.waist} ${hipY}
      L${cx + s.waist} ${hipY}
      Q${cx + s.shoulder + 2} ${shoulderY + 9} ${cx + s.shoulder} ${shoulderY}
      Q${cx} ${shoulderY - 5} ${cx - s.shoulder} ${shoulderY} Z"/>

    <!-- Arme: von der Schulter nach außen unten -->
    <line class="rc-limb" x1="${cx - s.shoulder + 2}" y1="${shoulderY + 2}" x2="${cx - handX}" y2="${handY}" stroke-width="${s.arm}"/>
    <line class="rc-limb" x1="${cx + s.shoulder - 2}" y1="${shoulderY + 2}" x2="${cx + handX}" y2="${handY}" stroke-width="${s.arm}"/>

    ${hasWeights ? `
      <g class="rc-weight-group">
        <rect class="rc-weight-bar" x="${cx - handX - 8}" y="${handY - 1.5}" width="16" height="3" rx="1.5"/>
        <rect class="rc-weight" x="${cx - handX - 9}" y="${handY - 6}" width="5" height="12" rx="2"/>
        <rect class="rc-weight" x="${cx - handX + 4}" y="${handY - 6}" width="5" height="12" rx="2"/>
        <rect class="rc-weight-bar" x="${cx + handX - 8}" y="${handY - 1.5}" width="16" height="3" rx="1.5"/>
        <rect class="rc-weight" x="${cx + handX - 9}" y="${handY - 6}" width="5" height="12" rx="2"/>
        <rect class="rc-weight" x="${cx + handX + 4}" y="${handY - 6}" width="5" height="12" rx="2"/>
      </g>
    ` : ''}

    <!-- Nacken + Kopf -->
    <line class="rc-limb" x1="${cx}" y1="${shoulderY - 2}" x2="${cx}" y2="${shoulderY - 6}" stroke-width="${3 + stage * 0.5}"/>
    <circle class="rc-head" cx="${cx}" cy="27" r="8.5"/>

    ${hasCrown ? `<path class="rc-crown" d="M${cx - 10} 17 L${cx - 10} 9 L${cx - 5} 14 L${cx} 6 L${cx + 5} 14 L${cx + 10} 9 L${cx + 10} 17 Z"/>` : ''}
  </svg>`;
}

function getRankInfo(trackKey, value) {
  const track = RANK_TRACKS[trackKey];
  const v = value || 0;
  let rankIndex = 0;
  for (let i = 0; i < track.thresholds.length; i++) {
    if (v >= track.thresholds[i]) rankIndex = i;
  }
  const isMax = rankIndex === RANK_NAMES.length - 1;
  const nextThreshold = isMax ? null : track.thresholds[rankIndex + 1];
  const currentThreshold = track.thresholds[rankIndex];
  const progressRange = isMax ? 1 : (nextThreshold - currentThreshold);
  const progressValue = isMax ? 1 : Math.min((v - currentThreshold) / progressRange, 1);

  return {
    rank: RANK_NAMES[rankIndex],
    icon: RANK_ICONS[RANK_NAMES[rankIndex]],
    value: v,
    nextRank: isMax ? null : RANK_NAMES[rankIndex + 1],
    nextThreshold,
    progressPercent: Math.round(progressValue * 100),
    remaining: isMax ? 0 : nextThreshold - v
  };
}

/* --------------------------------------------------------------------
   6. KI-TRAINER (simuliert)
   askAI() ist so aufgebaut, dass hier später problemlos eine echte
   KI-API (z. B. Anthropic Claude API) angebunden werden kann.
-------------------------------------------------------------------- */

async function askAI(message) {
  // ------------------------------------------------------------------
  // HIER SPÄTER ECHTE KI-API EINBINDEN, z. B.:
  //
  // const response = await fetch('https://api.anthropic.com/v1/messages', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     model: 'claude-sonnet-4-6',
  //     max_tokens: 500,
  //     system: buildTrainerSystemPrompt(state.profile),
  //     messages: [...state.chatHistory.map(toApiFormat), { role: 'user', content: message }]
  //   })
  // });
  // const data = await response.json();
  // return data.content.find(b => b.type === 'text').text;
  // ------------------------------------------------------------------

  // Für die Demo: simulierte, regelbasierte Antworten
  await new Promise(res => setTimeout(res, 550 + Math.random() * 500)); // simuliert Ladezeit
  return simulateTrainerResponse(message, state.profile);
}

function simulateTrainerResponse(message, profile) {
  const m = message.toLowerCase();
  const name = profile.firstName || 'Champ';

  if (/heute.*(trainieren|training)|was.*(soll|kann).*heute/.test(m)) {
    const plan = generateTrainingPlan(profile);
    const today = plan[0];
    if (!today) return `Lust auf ein kurzes Ganzkörpertraining, ${name}? Ein paar Kniebeugen, Liegestütze und Plank reichen schon für einen guten Start.`;
    const list = today.exercises.slice(0, 3).map(e => e.name).join(', ');
    return `Heute stünde laut deinem Plan „${today.focus}" an: ${list}. Wärm dich kurz auf und leg direkt los, ${name} — du schaffst das! 💪`;
  }

  if (/mehr klimmzüge|klimmzüge.*schaffen|klimmzüge.*verbessern/.test(m)) {
    return 'Um mehr Klimmzüge zu schaffen, hilft ein Mix aus: 1) Negativ-Klimmzügen (langsam ablassen), 2) Latzug am Kabel für den Kraftaufbau, 3) Rudern mit Kurzhanteln für den oberen Rücken. Trainiere Rücken 2x pro Woche und lass zwischen den Einheiten genug Erholung — Fortschritt kommt oft in kleinen Schritten.';
  }

  if (/statt kniebeug|alternative.*kniebeug|ersatz.*kniebeug/.test(m)) {
    return 'Statt Kniebeugen kannst du z. B. Ausfallschritte, Bulgarian Split Squats oder — falls eine Maschine verfügbar ist — Beinpresse machen. Alle trainieren die gleiche Muskulatur, nur mit leicht anderem Bewegungsmuster.';
  }

  if (/wenig zeit|kurz.*training|schnelles training|nur \d+ min/.test(m)) {
    return `Kein Problem, ${name}! Bei wenig Zeit reicht ein 15-Minuten-Zirkel: 3 Runden aus Kniebeugen, Liegestütze und Plank, jeweils 40 Sekunden Belastung, 20 Sekunden Pause. Kurz, intensiv, effektiv.`;
  }

  if (/plan.*verbessern|trainingsplan.*anpassen|plan.*ändern/.test(m)) {
    return 'Um deinen Plan zu verbessern, schau dir an: Trainierst du jede Muskelgruppe mindestens 1-2x pro Woche? Steigerst du Gewicht oder Wiederholungen regelmäßig (progressive Überlastung)? Und bekommst du genug Schlaf und Erholung zwischen den Einheiten? Das sind die drei größten Hebel.';
  }

  if (/motivation|keine lust|schwer.*durchzuhalten|durchhalten/.test(m)) {
    return `Jeder hat mal Tage ohne Motivation, ${name} — das ist normal. Setz dir kleine, erreichbare Ziele statt riesiger Sprünge, und feiere jeden abgeschlossenen Workout. Du musst nicht perfekt sein, nur konsequent. Ein kurzes Training ist immer besser als keins!`;
  }

  if (/abnehmen|gewicht verlieren|fett verlieren/.test(m)) {
    return 'Für nachhaltiges Abnehmen zählt vor allem ein moderates Kaloriendefizit (siehe dein Tagesziel im Dashboard) kombiniert mit Krafttraining, um Muskulatur zu erhalten. Cardio kann zusätzlich helfen, ist aber nicht zwingend nötig. Wichtig: Geduld — 0,3-0,5 kg pro Woche sind ein gesundes Tempo.';
  }

  if (/muskeln aufbauen|muskelaufbau|masse aufbauen/.test(m)) {
    return 'Für Muskelaufbau brauchst du drei Dinge: einen leichten Kalorienüberschuss, ausreichend Protein (siehe dein Proteinziel im Dashboard) und regelmäßiges, progressives Krafttraining. Achte darauf, die Belastung über die Wochen langsam zu steigern.';
  }

  if (/schmerz|verletz|weh tut|arzt/.test(m)) {
    return 'Bei Schmerzen oder einer möglichen Verletzung solltest du das Training in dem Bereich pausieren und im Zweifel ärztlichen Rat einholen — das kann ich als App leider nicht ersetzen. Sicherheit geht immer vor.';
  }

  if (/danke|super|cool|klasse/.test(m)) {
    return `Gerne, ${name}! Ich bin jederzeit für dich da. Sag Bescheid, wenn du noch etwas wissen willst. 🙌`;
  }

  // Generische, aber freundliche Fallback-Antwort
  const fallbacks = [
    `Gute Frage, ${name}! Kannst du sie etwas genauer stellen — z. B. zu einer bestimmten Übung, deinem Trainingsplan oder deiner Ernährung? Dann kann ich dir gezielter helfen.`,
    `Ich bin für Fragen rund um Training, Übungen und deinen Plan da. Frag mich zum Beispiel „Was soll ich heute trainieren?" oder „Wie kann ich meine Liegestütze verbessern?"`,
    `Darüber kann ich dir gerne mehr erzählen — erzähl mir kurz mehr, worauf du hinaus willst, ${name}.`
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

/* ==========================================================================
   7. DOM-REFERENZEN & UI-STATE
========================================================================== */

const el = (id) => document.getElementById(id);

let currentStep = 1;
const TOTAL_STEPS = 5;
const STEP_NAMES = ['Persönliche Daten', 'Körperdaten', 'Fitnessziel', 'Trainingserfahrung', 'Trainingsmöglichkeiten'];

/* --------------------------------------------------------------------
   8. INITIALISIERUNG
-------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  if (state.onboardingComplete) {
    showApp();
  } else {
    el('landing-view').classList.remove('hidden');
  }
  bindOnboardingEvents();
  bindAppEvents();
});

/* --------------------------------------------------------------------
   9. ONBOARDING-LOGIK
-------------------------------------------------------------------- */

function bindOnboardingEvents() {
  el('start-btn').addEventListener('click', () => {
    el('landing-view').classList.add('hidden');
    el('questionnaire-view').classList.remove('hidden');
    updateStepUI();
  });

  el('quit-questionnaire').addEventListener('click', () => {
    el('questionnaire-view').classList.add('hidden');
    el('landing-view').classList.remove('hidden');
  });

  el('next-step-btn').addEventListener('click', () => {
    if (!validateCurrentStep()) return;
    if (currentStep < TOTAL_STEPS) {
      currentStep++;
      updateStepUI();
    }
  });

  el('prev-step-btn').addEventListener('click', () => {
    if (currentStep > 1) {
      currentStep--;
      updateStepUI();
    }
  });

  el('daysPerWeek').addEventListener('input', (e) => {
    el('daysPerWeekValue').textContent = e.target.value;
  });

  el('questionnaire-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;
    collectProfileData();
    showResults();
  });

  el('enter-app-btn').addEventListener('click', () => {
    state.onboardingComplete = true;
    saveState();
    el('onboarding-screen').classList.add('hidden');
    showApp();
  });

  el('edit-profile-btn')?.addEventListener('click', restartQuestionnaire);
}

function updateStepUI() {
  document.querySelectorAll('.q-step').forEach(stepEl => {
    stepEl.classList.toggle('hidden', Number(stepEl.dataset.step) !== currentStep);
  });
  el('questionnaire-progress-fill').style.width = `${(currentStep / TOTAL_STEPS) * 100}%`;
  el('step-label').textContent = `Schritt ${currentStep} von ${TOTAL_STEPS}`;
  el('step-name').textContent = STEP_NAMES[currentStep - 1];

  el('prev-step-btn').classList.toggle('hidden', currentStep === 1);
  el('next-step-btn').classList.toggle('hidden', currentStep === TOTAL_STEPS);
  el('finish-questionnaire-btn').classList.toggle('hidden', currentStep !== TOTAL_STEPS);
}

function validateCurrentStep() {
  const stepEl = document.querySelector(`.q-step[data-step="${currentStep}"]`);
  const inputs = stepEl.querySelectorAll('input[required], select[required]');
  for (const input of inputs) {
    if (input.type === 'radio') {
      const group = stepEl.querySelectorAll(`input[name="${input.name}"]`);
      const anyChecked = Array.from(group).some(r => r.checked);
      if (!anyChecked) { flashInvalid(stepEl); return false; }
    } else if (!input.checkValidity()) {
      input.reportValidity();
      return false;
    }
  }
  return true;
}

function flashInvalid(stepEl) {
  stepEl.style.animation = 'none';
  requestAnimationFrame(() => { stepEl.style.animation = 'fadeIn 0.3s ease'; });
}

function collectProfileData() {
  const form = el('questionnaire-form');
  const fd = new FormData(form);

  state.profile.firstName = fd.get('firstName')?.trim() || '';
  state.profile.age = Number(fd.get('age'));
  state.profile.gender = fd.get('gender');
  state.profile.email = fd.get('email')?.trim() || '';
  state.profile.height = Number(fd.get('height'));
  state.profile.weight = Number(fd.get('weight'));
  state.profile.goal = fd.get('goal');
  state.profile.targetWeight = fd.get('targetWeight') ? Number(fd.get('targetWeight')) : null;
  state.profile.targetDate = fd.get('targetDate') || '';
  state.profile.level = fd.get('level');
  state.profile.daysPerWeek = Number(fd.get('daysPerWeek'));
  state.profile.duration = Number(fd.get('duration'));
  state.profile.location = fd.get('location');
  state.profile.equipment = fd.getAll('equipment');

  if (!state.weightHistory.length) {
    state.weightHistory.push({ date: new Date().toISOString(), weight: state.profile.weight });
  }
  if (!state.beforeAfterStartDate) state.beforeAfterStartDate = new Date().toISOString();

  saveState();
}

function showResults() {
  el('questionnaire-view').classList.add('hidden');
  el('results-view').classList.remove('hidden');

  el('results-greeting').innerHTML = `Alles klar, <span class="highlight">${escapeHtml(state.profile.firstName || 'du')}</span>!`;

  const nutrition = getFullNutrition(state.profile);
  el('results-stat-cards').innerHTML = buildNutritionCardsHtml(nutrition);
}

function buildNutritionCardsHtml(n) {
  return `
    <div class="stat-card"><span class="stat-card__icon">📏</span><div class="stat-card__value">${n.bmi}</div><div class="stat-card__label">BMI</div></div>
    <div class="stat-card"><span class="stat-card__icon">🔥</span><div class="stat-card__value">${n.calories}</div><div class="stat-card__label">kcal / Tag</div></div>
    <div class="stat-card"><span class="stat-card__icon">🥩</span><div class="stat-card__value">${n.protein} g</div><div class="stat-card__label">Protein</div></div>
    <div class="stat-card"><span class="stat-card__icon">🍚</span><div class="stat-card__value">${n.carbs} g</div><div class="stat-card__label">Kohlenhydrate</div></div>
    <div class="stat-card"><span class="stat-card__icon">🥑</span><div class="stat-card__value">${n.fat} g</div><div class="stat-card__label">Fett</div></div>
    <div class="stat-card"><span class="stat-card__icon">💧</span><div class="stat-card__value">${n.water} L</div><div class="stat-card__label">Wasser</div></div>
    <div class="stat-card"><span class="stat-card__icon">⚙️</span><div class="stat-card__value">${n.bmr}</div><div class="stat-card__label">Grundumsatz (BMR)</div></div>
    <div class="stat-card"><span class="stat-card__icon">⚡</span><div class="stat-card__value">${n.tdee}</div><div class="stat-card__label">Gesamtbedarf (TDEE)</div></div>
  `;
}

function restartQuestionnaire() {
  el('app').classList.add('hidden');
  el('onboarding-screen').classList.remove('hidden');
  el('results-view').classList.add('hidden');
  el('landing-view').classList.add('hidden');
  el('questionnaire-view').classList.remove('hidden');
  currentStep = 1;
  updateStepUI();
  prefillFormFromProfile();
}

function prefillFormFromProfile() {
  const p = state.profile;
  const form = el('questionnaire-form');
  form.firstName.value = p.firstName || '';
  form.age.value = p.age || '';
  if (p.gender) form.gender.value = p.gender;
  form.email.value = p.email || '';
  form.height.value = p.height || '';
  form.weight.value = p.weight || '';
  if (p.goal) form.querySelector(`input[name="goal"][value="${p.goal}"]`).checked = true;
  form.targetWeight.value = p.targetWeight || '';
  form.targetDate.value = p.targetDate || '';
  if (p.level) form.querySelector(`input[name="level"][value="${p.level}"]`).checked = true;
  form.daysPerWeek.value = p.daysPerWeek || 3;
  el('daysPerWeekValue').textContent = p.daysPerWeek || 3;
  if (p.duration) form.querySelector(`input[name="duration"][value="${p.duration}"]`)?.setAttribute('checked', 'checked');
  if (p.location) form.querySelector(`input[name="location"][value="${p.location}"]`).checked = true;
  (p.equipment || []).forEach(eq => {
    const box = form.querySelector(`input[name="equipment"][value="${eq}"]`);
    if (box) box.checked = true;
  });
}

/* ==========================================================================
   10. HAUPT-APP: NAVIGATION & RENDERING
========================================================================== */

function showApp() {
  el('onboarding-screen').classList.add('hidden');
  el('app').classList.remove('hidden');
  renderAll();
}

function bindAppEvents() {
  document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  el('reset-app-btn').addEventListener('click', () => {
    if (confirm('Möchtest du wirklich alle gespeicherten Daten löschen? Das kann nicht rückgängig gemacht werden.')) {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    }
  });

  // Training-Tabs
  el('tab-auto-plan').addEventListener('click', () => toggleTrainingTab('auto'));
  el('tab-custom-plan').addEventListener('click', () => toggleTrainingTab('custom'));

  el('add-custom-day-btn').addEventListener('click', () => addCustomDayBlock());
  el('save-custom-plan-btn').addEventListener('click', saveCustomPlan);

  // Fortschritt: Gewicht eintragen
  el('log-weight-btn').addEventListener('click', logWeight);

  // Before/After Slider
  initBeforeAfterSlider();

  // Chat
  el('chat-form').addEventListener('submit', handleChatSubmit);

  toggleTrainingTab('auto');
}

function switchView(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  el(`view-${viewName}`).classList.add('active');

  document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  const titleMap = {
    dashboard: 'Dashboard', training: 'Training', exercises: 'Übungen', progress: 'Fortschritt',
    ranking: 'Rangliste', nutrition: 'Ernährung', 'ai-trainer': 'AI Trainer', profile: 'Profil'
  };
  el('mobile-view-title').textContent = titleMap[viewName] || '';

  // Views bei Bedarf neu rendern (z. B. Diagramme/Listen aktuell halten)
  if (viewName === 'dashboard') renderDashboard();
  if (viewName === 'training') renderTrainingPlan();
  if (viewName === 'exercises') renderExerciseDatabase();
  if (viewName === 'ranking') renderRanking();
  if (viewName === 'nutrition') renderNutrition();
  if (viewName === 'progress') renderProgress();
  if (viewName === 'profile') renderProfile();
  if (viewName === 'ai-trainer' && !state.chatHistory.length) renderChatWelcome();
}

function renderAll() {
  renderDashboard();
  renderTrainingPlan();
  renderExerciseDatabase();
  renderRanking();
  renderNutrition();
  renderProgress();
  renderProfile();
  renderChatWelcome();
}

/* --------------------------------------------------------------------
   11. DASHBOARD
-------------------------------------------------------------------- */

function renderDashboard() {
  const p = state.profile;
  el('dashboard-greeting').textContent = `Hey ${p.firstName || 'Champ'}! 💪`;

  // Heutiges Training (erster Tag des generierten Plans als Vorschau)
  const plan = generateTrainingPlan(p);
  const today = plan[0];
  const box = el('today-workout-box');
  if (today) {
    box.innerHTML = `
      <div class="today-workout-header">
        <h4>${today.focus}</h4>
        <span class="today-workout-tag">${today.day}</span>
      </div>
      ${today.exercises.map(e => `
        <div class="today-exercise-mini">
          <span>${e.name}</span>
          <span>${e.sets} × ${e.reps}</span>
        </div>`).join('')}
    `;
  } else {
    box.innerHTML = `<p class="empty-state">Kein Plan verfügbar — fülle dein Profil aus.</p>`;
  }

  // Makros
  const n = getFullNutrition(p);
  el('dashboard-macros').innerHTML = `
    <div class="macro-pill"><span class="macro-pill__icon">🔥</span><div class="macro-pill__value">${n.calories}</div><div class="macro-pill__label">kcal</div></div>
    <div class="macro-pill"><span class="macro-pill__icon">🥩</span><div class="macro-pill__value">${n.protein}g</div><div class="macro-pill__label">Protein</div></div>
    <div class="macro-pill"><span class="macro-pill__icon">🍚</span><div class="macro-pill__value">${n.carbs}g</div><div class="macro-pill__label">Carbs</div></div>
    <div class="macro-pill"><span class="macro-pill__icon">🥑</span><div class="macro-pill__value">${n.fat}g</div><div class="macro-pill__label">Fett</div></div>
  `;

  // Gewichtsfortschritt
  const weightBox = el('weight-progress-box');
  const currentWeight = state.weightHistory.length ? state.weightHistory[state.weightHistory.length - 1].weight : p.weight;
  const startWeight = state.weightHistory.length ? state.weightHistory[0].weight : p.weight;
  const target = p.targetWeight;
  weightBox.innerHTML = `
    <div class="weight-progress-row"><span>Start</span><strong>${startWeight ?? '–'} kg</strong></div>
    <div class="weight-progress-row"><span>Aktuell</span><strong>${currentWeight ?? '–'} kg</strong></div>
    <div class="weight-progress-row"><span>Ziel</span><strong>${target ?? '–'} kg</strong></div>
    ${target ? renderWeightProgressBar(startWeight, currentWeight, target) : ''}
  `;

  // Trainingsfortschritt diese Woche
  const trainingBox = el('training-progress-box');
  const doneThisWeek = countWorkoutsThisWeek();
  const goalDays = p.daysPerWeek || 3;
  const pct = Math.min(Math.round((doneThisWeek / goalDays) * 100), 100);
  trainingBox.innerHTML = `
    <div class="weight-progress-row"><span>Absolviert</span><strong>${doneThisWeek} / ${goalDays} Einheiten</strong></div>
    <div class="progress-bar"><div class="progress-bar__fill" style="width:${pct}%"></div></div>
    <button class="btn btn--ghost" id="mark-workout-done-btn" style="margin-top:0.6rem;">✓ Heutiges Training abschließen</button>
  `;
  el('mark-workout-done-btn').addEventListener('click', markWorkoutDone);

  // Motivation
  const remaining = Math.max(goalDays - doneThisWeek, 0);
  el('motivation-message').textContent = remaining > 0
    ? `Noch ${remaining} Trainingseinheit${remaining === 1 ? '' : 'en'} bis zu deinem Wochenziel!`
    : `Wochenziel erreicht — starke Leistung, ${p.firstName || 'Champ'}! 🎉`;

  // Persönliche Rekorde
  const prBox = el('pr-box');
  const prEntries = Object.entries(state.personalRecords);
  if (!prEntries.length) {
    prBox.innerHTML = `<p class="empty-state">Noch keine Rekorde eingetragen. Trage Werte in der Rangliste ein!</p>`;
  } else {
    prBox.innerHTML = prEntries.map(([key, val]) => {
      const track = RANK_TRACKS[key];
      return `<div class="pr-row"><span>${track ? track.label : key}</span><span>${val} ${track ? track.unit : ''}</span></div>`;
    }).join('');
  }
}

function renderWeightProgressBar(start, current, target) {
  if (start == null || current == null || target == null || start === target) return '';
  const total = Math.abs(target - start);
  const done = Math.abs(current - start);
  const pct = Math.min(Math.round((done / total) * 100), 100);
  return `<div class="progress-bar"><div class="progress-bar__fill" style="width:${pct}%"></div></div>`;
}

function countWorkoutsThisWeek() {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
  startOfWeek.setHours(0, 0, 0, 0);
  return state.completedWorkouts.filter(w => new Date(w.date) >= startOfWeek).length;
}

function markWorkoutDone() {
  state.completedWorkouts.push({ date: new Date().toISOString(), dayName: WEEKDAY_NAMES[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] });
  saveState();
  renderDashboard();
  renderProgress();
}

/* --------------------------------------------------------------------
   12. TRAINING (Automatischer Plan + Eigener Plan)
-------------------------------------------------------------------- */

function toggleTrainingTab(tab) {
  el('tab-auto-plan').classList.toggle('active', tab === 'auto');
  el('tab-custom-plan').classList.toggle('active', tab === 'custom');
  el('auto-plan-section').classList.toggle('hidden', tab !== 'auto');
  el('custom-plan-section').classList.toggle('hidden', tab !== 'custom');
  if (tab === 'custom') renderSavedCustomPlans();
}

function renderTrainingPlan() {
  const plan = generateTrainingPlan(state.profile);
  el('auto-plan-days').innerHTML = plan.map(day => `
    <div class="plan-day-card">
      <div class="plan-day-card__header">
        <h3>${day.day}</h3>
        <span class="plan-day-card__focus">${day.focus}</span>
      </div>
      ${day.exercises.map(e => `
        <div class="exercise-row">
          <div class="exercise-row__top">
            <span class="exercise-row__name">${e.name}</span>
            <span class="difficulty-tag difficulty-tag--${e.difficulty}">${DIFFICULTY_LABEL[e.difficulty]}</span>
          </div>
          <div class="exercise-row__meta">${e.sets} Sätze × ${e.reps} · Pause ${e.rest}</div>
          <div class="exercise-row__desc">${e.description}</div>
        </div>
      `).join('')}
    </div>
  `).join('') || '<p class="empty-state">Fülle dein Profil aus, um einen Plan zu erhalten.</p>';
}

let customDayCounter = 0;

function addCustomDayBlock(prefill) {
  customDayCounter++;
  const id = `custom-day-${customDayCounter}`;
  const wrapper = document.createElement('div');
  wrapper.className = 'custom-day-block';
  wrapper.id = id;
  wrapper.innerHTML = `
    <div class="custom-day-block__top">
      <input type="text" class="custom-day-name" placeholder="Name des Tages (z. B. Push-Tag)" value="${prefill?.name || ''}">
      <button type="button" class="icon-btn remove-day-btn" title="Tag entfernen">✕</button>
    </div>
    <div class="custom-exercise-list"></div>
    <button type="button" class="btn-text add-exercise-btn">+ Übung hinzufügen</button>
  `;
  el('custom-plan-days-editor').appendChild(wrapper);

  wrapper.querySelector('.remove-day-btn').addEventListener('click', () => wrapper.remove());
  wrapper.querySelector('.add-exercise-btn').addEventListener('click', () => addCustomExerciseRow(wrapper));

  (prefill?.exercises || [{}]).forEach(ex => addCustomExerciseRow(wrapper, ex));
  return wrapper;
}

function addCustomExerciseRow(dayBlock, prefill) {
  const list = dayBlock.querySelector('.custom-exercise-list');
  const row = document.createElement('div');
  row.className = 'custom-exercise-row';
  const options = EXERCISES.map(e => `<option value="${e.id}" ${prefill?.exerciseId === e.id ? 'selected' : ''}>${e.name}</option>`).join('');
  row.innerHTML = `
    <select class="ce-exercise">${options}</select>
    <input type="number" class="ce-sets" placeholder="Sätze" min="1" max="10" value="${prefill?.sets || 3}">
    <input type="text" class="ce-reps" placeholder="Wdh." value="${prefill?.reps || '10-12'}">
    <input type="text" class="ce-rest" placeholder="Pause" value="${prefill?.rest || '60s'}">
    <button type="button" class="icon-btn remove-exercise-btn" title="Entfernen">✕</button>
  `;
  row.querySelector('.remove-exercise-btn').addEventListener('click', () => row.remove());
  list.appendChild(row);
}

function saveCustomPlan() {
  const name = el('custom-plan-name').value.trim() || 'Mein Trainingsplan';
  const dayBlocks = document.querySelectorAll('.custom-day-block');
  if (!dayBlocks.length) { alert('Füge mindestens einen Trainingstag hinzu.'); return; }

  const days = Array.from(dayBlocks).map(block => {
    const dayName = block.querySelector('.custom-day-name').value.trim() || 'Trainingstag';
    const exerciseRows = block.querySelectorAll('.custom-exercise-row');
    const exercises = Array.from(exerciseRows).map(row => {
      const exId = row.querySelector('.ce-exercise').value;
      const exData = EXERCISES.find(e => e.id === exId);
      return {
        exerciseId: exId,
        name: exData?.name || exId,
        sets: row.querySelector('.ce-sets').value || 3,
        reps: row.querySelector('.ce-reps').value || '10-12',
        rest: row.querySelector('.ce-rest').value || '60s'
      };
    });
    return { name: dayName, exercises };
  });

  state.customPlans.push({ id: `plan-${Date.now()}`, name, days, createdAt: new Date().toISOString() });
  saveState();
  el('custom-plan-name').value = '';
  el('custom-plan-days-editor').innerHTML = '';
  renderSavedCustomPlans();
}

function renderSavedCustomPlans() {
  const container = el('saved-custom-plans');
  if (!state.customPlans.length) {
    container.innerHTML = '';
    return;
  }
  container.innerHTML = state.customPlans.map(plan => `
    <div class="plan-day-card">
      <div class="plan-day-card__header">
        <h3>${escapeHtml(plan.name)}</h3>
        <button class="icon-btn delete-custom-plan-btn" data-id="${plan.id}" title="Plan löschen">✕</button>
      </div>
      ${plan.days.map(d => `
        <p style="font-family:var(--font-mono);font-size:0.75rem;color:var(--accent-3);text-transform:uppercase;margin-top:0.6rem;">${escapeHtml(d.name)}</p>
        ${d.exercises.map(e => `
          <div class="exercise-row">
            <div class="exercise-row__top">
              <span class="exercise-row__name">${escapeHtml(e.name)}</span>
            </div>
            <div class="exercise-row__meta">${e.sets} Sätze × ${e.reps} · Pause ${e.rest}</div>
          </div>
        `).join('')}
      `).join('')}
    </div>
  `).join('');

  container.querySelectorAll('.delete-custom-plan-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.customPlans = state.customPlans.filter(p => p.id !== btn.dataset.id);
      saveState();
      renderSavedCustomPlans();
    });
  });
}

/* --------------------------------------------------------------------
   13. ÜBUNGSDATENBANK-ANSICHT
-------------------------------------------------------------------- */

let activeCategoryFilter = 'Alle';

function renderExerciseDatabase() {
  const categories = ['Alle', ...new Set(EXERCISES.map(e => e.category))];
  el('exercise-filter-bar').innerHTML = categories.map(cat =>
    `<button class="filter-chip ${cat === activeCategoryFilter ? 'active' : ''}" data-cat="${cat}">${cat}</button>`
  ).join('');

  el('exercise-filter-bar').querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      activeCategoryFilter = chip.dataset.cat;
      renderExerciseDatabase();
    });
  });

  const filtered = activeCategoryFilter === 'Alle' ? EXERCISES : EXERCISES.filter(e => e.category === activeCategoryFilter);

  el('exercise-grid').innerHTML = filtered.map(e => `
    <div class="exercise-card">
      <div class="exercise-card__top">
        <h4>${e.name}</h4>
        <span class="difficulty-tag difficulty-tag--${e.difficulty}">${DIFFICULTY_LABEL[e.difficulty]}</span>
      </div>
      <div class="exercise-card__muscle">${e.category}</div>
      <p class="exercise-card__desc">${e.description}</p>
      <div class="exercise-card__equipment">
        ${e.equipment.map(eq => `<span class="equip-tag">${EQUIPMENT_LABEL[eq]}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

/* --------------------------------------------------------------------
   14. RANGSYSTEM-ANSICHT
-------------------------------------------------------------------- */

function renderRanking() {
  const container = el('ranking-grid');
  container.innerHTML = Object.entries(RANK_TRACKS).map(([key, track]) => {
    const value = state.personalRecords[key] || 0;
    const info = getRankInfo(key, value);
    return `
      <div class="rank-card" id="rank-card-${key}">
        <div class="rank-card__top">
          <span class="rank-card__title">${track.label}</span>
          <span class="rank-badge rank-badge--${info.rank.toLowerCase()}">${info.icon} ${info.rank}</span>
        </div>
        <div class="rank-card__body">
          <div class="rank-card__character">
            ${buildRankCharacter(info.rank)}
            <span class="rank-card__character-label">${CHARACTER_STAGES[Math.max(0, RANK_NAMES.indexOf(info.rank))].label}</span>
          </div>
          <div class="rank-card__numbers">
            <div class="rank-card__value">${info.value} <span>/ ${info.nextThreshold ?? info.value} ${track.unit}</span></div>
            <div class="progress-bar"><div class="progress-bar__fill" style="width:${info.progressPercent}%"></div></div>
          </div>
        </div>
        <div class="rank-card__next">${info.nextRank ? `Noch ${info.remaining} ${track.unit} bis ${info.nextRank}` : 'Höchster Rang erreicht — Elite! 👑'}</div>
        <div class="rank-card__input-row">
          <input type="number" min="0" placeholder="Neue Bestleistung (${track.unit})" id="rank-input-${key}">
          <button class="btn btn--ghost" data-track="${key}">Speichern</button>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.rank-card__input-row button').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.track;
      const input = el(`rank-input-${key}`);
      const val = Number(input.value);
      if (!val && val !== 0) return;

      const oldRank = getRankInfo(key, state.personalRecords[key] || 0).rank;
      state.personalRecords[key] = val;
      saveState();
      renderRanking();
      renderDashboard();

      const newRank = getRankInfo(key, val).rank;
      if (newRank !== oldRank) {
        const card = el(`rank-card-${key}`);
        card?.classList.add('just-ranked-up');
        setTimeout(() => card?.classList.remove('just-ranked-up'), 900);
      }
    });
  });
}

/* --------------------------------------------------------------------
   15. ERNÄHRUNG-ANSICHT
-------------------------------------------------------------------- */

function renderNutrition() {
  const n = getFullNutrition(state.profile);
  el('nutrition-stat-cards').innerHTML = buildNutritionCardsHtml(n);
}

/* --------------------------------------------------------------------
   16. FORTSCHRITT-ANSICHT (Gewicht, Vorher/Nachher, Workouts)
-------------------------------------------------------------------- */

function renderProgress() {
  // Gewichtsdiagramm zuerst, damit es beim Öffnen der Ansicht sofort aktuell ist
  renderWeightChart();

  // Gewichtsverlauf
  const list = el('weight-history-list');
  if (!state.weightHistory.length) {
    list.innerHTML = '<p class="empty-state">Noch keine Einträge.</p>';
  } else {
    list.innerHTML = [...state.weightHistory].reverse().slice(0, 8).map(entry => `
      <div class="pr-row"><span>${new Date(entry.date).toLocaleDateString('de-DE')}</span><span>${entry.weight} kg</span></div>
    `).join('');
  }

  // Vorher/Nachher-Silhouetten aktualisieren
  renderBeforeAfter();

  // Absolvierte Workouts
  const box = el('completed-workouts-box');
  if (!state.completedWorkouts.length) {
    box.innerHTML = '<p class="empty-state">Noch keine Workouts abgeschlossen. Los geht’s im Dashboard!</p>';
  } else {
    box.innerHTML = [...state.completedWorkouts].reverse().slice(0, 10).map(w => `
      <div class="pr-row"><span>${w.dayName}</span><span>${new Date(w.date).toLocaleDateString('de-DE')}</span></div>
    `).join('') + `<p class="empty-state" style="margin-top:0.6rem;">Insgesamt ${state.completedWorkouts.length} Workouts absolviert 🎉</p>`;
  }
}

/* --------------------------------------------------------------------
   16b. GEWICHTSVERLAUF-DIAGRAMM
   Zeichnet den Gewichtsverlauf als weiche SVG-Linie mit Flächenfüllung,
   Zielgewicht-Markierung und wählbarem Zeitraum (Alle/3M/1M).
-------------------------------------------------------------------- */

let weightChartRange = 'all';

function filterHistoryByRange(history, range) {
  if (range === 'all' || history.length < 2) return history;
  const days = range === '1m' ? 30 : 90;
  const cutoff = Date.now() - days * 86400000;
  const filtered = history.filter(h => new Date(h.date).getTime() >= cutoff);
  // Mindestens 2 Punkte behalten, sonst wirkt der Chart leer
  return filtered.length >= 2 ? filtered : history.slice(-2);
}

// Catmull-Rom -> kubische Bezier-Kurve für eine weiche, aber datentreue Linie
function buildSmoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

function renderWeightChart() {
  const rangeBox = el('weight-chart-range');
  const ranges = [{ key: 'all', label: 'Alle' }, { key: '3m', label: '3 Monate' }, { key: '1m', label: '1 Monat' }];
  rangeBox.innerHTML = ranges.map(r =>
    `<button type="button" class="filter-chip filter-chip--sm ${weightChartRange === r.key ? 'active' : ''}" data-range="${r.key}">${r.label}</button>`
  ).join('');
  rangeBox.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => { weightChartRange = btn.dataset.range; renderWeightChart(); });
  });

  const canvas = el('weight-chart-canvas');
  const statsBox = el('weight-chart-stats');
  const full = state.weightHistory;

  if (full.length < 2) {
    canvas.innerHTML = `<p class="empty-state">Trage mindestens zwei Gewichte ein, um deinen Verlauf als Diagramm zu sehen.</p>`;
    statsBox.innerHTML = '';
    return;
  }

  const history = filterHistoryByRange(full, weightChartRange);
  const weights = history.map(h => h.weight);
  const times = history.map(h => new Date(h.date).getTime());

  const target = state.profile.targetWeight;
  let minW = Math.min(...weights);
  let maxW = Math.max(...weights);
  if (target) { minW = Math.min(minW, target); maxW = Math.max(maxW, target); }
  const padW = Math.max((maxW - minW) * 0.18, 1.2);
  minW -= padW; maxW += padW;

  // Layout: Breite in echten Pixeln messen, damit Text auf jedem Screen
  // gleich groß bleibt (statt über die viewBox mitzuskalieren und auf
  // schmalen Handys unlesbar zu werden).
  const measuredW = canvas.getBoundingClientRect().width;
  const W = measuredW > 40 ? Math.round(measuredW) : 600;
  const H = W < 420 ? 240 : 200;
  const padL = 34, padR = 12, padT = 16, padB = 28;
  const plotW = W - padL - padR, plotH = H - padT - padB;

  const minT = times[0], maxT = times[times.length - 1];
  const xScale = (t) => padL + (maxT === minT ? plotW / 2 : ((t - minT) / (maxT - minT)) * plotW);
  const yScale = (w) => padT + plotH - ((w - minW) / (maxW - minW)) * plotH;

  const pts = history.map((h, i) => ({ x: xScale(times[i]), y: yScale(h.weight), w: h.weight, date: h.date }));
  const linePath = buildSmoothPath(pts);
  const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${(padT + plotH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(padT + plotH).toFixed(1)} Z`;

  // Horizontale Gitterlinien + Gewichts-Beschriftung (4 Stufen)
  const gridSteps = 4;
  let gridHtml = '';
  for (let i = 0; i <= gridSteps; i++) {
    const w = minW + ((maxW - minW) / gridSteps) * i;
    const y = yScale(w);
    gridHtml += `
      <line class="wc-grid" x1="${padL}" y1="${y.toFixed(1)}" x2="${W - padR}" y2="${y.toFixed(1)}"/>
      <text class="wc-axis-label" x="${padL - 8}" y="${(y + 3).toFixed(1)}" text-anchor="end">${Math.round(w)}</text>`;
  }

  // Zielgewicht-Linie
  let targetHtml = '';
  if (target && target >= minW && target <= maxW) {
    const ty = yScale(target);
    targetHtml = `
      <line class="wc-target-line" x1="${padL}" y1="${ty.toFixed(1)}" x2="${W - padR}" y2="${ty.toFixed(1)}"/>
      <text class="wc-target-label" x="${padL + 4}" y="${(ty - 5).toFixed(1)}" text-anchor="start">Ziel ${target} kg</text>`;
  }

  // Datumsbeschriftung: erster, mittlerer, letzter Punkt
  const dateFmt = (t) => new Date(t).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  const midIdx = Math.floor((pts.length - 1) / 2);
  const xLabels = [0, midIdx, pts.length - 1]
    .filter((v, i, a) => a.indexOf(v) === i)
    .map(i => `<text class="wc-axis-label" x="${pts[i].x.toFixed(1)}" y="${H - 6}" text-anchor="middle">${dateFmt(times[i])}</text>`)
    .join('');

  // Punkte (letzter Punkt = "jetzt", größer & pulsierend)
  const pointsHtml = pts.map((p, i) => {
    const isLast = i === pts.length - 1;
    return `<circle class="wc-point ${isLast ? 'wc-point--last' : ''}" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${isLast ? 5 : 3.2}">
      <title>${new Date(p.date).toLocaleDateString('de-DE')}: ${p.w} kg</title>
    </circle>`;
  }).join('');

  canvas.innerHTML = `
    <svg class="wc-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="wcFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.32"/>
          <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${gridHtml}
      ${targetHtml}
      <path class="wc-area" d="${areaPath}"/>
      <path class="wc-line" d="${linePath}"/>
      ${pointsHtml}
      ${xLabels}
    </svg>`;

  // Kennzahlen über dem Chart
  const first = weights[0], last = weights[weights.length - 1];
  const diff = last - first;
  const min = Math.min(...weights), max = Math.max(...weights);
  statsBox.innerHTML = `
    <div class="wc-stat"><span>${last}<small> kg</small></span><label>Aktuell</label></div>
    <div class="wc-stat"><span class="${diff < 0 ? 'is-down' : diff > 0 ? 'is-up' : ''}">${diff > 0 ? '+' : ''}${diff.toFixed(1)}<small> kg</small></span><label>Veränderung</label></div>
    <div class="wc-stat"><span>${min}<small>–${max}</small></span><label>Spanne</label></div>
  `;
}

// Zeichnet den Chart bei Fenstergrößenänderung neu, damit Text und
// Proportionen auf jeder Bildschirmbreite exakt in echten Pixeln passen
// (siehe Breitenmessung in renderWeightChart).
let weightChartResizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(weightChartResizeTimer);
  weightChartResizeTimer = setTimeout(() => {
    if (el('view-progress')?.classList.contains('active')) renderWeightChart();
  }, 150);
});

function logWeight() {
  const input = el('log-weight-input');
  const val = Number(input.value);
  if (!val) return;
  state.weightHistory.push({ date: new Date().toISOString(), weight: val });
  saveState();
  input.value = '';
  renderProgress();
  renderDashboard();
}

/* --------------------------------------------------------------------
   17. VORHER/NACHHER-VERGLEICH
   Zeichnet zwei Silhouetten, deren Körperform sich aus dem jeweiligen
   BMI ableitet (Startgewicht vs. aktuelles Gewicht). So wird der
   Fortschritt sichtbar, ohne echte Fotos zu benötigen.
-------------------------------------------------------------------- */

// Rechnet einen BMI in Silhouetten-Proportionen um.
function silhouetteShapeFromBMI(bmi) {
  // Bereich ca. 19–36 BMI auf 0..1 normieren
  const t = Math.min(Math.max((bmi - 19) / 17, 0), 1);
  return {
    waist: 21 + t * 24,        // schmale bis breite Taille
    shoulder: 36 - t * 2,      // hoher BMI -> weniger ausgeprägte V-Form
    hip: 25 + t * 17,
    thigh: 17 + t * 9,
    calf: 11 + t * 4,
    arm: 9 + t * 5,
    belly: t
  };
}

// Baut das SVG einer Körpersilhouette
function buildSilhouette(bmi, variant) {
  const s = silhouetteShapeFromBMI(bmi);
  const cx = 100;
  const shoulderY = 104;
  const waistY = 168;
  const hipY = 196;
  const kneeY = 286;
  const footY = 372;

  const bellyOut = s.waist + s.belly * 9;
  const armGap = 3;                       // Abstand Arm <-> Rumpf
  const armTopX = s.shoulder - 4;
  const handY = 214;

  return `
  <svg class="ba-figure ba-figure--${variant}" viewBox="0 0 200 400" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
    <!-- Kopf & Hals -->
    <ellipse class="ba-fig-part" cx="${cx}" cy="46" rx="23" ry="26"/>
    <path class="ba-fig-part" d="M${cx - 9} 66 L${cx + 9} 66 L${cx + 11} 92 L${cx - 11} 92 Z"/>

    <!-- Rumpf: Schultern -> Taille -> Hüfte -->
    <path class="ba-fig-part" d="
      M${cx - s.shoulder} ${shoulderY}
      C${cx - s.shoulder - 2} ${shoulderY + 26} ${cx - bellyOut} ${waistY - 24} ${cx - s.waist} ${waistY}
      C${cx - s.waist - 3} ${waistY + 12} ${cx - s.hip} ${hipY - 12} ${cx - s.hip} ${hipY + 6}
      L${cx + s.hip} ${hipY + 6}
      C${cx + s.hip} ${hipY - 12} ${cx + s.waist + 3} ${waistY + 12} ${cx + s.waist} ${waistY}
      C${cx + bellyOut} ${waistY - 24} ${cx + s.shoulder + 2} ${shoulderY + 26} ${cx + s.shoulder} ${shoulderY}
      C${cx + 20} ${shoulderY - 16} ${cx - 20} ${shoulderY - 16} ${cx - s.shoulder} ${shoulderY} Z"/>

    <!-- Arme: liegen leicht abgespreizt neben dem Rumpf -->
    <path class="ba-fig-part" d="
      M${cx - armTopX} ${shoulderY - 2}
      C${cx - s.shoulder - s.arm} ${shoulderY + 30} ${cx - s.shoulder - s.arm - 2} ${waistY} ${cx - s.waist - armGap - s.arm * 0.7} ${handY}
      L${cx - s.waist - armGap} ${handY}
      C${cx - s.waist - armGap + 2} ${waistY} ${cx - armTopX + 4} ${shoulderY + 28} ${cx - armTopX + 12} ${shoulderY} Z"/>
    <path class="ba-fig-part" d="
      M${cx + armTopX} ${shoulderY - 2}
      C${cx + s.shoulder + s.arm} ${shoulderY + 30} ${cx + s.shoulder + s.arm + 2} ${waistY} ${cx + s.waist + armGap + s.arm * 0.7} ${handY}
      L${cx + s.waist + armGap} ${handY}
      C${cx + s.waist + armGap - 2} ${waistY} ${cx + armTopX - 4} ${shoulderY + 28} ${cx + armTopX - 12} ${shoulderY} Z"/>

    <!-- Beine: Oberschenkel -> Knie -> Wade -> Fuß -->
    <path class="ba-fig-part" d="
      M${cx - s.hip} ${hipY}
      C${cx - s.hip - 1} ${hipY + 50} ${cx - s.thigh - 4} ${kneeY - 30} ${cx - s.calf - 5} ${kneeY}
      C${cx - s.calf - 6} ${kneeY + 40} ${cx - s.calf - 1} ${footY - 26} ${cx - s.calf - 1} ${footY}
      L${cx - 5} ${footY}
      C${cx - 5} ${footY - 30} ${cx - 6} ${kneeY + 30} ${cx - 6} ${kneeY}
      C${cx - 6} ${hipY + 50} ${cx - 5} ${hipY + 20} ${cx - 4} ${hipY} Z"/>
    <path class="ba-fig-part" d="
      M${cx + s.hip} ${hipY}
      C${cx + s.hip + 1} ${hipY + 50} ${cx + s.thigh + 4} ${kneeY - 30} ${cx + s.calf + 5} ${kneeY}
      C${cx + s.calf + 6} ${kneeY + 40} ${cx + s.calf + 1} ${footY - 26} ${cx + s.calf + 1} ${footY}
      L${cx + 5} ${footY}
      C${cx + 5} ${footY - 30} ${cx + 6} ${kneeY + 30} ${cx + 6} ${kneeY}
      C${cx + 6} ${hipY + 50} ${cx + 5} ${hipY + 20} ${cx + 4} ${hipY} Z"/>

    <!-- Füße -->
    <path class="ba-fig-part" d="M${cx - s.calf - 2} ${footY - 2} L${cx - 4} ${footY - 2} L${cx - 4} ${footY + 8} L${cx - s.calf - 9} ${footY + 8} Z"/>
    <path class="ba-fig-part" d="M${cx + s.calf + 2} ${footY - 2} L${cx + 4} ${footY - 2} L${cx + 4} ${footY + 8} L${cx + s.calf + 9} ${footY + 8} Z"/>
  </svg>`;
}

function renderBeforeAfter() {
  const p = state.profile;
  const history = state.weightHistory;

  const startWeight = history.length ? history[0].weight : p.weight;
  const currentWeight = history.length ? history[history.length - 1].weight : p.weight;
  const height = p.height || 175;

  const startBMI = calcBMI(startWeight || 75, height);
  const currentBMI = calcBMI(currentWeight || 75, height);

  el('ba-scene-before').innerHTML = buildSilhouette(startBMI, 'before');
  el('ba-scene-after').innerHTML = buildSilhouette(currentBMI, 'after');

  el('ba-weight-before').textContent = startWeight ? `${startWeight} kg` : '– kg';
  el('ba-weight-after').textContent = currentWeight ? `${currentWeight} kg` : '– kg';

  // Veränderung
  const diff = (currentWeight && startWeight) ? currentWeight - startWeight : 0;
  const diffEl = el('before-after-diff');
  diffEl.textContent = `${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg`;
  diffEl.classList.toggle('is-down', diff < 0);
  diffEl.classList.toggle('is-up', diff > 0);

  // Zeitraum
  if (state.beforeAfterStartDate) {
    const days = Math.max(1, Math.round((Date.now() - new Date(state.beforeAfterStartDate).getTime()) / 86400000));
    el('before-after-time').textContent = days < 31
      ? `${days} Tag${days === 1 ? '' : 'e'}`
      : `${Math.round(days / 30)} Monat${Math.round(days / 30) === 1 ? '' : 'e'}`;
  }

  el('before-after-entries').textContent = history.length;
  el('before-after-workouts').textContent = state.completedWorkouts.length;
}

function initBeforeAfterSlider() {
  const container = el('before-after-slider');
  const clip = el('before-after-before-clip');
  const handle = el('before-after-handle');
  let dragging = false;

  // clip-path statt Breiten-Trick: beide Ebenen bleiben exakt gleich groß,
  // dadurch verschiebt sich die Silhouette beim Ziehen nicht mehr.
  const setPosition = (clientX) => {
    const rect = container.getBoundingClientRect();
    let pct = ((clientX - rect.left) / rect.width) * 100;
    pct = Math.min(Math.max(pct, 0), 100);
    clip.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    handle.style.left = `${pct}%`;
  };

  const startDrag = (e) => { dragging = true; container.classList.add('is-dragging'); e.preventDefault?.(); };
  const stopDrag = () => { dragging = false; container.classList.remove('is-dragging'); };

  handle.addEventListener('mousedown', startDrag);
  window.addEventListener('mouseup', stopDrag);
  window.addEventListener('mousemove', (e) => { if (dragging) setPosition(e.clientX); });

  handle.addEventListener('touchstart', startDrag, { passive: false });
  window.addEventListener('touchend', stopDrag);
  window.addEventListener('touchmove', (e) => { if (dragging) setPosition(e.touches[0].clientX); }, { passive: true });

  // Klick irgendwo im Bild setzt den Regler dorthin
  container.addEventListener('click', (e) => { if (!dragging) setPosition(e.clientX); });

  // Mit Pfeiltasten bedienbar
  handle.tabIndex = 0;
  handle.setAttribute('role', 'slider');
  handle.setAttribute('aria-label', 'Vorher-Nachher-Vergleich');
  handle.addEventListener('keydown', (e) => {
    const rect = container.getBoundingClientRect();
    const current = parseFloat(handle.style.left) || 50;
    if (e.key === 'ArrowLeft') setPosition(rect.left + rect.width * (Math.max(current - 4, 0) / 100));
    if (e.key === 'ArrowRight') setPosition(rect.left + rect.width * (Math.min(current + 4, 100) / 100));
  });

  // Startposition
  clip.style.clipPath = 'inset(0 50% 0 0)';
  handle.style.left = '50%';
}

/* --------------------------------------------------------------------
   18. PROFIL-ANSICHT
-------------------------------------------------------------------- */

function renderProfile() {
  const p = state.profile;
  el('profile-summary').innerHTML = `
    <div class="profile-summary__item"><span>Name</span><span>${escapeHtml(p.firstName) || '–'}</span></div>
    <div class="profile-summary__item"><span>Alter</span><span>${p.age ?? '–'}</span></div>
    <div class="profile-summary__item"><span>Größe</span><span>${p.height ?? '–'} cm</span></div>
    <div class="profile-summary__item"><span>Gewicht</span><span>${p.weight ?? '–'} kg</span></div>
    <div class="profile-summary__item"><span>Ziel</span><span>${GOAL_LABEL[p.goal] ?? '–'}</span></div>
    <div class="profile-summary__item"><span>Level</span><span>${LEVEL_LABEL[p.level] ?? '–'}</span></div>
    <div class="profile-summary__item"><span>Trainingstage</span><span>${p.daysPerWeek}/Woche</span></div>
    <div class="profile-summary__item"><span>Dauer</span><span>~${p.duration} Min</span></div>
    <div class="profile-summary__item"><span>Trainingsort</span><span>${LOCATION_LABEL[p.location] ?? '–'}</span></div>
  `;
}

/* --------------------------------------------------------------------
   19. AI-TRAINER CHAT-UI
-------------------------------------------------------------------- */

const CHAT_SUGGESTIONS = [
  'Was soll ich heute trainieren?',
  'Wie kann ich mehr Klimmzüge schaffen?',
  'Was kann ich statt Kniebeugen machen?',
  'Ich habe heute wenig Zeit, was soll ich trainieren?',
  'Wie kann ich meinen Trainingsplan verbessern?'
];

function renderChatWelcome() {
  const messages = el('chat-messages');
  if (state.chatHistory.length) {
    messages.innerHTML = state.chatHistory.map(m => chatBubbleHtml(m.role, m.text)).join('');
  } else {
    const name = state.profile.firstName || 'da';
    messages.innerHTML = chatBubbleHtml('ai', `Hey ${name}! Ich bin dein persönlicher AI Trainer 💬 Frag mich alles rund um dein Training, deine Übungen oder deinen Plan.`);
  }
  renderChatSuggestions();
  messages.scrollTop = messages.scrollHeight;
}

function renderChatSuggestions() {
  el('chat-suggestions').innerHTML = CHAT_SUGGESTIONS.map(s => `<button type="button" class="chat-suggestion-chip">${s}</button>`).join('');
  el('chat-suggestions').querySelectorAll('.chat-suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => sendChatMessage(chip.textContent));
  });
}

function chatBubbleHtml(role, text) {
  return `<div class="chat-bubble chat-bubble--${role === 'user' ? 'user' : 'ai'}">${escapeHtml(text)}</div>`;
}

function handleChatSubmit(e) {
  e.preventDefault();
  const input = el('chat-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  sendChatMessage(text);
}

async function sendChatMessage(text) {
  const messages = el('chat-messages');
  state.chatHistory.push({ role: 'user', text });
  messages.insertAdjacentHTML('beforeend', chatBubbleHtml('user', text));
  messages.scrollTop = messages.scrollHeight;
  saveState();

  const typingEl = document.createElement('div');
  typingEl.className = 'chat-bubble chat-bubble--ai chat-bubble--typing';
  typingEl.innerHTML = '<span></span><span></span><span></span>';
  messages.appendChild(typingEl);
  messages.scrollTop = messages.scrollHeight;

  const reply = await askAI(text);

  typingEl.remove();
  state.chatHistory.push({ role: 'ai', text: reply });
  messages.insertAdjacentHTML('beforeend', chatBubbleHtml('ai', reply));
  messages.scrollTop = messages.scrollHeight;
  saveState();
}

/* --------------------------------------------------------------------
   20. HILFSFUNKTIONEN
-------------------------------------------------------------------- */

function escapeHtml(str) {
  if (str == null) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
