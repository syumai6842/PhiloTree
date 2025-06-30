import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useReducer } from 'react';
import { Platform } from 'react-native';
import { REALTIME_CHANNELS, supabase, TABLES } from '../lib/supabase';
import {
  CreateCriticismRequest,
  CreateNodeRequest,
  Criticism,
  Node,
  ThoughtMapState,
  UpdateNodeRequest
} from '../types';

// アクション型定義
type ThoughtMapAction =
  | { type: 'ADD_NODE'; payload: Node }
  | { type: 'UPDATE_NODE'; payload: Node }
  | { type: 'DELETE_NODE'; payload: string }
  | { type: 'ADD_CRITICISM'; payload: Criticism }
  | { type: 'UPDATE_CRITICISM'; payload: Criticism }
  | { type: 'DELETE_CRITICISM'; payload: string }
  | { type: 'SET_SELECTED_NODE'; payload: string | undefined }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_PAN'; payload: { x: number; y: number } }
  | { type: 'LOAD_STATE'; payload: ThoughtMapState }
  | { type: 'CLEAR_STATE' }
  | { type: 'SYNC_FROM_SUPABASE'; payload: { nodes: Node[]; criticisms: Criticism[] } };

// 初期状態
const initialState: ThoughtMapState = {
  nodes: [],
  criticisms: [],
  selectedNodeId: undefined,
  zoom: 1,
  pan: { x: 0, y: 0 },
};

// リデューサー
function thoughtMapReducer(state: ThoughtMapState, action: ThoughtMapAction): ThoughtMapState {
  switch (action.type) {
    case 'ADD_NODE':
      return {
        ...state,
        nodes: [...state.nodes, action.payload],
      };
    
    case 'UPDATE_NODE':
      return {
        ...state,
        nodes: state.nodes.map(node => 
          node.id === action.payload.id ? action.payload : node
        ),
      };
    
    case 'DELETE_NODE':
      return {
        ...state,
        nodes: state.nodes.filter(node => node.id !== action.payload),
      };

    case 'ADD_CRITICISM':
      return {
        ...state,
        criticisms: [...state.criticisms, action.payload],
      };
    
    case 'UPDATE_CRITICISM':
      return {
        ...state,
        criticisms: state.criticisms.map(criticism => 
          criticism.id === action.payload.id ? action.payload : criticism
        ),
      };
    
    case 'DELETE_CRITICISM':
      return {
        ...state,
        criticisms: state.criticisms.filter(criticism => criticism.id !== action.payload),
      };
    
    case 'SET_SELECTED_NODE':
      return {
        ...state,
        selectedNodeId: action.payload,
      };
    
    case 'SET_ZOOM':
      return {
        ...state,
        zoom: action.payload,
      };
    
    case 'SET_PAN':
      return {
        ...state,
        pan: action.payload,
      };
    
    case 'LOAD_STATE':
      return action.payload;
    
    case 'CLEAR_STATE':
      return initialState;
    
    case 'SYNC_FROM_SUPABASE':
      return {
        ...state,
        nodes: action.payload.nodes,
        criticisms: action.payload.criticisms,
      };
    
    default:
      return state;
  }
}

// コンテキスト型定義
interface ThoughtMapContextType {
  state: ThoughtMapState;
  addNode: (nodeData: CreateNodeRequest) => Promise<void>;
  updateNode: (nodeData: UpdateNodeRequest) => Promise<void>;
  deleteNode: (nodeId: string) => Promise<void>;
  addCriticism: (criticismData: CreateCriticismRequest) => Promise<void>;
  updateCriticism: (criticismData: Partial<Criticism> & { id: string }) => Promise<void>;
  deleteCriticism: (criticismId: string) => Promise<void>;
  setSelectedNode: (nodeId: string | undefined) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  loadState: () => Promise<void>;
  saveState: () => Promise<void>;
  clearState: () => Promise<void>;
  syncFromSupabase: () => Promise<void>;
  getCompletionRate: (nodeId: string | undefined) => { completed: number; total: number; percentage: number };
}

// コンテキスト作成
const ThoughtMapContext = createContext<ThoughtMapContextType | undefined>(undefined);

// プロバイダーコンポーネント
export function ThoughtMapProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(thoughtMapReducer, initialState);

  // Supabaseからのリアルタイム更新を設定
  useEffect(() => {
    // ノードのリアルタイムサブスクリプション
    const nodesSubscription = supabase
      .channel(REALTIME_CHANNELS.NODES)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: TABLES.NODES },
        (payload) => {
          console.log('Node change:', payload);
          if (payload.eventType === 'INSERT') {
            dispatch({ type: 'ADD_NODE', payload: payload.new as Node });
          } else if (payload.eventType === 'UPDATE') {
            dispatch({ type: 'UPDATE_NODE', payload: payload.new as Node });
          } else if (payload.eventType === 'DELETE') {
            dispatch({ type: 'DELETE_NODE', payload: payload.old.id });
          }
        }
      )
      .subscribe();

    // 批評のリアルタイムサブスクリプション
    const criticismsSubscription = supabase
      .channel(REALTIME_CHANNELS.CRITICISMS)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: TABLES.CRITICISMS },
        (payload) => {
          console.log('Criticism change:', payload);
          if (payload.eventType === 'INSERT') {
            dispatch({ type: 'ADD_CRITICISM', payload: payload.new as Criticism });
          } else if (payload.eventType === 'UPDATE') {
            dispatch({ type: 'UPDATE_CRITICISM', payload: payload.new as Criticism });
          } else if (payload.eventType === 'DELETE') {
            dispatch({ type: 'DELETE_CRITICISM', payload: payload.old.id });
          }
        }
      )
      .subscribe();

    // 初期データの読み込み
    syncFromSupabase();

    return () => {
      nodesSubscription.unsubscribe();
      criticismsSubscription.unsubscribe();
    };
  }, []);

  // Supabaseからデータを同期
  const syncFromSupabase = async () => {
    try {
      // ノードの取得
      const { data: nodes, error: nodesError } = await supabase
        .from(TABLES.NODES)
        .select('*')
        .order('created_at', { ascending: true });

      if (nodesError) throw nodesError;

      // 批評の取得
      const { data: criticisms, error: criticismsError } = await supabase
        .from(TABLES.CRITICISMS)
        .select('*')
        .order('created_at', { ascending: true });

      if (criticismsError) throw criticismsError;

      dispatch({
        type: 'SYNC_FROM_SUPABASE',
        payload: {
          nodes: nodes || [],
          criticisms: criticisms || [],
        }
      });
    } catch (error) {
      console.error('Failed to sync from Supabase:', error);
    }
  };

  // ノード追加
  const addNode = async (nodeData: CreateNodeRequest) => {
    const newNode: Node = {
      id: Date.now().toString(),
      title: nodeData.title,
      content: nodeData.content,
      parent_ids: nodeData.parent_ids || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source_gpt: nodeData.source_gpt,
    };

    try {
      // Supabaseに保存
      const { error } = await supabase
        .from(TABLES.NODES)
        .insert(newNode);

      if (error) throw error;

      // ローカル状態も更新（リアルタイム更新で重複を避けるため）
      dispatch({ type: 'ADD_NODE', payload: newNode });
      await saveState();
    } catch (error) {
      console.error('Failed to add node:', error);
      throw error;
    }
  };

  // ノード更新
  const updateNode = async (nodeData: UpdateNodeRequest) => {
    const existingNode = state.nodes.find(node => node.id === nodeData.id);
    if (!existingNode) return;

    const updatedNode: Node = {
      ...existingNode,
      ...nodeData,
      updated_at: new Date().toISOString(),
    };

    try {
      // Supabaseに保存
      const { error } = await supabase
        .from(TABLES.NODES)
        .update(updatedNode)
        .eq('id', nodeData.id);

      if (error) throw error;

      // ローカル状態も更新
      dispatch({ type: 'UPDATE_NODE', payload: updatedNode });
      await saveState();
    } catch (error) {
      console.error('Failed to update node:', error);
      throw error;
    }
  };

  // ノード削除
  const deleteNode = async (nodeId: string) => {
    try {
      // Supabaseから削除
      const { error } = await supabase
        .from(TABLES.NODES)
        .delete()
        .eq('id', nodeId);

      if (error) throw error;

      // ローカル状態も更新
      dispatch({ type: 'DELETE_NODE', payload: nodeId });
      await saveState();
    } catch (error) {
      console.error('Failed to delete node:', error);
      throw error;
    }
  };

  // 批評追加
  const addCriticism = async (criticismData: CreateCriticismRequest) => {
    const newCriticism: Criticism = {
      id: Date.now().toString(),
      node_id: criticismData.node_id,
      scholar_name: criticismData.scholar_name,
      field: criticismData.field,
      title: criticismData.title,
      content: criticismData.content,
      created_at: new Date().toISOString(),
      source_url: criticismData.source_url,
    };

    try {
      // Supabaseに保存
      const { error } = await supabase
        .from(TABLES.CRITICISMS)
        .insert(newCriticism);

      if (error) throw error;

      // ローカル状態も更新（リアルタイム更新で重複を避けるため）
      dispatch({ type: 'ADD_CRITICISM', payload: newCriticism });
      await saveState();
    } catch (error) {
      console.error('Failed to add criticism:', error);
      throw error;
    }
  };

  // 批評更新
  const updateCriticism = async (criticismData: Partial<Criticism> & { id: string }) => {
    const existingCriticism = state.criticisms.find(criticism => criticism.id === criticismData.id);
    if (!existingCriticism) return;

    const updatedCriticism: Criticism = {
      ...existingCriticism,
      ...criticismData,
    };

    try {
      // Supabaseに保存
      const { error } = await supabase
        .from(TABLES.CRITICISMS)
        .update(updatedCriticism)
        .eq('id', criticismData.id);

      if (error) throw error;

      // ローカル状態も更新
      dispatch({ type: 'UPDATE_CRITICISM', payload: updatedCriticism });
      await saveState();
    } catch (error) {
      console.error('Failed to update criticism:', error);
      throw error;
    }
  };

  // 批評削除
  const deleteCriticism = async (criticismId: string) => {
    try {
      // Supabaseから削除
      const { error } = await supabase
        .from(TABLES.CRITICISMS)
        .delete()
        .eq('id', criticismId);

      if (error) throw error;

      // ローカル状態も更新
      dispatch({ type: 'DELETE_CRITICISM', payload: criticismId });
      await saveState();
    } catch (error) {
      console.error('Failed to delete criticism:', error);
      throw error;
    }
  };

  // 選択ノード設定
  const setSelectedNode = (nodeId: string | undefined) => {
    dispatch({ type: 'SET_SELECTED_NODE', payload: nodeId });
  };

  // ズーム設定
  const setZoom = (zoom: number) => {
    dispatch({ type: 'SET_ZOOM', payload: zoom });
  };

  // パン設定
  const setPan = (pan: { x: number; y: number }) => {
    dispatch({ type: 'SET_PAN', payload: pan });
  };

  // 状態読み込み
  const loadState = async () => {
    try {
      if (Platform.OS !== 'web') {
        const savedState = await AsyncStorage.getItem('thoughtMapState');
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          dispatch({ type: 'LOAD_STATE', payload: parsedState });
        }
      }
    } catch (error) {
      console.error('Failed to load state:', error);
    }
  };

  // 状態保存
  const saveState = async () => {
    try {
      if (Platform.OS !== 'web') {
        await AsyncStorage.setItem('thoughtMapState', JSON.stringify(state));
      }
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  };

  // 状態クリア
  const clearState = async () => {
    dispatch({ type: 'CLEAR_STATE' });
    if (Platform.OS !== 'web') {
      await AsyncStorage.removeItem('thoughtMapState');
    }
  };

  // 達成度計算
  const getCompletionRate = (nodeId: string | undefined) => {
    if (!nodeId) {
      return { completed: 0, total: 0, percentage: 0 };
    }
    
    // 選択されたノードとその全ての子ノード（入れ子構造）を再帰的に取得
    const getAllChildNodeIds = (parentId: string, visited: Set<string> = new Set()): Set<string> => {
      if (visited.has(parentId)) return visited;
      visited.add(parentId);
      
      // 直接の子ノードを取得
      const childNodes = state.nodes.filter(node => node.parent_ids.includes(parentId));
      const childCriticisms = state.criticisms.filter(c => c.node_id === parentId);
      
      // 子ノードを再帰的に探索
      childNodes.forEach(child => {
        getAllChildNodeIds(child.id, visited);
      });
      
      // 子批評ノードを再帰的に探索
      childCriticisms.forEach(child => {
        getAllChildNodeIds(child.id, visited);
      });
      
      return visited;
    };
    
    // 選択されたノードとその全ての子ノードのIDを取得
    const allNodeIds = getAllChildNodeIds(nodeId);
    
    // 全ての子ノードに紐づけられた批評ノードを取得
    const allCriticisms = state.criticisms.filter(c => allNodeIds.has(c.node_id || ''));
    
    if (allCriticisms.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }
    
    // 子ノードが存在する批評ノードの数を計算（達成）
    const completedCriticisms = allCriticisms.filter(criticism => {
      // この批評ノードに子ノード（Node）が存在するかチェック
      const hasChildNodes = state.nodes.some(node => node.parent_ids.includes(criticism.id));
      // この批評ノードに子批評ノードが存在するかチェック
      const hasChildCriticisms = state.criticisms.some(c => c.node_id === criticism.id);
      
      return hasChildNodes || hasChildCriticisms;
    });
    
    const completed = completedCriticisms.length;
    const total = allCriticisms.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  };

  const value: ThoughtMapContextType = {
    state,
    addNode,
    updateNode,
    deleteNode,
    addCriticism,
    updateCriticism,
    deleteCriticism,
    setSelectedNode,
    setZoom,
    setPan,
    loadState,
    saveState,
    clearState,
    syncFromSupabase,
    getCompletionRate,
  };

  return (
    <ThoughtMapContext.Provider value={value}>
      {children}
    </ThoughtMapContext.Provider>
  );
}

// カスタムフック
export function useThoughtMap() {
  const context = useContext(ThoughtMapContext);
  if (context === undefined) {
    throw new Error('useThoughtMap must be used within a ThoughtMapProvider');
  }
  return context;
} 