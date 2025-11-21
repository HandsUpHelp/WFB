
export const SHIFT_DURATION_MS = 2925000; // 9.75 hours (08:00-17:45) * 5 real mins per game hour * 60 * 1000
export const MAX_STRESS = 100;

export const MOCK_CLAIMANT = {
  id: 'C-19283',
  name: 'Gary Smith',
  nino: 'QQ 12 34 56 A',
  details: 'Look, I know I missed Tuesday. The bus never turned up, did it? You can\'t sanction me for that.',
  sincerityScore: 45,
  mood: 'Defensive' as const
};

export const MOCK_EVIDENCE = [
  { id: 'E-1', type: 'GP Letter' as const, content: 'Patient reports ongoing fatigue. No clinical diagnosis confirmed yet.', isValid: false },
  { id: 'E-2', type: 'Bank Statement' as const, content: 'Regular income seen: £200 "Cash Deposit" weekly.', isValid: false },
  { id: 'E-3', type: 'Tenancy Agreement' as const, content: 'Assured Shorthold Tenancy. Rent: £650pcm. Landlord: T. Smith.', isValid: true },
];

export const MOCK_CLAUSES = [
  { id: 'L-1', code: 'ADM A1340', text: 'Balance of Probability', description: 'The DM must decide whether it is more likely than not that an event occurred.' },
  { id: 'L-2', code: 'ADM A1312', text: 'Weight of Evidence', description: 'Direct evidence carries more weight than hearsay. Consider the timing of evidence.' },
  { id: 'L-3', code: 'ADM A1405', text: 'Burden of Proof', description: 'Initially lies with the claimant to prove conditions are met. Shifts to DWP for exceptions.' },
];

export const MOCK_EMAILS = [
  { id: 'M-1', sender: 'Central Payments', subject: 'Payment Block #9921', body: 'Discrepancy in housing costs. Please verify.', urgency: 'Urgent' as const, actionRequired: 'Block' as const },
  { id: 'M-2', sender: 'Team Leader', subject: 'Targets', body: 'Clearance times are slipping. Pick up the pace.', urgency: 'Routine' as const, actionRequired: 'Reply' as const },
  { id: 'M-3', sender: 'System Auto', subject: 'Overpayment Detected', body: 'Claimant C-19283 received £400 excess. Authorize recoup.', urgency: 'Escalation' as const, actionRequired: 'Authorize' as const, value: 400 },
];