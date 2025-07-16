import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

// Supabase設定
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://knjtgrcydclkwiomekcu.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuanRncmljeWRjbGt3aW9tZWtjdSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzQ4NzEwMDEwLCJleHA6MjA2NjM4OTAxMH0.d6XstEX5OcIHiRkSj2DXhWmYAUDguPvjIQC4mkyM8Es';

// Web環境ではAsyncStorageを使用しない
const storage = Platform.OS === 'web' ? undefined : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
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