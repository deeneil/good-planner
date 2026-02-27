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

// 提取标题（前20个字符）
const title = userInput.length > 20 ? userInput.substring(0, 20) + '...' : userInput;

const tasks = [{
  id,
  title,
  description: userInput,
  deadline,
  status: "pending"
}];

return res.status(200).json({ result: JSON.stringify(tasks) });
} catch (e) {
console.error('处理错误:', e);
return res.status(500).json({ error: '服务器错误，请稍后再试' });
}
};
