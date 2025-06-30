// ノードの基本構造
export interface Node {
  id: string;
  title: string;
  content?: string;
  parent_ids: string[]; // 配列
  created_at: string;
  updated_at: string;
  source_gpt?: string;
}

// 批評の基本構造
export interface Criticism {
  id: string;
  node_id?: string;
  scholar_name: string;
  field?: string;
  title: string;
  content: string;
  created_at: string;
  source_url?: string;
}

// 思想マップの状態
export interface ThoughtMapState {
  nodes: Node[];
  criticisms: Criticism[];
  selectedNodeId?: string;
  zoom: number;
  pan: {
    x: number;
    y: number;
  };
}

// API レスポンス型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ノード作成リクエスト
export interface CreateNodeRequest {
  title: string;
  content?: string;
  parent_ids?: string[];
  source_gpt?: string;
}

// 批評作成リクエスト
export interface CreateCriticismRequest {
  node_id?: string;
  scholar_name: string;
  field?: string;
  title: string;
  content: string;
  source_url?: string;
}

// ノード更新リクエスト
export interface UpdateNodeRequest {
  id: string;
  title?: string;
  content?: string;
  parent_ids?: string[];
  source_gpt?: string;
} 