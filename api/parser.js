// api/parser.js
var utils = require('./utils');

/**

解析用户输入文本，提取任务
@param {string} userInput - 用户输入的文本
@return {Array} - 解析后的任务数组
*/
function parseInputToTasks(userInput) {
var tasks = [];
// 判断是否是更新现有计划的请求
var isUpdateRequest = userInput.includes('计划有变') ||
userInput.includes('更新计划') ||
userInput.includes('修改计划') ||
userInput.includes('plan changed') ||
userInput.includes('update my plan');

// 首先，通过多种分隔符拆分输入文本 - 修改后的正则表达式
var subSentences = userInput.split(/[，。！？,.;\n?？/]+|然后|还有|接着|再/).filter(function(s) {
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
var extractedInfo = utils.extractTimeInfo(subSentence);
var deadline = extractedInfo.deadline;
var remainingText = extractedInfo.remainingText;

// 清洗标题文本
var title = utils.cleanTaskTitle(remainingText, deadline);
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
var extractedInfo = utils.extractTimeInfo(userInput);
var title = utils.cleanTaskTitle(extractedInfo.remainingText, extractedInfo.deadline);
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

return tasks;
}

module.exports = {
parseInputToTasks: parseInputToTasks
};
