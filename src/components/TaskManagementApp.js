import React, { useState, useEffect } from 'react';

const TaskManagementApp = () => {
  // 日付をフォーマットする関数
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  };

  // .ics ファイルを生成する関数
  const generateICSFile = (task) => {
    // タスクに締め切りがない場合は処理しない
    if (!task.dueDate) {
      alert('このタスクには締め切り日が設定されていません。');
      return;
    }

    // 現在の日時を取得 (UTC形式)
    const now = new Date();
    const timeStamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/g, '');
    
  // 締め切り日を処理
  const dueDate = new Date(task.dueDate);
  
  // 終日予定の場合、日付だけを取得して"YYYYMMDD"形式にする
  const dueDateFormatted = dueDate.toISOString().split('T')[0].replace(/-/g, '');
  
  // 終了日は開始日の翌日（Outlookの終日予定の仕様に合わせる）
  const endDate = new Date(dueDate);
  endDate.setDate(endDate.getDate() + 1);
  const endDateFormatted = endDate.toISOString().split('T')[0].replace(/-/g, '');
  
  // ユニークIDの生成
  const uid = `${timeStamp}-${Math.floor(Math.random() * 1000000)}@kanban-task-app`;
  
  // タイトルの整形
  const title = task.title.replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
  const projectInfo = task.project ? `[${task.project}] ` : '';
  
  // .ics ファイルの内容を生成
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
    `DESCRIPTION:Kanban Task App からエクスポートされたタスク\\n\\n状態: ${
      task.status === 'todo' ? '未着手' : task.status === 'in-progress' ? '進行中' : '完了'
    }`,
    'CLASS:PUBLIC',
    'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    
    // ファイルをダウンロード
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // ファイル名にタスク名と日付を含める
    const fileName = `${task.title.substring(0, 30).replace(/[/\\?%*:|"<>]/g, '-')}_${dueDateFormatted}.ics`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 締め切り日に基づいてスタイルクラスを返す関数
  const getDueDateClassName = (dueDate, isCompleted) => {
    if (isCompleted) return 'text-gray-400';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDateObj = new Date(dueDate);
    dueDateObj.setHours(0, 0, 0, 0);
    
    const timeDiff = dueDateObj.getTime() - today.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    
    if (daysDiff < 0) return 'text-red-600 font-bold'; // 期限切れ
    if (daysDiff === 0) return 'text-orange-500 font-bold'; // 今日が期限
    if (daysDiff <= 3) return 'text-yellow-600'; // 期限が近い（3日以内）
    
    return 'text-green-600'; // 期限に余裕がある
  };

  // プロジェクト名に基づいて色を生成
  const getProjectColor = (projectName) => {
    if (!projectName) return null;
    
    // プロジェクト名からハッシュ値を生成
    let hash = 0;
    for (let i = 0; i < projectName.length; i++) {
      hash = projectName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // カラーコードを生成（明るい色に調整）
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 70%, 65%)`; // 彩度と明度を固定して明るい色を生成
  };

  // タスクの状態を定義
  const TASK_STATUS = {
    TODO: 'todo',
    IN_PROGRESS: 'in-progress',
    DONE: 'done'
  };

  // タスクの状態管理
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('tasks');
    console.log('Loaded tasks from localStorage:', savedTasks);
    if (savedTasks) {
      const parsedTasks = JSON.parse(savedTasks);
      // 既存のタスクにcomments配列とsubtasks配列を追加
      return parsedTasks.map(task => ({
        ...task,
        comments: task.comments || [],
        subtasks: task.subtasks || []
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

  // タスクの変更をローカルストレージに保存
  useEffect(() => {
    console.log('Saving tasks to localStorage:', tasks);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    const savedTasks = localStorage.getItem('tasks');
    console.log('Verified saved tasks:', savedTasks);
  }, [tasks]);

  // プロジェクトリストの取得
  const getProjects = () => {
    const projects = tasks
      .map(task => task.project)
      .filter(project => project && project.trim() !== '')
      .filter((project, index, self) => self.indexOf(project) === index) // 重複除去
      .sort();
    return projects;
  };

  // 新しいタスクを追加
  const addTask = () => {
    if (newTaskTitle.trim()) {
      const newTask = {
        id: Date.now(),
        title: newTaskTitle,
        status: TASK_STATUS.TODO,
        createdAt: new Date().toISOString(),
        dueDate: newTaskDueDate || null,
        project: newTaskProject || null,
        comments: [], // コメント配列を追加
        subtasks: [], // サブタスク配列を追加
      };
      console.log('Adding new task:', newTask);
      setTasks(prevTasks => [...prevTasks, newTask]);
      setNewTaskTitle('');
      setNewTaskDueDate('');
    }
  };

  // Enterキーで追加
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addTask();
    }
  };

  // 空のタスクを特定のステータスで追加
  const addEmptyTask = (status) => {
    const newTask = {
      id: Date.now(),
      title: `新しいタスク ${new Date().toLocaleTimeString()}`,
      status: status,
      createdAt: new Date().toISOString(),
      dueDate: null,
      project: null,
      comments: [],
      subtasks: [], // サブタスク配列を追加
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
    
    // 追加後すぐに編集モードに
    setTimeout(() => {
      startEditing(newTask.id, newTask.title, newTask.dueDate, newTask.project);
    }, 100);
  };

  // コメント入力の状態を更新
  const handleCommentChange = (taskId, value) => {
    setCommentInputs(prev => ({
      ...prev,
      [taskId]: value
    }));
  };

  // コメントを追加
  const addComment = (taskId) => {
    // refから現在の値を取得（この関数は直接使用されなくなるが互換性のために残す）
    const commentText = commentInputs[taskId] || '';
    
    if (commentText && commentText.trim()) {
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? {
                ...task,
                comments: [
                  ...task.comments,
                  {
                    id: Date.now(),
                    text: commentText,
                    createdAt: new Date().toISOString(),
                  },
                ],
              }
            : task
        )
      );
      
      // コメント入力欄をクリア
      setCommentInputs(prev => ({
        ...prev,
        [taskId]: ''
      }));
    }
  };

  // コメントを削除
  const deleteComment = (taskId, commentId) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              comments: task.comments.filter(comment => comment.id !== commentId),
            }
          : task
      )
    );
  };

  // タスクの状態を更新
  const updateTaskStatus = (id, newStatus) => {
    setTasks(
      tasks.map(task =>
        task.id === id ? { ...task, status: newStatus } : task
      )
    );
  };

  // タスクを削除
  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  // タスク編集モードの開始
  const startEditing = (id, title, dueDate, project) => {
    setEditingId(id);
    setEditText(title);
    setEditDueDate(dueDate || '');
    setEditProject(project || '');
    // 次のレンダリング後にフォーカスを設定
    setTimeout(() => {
      if (editTextRef.current) {
        editTextRef.current.focus();
      }
    }, 10);
  };

  // タスクの編集を保存
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

  // 編集締め切り日の更新
  const handleEditDueDateChange = (e) => {
    setEditDueDate(e.target.value);
  };

  // ドラッグ開始ハンドラー
  const handleDragStart = (taskId, e) => {
    setDraggedTask(taskId);
    
    // ドラッグ中のプレビュー画像を設定
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      // ドラッグイメージを設定（ゴーストイメージ）
      try {
        const dragImg = document.createElement('div');
        dragImg.style.width = '5px';
        dragImg.style.height = '5px';
        dragImg.style.backgroundColor = 'transparent';
        document.body.appendChild(dragImg);
        e.dataTransfer.setDragImage(dragImg, 0, 0);
        setTimeout(() => {
          document.body.removeChild(dragImg);
        }, 0);
      } catch (err) {
        console.error("Failed to set drag image", err);
      }
    }
  };

  // ドラッグ終了ハンドラー
  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  // ドロップハンドラー
  const handleDrop = (status) => {
    if (draggedTask !== null) {
      updateTaskStatus(draggedTask, status);
    }
  };

  // ドラッグオーバーハンドラー
  const handleDragOver = (e) => {
    e.preventDefault();
    // カーソルを変更してドロップ可能を示す
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  // フィルター機能の実装
  const getFilteredTasks = (status) => {
    console.log('Filtering tasks for status:', status);
    console.log('Current tasks:', JSON.stringify(tasks, null, 2));
    const filteredTasks = tasks.filter(task => {
      const statusMatch = task.status === status;
      
      if (!statusMatch) return false;
      
      // プロジェクトフィルター
      if (projectFilter !== 'all' && task.project !== projectFilter) {
        return false;
      }
      
      if (filter === 'all') return true;
      
      if (filter === 'due-soon') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (!task.dueDate) return false;
        
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        const timeDiff = dueDate.getTime() - today.getTime();
        const daysDiff = timeDiff / (1000 * 3600 * 24);
        
        return daysDiff >= 0 && daysDiff <= 3;
      }
      
      if (filter === 'overdue') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (!task.dueDate) return false;
        
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        return dueDate < today;
      }
      
      return true;
    });
    console.log('Filtered tasks:', filteredTasks);
    return filteredTasks;
  };

  // カンバンカラムコンポーネント
  const KanbanColumn = ({ title, status, tasks }) => {
    // プロジェクトごとにタスクをグループ化
    const groupedTasks = {};
    const noProjectTasks = [];
    
    tasks.forEach(task => {
      if (task.project) {
        if (!groupedTasks[task.project]) {
          groupedTasks[task.project] = [];
        }
        groupedTasks[task.project].push(task);
      } else {
        noProjectTasks.push(task);
      }
    });
    
    const hasNoTasks = Object.keys(groupedTasks).length === 0 && noProjectTasks.length === 0;
    
    return (
      <div 
        className="flex-1 p-3 bg-gray-100 rounded-lg overflow-y-auto column-transition"
        onDrop={() => handleDrop(status)}
        onDragOver={handleDragOver}
        style={{ minHeight: '300px' }}
      >
        <div className="flex justify-between items-center mb-3 sticky top-0 bg-gray-100 py-2">
          <h2 className="text-lg font-bold">{title}</h2>
          {status !== TASK_STATUS.DONE && (
            <button 
              className="bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
              onClick={() => addEmptyTask(status)}
              title={`${title}に新しいタスクを追加`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
        
        <div className="space-y-4">
          {/* プロジェクトでグループ化されたタスク */}
          {Object.keys(groupedTasks).sort().map(projectName => (
            <div key={projectName} className="mb-3">
              <div 
                className="text-sm font-medium p-1 rounded mb-2"
                style={{ backgroundColor: getProjectColor(projectName) }}
              >
                {projectName}
              </div>
              <div className="space-y-2 pl-1">
                {groupedTasks[projectName].map(task => (
                  <div 
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(task.id, e)}
                    onDragEnd={handleDragEnd}
                    style={{ borderLeft: `4px solid ${getProjectColor(projectName)}` }}
                    className="bg-white p-3 rounded-lg shadow-lg cursor-move task-card hover:shadow-xl transition-shadow duration-200"
                  >
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
                            保存
                          </button>
                        </div>
                        <div className="flex mb-2">
                          <label className="text-sm text-gray-600 mr-2 w-20">締め切り：</label>
                          <input
                            type="date"
                            className="flex-grow p-1 border rounded"
                            value={editDueDate}
                            onChange={handleEditDueDateChange}
                          />
                        </div>
                        <div className="flex">
                          <label className="text-sm text-gray-600 mr-2 w-20">プロジェクト：</label>
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
                          <span
                            className={`${task.status === TASK_STATUS.DONE ? 'line-through text-gray-400' : ''}`}
                            onDoubleClick={() => startEditing(task.id, task.title, task.dueDate, task.project)}
                          >
                            {task.title}
                          </span>
                          <div className="flex flex-nowrap items-center gap-2 mt-1">
                            {task.dueDate && (
                              <span className={`text-xs ${getDueDateClassName(task.dueDate, task.status === TASK_STATUS.DONE)}`}>
                                期限: {formatDate(task.dueDate)}
                              </span>
                            )}
                            {task.subtasks && task.subtasks.length > 0 && (
                              <span className="text-xs bg-gray-200 px-1 rounded">
                                サブタスク: {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <button
                            className="text-sm text-blue-500 hover:text-blue-700"
                            onClick={() => startEditing(task.id, task.title, task.dueDate, task.project)}
                          >
                            編集
                          </button>
                          <button
                            className="text-sm text-green-500 hover:text-green-700"
                            onClick={() => setSelectedTask(task)}
                          >
                            詳細
                          </button>
                          <button
                            className="text-sm text-red-500 hover:text-red-700"
                            onClick={() => deleteTask(task.id)}
                          >
                            削除
                          </button>
                          {task.dueDate && (
                            <button
                              className="text-xs text-purple-500 hover:text-purple-700 flex items-center px-2 py-1 rounded border border-purple-200 hover:bg-purple-50"
                              onClick={() => generateICSFile(task)}
                              title="Outlookカレンダーに追加"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>予定追加</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {/* プロジェクトなしのタスク */}
          {noProjectTasks.length > 0 && (
            <div className="space-y-2">
              {noProjectTasks.map(task => (
                <div 
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(task.id, e)}
                  onDragEnd={handleDragEnd}
                  className="bg-white p-3 rounded-lg shadow-lg cursor-move task-card hover:shadow-xl transition-shadow duration-200"
                >
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
                          保存
                        </button>
                      </div>
                      <div className="flex mb-2">
                        <label className="text-sm text-gray-600 mr-2 w-20">締め切り：</label>
                        <input
                          type="date"
                          className="flex-grow p-1 border rounded"
                          value={editDueDate}
                          onChange={handleEditDueDateChange}
                        />
                      </div>
                      <div className="flex">
                        <label className="text-sm text-gray-600 mr-2 w-20">プロジェクト：</label>
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
                        <span
                          className={`${task.status === TASK_STATUS.DONE ? 'line-through text-gray-400' : ''}`}
                          onDoubleClick={() => startEditing(task.id, task.title, task.dueDate, task.project)}
                        >
                          {task.title}
                        </span>
                        <div className="flex flex-nowrap items-center gap-2 mt-1">
                          {task.dueDate && (
                            <span className={`text-xs ${getDueDateClassName(task.dueDate, task.status === TASK_STATUS.DONE)}`}>
                              期限: {formatDate(task.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <button
                          className="text-sm text-blue-500 hover:text-blue-700"
                          onClick={() => startEditing(task.id, task.title, task.dueDate, task.project)}
                        >
                          編集
                        </button>
                        <button
                          className="text-sm text-green-500 hover:text-green-700"
                          onClick={() => setSelectedTask(task)}
                        >
                          詳細
                        </button>
                        <button
                          className="text-sm text-red-500 hover:text-red-700"
                          onClick={() => deleteTask(task.id)}
                        >
                          削除
                        </button>
                        {task.dueDate && (
                          <button
                            className="text-xs text-purple-500 hover:text-purple-700 flex items-center px-2 py-1 rounded border border-purple-200 hover:bg-purple-50"
                            onClick={() => generateICSFile(task)}
                            title="Outlookカレンダーに追加"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>予定追加</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* タスクがない場合のメッセージ */}
          {hasNoTasks && (
            <p className="text-center text-gray-500 p-4">タスクがありません</p>
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

  // すべてのタスクをカレンダーに追加する
  const exportAllTasksToCalendar = () => {
    // 締め切りがあるタスクだけをフィルター
    const tasksWithDueDate = tasks.filter(task => task.dueDate);
    
    if (tasksWithDueDate.length === 0) {
      alert('締め切り日が設定されているタスクがありません。');
      return;
    }
    
    // 現在の日時を取得 (UTC形式)
    const now = new Date();
    const timeStamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/g, '');
    
    // .ics ファイルの内容を生成
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Kanban Task App//JP',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];
    
    // 各タスクをVEVENTとして追加
    tasksWithDueDate.forEach(task => {
      // 締め切り日を処理
      const dueDate = new Date(task.dueDate);
      // 終日予定の場合、日付だけを取得して"YYYYMMDD"形式にする
      const dueDateFormatted = dueDate.toISOString().split('T')[0].replace(/-/g, '');
      
      // 終了日は開始日の翌日（Outlookの終日予定の仕様に合わせる）
      const endDate = new Date(dueDate);
      endDate.setDate(endDate.getDate() + 1);
      const endDateFormatted = endDate.toISOString().split('T')[0].replace(/-/g, '');
      
      // ユニークIDの生成
      const uid = `${timeStamp}-${task.id}@kanban-task-app`;
      
      // タイトルの整形
      const title = task.title.replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
      const projectInfo = task.project ? `[${task.project}] ` : '';
      
      // VEVENTを追加
      icsContent = [
        ...icsContent,
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${timeStamp.substring(0, 8)}T${timeStamp.substring(8, 14)}Z`,
        `DTSTART;VALUE=DATE:${dueDateFormatted}`,
        `DTEND;VALUE=DATE:${endDateFormatted}`,
        `SUMMARY:${projectInfo}${title}`,
        'TRANSP:TRANSPARENT',
        `DESCRIPTION:Kanban Task App からエクスポートされたタスク\\n\\n状態: ${
          task.status === 'todo' ? '未着手' : task.status === 'in-progress' ? '進行中' : '完了'
        }`,
        'CLASS:PUBLIC',
        'STATUS:CONFIRMED',
        'END:VEVENT'
      ];
    });
    
    // カレンダーを終了
    icsContent.push('END:VCALENDAR');
    
    // ファイルをダウンロード
    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // ファイル名に日付を含める
    const fileName = `KanbanTasks_${now.toISOString().split('T')[0]}.ics`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // サブタスクを追加
  const addSubtask = (taskId, subtaskText) => {
    if (subtaskText.trim()) {
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? {
                ...task,
                subtasks: [
                  ...task.subtasks,
                  {
                    id: Date.now(),
                    text: subtaskText,
                    completed: false,
                    createdAt: new Date().toISOString(),
                  },
                ],
              }
            : task
        )
      );
    }
  };

  // サブタスクの状態を更新（完了/未完了）
  const toggleSubtaskCompletion = (taskId, subtaskId) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map(subtask =>
                subtask.id === subtaskId
                  ? { ...subtask, completed: !subtask.completed }
                  : subtask
              ),
            }
          : task
      )
    );
  };

  // サブタスクを削除
  const deleteSubtask = (taskId, subtaskId) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.filter(subtask => subtask.id !== subtaskId),
            }
          : task
      )
    );
  };

  // 詳細モーダルコンポーネント
  const TaskDetailModal = ({ task, onClose, onAddComment, onDeleteComment }) => {
    // コメント入力用のrefを作成
    const commentInputRef = React.useRef(null);
    // サブタスク入力用のrefを作成
    const subtaskInputRef = React.useRef(null);
    
    // フックは条件付きで呼び出さないようにする
    React.useEffect(() => {
      if (task && commentInputRef.current) {
        // 初期値を設定
        commentInputRef.current.value = commentInputs[task.id] || '';
      }
    }, [task, commentInputs]);
    
    if (!task) return null;

    const handleSubmit = (e) => {
      e.preventDefault();
      if (commentInputRef.current) {
        const commentText = commentInputRef.current.value;
        if (commentText && commentText.trim()) {
          onAddComment(task.id);
          // フォームをリセット
          commentInputRef.current.value = '';
        }
      }
    };

    const handleSubtaskSubmit = (e) => {
      e.preventDefault();
      if (subtaskInputRef.current) {
        const subtaskText = subtaskInputRef.current.value;
        if (subtaskText && subtaskText.trim()) {
          addSubtask(task.id, subtaskText);
          // 入力欄をクリア
          subtaskInputRef.current.value = '';
        }
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold">{task.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-700">プロジェクト</h3>
              <p className="text-gray-600">{task.project || '未設定'}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700">締め切り</h3>
              <p className={`text-gray-600 ${getDueDateClassName(task.dueDate, task.status === TASK_STATUS.DONE)}`}>
                {task.dueDate ? formatDate(task.dueDate) : '未設定'}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700">状態</h3>
              <p className="text-gray-600">
                {task.status === TASK_STATUS.TODO ? '未着手' :
                 task.status === TASK_STATUS.IN_PROGRESS ? '進行中' : '完了'}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700">作成日</h3>
              <p className="text-gray-600">{formatDate(task.createdAt)}</p>
            </div>

            {/* サブタスク セクション */}
            <div>
              <h3 className="font-semibold text-gray-700">サブタスク</h3>
              <div className="space-y-2 mt-2">
                {task.subtasks && task.subtasks.length > 0 ? (
                  task.subtasks.map(subtask => (
                    <div key={subtask.id} className="flex items-center justify-between py-1 border-b">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={subtask.completed}
                          onChange={() => toggleSubtaskCompletion(task.id, subtask.id)}
                          className="mr-2"
                        />
                        <span className={subtask.completed ? 'line-through text-gray-400' : ''}>
                          {subtask.text}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteSubtask(task.id, subtask.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">サブタスクはありません</p>
                )}
              </div>
              <form onSubmit={handleSubtaskSubmit} className="mt-2 flex items-center">
                <input
                  type="text"
                  ref={subtaskInputRef}
                  placeholder="新しいサブタスクを入力..."
                  className="flex-grow p-2 border rounded-l"
                />
                <button
                  type="submit"
                  className="bg-green-500 text-white p-2 rounded-r"
                >
                  追加
                </button>
              </form>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700">コメント</h3>
              <div className="space-y-2">
                {task.comments.map(comment => (
                  <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-start">
                      <p className="text-gray-700">{comment.text}</p>
                      <button
                        onClick={() => onDeleteComment(task.id, comment.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(comment.createdAt)}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSubmit} className="mt-4">
                <textarea
                  ref={commentInputRef}
                  placeholder="コメントを入力..."
                  className="w-full p-2 border rounded-lg"
                  rows="3"
                />
                <button
                  type="submit"
                  className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  コメントを追加
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-screen min-h-screen p-4 bg-white rounded-lg shadow-lg max-w-none">
      <style>{customStyles}</style>
      <h1 className="text-2xl font-bold text-center mb-4">カンバン式タスク管理 v1.0.1</h1>
      
      {/* 新しいタスク入力フォーム */}
      <div className="mb-4">
        <div className="flex mb-2">
          <input
            type="text"
            className="flex-grow p-2 border rounded-l"
            placeholder="新しいタスクを入力..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{ imeMode: 'active' }}
          />
          <button
            className="bg-blue-500 text-white p-2 rounded-r"
            onClick={addTask}
          >
            追加
          </button>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">締め切り日：</label>
            <input
              type="date"
              className="w-full p-2 border rounded"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">プロジェクト：</label>
            <div className="flex">
              <input
                type="text"
                className="flex-grow p-2 border rounded-l"
                placeholder="プロジェクト名..."
                list="project-list"
                value={newTaskProject}
                onChange={(e) => setNewTaskProject(e.target.value)}
                style={{ imeMode: 'active' }}
              />
              <button
                className="bg-gray-200 p-2 rounded-r text-gray-700"
                onClick={() => setNewTaskProject('')}
              >
                クリア
              </button>
            </div>
            <datalist id="project-list">
              {getProjects().map(project => (
                <option key={project} value={project} />
              ))}
            </datalist>
          </div>
        </div>
      </div>
      
      {/* フィルターとカレンダーエクスポートボタン */}
      <div className="mb-4">
        <div className="flex flex-wrap justify-between mb-2">
          <div className="flex flex-wrap">
            <button
              className={`m-1 px-3 py-1 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setFilter('all')}
            >
              すべて
            </button>
            <button
              className={`m-1 px-3 py-1 rounded ${filter === 'due-soon' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setFilter('due-soon')}
            >
              期限間近
            </button>
            <button
              className={`m-1 px-3 py-1 rounded ${filter === 'overdue' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setFilter('overdue')}
            >
              期限切れ
            </button>
          </div>
          <button
            className="m-1 px-3 py-1 rounded bg-purple-500 text-white flex items-center hover:bg-purple-600 transition-colors"
            onClick={exportAllTasksToCalendar}
            title="すべてのタスクをカレンダーに追加"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            カレンダー出力
          </button>
        </div>
        
        {/* プロジェクトフィルター */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              className={`px-3 py-1 text-sm rounded-l ${projectFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setProjectFilter('all')}
            >
              全プロジェクト
            </button>
            {getProjects().map(project => (
              <button
                key={project}
                className={`px-3 py-1 text-sm ${projectFilter === project ? 'text-white' : 'text-gray-700'}`}
                style={{ 
                  backgroundColor: projectFilter === project ? getProjectColor(project) : getProjectColor(project)
                }}
                onClick={() => setProjectFilter(project)}
              >
                {project}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* カンバンボード */}
      <div className="min-w-[500px] w-full flex flex-row justify-evenly overflow-x-auto pb-4 h-[calc(100vh-200px)]"
      style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', width: '100%',minwidth: '350px'}}>
        <KanbanColumn 
          title="未着手" 
          status={TASK_STATUS.TODO}
          tasks={getFilteredTasks(TASK_STATUS.TODO)} 
        />
        <KanbanColumn 
          title="進行中" 
          status={TASK_STATUS.IN_PROGRESS}
          tasks={getFilteredTasks(TASK_STATUS.IN_PROGRESS)} 
        />
        <KanbanColumn 
          title="完了" 
          status={TASK_STATUS.DONE}
          tasks={getFilteredTasks(TASK_STATUS.DONE)} 
        />
      </div>

      {/* 操作ガイド */}
      <div className="mt-4 bg-blue-50 p-3 rounded text-sm text-blue-700">
        <p>使い方: タスクカードを横方向にドラッグ＆ドロップして状態を変更できます。カードをつかんで左右に移動してみましょう。</p>
        <p className="mt-1">カレンダー連携: 各タスクの「予定追加」ボタンをクリックすると.icsファイルがダウンロードされ、Outlookなどのカレンダーに予定として追加できます。</p>
      </div>
      
      {/* フッター情報 */}
      <div className="mt-4 text-center text-sm text-gray-500">
        {(() => {
          const stats = getTaskStats();
          return (
            <p>
              タスク数: {stats.total}個 
              (未着手: {stats.todo}、
              進行中: {stats.inProgress}、
              完了: {stats.done})
            </p>
          );
        })()}
      </div>

      {/* タスク詳細モーダル */}
      <TaskDetailModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onAddComment={addComment}
        onDeleteComment={deleteComment}
      />
    </div>
  );
};

export default TaskManagementApp;
