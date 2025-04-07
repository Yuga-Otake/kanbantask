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
    if (newTaskTitle.trim() === '') return;
    
    const newTask = {
      id: Date.now(),
      title: newTaskTitle,
      status: TASK_STATUS.TODO,
      dueDate: newTaskDueDate || null,
      project: newTaskProject,
      createdAt: new Date().toISOString(),
      comments: [],
      subtasks: [],
    };
    
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    
    // タスク追加後にフォーカスを新しいタスク入力に戻す
    if (taskInputRef.current) {
      taskInputRef.current.focus();
    }
  };

  const handleKeyPress = (e) => {
    // Shift + Enter の場合は改行して終了
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
    // refから現在の値を取得
    const commentInput = document.querySelector(`textarea[placeholder="コメントを入力..."]`);
    const commentText = commentInput ? commentInput.value : commentInputs[taskId] || '';
    
    if (commentText && commentText.trim()) {
      // 新しいコメントオブジェクトを作成
      const newComment = {
        id: Date.now(),
        text: commentText,
        createdAt: new Date().toISOString(),
      };
      
      // タスクの状態を更新
      const updatedTasks = tasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              comments: [...task.comments, newComment],
            }
          : task
      );
      
      // タスク状態を更新
      setTasks(updatedTasks);
      
      // 選択中のタスクも更新して表示を反映
      const updatedTask = updatedTasks.find(task => task.id === taskId);
      if (updatedTask && selectedTask && selectedTask.id === taskId) {
        setSelectedTask(updatedTask);
      }
      
      // コメント入力欄をクリア
      setCommentInputs(prev => ({
        ...prev,
        [taskId]: ''
      }));
      
      // 直接DOMを操作してコメント入力欄をクリアしてフォーカスを維持
      if (commentInput) {
        commentInput.value = '';
        // フォーカスを維持
        setTimeout(() => {
          commentInput.focus();
        }, 10);
      }
    }
  };

  // コメントを削除
  const deleteComment = (taskId, commentId) => {
    // タスクの状態を更新
    const updatedTasks = tasks.map(task =>
      task.id === taskId
        ? {
            ...task,
            comments: task.comments.filter(comment => comment.id !== commentId),
          }
        : task
    );
    
    // タスク状態を更新
    setTasks(updatedTasks);
    
    // 選択中のタスクも更新して表示を反映
    const updatedTask = updatedTasks.find(task => task.id === taskId);
    if (updatedTask && selectedTask && selectedTask.id === taskId) {
      setSelectedTask(updatedTask);
    }
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
    let result = tasks.filter(task => {
      // ステータスフィルター
      if (task.status !== status) {
        // サブタスクの状態に基づいて表示するかどうかを判断
        if (task.subtasks && task.subtasks.some(subtask => subtask.status === status)) {
          return true; // サブタスクに指定ステータスがあれば表示
        }
        return false;
      }
      return true;
    });

    // プロジェクトフィルター
    if (projectFilter !== 'all') {
      result = result.filter(task => task.project === projectFilter);
    }

    // 他のフィルター条件
    if (filter === 'due-soon') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const threeDaysLater = new Date(today);
      threeDaysLater.setDate(today.getDate() + 3);
      
      result = result.filter(task => {
        if (!task.dueDate) return false;
        
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        return dueDate >= today && dueDate <= threeDaysLater;
      });
    } else if (filter === 'overdue') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      result = result.filter(task => {
        if (!task.dueDate) return false;
        
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        return dueDate < today;
      });
    }
    
    return result;
  };

  // サブタスクを日時の昇順で並べ替える
  const sortSubtasksByDueDate = (subtasks) => {
    if (!subtasks || subtasks.length === 0) return [];
    
    return [...subtasks].sort((a, b) => {
      // 期限が設定されていない場合は後ろに配置
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      
      // 日付を比較
      const dateA = new Date(a.dueDate);
      const dateB = new Date(b.dueDate);
      return dateA - dateB;
    });
  };

  // サブタスクをフィルタリングする関数を修正 - 日時順にソートを追加
  const getFilteredSubtasks = (task, status) => {
    if (!task.subtasks || task.subtasks.length === 0) return [];
    const filteredSubtasks = task.subtasks.filter(subtask => subtask.status === status);
    // 日時の昇順で並べ替え
    return sortSubtasksByDueDate(filteredSubtasks);
  };

  // タスクの並び替え機能
  const reorderTasks = (status, startIndex, endIndex) => {
    // 同じステータスのタスクのみを抽出
    const statusTasks = tasks.filter(task => task.status === status);
    
    // 移動するタスクを特定
    const taskToMove = statusTasks[startIndex];
    
    // 新しい配列を作成（移動元を削除）
    const newStatusTasks = statusTasks.filter((_, index) => index !== startIndex);
    
    // 移動先に挿入
    newStatusTasks.splice(endIndex, 0, taskToMove);
    
    // 他のステータスのタスクと結合して更新
    const otherTasks = tasks.filter(task => task.status !== status);
    setTasks([...otherTasks, ...newStatusTasks]);
  };

  // カンバンカラムコンポーネント
  const KanbanColumn = ({ title, status, tasks }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [dragOverTaskId, setDragOverTaskId] = useState(null);
    
    // ドロップエリアのイベントハンドラ
    const handleDragOver = (e) => {
      e.preventDefault();
      setIsDragOver(true);
    };
    
    const handleDragLeave = () => {
      setIsDragOver(false);
    };
    
    const handleDrop = (e) => {
      e.preventDefault();
      setIsDragOver(false);
      
      if (draggedTask !== null) {
        // ドロップ先のステータスに更新
        updateTaskStatus(draggedTask, status);
      }
      
      // ドラッグ状態をリセット
      setDraggedTask(null);
      setDragOverTaskId(null);
    };
    
    // タスクをプロジェクト別にグループ化
    const groupTasksByProject = () => {
      const grouped = {};
      
      tasks.forEach(task => {
        const projectName = task.project || 'No Project';
        if (!grouped[projectName]) {
          grouped[projectName] = [];
        }
        grouped[projectName].push(task);
      });
      
      return grouped;
    };
    
    const groupedTasks = groupTasksByProject();
    const hasNoTasks = Object.keys(groupedTasks).length === 0;
    const noProjectTasks = groupedTasks['No Project'] || [];
    delete groupedTasks['No Project']; // 「プロジェクトなし」を別に表示するため削除
    
    // ドロップ領域のスタイルを動的に設定
    const dropAreaClasses = `p-2 rounded-lg shadow-inner bg-opacity-50 min-h-[200px] column-transition ${
      isDragOver 
      ? 'bg-blue-100 border-2 border-dashed border-blue-300' 
      : 'bg-gray-100'
    }`;

    // タスクカードのドラッグオーバースタイル
    const getTaskCardClasses = (taskId) => {
      return `bg-white p-3 rounded-lg shadow-lg cursor-move task-card hover:shadow-xl transition-shadow duration-200 ${
        dragOverTaskId === taskId ? 'border-2 border-blue-500 transform translate-y-1' : ''
      }`;
    };

    // タスクのドラッグイベントハンドラ
    const handleTaskDragOver = (e, taskId) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverTaskId(taskId);
    };

    const handleTaskDragLeave = () => {
      setDragOverTaskId(null);
    };

    const handleTaskDrop = (e, taskId) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (draggedTask && draggedTask !== taskId) {
        const statusTasks = tasks.filter(t => t.status === status);
        const draggedIndex = statusTasks.findIndex(t => t.id === draggedTask);
        const dropIndex = statusTasks.findIndex(t => t.id === taskId);
        
        if (draggedIndex !== -1 && dropIndex !== -1) {
          reorderTasks(status, draggedIndex, dropIndex);
        }
      }
      
      setDragOverTaskId(null);
      setDraggedTask(null);
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
                title="空のタスクを追加"
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
          {/* プロジェクト別グループ */}
          {Object.keys(groupedTasks).sort().map(projectName => (
            <div key={projectName} className="mb-3">
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
              <div className="space-y-2">
                {groupedTasks[projectName].map(task => (
                  <div 
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(task.id, e)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleTaskDragOver(e, task.id)}
                    onDragLeave={handleTaskDragLeave}
                    onDrop={(e) => handleTaskDrop(e, task.id)}
                    className={getTaskCardClasses(task.id)}
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
                              <span 
                                className="text-xs bg-gray-200 px-1 rounded cursor-pointer hover:bg-gray-300"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTask(task);
                                }}
                              >
                                サブタスク: {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                                <span className="ml-1 text-blue-500">{task.subtasks.filter(st => st.status === TASK_STATUS.IN_PROGRESS).length > 0 ? '(進行中あり)' : ''}</span>
                              </span>
                            )}
                          </div>
                          
                          {/* サブタスクの追加フォーム */}
                          <div className="mt-2 border-t pt-2">
                            <div className="flex">
                              <input
                                type="text"
                                placeholder="+ サブタスクを追加"
                                className="text-sm w-full py-1 px-2 border rounded"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && e.target.value.trim()) {
                                    const inputValue = e.target.value;
                                    addSubtask(task.id, inputValue);
                                    e.target.value = '';
                                    // フォーカスを確実に維持するために少し遅延させる
                                    setTimeout(() => {
                                      e.target.focus();
                                    }, 10);
                                    e.preventDefault(); // フォームのデフォルト送信を防止
                                  }
                                }}
                              />
                            </div>
                            
                            {/* サブタスクのリスト表示 - 現在のカラムに対応するステータスのサブタスクだけを表示 */}
                            {task.subtasks && getFilteredSubtasks(task, status).length > 0 && (
                              <div className="mt-1 space-y-1">
                                {getFilteredSubtasks(task, status).map(subtask => (
                                  <div key={subtask.id} className="flex items-center text-sm">
                                    <div className="flex items-center mr-2">
                                      <button
                                        onClick={() => promoteSubtask(task.id, subtask.id)}
                                        className="text-gray-500 hover:text-gray-700 mr-1"
                                        title="レベル上げ"
                                        disabled={(subtask.level || 0) === 0}
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => demoteSubtask(task.id, subtask.id)}
                                        className="text-gray-500 hover:text-gray-700"
                                        title="レベル下げ"
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
                                        <option value={TASK_STATUS.TODO}>未着手</option>
                                        <option value={TASK_STATUS.IN_PROGRESS}>進行中</option>
                                        <option value={TASK_STATUS.DONE}>完了</option>
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
                                        title="削除"
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
                  onDragOver={(e) => handleTaskDragOver(e, task.id)}
                  onDragLeave={handleTaskDragLeave}
                  onDrop={(e) => handleTaskDrop(e, task.id)}
                  className={getTaskCardClasses(task.id)}
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
                            <span 
                              className="text-xs bg-gray-200 px-1 rounded cursor-pointer hover:bg-gray-300"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTask(task);
                              }}
                            >
                              サブタスク: {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                              <span className="ml-1 text-blue-500">{task.subtasks.filter(st => st.status === TASK_STATUS.IN_PROGRESS).length > 0 ? '(進行中あり)' : ''}</span>
                            </span>
                          )}
                        </div>
                        
                        {/* サブタスクの追加フォーム */}
                        <div className="mt-2 border-t pt-2">
                          <div className="flex">
                            <input
                              type="text"
                              placeholder="+ サブタスクを追加"
                              className="text-sm w-full py-1 px-2 border rounded"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && e.target.value.trim()) {
                                  const inputValue = e.target.value;
                                  addSubtask(task.id, inputValue);
                                  e.target.value = '';
                                  // フォーカスを確実に維持するために少し遅延させる
                                  setTimeout(() => {
                                    e.target.focus();
                                  }, 10);
                                  e.preventDefault(); // フォームのデフォルト送信を防止
                                }
                              }}
                            />
                          </div>
                          
                          {/* サブタスクのリスト表示 - 現在のカラムに対応するステータスのサブタスクだけを表示 */}
                          {task.subtasks && getFilteredSubtasks(task, status).length > 0 && (
                            <div className="mt-1 space-y-1">
                              {getFilteredSubtasks(task, status).map(subtask => (
                                <div key={subtask.id} className="flex items-center text-sm">
                                  <div className="flex items-center mr-2">
                                    <button
                                      onClick={() => promoteSubtask(task.id, subtask.id)}
                                      className="text-gray-500 hover:text-gray-700 mr-1"
                                      title="レベル上げ"
                                      disabled={(subtask.level || 0) === 0}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => demoteSubtask(task.id, subtask.id)}
                                      className="text-gray-500 hover:text-gray-700"
                                      title="レベル下げ"
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
                    status: TASK_STATUS.TODO, // 明示的にステータスを追加
                    createdAt: new Date().toISOString(),
                    dueDate: null,
                    level: 0, // デフォルトのレベルは0（最上位）
                  },
                ],
              }
            : task
        )
      );
    }
  };
  
  // サブタスクのレベルを上げる（インデントを減らす）
  const promoteSubtask = (taskId, subtaskId) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map(subtask =>
                subtask.id === subtaskId
                  ? { ...subtask, level: Math.max(0, (subtask.level || 0) - 1) }
                  : subtask
              ),
            }
          : task
      )
    );
  };
  
  // サブタスクのレベルを下げる（インデントを増やす）
  const demoteSubtask = (taskId, subtaskId) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map(subtask =>
                subtask.id === subtaskId
                  ? { ...subtask, level: (subtask.level || 0) + 1 }
                  : subtask
              ),
            }
          : task
      )
    );
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
                  ? { 
                      ...subtask, 
                      completed: !subtask.completed,
                      status: !subtask.completed ? TASK_STATUS.DONE : TASK_STATUS.TODO
                    }
                  : subtask
              ),
            }
          : task
      )
    );
  };

  // サブタスクのステータスを更新
  const updateSubtaskStatus = (taskId, subtaskId, newStatus) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map(subtask =>
                subtask.id === subtaskId
                  ? { 
                      ...subtask, 
                      status: newStatus,
                      completed: newStatus === TASK_STATUS.DONE // 完了ステータスの場合はcompletedをtrueに
                    }
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

  // サブタスクの期限日を設定
  const setSubtaskDueDate = (taskId, subtaskId, dueDate) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map(subtask =>
                subtask.id === subtaskId
                  ? { ...subtask, dueDate }
                  : subtask
              ),
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
    
    // 現在のタスク情報を取得するための状態変数
    const [currentTask, setCurrentTask] = useState(task);
    
    // タスクが変更された場合に更新
    useEffect(() => {
      if (task) {
        // tasksステート配列から最新のタスク情報を取得
        const updatedTask = tasks.find(t => t.id === task.id);
        if (updatedTask) {
          setCurrentTask(updatedTask);
        }
      }
    }, [task, tasks]);
    
    // フックは条件付きで呼び出さないようにする
    React.useEffect(() => {
      if (currentTask && commentInputRef.current) {
        // 初期値を設定
        commentInputRef.current.value = commentInputs[currentTask.id] || '';
      }
    }, [currentTask, commentInputs]);
    
    if (!currentTask) return null;

    const handleSubmit = (e) => {
      e.preventDefault();
      if (commentInputRef.current) {
        const commentText = commentInputRef.current.value;
        if (commentText && commentText.trim()) {
          // コメントを追加
          onAddComment(currentTask.id);
          
          // フォームをリセット
          commentInputRef.current.value = '';
          
          // フォーカスを維持
          setTimeout(() => {
            if (commentInputRef.current) {
              commentInputRef.current.focus();
            }
          }, 10);
        }
      }
    };

    const handleSubtaskSubmit = (e) => {
      e.preventDefault();
      if (subtaskInputRef.current) {
        const subtaskText = subtaskInputRef.current.value;
        if (subtaskText && subtaskText.trim()) {
          addSubtask(currentTask.id, subtaskText);
          // 入力欄をクリア
          subtaskInputRef.current.value = '';
          // フォーカスを維持
          setTimeout(() => {
            if (subtaskInputRef.current) {
              subtaskInputRef.current.focus();
            }
          }, 10);
        }
      }
    };

    // サブタスクをステータスごとにグループ化
    const groupedSubtasks = {
      [TASK_STATUS.TODO]: currentTask.subtasks?.filter(st => st.status === TASK_STATUS.TODO || !st.status) || [],
      [TASK_STATUS.IN_PROGRESS]: currentTask.subtasks?.filter(st => st.status === TASK_STATUS.IN_PROGRESS) || [],
      [TASK_STATUS.DONE]: currentTask.subtasks?.filter(st => st.status === TASK_STATUS.DONE) || []
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold">{currentTask.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">プロジェクト</h3>
              <p className="text-gray-600 bg-gray-50 p-2 rounded">{currentTask.project || '未設定'}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-1">締め切り</h3>
              <p className={`text-gray-600 bg-gray-50 p-2 rounded ${getDueDateClassName(currentTask.dueDate, currentTask.status === TASK_STATUS.DONE)}`}>
                {currentTask.dueDate ? formatDate(currentTask.dueDate) : '未設定'}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-1">状態</h3>
              <p className={`p-2 rounded font-medium ${
                currentTask.status === TASK_STATUS.TODO 
                  ? 'bg-gray-100 text-gray-600' 
                  : currentTask.status === TASK_STATUS.IN_PROGRESS 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-green-100 text-green-600'
              }`}>
                {currentTask.status === TASK_STATUS.TODO ? '未着手' :
                 currentTask.status === TASK_STATUS.IN_PROGRESS ? '進行中' : '完了'}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-1">作成日</h3>
              <p className="text-gray-600 bg-gray-50 p-2 rounded">{formatDate(currentTask.createdAt)}</p>
            </div>
          </div>

          {/* サブタスク セクション */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-700">サブタスク</h3>
              <div className="text-sm text-gray-500">
                完了: {currentTask.subtasks?.filter(st => st.completed).length || 0}/{currentTask.subtasks?.length || 0}
              </div>
            </div>

            {/* サブタスク追加フォーム */}
            <form onSubmit={handleSubtaskSubmit} className="mb-4">
              <div className="flex">
                <input
                  type="text"
                  ref={subtaskInputRef}
                  placeholder="新しいサブタスクを入力..."
                  className="flex-grow p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <button
                  type="submit"
                  className="bg-blue-500 text-white p-2 rounded-r hover:bg-blue-600 transition-colors"
                >
                  追加
                </button>
              </div>
            </form>

            {/* サブタスク一覧 - ステータス別に表示 */}
            {currentTask.subtasks && currentTask.subtasks.length > 0 ? (
              <div className="space-y-4">
                {/* 未着手のサブタスク */}
                {groupedSubtasks[TASK_STATUS.TODO].length > 0 && (
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <div className="bg-gray-100 py-2 px-3 font-medium">
                      未着手 ({groupedSubtasks[TASK_STATUS.TODO].length})
                    </div>
                    <div className="divide-y divide-gray-200">
                      {groupedSubtasks[TASK_STATUS.TODO].map(subtask => (
                        <div key={subtask.id} className="flex items-center justify-between py-2 px-3 hover:bg-gray-50">
                          <div className="flex items-center flex-grow">
                            <div className="flex items-center mr-2">
                              <button
                                onClick={() => promoteSubtask(currentTask.id, subtask.id)}
                                className="text-gray-500 hover:text-gray-700 mr-1"
                                title="レベル上げ"
                                disabled={(subtask.level || 0) === 0}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => demoteSubtask(currentTask.id, subtask.id)}
                                className="text-gray-500 hover:text-gray-700"
                                title="レベル下げ"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                            </div>
                            <input
                              type="checkbox"
                              checked={subtask.completed}
                              onChange={() => toggleSubtaskCompletion(currentTask.id, subtask.id)}
                              className="mr-2"
                            />
                            <span className={`flex-1 ${subtask.completed ? 'line-through text-gray-400' : ''}`} 
                              style={{ marginLeft: `${(subtask.level || 0) * 20}px` }}>
                              {subtask.text}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <select
                              className="text-xs p-1 border rounded mr-2"
                              value={subtask.status || TASK_STATUS.TODO}
                              onChange={(e) => updateSubtaskStatus(currentTask.id, subtask.id, e.target.value)}
                            >
                              <option value={TASK_STATUS.TODO}>未着手</option>
                              <option value={TASK_STATUS.IN_PROGRESS}>進行中</option>
                              <option value={TASK_STATUS.DONE}>完了</option>
                            </select>
                            <input
                              type="date"
                              className="text-xs p-1 border rounded mr-2"
                              value={subtask.dueDate || ''}
                              onChange={(e) => setSubtaskDueDate(currentTask.id, subtask.id, e.target.value)}
                            />
                            <button
                              onClick={() => deleteSubtask(currentTask.id, subtask.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 進行中のサブタスク */}
                {groupedSubtasks[TASK_STATUS.IN_PROGRESS].length > 0 && (
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <div className="bg-blue-100 py-2 px-3 font-medium text-blue-800">
                      進行中 ({groupedSubtasks[TASK_STATUS.IN_PROGRESS].length})
                    </div>
                    <div className="divide-y divide-gray-200">
                      {groupedSubtasks[TASK_STATUS.IN_PROGRESS].map(subtask => (
                        <div key={subtask.id} className="flex items-center justify-between py-2 px-3 hover:bg-gray-50">
                          <div className="flex items-center flex-grow">
                            <div className="flex items-center mr-2">
                              <button
                                onClick={() => promoteSubtask(currentTask.id, subtask.id)}
                                className="text-gray-500 hover:text-gray-700 mr-1"
                                title="レベル上げ"
                                disabled={(subtask.level || 0) === 0}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => demoteSubtask(currentTask.id, subtask.id)}
                                className="text-gray-500 hover:text-gray-700"
                                title="レベル下げ"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                            </div>
                            <input
                              type="checkbox"
                              checked={subtask.completed}
                              onChange={() => toggleSubtaskCompletion(currentTask.id, subtask.id)}
                              className="mr-2"
                            />
                            <span className={`flex-1 ${subtask.completed ? 'line-through text-gray-400' : ''}`} 
                              style={{ marginLeft: `${(subtask.level || 0) * 20}px` }}>
                              {subtask.text}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <select
                              className="text-xs p-1 border rounded mr-2"
                              value={subtask.status || TASK_STATUS.TODO}
                              onChange={(e) => updateSubtaskStatus(currentTask.id, subtask.id, e.target.value)}
                            >
                              <option value={TASK_STATUS.TODO}>未着手</option>
                              <option value={TASK_STATUS.IN_PROGRESS}>進行中</option>
                              <option value={TASK_STATUS.DONE}>完了</option>
                            </select>
                            <input
                              type="date"
                              className="text-xs p-1 border rounded mr-2"
                              value={subtask.dueDate || ''}
                              onChange={(e) => setSubtaskDueDate(currentTask.id, subtask.id, e.target.value)}
                            />
                            <button
                              onClick={() => deleteSubtask(currentTask.id, subtask.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 完了のサブタスク */}
                {groupedSubtasks[TASK_STATUS.DONE].length > 0 && (
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <div className="bg-green-100 py-2 px-3 font-medium text-green-800">
                      完了 ({groupedSubtasks[TASK_STATUS.DONE].length})
                    </div>
                    <div className="divide-y divide-gray-200">
                      {groupedSubtasks[TASK_STATUS.DONE].map(subtask => (
                        <div key={subtask.id} className="flex items-center justify-between py-2 px-3 hover:bg-gray-50">
                          <div className="flex items-center flex-grow">
                            <div className="flex items-center mr-2">
                              <button
                                onClick={() => promoteSubtask(currentTask.id, subtask.id)}
                                className="text-gray-500 hover:text-gray-700 mr-1"
                                title="レベル上げ"
                                disabled={(subtask.level || 0) === 0}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => demoteSubtask(currentTask.id, subtask.id)}
                                className="text-gray-500 hover:text-gray-700"
                                title="レベル下げ"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                            </div>
                            <input
                              type="checkbox"
                              checked={subtask.completed}
                              onChange={() => toggleSubtaskCompletion(currentTask.id, subtask.id)}
                              className="mr-2"
                            />
                            <span className={`flex-1 ${subtask.completed ? 'line-through text-gray-400' : ''}`} 
                              style={{ marginLeft: `${(subtask.level || 0) * 20}px` }}>
                              {subtask.text}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <select
                              className="text-xs p-1 border rounded mr-2"
                              value={subtask.status || TASK_STATUS.TODO}
                              onChange={(e) => updateSubtaskStatus(currentTask.id, subtask.id, e.target.value)}
                            >
                              <option value={TASK_STATUS.TODO}>未着手</option>
                              <option value={TASK_STATUS.IN_PROGRESS}>進行中</option>
                              <option value={TASK_STATUS.DONE}>完了</option>
                            </select>
                            <input
                              type="date"
                              className="text-xs p-1 border rounded mr-2"
                              value={subtask.dueDate || ''}
                              onChange={(e) => setSubtaskDueDate(currentTask.id, subtask.id, e.target.value)}
                            />
                            <button
                              onClick={() => deleteSubtask(currentTask.id, subtask.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic bg-gray-50 p-3 rounded text-center">サブタスクはありません</p>
            )}
          </div>

          {/* コメントセクション */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">コメント</h3>
            <div className="space-y-2 mb-4">
              {currentTask.comments && currentTask.comments.length > 0 ? (
                currentTask.comments.map(comment => (
                  <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-start">
                      <p className="text-gray-700">{comment.text}</p>
                      <button
                        onClick={() => onDeleteComment(currentTask.id, comment.id)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(comment.createdAt)}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic bg-gray-50 p-3 rounded text-center">コメントはありません</p>
              )}
            </div>
            <form onSubmit={handleSubmit}>
              <textarea
                ref={commentInputRef}
                placeholder="コメントを入力..."
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                rows="3"
              />
              <button
                type="submit"
                className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                コメントを追加
              </button>
            </form>
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
            ref={taskInputRef}
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
