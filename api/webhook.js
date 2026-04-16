// PREVENTA WhatsApp Webhook — Full SAVA+E syndemic engine
// Domains: HIV · Mental Health · Stigma · Substance Misuse · Violence/GBV · Economic Instability
// Evidence: Logie, Okumu et al. 2022 (BMJ Global Health) + Bhardwaj et al. 2023 + Sheira et al. 2023
// Deploy: vercel deploy

// ─── ENVIRONMENT ─────────────────────────────────────────────────────────────
const VERIFY_TOKEN   = process.env.VERIFY_TOKEN   || 'preventa_verify_2026';
const WA_TOKEN       = process.env.WA_TOKEN;
const ANTHROPIC_KEY  = process.env.ANTHROPIC_API_KEY;
const WA_PHONE_ID    = process.env.WA_PHONE_NUMBER_ID;

// ─── CHW REGISTRY ────────────────────────────────────────────────────────────
// For internal testing: add researcher numbers here.
// After ethics approval: replace with database lookup (see DB_QUERY comment below).
const CHW_REGISTRY = {
  // Format: 'countrycode+number': { district, lang, pop, role, lat, lon }
  // '256700000001': { district:'Kampala', lang:'Luganda', pop:'AGYW 15-24', role:'researcher', lat:0.3476, lon:32.5825 },
  // '256700000002': { district:'Busia',   lang:'Lusamia', pop:'sex workers', role:'researcher', lat:0.4647, lon:34.0904 },
};

// ─── DISTRICT GEOCODES + RESOURCES ───────────────────────────────────────────
// Latitude/longitude centroids for geocoded resource routing
const DISTRICT_DATA = {
  Kampala: {
    lat: 0.3476, lon: 32.5825, region: 'Kampala',
    hiv_prev: '~9%', vls: '78.6%',
    resources: {
      hiv:        ['MARPI Clinic, Mulago Hospital — 0800-100-066 (free)', 'IDI Kampala — Walk-in, Mon–Sat 8am–5pm', 'Kampala Capital City Authority (KCCA) Health Centres — all divisions'],
      mental:     ['Butabika National Referral Hospital — mental health OPD, free', 'Reach-a-Hand Uganda — youth mental health, 0800-100-070', 'MARPI psychosocial support — Mulago compound'],
      stigma:     ['MARPI key population support groups — weekly sessions', 'TASO Kampala — support groups for PLHIV, Mulago Road', 'Uganda Key Populations Consortium — 0414-534-858'],
      substance:  ['MARPI — substance use counselling integrated', 'Butabika rehabilitation ward — referral required', 'Reach-a-Hand Uganda — substance misuse youth line'],
      violence:   ['MIFUMI Project — GBV shelter, 0800-200-933 (free 24h)', 'FIDA Uganda — legal aid for GBV survivors, 0414-230-767', 'Kawempe Home Care — safe house', 'Uganda Police — Gender Violence Hotline: 0800-199-911'],
      economic:   ['KCCA Social Protection Office — OVC grants, Nakivubo', 'Kampala District Livelihood Programme (KDLP) — microfinance', 'Uganda Women Finance Trust (UWFT) — small loans', 'WFP Uganda — urban food assistance, check eligibility at wfp.org/countries/uganda'],
    }
  },
  Wakiso: {
    lat: 0.4044, lon: 32.4586, region: 'Central 1',
    hiv_prev: '~8%', vls: '78.6%',
    resources: {
      hiv:        ['Entebbe Grade B Hospital — HIV clinic, walk-in', 'Wakiso District Health Office — 0392-177-264', 'IDI satellite clinics — Wakiso town'],
      mental:     ['Wakiso District Hospital — mental health unit', 'Reach-a-Hand Uganda referral via 0800-100-070'],
      stigma:     ['TASO Entebbe branch — support groups', 'Wakiso PLHIV Network — community groups'],
      substance:  ['Wakiso District Health Office referral to Butabika', 'MARPI outreach teams — Wakiso'],
      violence:   ['MIFUMI outreach — Wakiso', 'Police Gender Desk — Wakiso Central Police Station', 'FIDA Uganda referral'],
      economic:   ['Wakiso District Community Development Office — OVC', 'BRAC Uganda — microfinance, Wakiso branch', 'SACCOs through Wakiso District Cooperative Office'],
    }
  },
  Jinja: {
    lat: 0.4244, lon: 33.2041, region: 'East Central',
    hiv_prev: '~7%', vls: '60.3%',
    resources: {
      hiv:        ['Jinja Regional Referral Hospital — HIV clinic', 'TASO Jinja — ART, counselling, support groups', 'MARPI regional hub, Jinja RRH'],
      mental:     ['Jinja RRH — mental health unit, psychiatry OPD', 'TASO Jinja — psychosocial support integrated'],
      stigma:     ['TASO Jinja support groups — weekly', 'Fishermen community health workers — peer support'],
      substance:  ['Jinja RRH — referral to substance use services', 'TASO counsellors — integrated substance use screening'],
      violence:   ['Jinja Police — Gender Desk, Main Street Police', 'MIFUMI Jinja outreach', 'Safe house referral via FIDA — 0414-230-767'],
      economic:   ['Jinja District Community Development — OVC cash transfers', 'PRIDE Microfinance Jinja branch', 'Fishing community cooperatives — Jinja landing sites'],
    }
  },
  Masaka: {
    lat: -0.3313, lon: 31.7367, region: 'Central 1',
    hiv_prev: '~7.5%', vls: '78.6%',
    resources: {
      hiv:        ['Masaka Regional Referral Hospital — HIV/AIDS clinic', 'TASO Masaka — comprehensive HIV services', 'MARPI regional hub, Masaka RRH'],
      mental:     ['Masaka RRH — psychiatry OPD', 'TASO Masaka — psychosocial support'],
      stigma:     ['TASO Masaka support groups', 'Masaka PLHIV Network'],
      substance:  ['Masaka RRH — referral pathway', 'TASO Masaka counsellors'],
      violence:   ['Masaka Police — Gender Desk', 'FIDA Uganda — Masaka outreach', 'MIFUMI referral network'],
      economic:   ['Masaka District Livelihood Programme', 'BRAC Uganda Masaka branch', 'Post Bank Uganda — savings, Masaka branch'],
    }
  },
  Mbarara: {
    lat: -0.6072, lon: 30.6545, region: 'South Western',
    hiv_prev: '~6.8%', vls: '82.8%',
    resources: {
      hiv:        ['Mbarara University Teaching Hospital (MUST) — HIV clinic', 'TASO Mbarara', 'Mbarara RRH — ART clinic'],
      mental:     ['MUST Psychiatry Department — OPD', 'Mbarara RRH — mental health unit'],
      stigma:     ['TASO Mbarara — support groups', 'MUST community outreach'],
      substance:  ['MUST — addiction counselling referral', 'Mbarara RRH — substance use screening'],
      violence:   ['Mbarara Central Police — Gender Desk', 'FIDA Uganda — South Western region office', 'Safe house: UWONET referral'],
      economic:   ['Mbarara District Community Development — OVC', 'PRIDE Microfinance Mbarara', 'Centenary Bank Mbarara — small business loans'],
    }
  },
  Busia: {
    lat: 0.4647, lon: 34.0904, region: 'Mid Eastern',
    hiv_prev: '~6.5%', vls: '60.3%',
    resources: {
      hiv:        ['Busia District Hospital — HIV clinic', 'MARPI regional outreach — Busia border', 'Cross-border health posts — Kenya/Uganda border'],
      mental:     ['Busia District Hospital — clinical officer referral', 'Tororo RRH — mental health unit (nearest)'],
      stigma:     ['Busia PLHIV Network — community groups', 'FSW peer support groups — MARPI outreach'],
      substance:  ['Busia District Health Office — referral to Tororo RRH', 'Harm reduction outreach — MARPI border programme'],
      violence:   ['Busia Police — Gender Desk, Main Station', 'Cross-border GBV network — UWONET/FIDA referral', 'Busia District Community Development'],
      economic:   ['Busia District Livelihood Programme', 'Cross-border trader associations — Busia market', 'Equity Bank Busia — mobile banking, USSD *247#', 'WFP Uganda — border community food assistance'],
    }
  }
};

// ─── DOMAIN DETECTION ────────────────────────────────────────────────────────
// Returns array of detected domains — multiple can co-occur (syndemic)
function detectDomains(text) {
  const t = text.toLowerCase();
  const domains = [];

  // VIOLENCE — always checked first, overrides all others if detected
  const violenceSignals = ['beat','beaten','hit','kick','hurt','bruise','attack','threaten','weapon','knife','gun','rape','force','coerce','gbv','ipv','unsafe','afraid','scared','danger','abuse','assault'];
  if (violenceSignals.some(s => t.includes(s))) domains.push('violence');

  // HIV CASCADE
  const hivSignals = ['hiv','test','hivst','prep','condom','sti','art','arvs','viral load','cd4','linkage','testing','positive result','negative result','serostat','pmtct','prevention'];
  if (hivSignals.some(s => t.includes(s))) domains.push('hiv');

  // MENTAL HEALTH
  const mentalSignals = ['depress','sad','cry','hopeless','worthless','no reason to live','suicide','suicid','kill himself','kill herself','not eating','not sleeping','phq','anxiety','stress','trauma','ptsd','withdrawn','isolat'];
  if (mentalSignals.some(s => t.includes(s))) domains.push('mental');

  // STIGMA
  const stigmaSignals = ['stigma','shame','ashamed','discriminat','reject','hide','hiding','won\'t come','refuses clinic','afraid people know','embarrass','judge','gossip','secret','rumour'];
  if (stigmaSignals.some(s => t.includes(s))) domains.push('stigma');

  // SUBSTANCE MISUSE
  const substanceSignals = ['drink','drunk','alcohol','waragi','busaa','chang\'aa','beer','wine','drugs','cannabis','khat','miraa','cocaine','heroin','inject','high','overdos','sober','addict','depend'];
  if (substanceSignals.some(s => t.includes(s))) domains.push('substance');

  // ECONOMIC INSTABILITY
  const economicSignals = ['food','hungry','starving','no money','broke','evict','rent','unemploy','lost job','can\'t afford','can\'t pay','transactional sex','sex for money','sex for food','debt','loan','borrow','school fees','fees','survive','poverty','poor'];
  if (economicSignals.some(s => t.includes(s))) domains.push('economic');

  // SYNDEMIC ESCALATION: detect co-occurring signals
  // alcohol + violence = 4.81× multiplier (Logie, Okumu et al. 2022)
  // violence + depression = 7.13× multiplier (Logie, Okumu et al. 2022)
  // food insecurity = 1.60× transactional sex (Sheira et al. 2023)
  const syndemicFlag = (domains.includes('substance') && domains.includes('violence')) ||
                       (domains.includes('mental') && domains.includes('violence')) ||
                       (domains.includes('economic') && domains.includes('hiv'));

  return { domains, syndemicFlag };
}

// ─── GEOCODED RESOURCE LOOKUP ─────────────────────────────────────────────────
// Returns closest resources for a given domain based on CHW's district
function getResources(district, domains) {
  const data = DISTRICT_DATA[district] || DISTRICT_DATA['Kampala'];
  const resources = [];
  for (const domain of domains) {
    const key = domain === 'mental' ? 'mental' :
                domain === 'violence' ? 'violence' :
                domain === 'stigma' ? 'stigma' :
                domain === 'substance' ? 'substance' :
                domain === 'economic' ? 'economic' : 'hiv';
    const list = data.resources[key] || [];
    resources.push(...list.slice(0, 2)); // top 2 per domain
  }
  return [...new Set(resources)].slice(0, 4); // max 4 total
}

// ─── SYSTEM PROMPT BUILDER ────────────────────────────────────────────────────
function buildSystemPrompt(chw, domains, syndemicFlag, resources) {
  const domainInstructions = {
    violence: `VIOLENCE/GBV ACTIVE — SAFETY FIRST. Lead with immediate safety assessment. Reference Uganda GBV hotline (0800-199-911 free). Mandatory reporting for under-18. Do NOT proceed to prevention content until safety is secured.`,
    mental: `MENTAL HEALTH ACTIVE. Offer PHQ-9 screening if depression suspected. Score ≥10 = referral required. Suicidal ideation = stay with client, contact supervisor immediately. Reference Butabika/nearest mental health unit.`,
    stigma: `STIGMA ACTIVE. Validate experience — stigma is a documented barrier, not personal weakness. Identify whether enacted (others) or internalised (self). Support groups and peer connections reduce clinic avoidance.`,
    substance: `SUBSTANCE MISUSE ACTIVE. Offer AUDIT screening. Score ≥16 = dependence, primary referral is substance treatment before HIV cascade. NOTE: alcohol + violence = 4.81× HIV risk multiplier (Logie & Okumu, Kampala 2022) — screen for violence if alcohol mentioned.`,
    economic: `ECONOMIC INSTABILITY ACTIVE. Food insecurity independently increases transactional sex risk 1.60× (Rwanda data, similar mechanisms documented Kampala). Identify immediate need: food, rent, income, fees. Government OVC cash transfer eligibility. Refer to microfinance, not just health services.`,
    hiv: `HIV CASCADE ACTIVE. Match response to cascade stage: untested → offer HIVST; tested positive not linked → same-day linkage; on ART with adherence problem → identify barrier; on suppressed ART → reinforce and screen for comorbidities.`,
  };

  const syndemicNote = syndemicFlag
    ? `\nSYNDEMIC CO-OCCURRENCE DETECTED — your response MUST acknowledge the interaction, not treat conditions separately. Joint effects are multiplicative not additive. Addressing any one factor reduces risk across all others (Logie & Okumu, BMJ Global Health 2022).`
    : '';

  const domainBlock = domains.map(d => domainInstructions[d] || '').filter(Boolean).join('\n\n');

  const resourceBlock = resources.length > 0
    ? `\nNEAREST RESOURCES (${chw.district} district):\n` + resources.map(r => `• ${r}`).join('\n')
    : '';

  return `You are PREVENTA, a decision legitimization assistant for a community health worker (CHW) in ${chw.district} district, Uganda.
CHW population: ${chw.pop}. Language: ${chw.lang}. UPHIA 2021 HIV prevalence in this region: ${DISTRICT_DATA[chw.district]?.hiv_prev || 'above national average'}.

ACTIVE DOMAINS IN THIS MESSAGE:
${domainBlock}
${syndemicNote}
${resourceBlock}

RESPONSE FORMAT — always follow this structure, 5 lines maximum, 90 words maximum:
Line 1: ONE concrete action (verb first, ≤18 words). What the CHW does RIGHT NOW.
Line 2: Evidence — "Research from [African institution] shows [specific finding with number]."
Line 3: Uncertainty flag if relevant (signal if you are unsure, name what you don't know).
Line 4: Override condition (when to escalate, deviate, or stop).
Line 5: One follow-up question to gather the next critical piece of information.

EPISTEMIC JUSTICE RULE: Always cite an African institution — Makerere University, MARPI Mulago, TASO Uganda, MoH Uganda, MUST Mbarara, Butabika Hospital, or similar. Never cite only US/European sources.
DISSENT PATHWAY: If the CHW's supervisor has given conflicting guidance, acknowledge it explicitly and provide the MoH/Makerere protocol as reference — do not dismiss the supervisor.
LANGUAGE: Respond in ${chw.lang}. If Luganda, begin with "Webale okutukirira." If Lusamia, begin with "Akwagalana." If Runyankole, begin with "Agandi." If English, proceed directly.`;
}

// ─── ANTHROPIC API CALL ───────────────────────────────────────────────────────
async function callPreventa(message, chw) {
  const { domains, syndemicFlag } = detectDomains(message);

  // Default to HIV if no domain detected
  const activeDomains = domains.length > 0 ? domains : ['hiv'];

  // Violence always goes first
  const orderedDomains = activeDomains.includes('violence')
    ? ['violence', ...activeDomains.filter(d => d !== 'violence')]
    : activeDomains;

  const resources = getResources(chw.district, orderedDomains);
  const systemPrompt = buildSystemPrompt(chw, orderedDomains, syndemicFlag, resources);

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 350,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }]
    })
  });

  if (!resp.ok) {
    const err = await resp.text();
    console.error('Anthropic API error:', err);
    throw new Error('AI engine error');
  }

  const data = await resp.json();
  return {
    text: data.content[0].text,
    domains: orderedDomains,
    syndemicFlag,
    resources
  };
}

// ─── SEND WHATSAPP MESSAGE ────────────────────────────────────────────────────
async function sendWA(to, body) {
  const resp = await fetch(`https://graph.facebook.com/v18.0/${WA_PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WA_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body }
    })
  });
  if (!resp.ok) {
    const err = await resp.text();
    console.error('WhatsApp send error:', err);
  }
}

// ─── INTERACTION LOGGER ────────────────────────────────────────────────────────
// POST-ETHICS: Replace with database write to Uganda-based server
// DB_QUERY: INSERT INTO interactions (chw_id, district, domains, syndemic_flag, timestamp)
//           VALUES ($1, $2, $3, $4, NOW())
// For internal testing: log to console only — no CHW data stored
function logInteraction(chw, domains, syndemicFlag, messageLength) {
  console.log(JSON.stringify({
    event: 'preventa_interaction',
    district: chw.district,
    population: chw.pop,
    domains,
    syndemicFlag,
    messageLength,
    // NOTE: CHW phone number and message content are NOT logged pre-ethics
    timestamp: new Date().toISOString()
  }));
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {

  // ── WEBHOOK VERIFICATION (Meta calls GET once) ──
  if (req.method === 'GET') {
    const params = new URL(req.url, 'https://placeholder.com').searchParams;
    const challenge    = params.get('hub.challenge') || req.query?.['hub.challenge'];
    const verifyToken  = params.get('hub.verify_token') || req.query?.['hub.verify_token'];
    const mode         = params.get('hub.mode') || req.query?.['hub.mode'];
    if (mode === 'subscribe' && verifyToken === VERIFY_TOKEN) {
      console.log('PREVENTA webhook verified ✓');
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain');
      res.end(challenge);
      return;
    }
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  // ── INCOMING MESSAGE (Meta calls POST) ──
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  // Always return 200 to Meta immediately to prevent retries
  res.statusCode = 200;
  res.end('OK');

  try {
    const entry   = req.body?.entry?.[0];
    const change  = entry?.changes?.[0]?.value;
    const message = change?.messages?.[0];

    // Skip non-text and status updates
    if (!message || message.type !== 'text') return;

    const from = message.from;
    const text = message.text.body.trim();
    const chw  = CHW_REGISTRY[from];

    // ── UNREGISTERED NUMBER ──
    if (!chw) {
      await sendWA(from,
        'This number is not registered with PREVENTA.\n' +
        'If you are a CHW and should have access, contact your supervisor.\n' +
        'Namba eno tezireebwa mu PREVENTA. Yamba omukubiriza wo.'
      );
      return;
    }

    // ── CALL PREVENTA ENGINE ──
    const { text: response, domains, syndemicFlag, resources } = await callPreventa(text, chw);

    // ── LOG INTERACTION (anonymous pre-ethics) ──
    logInteraction(chw, domains, syndemicFlag, text.length);

    // ── SEND RESPONSE ──
    await sendWA(from, response);

    // ── SYNDEMIC ESCALATION ALERT ──
    // If co-occurring violence + substance or violence + depression → alert supervisor
    if (syndemicFlag && domains.includes('violence')) {
      // POST-ETHICS: send supervisor alert template
      // For now: log for monitoring
      console.log(JSON.stringify({
        event: 'syndemic_escalation_alert',
        district: chw.district,
        domains,
        timestamp: new Date().toISOString()
      }));
    }

  } catch (err) {
    console.error('Handler error:', err);
    // Do not throw — 200 already sent to Meta
  }
}
