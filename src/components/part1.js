import React, { useState, useEffect } from 'react';

const TaskManagementApp = () => {
  // 譌･莉倥ｒ繝輔か繝ｼ繝槭ャ繝医☆繧矩未謨ｰ
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  };

  // .ics 繝輔ぃ繧､繝ｫ繧堤函謌舌☆繧矩未謨ｰ
  const generateICSFile = (task) => {
    // 繧ｿ繧ｹ繧ｯ縺ｫ邱繧∝・繧翫′縺ｪ縺・ｴ蜷医・蜃ｦ逅・＠縺ｪ縺・
    if (!task.dueDate) {
      alert('縺薙・繧ｿ繧ｹ繧ｯ縺ｫ縺ｯ邱繧∝・繧頑律縺瑚ｨｭ螳壹＆繧後※縺・∪縺帙ｓ縲・);
      return;
    }

    // 迴ｾ蝨ｨ縺ｮ譌･譎ゅｒ蜿門ｾ・(UTC蠖｢蠑・
    const now = new Date();
    const timeStamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/g, '');
    
  // 邱繧∝・繧頑律繧貞・逅・
  const dueDate = new Date(task.dueDate);
  
  // 邨よ律莠亥ｮ壹・蝣ｴ蜷医∵律莉倥□縺代ｒ蜿門ｾ励＠縺ｦ"YYYYMMDD"蠖｢蠑上↓縺吶ｋ
  const dueDateFormatted = dueDate.toISOString().split('T')[0].replace(/-/g, '');
  
  // 邨ゆｺ・律縺ｯ髢句ｧ区律縺ｮ鄙梧律・・utlook縺ｮ邨よ律莠亥ｮ壹・莉墓ｧ倥↓蜷医ｏ縺帙ｋ・・
  const endDate = new Date(dueDate);
  endDate.setDate(endDate.getDate() + 1);
  const endDateFormatted = endDate.toISOString().split('T')[0].replace(/-/g, '');
  
  // 繝ｦ繝九・繧ｯID縺ｮ逕滓・
  const uid = `${timeStamp}-${Math.floor(Math.random() * 1000000)}@kanban-task-app`;
  
  // 繧ｿ繧､繝医Ν縺ｮ謨ｴ蠖｢
  const title = task.title.replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
  const projectInfo = task.project ? `[${task.project}] ` : '';
  
  // .ics 繝輔ぃ繧､繝ｫ縺ｮ蜀・ｮｹ繧堤函謌・
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kanban Task App//JP',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${timeStamp.substring(0, 8)}T${timeStamp.substring(8, 14)}Z`,
    `DTSTART;VALUE=DATE:${dueDateFormatted}`,
    `DTEND;VALUE=DATE:${endDateFormatted}`,
    `SUMMARY:${projectInfo}${title}`,
    'TRANSP:TRANSPARENT',
    `DESCRIPTION:Kanban Task App 縺九ｉ繧ｨ繧ｯ繧ｹ繝昴・繝医＆繧後◆繧ｿ繧ｹ繧ｯ\\n\\n迥ｶ諷・ ${
      task.status === 'todo' ? '譛ｪ逹謇・ : task.status === 'in-progress' ? '騾ｲ陦御ｸｭ' : '螳御ｺ・
    }`,
    'CLASS:PUBLIC',
    'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    
    // 繝輔ぃ繧､繝ｫ繧偵ム繧ｦ繝ｳ繝ｭ繝ｼ繝・
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // 繝輔ぃ繧､繝ｫ蜷阪↓繧ｿ繧ｹ繧ｯ蜷阪→譌･莉倥ｒ蜷ｫ繧√ｋ
    const fileName = `${task.title.substring(0, 30).replace(/[/\\?%*:|"<>]/g, '-')}_${dueDateFormatted}.ics`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 邱繧∝・繧頑律縺ｫ蝓ｺ縺･縺・※繧ｹ繧ｿ繧､繝ｫ繧ｯ繝ｩ繧ｹ繧定ｿ斐☆髢｢謨ｰ
  const getDueDateClassName = (dueDate, isCompleted) => {
    if (isCompleted) return 'text-gray-400';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDateObj = new Date(dueDate);
    dueDateObj.setHours(0, 0, 0, 0);
    
    const timeDiff = dueDateObj.getTime() - today.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    
    if (daysDiff < 0) return 'text-red-600 font-bold'; // 譛滄剞蛻・ｌ
    if (daysDiff === 0) return 'text-orange-500 font-bold'; // 莉頑律縺梧悄髯・
    if (daysDiff <= 3) return 'text-yellow-600'; // 譛滄剞縺瑚ｿ代＞・・譌･莉･蜀・ｼ・
    
    return 'text-green-600'; // 譛滄剞縺ｫ菴呵｣輔′縺ゅｋ
  };

  // 繝励Ο繧ｸ繧ｧ繧ｯ繝亥錐縺ｫ蝓ｺ縺･縺・※濶ｲ繧堤函謌・
  const getProjectColor = (projectName) => {
    if (!projectName) return null;
    
    // 繝励Ο繧ｸ繧ｧ繧ｯ繝亥錐縺九ｉ繝上ャ繧ｷ繝･蛟､繧堤函謌・
    let hash = 0;
    for (let i = 0; i < projectName.length; i++) {
      hash = projectName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // 繧ｫ繝ｩ繝ｼ繧ｳ繝ｼ繝峨ｒ逕滓・・域・繧九＞濶ｲ縺ｫ隱ｿ謨ｴ・・
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 70%, 65%)`; // 蠖ｩ蠎ｦ縺ｨ譏主ｺｦ繧貞崋螳壹＠縺ｦ譏弱ｋ縺・牡繧堤函謌・
  };

  // 繧ｿ繧ｹ繧ｯ縺ｮ迥ｶ諷九ｒ螳夂ｾｩ
  const TASK_STATUS = {
    TODO: 'todo',
    IN_PROGRESS: 'in-progress',
    DONE: 'done'
  };

  // 繧ｿ繧ｹ繧ｯ縺ｮ迥ｶ諷狗ｮ｡逅・
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('tasks');
    console.log('Loaded tasks from localStorage:', savedTasks);
    if (savedTasks) {
      const parsedTasks = JSON.parse(savedTasks);
      // 譌｢蟄倥・繧ｿ繧ｹ繧ｯ縺ｫcomments驟榊・縺ｨsubtasks驟榊・繧定ｿｽ蜉
      return parsedTasks.map((task, index) => ({
        ...task,
        order: task.order !== undefined ? task.order : index, // 鬆・ｺ上・繝ｭ繝代ユ繧｣繧定ｿｽ蜉
        comments: task.comments || [],
        subtasks: task.subtasks ? task.subtasks.map(subtask => ({
          ...subtask,
          level: subtask.level || 0
        })) : []
      }));
    }
    return [];
  });
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskProject, setNewTaskProject] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editProject, setEditProject] = useState('');
  const editTextRef = React.useRef(null);
  const editProjectRef = React.useRef(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const [filter, setFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const taskInputRef = React.useRef(null);

  // 繧ｿ繧ｹ繧ｯ縺ｮ螟画峩繧偵Ο繝ｼ繧ｫ繝ｫ繧ｹ繝医Ξ繝ｼ繧ｸ縺ｫ菫晏ｭ・
  useEffect(() => {
    console.log('Saving tasks to localStorage:', tasks);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    const savedTasks = localStorage.getItem('tasks');
    console.log('Verified saved tasks:', savedTasks);
  }, [tasks]);

  // 繝励Ο繧ｸ繧ｧ繧ｯ繝医Μ繧ｹ繝医・蜿門ｾ・
  const getProjects = () => {
    const projects = tasks
      .map(task => task.project)
      .filter(project => project && project.trim() !== '')
      .filter((project, index, self) => self.indexOf(project) === index) // 驥崎､・勁蜴ｻ
      .sort();
    return projects;
  };

  // 譁ｰ縺励＞繧ｿ繧ｹ繧ｯ繧定ｿｽ蜉
  const addTask = () => {
    if (newTaskTitle.trim() === '') return;
    
    // 蜷後§繧ｹ繝・・繧ｿ繧ｹ縺ｮ荳ｭ縺ｧ譛螟ｧ縺ｮorder蛟､繧貞叙蠕・
    const sameStatusTasks = tasks.filter(t => t.status === TASK_STATUS.TODO);
    const maxOrder = sameStatusTasks.length > 0 
      ? Math.max(...sameStatusTasks.map(t => t.order || 0)) + 1 
      : 0;
    
    const newTask = {
      id: Date.now(),
      title: newTaskTitle,
      status: TASK_STATUS.TODO,
      order: maxOrder, // 譁ｰ縺励＞繧ｿ繧ｹ繧ｯ縺ｫ縺ｯ譛螟ｧ蛟､+1縺ｮ鬆・ｺ上ｒ蜑ｲ繧雁ｽ薙※
      dueDate: newTaskDueDate || null,
      project: newTaskProject,
      createdAt: new Date().toISOString(),
      comments: [],
      subtasks: [],
    };
    
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    
    // 繧ｿ繧ｹ繧ｯ霑ｽ蜉蠕後↓繝輔か繝ｼ繧ｫ繧ｹ繧呈眠縺励＞繧ｿ繧ｹ繧ｯ蜈･蜉帙↓謌ｻ縺・
    if (taskInputRef.current) {
      taskInputRef.current.focus();
    }
  };

  const handleKeyPress = (e) => {
    // Shift + Enter 縺ｮ蝣ｴ蜷医・謾ｹ陦後＠縺ｦ邨ゆｺ・
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addTask();
    }
  };

  // 遨ｺ縺ｮ繧ｿ繧ｹ繧ｯ繧定ｿｽ蜉・医せ繝・・繧ｿ繧ｹ謖・ｮ壼庄閭ｽ・・
  const addEmptyTask = (status) => {
    // 蜷後§繧ｹ繝・・繧ｿ繧ｹ縺ｮ荳ｭ縺ｧ譛螟ｧ縺ｮorder蛟､繧貞叙蠕・
    const sameStatusTasks = tasks.filter(t => t.status === status);
    const maxOrder = sameStatusTasks.length > 0 
      ? Math.max(...sameStatusTasks.map(t => t.order || 0)) + 1 
      : 0;
    
    const newTask = {
      id: Date.now(),
      title: "譁ｰ縺励＞繧ｿ繧ｹ繧ｯ",
      status: status,
      order: maxOrder, // 譁ｰ縺励＞繧ｿ繧ｹ繧ｯ縺ｫ縺ｯ譛螟ｧ蛟､+1縺ｮ鬆・ｺ上ｒ蜑ｲ繧雁ｽ薙※
      createdAt: new Date().toISOString(),
      comments: [],
      subtasks: [],
    };
    
    setTasks([...tasks, newTask]);
    // 霑ｽ蜉蠕後☆縺舌↓邱ｨ髮・Δ繝ｼ繝峨↓
    startEditing(newTask.id, newTask.title, null, null);
  };

  // 繧ｳ繝｡繝ｳ繝亥・蜉帙・迥ｶ諷九ｒ譖ｴ譁ｰ
  const handleCommentChange = (taskId, value) => {
    setCommentInputs(prev => ({
      ...prev,
      [taskId]: value
    }));
  };

  // 繧ｳ繝｡繝ｳ繝医ｒ霑ｽ蜉
  const addComment = (taskId) => {
    // ref縺九ｉ迴ｾ蝨ｨ縺ｮ蛟､繧貞叙蠕・
    const commentInput = document.querySelector(`textarea[placeholder="繧ｳ繝｡繝ｳ繝医ｒ蜈･蜉・.."]`);
    const commentText = commentInput ? commentInput.value : commentInputs[taskId] || '';
    
    if (commentText && commentText.trim()) {
      // 譁ｰ縺励＞繧ｳ繝｡繝ｳ繝医が繝悶ず繧ｧ繧ｯ繝医ｒ菴懈・
      const newComment = {
        id: Date.now(),
        text: commentText,
        createdAt: new Date().toISOString(),
      };
      
      // 繧ｿ繧ｹ繧ｯ縺ｮ迥ｶ諷九ｒ譖ｴ譁ｰ
      const updatedTasks = tasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              comments: [...task.comments, newComment],
            }
          : task
      );
      
      // 繧ｿ繧ｹ繧ｯ迥ｶ諷九ｒ譖ｴ譁ｰ
      setTasks(updatedTasks);
      
      // 驕ｸ謚樔ｸｭ縺ｮ繧ｿ繧ｹ繧ｯ繧よ峩譁ｰ縺励※陦ｨ遉ｺ繧貞渚譏
      const updatedTask = updatedTasks.find(task => task.id === taskId);
      if (updatedTask && selectedTask && selectedTask.id === taskId) {
        setSelectedTask(updatedTask);
      }
      
      // 繧ｳ繝｡繝ｳ繝亥・蜉帶ｬ・ｒ繧ｯ繝ｪ繧｢
      setCommentInputs(prev => ({
        ...prev,
        [taskId]: ''
      }));
      
      // 逶ｴ謗･DOM繧呈桃菴懊＠縺ｦ繧ｳ繝｡繝ｳ繝亥・蜉帶ｬ・ｒ繧ｯ繝ｪ繧｢縺励※繝輔か繝ｼ繧ｫ繧ｹ繧堤ｶｭ謖・
      if (commentInput) {
        commentInput.value = '';
        // 繝輔か繝ｼ繧ｫ繧ｹ繧堤ｶｭ謖・
        setTimeout(() => {
          commentInput.focus();
        }, 10);
      }
    }
  };

  // 繧ｳ繝｡繝ｳ繝医ｒ蜑企勁
  const deleteComment = (taskId, commentId) => {
    // 繧ｿ繧ｹ繧ｯ縺ｮ迥ｶ諷九ｒ譖ｴ譁ｰ
    const updatedTasks = tasks.map(task =>
      task.id === taskId
        ? {
            ...task,
            comments: task.comments.filter(comment => comment.id !== commentId),
          }
        : task
    );
    
    // 繧ｿ繧ｹ繧ｯ迥ｶ諷九ｒ譖ｴ譁ｰ
    setTasks(updatedTasks);
    
    // 驕ｸ謚樔ｸｭ縺ｮ繧ｿ繧ｹ繧ｯ繧よ峩譁ｰ縺励※陦ｨ遉ｺ繧貞渚譏
    const updatedTask = updatedTasks.find(task => task.id === taskId);
    if (updatedTask && selectedTask && selectedTask.id === taskId) {
      setSelectedTask(updatedTask);
    }
  };

  // 繧ｿ繧ｹ繧ｯ縺ｮ迥ｶ諷九ｒ譖ｴ譁ｰ
  const updateTaskStatus = (id, newStatus) => {
    // 繧ｹ繝・・繧ｿ繧ｹ螟画峩蜈医・譛螟ｧorder蛟､繧貞叙蠕・
    const targetStatusTasks = tasks.filter(t => t.status === newStatus);
    const maxOrder = targetStatusTasks.length > 0 
      ? Math.max(...targetStatusTasks.map(t => t.order || 0)) + 1 
      : 0;
    
    setTasks(tasks.map(task => 
      task.id === id 
        ? { ...task, status: newStatus, order: maxOrder } // 譁ｰ縺励＞繧ｹ繝・・繧ｿ繧ｹ縺ｮ譛蠕悟ｰｾ縺ｫ驟咲ｽｮ
        : task
    ));
  };

  // 繧ｿ繧ｹ繧ｯ繧貞炎髯､
  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  // 繧ｿ繧ｹ繧ｯ邱ｨ髮・Δ繝ｼ繝峨・髢句ｧ・
  const startEditing = (id, title, dueDate, project) => {
    setEditingId(id);
    setEditText(title);
    setEditDueDate(dueDate || '');
    setEditProject(project || '');
    // 谺｡縺ｮ繝ｬ繝ｳ繝繝ｪ繝ｳ繧ｰ蠕後↓繝輔か繝ｼ繧ｫ繧ｹ繧定ｨｭ螳・
    setTimeout(() => {
      if (editTextRef.current) {
        editTextRef.current.focus();
      }
    }, 10);
  };

  // 繧ｿ繧ｹ繧ｯ縺ｮ邱ｨ髮・ｒ菫晏ｭ・
  const saveEdit = () => {
    const currentEditText = editTextRef.current ? editTextRef.current.value : editText;
    const currentEditProject = editProjectRef.current ? editProjectRef.current.value : editProject;
    
    if (currentEditText && currentEditText.trim()) {
      setTasks(
        tasks.map(task =>
          task.id === editingId ? { 
            ...task, 
            title: currentEditText,
            dueDate: editDueDate || null,
            project: currentEditProject || null
          } : task
        )
      );
    }
    setEditingId(null);
  };

  // 邱ｨ髮・ｷ繧∝・繧頑律縺ｮ譖ｴ譁ｰ
  const handleEditDueDateChange = (e) => {
    setEditDueDate(e.target.value);
  };

  // 繝峨Λ繝・げ髢句ｧ九ワ繝ｳ繝峨Λ - 繝・・繧ｿ霆｢騾√が繝悶ず繧ｧ繧ｯ繝医↓繧ｿ繧ｹ繧ｯID繧定ｨｭ螳・
  const handleDragStart = (taskId, e) => {
    // 繝峨Λ繝・げ繝・・繧ｿ繧偵そ繝・ヨ
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', taskId.toString());
      e.dataTransfer.effectAllowed = 'move';
    }
    
    // 繝峨Λ繝・げ荳ｭ縺ｮ繧ｿ繧ｹ繧ｯ繧定ｨ倬鹸
    setDraggedTask(taskId);
    
    // 繝峨Λ繝・げ譎ゅ・繝励Ξ繝薙Η繝ｼ逕ｻ蜒上ｒ隱ｿ謨ｴ・磯乗・蠎ｦ繧定ｨｭ螳夲ｼ・
    if (e.target) {
      setTimeout(() => {
        e.target.style.opacity = '0.6';
      }, 0);
    }
  };

  // 繝峨Λ繝・げ邨ゆｺ・ワ繝ｳ繝峨Λ - 隕∫ｴ縺ｮ陦ｨ遉ｺ繧貞・縺ｫ謌ｻ縺・
  const handleDragEnd = (e) => {
    // 繝峨Λ繝・げ荳ｭ縺ｮ繧ｹ繧ｿ繧､繝ｫ繧偵Μ繧ｻ繝・ヨ
    if (e.target) {
      e.target.style.opacity = '1';
    }
    
    // 繝峨Λ繝・げ迥ｶ諷九ｒ繝ｪ繧ｻ繝・ヨ
    setDraggedTask(null);
  };

  // 繝峨Ο繝・・繝上Φ繝峨Λ繝ｼ
  const handleDrop = (status) => {
    if (draggedTask !== null) {
      updateTaskStatus(draggedTask, status);
    }
  };

  // 繝峨Λ繝・げ繧ｪ繝ｼ繝舌・繝上Φ繝峨Λ繝ｼ
  const handleDragOver = (e) => {
    e.preventDefault();
    // 繧ｫ繝ｼ繧ｽ繝ｫ繧貞､画峩縺励※繝峨Ο繝・・蜿ｯ閭ｽ繧堤､ｺ縺・
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  // 繝輔ぅ繝ｫ繧ｿ繝ｼ讖溯・縺ｮ螳溯｣・
  const getFilteredTasks = (status) => {
    // 謖・ｮ壹＆繧後◆繧ｹ繝・・繧ｿ繧ｹ縺ｧ繝輔ぅ繝ｫ繧ｿ繝ｪ繝ｳ繧ｰ縺励｛rder鬆・↓繧ｽ繝ｼ繝・
    return tasks
      .filter(task => task.status === status)
      .sort((a, b) => {
        // order繝励Ο繝代ユ繧｣縺ｧ荳ｦ縺ｹ譖ｿ縺茨ｼ域悴螳夂ｾｩ縺ｮ蝣ｴ蜷医・0縺ｨ縺ｿ縺ｪ縺呻ｼ・
        const orderA = a.order !== undefined ? a.order : 0;
        const orderB = b.order !== undefined ? b.order : 0;
        return orderA - orderB;
      });
  };

  // 繧ｵ繝悶ち繧ｹ繧ｯ繧呈律譎ゅ・譏・・〒荳ｦ縺ｹ譖ｿ縺医ｋ
  const sortSubtasksByDueDate = (subtasks) => {
    if (!subtasks || subtasks.length === 0) return [];
    
    return [...subtasks].sort((a, b) => {
      // 譛滄剞縺瑚ｨｭ螳壹＆繧後※縺・↑縺・ｴ蜷医・蠕後ｍ縺ｫ驟咲ｽｮ
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      
      // 譌･莉倥ｒ豈碑ｼ・
      const dateA = new Date(a.dueDate);
      const dateB = new Date(b.dueDate);
      return dateA - dateB;
    });
  };

  // 繧ｵ繝悶ち繧ｹ繧ｯ繧偵ヵ繧｣繝ｫ繧ｿ繝ｪ繝ｳ繧ｰ縺吶ｋ髢｢謨ｰ繧剃ｿｮ豁｣ - 譌･譎る・↓繧ｽ繝ｼ繝医ｒ霑ｽ蜉
  const getFilteredSubtasks = (task, status) => {
    if (!task.subtasks || task.subtasks.length === 0) return [];
    const filteredSubtasks = task.subtasks.filter(subtask => subtask.status === status);
    // 譌･譎ゅ・譏・・〒荳ｦ縺ｹ譖ｿ縺・
    return sortSubtasksByDueDate(filteredSubtasks);
  };

  // 繧ｿ繧ｹ繧ｯ縺ｮ荳ｦ縺ｳ譖ｿ縺域ｩ溯・繧呈隼蝟・
  const reorderTasks = (status, startIndex, endIndex) => {
    // 荳ｦ縺ｳ譖ｿ縺医・蜑榊ｾ後′蜷後§蝣ｴ蜷医・菴輔ｂ縺励↑縺・
    if (startIndex === endIndex) return;
    
    // 繧ｹ繝・・繧ｿ繧ｹ縺ｧ繝輔ぅ繝ｫ繧ｿ繝ｪ繝ｳ繧ｰ縺励※order鬆・↓繧ｽ繝ｼ繝・
    const statusTasks = getFilteredTasks(status);
    
    if (startIndex < 0 || startIndex >= statusTasks.length || 
        endIndex < 0 || endIndex >= statusTasks.length) {
      console.error("辟｡蜉ｹ縺ｪ繧､繝ｳ繝・ャ繧ｯ繧ｹ:", startIndex, endIndex, statusTasks.length);
      return;
    }
    
    console.log("荳ｦ縺ｳ譖ｿ縺亥燕縺ｮ繧ｿ繧ｹ繧ｯ:", statusTasks.map(t => ({ id: t.id, order: t.order })));
    
    // 遘ｻ蜍輔☆繧九ち繧ｹ繧ｯ繧堤音螳・
    const taskToMove = statusTasks[startIndex];
    
    // 譁ｰ縺励＞驟榊・繧剃ｽ懈・・育ｧｻ蜍募・繧貞炎髯､・・
    const newStatusTasks = [...statusTasks];
    newStatusTasks.splice(startIndex, 1);
    
    // 遘ｻ蜍募・縺ｫ謖ｿ蜈･
    newStatusTasks.splice(endIndex, 0, taskToMove);
    
    // order繧貞・蜑ｲ繧雁ｽ薙※・・0蜊倅ｽ阪〒繧､繝ｳ繧ｯ繝ｪ繝｡繝ｳ繝・- 蟆・擂縺ｮ謖ｿ蜈･縺ｫ菴呵｣輔ｒ謖√◆縺帙ｋ・・
    const updatedTasks = newStatusTasks.map((task, index) => ({
      ...task,
      order: index * 10
    }));
    
    console.log("荳ｦ縺ｳ譖ｿ縺亥ｾ後・繧ｿ繧ｹ繧ｯ:", updatedTasks.map(t => ({ id: t.id, order: t.order })));
    
    // tasks驟榊・繧呈峩譁ｰ・井ｻ悶・繧ｹ繝・・繧ｿ繧ｹ縺ｮ繧ｿ繧ｹ繧ｯ縺ｯ縺昴・縺ｾ縺ｾ邯ｭ謖・ｼ・
    setTasks(prevTasks => 
      prevTasks.map(task => {
        // 蜷後§繧ｹ繝・・繧ｿ繧ｹ縺ｮ繧ｿ繧ｹ繧ｯ縺ｯ譁ｰ縺励＞order蛟､縺ｧ譖ｴ譁ｰ
        const updatedTask = updatedTasks.find(t => t.id === task.id);
        if (updatedTask) {
          return updatedTask;
        }
        // 莉悶・繧ｹ繝・・繧ｿ繧ｹ縺ｮ繧ｿ繧ｹ繧ｯ縺ｯ縺昴・縺ｾ縺ｾ
        return task;
      })
    );
  };

  // 繧ｫ繝ｳ繝舌Φ繧ｫ繝ｩ繝繧ｳ繝ｳ繝昴・繝阪Φ繝・
  const KanbanColumn = ({ title, status, tasks }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [dragOverTaskId, setDragOverTaskId] = useState(null);
    
    /**
     * 繧ｿ繧ｹ繧ｯ繧偵・繝ｭ繧ｸ繧ｧ繧ｯ繝亥挨縺ｫ繧ｰ繝ｫ繝ｼ繝怜喧
     * @returns {Object} 繝励Ο繧ｸ繧ｧ繧ｯ繝亥錐繧偵く繝ｼ縺ｨ縺吶ｋ繧ｿ繧ｹ繧ｯ繧ｰ繝ｫ繝ｼ繝・
     */
    const groupTasksByProject = () => {
      const grouped = {};
      
      // order縺ｧ繧ｽ繝ｼ繝域ｸ医∩縺ｮ繧ｿ繧ｹ繧ｯ繧剃ｽｿ逕ｨ
      tasks.forEach(task => {
        const projectName = task.project || 'No Project';
        if (!grouped[projectName]) {
          grouped[projectName] = [];
        }
        grouped[projectName].push(task);
      });
      
      return grouped;
    };
    
    /**
     * 繧ｫ繝ｩ繝蜈ｨ菴薙・繝峨Λ繝・げ繧ｪ繝ｼ繝舌・繝上Φ繝峨Λ
     * @param {Event} e - 繝峨Λ繝・げ繧ｪ繝ｼ繝舌・繧､繝吶Φ繝・
     */
    const handleDragOver = (e) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move';
      }
      setIsDragOver(true);
    };
    
    /**
     * 繧ｫ繝ｩ繝縺九ｉ縺ｮ繝峨Λ繝・げ繝ｪ繝ｼ繝悶ワ繝ｳ繝峨Λ
     */
    const handleDragLeave = () => {
      setIsDragOver(false);
    };
    
    /**
     * 繧ｫ繝ｩ繝鬆伜沺縺ｸ縺ｮ繝峨Ο繝・・繝上Φ繝峨Λ
     * @param {Event} e - 繝峨Ο繝・・繧､繝吶Φ繝・
     */
    const handleDrop = (e) => {
      e.preventDefault();
      setIsDragOver(false);
      
      console.log("繧ｫ繝ｩ繝縺ｸ縺ｮ繝峨Ο繝・・:", status, "繧ｿ繧ｹ繧ｯ:", draggedTask);
      
      // 繧ｫ繝ｩ繝繧ｨ繝ｪ繧｢縺ｸ縺ｮ繝峨Ο繝・・・医ち繧ｹ繧ｯ繧ｹ繝・・繧ｿ繧ｹ螟画峩・・
      if (draggedTask !== null && !dragOverTaskId) {
        // 蜈ｨ繧ｿ繧ｹ繧ｯ縺九ｉ繝峨Λ繝・げ荳ｭ縺ｮ繧ｿ繧ｹ繧ｯ繧呈､懃ｴ｢
        const allTasks = tasks.find(t => t.id === draggedTask);
        
        // 繧ｿ繧ｹ繧ｯ縺瑚ｦ九▽縺九ｉ縺ｪ縺・°縲∫焚縺ｪ繧九せ繝・・繧ｿ繧ｹ縺ｮ蝣ｴ蜷医・遘ｻ蜍・
        if (!allTasks || allTasks.status !== status) {
          // 繧ｹ繝・・繧ｿ繧ｹ螟画峩繧貞ｮ溯｡・
          updateTaskStatus(draggedTask, status);
          console.log("繧ｹ繝・・繧ｿ繧ｹ螟画峩螳御ｺ・", draggedTask, "竊・, status);
        }
      }
      
      // 繝峨Λ繝・げ迥ｶ諷九ｒ繝ｪ繧ｻ繝・ヨ
      setDraggedTask(null);
      setDragOverTaskId(null);
    };
    
    /**
     * 繧ｿ繧ｹ繧ｯ繧ｫ繝ｼ繝峨・繝峨Λ繝・げ繧ｪ繝ｼ繝舌・繝上Φ繝峨Λ
     * @param {Event} e - 繝峨Λ繝・げ繧ｪ繝ｼ繝舌・繧､繝吶Φ繝・
     * @param {string|number} taskId - 繝峨Λ繝・げ繧ｪ繝ｼ繝舌・縺輔ｌ縺溘ち繧ｹ繧ｯID
     */
    const handleTaskDragOver = (e, taskId) => {
      e.preventDefault();
      e.stopPropagation();
      
      // 繝峨Ο繝・・蜉ｹ譫懊ｒ險ｭ螳・
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move';
      }
      
      setDragOverTaskId(taskId);
    };
    
    /**
     * 繧ｿ繧ｹ繧ｯ繧ｫ繝ｼ繝峨・繝峨Λ繝・げ繝ｪ繝ｼ繝悶ワ繝ｳ繝峨Λ
     * @param {Event} e - 繝峨Λ繝・げ繝ｪ繝ｼ繝悶う繝吶Φ繝・
     */
    const handleTaskDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverTaskId(null);
    };
    
    /**
     * 繧ｿ繧ｹ繧ｯ繧ｫ繝ｼ繝峨∈縺ｮ繝峨Ο繝・・繝上Φ繝峨Λ
     * @param {Event} e - 繝峨Ο繝・・繧､繝吶Φ繝・
     * @param {string|number} taskId - 繝峨Ο繝・・蜈医・繧ｿ繧ｹ繧ｯID
     */
    const handleTaskDrop = (e, taskId) => {
      e.preventDefault();
      e.stopPropagation();
      
      console.log("繧ｿ繧ｹ繧ｯ縺ｸ縺ｮ繝峨Ο繝・・:", taskId, "繝峨Λ繝・げ荳ｭ:", draggedTask);
      
      if (draggedTask && draggedTask !== taskId) {
        // 繝峨Λ繝・げ蜈・→繝峨Ο繝・・蜈医・繧ｿ繧ｹ繧ｯ繧堤音螳・
        const sourceTask = tasks.find(t => t.id === draggedTask);
        const targetTask = tasks.find(t => t.id === taskId);
        
        if (sourceTask && targetTask) {
          // 蜷後§繧ｹ繝・・繧ｿ繧ｹ縺ｮ繧ｿ繧ｹ繧ｯ髢薙〒縺ｮ荳ｦ縺ｳ譖ｿ縺・
          if (sourceTask.status === targetTask.status) {
            const statusTasks = getFilteredTasks(targetTask.status);
            const draggedIndex = statusTasks.findIndex(t => t.id === draggedTask);
            const dropIndex = statusTasks.findIndex(t => t.id === taskId);
            
            console.log("繧ｿ繧ｹ繧ｯ荳ｦ縺ｳ譖ｿ縺・", 
                        "遘ｻ蜍募・:", draggedTask, `(order=${sourceTask.order})`, 
                        "遘ｻ蜍募・:", taskId, `(order=${targetTask.order})`, 
                        "繧､繝ｳ繝・ャ繧ｯ繧ｹ:", draggedIndex, "竊・, dropIndex);
            
            if (draggedIndex !== -1 && dropIndex !== -1) {
              reorderTasks(targetTask.status, draggedIndex, dropIndex);
            }
          } 
          // 逡ｰ縺ｪ繧九せ繝・・繧ｿ繧ｹ髢薙〒縺ｮ繝峨Ο繝・・・医せ繝・・繧ｿ繧ｹ螟画峩・・
          else {
            console.log("繧ｹ繝・・繧ｿ繧ｹ螟画峩:", 
                        "繧ｿ繧ｹ繧ｯ:", draggedTask, 
                        "譌ｧ繧ｹ繝・・繧ｿ繧ｹ:", sourceTask.status, 
                        "譁ｰ繧ｹ繝・・繧ｿ繧ｹ:", targetTask.status);
            
            updateTaskStatus(draggedTask, targetTask.status);
          }
        }
      }
      
      setDragOverTaskId(null);
      setDraggedTask(null);
    };

    // 繧ｿ繧ｹ繧ｯ繧ｫ繝ｼ繝峨さ繝ｳ繝昴・繝阪Φ繝茨ｼ亥・蜀・↓陦ｨ遉ｺ・・
    const renderTaskCard = (task) => {
      return (
        <div 
          key={task.id}
          draggable="true"
          onDragStart={(e) => handleDragStart(task.id, e)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleTaskDragOver(e, task.id)}
          onDragLeave={handleTaskDragLeave}
          onDrop={(e) => handleTaskDrop(e, task.id)}
          className={getTaskCardClasses(task.id)}
        >
          {editingId === task.id ? (
            // 邱ｨ髮・Δ繝ｼ繝会ｼ域里蟄倥さ繝ｼ繝峨ｒ縺昴・縺ｾ縺ｾ菴ｿ逕ｨ・・
            <form onSubmit={(e) => { e.preventDefault(); saveEdit(); }} className="flex flex-col w-full">
              {/* 譌｢蟄倥・邱ｨ髮・ヵ繧ｩ繝ｼ繝 */}
              <div className="flex mb-2">
                <input
                  type="text"
                  className="flex-grow p-1 border rounded-l"
                  defaultValue={editText}
                  ref={editTextRef}
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-green-500 text-white p-1 px-2 rounded-r"
                >
                  菫晏ｭ・
                </button>
              </div>
              <div className="flex mb-2">
                <label className="text-sm text-gray-600 mr-2 w-20">邱繧∝・繧奇ｼ・/label>
                <input
                  type="date"
                  className="flex-grow p-1 border rounded"
                  value={editDueDate}
                  onChange={handleEditDueDateChange}
                />
              </div>
              <div className="flex">
                <label className="text-sm text-gray-600 mr-2 w-20">繝励Ο繧ｸ繧ｧ繧ｯ繝茨ｼ・/label>
                <input
                  type="text"
                  className="flex-grow p-1 border rounded"
                  list="edit-project-list"
                  defaultValue={editProject}
                  ref={editProjectRef}
                />
                <datalist id="edit-project-list">
                  {getProjects().map(project => (
                    <option key={project} value={project} />
                  ))}
                </datalist>
              </div>
            </form>
          ) : (
            // 陦ｨ遉ｺ繝｢繝ｼ繝会ｼ域里蟄倥さ繝ｼ繝峨ｒ縺昴・縺ｾ縺ｾ菴ｿ逕ｨ・・
            <div className="flex items-start">
              <input
                type="checkbox"
                checked={task.status === TASK_STATUS.DONE}
                onChange={() => updateTaskStatus(task.id, task.status === TASK_STATUS.DONE ? TASK_STATUS.TODO : TASK_STATUS.DONE)}
                className="mr-2 mt-1"
              />
              <div className="flex-grow flex flex-col">
                <span
                  className={`${task.status === TASK_STATUS.DONE ? 'line-through text-gray-400' : ''}`}
                  onDoubleClick={() => startEditing(task.id, task.title, task.dueDate, task.project)}
                >
                  {task.title}
                </span>
                <div className="flex flex-nowrap items-center gap-2 mt-1">
                  {task.dueDate && (
                    <span className={`text-xs ${getDueDateClassName(task.dueDate, task.status === TASK_STATUS.DONE)}`}>
                      譛滄剞: {formatDate(task.dueDate)}
                    </span>
                  )}
                  {task.subtasks && task.subtasks.length > 0 && (
                    <span 
                      className="text-xs bg-gray-200 px-1 rounded cursor-pointer hover:bg-gray-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTask(task);
                      }}
                    >
                      繧ｵ繝悶ち繧ｹ繧ｯ: {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                      <span className="ml-1 text-blue-500">{task.subtasks.filter(st => st.status === TASK_STATUS.IN_PROGRESS).length > 0 ? '(騾ｲ陦御ｸｭ縺ゅｊ)' : ''}</span>
                    </span>
                  )}
                </div>
                
                {/* 繧ｵ繝悶ち繧ｹ繧ｯ縺ｮ霑ｽ蜉繝輔か繝ｼ繝 */}
                <div className="mt-2 border-t pt-2">
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="+ 繧ｵ繝悶ち繧ｹ繧ｯ繧定ｿｽ蜉"
                      className="text-sm w-full py-1 px-2 border rounded"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          const inputValue = e.target.value;
                          addSubtask(task.id, inputValue);
                          e.target.value = '';
                          // 繝輔か繝ｼ繧ｫ繧ｹ繧堤｢ｺ螳溘↓邯ｭ謖√☆繧九◆繧√↓蟆代＠驕・ｻｶ縺輔○繧・
                          setTimeout(() => {
                            e.target.focus();
                          }, 10);
                          e.preventDefault(); // 繝輔か繝ｼ繝縺ｮ繝・ヵ繧ｩ繝ｫ繝磯∽ｿ｡繧帝亟豁｢
                        }
                      }}
                    />
                  </div>
                  
                  {/* 繧ｵ繝悶ち繧ｹ繧ｯ縺ｮ繝ｪ繧ｹ繝郁｡ｨ遉ｺ - 迴ｾ蝨ｨ縺ｮ繧ｫ繝ｩ繝縺ｫ蟇ｾ蠢懊☆繧九せ繝・・繧ｿ繧ｹ縺ｮ繧ｵ繝悶ち繧ｹ繧ｯ縺縺代ｒ陦ｨ遉ｺ */}
                  {task.subtasks && getFilteredSubtasks(task, status).length > 0 && (
                    <div className="mt-1 space-y-1">
                      {getFilteredSubtasks(task, status).map(subtask => (
                        <div key={subtask.id} className="flex items-center text-sm">
                          <div className="flex items-center mr-2">
                            <button
                              onClick={() => promoteSubtask(task.id, subtask.id)}
                              className="text-gray-500 hover:text-gray-700 mr-1"
                              title="繝ｬ繝吶Ν荳翫￡"
                              disabled={(subtask.level || 0) === 0}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => demoteSubtask(task.id, subtask.id)}
                              className="text-gray-500 hover:text-gray-700"
                              title="繝ｬ繝吶Ν荳九￡"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                          </div>
                          <input
                            type="checkbox"
                            checked={subtask.completed}
                            onChange={() => toggleSubtaskCompletion(task.id, subtask.id)}
                            className="mr-1"
                          />
                          <span className={`flex-1 ${subtask.completed ? 'line-through text-gray-400' : ''}`} 
                            style={{ marginLeft: `${(subtask.level || 0) * 20}px` }}>
                            {subtask.text}
                          </span>
                          <div className="flex items-center">
                            <select
                              className="text-xs p-0 border rounded mr-1"
                              value={subtask.status || TASK_STATUS.TODO}
                              onChange={(e) => updateSubtaskStatus(task.id, subtask.id, e.target.value)}
                              style={{ maxWidth: '80px' }}
                            >
                              <option value={TASK_STATUS.TODO}>譛ｪ逹謇・/option>
                              <option value={TASK_STATUS.IN_PROGRESS}>騾ｲ陦御ｸｭ</option>
                              <option value={TASK_STATUS.DONE}>螳御ｺ・/option>
                            </select>
                            <input
                              type="date"
                              className="text-xs p-0 border rounded mr-1"
                              value={subtask.dueDate || ''}
                              onChange={(e) => setSubtaskDueDate(task.id, subtask.id, e.target.value)}
                              style={{ width: '110px' }}
                            />
                            <button
                              onClick={() => deleteSubtask(task.id, subtask.id)}
                              className="text-red-500 hover:text-red-700 ml-1"
                              title="蜑企勁"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col space-y-1">
                <button
                  className="text-sm text-blue-500 hover:text-blue-700"
                  onClick={() => startEditing(task.id, task.title, task.dueDate, task.project)}
                >
                  邱ｨ髮・
                </button>
                <button
                  className="text-sm text-green-500 hover:text-green-700"
                  onClick={() => setSelectedTask(task)}
                >
                  隧ｳ邏ｰ
                </button>
                <button
                  className="text-sm text-red-500 hover:text-red-700"
                  onClick={() => deleteTask(task.id)}
                >
                  蜑企勁
                </button>
                {task.dueDate && (
                  <button
                    className="text-xs text-purple-500 hover:text-purple-700 flex items-center px-2 py-1 rounded border border-purple-200 hover:bg-purple-50"
                    onClick={() => generateICSFile(task)}
                    title="Outlook繧ｫ繝ｬ繝ｳ繝繝ｼ縺ｫ霑ｽ蜉"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>莠亥ｮ夊ｿｽ蜉</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="w-1/3 px-2 max-w-md">
        <div className="bg-white rounded-t-lg p-3 shadow-md">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">{title}</h2>
            {(status === TASK_STATUS.TODO || status === TASK_STATUS.IN_PROGRESS) && (
              <button
                onClick={() => addEmptyTask(status)}
                className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-blue-600"
                title="遨ｺ縺ｮ繧ｿ繧ｹ繧ｯ繧定ｿｽ蜉"
              >
                +
              </button>
            )}
          </div>
        </div>
        
        <div
          className={dropAreaClasses}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* 繝励Ο繧ｸ繧ｧ繧ｯ繝亥挨繧ｰ繝ｫ繝ｼ繝・*/}
          {Object.keys(groupedTasks).sort().map(projectName => (
            <div key={projectName} className="mb-4">
              <div 
                className="bg-gray-200 p-2 rounded-md mb-2"
                style={{ 
                  backgroundColor: getProjectColor(projectName),
                  color: 'white',
                  textShadow: '0px 1px 2px rgba(0,0,0,0.3)'
                }}
              >
                <h3 className="font-medium">{projectName}</h3>
              </div>
              <div className="space-y-1">
                {groupedTasks[projectName].map(task => (
                  <div 
                    key={task.id}
                    draggable="true"
                    onDragStart={(e) => handleDragStart(task.id, e)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleTaskDragOver(e, task.id)}
                    onDragLeave={handleTaskDragLeave}
                    onDrop={(e) => handleTaskDrop(e, task.id)}
                    className={getTaskCardClasses(task.id)}
                    data-task-id={task.id}
                    data-task-order={task.order}
                  >
                    {/* 繧ｿ繧ｹ繧ｯ縺ｮ荳企Κ縺ｫ隕冶ｦ夂噪縺ｪ繝峨Λ繝・げ繝上Φ繝峨Ν繧定ｿｽ蜉 */}
                    <div className="w-full h-1 bg-gray-200 rounded-full mb-2 cursor-move opacity-50 hover:opacity-100 hover:bg-blue-300"></div>
                    
                    {editingId === task.id ? (
                      <form onSubmit={(e) => { e.preventDefault(); saveEdit(); }} className="flex flex-col w-full">
                        <div className="flex mb-2">
                          <input
                            type="text"
                            className="flex-grow p-1 border rounded-l"
                            defaultValue={editText}
                            ref={editTextRef}
                            autoFocus
                          />
                          <button
                            type="submit"
                            className="bg-green-500 text-white p-1 px-2 rounded-r"
                          >
                            菫晏ｭ・
                          </button>
                        </div>
                        <div className="flex mb-2">
                          <label className="text-sm text-gray-600 mr-2 w-20">邱繧∝・繧奇ｼ・/label>
                          <input
                            type="date"
                            className="flex-grow p-1 border rounded"
                            value={editDueDate}
                            onChange={handleEditDueDateChange}
                          />
                        </div>
                        <div className="flex">
                          <label className="text-sm text-gray-600 mr-2 w-20">繝励Ο繧ｸ繧ｧ繧ｯ繝茨ｼ・/label>
                          <input
                            type="text"
                            className="flex-grow p-1 border rounded"
                            list="edit-project-list"
                            defaultValue={editProject}
                            ref={editProjectRef}
                          />
                          <datalist id="edit-project-list">
                            {getProjects().map(project => (
                              <option key={project} value={project} />
                            ))}
                          </datalist>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          checked={task.status === TASK_STATUS.DONE}
                          onChange={() => updateTaskStatus(task.id, task.status === TASK_STATUS.DONE ? TASK_STATUS.TODO : TASK_STATUS.DONE)}
                          className="mr-2 mt-1"
                        />
                        <div className="flex-grow flex flex-col">
                          <div className="flex justify-between items-start">
                            <span
                              className={`${task.status === TASK_STATUS.DONE ? 'line-through text-gray-400' : ''}`}
                              onDoubleClick={() => startEditing(task.id, task.title, task.dueDate, task.project)}
                            >
                              {task.title}
                              {/* 繝・ヰ繝・げ逕ｨ・壹ち繧ｹ繧ｯ縺ｮorder蛟､繧定｡ｨ遉ｺ */}
                              <span className="text-xs text-gray-400 ml-1">
                                [ord:{task.order !== undefined ? task.order : '縺ｪ縺・}]
                              </span>
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {task.dueDate && (
                              <span className={`text-xs ${getDueDateClassName(task.dueDate, task.status === TASK_STATUS.DONE)}`}>
                                譛滄剞: {formatDate(task.dueDate)}
                              </span>
                            )}
                            {task.subtasks && task.subtasks.length > 0 && (
                              <span 
                                className="text-xs bg-gray-200 px-1 rounded cursor-pointer hover:bg-gray-300"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTask(task);
                                }}
                              >
                                繧ｵ繝悶ち繧ｹ繧ｯ: {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                                <span className="ml-1 text-blue-500">{task.subtasks.filter(st => st.status === TASK_STATUS.IN_PROGRESS).length > 0 ? '(騾ｲ陦御ｸｭ縺ゅｊ)' : ''}</span>
                              </span>
                            )}
                          </div>
                          
                          {/* 繧ｵ繝悶ち繧ｹ繧ｯ縺ｮ霑ｽ蜉繝輔か繝ｼ繝 */}
                          <div className="mt-2 border-t pt-2">
                            <div className="flex">
                              <input
                                type="text"
                                placeholder="+ 繧ｵ繝悶ち繧ｹ繧ｯ繧定ｿｽ蜉"
                                className="text-sm w-full py-1 px-2 border rounded"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && e.target.value.trim()) {
                                    const inputValue = e.target.value;
                                    addSubtask(task.id, inputValue);
                                    e.target.value = '';
                                    // 繝輔か繝ｼ繧ｫ繧ｹ繧堤｢ｺ螳溘↓邯ｭ謖√☆繧九◆繧√↓蟆代＠驕・ｻｶ縺輔○繧・
                                    setTimeout(() => {
                                      e.target.focus();
                                    }, 10);
                                    e.preventDefault(); // 繝輔か繝ｼ繝縺ｮ繝・ヵ繧ｩ繝ｫ繝磯∽ｿ｡繧帝亟豁｢
                                  }
                                }}
                              />
                            </div>
                            
                            {/* 繧ｵ繝悶ち繧ｹ繧ｯ縺ｮ繝ｪ繧ｹ繝郁｡ｨ遉ｺ - 迴ｾ蝨ｨ縺ｮ繧ｫ繝ｩ繝縺ｫ蟇ｾ蠢懊☆繧九せ繝・・繧ｿ繧ｹ縺ｮ繧ｵ繝悶ち繧ｹ繧ｯ縺縺代ｒ陦ｨ遉ｺ */}
                            {task.subtasks && getFilteredSubtasks(task, status).length > 0 && (
                              <div className="mt-1 space-y-1">
                                {getFilteredSubtasks(task, status).map(subtask => (
                                  <div key={subtask.id} className="flex items-center text-sm">
                                    <div className="flex items-center mr-2">
                                      <button
                                        onClick={() => promoteSubtask(task.id, subtask.id)}
                                        className="text-gray-500 hover:text-gray-700 mr-1"
                                        title="繝ｬ繝吶Ν荳翫￡"
                                        disabled={(subtask.level || 0) === 0}
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => demoteSubtask(task.id, subtask.id)}
                                        className="text-gray-500 hover:text-gray-700"
                                        title="繝ｬ繝吶Ν荳九￡"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                      </button>
                                    </div>
                                    <input
                                      type="checkbox"
                                      checked={subtask.completed}
                                      onChange={() => toggleSubtaskCompletion(task.id, subtask.id)}
                                      className="mr-1"
                                    />
                                    <span className={`flex-1 ${subtask.completed ? 'line-through text-gray-400' : ''}`} 
                                      style={{ marginLeft: `${(subtask.level || 0) * 20}px` }}>
                                      {subtask.text}
                                      {subtask.dueDate && (
                                        <span className={`ml-2 text-xs ${getDueDateClassName(subtask.dueDate, subtask.completed)}`}>
                                          ({formatDate(subtask.dueDate)})
                                        </span>
                                      )}
                                    </span>
                                    <div className="flex items-center">
                                      <select
                                        className="text-xs p-0 border rounded mr-1"
                                        value={subtask.status || TASK_STATUS.TODO}
                                        onChange={(e) => updateSubtaskStatus(task.id, subtask.id, e.target.value)}
                                        style={{ maxWidth: '80px' }}
                                      >
                                        <option value={TASK_STATUS.TODO}>譛ｪ逹謇・/option>
                                        <option value={TASK_STATUS.IN_PROGRESS}>騾ｲ陦御ｸｭ</option>
                                        <option value={TASK_STATUS.DONE}>螳御ｺ・/option>
                                      </select>
                                      <input
                                        type="date"
                                        className="text-xs p-0 border rounded mr-1"
                                        value={subtask.dueDate || ''}
                                        onChange={(e) => setSubtaskDueDate(task.id, subtask.id, e.target.value)}
                                        style={{ width: '110px' }}
                                      />
                                      <button
                                        onClick={() => deleteSubtask(task.id, subtask.id)}
                                        className="text-red-500 hover:text-red-700 ml-1"
                                        title="蜑企勁"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <button
                            className="text-sm text-blue-500 hover:text-blue-700"
                            onClick={() => startEditing(task.id, task.title, task.dueDate, task.project)}
                          >
                            邱ｨ髮・
                          </button>
                          <button
                            className="text-sm text-green-500 hover:text-green-700"
                            onClick={() => setSelectedTask(task)}
                          >
                            隧ｳ邏ｰ
                          </button>
                          <button
                            className="text-sm text-red-500 hover:text-red-700"
                            onClick={() => deleteTask(task.id)}
                          >
                            蜑企勁
                          </button>
                          {task.dueDate && (
                            <button
                              className="text-xs text-purple-500 hover:text-purple-700 flex items-center px-2 py-1 rounded border border-purple-200 hover:bg-purple-50"
                              onClick={() => generateICSFile(task)}
                              title="Outlook繧ｫ繝ｬ繝ｳ繝繝ｼ縺ｫ霑ｽ蜉"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>莠亥ｮ夊ｿｽ蜉</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* 繧ｿ繧ｹ繧ｯ縺ｮ荳矩Κ縺ｫ隕冶ｦ夂噪縺ｪ繝峨Λ繝・げ繝上Φ繝峨Ν繧定ｿｽ蜉 */}
                    <div className="w-full h-1 bg-gray-200 rounded-full mt-2 cursor-move opacity-50 hover:opacity-100 hover:bg-blue-300"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {/* 繝励Ο繧ｸ繧ｧ繧ｯ繝医↑縺励・繧ｿ繧ｹ繧ｯ */}
          {noProjectTasks.length > 0 && (
            <div className="space-y-2">
              {noProjectTasks.map(task => (
                <div 
                  key={task.id}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(task.id, e)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleTaskDragOver(e, task.id)}
                  onDragLeave={handleTaskDragLeave}
                  onDrop={(e) => handleTaskDrop(e, task.id)}
                  className={getTaskCardClasses(task.id)}
                >
                  {editingId === task.id ? (
                    // 繝励Ο繧ｸ繧ｧ繧ｯ繝医↑縺励ち繧ｹ繧ｯ縺ｮ蜀・ｮｹ・域里蟄倥さ繝ｼ繝峨→蜷梧ｧ假ｼ・
                    <form onSubmit={(e) => { e.preventDefault(); saveEdit(); }} className="flex flex-col w-full">
                      {/* 譌｢蟄倥・邱ｨ髮・ヵ繧ｩ繝ｼ繝 */}
                      <div className="flex mb-2">
                        <input
                          type="text"
                          className="flex-grow p-1 border rounded-l"
                          defaultValue={editText}
                          ref={editTextRef}
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="bg-green-500 text-white p-1 px-2 rounded-r"
                        >
                          菫晏ｭ・
                        </button>
                      </div>
                      <div className="flex mb-2">
                        <label className="text-sm text-gray-600 mr-2 w-20">邱繧∝・繧奇ｼ・/label>
                        <input
                          type="date"
                          className="flex-grow p-1 border rounded"
                          value={editDueDate}
                          onChange={handleEditDueDateChange}
                        />
                      </div>
                      <div className="flex">
                        <label className="text-sm text-gray-600 mr-2 w-20">繝励Ο繧ｸ繧ｧ繧ｯ繝茨ｼ・/label>
                        <input
                          type="text"
                          className="flex-grow p-1 border rounded"
                          list="edit-project-list"
                          defaultValue={editProject}
                          ref={editProjectRef}
                        />
                        <datalist id="edit-project-list">
                          {getProjects().map(project => (
                            <option key={project} value={project} />
                          ))}
                        </datalist>
                      </div>
                    </form>
                  ) : (
                    // 陦ｨ遉ｺ繝｢繝ｼ繝会ｼ域里蟄倥さ繝ｼ繝峨ｒ縺昴・縺ｾ縺ｾ菴ｿ逕ｨ・・
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        checked={task.status === TASK_STATUS.DONE}
                        onChange={() => updateTaskStatus(task.id, task.status === TASK_STATUS.DONE ? TASK_STATUS.TODO : TASK_STATUS.DONE)}
                        className="mr-2 mt-1"
                      />
                      <div className="flex-grow flex flex-col">
                        <span
                          className={`${task.status === TASK_STATUS.DONE ? 'line-through text-gray-400' : ''}`}
                          onDoubleClick={() => startEditing(task.id, task.title, task.dueDate, task.project)}
                        >
                          {task.title}
                        </span>
                        <div className="flex flex-nowrap items-center gap-2 mt-1">
                          {task.dueDate && (
                            <span className={`text-xs ${getDueDateClassName(task.dueDate, task.status === TASK_STATUS.DONE)}`}>
                              譛滄剞: {formatDate(task.dueDate)}
                            </span>
                          )}
                          {task.subtasks && task.subtasks.length > 0 && (
                            <span 
                              className="text-xs bg-gray-200 px-1 rounded cursor-pointer hover:bg-gray-300"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTask(task);
                              }}
                            >
                              繧ｵ繝悶ち繧ｹ繧ｯ: {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                              <span className="ml-1 text-blue-500">{task.subtasks.filter(st => st.status === TASK_STATUS.IN_PROGRESS).length > 0 ? '(騾ｲ陦御ｸｭ縺ゅｊ)' : ''}</span>
                            </span>
                          )}
                        </div>
                        
                        {/* 繧ｵ繝悶ち繧ｹ繧ｯ縺ｮ霑ｽ蜉繝輔か繝ｼ繝 */}
                        <div className="mt-2 border-t pt-2">
                          <div className="flex">
                            <input
                              type="text"
                              placeholder="+ 繧ｵ繝悶ち繧ｹ繧ｯ繧定ｿｽ蜉"
                              className="text-sm w-full py-1 px-2 border rounded"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && e.target.value.trim()) {
                                  const inputValue = e.target.value;
                                  addSubtask(task.id, inputValue);
                                  e.target.value = '';
                                  // 繝輔か繝ｼ繧ｫ繧ｹ繧堤｢ｺ螳溘↓邯ｭ謖√☆繧九◆繧√↓蟆代＠驕・ｻｶ縺輔○繧・
                                  setTimeout(() => {
                                    e.target.focus();
                                  }, 10);
                                  e.preventDefault(); // 繝輔か繝ｼ繝縺ｮ繝・ヵ繧ｩ繝ｫ繝磯∽ｿ｡繧帝亟豁｢
                                }
                              }}
                            />
                          </div>
                          
                          {/* 繧ｵ繝悶ち繧ｹ繧ｯ縺ｮ繝ｪ繧ｹ繝郁｡ｨ遉ｺ - 迴ｾ蝨ｨ縺ｮ繧ｫ繝ｩ繝縺ｫ蟇ｾ蠢懊☆繧九せ繝・・繧ｿ繧ｹ縺ｮ繧ｵ繝悶ち繧ｹ繧ｯ縺縺代ｒ陦ｨ遉ｺ */}
                          {task.subtasks && getFilteredSubtasks(task, status).length > 0 && (
                            <div className="mt-1 space-y-1">
                              {getFilteredSubtasks(task, status).map(subtask => (
                                <div key={subtask.id} className="flex items-center text-sm">
                                  <div className="flex items-center mr-2">
                                    <button
                                      onClick={() => promoteSubtask(task.id, subtask.id)}
                                      className="text-gray-500 hover:text-gray-700 mr-1"
                                      title="繝ｬ繝吶Ν荳翫￡"
                                      disabled={(subtask.level || 0) === 0}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => demoteSubtask(task.id, subtask.id)}
                                      className="text-gray-500 hover:text-gray-700"
                                      title="繝ｬ繝吶Ν荳九￡"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                      </svg>
                                    </button>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={subtask.completed}
                                    onChange={() => toggleSubtaskCompletion(task.id, subtask.id)}
                                    className="mr-1"
                                  />
                                  <span className={`flex-1 ${subtask.completed ? 'line-through text-gray-400' : ''}`} 
                                    style={{ marginLeft: `${(subtask.level || 0) * 20}px` }}>
                                    {subtask.text}
                                  </span>
                                  <div className="flex items-center">
                                    <select
                                      className="text-xs p-0 border rounded mr-1"
                                      value={subtask.status || TASK_STATUS.TODO}
                                      onChange={(e) => updateSubtaskStatus(task.id, subtask.id, e.target.value)}
                                      style={{ maxWidth: '80px' }}
                                    >
                                      <option value={TASK_STATUS.TODO}>譛ｪ逹謇・/option>
                                      <option value={TASK_STATUS.IN_PROGRESS}>騾ｲ陦御ｸｭ</option>
                                      <option value={TASK_STATUS.DONE}>螳御ｺ・/option>
                                    </select>
                                    <input
                                      type="date"
                                      className="text-xs p-0 border rounded mr-1"
                                      value={subtask.dueDate || ''}
                                      onChange={(e) => setSubtaskDueDate(task.id, subtask.id, e.target.value)}
                                      style={{ width: '110px' }}
                                    />
                                    <button
                                      onClick={() => deleteSubtask(task.id, subtask.id)}
                                      className="text-red-500 hover:text-red-700 ml-1"
                                      title="蜑企勁"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <button
                          className="text-sm text-blue-500 hover:text-blue-700"
                          onClick={() => startEditing(task.id, task.title, task.dueDate, task.project)}
                        >
                          邱ｨ髮・
                        </button>
                        <button
                          className="text-sm text-green-500 hover:text-green-700"
                          onClick={() => setSelectedTask(task)}
                        >
                          隧ｳ邏ｰ
                        </button>
                        <button
                          className="text-sm text-red-500 hover:text-red-700"
                          onClick={() => deleteTask(task.id)}
                        >
                          蜑企勁
                        </button>
                        {task.dueDate && (
                          <button
                            className="text-xs text-purple-500 hover:text-purple-700 flex items-center px-2 py-1 rounded border border-purple-200 hover:bg-purple-50"
                            onClick={() => generateICSFile(task)}
                            title="Outlook繧ｫ繝ｬ繝ｳ繝繝ｼ縺ｫ霑ｽ蜉"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>莠亥ｮ夊ｿｽ蜉</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* 繧ｿ繧ｹ繧ｯ縺後↑縺・ｴ蜷医・繝｡繝・そ繝ｼ繧ｸ */}
          {hasNoTasks && (
            <p className="text-center text-gray-500 p-4">繧ｿ繧ｹ繧ｯ縺後≠繧翫∪縺帙ｓ</p>
          )}
        </div>
      </div>
    );
  };

  const customStyles = `
    .h-screen-minus-header {
      height: auto;
      max-height: 500px;
    }
    
    .task-card {
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .task-card:hover {
      transform: translateX(3px);
    }
    
    .column-transition {
      transition: background-color 0.3s;
    }
    
    .column-transition:hover {
      background-color: #f3f4f6;
    }
  `;

  const getTaskStats = () => {
    const todoCount = tasks.filter(t => t.status === TASK_STATUS.TODO).length;
    const inProgressCount = tasks.filter(t => t.status === TASK_STATUS.IN_PROGRESS).length;
    const doneCount = tasks.filter(t => t.status === TASK_STATUS.DONE).length;
    
    return {
      total: tasks.length,
      todo: todoCount,
      inProgress: inProgressCount,
      done: doneCount
    };
  };

  // 縺吶∋縺ｦ縺ｮ繧ｿ繧ｹ繧ｯ繧偵き繝ｬ繝ｳ繝繝ｼ縺ｫ霑ｽ蜉縺吶ｋ
  const exportAllTasksToCalendar = () => {
    // 邱繧∝・繧翫′縺ゅｋ繧ｿ繧ｹ繧ｯ縺縺代ｒ繝輔ぅ繝ｫ繧ｿ繝ｼ
    const tasksWithDueDate = tasks.filter(task => task.dueDate);
    
    if (tasksWithDueDate.length === 0) {
      alert('邱繧∝・繧頑律縺瑚ｨｭ螳壹＆繧後※縺・ｋ繧ｿ繧ｹ繧ｯ縺後≠繧翫∪縺帙ｓ縲・);
      return;
    }
    
    // 迴ｾ蝨ｨ縺ｮ譌･譎ゅｒ蜿門ｾ・(UTC蠖｢蠑・
    const now = new Date();
    const timeStamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/g, '');
    
    // .ics 繝輔ぃ繧､繝ｫ縺ｮ蜀・ｮｹ繧堤函謌・
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Kanban Task App//JP',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];
    
    // 蜷・ち繧ｹ繧ｯ繧歎EVENT縺ｨ縺励※霑ｽ蜉
    tasksWithDueDate.forEach(task => {
      // 邱繧∝・繧頑律繧貞・逅・
      const dueDate = new Date(task.dueDate);
      // 邨よ律莠亥ｮ壹・蝣ｴ蜷医∵律莉倥□縺代ｒ蜿門ｾ励＠縺ｦ"YYYYMMDD"蠖｢蠑上↓縺吶ｋ
      const dueDateFormatted = dueDate.toISOString().split('T')[0].replace(/-/g, '');
      
      // 邨ゆｺ・律縺ｯ髢句ｧ区律縺ｮ鄙梧律・・utlook縺ｮ邨よ律莠亥ｮ壹・莉墓ｧ倥↓蜷医ｏ縺帙ｋ・・
      const endDate = new Date(dueDate);
      endDate.setDate(endDate.getDate() + 1);
      const endDateFormatted = endDate.toISOString().split('T')[0].replace(/-/g, '');
      
      // 繝ｦ繝九・繧ｯID縺ｮ逕滓・
      const uid = `${timeStamp}-${task.id}@kanban-task-app`;
      
      // 繧ｿ繧､繝医Ν縺ｮ謨ｴ蠖｢
      const title = task.title.replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
      const projectInfo = task.project ? `[${task.project}] ` : '';
      
      // VEVENT繧定ｿｽ蜉
      icsContent = [
        ...icsContent,
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${timeStamp.substring(0, 8)}T${timeStamp.substring(8, 14)}Z`,
        `DTSTART;VALUE=DATE:${dueDateFormatted}`,
        `DTEND;VALUE=DATE:${endDateFormatted}`,
        `SUMMARY:${projectInfo}${title}`,
        'TRANSP:TRANSPARENT',
        `DESCRIPTION:Kanban Task App 縺九ｉ繧ｨ繧ｯ繧ｹ繝昴・繝医＆繧後◆繧ｿ繧ｹ繧ｯ\\n\\n迥ｶ諷・ ${
          task.status === 'todo' ? '譛ｪ逹謇・ : task.status === 'in-progress' ? '騾ｲ陦御ｸｭ' : '螳御ｺ・
        }`,
        'CLASS:PUBLIC',
        'STATUS:CONFIRMED',
        'END:VEVENT'
      ];
    });
    
    // 繧ｫ繝ｬ繝ｳ繝繝ｼ繧堤ｵゆｺ・
    icsContent.push('END:VCALENDAR');
    
    // 繝輔ぃ繧､繝ｫ繧偵ム繧ｦ繝ｳ繝ｭ繝ｼ繝・
    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // 繝輔ぃ繧､繝ｫ蜷阪↓譌･莉倥ｒ蜷ｫ繧√ｋ
    const fileName = `KanbanTasks_${now.toISOString().split('T')[0]}.ics`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * 繧ｵ繝悶ち繧ｹ繧ｯ繧定ｿｽ蜉縺吶ｋ髢｢謨ｰ
   * @param {string|number} taskId - 隕ｪ繧ｿ繧ｹ繧ｯ縺ｮID
   * @param {string} subtaskText - 繧ｵ繝悶ち繧ｹ繧ｯ縺ｮ繝・く繧ｹ繝・
   */
  const addSubtask = (taskId, subtaskText) => {
    // 繝・く繧ｹ繝医′遨ｺ縺ｮ蝣ｴ蜷医・菴輔ｂ縺励↑縺・
    if (!subtaskText.trim()) return;
    
    // 譁ｰ縺励＞繧ｵ繝悶ち繧ｹ繧ｯ繧ｪ繝悶ず繧ｧ繧ｯ繝医ｒ菴懈・
    const newSubtask = {
      id: Date.now().toString(),
      text: subtaskText.trim(),
      completed: false,
      status: TASK_STATUS.TODO,
      level: 0, // 髫主ｱ､繝ｬ繝吶Ν・医ロ繧ｹ繝育畑・・
      dueDate: null,
      createdAt: new Date().toISOString()
    };
    
    // 繧ｿ繧ｹ繧ｯ繝ｪ繧ｹ繝医ｒ譖ｴ譁ｰ
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === taskId) {
          const updatedSubtasks = [...(task.subtasks || []), newSubtask];
          return { 
            ...task,
            subtasks: sortSubtasksByDueDate(updatedSubtasks)
          };
        }
        return task;
      })
    );
  };

  /**
   * 繧ｵ繝悶ち繧ｹ繧ｯ縺ｮ髫主ｱ､繝ｬ繝吶Ν繧剃ｸ翫￡繧具ｼ亥ｷｦ縺ｫ遘ｻ蜍包ｼ・
   * @param {string|number} taskId - 隕ｪ繧ｿ繧ｹ繧ｯ縺ｮID
   * @param {string} subtaskId - 繧ｵ繝悶ち繧ｹ繧ｯ縺ｮID
   */
  const promoteSubtask = (taskId, subtaskId) => {
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === taskId && task.subtasks) {
          const updatedSubtasks = task.subtasks.map(subtask => {
            if (subtask.id === subtaskId) {
              // 繝ｬ繝吶Ν0縺梧怙繧ょｷｦ蛛ｴ縺ｪ縺ｮ縺ｧ縲√◎繧御ｻ･荳翫・蟾ｦ縺ｫ遘ｻ蜍輔〒縺阪↑縺・
              const newLevel = Math.max(0, (subtask.level || 0) - 1);
              return { ...subtask, level: newLevel };
            }
            return subtask;
          });
          
          return { ...task, subtasks: updatedSubtasks };
        }
        return task;
      })
    );
  };

  /**
   * 繧ｵ繝悶ち繧ｹ繧ｯ縺ｮ髫主ｱ､繝ｬ繝吶Ν繧剃ｸ九￡繧具ｼ亥承縺ｫ遘ｻ蜍包ｼ・
   * @param {string|number} taskId - 隕ｪ繧ｿ繧ｹ繧ｯ縺ｮID
   * @param {string} subtaskId - 繧ｵ繝悶ち繧ｹ繧ｯ縺ｮID
   */
  const demoteSubtask = (taskId, subtaskId) => {
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === taskId && task.subtasks) {
          const updatedSubtasks = task.subtasks.map(subtask => {
            if (subtask.id === subtaskId) {
              // 譛螟ｧ縺ｧ5繝ｬ繝吶Ν縺ｾ縺ｧ縺ｮ繝阪せ繝茨ｼ郁ｦ冶ｪ肴ｧ縺ｮ縺溘ａ・・
              const newLevel = Math.min(5, (subtask.level || 0) + 1);
              return { ...subtask, level: newLevel };
            }
            return subtask;
          });
          
          return { ...task, subtasks: updatedSubtasks };
        }
        return task;
      })
    );
  };

  /**
   * 繧ｵ繝悶ち繧ｹ繧ｯ縺ｮ螳御ｺ・せ繝・・繧ｿ繧ｹ繧偵ヨ繧ｰ繝ｫ縺吶ｋ
   * @param {string|number} taskId - 隕ｪ繧ｿ繧ｹ繧ｯ縺ｮID
   * @param {string} subtaskId - 繧ｵ繝悶ち繧ｹ繧ｯ縺ｮID
   */
  const toggleSubtaskCompletion = (taskId, subtaskId) => {
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === taskId && task.subtasks) {
          const updatedSubtasks = task.subtasks.map(subtask => {
            if (subtask.id === subtaskId) {
              const newCompleted = !subtask.completed;
              // 螳御ｺ・せ繝・・繧ｿ繧ｹ縺ｨ騾｣蜍輔＆縺帙ｋ
              const newStatus = newCompleted ? TASK_STATUS.DONE : TASK_STATUS.TODO;
              return { 
                ...subtask, 
                completed: newCompleted,
                status: newStatus 
              };
            }
            return subtask;
          });
          
          return { ...task, subtasks: updatedSubtasks };
        }
        return task;
      })
    );
  };

  /**
   * 繧ｵ繝悶ち繧ｹ繧ｯ縺ｮ繧ｹ繝・・繧ｿ繧ｹ繧呈峩譁ｰ縺吶ｋ
   * @param {string|number} taskId - 隕ｪ繧ｿ繧ｹ繧ｯ縺ｮID
   * @param {string} subtaskId - 繧ｵ繝悶ち繧ｹ繧ｯ縺ｮID
   * @param {string} newStatus - 譁ｰ縺励＞繧ｹ繝・・繧ｿ繧ｹ
   */
  const updateSubtaskStatus = (taskId, subtaskId, newStatus) => {
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === taskId && task.subtasks) {
          const updatedSubtasks = task.subtasks.map(subtask => {
            if (subtask.id === subtaskId) {
              // 繧ｹ繝・・繧ｿ繧ｹ縺轡ONE縺ｮ蝣ｴ蜷医・縲…ompleted繧る｣蜍輔＆縺帙ｋ
              const newCompleted = newStatus === TASK_STATUS.DONE;
              return { 
                ...subtask, 
                status: newStatus,
                completed: newCompleted 
              };
            }
            return subtask;
          });
          
          return { ...task, subtasks: updatedSubtasks };
        }
        return task;
      })
    );
  };

  /**
   * 繧ｵ繝悶ち繧ｹ繧ｯ繧貞炎髯､縺吶ｋ
   * @param {string|number} taskId - 隕ｪ繧ｿ繧ｹ繧ｯ縺ｮID
   * @param {string} subtaskId - 蜑企勁縺吶ｋ繧ｵ繝悶ち繧ｹ繧ｯ縺ｮID
   */
  const deleteSubtask = (taskId, subtaskId) => {
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === taskId && task.subtasks) {
          const updatedSubtasks = task.subtasks.filter(
            subtask => subtask.id !== subtaskId
          );
          
          return { ...task, subtasks: updatedSubtasks };
        }
        return task;
      })
    );
  };

  /**
   * 繧ｵ繝悶ち繧ｹ繧ｯ縺ｮ譛滄剞譌･繧定ｨｭ螳壹☆繧・
   * @param {string|number} taskId - 隕ｪ繧ｿ繧ｹ繧ｯ縺ｮID
   * @param {string} subtaskId - 繧ｵ繝悶ち繧ｹ繧ｯ縺ｮID
   * @param {string} dueDate - 譛滄剞譌･・・YYY-MM-DD蠖｢蠑擾ｼ・
   */
  const setSubtaskDueDate = (taskId, subtaskId, dueDate) => {
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === taskId && task.subtasks) {
          // 繧ｵ繝悶ち繧ｹ繧ｯ繧呈律莉倥た繝ｼ繝医☆繧句燕縺ｫ譖ｴ譁ｰ
          const updatedSubtasks = task.subtasks.map(subtask => {
            if (subtask.id === subtaskId) {
              return { ...subtask, dueDate };
            }
            return subtask;
          });
          
          // 譖ｴ譁ｰ蠕後・繧ｵ繝悶ち繧ｹ繧ｯ繝ｪ繧ｹ繝医ｒ譌･莉倬・↓繧ｽ繝ｼ繝・
          return { ...task, subtasks: sortSubtasksByDueDate(updatedSubtasks) };
        }
        return task;
      })
    );
  };

  /**
   * 繧ｵ繝悶ち繧ｹ繧ｯ繧呈律莉倬・↓繧ｽ繝ｼ繝医☆繧・
   * @param {Array} subtasks - 繧ｵ繝悶ち繧ｹ繧ｯ縺ｮ驟榊・
   * @returns {Array} 繧ｽ繝ｼ繝域ｸ医∩縺ｮ繧ｵ繝悶ち繧ｹ繧ｯ驟榊・
