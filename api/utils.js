// api/utils.js

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

module.exports = {
extractTimeInfo: extractTimeInfo,
cleanTaskTitle: cleanTaskTitle
};

