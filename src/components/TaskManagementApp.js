import React, { useState, useEffect, useCallback } from 'react';
import { getDueDateClassName } from '../utils/dateUtils';

const TaskManagementApp = () => {
  const [version, setVersion] = useState('1.1.8');
  
  // タスク一覧
  const [tasks, setTasks] = useState(() => {
    // ローカルストレージからデータの読み込み
    const savedTasks = localStorage.getItem('kanban-tasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });
  
  // プロジェクトの順序情報
  const [projectOrder, setProjectOrder] = useState(() => {
    const savedOrder = localStorage.getItem('kanban-project-order');
    return savedOrder ? JSON.parse(savedOrder) : {};
  });

  // ビュータイプの状態（カンバンビューか表形式ビューか）
  const [viewType, setViewType] = useState(() => {
    const savedViewType = localStorage.getItem('kanban-view-type');
    return savedViewType || 'kanban'; // デフォルトはカンバンビュー
  });

  // 表形式ビューのソート状態
  const [tableSorting, setTableSorting] = useState({
    column: 'dueDate',
    direction: 'asc'
  });

  // 日付のフォーマット（MM/DD形式）
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // 月の取得（JavaScriptでは0から始まるため+1する）
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    // 日の取得（2桁になるよう0埋め）
    const day = date.getDate().toString().padStart(2, '0');
    // MM/DD形式で返す
    return `${month}/${day}`;
  };

  // 日付入力フィールドの表示をカスタマイズするスタイル
  const customStyles = `
    /* ====================================================
     * 日付入力フィールドのスタイル（カレンダーピッカー）
     * ==================================================== */
    
    /* 日付入力フィールドの基本スタイル設定
     * position: relative - 子要素の位置決めの基準点となる
     * overflow: visible - カレンダーピッカーが親要素からはみ出ても表示される
     */
    input[type="date"] {
      position: relative;
      overflow: visible;
    }
    
    /* カレンダーピッカーアイコンのスタイル
     * 独自のSVGアイコンを使用して、デザインの一貫性を保つ
     * 特定の位置に配置することで、誤クリックを防止
     * z-index: 1 - 他の要素より前面に表示されるが、モーダルなど重要な要素より後ろに表示
     */
    input[type="date"]::-webkit-calendar-picker-indicator {
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="15" viewBox="0 0 24 24"><path fill="%23757575" d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/></svg>');
      background-repeat: no-repeat;
      background-size: 16px;
      background-position: center;
      width: 20px;
      height: 20px;
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      margin: auto;
      padding: 0;
      cursor: pointer;
      opacity: 0.5;
      box-sizing: border-box;
      z-index: 1;
    }
    
    /* カレンダーピッカーのホバー時のスタイル - ユーザーフィードバックを向上 */
    input[type="date"]:hover::-webkit-calendar-picker-indicator {
      opacity: 0.8;
    }
    
    /* ブラウザ標準のスピンボタンと削除ボタンを非表示に */
    input[type="date"]::-webkit-inner-spin-button,
    input[type="date"]::-webkit-clear-button {
      display: none;
    }
    
    /* 年の表示を非表示に - MM/DD形式のみ表示するため */
    input[type="date"]::-webkit-datetime-edit-year-field {
      display: none !important;
    }
    
    /* 日付の最初の区切り文字（スラッシュ）を非表示に */
    input[type="date"]::-webkit-datetime-edit-text:first-child {
      display: none !important;
    }
    
    /* サブタスクリストの日付表示のスタイル調整 - 余分な区切り文字を非表示に */
    input[type="date"]::-webkit-datetime-edit-text {
      display: none !important;
    }
    
    /* 青丸で囲まれた日付表示を非表示にする - カレンダーアイコン横の日付テキスト */
    span.task-date {
      display: none !important;
    }
    
    /* ====================================================
     * その他の共通スタイル
     * ==================================================== */
    
    .h-screen-minus-header {
      height: auto;
      max-height: 500px;
    }
    
    /* カード要素のホバーエフェクト */
    .task-card {
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .task-card:hover {
      transform: translateX(3px);
    }
    
    /* カラムのホバーエフェクト */
    .column-transition {
      transition: background-color 0.3s;
    }
    
    .column-transition:hover {
      background-color: #f3f4f6;
    }

    /* ====================================================
     * レスポンシブデザインの設定
     * ==================================================== */
    @media (max-width: 768px) {
      /* 全体のフレックスアイテムを折り返し表示に */
      .flex.items-center {
        flex-wrap: wrap;
        gap: 4px;
      }
      
      /* カンバンボードのカラムをモバイル表示で縦並びに */
      .flex.justify-between.mt-6 {
        flex-direction: column;
      }
      
      .w-1/3 {
        width: 100%;
        margin-bottom: 1rem;
      }
      
      /* サブタスクの表示を改善 */
      .flex.items-center.text-sm {
        flex-wrap: wrap;
      }
      
      .flex.items-center.text-sm > .flex-1 {
        width: 100%;
        margin-bottom: 4px;
      }
      
      .flex.items-center.text-sm > .flex.items-center {
        width: 100%;
        justify-content: flex-start;
        margin-top: 4px;
        margin-left: 20px;
      }
    }
  `;

  // .ics ファイルを生成する関数
  const generateICSFile = (task, isSubtask = false, subtask = null) => {
    // タスクに締め切りがない場合は処理しない
    const dueDate = isSubtask ? subtask.dueDate : task.dueDate;
    if (!dueDate) {
      alert('このタスクには締め切り日が設定されていません。');
      return;
    }

    // 現在の日時を取得 (UTC形式)
    const now = new Date();
    const timeStamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/g, '');
    
  // 締め切り日を処理
    const dueDateObj = new Date(dueDate);
  
  // 終日予定の場合、日付だけを取得して"YYYYMMDD"形式にする
    const dueDateFormatted = dueDateObj.toISOString().split('T')[0].replace(/-/g, '');
  
  // 終了日は開始日の翌日（Outlookの終日予定の仕様に合わせる）
    const endDate = new Date(dueDateObj);
  endDate.setDate(endDate.getDate() + 1);
  const endDateFormatted = endDate.toISOString().split('T')[0].replace(/-/g, '');
  
  // ユニークIDの生成
    const uid = `${timeStamp}-${isSubtask ? subtask.id : task.id}@kanban-task-app`;
  
  // タイトルの整形
    const title = isSubtask ? subtask.text : task.title;
    const formattedTitle = title.replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
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
      `SUMMARY:${projectInfo}${formattedTitle}`,
    'TRANSP:TRANSPARENT',
      `DESCRIPTION:Kanban Task App からエクスポートされた${isSubtask ? 'サブタスク' : 'タスク'}\\n\\n状態: ${
        isSubtask ? (subtask.status === 'todo' ? '未着手' : subtask.status === 'in-progress' ? '進行中' : '完了')
        : (task.status === 'todo' ? '未着手' : task.status === 'in-progress' ? '進行中' : '完了')
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
    const fileName = `${title.substring(0, 30).replace(/[/\\?%*:|"<>]/g, '-')}_${dueDateFormatted}.ics`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 予定表追加状態を更新
    if (isSubtask) {
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === task.id
            ? {
                ...t,
                subtasks: t.subtasks.map(st =>
                  st.id === subtask.id
                    ? { ...st, isCalendarAdded: true }
                    : st
                )
              }
            : t
        )
      );
    } else {
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === task.id
            ? { ...t, isCalendarAdded: true }
            : t
        )
      );
    }
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

  const [draggedProject, setDraggedProject] = useState(null);
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
  const [viewMode, setViewMode] = useState('normal'); // 通常表示かプロジェクト表示か
  const [currentTaskForModal, setCurrentTaskForModal] = useState(null);
  
  // サブタスク編集用の状態
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const subtaskEditRef = React.useRef(null);
  // ファイルインポート用の参照
  const fileInputRef = React.useRef(null);

  // タスクの変更をローカルストレージに保存
  useEffect(() => {
    console.log('Saving tasks to localStorage:', tasks);
    localStorage.setItem('kanban-tasks', JSON.stringify(tasks));
    const savedTasks = localStorage.getItem('kanban-tasks');
    console.log('Verified saved tasks:', savedTasks);
  }, [tasks]);

  // プロジェクトの順序をローカルストレージに保存
  useEffect(() => {
    if (Object.keys(projectOrder).length > 0) {
      localStorage.setItem('kanban-project-order', JSON.stringify(projectOrder));
      console.log('Saved project order:', projectOrder);
    }
  }, [projectOrder]);

  // ビュータイプが変更されたら保存
  useEffect(() => {
    localStorage.setItem('kanban-view-type', viewType);
  }, [viewType]);

  // タスクが変更されたときにプロジェクトの順序を再計算
  useEffect(() => {
    if (tasks.length > 0) {
      recalculateProjectOrder();
    }
  }, [tasks]);

  // プロジェクトの順序を再計算する関数
  const recalculateProjectOrder = () => {
    const allProjects = [...new Set(tasks
      .map(task => task.project)
      .filter(project => project && project.trim() !== '')
    )];
    
    // 既存の順序を保持しつつ、新しいプロジェクトには順序を割り当てる
    const newOrder = {};
    const usedOrders = new Set();
    
    // まず既存の順序を持つプロジェクトを処理
    allProjects.forEach(project => {
      if (projectOrder[project] !== undefined) {
        // 既存の順序が重複していないことを確認
        if (!usedOrders.has(projectOrder[project])) {
          newOrder[project] = projectOrder[project];
          usedOrders.add(projectOrder[project]);
        }
      }
    });
    
    // 次に未定義の順序を持つプロジェクトに新しい順序を割り当て
    let currentOrder = 0;
    allProjects.forEach(project => {
      if (newOrder[project] === undefined) {
        // 使用されていない最小の順序を探す
        while (usedOrders.has(currentOrder)) {
          currentOrder++;
        }
        newOrder[project] = currentOrder;
        usedOrders.add(currentOrder);
        currentOrder++;
      }
    });
    
    setProjectOrder(newOrder);
    return newOrder;
  };

  // プロジェクトリストの取得（順序を考慮）
  const getProjects = () => {
    // すべてのプロジェクト名を取得（重複なし）
    const projectNames = tasks
      .map(task => task.project || 'その他')  // プロジェクト名がない場合は「その他」として扱う
      .filter(project => project.trim() !== '')
      .filter((project, index, self) => self.indexOf(project) === index);
    
    // 順序情報でソート
    return projectNames.sort((a, b) => {
      const orderA = projectOrder[a] || Number.MAX_SAFE_INTEGER;
      const orderB = projectOrder[b] || Number.MAX_SAFE_INTEGER;
      if (orderA === orderB) {
        return a.localeCompare(b); // 順序が同じ場合はアルファベット順
      }
      return orderA - orderB;
    });
  };

  // 新しいタスクを追加
  const addTask = () => {
    if (newTaskTitle.trim() === '') return;
    
    // 同じステータスの最大orderを取得して、新しいタスクの順序を設定
    const maxOrder = Math.max(...tasks.filter(t => t.status === TASK_STATUS.TODO).map(t => t.order || 0), -1) + 1;
    
    // 新しいタスクオブジェクトを作成
    const newTask = {
      id: Date.now(),
      title: newTaskTitle,
      status: TASK_STATUS.TODO,
      dueDate: newTaskDueDate || null, // 日付が選択されていない場合はnull
      project: newTaskProject,
      createdAt: new Date().toISOString(),
      comments: [],
      subtasks: [],
      order: maxOrder, // 同じステータスの最後に追加
      isCalendarAdded: false, // 予定表追加状態を追加
    };
    
    // タスクリストに追加
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    setNewTaskDueDate('');
    setNewTaskProject('');
    
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
    // 同じステータスの最大orderを取得
    const maxOrder = Math.max(...tasks.filter(t => t.status === status).map(t => t.order || 0), -1) + 1;
    
    const newTask = {
      id: Date.now(),
      title: `新しいタスク ${new Date().toLocaleTimeString()}`,
      status: status,
      createdAt: new Date().toISOString(),
      dueDate: null,
      project: null,
      comments: [],
      subtasks: [], // サブタスク配列を追加
      order: maxOrder, // 同じステータスの最後に追加
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
    
    // 追加後すぐに編集モードに
    setTimeout(() => {
      startEditing(newTask.id, newTask.title, newTask.dueDate, newTask.project);
    }, 100);
  };

  // コメント入力の変更を処理
  const handleCommentChange = (taskId, value) => {
    setCommentInputs(prev => ({
      ...prev,
      [taskId]: value
    }));
  };

  // コメントを追加
  const addComment = (taskId) => {
    const commentText = commentInputs[taskId] || '';
    
    if (commentText && commentText.trim()) {
      // 新しいコメントオブジェクトを作成
      const newComment = {
        id: Date.now(),
        text: commentText,
        createdAt: new Date().toISOString(),
      };
      
      // タスクの状態を更新
      setTasks(prevTasks => 
        prevTasks.map(task =>
          task.id === taskId
            ? {
                ...task,
                comments: [...(task.comments || []), newComment],
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

  // タスクのステータスを更新
  const updateTaskStatus = useCallback((taskId, newStatus) => {
    // 同じカラムの最大orderを取得して、新しい順序を設定
    const maxOrder = Math.max(...tasks.filter(t => t.status === newStatus).map(t => t.order || 0), -1) + 1;
    
    // タスクのステータスと順序を更新
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === taskId) {
          return { ...task, status: newStatus, order: maxOrder };
        }
        return task;
      })
    );
  }, [tasks]);

  // タスクを削除する関数
  const deleteTask = (taskId) => {
    // 削除前に確認ダイアログを表示
    if (!window.confirm('タスクを削除してもよろしいですか？')) {
      return;
    }
    // IDが一致しないタスクのみを残して新しい配列を作成
    setTasks(tasks.filter(task => task.id !== taskId));
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
  const handleDragStart = useCallback((taskId, e) => {
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
  }, []);

  // ドラッグ終了ハンドラー
  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  // タスクドロップハンドラーを追加
  const handleTaskDrop = (targetTaskId) => {
    if (draggedTask === null || draggedTask === targetTaskId) return;
    
    // 同じタスク内での並び替え
    reorderTasks(draggedTask, targetTaskId);
    
    // ドラッグ状態をリセット
    setDraggedTask(null);
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
  const getFilteredTasks = useCallback((status) => {
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
    
    // orderでソート
    result.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    return result;
  }, [tasks, projectFilter, filter]);

  // サブタスクをフィルタリングする関数を追加
  const getFilteredSubtasks = useCallback((task, status) => {
    if (!task.subtasks || task.subtasks.length === 0) return [];
    const filteredSubtasks = task.subtasks.filter(subtask => subtask.status === status);
    return sortSubtasksByDueDate(filteredSubtasks);
  }, []);

  // サブタスクの編集を開始
  const startEditingSubtask = (taskId, subtaskId, subtaskText) => {
    setEditingSubtaskId({ taskId, subtaskId });
    setTimeout(() => {
      if (subtaskEditRef.current) {
        subtaskEditRef.current.value = subtaskText;
        subtaskEditRef.current.focus();
        subtaskEditRef.current.select();
      }
    }, 10);
  };

  // サブタスクの編集を保存
  const saveSubtaskEdit = (taskId, subtaskId) => {
    if (!subtaskEditRef.current) return;
    
    const newText = subtaskEditRef.current.value.trim();
    if (newText === '') return;
    
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map(subtask =>
                subtask.id === subtaskId
                  ? { ...subtask, text: newText }
                  : subtask
              )
            }
          : task
      )
    );
    
    setEditingSubtaskId(null);
  };

  // サブタスク編集のキャンセル
  const cancelSubtaskEdit = () => {
    setEditingSubtaskId(null);
  };

  // カンバンカラムコンポーネント
  const KanbanColumn = React.memo(({ title, status, tasks }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    
    // ドロップエリアのイベントハンドラ
    const handleDragOver = useCallback((e) => {
      e.preventDefault();
      setIsDragOver(true);
    }, []);
    
    const handleDragLeave = useCallback(() => {
      setIsDragOver(false);
    }, []);
    
    const handleDrop = useCallback((e) => {
      e.preventDefault();
      setIsDragOver(false);
      
      if (draggedTask !== null) {
        const draggedTaskObj = tasks.find(t => t.id === draggedTask);
        
        // ドラッグしたタスクが現在のステータスと異なる場合はステータスを更新
        if (!draggedTaskObj || draggedTaskObj.status !== status) {
          // ステータス変更（横方向のドラッグ）
          updateTaskStatus(draggedTask, status);
        } else {
          // 同じステータス内で最後尾に配置
          const maxOrder = Math.max(...tasks.map(task => task.order || 0), -1) + 1;
          setTasks(prevTasks => 
            prevTasks.map(task => 
              task.id === draggedTask ? { ...task, order: maxOrder } : task
            )
          );
        }
      }
      
      // ドラッグ状態をリセット
      setDraggedTask(null);
    }, [draggedTask, status, tasks, updateTaskStatus]);
    
    // タスクをプロジェクト別にグループ化
    const groupTasksByProject = useCallback(() => {
      const grouped = {};
    
      tasks.forEach(task => {
        const projectName = task.project || 'その他';
        if (!grouped[projectName]) {
          grouped[projectName] = [];
        }
        grouped[projectName].push(task);
      });
    
      return grouped;
    }, [tasks]);
    
    const groupedTasks = groupTasksByProject();
    const hasNoTasks = Object.keys(groupedTasks).length === 0;
    const noProjectTasks = groupedTasks['No Project'] || [];
    delete groupedTasks['No Project']; // 「プロジェクトなし」を別に表示するため削除
    
    // プロジェクトの順序を考慮して並べ替え
    const orderedProjects = Object.keys(groupedTasks).sort((a, b) => {
      const orderA = projectOrder[a] !== undefined ? projectOrder[a] : Number.MAX_SAFE_INTEGER;
      const orderB = projectOrder[b] !== undefined ? projectOrder[b] : Number.MAX_SAFE_INTEGER;
      if (orderA === orderB) {
        return a.localeCompare(b);
      }
      return orderA - orderB;
    });
    
    // ドロップ領域のスタイルを動的に設定
    const dropAreaClasses = `p-2 rounded-lg shadow-inner bg-opacity-50 min-h-[200px] column-transition ${
      isDragOver 
      ? 'bg-blue-100 border-2 border-dashed border-blue-300' 
      : 'bg-gray-100'
    }`;
    
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
          {orderedProjects.map(projectName => (
            <div 
              key={projectName} 
              className="mb-3"
              draggable
              onDragStart={(e) => handleProjectDragStart(projectName, e)}
              onDragEnd={handleProjectDragEnd}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleProjectDrop(projectName)}
            >
              <div 
                className="bg-gray-200 p-2 rounded-md mb-2"
                style={{ 
                  backgroundColor: getProjectColor(projectName),
                  color: 'white',
                  textShadow: '0px 1px 2px rgba(0,0,0,0.3)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-2 text-gray-100 cursor-move" title="ドラッグして並べ替え">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
              </div>
                    <h3 className="font-medium">{projectName}</h3>
                    <span className="ml-2 text-xs opacity-75">順序: {projectOrder[projectName] || '未設定'}</span>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      className="bg-white bg-opacity-20 rounded p-1 hover:bg-opacity-30 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveProjectUp(projectName, status);
                      }}
                      title="上に移動"
                      disabled={orderedProjects.indexOf(projectName) === 0}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      className="bg-white bg-opacity-20 rounded p-1 hover:bg-opacity-30 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveProjectDown(projectName, status);
                      }}
                      title="下に移動"
                      disabled={orderedProjects.indexOf(projectName) === orderedProjects.length - 1}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {groupedTasks[projectName].map(task => (
                  <div 
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(task.id, e)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleTaskDrop(task.id)}
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
                        <div className="mr-2 flex items-center">
                          <div className="h-full flex flex-col justify-center mr-1 cursor-grab text-gray-400" title="ドラッグして並べ替え">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                            </svg>
                          </div>
                        <input
                          type="checkbox"
                          checked={task.status === TASK_STATUS.DONE}
                          onChange={() => updateTaskStatus(task.id, task.status === TASK_STATUS.DONE ? TASK_STATUS.TODO : TASK_STATUS.DONE)}
                            className="mt-1"
                        />
                        </div>
                        <div className="flex-grow flex flex-col">
                          <div className="flex justify-between">
                          <span
                            className={`${task.status === TASK_STATUS.DONE ? 'line-through text-gray-400' : ''}`}
                            onDoubleClick={() => startEditing(task.id, task.title, task.dueDate, task.project)}
                          >
                            {task.title}
                          </span>
                            <span className="text-xs text-gray-400 ml-2">順序: {task.order}</span>
                          </div>
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
                                  <div key={subtask.id} className="flex items-center mb-1 hover:bg-gray-100 p-1 rounded">
                                    <div className="flex items-center mr-2">
                                      <button
                                        onClick={() => promoteSubtask(task.id, subtask.id)}
                                        className="text-gray-500 hover:text-gray-700 mr-1"
                                        title="レベル上げ"
                                        disabled={(subtask.level || 0) === 0}
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => demoteSubtask(task.id, subtask.id)}
                                        className="text-gray-500 hover:text-gray-700"
                                        title="レベル下げ"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                      </button>
                                    </div>
                                    <input
                                      type="checkbox"
                                      checked={subtask.completed}
                                      onChange={() => toggleSubtaskCompletion(task.id, subtask.id)}
                                      className="mr-2"
                                    />
                                    <span 
                                      className={`text-sm ${subtask.completed ? 'line-through text-gray-400' : ''}`}
                                      style={{ marginLeft: `${(subtask.level || 0) * 20}px` }}
                                    >
                                      {subtask.text}
                                    </span>
                                    <div className="ml-auto flex items-center">
                                      <select
                                        className="text-xs p-0 border rounded mr-1"
                                        value={subtask.status || TASK_STATUS.TODO}
                                        onChange={(e) => updateSubtaskStatus(task.id, subtask.id, e.target.value)}
                                        style={{ maxWidth: '80px' }}
                                      >
                                        <option value={TASK_STATUS.TODO}>未</option>
                                        <option value={TASK_STATUS.IN_PROGRESS}>進</option>
                                        <option value={TASK_STATUS.DONE}>完</option>
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
                                      {subtask.dueDate && (
                                        <>
                                          <span className="text-xs ml-1 mr-1 task-date">
                                            {formatDate(subtask.dueDate)}
                                          </span>
                                          <button
                                            className={`text-xs flex items-center ${
                                              subtask.isCalendarAdded
                                                ? 'text-green-700'
                                                : 'text-blue-500 hover:text-blue-700'
                                            }`}
                                            onClick={() => generateICSFile(task, true, subtask)}
                                            title={subtask.isCalendarAdded ? "カレンダーに追加済み" : "カレンダーに追加"}
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                          </button>
                                        </>
                                      )}
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
                            <>
                              <span className="text-xs ml-1 mr-1 task-date">
                                {formatDate(task.dueDate)}
                              </span>
                              <button
                                className={`text-xs flex items-center ${
                                  task.isCalendarAdded
                                    ? 'text-green-700'
                                    : 'text-blue-500 hover:text-blue-700'
                                }`}
                                onClick={() => generateICSFile(task)}
                                title={task.isCalendarAdded ? "カレンダーに追加済み" : "カレンダーに追加"}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </>
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
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleTaskDrop(task.id)}
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
                      <div className="mr-2 flex items-center">
                        <div className="h-full flex flex-col justify-center mr-1 cursor-grab text-gray-400" title="ドラッグして並べ替え">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                          </svg>
                        </div>
                      <input
                        type="checkbox"
                        checked={task.status === TASK_STATUS.DONE}
                        onChange={() => updateTaskStatus(task.id, task.status === TASK_STATUS.DONE ? TASK_STATUS.TODO : TASK_STATUS.DONE)}
                          className="mt-1"
                      />
                      </div>
                      <div className="flex-grow flex flex-col">
                        <div className="flex justify-between">
                        <span
                          className={`${task.status === TASK_STATUS.DONE ? 'line-through text-gray-400' : ''}`}
                          onDoubleClick={() => startEditing(task.id, task.title, task.dueDate, task.project)}
                        >
                          {task.title}
                        </span>
                          <span className="text-xs text-gray-400 ml-2">順序: {task.order}</span>
                        </div>
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
                                <div key={subtask.id} className="flex items-center mb-1 hover:bg-gray-100 p-1 rounded">
                                  <div className="flex items-center mr-2">
                                    <button
                                      onClick={() => promoteSubtask(task.id, subtask.id)}
                                      className="text-gray-500 hover:text-gray-700 mr-1"
                                      title="レベル上げ"
                                      disabled={(subtask.level || 0) === 0}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => demoteSubtask(task.id, subtask.id)}
                                      className="text-gray-500 hover:text-gray-700"
                                      title="レベル下げ"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    </button>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={subtask.completed}
                                    onChange={() => toggleSubtaskCompletion(task.id, subtask.id)}
                                    className="mr-2"
                                  />
                                  <span 
                                    className={`text-sm ${subtask.completed ? 'line-through text-gray-400' : ''}`}
                                    style={{ marginLeft: `${(subtask.level || 0) * 20}px` }}
                                  >
                                    {subtask.text}
                                  </span>
                                  <div className="ml-auto flex items-center">
                                    <select
                                      className="text-xs p-0 border rounded mr-1"
                                      value={subtask.status || TASK_STATUS.TODO}
                                      onChange={(e) => updateSubtaskStatus(task.id, subtask.id, e.target.value)}
                                      style={{ maxWidth: '80px' }}
                                    >
                                      <option value={TASK_STATUS.TODO}>未</option>
                                      <option value={TASK_STATUS.IN_PROGRESS}>進</option>
                                      <option value={TASK_STATUS.DONE}>完</option>
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
                                    {subtask.dueDate && (
                                      <>
                                        <span className="text-xs ml-1 mr-1 task-date">
                                          {formatDate(subtask.dueDate)}
                                        </span>
                                        <button
                                          className={`text-xs flex items-center ${
                                            subtask.isCalendarAdded
                                              ? 'text-green-700'
                                              : 'text-blue-500 hover:text-blue-700'
                                          }`}
                                          onClick={() => generateICSFile(task, true, subtask)}
                                          title={subtask.isCalendarAdded ? "カレンダーに追加済み" : "カレンダーに追加"}
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                          </svg>
                                        </button>
                                      </>
                                    )}
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
                          <>
                            <span className="text-xs ml-1 mr-1 task-date">
                              {formatDate(task.dueDate)}
                            </span>
                            <button
                              className={`text-xs flex items-center ${
                                task.isCalendarAdded
                                  ? 'text-green-700'
                                  : 'text-blue-500 hover:text-blue-700'
                              }`}
                              onClick={() => generateICSFile(task)}
                              title={task.isCalendarAdded ? "カレンダーに追加済み" : "カレンダーに追加"}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </>
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
  });

  // タスクの統計情報を取得
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

  // サブタスクを追加する関数
  const addSubtask = (taskId, subtaskText) => {
    if (subtaskText.trim()) {
      // タスクリストを更新し、指定されたタスクIDのサブタスクリストに新しいサブタスクを追加
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
                    isCalendarAdded: false, // 予定表追加状態を追加
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

  // サブタスクを締め切り日順にソート
  const sortSubtasksByDueDate = (subtasks) => {
    if (!subtasks || subtasks.length === 0) return [];
    
    return [...subtasks].sort((a, b) => {
      // 締め切り日が設定されていない場合は後ろに
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      
      // 締め切り日順（昇順）
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  };

  // タスクを並べ替える関数を追加
  const reorderTasks = (draggedTaskId, targetTaskId) => {
    // ドラッグ中のタスクと対象タスクを取得
    const draggedTask = tasks.find(task => task.id === draggedTaskId);
    const targetTask = tasks.find(task => task.id === targetTaskId);
    
    if (!draggedTask || !targetTask || draggedTask.id === targetTask.id) {
      return;
    }
    
    // 同じステータス内での並べ替えのみ許可
    if (draggedTask.status !== targetTask.status) {
      return;
    }
    
    // 同じステータスのタスクをorder順に取得
    const tasksInSameStatus = tasks
      .filter(task => task.status === draggedTask.status)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // ドラッグしたタスクを除外
    const tasksWithoutDragged = tasksInSameStatus.filter(task => task.id !== draggedTaskId);
    
    // 挿入位置を特定
    const targetIndex = tasksWithoutDragged.findIndex(task => task.id === targetTaskId);
    if (targetIndex === -1) return;
    
    // 挿入位置にドラッグしたタスクを挿入
    tasksWithoutDragged.splice(targetIndex, 0, draggedTask);
    
    // orderを再計算
    const updatedTasks = tasksWithoutDragged.map((task, index) => ({
      ...task,
      order: index
    }));
    
    // 状態を更新
    setTasks(prevTasks => 
      prevTasks.map(task => {
        const updatedTask = updatedTasks.find(t => t.id === task.id);
        if (updatedTask) {
          return updatedTask;
        }
        return task;
      })
    );
  };

  // 詳細モーダルコンポーネント
  const TaskDetailModal = ({ task, onClose }) => {
    const subtaskInputRef = React.useRef(null);
    const commentInputRef = React.useRef(null);
    const modalContentRef = React.useRef(null);
    const [currentTask, setCurrentTask] = useState(task);
    // 完全に独立したローカル状態として実装
    const [commentText, setCommentText] = useState('');
    const [modalScrollPosition, setModalScrollPosition] = useState(0);

    // タスクが変更された場合に更新
    useEffect(() => {
      if (task) {
        setCurrentTask(task);
      }
    }, [task]);

    // タスク一覧の状態が更新された場合にモーダル内のタスク情報を更新
    useEffect(() => {
      const taskId = currentTask?.id;
      if (taskId) {
        const updatedTask = tasks.find(t => t.id === taskId);
        if (updatedTask) {
          setCurrentTask(updatedTask);
        }
      }
    }, [tasks, currentTask?.id]);

    // スクロール位置を保持して復元
    const preserveScrollPosition = useCallback((callback) => {
      // 現在のスクロール位置を保存
      if (modalContentRef.current) {
        setModalScrollPosition(modalContentRef.current.scrollTop);
      }
      
      // コールバック実行
      callback();
      
      // スクロール位置を復元
      requestAnimationFrame(() => {
        if (modalContentRef.current) {
          modalContentRef.current.scrollTop = modalScrollPosition;
        }
      });
    }, [modalScrollPosition]);

    if (!currentTask) return null;

    const handleCommentSubmit = (e) => {
      e.preventDefault();
      if (commentText.trim()) {
        // 新しいコメントオブジェクトを作成
        const newComment = {
          id: Date.now(),
          text: commentText.trim(),
          createdAt: new Date().toISOString(),
        };
        
        // タスクの状態を直接更新
        setTasks(prevTasks => 
          prevTasks.map(t =>
            t.id === currentTask.id
              ? {
                  ...t,
                  comments: [...(t.comments || []), newComment],
                }
              : t
          )
        );
        
        // 入力欄をクリア
        setCommentText('');
        
        // フォーカスを維持
        requestAnimationFrame(() => {
          if (commentInputRef.current) {
            commentInputRef.current.focus();
          }
        });
      }
    };

    const handleCommentKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleCommentSubmit(e);
      }
    };

    const handleCommentInputChange = (e) => {
      setCommentText(e.target.value);
    };

    // サブタスク追加のハンドラ
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
        <div 
          ref={modalContentRef}
          className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
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
                      {sortSubtasksByDueDate(groupedSubtasks[TASK_STATUS.TODO]).map(subtask => (
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
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => demoteSubtask(currentTask.id, subtask.id)}
                                className="text-gray-500 hover:text-gray-700"
                                title="レベル下げ"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </div>
                            <input
                              type="checkbox"
                              checked={subtask.completed}
                              onChange={() => toggleSubtaskCompletion(currentTask.id, subtask.id)}
                              className="mr-2"
                            />
                            {editingSubtaskId && editingSubtaskId.taskId === currentTask.id && editingSubtaskId.subtaskId === subtask.id ? (
                              <form 
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  saveSubtaskEdit(currentTask.id, subtask.id);
                                }}
                                className="flex-1"
                              >
                                <input
                                  ref={subtaskEditRef}
                                  type="text"
                                  className="w-full border rounded px-1 py-0.5 text-sm"
                                  onBlur={() => saveSubtaskEdit(currentTask.id, subtask.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                      e.preventDefault();
                                      cancelSubtaskEdit();
                                    }
                                  }}
                                  style={{ marginLeft: `${(subtask.level || 0) * 20}px` }}
                                />
                              </form>
                            ) : (
                              <span 
                                className={`flex-1 ${subtask.completed ? 'line-through text-gray-400' : ''}`} 
                                style={{ marginLeft: `${(subtask.level || 0) * 20}px` }}
                                onDoubleClick={() => startEditingSubtask(currentTask.id, subtask.id, subtask.text)}
                              >
                                {subtask.text}
                              </span>
                            )}
                            <div className="flex items-center">
                              <select
                                className="text-xs p-0 border rounded mr-1"
                                value={subtask.status || TASK_STATUS.TODO}
                                onChange={(e) => updateSubtaskStatus(currentTask.id, subtask.id, e.target.value)}
                                style={{ maxWidth: '80px' }}
                              >
                                <option value={TASK_STATUS.TODO}>未</option>
                                <option value={TASK_STATUS.IN_PROGRESS}>進</option>
                                <option value={TASK_STATUS.DONE}>完</option>
                              </select>
                              <input
                                type="date"
                                className="text-xs p-0 border rounded mr-1"
                                value={subtask.dueDate || ''}
                                onChange={(e) => setSubtaskDueDate(currentTask.id, subtask.id, e.target.value)}
                                style={{ width: '110px' }}
                              />
                              <button
                                onClick={() => deleteSubtask(currentTask.id, subtask.id)}
                                className="text-red-500 hover:text-red-700 ml-1"
                                title="削除"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                              {subtask.dueDate && (
                                <>
                                  <span className="text-xs ml-1 mr-1 task-date">
                                    {formatDate(subtask.dueDate)}
                                  </span>
                                  <button
                                    className={`text-xs flex items-center ${
                                      subtask.isCalendarAdded
                                        ? 'text-green-700'
                                        : 'text-blue-500 hover:text-blue-700'
                                    }`}
                                    onClick={() => generateICSFile(currentTask, true, subtask)}
                                    title={subtask.isCalendarAdded ? "カレンダーに追加済み" : "カレンダーに追加"}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 進行中のサブタスク */}
                {groupedSubtasks[TASK_STATUS.IN_PROGRESS].length > 0 && (
                  <div className="border border-gray-200 rounded-md overflow-hidden mt-4">
                    <div className="bg-blue-100 py-2 px-3 font-medium">
                      進行中 ({groupedSubtasks[TASK_STATUS.IN_PROGRESS].length})
                    </div>
                    <div className="divide-y divide-gray-200">
                      {sortSubtasksByDueDate(groupedSubtasks[TASK_STATUS.IN_PROGRESS]).map(subtask => (
                        <div key={subtask.id} className="flex flex-col py-2 px-3 hover:bg-gray-50">
                          <div className="flex items-center">
                            <div className="flex items-center mr-2">
                              <button
                                onClick={() => promoteSubtask(currentTask.id, subtask.id)}
                                className="text-gray-500 hover:text-gray-700 mr-1"
                                title="レベル上げ"
                                disabled={(subtask.level || 0) === 0}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => demoteSubtask(currentTask.id, subtask.id)}
                                className="text-gray-500 hover:text-gray-700"
                                title="レベル下げ"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </div>
                            <input
                              type="checkbox"
                              checked={subtask.completed}
                              onChange={() => toggleSubtaskCompletion(currentTask.id, subtask.id)}
                              className="mr-2"
                            />
                            {editingSubtaskId && editingSubtaskId.taskId === currentTask.id && editingSubtaskId.subtaskId === subtask.id ? (
                              <form 
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  saveSubtaskEdit(currentTask.id, subtask.id);
                                }}
                                className="flex-1"
                              >
                                <input
                                  ref={subtaskEditRef}
                                  type="text"
                                  className="w-full border rounded px-1 py-0.5 text-sm"
                                  onBlur={() => saveSubtaskEdit(currentTask.id, subtask.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                      e.preventDefault();
                                      cancelSubtaskEdit();
                                    }
                                  }}
                                  style={{ marginLeft: `${(subtask.level || 0) * 20}px` }}
                                />
                              </form>
                            ) : (
                              <span 
                                className={`flex-1 ${subtask.completed ? 'line-through text-gray-400' : ''}`} 
                                style={{ marginLeft: `${(subtask.level || 0) * 20}px` }}
                                onDoubleClick={() => startEditingSubtask(currentTask.id, subtask.id, subtask.text)}
                              >
                                {subtask.text}
                              </span>
                            )}
                            <button
                              onClick={() => deleteSubtask(currentTask.id, subtask.id)}
                              className="text-red-500 hover:text-red-700 ml-2"
                              title="削除"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          
                          <div className="flex items-center mt-1 ml-8">
                            <select
                              className="text-xs p-0 border rounded mr-1"
                              value={subtask.status || TASK_STATUS.TODO}
                              onChange={(e) => updateSubtaskStatus(currentTask.id, subtask.id, e.target.value)}
                              style={{ maxWidth: '60px' }}
                            >
                              <option value={TASK_STATUS.TODO}>未</option>
                              <option value={TASK_STATUS.IN_PROGRESS}>進</option>
                              <option value={TASK_STATUS.DONE}>完</option>
                            </select>
                            <input
                              type="date"
                              className="text-xs p-0 border rounded mr-1"
                              value={subtask.dueDate || ''}
                              onChange={(e) => setSubtaskDueDate(currentTask.id, subtask.id, e.target.value)}
                              style={{ width: '110px' }}
                            />
                            {subtask.dueDate && (
                              <button
                                className={`text-xs flex items-center ml-1 ${
                                  subtask.isCalendarAdded
                                    ? 'text-green-700'
                                    : 'text-blue-500 hover:text-blue-700'
                                }`}
                                onClick={() => generateICSFile(currentTask, true, subtask)}
                                title={subtask.isCalendarAdded ? "カレンダーに追加済み" : "カレンダーに追加"}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 完了したサブタスク */}
                {groupedSubtasks[TASK_STATUS.DONE].length > 0 && (
                  <div className="border border-gray-200 rounded-md overflow-hidden mt-4">
                    <div className="bg-green-100 py-2 px-3 font-medium">
                      完了 ({groupedSubtasks[TASK_STATUS.DONE].length})
                    </div>
                    <div className="divide-y divide-gray-200">
                      {sortSubtasksByDueDate(groupedSubtasks[TASK_STATUS.DONE]).map(subtask => (
                        <div key={subtask.id} className="flex flex-col py-2 px-3 hover:bg-gray-50">
                          <div className="flex items-center">
                            <div className="flex items-center mr-2">
                              <button
                                onClick={() => promoteSubtask(currentTask.id, subtask.id)}
                                className="text-gray-500 hover:text-gray-700 mr-1"
                                title="レベル上げ"
                                disabled={(subtask.level || 0) === 0}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => demoteSubtask(currentTask.id, subtask.id)}
                                className="text-gray-500 hover:text-gray-700"
                                title="レベル下げ"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </div>
                            <input
                              type="checkbox"
                              checked={subtask.completed}
                              onChange={() => toggleSubtaskCompletion(currentTask.id, subtask.id)}
                              className="mr-2"
                            />
                            {editingSubtaskId && editingSubtaskId.taskId === currentTask.id && editingSubtaskId.subtaskId === subtask.id ? (
                              <form 
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  saveSubtaskEdit(currentTask.id, subtask.id);
                                }}
                                className="flex-1"
                              >
                                <input
                                  ref={subtaskEditRef}
                                  type="text"
                                  className="w-full border rounded px-1 py-0.5 text-sm"
                                  onBlur={() => saveSubtaskEdit(currentTask.id, subtask.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                      e.preventDefault();
                                      cancelSubtaskEdit();
                                    }
                                  }}
                                  style={{ marginLeft: `${(subtask.level || 0) * 20}px` }}
                                />
                              </form>
                            ) : (
                              <span 
                                className={`flex-1 ${subtask.completed ? 'line-through text-gray-400' : ''}`} 
                                style={{ marginLeft: `${(subtask.level || 0) * 20}px` }}
                                onDoubleClick={() => startEditingSubtask(currentTask.id, subtask.id, subtask.text)}
                              >
                                {subtask.text}
                              </span>
                            )}
                            <button
                              onClick={() => deleteSubtask(currentTask.id, subtask.id)}
                              className="text-red-500 hover:text-red-700 ml-2"
                              title="削除"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          
                          <div className="flex items-center mt-1 ml-8">
                            <select
                              className="text-xs p-0 border rounded mr-1"
                              value={subtask.status || TASK_STATUS.TODO}
                              onChange={(e) => updateSubtaskStatus(currentTask.id, subtask.id, e.target.value)}
                              style={{ maxWidth: '60px' }}
                            >
                              <option value={TASK_STATUS.TODO}>未</option>
                              <option value={TASK_STATUS.IN_PROGRESS}>進</option>
                              <option value={TASK_STATUS.DONE}>完</option>
                            </select>
                            <input
                              type="date"
                              className="text-xs p-0 border rounded mr-1"
                              value={subtask.dueDate || ''}
                              onChange={(e) => setSubtaskDueDate(currentTask.id, subtask.id, e.target.value)}
                              style={{ width: '110px' }}
                            />
                            {subtask.dueDate && (
                              <button
                                className={`text-xs flex items-center ml-1 ${
                                  subtask.isCalendarAdded
                                    ? 'text-green-700'
                                    : 'text-blue-500 hover:text-blue-700'
                                }`}
                                onClick={() => generateICSFile(currentTask, true, subtask)}
                                title={subtask.isCalendarAdded ? "カレンダーに追加済み" : "カレンダーに追加"}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </button>
                            )}
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
          <div className="mt-6">
            <h3 className="font-semibold text-gray-700 mb-2">コメント</h3>
            
            {/* コメント一覧 */}
            <div className="space-y-3 mb-4">
              {currentTask.comments && currentTask.comments.length > 0 ? (
                currentTask.comments.map(comment => (
                  <div key={comment.id} className="bg-gray-50 p-3 rounded border border-gray-200">
                    <div className="flex justify-between items-start">
                      <p className="whitespace-pre-wrap">{comment.text}</p>
                      <button
                        onClick={() => deleteComment(currentTask.id, comment.id)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(comment.createdAt)}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic">コメントはまだありません</p>
              )}
            </div>
            
            {/* コメント入力フォーム */}
            <form onSubmit={handleCommentSubmit}>
              <textarea
                ref={commentInputRef}
                placeholder="コメントを入力..."
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                rows="3"
                value={commentText}
                onChange={handleCommentInputChange}
                onKeyDown={handleCommentKeyDown}
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

  // プロジェクトのドラッグ開始ハンドラー
  const handleProjectDragStart = (projectName, e) => {
    setDraggedProject(projectName);
    
    // ドラッグ中のプレビュー画像を設定
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
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
  
  // プロジェクトのドラッグ終了ハンドラー
  const handleProjectDragEnd = () => {
    setDraggedProject(null);
  };
  
  // プロジェクトのドロップハンドラー
  const handleProjectDrop = (targetProject) => {
    if (!draggedProject || draggedProject === targetProject) return;
    
    const projects = getProjects();
    
    // 現在の順序を取得
    const currentOrder = { ...projectOrder };
    
    // ドラッグしたプロジェクトと対象プロジェクトのインデックスを取得
    const draggedIndex = projects.indexOf(draggedProject);
    const targetIndex = projects.indexOf(targetProject);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // プロジェクトの位置を入れ替え
    const newProjects = [...projects];
    newProjects.splice(draggedIndex, 1);
    newProjects.splice(targetIndex, 0, draggedProject);
    
    // 新しい順序を設定
    const newOrder = {};
    newProjects.forEach((project, index) => {
      newOrder[project] = index;
    });
    
    setProjectOrder(newOrder);
    setDraggedProject(null);
  };

  // プロジェクトを上に移動
  const moveProjectUp = (projectName, status) => {
    console.log('moveProjectUp called for project:', projectName, 'in status:', status);
    
    // 現在のカラムで表示されているプロジェクトを取得
    const filteredTasks = getFilteredTasks(status);
    const projectsInColumn = [...new Set(filteredTasks.map(task => task.project))]
      .filter(project => project && project.trim() !== '');
    
    // 現在の順序を取得
    const currentProjectOrder = { ...projectOrder };
    console.log('Current project order:', currentProjectOrder);
    console.log('Projects in this column:', projectsInColumn);
    
    // カラム内でのプロジェクトの位置を取得
    const sortedProjects = projectsInColumn.sort((a, b) => {
      // 順序が未定義の場合は、とりあえず大きな値を設定
      const orderA = currentProjectOrder[a] !== undefined ? currentProjectOrder[a] : Number.MAX_SAFE_INTEGER;
      const orderB = currentProjectOrder[b] !== undefined ? currentProjectOrder[b] : Number.MAX_SAFE_INTEGER;
      if (orderA === orderB) {
        return a.localeCompare(b);
      }
      return orderA - orderB;
    });
    
    const index = sortedProjects.indexOf(projectName);
    console.log('Project index in sorted list:', index);
    
    // すでに最上部にある場合は何もしない
    if (index <= 0) {
      console.log('Project already at the top');
      return;
    }
    
    // 1つ上のプロジェクトと順序を入れ替え
    const projectAbove = sortedProjects[index - 1];
    console.log('Swapping with project above:', projectAbove);
    
    // 新しい順序を設定
    const newOrder = { ...currentProjectOrder };
    
    // 順序が未定義の場合は、まず順序を初期化
    if (newOrder[projectName] === undefined && newOrder[projectAbove] === undefined) {
      // 両方未定義の場合
      newOrder[projectName] = 0;
      newOrder[projectAbove] = 1;
    } else if (newOrder[projectName] === undefined) {
      // 移動するプロジェクトのみ未定義の場合
      newOrder[projectName] = newOrder[projectAbove] - 1;
    } else if (newOrder[projectAbove] === undefined) {
      // 上のプロジェクトのみ未定義の場合
      newOrder[projectAbove] = newOrder[projectName] + 1;
    } else {
      // 両方定義済みの場合は順序を入れ替え
      const tempOrder = newOrder[projectName];
      newOrder[projectName] = newOrder[projectAbove];
      newOrder[projectAbove] = tempOrder;
    }
    
    console.log('New project order after swap:', newOrder);
    setProjectOrder(newOrder);
  };
  
  // プロジェクトを下に移動
  const moveProjectDown = (projectName, status) => {
    console.log('moveProjectDown called for project:', projectName, 'in status:', status);
    
    // 現在のカラムで表示されているプロジェクトを取得
    const filteredTasks = getFilteredTasks(status);
    const projectsInColumn = [...new Set(filteredTasks.map(task => task.project))]
      .filter(project => project && project.trim() !== '');
    
    // 現在の順序を取得
    const currentProjectOrder = { ...projectOrder };
    console.log('Current project order:', currentProjectOrder);
    console.log('Projects in this column:', projectsInColumn);
    
    // カラム内でのプロジェクトの位置を取得
    const sortedProjects = projectsInColumn.sort((a, b) => {
      // 順序が未定義の場合は、とりあえず大きな値を設定
      const orderA = currentProjectOrder[a] !== undefined ? currentProjectOrder[a] : Number.MAX_SAFE_INTEGER;
      const orderB = currentProjectOrder[b] !== undefined ? currentProjectOrder[b] : Number.MAX_SAFE_INTEGER;
      if (orderA === orderB) {
        return a.localeCompare(b);
      }
      return orderA - orderB;
    });
    
    const index = sortedProjects.indexOf(projectName);
    console.log('Project index in sorted list:', index);
    
    // すでに最下部にある場合は何もしない
    if (index >= sortedProjects.length - 1) {
      console.log('Project already at the bottom');
      return;
    }
    
    // 1つ下のプロジェクトと順序を入れ替え
    const projectBelow = sortedProjects[index + 1];
    console.log('Swapping with project below:', projectBelow);
    
    // 新しい順序を設定
    const newOrder = { ...currentProjectOrder };
    
    // 順序が未定義の場合は、まず順序を初期化
    if (newOrder[projectName] === undefined && newOrder[projectBelow] === undefined) {
      // 両方未定義の場合
      newOrder[projectName] = 1;
      newOrder[projectBelow] = 0;
    } else if (newOrder[projectName] === undefined) {
      // 移動するプロジェクトのみ未定義の場合
      newOrder[projectName] = newOrder[projectBelow] + 1;
    } else if (newOrder[projectBelow] === undefined) {
      // 下のプロジェクトのみ未定義の場合
      newOrder[projectBelow] = newOrder[projectName] - 1;
    } else {
      // 両方定義済みの場合は順序を入れ替え
      const tempOrder = newOrder[projectName];
      newOrder[projectName] = newOrder[projectBelow];
      newOrder[projectBelow] = tempOrder;
    }
    
    console.log('New project order after swap:', newOrder);
    setProjectOrder(newOrder);
  };

  useEffect(() => {
    handleVersionUpdate();
  }, []);

  const handleVersionUpdate = () => {
    setVersion(prev => {
      const [major, minor, patch] = prev.split('.').map(Number);
      return `${major}.${minor}.${patch + 1}`;
    });
  };

  // カレンダーエクスポートコンポーネント
  const CalendarExportButton = ({ task, isSubtask = false, subtask = null }) => {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          generateICSFile(task, isSubtask, subtask);
        }}
        className="text-blue-500 hover:text-blue-700"
        title="カレンダーに追加"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>
    );
  };
  
  // サブタスクのステータス表示コンポーネント
  const SubtaskStatusLabel = ({ status }) => {
    let label, className;
    
    switch (status) {
      case TASK_STATUS.TODO:
        label = '未';
        className = 'bg-gray-100 text-gray-700';
        break;
      case TASK_STATUS.IN_PROGRESS:
        label = '進';
        className = 'bg-blue-100 text-blue-700';
        break;
      case TASK_STATUS.DONE:
        label = '完';
        className = 'bg-green-100 text-green-700';
        break;
      default:
        label = '未';
        className = 'bg-gray-100 text-gray-700';
    }
    
    return (
      <span 
        className={`px-1.5 py-0.5 rounded text-xs font-medium ${className}`}
        title={status === TASK_STATUS.TODO ? '未着手' : status === TASK_STATUS.IN_PROGRESS ? '進行中' : '完了'}
      >
        {label}
      </span>
    );
  };

  // データをJSONファイルとしてエクスポートする関数
  const exportData = () => {
    const data = {
      tasks: tasks,
      projectOrder: projectOrder
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `kanban-tasks-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // JSONファイルからデータをインポートする関数
  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.tasks && Array.isArray(data.tasks)) {
          setTasks(data.tasks);
          if (data.projectOrder) {
            setProjectOrder(data.projectOrder);
          }
          alert('データを正常にインポートしました。');
        } else {
          alert('無効なデータ形式です。');
        }
      } catch (error) {
        alert('データの解析中にエラーが発生しました: ' + error.message);
      }
    };
    reader.readAsText(file);
    
    // ファイル選択をリセット（同じファイルを再度選択できるように）
    event.target.value = '';
  };
  
  // ファイル選択ダイアログを開く
  const openFileDialog = () => {
    fileInputRef.current.click();
  };

  // ビュータイプが変更されたら保存
  useEffect(() => {
    localStorage.setItem('kanban-view-type', viewType);
  }, [viewType]);

  // 表形式ビューでのソート処理
  const handleTableSort = (column) => {
    setTableSorting(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // ソートされたタスクリストを取得
  const getSortedTasks = () => {
    // すべてのタスクをフラット化（サブタスクも含める）
    const allTasks = [...tasks];
    
    // サブタスクを独立したタスクとして変換して追加
    tasks.forEach(task => {
      if (task.subtasks && task.subtasks.length > 0) {
        task.subtasks.forEach(subtask => {
          allTasks.push({
            ...subtask,
            isSubtask: true,
            parentTaskId: task.id,
            parentTaskTitle: task.title,
            project: task.project
          });
        });
      }
    });
    
    // フィルター適用
    let filteredTasks = allTasks;
    
    // プロジェクトフィルター
    if (projectFilter !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.project === projectFilter);
    }
    
    // 期限フィルター
    if (filter === 'due-soon') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const threeDaysLater = new Date(today);
      threeDaysLater.setDate(today.getDate() + 3);
      
      filteredTasks = filteredTasks.filter(task => {
        if (!task.dueDate) return false;
        
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        return dueDate >= today && dueDate <= threeDaysLater;
      });
    } else if (filter === 'overdue') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      filteredTasks = filteredTasks.filter(task => {
        if (!task.dueDate) return false;
        
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        return dueDate < today;
      });
    }
    
    // ソート処理
    return filteredTasks.sort((a, b) => {
      const { column, direction } = tableSorting;
      const multiplier = direction === 'asc' ? 1 : -1;
      
      switch (column) {
        case 'project':
          return multiplier * (a.project || '').localeCompare(b.project || '');
        
        case 'title':
          return multiplier * (a.title || a.text || '').localeCompare(b.title || b.text || '');
        
        case 'status':
          return multiplier * (a.status || '').localeCompare(b.status || '');
        
        case 'dueDate':
          // 日付でソート（日付がないものは後ろに）
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return multiplier * 1;
          if (!b.dueDate) return multiplier * -1;
          return multiplier * (new Date(a.dueDate) - new Date(b.dueDate));
        
        default:
          return 0;
      }
    });
  };

  // 表形式ビューコンポーネント
  const TableView = () => {
    const sortedTasks = getSortedTasks();
    
    // ソートの方向を示すアイコン
    const SortIcon = ({ column }) => {
      if (tableSorting.column !== column) {
        return <span className="text-gray-300">↕</span>;
      }
      return (
        <span className="text-blue-500">
          {tableSorting.direction === 'asc' ? '↑' : '↓'}
        </span>
      );
    };
    
    return (
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleTableSort('project')}>
                プロジェクト <SortIcon column="project" />
              </th>
              <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleTableSort('title')}>
                タスク <SortIcon column="title" />
              </th>
              <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleTableSort('status')}>
                ステータス <SortIcon column="status" />
              </th>
              <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleTableSort('dueDate')}>
                納期 <SortIcon column="dueDate" />
              </th>
              <th className="py-3 px-6 text-center">アクション</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm">
            {sortedTasks.map(task => (
              <tr key={`${task.isSubtask ? 'sub-' : ''}${task.id}`} className="border-b hover:bg-gray-50">
                <td className="py-3 px-6 text-left">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: getProjectColor(task.project || 'その他') }}
                    ></div>
                    <span>{task.project || 'その他'}</span>
                  </div>
                </td>
                <td className="py-3 px-6 text-left">
                  <div className="flex items-center">
                    {task.isSubtask && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                      </svg>
                    )}
                    <span className={task.isSubtask ? "text-gray-500 ml-4" : "font-medium"}>
                      {task.title || task.text}
                    </span>
                    {task.isSubtask && (
                      <span className="text-xs text-gray-400 ml-2">
                        (親: {task.parentTaskTitle})
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-6 text-left">
                  <span className={`py-1 px-3 rounded-full text-xs ${
                    task.status === TASK_STATUS.TODO 
                      ? 'bg-gray-200 text-gray-600' 
                      : task.status === TASK_STATUS.IN_PROGRESS 
                        ? 'bg-blue-200 text-blue-600' 
                        : 'bg-green-200 text-green-600'
                  }`}>
                    {task.status === TASK_STATUS.TODO ? '未着手' :
                     task.status === TASK_STATUS.IN_PROGRESS ? '進行中' : '完了'}
                  </span>
                </td>
                <td className="py-3 px-6 text-left">
                  <span className={`${getDueDateClassName(task.dueDate, task.status === TASK_STATUS.DONE)}`}>
                    {task.dueDate ? formatDate(task.dueDate) : '未設定'}
                  </span>
                </td>
                <td className="py-3 px-6 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <button 
                      onClick={() => task.isSubtask 
                        ? startEditingSubtask(task.parentTaskId, task.id, task.text)
                        : startEditing(task.id, task.title, task.dueDate, task.project)
                      }
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => {
                        if (window.confirm(`${task.isSubtask ? 'サブタスク' : 'タスク'}を削除してもよろしいですか？`)) {
                          task.isSubtask 
                            ? deleteSubtask(task.parentTaskId, task.id) 
                            : deleteTask(task.id);
                        }
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    {!task.isSubtask && (
                      <button 
                        onClick={() => setCurrentTaskForModal(task)}
                        className="text-purple-500 hover:text-purple-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {sortedTasks.length === 0 && (
              <tr>
                <td colSpan="5" className="py-4 text-center text-gray-500">
                  表示するタスクがありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // メインのレンダリング部分
  return (
    <div className="flex flex-col max-w-8xl mx-auto px-2 sm:px-6 py-4">
      <style>{customStyles}</style>
      
      {/* ヘッダー部分 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 sm:mb-0">
          かんばんボード
          <span className="text-sm font-normal text-gray-500 ml-2">v{version}</span>
        </h1>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* プロジェクトフィルター */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="bg-white border rounded px-3 py-1 text-sm"
          >
            <option value="all">すべてのプロジェクト</option>
            {getProjects().map(project => (
              <option key={project} value={project}>{project}</option>
            ))}
          </select>
          
          {/* フィルター */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white border rounded px-3 py-1 text-sm"
          >
            <option value="all">すべてのタスク</option>
            <option value="due-soon">期限間近</option>
            <option value="overdue">期限超過</option>
          </select>
          
          {/* 表示方法切り替え */}
          <div className="flex border rounded overflow-hidden">
            <button
              onClick={() => setViewType('kanban')}
              className={`px-3 py-1 text-sm ${viewType === 'kanban' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'}`}
            >
              カンバン
            </button>
            <button
              onClick={() => setViewType('table')}
              className={`px-3 py-1 text-sm ${viewType === 'table' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'}`}
            >
              表形式
            </button>
          </div>
          
          {/* エクスポート/インポートボタン */}
          <button
            onClick={exportData}
            className="bg-gray-200 hover:bg-gray-300 rounded px-3 py-1 text-sm flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
            </svg>
            エクスポート
          </button>
          
          <button
            onClick={openFileDialog}
            className="bg-gray-200 hover:bg-gray-300 rounded px-3 py-1 text-sm flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            インポート
          </button>
          <input
            type="file"
            id="file-input"
            accept=".json"
            onChange={importData}
            style={{ display: 'none' }}
          />
          
          {/* カレンダーエクスポート */}
          <button
            onClick={exportAllTasksToCalendar}
            className="bg-gray-200 hover:bg-gray-300 rounded px-3 py-1 text-sm flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            カレンダーに追加
          </button>
          
          {/* 表示切替 */}
          <button
            onClick={() => setViewMode(viewMode === 'normal' ? 'project' : 'normal')}
            className={`rounded px-3 py-1 text-sm flex items-center ${viewMode === 'project' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            {viewMode === 'project' ? 'タスク表示' : 'プロジェクト表示'}
          </button>
        </div>
      </div>
      
      {/* 新規タスク入力フォーム */}
      <div className="bg-white p-4 rounded shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <input
              type="text"
              ref={taskInputRef}
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="新しいタスクを入力..."
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex space-x-2">
            <input
              type="date"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
              className="px-2 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={newTaskProject}
              onChange={(e) => setNewTaskProject(e.target.value)}
              placeholder="プロジェクト名"
              className="px-2 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              list="projects-list"
            />
            <datalist id="projects-list">
              {getProjects().map(project => (
                <option key={project} value={project} />
              ))}
            </datalist>
            <button
              onClick={addTask}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              追加
            </button>
          </div>
        </div>
      </div>
      
      {/* タスク統計 */}
      <div className="flex flex-wrap justify-between mb-4 text-sm text-gray-600 space-x-2">
        <div className="flex space-x-4">
          <div>総タスク数: <span className="font-bold">{getTaskStats().total}</span></div>
          <div>未着手: <span className="font-bold">{getTaskStats().todo}</span></div>
          <div>進行中: <span className="font-bold">{getTaskStats().inProgress}</span></div>
          <div>完了: <span className="font-bold">{getTaskStats().done}</span></div>
        </div>
      </div>
      
      {/* メインコンテンツ - 表示方法に応じて切り替え */}
      {viewType === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      ) : (
        <TableView />
      )}
      
      {/* タスク詳細モーダル */}
      {currentTaskForModal && (
        <TaskDetailModal
          task={currentTaskForModal}
          onClose={() => setCurrentTaskForModal(null)}
        />
      )}
      
      {/* ファイルインポート用の隠し入力 */}
      <input
        type="file"
        id="fileInput"
        accept=".json"
        style={{ display: 'none' }}
        onChange={importData}
      />
    </div>
  );
};

export default TaskManagementApp;
