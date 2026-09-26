export type CharacterProfile = {
  id: `spectator_${string}`;
  legacyIds?: string[];
  displayName: string;
  spectatorAsset: string;
  viewingAssets?: readonly string[];
  walkingAssets?: readonly [front: string, right: string, left: string, back: string];
  /** Select each character independently for fixed viewing and/or walking use. */
  walkerEligible?: boolean;
  walkerOnly?: boolean;
  rarity: 'common' | 'uncommon' | 'rare';
  useAsWalker: boolean;
  useAsSpectator: boolean;
  /** Fixed-viewing billboard multiplier. 1 is the character's base size. */
  spectatorScale: number;
  /** Corridor-walking sprite multiplier. 1 is the character's base size. */
  walkerScale: number;
  notes?: string;
};
/** Canonical registry: spectator_man_01 is intentionally folded into spectator_11. */
export const characterProfiles: readonly CharacterProfile[] = [
  { id: 'spectator_01', displayName: 'Spectator 01', spectatorAsset: 'spectator-01/spectator-01-viewing-01-smile.png', viewingAssets: ['spectator-01/spectator-01-viewing-01-smile.png', 'spectator-01/spectator-01-viewing-02-wave.png', 'spectator-01/spectator-01-viewing-03-phone-portrait.png', 'spectator-01/spectator-01-viewing-04-phone-landscape.png', 'spectator-01/spectator-01-viewing-05-clap.png', 'spectator-01/spectator-01-viewing-06-cheer.png', 'spectator-01/spectator-01-viewing-07-banzai.png', 'spectator-01/spectator-01-viewing-08-disappointed.png'], walkingAssets: ['spectator-01/spectator-01-walking-01-front.png', 'spectator-01/spectator-01-walking-02-right.png', 'spectator-01/spectator-01-walking-03-left.png', 'spectator-01/spectator-01-walking-04-back.png'], walkerEligible: true, rarity: 'rare', useAsWalker: true, useAsSpectator: true, spectatorScale: 1.05, walkerScale: 1.05, notes: 'Viewing and walking' },
  { id: 'spectator_01', displayName: 'Spectator 01', spectatorAsset: 'spectator-01/spectator-01-viewing-01-smile.png', viewingAssets: ['spectator-01/spectator-01-viewing-01-smile.png', 'spectator-01/spectator-01-viewing-02-wave.png', 'spectator-01/spectator-01-viewing-03-phone-portrait.png', 'spectator-01/spectator-01-viewing-04-phone-landscape.png', 'spectator-01/spectator-01-viewing-05-clap.png', 'spectator-01/spectator-01-viewing-06-cheer.png', 'spectator-01/spectator-01-viewing-07-banzai.png', 'spectator-01/spectator-01-viewing-08-disappointed.png'], walkingAssets: ['spectator-01/spectator-01-walking-01-front.png', 'spectator-01/spectator-01-walking-02-right.png', 'spectator-01/spectator-01-walking-03-left.png', 'spectator-01/spectator-01-walking-04-back.png'], walkerEligible: true, rarity: 'rare', useAsWalker: true, useAsSpectator: true, spectatorScale: 1.05, walkerScale: 1.05, notes: 'Viewing and walking' },
  { id: 'spectator_03', displayName: 'ピンクリボンの女子児童', spectatorAsset: 'spectator-03/spectator-03-viewing-01-smile.png', viewingAssets: ['spectator-03/spectator-03-viewing-01-smile.png','spectator-03/spectator-03-viewing-02-wave.png','spectator-03/spectator-03-viewing-05-clap.png','spectator-03/spectator-03-viewing-06-cheer.png','spectator-03/spectator-03-viewing-07-banzai.png','spectator-03/spectator-03-viewing-08-disappointed.png'], walkingAssets: ['spectator-03/spectator-03-walking-01-front.png','spectator-03/spectator-03-walking-02-right.png','spectator-03/spectator-03-walking-03-left.png','spectator-03/spectator-03-walking-04-back.png'], rarity: 'common', useAsWalker: true, useAsSpectator: true, spectatorScale: 1, walkerScale: 1, notes: '子ども：観戦専用' },
  { id: 'spectator_04', displayName: '観戦者04', spectatorAsset: 'spectator-04/spectator-04-viewing-01-smile.png', walkingAssets: ['spectator-04/spectator-04-walking-01-front.png', 'spectator-04/spectator-04-walking-02-right.png', 'spectator-04/spectator-04-walking-03-left.png', 'spectator-04/spectator-04-walking-04-back.png'], walkerEligible: false, rarity: 'common', useAsWalker: true, useAsSpectator: true, spectatorScale: 1, walkerScale: 1, notes: '子ども：観戦専用' },
  { id: 'spectator_05', displayName: '観戦者05', spectatorAsset: 'spectator-05/spectator-05-viewing-01-smile.png', walkingAssets: ['spectator-05/spectator-05-walking-01-front.png', 'spectator-05/spectator-05-walking-02-right.png', 'spectator-05/spectator-05-walking-03-left.png', 'spectator-05/spectator-05-walking-04-back.png'], walkerEligible: true, rarity: 'rare', useAsWalker: true, useAsSpectator: true, spectatorScale: 1, walkerScale: 1, notes: '観戦・歩行兼用' },
  { id: 'spectator_06', displayName: '観戦者06', spectatorAsset: 'spectator-06/spectator-06-viewing-01-smile.png', walkingAssets: ['spectator-06/spectator-06-walking-01-front.png', 'spectator-06/spectator-06-walking-02-right.png', 'spectator-06/spectator-06-walking-03-left.png', 'spectator-06/spectator-06-walking-04-back.png'], walkerEligible: true, rarity: 'rare', useAsWalker: true, useAsSpectator: true, spectatorScale: 1, walkerScale: 1, notes: '観戦・歩行兼用' },
  { id: 'spectator_07', displayName: '観戦者07', spectatorAsset: 'spectator-07/spectator-07-viewing-01-smile.png', walkingAssets: ['spectator-07/spectator-07-walking-01-front.png', 'spectator-07/spectator-07-walking-02-right.png', 'spectator-07/spectator-07-walking-03-left.png', 'spectator-07/spectator-07-walking-04-back.png'], walkerEligible: false, rarity: 'common', useAsWalker: true, useAsSpectator: true, spectatorScale: 1, walkerScale: 1, notes: '子ども：観戦専用' },
  { id: 'spectator_08', displayName: '観戦者08', spectatorAsset: 'spectator-08/spectator-08-viewing-01-smile.png', walkingAssets: ['spectator-08/spectator-08-walking-01-front.png', 'spectator-08/spectator-08-walking-02-right.png', 'spectator-08/spectator-08-walking-03-left.png', 'spectator-08/spectator-08-walking-04-back.png'], walkerEligible: false, rarity: 'common', useAsWalker: true, useAsSpectator: true, spectatorScale: 1, walkerScale: 1, notes: '子ども：観戦専用' },
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
    useAsWalker: true,
    useAsSpectator: true, spectatorScale: 1, walkerScale: 1,
    notes: '観戦用カット10点・歩行用カット4点生成済み',
  },
  { id: 'spectator_10', displayName: '来場者 10', spectatorAsset: 'spectator-10/spectator-10-viewing-01-smile.png', viewingAssets: ['spectator-10/spectator-10-viewing-01-smile.png'], walkingAssets: ['spectator-10/spectator-10-walking-01-front.png', 'spectator-10/spectator-10-walking-02-right.png', 'spectator-10/spectator-10-walking-03-left.png', 'spectator-10/spectator-10-walking-04-back.png'], rarity: 'rare', useAsWalker: true, useAsSpectator: true, spectatorScale: 1, walkerScale: 1 },
  { id: 'spectator_11', legacyIds: ['spectator_man_01'], displayName: '来場者 11', spectatorAsset: 'spectator-11/spectator-11-viewing-01-smile.png', viewingAssets: ['spectator-11/spectator-11-viewing-01-smile.png'], walkingAssets: ['spectator-11/spectator-11-walking-01-front.png', 'spectator-11/spectator-11-walking-02-right.png', 'spectator-11/spectator-11-walking-03-left.png', 'spectator-11/spectator-11-walking-04-back.png'], rarity: 'rare', useAsWalker: true, useAsSpectator: true, spectatorScale: 1, walkerScale: 1 },
  { id: 'spectator_12', displayName: '来場者 12', spectatorAsset: 'spectator-12/spectator-12-viewing-01-smile.png', viewingAssets: ['spectator-12/spectator-12-viewing-01-smile.png'], walkingAssets: ['spectator-12/spectator-12-walking-01-front.png', 'spectator-12/spectator-12-walking-02-right.png', 'spectator-12/spectator-12-walking-03-left.png', 'spectator-12/spectator-12-walking-04-back.png'], rarity: 'rare', useAsWalker: true, useAsSpectator: true, spectatorScale: 1, walkerScale: 1 },
  { id: 'spectator_101', displayName: '来場者 101', spectatorAsset: 'spectator-101/spectator-101-viewing-01-smile.png', walkingAssets: ['spectator-101/spectator-101-walking-01-front.png', 'spectator-101/spectator-101-walking-02-right.png', 'spectator-101/spectator-101-walking-03-left.png', 'spectator-101/spectator-101-walking-04-back.png'], rarity: 'common', useAsWalker: true, useAsSpectator: true, spectatorScale: 1, walkerScale: 1.08 },
  { id: 'spectator_102', displayName: '来場者 102', spectatorAsset: 'spectator-102/spectator-102-viewing-01-smile.png', walkingAssets: ['spectator-102/spectator-102-walking-01-front.png', 'spectator-102/spectator-102-walking-02-right.png', 'spectator-102/spectator-102-walking-03-left.png', 'spectator-102/spectator-102-walking-04-back.png'], rarity: 'common', useAsWalker: true, useAsSpectator: true, spectatorScale: 1, walkerScale: 1 },
  { id: 'spectator_103', displayName: '来場者 103', spectatorAsset: 'spectator-103/spectator-103-viewing-01-smile.png', walkingAssets: ['spectator-103/spectator-103-walking-01-front.png', 'spectator-103/spectator-103-walking-02-right.png', 'spectator-103/spectator-103-walking-03-left.png', 'spectator-103/spectator-103-walking-04-back.png'], rarity: 'common', useAsWalker: true, useAsSpectator: true, spectatorScale: 1, walkerScale: 1 },
  { id: 'spectator_104', displayName: '来場者 104', spectatorAsset: 'spectator-104/spectator-104-viewing-01-smile.png', walkingAssets: ['spectator-104/spectator-104-walking-01-front.png', 'spectator-104/spectator-104-walking-02-right.png', 'spectator-104/spectator-104-walking-03-left.png', 'spectator-104/spectator-104-walking-04-back.png'], rarity: 'common', useAsWalker: true, useAsSpectator: true, spectatorScale: 1, walkerScale: 1 },
  { id: 'spectator_105', displayName: '来場者 105', spectatorAsset: 'spectator-105/spectator-105-viewing-01-smile.png', walkingAssets: ['spectator-105/spectator-105-walking-01-front.png', 'spectator-105/spectator-105-walking-02-right.png', 'spectator-105/spectator-105-walking-03-left.png', 'spectator-105/spectator-105-walking-04-back.png'], rarity: 'common', useAsWalker: true, useAsSpectator: true, spectatorScale: 1, walkerScale: 1.098 },
  { id: 'spectator_106', displayName: '来場者 106（若いカップル）', spectatorAsset: 'spectator-106/spectator-106-viewing-01-smile.png', viewingAssets: ['spectator-106/spectator-106-viewing-01-smile.png', 'spectator-106/spectator-106-viewing-02-wave.png', 'spectator-106/spectator-106-viewing-03-phone-portrait.png', 'spectator-106/spectator-106-viewing-04-phone-landscape.png', 'spectator-106/spectator-106-viewing-05-clap.png', 'spectator-106/spectator-106-viewing-06-cheer.png', 'spectator-106/spectator-106-viewing-07-banzai.png', 'spectator-106/spectator-106-viewing-08-disappointed.png', 'spectator-106/spectator-106-viewing-09-spare-a.png', 'spectator-106/spectator-106-viewing-10-spare-b.png'], walkingAssets: ['spectator-106/spectator-106-walking-01-front.png', 'spectator-106/spectator-106-walking-02-right.png', 'spectator-106/spectator-106-walking-03-left.png', 'spectator-106/spectator-106-walking-04-back.png'], rarity: 'common', useAsWalker: true, useAsSpectator: true, spectatorScale: 1, walkerScale: 1 },
  { id: 'spectator_107', displayName: '来場者 107（家族）', spectatorAsset: 'spectator-107/spectator-107-viewing-01-smile.png', viewingAssets: ['spectator-107/spectator-107-viewing-01-smile.png'], walkingAssets: ['spectator-107/spectator-107-walking-01-front.png', 'spectator-107/spectator-107-walking-02-right.png', 'spectator-107/spectator-107-walking-03-left.png', 'spectator-107/spectator-107-walking-04-back.png'], rarity: 'common', useAsWalker: true, useAsSpectator: true, spectatorScale: 1, walkerScale: 1 },
] as const;
export const characterProfileById = Object.fromEntries(characterProfiles.map((profile) => [profile.id, profile])) as Record<string, CharacterProfile>;

/** Profiles marked useAsWalker are eligible for corridor walking. */
export const walkerCharacterProfiles = characterProfiles.filter((profile) => profile.useAsWalker);