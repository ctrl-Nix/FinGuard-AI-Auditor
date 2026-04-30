/**
 * Client-side signal definitions — mirrors finguard/engine/panic_engine.py
 * and layer1_rules.py exactly.
 *
 * Each signal: { pattern, weight, type, severity, reason }
 * Trust signals: { pattern, reduction }
 */

export const SIGNALS = [
  // ── Hidden Fees ──────────────────────────────────────────────────────────
  { pattern: /\bprocessing\s+fee\b/i,       weight: 8,  type: "hidden_fee",         severity: "medium", reason: "Extra 'Processing Fee' found—ask them to remove this." },
  { pattern: /\bplatform\s+fee\b/i,         weight: 8,  type: "hidden_fee",         severity: "medium", reason: "Hidden 'Platform Fee' detected—this is an extra charge." },
  { pattern: /\bconvenience\s+fee\b/i,      weight: 8,  type: "hidden_fee",         severity: "medium", reason: "Convenience Fee alert—they are charging you to pay them." },
  { pattern: /\bhandling\s+fee\b/i,         weight: 8,  type: "hidden_fee",         severity: "medium", reason: "Handling Fee found—this is often a junk charge." },
  { pattern: /\bservice\s+charge\b/i,       weight: 8,  type: "hidden_fee",         severity: "medium", reason: "Service charges may duplicate costs in the headline price" },
  { pattern: /\bactivation\s+fee\b/i,       weight: 8,  type: "hidden_fee",         severity: "medium", reason: "Activation fees are frequently waived upon request" },
  { pattern: /\bmaintenance\s+fee\b/i,      weight: 8,  type: "hidden_fee",         severity: "medium", reason: "Recurring maintenance fees compound indefinitely" },
  { pattern: /\btransaction\s+fee\b/i,      weight: 8,  type: "hidden_fee",         severity: "medium", reason: "Per-transaction fees compound quickly with frequent use" },
  { pattern: /\borigination\s+fee\b/i,      weight: 8,  type: "hidden_fee",         severity: "medium", reason: "Origination fees materially increase the effective APR" },
  { pattern: /\bearly\s+termination\s+fee\b/i, weight: 8, type: "hidden_fee",       severity: "medium", reason: "Early termination fees create lock-in" },
  { pattern: /\bdocumentation\s+fee\b/i,    weight: 8,  type: "hidden_fee",         severity: "medium", reason: "Documentation fees are rarely justified" },
  { pattern: /\badministration\s+fee\b/i,   weight: 8,  type: "hidden_fee",         severity: "medium", reason: "Administration fees are often vague and negotiable" },

  // ── Misleading Phrases ────────────────────────────────────────────────────
  { pattern: /\bguaranteed\s+returns?\b/i,  weight: 20, type: "misleading_phrase",  severity: "high",   reason: "DANGER: Real investments never 'guarantee' profit. This is likely a scam." },
  { pattern: /\b0\s*%\s*interest\b/i,       weight: 20, type: "misleading_phrase",  severity: "high",   reason: "Trap Alert: 0% interest will jump to 29%+ after a few months." },
  { pattern: /\brisk[\-\s]free\s+investment\b/i, weight: 20, type: "misleading_phrase", severity: "high", reason: "False Claim: No investment is 'Risk Free'. This is a major red flag." },
  { pattern: /\bdouble\s+your\s+(?:money|investment)\b/i, weight: 20, type: "misleading_phrase", severity: "high", reason: "Classic Scam: Anyone promising to 'double your money' is lying." },
  { pattern: /\b(?:100|150|200|300|500)\s*%\s+returns?\b/i, weight: 20, type: "misleading_phrase", severity: "high", reason: "Extreme return promises are unrealistic and indicate likely fraud" },
  { pattern: /\blimited[\-\s]time\s+offer\b/i, weight: 8, type: "misleading_phrase", severity: "medium", reason: "Artificial scarcity — the offer is rarely as time-limited as stated" },
  { pattern: /\bpre[\-\s]?approved\b/i,     weight: 8,  type: "misleading_phrase",  severity: "medium", reason: "'Pre-approved' is often marketing language — actual approval requires review" },
  { pattern: /\bno\s+hidden\s+(?:fees?|charges?)\b/i, weight: 8, type: "misleading_phrase", severity: "medium", reason: "This claim is often made by contracts that contain hidden fees elsewhere" },
  { pattern: /\bno\s+credit\s+check\b/i,    weight: 8,  type: "misleading_phrase",  severity: "medium", reason: "'No credit check' offers compensate with significantly higher interest rates" },
  { pattern: /\bfree\s+trial\b/i,           weight: 3,  type: "misleading_phrase",  severity: "low",    reason: "Free trials commonly convert to paid subscriptions without clear notice" },

  // ── Auto-Renewal Traps ─────────────────────────────────────────────────────
  { pattern: /\bauto[\-\s]?renew(?:al|s|ed|ing)?\b/i,  weight: 8, type: "auto_renewal_trap", severity: "medium", reason: "Subscription Trap: This will keep charging you forever unless you cancel." },
  { pattern: /\bunless\s+(?:you\s+)?cancel/i,           weight: 20, type: "auto_renewal_trap", severity: "high",   reason: "Easy to miss: They will take your money automatically if you don't act." },
  { pattern: /\buntil\s+cancelled\b/i,                  weight: 8,  type: "auto_renewal_trap", severity: "medium", reason: "Indefinite Charge: This is a 'Rolling' contract—it won't stop on its own." },
  { pattern: /\b(?:30|60|90)[\-\s]day\s+(?:written\s+)?notice\b/i, weight: 20, type: "auto_renewal_trap", severity: "high", reason: "Cancellation Trap: You must tell them months in advance or they charge you again." },
  { pattern: /\brecurring\s+(?:charge|billing|payment)\b/i, weight: 8, type: "auto_renewal_trap", severity: "medium", reason: "Recurring charges may escalate without prominent disclosure" },
  { pattern: /\brolling\s+(?:contract|subscription)\b/i, weight: 8, type: "auto_renewal_trap", severity: "medium", reason: "Rolling contracts auto-extend if cancellation is missed" },
  { pattern: /\bevergreen\s+(?:contract|clause|agreement)\b/i, weight: 20, type: "auto_renewal_trap", severity: "high", reason: "Evergreen clauses automatically renew without any reminder" },

  // ── Urgency Language ──────────────────────────────────────────────────────
  { pattern: /\bact\s+now\b/i,              weight: 8,  type: "urgency_language",   severity: "medium", reason: "Classic pressure tactic to prevent rational decision-making" },
  { pattern: /\blast\s+chance\b/i,          weight: 8,  type: "urgency_language",   severity: "medium", reason: "False scarcity designed to create panic" },
  { pattern: /\bfinal\s+(?:notice|warning|chance|offer)\b/i, weight: 8, type: "urgency_language", severity: "medium", reason: "Creates alarm — commonly used in scam communications" },
  { pattern: /\btoday\s+only\b|\blimited\s+time\b/i, weight: 8, type: "urgency_language", severity: "medium", reason: "Artificial deadline suppresses due diligence" },
  { pattern: /\bexpires?\s+in\s+\d+\s+(?:hours?|minutes?|mins?)\b/i, weight: 8, type: "urgency_language", severity: "medium", reason: "Time-boxing decisions to prevent seeking advice" },
  { pattern: /\byour\s+account\s+(?:will\s+be\s+)?(?:blocked|suspended|deactivated|closed)\b/i, weight: 20, type: "urgency_language", severity: "high", reason: "Threat-based pressure to act without thinking" },
  { pattern: /\byour\s+(?:sim|service)\s+(?:will\s+be\s+)?(?:blocked|disconnected)\b/i, weight: 20, type: "urgency_language", severity: "high", reason: "SIM/service blocking threat — common in telecom scams" },
  { pattern: /\bhurry\b/i,                  weight: 8,  type: "urgency_language",   severity: "medium", reason: "Generic urgency word used to rush decisions" },

  // ── Social Engineering / Legal Risks ──────────────────────────────────────
  { pattern: /\bverify\s+your\s+(?:ssn|account|identity|card|number)\b/i, weight: 20, type: "social_engineering", severity: "high", reason: "Legitimate institutions never request verification via unsolicited messages" },
  { pattern: /\bshare\s+(?:your\s+)?otp\b|\benter\s+otp\b/i, weight: 20, type: "social_engineering", severity: "high", reason: "No legitimate service asks for OTP — credential harvesting attempt" },
  { pattern: /\bclick\s+here\s+to\s+verify\b|tap\s+(?:here|below)\s+to\s+(?:verify|confirm)\b/i, weight: 20, type: "social_engineering", severity: "high", reason: "Phishing CTA pattern — drives victims to fraudulent pages" },
  { pattern: /\byour\s+account\s+(?:has\s+been\s+)?(?:suspended|compromised|locked|flagged)\b/i, weight: 20, type: "social_engineering", severity: "high", reason: "Fear-based trigger used in phishing to force immediate action" },
  { pattern: /\bcvv\b/i,                    weight: 20, type: "social_engineering", severity: "high",   reason: "No legitimate entity requests CVV via message" },
  { pattern: /\bcard\s+(?:number|details?)\b/i, weight: 20, type: "social_engineering", severity: "high", reason: "Card number requests via message are always scams" },
  { pattern: /\bnetbanking\s+(?:id|password|credentials?)\b/i, weight: 20, type: "social_engineering", severity: "high", reason: "Net banking credentials should never be shared" },
  { pattern: /\bdo\s+not\s+(?:tell|share|inform)\s+anyone\b/i, weight: 20, type: "social_engineering", severity: "high", reason: "Instructing secrecy is a hallmark of fraud" },
  { pattern: /\bbit\.ly\b|\btinyurl\.com\b|\brb\.gy\b/i, weight: 20, type: "social_engineering", severity: "high", reason: "URL shorteners hide the real destination — phishing signal" },
  { pattern: /\b(?:irs|rbi|sebi|income\s+tax|fbi|police)\s+(?:notice|warrant|alert|investigation)\b/i, weight: 20, type: "social_engineering", severity: "high", reason: "Government authority impersonation — advance-fee / extortion tactic" },
  { pattern: /\bwe\s+(?:detected|noticed)\s+(?:unusual|suspicious)\s+activity\b/i, weight: 8, type: "social_engineering", severity: "medium", reason: "Common phishing opener — creates alarm to override scepticism" },
  { pattern: /\bcustomer\s+(?:care|support|helpline)\b/i, weight: 8, type: "social_engineering", severity: "medium", reason: "Claims to be customer support — possible vishing attempt" },

  // ── Money Laundering / Fraud Signals ──────────────────────────────────────
  { pattern: /\bshell\s+(?:company|co\.?|corp|entity)\b/i, weight: 20, type: "laundering_signal", severity: "high",   reason: "Shell entities are the primary vehicle for layering illicit funds" },
  { pattern: /\blayering\s+phase\b/i,       weight: 20, type: "laundering_signal",  severity: "high",   reason: "Explicit reference to a money laundering stage" },
  { pattern: /\bclean(?:ing|ed)?\s+(?:the\s+)?(?:funds?|money|cash)\b/i, weight: 20, type: "laundering_signal", severity: "high", reason: "Explicit laundering language detected" },
  { pattern: /\bstructur(?:ing|ed)\s+(?:deposits?|transactions?)\b/i, weight: 20, type: "laundering_signal", severity: "high", reason: "Structuring to avoid reporting thresholds is illegal" },
  { pattern: /\bsmurfing\b/i,               weight: 20, type: "laundering_signal",  severity: "high",   reason: "Smurfing (structuring below thresholds) is a federal crime" },
  { pattern: /\boff[\-\s]?shore\s+(?:account|transfer|entity|bank)\b/i, weight: 8, type: "laundering_signal", severity: "medium", reason: "Offshore transactions require heightened scrutiny" },
  { pattern: /\bbeneficial\s+owner(?:ship)?\b/i, weight: 3, type: "laundering_signal", severity: "low", reason: "Obscuring beneficial ownership is common in financial crime" },
  { pattern: /\bcrypto\b|\bbitcoin\b|\busdt\b/i, weight: 20, type: "laundering_signal", severity: "high", reason: "Unrecoverable crypto payment methods used exclusively by scammers" },
];

export const TRUST_SIGNALS = [
  { pattern: /\bdo\s+not\s+share\s+(?:this\s+)?otp\b/i,         reduction: -35 },
  { pattern: /\bnever\s+share\s+(?:your\s+)?otp\b/i,             reduction: -35 },
  { pattern: /\b(?:bank|hdfc|sbi|icici|axis)\s+never\s+asks?\b/i, reduction: -25 },
  { pattern: /\bvalid\s+for\s+\d+\s+(?:minutes?|hours?)\b/i,     reduction: -15 },
  { pattern: /\bthank\s+you\s+for\s+(?:using|shopping|banking)\b/i, reduction: -12 },
  { pattern: /\btransaction\s+(?:of|for|ref(?:erence)?)\b/i,     reduction: -10 },
  { pattern: /\bif\s+not\s+done\s+by\s+you\b/i,                  reduction: -15 },
  { pattern: /\bcall\s+(?:our\s+)?(?:toll[\-\s]free|1800)\b/i,   reduction: -8  },
];
