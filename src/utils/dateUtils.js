/**
 * 日付に関するユーティリティ関数を提供します
 */

/**
 * 日付文字列を MM/DD 形式にフォーマットします
 * @param {string} dateString - ISO形式の日付文字列
 * @returns {string} フォーマットされた日付
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
};

/**
 * 締め切り日の状態に基づいてスタイルクラスを返します
 * @param {string} dueDate - ISO形式の日付文字列
 * @param {boolean} isCompleted - タスクが完了しているかどうか
 * @returns {string} 適用するCSSクラス名
 */
export const getDueDateClassName = (dueDate, isCompleted) => {
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