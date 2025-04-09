  };

  // 繧ｿ繧ｹ繧ｯ隧ｳ邏ｰ繝｢繝ｼ繝繝ｫ
  const TaskDetailModal = ({ task, onClose }) => {
    const [newComment, setNewComment] = useState('');
    const [commentText, setCommentText] = useState('');
    const [newSubtask, setNewSubtask] = useState('');
    const [localSubtasks, setLocalSubtasks] = useState((task && task.subtasks) || []);
    
    useEffect(() => {
      // 繧ｿ繧ｹ繧ｯ縺悟､画峩縺輔ｌ縺溷ｴ蜷医√Ο繝ｼ繧ｫ繝ｫ縺ｮ繧ｵ繝悶ち繧ｹ繧ｯ繧呈峩譁ｰ
      if (task) {
        setLocalSubtasks(sortSubtasksByDueDate(task.subtasks || []));
      }
    }, [task]);
    
    // null繝√ぉ繝・け繧定ｿｽ蜉
    if (!task) {
      return null;
    }
    
    // 繧ｵ繝悶ち繧ｹ繧ｯ繧堤ｷ繧∝・繧頑律縺ｧ荳ｦ縺ｹ譖ｿ縺・
    const getSortedSubtasks = (statusFilter = null) => {
      const filteredSubtasks = statusFilter 
        ? localSubtasks.filter(st => st.status === statusFilter)
        : localSubtasks;
      
      return sortSubtasksByDueDate(filteredSubtasks);
    };
    
    // 繧ｵ繝悶ち繧ｹ繧ｯ繧偵せ繝・・繧ｿ繧ｹ縺ｧ繧ｰ繝ｫ繝ｼ繝怜喧
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
          // 螳御ｺ・せ繝・・繧ｿ繧ｹ縺ｮ蝣ｴ蜷医…ompleted繧る｣蜍輔＠縺ｦ譖ｴ譁ｰ
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
    
    // 繧ｳ繝｡繝ｳ繝磯未騾｣縺ｮ讖溯・
    const handleAddComment = (e) => {
      e.preventDefault();
      if (commentText.trim() !== '') {
        addCommentToTask(task.id, commentText);
        setCommentText('');
      }
    };
    
    // 繝｢繝ｼ繝繝ｫ縺ｮ螟門・繧ｯ繝ｪ繝・け縺ｧ髢峨§繧・
    const handleModalClick = (e) => {
      if (e.target.classList.contains('modal-background')) {
        onClose();
      }
    };
    
    // 蜷・せ繝・・繧ｿ繧ｹ縺ｮ繧ｵ繝悶ち繧ｹ繧ｯ繧定｡ｨ遉ｺ
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
          {/* 繝倥ャ繝繝ｼ */}
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
          
          {/* 繧ｳ繝ｳ繝・Φ繝・お繝ｪ繧｢ */}
          <div className="flex flex-grow overflow-hidden">
            {/* 繝｡繧､繝ｳ諠・ｱ */}
            <div className="w-2/3 p-4 overflow-y-auto">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium">隧ｳ邏ｰ諠・ｱ</h3>
                  <button
                    onClick={() => startEditing(task.id, task.title, task.dueDate, task.project)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    邱ｨ髮・
                  </button>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">繧ｹ繝・・繧ｿ繧ｹ</p>
                      <div className="mt-1">
                        <select
                          className="border rounded p-1 w-full"
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                        >
                          <option value={TASK_STATUS.TODO}>譛ｪ逹謇・/option>
                          <option value={TASK_STATUS.IN_PROGRESS}>騾ｲ陦御ｸｭ</option>
                          <option value={TASK_STATUS.DONE}>螳御ｺ・/option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">邱繧∝・繧・/p>
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
                      <p className="text-sm text-gray-500">繝励Ο繧ｸ繧ｧ繧ｯ繝・/p>
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
                      <p className="text-sm text-gray-500">菴懈・譌･</p>
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
                        繧ｫ繝ｬ繝ｳ繝繝ｼ縺ｫ霑ｽ蜉
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 繧ｵ繝悶ち繧ｹ繧ｯ */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">繧ｵ繝悶ち繧ｹ繧ｯ 
                  <span className="text-sm text-gray-500 ml-2">
                    {completedSubtasksCount}/{allSubtasksCount} 螳御ｺ・({progressPercentage}%)
                  </span>
                </h3>
                
                {/* 繧ｵ繝悶ち繧ｹ繧ｯ騾ｲ謐励ヰ繝ｼ */}
                {allSubtasksCount > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                )}
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  {/* 譁ｰ隕上し繝悶ち繧ｹ繧ｯ霑ｽ蜉繝輔か繝ｼ繝 */}
                  <div className="flex mb-4">
                    <input
                      type="text"
                      className="flex-grow border rounded-l px-2 py-1"
                      placeholder="譁ｰ縺励＞繧ｵ繝悶ち繧ｹ繧ｯ繧定ｿｽ蜉"
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
                      霑ｽ蜉
                    </button>
                  </div>
                  
                  {/* 繧ｵ繝悶ち繧ｹ繧ｯ繝ｪ繧ｹ繝・- 繧ｹ繝・・繧ｿ繧ｹ蛻･縺ｫ陦ｨ遉ｺ */}
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
                                  <option value={TASK_STATUS.TODO}>譛ｪ逹謇・/option>
                                  <option value={TASK_STATUS.IN_PROGRESS}>騾ｲ陦御ｸｭ</option>
                                  <option value={TASK_STATUS.DONE}>螳御ｺ・/option>
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
                      </div>
                    )
                  ))}
                  
                  {allSubtasksCount === 0 && (
                    <p className="text-gray-500 text-center py-2">繧ｵ繝悶ち繧ｹ繧ｯ縺ｯ縺ゅｊ縺ｾ縺帙ｓ</p>
                  )}
                </div>
              </div>
              
              {/* 繧ｳ繝｡繝ｳ繝・*/}
              <div>
                <h3 className="text-lg font-medium mb-2">繧ｳ繝｡繝ｳ繝・/h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  {/* 繧ｳ繝｡繝ｳ繝亥・蜉帙ヵ繧ｩ繝ｼ繝 */}
                  <form onSubmit={handleAddComment} className="mb-4">
                    <textarea
                      className="w-full border rounded p-2 mb-2"
                      rows="2"
                      placeholder="繧ｳ繝｡繝ｳ繝医ｒ蜈･蜉・.."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    ></textarea>
                    <button
                      type="submit"
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      繧ｳ繝｡繝ｳ繝郁ｿｽ蜉
                    </button>
                  </form>
                  
                  {/* 繧ｳ繝｡繝ｳ繝医Μ繧ｹ繝・*/}
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
                              title="蜑企勁"
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
                      <p className="text-gray-500 text-center py-2">繧ｳ繝｡繝ｳ繝医・縺ゅｊ縺ｾ縺帙ｓ</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* 繧ｵ繧､繝峨ヰ繝ｼ */}
            <div className="w-1/3 bg-gray-50 p-4 overflow-y-auto border-l">
              <h3 className="text-lg font-medium mb-3">繧｢繧ｯ繧ｷ繝ｧ繝ｳ</h3>
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
                  {task.status === TASK_STATUS.DONE ? '譛ｪ螳御ｺ・↓謌ｻ縺・ : '螳御ｺ・↓縺吶ｋ'}
                </button>
                <button
                  onClick={() => {
                    deleteTask(task.id);
                    onClose();
                  }}
                  className="w-full p-2 rounded bg-red-500 text-white hover:bg-red-600"
                >
                  繧ｿ繧ｹ繧ｯ繧貞炎髯､
                </button>
                {task.dueDate && (
                  <button
                    onClick={() => generateICSFile(task)}
                    className="w-full p-2 rounded bg-purple-500 text-white hover:bg-purple-600 flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    繧ｫ繝ｬ繝ｳ繝繝ｼ縺ｫ霑ｽ蜉
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 繧ｿ繧ｹ繧ｯ縺ｮ繧ｹ繝・・繧ｿ繧ｹ縺ｫ蠢懊§縺溯レ譎ｯ濶ｲ繧貞叙蠕・
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
  
  // 繧ｹ繝・・繧ｿ繧ｹ縺ｮ陦ｨ遉ｺ繝・く繧ｹ繝医ｒ蜿門ｾ・
  const getStatusText = (status) => {
    switch (status) {
      case TASK_STATUS.TODO:
        return '譛ｪ逹謇・;
      case TASK_STATUS.IN_PROGRESS:
        return '騾ｲ陦御ｸｭ';
      case TASK_STATUS.DONE:
        return '螳御ｺ・;
      default:
        return '譛ｪ逹謇・;
    }
  };
  
  // 譎る俣縺ｮ繝輔か繝ｼ繝槭ャ繝・(HH:MM)
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };
  
  // 繧ｿ繧ｹ繧ｯ縺ｫ繧ｳ繝｡繝ｳ繝医ｒ霑ｽ蜉
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
  
  // 繧ｿ繧ｹ繧ｯ縺九ｉ繧ｳ繝｡繝ｳ繝医ｒ蜑企勁
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
  
  // 繧ｿ繧ｹ繧ｯ縺ｮ繝励Ο繧ｸ繧ｧ繧ｯ繝医ｒ譖ｴ譁ｰ
  const updateTaskProject = (taskId, project) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, project } 
          : task
      )
    );
  };
  
  // 繧ｿ繧ｹ繧ｯ縺ｮ邱繧∝・繧頑律繧呈峩譁ｰ
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
      <h1 className="text-2xl font-bold text-center mb-4">繧ｫ繝ｳ繝舌Φ蠑上ち繧ｹ繧ｯ邂｡逅・v1.0.1</h1>
      
      {/* 譁ｰ縺励＞繧ｿ繧ｹ繧ｯ蜈･蜉帙ヵ繧ｩ繝ｼ繝 */}
      <div className="mb-4">
        <div className="flex mb-2">
          <input
            type="text"
            className="flex-grow p-2 border rounded-l"
            placeholder="譁ｰ縺励＞繧ｿ繧ｹ繧ｯ繧貞・蜉・.."
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
            霑ｽ蜉
          </button>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">邱繧∝・繧頑律・・/label>
            <input
              type="date"
              className="w-full p-2 border rounded"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">繝励Ο繧ｸ繧ｧ繧ｯ繝茨ｼ・/label>
            <div className="flex">
              <input
                type="text"
                className="flex-grow p-2 border rounded-l"
                placeholder="繝励Ο繧ｸ繧ｧ繧ｯ繝亥錐..."
                list="project-list"
                value={newTaskProject}
                onChange={(e) => setNewTaskProject(e.target.value)}
                style={{ imeMode: 'active' }}
              />
              <button
                className="bg-gray-200 p-2 rounded-r text-gray-700"
                onClick={() => setNewTaskProject('')}
              >
                繧ｯ繝ｪ繧｢
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
      
      {/* 繝輔ぅ繝ｫ繧ｿ繝ｼ縺ｨ繧ｫ繝ｬ繝ｳ繝繝ｼ繧ｨ繧ｯ繧ｹ繝昴・繝医・繧ｿ繝ｳ */}
      <div className="mb-4">
        <div className="flex flex-wrap justify-between mb-2">
          <div className="flex flex-wrap">
            <button
              className={`m-1 px-3 py-1 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setFilter('all')}
            >
              縺吶∋縺ｦ
            </button>
            <button
              className={`m-1 px-3 py-1 rounded ${filter === 'due-soon' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setFilter('due-soon')}
            >
              譛滄剞髢楢ｿ・
            </button>
            <button
              className={`m-1 px-3 py-1 rounded ${filter === 'overdue' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setFilter('overdue')}
            >
              譛滄剞蛻・ｌ
            </button>
          </div>
          <button
            className="m-1 px-3 py-1 rounded bg-purple-500 text-white flex items-center hover:bg-purple-600 transition-colors"
            onClick={exportAllTasksToCalendar}
            title="縺吶∋縺ｦ縺ｮ繧ｿ繧ｹ繧ｯ繧偵き繝ｬ繝ｳ繝繝ｼ縺ｫ霑ｽ蜉"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            繧ｫ繝ｬ繝ｳ繝繝ｼ蜃ｺ蜉・
          </button>
        </div>
        
        {/* 繝励Ο繧ｸ繧ｧ繧ｯ繝医ヵ繧｣繝ｫ繧ｿ繝ｼ */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              className={`px-3 py-1 text-sm rounded-l ${projectFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setProjectFilter('all')}
            >
              蜈ｨ繝励Ο繧ｸ繧ｧ繧ｯ繝・
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
      {/* 繧ｫ繝ｳ繝舌Φ繝懊・繝・*/}
      <div className="min-w-[500px] w-full flex flex-row justify-evenly overflow-x-auto pb-4 h-[calc(100vh-200px)]"
      style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', width: '100%',minwidth: '350px'}}>
        <KanbanColumn 
          title="譛ｪ逹謇・ 
          status={TASK_STATUS.TODO}
          tasks={getFilteredTasks(TASK_STATUS.TODO)} 
        />
        <KanbanColumn 
          title="騾ｲ陦御ｸｭ" 
          status={TASK_STATUS.IN_PROGRESS}
          tasks={getFilteredTasks(TASK_STATUS.IN_PROGRESS)} 
        />
        <KanbanColumn 
          title="螳御ｺ・ 
          status={TASK_STATUS.DONE}
          tasks={getFilteredTasks(TASK_STATUS.DONE)} 
        />
      </div>

      {/* 謫堺ｽ懊ぎ繧､繝・*/}
      <div className="mt-4 bg-blue-50 p-3 rounded text-sm text-blue-700">
        <p>菴ｿ縺・婿: 繧ｿ繧ｹ繧ｯ繧ｫ繝ｼ繝峨ｒ讓ｪ譁ｹ蜷代↓繝峨Λ繝・げ・・ラ繝ｭ繝・・縺励※迥ｶ諷九ｒ螟画峩縺ｧ縺阪∪縺吶ゅき繝ｼ繝峨ｒ縺､縺九ｓ縺ｧ蟾ｦ蜿ｳ縺ｫ遘ｻ蜍輔＠縺ｦ縺ｿ縺ｾ縺励ｇ縺・・/p>
        <p className="mt-1">繧ｫ繝ｬ繝ｳ繝繝ｼ騾｣謳ｺ: 蜷・ち繧ｹ繧ｯ縺ｮ縲御ｺ亥ｮ夊ｿｽ蜉縲阪・繧ｿ繝ｳ繧偵け繝ｪ繝・け縺吶ｋ縺ｨ.ics繝輔ぃ繧､繝ｫ縺後ム繧ｦ繝ｳ繝ｭ繝ｼ繝峨＆繧後＾utlook縺ｪ縺ｩ縺ｮ繧ｫ繝ｬ繝ｳ繝繝ｼ縺ｫ莠亥ｮ壹→縺励※霑ｽ蜉縺ｧ縺阪∪縺吶・/p>
      </div>
      
      {/* 繝輔ャ繧ｿ繝ｼ諠・ｱ */}
      <div className="mt-4 text-center text-sm text-gray-500">
        {(() => {
          const stats = getTaskStats();
          return (
            <p>
              繧ｿ繧ｹ繧ｯ謨ｰ: {stats.total}蛟・
              (譛ｪ逹謇・ {stats.todo}縲・
              騾ｲ陦御ｸｭ: {stats.inProgress}縲・
              螳御ｺ・ {stats.done})
            </p>
          );
        })()}
      </div>

      {/* 繧ｿ繧ｹ繧ｯ隧ｳ邏ｰ繝｢繝ｼ繝繝ｫ */}
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
