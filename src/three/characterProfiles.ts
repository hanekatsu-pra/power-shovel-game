export type CharacterProfile = {
  id: `spectator_${string}`;
  legacyIds?: string[];
  displayName: string;
  spectatorAsset: string;
  viewingAssets?: readonly string[];
  walkingAssets?: readonly [front: string, right: string, left: string, back: string];
  /** spectator_101+ is walker-only; children in 01–99 opt out. */
  walkerEligible?: boolean;
  walkerOnly?: boolean;
  rarity: 'common' | 'uncommon' | 'rare';
  useAsWalker: boolean;
  useAsSpectator: boolean;
  notes?: string;
};
/** Canonical registry: spectator_man_01 is intentionally folded into spectator_11. */
export const characterProfiles: readonly CharacterProfile[] = [
  { id: 'spectator_01', displayName: '白いシャツを着た大人の男性', spectatorAsset: 'spectator-01/spectator-01-viewing-01-smile.png', viewingAssets: ['spectator-01/spectator-01-viewing-01-smile.png', 'spectator-01/spectator-01-viewing-02-wave.png', 'spectator-01/spectator-01-viewing-03-phone-portrait.png', 'spectator-01/spectator-01-viewing-04-phone-landscape.png', 'spectator-01/spectator-01-viewing-05-clap.png', 'spectator-01/spectator-01-viewing-06-cheer.png', 'spectator-01/spectator-01-viewing-07-banzai.png', 'spectator-01/spectator-01-viewing-08-disappointed.png'], walkingAssets: ['spectator-01/spectator-01-walking-01-front.png', 'spectator-01/spectator-01-walking-02-right.png', 'spectator-01/spectator-01-walking-03-left.png', 'spectator-01/spectator-01-walking-04-back.png'], walkerEligible: true, rarity: 'common', useAsWalker: false, useAsSpectator: true, notes: '観戦・歩行兼用' },
  { id: 'spectator_02', displayName: '白いパンツ姿の大人の女性', spectatorAsset: 'spectator-02/spectator-02-viewing-01-smile.png', viewingAssets: ['spectator-02/spectator-02-viewing-01-smile.png','spectator-02/spectator-02-viewing-02-wave.png','spectator-02/spectator-02-viewing-03-phone-portrait.png','spectator-02/spectator-02-viewing-04-phone-landscape.png','spectator-02/spectator-02-viewing-05-clap.png','spectator-02/spectator-02-viewing-06-cheer.png','spectator-02/spectator-02-viewing-07-banzai.png','spectator-02/spectator-02-viewing-08-disappointed.png'], walkingAssets: ['spectator-02/spectator-02-walking-01-front.png','spectator-02/spectator-02-walking-02-right.png','spectator-02/spectator-02-walking-03-left.png','spectator-02/spectator-02-walking-04-back.png'], rarity: 'common', useAsWalker: false, useAsSpectator: true, notes: '観戦・歩行兼用' },
  { id: 'spectator_03', displayName: 'ピンクリボンの女子児童', spectatorAsset: 'spectator-03/spectator-03-viewing-01-smile.png', viewingAssets: ['spectator-03/spectator-03-viewing-01-smile.png','spectator-03/spectator-03-viewing-02-wave.png','spectator-03/spectator-03-viewing-05-clap.png','spectator-03/spectator-03-viewing-06-cheer.png','spectator-03/spectator-03-viewing-07-banzai.png','spectator-03/spectator-03-viewing-08-disappointed.png'], walkingAssets: ['spectator-03/spectator-03-walking-01-front.png','spectator-03/spectator-03-walking-02-right.png','spectator-03/spectator-03-walking-03-left.png','spectator-03/spectator-03-walking-04-back.png'], rarity: 'common', useAsWalker: false, useAsSpectator: true, notes: '子ども：観戦専用' },
  { id: 'spectator_04', displayName: '観戦者04', spectatorAsset: 'spectator-04/spectator-04-viewing-01-smile.png', walkingAssets: ['spectator-04/spectator-04-walking-01-front.png', 'spectator-04/spectator-04-walking-02-right.png', 'spectator-04/spectator-04-walking-03-left.png', 'spectator-04/spectator-04-walking-04-back.png'], walkerEligible: false, rarity: 'common', useAsWalker: false, useAsSpectator: true, notes: '子ども：観戦専用' },
  { id: 'spectator_05', displayName: '観戦者05', spectatorAsset: 'spectator-05/spectator-05-viewing-01-smile.png', walkingAssets: ['spectator-05/spectator-05-walking-01-front.png', 'spectator-05/spectator-05-walking-02-right.png', 'spectator-05/spectator-05-walking-03-left.png', 'spectator-05/spectator-05-walking-04-back.png'], walkerEligible: true, rarity: 'common', useAsWalker: false, useAsSpectator: true, notes: '観戦・歩行兼用' },
  { id: 'spectator_06', displayName: '観戦者06', spectatorAsset: 'spectator-06/spectator-06-viewing-01-smile.png', walkingAssets: ['spectator-06/spectator-06-walking-01-front.png', 'spectator-06/spectator-06-walking-02-right.png', 'spectator-06/spectator-06-walking-03-left.png', 'spectator-06/spectator-06-walking-04-back.png'], walkerEligible: true, rarity: 'common', useAsWalker: false, useAsSpectator: true, notes: '観戦・歩行兼用' },
  { id: 'spectator_07', displayName: '観戦者07', spectatorAsset: 'spectator-07/spectator-07-viewing-01-smile.png', walkingAssets: ['spectator-07/spectator-07-walking-01-front.png', 'spectator-07/spectator-07-walking-02-right.png', 'spectator-07/spectator-07-walking-03-left.png', 'spectator-07/spectator-07-walking-04-back.png'], walkerEligible: false, rarity: 'common', useAsWalker: false, useAsSpectator: true, notes: '子ども：観戦専用' },
  { id: 'spectator_08', displayName: '観戦者08', spectatorAsset: 'spectator-08/spectator-08-viewing-01-smile.png', walkingAssets: ['spectator-08/spectator-08-walking-01-front.png', 'spectator-08/spectator-08-walking-02-right.png', 'spectator-08/spectator-08-walking-03-left.png', 'spectator-08/spectator-08-walking-04-back.png'], walkerEligible: false, rarity: 'common', useAsWalker: false, useAsSpectator: true, notes: '子ども：観戦専用' },
  {
    id: 'spectator_09',
    displayName: '来場者 09',
    spectatorAsset: 'spectator-09/spectator-09-viewing-01-smile.png',
    viewingAssets: [
      'spectator-09/spectator-09-viewing-01-smile.png',
      'spectator-09/spectator-09-viewing-02-wave.png',
      'spectator-09/spectator-09-viewing-03-phone-portrait.png',
      'spectator-09/spectator-09-viewing-04-phone-landscape.png',
      'spectator-09/spectator-09-viewing-05-clap.png',
      'spectator-09/spectator-09-viewing-06-cheer.png',
      'spectator-09/spectator-09-viewing-07-banzai.png',
      'spectator-09/spectator-09-viewing-08-disappointed.png',
      'spectator-09/spectator-09-viewing-09-spare-a.png',
      'spectator-09/spectator-09-viewing-10-spare-b.png',
    ],
    walkingAssets: [
      'spectator-09/spectator-09-walking-01-front.png',
      'spectator-09/spectator-09-walking-02-right.png',
      'spectator-09/spectator-09-walking-03-left.png',
      'spectator-09/spectator-09-walking-04-back.png',
    ],
    rarity: 'common',
    useAsWalker: false,
    useAsSpectator: true,
    notes: '観戦用カット10点・歩行用カット4点生成済み',
  },
  { id: 'spectator_10', displayName: '来場者 10', spectatorAsset: 'spectator-10-handdrawn.png', rarity: 'common', useAsWalker: false, useAsSpectator: true, notes: '未生成' },
  { id: 'spectator_11', legacyIds: ['spectator_man_01'], displayName: '男性来場者 01（旧 spectator_man_01）', spectatorAsset: 'spectator-11-handdrawn.png', rarity: 'common', useAsWalker: false, useAsSpectator: true, notes: '未生成' },
] as const;
export const characterProfileById = Object.fromEntries(characterProfiles.map((profile) => [profile.id, profile])) as Record<string, CharacterProfile>;

/**
 * Walking-character rule:
 * - spectator_01–99: usable for both spectator and walking only when walkerEligible is true.
 * - spectator_101+: walker-only; omit spectatorAsset/viewingAssets and set walkerOnly + walkingAssets.
 */
export const walkerCharacterProfiles = characterProfiles.filter((profile) => profile.useAsWalker);