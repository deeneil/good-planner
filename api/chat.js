// api/chat.js
module.exports = async (req, res) => {
  // 设置 CORS 头，以允许跨域请求
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // 处理 OPTIONS 请求（预检请求）
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允许 POST 方法
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只允许 POST 请求' });
  }

  const userInput = req.body.userInput;
  
  // 输入验证
  if (!userInput || typeof userInput !== 'string') {
    return res.status(400).json({ error: '请提供有效的计划内容' });
  }
  
  // 简单的限额逻辑 - 检查输入长度
  if (userInput.length > 1000) {
    return res.status(400).json({ 
      error: '输入文字过长，请将您的计划分成多个小部分提交' 
    });
  }

  // 记录API密钥长度，用于调试
  console.log('Sending request to API with Key length:', process.env.OPENAI_API_KEY?.length);

  const systemPrompt = `你是一个高效的计划助手，可以将用户的自然语言计划转换为结构化任务。

将用户消息中的任务提取出来，并格式化为包含以下字段的JSON数组：
- id: 唯一字符串ID（使用当前时间戳+随机字符）
- title: 清晰简洁的任务标题（最多50个字符）
- description: 可选的详细描述
- deadline: 任务应当完成的时间（可以是具体日期或相对时间）
- status: 新任务始终设为"pending"

如果用户正在修改现有计划（消息中包含"计划有变"、"更新计划"等短语），请审核他们的更改并提供一个应该替换当前计划的更新JSON数组。

请只返回一个纯净的JSON数组，不要包含任何Markdown代码块或解释性文字。不要添加任何前缀或后缀，只返回有效的JSON数组。`;

  const apiUrl = 'https://yinli.one/v1/chat/completions';

  try {
    const controller = new AbortController();
    // 设置15秒超时
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    // 记录请求URL和模型名称
    console.log('Request URL:', apiUrl);
    console.log('Using model:', 'gemini-1.5-flash');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gemini-1.5-flash',
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
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.status === 404) {
      console.log('404 error, trying alternative URL');
      // 如果收到404，尝试不带v1的URL
      const alternativeResponse = await fetch('https://yinli.one/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gemini-1.5-flash',
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
      
      const alternativeData = await alternativeResponse.json();
      
      if (!alternativeResponse.ok) {
        console.error('Alternative API Error:', alternativeData);
        return res.status(alternativeResponse.status).json({ 
          error: alternativeData.error?.message || '处理您的请求时出错' 
        });
      }
      
      console.log('Alternative API response received successfully');
      return res.status(200).json({ result: alternativeData.choices[0].message.content });
    }

    // 获取响应数据
    const data = await response.json();
    
    // 检查响应状态
    if (!response.ok) {
      console.error('API Error:', data);
      return res.status(response.status).json({ 
        error: data.error?.message || '处理您的请求时出错' 
      });
    }

    console.log('API response received successfully');
    
    // 成功响应
    return res.status(200).json({ result: data.choices[0].message.content });
    
  } catch (error) {
    console.error('Server error:', error);
    
    // 区分超时错误和其他服务器错误
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: '请求超时，请稍后再试' });
    }
    
    return res.status(500).json({ error: '服务器错误，请稍后再试' });
  }
};
