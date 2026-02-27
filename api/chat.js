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

const apiUrl = 'https://yinli.one/v1/chat/completions';

const systemPrompt = `你是一个高效的计划助手，可以将用户的自然语言计划转换为结构化任务。
将用户消息中的任务提取出来，并格式化为包含以下字段的JSON数组：

id: 唯一字符串ID（使用当前时间戳+随机字符）
title: 清晰简洁的任务标题（最多50个字符）
description: 可选的详细描述
deadline: 当任务应当完成的时间（可以是具体日期或相对时间）
status: 新任务始终设为"pending"
如果用户正在修改现有计划（消息中包含"计划有变"、"更新计划"等短语），请审核他们的更改并提供一个应该替换当前计划的更新JSON数组。
请只返回一个纯净的JSON数组，不要包含任何Markdown代码块或解释性文字，不要添加任何前缀或后缀。`;
try {
// 主逻辑：尝试使用AI接口解析
console.log('尝试使用API解析任务');
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

const response = await fetch(apiUrl, {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'Authorization': Bearer ${process.env.OPENAI_API_KEY}
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

// 如果API响应成功
if (response.ok) {
const data = await response.json();
console.log('API解析成功');
return res.status(200).json({ result: data.choices[0].message.content });
} else {
// API响应失败，切换到本地解析
console.log('API响应失败，状态码:', response.status);
throw new Error(API响应错误: ${response.status});
}
} catch (error) {
// 退路逻辑：本地解析模式
console.log('切换到本地解析模式:', error.message);

try {
// 极简逻辑处理
let deadline = '待定';
if (userInput.includes('今天')) {
deadline = '今天';
} else if (userInput.includes('明天')) {
deadline = '明天';
} else if (userInput.includes('后天')) {
deadline = '后天';
}
// 添加时间信息
if (userInput.includes('上午')) {
  deadline += ' 上午';
} else if (userInput.includes('下午')) {
  deadline += ' 下午';
} else if (userInput.includes('晚上')) {
  deadline += ' 晚上';
}

// 提取小时信息
const hourMatch = userInput.match(/(\d+)[点時]/);
if (hourMatch) {
  deadline += ` ${hourMatch[0]}`;
}

// 生成唯一ID
const id = `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

// 提取标题（前30个字符，避免太短）
const title = userInput.length > 30 ? userInput.substring(0, 30) + '...' : userInput;

const tasks = [{
  id,
  title,
  description: userInput,
  deadline,
  status: "pending"
}];

console.log('本地解析成功');
return res.status(200).json({ result: JSON.stringify(tasks) });
} catch (backupError) {
console.error('本地解析也失败了:', backupError);
return res.status(500).json({
error: '处理您的请求时出错',
details: backupError.message
});
}
}
};
