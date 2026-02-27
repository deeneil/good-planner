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
// 判断是否是更新现有计划的请求
var isUpdateRequest = userInput.includes('计划有变') ||
userInput.includes('更新计划') ||
userInput.includes('修改计划') ||
userInput.includes('plan changed') ||
userInput.includes('update my plan');


// 根据输入解析任务
var tasks = [];

// 首先，通过多种分隔符拆分输入文本 - 修改后的正则表达式
var subSentences = userInput.split(/[，。！？,.;\n\?？/]+|然后|还有|接着|再/).filter(function(s) {
  return s && s.trim().length >= 2; // 允许更短的子句也能生成卡片
});

// 如果无法拆分出有意义的子句，将整个输入作为一个子句
if (subSentences.length === 0) {
  subSentences = [userInput];
}

// 再进行时间和任务提取
for (var i = 0; i < subSentences.length; i++) {
  var subSentence = subSentences[i];
  
  // 提取时间和日期信息
  var extractedInfo = extractTimeInfo(subSentence);
  var deadline = extractedInfo.deadline;
  var remainingText = extractedInfo.remainingText;
  
  // 清洗标题文本
  var title = cleanTaskTitle(remainingText, deadline);
  var description = subSentence;
  
  // 如果标题太短或无意义，跳过此子句
  if (title.length < 2) continue;
  
  // 如果标题太长，截取部分
  if (title.length > 50) {
    description = title;
    title = title.substring(0, 47) + "...";
  }
  
  // 生成唯一ID
  var id = "task_" + Date.now() + "_" + Math.floor(Math.random() * 1000) + "_" + i;
  
  tasks.push({
    id: id,
    title: title,
    description: description,
    deadline: deadline,
    status: "pending"
  });
}

// 如果没有提取到任务，创建一个基本任务
if (tasks.length === 0) {
  var extractedInfo = extractTimeInfo(userInput);
  var title = cleanTaskTitle(extractedInfo.remainingText, extractedInfo.deadline);
  
  // 确保标题不为空
  if (!title || title.trim().length === 0) {
    title = userInput.length > 30 ? userInput.substring(0, 30) + "..." : userInput;
  }
  
  tasks.push({
    id: "task_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    title: title,
    description: userInput,
    deadline: extractedInfo.deadline,
    status: "pending"
  });
}

// 如果是更新请求，则返回解析的任务替换现有任务
return res.status(200).json({ result: tasks });
} catch (error) {
console.error('解析错误:', error);
return res.status(500).json({ error: '处理您的请求时出错', details: error.message });
}
};

// 提取时间信息的辅助函数
function extractTimeInfo(text) {
var deadline = "待定";
var remainingText = text;

// 日期模式匹配
var datePatterns = [
{ regex: /今天/g, value: "今天" },
{ regex: /明天/g, value: "明天" },
{ regex: /后天/g, value: "后天" },
{ regex: /周一|星期一/g, value: "下个星期一" },
{ regex: /周二|星期二/g, value: "下个星期二" },
{ regex: /周三|星期三/g, value: "下个星期三" },
{ regex: /周四|星期四/g, value: "下个星期四" },
{ regex: /周五|星期五/g, value: "下个星期五" },
{ regex: /周六|星期六/g, value: "下个星期六" },
{ regex: /周日|星期日|周天|星期天/g, value: "下个星期日" }
];

// 时间模式匹配 - 不使用模板字符串
var timePatterns = [
{ regex: /(\d+)[点時]半/g, match: function(m) { return m[0] + "30分"; } },
{ regex: /(\d+)[点時]钟?/g, match: function(m) { return m[0]; } },
{ regex: /(\d+)点時分/g, match: function(m) { return m[0]; } },
{ regex: /上午/g, value: "上午" },
{ regex: /中午/g, value: "中午" },
{ regex: /下午/g, value: "下午" },
{ regex: /晚上/g, value: "晚上" },
{ regex: /早上/g, value: "早上" },
{ regex: /凌晨/g, value: "凌晨" }
];

// 匹配日期
var dateFound = false;
for (var i = 0; i < datePatterns.length; i++) {
var pattern = datePatterns[i];
var matches = text.match(pattern.regex);
if (matches && matches.length > 0) {
var match = matches[0];
var dateValue = pattern.value;
deadline = dateValue;
dateFound = true;
remainingText = remainingText.replace(match, " ");
}
}

// 匹配时间
var timeFound = false;
for (var i = 0; i < timePatterns.length; i++) {
var pattern = timePatterns[i];
var matches = text.match(pattern.regex);
if (matches && matches.length > 0) {
var match = matches[0];
var timeValue;
if (pattern.match) {
timeValue = pattern.match(matches);
} else {
timeValue = pattern.value;
}

if (dateFound) {
    deadline = deadline + " " + timeValue;
  } else {
    deadline = timeValue;
  }
  timeFound = true;
  remainingText = remainingText.replace(match, " ");
}
}

// 清理文本中的多余空格
remainingText = remainingText.replace(/\s+/g, " ").trim();

return { deadline: deadline, remainingText: remainingText };
}

// 清洗任务标题，移除干扰词 - 增强版
function cleanTaskTitle(text, deadline) {
var cleanedText = text;

// 移除更全面的干扰词 - 增加了更多连接词和语气词
var wordsToRemove = [
'我要', '我想', '我需要', '我打算', '我准备',
'要', '想', '去', '准备', '打算', '需要',
'帮我', '请', '麻烦', '希望', '计划', '安排',
'一下', '做一个', '做', '一个',
'然后', '还有', '接着', '再',
'的话', '咯', '吧', '呢', '啊', '哦', '呀',
'先', '完成', '开始', '继续'
];

for (var i = 0; i < wordsToRemove.length; i++) {
var word = wordsToRemove[i];
cleanedText = cleanedText.replace(new RegExp(word, 'g'), " ");
}

// 过滤掉可能在标题中出现的时间词汇
if (deadline !== "待定") {
var timeWords = [
'今天', '明天', '后天',
'周一', '周二', '周三', '周四', '周五', '周六', '周日',
'星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日',
'上午', '中午', '下午', '晚上', '凌晨', '早上'
];

for (var i = 0; i < timeWords.length; i++) {
  var word = timeWords[i];
  cleanedText = cleanedText.replace(new RegExp(word, 'g'), " ");
}

// 移除数字+点/时
cleanedText = cleanedText.replace(/\d+[点時](\d+分)?/g, " ");
}

// 清理多余空格并修剪
cleanedText = cleanedText.replace(/\s+/g, " ").trim();

// 如果清理后文本为空，返回原文本的一部分
if (!cleanedText || cleanedText.length < 2) {
cleanedText = text.trim();
if (cleanedText.length > 30) {
cleanedText = cleanedText.substring(0, 30);
}
}

return cleanedText;
}
