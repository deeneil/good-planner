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

try {
// 判断是否是更新现有计划的请求
const isUpdateRequest = userInput.includes('计划有变') ||
userInput.includes('更新计划') ||
userInput.includes('修改计划') ||
userInput.includes('plan changed') ||
userInput.includes('update my plan');
// 根据输入解析任务
let tasks;
if (isUpdateRequest) {
  // 如果是更新请求，解析新的任务替换旧的
  tasks = parseTasksFromText(userInput);
} else {
  // 常规添加任务
  tasks = parseTasksFromText(userInput);
}

return res.status(200).json({ result: JSON.stringify(tasks) });
} catch (error) {
console.error('解析错误:', error);
return res.status(500).json({ error: '处理您的请求时出错', details: error.message });
}
};

// 魔法解析函数 - 从文本中提取任务
function parseTasksFromText(text) {
const tasks = [];

// 拆分不同的任务（按句号、逗号、分号或换行符分割）
const sentences = text.split(/[。，,.;\n]+/).filter(s => s.trim().length > 0);

for (const sentence of sentences) {
// 如果句子太短，可能不是有效任务
if (sentence.trim().length < 2) continue;
// 提取时间和日期信息
const { deadline, remainingText } = extractTimeInfo(sentence);

// 使用剩余文本作为标题
let title = remainingText.trim();
let description = "";

// 如果标题太长，截取部分作为描述
if (title.length > 50) {
  description = title;
  title = title.substring(0, 47) + "...";
}

// 生成唯一ID
const id = `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

tasks.push({
  id,
  title,
  description,
  deadline,
  status: "pending"
});
}

// 如果没有提取到任务，创建一个基本任务
if (tasks.length === 0) {
tasks.push({
id: task_${Date.now()}_${Math.floor(Math.random() * 1000)},
title: text.length > 50 ? text.substring(0, 47) + "..." : text,
description: text.length > 50 ? text : "",
deadline: "待定",
status: "pending"
});
}

return tasks;
}

// 提取时间信息的辅助函数
function extractTimeInfo(text) {
let deadline = "待定";
let remainingText = text;

// 日期模式匹配
const datePatterns = [
{ regex: /今天/g, value: "今天" },
{ regex: /明天/g, value: "明天" },
{ regex: /后天/g, value: "后天" },
{ regex: /周一|星期一/g, value: "下个星期一" },
{ regex: /周二|星期二/g, value: "下个星期二" },
{ regex: /周三|星期三/g, value: "下个星期三" },
{ regex: /周四|星期四/g, value: "下个星期四" },
{ regex: /周五|星期五/g, value: "下个星期五" },
{ regex: /周六|星期六/g, value: "下个星期六" },
{ regex: /周日|星期日|周天|星期天/g, value: "下个星期日" },
{ regex: /\d+月\d+[日号]/g, match => match }
];

// 时间模式匹配
const timePatterns = [
{ regex: /(\d+)[点時]半/g, match => ${match[0]}30分 },
{ regex: /(\d+)[点時]钟?/g, match => ${match[0]}点 },
{ regex: /(\d+)点時分/g, match => match[0] },
{ regex: /上午/g, value: "上午" },
{ regex: /中午/g, value: "中午" },
{ regex: /下午/g, value: "下午" },
{ regex: /晚上/g, value: "晚上" }
];

// 匹配日期
let dateFound = false;
for (const pattern of datePatterns) {
const matches = [...text.matchAll(pattern.regex)];
if (matches.length > 0) {
const match = matches[0][0];
const dateValue = typeof pattern.value === 'function' ? pattern.value(match) : pattern.value;
deadline = dateValue;
dateFound = true;
remainingText = remainingText.replace(match, "");
}
}

// 匹配时间
let timeFound = false;
for (const pattern of timePatterns) {
const matches = [...text.matchAll(pattern.regex)];
if (matches.length > 0) {
const match = matches[0][0];
const timeValue = typeof pattern.value === 'function' ? pattern.value(matches[0]) : pattern.value;
if (dateFound) {
    deadline += ` ${timeValue}`;
  } else {
    deadline = timeValue;
  }
  timeFound = true;
  remainingText = remainingText.replace(match, "");
}
}

// 尝试找到带期限的短语
const deadlinePatterns = [
{ regex: /截止到([\s\S]+)/g, group: 1 },
{ regex: /期限是([\s\S]+)/g, group: 1 },
{ regex: /deadline是为:：/gi, group: 1 }
];

for (const pattern of deadlinePatterns) {
const matches = [...text.matchAll(pattern.regex)];
if (matches.length > 0 && matches[0][pattern.group]) {
// 提取截止日期的描述
const deadlineText = matches[0][pattern.group].trim();
if (deadlineText && deadlineText.length < 20) { // 避免太长的匹配
deadline = deadlineText;
remainingText = remainingText.replace(matches[0][0], "");
}
}
}

// 清理文本中的多余空格
remainingText = remainingText.replace(/\s+/g, " ").trim();

return { deadline, remainingText };
}
