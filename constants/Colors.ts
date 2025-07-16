/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

export default {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#EEEEEE',
    background: '#0A0A0A',
    tint: '#AA0000',
    tabIconDefault: '#ccc',
    tabIconSelected: '#AA0000',
  },
};

// テーマタイプ
export type ThemeType = 'light' | 'dark';

// ライトモードカラーパレット
const lightColors = {
  // 背景色
  background: '#FFFFFF',
  backgroundSecondary: '#F5F5F5',
  
  // ノード色
  nodeNormal: '#AA0000',
  nodeSelected: '#FF3333',
  nodeCriticism: '#660000',
  nodeIntegration: '#CC4444',
  
  // テキスト色
  textPrimary: '#EEEEEE', // ダークモードと同じ色に統一
  textSecondary: '#CCCCCC', // ダークモードと同じ色に統一
  textMuted: '#888888', // ダークモードと同じ色に統一
  
  // 関係線色
  connectionLine: '#AA0000',
  connectionLineSelected: '#FF3333',
  connectionLineCriticism: '#660000',
  
  // 批評ブランチ色
  criticismBranch: '#660000',
  criticismBranchSelected: '#AA0000',
  
  // 統合ノード色
  integrationNode: '#CC4444',
  integrationNodeSelected: '#FF6666',
  
  // UI要素色
  border: '#DDDDDD',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // 状態色
  success: '#00AA00',
  warning: '#AA6600',
  error: '#AA0000',
  info: '#0066AA',
};

// ダークモードカラーパレット
const darkColors = {
  // 背景色
  background: '#0A0A0A',
  backgroundSecondary: '#1A1A1A',
  
  // ノード色
  nodeNormal: '#AA0000',
  nodeSelected: '#FF3333',
  nodeCriticism: '#660000',
  nodeIntegration: '#CC4444',
  
  // テキスト色
  textPrimary: '#EEEEEE',
  textSecondary: '#CCCCCC',
  textMuted: '#888888',
  
  // 関係線色
  connectionLine: '#AA0000',
  connectionLineSelected: '#FF3333',
  connectionLineCriticism: '#660000',
  
  // 批評ブランチ色
  criticismBranch: '#660000',
  criticismBranchSelected: '#AA0000',
  
  // 統合ノード色
  integrationNode: '#CC4444',
  integrationNodeSelected: '#FF6666',
  
  // UI要素色
  border: '#333333',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.8)',
  
  // 状態色
  success: '#00AA00',
  warning: '#AA6600',
  error: '#AA0000',
  info: '#0066AA',
};

// 現在のテーマ（デフォルトはダークモード）
let currentTheme: ThemeType = 'dark';

// テーマ切り替え関数
export const setTheme = (theme: ThemeType) => {
  currentTheme = theme;
};

// 現在のテーマ取得関数
export const getCurrentTheme = (): ThemeType => {
  return currentTheme;
};

// 思想ツリーアプリ専用カラーパレット（関数ベース）
export const getPhiloTreeColors = () => {
  const colors = currentTheme === 'light' ? lightColors : darkColors;
  return colors;
};

// 後方互換性のため、デフォルトでダークモードのカラーを返す
export const PhiloTreeColors = darkColors;
