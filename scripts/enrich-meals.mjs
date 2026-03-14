import { readFile, writeFile } from 'node:fs/promises';

const INPUT_PATH =
  '/Users/aliozreil/Desktop/Work/soso_website/data_handling/unique_meals.json';
const OUTPUT_PATH =
  '/Users/aliozreil/Desktop/Work/soso_website/data_handling/unique_meals_enriched.json';

const DAY_WORDS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
  'السبت',
  'الاحد',
  'الأحد',
  'الاثنين',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
];

const INVALID_EXACT = new Set([
  'day',
  'days',
  'وقت',
  'الوقت',
  'صباحا',
  'مساء',
]);

const macros = {
  // per unit
  egg: { p: 6, f: 5, c: 0.6, kcal: 72 },
  breadLoaf: { p: 5, f: 1, c: 33, kcal: 165 }, // 1 medium pita/loaf
  milkCupLowFat: { p: 8, f: 2.5, c: 12, kcal: 102 },
  yogurtCup: { p: 8, f: 3, c: 12, kcal: 110 },
  oatsTbsp: { p: 1.3, f: 0.7, c: 6.6, kcal: 38 },
  oliveOilTbsp: { p: 0, f: 14, c: 0, kcal: 119 },
  potatoCup: { p: 3, f: 0.2, c: 30, kcal: 130 },
  riceCup: { p: 4.3, f: 0.4, c: 45, kcal: 205 },
  saladCup: { p: 2, f: 0.5, c: 10, kcal: 50 },
  vegCup: { p: 2, f: 0.5, c: 10, kcal: 50 },
  apple: { p: 0.5, f: 0.3, c: 25, kcal: 95 },
  orange: { p: 1.2, f: 0.2, c: 15.4, kcal: 62 },
  bananaSmall: { p: 1.1, f: 0.3, c: 23, kcal: 90 },
  pear: { p: 0.6, f: 0.2, c: 26, kcal: 100 },
  kiwi: { p: 0.8, f: 0.4, c: 10, kcal: 42 },
  // per 100g
  chicken100g: { p: 31, f: 3.6, c: 0, kcal: 165 },
  fish100g: { p: 22, f: 2.5, c: 0, kcal: 110 },
  tuna100g: { p: 23, f: 1, c: 0, kcal: 105 },
  beef100g: { p: 26, f: 15, c: 0, kcal: 250 },
  cheese100g: { p: 17, f: 10, c: 3, kcal: 170 },
  hummusTbsp: { p: 1.3, f: 2.4, c: 2.5, kcal: 35 },
  beansTbsp: { p: 2.5, f: 0.2, c: 5, kcal: 35 },
};

function normalizeText(text) {
  return text
    .replace(/[()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function arabicToLatinDigits(text) {
  const map = {
    '٠': '0',
    '١': '1',
    '٢': '2',
    '٣': '3',
    '٤': '4',
    '٥': '5',
    '٦': '6',
    '٧': '7',
    '٨': '8',
    '٩': '9',
  };
  return text.replace(/[٠-٩]/g, (d) => map[d] ?? d);
}

function normalizeFractions(text) {
  return text
    .replace(/½/g, '0.5')
    .replace(/¼/g, '0.25')
    .replace(/¾/g, '0.75')
    .replace(/نص/g, '0.5')
    .replace(/نصف/g, '0.5')
    .replace(/ربع/g, '0.25')
    .replace(/ثلث/g, '0.33');
}

function isInvalidMeal(text) {
  const t = text.toLowerCase();
  if (INVALID_EXACT.has(t)) return true;
  if (DAY_WORDS.some((w) => t.includes(w))) return true;
  if (/^\d{1,2}:\d{2}$/.test(t)) return true;
  return t.length < 2;
}

function parseNumber(text) {
  const match = text.match(/(\d+(\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function sumMacros(total, add, multiplier = 1) {
  total.p += add.p * multiplier;
  total.f += add.f * multiplier;
  total.c += add.c * multiplier;
  total.kcal += add.kcal * multiplier;
}

function estimateForPart(part) {
  const p = part;
  const number = parseNumber(p) ?? 1;

  if (/(بيض|بيضة|بيضه)/.test(p)) {
    return scale(macros.egg, number);
  }

  if (/(رغيف|خبز)/.test(p)) {
    return scale(macros.breadLoaf, number);
  }

  if (/حليب/.test(p) && /كوب/.test(p)) {
    return scale(macros.milkCupLowFat, number);
  }

  if (/(لبن|زبادي|رايب)/.test(p) && /كوب/.test(p)) {
    return scale(macros.yogurtCup, number);
  }

  if (/(شوفان)/.test(p) && /ملعق/.test(p)) {
    return scale(macros.oatsTbsp, number);
  }

  if (/(زيت)/.test(p) && /ملعق/.test(p)) {
    return scale(macros.oliveOilTbsp, number);
  }

  if (/بطاطا|بطاطس/.test(p) && /كوب/.test(p)) {
    return scale(macros.potatoCup, number);
  }

  if (/رز/.test(p) && /كوب/.test(p)) {
    return scale(macros.riceCup, number);
  }

  if (/سلطة/.test(p) && /كوب/.test(p)) {
    return scale(macros.saladCup, number);
  }

  if (/(خضار|بروكلي|جزر|فليفلة|كوسا)/.test(p) && /كوب/.test(p)) {
    return scale(macros.vegCup, number);
  }

  if (/تفاح/.test(p)) return scale(macros.apple, number);
  if (/برتقال/.test(p)) return scale(macros.orange, number);
  if (/موز/.test(p)) return scale(macros.bananaSmall, number);
  if (/اجاص|كمثرى/.test(p)) return scale(macros.pear, number);
  if (/كيوي/.test(p)) return scale(macros.kiwi, number);

  const grams = p.match(/(\d+(\.\d+)?)\s*غرام/);
  const g = grams ? Number(grams[1]) : null;

  if (g) {
    if (/دجاج/.test(p)) return scale(macros.chicken100g, g / 100);
    if (/سمك/.test(p)) return scale(macros.fish100g, g / 100);
    if (/تونا/.test(p)) return scale(macros.tuna100g, g / 100);
    if (/ستيك|لحم/.test(p)) return scale(macros.beef100g, g / 100);
    if (/جبنة|جبن/.test(p)) return scale(macros.cheese100g, g / 100);
  }

  if (/حمص/.test(p) && /ملعق/.test(p)) {
    return scale(macros.hummusTbsp, number);
  }

  if (/(فول|فول مدمس)/.test(p) && /ملعق/.test(p)) {
    return scale(macros.beansTbsp, number);
  }

  return null;
}

function scale(item, multiplier) {
  return {
    p: item.p * multiplier,
    f: item.f * multiplier,
    c: item.c * multiplier,
    kcal: item.kcal * multiplier,
  };
}

function estimateMacros(meal) {
  const cleaned = normalizeFractions(arabicToLatinDigits(meal));
  const parts = cleaned
    .split(/\\+|\\n|،/g)
    .map((part) => part.trim())
    .filter(Boolean);

  const total = { p: 0, f: 0, c: 0, kcal: 0 };
  let matched = false;

  for (const part of parts) {
    const result = estimateForPart(part);
    if (result) {
      matched = true;
      sumMacros(total, result, 1);
    }
  }

  if (!matched) return null;

  return {
    protein: round(total.p),
    fat: round(total.f),
    carbs: round(total.c),
    calories: round(total.kcal),
  };
}

function round(value) {
  return Math.round(value * 10) / 10;
}

async function main() {
  const raw = await readFile(INPUT_PATH, 'utf8');
  const data = JSON.parse(raw);

  if (!Array.isArray(data)) {
    throw new Error('Expected an array in unique_meals.json');
  }

  const seen = new Set();
  const cleaned = [];

  for (const entry of data) {
    if (!entry?.meal || typeof entry.meal !== 'string') continue;
    const normalized = normalizeText(entry.meal);
    if (isInvalidMeal(normalized)) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const estimate = estimateMacros(normalized);

    cleaned.push({
      meal: normalized,
      protein: estimate?.protein ?? null,
      fat: estimate?.fat ?? null,
      carbs: estimate?.carbs ?? null,
      calories: estimate?.calories ?? null,
    });
  }

  await writeFile(OUTPUT_PATH, JSON.stringify(cleaned, null, 2), 'utf8');
  console.log(`Wrote ${cleaned.length} meals to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
