const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase設定
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 思想体系のデータ
const nodes = [
  {
    id: 'world-premise-structure',
    title: '世界の前提構造',
    content: '世界の基本的な前提構造についての考察。物質的相互作用、因果関係、生物的条件という三つの側面から世界を理解する。',
    parent_ids: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'material-interaction',
    title: '世界は物質の相互作用によってできている',
    content: '世界の基本的な構成要素は物質であり、それらの相互作用によって現象が生じる。',
    parent_ids: ['world-premise-structure'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'heidegger-dasein',
    title: 'ハイデガー「現存在」',
    content: 'ハイデガーの現存在（Dasein）概念。人間の存在の特殊性と世界内存在としての性質。',
    parent_ids: ['material-interaction'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'causal-world',
    title: '世界は因果でできている',
    content: '世界の現象は因果関係によって説明される。原因と結果の連鎖が世界の構造を形成する。',
    parent_ids: ['world-premise-structure'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'indirect-perception',
    title: '感覚器官を通じた間接的認識しかできない',
    content: '人間は感覚器官を通じてのみ世界を認識でき、直接的な認識は不可能である。',
    parent_ids: ['causal-world'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'epistemological-position',
    title: '認識論的立場',
    content: '認識の本質と限界についての理論的立場。',
    parent_ids: ['indirect-perception'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'yorou-brain-only',
    title: '養老孟司「唯脳論」',
    content: '養老孟司の唯脳論。脳が世界を構築するという認識論的立場。',
    parent_ids: ['epistemological-position'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'definition-as-recognition',
    title: '認識とは「Aと非Aを切り分けること」＝定義すること',
    content: '認識の本質は区別すること、つまり定義することにある。',
    parent_ids: ['epistemological-position'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'heidegger-being-in-world',
    title: 'ハイデガー「世界内存在」',
    content: 'ハイデガーの世界内存在（In-der-Welt-sein）概念。人間の世界との関係性。',
    parent_ids: ['definition-as-recognition'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'abstract-concrete-movement',
    title: '人間は抽象と具体を行き来できる',
    content: '人間の思考の特徴として、抽象的な概念と具体的な経験の間を自由に移動できる能力。',
    parent_ids: ['heidegger-being-in-world'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'durkheim-categories',
    title: 'デュルケム「範疇」＝定義共有の枠組み',
    content: 'デュルケムの社会的範疇概念。社会が共有する認識の枠組みとしての範疇。',
    parent_ids: ['abstract-concrete-movement'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'biological-conditions',
    title: '生物的条件：欲求＝依存によって動く',
    content: '生物としての人間は欲求と依存関係によって行動が決定される。',
    parent_ids: ['world-premise-structure'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'value-assignment',
    title: '定義対象に価値（優先順位）を与える',
    content: '認識対象に対して価値や優先順位を付与する人間の能力。',
    parent_ids: ['biological-conditions'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'subject-formation',
    title: '主体の成立（意味と欲求の起源）',
    content: '価値付与を通じて主体が成立し、意味と欲求が生まれる過程。',
    parent_ids: ['value-assignment'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const criticisms = [
  {
    id: 'criticism-heidegger-dasein-1',
    node_id: 'heidegger-dasein',
    scholar_name: 'サルトル',
    field: '実存主義哲学',
    comment: 'ハイデガーの現存在概念は存在の偶然性を十分に説明していない。人間の自由と責任の観点から批判的に検討する必要がある。',
    created_at: new Date().toISOString()
  },
  {
    id: 'criticism-yorou-brain-only-1',
    node_id: 'yorou-brain-only',
    scholar_name: '中村雄二郎',
    field: '科学哲学',
    comment: '唯脳論は還元主義的すぎる。身体性や環境との相互作用を軽視している。',
    created_at: new Date().toISOString()
  },
  {
    id: 'criticism-durkheim-categories-1',
    node_id: 'durkheim-categories',
    scholar_name: 'ピエール・ブルデュー',
    field: '社会学',
    comment: 'デュルケムの範疇概念は社会構造の再現産を説明するが、個人の主体性を軽視している。',
    created_at: new Date().toISOString()
  },
  {
    id: 'criticism-subject-formation-1',
    node_id: 'subject-formation',
    scholar_name: 'フーコー',
    field: '哲学・歴史学',
    comment: '主体の成立は権力関係の中で構築される。自然な過程ではなく、社会的・歴史的な構築物である。',
    created_at: new Date().toISOString()
  },
  {
    id: 'criticism-world-premise-1',
    node_id: 'world-premise-structure',
    scholar_name: 'ニーチェ',
    field: '哲学',
    comment: '世界の前提構造という考え自体が人間中心主義的である。世界は人間の認識とは独立して存在する。',
    created_at: new Date().toISOString()
  }
];

async function insertPhilosophySystem() {
  try {
    // ノードの挿入
    const { data: nodesData, error: nodesError } = await supabase
      .from('nodes')
      .insert(nodes);

    if (nodesError) {
      console.error('ノードの挿入エラー:', nodesError);
      return;
    }

    // 批評の挿入
    const { data: criticismsData, error: criticismsError } = await supabase
      .from('criticisms')
      .insert(criticisms);

    if (criticismsError) {
      console.error('批評の挿入エラー:', criticismsError);
      return;
    }

  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

// スクリプト実行
insertPhilosophySystem(); 