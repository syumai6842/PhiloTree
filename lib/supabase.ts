import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

// Supabase設定
// 環境変数を設定するか、直接値を設定してください
// 
// 1. 環境変数を使用する場合:
// - .env.local ファイルを作成
// - EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
// - EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
//
// 2. 直接値を設定する場合:
// - 以下の値を実際のSupabaseプロジェクトの値に置き換えてください

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Web環境ではAsyncStorageを使用しない
const storage = Platform.OS === 'web' ? undefined : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// リアルタイムサブスクリプション用のチャンネル名
export const REALTIME_CHANNELS = {
  NODES: 'nodes',
  CRITICISMS: 'criticisms',
} as const;

// データベーステーブル名
export const TABLES = {
  NODES: 'nodes',
  CRITICISMS: 'criticisms',
} as const;

// MyGPTsからのリクエスト用のエンドポイントURL
// このURLをMyGPTsの設定で使用してください
export const API_ENDPOINTS = {
  RECEIVE_NODE: 'https://your-api-domain.com/api/receive-node',
} as const; 