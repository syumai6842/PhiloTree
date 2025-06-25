-- 思想体系の挿入スクリプト
-- ノードの挿入

-- 1. 世界の前提構造（ルートノード）
INSERT INTO nodes (id, title, content, parent_ids, created_at, updated_at) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  '世界の前提構造',
  '世界の基本的な前提構造についての考察。物質的相互作用、因果関係、生物的条件という三つの側面から世界を理解する。',
  '{}',
  NOW(),
  NOW()
);

-- 2. 世界は物質の相互作用によってできている
INSERT INTO nodes (id, title, content, parent_ids, created_at, updated_at) VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  '世界は物質の相互作用によってできている',
  '世界の基本的な構成要素は物質であり、それらの相互作用によって現象が生じる。',
  '{"550e8400-e29b-41d4-a716-446655440001"}',
  NOW(),
  NOW()
);

-- 3. 世界は因果でできている
INSERT INTO nodes (id, title, content, parent_ids, created_at, updated_at) VALUES (
  '550e8400-e29b-41d4-a716-446655440003',
  '世界は因果でできている',
  '世界の現象は因果関係によって説明される。原因と結果の連鎖が世界の構造を形成する。',
  '{"550e8400-e29b-41d4-a716-446655440001"}',
  NOW(),
  NOW()
);

-- 4. 感覚器官を通じた間接的認識しかできない
INSERT INTO nodes (id, title, content, parent_ids, created_at, updated_at) VALUES (
  '550e8400-e29b-41d4-a716-446655440004',
  '感覚器官を通じた間接的認識しかできない',
  '人間は感覚器官を通じてのみ世界を認識でき、直接的な認識は不可能である。',
  '{"550e8400-e29b-41d4-a716-446655440003"}',
  NOW(),
  NOW()
);

-- 5. 認識論的立場
INSERT INTO nodes (id, title, content, parent_ids, created_at, updated_at) VALUES (
  '550e8400-e29b-41d4-a716-446655440005',
  '認識論的立場',
  '認識の本質と限界についての理論的立場。',
  '{"550e8400-e29b-41d4-a716-446655440004"}',
  NOW(),
  NOW()
);

-- 6. 認識とは「Aと非Aを切り分けること」＝定義すること
INSERT INTO nodes (id, title, content, parent_ids, created_at, updated_at) VALUES (
  '550e8400-e29b-41d4-a716-446655440006',
  '認識とは「Aと非Aを切り分けること」＝定義すること',
  '認識の本質は区別すること、つまり定義することにある。',
  '{"550e8400-e29b-41d4-a716-446655440005"}',
  NOW(),
  NOW()
);

-- 7. 人間は抽象と具体を行き来できる
INSERT INTO nodes (id, title, content, parent_ids, created_at, updated_at) VALUES (
  '550e8400-e29b-41d4-a716-446655440007',
  '人間は抽象と具体を行き来できる',
  '人間の思考の特徴として、抽象的な概念と具体的な経験の間を自由に移動できる能力。',
  '{"550e8400-e29b-41d4-a716-446655440006"}',
  NOW(),
  NOW()
);

-- 8. 生物的条件：欲求＝依存によって動く
INSERT INTO nodes (id, title, content, parent_ids, created_at, updated_at) VALUES (
  '550e8400-e29b-41d4-a716-446655440008',
  '生物的条件：欲求＝依存によって動く',
  '生物としての人間は欲求と依存関係によって行動が決定される。',
  '{"550e8400-e29b-41d4-a716-446655440001"}',
  NOW(),
  NOW()
);

-- 9. 定義対象に価値（優先順位）を与える
INSERT INTO nodes (id, title, content, parent_ids, created_at, updated_at) VALUES (
  '550e8400-e29b-41d4-a716-446655440009',
  '定義対象に価値（優先順位）を与える',
  '認識対象に対して価値や優先順位を付与する人間の能力。',
  '{"550e8400-e29b-41d4-a716-446655440008"}',
  NOW(),
  NOW()
);

-- 10. 主体の成立（意味と欲求の起源）
INSERT INTO nodes (id, title, content, parent_ids, created_at, updated_at) VALUES (
  '550e8400-e29b-41d4-a716-446655440010',
  '主体の成立（意味と欲求の起源）',
  '価値付与を通じて主体が成立し、意味と欲求が生まれる過程。',
  '{"550e8400-e29b-41d4-a716-446655440009"}',
  NOW(),
  NOW()
);

-- 批評の挿入

-- ハイデガー「現存在」への批評
INSERT INTO criticisms (id, node_id, scholar_name, field, comment, created_at) VALUES (
  '550e8400-e29b-41d4-a716-446655440101',
  '550e8400-e29b-41d4-a716-446655440002',
  'ハイデガー',
  '存在論哲学',
  '現存在（Dasein）としての人間の存在の特殊性。人間は単なる物質的相互作用を超えた存在であり、世界内存在としての性質を持つ。',
  NOW()
);

-- 養老孟司「唯脳論」への批評
INSERT INTO criticisms (id, node_id, scholar_name, field, comment, created_at) VALUES (
  '550e8400-e29b-41d4-a716-446655440102',
  '550e8400-e29b-41d4-a716-446655440005',
  '養老孟司',
  '脳科学・哲学',
  '唯脳論：脳が世界を構築するという認識論的立場。人間の認識は脳の機能によって決定され、世界は脳が構築したものである。',
  NOW()
);

-- ハイデガー「世界内存在」への批評
INSERT INTO criticisms (id, node_id, scholar_name, field, comment, created_at) VALUES (
  '550e8400-e29b-41d4-a716-446655440103',
  '550e8400-e29b-41d4-a716-446655440006',
  'ハイデガー',
  '存在論哲学',
  '世界内存在（In-der-Welt-sein）概念。人間は世界との関係性の中で存在し、認識は世界内での実践的関わりを通じて成立する。',
  NOW()
);

-- デュルケム「範疇」への批評
INSERT INTO criticisms (id, node_id, scholar_name, field, comment, created_at) VALUES (
  '550e8400-e29b-41d4-a716-446655440104',
  '550e8400-e29b-41d4-a716-446655440007',
  'デュルケム',
  '社会学',
  '社会的範疇概念。社会が共有する認識の枠組みとしての範疇。人間の抽象と具体の行き来は社会的に構築された範疇を通じて行われる。',
  NOW()
);

-- サルトルによるハイデガー批評
INSERT INTO criticisms (id, node_id, scholar_name, field, comment, created_at) VALUES (
  '550e8400-e29b-41d4-a716-446655440105',
  '550e8400-e29b-41d4-a716-446655440002',
  'サルトル',
  '実存主義哲学',
  'ハイデガーの現存在概念は存在の偶然性を十分に説明していない。人間の自由と責任の観点から批判的に検討する必要がある。',
  NOW()
);

-- 中村雄二郎による養老孟司批評
INSERT INTO criticisms (id, node_id, scholar_name, field, comment, created_at) VALUES (
  '550e8400-e29b-41d4-a716-446655440106',
  '550e8400-e29b-41d4-a716-446655440005',
  '中村雄二郎',
  '科学哲学',
  '唯脳論は還元主義的すぎる。身体性や環境との相互作用を軽視している。',
  NOW()
);

-- ピエール・ブルデューによるデュルケム批評
INSERT INTO criticisms (id, node_id, scholar_name, field, comment, created_at) VALUES (
  '550e8400-e29b-41d4-a716-446655440107',
  '550e8400-e29b-41d4-a716-446655440007',
  'ピエール・ブルデュー',
  '社会学',
  'デュルケムの範疇概念は社会構造の再現産を説明するが、個人の主体性を軽視している。',
  NOW()
);

-- フーコーによる主体の成立批評
INSERT INTO criticisms (id, node_id, scholar_name, field, comment, created_at) VALUES (
  '550e8400-e29b-41d4-a716-446655440108',
  '550e8400-e29b-41d4-a716-446655440010',
  'フーコー',
  '哲学・歴史学',
  '主体の成立は権力関係の中で構築される。自然な過程ではなく、社会的・歴史的な構築物である。',
  NOW()
);

-- ニーチェによる世界の前提構造批評
INSERT INTO criticisms (id, node_id, scholar_name, field, comment, created_at) VALUES (
  '550e8400-e29b-41d4-a716-446655440109',
  '550e8400-e29b-41d4-a716-446655440001',
  'ニーチェ',
  '哲学',
  '世界の前提構造という考え自体が人間中心主義的である。世界は人間の認識とは独立して存在する。',
  NOW()
); 