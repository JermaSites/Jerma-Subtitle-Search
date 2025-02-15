### Subtitles

<!-- Statistics -->

```
Video Count    : 2017
Word Count     : 25,314,725
Duration       : 5396:19:25
Oldest Video   : 2011-06-11
Latest Video   : 2025-02-05
```

Subtitles were obtained using [this Python script](/src/scripts/get_subtitles/get_subtitles.py).
Audio gets downloaded with [yt-dlp](https://github.com/yt-dlp/yt-dlp), which gets transcribed using [WhisperX](https://github.com/m-bain/whisperX) (large-v3 model) and converted to [LRC](https://en.wikipedia.org/wiki/LRC_(file_format)) format  with [ffmpeg](https://github.com/FFmpeg/FFmpeg).

Relevant information gets written to a [JSON file](https://subtitlefiles.jerma.io/file/jerma-subtitles/Subtitles.json), which gets indexed and compressed using [this JS script](/src/scripts/index-subtitles.js).

The Python script also supports downloading YouTube's auto-generated subtitles, and optionally only transcribing videos which don't have auto-generated subtitles available.

<details>
<summary>Read More</summary>

Initially used YouTube's auto-generated subtitles, but far too many videos either didn't have them available or had [censored](https://support.google.com/youtube/thread/70343381/new-default-setting-for-automatic-captions-uses-to-better-avoid-mistakes) swears.

Tried using [OpenAI's Whisper](https://github.com/openai/whisper) next, but after transcribing a bunch of videos with it I realized it kinda sucks in some aspects.
It hallucinated a lot, especially during sections with no speech.
Timestamps were incorrect on some transcriptions, and the first timestamp would always start at zero seconds, which was normally wrong.
It's also pretty slow, especially if you use some of the bigger models.

Switching to WhisperX _mostly_ solved the aforementioned problems.
However, it's still far from perfect and does have some [limitations](https://github.com/m-bain/whisperX/tree/49161922461871e6732fbe1aeb20fc1d4cccc9df?tab=readme-ov-file#limitations-%EF%B8%8F).

</details>

### Webpage

Uses [Mithril](https://github.com/MithrilJS/mithril.js), [MiniSearch](https://github.com/lucaong/minisearch), [lite-youtube-embed](https://github.com/paulirish/lite-youtube-embed) and [fflate](https://github.com/101arrowz/fflate).

<p align='center'>
    <picture>
        <img src='https://i.imgur.com/vs9bU6E.png' alt='screenshot of webpage search results for the query: "GitHub"'>
    </picture>
</p>

#### Running Locally

```bash
# feel free to substitute bun with node & npm/yarn/whatever
git clone https://github.com/Bergbok/Jerma-Subtitle-Search.git
cd Jerma-Subtitle-Search
curl -o src/assets/Subtitles.json https://subtitlefiles.jerma.io/file/jerma-subtitles/Subtitles.json
bun install
bun src/scripts/index-subtitles.js
bun run dev
```

#### Versioning

Given a version number `MAJOR`**.**`MINOR`**.**`PATCH`, increment the:

- `MAJOR` version when JS framework or searching library changes
- `MINOR` version whenever it feels right idk
- `PATCH` version when subtitles are added/edited

<p align='center'>
    <picture>
        <img src='https://i.imgur.com/O8rbink.png' alt='jermaHeart Twitch Emote' width='56' height='56' />
    </picture>
</p>

<!--
Notes to self:

Repo setup steps:
- Description: Webpage for searching through 2000+ Jerma videos
- Topics: mithril jerma985 jerma shpee
- Uncheck 'Releases' and 'Packages'
- https://github.com/Bergbok/Jerma-Subtitle-Search/settings
    - Social preview (https://imgur.com/a/4QB2a7B)
    - Disable Wiki and Projects
- https://github.com/Bergbok/Jerma-Subtitle-Search/settings/pages
    - Build source
    - Custom domain
- https://github.com/Bergbok/Jerma-Subtitle-Search/settings/actions
    - Artifact and log retention
    - Write permissions
- https://github.com/Bergbok/Jerma-Subtitle-Search/settings/actions/runners
    - Self-hosted runner
- https://github.com/Bergbok/Jerma-Subtitle-Search/settings/security_analysis
    - Dependabot
- https://github.com/Bergbok/Jerma-Subtitle-Search/settings/secrets/actions
    - COOKIES
    - B2_APP_KEY
    - B2_APP_KEY_ID

AVIF conversion:
- ffmpeg -i "x" -map 0 -map 0 -filter:0 "format=yuv420p" -filter:1 "format=yuva444p,alphaextract" -crf 21 "x.avif"
-->
