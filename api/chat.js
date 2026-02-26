export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userInput = req.body.userInput;
  
  // 简单的限额逻辑 - 检查输入长度
  if (userInput.length > 1000) {
    return res.status(400).json({ 
      error: '输入文字过长，请将您的计划分成多个小部分提交' 
    });
  }

  const systemPrompt = `You are a planning assistant that converts user's natural language plans into structured tasks.
  
  Extract tasks from the user's message and format them as a JSON array of objects with these fields:
  - id: A unique string ID (use current timestamp + random chars)
  - title: A clear, concise task title (max 50 chars)
  - description: Optional more detailed description
  - deadline: When the task should be completed (can be a specific date or relative time)
  - status: Always set to "pending" for new tasks
  
  If the user is modifying existing plans (messages containing phrases like "计划有变", "update my plan", etc.), 
  review their changes and provide an updated JSON array that should replace the current one.
  
  Your response should ONLY contain the valid JSON array, nothing else. Do not include any explanation, markdown formatting, or code blocks.`;

  try {
    const response = await fetch('https://api.gravity-ai.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userInput
          }
        ]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('API Error:', data);
      return res.status(response.status).json({ 
        error: data.error?.message || '处理您的请求时出错' 
      });
    }

    // 转发API响应
    return res.status(200).json({ result: data.choices[0].message.content });
    
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: '服务器错误，请稍后再试' });
  }
}
