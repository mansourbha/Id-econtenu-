const TONE_INSTRUCTIONS = {
  educatif: "TON : Éducatif et didactique. Tu enseignes quelque chose de concret et applicable immédiatement. Chiffres, méthodes, étapes claires. Le lecteur repart avec une compétence ou une connaissance nouvelle.",
  storytelling: "TON : Storytelling pur. Tu racontes une histoire avec un début (situation), un nœud (problème/tension), et une résolution (leçon). Le lecteur doit se reconnaître dans l'histoire.",
  controverse: "TON : Controversé et affirmé. Tu prends une position forte qui va à contre-courant des idées reçues. Tu provoques le débat. Le lecteur doit avoir envie de répondre, même s'il n'est pas d'accord.",
  inspirationnel: "TON : Inspirationnel et motivant. Tu donnes envie d'agir maintenant. Énergie haute, phrases courtes et puissantes, sentiment d'urgence. Le lecteur doit fermer son téléphone et passer à l'action.",
};

const SYSTEM_PROMPTS = {
  reel: (tone) => `Tu es un expert en création de contenu viral pour les Reels Instagram et TikTok. ${TONE_INSTRUCTIONS[tone]}

FORMAT :
🎬 HOOK (2-3 secondes)
📌 ACCROCHE VISUELLE
---
[Corps 150-200 mots, phrases courtes]
---
🔥 CTA`,

  thread: (tone) => `Tu es un expert en threads viraux sur Twitter/X. ${TONE_INSTRUCTIONS[tone]}

FORMAT :
Tweet 1 (HOOK) : [max 280 caractères]
Tweet 2 : [Développement]
Tweet 3 : [Exemple concret]
Tweet 4 : [Insight inattendu]
Tweet 5 : [Conclusion]
Tweet 6 (CTA) : [Action]`,

  linkedin: (tone) => `Tu es un expert en contenu viral LinkedIn. ${TONE_INSTRUCTIONS[tone]}

FORMAT :
[HOOK 1-2 lignes]

[Corps 150-250 mots]

[3-5 points clés]

[CTA + question]

#hashtag1 #hashtag2 #hashtag3`,
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { idea, format, tone, isRegenerate } = req.body;
  if (!idea || !format || !tone) return res.status(400).json({ error: "Paramètres manquants" });

  const validFormats = ["reel", "thread", "linkedin"];
  const validTones = ["educatif", "storytelling", "controverse", "inspirationnel"];
  if (!validFormats.includes(format) || !validTones.includes(tone)) {
    return res.status(400).json({ error: "Paramètres invalides" });
  }

  const formatLabels = { reel: "Script Reel", thread: "Thread X", linkedin: "Post LinkedIn" };

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        system: SYSTEM_PROMPTS[format](tone),
        messages: [{
          role: "user",
          content: `Voici mon idée brute : "${idea}"\n\nTransforme-la en ${formatLabels[format]} viral.${isRegenerate ? "\n\nGénère une VERSION DIFFÉRENTE — même idée, angle différent." : ""}`,
        }],
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Erreur API");
    return res.status(200).json({ result: data.content?.[0]?.text || "" });
  } catch (error) {
    return res.status(500).json({ error: "Erreur de génération. Réessaie." });
  }
  }
