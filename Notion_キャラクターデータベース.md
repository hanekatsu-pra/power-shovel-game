# キャラクター・データベース（Notion移行用）

更新日: 2026-09-25

## 正式なカット紐付けルール

各プロフィール（spectator_01 〜 spectator_11）は、以下の14カットを同じIDへ紐付けて管理します。

### 観戦用（10カット・すべて正面向き）

| 番号 | カットID | 内容 | 子どもへの適用 |
| --- | --- | --- | --- |
| 1 | viewing_01_smile | 正面向き・にこやかな表情 | 可 |
| 2 | viewing_02_wave | 正面向き・片手を挙げて応援している | 可 |
| 3 | viewing_03_phone_portrait | 正面向き・スマホで撮影している・縦画面 | 不可 |
| 4 | viewing_04_phone_landscape | 正面向き・スマホで撮影している・横動画 | 不可 |
| 5 | viewing_05_clap | 正面向き・拍手をして応援している | 可 |
| 6 | viewing_06_cheer | 正面向き・手のひらを口に当てて、応援している | 可 |
| 7 | viewing_07_banzai | 正面向き・バンザイして喜んでいる | 可 |
| 8 | viewing_08_disappointed | 正面向き・がっかりしている | 可 |
| 9 | viewing_09_spare_a | 予備 | 可 |
| 10 | viewing_10_spare_b | 予備 | 可 |

> **姿勢ルール：** 観戦用はゲーム本体を眺めるため、10カットすべてを正面向きに統一します。横向き・後ろ向きは歩行用だけに使用します。

### 歩行用（4カット）

| 番号 | カットID | 内容 |
| --- | --- | --- |
| 1 | walking_01_front | 正面向き |
| 2 | walking_02_right | 右向き |
| 3 | walking_03_left | 左向き |
| 4 | walking_04_back | 後ろ向き |

## ファイル命名規則

例：spectator_01 の観戦用・にこやかな表情

    spectator-01/spectator-01-viewing-01-smile.png

例：spectator_01 の歩行用・左向き

    spectator-01/spectator-01-walking-03-left.png

## プロフィール一覧

| 正式ID | 表示名 | 旧ID | 子ども | 観戦用10カット | 歩行用4カット | 状態 |
| --- | --- | --- | --- | --- | --- |
| spectator_01 | 白いシャツを着た大人の男性 | — | いいえ | viewing_01〜08を生成済み | walking_01〜04を生成済み | 観戦用8・歩行用4カット生成済み |
| spectator_02 | 白いシャツを着た大人の男性 | — | いいえ | 規則を適用 | 規則を適用 | 観戦正面のみ既存 |
| spectator_03 | 子どもの来場者 01 | — | はい | 3・4は使用しない | 規則を適用 | 観戦正面のみ既存 |
| spectator_04 | 子どもの来場者 02 | — | はい | 3・4は使用しない | 規則を適用 | 観戦正面のみ既存 |
| spectator_05 | 来場者 05 | — | 要確認 | 規則を適用 | 規則を適用 | 観戦正面のみ既存 |
| spectator_06 | 来場者 06 | — | 要確認 | 規則を適用 | 規則を適用 | 観戦正面のみ既存 |
| spectator_07 | 来場者 07 | — | 要確認 | 規則を適用 | 規則を適用 | 観戦正面のみ既存 |
| spectator_08 | 来場者 08 | — | 要確認 | 規則を適用 | 規則を適用 | 観戦正面のみ既存 |
| spectator_09 | 来場者 09 | — | 要確認 | 規則を適用 | 規則を適用 | 観戦正面のみ既存 |
| spectator_10 | 来場者 10 | — | 要確認 | 規則を適用 | 規則を適用 | 観戦正面のみ既存 |
| spectator_11 | 男性来場者 01 | spectator_man_01 | いいえ | 規則を適用 | 規則を適用 | 観戦正面のみ既存 |

## spectator_01：観戦用カットの割り付け

| カットID | ファイル名 |
| --- | --- |
| viewing_01_smile | spectator-01/spectator-01-viewing-01-smile.png |
| viewing_02_wave | spectator-01/spectator-01-viewing-02-wave.png |
| viewing_03_phone_portrait | spectator-01/spectator-01-viewing-03-phone-portrait.png |
| viewing_04_phone_landscape | spectator-01/spectator-01-viewing-04-phone-landscape.png |
| viewing_05_clap | spectator-01/spectator-01-viewing-05-clap.png |
| viewing_06_cheer | spectator-01/spectator-01-viewing-06-cheer.png |
| viewing_07_banzai | spectator-01/spectator-01-viewing-07-banzai.png |
| viewing_08_disappointed | spectator-01/spectator-01-viewing-08-disappointed.png |

## spectator_01：歩行用カットの割り付け

| カットID | ファイル名 |
| --- | --- |
| walking_01_front | spectator-01/spectator-01-walking-01-front.png |
| walking_02_right | spectator-01/spectator-01-walking-02-right.png |
| walking_03_left | spectator-01/spectator-01-walking-03-left.png |
| walking_04_back | spectator-01/spectator-01-walking-04-back.png |

## 歩行スロット

mall_walker_01 〜 mall_walker_06 は経路だけを保持するスロットIDです。出現時には、上記のプロフィールから任意のキャラクターを選択し、そのプロフィールの walking_01〜04 を方向に応じて表示します。
## ID区分と利用ルール

| ID範囲 | 区分 | 観戦者に使用 | 歩行者に使用 | 生成カット |
| --- | --- | --- | --- | --- |
| `spectator_01`〜`spectator_100` | 観戦者用 | `true` | `false` | 観戦用カット（必要に応じて追加） |
| `spectator_101`〜`spectator_200` | 歩行者用 | `false` | `true` | 歩行用4カットのみ |

歩行者用キャラクタは、二人連れ、親子連れ、ベビーカー、部活動帰りのグループ、レアキャラなどを含められる。これらの内容はID番号帯では分けず、各キャラクターのプロパティで管理する。

| プロパティ | 内容 |
| --- | --- |
| レア度 | `common` / `uncommon` / `rare`。再出現時の抽選比率に使用する。 |
| 歩行者に使用 | `true` の場合、`mall_walker_01`〜`06` の人物候補にできる。 |
| 観戦者に使用 | `true` の場合、ゲーム周辺の固定観戦者として配置できる。 |
| 備考 | 外観、同行者、バッグ、ベビーカーなどの固定条件を記録する。 |

- `spectator_101`〜`200` は、正面・右・左・後ろの歩行4カットだけを生成する。
- 同一ID内では、服装、髪型、持ち物、同行者の人数・構成を全カットで固定する。
- `mall_walker_01`〜`mall_walker_06` は導線IDであり、歩行者用IDだけを再出現候補にする。