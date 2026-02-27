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
