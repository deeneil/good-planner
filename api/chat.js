var parser = require('./_utils/parser.js');

module.exports = function(req, res) {
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

var userInput = req.body.userInput;

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

try {
// 调用parser模块解析用户输入
var tasks = parser.parseInputToTasks(userInput);
  // 返回解析结果
return res.status(200).json({ result: tasks });
} catch (error) {
console.error('解析错误:', error);
return res.status(500).json({ error: '处理您的请求时出错', details: error.message });
}
};
