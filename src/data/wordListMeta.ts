export const wordListMeta = {
  "generatedAt": "2026-05-27T17:08:08.427Z",
  "validWordsCount": 5358,
  "answerWordsCount": 1527,
  "rawLineCount": 140026,
  "acceptedLineCount": 10603,
  "rejectedLineCount": 129423,
  "duplicateCount": 5246,
  "targetSizes": {
    "validMin": 2000,
    "validTargetMin": 4000,
    "validTargetMax": 8000,
    "answerMin": 300,
    "answerTargetMin": 800,
    "answerTargetMax": 1500
  },
  "warnings": [
    "gh CLI not found; skipped optional Wordle Turkish source discovery."
  ],
  "sources": [
    {
      "name": "mertemin/turkish-word-list",
      "url": "https://raw.githubusercontent.com/mertemin/turkish-word-list/master/words.txt",
      "localPath": "raw/sources/mertemin-turkish-word-list.txt",
      "fetchedAt": "2026-05-27T13:06:03.827Z",
      "lineCount": 63840,
      "license": "unknown",
      "notes": "license unclear, verify before commercial use"
    },
    {
      "name": "CanNuhlar/Turkce-Kelime-Listesi",
      "url": "https://raw.githubusercontent.com/CanNuhlar/Turkce-Kelime-Listesi/master/turkce_kelime_listesi.txt",
      "localPath": "raw/sources/cannuhlar-turkce-kelime-listesi.txt",
      "fetchedAt": "2026-05-27T13:06:03.827Z",
      "lineCount": 76186,
      "license": "unknown",
      "notes": "license unclear, verify before commercial use"
    }
  ]
} as const;
