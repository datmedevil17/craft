const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY

export const getNPCResponse = async (userPrompt, npcType) => {
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama3-8b-8192',
                messages: [
                    {
                        role: 'system',
                        content: `You are a helpful NPC in a block-based crafting world. Your name is ${npcType}. Keep your responses short and immersive. Max 2-3 sentences.`
                    },
                    {
                        role: 'user',
                        content: userPrompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 150
            })
        })

        const data = await response.json()
        return data.choices[0].message.content
    } catch (error) {
        console.error('Error fetching NPC response:', error)
        return "I'm sorry, I'm a bit lost in thought right now..."
    }
}
