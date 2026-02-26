import React, { useState, useEffect } from 'react';
import './index.css'; // Assumes you have Tailwind CSS set up here

function App() {
  const [tasks, setTasks] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');

  // System prompt for Claude to extract structured tasks
  const systemPrompt = `You are a planning assistant that converts user's natural language plans into structured tasks.
  
  Extract tasks from the user's message and format them as a JSON array of objects with these fields:
  - id: A unique string ID (use current timestamp + random chars)
  - title: A clear, concise task title (max 50 chars)
  - description: Optional more detailed description
  - deadline: When the task should be completed (can be a specific date or relative time)
  - status: Always set to "pending" for new tasks
  
  If the user is modifying existing plans (messages containing phrases like "plan changed", "update my plan", etc.), 
  review their changes and provide an updated JSON array that should replace the current one.
  
  Your response should ONLY contain the valid JSON array, nothing else. Do not include any explanation, markdown formatting, or code blocks.
  
  Example output:
  [
    {
      "id": "task_1689245678",
      "title": "Buy groceries",
      "description": "Get milk, eggs and bread",
      "deadline": "Today at 5pm",
      "status": "pending"
    },
    {
      "id": "task_1689245679",
      "title": "Finish presentation",
      "description": "Complete slides for Thursday meeting",
      "deadline": "Tomorrow",
      "status": "pending"
    }
  ]`;

  // Load data from localStorage on initial render
  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks');
    const savedApiKey = localStorage.getItem('claudeApiKey');
    
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (e) {
        console.error('Failed to parse saved tasks');
      }
    }
    
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Save API key to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('claudeApiKey', apiKey);
  }, [apiKey]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userInput.trim()) return;
    
    if (!apiKey) {
      setError('Please set your Claude API Key in settings first');
      setShowSettings(true);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          max_tokens: 4000,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userInput
            }
          ]
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to process your request');
      }
      
      const resultContent = data.content[0].text;
      
      try {
        const parsedTasks = JSON.parse(resultContent);
        
        if (Array.isArray(parsedTasks)) {
          // If the input includes words about changing plans, replace all tasks
          if (userInput.toLowerCase().includes('计划有变') || 
              userInput.toLowerCase().includes('plan changed') ||
              userInput.toLowerCase().includes('update my plan')) {
            setTasks(parsedTasks);
          } else {
            // Otherwise, add new tasks to existing ones
            setTasks(prev => [...prev, ...parsedTasks]);
          }
          setUserInput('');
        } else {
          throw new Error('Invalid response format');
        }
      } catch (e) {
        setError('Failed to parse the AI response');
        console.error('Parsing error:', e, 'Raw content:', resultContent);
      }
      
    } catch (err) {
      setError(err.message || 'Something went wrong');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskStatus = (id) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === id 
          ? { ...task, status: task.status === 'completed' ? 'pending' : 'completed' } 
          : task
      )
    );
  };

  const deleteTask = (id) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
  };

  const handleApiKeySave = () => {
    setShowSettings(false);
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0] p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#5A3825]">每日计划助手</h1>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-full bg-[#F9EAD3] hover:bg-[#F3D9B5] text-[#5A3825]"
            aria-label="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </header>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
              <h2 className="text-2xl font-bold text-[#5A3825] mb-4">设置</h2>
              <label className="block mb-2 text-sm font-medium text-[#5A3825]">
                Claude API Key
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full mt-1 p-3 border border-[#F3D9B5] rounded-xl focus:ring-2 focus:ring-[#F3D9B5] focus:border-transparent"
                  placeholder="输入你的API Key"
                />
              </label>
              <div className="flex justify-end mt-6 gap-2">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-[#FAFAFA] text-[#5A3825] rounded-xl hover:bg-[#F0F0F0]"
                >
                  取消
                </button>
                <button
                  onClick={handleApiKeySave}
                  className="px-4 py-2 bg-[#F3D9B5] text-[#5A3825] rounded-xl hover:bg-[#EAC694]"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="mb-4">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="输入你的计划，比如：'明天上午我需要去超市买东西，下午三点去图书馆还书'，或者输入'计划有变：今天我要在家工作'来修改计划..."
              className="w-full p-4 bg-white border border-[#F3D9B5] rounded-2xl min-h-[120px] focus:ring-2 focus:ring-[#F3D9B5] focus:border-transparent resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-xl font-medium text-white ${
              loading ? 'bg-[#D9BFA0] cursor-not-allowed' : 'bg-[#C99C6B] hover:bg-[#BA8A5A]'
            }`}
          >
            {loading ? '处理中...' : '添加到我的计划'}
          </button>
          {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
        </form>

        {/* Tasks List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[#5A3825] mb-4">我的计划</h2>
          
          {tasks.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-[#F9EAD3]">
              <p className="text-[#8A7968]">还没有计划，添加一些吧！</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div 
                key={task.id} 
                className={`bg-white rounded-2xl p-5 shadow-sm border ${
                  task.status === 'completed' ? 'border-[#D1E7DD] bg-opacity-80' : 'border-[#F9EAD3]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className={`flex-grow ${task.status === 'completed' ? 'text-[#6c757d]' : 'text-[#5A3825]'}`}>
                    <h3 className={`font-medium text-lg ${task.status === 'completed' ? 'line-through' : ''}`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-sm mt-1 text-[#8A7968]">{task.description}</p>
                    )}
                    {task.deadline && (
                      <p className="text-sm mt-2 flex items-center text-[#C99C6B]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {task.deadline}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleTaskStatus(task.id)}
                      className={`p-2 rounded-full ${
                        task.status === 'completed'
                          ? 'bg-[#D1E7DD] text-[#0F5132]'
                          : 'bg-[#F9EAD3] text-[#8A7968] hover:bg-[#F3D9B5]'
                      }`}
                      aria-label={task.status === 'completed' ? "Mark as incomplete" : "Mark as complete"}
                    >
                      {task.status === 'completed' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-2 rounded-full bg-[#FFF1F2] text-[#E11D48] hover:bg-[#FFE4E6]"
                      aria-label="Delete task"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
