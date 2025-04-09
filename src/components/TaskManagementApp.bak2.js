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
      return parsedTasks.map((task, index) => ({
        ...task,
        order: task.order !== undefined ? task.order : index, // 順序プロパティを追加
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
    
    // 同じステータスの中で最大のorder値を取得
    const sameStatusTasks = tasks.filter(t => t.status === TASK_STATUS.TODO);
    const maxOrder = sameStatusTasks.length > 0 
      ? Math.max(...sameStatusTasks.map(t => t.order || 0)) + 1 
      : 0;
    
    const newTask = {
      id: Date.now(),
      title: newTaskTitle,
      status: TASK_STATUS.TODO,
      order: maxOrder, // 新しいタスクには最大値+1の順序を割り当て
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

  // 空のタスクを追加（ステータス指定可能）
  const addEmptyTask = (status) => {
    // 同じステータスの中で最大のorder値を取得
    const sameStatusTasks = tasks.filter(t => t.status === status);
    const maxOrder = sameStatusTasks.length > 0 
      ? Math.max(...sameStatusTasks.map(t => t.order || 0)) + 1 
      : 0;
    
    const newTask = {
      id: Date.now(),
      title: "新しいタスク",
      status: status,
      order: maxOrder, // 新しいタスクには最大値+1の順序を割り当て
      createdAt: new Date().toISOString(),
      comments: [],
      subtasks: [],
    };
    
    setTasks([...tasks, newTask]);
    // 追加後すぐに編集モードに
    startEditing(newTask.id, newTask.title, null, null);
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
    // ステータス変更先の最大order値を取得
    const targetStatusTasks = tasks.filter(t => t.status === newStatus);
    const maxOrder = targetStatusTasks.length > 0 
      ? Math.max(...targetStatusTasks.map(t => t.order || 0)) + 1 
      : 0;
    
    setTasks(tasks.map(task => 
      task.id === id 
        ? { ...task, status: newStatus, order: maxOrder } // 新しいステータスの最後尾に配置
        : task
    ));
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

  // ドラッグ開始ハンドラ - データ転送オブジェクトにタスクIDを設定
  const handleDragStart = (taskId, e) => {
    // ドラッグデータをセット
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', taskId.toString());
      e.dataTransfer.effectAllowed = 'move';
    }
    
    // ドラッグ中のタスクを記録
    setDraggedTask(taskId);
    
    // ドラッグ時のプレビュー画像を調整（透明度を設定）
    if (e.target) {
      setTimeout(() => {
        e.target.style.opacity = '0.6';
      }, 0);
    }
  };

  // ドラッグ終了ハンドラ - 要素の表示を元に戻す
  const handleDragEnd = (e) => {
    // ドラッグ中のスタイルをリセット
    if (e.target) {
      e.target.style.opacity = '1';
    }
    
    // ドラッグ状態をリセット
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
    // 指定されたステータスでフィルタリングし、order順にソート
    return tasks
      .filter(task => task.status === status)
      .sort((a, b) => {
        // orderプロパティで並べ替え（未定義の場合は0とみなす）
        const orderA = a.order !== undefined ? a.order : 0;
        const orderB = b.order !== undefined ? b.order : 0;
        return orderA - orderB;
      });
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

  // タスクの並び替え機能を改善
  const reorderTasks = (status, startIndex, endIndex) => {
    // 並び替えの前後が同じ場合は何もしない
    if (startIndex === endIndex) return;
    
    // ステータスでフィルタリングしてorder順にソート
    const statusTasks = getFilteredTasks(status);
    
    if (startIndex < 0 || startIndex >= statusTasks.length || 
        endIndex < 0 || endIndex >= statusTasks.length) {
      console.error("無効なインデックス:", startIndex, endIndex, statusTasks.length);
      return;
    }
    
    console.log("並び替え前のタスク:", statusTasks.map(t => ({ id: t.id, order: t.order })));
    
    // 移動するタスクを特定
    const taskToMove = statusTasks[startIndex];
    
    // 新しい配列を作成（移動元を削除）
    const newStatusTasks = [...statusTasks];
    newStatusTasks.splice(startIndex, 1);
    
    // 移動先に挿入
    newStatusTasks.splice(endIndex, 0, taskToMove);
    
    // orderを再割り当て（10単位でインクリメント - 将来の挿入に余裕を持たせる）
    const updatedTasks = newStatusTasks.map((task, index) => ({
      ...task,
      order: index * 10
    }));
    
    console.log("並び替え後のタスク:", updatedTasks.map(t => ({ id: t.id, order: t.order })));
    
    // tasks配列を更新（他のステータスのタスクはそのまま維持）
    setTasks(prevTasks => 
      prevTasks.map(task => {
        // 同じステータスのタスクは新しいorder値で更新
        const updatedTask = updatedTasks.find(t => t.id === task.id);
        if (updatedTask) {
          return updatedTask;
        }
        // 他のステータスのタスクはそのまま
        return task;
      })
    );
  };

  // カンバンカラムコンポーネント
  const KanbanColumn = ({ title, status, tasks }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [dragOverTaskId, setDragOverTaskId] = useState(null);
    
    /**
     * タスクをプロジェクト別にグループ化
     * @returns {Object} プロジェクト名をキーとするタスクグループ
     */
    const groupTasksByProject = () => {
      const grouped = {};
      
      // orderでソート済みのタスクを使用
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
     * カラム全体のドラッグオーバーハンドラ
     * @param {Event} e - ドラッグオーバーイベント
     */
    const handleDragOver = (e) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move';
      }
      setIsDragOver(true);
    };
    
    /**
     * カラムからのドラッグリーブハンドラ
     */
    const handleDragLeave = () => {
      setIsDragOver(false);
    };
    
    /**
     * カラム領域へのドロップハンドラ
     * @param {Event} e - ドロップイベント
     */
    const handleDrop = (e) => {
      e.preventDefault();
      setIsDragOver(false);
      
      console.log("カラムへのドロップ:", status, "タスク:", draggedTask);
      
      // カラムエリアへのドロップ（タスクステータス変更）
      if (draggedTask !== null && !dragOverTaskId) {
        // 全タスクからドラッグ中のタスクを検索
        const allTasks = tasks.find(t => t.id === draggedTask);
        
        // タスクが見つからないか、異なるステータスの場合は移動
        if (!allTasks || allTasks.status !== status) {
          // ステータス変更を実行
          updateTaskStatus(draggedTask, status);
          console.log("ステータス変更完了:", draggedTask, "→", status);
        }
      }
      
      // ドラッグ状態をリセット
      setDraggedTask(null);
      setDragOverTaskId(null);
    };
    
    /**
     * タスクカードのドラッグオーバーハンドラ
     * @param {Event} e - ドラッグオーバーイベント
     * @param {string|number} taskId - ドラッグオーバーされたタスクID
     */
    const handleTaskDragOver = (e, taskId) => {
      e.preventDefault();
      e.stopPropagation();
      
      // ドロップ効果を設定
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move';
      }
      
      setDragOverTaskId(taskId);
    };
    
    /**
     * タスクカードのドラッグリーブハンドラ
     * @param {Event} e - ドラッグリーブイベント
     */
    const handleTaskDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverTaskId(null);
    };
    
    /**
     * タスクカードへのドロップハンドラ
     * @param {Event} e - ドロップイベント
     * @param {string|number} taskId - ドロップ先のタスクID
     */
    const handleTaskDrop = (e, taskId) => {
      e.preventDefault();
      e.stopPropagation();
      
      console.log("タスクへのドロップ:", taskId, "ドラッグ中:", draggedTask);
      
      if (draggedTask && draggedTask !== taskId) {
        // ドラッグ元とドロップ先のタスクを特定
        const sourceTask = tasks.find(t => t.id === draggedTask);
        const targetTask = tasks.find(t => t.id === taskId);
        
        if (sourceTask && targetTask) {
          // 同じステータスのタスク間での並び替え
          if (sourceTask.status === targetTask.status) {
            const statusTasks = getFilteredTasks(targetTask.status);
            const draggedIndex = statusTasks.findIndex(t => t.id === draggedTask);
            const dropIndex = statusTasks.findIndex(t => t.id === taskId);
            
            console.log("タスク並び替え:", 
                        "移動元:", draggedTask, `(order=${sourceTask.order})`, 
                        "移動先:", taskId, `(order=${targetTask.order})`, 
                        "インデックス:", draggedIndex, "→", dropIndex);
            
            if (draggedIndex !== -1 && dropIndex !== -1) {
              reorderTasks(targetTask.status, draggedIndex, dropIndex);
            }
          } 
          // 異なるステータス間でのドロップ（ステータス変更）
          else {
            console.log("ステータス変更:", 
                        "タスク:", draggedTask, 
                        "旧ステータス:", sourceTask.status, 
                        "新ステータス:", targetTask.status);
            
            updateTaskStatus(draggedTask, targetTask.status);
          }
        }
      }
      
      setDragOverTaskId(null);
      setDraggedTask(null);
    };

    // タスクカードコンポーネント（列内に表示）
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
            // 編集モード（既存コードをそのまま使用）
            <form onSubmit={(e) => { e.preventDefault(); saveEdit(); }} className="flex flex-col w-full">
              {/* 既存の編集フォーム */}
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
            // 表示モード（既存コードをそのまま使用）
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
                    {/* タスクの上部に視覚的なドラッグハンドルを追加 */}
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
                          <div className="flex justify-between items-start">
                            <span
                              className={`${task.status === TASK_STATUS.DONE ? 'line-through text-gray-400' : ''}`}
                              onDoubleClick={() => startEditing(task.id, task.title, task.dueDate, task.project)}
                            >
                              {task.title}
                              {/* デバッグ用：タスクのorder値を表示 */}
                              <span className="text-xs text-gray-400 ml-1">
                                [ord:{task.order !== undefined ? task.order : 'なし'}]
                              </span>
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
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
                    
                    {/* タスクの下部に視覚的なドラッグハンドルを追加 */}
                    <div className="w-full h-1 bg-gray-200 rounded-full mt-2 cursor-move opacity-50 hover:opacity-100 hover:bg-blue-300"></div>
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
                  draggable="true"
                  onDragStart={(e) => handleDragStart(task.id, e)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleTaskDragOver(e, task.id)}
                  onDragLeave={handleTaskDragLeave}
                  onDrop={(e) => handleTaskDrop(e, task.id)}
                  className={getTaskCardClasses(task.id)}
                >
                  {editingId === task.id ? (
                    // プロジェクトなしタスクの内容（既存コードと同様）
                    <form onSubmit={(e) => { e.preventDefault(); saveEdit(); }} className="flex flex-col w-full">
                      {/* 既存の編集フォーム */}
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
                    // 表示モード（既存コードをそのまま使用）
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

  /**
   * サブタスクを追加する関数
   * @param {string|number} taskId - 親タスクのID
   * @param {string} subtaskText - サブタスクのテキスト
   */
  const addSubtask = (taskId, subtaskText) => {
    // テキストが空の場合は何もしない
    if (!subtaskText.trim()) return;
    
    // 新しいサブタスクオブジェクトを作成
    const newSubtask = {
      id: Date.now().toString(),
      text: subtaskText.trim(),
      completed: false,
      status: TASK_STATUS.TODO,
      level: 0, // 階層レベル（ネスト用）
      dueDate: null,
      createdAt: new Date().toISOString()
    };
    
    // タスクリストを更新
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
   * サブタスクの階層レベルを上げる（左に移動）
   * @param {string|number} taskId - 親タスクのID
   * @param {string} subtaskId - サブタスクのID
   */
  const promoteSubtask = (taskId, subtaskId) => {
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === taskId && task.subtasks) {
          const updatedSubtasks = task.subtasks.map(subtask => {
            if (subtask.id === subtaskId) {
              // レベル0が最も左側なので、それ以上は左に移動できない
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
   * サブタスクの階層レベルを下げる（右に移動）
   * @param {string|number} taskId - 親タスクのID
   * @param {string} subtaskId - サブタスクのID
   */
  const demoteSubtask = (taskId, subtaskId) => {
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === taskId && task.subtasks) {
          const updatedSubtasks = task.subtasks.map(subtask => {
            if (subtask.id === subtaskId) {
              // 最大で5レベルまでのネスト（視認性のため）
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
   * サブタスクの完了ステータスをトグルする
   * @param {string|number} taskId - 親タスクのID
   * @param {string} subtaskId - サブタスクのID
   */
  const toggleSubtaskCompletion = (taskId, subtaskId) => {
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === taskId && task.subtasks) {
          const updatedSubtasks = task.subtasks.map(subtask => {
            if (subtask.id === subtaskId) {
              const newCompleted = !subtask.completed;
              // 完了ステータスと連動させる
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
   * サブタスクのステータスを更新する
   * @param {string|number} taskId - 親タスクのID
   * @param {string} subtaskId - サブタスクのID
   * @param {string} newStatus - 新しいステータス
   */
  const updateSubtaskStatus = (taskId, subtaskId, newStatus) => {
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === taskId && task.subtasks) {
          const updatedSubtasks = task.subtasks.map(subtask => {
            if (subtask.id === subtaskId) {
              // ステータスがDONEの場合は、completedも連動させる
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
   * サブタスクを削除する
   * @param {string|number} taskId - 親タスクのID
   * @param {string} subtaskId - 削除するサブタスクのID
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
   * サブタスクの期限日を設定する
   * @param {string|number} taskId - 親タスクのID
   * @param {string} subtaskId - サブタスクのID
   * @param {string} dueDate - 期限日（YYYY-MM-DD形式）
   */
  const setSubtaskDueDate = (taskId, subtaskId, dueDate) => {
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === taskId && task.subtasks) {
          // サブタスクを日付ソートする前に更新
          const updatedSubtasks = task.subtasks.map(subtask => {
            if (subtask.id === subtaskId) {
              return { ...subtask, dueDate };
            }
            return subtask;
          });
          
          // 更新後のサブタスクリストを日付順にソート
          return { ...task, subtasks: sortSubtasksByDueDate(updatedSubtasks) };
        }
        return task;
      })
    );
  };

  /**
   * サブタスクを日付順にソートする
   * @param {Array} subtasks - サブタスクの配列
   * @returns {Array} ソート済みのサブタスク配列
   */
  };

  // タスク詳細モーダル
  const TaskDetailModal = ({ task, onClose }) => {
    const [newComment, setNewComment] = useState('');
    const [commentText, setCommentText] = useState('');
    const [newSubtask, setNewSubtask] = useState('');
    const [localSubtasks, setLocalSubtasks] = useState((task && task.subtasks) || []);
    
    useEffect(() => {
      // タスクが変更された場合、ローカルのサブタスクを更新
      if (task) {
        setLocalSubtasks(sortSubtasksByDueDate(task.subtasks || []));
      }
    }, [task]);
    
    // nullチェックを追加
    if (!task) {
      return null;
    }
    
    // サブタスクを締め切り日で並べ替え
    const getSortedSubtasks = (statusFilter = null) => {
      const filteredSubtasks = statusFilter 
        ? localSubtasks.filter(st => st.status === statusFilter)
        : localSubtasks;
      
      return sortSubtasksByDueDate(filteredSubtasks);
    };
    
    // サブタスクをステータスでグループ化
    const getGroupedSubtasks = () => {
      return {
        [TASK_STATUS.TODO]: getSortedSubtasks(TASK_STATUS.TODO),
        [TASK_STATUS.IN_PROGRESS]: getSortedSubtasks(TASK_STATUS.IN_PROGRESS),
        [TASK_STATUS.DONE]: getSortedSubtasks(TASK_STATUS.DONE)
      };
    };
    
    const handleAddSubtask = () => {
      if (newSubtask.trim() !== '') {
        const newSubtaskObj = {
          id: Date.now().toString(),
          text: newSubtask,
          completed: false,
          status: TASK_STATUS.TODO,
          level: 0
        };
        
        const updatedSubtasks = [...localSubtasks, newSubtaskObj];
        setLocalSubtasks(sortSubtasksByDueDate(updatedSubtasks));
        addSubtask(task.id, newSubtask);
        setNewSubtask('');
      }
    };
    
    const handleToggleSubtask = (subtaskId) => {
      const updatedSubtasks = localSubtasks.map(st => {
        if (st.id === subtaskId) {
          const newCompleted = !st.completed;
          const newStatus = newCompleted ? TASK_STATUS.DONE : TASK_STATUS.TODO;
          return { ...st, completed: newCompleted, status: newStatus };
        }
        return st;
      });
      
      setLocalSubtasks(sortSubtasksByDueDate(updatedSubtasks));
      toggleSubtaskCompletion(task.id, subtaskId);
    };
    
    const handleUpdateSubtaskStatus = (subtaskId, newStatus) => {
      const updatedSubtasks = localSubtasks.map(st => {
        if (st.id === subtaskId) {
          // 完了ステータスの場合、completedも連動して更新
          const newCompleted = newStatus === TASK_STATUS.DONE;
          return { ...st, status: newStatus, completed: newCompleted };
        }
        return st;
      });
      
      setLocalSubtasks(sortSubtasksByDueDate(updatedSubtasks));
      updateSubtaskStatus(task.id, subtaskId, newStatus);
    };
    
    const handleSetSubtaskDueDate = (subtaskId, dueDate) => {
      const updatedSubtasks = localSubtasks.map(st => {
        if (st.id === subtaskId) {
          return { ...st, dueDate };
        }
        return st;
      });
      
      setLocalSubtasks(sortSubtasksByDueDate(updatedSubtasks));
      setSubtaskDueDate(task.id, subtaskId, dueDate);
    };
    
    // コメント関連の機能
    const handleAddComment = (e) => {
      e.preventDefault();
      if (commentText.trim() !== '') {
        addCommentToTask(task.id, commentText);
        setCommentText('');
      }
    };
    
    // モーダルの外側クリックで閉じる
    const handleModalClick = (e) => {
      if (e.target.classList.contains('modal-background')) {
        onClose();
      }
    };
    
    // 各ステータスのサブタスクを表示
    const groupedSubtasks = getGroupedSubtasks();
    const allSubtasksCount = localSubtasks.length;
    const completedSubtasksCount = localSubtasks.filter(st => st.completed).length;
    const progressPercentage = allSubtasksCount > 0 
      ? Math.round((completedSubtasksCount / allSubtasksCount) * 100) 
      : 0;
    
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 modal-background"
        onClick={handleModalClick}
      >
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold">{task.title}</h2>
            <div className="flex items-center space-x-2">
              {task.project && (
                <span 
                  className="px-2 py-1 rounded text-white text-sm"
                  style={{ backgroundColor: getProjectColor(task.project) }}
                >
                  {task.project}
                </span>
              )}
              <span className={`px-2 py-1 rounded text-white text-sm ${getStatusBgColor(task.status)}`}>
                {getStatusText(task.status)}
              </span>
              <button 
                onClick={onClose} 
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* コンテンツエリア */}
          <div className="flex flex-grow overflow-hidden">
            {/* メイン情報 */}
            <div className="w-2/3 p-4 overflow-y-auto">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium">詳細情報</h3>
                  <button
                    onClick={() => startEditing(task.id, task.title, task.dueDate, task.project)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    編集
                  </button>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">ステータス</p>
                      <div className="mt-1">
                        <select
                          className="border rounded p-1 w-full"
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                        >
                          <option value={TASK_STATUS.TODO}>未着手</option>
                          <option value={TASK_STATUS.IN_PROGRESS}>進行中</option>
                          <option value={TASK_STATUS.DONE}>完了</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">締め切り</p>
                      <div className="mt-1">
                        <input
                          type="date"
                          className="border rounded p-1 w-full"
                          value={task.dueDate || ''}
                          onChange={(e) => updateTaskDueDate(task.id, e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">プロジェクト</p>
                      <div className="mt-1">
                        <input
                          type="text"
                          className="border rounded p-1 w-full"
                          list="project-list"
                          value={task.project || ''}
                          onChange={(e) => updateTaskProject(task.id, e.target.value)}
                        />
                        <datalist id="project-list">
                          {getProjects().map(project => (
                            <option key={project} value={project} />
                          ))}
                        </datalist>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">作成日</p>
                      <p className="mt-1">{formatDate(task.createdAt || new Date())}</p>
                    </div>
                  </div>
                  {task.dueDate && (
                    <div className="mt-3">
                      <button
                        className="bg-purple-100 text-purple-700 px-3 py-1 rounded flex items-center hover:bg-purple-200"
                        onClick={() => generateICSFile(task)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        カレンダーに追加
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* サブタスク */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">サブタスク 
                  <span className="text-sm text-gray-500 ml-2">
                    {completedSubtasksCount}/{allSubtasksCount} 完了 ({progressPercentage}%)
                  </span>
                </h3>
                
                {/* サブタスク進捗バー */}
                {allSubtasksCount > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                )}
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  {/* 新規サブタスク追加フォーム */}
                  <div className="flex mb-4">
                    <input
                      type="text"
                      className="flex-grow border rounded-l px-2 py-1"
                      placeholder="新しいサブタスクを追加"
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddSubtask();
                          e.preventDefault();
                        }
                      }}
                    />
                    <button
                      onClick={handleAddSubtask}
                      className="bg-blue-500 text-white px-3 py-1 rounded-r hover:bg-blue-600"
                    >
                      追加
                    </button>
                  </div>
                  
                  {/* サブタスクリスト - ステータス別に表示 */}
                  {Object.entries(groupedSubtasks).map(([status, subtasks]) => (
                    subtasks.length > 0 && (
                      <div key={status} className="mb-3">
                        <div className={`px-2 py-1 rounded text-white text-sm inline-block mb-2 ${getStatusBgColor(status)}`}>
                          {getStatusText(status)} ({subtasks.length})
                        </div>
                        <div className="space-y-2">
                          {subtasks.map(subtask => (
                            <div key={subtask.id} className="flex items-center hover:bg-gray-100 p-1 rounded">
                              <input
                                type="checkbox"
                                checked={subtask.completed}
                                onChange={() => handleToggleSubtask(subtask.id)}
                                className="mr-2"
                              />
                              <span 
                                className={`flex-grow ${subtask.completed ? 'line-through text-gray-400' : ''}`}
                                style={{ marginLeft: `${(subtask.level || 0) * 20}px` }}
                              >
                                {subtask.text}
                                {subtask.dueDate && (
                                  <span className={`ml-2 text-xs ${getDueDateClassName(subtask.dueDate, subtask.completed)}`}>
                                    ({formatDate(subtask.dueDate)})
                                  </span>
                                )}
                              </span>
                              <div className="flex items-center space-x-1">
                                <select
                                  className="text-xs border rounded p-1"
                                  value={subtask.status || TASK_STATUS.TODO}
                                  onChange={(e) => handleUpdateSubtaskStatus(subtask.id, e.target.value)}
                                >
                                  <option value={TASK_STATUS.TODO}>未着手</option>
                                  <option value={TASK_STATUS.IN_PROGRESS}>進行中</option>
                                  <option value={TASK_STATUS.DONE}>完了</option>
                                </select>
                                <input
                                  type="date"
                                  className="text-xs border rounded p-1"
                                  value={subtask.dueDate || ''}
                                  onChange={(e) => handleSetSubtaskDueDate(subtask.id, e.target.value)}
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
                      </div>
                    )
                  ))}
                  
                  {allSubtasksCount === 0 && (
                    <p className="text-gray-500 text-center py-2">サブタスクはありません</p>
                  )}
                </div>
              </div>
              
              {/* コメント */}
              <div>
                <h3 className="text-lg font-medium mb-2">コメント</h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  {/* コメント入力フォーム */}
                  <form onSubmit={handleAddComment} className="mb-4">
                    <textarea
                      className="w-full border rounded p-2 mb-2"
                      rows="2"
                      placeholder="コメントを入力..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    ></textarea>
                    <button
                      type="submit"
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      コメント追加
                    </button>
                  </form>
                  
                  {/* コメントリスト */}
                  <div className="space-y-3">
                    {task.comments && task.comments.length > 0 ? (
                      task.comments.map((comment, index) => (
                        <div key={index} className="bg-white p-3 rounded border">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-500">
                              {formatDate(comment.date)} {formatTime(comment.date)}
                            </span>
                            <button
                              onClick={() => deleteCommentFromTask(task.id, index)}
                              className="text-red-500 hover:text-red-700"
                              title="削除"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <p>{comment.text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-2">コメントはありません</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* サイドバー */}
            <div className="w-1/3 bg-gray-50 p-4 overflow-y-auto border-l">
              <h3 className="text-lg font-medium mb-3">アクション</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    updateTaskStatus(task.id, task.status === TASK_STATUS.DONE ? TASK_STATUS.TODO : TASK_STATUS.DONE);
                    onClose();
                  }}
                  className={`w-full p-2 rounded text-white ${
                    task.status === TASK_STATUS.DONE ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  {task.status === TASK_STATUS.DONE ? '未完了に戻す' : '完了にする'}
                </button>
                <button
                  onClick={() => {
                    deleteTask(task.id);
                    onClose();
                  }}
                  className="w-full p-2 rounded bg-red-500 text-white hover:bg-red-600"
                >
                  タスクを削除
                </button>
                {task.dueDate && (
                  <button
                    onClick={() => generateICSFile(task)}
                    className="w-full p-2 rounded bg-purple-500 text-white hover:bg-purple-600 flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    カレンダーに追加
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // タスクのステータスに応じた背景色を取得
  const getStatusBgColor = (status) => {
    switch (status) {
      case TASK_STATUS.TODO:
        return 'bg-gray-500';
      case TASK_STATUS.IN_PROGRESS:
        return 'bg-blue-500';
      case TASK_STATUS.DONE:
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // ステータスの表示テキストを取得
  const getStatusText = (status) => {
    switch (status) {
      case TASK_STATUS.TODO:
        return '未着手';
      case TASK_STATUS.IN_PROGRESS:
        return '進行中';
      case TASK_STATUS.DONE:
        return '完了';
      default:
        return '未着手';
    }
  };
  
  // 時間のフォーマット (HH:MM)
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };
  
  // タスクにコメントを追加
  const addCommentToTask = (taskId, commentText) => {
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === taskId) {
          const newComment = {
            id: Date.now().toString(),
            text: commentText,
            date: new Date().toISOString()
          };
          return {
            ...task,
            comments: [...(task.comments || []), newComment]
          };
        }
        return task;
      })
    );
  };
  
  // タスクからコメントを削除
  const deleteCommentFromTask = (taskId, commentIndex) => {
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === taskId && task.comments) {
          const newComments = [...task.comments];
          newComments.splice(commentIndex, 1);
          return {
            ...task,
            comments: newComments
          };
        }
        return task;
      })
    );
  };
  
  // タスクのプロジェクトを更新
  const updateTaskProject = (taskId, project) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, project } 
          : task
      )
    );
  };
  
  // タスクの締め切り日を更新
  const updateTaskDueDate = (taskId, dueDate) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, dueDate } 
          : task
      )
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
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};

export default TaskManagementApp;
