import { GoogleGenAI, Type } from "@google/genai";
import { ClaimantProfile, EvidenceItem, LegislativeClause, TaskEmail, DialogueOption, DialogueTurn, DecisionCase } from "../types";

const apiKey = process.env.API_KEY || ''; 
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const BUREAUCRACY_SYSTEM_PROMPT = `
You are the 'Department of Social Affairs' simulation engine. 
Generate content that is dry, bureaucratic, slightly dystopian, and heavily administrative. 
Use British English spelling. 
Tone: Cold, formal, detached.
`;

const CLAIMANT_SYSTEM_PROMPT = `
You are roleplaying a UK welfare claimant in a high-stakes bureaucratic simulation.
CONTEXT: You are at the Job Centre for a mandatory interview with a Work Coach.
THEME: British Social Realism (Ken Loach style).

LANGUAGE RULES (CRITICAL):
1. DIALECT: Working Class British English.
2. TONE: Casual, unpolished, conversational. Can be defensive, resigned, or cheeky.
3. VOCABULARY: Simple. Use "mate", "innit", "proper", "sorted", "stress", "skint", "reckon", "dead" (very).
4. GRAMMAR: Colloquial. "I was stood there", "It ain't fair", "I done it", "Me back hurts".
5. AVOID: Formal corporate language. NEVER use "assistance", "regarding", "commence", "verify", "approximately".
6. LENGTH: Short spoken sentences. Max 25 words per response.

SCENARIO RULES:
1. You have a specific reason for being here (e.g., late for appointment, didn't apply for jobs, sick note expired).
2. You believe you are in the right, or you have a good excuse (e.g. "Bus didn't turn up").
3. You want your money (Universal Credit).
`;

const ADM_GUIDANCE_EXTRACT = `
OFFICIAL GUIDANCE (ADM CHAPTER A1):
- A1002 (Carltona Principle): Officials act on the Secretary of State's behalf.
- A1310 (Types of Evidence): Direct (witness/employer), Indirect (circumstantial), Hearsay (reported speech).
- A1312 (Weight of Evidence): Direct > Hearsay. Evidence obtained closer to the event is better.
- A1340 (Standard of Proof): "Balance of Probability". Is it more likely than not? Not "Beyond Reasonable Doubt".
- A1341 (Benefit of Doubt): The claimant is NOT given the benefit of the doubt automatically.
- A1392 (Inherently Improbable): Statements that are very unlikely to be true can be rejected without corroboration.
- A1405 (Burden of Proof): Initially on claimant to prove entitlement. Shifts to DWP to prove exceptions or overpayments.
- A1521 (Medical Evidence): Medical opinion is just evidence, not a binding decision. The DM decides the facts.
`;

const DECISION_MAKER_PROMPT = `
You are the 'Decision Maker' simulation engine.
Generate a complex UK welfare entitlement case based strictly on the provided ADM Chapter A1 guidance.

${ADM_GUIDANCE_EXTRACT}

The player must match a Legislative Clause to a specific piece of Evidence to resolve a dispute.

REQUIREMENTS:
1. "summary": A 2-sentence plain English overview of the bureaucratic dispute (e.g. "Claimant relies on hearsay to prove capital spend-down", "Medical opinion conflicts with direct observation").
2. "timeline": 3-4 chronological events.
3. "evidence": 
   - For 'Bank Statement': Content MUST be pipe-delimited rows: "Date|Description|Amount".
   - For 'GP Letter': Formal medical text.
   - For 'Universal Credit Journal': Chat log style. "Me: xxxx / Agent: xxxx".
   - For 'Tip-off' / 'Interview Record': Direct or Hearsay statements.
   
4. "clauses": 3 specific ADM regulations from the list above.
   - Use codes like: "ADM A1340", "ADM A1521", "ADM A1312".
   - Text and Description must match the ADM meaning precisely.
   - One must be the correct legal basis for the decision (e.g. using A1312 to value Direct evidence over Hearsay).
`;

export const generateClaimantProfile = async (): Promise<ClaimantProfile> => {
  if (!ai) return Promise.resolve({
    id: `C-${Math.floor(Math.random() * 10000)}`,
    name: 'Gary Smith (Offline)',
    nino: 'QQ 12 34 56 A',
    dateOfBirth: '12/05/1984',
    address: '14 High Street, Slough, SL1 4XX',
    details: 'Look mate, the bus never turned up. I was stood there for an hour. You can\'t sanction me for that.',
    sincerityScore: 45,
    mood: 'Agitated',
    journal: ['Me: Bus late.', 'Agent: Please attend.', 'Me: I need my money.']
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Generate a fictional UK welfare claimant profile with valid bureaucratic issues. Include realistic DOB, Address, and 3-5 short past journal messages representing their history/attitude. The journal messages should support or contradict their "details" story.',
      config: {
        systemInstruction: CLAIMANT_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            nino: { type: Type.STRING },
            dateOfBirth: { type: Type.STRING, description: "DD/MM/YYYY" },
            address: { type: Type.STRING, description: "Full UK address" },
            details: { type: Type.STRING },
            sincerityScore: { type: Type.INTEGER },
            mood: { type: Type.STRING, enum: ['Agitated', 'Despondent', 'Evasive', 'Polite'] },
            journal: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of 3-5 past short messages sent by claimant to DWP"
            }
          },
          required: ['name', 'nino', 'dateOfBirth', 'address', 'details', 'sincerityScore', 'mood', 'journal']
        }
      }
    });
    
    const data = JSON.parse(response.text || '{}');
    return {
      id: `C-${Math.floor(Math.random() * 90000) + 10000}`,
      ...data
    };
  } catch (e) {
    console.error("Gemini Error", e);
    return {
      id: 'ERR-001',
      name: 'Error Generating Profile',
      nino: 'ER 00 00 00 R',
      dateOfBirth: '01/01/1990',
      address: 'System Error',
      details: 'System error. File corrupted.',
      sincerityScore: 0,
      mood: 'Agitated',
      journal: ['System Error']
    };
  }
};

export const generateDialogueState = async (
  history: DialogueTurn[], 
  claimant: ClaimantProfile, 
  lastPlayerAction?: string
): Promise<{ reply: string; options: DialogueOption[] }> => {
  if (!ai) return { 
    reply: "I dunno what to say to that, mate. Just tell me if I'm getting paid.", 
    options: [
      { id: '1', text: "I need to see evidence of that.", tone: 'Procedural' },
      { id: '2', text: "If you cannot provide proof, a sanction may apply.", tone: 'Direct' }
    ] 
  };

  const prompt = `
    Claimant Context: Name: ${claimant.name}, DOB: ${claimant.dateOfBirth}, Address: ${claimant.address}.
    Mood: ${claimant.mood}, Issue: ${claimant.details}, Sincerity: ${claimant.sincerityScore}/100.
    Conversation History: ${JSON.stringify(history.slice(-5))}
    
    The Work Coach just said: "${lastPlayerAction || 'Introduction'}".
    
    1. Generate the Claimant's verbal reply. Keep it SHORT (max 20 words). REACT to the Work Coach. 
    If they ask for details (DOB/Address), provide them based on the Context above (or lie if Sincerity is low).
    Use slang and natural speech ("innit", "yeah", "nah").
    
    2. Generate 4 distinct follow-up options for the Player (Work Coach) to choose from:
       - Option A: Empathetic/Rapport (Building trust: "How are you coping?", "Tell me more.")
       - Option B: Fact-Finding (Asking for details: "Confirm your address.", "What happened exactly?")
       - Option C: Procedural (Official process: "I need to see the document.", "Let's look at your commitment.")
       - Option D: Enforcement (Direct/Strict: "That's not a valid reason.", "I will have to refer this.")
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: CLAIMANT_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  text: { type: Type.STRING },
                  tone: { type: Type.STRING, enum: ['Empathetic', 'Direct', 'Procedural'] }
                },
                required: ['id', 'text', 'tone']
              }
            }
          },
          required: ['reply', 'options']
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (e) {
    return {
      reply: "...",
      options: [
        { id: 'err1', text: "Please repeat that.", tone: 'Empathetic' },
        { id: 'err2', text: "I am terminating this interview.", tone: 'Procedural' }
      ]
    };
  }
};

export const generateInbox = async (count: number): Promise<TaskEmail[]> => {
  if (!ai) return []; 

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate ${count} short administrative emails for a welfare Case Manager. Subjects like "Payment Block", "Sanction Review", "Targets".`,
      config: {
        systemInstruction: BUREAUCRACY_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sender: { type: Type.STRING },
              subject: { type: Type.STRING },
              body: { type: Type.STRING },
              urgency: { type: Type.STRING, enum: ['Routine', 'Urgent', 'Escalation'] },
              actionRequired: { type: Type.STRING, enum: ['Authorize', 'Block', 'Reply'] },
              value: { type: Type.INTEGER }
            },
            required: ['sender', 'subject', 'body', 'urgency', 'actionRequired']
          }
        }
      }
    });

    const data = JSON.parse(response.text || '[]');
    return data.map((item: any, index: number) => ({ ...item, id: `M-${Date.now()}-${index}` }));
  } catch (e) {
    console.error("Gemini Error", e);
    return [];
  }
};

export const generateDecisionCase = async (): Promise<DecisionCase> => {
  // Fallback data based on ADM A1/A2 rules
  const offlineCase: DecisionCase = {
    id: 'CASE-9021',
    title: 'Capital Dispute: Balance of Probability',
    description: 'Allegation of undeclared savings based on hearsay.',
    summary: 'Claimant accused of holding £25k in Premium Bonds. Denies allegation. Evidence is purely hearsay from an anonymous tip-off.',
    timeline: [
      { date: '12/09/2023', description: 'Anonymous report received via fraud hotline.' },
      { date: '15/09/2023', description: 'Claimant interviewed. Denies holding bonds.' },
      { date: '20/09/2023', description: 'NS&I Check requested (Pending).' }
    ],
    evidence: [
      { id: 'e1', type: 'Tip-off', content: 'Caller states: "He was bragging down the pub about his premium bond win. Said he had £25k stashed away."', isValid: false },
      { id: 'e2', type: 'Interview Record', content: 'Claimant: "I\'ve never owned a premium bond in my life. You can check with NS&I. That caller is just jealous."', isValid: true },
      { id: 'e3', type: 'Bank Statement', content: '01/09/23|Asda|-45.00\n05/09/23|Rent|-450.00\n12/09/23|UC Payment|+320.00', isValid: false }
    ],
    clauses: [
      { id: 'c1', code: 'ADM A1340', text: 'Balance of Probability', description: 'The DM must decide whether it is more likely than not that an event occurred. Benefit of doubt is not given.' },
      { id: 'c2', code: 'ADM A1405', text: 'Burden of Proof', description: 'Burden lies with DWP to prove exception to entitlement if allegation is denied.' },
      { id: 'c3', code: 'ADM A1312', text: 'Weight of Evidence', description: 'Direct evidence carries more weight than hearsay.' }
    ],
    correctClauseId: 'c2',
    correctEvidenceId: 'e2'
  };

  if (!ai) return offlineCase;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Generate a complex UK welfare case requiring application of ADM Chapter A1 rules.',
      config: {
        systemInstruction: DECISION_MAKER_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            summary: { type: Type.STRING },
            timeline: { 
              type: Type.ARRAY, 
              items: {
                 type: Type.OBJECT,
                 properties: {
                   date: { type: Type.STRING },
                   description: { type: Type.STRING }
                 }
              }
            },
            evidence: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['Bank Statement', 'GP Letter', 'Tenancy Agreement', 'Universal Credit Journal', 'Interview Record', 'Tip-off'] },
                  content: { type: Type.STRING },
                  isValid: { type: Type.BOOLEAN }
                }
              }
            },
            clauses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  code: { type: Type.STRING },
                  text: { type: Type.STRING },
                  description: { type: Type.STRING }
                }
              }
            },
            correctClauseId: { type: Type.STRING },
            correctEvidenceId: { type: Type.STRING }
          },
          required: ['title', 'description', 'summary', 'timeline', 'evidence', 'clauses', 'correctClauseId', 'correctEvidenceId']
        }
      }
    });
    
    const data = JSON.parse(response.text || '{}');
    return {
      id: `CASE-${Math.floor(Math.random() * 10000)}`,
      ...data
    };
  } catch (e) {
    console.error("Gemini Case Gen Error", e);
    return offlineCase;
  }
};