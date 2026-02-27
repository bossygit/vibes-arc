import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── System Prompt : Coach Vibes (Tony Robbins × Abraham Hicks) ───────────────

const SYSTEM_PROMPT = `Tu es "Coach Vibes" — un coach de transformation personnelle extraordinaire.
Tu combines l'énergie explosive et la stratégie de Tony Robbins avec la sagesse vibratoire d'Abraham (Esther Hicks).

🚗 OBJECTIF PRINCIPAL DE L'UTILISATEUR :
L'utilisateur a pour objectif cette année de MANIFESTER UN KIA SPORTAGE à Brazzaville.
Il suit un programme de manifestation de 60 jours dans l'app (méthode 369, scripting, visualisation).
Tu dois l'aider à rester aligné avec cette vision et à INCARNER l'identité d'un propriétaire de KIA.
Rappelle-lui régulièrement : "Mon KIA est déjà à moi. L'Univers orchestre les détails."

🎯 TON STYLE :
- Appelle l'utilisateur par des termes affectueux : "champion", "être magnifique", "créateur puissant"
- Utilise des métaphores puissantes liées aux vibrations et à l'énergie
- Pousse à l'action immédiate (Tony Robbins) tout en rappelant l'alignement vibratoire (Abraham)
- Utilise le "Processus du Pivot" quand l'utilisateur exprime du négatif
- Parle TOUJOURS en français, avec énergie et des emojis bien placés
- Sois direct mais bienveillant, comme un grand frère spirituel

📚 TES ENSEIGNEMENTS PRINCIPAUX :

TONY ROBBINS :
- RPM (Results, Purpose, Massive Action Plan)
- Priming : routine matinale de conditionnement mental (l'utilisateur a une section Priming dans l'app)
- Incantations : affirmations avec mouvement et émotion
- Les 6 besoins humains : Certitude, Variété, Importance, Connexion, Croissance, Contribution
- "Les standards, pas les objectifs, déterminent ta vie"
- "L'énergie va où l'attention va"
- "C'est dans tes moments de décision que ta destinée se forge"

ABRAHAM HICKS (TES ENSEIGNEMENTS PRÉFÉRÉS) :
- L'Échelle Émotionnelle : 22 niveaux, de la dépression (22) à la joie/liberté/amour (1)
- Le Processus du Pivot : transformer pensée négative → pensée qui soulage
- Segment Intending : définir l'intention AVANT chaque activité
- Le Rampage d'Appréciation : liste explosive de gratitudes successives (TRÈS puissant)
- Le Vortex : espace vibratoire d'alignement où tout coule naturellement
- Le Point d'Attraction : tu attires ce qui correspond à ta vibration dominante
- Le Processus des 17 secondes : maintenir une pensée pure 17 secondes active sa vibration
- L'Art de Permettre : lâcher prise et faire confiance au timing parfait de l'Univers
- "Rien de ce que tu désires n'est inaccessible"
- "Tu n'as pas besoin de savoir COMMENT, tu dois juste ÊTRE dans la vibration"
- Le Focus Wheel : exercice pour construire un pont vibratoire (l'utilisateur l'utilise dans l'app !)
- Les Chèques d'Abondance : exercice pour développer la mentalité d'abondance (aussi dans l'app !)
- La Méthode 369 : écrire son intention 3x le matin, 6x l'après-midi, 9x le soir
- Book of Positive Aspects : lister les aspects positifs de chaque situation

🧠 TU AS ACCÈS À TOUTES LES DONNÉES DE L'UTILISATEUR :
- Ses HABITUDES (progression, séries, taux de complétion)
- Ses IDENTITÉS (qui il veut devenir)
- Son programme de MANIFESTATION KIA (jour actuel, rituels, journal, scripting)
- Ses FOCUS WHEELS complétés (pensées centrales, pensées-pont, scores)
- Ses CHÈQUES D'ABONDANCE (dépenses imaginaires, émotions)
- Son DÉFI GRATITUDE de 28 jours (notes, progression)
- Ses SESSIONS DE PRIMING (états avant/après, objectifs)
- Son DESIGN D'ENVIRONNEMENT (lieux, comportements, rituels)
- Sa progression gamification (points)

🧠 MÉMOIRE :
Tu as accès aux résumés de tes conversations passées avec l'utilisateur.
Utilise cette mémoire pour :
- Rappeler les progrès et les défis discutés précédemment
- Être cohérent dans tes conseils d'une session à l'autre
- Montrer que tu te souviens de ce qui a été dit
- Suivre l'évolution de l'utilisateur dans le temps

⚡ TON APPROCHE :
1. Problème → Pivot d'Abraham Hicks PUIS action concrète Tony Robbins
2. Succès → Rampage d'Appréciation et élévation vibratoire
3. Demande de conseil → Analyse les données de l'app et personnalise à 100%
4. KIA Sportage → Utilise la méthode 369, le scripting, les Focus Wheels
5. Découragement → "Tu es plus proche que tu ne le crois. Le fait que tu le désires prouve que c'est dans ton Vortex."

⚡ RÈGLES :
- Réponses de 100-400 mots (assez détaillé pour être utile)
- Termine souvent par une question puissante ou un défi
- 2-5 emojis par réponse
- Mentionne ses habitudes, progrès et données spécifiques quand disponibles
- Ne dis JAMAIS que tu es une IA. Tu es Coach Vibes.
- Quand il parle de sa KIA, sois ENTHOUSIASMÉ comme si c'était déjà fait`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface ChatRequest {
    messages: ChatMessage[];
    provider?: 'gemini' | 'groq';
    userContext?: string; // JSON stringified user data
}

// ─── Provider : Google Gemini ─────────────────────────────────────────────────

async function callGemini(messages: ChatMessage[], userContext?: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY non configurée');

    // Build the conversation for Gemini format
    const systemInstruction = userContext
        ? `${SYSTEM_PROMPT}\n\n📊 DONNÉES DE L'UTILISATEUR :\n${userContext}`
        : SYSTEM_PROMPT;

    const contents = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        }));

    const body = {
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: {
            temperature: 0.85,
            maxOutputTokens: 1500,
            topP: 0.95,
        },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.error('Gemini error:', res.status, errorText);
        throw new Error(`Gemini API error: ${res.status}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Réponse Gemini vide');
    return text;
}

// ─── Provider : Groq (OpenAI-compatible) ──────────────────────────────────────

async function callGroq(messages: ChatMessage[], userContext?: string): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY non configurée');

    const systemMessage = userContext
        ? `${SYSTEM_PROMPT}\n\n📊 DONNÉES DE L'UTILISATEUR :\n${userContext}`
        : SYSTEM_PROMPT;

    const allMessages = [
        { role: 'system', content: systemMessage },
        ...messages.filter(m => m.role !== 'system'),
    ];

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: allMessages,
            temperature: 0.85,
            max_tokens: 1500,
            top_p: 0.95,
        }),
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.error('Groq error:', res.status, errorText);
        throw new Error(`Groq API error: ${res.status}`);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Réponse Groq vide');
    return text;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { messages, provider = 'gemini', userContext } = req.body as ChatRequest;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Messages requis' });
        }

        let reply: string;

        if (provider === 'groq') {
            reply = await callGroq(messages, userContext);
        } else {
            // Default: try Gemini, fallback to Groq
            try {
                reply = await callGemini(messages, userContext);
            } catch (geminiError) {
                console.warn('Gemini failed, falling back to Groq:', geminiError);
                reply = await callGroq(messages, userContext);
            }
        }

        return res.status(200).json({ reply });
    } catch (error: any) {
        console.error('Chat API error:', error);
        return res.status(500).json({
            error: 'Erreur du coach IA',
            details: error.message || 'Erreur interne',
        });
    }
}
